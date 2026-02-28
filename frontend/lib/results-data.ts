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

type QueryFilters = {
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

const RESULTS_INDEX = resultsIndex as ResultsIndex;
const AVAILABLE_YEARS = RESULTS_INDEX.years;
const YEAR_SET = new Set(AVAILABLE_YEARS);
const yearCache = new Map<number, ResultRecord[]>();
let allResultsCache: ResultRecord[] | null = null;

const COMPETITION_CATEGORY_RULES = [
  { label: "全日本大学選手権", keywords: ["全日本大学選手権", "全日本大学ローイング"] },
  { label: "全日本選手権", keywords: ["全日本選手権", "全日本ローイング"] },
  { label: "全日本軽量級選手権", keywords: ["全日本軽量級選手権", "全日本軽量級ローイング"] },
  { label: "全日本新人選手権", keywords: ["全日本新人選手権", "全日本新人ローイング"] },
] as const;

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
    default:
      return [];
  }
}

async function loadYearResults(year: number): Promise<ResultRecord[]> {
  const cached = yearCache.get(year);
  if (cached) return cached;
  const loaded = await importYear(year);
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

function omitFilters(filters: QueryFilters, keys: (keyof QueryFilters)[]): QueryFilters {
  const copy: QueryFilters = { ...filters };
  keys.forEach((key) => {
    delete copy[key];
  });
  return copy;
}

export async function buildFiltersResponse(filters: QueryFilters) {
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

  return {
    years: [...AVAILABLE_YEARS].sort((a, b) => b - a),
    genders,
    competition_categories: competitionCategories,
    final_groups: uniqueSorted(finalGroupsRelation.map((row) => row.final_group)),
    competitions: uniqueSorted(competitionsRelation.map((row) => row.competition_name)),
    events: uniqueSorted(eventsRelation.map((row) => row.event_name)),
    organizations: uniqueSorted(organizationsRelation.map((row) => row.organization)),
    affiliation_types: [hasStudent ? "学生" : "", hasSocial ? "社会人" : ""].filter(Boolean),
  };
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
  const filtered = filterResults(await allResults(filters), filters);

  if (groupBy === "year_count") {
    return Array.from(countByLabel(filtered, (row) => String(row.year)).entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value }));
  }

  if (groupBy === "organization_medals") {
    return Array.from(
      countByLabel(
        filtered.filter((row) => row.final_group === "Final A" && [1, 2, 3].includes(row.rank)),
        (row) => row.organization,
      ).entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }

  if (groupBy === "organization_golds") {
    return Array.from(
      countByLabel(
        filtered.filter((row) => row.final_group === "Final A" && row.rank === 1),
        (row) => row.organization,
      ).entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }

  if (groupBy === "event_count") {
    return Array.from(countByLabel(filtered, (row) => row.event_name).entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }

  if (groupBy === "winner_time_trend") {
    const winners = filtered.filter((row) => row.final_group === "Final A" && row.rank === 1);
    const group = new Map<number, number[]>();
    winners.forEach((row) => {
      const list = group.get(row.year) ?? [];
      list.push(row.time_seconds);
      group.set(row.year, list);
    });
    return Array.from(group.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, values]) => ({
        label: String(year),
        value: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)),
      }));
  }

  return [];
}
