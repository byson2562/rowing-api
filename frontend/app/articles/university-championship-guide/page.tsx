import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug } from "../../../lib/results-data";
import { articles, getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import { ogImages } from "../../../lib/og-image";
import { articleOg } from "../../../lib/og-targets";
import {
  articleMeta,
  articleNote,
  articleNoteList,
  articleNoteTitle,
  articleTable,
  articleTableWrap,
  articleTbody,
  articleTd,
  articleTdYear,
  articleTh,
  articleThead,
  articleTr
} from "../../../components/article/article-classes";

const meta = getArticle("university-championship-guide")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: {
    canonical: `/articles/${meta.slug}`
  },
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: "article",
    url: `/articles/${meta.slug}`,
    images: ogImages(articleOg(meta))
  }
};

const isUnivChampionship = (name: string) => /大学(ローイング)?選手権/.test(name);
// JO(ジャパンオープン)種目は社会人も出るオープン枠なので、大学の種目別優勝からは外す
const isOpenEvent = (eventName: string) => eventName.startsWith("JO");

// 年別の結果記事。slug の年で新しい順に並べる(記事を足せばここに自動で載る)
const resultsArticlePattern = /^university-championship-(\d{4})-results$/;
const resultsArticles = articles
  .map((a) => ({ article: a, year: Number(a.slug.match(resultsArticlePattern)?.[1] ?? 0) }))
  .filter((a) => a.year > 0)
  .sort((a, b) => b.year - a.year);

