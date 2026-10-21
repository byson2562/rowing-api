import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug, type ResultRecord } from "../../../lib/results-data";
import { articles, getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import { ogImages } from "../../../lib/og-image";
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
    images: ogImages("全日本新人ローイング選手権とは", "2026年の日程・種目・歴代優勝クルー")
  }
};

// 2026年大会の日程・会場・出漕資格の一次情報(日本ローイング協会の大会ページ、2026-10-21 確認)
const JARA_EVENT_URL = "https://www.jara.or.jp/race/current/2026freshman.html";
const JARA_BULLETIN_URL = "https://www.jara.or.jp/race/current/2026freshman_bulletin.pdf";

const isFreshmanChampionship = (name: string) => name.includes("新人");

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

// 優勝クルーの所属を大学・高校・それ以外(社会人クラブ・企業・混成など)に分ける
function affiliationKind(organization: string): "大学" | "高校" | "社会人など" {
  if (/高校|学園|高$/.test(organization)) return "高校";
  if (/大学|大$/.test(organization)) return "大学";
  return "社会人など";
}

function OrgLink({ name }: { name: string }) {
  return <Link href={`/organizations/${organizationSlug(name)}`}>{name}</Link>;
}

function gapText(winner: ResultRecord, second: ResultRecord | undefined): string {
  if (!second || winner.time_seconds <= 0 || second.time_seconds <= 0) return "—";
  return `${(second.time_seconds - winner.time_seconds).toFixed(2)}秒`;
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

  // 優勝クルーの所属の内訳(全期間)
  const kindCounts = { 大学: 0, 高校: 0, 社会人など: 0 };
  golds.forEach((r) => {
    kindCounts[affiliationKind(r.organization)] += 1;
  });

  // 直近大会の種目別優勝と2位との差
  const latestEvents = Array.from(new Set(finalA.filter((r) => r.year === latestYear).map((r) => r.event_name))).sort(
    (a, b) => eventIndex(a) - eventIndex(b)
  );
  const latestChamps = latestEvents.flatMap((event) => {
    const list = finalA.filter((r) => r.year === latestYear && r.event_name === event);
    const winner = list.find((r) => r.rank === 1);
    const second = list.find((r) => r.rank === 2);
    return winner ? [{ event, winner, second }] : [];
  });
  const closest = latestChamps
    .filter((c) => c.second && c.second.time_seconds > 0 && c.winner.time_seconds > 0)
    .map((c) => ({ ...c, gap: c.second!.time_seconds - c.winner.time_seconds }))
    .sort((a, b) => a.gap - b.gap)[0];
  const menEvents = latestEvents.filter((e) => e.startsWith("男子"));
  const womenEvents = latestEvents.filter((e) => e.startsWith("女子"));

  // 男子エイトの歴代優勝(新しい順)と、団体ごとの回数
  const menEight = golds.filter((r) => r.event_name === "男子エイト").sort((a, b) => b.year - a.year);
  const menEightCounts = new Map<string, number[]>();
  menEight.forEach((r) => menEightCounts.set(r.organization, [...(menEightCounts.get(r.organization) ?? []), r.year]));
  const menEightRanking = [...menEightCounts.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ja"));
  const menEightTimed = menEight.filter((r) => r.time_seconds > 0);
  const menEightFastest = menEightTimed.reduce((a, b) => (b.time_seconds < a.time_seconds ? b : a));
  const menEightSlowest = menEightTimed.reduce((a, b) => (b.time_seconds > a.time_seconds ? b : a));

  // 収録内の種目別最速(Final A、計時のある行)
  const bestByEvent = new Map<string, ResultRecord>();
  finalA.forEach((r) => {
    if (r.time_seconds <= 0) return;
    const current = bestByEvent.get(r.event_name);
    if (!current || r.time_seconds < current.time_seconds) bestByEvent.set(r.event_name, r);
  });
  const bests = [...bestByEvent.values()].sort((a, b) => eventIndex(a.event_name) - eventIndex(b.event_name));

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
            <time dateTime={meta.publishedAt}>2026年10月21日</time> · レガッタナビ編集
          </p>
          <h1>全日本新人ローイング選手権とは</h1>
          <p className="lp-lead">
            全日本新人ローイング選手権は、例年10月下旬に埼玉・戸田で3日間開かれる大会です。2026年の第67回大会は10月23日(金)から25日(日)まで。大学・高校・社会人のクルーが同じ水面で競います。この記事では、出場できる人の範囲、種目の構成、{latestYear}
            年の種目別優勝クルー、男子エイトの歴代優勝、収録内の最速タイム({firstYear}〜{latestYear}年の{years.length}大会)を載せています。
          </p>
        </header>

        <h2>どんな大会か</h2>
        <p>
          正式名称は「全日本新人ローイング選手権大会」。主催は日本ローイング協会で、会場は戸田ボートコース(サンクジャパン戸田公園漕艇場)です。
        </p>
        <p>
          「新人」は競技歴ではなく、学年と年齢で区切られています。2026年大会の要項では、2004年4月2日以降に生まれた選手のうち、中学生と高校生、大学の団体では2025年度以降に入学した選手、一般の団体では2024年度以降に高校を卒業した選手(または2021年度以降に中学を卒業した選手)が出場できます。複数の団体で組む混成クルーも認められていて、団体名の後ろに「混成」を付けて出ます。
        </p>
        <p>
          インカレ(全日本大学ローイング選手権)との大きな違いは出場クルーの顔ぶれです。大学のクルーだけでなく、高校、社会人のクラブや企業チーム、混成クルーが同じ種目に出ます。収録データのFinal A優勝{golds.length}件を所属で分けると、大学が{kindCounts["大学"]}件、社会人のクラブ・企業や混成クルーなどが{kindCounts["社会人など"]}件、高校が{kindCounts["高校"]}件でした。
        </p>
        <p>
          シングルスカルには出漕資格があり、エルゴメーター2,000mの公式タイムで男子7分10秒、女子8分10秒を切っていることが条件です。ほかの種目にこの基準はありませんが、舵手を除く全選手が公式エルゴ記録を提出する決まりです。要項や競漕日程の一次情報は
          <a href={JARA_EVENT_URL} target="_blank" rel="noopener noreferrer">
            日本ローイング協会の大会ページ
          </a>
          で確認できます。
        </p>

        <h2>種目構成</h2>
        <p>
          2026年大会の
          <a href={JARA_BULLETIN_URL} target="_blank" rel="noopener noreferrer">
            開催要項(PDF)
          </a>
          では男女4種目ずつの8種目です。男子がシングルスカル、ダブルスカル、舵手つきフォア、エイト。女子がシングルスカル、ダブルスカル、舵手つきクォドルプル、エイト。エントリーが6クルー未満の種目は実施されず、女子エイトだけは2クルー以上で実施されます。
        </p>
        <p>
          収録データの{firstYear}〜{latestYear}年は毎年{latestEvents.length}種目で、女子エイトは含まれていません。{latestYear}年大会でFinal Aが行われたのは男子が{menEvents.length}種目(
          {menEvents.map((e) => e.replace("男子", "")).join("、")})、女子が{womenEvents.length}種目(
          {womenEvents.map((e) => e.replace("女子", "")).join("、")})です。インカレにある男子のペア・フォア・クォドルプル、女子の舵手つきフォア・ペアはなく、女子のクォドルプルは舵手つきです。漕手が4人以下の艇が中心で、男子エイト(漕手8人と舵手)だけが大型艇です。
        </p>

        <h2>{latestYear}年の種目別優勝クルー</h2>
        <p>
          直近の{latestCompetition}から。
          {closest
            ? `2位との差がいちばん小さかったのは${closest.event}の${closest.gap.toFixed(2)}秒(${closest.winner.organization}と${closest.second!.organization})でした。`
            : ""}
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>優勝</th>
                <th scope="col" className={articleTh}>タイム</th>
                <th scope="col" className={articleTh}>2位との差</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {latestChamps.map(({ event, winner, second }) => (
                <tr key={event} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{event}</td>
                  <td data-label="優勝" className={articleTd}>
                    {winner.crew_name !== winner.organization ? (
                      <>
                        {winner.crew_name}(<OrgLink name={winner.organization} />)
                      </>
                    ) : (
                      <OrgLink name={winner.organization} />
                    )}
                  </td>
                  <td data-label="タイム" className={articleTd}>{winner.time_display}</td>
                  <td data-label="2位との差" className={articleTd}>{gapText(winner, second)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>男子エイトの歴代優勝({firstYear}-{latestYear})</h2>
        <p>
          収録している{menEight.length}大会の男子エイト優勝クルーを並べます。回数が多い順に
          {menEightRanking.slice(0, 3).map(([org, ys], i) => (
            <span key={org}>
              {i > 0 ? "、" : ""}
              <OrgLink name={org} />が{ys.length}回({[...ys].sort().map((y) => `${y}年`).join("・")})
            </span>
          ))}
          です(混成クルーは別の団体として数えています)。
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

        <h2>収録内の種目別最速タイム</h2>
        <p>
          {firstYear}〜{latestYear}年のFinal Aで出た、種目ごとの最速タイムです。同じ男子エイトの優勝タイムでも{menEightFastest.time_display}({menEightFastest.year}年)から{menEightSlowest.time_display}({menEightSlowest.year}年)まで年によって{Math.round(menEightSlowest.time_seconds - menEightFastest.time_seconds)}秒近く動いているので、年をまたいだ比較は参考程度に見てください。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>クルー</th>
                <th scope="col" className={articleTh}>タイム</th>
                <th scope="col" className={articleTh}>年</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {bests.map((r) => (
                <tr key={r.event_name} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{r.event_name}</td>
                  <td data-label="クルー" className={articleTd}>
                    {r.crew_name !== r.organization ? (
                      <>
                        {r.crew_name}(<OrgLink name={r.organization} />)
                      </>
                    ) : (
                      <OrgLink name={r.organization} />
                    )}
                  </td>
                  <td data-label="タイム" className={articleTd}>{r.time_display}</td>
                  <td data-label="年" className={articleTd}>
                    <Link href={`/results/${r.year}`}>{r.year}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>年別の結果記事</h2>
        {resultsArticles.length > 0 ? (
          <>
            <p>大会ごとの結果は、種目別の優勝クルーとタイム、2位との差まで記事にまとめています。</p>
            <ul>
              {resultsArticles.map(({ article, year }) => (
                <li key={article.slug}>
                  <Link href={`/articles/${article.slug}`}>{year}年大会の結果</Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            2026年大会の結果記事は、大会終了後に収録データへ反映してからこのページに追加します。それまでは
            <Link href={`/results/${latestYear}/${encodeURIComponent(latestCompetition)}`}>{latestYear}年大会の結果ページ</Link>
            で前回の着順とタイムを確認できます。
          </p>
        )}

        <h2>結果の調べ方</h2>
        <p>
          過去の結果は当サイトで検索できます。
          <Link href={`/search?${new URLSearchParams({ competition_category: "全日本新人選手権" }).toString()}`}>
            記録検索で全日本新人選手権に絞り込む
          </Link>
          と年・種目・団体を組み合わせて探せます。各団体の成績は<Link href="/organizations">団体別ページ</Link>
          に、新人選手権に限らない種目別の歴代最速は<Link href="/records">歴代記録</Link>にまとめてあります。大会期間中の速報は日本ローイング協会が出し、当サイトへの反映は大会後になります。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>優勝はFinal Aの1位。収録範囲はFinal B以上で、予選・敗者復活戦は含みません。</li>
            {missingYears.length > 0 ? (
              <li>{missingYears.map((y) => `${y}年`).join("・")}の大会は収録していないため、歴代表と集計から外れています。</li>
            ) : null}
            <li>
              「○○混成」は複数の団体で組んだクルーで、所属は収録データの表記のままです。団体ページも混成クルーの名前で分かれています。
            </li>
            <li>所属の内訳(大学・高校・社会人など)は団体名の表記から機械的に分けたもので、正式な区分ではありません。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
