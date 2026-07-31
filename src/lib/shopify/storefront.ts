import "server-only";

export const SHOPIFY_STOREFRONT_API_VERSION = "2026-07" as const;
export const SHOPIFY_COUNTRY_CODE = "GH" as const;

export type ShopifyConfigurationIssueCode =
  | "MISSING_STORE_DOMAIN"
  | "INVALID_STORE_DOMAIN"
  | "MISSING_PRIVATE_TOKEN"
  | "INVALID_PRIVATE_TOKEN"
  | "UNSUPPORTED_API_VERSION";

export interface ShopifyConfigurationIssue {
  readonly code: ShopifyConfigurationIssueCode;
  readonly message: string;
}

export type ShopifyConfigurationStatus =
  | {
      readonly configured: true;
      readonly apiVersion: typeof SHOPIFY_STOREFRONT_API_VERSION;
      readonly issues: readonly [];
    }
  | {
      readonly configured: false;
      readonly apiVersion: typeof SHOPIFY_STOREFRONT_API_VERSION;
      readonly issues: readonly ShopifyConfigurationIssue[];
    };

type ShopifyConfiguration = {
  readonly domain: string;
  readonly privateToken: string;
  readonly apiVersion: typeof SHOPIFY_STOREFRONT_API_VERSION;
};

export type ShopifyGraphQLErrorDetail = {
  readonly message: string;
  readonly path?: readonly (string | number)[];
  readonly code?: string;
};

export type ShopifyStorefrontErrorCode =
  | "CONFIGURATION_ERROR"
  | "INVALID_BUYER_IP"
  | "NETWORK_ERROR"
  | "HTTP_ERROR"
  | "INVALID_RESPONSE"
  | "GRAPHQL_ERROR";

export class ShopifyStorefrontError extends Error {
  readonly code: ShopifyStorefrontErrorCode;
  readonly status?: number;
  readonly graphQLErrors: readonly ShopifyGraphQLErrorDetail[];

  constructor(
    code: ShopifyStorefrontErrorCode,
    message: string,
    options: {
      status?: number;
      graphQLErrors?: readonly ShopifyGraphQLErrorDetail[];
    } = {},
  ) {
    super(message);
    this.name = "ShopifyStorefrontError";
    this.code = code;
    this.status = options.status;
    this.graphQLErrors = options.graphQLErrors ?? [];
  }
}

export interface ShopifyStorefrontRequestOptions<
  Variables extends Record<string, unknown>,
> {
  readonly query: string;
  readonly variables?: Variables;
  readonly buyerIp?: string;
  readonly cache?: RequestCache;
  readonly revalidate?: number | false;
  readonly tags?: readonly string[];
  readonly signal?: AbortSignal;
}

type ShopifyGraphQLResponse<Data> = {
  readonly data?: Data;
  readonly errors?: readonly {
    readonly message?: unknown;
    readonly path?: unknown;
    readonly extensions?: {
      readonly code?: unknown;
    };
  }[];
};

type ShopifyFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

const SHOP_DOMAIN_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/;
const BUYER_IP_PATTERN = /^[0-9A-Fa-f:.]+$/;
const MAX_BUYER_IP_LENGTH = 64;
const MIN_PRIVATE_TOKEN_LENGTH = 20;
const MAX_PRIVATE_TOKEN_LENGTH = 512;

function isPlausiblePrivateToken(value: string): boolean {
  return (
    value.length >= MIN_PRIVATE_TOKEN_LENGTH &&
    value.length <= MAX_PRIVATE_TOKEN_LENGTH &&
    !/\s/.test(value) &&
    value !== "replace_with_server_only_token"
  );
}

function readConfiguration(): {
  readonly configuration?: ShopifyConfiguration;
  readonly issues: readonly ShopifyConfigurationIssue[];
} {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim().toLowerCase() ?? "";
  const privateToken =
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim() ?? "";
  const apiVersion =
    process.env.SHOPIFY_API_VERSION?.trim() ||
    SHOPIFY_STOREFRONT_API_VERSION;
  const issues: ShopifyConfigurationIssue[] = [];

  if (!domain) {
    issues.push({
      code: "MISSING_STORE_DOMAIN",
      message:
        "SHOPIFY_STORE_DOMAIN is required and must contain the permanent myshopify.com hostname.",
    });
  } else if (!SHOP_DOMAIN_PATTERN.test(domain)) {
    issues.push({
      code: "INVALID_STORE_DOMAIN",
      message:
        "SHOPIFY_STORE_DOMAIN must be a hostname such as store-name.myshopify.com, without a scheme or path.",
    });
  }

  if (!privateToken) {
    issues.push({
      code: "MISSING_PRIVATE_TOKEN",
      message: "SHOPIFY_STOREFRONT_PRIVATE_TOKEN is required.",
    });
  } else if (!isPlausiblePrivateToken(privateToken)) {
    issues.push({
      code: "INVALID_PRIVATE_TOKEN",
      message:
        "SHOPIFY_STOREFRONT_PRIVATE_TOKEN must be copied from the Headless channel's Private access token field.",
    });
  }

  if (apiVersion !== SHOPIFY_STOREFRONT_API_VERSION) {
    issues.push({
      code: "UNSUPPORTED_API_VERSION",
      message: `This storefront integration requires Shopify API ${SHOPIFY_STOREFRONT_API_VERSION}.`,
    });
  }

  if (issues.length > 0) {
    return { issues };
  }

  return {
    configuration: {
      domain,
      privateToken,
      apiVersion: SHOPIFY_STOREFRONT_API_VERSION,
    },
    issues,
  };
}

