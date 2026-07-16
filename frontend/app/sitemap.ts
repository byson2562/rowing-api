import type { MetadataRoute } from "next";

import { availableYears, competitionsByRecency, getFilteredResults } from "../lib/results-data";
import { siteUrl } from "../lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${siteUrl}/rowing-results`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${siteUrl}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${siteUrl}/results`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    }
  ];

  for (const year of availableYears()) {
    entries.push({
      url: `${siteUrl}/results/${year}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    });

    const rows = await getFilteredResults({ year: String(year) });
    competitionsByRecency(rows).forEach((competition) => {
      entries.push({
        url: `${siteUrl}/results/${year}/${encodeURIComponent(competition)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    });
  }

  return entries;
}
