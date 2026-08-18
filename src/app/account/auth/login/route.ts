import { NextRequest, NextResponse } from "next/server";
import { readSmallUrlEncodedForm } from "@/lib/http/read-small-form";
import {
  beginCustomerAuthorization,
  CustomerAuthConfigurationError,
  customerEmailsMatch,
  isTrustedCustomerAuthPost,
  normalizeCustomerEmail,
  readPendingCustomerRegistration,
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
    "/",
  );
  const url = new URL("/account/sign-in", request.nextUrl.origin);
  url.searchParams.set("returnTo", returnTo);
  return preventCaching(NextResponse.redirect(url, 303));
}

function signInStatusUrl(
  request: NextRequest,
  status: "configuration" | "email-mismatch" | "invalid" | "unavailable",
  returnTo: string,
): URL {
  const url = new URL("/account/sign-in", request.nextUrl.origin);
  url.searchParams.set("status", status);
  url.searchParams.set("returnTo", returnTo);
  return url;
}

export async function POST(request: NextRequest) {
  if (!isTrustedCustomerAuthPost(request)) {
    return preventCaching(
      new NextResponse("The sign-in request could not be verified.", {
        status: 403,
      }),
    );
  }

  const formData = await readSmallUrlEncodedForm(request);

  if (!formData) {
    return preventCaching(
      NextResponse.redirect(
        signInStatusUrl(request, "invalid", "/"),
        303,
      ),
    );
  }

  const email = normalizeCustomerEmail(formData.get("email"));
  let returnTo = safeCustomerReturnTo(
    formData.get("returnTo"),
    "/",
  );

  if (!email) {
    return preventCaching(
      NextResponse.redirect(
        signInStatusUrl(request, "invalid", returnTo),
        303,
      ),
    );
  }

  const pendingRegistration = await readPendingCustomerRegistration(request);

  if (
    pendingRegistration &&
    !customerEmailsMatch(pendingRegistration.email, email)
  ) {
    return preventCaching(
      NextResponse.redirect(
        signInStatusUrl(
          request,
          "email-mismatch",
          pendingRegistration.returnTo,
        ),
        303,
      ),
    );
  }

  if (pendingRegistration) {
    returnTo = pendingRegistration.returnTo;
  }

  const response = preventCaching(
    NextResponse.redirect(new URL("/account", request.nextUrl.origin), 303),
  );

  try {
    const authorizationUrl = await beginCustomerAuthorization(
      response,
      {
        email,
        returnTo,
        registration: pendingRegistration ?? undefined,
      },
    );
    response.headers.set("Location", authorizationUrl.toString());
    return preventCaching(response);
  } catch (error) {
    return preventCaching(
      NextResponse.redirect(
        signInStatusUrl(
          request,
          error instanceof CustomerAuthConfigurationError
            ? "configuration"
            : "unavailable",
          returnTo,
        ),
        303,
      ),
    );
  }
}
