import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug, type ResultRecord } from "../../../lib/results-data";
import { articles, getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import { ogImages } from "../../../lib/og-image";
import { articleOg } from "../../../lib/og-targets";
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

const meta = getArticle("freshman-championship-guide")!;

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

// 2026年大会の一次情報(日本ローイング協会の大会ページと開催要項、2026-10-22 確認)
const JARA_EVENT_URL = "https://www.jara.or.jp/race/current/2026freshman.html";
const JARA_BULLETIN_URL = "https://www.jara.or.jp/race/current/2026freshman_bulletin.pdf";
const JARA_SCHEDULE_URL = "https://www.jara.or.jp/race/current/2026freshman_tt.html";
const JARA_RESULTS_URL = "https://www.jara.or.jp/raceresult/domestic/67freshman/67freshman.htm";

const isFreshmanChampionship = (name: string) => name.includes("新人");

// この記事が案内している大会の年。収録データの最新年がこれより前なら「結果は大会後に反映」の案内を出す
const EDITION_YEAR = 2026;

// 年別の結果記事。slug の年で新しい順に並べる(記事を足せばここに自動で載る)
const resultsArticlePattern = /^freshman-championship-(\d{4})-results$/;
const resultsArticles = articles
  .map((a) => ({ article: a, year: Number(a.slug.match(resultsArticlePattern)?.[1] ?? 0) }))
  .filter((a) => a.year > 0)
  .sort((a, b) => b.year - a.year);

const eventOrder = [
  "男子エイト",
  "男子舵手つきフォア",
  "男子ダブルスカル",
  "男子シングルスカル",
  "女子舵手つきクォドルプル",
  "女子ダブルスカル",
  "女子シングルスカル"
];
const eventIndex = (name: string) => {
  const i = eventOrder.indexOf(name);
  return i === -1 ? 99 : i;
};

type Kind = "大学" | "高校" | "社会人など";
// 優勝クルーの所属を大学・高校・それ以外(社会人クラブ・企業・混成など)に分ける
function affiliationKind(organization: string): Kind {
  if (/高校|学園|高$/.test(organization)) return "高校";
  if (/大学|大$/.test(organization)) return "大学";
  return "社会人など";
}

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

function gapText(winner: ResultRecord, second: ResultRecord | undefined): string {
  if (!second || winner.time_seconds <= 0 || second.time_seconds <= 0) return "—";
  return `${(second.time_seconds - winner.time_seconds).toFixed(2)}秒`;
}

// 同じ団体が続けて優勝した最長の回数(収録の無い年をまたいだ場合も続きとして数える)
function longestStreak(wins: { year: number; organization: string }[]): { organization: string; count: number; lastYear: number } {
  const sorted = [...wins].sort((a, b) => a.year - b.year);
  let best = { organization: sorted[0]?.organization ?? "", count: sorted.length > 0 ? 1 : 0, lastYear: sorted[0]?.year ?? 0 };
  let current = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    current = sorted[i].organization === sorted[i - 1].organization ? current + 1 : 1;
    if (current > best.count) best = { organization: sorted[i].organization, count: current, lastYear: sorted[i].year };
  }
  return best;
}

