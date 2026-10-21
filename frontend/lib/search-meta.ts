// 検索ページ(/search)の title・canonical・robots の規則。
//
// 静的エクスポートではクエリごとの metadata をビルド時に出せないため、HTML には固定の
// metadata を入れ、ブラウザ側(app/search-page.tsx)がこの規則で <head> を更新する。
// 規則は OpenNext 時代のサーバー側 generateMetadata と同じ:
//   - フィルタなし/フリーワードのみ → 既定 title。フリーワードは noindex
//   - 年だけ → canonical は /results/<年>、年+大会 → /results/<年>/<大会>
//   - 対応する静的ページがない組み合わせ → noindex(組み合わせが事実上無限なので)

import type { QueryFilters, ResultRecord } from "./results-core";

export const SEARCH_DEFAULT_TITLE = "ローイング・ボート記録検索";
export const SEARCH_DEFAULT_DESCRIPTION =
  "全日本選手権・全日本大学選手権など日本の主要ローイング（ボート）大会の記録を、年度・大会・種目・団体で横断検索できます。";

// canonical・OGPに反映する構造化フィルタ（qやページ番号は含めない）
export const CANONICAL_FILTER_KEYS = [
  "year",
  "gender",
  "affiliation_type",
  "event",
  "final_group",
  "competition",
  "competition_category",
  "organization",
  "rank"
] as const;

// フィルタ条件を「2024年 全日本選手権 男子エイト」のような人が読めるラベルへ変換する
export function describeFilters(filters: QueryFilters): string[] {
  const parts: string[] = [];
  if (filters.year) parts.push(`${filters.year}年`);
  if (filters.competition_category && !filters.competition) parts.push(filters.competition_category);
  if (filters.competition) parts.push(filters.competition);
  if (filters.event) {
    parts.push(filters.event);
  } else if (filters.gender) {
    parts.push(filters.gender);
  }
  if (filters.organization) parts.push(filters.organization);
  if (filters.affiliation_type) parts.push(filters.affiliation_type);
  if (filters.final_group) parts.push(filters.final_group);
  if (filters.rank) parts.push(`${filters.rank}位`);
  return parts;
}

export type SearchHeadState = {
  title: string;
  canonical: string | null;
  noindex: boolean;
};

/**
 * フィルタ付きURLの正規URLを決める。静的な /results 配下ページへ対応付けられる場合は
 * そちらを canonical にし、対応ページがない組み合わせでは出力しない。
 * `filteredRows` は現在の絞り込み結果(年+大会の組み合わせが実在するかの判定に使う)。
 */
export function searchHeadState(
  filters: QueryFilters,
  availableYears: number[],
  filteredRows: ResultRecord[]
): SearchHeadState {
  const activeKeys = CANONICAL_FILTER_KEYS.filter((key) => filters[key]);
  const parts = describeFilters(filters);

  if (parts.length === 0) {
    return { title: SEARCH_DEFAULT_TITLE, canonical: filters.q ? null : "/search", noindex: Boolean(filters.q) };
  }

  let canonical: string | null = null;
  if (filters.year) {
    const year = Number(filters.year);
    if (Number.isInteger(year) && availableYears.includes(year)) {
      if (activeKeys.length === 1) canonical = `/results/${filters.year}`;
      else if (activeKeys.length === 2 && filters.competition && filteredRows.length > 0) {
        canonical = `/results/${filters.year}/${encodeURIComponent(filters.competition)}`;
      }
    }
  }

  return {
    title: `${parts.join(" ")}のローイング大会結果`,
    canonical,
    noindex: canonical === null || Boolean(filters.q)
  };
}
