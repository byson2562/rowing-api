import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";

import ButtonLink from "../components/ui/ButtonLink";
import { articles } from "../lib/articles";
import {
  availableYears,
  competitionsByRecency,
  getFilteredResults
} from "../lib/results-data";
import { siteUrl } from "../lib/site-url";

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
    url: "/"
  }
};

// 最新結果ブロックの種目並び(花形のエイトを先頭に)
const FEATURED_EVENT_ORDER = [
  "男子エイト",
  "女子エイト",
  "男子舵手つきフォア",
  "女子舵手つきフォア",
  "男子フォア",
  "男子クォドルプル",
  "女子クォドルプル",
  "男子ダブルスカル",
  "女子ダブルスカル",
  "男子ペア",
  "女子ペア",
  "男子シングルスカル",
  "女子シングルスカル"
];

// ---- 最新の大会結果テーブル(旧 .home-featured-*)のTailwindクラス ----
// 記事テーブル(article-classes.ts)と同じカード積みパターン。<=640pxで
// thead を視覚的に隠し、行を data-label 付きカードに積む。
const featuredCard =
  "mb-[18px] rounded-[20px] border border-[#cddcf0] bg-[linear-gradient(150deg,#ffffff_0%,#f2f8ff_100%)] " +
  "px-6 pb-6 pt-[22px] shadow-[0_14px_30px_rgba(17,42,75,0.09)]";
const featuredKicker = "m-0 text-[12px] font-extrabold tracking-[0.06em] text-[#2f66b8]";
const featuredHeading =
  "mb-0 mt-1.5 text-[clamp(1.3rem,3vw,1.8rem)] leading-[1.3] text-rn-brand";
const featuredYear = "ml-2.5 text-[0.7em] font-bold text-[#4c6687]";
const featuredTableWrap = "mt-4 overflow-x-auto max-[640px]:overflow-visible";
const featuredTable =
  "mt-0 w-full text-[14px] max-[640px]:block max-[640px]:min-w-0";
const featuredThead =
  "max-[640px]:absolute max-[640px]:h-px max-[640px]:w-px max-[640px]:overflow-hidden max-[640px]:[clip:rect(0_0_0_0)]";
const featuredTbody = "max-[640px]:block";
const featuredTr =
  "max-[640px]:mb-2.5 max-[640px]:block max-[640px]:rounded-xl max-[640px]:border max-[640px]:border-[#d7e3f4] max-[640px]:bg-white max-[640px]:px-3.5 max-[640px]:py-1";
const featuredTh =
  "whitespace-nowrap border-b border-rn-border bg-rn-primary-soft px-2.5 py-2 text-left text-[13px] leading-[1.5] text-[#33507a]";
const featuredTd =
  "border-b border-rn-border px-2.5 py-2 text-left leading-[1.5] " +
  "max-[640px]:flex max-[640px]:min-w-0 max-[640px]:items-baseline max-[640px]:justify-between max-[640px]:gap-3.5 " +
  "max-[640px]:border-[#eef3fb] max-[640px]:px-0 max-[640px]:py-2 max-[640px]:text-right " +
  "max-[640px]:last:border-b-0 " +
  "max-[640px]:before:shrink-0 max-[640px]:before:text-left max-[640px]:before:font-bold " +
  "max-[640px]:before:text-rn-muted max-[640px]:before:content-[attr(data-label)]";
const featuredTdEvent = "font-bold text-[#24496f]";
const featuredActions = "mt-[18px] flex flex-wrap gap-2.5";

// ---- ホームの各セクション ----
const homeSectionTitle = "mb-3.5 mt-0 text-[1.2rem] font-extrabold leading-[1.25] text-[#0f2647]";
const homeCard =
  "rounded-2xl border border-[#cfddf1] bg-white p-[18px] shadow-[0_12px_26px_rgba(60,110,200,0.08)]";

