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

// ホームで見せる主要種目。全種目は大会ページに任せ、ここは「大会の顔」だけ並べる
const FEATURED_EVENTS = [
  "男子エイト",
  "女子エイト",
  "男子舵手つきフォア",
  "女子舵手つきフォア",
  "男子シングルスカル",
  "女子シングルスカル"
];

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
const featuredCard = "rounded-rn-card bg-white px-6 pb-6 pt-[22px] shadow-rn-soft";
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
// <=640px は1種目1行。種目名の下に「団体 ・ タイム」を小さく並べる
const featuredTr =
  "max-[640px]:block max-[640px]:border-b max-[640px]:border-rn-border max-[640px]:py-2 max-[640px]:last:border-b-0";
const featuredTh =
  "whitespace-nowrap border-b border-rn-border bg-rn-primary-soft px-2.5 py-2 text-left text-[13px] leading-[1.5] text-[#33507a]";
const featuredTdBase =
  "border-b border-rn-border px-2.5 py-2 text-left leading-[1.5] " +
  "max-[640px]:block max-[640px]:border-b-0 max-[640px]:px-0 max-[640px]:py-0";
// 種目名(1行目)
const featuredTdEvent = `${featuredTdBase} font-bold text-[#24496f] max-[640px]:text-[13px]`;
// 優勝団体(2行目・左)とタイム(2行目・右)。モバイルだけ1行に並べる
const featuredTdCrew =
  `${featuredTdBase} max-[640px]:mt-0.5 max-[640px]:inline-block max-[640px]:text-[13px] max-[640px]:text-rn-muted`;
const featuredTdTime =
  `${featuredTdBase} [font-variant-numeric:tabular-nums] ` +
  "max-[640px]:mt-0.5 max-[640px]:inline-block max-[640px]:text-[13px] max-[640px]:text-rn-muted " +
  "max-[640px]:before:mx-1.5 max-[640px]:before:text-[#adbfd8] max-[640px]:before:content-['・']";
const featuredActions = "mt-[18px] flex flex-wrap gap-2.5";

// ---- ホームの各セクション ----
// 他ページの .lp-section-title と同じ言語(太字 + グラデーション下線)
const homeSectionTitle =
  "mb-0 mt-0 text-[1.2rem] font-extrabold leading-[1.25] tracking-[0.01em] text-[#0f2647] " +
  "after:mt-2 after:block after:h-[3px] after:w-11 after:rounded-full " +
  "after:bg-rn-primary after:content-['']";
// セクション見出し行(右端に「すべて見る」リンクを添える)
const homeSectionHead = "mb-3.5 flex items-baseline justify-between gap-3";
const homeMoreLink =
  "text-[13px] font-semibold text-rn-link no-underline hover:text-rn-primary hover:underline";
// カードはサイト共通のボーダーレス+ソフト影
const homeCard = "rounded-xl bg-white p-[18px] shadow-rn-soft";

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
      (r) =>
        r.competition_name === latestComp &&
        r.final_group === "Final A" &&
        r.rank === 1 &&
        FEATURED_EVENTS.includes(r.event_name)
    )
    .sort((a, b) => {
      const ia = FEATURED_EVENT_ORDER.indexOf(a.event_name);
      const ib = FEATURED_EVENT_ORDER.indexOf(b.event_name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  if (winners.length === 0) return null;

  return { latestYear, latestComp, winners };
}

// 直近の大会リスト(featuredの大会は除き、新しい順に最大3件)
async function buildRecentCompetitions(excludeYear: number, excludeComp: string) {
  const years = availableYears().sort((a, b) => b - a).slice(0, 3);
  const items: { year: number; competition: string }[] = [];
  for (const year of years) {
    const rows = await getFilteredResults({ year: String(year) });
    for (const competition of competitionsByRecency(rows)) {
      if (year === excludeYear && competition === excludeComp) continue;
      items.push({ year, competition });
      if (items.length >= 3) return items;
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
    .slice(0, 3);

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
    // 列をminmax(0,1fr)で固定: 内包テーブルのmin-widthでmainがmin-content幅に膨らむのを防ぐ
    <main className="site-container grid grid-cols-[minmax(0,1fr)] gap-8">
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
                    <td className={featuredTdEvent}>{w.event_name}</td>
                    <td className={featuredTdCrew}>{w.crew_name}</td>
                    <td className={featuredTdTime}>{w.time_display}</td>
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
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="home-recent-heading">
          <div className={homeSectionHead}>
            <h2 id="home-recent-heading" className={homeSectionTitle}>直近の大会</h2>
            <Link href="/results" className={homeMoreLink}>過去の大会一覧 →</Link>
          </div>
          <ul className="m-0 grid auto-rows-fr list-none gap-2.5 p-0 md:grid-cols-3">
            {recent.map(({ year, competition }) => (
              <li key={`${year}-${competition}`}>
                <Link
                  href={`/results/${year}/${encodeURIComponent(competition)}`}
                  className="block h-full rounded-xl bg-white px-4 py-3 no-underline shadow-rn-soft transition-[box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(16,42,80,0.1)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
          <div className={homeSectionHead}>
            <h2 id="home-articles-heading" className={homeSectionTitle}>記事</h2>
            <Link href="/articles" className={homeMoreLink}>記事一覧を見る →</Link>
          </div>
          <div className="grid auto-rows-fr gap-2.5 md:grid-cols-3">
            {latestArticles.map((a) => (
              <article key={a.slug} className={`${homeCard} h-full`}>
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
        </section>
      )}

      <section
        aria-labelledby="home-search-heading"
        className="rounded-rn-card border border-rn-border-soft bg-rn-surface-soft p-6"
      >
        <h2 id="home-search-heading" className={homeSectionTitle}>記録を検索する</h2>
        <p className="mb-0 mt-3 leading-[1.7] text-rn-muted">
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
