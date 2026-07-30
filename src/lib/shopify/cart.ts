import "server-only";

import type {
  Product,
  ProductCurrency,
  ProductVariant,
} from "../types";
import {
  SHOPIFY_PRODUCT_FRAGMENTS,
  mapShopifyProduct,
  type ShopifyMoney,
  type ShopifyProductNode,
} from "./catalog";
import {
  SHOPIFY_COUNTRY_CODE,
  requireShopifyBuyerIp,
  shopifyStorefrontRequest,
} from "./storefront";

export interface ShopifyCartLineInput {
  readonly variantId: string;
  readonly quantity: number;
}

export interface ShopifyCartLineUpdate {
  readonly lineId: string;
  readonly quantity: number;
}

export interface ShopifyBuyerContext {
  readonly buyerIp: string;
}

export interface ShopifyCartBuyerIdentity {
  readonly customerAccessToken?: string;
  readonly email?: string;
  readonly phone?: string;
}

export interface ShopifyCartLine {
  readonly lineId: string;
  readonly productId: string;
  readonly variantId: string;
  readonly quantity: number;
  readonly product: Product;
  readonly variant: ProductVariant;
  readonly lineTotal: number;
}

export interface ShopifyCart {
  readonly id: string;
  readonly checkoutUrl: string;
  readonly lines: readonly ShopifyCartLine[];
  readonly itemCount: number;
  readonly subtotal: number;
  readonly total: number;
  readonly currency: ProductCurrency;
}

export interface ShopifyCartWarning {
  readonly code: string;
  readonly message: string;
  readonly target: string;
}

export interface ShopifyCartMutationResult {
  readonly cart: ShopifyCart;
  readonly warnings: readonly ShopifyCartWarning[];
}

export interface ShopifyCartUserErrorDetail {
  readonly code?: string;
  readonly field: readonly string[];
  readonly message: string;
}

export class ShopifyCartUserError extends Error {
  readonly code = "CART_USER_ERROR" as const;
  readonly action: string;
  readonly userErrors: readonly ShopifyCartUserErrorDetail[];

  constructor(
    action: string,
    userErrors: readonly ShopifyCartUserErrorDetail[],
  ) {
    super(
      userErrors[0]?.message ??
        "Shopify could not complete the cart operation.",
    );
    this.name = "ShopifyCartUserError";
    this.action = action;
    this.userErrors = userErrors;
  }
}

export class ShopifyCartDataError extends Error {
  readonly code:
    | "INVALID_CART"
    | "INVALID_CART_ID"
    | "INVALID_LINE_ID"
    | "INVALID_VARIANT_ID"
    | "INVALID_QUANTITY"
    | "UNSUPPORTED_CURRENCY"
    | "INVALID_BUYER_IDENTITY";

  constructor(code: ShopifyCartDataError["code"], message: string) {
    super(message);
    this.name = "ShopifyCartDataError";
    this.code = code;
  }
}

type ShopifyCartNode = {
  readonly id: string;
  readonly checkoutUrl: string;
  readonly totalQuantity: number;
  readonly cost: {
    readonly subtotalAmount: ShopifyMoney;
    readonly totalAmount: ShopifyMoney;
  };
  readonly lines: {
    readonly nodes: readonly {
      readonly id: string;
      readonly quantity: number;
      readonly cost: {
        readonly totalAmount: ShopifyMoney;
      };
      readonly merchandise: {
        readonly id: string;
        readonly product: ShopifyProductNode;
      };
    }[];
  };
};

type ShopifyCartMutationPayload = {
  readonly cart: ShopifyCartNode | null;
  readonly userErrors: readonly {
    readonly code?: string | null;
    readonly field?: readonly string[] | null;
    readonly message: string;
  }[];
  readonly warnings: readonly {
    readonly code: string;
    readonly message: string;
    readonly target: string;
  }[];
};

const SHOPIFY_CART_FRAGMENT = /* GraphQL */ `
  fragment StorefrontCartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            product {
              ...StorefrontProductFields
            }
          }
        }
      }
    }
  }
`;

