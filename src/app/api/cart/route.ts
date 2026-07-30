import { NextRequest, NextResponse } from "next/server";
import {
  addShopifyCartLines,
  createShopifyCart,
  extractShopifyBuyerIp,
  getShopifyCart,
  isShopifyConfigured,
  removeShopifyCartLines,
  ShopifyCartDataError,
  ShopifyCartUserError,
  updateShopifyCartLines,
  type ShopifyCart,
  type ShopifyCartWarning,
} from "@/lib/shopify";

export const dynamic = "force-dynamic";

const CART_COOKIE = "svgh_shopify_cart";
const CART_MAX_AGE = 30 * 24 * 60 * 60;

type CartAction =
  | {
      action: "add";
      variantId: string;
      quantity: number;
    }
  | {
      action: "update";
      lineId: string;
      quantity: number;
    }
  | {
      action: "remove";
      lineId: string;
    }
  | {
      action: "clear";
    };

function emptyCart() {
  return {
    mode: "shopify" as const,
    lines: [],
    itemCount: 0,
    subtotal: 0,
  };
}

function cartResponse(
  cart: ShopifyCart,
  warnings: readonly ShopifyCartWarning[] = [],
) {
  return {
    mode: "shopify" as const,
    lines: cart.lines,
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    ...(warnings[0]?.message ? { error: warnings[0].message } : {}),
  };
}

function parseAction(value: unknown): CartAction | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("action" in value) ||
    typeof value.action !== "string"
  ) {
    return null;
  }

  if (
    value.action === "add" &&
    "variantId" in value &&
    "quantity" in value &&
    typeof value.variantId === "string" &&
    typeof value.quantity === "number"
  ) {
    return {
      action: "add",
      variantId: value.variantId,
      quantity: value.quantity,
    };
  }

  if (
    value.action === "update" &&
    "lineId" in value &&
    "quantity" in value &&
    typeof value.lineId === "string" &&
    typeof value.quantity === "number"
  ) {
    return {
      action: "update",
      lineId: value.lineId,
      quantity: value.quantity,
    };
  }

  if (
    value.action === "remove" &&
    "lineId" in value &&
    typeof value.lineId === "string"
  ) {
    return { action: "remove", lineId: value.lineId };
  }

  return value.action === "clear" ? { action: "clear" } : null;
}

function buyerIp(request: NextRequest): string | null {
  return (
    extractShopifyBuyerIp(request.headers) ??
    (process.env.NODE_ENV === "development" ? "127.0.0.1" : null)
  );
}

function setCartCookie(response: NextResponse, cartId: string) {
  response.cookies.set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
}

function clearCartCookie(response: NextResponse) {
  response.cookies.set(CART_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function unavailableResponse(message: string, status = 503) {
  return NextResponse.json(
    {
      mode: "shopify",
      lines: [],
      itemCount: 0,
      subtotal: 0,
      error: message,
    },
    { status },
  );
}

export async function GET(request: NextRequest) {
  if (!isShopifyConfigured()) {
    return unavailableResponse("Shopify cart is not configured.");
  }

  const requestBuyerIp = buyerIp(request);

  if (!requestBuyerIp) {
    return unavailableResponse("The cart request could not be verified.", 400);
  }

  const cartId = request.cookies.get(CART_COOKIE)?.value;

  if (!cartId) {
    return NextResponse.json(emptyCart());
  }

  try {
    const cart = await getShopifyCart(cartId, { buyerIp: requestBuyerIp });

    if (cart) {
      return NextResponse.json(cartResponse(cart));
    }

    const response = NextResponse.json(emptyCart());
    clearCartCookie(response);
    return response;
  } catch (error) {
    if (error instanceof ShopifyCartDataError) {
      const response = NextResponse.json(emptyCart());
      clearCartCookie(response);
      return response;
    }

    return unavailableResponse(
      "Your Shopify bag could not be loaded. Please try again.",
      502,
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isShopifyConfigured()) {
    return unavailableResponse("Shopify cart is not configured.");
  }

  const requestBuyerIp = buyerIp(request);

  if (!requestBuyerIp) {
    return unavailableResponse("The cart request could not be verified.", 400);
  }

  const action = parseAction(await request.json().catch(() => null));

  if (!action) {
    return unavailableResponse("The cart update is invalid.", 400);
  }

  const context = { buyerIp: requestBuyerIp };
  const cartId = request.cookies.get(CART_COOKIE)?.value;

  try {
    const currentCart = cartId
      ? await getShopifyCart(cartId, context)
      : null;
    let result;

    if (action.action === "add") {
      result = currentCart
        ? await addShopifyCartLines(
            currentCart.id,
            [{ variantId: action.variantId, quantity: action.quantity }],
            context,
          )
        : await createShopifyCart(
            [{ variantId: action.variantId, quantity: action.quantity }],
            context,
          );
    } else {
      if (!currentCart) {
        const response = NextResponse.json(emptyCart());
        clearCartCookie(response);
        return response;
      }

      if (
        action.action !== "clear" &&
        !currentCart.lines.some((line) => line.lineId === action.lineId)
      ) {
        return unavailableResponse("That cart line no longer exists.", 409);
      }

      if (action.action === "update") {
        result = await updateShopifyCartLines(
          currentCart.id,
          [{ lineId: action.lineId, quantity: action.quantity }],
          context,
        );
      } else {
        const lineIds =
          action.action === "remove"
            ? [action.lineId]
            : currentCart.lines.map((line) => line.lineId);

        if (lineIds.length === 0) {
          return NextResponse.json(cartResponse(currentCart));
        }

        result = await removeShopifyCartLines(
          currentCart.id,
          lineIds,
          context,
        );
      }
    }

    const response = NextResponse.json(
      cartResponse(result.cart, result.warnings),
    );
    setCartCookie(response, result.cart.id);
    return response;
  } catch (error) {
    if (
      error instanceof ShopifyCartDataError ||
      error instanceof ShopifyCartUserError
    ) {
      return unavailableResponse(error.message, 400);
    }

    return unavailableResponse(
      "Shopify could not update your bag. Please try again.",
      502,
    );
  }
}
