import type { MetadataRoute } from "next";

import {
  availableYears,
  competitionsByRecency,
  getFilteredResults,
  listAthletes,
  listEventNames,
  listOrganizations,
  organizationSlug
} from "../lib/results-data";
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
    },
    {
      url: `${siteUrl}/records`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${siteUrl}/organizations`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${siteUrl}/athletes`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    }
  ];

  (await listAthletes()).forEach((name) => {
    entries.push({
      url: `${siteUrl}/athletes/${encodeURIComponent(name)}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    });
  });

  (await listEventNames()).forEach((event) => {
    entries.push({
      url: `${siteUrl}/records/${encodeURIComponent(event)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    });
  });

  (await listOrganizations()).forEach((organization) => {
    entries.push({
      url: `${siteUrl}/organizations/${encodeURIComponent(organizationSlug(organization))}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6
    });
  });

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

    const seen = new Set<string>();
    rows.forEach((row) => {
      const key = `${row.competition_name}|${row.event_name}`;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({
        url: `${siteUrl}/results/${year}/${encodeURIComponent(row.competition_name)}/${encodeURIComponent(row.event_name)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5
      });
    });
  }

  return entries;
}
