import { NextRequest, NextResponse } from "next/server";
import {
  clearCustomerAuthCookies,
  customerAuthErrorUrl,
  finishCustomerAuthorization,
  getCustomerAuthFailureCode,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

function preventCaching(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const response = preventCaching(
    NextResponse.redirect(new URL("/account", request.url)),
  );

  try {
    const returnUrl = await finishCustomerAuthorization(request, response);
    response.headers.set("Location", returnUrl.toString());
    return preventCaching(response);
  } catch (error) {
    const stage = getCustomerAuthFailureCode(error);

    // Log only the fixed diagnostic code. Never log the callback URL, OAuth
    // code, state, cookies, token response, customer email, or secrets.
    console.error("[customer-auth] callback failed", { stage });
    clearCustomerAuthCookies(response);
    response.headers.set(
      "Location",
      customerAuthErrorUrl(request, "session", stage).toString(),
    );
    return preventCaching(response);
  }
}
