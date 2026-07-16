import resultsIndex from "../data/results/index.json";

export type ResultRecord = {
  id: number;
  year: number;
  competition_name: string;
  event_name: string;
  final_group: string;
  crew_name: string;
  organization: string;
  rank: number;
  time_seconds: number;
  time_display: string;
};

export type QueryFilters = {
  q?: string;
  year?: string;
  gender?: string;
  affiliation_type?: string;
  event?: string;
  final_group?: string;
  competition?: string;
  competition_category?: string;
  organization?: string;
  rank?: string;
  rank_from?: string;
  rank_to?: string;
  time_from?: string;
  time_to?: string;
};

type StatPoint = { label: string; value: number };
type ResultsIndex = { years: number[]; total_count: number };
type CacheEntry<T> = { expiresAt: number; value: T };
export type DatasetSummary = {
  totalCount: number;
  minYear: number | null;
  maxYear: number | null;
  competitionCategoryCount: number;
};
export type FiltersResponse = {
  years: number[];
  genders: string[];
  competition_categories: string[];
  final_groups: string[];
  competitions: string[];
  events: string[];
  organizations: string[];
  affiliation_types: string[];
};

const RESULTS_INDEX = resultsIndex as ResultsIndex;
const AVAILABLE_YEARS = RESULTS_INDEX.years;
const YEAR_SET = new Set(AVAILABLE_YEARS);
const yearCache = new Map<number, ResultRecord[]>();
let allResultsCache: ResultRecord[] | null = null;
const QUERY_CACHE_TTL_MS = 30_000;
const QUERY_CACHE_MAX = 200;
const filteredResultsCache = new Map<string, CacheEntry<ResultRecord[]>>();
const filtersResponseCache = new Map<string, CacheEntry<FiltersResponse>>();
const statsCache = new Map<string, CacheEntry<StatPoint[]>>();

const COMPETITION_CATEGORY_RULES = [
  { label: "全日本大学選手権", keywords: ["全日本大学選手権", "全日本大学ローイング"] },
  { label: "全日本選手権", keywords: ["全日本選手権", "全日本ローイング"] },
  { label: "全日本軽量級選手権", keywords: ["全日本軽量級選手権", "全日本軽量級ローイング"] },
  { label: "全日本新人選手権", keywords: ["全日本新人選手権", "全日本新人ローイング"] },
] as const;

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

const STUDENT_KEYWORDS = [
  "大学",
  "短期大学",
  "大学校",
  "高専",
  "高校",
  "高等学校",
  "中学",
  "中等",
  "学園",
  "学院",
  "専門学校",
];

const STUDENT_MIXED_ABBREV_KEYWORDS = [
  "一橋大",
  "東京大",
  "大阪大",
  "神戸大",
  "北大",
  "名大",
  "名工",
  "南山",
  "筑波",
  "青学",
  "海洋",
  "東北",
  "新潟",
  "山形",
  "国茶",
  "大阪神戸",
];

