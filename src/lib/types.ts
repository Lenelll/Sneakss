export const EU_SIZE_SCALE = [
  36,
  36.5,
  37,
  37.5,
  38,
  38.5,
  39,
  39.5,
  40,
  40.5,
  41,
  41.5,
  42,
  42.5,
  43,
  43.5,
  44,
  44.5,
  45,
  45.5,
  46,
  46.5,
  47,
] as const;

export type EuSize = (typeof EU_SIZE_SCALE)[number];

export const PRODUCT_CATEGORIES = [
  "Lifestyle",
  "Running",
  "Basketball",
  "Skate",
  "Trail",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductStatus = "active" | "draft" | "archived";
export type ProductCurrency = "GHS";

export interface ProductImage {
  readonly id: string;
  readonly src: `/images/products/${string}`;
  readonly alt: string;
}

export interface ProductColor {
  readonly name: string;
  readonly hex: `#${string}`;
}

export interface ProductVariant {
  readonly id: string;
  readonly sku: string;
  readonly size: EuSize;
  readonly sizeLabel: `EU ${EuSize}`;
  readonly price: number;
  readonly inventoryQuantity: number;
  readonly availableForSale: boolean;
}

export interface Product {
  readonly id: string;
  readonly handle: string;
  readonly title: string;
  readonly brand: string;
  readonly colorway: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly colors: readonly ProductColor[];
  readonly tags: readonly string[];
  readonly currency: ProductCurrency;
  readonly price: number;
  readonly images: readonly ProductImage[];
  readonly variants: readonly ProductVariant[];
  readonly status: ProductStatus;
  readonly isFeatured: boolean;
  readonly isNewArrival: boolean;
  readonly isDemo: true;
  readonly publishedAt: string;
}

export type ProductSort =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export type AvailabilityFilter = "all" | "in-stock" | "sold-out";

export interface ProductFilters {
  readonly query?: string;
  readonly categories?: readonly ProductCategory[];
  readonly brands?: readonly string[];
  readonly colors?: readonly string[];
  readonly sizes?: readonly EuSize[];
  readonly availability?: AvailabilityFilter;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly sort?: ProductSort;
}