// 着地時の主役として出す「最新の大会結果」。最新年の直近大会のFinal A優勝を並べる
async function buildFeatured() {
  const years = availableYears();
  if (years.length === 0) return null;
  const latestYear = Math.max(...years);
  const latestYearRows = await getFilteredResults({ year: String(latestYear) });
  const latestComp = competitionsByRecency(latestYearRows)[0];
  if (!latestComp) return null;

  const winners = latestYearRows
    .filter(
      (r) => r.competition_name === latestComp && r.final_group === "Final A" && r.rank === 1
    )
    .sort((a, b) => {
      const ia = FEATURED_EVENT_ORDER.indexOf(a.event_name);
      const ib = FEATURED_EVENT_ORDER.indexOf(b.event_name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  if (winners.length === 0) return null;

  return { latestYear, latestComp, winners };
}

// 直近の大会リスト(featuredの大会は除き、新しい順に最大6件)
async function buildRecentCompetitions(excludeYear: number, excludeComp: string) {
  const years = availableYears().sort((a, b) => b - a).slice(0, 3);
  const items: { year: number; competition: string }[] = [];
  for (const year of years) {
    const rows = await getFilteredResults({ year: String(year) });
    for (const competition of competitionsByRecency(rows)) {
      if (year === excludeYear && competition === excludeComp) continue;
      items.push({ year, competition });
      if (items.length >= 6) return items;
    }
  }
  return items;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  // 旧ホーム(検索)のフィルタ付きURLは /search へ恒久リダイレクトして互換を保つ
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string" && first.trim()) params.set(key, first.trim());
  });
  if ([...params.keys()].length > 0) {
    permanentRedirect(`/search?${params.toString()}`);
  }

  const featured = await buildFeatured();
  const recent = featured
    ? await buildRecentCompetitions(featured.latestYear, featured.latestComp)
    : [];
  const latestArticles = [...articles]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, 2);

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
          "全日本ローイング選手権・全日本大学選手権・全日本新人選手権・全日本軽量級選手権など、日本ローイング協会が主催する全日本級大会のボート・ローイング大会結果を、2009年以降にわたり年度・大会・種目・団体で検索・比較・可視化できるデータセットです。",
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
    <main className="site-container grid gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {featured && (
        <section className={featuredCard} aria-labelledby="home-featured-heading">
          <p className={featuredKicker}>最新の大会結果</p>
          <h1 id="home-featured-heading" className={featuredHeading}>
            {featured.latestComp}
            <span className={featuredYear}>{featured.latestYear}年</span>
          </h1>
          <div className={featuredTableWrap}>
            <table className={featuredTable}>
              <thead className={featuredThead}>
                <tr>
                  <th scope="col" className={featuredTh}>種目</th>
                  <th scope="col" className={featuredTh}>優勝</th>
                  <th scope="col" className={featuredTh}>タイム</th>
                </tr>
              </thead>
              <tbody className={featuredTbody}>
                {featured.winners.map((w) => (
                  <tr key={w.event_name} className={featuredTr}>
                    <td data-label="種目" className={`${featuredTd} ${featuredTdEvent}`}>{w.event_name}</td>
                    <td data-label="優勝" className={featuredTd}>{w.crew_name}</td>
                    <td data-label="タイム" className={featuredTd}>{w.time_display}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={featuredActions}>
            <ButtonLink href={`/results/${featured.latestYear}/${encodeURIComponent(featured.latestComp)}`}>
              この大会の全結果
            </ButtonLink>
            <ButtonLink href="/search" variant="secondary">
              記録を検索する
            </ButtonLink>
            <ButtonLink href="/results" variant="secondary">
              過去の大会一覧
            </ButtonLink>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="home-recent-heading">
          <h2 id="home-recent-heading" className={homeSectionTitle}>直近の大会</h2>
          <ul className="m-0 grid list-none gap-2.5 p-0 md:grid-cols-2">
            {recent.map(({ year, competition }) => (
              <li key={`${year}-${competition}`}>
                <Link
                  href={`/results/${year}/${encodeURIComponent(competition)}`}
                  className="block rounded-[14px] border border-[#d7e3f4] bg-white px-4 py-3 no-underline shadow-[0_8px_20px_rgba(60,110,200,0.06)] transition-[border-color,box-shadow] duration-[180ms] hover:border-[#bdd2ee] hover:shadow-[0_12px_24px_rgba(60,110,200,0.1)] motion-reduce:transition-none"
                >
                  <span className="block text-[12px] font-bold text-rn-muted">{year}年</span>
                  <span className="block text-[14px] font-bold leading-[1.5] text-rn-brand">{competition}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latestArticles.length > 0 && (
        <section aria-labelledby="home-articles-heading">
          <h2 id="home-articles-heading" className={homeSectionTitle}>記事・データ分析</h2>
          <div className="grid gap-2.5">
            {latestArticles.map((a) => (
              <article key={a.slug} className={homeCard}>
                <h3 className="m-0 text-[15px] leading-[1.5]">
                  <Link
                    href={`/articles/${a.slug}`}
                    className="text-rn-brand no-underline hover:text-rn-primary hover:underline"
                  >
                    {a.title}
                  </Link>
                </h3>
                <p className="mb-0 mt-1.5 text-[13px] text-[#7189a8]">
                  <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
                </p>
                <p className="mb-0 mt-1.5 text-[14px] leading-[1.7] text-[#4c6687]">{a.description}</p>
              </article>
            ))}
          </div>
          <p className="mb-0 mt-2.5">
            <Link href="/articles" className="text-[14px] font-bold text-rn-link no-underline hover:text-rn-primary hover:underline">
              記事一覧を見る →
            </Link>
          </p>
        </section>
      )}

      <section aria-labelledby="home-search-heading" className={homeCard}>
        <h2 id="home-search-heading" className={homeSectionTitle}>記録を検索する</h2>
        <p className="mb-0 mt-0 leading-[1.7] text-rn-muted">
          年度・大会・種目・団体を組み合わせて、目的のレース結果を検索できます。種目ごとの優勝タイム推移や、団体別のメダル数も確認できます。
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <ButtonLink href="/search">検索ページを開く</ButtonLink>
          <ButtonLink href="/records" variant="secondary">歴代記録を見る</ButtonLink>
        </div>
      </section>
    </main>
  );
}
