import { NextResponse } from "next/server";

import { getReviewPhoto, isValidReviewId } from "@/lib/reviews/store";

export const dynamic = "force-dynamic";

type PhotoRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: PhotoRouteProps) {
  const { id } = await params;

  if (!isValidReviewId(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const photo = await getReviewPhoto(id);

  if (!photo) {
    return new NextResponse(null, { status: 404 });
  }

  const body = new Uint8Array(photo.bytes);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
