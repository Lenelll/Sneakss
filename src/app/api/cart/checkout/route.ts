import { NextRequest, NextResponse } from "next/server";
import {
  extractShopifyBuyerIp,
  getShopifyCart,
  isShopifyConfigured,
  updateShopifyCartBuyerIdentity,
} from "@/lib/shopify";
import {
  isCustomerAuthConfigured,
  resolveCustomerSession,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

const CART_COOKIE = "svgh_shopify_cart";

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

  const session = await resolveCustomerSession(request);

  if (!session) {
    return redirect(
      request,
      "/account/auth/login?returnTo=/checkout%3Fresume%3D1",
    );
  }

  const authenticatedSession = session;

  async function withSession(response: NextResponse) {
    await authenticatedSession.commit(response);
    return response;
  }

  const cartId = request.cookies.get(CART_COOKIE)?.value;
  const buyerIp = getBuyerIp(request);

  if (!cartId) {
    return withSession(redirect(request, "/cart?checkout=empty"));
  }

  if (!buyerIp) {
    return withSession(
      redirect(request, "/checkout?checkout=verification"),
    );
  }

  try {
    const currentCart = await getShopifyCart(cartId, { buyerIp });

    if (!currentCart || currentCart.lines.length === 0) {
      return withSession(redirect(request, "/cart?checkout=empty"));
    }

    const { cart } = await updateShopifyCartBuyerIdentity(
      currentCart.id,
      { customerAccessToken: authenticatedSession.accessToken },
      { buyerIp },
    );
    const checkoutUrl = trustedCheckoutUrl(cart.checkoutUrl);

    if (!checkoutUrl) {
      return withSession(redirect(request, "/checkout?checkout=invalid"));
    }

    const response = NextResponse.redirect(checkoutUrl, 303);
    return withSession(response);
  } catch {
    return withSession(
      redirect(request, "/checkout?checkout=unavailable"),
    );
  }
}