const GET_CART_QUERY = /* GraphQL */ `
  query StorefrontCart(
    $cartId: ID!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cart(id: $cartId) {
      ...StorefrontCartFields
    }
  }

  ${SHOPIFY_CART_FRAGMENT}
  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const CREATE_CART_MUTATION = /* GraphQL */ `
  mutation StorefrontCartCreate(
    $input: CartInput!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartCreate(input: $input) {
      cart {
        ...StorefrontCartFields
      }
      userErrors {
        code
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }

  ${SHOPIFY_CART_FRAGMENT}
  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const ADD_CART_LINES_MUTATION = /* GraphQL */ `
  mutation StorefrontCartLinesAdd(
    $cartId: ID!
    $lines: [CartLineInput!]!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...StorefrontCartFields
      }
      userErrors {
        code
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }

  ${SHOPIFY_CART_FRAGMENT}
  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const UPDATE_CART_LINES_MUTATION = /* GraphQL */ `
  mutation StorefrontCartLinesUpdate(
    $cartId: ID!
    $lines: [CartLineUpdateInput!]!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...StorefrontCartFields
      }
      userErrors {
        code
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }

  ${SHOPIFY_CART_FRAGMENT}
  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const REMOVE_CART_LINES_MUTATION = /* GraphQL */ `
  mutation StorefrontCartLinesRemove(
    $cartId: ID!
    $lineIds: [ID!]!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...StorefrontCartFields
      }
      userErrors {
        code
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }

  ${SHOPIFY_CART_FRAGMENT}
  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const UPDATE_CART_BUYER_IDENTITY_MUTATION = /* GraphQL */ `
  mutation StorefrontCartBuyerIdentityUpdate(
    $cartId: ID!
    $buyerIdentity: CartBuyerIdentityInput!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartBuyerIdentityUpdate(
      cartId: $cartId
      buyerIdentity: $buyerIdentity
    ) {
      cart {
        ...StorefrontCartFields
      }
      userErrors {
        code
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }

  ${SHOPIFY_CART_FRAGMENT}
  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const MAX_CART_LINES_PER_MUTATION = 250;
const MAX_LINE_QUANTITY = 10;
const MAX_RESOURCE_ID_LENGTH = 1_024;

function validateResourceId(
  value: string,
  prefix: string,
  code:
    | "INVALID_CART_ID"
    | "INVALID_LINE_ID"
    | "INVALID_VARIANT_ID",
  label: string,
): string {
  const normalized = value.trim();

  if (
    !normalized.startsWith(prefix) ||
    normalized.length > MAX_RESOURCE_ID_LENGTH
  ) {
    throw new ShopifyCartDataError(
      code,
      `${label} is not a valid Shopify resource ID.`,
    );
  }

  return normalized;
}

function validateCartId(cartId: string): string {
  return validateResourceId(
    cartId,
    "gid://shopify/Cart/",
    "INVALID_CART_ID",
    "Cart ID",
  );
}

function validateLineId(lineId: string): string {
  return validateResourceId(
    lineId,
    "gid://shopify/CartLine/",
    "INVALID_LINE_ID",
    "Cart line ID",
  );
}

function validateVariantId(variantId: string): string {
  return validateResourceId(
    variantId,
    "gid://shopify/ProductVariant/",
    "INVALID_VARIANT_ID",
    "Product variant ID",
  );
}

function validateQuantity(quantity: number): number {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_LINE_QUANTITY
  ) {
    throw new ShopifyCartDataError(
      "INVALID_QUANTITY",
      `Cart quantities must be whole numbers between 1 and ${MAX_LINE_QUANTITY}.`,
    );
  }

  return quantity;
}

function validateMutationLength<T>(
  values: readonly T[],
  label: string,
): void {
  if (
    values.length < 1 ||
    values.length > MAX_CART_LINES_PER_MUTATION
  ) {
    throw new ShopifyCartDataError(
      "INVALID_CART",
      `${label} must contain between 1 and ${MAX_CART_LINES_PER_MUTATION} items.`,
    );
  }
}

function parseCartMoney(money: ShopifyMoney): number {
  if (money.currencyCode !== "GHS") {
    throw new ShopifyCartDataError(
      "UNSUPPORTED_CURRENCY",
      "Shopify must return GHS prices for the Ghana storefront market.",
    );
  }

  const amount = Number(money.amount);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new ShopifyCartDataError(
      "INVALID_CART",
      "Shopify returned an invalid cart amount.",
    );
  }

  return amount;
}

function normalizeCart(cart: ShopifyCartNode): ShopifyCart {
  const checkoutUrl = (() => {
    try {
      const url = new URL(cart.checkoutUrl);
      return url.protocol === "https:" ? url.toString() : null;
    } catch {
      return null;
    }
  })();

  if (!cart.id || !checkoutUrl) {
    throw new ShopifyCartDataError(
      "INVALID_CART",
      "Shopify returned an invalid cart.",
    );
  }

  const lines = cart.lines.nodes.map((line): ShopifyCartLine => {
    const product = mapShopifyProduct(line.merchandise.product);
    const variant = product?.variants.find(
      (candidate) => candidate.id === line.merchandise.id,
    );

    if (!product || !variant) {
      throw new ShopifyCartDataError(
        "INVALID_CART",
        "A Shopify cart line does not map to a valid EU size variant.",
      );
    }

    return {
      lineId: line.id,
      productId: product.id,
      variantId: variant.id,
      quantity: line.quantity,
      product,
      variant,
      lineTotal: parseCartMoney(line.cost.totalAmount),
    };
  });

  return {
    id: cart.id,
    checkoutUrl,
    lines,
    itemCount: cart.totalQuantity,
    subtotal: parseCartMoney(cart.cost.subtotalAmount),
    total: parseCartMoney(cart.cost.totalAmount),
    currency: "GHS",
  };
}

function normalizeMutationPayload(
  action: string,
  payload: ShopifyCartMutationPayload,
): ShopifyCartMutationResult {
  const userErrors = payload.userErrors.map((error) => ({
    code: error.code ?? undefined,
    field: error.field ?? [],
    message: error.message,
  }));

  if (userErrors.length > 0) {
    throw new ShopifyCartUserError(action, userErrors);
  }

  if (!payload.cart) {
    throw new ShopifyCartDataError(
      "INVALID_CART",
      "Shopify completed the cart operation without returning a cart.",
    );
  }

  return {
    cart: normalizeCart(payload.cart),
    warnings: payload.warnings.map((warning) => ({
      code: warning.code,
      message: warning.message,
      target: warning.target,
    })),
  };
}

function requireBuyerContext(context: ShopifyBuyerContext): string {
  return requireShopifyBuyerIp(context.buyerIp);
}

export async function getShopifyCart(
  cartId: string,
  context: ShopifyBuyerContext,
): Promise<ShopifyCart | null> {
  const normalizedCartId = validateCartId(cartId);
  const data = await shopifyStorefrontRequest<
    {
      readonly cart: ShopifyCartNode | null;
    },
    {
      cartId: string;
      country: typeof SHOPIFY_COUNTRY_CODE;
    }
  >({
    query: GET_CART_QUERY,
    variables: {
      cartId: normalizedCartId,
      country: SHOPIFY_COUNTRY_CODE,
    },
    buyerIp: requireBuyerContext(context),
    cache: "no-store",
  });

  return data.cart ? normalizeCart(data.cart) : null;
}

export async function createShopifyCart(
  lines: readonly ShopifyCartLineInput[],
  context: ShopifyBuyerContext,
): Promise<ShopifyCartMutationResult> {
  if (lines.length > MAX_CART_LINES_PER_MUTATION) {
    throw new ShopifyCartDataError(
      "INVALID_CART",
      `A cart cannot be created with more than ${MAX_CART_LINES_PER_MUTATION} lines.`,
    );
  }

  const inputLines = lines.map((line) => ({
    merchandiseId: validateVariantId(line.variantId),
    quantity: validateQuantity(line.quantity),
  }));
  const data = await shopifyStorefrontRequest<
    {
      readonly cartCreate: ShopifyCartMutationPayload;
    },
    {
      input: {
        lines: readonly {
          merchandiseId: string;
          quantity: number;
        }[];
        buyerIdentity: {
          countryCode: typeof SHOPIFY_COUNTRY_CODE;
        };
      };
      country: typeof SHOPIFY_COUNTRY_CODE;
    }
  >({
    query: CREATE_CART_MUTATION,
    variables: {
      input: {
        lines: inputLines,
        buyerIdentity: {
          countryCode: SHOPIFY_COUNTRY_CODE,
        },
      },
      country: SHOPIFY_COUNTRY_CODE,
    },
    buyerIp: requireBuyerContext(context),
    cache: "no-store",
  });

  return normalizeMutationPayload("cartCreate", data.cartCreate);
}

export async function addShopifyCartLines(
  cartId: string,
  lines: readonly ShopifyCartLineInput[],
  context: ShopifyBuyerContext,
): Promise<ShopifyCartMutationResult> {
  validateMutationLength(lines, "Cart lines");
  const normalizedCartId = validateCartId(cartId);
  const inputLines = lines.map((line) => ({
    merchandiseId: validateVariantId(line.variantId),
    quantity: validateQuantity(line.quantity),
  }));
  const data = await shopifyStorefrontRequest<
    {
      readonly cartLinesAdd: ShopifyCartMutationPayload;
    },
    {
      cartId: string;
      lines: readonly {
        merchandiseId: string;
        quantity: number;
      }[];
      country: typeof SHOPIFY_COUNTRY_CODE;
    }
  >({
    query: ADD_CART_LINES_MUTATION,
    variables: {
      cartId: normalizedCartId,
      lines: inputLines,
      country: SHOPIFY_COUNTRY_CODE,
    },
    buyerIp: requireBuyerContext(context),
    cache: "no-store",
  });

  return normalizeMutationPayload("cartLinesAdd", data.cartLinesAdd);
}

export async function updateShopifyCartLines(
  cartId: string,
  lines: readonly ShopifyCartLineUpdate[],
  context: ShopifyBuyerContext,
): Promise<ShopifyCartMutationResult> {
  validateMutationLength(lines, "Cart line updates");
  const normalizedCartId = validateCartId(cartId);
  const inputLines = lines.map((line) => ({
    id: validateLineId(line.lineId),
    quantity: validateQuantity(line.quantity),
  }));
  const data = await shopifyStorefrontRequest<
    {
      readonly cartLinesUpdate: ShopifyCartMutationPayload;
    },
    {
      cartId: string;
      lines: readonly {
        id: string;
        quantity: number;
      }[];
      country: typeof SHOPIFY_COUNTRY_CODE;
    }
  >({
    query: UPDATE_CART_LINES_MUTATION,
    variables: {
      cartId: normalizedCartId,
      lines: inputLines,
      country: SHOPIFY_COUNTRY_CODE,
    },
    buyerIp: requireBuyerContext(context),
    cache: "no-store",
  });

  return normalizeMutationPayload(
    "cartLinesUpdate",
    data.cartLinesUpdate,
  );
}

export async function removeShopifyCartLines(
  cartId: string,
  lineIds: readonly string[],
  context: ShopifyBuyerContext,
): Promise<ShopifyCartMutationResult> {
  validateMutationLength(lineIds, "Cart line IDs");
  const normalizedCartId = validateCartId(cartId);
  const normalizedLineIds = lineIds.map(validateLineId);
  const data = await shopifyStorefrontRequest<
    {
      readonly cartLinesRemove: ShopifyCartMutationPayload;
    },
    {
      cartId: string;
      lineIds: readonly string[];
      country: typeof SHOPIFY_COUNTRY_CODE;
    }
  >({
    query: REMOVE_CART_LINES_MUTATION,
    variables: {
      cartId: normalizedCartId,
      lineIds: normalizedLineIds,
      country: SHOPIFY_COUNTRY_CODE,
    },
    buyerIp: requireBuyerContext(context),
    cache: "no-store",
  });

  return normalizeMutationPayload(
    "cartLinesRemove",
    data.cartLinesRemove,
  );
}

function normalizeBuyerIdentity(
  identity: ShopifyCartBuyerIdentity,
): {
  countryCode: typeof SHOPIFY_COUNTRY_CODE;
  customerAccessToken?: string;
  email?: string;
  phone?: string;
} {
  const customerAccessToken = identity.customerAccessToken?.trim();
  const email = identity.email?.trim();
  const phone = identity.phone?.trim();

  if (
    (customerAccessToken && customerAccessToken.length > 4_096) ||
    (email && (email.length > 320 || !email.includes("@"))) ||
    (phone && phone.length > 64)
  ) {
    throw new ShopifyCartDataError(
      "INVALID_BUYER_IDENTITY",
      "The cart buyer identity is invalid.",
    );
  }

  return {
    countryCode: SHOPIFY_COUNTRY_CODE,
    ...(customerAccessToken ? { customerAccessToken } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

export async function updateShopifyCartBuyerIdentity(
  cartId: string,
  identity: ShopifyCartBuyerIdentity,
  context: ShopifyBuyerContext,
): Promise<ShopifyCartMutationResult> {
  const normalizedCartId = validateCartId(cartId);
  const data = await shopifyStorefrontRequest<
    {
      readonly cartBuyerIdentityUpdate: ShopifyCartMutationPayload;
    },
    {
      cartId: string;
      buyerIdentity: ReturnType<typeof normalizeBuyerIdentity>;
      country: typeof SHOPIFY_COUNTRY_CODE;
    }
  >({
    query: UPDATE_CART_BUYER_IDENTITY_MUTATION,
    variables: {
      cartId: normalizedCartId,
      buyerIdentity: normalizeBuyerIdentity(identity),
      country: SHOPIFY_COUNTRY_CODE,
    },
    buyerIp: requireBuyerContext(context),
    cache: "no-store",
  });

  return normalizeMutationPayload(
    "cartBuyerIdentityUpdate",
    data.cartBuyerIdentityUpdate,
  );
}
