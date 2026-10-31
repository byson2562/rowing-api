// 大会結果の絞り込み・並べ替え・集計の純粋関数。
//
// サーバー(ビルド時の静的生成)とブラウザ(検索ページ)の両方から使うため、
// JSON データの読み込みやキャッシュは持たない(それらは results-data.ts)。
// ここに Node 専用 API や巨大データの import を足さないこと。

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

export type StatPoint = { label: string; value: number };

export type StatsGroupBy =
  | "year_count"
  | "organization_medals"
  | "organization_golds"
  | "event_count"
  | "winner_time_trend";

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

export type Pagination = { page: number; per_page: number; total_count: number; total_pages: number };

export const COMPETITION_CATEGORY_RULES = [
  { label: "全日本大学選手権", keywords: ["全日本大学選手権", "全日本大学ローイング"] },
  { label: "全日本選手権", keywords: ["全日本選手権", "全日本ローイング"] },
  { label: "全日本軽量級選手権", keywords: ["全日本軽量級選手権", "全日本軽量級ローイング"] },
  { label: "全日本新人選手権", keywords: ["全日本新人選手権", "全日本新人ローイング"] },
  { label: "全日本社会人選手権", keywords: ["全日本社会人選手権", "全日本社会人ローイング"] },
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

export const QUERY_FILTER_KEYS: (keyof QueryFilters)[] = [
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

export function filtersKey(filters: QueryFilters): string {
  return QUERY_FILTER_KEYS.map((key) => `${key}:${filters[key] ?? ""}`).join("|");
}

// 元データの種目名には「舵手つき/舵手付き/舵手付」「クォドルプル/クオドルプル」の
// 表記ゆれが混在するため、正書法のみを名寄せする（舵手有無が不明な種目名は触らない）
export function normalizeEventName(name: string): string {
  return (
    name
      .replace(/舵手付き/g, "舵手つき")
      .replace(/舵手付/g, "舵手つき")
      .replace(/クオドルプル/g, "クォドルプル")
      // JARAは2021年に「舵手なし」冠称を廃止(舵手なしペア→ペア等)。現行表記へ名寄せする
      .replace(/舵手なし/g, "")
  );
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

export function normalizeRecord(row: ResultRecord): ResultRecord {
  return {
    ...row,
    event_name: normalizeEventName(row.event_name),
    time_display: formatTimeDisplay(row.time_seconds) || row.time_display,
  };
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

export function competitionCategoryFor(name: string): string | null {
  for (const rule of COMPETITION_CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) {
      return rule.label;
    }
  }
  return null;
}

export function isStudentOrganization(organization: string): boolean {
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
  // 選手名は「石塚 慎之助」と姓名の間に空白があるので、空白を除いて照合する。
  // 空白で区切った語はすべて含むものに絞る(「早稲田 男子エイト」)
  const queryWords = (filters.q ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);

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
    if (queryWords.length > 0) {
      const haystack = [row.competition_name, row.event_name, row.crew_name, row.organization]
        .join("|")
        .toLowerCase()
        .replace(/\s+/g, "");
      if (!queryWords.every((word) => haystack.includes(word))) return false;
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
    pagination: { page, per_page: perPage, total_count: totalCount, total_pages: totalPages } as Pagination,
  };
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "ja"));
}

// 大会名は辞書順だと「第100回…」が「第36回…」より前に来て探しにくいため、
// 開催年の新しい順で並べる。同年内は開催日のデータがないので、取り込み順(id)の
// 新しい順にする。JARA更新スクリプトは新しい大会ほど大きいidを振るため、
// シーズン中は「直近に結果が出た大会」が先頭に来る
export function competitionsByRecency(rows: ResultRecord[]): string[] {
  const latest = new Map<string, { year: number; id: number }>();
  rows.forEach((row) => {
    const current = latest.get(row.competition_name);
    if (!current) {
      latest.set(row.competition_name, { year: row.year, id: row.id });
      return;
    }
    if (row.year > current.year) current.year = row.year;
    if (row.id > current.id) current.id = row.id;
  });
  return Array.from(latest.entries())
    .sort(
      (a, b) =>
        b[1].year - a[1].year || b[1].id - a[1].id || a[0].localeCompare(b[0], "ja")
    )
    .map(([name]) => name);
}

function omitFilters(filters: QueryFilters, keys: (keyof QueryFilters)[]): QueryFilters {
  const copy: QueryFilters = { ...filters };
  keys.forEach((key) => {
    delete copy[key];
  });
  return copy;
}

/**
 * 各セレクトの選択肢。自分以外のフィルタを適用した残りから候補を出す
 * (選ぶと0件になる候補を出さない)。`base` は年フィルタがあればその年、無ければ全年の行。
 */
export function buildFilterOptions(base: ResultRecord[], filters: QueryFilters, years: number[]): FiltersResponse {
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
    years: [...years].sort((a, b) => b - a),
    genders,
    competition_categories: competitionCategories,
    final_groups: uniqueSorted(finalGroupsRelation.map((row) => row.final_group)),
    competitions: competitionsByRecency(competitionsRelation),
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

/** 絞り込み済みの行から集計を作る(検索ページの図と、ビルド時の集計で共用) */
export function computeStats(filtered: ResultRecord[], groupBy: string): StatPoint[] {
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

// 団体名には「CRIMSON/GANG」のように「/」を含むものがあり、URLパスセグメントに
// そのまま使えないためスラグへ変換する（復元は一覧との突き合わせで行う）
export function organizationSlug(name: string): string {
  return name.replace(/\//g, "--");
}

// パラ(PR*)・ジャパンオープン(JO*)種目は標準の2000m種目と条件が異なり歴代最速の比較になじまないため、
// 歴代記録(/records)の対象からは除外する。検索など他機能では通常どおり扱う。
export function isRecordEvent(eventName: string): boolean {
  return !/^PR\d|^JO/.test(eventName);
}

// 個人名が記録されているのはシングルスカル種目のみ（団体種目のcrew_nameは団体名）。
// crew_name === organization の行は個人名が欠損した不良データのため除外する
export function isAthleteRecord(row: ResultRecord): boolean {
  return row.event_name.includes("シングルスカル") && row.crew_name !== row.organization;
}

/**
 * 大会名の系列キー。「第53回全日本大学ローイング選手権大会／第66回オックスフォード盾レガッタ」のような
 * 同時開催名の連結と「第N回」を落とし、年をまたいで同じ大会を突き合わせるために使う。
 */
export function competitionSeriesKey(name: string): string {
  const head = name.split("／")[0] ?? name;
  return head.replace(/第\s*\d+\s*回/g, "").replace(/\s+/g, "").trim();
}

/** 大会名の先頭セグメント(h1向けの短い名前)と、同時開催の後続名 */
export function splitCompetitionName(name: string): { main: string; coHosted: string[] } {
  const [main, ...rest] = name.split("／");
  return { main: main ?? name, coHosted: rest.filter((part) => part.length > 0) };
}
