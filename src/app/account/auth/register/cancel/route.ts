import { NextRequest, NextResponse } from "next/server";
import { readSmallUrlEncodedForm } from "@/lib/http/read-small-form";
import {
  clearCustomerAuthTransaction,
  clearPendingCustomerRegistration,
  isTrustedCustomerAuthPost,
  safeCustomerReturnTo,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

function preventCaching(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isTrustedCustomerAuthPost(request)) {
    return preventCaching(
      new NextResponse("The account request could not be verified.", {
        status: 403,
      }),
    );
  }

  let returnTo = "/account";

  const formData = await readSmallUrlEncodedForm(request);

  if (formData) {
    returnTo = safeCustomerReturnTo(
      formData.get("returnTo"),
    );
  }

  const url = new URL("/account/sign-up", request.nextUrl.origin);
  url.searchParams.set("status", "cancelled");
  url.searchParams.set("returnTo", returnTo);
  const response = preventCaching(NextResponse.redirect(url, 303));
  clearCustomerAuthTransaction(response);
  clearPendingCustomerRegistration(response);
  return response;
}
