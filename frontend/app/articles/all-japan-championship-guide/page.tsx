import type { Metadata } from "next";
import Link from "next/link";

import { allResults, isStudentOrganization, organizationSlug, type ResultRecord } from "../../../lib/results-data";
import { articles, getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import { ogImages } from "../../../lib/og-image";
import { articleOg } from "../../../lib/og-targets";
import { formatDateRange, type ScheduledCompetition } from "../../../lib/schedule";
import scheduleJson from "../../../data/schedule.json";
import {
  articleBarFill,
  articleBarLabel,
  articleBarRow,
  articleBarTrack,
  articleBarValue,
  articleChart,
  articleEraCard,
  articleEraCardTitle,
  articleEraGrid,
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

const meta = getArticle("all-japan-championship-guide")!;

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

// 2026年大会の一次情報(日本ローイング協会の大会ページと開催要項、2026-11-08 確認)。
// 下の URL と、本文の「種目と出場条件」の段落・注記の日付は要項に基づく手書きの値なので、年度が変わったらまとめて差し替える
const BULLETIN_YEAR = 2026;
const BULLETIN_CHECKED = "2026年11月8日";
const JARA_EVENT_URL = "https://www.jara.or.jp/race/current/2026alljapan.html";
const JARA_BULLETIN_URL = "https://www.jara.or.jp/race/current/2026alljapan_bulletin.pdf";
const JARA_SCHEDULE_URL = "https://www.jara.or.jp/race/current/2026alljapan_tt.html";
const JARA_RESULTS_URL = "https://www.jara.or.jp/raceresult/domestic/104alljapan/104alljapan.htm";
// 次回の日程が未発表のときに案内する、日本ローイング協会の大会日程ページ
const JARA_CALENDAR_URL = "https://www.jara.or.jp/race/current/";

// 「全日本選手権大会」(2022年まで)と「全日本ローイング選手権大会」(2023年から)。
// 大学・社会人・新人・軽量級の各選手権は「全日本」と「選手権」の間に区分名が入るので一致しない
const isAllJapanChampionship = (name: string) => /全日本(ローイング)?選手権/.test(name);

// この記事が案内している大会(data/schedule.json の全日本選手権の行)。年度が変わったら schedule.json を更新する
const edition = (scheduleJson.competitions as ScheduledCompetition[]).find((c) => c.category === "全日本選手権")!;
const EDITION_YEAR = Number(edition.start.slice(0, 4));
const venueLabel = edition.venue === "海の森" ? "東京・海の森水上競技場" : edition.venue === "戸田" ? "埼玉・戸田ボートコース" : edition.venue;
const eventDays = Math.round((Date.parse(`${edition.end}T00:00:00Z`) - Date.parse(`${edition.start}T00:00:00Z`)) / 86400000) + 1;

// 年別の結果記事。slug の年で新しい順に並べる(記事を足せばここに自動で載る)
const resultsArticlePattern = /^all-japan-championship-(\d{4})-results$/;
const resultsArticles = articles
  .map((a) => ({ article: a, year: Number(a.slug.match(resultsArticlePattern)?.[1] ?? 0) }))
  .filter((a) => a.year > 0)
  .sort((a, b) => b.year - a.year);

// 表の並び: 男子 → 女子 → 軽量級 → パラ。同じ性別の中はスカル → スイープ → 大きい艇の順
const eventOrder = [
  "男子シングルスカル",
  "男子ダブルスカル",
  "男子クォドルプル",
  "男子ペア",
  "男子舵手つきペア",
  "男子フォア",
  "男子舵手つきフォア",
  "男子エイト",
  "女子シングルスカル",
  "女子ダブルスカル",
  "女子クォドルプル",
  "女子舵手つきクォドルプル",
  "女子ペア",
  "女子舵手つきフォア",
  "女子エイト",
  "軽量級男子ダブルスカル",
  "軽量級男子ペア",
  "軽量級女子ダブルスカル",
  "軽量級女子ペア",
  "PR1 男子シングルスカル",
  "PR1 女子シングルスカル",
  "PR3 男子ペア"
];
const eventIndex = (name: string) => {
  const i = eventOrder.indexOf(name);
  return i === -1 ? 99 : i;
};

// 軽量級・パラ種目は「軽量級男子…」「PR1 男子…」なので、先頭ではなく含むかで男女を分ける
type Gender = "男子" | "女子";
// isStudentOrganization は高校・中学も学生側に入れるので、大学と高校を分けるための判定
const isHighSchool = (organization: string) => /高校|高等学校|高$|学園|中学|中等/.test(organization);
const isUniversity = (organization: string) => isStudentOrganization(organization) && !isHighSchool(organization);
const genderOf = (event: string): Gender | null => (event.includes("男子") ? "男子" : event.includes("女子") ? "女子" : null);

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

function OrgLink({ name }: { name: string }) {
  return <Link href={`/organizations/${organizationSlug(name)}`}>{name}</Link>;
}

function CrewCell({ row }: { row: ResultRecord }) {
  return row.crew_name !== row.organization ? (
    <span>
      {row.crew_name}(<OrgLink name={row.organization} />)
    </span>
  ) : (
    <OrgLink name={row.organization} />
  );
}

// 回数の多い順の上位3。3位と同じ回数の団体は名前順で落とさず全部挙げる
function topThreeWithTies<T>(ranking: T[], count: (item: T) => number): T[] {
  if (ranking.length <= 3) return ranking;
  const third = count(ranking[2]);
  return ranking.filter((item) => count(item) >= third);
}

// 歴代優勝の「回数が多い順に〜です」の並び
function WinnerCounts({ leaders }: { leaders: [string, number[]][] }) {
  return (
    <>
      {leaders.map(([org, ys], i) => (
        <span key={org}>
          {i > 0 ? "、" : ""}
          <OrgLink name={org} />が{ys.length}回({[...ys].sort().map((y) => `${y}年`).join("・")})
        </span>
      ))}
    </>
  );
}

// 歴代優勝の表(年・優勝・タイム、新しい年から)
function HistoryTable({ rows }: { rows: ResultRecord[] }) {
  return (
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
          {rows.map((r) => (
            <tr key={r.year} className={articleTr}>
              <td data-label="年" className={`${articleTd} ${articleTdYear}`}>
                <Link href={`/results/${r.year}`}>{r.year}</Link>
              </td>
              <td data-label="優勝" className={articleTd}>
                <CrewCell row={r} />
              </td>
              <td data-label="タイム" className={articleTd}>{r.time_display}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function gapText(winner: ResultRecord, second: ResultRecord | undefined): string {
  if (!second || winner.time_seconds <= 0 || second.time_seconds <= 0) return "—";
  return `${(second.time_seconds - winner.time_seconds).toFixed(2)}秒`;
}

// 大会当日は結果が種目ごとに少しずつ取り込まれる。今年の分は、前回と同じ種目すべてに
// Final A の優勝が揃うまで集計に入れない(途中の年が「最新年」として表や本文に出ないように)
function withCompleteEdition(rows: ResultRecord[]): ResultRecord[] {
  const winnersIn = (year: number) =>
    new Set(rows.filter((r) => r.year === year && r.final_group === "Final A" && r.rank === 1).map((r) => r.event_name));
  const prevYear = Math.max(...rows.filter((r) => r.year < EDITION_YEAR).map((r) => r.year));
  const done = winnersIn(EDITION_YEAR);
  const complete = done.size > 0 && [...winnersIn(prevYear)].every((event) => done.has(event));
  return complete ? rows : rows.filter((r) => r.year !== EDITION_YEAR);
}

export default async function AllJapanChampionshipGuide() {
  const rows = withCompleteEdition((await allResults()).filter((r) => isAllJapanChampionship(r.competition_name)));
  const finalA = rows.filter((r) => r.final_group === "Final A");
  const golds = finalA.filter((r) => r.rank === 1);

  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
  const firstYear = years[0];
  const latestYear = years[years.length - 1];
  const missingYears: number[] = [];
  for (let y = firstYear; y <= latestYear; y += 1) if (!years.includes(y)) missingYears.push(y);
  const latestCompetition = rows.find((r) => r.year === latestYear)!.competition_name;
  const awaitingResults = latestYear < EDITION_YEAR;
  const latestResultsHref = `/results/${latestYear}/${encodeURIComponent(latestCompetition)}`;
  const searchHref = `/search?${new URLSearchParams({ competition_category: "全日本選手権" }).toString()}`;

  // 大会名に「ローイング」が入った最初の年(協会の改称に合わせて大会名が変わった)
  const rowingNamedYears = rows.filter((r) => r.competition_name.includes("ローイング")).map((r) => r.year);
  const firstRowingYear = rowingNamedYears.length > 0 ? Math.min(...rowingNamedYears) : null;
  // 全日本大学選手権と合併開催だった年(大会名に「大学選手権」を含む)
  const mergedYears = Array.from(new Set(rows.filter((r) => r.competition_name.includes("大学選手権")).map((r) => r.year))).sort();

  // 年ごとの Final A 種目数
  const eventCountsByYear = years.map((y) => new Set(finalA.filter((r) => r.year === y).map((r) => r.event_name)).size);
  const eventCountMin = Math.min(...eventCountsByYear);
  const eventCountMax = Math.max(...eventCountsByYear);
  const events = Array.from(new Set(finalA.map((r) => r.event_name))).sort((a, b) => eventIndex(a) - eventIndex(b));

  // ---- 直近大会の種目別優勝と2位との差 ----
  const latestEvents = events.filter((e) => finalA.some((r) => r.year === latestYear && r.event_name === e));
  const latestChamps = latestEvents.flatMap((event) => {
    const list = finalA.filter((r) => r.year === latestYear && r.event_name === event);
    const winner = list.find((r) => r.rank === 1);
    const second = list.find((r) => r.rank === 2);
    return winner ? [{ event, winner, second }] : [];
  });
  const prevYear = years[years.length - 2];
  const latestRows = latestChamps.map(({ event, winner, second }) => {
    const prev = golds.find((r) => r.year === prevYear && r.event_name === event);
    return {
      event,
      href: `/results/${latestYear}/${encodeURIComponent(latestCompetition)}/${encodeURIComponent(event)}`,
      winner,
      second,
      close: !!second && second.time_seconds > 0 && winner.time_seconds > 0 && second.time_seconds - winner.time_seconds < 1,
      prev,
      defended: !!prev && prev.organization === winner.organization
    };
  });
  const latestUnivWins = latestChamps.filter(({ winner }) => isUniversity(winner.organization)).length;

  // ---- 団体別の優勝回数(全期間、男女別) ----
  const orgRankings = (["男子", "女子"] as const).map((gender) => {
    const list = golds.filter((r) => genderOf(r.event_name) === gender);
    const winsByOrg = new Map<string, ResultRecord[]>();
    list.forEach((r) => winsByOrg.set(r.organization, [...(winsByOrg.get(r.organization) ?? []), r]));
    const ranking = [...winsByOrg.entries()]
      .map(([org, wins]) => ({ org, count: wins.length, events: new Set(wins.map((r) => r.event_name)).size }))
      .sort((a, b) => b.count - a.count || a.org.localeCompare(b.org, "ja"));
    // 上位10を目安に、10位と同じ回数の団体は名前順で落とさず全部載せる。
    // 同数が多すぎて12団体を超えるときは、その回数の手前で切る
    const cutoff = ranking[Math.min(9, ranking.length - 1)]?.count ?? 0;
    const withTies = ranking.filter((o) => o.count >= cutoff);
    // 本文で名前を挙げるのは上位3団体。3位と同じ回数の団体が続くときは、その回数の手前までを名前で挙げ、
    // 同数の団体は数でまとめる(名前順で1つだけ選ばない)
    const third = ranking[2]?.count ?? 0;
    const tiedAtThird = ranking.length > 3 && ranking[3].count === third;
    return {
      gender,
      total: list.length,
      university: list.filter((r) => isUniversity(r.organization)).length,
      highSchool: list.filter((r) => isStudentOrganization(r.organization) && isHighSchool(r.organization)).length,
      eventCount: new Set(list.map((r) => r.event_name)).size,
      orgCount: ranking.length,
      top: withTies.length <= 12 ? withTies : ranking.filter((o) => o.count > cutoff),
      leaders: tiedAtThird ? ranking.filter((o) => o.count > third) : ranking.slice(0, 3),
      tied: tiedAtThird ? { count: third, orgs: ranking.filter((o) => o.count === third).length } : null
    };
  });
  // 男女の図を横に並べるので、棒の物差しは両方で揃える
  const topCount = Math.max(1, ...orgRankings.map((g) => g.top[0]?.count ?? 0));

  // ---- 男女エイトの歴代優勝 ----
  const eventHistory = (event: string) => {
    const list = golds.filter((r) => r.event_name === event).sort((a, b) => b.year - a.year);
    const counts = new Map<string, number[]>();
    list.forEach((r) => counts.set(r.organization, [...(counts.get(r.organization) ?? []), r.year]));
    const ranking = [...counts.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ja"));
    return { list, leaders: topThreeWithTies(ranking, ([, ys]) => ys.length) };
  };
  const menEight = eventHistory("男子エイト");
  const womenEight = eventHistory("女子エイト");

  // ---- 種目別の優勝タイムの幅 ----
  const timeRanges = events.map((event) => {
    const timed = golds.filter((r) => r.event_name === event && r.time_seconds > 0);
    const fastest = timed.reduce((a, b) => (b.time_seconds < a.time_seconds ? b : a));
    const slowest = timed.reduce((a, b) => (b.time_seconds > a.time_seconds ? b : a));
    const heldYears = golds.filter((r) => r.event_name === event).map((r) => r.year);
    return {
      event,
      fastest,
      slowest,
      span: slowest.time_seconds - fastest.time_seconds,
      editions: heldYears.length,
      from: Math.min(...heldYears),
      to: Math.max(...heldYears)
    };
  });
  // 幅の大小を本文で挙げるのは、収録している全大会で行われている種目だけ(数大会しかない種目は除く)
  const everyYearRanges = timeRanges.filter((t) => t.editions === years.length);
  const widestRange = [...everyYearRanges].sort((a, b) => b.span - a.span)[0];
  const narrowestRange = [...everyYearRanges].sort((a, b) => a.span - b.span)[0];
  // 最新年の Final A にない種目(過去にだけ行われた種目)
  const retiredEvents = timeRanges.filter((t) => t.to < latestYear);
  // 軽量級・パラローイング種目を収録している年。連続する年は「2022年以降」のようにまとめる
  const yearsWithEvent = (test: (event: string) => boolean) =>
    Array.from(new Set(golds.filter((r) => test(r.event_name)).map((r) => r.year))).sort((a, b) => a - b);
  const describeYears = (list: number[]): string => {
    if (list.length === 0) return "";
    const tail = list.filter((y, i) => y === latestYear - (list.length - 1 - i));
    const head = list.slice(0, list.length - tail.length);
    return [...head.map((y) => `${y}年`), tail.length > 0 ? `${tail[0]}年以降` : ""].filter(Boolean).join("と");
  };
  const lightweightYears = describeYears(yearsWithEvent((e) => e.startsWith("軽量級")));
  const paraYears = describeYears(yearsWithEvent((e) => e.startsWith("PR")));

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
        <span>全日本ローイング選手権とは</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt)}</time>
            {meta.updatedAt ? <>(<time dateTime={meta.updatedAt}>{formatDate(meta.updatedAt)}</time>更新)</> : null} · レガッタナビ編集
          </p>
          <h1>全日本ローイング選手権とは</h1>
          <p className="lp-lead">
            全日本ローイング選手権は、日本ローイング協会が主催するローイング（ボート）の日本一決定戦です。大学や高校のクルーと、社会人の企業チームやクラブが同じ種目で競います。{EDITION_YEAR}年の{edition.name.replace(/全日本.*$/, "大会")}は{formatDateRange(edition.start, edition.end)}に{edition.venue}で{awaitingResults ? "開かれます" : "開かれました"}。
            {awaitingResults ? null : (
              <>
                次の{EDITION_YEAR + 1}年大会の日程は未発表で、決まり次第、
                <a href={JARA_CALENDAR_URL} target="_blank" rel="noopener noreferrer">
                  日本ローイング協会の大会日程
                </a>
                に載ります。
              </>
            )}
            {latestYear}年の優勝クルーは<a href="#results">種目別の表</a>に、歴代の優勝回数は<a href="#organizations">団体別の集計</a>に載せています(収録は{firstYear}〜{latestYear}年の{years.length}大会)。
          </p>
        </header>

        <h2 id="overview">全日本ローイング選手権の日程・会場・出場資格</h2>
        <p>
          正式名称は「{edition.name.replace(/^第\d+回/, "")}」。主催は日本ローイング協会で、{EDITION_YEAR}年の{edition.name.replace(/全日本.*$/, "大会")}は{formatDateRange(edition.start, edition.end)}の{eventDays}日間、{venueLabel}で{awaitingResults ? "開かれます" : "開かれました"}。距離は2000mです。
        </p>
        <p>
          出場に年齢や所属の区分はなく、
          <a href={JARA_BULLETIN_URL} target="_blank" rel="noopener noreferrer">
            開催要項(PDF)
          </a>
          では日本に居住し、日本ローイング協会に選手登録をしている選手が対象です(国籍は問いません)。
          <Link href="/articles/university-championship-guide">インカレ</Link>は大学、
          <Link href="/articles/freshman-championship-guide">新人選手権</Link>は新人に出場が限られますが、この大会では大学と社会人のクルーが同じ種目に出ます。
        </p>

        <h2 id="how-to-read">結果・競漕日程の見方</h2>
        <ul>
          <li>
            大会中の速報は
            <a href={JARA_RESULTS_URL} target="_blank" rel="noopener noreferrer">
              レース結果(日本ローイング協会)
            </a>
            、組み合わせと発艇時刻は
            <a href={JARA_SCHEDULE_URL} target="_blank" rel="noopener noreferrer">
              競漕日程
            </a>
            、アクセスや注意事項は
            <a href={JARA_EVENT_URL} target="_blank" rel="noopener noreferrer">
              大会ページ
            </a>
            にあります。
          </li>
          <li>
            {awaitingResults ? (
              <>
                当サイトへの反映は大会後です。それまでは<Link href={latestResultsHref}>{latestYear}年大会の結果ページ</Link>
                で前回の着順とタイムを確認できます。
              </>
            ) : (
              <>
                {latestYear}年大会の結果は当サイトに収録済みで、全着順は<Link href={latestResultsHref}>結果ページ</Link>にあります。
              </>
            )}
          </li>
          <li>
            この記事で「優勝」と書くのはFinal A(決勝の最上位グループ)の1位です。種目名や決勝の区分は
            <Link href="/articles/rowing-glossary">ローイング用語集</Link>で確認できます。
          </li>
        </ul>

        <h2 id="events">種目と出場条件</h2>
        <p>
          {BULLETIN_YEAR}年の要項の種目は、男子が9種目、女子が8種目、パラローイングが3種目の計20種目です。収録データの{latestYear}年のFinal Aは{latestEvents.length}種目で、要項にあるPR1女子シングルスカルはレース結果がありません。
        </p>
        <p>
          パラローイング種目を除くシングルスカル・ダブルスカル・ペアには出場の基準となる<Link href="/articles/rowing-glossary">エルゴ</Link>(2000m)の公式タイムがあり、オープンのダブルスカルとペアは男子6分40秒・女子7分50秒、軽量級とシングルスカルは男子6分50秒・女子8分00秒未満が条件です。軽量級種目には体重の上限(漕手の平均が男子70kg・女子57kg以下、個人は男子72.5kg・女子59kg以下)があります。
        </p>

        <h2 id="results">{latestYear}年の結果(種目別の優勝クルー)</h2>
        <p>
          表は直近の{latestCompetition}の種目別の優勝クルーと2位との差で、太字は1秒未満の差です。{latestEvents.length}種目のうち大学のクルーが優勝したのは{latestUnivWins}種目でした。全着順は<Link href={latestResultsHref}>{latestYear}年大会の結果ページ</Link>にあります。
          {resultsArticles[0] && resultsArticles[0].year === latestYear ? (
            <>
              種目別の詳しい振り返りは<Link href={`/articles/${resultsArticles[0].article.slug}`}>{latestYear}年大会の結果記事</Link>に。
            </>
          ) : null}
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>優勝クルーとタイム</th>
                <th scope="col" className={articleTh}>2位との差</th>
                <th scope="col" className={articleTh}>前年の優勝</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {latestRows.map((r) => (
                <tr key={r.event} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>
                    <span>
                      <Link href={r.href}>{r.event}</Link>
                    </span>
                  </td>
                  <td data-label="優勝クルーとタイム" className={articleTd}>
                    <span>
                      <CrewCell row={r.winner} /> {r.winner.time_display}
                    </span>
                  </td>
                  <td data-label="2位との差" className={r.close ? `${articleTd} ${articleTdYear}` : articleTd}>
                    {gapText(r.winner, r.second)}
                  </td>
                  <td data-label="前年の優勝" className={articleTd}>
                    <span>
                      {r.prev ? <OrgLink name={r.prev.organization} /> : "—"}
                      {r.defended ? <span className="ml-1.5 font-bold text-rn-text">連覇</span> : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="organizations">優勝回数の多い団体({firstYear}〜{latestYear}年)</h2>
        <p>
          全種目のFinal A優勝{golds.length}件を団体別に数えます。
        </p>
        <div className={articleEraGrid}>
          {orgRankings.map((g) => (
            <div className={articleEraCard} key={g.gender}>
              <h3 className={articleEraCardTitle}>
                {g.gender}(全{g.total}件・{g.orgCount}団体)
              </h3>
              <div className={articleChart} role="img" aria-label={`${g.gender}の団体別Final A優勝回数 上位${g.top.length}`}>
                {g.top.map((o) => (
                  <div className={articleBarRow} key={o.org}>
                    <span className={articleBarLabel}>{o.org.replace(/大学$/, "大")}</span>
                    <span className={articleBarTrack}>
                      <span className={articleBarFill} style={{ width: `${(o.count / topCount) * 100}%` }} />
                    </span>
                    <span className={articleBarValue}>{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p>
          {orgRankings.map((g) => (
            <span key={g.gender}>
              {g.gender}の上位は
              {g.leaders.map((o, i) => (
                <span key={o.org}>
                  {i > 0 ? "、" : ""}
                  <OrgLink name={o.org} />の{o.count}回
                </span>
              ))}
              {g.tied ? `で、${g.tied.count}回の${g.tied.orgs}団体が続きます。` : "。"}
            </span>
          ))}
          優勝を所属で分けると、
          {orgRankings.map((g, gi) => (
            <span key={g.gender}>
              {gi > 0 ? "、" : ""}
              {g.gender}は{g.total}件のうち大学が{g.university}件・{g.highSchool > 0 ? `高校が${g.highSchool}件・` : ""}社会人が{g.total - g.university - g.highSchool}件
            </span>
          ))}
          です(団体名の表記から機械的に分けたもので、正式な区分ではありません)。
        </p>

        <h2 id="men-eight">男子エイトの歴代優勝({firstYear}〜{latestYear}年)</h2>
        <p>
          収録している{menEight.list.length}大会の優勝は、回数が多い順に
          <WinnerCounts leaders={menEight.leaders} />
          です。
        </p>
        <HistoryTable rows={menEight.list} />

        <h2 id="women-eight">女子エイトの歴代優勝({firstYear}〜{latestYear}年)</h2>
        <p>
          収録している{womenEight.list.length}大会の優勝は、回数が多い順に
          <WinnerCounts leaders={womenEight.leaders} />
          です。
        </p>
        <HistoryTable rows={womenEight.list} />
        <p>
          ほかの種目の歴代優勝は、<Link href={searchHref}>記録検索で全日本選手権に絞り込み</Link>、種目と順位(1位)を選ぶと年ごとに並びます。
        </p>

        <h2 id="time-ranges">種目別の優勝タイムの幅</h2>
        <p>
          同じ種目でも優勝タイムは年によって大きく動きます。収録している{years.length}大会すべてで行われている{everyYearRanges.length}種目では、幅がいちばん大きいのは{widestRange.event}で、{widestRange.fastest.time_display}({widestRange.fastest.year}年)から{widestRange.slowest.time_display}({widestRange.slowest.year}年)まで{Math.round(widestRange.span)}秒。いちばん小さい{narrowestRange.event}は{Math.round(narrowestRange.span)}秒です。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>最速の優勝(年)</th>
                <th scope="col" className={articleTh}>最も遅い優勝(年)</th>
                <th scope="col" className={articleTh}>幅</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {timeRanges.map((t) => (
                <tr key={t.event} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>
                    {t.event}
                    {t.editions < years.length ? `(${t.from === t.to ? `${t.from}年` : `${t.from}〜${t.to}年`}の${t.editions}大会)` : ""}
                  </td>
                  <td data-label="最速の優勝(年)" className={articleTd}>
                    <span>
                      {t.fastest.time_display} <OrgLink name={t.fastest.organization} />(<Link href={`/results/${t.fastest.year}`}>{t.fastest.year}年</Link>)
                    </span>
                  </td>
                  <td data-label="最も遅い優勝(年)" className={articleTd}>
                    <span>
                      {t.slowest.time_display}(<Link href={`/results/${t.slowest.year}`}>{t.slowest.year}年</Link>)
                    </span>
                  </td>
                  <td data-label="幅" className={articleTd}>{Math.round(t.span)}秒</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resultsArticles.length > 0 ? (
          <>
            <h2 id="yearly-articles">年別の結果記事</h2>
            <p>大会ごとの結果は、種目別の優勝クルーとタイム、2位との差まで記事にまとめています。</p>
            <ul>
              {resultsArticles.map(({ article, year }) => (
                <li key={article.slug}>
                  <Link href={`/articles/${article.slug}`}>{year}年大会の結果</Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <h2 id="search">結果・歴代記録を検索する</h2>
        <p>
          <Link href={searchHref}>記録検索で全日本選手権に絞り込む</Link>
          と年・種目・団体を組み合わせて探せます。各団体の成績は<Link href="/organizations">団体別ページ</Link>
          に、全日本選手権に限らない種目別の歴代最速は<Link href="/records">歴代記録</Link>にまとめてあります。
        </p>
        <p>
          各年の全着順は、年ごとの結果ページ(
          {[...years].reverse().map((y, i) => (
            <span key={y}>
              {i > 0 ? "、" : ""}
              <Link href={`/results/${y}`}>{y}年</Link>
            </span>
          ))}
          )にあります。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>優勝はFinal Aの1位。収録範囲はFinal B以上で、予選・準決勝・敗者復活戦は含みません。</li>
            {firstRowingYear ? (
              <li>
                大会名は{firstRowingYear - 1}年まで「全日本選手権大会」、{firstRowingYear}年から「全日本ローイング選手権大会」です(日本ボート協会が日本ローイング協会に改称したのに合わせたもの)。この記事ではどちらも同じ大会として数えています。
              </li>
            ) : null}
            <li>
              Final Aの種目数は年によって{eventCountMin}〜{eventCountMax}種目です。
              {lightweightYears ? `軽量級種目は${lightweightYears}、` : ""}
              {paraYears ? `パラローイング種目は${paraYears}に収録があります。` : ""}
              {retiredEvents.length > 0
                ? `${retiredEvents.map((t) => `${t.event}(〜${t.to}年)`).join("と")}は${latestYear}年の種目にはありません。`
                : ""}
              {missingYears.length > 0 ? `${missingYears.map((y) => `${y}年`).join("・")}の大会は収録していないため、歴代表と集計から外れています。` : null}
            </li>
            {mergedYears.length > 0 ? (
              <li>
                {mergedYears.map((y) => `${y}年`).join("・")}の大会は全日本大学選手権との合併開催で、この記事では全日本選手権の回に数えています。記録検索の大会区分では「全日本大学選手権」に入ります。
              </li>
            ) : null}
            <li>
              団体名は収録データの表記のままです。同じ企業でも事業所やチーム名が違う年は別の団体として数えています(関西電力と関西電力美浜、NTT東日本とNTT東日本東京、明治安田生命と明治安田など)。「○○混成」は複数の団体で組んだクルーで、優勝回数では別の団体として数え、団体ページも混成クルーの名前で分かれています。大学・高校と社会人の内訳は団体名の表記から機械的に振り分けたものです。
            </li>
            <li>日程・会場・出場資格・種目は日本ローイング協会の大会ページと開催要項({BULLETIN_CHECKED}時点)によります。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
