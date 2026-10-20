import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";

import ButtonLink from "../components/ui/ButtonLink";
import { MiniBars, YearCells, type MiniBarRow, type YearCell } from "../components/home/home-figures";
import { articles, getArticle, type ArticleMeta } from "../lib/articles";
import {
  allResults,
  availableYears,
  competitionsByRecency,
  getDatasetSummary,
  getFilteredResults
} from "../lib/results-data";
import { championGaps, goldCounts, winnersByYear } from "../lib/univ-championship";
import { siteUrl } from "../lib/site-url";
import { ogImages } from "../lib/og-image";

export const metadata: Metadata = {
  // ルートセグメントでは layout の title.template が適用されないため、接尾辞まで明示する
  title: "ローイング大会結果・記録データベース | レガッタナビ",
  description:
    "全日本選手権・全日本大学選手権など日本の主要ローイング（ボート）大会の最新結果と歴代記録。年度・大会・種目・団体での検索、記録の推移まで確認できます。",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "ローイング大会結果・記録データベース | レガッタナビ",
    description:
      "全日本選手権・全日本大学選手権など日本の主要ローイング（ボート）大会の最新結果と歴代記録。年度・大会・種目・団体での検索、記録の推移まで確認できます。",
    url: "/",
    images: ogImages()
  }
};

// ---- ホームのクラス(docs/design-rules.md §6: ホームの値はこのファイル冒頭に置く) ----
// 日経ビジュアルデータ寄り: 箱を作らず、記事は3列の「見出し+本文+小さな図+日付」、区切りは下罫線。
const topRow = "flex flex-wrap items-end justify-between gap-x-6 gap-y-4";
const pageTitle = "m-0 text-[15px] font-medium leading-[1.6] text-rn-text";
const datasetMeta = "mt-1 mb-0 text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";
const articleGrid = "mt-12 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-10 gap-y-12";
const articleCard = "flex min-w-0 flex-col gap-4 border-b border-rn-border pb-5";
const articleTitle = "m-0 text-[24px] font-bold leading-[1.45] text-rn-text [text-wrap:balance]";
const articleTitleLink = "text-rn-text no-underline hover:underline";
const articleDesc = "m-0 text-[14px] leading-[1.85] text-rn-muted";
const articleDate = "mt-auto self-end text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";
const twoCol = "mt-16 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-10 gap-y-10";
const listHeading = "m-0 mb-1 text-[18px] font-bold leading-[1.5] text-rn-text";
const list = "m-0 list-none p-0";
const listItem = "flex items-baseline justify-between gap-4 border-b border-rn-border py-3.5";
const listLink = "text-[15px] leading-[1.6] text-rn-text no-underline hover:underline";
const listMeta = "shrink-0 text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";

