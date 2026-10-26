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

const meta = getArticle("freshman-championship-2026-results")!;

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
const JARA_RESULTS_URL = "https://www.jara.or.jp/raceresult/domestic/67freshman/67freshman.htm";
const isFreshmanChampionship = (name: string) => name.includes("新人");

const eventOrder = [
  "男子エイト",
  "男子舵手つきフォア",
  "男子ダブルスカル",
  "男子シングルスカル",
  "女子舵手つきクォドルプル",
  "女子ダブルスカル",
  "女子シングルスカル"
];

type Kind = "大学" | "高校" | "混成" | "社会人など";
// 所属を団体名の表記から分ける。混成クルー(大学と高校の組み合わせも含む)は大学とは別に数える
function affiliationKind(organization: string): Kind {
  if (organization.includes("混成")) return "混成";
  if (/高校|学園|高等学校|高$/.test(organization)) return "高校";
  if (/大学|大$/.test(organization)) return "大学";
  return "社会人など";
}

function OrgLink({ name }: { name: string }) {
  return <Link href={`/organizations/${organizationSlug(name)}`}>{name}</Link>;
}

function AthleteLink({ name }: { name: string }) {
  return <Link href={`/athletes/${encodeURIComponent(name)}`}>{name}</Link>;
}

// クルー名が団体名と違う(A・Bクルー、シングルスカルの選手名)ときはクルー名も出す
function CrewCell({ row }: { row: ResultRecord }) {
  return row.crew_name !== row.organization ? (
    <span>
      {row.crew_name}(<OrgLink name={row.organization} />)
    </span>
  ) : (
    <OrgLink name={row.organization} />
  );
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
            <th scope="col" className={articleTh}>クルー</th>
            <th scope="col" className={articleTh}>タイム</th>
            <th scope="col" className={articleTh}>1位との差</th>
          </tr>
        </thead>
        <tbody className={articleTbody}>
          {rows.map((r) => (
            <tr key={r.rank} className={articleTr}>
              <td data-label="順位" className={`${articleTd} ${articleTdYear}`}>{r.rank}</td>
              <td data-label="クルー" className={articleTd}>
                <CrewCell row={r} />
              </td>
              <td data-label="タイム" className={articleTd}>{r.time_display}</td>
              <td data-label="1位との差" className={articleTd}>
                {r.rank === 1 ? "—" : formatGap(r.time_seconds - rows[0].time_seconds)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function FreshmanChampionship2026Results() {
  const rows = (await allResults()).filter((r) => isFreshmanChampionship(r.competition_name));
  const competitionName = rows.find((r) => r.year === YEAR)!.competition_name;
  const competitionPath = `/results/${YEAR}/${encodeURIComponent(competitionName)}`;
  const eventPath = (event: string) => `${competitionPath}/${encodeURIComponent(event)}`;

  const finalA = rows.filter((r) => r.final_group === "Final A");
  const golds = finalA.filter((r) => r.rank === 1);
  const thisYear = finalA.filter((r) => r.year === YEAR);
  const finalists = (event: string) =>
    thisYear.filter((r) => r.event_name === event).sort((a, b) => a.rank - b.rank);

  // 種目ごとの優勝・2位・前年優勝・収録範囲での過去の優勝
  const champions = eventOrder.flatMap((event) => {
    const winner = thisYear.find((r) => r.event_name === event && r.rank === 1);
    const second = thisYear.find((r) => r.event_name === event && r.rank === 2);
    if (!winner || !second) return [];
    const prev = golds.find((r) => r.year === PREV_YEAR && r.event_name === event);
    const pastWins = golds.filter(
      (r) => r.year < YEAR && r.event_name === event && r.organization === winner.organization
    );
    const pastTimes = golds.filter((r) => r.year < YEAR && r.event_name === event && r.time_seconds > 0);
    const fastestEver = pastTimes.every((r) => r.time_seconds > winner.time_seconds);
    return [{ event, winner, second, gap: second.time_seconds - winner.time_seconds, prev, pastWins, fastestEver }];
  });
  const defended = champions.filter((c) => c.prev && c.prev.organization === c.winner.organization);
  const closest = [...champions].sort((a, b) => a.gap - b.gap)[0];
  const fastestEver = champions.filter((c) => c.fastestEver);
  const firstYear = Math.min(...golds.map((r) => r.year));
  const finalACrews = Math.max(...thisYear.map((r) => r.rank));
  const prevFinalACrews = Math.max(...finalA.filter((r) => r.year === PREV_YEAR).map((r) => r.rank));

  // 団体別の優勝数。団体どうしの比較は男女で分けて数える。同数は種目順の初出で並べる
  const goldsBySex = (["男子", "女子"] as const).map((sex) => {
    const list = champions.filter((c) => c.event.startsWith(sex));
    const byOrg = new Map<string, string[]>();
    list.forEach((c) =>
      byOrg.set(c.winner.organization, [...(byOrg.get(c.winner.organization) ?? []), c.event.replace(sex, "")])
    );
    const ranking = [...byOrg.entries()]
      .map(([org, events]) => ({ org, events }))
      .sort((a, b) => b.events.length - a.events.length);
    // 1つの大会で同じ団体が男子(女子)の何種目を制したか、収録範囲の過去の最多
    const pastMax = Math.max(
      0,
      ...[...new Set(golds.filter((r) => r.year < YEAR).map((r) => r.year))].flatMap((y) => {
        const counts = new Map<string, number>();
        golds
          .filter((r) => r.year === y && r.event_name.startsWith(sex))
          .forEach((r) => counts.set(r.organization, (counts.get(r.organization) ?? 0) + 1));
        return [...counts.values()];
      })
    );
    return { sex, events: list.length, ranking, pastMax };
  });
  const menGolds = goldsBySex[0];
  const menLeader = menGolds.ranking[0];

  // 大学以外(高校・混成・社会人など)のクルー
  const kindOf = (r: ResultRecord) => affiliationKind(r.organization);
  const nonUnivWins = champions.filter((c) => kindOf(c.winner) !== "大学");
  const nonUnivFinalists = eventOrder.flatMap((event) => finalists(event).filter((r) => kindOf(r) !== "大学"));
  const nonUnivSeconds = nonUnivFinalists.filter((r) => r.rank === 2);
  const prevNonUnivWins = golds
    .filter((r) => r.year === PREV_YEAR && kindOf(r) !== "大学")
    .sort((a, b) => eventOrder.indexOf(a.event_name) - eventOrder.indexOf(b.event_name));

  const menEight = champions.find((c) => c.event === "男子エイト")!;
  const womenQuad = champions.find((c) => c.event === "女子舵手つきクォドルプル")!;
  const menSingle = champions.find((c) => c.event === "男子シングルスカル")!;
  const womenSingle = champions.find((c) => c.event === "女子シングルスカル")!;
  const menEightRows = finalists("男子エイト");
  const womenQuadRows = finalists("女子舵手つきクォドルプル");
  const quadTop4Span = womenQuadRows[3].time_seconds - womenQuadRows[0].time_seconds;
  const eightSecondThirdGap = menEightRows[2].time_seconds - menEightRows[1].time_seconds;

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
        <span>新人選手権2026の結果</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>2026年10月25日</time> · レガッタナビ編集
          </p>
          <h1>全日本新人ローイング選手権2026(第67回)の結果</h1>
          <p className="lp-lead">
            2026年10月23日から25日、埼玉・戸田ボートコースで開かれた{competitionName.replace("大会", "")}
            。男子エイトは<OrgLink name={menEight.winner.organization} />、女子舵手つきクォドルプルは
            <OrgLink name={womenQuad.winner.organization} />が制しました。
            {menLeader.events.length >= 2
              ? `${menLeader.org}は男子${menGolds.events}種目のうち${menLeader.events.length}種目で勝ちました。`
              : null}
            {champions.length}種目のFinal A優勝クルーとタイム、2位との差、前年との比較を、当サイトの収録データからまとめます。大会の成り立ちや歴代の優勝は
            <Link href="/articles/freshman-championship-guide">新人選手権の解説記事</Link>へ。
          </p>
        </header>

        <h2>{champions.length}種目の優勝クルーとタイム</h2>
        <p>
          優勝は<Link href="/articles/rowing-glossary">Final A</Link>(決勝の最上位グループ)の1位です。{YEAR}年のFinal Aは各種目
          {finalACrews}クルーで行われました。
          {defended.length > 0
            ? `前年と同じ団体が勝ったのは${defended.length}種目(${defended.map((c) => `${c.event}の${c.winner.organization}`).join("、")})で、残る${champions.length - defended.length}種目は優勝団体が入れ替わりました。`
            : `${champions.length}種目すべてで、前年とは違う団体が優勝しました。`}
          2位との差がいちばん小さかったのは{closest.event}の{formatGap(closest.gap)}です。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>優勝</th>
                <th scope="col" className={articleTh}>2位(優勝との差)</th>
                <th scope="col" className={articleTh}>前年の優勝</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {champions.map((c) => (
                <tr key={c.event} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>
                    <span>
                      <Link href={eventPath(c.event)}>{c.event}</Link>
                    </span>
                  </td>
                  <td data-label="優勝" className={articleTd}>
                    <span>
                      <CrewCell row={c.winner} /> {c.winner.time_display}
                    </span>
                  </td>
                  <td data-label="2位(優勝との差)" className={articleTd}>
                    <span>
                      <CrewCell row={c.second} />({formatGap(c.gap)})
                    </span>
                  </td>
                  <td data-label="前年の優勝" className={articleTd}>
                    <span>
                      {c.prev ? <CrewCell row={c.prev} /> : "—"}
                      {c.prev && c.prev.organization === c.winner.organization ? (
                        <span className="ml-1.5 font-bold text-rn-text">連覇</span>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          3位以下とFinal Bを含む全着順は<Link href={competitionPath}>{YEAR}年大会の結果ページ</Link>
          にあり、種目名のリンクから種目別に開けます。この記事では、男子エイトと女子舵手つきクォドルプルのFinal A全着順を下に載せています。
        </p>
        <p>
          {goldsBySex.map((g, gi) => (
            <span key={g.sex}>
              {gi > 0 ? "、" : ""}
              {g.sex}の{g.events}種目を{g.ranking.length}団体
            </span>
          ))}
          が分け合いました。
          {menLeader.events.length >= 2 ? (
            <>
              <OrgLink name={menLeader.org} />は男子{menLeader.events.join("・")}の{menLeader.events.length}種目で優勝しました。
              {menLeader.events.length > menGolds.pastMax
                ? `収録範囲で、1つの団体が1大会で男子${menLeader.events.length}種目を制したのは初めてです(これまでの最多は${menGolds.pastMax}種目)。`
                : null}
            </>
          ) : null}
        </p>
        {fastestEver.length > 0 ? (
          <p>
            {fastestEver.map((c) => `${c.event}の${c.winner.time_display}`).join("、")}は、収録している{firstYear}
            年以降の優勝タイムでいちばん速い記録です。タイムは水面や風で大きく変わるので、年をまたいだ比較は参考程度に見てください。
          </p>
        ) : null}

        <h2>男子エイト: {menEight.winner.organization}が優勝</h2>
        <p>
          <OrgLink name={menEight.winner.organization} />が{menEight.winner.time_display}で、2位の
          <CrewCell row={menEight.second} />に{formatGap(menEight.gap)}差をつけました。
          {menEight.pastWins.length === 0
            ? `収録している${firstYear}年以降で、${menEight.winner.organization}が新人選手権の男子エイトを制したのは初めてです。`
            : `${menEight.winner.organization}の男子エイト優勝は収録範囲で${menEight.pastWins.length + 1}回目です。`}
          2位と3位の差は{formatGap(eightSecondThirdGap)}でした。
        </p>
        <FinalTable rows={menEightRows} />

        <h2>女子舵手つきクォドルプル: {womenQuad.winner.organization}が優勝</h2>
        <p>
          <OrgLink name={womenQuad.winner.organization} />が{womenQuad.winner.time_display}で、2位の
          <CrewCell row={womenQuad.second} />を{formatGap(womenQuad.gap)}差で抑えました。
          {womenQuad.pastWins.length === 0
            ? `収録範囲で${womenQuad.winner.organization}がこの種目を制したのは初めてです。`
            : `${womenQuad.winner.organization}のこの種目の優勝は収録範囲で${womenQuad.pastWins.length + 1}回目です。`}
          1位から4位までが{formatGap(quadTop4Span)}の間に入りました。第67回大会では女子エイトは行われていません。
        </p>
        <FinalTable rows={womenQuadRows} />

        <h2>シングルスカルの優勝者</h2>
        <p>
          男子は<OrgLink name={menSingle.winner.organization} />の<AthleteLink name={menSingle.winner.crew_name} />
          が{menSingle.winner.time_display}で、2位の<OrgLink name={menSingle.second.organization} />・
          <AthleteLink name={menSingle.second.crew_name} />に{formatGap(menSingle.gap)}差をつけました。女子は
          <OrgLink name={womenSingle.winner.organization} />の<AthleteLink name={womenSingle.winner.crew_name} />が
          {womenSingle.winner.time_display}で、2位の<OrgLink name={womenSingle.second.organization} />・
          <AthleteLink name={womenSingle.second.crew_name} />に{formatGap(womenSingle.gap)}差で勝ちました。選手名のリンク先で、他の大会も含めた成績を見られます。
        </p>

        <h2>高校・混成・社会人などのクルー(Final A)</h2>
        <p>
          {nonUnivWins.length === 0 ? (
            <>
              {YEAR}年は{champions.length}種目すべてを大学が制しました。前年は{prevNonUnivWins.length}種目で大学以外が優勝していました(
              {prevNonUnivWins.map((r) => `${r.event_name}の${r.organization}`).join("、")})。
            </>
          ) : (
            <>
              大学以外の優勝は{nonUnivWins.length}種目({nonUnivWins.map((c) => `${c.event}の${c.winner.organization}`).join("、")})でした。
            </>
          )}
          高校・混成・社会人などのクルーは、Final Aに{nonUnivFinalists.length}クルーが進み、最高位は2位でした。2位は
          {nonUnivSeconds
            .map((r) => `${r.event_name}の${r.crew_name}${r.crew_name !== r.organization ? `(${r.organization})` : ""}`)
            .join("、")}
          の{nonUnivSeconds.length}クルーです。区分は団体名の表記から機械的に分けています。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>順位</th>
                <th scope="col" className={articleTh}>クルー</th>
                <th scope="col" className={articleTh}>区分</th>
                <th scope="col" className={articleTh}>タイム</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {nonUnivFinalists.map((r) => (
                <tr key={`${r.event_name}-${r.rank}`} className={articleTr}>
                  <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>{r.event_name}</td>
                  <td data-label="順位" className={articleTd}>{r.rank}</td>
                  <td data-label="クルー" className={articleTd}>
                    <CrewCell row={r} />
                  </td>
                  <td data-label="区分" className={articleTd}>{kindOf(r)}</td>
                  <td data-label="タイム" className={articleTd}>{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>全種目の結果を見る</h2>
        <p>
          Final Bを含む全着順は<Link href={competitionPath}>{YEAR}年大会の結果ページ</Link>
          に種目別で載せています。{firstYear}年以降の歴代優勝や団体別の優勝回数は
          <Link href="/articles/freshman-championship-guide">新人選手権の解説記事</Link>
          に、公式の結果は
          <a href={JARA_RESULTS_URL} target="_blank" rel="noopener noreferrer">
            日本ローイング協会のレース結果
          </a>
          にあります。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>タイムは日本ローイング協会の公式結果から収録したFinal A・Bの記録です。予選や準決勝は含みません。</li>
            <li>
              {PREV_YEAR}年のFinal Aは各種目{prevFinalACrews}クルーでした。{YEAR}年({finalACrews}クルー)とは決勝に残るクルーの数が違います。
            </li>
            <li>
              「○○混成」は複数の団体で組んだクルーで、所属は収録データの表記のままです。団体別の優勝では別の団体として数えています。「大学以外」の区分は団体名の表記から機械的に分けたもので、大学と高校の混成も「混成」に入ります。
            </li>
            <li>「初めて」は、収録している{firstYear}年以降の大会での判定です。収録していない年があります(解説記事の注記を参照)。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
