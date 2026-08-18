import { NextRequest, NextResponse } from "next/server";
import { readSmallUrlEncodedForm } from "@/lib/http/read-small-form";
import {
  getCustomerAccessTokenFromRequest,
  isTrustedCustomerAuthPost,
  normalizeCustomerName,
  safeCustomerReturnTo,
  customerAccountFetch,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

type CustomerProfile = {
  customer: {
    firstName: string | null;
    lastName: string | null;
  } | null;
};

type CustomerProfileUpdateResponse = {
  customerUpdate: {
    customer: {
      firstName: string | null;
      lastName: string | null;
    } | null;
    userErrors: readonly {
      field: readonly string[] | null;
      message: string;
    }[];
  } | null;
};

function preventCaching(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function preferencesStatusUrl(
  request: NextRequest,
  status: "invalid" | "updated" | "unavailable" | "unchanged" | "empty",
): URL {
  const url = new URL("/account", request.nextUrl.origin);
  url.searchParams.set("prefs", status);
  return url;
}

export async function POST(request: NextRequest) {
  if (!isTrustedCustomerAuthPost(request)) {
    return preventCaching(
      new NextResponse("The preferences request could not be verified.", {
        status: 403,
      }),
    );
  }

  const formData = await readSmallUrlEncodedForm(request);

  if (!formData) {
    return preventCaching(
      NextResponse.redirect(
        preferencesStatusUrl(request, "invalid"),
        303,
      ),
    );
  }

  const returnTo = safeCustomerReturnTo(formData.get("returnTo"), "/account");
  const session = await getCustomerAccessTokenFromRequest(request);

  if (!session) {
    const signInUrl = new URL("/account/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("status", "session-expired");
    signInUrl.searchParams.set("returnTo", returnTo);
    return preventCaching(NextResponse.redirect(signInUrl, 303));
  }

  const firstName = normalizeCustomerName(formData.get("firstName"));
  const lastName = normalizeCustomerName(formData.get("lastName"));

  if (!firstName && !lastName) {
    return preventCaching(
      NextResponse.redirect(
        preferencesStatusUrl(request, "empty"),
        303,
      ),
    );
  }

  try {
    const currentProfile = await customerAccountFetch<CustomerProfile>(
      session.accessToken,
      `query CustomerProfileSummary {
        customer {
          firstName
          lastName
        }
      }`,
    );

    const currentFirstName = normalizeCustomerName(
      currentProfile.customer?.firstName,
    );
    const currentLastName = normalizeCustomerName(currentProfile.customer?.lastName);
    const hasChangedFirst = firstName && firstName !== currentFirstName;
    const hasChangedLast = lastName && lastName !== currentLastName;

    if (!hasChangedFirst && !hasChangedLast) {
      return preventCaching(
        NextResponse.redirect(
          preferencesStatusUrl(request, "unchanged"),
          303,
        ),
      );
    }

    const response = await customerAccountFetch<CustomerProfileUpdateResponse>(
      session.accessToken,
      `mutation CustomerProfileUpdate($input: CustomerUpdateInput!) {
        customerUpdate(input: $input) {
          customer {
            firstName
            lastName
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        input: {
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        },
      },
    );

    if (
      !response.customerUpdate ||
      response.customerUpdate.userErrors.length > 0
    ) {
      return preventCaching(
        NextResponse.redirect(
          preferencesStatusUrl(request, "unavailable"),
          303,
        ),
      );
    }

    return preventCaching(
      NextResponse.redirect(
        preferencesStatusUrl(request, "updated"),
        303,
      ),
    );
  } catch {
    return preventCaching(
      NextResponse.redirect(
        preferencesStatusUrl(request, "unavailable"),
        303,
      ),
    );
  }
}
