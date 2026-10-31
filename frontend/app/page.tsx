import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "../components/ui/button-classes";
import LegacySearchRedirect from "../components/home/legacy-search-redirect";
import { articles } from "../lib/articles";
import {
  allResults,
  availableYears,
  competitionsByRecency,
  getDatasetSummary,
  getFilteredResults,
  listAthleteResults,
  listOrganizations,
  listRecordEventNames
} from "../lib/results-data";
import { featuredCompetition, formatDateRange } from "../lib/schedule";
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
// データベースが主役: 見出しの直下に検索窓、その下にデータの入口。記事は下の一覧に題名と日付だけ並べる。
// 箱を作らず、区切りは罫線(日経ビジュアルデータ寄り)。
const pageTitle = "m-0 text-[24px] font-bold leading-[1.4] text-rn-text [text-wrap:balance] max-[640px]:text-[22px]";
const datasetMeta = "mt-2 mb-0 text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";
const searchForm = "mt-6";
const searchLabel = "mb-2 block text-[14px] font-medium leading-[1.5] text-rn-text";
const searchRow = "flex max-w-[640px] gap-2";
// 入力は design-rules §6(高さ40 / radius 4 / focus-visible リング)
const searchInput =
  "h-10 min-w-0 flex-1 rounded-rn-control border border-rn-border bg-white px-[11px] py-2 text-[16px] " +
  "text-rn-text focus-visible:border-rn-primary focus-visible:outline-2 focus-visible:outline-rn-primary";
const searchHint = "mb-0 mt-2 text-[13px] leading-[1.6] text-rn-meta";
const searchHintLink = "text-rn-text underline hover:no-underline";
// 「次の大会」の帯。箱にせず、上下のヘアラインで区切る1行(docs/design-rules.md §6「次の大会」)
const nextStrip =
  "mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-t border-rn-border-strong py-3.5 text-[14px] leading-[1.6]";
const nextLabel = "shrink-0 font-bold text-rn-text";
const nextName = "font-medium text-rn-text";
const nextMeta = "text-rn-meta [font-variant-numeric:tabular-nums]";
const nextLink = "text-rn-text underline hover:no-underline";
// データの入口。PC 4列・タブレット 2列・スマホ 1列。各項目は下罫線で区切る
const dataIndex =
  "m-0 grid list-none grid-cols-1 gap-x-10 border-t border-rn-border-strong p-0 sm:grid-cols-2 lg:grid-cols-4";
const dataItem = "border-b border-rn-border";
const dataLink = "flex min-h-10 flex-col gap-1 py-4 text-rn-text no-underline hover:underline";
const dataName = "text-[18px] font-bold leading-[1.5]";
const dataMeta = "text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";
const listColumns = "mt-14 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-10 gap-y-10";
const listHeading = "m-0 mb-1 text-[18px] font-bold leading-[1.5] text-rn-text";
const list = "m-0 list-none p-0";
const listItem = "flex items-baseline justify-between gap-4 border-b border-rn-border py-3.5";
const listLink = "text-[15px] leading-[1.6] text-rn-text no-underline hover:underline";
const listMeta = "shrink-0 text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}.${m}.${d}`;
}

