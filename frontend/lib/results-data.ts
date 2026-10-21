// 大会結果データの読み込みと、読み込みを伴う集計。
//
// 絞り込み・並べ替え・集計そのものは results-core.ts(純粋関数)にあり、ここから再エクスポートする。
// 年ごとの JSON は動的 import で読むため、サーバー(ビルド時)でもブラウザ(検索ページ)でも
// 同じローダーが使える。ブラウザでは Next が年ごとのチャンクに分割して配る。

import resultsIndex from "../data/results/index.json";
import {
  COMPETITION_CATEGORY_RULES,
  buildFilterOptions,
  competitionSeriesKey,
  computeStats,
  filterResults,
  filtersKey,
  isAthleteRecord,
  isRecordEvent,
  normalizeRecord,
  organizationSlug,
  uniqueSorted,
  type FiltersResponse,
  type QueryFilters,
  type ResultRecord,
  type StatPoint
} from "./results-core";

/** 大会名から収録カテゴリ(COMPETITION_CATEGORY_RULES の label)を引く。該当なしは null(lib/schedule.ts が使う) */
export { competitionCategoryFor as competitionCategoryOf } from "./results-core";

export * from "./results-core";

type ResultsIndex = { years: number[]; total_count: number };
type CacheEntry<T> = { expiresAt: number; value: T };
export type DatasetSummary = {
  totalCount: number;
  minYear: number | null;
  maxYear: number | null;
  competitionCategoryCount: number;
};

const RESULTS_INDEX = resultsIndex as ResultsIndex;
const AVAILABLE_YEARS = RESULTS_INDEX.years;
const YEAR_SET = new Set(AVAILABLE_YEARS);
const yearCache = new Map<number, Promise<ResultRecord[]>>();
let allResultsCache: Promise<ResultRecord[]> | null = null;
const QUERY_CACHE_TTL_MS = 30_000;
const QUERY_CACHE_MAX = 200;
const filteredResultsCache = new Map<string, CacheEntry<ResultRecord[]>>();
const filtersResponseCache = new Map<string, CacheEntry<FiltersResponse>>();
const statsCache = new Map<string, CacheEntry<StatPoint[]>>();

export function availableYears(): number[] {
  return [...AVAILABLE_YEARS].sort((a, b) => b - a);
}

export function getDatasetSummary(): DatasetSummary {
  const years = [...AVAILABLE_YEARS];
  const minYear = years.length > 0 ? Math.min(...years) : null;
  const maxYear = years.length > 0 ? Math.max(...years) : null;
  return {
    totalCount: RESULTS_INDEX.total_count ?? 0,
    minYear,
    maxYear,
    competitionCategoryCount: COMPETITION_CATEGORY_RULES.length,
  };
}

function cacheGet<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const now = Date.now();
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): T {
  if (cache.size >= QUERY_CACHE_MAX) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + QUERY_CACHE_TTL_MS });
  return value;
}

export function parseYear(value?: string): number | null {
  if (!value) return null;
  const year = Number(value);
  if (!Number.isInteger(year) || !YEAR_SET.has(year)) return null;
  return year;
}

// 年を定数で書くのはバンドラに分割点を静的に教えるため(テンプレート文字列の import は全年を1チャンクにまとめる)
async function importYear(year: number): Promise<ResultRecord[]> {
  switch (year) {
    case 2009:
      return (await import("../data/results/2009.json")).default as ResultRecord[];
    case 2010:
      return (await import("../data/results/2010.json")).default as ResultRecord[];
    case 2011:
      return (await import("../data/results/2011.json")).default as ResultRecord[];
    case 2012:
      return (await import("../data/results/2012.json")).default as ResultRecord[];
    case 2013:
      return (await import("../data/results/2013.json")).default as ResultRecord[];
    case 2014:
      return (await import("../data/results/2014.json")).default as ResultRecord[];
    case 2015:
      return (await import("../data/results/2015.json")).default as ResultRecord[];
    case 2016:
      return (await import("../data/results/2016.json")).default as ResultRecord[];
    case 2017:
      return (await import("../data/results/2017.json")).default as ResultRecord[];
    case 2018:
      return (await import("../data/results/2018.json")).default as ResultRecord[];
    case 2019:
      return (await import("../data/results/2019.json")).default as ResultRecord[];
    case 2020:
      return (await import("../data/results/2020.json")).default as ResultRecord[];
    case 2021:
      return (await import("../data/results/2021.json")).default as ResultRecord[];
    case 2022:
      return (await import("../data/results/2022.json")).default as ResultRecord[];
    case 2023:
      return (await import("../data/results/2023.json")).default as ResultRecord[];
    case 2024:
      return (await import("../data/results/2024.json")).default as ResultRecord[];
    case 2025:
      return (await import("../data/results/2025.json")).default as ResultRecord[];
    case 2026:
      return (await import("../data/results/2026.json")).default as ResultRecord[];
    default:
      return [];
  }
}

