import type { Metadata } from "next";

import SearchPage, { type SearchPageInitialFilters } from "./search-page";
import {
  availableYears,
  buildFiltersResponse,
  buildStats,
  getFilteredResults,
  paginate,
  parseQueryFilters,
  sortForIndex,
  type QueryFilters
} from "../lib/results-data";
import { siteUrl } from "../lib/site-url";

type SearchParams = Record<string, string | string[] | undefined>;

const PER_PAGE_OPTIONS = ["25", "50", "100", "200"];
// canonical・OGPに反映する構造化フィルタ（qやページ番号は含めない）
const CANONICAL_FILTER_KEYS = [
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

function toURLSearchParams(searchParams: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string" && first.trim()) {
      params.set(key, first.trim());
    }
  });
  return params;
}

// フィルタ条件を「2024年 全日本選手権 男子エイト」のような人が読めるラベルへ変換する
function describeFilters(filters: QueryFilters): string[] {
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

// フィルタ付きURLの正規URLを決める。Next 14はルートパス+クエリのcanonicalを
// オリジンへ丸めてしまうため、静的な /results 配下ページへ対応付けられる場合のみ
// canonicalを出し、対応ページがない組み合わせでは出力しない
async function canonicalFor(params: URLSearchParams, filters: QueryFilters): Promise<string | null> {
  const activeKeys = CANONICAL_FILTER_KEYS.filter((key) => params.get(key));
  if (activeKeys.length === 0) return "/";

  if (filters.year) {
    const year = Number(filters.year);
    if (!Number.isInteger(year) || !availableYears().includes(year)) return null;

    if (activeKeys.length === 1) return `/results/${filters.year}`;

    if (activeKeys.length === 2 && filters.competition) {
      const rows = await getFilteredResults({ year: filters.year, competition: filters.competition });
      if (rows.length > 0) return `/results/${filters.year}/${encodeURIComponent(filters.competition)}`;
    }
  }

  return null;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = toURLSearchParams(searchParams);
  const filters = parseQueryFilters(params);
  const parts = describeFilters(filters);
  const canonical = await canonicalFor(params, filters);

  if (parts.length === 0) {
    // フィルタなし（もしくはフリーワードのみ）はレイアウトの既定メタデータに任せる。
    // フリーワード検索は組み合わせが無限にあるためインデックスさせない
    // noindexにするフリーワード検索ページへはcanonicalを出さない（シグナルの混在を避ける）
    return {
      alternates: filters.q ? undefined : { canonical: "/" },
      robots: filters.q ? { index: false, follow: true } : undefined
    };
  }

  const label = parts.join(" ");
  const title = `${label}のローイング大会結果`;
  const description = `${label}のローイング（ボート）大会結果・記録。順位・クルー・タイムを一覧とグラフで確認できます。`;
  const ogImage = `${siteUrl}/og?title=${encodeURIComponent(label)}&subtitle=${encodeURIComponent("ローイング大会結果")}`;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: filters.q ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      locale: "ja_JP",
      ...(canonical ? { url: canonical } : {}),
      siteName: "レガッタナビ",
      title: `${title} | レガッタナビ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: label }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | レガッタナビ`,
      description,
      images: [ogImage]
    }
  };
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseQueryFilters(params);

  // クローラーにも実データ入りHTMLを返せるよう、初期表示分はサーバーで組み立てる
  const [filtered, filterOptions, organizationMedals, organizationGolds, winnerTrend] = await Promise.all([
    getFilteredResults(filters),
    buildFiltersResponse(filters),
    buildStats("organization_medals", filters),
    buildStats("organization_golds", filters),
    filters.event ? buildStats("winner_time_trend", filters) : Promise.resolve([])
  ]);
  const payload = paginate(sortForIndex(filtered), params.get("page"), params.get("per_page"));

  const initialFilters: SearchPageInitialFilters = {
    q: filters.q ?? "",
    year: filters.year ?? "",
    gender: filters.gender ?? "",
    affiliationType: filters.affiliation_type ?? "",
    event: filters.event ?? "",
    finalGroup: filters.final_group ?? "",
    competition: filters.competition ?? "",
    competitionCategory: filters.competition_category ?? "",
    organization: filters.organization ?? "",
    rank: filters.rank ?? ""
  };
  const rawPerPage = params.get("per_page") ?? "50";
  const initialPerPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : "50";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "レガッタナビ",
        url: siteUrl,
        inLanguage: "ja"
      },
      {
        "@type": "Dataset",
        name: "レガッタナビ ローイング記録データセット",
        description: "日本ローイング協会のボート・ローイング大会結果データを検索・可視化できるデータセット",
        url: siteUrl,
        creator: {
          "@type": "Organization",
          name: "レガッタナビ",
          logo: `${siteUrl}/og.svg`
        }
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SearchPage
        initialFilters={initialFilters}
        initialPage={payload.pagination.page}
        initialPerPage={initialPerPage}
        initialResults={payload.data}
        initialPagination={payload.pagination}
        initialFilterOptions={filterOptions}
        initialOrganizationMedals={organizationMedals}
        initialOrganizationGolds={organizationGolds}
        initialWinnerTrend={winnerTrend}
      />
    </>
  );
}
