import "server-only";

import {
  EU_SIZE_SCALE,
  PRODUCT_CATEGORIES,
  type EuSize,
  type Product,
  type ProductCategory,
  type ProductColor,
  type ProductImage,
  type ProductVariant,
} from "../types";
import {
  SHOPIFY_COUNTRY_CODE,
  shopifyStorefrontRequest,
} from "./storefront";

export type ShopifyMoney = {
  readonly amount: string;
  readonly currencyCode: string;
};

export type ShopifyProductVariantNode = {
  readonly id: string;
  readonly title: string;
  readonly availableForSale: boolean;
  readonly quantityAvailable: number | null;
  readonly sku: string | null;
  readonly selectedOptions: readonly {
    readonly name: string;
    readonly value: string;
  }[];
  readonly price: ShopifyMoney;
};

export type ShopifyProductNode = {
  readonly id: string;
  readonly handle: string;
  readonly title: string;
  readonly description: string;
  readonly vendor: string;
  readonly productType: string;
  readonly tags: readonly string[];
  readonly publishedAt: string | null;
  readonly images: {
    readonly nodes: readonly {
      readonly id: string;
      readonly url: string;
      readonly altText: string | null;
    }[];
  };
  readonly variants: {
    readonly nodes: readonly ShopifyProductVariantNode[];
  };
};

export class ShopifyCatalogDataError extends Error {
  readonly code:
    | "INVALID_MONEY"
    | "UNSUPPORTED_CURRENCY"
    | "INVALID_PRODUCT";

  constructor(
    code: ShopifyCatalogDataError["code"],
    message: string,
  ) {
    super(message);
    this.name = "ShopifyCatalogDataError";
    this.code = code;
  }
}

export interface GetShopifyProductsOptions {
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

export interface GetShopifyProductOptions {
  readonly signal?: AbortSignal;
}

type ShopifyProductsQueryData = {
  readonly products: {
    readonly nodes: readonly ShopifyProductNode[];
    readonly pageInfo: {
      readonly hasNextPage: boolean;
      readonly endCursor: string | null;
    };
  };
};

export const SHOPIFY_PRODUCT_FRAGMENTS = /* GraphQL */ `
  fragment StorefrontProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    sku
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
  }

  fragment StorefrontProductFields on Product {
    id
    handle
    title
    description
    vendor
    productType
    tags
    publishedAt
    images(first: 12) {
      nodes {
        id
        url
        altText
      }
    }
    variants(first: 100) {
      nodes {
        ...StorefrontProductVariantFields
      }
    }
  }
`;

const PRODUCTS_QUERY = /* GraphQL */ `
  query StorefrontProducts(
    $first: Int!
    $after: String
    $country: CountryCode!
  ) @inContext(country: $country) {
    products(
      first: $first
      after: $after
      sortKey: CREATED_AT
      reverse: true
    ) {
      nodes {
        ...StorefrontProductFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }

  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query StorefrontProductByHandle(
    $handle: String!
    $country: CountryCode!
  ) @inContext(country: $country) {
    product(handle: $handle) {
      ...StorefrontProductFields
    }
  }

  ${SHOPIFY_PRODUCT_FRAGMENTS}
`;

const PRODUCT_HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,253}[a-z0-9])?$/;
const MAX_CATALOG_PRODUCTS = 250;
const DEFAULT_CATALOG_PRODUCTS = 100;
const CATALOG_PAGE_SIZE = 100;
const CATALOG_REVALIDATE_SECONDS = 300;
const FALLBACK_PRODUCT_IMAGE = "/images/products/demo-court-bone.png";

const KNOWN_COLOR_HEX: Readonly<Record<string, `#${string}`>> = {
  black: "#151515",
  white: "#F7F7F5",
  cream: "#EADFC6",
  sail: "#ECE5D6",
  bone: "#E7E1D5",
  grey: "#7A7F84",
  gray: "#7A7F84",
  silver: "#AEB5BB",
  red: "#A92828",
  orange: "#E76728",
  yellow: "#E2C63A",
  green: "#275B3D",
  blue: "#265A82",
  navy: "#1E2D49",
  purple: "#654A88",
  violet: "#654A88",
  pink: "#D07B97",
  brown: "#76523B",
  tan: "#B7976C",
  beige: "#CBBB9F",
  gum: "#B37A42",
};

