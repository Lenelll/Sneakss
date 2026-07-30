import { products } from "./products";
import type {
  EuSize,
  Product,
  ProductFilters,
  ProductSort,
} from "./types";

function isInStock(product: Product): boolean {
  return product.variants.some((variant) => variant.availableForSale);
}

function sortProducts(
  catalog: readonly Product[],
  sort: ProductSort,
): Product[] {
  return [...catalog].sort((a, b) => {
    switch (sort) {
      case "newest":
        return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.title.localeCompare(b.title);
      case "featured":
      default:
        return (
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
        );
    }
  });
}

export function getProductByHandle(
  handle: string,
  catalog: readonly Product[] = products,
): Product | undefined {
  return catalog.find((product) => product.handle === handle);
}

export function getProductById(
  id: string,
  catalog: readonly Product[] = products,
): Product | undefined {
  return catalog.find((product) => product.id === id);
}

export function getFeaturedProducts(
  limit = 4,
  catalog: readonly Product[] = products,
): Product[] {
  return catalog
    .filter((product) => product.status === "active" && product.isFeatured)
    .slice(0, Math.max(0, limit));
}

export function getNewArrivals(
  limit = 8,
  catalog: readonly Product[] = products,
): Product[] {
  return [...catalog]
    .filter((product) => product.status === "active" && product.isNewArrival)
    .sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    )
    .slice(0, Math.max(0, limit));
}

export function getAvailableSizes(product: Product): EuSize[] {
  return product.variants
    .filter((variant) => variant.availableForSale)
    .map((variant) => variant.size);
}

export function getTotalInventory(product: Product): number {
  return product.variants.reduce(
    (total, variant) => total + Math.max(0, variant.inventoryQuantity),
    0,
  );
}

export function filterProducts(
  filters: ProductFilters = {},
  catalog: readonly Product[] = products,
): Product[] {
  const query = filters.query?.trim().toLocaleLowerCase();
  const selectedBrands = filters.brands?.map((brand) =>
    brand.toLocaleLowerCase(),
  );
  const selectedColors = filters.colors?.map((color) =>
    color.toLocaleLowerCase(),
  );

  const matches = catalog.filter((product) => {
    if (product.status !== "active") {
      return false;
    }

    if (query) {
      const searchText = [
        product.title,
        product.brand,
        product.colorway,
        product.description,
        product.category,
        ...product.tags,
        ...product.colors.map((color) => color.name),
      ]
        .join(" ")
        .toLocaleLowerCase();

      if (!searchText.includes(query)) {
        return false;
      }
    }

    if (
      filters.categories?.length &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    if (
      selectedBrands?.length &&
      !selectedBrands.includes(product.brand.toLocaleLowerCase())
    ) {
      return false;
    }

    if (
      selectedColors?.length &&
      !product.colors.some((color) =>
        selectedColors.includes(color.name.toLocaleLowerCase()),
      )
    ) {
      return false;
    }

    if (
      filters.sizes?.length &&
      !product.variants.some(
        (variant) =>
          variant.availableForSale && filters.sizes?.includes(variant.size),
      )
    ) {
      return false;
    }

    if (filters.availability === "in-stock" && !isInStock(product)) {
      return false;
    }

    if (filters.availability === "sold-out" && isInStock(product)) {
      return false;
    }

    if (
      typeof filters.minPrice === "number" &&
      product.price < filters.minPrice
    ) {
      return false;
    }

    if (
      typeof filters.maxPrice === "number" &&
      product.price > filters.maxPrice
    ) {
      return false;
    }

    return true;
  });

  return sortProducts(matches, filters.sort ?? "featured");
}

export function getRelatedProducts(
  product: Product,
  limit = 4,
  catalog: readonly Product[] = products,
): Product[] {
  return catalog
    .filter(
      (candidate) =>
        candidate.status === "active" &&
        candidate.id !== product.id &&
        (candidate.category === product.category ||
          candidate.brand === product.brand),
    )
    .sort((a, b) => {
      const aBrandMatch = Number(a.brand === product.brand);
      const bBrandMatch = Number(b.brand === product.brand);
      return (
        bBrandMatch - aBrandMatch ||
        Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      );
    })
    .slice(0, Math.max(0, limit));
}
