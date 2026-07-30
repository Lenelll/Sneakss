import type { MetadataRoute } from "next";
import { getCommerceCatalog } from "@/lib/catalog-source";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCommerceCatalog();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/policies/shipping",
    "/policies/returns",
    "/policies/privacy",
    "/policies/terms",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "/shop" ? ("daily" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/shop" ? 0.9 : 0.6,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.handle}`,
      lastModified: new Date(product.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
