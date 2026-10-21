import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug, type ResultRecord } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
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

const meta = getArticle("university-championship-2026-results")!;

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

// この記事は2026年大会に固定する。翌年以降は同じ構成で年別の記事を足す
const YEAR = 2026;
const PREV_YEAR = 2025;
const isUnivChampionship = (name: string) => /大学(ローイング)?選手権/.test(name);
// JO(ジャパンオープン)種目は社会人も出るオープン枠なので、大学の種目別優勝からは外す
const isOpenEvent = (eventName: string) => eventName.startsWith("JO");

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

function AthleteLink({ name }: { name: string }) {
  return <Link href={`/athletes/${encodeURIComponent(name)}`}>{name}</Link>;
}

function formatGap(seconds: number): string {
  return `${seconds.toFixed(2)}秒`;
}

function FinalTable({ rows }: { rows: ResultRecord[] }) {
  return (
    <div className={articleTableWrap}>
      <table className={articleTable}>
        <thead className={articleThead}>
          <tr>
            <th scope="col" className={articleTh}>順位</th>
            <th scope="col" className={articleTh}>大学</th>
            <th scope="col" className={articleTh}>タイム</th>
          </tr>
        </thead>
        <tbody className={articleTbody}>
          {rows.map((r) => (
            <tr key={r.rank} className={articleTr}>
              <td data-label="順位" className={`${articleTd} ${articleTdYear}`}>{r.rank}</td>
              <td data-label="大学" className={articleTd}>
                <OrgLink name={r.organization} />
              </td>
              <td data-label="タイム" className={articleTd}>{r.time_display}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function UniversityChampionship2026Results() {
  const rows = await allResults();
  const univ = rows.filter((r) => isUnivChampionship(r.competition_name));
  const competitionName = univ.find((r) => r.year === YEAR)!.competition_name;
  const competitionPath = `/results/${YEAR}/${encodeURIComponent(competitionName)}`;

  const finalA = (year: number) =>
    univ.filter((r) => r.year === year && r.final_group === "Final A" && !isOpenEvent(r.event_name));
  const thisYear = finalA(YEAR);
  const prevYear = finalA(PREV_YEAR);

  // 種目ごとの優勝・2位・前年優勝をまとめる
  const champions = eventOrder.flatMap((event) => {
    const winner = thisYear.find((r) => r.event_name === event && r.rank === 1);
    const second = thisYear.find((r) => r.event_name === event && r.rank === 2);
    const prev = prevYear.find((r) => r.event_name === event && r.rank === 1);
    if (!winner || !second) return [];
    return [{ event, winner, second, gap: second.time_seconds - winner.time_seconds, prev }];
  });
  const defended = champions.filter((c) => c.prev && c.prev.organization === c.winner.organization);
  const closest = [...champions].sort((a, b) => a.gap - b.gap)[0];

  // 学校別の金メダル数(多い順、同数は五十音ではなく種目順の初出で安定させる)
  const goldCounts = new Map<string, number>();
  champions.forEach((c) => goldCounts.set(c.winner.organization, (goldCounts.get(c.winner.organization) ?? 0) + 1));
  const goldRanking = [...goldCounts.entries()].sort((a, b) => b[1] - a[1]);

  const menEight = thisYear.filter((r) => r.event_name === "男子エイト").sort((a, b) => a.rank - b.rank);
  const womenEight = thisYear.filter((r) => r.event_name === "女子エイト").sort((a, b) => a.rank - b.rank);
  const menSingle = champions.find((c) => c.event === "男子シングルスカル")!;
  const womenSingle = champions.find((c) => c.event === "女子シングルスカル")!;

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
        <span>インカレ2026の結果</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>2026年10月15日</time> · レガッタナビ編集
          </p>
          <h1>インカレ2026(第53回全日本大学ローイング選手権)の結果</h1>
          <p className="lp-lead">
            2026年8月26日から30日、埼玉・戸田ボートコースで開かれた第53回全日本大学ローイング選手権。男子エイトは
            <OrgLink name="早稲田大学" />が連覇し、女子エイトは<OrgLink name="立教大学" />が
            <OrgLink name="仙台大学" />の4連覇を止めました。13種目のFinal A優勝校とタイム、2位との差、前年からの入れ替わりを、当サイトの収録データからまとめます。大会の成り立ちや種目構成は
            <Link href="/articles/university-championship-guide">インカレの解説記事</Link>へ。
          </p>
        </header>

        <h2>13種目の優勝校とタイム</h2>
        <p>
          優勝はFinal Aの1位。13種目を{goldRanking.length}校で分け合いました。前年と同じ大学が勝ったのは
          {defended.length}種目({defended.map((c) => `${c.event}の${c.winner.organization}`).join("、")})で、残る
          {champions.length - defended.length}種目は優勝校が入れ替わっています。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>優勝</th>
                <th scope="col" className={articleTh}>タイム</th>
                <th scope="col" className={articleTh}>2位との差</th>
                <th scope="col" className={articleTh}>前年優勝</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {champions.map((c) => (
                <tr key={c.event} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{c.event}</td>
                  <td data-label="優勝" className={articleTd}>
                    <OrgLink name={c.winner.organization} />
                  </td>
                  <td data-label="タイム" className={articleTd}>{c.winner.time_display}</td>
                  <td data-label="2位との差" className={articleTd}>
                    {formatGap(c.gap)}({c.second.organization})
                  </td>
                  <td data-label="前年優勝" className={articleTd}>{c.prev ? c.prev.organization : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          いちばん競ったのは{closest.event}。<OrgLink name={closest.winner.organization} />が
          <OrgLink name={closest.second.organization} />を{formatGap(closest.gap)}
          差でかわしました。女子シングルスカルの0.56秒差も含め、1秒未満の決着はこの大会で2つです。
        </p>

        <h2>男子エイト: 早稲田大学が連覇</h2>
        <p>
          早稲田が6分01秒26で<OrgLink name="仙台大学" />を1.70秒抑え、2025年に続く優勝。
          <OrgLink name="日本大学" />は3位でした。日大が男子エイトで2年続けて優勝を逃すのは、2019年から2021年以来です(2021年は全日本選手権との合併開催で、優勝は社会人のNTT東日本。日大は大学勢で最上位の4位でした)。
        </p>
        <FinalTable rows={menEight} />

        <h2>女子エイト: 立教大学が仙台大の4連覇を止める</h2>
        <p>
          立教が6分59秒36で<OrgLink name="明治大学" />に4.58秒差をつけました。収録範囲で立教が女子エイトを制したのは初めてです。2023年から3連覇中だった
          <OrgLink name="仙台大学" />は4位でした。
        </p>
        <FinalTable rows={womenEight} />

        <h2>学校別の金メダル数</h2>
        <p>
          最多は<OrgLink name="立命館大学" />の3つ(男子クォドルプル、男子ダブルスカル、女子舵手つきフォア)。女子舵手つきフォアは、収録データにある2018年から9大会連続の優勝です。前年に3つ取った仙台大は0、2つだった日大は男子ペアの1つだけでした。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>大学</th>
                <th scope="col" className={articleTh}>金</th>
                <th scope="col" className={articleTh}>種目</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {goldRanking.map(([org, count]) => (
                <tr key={org} className={articleTr}>
                  <td data-label="大学" className={`${articleTd} ${articleTdYear}`}>
                    <OrgLink name={org} />
                  </td>
                  <td data-label="金" className={articleTd}>{count}</td>
                  <td data-label="種目" className={articleTd}>
                    {champions
                      .filter((c) => c.winner.organization === org)
                      .map((c) => c.event)
                      .join("、")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>シングルスカルの優勝者</h2>
        <p>
          男子は<OrgLink name={menSingle.winner.organization} />の<AthleteLink name={menSingle.winner.crew_name} />
          、女子は<OrgLink name={womenSingle.winner.organization} />の
          <AthleteLink name={womenSingle.winner.crew_name} />が勝ちました。女子は2位の
          <OrgLink name={womenSingle.second.organization} />・<AthleteLink name={womenSingle.second.crew_name} />
          との差が{formatGap(womenSingle.gap)}でした。選手名のリンク先で、他の大会も含めた成績を追えます。
        </p>

        <h2>全種目の結果を見る</h2>
        <p>
          Final Bを含む全着順は<Link href={competitionPath}>{YEAR}年大会の結果ページ</Link>
          に種目別で載せています。学校ごとの推移は<Link href="/organizations">団体別ページ</Link>
          、2009〜2025年の17年分の優勝校の流れは
          <Link href="/articles/university-power-map-2009-2025">勢力図の分析記事</Link>で追えます。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>タイムは日本ローイング協会の公式結果から収録したFinal A・Bの記録です。予選や準決勝は含みません。</li>
            <li>
              JO(ジャパンオープン)種目は社会人も出場するオープン枠のため、13種目の集計から除いています。2026年はJO男子エイトをNTT東日本、JO女子エイトをデンソーオルカリスが制しました。
            </li>
            <li>女子エイトは収録データにFinal Aの記録がある年が2021年と2023年以降に限られます。「初めて」はその範囲での判定です。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
