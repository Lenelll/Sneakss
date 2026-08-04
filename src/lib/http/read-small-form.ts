import "server-only";

const textDecoder = new TextDecoder("utf-8", { fatal: true });

export async function readSmallUrlEncodedForm(
  request: Request,
  maxBytes = 8_192,
): Promise<URLSearchParams | null> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const declaredLength = Number.parseInt(
    request.headers.get("content-length") ?? "0",
    10,
  );

  if (
    !contentType.startsWith("application/x-www-form-urlencoded") ||
    (Number.isFinite(declaredLength) && declaredLength > maxBytes)
  ) {
    return null;
  }

  if (!request.body) {
    return new URLSearchParams();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }

      chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new URLSearchParams(textDecoder.decode(body));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
