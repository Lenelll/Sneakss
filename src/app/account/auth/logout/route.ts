import { NextRequest, NextResponse } from "next/server";
import {
  beginCustomerLogout,
  clearCustomerAuthCookies,
  customerAuthErrorUrl,
  isTrustedCustomerAuthPost,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

function preventCaching(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

async function logout(request: NextRequest) {
  if (!isTrustedCustomerAuthPost(request)) {
    return preventCaching(
      new NextResponse("The sign-out request could not be verified.", {
        status: 403,
      }),
    );
  }

  const response = preventCaching(
    NextResponse.redirect(new URL("/account", request.url), 303),
  );

  try {
    const logoutUrl = await beginCustomerLogout(request, response);
    response.headers.set("Location", logoutUrl.toString());
    return preventCaching(response);
  } catch {
    clearCustomerAuthCookies(response);
    response.headers.set(
      "Location",
      customerAuthErrorUrl(request, "provider").toString(),
    );
    return preventCaching(response);
  }
}

export const POST = logout;
