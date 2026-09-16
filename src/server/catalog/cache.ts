import { unstable_cache } from "next/cache";
import { getFeaturedProducts, getPublishedLines, getPublishedProducts } from "./repository";

export const CATALOG_TAG = "catalog";
export const lineTag = (slug: string) => `line:${slug}`;
export const productTag = (slug: string) => `product:${slug}`;

export const getCachedPublishedLines = unstable_cache(getPublishedLines, ["published-lines"], { tags: [CATALOG_TAG], revalidate: 3600 });
export const getCachedPublishedProducts = unstable_cache(getPublishedProducts, ["published-products"], { tags: [CATALOG_TAG], revalidate: 3600 });
export const getCachedFeaturedProducts = unstable_cache(getFeaturedProducts, ["featured-products"], { tags: [CATALOG_TAG], revalidate: 3600 });