function loadYearResults(year: number): Promise<ResultRecord[]> {
  const cached = yearCache.get(year);
  if (cached) return cached;
  const loading = importYear(year).then((rows) => rows.map(normalizeRecord));
  yearCache.set(year, loading);
  return loading;
}

export async function allResults(filters?: QueryFilters): Promise<ResultRecord[]> {
  const year = parseYear(filters?.year);
  if (year) {
    return loadYearResults(year);
  }

  if (allResultsCache) return allResultsCache;

  allResultsCache = Promise.all(AVAILABLE_YEARS.map((y) => loadYearResults(y))).then((chunks) => chunks.flat());
  return allResultsCache;
}

export async function getFilteredResults(filters: QueryFilters): Promise<ResultRecord[]> {
  const key = filtersKey(filters);
  const cached = cacheGet(filteredResultsCache, key);
  if (cached) return cached;
  const computed = filterResults(await allResults(filters), filters);
  return cacheSet(filteredResultsCache, key, computed);
}

export async function buildFiltersResponse(filters: QueryFilters): Promise<FiltersResponse> {
  const key = filtersKey(filters);
  const cached = cacheGet(filtersResponseCache, key);
  if (cached) return cached;
  return cacheSet(filtersResponseCache, key, buildFilterOptions(await allResults(filters), filters, AVAILABLE_YEARS));
}

export async function buildStats(groupBy: string, filters: QueryFilters): Promise<StatPoint[]> {
  const cacheKey = `${groupBy}|${filtersKey(filters)}`;
  const cached = cacheGet(statsCache, cacheKey);
  if (cached) return cached;
  return cacheSet(statsCache, cacheKey, computeStats(await getFilteredResults(filters), groupBy));
}

export async function listOrganizations(): Promise<string[]> {
  const rows = await allResults();
  return uniqueSorted(rows.map((row) => row.organization));
}

export async function findOrganizationBySlug(slug: string): Promise<string | null> {
  const organizations = await listOrganizations();
  return organizations.find((name) => organizationSlug(name) === slug) ?? null;
}

export async function listEventNames(): Promise<string[]> {
  const rows = await allResults();
  return uniqueSorted(rows.map((row) => row.event_name));
}

export async function listRecordEventNames(): Promise<string[]> {
  const events = await listEventNames();
  return events.filter(isRecordEvent);
}

export async function listAthleteResults(): Promise<ResultRecord[]> {
  const rows = await allResults();
  return rows.filter(isAthleteRecord);
}

export async function listAthletes(): Promise<string[]> {
  const rows = await listAthleteResults();
  return uniqueSorted(rows.map((row) => row.crew_name));
}

export async function getAthleteResults(name: string): Promise<ResultRecord[]> {
  const rows = await listAthleteResults();
  return rows.filter((row) => row.crew_name === name);
}

/**
 * 前年に同じ系列の大会があれば、その Final A 優勝団体を種目名ごとに返す。
 * 無ければ null(改称などで系列が追えない大会は前年比較を出さない)。
 */
export async function previousYearWinners(
  year: number,
  competition: string
): Promise<Map<string, ResultRecord> | null> {
  const prevYear = year - 1;
  if (!AVAILABLE_YEARS.includes(prevYear)) return null;
  const key = competitionSeriesKey(competition);
  const rows = (await allResults({ year: String(prevYear) })).filter(
    (row) => competitionSeriesKey(row.competition_name) === key
  );
  if (rows.length === 0) return null;
  const winners = new Map<string, ResultRecord>();
  rows.forEach((row) => {
    if (row.final_group === "Final A" && row.rank === 1 && !winners.has(row.event_name)) {
      winners.set(row.event_name, row);
    }
  });
  return winners;
}
