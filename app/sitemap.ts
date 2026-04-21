import type { MetadataRoute } from "next";

import { getPublicJobsCatalog } from "@/lib/api";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/jobs`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    const { data: catalog } = await getPublicJobsCatalog({
      limit: 1000,
      sort: "desc",
    });

    const jobRoutes: MetadataRoute.Sitemap = catalog.items.map((job) => ({
      url: `${siteUrl}/jobs/${job.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...jobRoutes];
  } catch {
    return staticRoutes;
  }
}
