import type { MetadataRoute } from "next";

import {
  availableYears,
  competitionsByRecency,
  getFilteredResults,
  listAthletes,
  listRecordEventNames,
  listOrganizations,
  organizationSlug
} from "../lib/results-data";
import { articles } from "../lib/articles";
import { siteUrl } from "../lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // データは年単位の粒度しか持たないため、lastModifiedは
  // 「最終掲載年の年末（過年度）」または「現在時刻（最新年度=更新中）」で近似する
  const latestDataYear = Math.max(...availableYears());
  const dateForYear = (year: number): Date =>
    year >= latestDataYear ? now : new Date(`${year}-12-31T00:00:00+09:00`);

  const allRows = await getFilteredResults({});
  const buildLatestYearMap = (pick: (row: (typeof allRows)[number]) => string): Map<string, number> => {
    const map = new Map<string, number>();
    allRows.forEach((row) => {
      const key = pick(row);
      const current = map.get(key);
      if (current == null || row.year > current) map.set(key, row.year);
    });
    return map;
  };
  const organizationLatestYear = buildLatestYearMap((row) => row.organization);
  const eventLatestYear = buildLatestYearMap((row) => row.event_name);
  const athleteLatestYear = buildLatestYearMap((row) => row.crew_name);
  const dateForEntity = (map: Map<string, number>, key: string): Date => {
    const year = map.get(key);
    return year == null ? now : dateForYear(year);
  };
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${siteUrl}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${siteUrl}/sponsor`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
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

  articles.forEach((article) => {
    entries.push({
      url: `${siteUrl}/articles/${article.slug}`,
      lastModified: new Date(`${article.updatedAt ?? article.publishedAt}T00:00:00+09:00`),
      changeFrequency: "monthly",
      priority: 0.7
    });
  });

  (await listAthletes()).forEach((name) => {
    entries.push({
      url: `${siteUrl}/athletes/${encodeURIComponent(name)}`,
      lastModified: dateForEntity(athleteLatestYear, name),
      changeFrequency: "monthly",
      priority: 0.5
    });
  });

  (await listRecordEventNames()).forEach((event) => {
    entries.push({
      url: `${siteUrl}/records/${encodeURIComponent(event)}`,
      lastModified: dateForEntity(eventLatestYear, event),
      changeFrequency: "weekly",
      priority: 0.7
    });
  });

  (await listOrganizations()).forEach((organization) => {
    entries.push({
      url: `${siteUrl}/organizations/${encodeURIComponent(organizationSlug(organization))}`,
      lastModified: dateForEntity(organizationLatestYear, organization),
      changeFrequency: "monthly",
      priority: 0.6
    });
  });

  for (const year of availableYears()) {
    entries.push({
      url: `${siteUrl}/results/${year}`,
      lastModified: dateForYear(year),
      changeFrequency: "monthly",
      priority: 0.7
    });

    const rows = await getFilteredResults({ year: String(year) });
    competitionsByRecency(rows).forEach((competition) => {
      entries.push({
        url: `${siteUrl}/results/${year}/${encodeURIComponent(competition)}`,
        lastModified: dateForYear(year),
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
        lastModified: dateForYear(year),
        changeFrequency: "monthly",
        priority: 0.5
      });
    });
  }

  return entries;
}
