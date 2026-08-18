import { NextRequest, NextResponse } from "next/server";
import {
  extractShopifyBuyerIp,
  getShopifyCart,
  isShopifyConfigured,
} from "@/lib/shopify";
import {
  isCustomerAuthConfigured,
  isTrustedCustomerAuthPost,
  resolveCustomerSession,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

const CART_COOKIE = "svgh_shopify_cart";
const CHECKOUT_RETURN_PATH = "/checkout?resume=1";
const CHECKOUT_ACCOUNT_SIGNIN_ROUTE = "/account/sign-in";

function localUrl(request: NextRequest, path: string) {
  return new URL(path, request.nextUrl.origin);
}

function redirect(request: NextRequest, path: string) {
  return NextResponse.redirect(localUrl(request, path), 303);
}

function getBuyerIp(request: NextRequest) {
  return (
    extractShopifyBuyerIp(request.headers) ??
    (process.env.NODE_ENV === "development" ? "127.0.0.1" : null)
  );
}

function trustedCheckoutUrl(value: string): URL | null {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!isShopifyConfigured() || !isCustomerAuthConfigured()) {
    return redirect(request, "/checkout?checkout=configuration");
  }

  if (!isTrustedCustomerAuthPost(request)) {
    return new NextResponse("The checkout request could not be verified.", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const session = await resolveCustomerSession(request);

  if (!session) {
    const signInUrl = new URL(CHECKOUT_ACCOUNT_SIGNIN_ROUTE, request.nextUrl.origin);
    signInUrl.searchParams.set("returnTo", CHECKOUT_RETURN_PATH);
    return NextResponse.redirect(signInUrl, 303);
  }

  const authenticatedSession = session;

  async function withSession(response: NextResponse) {
    await authenticatedSession.commit(response);
    return response;
  }

  const cartId = request.cookies.get(CART_COOKIE)?.value;
  const buyerIp = getBuyerIp(request);

  if (!cartId) {
    return withSession(redirect(request, "/checkout?checkout=empty"));
  }

  if (!buyerIp) {
    return withSession(
      redirect(request, "/checkout?checkout=verification"),
    );
  }

  try {
    const currentCart = await getShopifyCart(cartId, { buyerIp });

    if (!currentCart || currentCart.lines.length === 0) {
      return withSession(redirect(request, "/checkout?checkout=empty"));
    }

    const checkoutUrl = trustedCheckoutUrl(currentCart.checkoutUrl);

    if (!checkoutUrl) {
      return withSession(redirect(request, "/checkout?checkout=invalid"));
    }

    // Shopify supports silent Customer Accounts SSO as an alternative to
    // mutating the cart with a customer access token. The customer has already
    // authenticated in this app, and Shopify verifies its own account session
    // when the hosted checkout opens.
    checkoutUrl.searchParams.set("sso", "silent");

    const response = NextResponse.redirect(checkoutUrl, 303);
    return withSession(response);
  } catch {
    return withSession(
      redirect(request, "/checkout?checkout=unavailable"),
    );
  }
}