export default async function FreshmanChampionshipGuide() {
  const rows = (await allResults()).filter((r) => isFreshmanChampionship(r.competition_name));
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
  const searchHref = `/search?${new URLSearchParams({ competition_category: "全日本新人選手権" }).toString()}`;

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
  const closeFinalsLatest = latestRows.filter((r) => r.close).length;
  const menEvents = latestEvents.filter((e) => e.startsWith("男子"));
  const womenEvents = latestEvents.filter((e) => e.startsWith("女子"));

  // ---- 団体別の優勝回数(全期間、男女別) ----
  // 男子と女子は種目も勝つ団体も違うので、団体の比較は男女で分けて数える
  const orgRankings = (["男子", "女子"] as const).map((gender) => {
    const list = golds.filter((r) => r.event_name.startsWith(gender));
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
      eventCount: new Set(list.map((r) => r.event_name)).size,
      orgCount: ranking.length,
      top: withTies.length <= 12 ? withTies : ranking.filter((o) => o.count > cutoff),
      leaders: tiedAtThird ? ranking.filter((o) => o.count > third) : ranking.slice(0, 3),
      tied: tiedAtThird ? { count: third, orgs: ranking.filter((o) => o.count === third).length } : null
    };
  });
  // 男女の図を横に並べるので、棒の物差しは両方で揃える
  const topCount = Math.max(1, ...orgRankings.map((g) => g.top[0]?.count ?? 0));

  // ---- 種目ごとの勢力図 ----
  const eventPower = events.map((event) => {
    const wins = golds.filter((r) => r.event_name === event);
    const byOrg = new Map<string, number>();
    wins.forEach((r) => byOrg.set(r.organization, (byOrg.get(r.organization) ?? 0) + 1));
    const [topOrg, topWins] = [...byOrg.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))[0];
    return { event, orgs: byOrg.size, topOrg, topWins, streak: longestStreak(wins) };
  });
  const bestStreak = [...eventPower].sort((a, b) => b.streak.count - a.streak.count)[0];

  // ---- 所属別の優勝(年ごと) ----
  const kindCounts: Record<Kind, number> = { 大学: 0, 高校: 0, 社会人など: 0 };
  golds.forEach((r) => {
    kindCounts[affiliationKind(r.organization)] += 1;
  });
  const kindByYear = years.map((year) => {
    const list = golds.filter((r) => r.year === year);
    const counts: Record<Kind, number> = { 大学: 0, 高校: 0, 社会人など: 0 };
    list.forEach((r) => {
      counts[affiliationKind(r.organization)] += 1;
    });
    return { year, counts, total: list.length };
  });
  const allUnivYears = kindByYear.filter((y) => y.counts["大学"] === y.total).map((y) => y.year);
  const nonUnivWins = golds.filter((r) => affiliationKind(r.organization) !== "大学").sort((a, b) => a.year - b.year || eventIndex(a.event_name) - eventIndex(b.event_name));
  const nonUnivEvents = new Map<string, number>();
  nonUnivWins.forEach((r) => nonUnivEvents.set(r.event_name, (nonUnivEvents.get(r.event_name) ?? 0) + 1));
  const nonUnivEventRanking = [...nonUnivEvents.entries()].sort((a, b) => b[1] - a[1]);
  const univOnlyEvents = events.filter((e) => !nonUnivEvents.has(e));
  const highSchoolOrgs = Array.from(new Set(nonUnivWins.filter((r) => affiliationKind(r.organization) === "高校").map((r) => r.organization)));
  const companyOrgs = [...new Map(
    nonUnivWins.filter((r) => affiliationKind(r.organization) === "社会人など").map((r) => [r.organization, 0] as const)
  ).keys()];

  // ---- 接戦の決勝(全期間) ----
  const allGaps = golds.flatMap((winner) => {
    const second = finalA.find((r) => r.year === winner.year && r.event_name === winner.event_name && r.rank === 2);
    if (!second || winner.time_seconds <= 0 || second.time_seconds <= 0) return [];
    return [{ winner, second, gap: second.time_seconds - winner.time_seconds }];
  });
  const closest = [...allGaps].sort((a, b) => a.gap - b.gap).slice(0, 8);
  const underOneSecond = allGaps.filter((g) => g.gap < 1).length;
  const averageGap = allGaps.reduce((sum, g) => sum + g.gap, 0) / allGaps.length;

  // ---- 男子エイトの歴代優勝 ----
  const menEight = golds.filter((r) => r.event_name === "男子エイト").sort((a, b) => b.year - a.year);
  const menEightCounts = new Map<string, number[]>();
  menEight.forEach((r) => menEightCounts.set(r.organization, [...(menEightCounts.get(r.organization) ?? []), r.year]));
  const menEightRanking = [...menEightCounts.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ja"));

  // ---- 種目別の優勝タイムの幅 ----
  const timeRanges = events.map((event) => {
    const timed = golds.filter((r) => r.event_name === event && r.time_seconds > 0);
    const fastest = timed.reduce((a, b) => (b.time_seconds < a.time_seconds ? b : a));
    const slowest = timed.reduce((a, b) => (b.time_seconds > a.time_seconds ? b : a));
    return { event, fastest, slowest, span: slowest.time_seconds - fastest.time_seconds };
  });
  const widestRange = [...timeRanges].sort((a, b) => b.span - a.span)[0];
  const narrowestRange = [...timeRanges].sort((a, b) => a.span - b.span)[0];

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
        <span>全日本新人ローイング選手権とは</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt)}</time>
            {meta.updatedAt ? <>(<time dateTime={meta.updatedAt}>{formatDate(meta.updatedAt)}</time>更新)</> : null} · レガッタナビ編集
          </p>
          <h1>全日本新人ローイング選手権とは</h1>
          <p className="lp-lead">
            全日本新人ローイング選手権は、例年10月から11月にかけて埼玉・戸田で3日間開かれる大会です。2026年の第67回大会は10月23日(金)から25日(日)まで。大学・高校・社会人のクルーが同じ水面で競います。この記事は、収録している{firstYear}〜{latestYear}年の{years.length}大会のデータから、直近の優勝クルーと歴代の強い団体を見ていきます。大会中の速報は
            <a href={JARA_RESULTS_URL} target="_blank" rel="noopener noreferrer">
              日本ローイング協会のレース結果
            </a>
            へ。
          </p>
        </header>

        <h2>大会の概要</h2>
        <p>
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
          で見られます。
          {awaitingResults ? (
            <>
              当サイトへの反映は大会後で、それまでは<Link href={latestResultsHref}>{latestYear}年大会の結果ページ</Link>
              で前回の着順とタイムを確認できます。
            </>
          ) : (
            <>
              {latestYear}年大会の結果は当サイトに収録済みで、全着順は<Link href={latestResultsHref}>結果ページ</Link>にあります。
            </>
          )}
          この記事で「優勝」と書くのはFinal A(決勝の最上位グループ)の1位です。種目名や決勝の区分は
          <Link href="/articles/rowing-glossary">ローイング用語集</Link>にあります。
        </p>
        <p>
          正式名称は「全日本新人ローイング選手権大会」。主催は日本ローイング協会で、会場は戸田ボートコースです。種目は2026年の
          <a href={JARA_BULLETIN_URL} target="_blank" rel="noopener noreferrer">
            開催要項(PDF)
          </a>
          では男女4種目ずつの8種目ですが、競漕日程(10月22日時点)に女子エイトはなく、行われるのは男子4種目と女子3種目の7種目です。収録データの種目も同じで、男子が
          {menEvents.map((e) => e.replace("男子", "")).join("・")}、女子が
          {womenEvents.map((e) => e.replace("女子", "")).join("・")}です。「新人」は競技歴ではなく学年と年齢で区切られています。要項では2004年4月2日以降生まれのうち、中学生・高校生、大学の団体に属して2025年度以降に入学した選手、一般の団体に属して2024年度以降に高校を卒業した選手(2021年度以降の中学卒業も可)が対象です。
          <Link href="/articles/university-championship-guide">インカレ</Link>と違い、高校や社会人のクラブ・企業チーム、複数の団体で組む混成クルーも同じ種目に出ます。
        </p>

        <h2>{latestYear}年の種目別優勝クルー</h2>
        <p>
          直近の{latestCompetition}から、種目ごとの優勝クルーと2位との差を並べます。
          {closeFinalsLatest > 0 ? `${latestYear}年は${latestEvents.length}種目のうち${closeFinalsLatest}種目が1秒未満の差でした。` : `${latestYear}年は1秒未満の差になった種目がありませんでした。`}
          前年と同じ団体が勝った種目には「連覇」を付けています。全着順は<Link href={latestResultsHref}>{latestYear}年大会の結果ページ</Link>にあります。
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
                <th scope="col" className={articleTh}>優勝</th>
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
                  <td data-label="優勝" className={articleTd}>
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

        <h2>男子エイトの歴代優勝({firstYear}〜{latestYear}年)</h2>
        <p>
          漕手8人と舵手が乗る男子エイトの優勝クルーを並べます。収録している{menEight.length}大会で、回数が多い順に
          {menEightRanking.slice(0, 3).map(([org, ys], i) => (
            <span key={org}>
              {i > 0 ? "、" : ""}
              <OrgLink name={org} />が{ys.length}回({[...ys].sort().map((y) => `${y}年`).join("・")})
            </span>
          ))}
          です。
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
                  <td data-label="優勝" className={articleTd}>
                    <OrgLink name={r.organization} />
                  </td>
                  <td data-label="タイム" className={articleTd}>{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          男子エイト以外の種目も含めた各年の全着順は、年ごとの結果ページ(
          {[...years].reverse().map((y, i) => (
            <span key={y}>
              {i > 0 ? "、" : ""}
              <Link href={`/results/${y}`}>{y}年</Link>
            </span>
          ))}
          )にあります。
        </p>

        <h2>優勝回数の多い団体({firstYear}〜{latestYear}年)</h2>
        <p>
          全種目のFinal A優勝{golds.length}件を団体別に数えます。男子と女子では種目も勝つ団体も違うので、分けて並べました。混成クルーは別の団体として数えています。
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
          何種目で勝ったかを見ると、
          {orgRankings.map((g, gi) => (
            <span key={g.gender}>
              {gi > 0 ? "、" : ""}
              {g.gender}の{g.top[0].org}は{g.eventCount}種目のうち{g.top[0].events}種目
            </span>
          ))}
          で優勝しています。
        </p>

        <h2>種目別の優勝団体数と連続優勝</h2>
        <p>
          種目別に優勝した団体の数と、最多優勝、最長の連続優勝を並べました。優勝団体が少ない種目ほど特定の団体が強く、多い種目ほど毎年顔ぶれが変わっています。最長の連続優勝は{bestStreak.event}の<OrgLink name={bestStreak.streak.organization} />
          で、{bestStreak.streak.lastYear}年まで{bestStreak.streak.count}大会続きました。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>優勝団体数</th>
                <th scope="col" className={articleTh}>最多優勝</th>
                <th scope="col" className={articleTh}>最長の連続優勝</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {eventPower.map((p) => (
                <tr key={p.event} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{p.event}</td>
                  <td data-label="優勝団体数" className={articleTd}>{p.orgs}団体</td>
                  <td data-label="最多優勝" className={articleTd}>
                    <span>
                      <OrgLink name={p.topOrg} />({p.topWins}回)
                    </span>
                  </td>
                  <td data-label="最長の連続優勝" className={articleTd}>
                    <span>
                      {p.streak.count >= 2 ? (
                        <>
                          <OrgLink name={p.streak.organization} />({p.streak.count}大会、〜{p.streak.lastYear}年)
                        </>
                      ) : (
                        "なし"
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>大学以外の優勝</h2>
        <p>
          優勝{golds.length}件を所属で分けると、大学が{kindCounts["大学"]}件、社会人のクラブ・企業や混成クルーなどが{kindCounts["社会人など"]}件、高校が{kindCounts["高校"]}件です(団体名の表記から機械的に分けたもので、正式な区分ではありません)。大学以外の優勝{nonUnivWins.length}件は
          {nonUnivEventRanking.slice(0, 3).map(([event, n], i) => (
            <span key={event}>
              {i > 0 ? "、" : ""}
              {event}が{n}件
            </span>
          ))}
          {univOnlyEvents.length > 0 ? `に集中していて、${univOnlyEvents.join("と")}では大学以外の優勝がありません。` : "です。"}全{events.length}種目を大学が独占した年は
          {allUnivYears.length > 0 ? `${allUnivYears.map((y) => `${y}年`).join("・")}の${allUnivYears.length}回` : "ありません"}。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>年</th>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>優勝</th>
                <th scope="col" className={articleTh}>タイム</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {[...nonUnivWins].reverse().map((r) => (
                <tr key={`${r.year}-${r.event_name}`} className={articleTr}>
                  <td data-label="年" className={`${articleTd} ${articleTdYear}`}>
                    <Link href={`/results/${r.year}`}>{r.year}</Link>
                  </td>
                  <td data-label="種目" className={articleTd}>{r.event_name}</td>
                  <td data-label="優勝" className={articleTd}>
                    <CrewCell row={r} />
                  </td>
                  <td data-label="タイム" className={articleTd}>{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          高校で優勝したのは{highSchoolOrgs.length}校({highSchoolOrgs.join("、")})。社会人のクラブ・企業と混成クルーは{companyOrgs.length}団体({companyOrgs.join("、")})です。
        </p>

        <h2>接戦だった決勝</h2>
        <p>
          Final Aの1位と2位の差を全{allGaps.length}レースで見ると、平均は{averageGap.toFixed(2)}秒、1秒未満だったのは{underOneSecond}レースです。差が小さかった順に並べます。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>差</th>
                <th scope="col" className={articleTh}>年・種目</th>
                <th scope="col" className={articleTh}>優勝</th>
                <th scope="col" className={articleTh}>2位</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {closest.map((g) => (
                <tr key={`${g.winner.year}-${g.winner.event_name}`} className={articleTr}>
                  <td data-label="差" className={`${articleTd} ${articleTdYear}`}>{g.gap.toFixed(2)}秒</td>
                  <td data-label="年・種目" className={articleTd}>
                    <span>
                      <Link href={`/results/${g.winner.year}/${encodeURIComponent(g.winner.competition_name)}/${encodeURIComponent(g.winner.event_name)}`}>
                        {g.winner.year}年 {g.winner.event_name}
                      </Link>
                    </span>
                  </td>
                  <td data-label="優勝" className={articleTd}>
                    <span>
                      <CrewCell row={g.winner} /> {g.winner.time_display}
                    </span>
                  </td>
                  <td data-label="2位" className={articleTd}>
                    <span>
                      <CrewCell row={g.second} /> {g.second.time_display}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>種目別の優勝タイムの幅</h2>
        <p>
          同じ種目でも優勝タイムは年によって大きく動きます。幅がいちばん大きいのは{widestRange.event}で、{widestRange.fastest.time_display}({widestRange.fastest.year}年)から{widestRange.slowest.time_display}({widestRange.slowest.year}年)まで{Math.round(widestRange.span)}秒。いちばん小さい{narrowestRange.event}でも{Math.round(narrowestRange.span)}秒あります。水面や風で変わるので、年をまたいだ比較は参考程度に見てください。
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
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{t.event}</td>
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
            <h2>年別の結果記事</h2>
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

        <h2>記録を検索する</h2>
        <p>
          <Link href={searchHref}>記録検索で全日本新人選手権に絞り込む</Link>
          と年・種目・団体を組み合わせて探せます。各団体の成績は<Link href="/organizations">団体別ページ</Link>
          に、新人選手権に限らない種目別の歴代最速は<Link href="/records">歴代記録</Link>にまとめてあります。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>優勝はFinal Aの1位。収録範囲はFinal B以上で、予選・敗者復活戦は含みません。</li>
            {missingYears.length > 0 ? (
              <li>{missingYears.map((y) => `${y}年`).join("・")}の大会は収録していないため、歴代表と集計から外れています。連続優勝は収録の無い年をまたいで数えています。Final Aの種目数は{eventCountMin === eventCountMax ? `毎年${eventCountMax}種目` : `年によって${eventCountMin}〜${eventCountMax}種目`}で、女子エイトは含まれていません。</li>
            ) : null}
            <li>
              「○○混成」は複数の団体で組んだクルーで、所属は収録データの表記のままです。優勝回数や連続優勝では別の団体として数え、団体ページも混成クルーの名前で分かれています。所属の内訳(大学・高校・社会人など)は団体名の表記から機械的に振り分けたもので、高校どうしの混成が「社会人など」に入ることがあります。団体名は収録データの表記のままで、関西電力は事業所ごとに別団体として数えています。
            </li>
            <li>日程・会場・出場資格は日本ローイング協会の大会ページと開催要項(2026年10月22日時点)によります。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
