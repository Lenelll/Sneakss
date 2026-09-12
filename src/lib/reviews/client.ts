/**
 * Browser-side helpers for the review form. Kept free of server imports so
 * they can be bundled into client components.
 */

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_EDGE = 1400;
const TARGET_BYTES = 350_000;

export interface PreparedPhoto {
  readonly id: string;
  readonly file: File;
  readonly previewUrl: string;
  readonly width: number;
  readonly height: number;
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to the <img> decoder.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The image could not be read."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}

/**
 * Resizes and re-encodes a photo as JPEG so uploads stay small. Falls back
 * to the original file if the browser cannot decode it.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    throw new Error("Photos must be JPG, PNG or WebP images.");
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    const source = await decodeImage(file);
    const sourceWidth = source.width;
    const sourceHeight = source.height;
    const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas unavailable");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);

    if ("close" in source) {
      source.close();
    }

    let blob: Blob | null = null;

    for (const quality of [0.84, 0.74, 0.64, 0.54]) {
      blob = await canvasToBlob(canvas, quality);

      if (blob && blob.size <= TARGET_BYTES) {
        break;
      }
    }

    if (!blob) {
      throw new Error("Encoding failed");
    }

    const optimized = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + ".jpg",
      { type: "image/jpeg" },
    );

    return {
      id,
      file: optimized,
      previewUrl: URL.createObjectURL(optimized),
      width,
      height,
    };
  } catch {
    return {
      id,
      file,
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
    };
  }
}

export function formatReviewDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
