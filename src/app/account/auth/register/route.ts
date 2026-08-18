import { NextRequest, NextResponse } from "next/server";
import { readSmallUrlEncodedForm } from "@/lib/http/read-small-form";
import {
  createPendingCustomerRegistration,
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

function statusUrl(
  request: NextRequest,
  pathname: "/account/sign-in" | "/account/sign-up",
  status: "invalid" | "ready" | "unavailable",
  returnTo: string,
): URL {
  const url = new URL(pathname, request.nextUrl.origin);
  url.searchParams.set("status", status);
  url.searchParams.set("returnTo", returnTo);
  return url;
}

export async function POST(request: NextRequest) {
  if (!isTrustedCustomerAuthPost(request)) {
    return preventCaching(
      new NextResponse("The account request could not be verified.", {
        status: 403,
      }),
    );
  }

  const formData = await readSmallUrlEncodedForm(request);

  if (!formData) {
    return preventCaching(
      NextResponse.redirect(
        statusUrl(request, "/account/sign-up", "invalid", "/"),
        303,
      ),
    );
  }

  const returnTo = safeCustomerReturnTo(
    formData.get("returnTo"),
  );
  const response = preventCaching(
    NextResponse.redirect(
      statusUrl(request, "/account/sign-in", "ready", returnTo),
      303,
    ),
  );

  try {
    const registration = await createPendingCustomerRegistration(response, {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      returnTo,
    });

    if (!registration) {
      return preventCaching(
        NextResponse.redirect(
          statusUrl(request, "/account/sign-up", "invalid", returnTo),
          303,
        ),
      );
    }

    return response;
  } catch {
    return preventCaching(
      NextResponse.redirect(
        statusUrl(request, "/account/sign-up", "unavailable", returnTo),
        303,
      ),
    );
  }
}