function normalizeCatalogLimit(candidate: number | undefined): number {
  if (candidate === undefined || !Number.isFinite(candidate)) {
    return DEFAULT_CATALOG_PRODUCTS;
  }

  return Math.min(
    MAX_CATALOG_PRODUCTS,
    Math.max(1, Math.trunc(candidate)),
  );
}

function parseMoney(money: ShopifyMoney): number {
  if (money.currencyCode !== "GHS") {
    throw new ShopifyCatalogDataError(
      "UNSUPPORTED_CURRENCY",
      "Shopify must return GHS prices for the Ghana storefront market.",
    );
  }

  const amount = Number(money.amount);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new ShopifyCatalogDataError(
      "INVALID_MONEY",
      "Shopify returned an invalid product price.",
    );
  }

  return amount;
}

function parseEuSize(value: string): EuSize | null {
  const match = value.replace(",", ".").match(/\b(\d{2}(?:\.5)?)\b/);

  if (!match) {
    return null;
  }

  const size = Number(match[1]);

  return EU_SIZE_SCALE.includes(size as EuSize) ? (size as EuSize) : null;
}

function getVariantSize(variant: ShopifyProductVariantNode): EuSize | null {
  const sizeOption = variant.selectedOptions.find((option) =>
    /^(?:eu\s*)?(?:shoe\s*)?size$/i.test(option.name.trim()),
  );

  return parseEuSize(sizeOption?.value ?? variant.title);
}

function mapVariant(
  variant: ShopifyProductVariantNode,
): ProductVariant | null {
  const size = getVariantSize(variant);

  if (size === null) {
    return null;
  }

  const inventoryQuantity =
    typeof variant.quantityAvailable === "number"
      ? Math.max(0, Math.trunc(variant.quantityAvailable))
      : variant.availableForSale
        ? 1
        : 0;

  return {
    id: variant.id,
    sku:
      variant.sku?.trim() ||
      `SHOPIFY-${variant.id.split("/").at(-1) ?? "VARIANT"}`,
    size,
    sizeLabel: `EU ${size}`,
    price: parseMoney(variant.price),
    inventoryQuantity,
    availableForSale: variant.availableForSale,
  };
}

function normalizeTags(tags: readonly string[]): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
  );
}

function inferCategory(
  productType: string,
  tags: readonly string[],
): ProductCategory {
  const candidates = [productType, ...tags].map((value) =>
    value.trim().toLowerCase(),
  );
  const exactCategory = PRODUCT_CATEGORIES.find((category) =>
    candidates.includes(category.toLowerCase()),
  );

  if (exactCategory) {
    return exactCategory;
  }

  const searchable = candidates.join(" ");

  if (/basketball|court|hoop/.test(searchable)) {
    return "Basketball";
  }

  if (/running|runner|training/.test(searchable)) {
    return "Running";
  }

  if (/skate|skateboard/.test(searchable)) {
    return "Skate";
  }

  if (/trail|hiking|outdoor/.test(searchable)) {
    return "Trail";
  }

  return "Lifestyle";
}

function getColorNames(product: ShopifyProductNode): string[] {
  const optionColors = product.variants.nodes.flatMap((variant) =>
    variant.selectedOptions
      .filter((option) => /colou?r/i.test(option.name))
      .map((option) => option.value.trim())
      .filter(
        (value) =>
          value.length > 0 && value.toLowerCase() !== "default title",
      ),
  );
  const colorwayTag = product.tags.find((tag) =>
    /^colorway\s*:/i.test(tag),
  );
  const taggedColors =
    colorwayTag
      ?.replace(/^colorway\s*:/i, "")
      .split(/[+/,&]/)
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return Array.from(new Set([...optionColors, ...taggedColors]));
}

function deterministicColorHex(name: string): `#${string}` {
  const knownColor = Object.entries(KNOWN_COLOR_HEX).find(([keyword]) =>
    name.toLowerCase().includes(keyword),
  );

  if (knownColor) {
    return knownColor[1];
  }

  let hash = 0x811c9dc5;

  for (const character of name) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }

  const red = 64 + ((hash >>> 16) & 0x7f);
  const green = 64 + ((hash >>> 8) & 0x7f);
  const blue = 64 + (hash & 0x7f);

  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mapColors(colorNames: readonly string[]): ProductColor[] {
  return colorNames.map((name) => ({
    name,
    hex: deterministicColorHex(name),
  }));
}