export function getShopifyConfigurationStatus(): ShopifyConfigurationStatus {
  const { configuration, issues } = readConfiguration();

  if (!configuration) {
    return {
      configured: false,
      apiVersion: SHOPIFY_STOREFRONT_API_VERSION,
      issues,
    };
  }

  return {
    configured: true,
    apiVersion: SHOPIFY_STOREFRONT_API_VERSION,
    issues: [],
  };
}

export function isShopifyConfigured(): boolean {
  return getShopifyConfigurationStatus().configured;
}

function requireConfiguration(): ShopifyConfiguration {
  const { configuration, issues } = readConfiguration();

  if (configuration) {
    return configuration;
  }

  throw new ShopifyStorefrontError(
    "CONFIGURATION_ERROR",
    issues[0]?.message ?? "Shopify Storefront API is not configured.",
  );
}

function normalizeBuyerIp(candidate: string | null | undefined): string | null {
  if (!candidate) {
    return null;
  }

  const value = candidate.split(",", 1)[0]?.trim() ?? "";

  if (
    !value ||
    value.length > MAX_BUYER_IP_LENGTH ||
    !BUYER_IP_PATTERN.test(value)
  ) {
    return null;
  }

  return value;
}

/**
 * Extracts a proxy-provided buyer IP without trusting arbitrary header content.
 * Cloudflare's header is preferred because Sites runs at the Cloudflare edge.
 */
export function extractShopifyBuyerIp(headers: {
  get(name: string): string | null;
}): string | null {
  return (
    normalizeBuyerIp(headers.get("cf-connecting-ip")) ??
    normalizeBuyerIp(headers.get("x-real-ip")) ??
    normalizeBuyerIp(headers.get("x-forwarded-for"))
  );
}

export function requireShopifyBuyerIp(
  candidate: string | null | undefined,
): string {
  const buyerIp = normalizeBuyerIp(candidate);

  if (!buyerIp) {
    throw new ShopifyStorefrontError(
      "INVALID_BUYER_IP",
      "A valid buyer IP is required for buyer-triggered Storefront API requests.",
    );
  }

  return buyerIp;
}

function normalizeGraphQLErrors(
  errors: ShopifyGraphQLResponse<unknown>["errors"],
): readonly ShopifyGraphQLErrorDetail[] {
  if (!errors) {
    return [];
  }

  return errors.map((error) => ({
    message:
      typeof error.message === "string"
        ? error.message
        : "Shopify returned an unspecified GraphQL error.",
    path: Array.isArray(error.path)
      ? error.path.filter(
          (segment): segment is string | number =>
            typeof segment === "string" || typeof segment === "number",
        )
      : undefined,
    code:
      typeof error.extensions?.code === "string"
        ? error.extensions.code
        : undefined,
  }));
}

export async function shopifyStorefrontRequest<
  Data,
  Variables extends Record<string, unknown> = Record<string, never>,
>({
  query,
  variables,
  buyerIp,
  cache = "no-store",
  revalidate,
  tags,
  signal,
}: ShopifyStorefrontRequestOptions<Variables>): Promise<Data> {
  const configuration = requireConfiguration();
  const normalizedBuyerIp =
    buyerIp === undefined ? undefined : requireShopifyBuyerIp(buyerIp);
  const headers = new Headers({
    "Content-Type": "application/json",
    "Shopify-Storefront-Private-Token": configuration.privateToken,
  });

  if (normalizedBuyerIp) {
    headers.set("Shopify-Storefront-Buyer-IP", normalizedBuyerIp);
  }

  const init: ShopifyFetchInit = {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables: variables ?? {},
    }),
    cache,
    signal,
  };

  if (revalidate !== undefined || (tags && tags.length > 0)) {
    init.next = {
      revalidate,
      tags: tags ? [...tags] : undefined,
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `https://${configuration.domain}/api/${configuration.apiVersion}/graphql.json`,
      init,
    );
  } catch {
    throw new ShopifyStorefrontError(
      "NETWORK_ERROR",
      "The Shopify Storefront API could not be reached.",
    );
  }

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "Shopify rejected the Storefront API credentials or access scopes."
        : "Shopify returned an unsuccessful Storefront API response.";

    throw new ShopifyStorefrontError("HTTP_ERROR", message, {
      status: response.status,
    });
  }

  let payload: ShopifyGraphQLResponse<Data>;

  try {
    payload = (await response.json()) as ShopifyGraphQLResponse<Data>;
  } catch {
    throw new ShopifyStorefrontError(
      "INVALID_RESPONSE",
      "Shopify returned a response that could not be read.",
      { status: response.status },
    );
  }

  const graphQLErrors = normalizeGraphQLErrors(payload.errors);

  if (graphQLErrors.length > 0) {
    throw new ShopifyStorefrontError(
      "GRAPHQL_ERROR",
      graphQLErrors[0]?.message ?? "Shopify returned a GraphQL error.",
      {
        status: response.status,
        graphQLErrors,
      },
    );
  }

  if (payload.data === undefined) {
    throw new ShopifyStorefrontError(
      "INVALID_RESPONSE",
      "Shopify returned a response without data.",
      { status: response.status },
    );
  }

  return payload.data;
}
