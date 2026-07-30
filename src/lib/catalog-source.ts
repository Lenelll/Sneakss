import "server-only";

import { products as demoProducts } from "./products";
import {
  getShopifyProductByHandle,
  getShopifyProducts,
  isShopifyConfigured,
} from "./shopify";
import type { Product } from "./types";

export type CatalogSource = "shopify" | "demo";

export type CommerceCatalog = {
  products: Product[];
  source: CatalogSource;
  notice?: string;
};

const DEMO_NOTICE =
  "Temporary products are shown while the official Shopify catalogue is prepared.";

export async function getCommerceCatalog(): Promise<CommerceCatalog> {
  if (!isShopifyConfigured()) {
    return {
      products: [...demoProducts],
      source: "demo",
      notice: DEMO_NOTICE,
    };
  }

  try {
    const products = await getShopifyProducts({ limit: 100 });

    if (products.length > 0) {
      return { products, source: "shopify" };
    }

    return {
      products: [...demoProducts],
      source: "demo",
      notice:
        "No Headless products are published yet, so the temporary catalogue remains visible.",
    };
  } catch {
    return {
      products: [...demoProducts],
      source: "demo",
      notice:
        "The live catalogue is temporarily unavailable. Demo products are shown and cannot be checked out.",
    };
  }
}

export async function getCommerceProduct(
  handle: string,
): Promise<{ product: Product | null; source: CatalogSource }> {
  if (isShopifyConfigured()) {
    try {
      const product = await getShopifyProductByHandle(handle);

      if (product) {
        return { product, source: "shopify" };
      }
    } catch {
      // Fall through so development/demo handles remain available.
    }
  }

  return {
    product:
      demoProducts.find((candidate) => candidate.handle === handle) ?? null,
    source: "demo",
  };
}