const eventOrder = [
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

function OrgLink({ name }: { name: string }) {
  return <Link href={`/organizations/${organizationSlug(name)}`}>{name}</Link>;
}

export default async function UniversityChampionshipGuide() {
  const rows = await allResults();
  const univGolds = rows.filter(
    (r) => isUnivChampionship(r.competition_name) && r.final_group === "Final A" && r.rank === 1
  );

  // 直近大会は収録データの最新年を使う(年度データを足せば本文の表も追従する)
  const latestYear = Math.max(...univGolds.map((r) => r.year));
  const latestChamps = univGolds
    .filter((r) => r.year === latestYear && !isOpenEvent(r.event_name))
    .sort((a, b) => eventOrder.indexOf(a.event_name) - eventOrder.indexOf(b.event_name));
  const latestWinnerCount = new Set(latestChamps.map((r) => r.organization)).size;
  const latestGoldCounts = new Map<string, number>();
  latestChamps.forEach((r) => latestGoldCounts.set(r.organization, (latestGoldCounts.get(r.organization) ?? 0) + 1));
  const [latestTopOrg, latestTopCount] = [...latestGoldCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const latestMenEvents = latestChamps.filter((r) => r.event_name.startsWith("男子")).length;
  const latestWomenEvents = latestChamps.filter((r) => r.event_name.startsWith("女子")).length;
  const latestResultsArticle = resultsArticles.find((a) => a.year === latestYear)?.article;

  // 男子エイトの歴代優勝(2009年〜直近)
  const menEight = univGolds
    .filter((r) => r.event_name === "男子エイト" && r.year >= 2009)
    .sort((a, b) => b.year - a.year);
  const menEightSpan = menEight.length;
  const nihonMenEightWins = menEight.filter((r) => r.organization === "日本大学").length;
  const wasedaMenEightYears = menEight
    .filter((r) => r.organization === "早稲田大学")
    .map((r) => `${r.year}年`)
    .reverse()
    .join("・");

  const womenEightLatest = univGolds
    .filter((r) => r.event_name === "女子エイト")
    .sort((a, b) => b.year - a.year)[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "記事", item: `${siteUrl}/articles` },
          { "@type": "ListItem", position: 3, name: meta.title, item: `${siteUrl}/articles/${meta.slug}` }
        ]
      },
      {
        "@type": "Article",
        headline: meta.title,
        description: meta.description,
        datePublished: meta.publishedAt,
        dateModified: meta.updatedAt ?? meta.publishedAt,
        author: { "@type": "Person", name: "中村匠" },
        publisher: { "@type": "Organization", name: "レガッタナビ", url: siteUrl },
        mainEntityOfPage: `${siteUrl}/articles/${meta.slug}`
      }
    ]
  };

  return (
    <main className="site-container lp-page article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link href="/articles">記事</Link>
        <span aria-hidden="true">›</span>
        <span>{"全日本大学ローイング選手権(インカレ)とは"}</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>2026年7月22日</time>
            {meta.updatedAt ? <>(<time dateTime={meta.updatedAt}>2026年10月15日</time>更新)</> : null} · レガッタナビ編集
          </p>
          <h1>全日本大学ローイング選手権(インカレ)とは</h1>
          <p className="lp-lead">
            大学ボートの日本一を決める、年に一度の対抗戦。毎年夏の終わりに埼玉・戸田ボートコースで開かれます。種目の構成、直近大会の優勝校、男子エイトの歴代優勝、年ごとの結果記事を、当サイトの収録データからまとめました。
            {latestResultsArticle ? (
              <>
                {latestYear}年大会の結果は
                <Link href={`/articles/${latestResultsArticle.slug}`}>結果記事</Link>
                に種目別でまとめています。
              </>
            ) : null}
          </p>
        </header>

        <h2>どんな大会か</h2>
        <p>
          正式名称は「全日本大学ローイング選手権大会」。ボート関係者は「インカレ」や「全日本大学選手権」と呼びます。大学対抗の種目に出られるのは大学のクルーだけです(JO種目と、全日本選手権と合併した2021年は社会人も漕ぎました)。各校が対抗エイトを筆頭に部の総力を注ぎ込む、大学ボートのシーズン最大の目標です。オックスフォード盾レガッタ(1年生中心のレース)と同じ水域で開かれ、2024年からはジャパンオープンレガッタも併催されています。
        </p>
        <p>
          開催は例年、夏の終わり。2026年の第53回大会は8月26日(水)から30日(日)まで、埼玉県戸田市の戸田ボートコースで行われました。次回の日程や要項の一次情報は
          <a href="https://www.jara.or.jp/race/current/" target="_blank" rel="noopener noreferrer">
            日本ローイング協会の大会日程ページ
          </a>
          で確認できます。
        </p>

        <h2>種目構成</h2>
        <p>
          {latestYear}年大会でFinal Aが行われたのは{latestChamps.length}種目。男子が{latestMenEvents}
          種目(エイト、舵手つきフォア、フォア、クォドルプル、ダブルスカル、ペア、シングルスカル)、女子が{latestWomenEvents}
          種目(男子からフォアを除いた構成)です。花形はやはり男女のエイトで、大会最終日のメインレースになります。
        </p>

        <h2>{latestYear}年の種目別優勝校</h2>
        <p>
          直近大会の結果から。{latestChamps.length}種目の優勝は{latestWinnerCount}
          校に分かれました。1校が取った種目数の最多は、2022年の日本大学が6種目、2024年が5種目。{latestYear}年は
          {latestTopOrg}の{latestTopCount}種目でした。年ごとの流れは
          <Link href="/articles/university-power-map-2009-2025">勢力図の分析記事</Link>
          で2009〜2025年の17年分を追っています。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>優勝</th>
                <th scope="col" className={articleTh}>タイム</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {latestChamps.map((r) => (
                <tr key={r.event_name} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{r.event_name}</td>
                  <td data-label="優勝" className={articleTd}>
                    <OrgLink name={r.organization} />
                  </td>
                  <td data-label="タイム" className={articleTd}>{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>男子エイトの歴代優勝(2009-{latestYear})</h2>
        <p>
          対抗戦の頂点、男子エイトの優勝校を並べます。この{menEightSpan}年では<OrgLink name="日本大学" />が
          {nihonMenEightWins}回と圧倒的。残りは<OrgLink name="早稲田大学" />({wasedaMenEightYears})、
          <OrgLink name="中央大学" />(2019年)、<OrgLink name="仙台大学" />
          (2020年)、そして全日本選手権と合併開催だった2021年のNTT東日本(注記参照)です。早稲田は2025年に10年ぶりに勝ち、翌2026年も連覇しました。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>年</th>
                <th scope="col" className={articleTh}>優勝</th>
                <th scope="col" className={articleTh}>タイム</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {menEight.map((r) => (
                <tr key={r.year} className={articleTr}>
                  <td data-label="年" className={`${articleTd} ${articleTdYear}`}>
                    <Link href={`/results/${r.year}`}>{r.year}</Link>
                  </td>
                  <td data-label="優勝" className={articleTd}>{r.organization}</td>
                  <td data-label="タイム" className={articleTd}>{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          女子エイトは収録データではFinal Aの記録がある年が限られます。<OrgLink name="仙台大学" />
          が2023年から3連覇したあと、直近の{womenEightLatest.year}年は<OrgLink name={womenEightLatest.organization} />
          が勝ちました。
        </p>

        <h2>年別の結果記事</h2>
        <p>
          大会ごとの結果は、種目別の優勝校とタイム、2位との差、前年からの入れ替わりまで記事にまとめています。
        </p>
        <ul>
          {resultsArticles.map(({ article, year }) => (
            <li key={article.slug}>
              <Link href={`/articles/${article.slug}`}>{year}年大会の結果</Link>
            </li>
          ))}
        </ul>

        <h2>結果の調べ方</h2>
        <p>
          過去の結果は当サイトで検索できます。
          <Link href={`/results/${latestYear}`}>{latestYear}年の大会結果</Link>
          から種目ごとの着順とタイムを、<Link href="/organizations">団体別ページ</Link>
          から各校のメダル推移を確認できます。大会期間中の公式速報は
          <a href="https://www.jara.or.jp/" target="_blank" rel="noopener noreferrer">
            日本ローイング協会
          </a>
          が出します。当サイトへの結果反映は大会後になります。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>優勝はFinal Aの1位。収録範囲はFinal B以上です。</li>
            <li>2021年の男子エイトは全日本選手権との合併開催で、優勝は社会人のNTT東日本でした(歴代表にもそのまま載せています)。</li>
            <li>JO(ジャパンオープン)種目は社会人クルーも出場するオープン枠のため、種目別優勝の表から除いています。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
