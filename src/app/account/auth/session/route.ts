import { NextRequest, NextResponse } from "next/server";
import {
  clearCustomerSessionCookies,
  resolveCustomerSession,
  safeCustomerReturnTo,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

function preventCaching(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const returnTo = safeCustomerReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
  );
  const session = await resolveCustomerSession(request);

  if (!session) {
    const signInUrl = new URL("/account/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("status", "session-expired");
    signInUrl.searchParams.set("returnTo", returnTo);
    const response = preventCaching(NextResponse.redirect(signInUrl, 303));
    clearCustomerSessionCookies(response);
    return response;
  }

  const response = preventCaching(
    NextResponse.redirect(
      new URL(returnTo, request.nextUrl.origin),
      303,
    ),
  );
  await session.commit(response);
  return response;
}