const resultsArticlePattern = /^university-championship-(\d{4})-results$/;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}.${m}.${d}`;
}

// 記事タイトル「主題 | 補足」の主題だけをカードの見出しにする
function articleHeadline(title: string): string {
  return title.split("|")[0].trim();
}

// バーの物差し: 85パーセンタイルを1秒刻みで切り上げ(最低3秒)。大差の種目に引きずられないようにする
function barScale(values: number[], min = 3): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return min;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.85) - 1));
  return Math.max(min, Math.ceil(sorted[idx]));
}

// 記事ごとの小さな図。対応する集計が無い記事は図なしで並ぶ
async function articleFigure(article: ArticleMeta) {
  const resultsYear = Number(article.slug.match(resultsArticlePattern)?.[1] ?? 0);
  if (resultsYear > 0) {
    const gaps = await championGaps(resultsYear);
    if (gaps.length === 0) return null;
    const rows: MiniBarRow[] = gaps.map((g) => ({
      label: g.event,
      value: g.gap,
      display: g.gap.toFixed(2),
      hot: g.gap < 1
    }));
    const close = rows.filter((r) => r.hot).length;
    const min = rows.reduce((a, b) => (a.value < b.value ? a : b));
    const max = rows.reduce((a, b) => (a.value > b.value ? a : b));
    return (
      <MiniBars
        rows={rows}
        scale={barScale(rows.map((r) => r.value))}
        caption={`2位との差(秒)。${close > 0 ? "青は1秒未満" : "いずれも1秒以上の差"}`}
        summary={`${resultsYear}年インカレ${rows.length}種目の2位との差。${min.label}${min.display}秒が最小、${max.label}${max.display}秒が最大`}
      />
    );
  }

  if (article.slug === "university-championship-guide") {
    const winners = await winnersByYear("男子エイト");
    if (winners.length < 2) return null;
    const counts = new Map<string, number>();
    winners.forEach((w) => counts.set(w.organization, (counts.get(w.organization) ?? 0) + 1));
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const [top, second] = ranked;
    const others = winners.length - (top?.[1] ?? 0) - (second?.[1] ?? 0);
    const tone = (organization: string): YearCell["tone"] =>
      organization === top?.[0] ? "primary" : organization === second?.[0] ? "ink" : "soft";
    const cells: YearCell[] = winners.map((w) => ({ year: w.year, label: `${w.year}年 ${w.organization}`, tone: tone(w.organization) }));
    const legend = [
      ...(top ? [{ tone: "primary" as const, label: `${top[0]} ${top[1]}` }] : []),
      ...(second ? [{ tone: "ink" as const, label: `${second[0]} ${second[1]}` }] : []),
      ...(others > 0 ? [{ tone: "soft" as const, label: `その他 ${others}` }] : [])
    ];
    return (
      <YearCells
        cells={cells}
        legend={legend}
        summary={`${winners[0].year}年から${winners[winners.length - 1].year}年の男子エイト優勝校。${legend.map((l) => l.label.replace(/ (\d+)$/, "$1回")).join("、")}`}
      />
    );
  }

  if (article.slug === "university-power-map-2009-2025") {
    const golds = (await goldCounts(2009, 2025)).slice(0, 6);
    if (golds.length === 0) return null;
    const rows: MiniBarRow[] = golds.map((g, index) => ({
      label: g.organization,
      value: g.count,
      display: String(g.count),
      hot: index === 0
    }));
    return (
      <MiniBars
        rows={rows}
        scale={rows[0].value}
        labelWidth={84}
        barHeight={12}
        caption="Final A 1位の回数(2009〜2025年、JO種目を除く)"
        summary={`インカレFinal A 1位の回数。${rows.map((r) => `${r.label}${r.display}`).join("、")}`}
      />
    );
  }

  return null;
}

// 最近収録した大会(新しい順に3件)と、その収録件数
async function buildRecentCompetitions(limit = 3) {
  const items: { year: number; competition: string; count: number }[] = [];
  for (const year of availableYears()) {
    const rows = await getFilteredResults({ year: String(year) });
    for (const competition of competitionsByRecency(rows)) {
      items.push({ year, competition, count: rows.filter((row) => row.competition_name === competition).length });
      if (items.length >= limit) return items;
    }
  }
  return items;
}

type SearchParams = Record<string, string | string[] | undefined>;

// 旧ホームの検索フィルタ。ここにあるキーが付いていたときだけ /search へ送る
const SEARCH_FILTER_KEYS = new Set([
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
  "time_to"
]);

export default async function HomePage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  // 旧ホーム(検索)のフィルタ付きURLは /search へ恒久リダイレクトして互換を保つ。
  // 判定は検索フィルタのキー(lib/results-data.ts の parseQueryFilters と対応)に限る。
  // 以前は「クエリが1つでもあれば」でリダイレクトしていたため、?utm_source= や
  // ?gclid= を付けた広告・SNSからの流入までホームではなく検索へ飛んでいた。
  const params = new URLSearchParams();
  let hasSearchFilter = false;
  Object.entries(searchParams).forEach(([key, value]) => {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first !== "string" || !first.trim()) return;
    params.set(key, first.trim());
    if (SEARCH_FILTER_KEYS.has(key)) hasSearchFilter = true;
  });
  if (hasSearchFilter) {
    permanentRedirect(`/search?${params.toString()}`);
  }

  const summary = getDatasetSummary();
  const competitionCount = new Set((await allResults()).map((row) => `${row.year}|${row.competition_name}`)).size;
  const recent = await buildRecentCompetitions();

  // 記事は更新日(無ければ公開日)の新しい順に3本。図は記事ごとに付く
  const latestArticles = [...articles]
    .sort((a, b) => {
      const da = a.updatedAt ?? a.publishedAt;
      const db = b.updatedAt ?? b.publishedAt;
      if (da !== db) return da < db ? 1 : -1;
      return a.publishedAt < b.publishedAt ? 1 : -1;
    })
    .slice(0, 3);
  const figures = await Promise.all(latestArticles.map((article) => articleFigure(article)));

  const starters = [
    getArticle("rowing-glossary"),
    getArticle("university-championship-guide")
  ].filter((article): article is ArticleMeta => Boolean(article));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "レガッタナビ",
        url: siteUrl,
        inLanguage: "ja",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Dataset",
        name: "レガッタナビ ローイング記録データセット",
        description:
          "全日本ローイング選手権・全日本大学選手権・全日本新人選手権・全日本軽量級選手権・全日本社会人選手権など、日本ローイング協会が主催する全日本級大会のボート・ローイング大会結果を、2009年以降にわたり年度・大会・種目・団体で検索・比較・可視化できるデータセットです。",
        url: siteUrl,
        keywords: ["ローイング", "ボート", "大会結果", "レース記録", "日本ローイング協会"],
        isAccessibleForFree: true,
        license: `${siteUrl}/privacy`,
        creator: {
          "@type": "Organization",
          name: "レガッタナビ",
          logo: `${siteUrl}/og.svg`
        }
      }
    ]
  };

  return (
    <main className="site-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className={topRow}>
        <div>
          <h1 className={pageTitle}>ローイング(ボート)の大会結果と記録のデータベース</h1>
          <p className={datasetMeta}>
            {summary.minYear}〜{summary.maxYear}年 · {competitionCount}大会 · {summary.totalCount.toLocaleString()}件のFinal A・B
          </p>
        </div>
        <ButtonLink href="/about" variant="secondary">
          収録データについて
        </ButtonLink>
      </div>

      {latestArticles.length > 0 && (
        <section aria-label="記事" className={articleGrid}>
          {latestArticles.map((article, index) => (
            <article key={article.slug} className={articleCard}>
              <h2 className={articleTitle}>
                <Link href={`/articles/${article.slug}`} className={articleTitleLink}>
                  {articleHeadline(article.title)}
                </Link>
              </h2>
              <p className={articleDesc}>{article.description}</p>
              {figures[index]}
              <p className={articleDate}>
                {article.updatedAt ? (
                  <>
                    <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time> 更新
                  </>
                ) : (
                  <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                )}
              </p>
            </article>
          ))}
        </section>
      )}

      <section className={twoCol}>
        <div>
          <h2 className={listHeading}>最近収録した大会</h2>
          <ul className={list}>
            {recent.map(({ year, competition, count }) => (
              <li key={`${year}-${competition}`} className={listItem}>
                <Link href={`/results/${year}/${encodeURIComponent(competition)}`} className={listLink}>
                  {competition}
                </Link>
                <span className={listMeta}>
                  {year} · {count}件
                </span>
              </li>
            ))}
            <li className={listItem}>
              <Link href="/results" className={listLink}>
                年別の大会一覧
              </Link>
              <span className={listMeta}>
                {summary.minYear}〜{summary.maxYear}
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className={listHeading}>はじめての人へ</h2>
          <ul className={list}>
            {starters.map((article) => (
              <li key={article.slug} className={listItem}>
                <Link href={`/articles/${article.slug}`} className={listLink}>
                  {articleHeadline(article.title)}
                  <span className="text-rn-muted">　{article.title.split("|")[1]?.trim()}</span>
                </Link>
              </li>
            ))}
            <li className={listItem}>
              <Link href="/search" className={listLink}>
                記録を検索する<span className="text-rn-muted">　年・大会・種目・団体で絞り込み</span>
              </Link>
            </li>
            <li className={listItem}>
              <Link href="/records" className={listLink}>
                歴代記録<span className="text-rn-muted">　種目ごとの最速タイム</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