// 記事タイトル「主題 | 補足」の主題だけをカードの見出しにする
function articleHeadline(title: string): string {
  return title.split("|")[0].trim();
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

export default async function HomePage() {
  const summary = getDatasetSummary();
  const featured = await featuredCompetition();
  const competitionCount = new Set((await allResults()).map((row) => `${row.year}|${row.competition_name}`)).size;
  const recent = await buildRecentCompetitions();
  const [recordEvents, organizations, athleteRows] = await Promise.all([
    listRecordEventNames(),
    listOrganizations(),
    listAthleteResults()
  ]);
  const athleteCount = new Set(athleteRows.map((row) => row.crew_name)).size;

  const dataEntries = [
    { href: "/results", name: "大会結果", meta: `${summary.minYear}〜${summary.maxYear}年・${competitionCount}大会` },
    { href: "/records", name: "歴代記録", meta: `${recordEvents.length}種目の最速タイム` },
    { href: "/organizations", name: "団体別", meta: `${organizations.length}団体の成績` },
    { href: "/athletes", name: "選手別", meta: `シングルスカルの${athleteCount}名` }
  ];

  // 記事は更新日(無ければ公開日)の新しい順に4本
  const latestArticles = [...articles]
    .sort((a, b) => {
      const da = a.updatedAt ?? a.publishedAt;
      const db = b.updatedAt ?? b.publishedAt;
      if (da !== db) return da < db ? 1 : -1;
      return a.publishedAt < b.publishedAt ? 1 : -1;
    })
    .slice(0, 4);

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
      <LegacySearchRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className={pageTitle}>ローイング(ボート)の大会結果と記録のデータベース</h1>
      <p className={datasetMeta}>
        {summary.minYear}〜{summary.maxYear}年 · {competitionCount}大会 · {summary.totalCount.toLocaleString()}件のFinal A・B ·{" "}
        <Link href="/about" className={`${searchHintLink} whitespace-nowrap`}>
          収録データについて
        </Link>
      </p>

      <form action="/search" method="get" role="search" className={searchForm}>
        <label htmlFor="home-search" className={searchLabel}>
          選手名・団体名・大会名で探す
        </label>
        <div className={searchRow}>
          <input
            id="home-search"
            name="q"
            type="search"
            required
            className={searchInput}
            placeholder="例: 早稲田大学、石塚慎之助"
          />
          <button type="submit" className={buttonClass()}>
            検索
          </button>
        </div>
        <p className={searchHint}>
          年・大会・種目・順位で絞り込むときは<Link href="/search" className={searchHintLink}>記録検索</Link>へ
        </p>
      </form>

      {featured ? (
        <aside className={nextStrip} aria-label="次の大会">
          <span className={nextLabel}>
            {featured.status === "ongoing" ? "開催中" : featured.status === "awaiting_results" ? "結果を収録中" : "次の大会"}
          </span>
          <span className={nextName}>{featured.competition.name}</span>
          <span className={nextMeta}>
            {formatDateRange(featured.competition.start, featured.competition.end)} · {featured.competition.venue}
          </span>
          {featured.status === "awaiting_results" ? (
            <span className={nextMeta}>結果は公式発表のあと、収録でき次第ここに出します</span>
          ) : featured.competition.guide ? (
            <Link href={`/articles/${featured.competition.guide}`} className={nextLink}>
              大会の見かた
            </Link>
          ) : (
            <a href={featured.competition.url} target="_blank" rel="noopener noreferrer" className={nextLink}>
              日本ローイング協会の大会ページ
            </a>
          )}
        </aside>
      ) : null}

      <nav aria-label="データの一覧" className={featured ? "mt-0" : "mt-8"}>
        <ul className={dataIndex}>
          {dataEntries.map((entry) => (
            <li key={entry.href} className={dataItem}>
              <Link href={entry.href} className={dataLink}>
                <span className={dataName}>{entry.name}</span>
                <span className={dataMeta}>{entry.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={listColumns}>
        <section>
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
          </ul>
        </section>
        {latestArticles.length > 0 ? (
          <section>
            <h2 className={listHeading}>新しい記事</h2>
            <ul className={list}>
              {latestArticles.map((article) => (
                <li key={article.slug} className={listItem}>
                  <Link href={`/articles/${article.slug}`} className={listLink}>
                    {articleHeadline(article.title)}
                  </Link>
                  <span className={listMeta}>
                    <time dateTime={article.updatedAt ?? article.publishedAt}>
                      {formatDate(article.updatedAt ?? article.publishedAt)}
                    </time>
                  </span>
                </li>
              ))}
              <li className={listItem}>
                <Link href="/articles" className={listLink}>
                  記事の一覧
                </Link>
              </li>
            </ul>
          </section>
        ) : null}
        <section>
          {/* サイトを初めて訪れた人向け。競技の入門記事ではなくサイトの説明に送る */}
          <h2 className={listHeading}>はじめての人へ</h2>
          <ul className={list}>
            <li className={listItem}>
              <Link href="/about" className={listLink}>
                レガッタナビとは<span className="text-rn-muted">　収録しているデータと使い方</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
