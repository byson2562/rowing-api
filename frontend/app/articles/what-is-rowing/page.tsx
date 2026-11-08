import type { Metadata } from "next";
import Link from "next/link";

import scheduleJson from "../../../data/schedule.json";
import { allResults, formatTimeDisplay, getDatasetSummary, type ResultRecord } from "../../../lib/results-data";
import { formatDateRange, type ScheduledCompetition } from "../../../lib/schedule";
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

const meta = getArticle("what-is-rowing")!;

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

// 艇の種類。漕手の人数・オールの持ち方・舵手の有無で種目が決まる
const BOAT_CLASSES = [
  { name: "エイト", code: "8+", crew: "漕手8人+舵手", oar: "スイープ" },
  { name: "舵手つきフォア", code: "4+", crew: "漕手4人+舵手", oar: "スイープ" },
  { name: "フォア", code: "4-", crew: "漕手4人", oar: "スイープ" },
  { name: "舵手つきクォドルプル", code: "4x+", crew: "漕手4人+舵手", oar: "スカル" },
  { name: "クォドルプル", code: "4x", crew: "漕手4人", oar: "スカル" },
  { name: "ダブルスカル", code: "2x", crew: "漕手2人", oar: "スカル" },
  { name: "ペア", code: "2-", crew: "漕手2人", oar: "スイープ" },
  { name: "シングルスカル", code: "1x", crew: "漕手1人", oar: "スカル" }
];

// 種目別の最速タイムに出す種目
const FLAGSHIP_EVENTS = ["男子エイト", "女子エイト", "男子シングルスカル", "女子シングルスカル"];

// 大会の出場対象(大会区分ごとの固定文言)
const ENTRY_BY_CATEGORY: Record<string, string> = {
  全日本社会人選手権: "社会人",
  全日本選手権: "制限なし(日本一決定戦)",
  全日本大学選手権: "大学",
  全日本新人選手権: "新人(大学・高校・社会人)"
};

const JARA_ABOUT_URL = "https://www.jara.or.jp/about.html";
const JARA_HISTORY_URL = "https://www.jara.or.jp/history.html";

type Fastest = { event: string; row: ResultRecord };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

function fastestOf(rows: ResultRecord[], event: string): Fastest | null {
  let best: ResultRecord | null = null;
  for (const row of rows) {
    if (row.event_name !== event || row.time_seconds <= 0) continue;
    if (!best || row.time_seconds < best.time_seconds) best = row;
  }
  return best ? { event, row: best } : null;
}