function mapImages(product: ShopifyProductNode): ProductImage[] {
  const images = product.images.nodes
    .filter((image) => /^https:\/\//i.test(image.url))
    .map((image) => ({
      id: image.id,
      src: image.url,
      alt: image.altText?.trim() || `${product.title} product photo`,
    }));

  if (images.length > 0) {
    return images;
  }

  return [
    {
      id: `${product.id}-placeholder`,
      src: FALLBACK_PRODUCT_IMAGE,
      alt: `${product.title} product photography coming soon`,
    },
  ];
}

/**
 * Maps Storefront API product data into the storefront's domain Product type.
 * Products without a valid EU size variant are omitted from the live catalog.
 */
export function mapShopifyProduct(
  product: ShopifyProductNode,
): Product | null {
  const variants = product.variants.nodes.flatMap((variant) => {
    const mapped = mapVariant(variant);
    return mapped ? [mapped] : [];
  });

  if (
    !product.id ||
    !product.handle ||
    !product.title.trim() ||
    variants.length === 0
  ) {
    return null;
  }

  const tags = normalizeTags(product.tags);
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const colorNames = getColorNames(product);
  const price = Math.min(...variants.map((variant) => variant.price));

  if (!Number.isFinite(price)) {
    throw new ShopifyCatalogDataError(
      "INVALID_PRODUCT",
      "Shopify returned a product without a valid GHS price.",
    );
  }

  return {
    id: product.id,
    handle: product.handle,
    title: product.title.trim(),
    brand: product.vendor.trim() || "Sneaker Vault GH",
    colorway: colorNames.join(" / ") || "Colour not specified",
    description: product.description.trim(),
    category: inferCategory(product.productType, tags),
    colors: mapColors(colorNames),
    tags,
    currency: "GHS",
    price,
    images: mapImages(product),
    variants,
    status: "active",
    isFeatured: normalizedTags.some((tag) =>
      ["featured", "home-featured"].includes(tag),
    ),
    isNewArrival: normalizedTags.some((tag) =>
      ["new", "new-arrival", "new arrival"].includes(tag),
    ),
    isDemo: false,
    publishedAt: product.publishedAt ?? new Date(0).toISOString(),
  };
}

export async function getShopifyProducts({
  limit: requestedLimit,
  signal,
}: GetShopifyProductsOptions = {}): Promise<Product[]> {
  const limit = normalizeCatalogLimit(requestedLimit);
  const productNodes: ShopifyProductNode[] = [];
  let after: string | null = null;

  while (productNodes.length < limit) {
    const first = Math.min(CATALOG_PAGE_SIZE, limit - productNodes.length);
    const data: ShopifyProductsQueryData =
      await shopifyStorefrontRequest<
        ShopifyProductsQueryData,
        {
          first: number;
          after: string | null;
          country: typeof SHOPIFY_COUNTRY_CODE;
        }
      >({
        query: PRODUCTS_QUERY,
        variables: {
          first,
          after,
          country: SHOPIFY_COUNTRY_CODE,
        },
        cache: "force-cache",
        revalidate: CATALOG_REVALIDATE_SECONDS,
        tags: ["shopify-products"],
        signal,
      });

    productNodes.push(...data.products.nodes);

    if (
      !data.products.pageInfo.hasNextPage ||
      !data.products.pageInfo.endCursor
    ) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return productNodes.flatMap((product) => {
    const mapped = mapShopifyProduct(product);
    return mapped ? [mapped] : [];
  });
}

export async function getShopifyProductByHandle(
  handle: string,
  { signal }: GetShopifyProductOptions = {},
): Promise<Product | null> {
  const normalizedHandle = handle.trim().toLowerCase();

  if (!PRODUCT_HANDLE_PATTERN.test(normalizedHandle)) {
    return null;
  }

  const data = await shopifyStorefrontRequest<
    {
      readonly product: ShopifyProductNode | null;
    },
    {
      handle: string;
      country: typeof SHOPIFY_COUNTRY_CODE;
    }
  >({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: {
      handle: normalizedHandle,
      country: SHOPIFY_COUNTRY_CODE,
    },
    cache: "force-cache",
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [
      "shopify-products",
      `shopify-product-${normalizedHandle}`,
    ],
    signal,
  });

  return data.product ? mapShopifyProduct(data.product) : null;
}
