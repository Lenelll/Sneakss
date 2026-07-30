import { NextRequest, NextResponse } from "next/server";
import {
  beginCustomerAuthorization,
  customerAuthErrorUrl,
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
    const authorizationUrl = await beginCustomerAuthorization(
      request,
      response,
    );
    response.headers.set("Location", authorizationUrl.toString());
    return preventCaching(response);
  } catch {
    return preventCaching(
      NextResponse.redirect(customerAuthErrorUrl(request, "configuration")),
    );
  }
}