export default async function WhatIsRowing() {
  const rows = await allResults();
  const summary = getDatasetSummary();
  const minYear = summary.minYear ?? 0;
  const maxYear = summary.maxYear ?? 0;
  const competitionNames = new Set(rows.map((r) => r.competition_name));
  const competitionCount = competitionNames.size;

  // 大会名に「ローイング」が入った最初の年(協会の改称に合わせて大会名が変わった)
  const rowingNamedYears = rows
    .filter((r) => r.competition_name.includes("ローイング"))
    .map((r) => r.year);
  const firstRowingYear = rowingNamedYears.length > 0 ? Math.min(...rowingNamedYears) : null;

  // 軽量級選手権を収録している最後の年
  const lightweightYears = rows.filter((r) => r.competition_name.includes("軽量級")).map((r) => r.year);
  const lastLightweightYear = lightweightYears.length > 0 ? Math.max(...lightweightYears) : null;

  const fastest = FLAGSHIP_EVENTS.map((event) => fastestOf(rows, event)).filter((x): x is Fastest => x !== null);

  // 年度日程(手で転記した schedule.json)。開始日順
  const schedule = [...(scheduleJson.competitions as ScheduledCompetition[])].sort((a, b) =>
    a.start < b.start ? -1 : 1
  );
  const scheduleYear = schedule.length > 0 ? Number(schedule[0].start.slice(0, 4)) : maxYear;

  // 日程表の行ごとの飛び先: ガイド記事 > 収録済みの大会ページ > その年の結果一覧
  const scheduleLink = (c: ScheduledCompetition): { href: string; label: string } => {
    const year = c.start.slice(0, 4);
    if (c.guide) return { href: `/articles/${c.guide}`, label: "大会ガイド" };
    if (competitionNames.has(c.name)) {
      return { href: `/results/${year}/${encodeURIComponent(c.name)}`, label: "大会結果" };
    }
    return { href: `/results/${year}`, label: `${year}年の結果一覧` };
  };

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
        <span>ローイング(ボート競技)とは</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt)}</time> · レガッタナビ編集
          </p>
          <h1>ローイング(ボート競技)とは</h1>
          <p className="lp-lead">
            ローイングは、オールで艇を進めて着順を競う水上の競技です。日本では「ボート」や「漕艇(そうてい)」とも呼ばれ、全国規模の大会は2000mの直線コースで行われます。ジムにあるローイングマシン(エルゴ)はこの競技の陸上練習に使う器具で、この記事で扱うのは水上のレースです。種目、レースの距離と進み方、日本の主な大会と1年の流れ、出場している団体、結果を見るページを、当サイトの収録データ({minYear}〜{maxYear}年・{competitionCount}大会・{summary.totalCount.toLocaleString("ja-JP")}件)とともにまとめました。
          </p>
        </header>

        <h2>種目は人数・オール・舵手の組み合わせ</h2>
        <p>
          種目は、乗る人数(1・2・4・8人)、オールの持ち方、舵手(コックス)の有無の組み合わせで決まります。1人がオールを1本持って片側に出すのがスイープ、左右に1本ずつ計2本持つのがスカルです。舵手は漕がずに舵を取り、クルーに指示を出します。大会では艇の名前に男子・女子を付けて「男子エイト」「女子ダブルスカル」のように呼びます。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>艇の種類</th>
                <th scope="col" className={articleTh}>乗る人</th>
                <th scope="col" className={articleTh}>オール</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {BOAT_CLASSES.map((b) => (
                <tr key={b.name} className={articleTr}>
                  <td data-label="艇の種類" className={`${articleTd} ${articleTdYear}`}>
                    {b.name}({b.code})
                  </td>
                  <td data-label="乗る人" className={articleTd}>{b.crew}</td>
                  <td data-label="オール" className={articleTd}>{b.oar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          かっこ内は国際表記で、数字が漕手の人数、xがスカル、+が舵手あり、-が舵手なしです。乗る位置の名前や艇の各部の呼び方、Final AとBの違いは
          <Link href="/articles/rowing-glossary">ローイング用語集</Link>
          にまとめています。
        </p>

        <h2>レースの距離と進み方</h2>
        <p>
          日本ローイング協会が主催する全国規模の大会のうち、当サイトが収録している社会人・全日本・軽量級・インカレ(オックスフォード盾レガッタを併催)・新人の5つの選手権を、この記事では全日本級と呼びます。日本ローイング協会が主催する全国規模の大会は2000mで行われ、高校選抜も2000mです。国民スポーツ大会(国スポ)、インターハイ、全国中学選手権、マスターズは1000mです(
          <a href={JARA_ABOUT_URL} target="_blank" rel="noopener noreferrer">日本ローイング協会「ローイング競技について」</a>
          )。
        </p>
        <p>
          出場艇が多い種目は予選から始まり、敗者復活戦や準決勝を経て、上位6艇の決勝(Final A)で優勝が決まります。次の6艇はFinal Bで7〜12位を争います。当サイトが収録しているのはこのFinal AとFinal Bの着順とタイムで、予選や敗者復活の結果は含みません。大会当日の流れと組み合わせの読み方は、記事「
          <Link href="/articles/first-regatta">はじめてのボート大会</Link>
          」にまとめています。
        </p>

        <h2>種目別の最速タイム(2000m)</h2>
        <p>
          収録データ({minYear}〜{maxYear}年)での種目別の最速タイムです。種目名を押すと、団体名と年が付いた歴代の記録一覧が開きます。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>収録内の最速</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {fastest.map(({ event, row }) => (
                <tr key={event} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>
                    <Link href={`/records/${encodeURIComponent(event)}`}>{event}</Link>
                  </td>
                  <td data-label="収録内の最速" className={articleTd}>{formatTimeDisplay(row.time_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>日本の主な大会と1年の流れ</h2>
        <p>
          {scheduleYear}年の全日本級の大会の日程は次のとおりです。会場の「戸田」は埼玉県の戸田ボートコース、「海の森」は東京都の海の森水上競技場を指します。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>大会</th>
                <th scope="col" className={articleTh}>対象</th>
                <th scope="col" className={articleTh}>日程</th>
                <th scope="col" className={articleTh}>会場</th>
                <th scope="col" className={articleTh}>関連ページ</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {schedule.map((c) => {
                const link = scheduleLink(c);
                return (
                  <tr key={c.name} className={articleTr}>
                    <td data-label="大会" className={`${articleTd} ${articleTdYear}`}>{c.name}</td>
                    <td data-label="対象" className={articleTd}>{ENTRY_BY_CATEGORY[c.category] ?? "-"}</td>
                    <td data-label="日程" className={articleTd}>{formatDateRange(c.start, c.end)}</td>
                    <td data-label="会場" className={articleTd}>{c.venue}</td>
                    <td data-label="関連ページ" className={articleTd}>
                      <Link href={link.href}>{link.label}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          全日本軽量級選手権は{lastLightweightYear ? `${lastLightweightYear}年まで` : ""}の収録です。高校生の全国大会(インターハイ、国スポ、高校選抜)と中学生・マスターズの大会は当サイトの収録対象外です。結果は日本ローイング協会や各大会の公式サイトで確認してください。
        </p>

        <h2>出場している団体</h2>
        <p>
          全日本級の大会には、大学、高校、社会人のクラブや企業のチーム、複数の所属からなる混成クルーが出場します。インカレは大学、社会人選手権は社会人に出場が限られますが、<Link href="/articles/all-japan-championship-guide">全日本選手権</Link>と<Link href="/articles/freshman-championship-guide">新人選手権</Link>では大学・高校・社会人が同じ種目に出ます。団体ごとの通算成績と年度別の戦績は
          <Link href="/organizations">団体一覧</Link>
          にあります。
        </p>

        <h2>当サイトで結果・記録を見る</h2>
        <p>
          予選や敗者復活を含む全レースの一次情報は、
          <a href="https://www.jara.or.jp/" target="_blank" rel="noopener noreferrer">日本ローイング協会</a>
          の公式リザルトにあり、レース当日の結果も載ります。当サイトは{minYear}年以降の全日本級{competitionCount}大会のFinal A・Final Bを{summary.totalCount.toLocaleString("ja-JP")}件収録し、
          <Link href="/results">年・大会・種目別の結果</Link>、<Link href="/records">種目別の歴代最速タイム</Link>、
          <Link href="/athletes">選手別のシングルスカル成績</Link>、<Link href="/organizations">団体別の成績</Link>
          にまとめています。年や大会、種目、団体を組み合わせて絞り込むときは<Link href="/search">記録検索</Link>を使ってください。
        </p>

        <h2>よくある質問</h2>
        <p>
          <strong>エイトは何人乗り?</strong>
          <br />
          漕手8人に舵手1人を加えた9人です。
        </p>
        <p>
          <strong>ローイングとローイングマシンの違いは?</strong>
          <br />
          ローイングマシン(ローイングエルゴメーター、略してエルゴ)は、漕ぐ動きを室内で再現する練習器具です。競技としてのローイングは水上で艇を漕ぐレースを指します。エルゴのタイムを競う記録会(インドアローイング)もありますが、当サイトが収録しているのは水上のレースの結果です。
        </p>
        <p>
          <strong>ローイングとボート、漕艇の違いは?</strong>
          <br />
          3つとも同じ競技です。競技団体は1920年に日本漕艇協会として発足し、1998年に日本ボート協会、2023年1月に
          <a href={JARA_HISTORY_URL} target="_blank" rel="noopener noreferrer">日本ローイング協会</a>
          へ改称しました。大会名も追って変わり、当サイトの収録データでは{firstRowingYear ?? maxYear}年から「全日本ローイング選手権」のように「ローイング」付きの名称になっています。
        </p>

        <div className={articleNote}>
          <p className={articleNoteTitle}>この記事について</p>
          <ul className={articleNoteList}>
            <li>競技の説明と距離は、日本ローイング協会の「ローイング競技について」と「日本のローイング略史」に基づきます。</li>
            <li>最速タイムは当サイト収録の{minYear}〜{maxYear}年・全日本級の大会内での数字です。国内公式記録ではありません。</li>
            <li>大会の日程・会場・出場資格は年度によって変わります。出場・観戦の前に日本ローイング協会の大会ページで確認してください。</li>
          </ul>
        </div>
      </article>
    </main>
  );
}