export function parseQueryFilters(searchParams: URLSearchParams): QueryFilters {
  const get = (key: string) => searchParams.get(key) ?? undefined;
  return {
    q: get("q"),
    year: get("year"),
    gender: get("gender"),
    affiliation_type: get("affiliation_type"),
    event: get("event"),
    final_group: get("final_group"),
    competition: get("competition"),
    competition_category: get("competition_category"),
    organization: get("organization"),
    rank: get("rank"),
    rank_from: get("rank_from"),
    rank_to: get("rank_to"),
    time_from: get("time_from"),
    time_to: get("time_to"),
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

function filtersKey(filters: QueryFilters): string {
  const keys: (keyof QueryFilters)[] = [
    "q",
    "year",
    "gender",
    "affiliation_type",
    "event",
    "final_group",
    "competition",
    "competition_category",
    "organization",
    "rank",
    "rank_from",
    "rank_to",
    "time_from",
    "time_to",
  ];
  return keys
    .map((key) => `${key}:${filters[key] ?? ""}`)
    .join("|");
}

function parseYear(value?: string): number | null {
  if (!value) return null;
  const year = Number(value);
  if (!Number.isInteger(year) || !YEAR_SET.has(year)) return null;
  return year;
}

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

// 元データの種目名には「舵手つき/舵手付き/舵手付」「クォドルプル/クオドルプル」の
// 表記ゆれが混在するため、正書法のみを名寄せする（舵手有無が不明な種目名は触らない）
export function normalizeEventName(name: string): string {
  return name
    .replace(/舵手付き/g, "舵手つき")
    .replace(/舵手付/g, "舵手つき")
    .replace(/クオドルプル/g, "クォドルプル");
}

// 競漕記録の慣例表記 m:ss.cc（例 6:12.08）
export function formatTimeDisplay(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = Math.floor(totalSeconds % 60);
  let centiseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 100);
  if (centiseconds >= 100) {
    centiseconds -= 100;
    seconds += 1;
  }
  if (seconds >= 60) {
    seconds -= 60;
    minutes += 1;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

function normalizeRecord(row: ResultRecord): ResultRecord {
  return {
    ...row,
    event_name: normalizeEventName(row.event_name),
    time_display: formatTimeDisplay(row.time_seconds) || row.time_display,
  };
}

async function loadYearResults(year: number): Promise<ResultRecord[]> {
  const cached = yearCache.get(year);
  if (cached) return cached;
  const loaded = (await importYear(year)).map(normalizeRecord);
  yearCache.set(year, loaded);
  return loaded;
}

export async function allResults(filters?: QueryFilters): Promise<ResultRecord[]> {
  const year = parseYear(filters?.year);
  if (year) {
    return loadYearResults(year);
  }

  if (allResultsCache) return allResultsCache;

  const chunks = await Promise.all(AVAILABLE_YEARS.map((y) => loadYearResults(y)));
  allResultsCache = chunks.flat();
  return allResultsCache;
}

function toFiniteNumber(value?: string): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function startsWithGender(eventName: string, gender?: string): boolean {
  if (!gender) return true;
  return eventName.startsWith(gender);
}

function competitionCategoryFor(name: string): string | null {
  for (const rule of COMPETITION_CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) {
      return rule.label;
    }
  }
  return null;
}

function isStudentOrganization(organization: string): boolean {
  if (STUDENT_KEYWORDS.some((keyword) => organization.includes(keyword))) return true;
  if (organization.includes("混成")) {
    return STUDENT_MIXED_ABBREV_KEYWORDS.some((keyword) => organization.includes(keyword));
  }
  return false;
}

function matchesAffiliationType(organization: string, affiliationType?: string): boolean {
  if (!affiliationType) return true;
  const student = isStudentOrganization(organization);
  if (affiliationType === "学生") return student;
  if (affiliationType === "社会人") return !student;
  return true;
}

export function filterResults(source: ResultRecord[], filters: QueryFilters): ResultRecord[] {
  const rankFrom = toFiniteNumber(filters.rank_from);
  const rankTo = toFiniteNumber(filters.rank_to);
  const timeFrom = toFiniteNumber(filters.time_from);
  const timeTo = toFiniteNumber(filters.time_to);
  const rankEq = toFiniteNumber(filters.rank);
  const query = (filters.q ?? "").trim().toLowerCase();

  return source.filter((row) => {
    if (filters.year && row.year !== Number(filters.year)) return false;
    if (!startsWithGender(row.event_name, filters.gender)) return false;
    if (!matchesAffiliationType(row.organization, filters.affiliation_type)) return false;
    if (filters.event && row.event_name !== filters.event) return false;
    if (filters.final_group && row.final_group !== filters.final_group) return false;
    if (filters.competition && row.competition_name !== filters.competition) return false;
    if (filters.competition_category && competitionCategoryFor(row.competition_name) !== filters.competition_category) return false;
    if (filters.organization && row.organization !== filters.organization) return false;
    if (rankEq != null && row.rank !== rankEq) return false;
    if (rankFrom != null && row.rank < rankFrom) return false;
    if (rankTo != null && row.rank > rankTo) return false;
    if (timeFrom != null && row.time_seconds < timeFrom) return false;
    if (timeTo != null && row.time_seconds > timeTo) return false;
    if (query) {
      const haystack = `${row.competition_name} ${row.event_name} ${row.crew_name} ${row.organization}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export async function getFilteredResults(filters: QueryFilters): Promise<ResultRecord[]> {
  const key = filtersKey(filters);
  const cached = cacheGet(filteredResultsCache, key);
  if (cached) return cached;
  const computed = filterResults(await allResults(filters), filters);
  return cacheSet(filteredResultsCache, key, computed);
}

export function sortForIndex(rows: ResultRecord[]): ResultRecord[] {
  return [...rows].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.competition_name !== b.competition_name) return a.competition_name.localeCompare(b.competition_name, "ja");
    if (a.event_name !== b.event_name) return a.event_name.localeCompare(b.event_name, "ja");
    if (a.final_group !== b.final_group) return a.final_group.localeCompare(b.final_group, "ja");
    return a.rank - b.rank;
  });
}

export function paginate<T>(rows: T[], pageRaw?: string | null, perPageRaw?: string | null) {
  const page = Math.max(Number(pageRaw ?? 1) || 1, 1);
  const perPage = Math.min(Math.max(Number(perPageRaw ?? 50) || 50, 1), 200);
  const totalCount = rows.length;
  const totalPages = Math.ceil(totalCount / perPage);
  const offset = (page - 1) * perPage;
  return {
    data: rows.slice(offset, offset + perPage),
    pagination: { page, per_page: perPage, total_count: totalCount, total_pages: totalPages },
  };
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "ja"));
}

// 大会名は辞書順だと「第100回…」が「第36回…」より前に来て探しにくいため、
// 開催年の新しい順（同年内は名前順）で並べる
export function competitionsByRecency(rows: ResultRecord[]): string[] {
  const latestYear = new Map<string, number>();
  rows.forEach((row) => {
    const current = latestYear.get(row.competition_name);
    if (current == null || row.year > current) {
      latestYear.set(row.competition_name, row.year);
    }
  });
  return Array.from(latestYear.entries())
    .sort((a, b) => (a[1] !== b[1] ? b[1] - a[1] : a[0].localeCompare(b[0], "ja")))
    .map(([name]) => name);
}

function omitFilters(filters: QueryFilters, keys: (keyof QueryFilters)[]): QueryFilters {
  const copy: QueryFilters = { ...filters };
  keys.forEach((key) => {
    delete copy[key];
  });
  return copy;
}

export async function buildFiltersResponse(filters: QueryFilters): Promise<FiltersResponse> {
  const key = filtersKey(filters);
  const cached = cacheGet(filtersResponseCache, key);
  if (cached) return cached;

  const base = await allResults(filters);
  const finalGroupsRelation = filterResults(base, omitFilters(filters, ["final_group"]));
  const competitionsRelation = filterResults(base, omitFilters(filters, ["competition"]));
  const eventsRelation = filterResults(base, omitFilters(filters, ["event"]));
  const organizationsRelation = filterResults(base, omitFilters(filters, ["organization"]));
  const affiliationTypesRelation = filterResults(base, omitFilters(filters, ["affiliation_type"]));
  const competitionCategoriesRelation = filterResults(base, omitFilters(filters, ["competition_category"]));

  const gendersRelation = filterResults(base, {
    year: filters.year,
    competition: filters.competition,
    event: filters.event,
    final_group: filters.final_group,
    organization: filters.organization,
  });

  const genders = uniqueSorted(
    gendersRelation
      .map((row) => (row.event_name.startsWith("男子") ? "男子" : row.event_name.startsWith("女子") ? "女子" : ""))
      .filter(Boolean),
  );

  const categorySet = new Set(
    competitionCategoriesRelation
      .map((row) => competitionCategoryFor(row.competition_name))
      .filter((value): value is string => Boolean(value)),
  );
  const competitionCategories = COMPETITION_CATEGORY_RULES.map((rule) => rule.label).filter((label) => categorySet.has(label));

  const hasStudent = affiliationTypesRelation.some((row) => isStudentOrganization(row.organization));
  const hasSocial = affiliationTypesRelation.some((row) => !isStudentOrganization(row.organization));

  return cacheSet(filtersResponseCache, key, {
    years: [...AVAILABLE_YEARS].sort((a, b) => b - a),
    genders,
    competition_categories: competitionCategories,
    final_groups: uniqueSorted(finalGroupsRelation.map((row) => row.final_group)),
    competitions: competitionsByRecency(competitionsRelation),
    events: uniqueSorted(eventsRelation.map((row) => row.event_name)),
    organizations: uniqueSorted(organizationsRelation.map((row) => row.organization)),
    affiliation_types: [hasStudent ? "学生" : "", hasSocial ? "社会人" : ""].filter(Boolean),
  });
}

function countByLabel(rows: ResultRecord[], pick: (row: ResultRecord) => string): Map<string, number> {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const label = pick(row);
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return map;
}

export async function buildStats(groupBy: string, filters: QueryFilters): Promise<StatPoint[]> {
  const cacheKey = `${groupBy}|${filtersKey(filters)}`;
  const cached = cacheGet(statsCache, cacheKey);
  if (cached) return cached;

  const filtered = await getFilteredResults(filters);

  if (groupBy === "year_count") {
    return cacheSet(
      statsCache,
      cacheKey,
      Array.from(countByLabel(filtered, (row) => String(row.year)).entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value })),
    );
  }

  if (groupBy === "organization_medals") {
    return cacheSet(
      statsCache,
      cacheKey,
      Array.from(
      countByLabel(
        filtered.filter((row) => row.final_group === "Final A" && [1, 2, 3].includes(row.rank)),
        (row) => row.organization,
      ).entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value })),
    );
  }

  if (groupBy === "organization_golds") {
    return cacheSet(
      statsCache,
      cacheKey,
      Array.from(
      countByLabel(
        filtered.filter((row) => row.final_group === "Final A" && row.rank === 1),
        (row) => row.organization,
      ).entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value })),
    );
  }

  if (groupBy === "event_count") {
    return cacheSet(
      statsCache,
      cacheKey,
      Array.from(countByLabel(filtered, (row) => row.event_name).entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value })),
    );
  }

  if (groupBy === "winner_time_trend") {
    const winners = filtered.filter((row) => row.final_group === "Final A" && row.rank === 1);
    const group = new Map<number, number[]>();
    winners.forEach((row) => {
      const list = group.get(row.year) ?? [];
      list.push(row.time_seconds);
      group.set(row.year, list);
    });
    return cacheSet(
      statsCache,
      cacheKey,
      Array.from(group.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, values]) => ({
        label: String(year),
        value: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)),
      })),
    );
  }

  return cacheSet(statsCache, cacheKey, []);
}
