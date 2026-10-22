import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug, type ResultRecord } from "../../../lib/results-data";
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

// 2026年大会の日程・会場・出漕資格の一次情報(日本ローイング協会の大会ページと開催要項、2026-10-22 確認)。
// 競漕日程ページは発艇時刻つきの組み合わせ表、結果ページは大会期間中に JARA が更新する速報
const JARA_EVENT_URL = "https://www.jara.or.jp/race/current/2026freshman.html";
const JARA_BULLETIN_URL = "https://www.jara.or.jp/race/current/2026freshman_bulletin.pdf";
const JARA_SCHEDULE_URL = "https://www.jara.or.jp/race/current/2026freshman_tt.html";
const JARA_ENTRIES_URL = "https://www.jara.or.jp/race/current/2026freshman_et.html";
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

// 優勝クルーの所属を大学・高校・それ以外(社会人クラブ・企業・混成など)に分ける
function affiliationKind(organization: string): "大学" | "高校" | "社会人など" {
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
  const awaitingResults = latestYear < EDITION_YEAR;
  // 年ごとの Final A 種目数。全年で同じときだけ本文で「毎年n種目」と書く
  const eventCountsByYear = years.map((y) => new Set(finalA.filter((r) => r.year === y).map((r) => r.event_name)).size);
  const eventCountMin = Math.min(...eventCountsByYear);
  const eventCountMax = Math.max(...eventCountsByYear);

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

  const latestResultsHref = `/results/${latestYear}/${encodeURIComponent(latestCompetition)}`;
  const searchHref = `/search?${new URLSearchParams({ competition_category: "全日本新人選手権" }).toString()}`;

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
            全日本新人ローイング選手権は、例年10月から11月にかけて埼玉・戸田で3日間開かれる大会です。2026年の第67回大会は10月23日(金)から25日(日)まで。大学・高校・社会人のクルーが同じ水面で競います。大会中の結果の見方、3日間の流れ、出場できる人をまとめ、収録データ({firstYear}〜{latestYear}年の{years.length}大会)から{latestYear}
            年の種目別優勝クルー、男子エイトの歴代優勝、種目別の最速タイムも載せています。
          </p>
        </header>

        <h2>どんな大会か</h2>
        <p>
          正式名称は「全日本新人ローイング選手権大会」。主催は日本ローイング協会で、会場は戸田ボートコース(サンクジャパン戸田公園漕艇場)です。「新人」は競技歴ではなく、学年と年齢で区切られています(範囲は後述の
          <a href="#eligibility">出場できる人</a>のとおりです)。
        </p>
        <p>
          <Link href="/articles/university-championship-guide">インカレ(全日本大学ローイング選手権)</Link>
          との大きな違いは出場クルーの顔ぶれです。インカレの大学種目に出られるのは大学のクルーだけですが、新人選手権には高校や、社会人のクラブ・企業チームも同じ種目で出ます。複数の団体で組む混成クルーも出られます。
        </p>

        <h2>大会期間中の結果の見方</h2>
        <p>
          大会中の速報は日本ローイング協会が出します。各レースの着順は
          <a href={JARA_RESULTS_URL} target="_blank" rel="noopener noreferrer">
            レース結果(日本ローイング協会)
          </a>
          、組み合わせと発艇時刻は
          <a href={JARA_SCHEDULE_URL} target="_blank" rel="noopener noreferrer">
            競漕日程
          </a>
          、出場クルーの一覧は
          <a href={JARA_ENTRIES_URL} target="_blank" rel="noopener noreferrer">
            エントリー表
          </a>
          で見られます。
        </p>
        {awaitingResults ? (
          <p>
            当サイトへの反映は大会後です。収録が済んだら、{EDITION_YEAR}年大会の結果記事をこのページに加える予定です。それまでは
            <Link href={latestResultsHref}>{latestYear}年大会の結果ページ</Link>
            で前回の着順とタイムを確認できます。
          </p>
        ) : (
          <p>
            {latestYear}年大会の結果は当サイトに収録済みです。全着順は
            <Link href={latestResultsHref}>{latestYear}年大会の結果ページ</Link>
            に、種目別の優勝クルーはこの記事の下の表にあります。
          </p>
        )}

        <h2>日程と会場</h2>
        <p>
          3日間の流れは、競漕日程(2026年10月22日時点)では次のとおりです。各日とも最初の発艇は朝8時です。
        </p>
        <ul>
          <li>10月23日(金): 予選(Heat)。競漕日程に載っている7種目を順に行い、最終レースは男子エイトの15時58分発艇。</li>
          <li>10月24日(土): 準々決勝(Q Final)と、下位の順位決定の決勝(Final C〜L)。最終レースは15時24分発艇。</li>
          <li>
            10月25日(日): 準決勝(S Final)のあと、下位の決勝(Final E〜C)、Final B、Final A の順。Final A は各種目の決勝の最上位グループで、優勝はこの1位です。最終レースは男子エイトのFinal A で13時56分発艇。
          </li>
        </ul>
        <p>
          組み合わせや時刻は変わることがあるので、当日は
          <a href={JARA_SCHEDULE_URL} target="_blank" rel="noopener noreferrer">
            競漕日程
          </a>
          で確かめてください。会場の戸田ボートコースは埼玉県戸田市。大会ページによると、臨時駐車場は出場団体の車向けで、戸田ボートレース企業団の第2駐車場(10月20日〜25日、開門9時〜17時)です。車には団体名と連絡先の掲示が必要です。応援では打楽器・応援チューブ・拡声器が使えず、ほかの楽器は午前10時以降です。アクセスや注意事項の全文は
          <a href={JARA_EVENT_URL} target="_blank" rel="noopener noreferrer">
            日本ローイング協会の大会ページ
          </a>
          にあります。
        </p>

        <h2 id="eligibility">出場できる人</h2>
        <p>
          2026年大会の
          <a href={JARA_BULLETIN_URL} target="_blank" rel="noopener noreferrer">
            開催要項(PDF)
          </a>
          では、日本ローイング協会の2026年度選手登録をした、2004年4月2日以降生まれの選手のうち、次のいずれかに当てはまる人が出漕できます。
        </p>
        <ul>
          <li>中学生と高校生</li>
          <li>一般の団体に属し、2024年度以降に高校を卒業した選手、または2021年度以降に中学を卒業した選手</li>
          <li>大学の団体に属し、2025年度以降に大学に入学した選手(高専は年齢制限のみ)</li>
        </ul>
        <p>
          複数の団体で組む混成クルーも出られます。団体名の後ろに「混成」を付けます。出漕は1人1種目まで。舵手を除く全選手が公式エルゴ記録を提出する決まりです。エルゴは室内のローイングマシンで、
          <Link href="/articles/rowing-glossary">用語集</Link>に説明があります。
        </p>

        <h2>種目構成</h2>
        <p>
          2026年大会の開催要項に載っている種目は男女4種目ずつの8種目です。男子がシングルスカル、ダブルスカル、舵手つきフォア、エイト。女子がシングルスカル、ダブルスカル、舵手つきクォドルプル、エイト。エントリーが6クルー未満の種目は実施されず、女子エイトだけは2クルー以上で実施されます。2026年の競漕日程(10月22日時点)に女子エイトはなく、今年行われるのは男子4種目と女子3種目の7種目です。種目名の読み方(スカルとスイープ、舵手つきの意味)は
          <Link href="/articles/rowing-glossary">ローイング用語集</Link>
          にまとめてあります。
        </p>
        <p>
          シングルスカルだけは追加の条件があり、エルゴメーター2,000mの公式タイムが男子7分10秒、女子8分10秒より速いことが必要です。ほかの種目にこの基準はありません。
        </p>
        <p>
          収録データの{firstYear}〜{latestYear}年は{eventCountMin === eventCountMax ? `毎年${eventCountMax}種目` : `年によって${eventCountMin}〜${eventCountMax}種目`}で、女子エイトは含まれていません。{latestYear}年大会でFinal Aが行われたのは男子が{menEvents.length}種目(
          {menEvents.map((e) => e.replace("男子", "")).join("、")})、女子が{womenEvents.length}種目(
          {womenEvents.map((e) => e.replace("女子", "")).join("、")})です。インカレにある男子のペア・フォア・クォドルプル、女子の舵手つきフォア・ペアはなく、女子のクォドルプルは舵手つきです。漕手が4人以下の艇が中心で、男子エイト(漕手8人と舵手)だけが大型艇です。
        </p>

        <h2>{latestYear}年の種目別優勝クルー</h2>
        <p>
          直近の{latestCompetition}から。
          {closest
            ? `2位との差がいちばん小さかったのは${closest.event}の${closest.gap.toFixed(2)}秒(${closest.winner.organization}と${closest.second!.organization})でした。`
            : ""}
          全着順は<Link href={latestResultsHref}>{latestYear}年大会の結果ページ</Link>にあります。
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
                      <span>
                        {winner.crew_name}(<OrgLink name={winner.organization} />)
                      </span>
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

        <p>
          収録している全期間のFinal A優勝{golds.length}件を所属で分けると、大学が{kindCounts["大学"]}件、社会人のクラブ・企業や混成クルーなどが{kindCounts["社会人など"]}件、高校が{kindCounts["高校"]}件でした(所属は団体名の表記から機械的に分けたもので、正式な区分ではありません。混成クルーも団体名に「大学」「高校」を含むかどうかで振り分けています)。
        </p>

        <h2>男子エイトの歴代優勝({firstYear}〜{latestYear}年)</h2>
        <p>
          男子エイトに絞ると、収録している{menEight.length}大会の優勝クルーは次のとおりです。回数が多い順に
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
        <p>
          優勝タイムは{menEightFastest.time_display}({menEightFastest.year}年)から{menEightSlowest.time_display}({menEightSlowest.year}年)まで、年によって{Math.round(menEightSlowest.time_seconds - menEightFastest.time_seconds)}秒近く動いています。水面や風で変わるので、年をまたいだ比較は参考程度に見てください。
        </p>

        <h2>収録内の種目別最速タイム</h2>
        <p>{firstYear}〜{latestYear}年のFinal Aで出た、種目ごとの最速タイムです。年のリンクから、その年の大会結果に飛べます。</p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>クルー</th>
                <th scope="col" className={articleTh}>タイム(年)</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {bests.map((r) => (
                <tr key={r.event_name} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{r.event_name}</td>
                  <td data-label="クルー" className={articleTd}>
                    {r.crew_name !== r.organization ? (
                      <span>
                        {r.crew_name}(<OrgLink name={r.organization} />)
                      </span>
                    ) : (
                      <OrgLink name={r.organization} />
                    )}
                  </td>
                  <td data-label="タイム(年)" className={articleTd}>
                    <span>
                      {r.time_display}(<Link href={`/results/${r.year}`}>{r.year}年</Link>)
                    </span>
                  </td>
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
          過去の結果は当サイトで検索できます。<Link href={searchHref}>記録検索で全日本新人選手権に絞り込む</Link>
          と年・種目・団体を組み合わせて探せます。各団体の成績は<Link href="/organizations">団体別ページ</Link>
          に、新人選手権に限らない種目別の歴代最速は<Link href="/records">歴代記録</Link>にまとめてあります。
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
            <li>日程・会場・出場資格は日本ローイング協会の大会ページと開催要項(2026年10月22日時点)によります。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
