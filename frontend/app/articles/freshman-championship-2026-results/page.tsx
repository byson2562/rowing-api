import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug, type ResultRecord } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import { ogImages } from "../../../lib/og-image";
import { articleOg } from "../../../lib/og-targets";
import { formatMargin, formatRaceTime, shortOrgName } from "../../../lib/race-format";
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
      {row.event_name.endsWith("シングルスカル") ? <AthleteLink name={row.crew_name} /> : row.crew_name}(
      <OrgLink name={row.organization} />)
    </span>
  ) : (
    <OrgLink name={row.organization} />
  );
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
                {r.rank === 1 ? "—" : formatMargin(r.time_seconds - rows[0].time_seconds)}
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
  const nonUnivBest = Math.min(...nonUnivFinalists.map((r) => r.rank));
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
  // リードで名前を出した団体は、2回目以降を略称にする
  const namedInLead = new Set([menEight.winner.organization, womenQuad.winner.organization, womenQuad.second.organization]);
  const nameOf = (org: string) => (namedInLead.has(org) ? shortOrgName(org) : org);
  const menLeaderOthers = menLeader.events.filter((e) => e !== "エイト");
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
            {competitionName.replace("大会", "")}は最終日の25日、埼玉・戸田ボートコースで各種目の決勝を行い、男子エイトは
            <OrgLink name={menEight.winner.organization} />が{formatRaceTime(menEight.winner.time_seconds)}で優勝した。
            {menLeader.org === menEight.winner.organization && menLeaderOthers.length > 0
              ? `${shortOrgName(menLeader.org)}は${menLeaderOthers.join("と")}も制し、男子${menGolds.events}種目のうち${menLeader.events.length}種目を取った。`
              : null}
            女子<Link href="/articles/rowing-glossary">舵手つきクォドルプル</Link>は<OrgLink name={womenQuad.winner.organization} />が
            <OrgLink name={womenQuad.second.organization} />を{formatMargin(womenQuad.gap)}差で抑えた。{champions.length}
            種目の優勝クルーとタイム、2位との差、前年の優勝を当サイトの収録データからまとめた。大会の成り立ちや歴代の優勝は
            <Link href="/articles/freshman-championship-guide">新人選手権の解説記事</Link>へ。
          </p>
        </header>

        <h2>{champions.length}種目の優勝クルーとタイム</h2>
        <p>
          優勝は<Link href="/articles/rowing-glossary">Final A</Link>(決勝の最上位グループ)の1位。{YEAR}年のFinal Aは各種目
          {finalACrews}クルーで争った。女子エイトは行われなかった。
          {defended.length > 0
            ? `前年と同じ団体が勝ったのは${defended.length}種目(${defended.map((c) => `${c.event}の${c.winner.organization}`).join("、")})で、残る${champions.length - defended.length}種目は優勝団体が入れ替わった。`
            : `${champions.length}種目とも前年と違う団体が優勝した。`}
          2位との差が最も小さかったのは{closest.event}の{formatMargin(closest.gap)}差。
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
                      <CrewCell row={c.second} />({formatMargin(c.gap)})
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
          にあり、種目名のリンクから種目別に開ける。男子エイトと女子舵手つきクォドルプルはFinal Aの全着順を下に載せた。
        </p>
        {menLeader.events.length >= 2 && menLeader.events.length > menGolds.pastMax ? (
          <p>
            1大会で男子{menLeader.events.length}種目を制した団体は、収録範囲では{nameOf(menLeader.org)}が初めて。これまでの最多は
            {menGolds.pastMax}種目だった。
          </p>
        ) : null}
        {fastestEver.length > 0 ? (
          <p>
            {fastestEver.map((c) => `${c.event}の${formatRaceTime(c.winner.time_seconds)}`).join("、")}は、収録している
            {firstYear}年以降の優勝タイムで最も速い。
          </p>
        ) : null}

        <h2>男子エイトは{menEight.winner.organization}</h2>
        <p>
          {menEight.pastWins.length === 0
            ? `${firstYear}年以降の収録データで、${nameOf(menEight.winner.organization)}が新人選手権の男子エイトを制したのは初めて。`
            : `${nameOf(menEight.winner.organization)}の男子エイト優勝は収録範囲で${menEight.pastWins.length + 1}回目。`}
          2位争いは<CrewCell row={menEightRows[1]} />が<CrewCell row={menEightRows[2]} />を
          {formatMargin(eightSecondThirdGap)}差で制した。
        </p>
        <FinalTable rows={menEightRows} />

        <h2>女子舵手つきクォドルプルは{womenQuad.winner.organization}</h2>
        <p>
          {womenQuad.pastWins.length === 0
            ? `収録範囲で${nameOf(womenQuad.winner.organization)}がこの種目を制したのは初めて。`
            : `${nameOf(womenQuad.winner.organization)}のこの種目の優勝は収録範囲で${womenQuad.pastWins.length + 1}回目。`}
          1位から4位までが{formatMargin(quadTop4Span)}の間に入った。
        </p>
        <FinalTable rows={womenQuadRows} />

        <h2>高校・混成・社会人などのクルー(Final A)</h2>
        <p>
          {nonUnivWins.length === 0 ? (
            <>
              {YEAR}年は{champions.length}種目すべてを大学が制した。前年は{prevNonUnivWins.length}種目で大学以外が優勝していた(
              {prevNonUnivWins.map((r) => `${r.event_name}の${r.organization}`).join("、")})。
            </>
          ) : (
            <>
              大学以外の優勝は{nonUnivWins.length}種目({nonUnivWins.map((c) => `${c.event}の${c.winner.organization}`).join("、")})だった。
            </>
          )}
          高校・混成・社会人などのクルーはFinal Aに{nonUnivFinalists.length}クルーが進み、最高位は{nonUnivBest}位だった。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>順位</th>
                <th scope="col" className={articleTh}>クルー</th>
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
                  <td data-label="タイム" className={articleTd}>{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>歴代の優勝と公式結果</h2>
        <p>
          {firstYear}年以降の歴代優勝や団体別の優勝回数は
          <Link href="/articles/freshman-championship-guide">新人選手権の解説記事</Link>
          に、公式の結果は
          <a href={JARA_RESULTS_URL} target="_blank" rel="noopener noreferrer">
            日本ローイング協会のレース結果
          </a>
          にある。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>タイムは日本ローイング協会の公式結果から収録したFinal A・Bの記録で、予選や準決勝は含まない。</li>
            <li>
              {PREV_YEAR}年のFinal Aは各種目{prevFinalACrews}クルーで、{YEAR}年({finalACrews}クルー)とは決勝に残るクルーの数が違う。
            </li>
            <li>
              「○○混成」は複数の団体で組んだクルーで、所属は収録データの表記のまま。団体別の優勝では別の団体として数えた。「大学以外」の区分は団体名の表記から機械的に分けたもので、大学と高校の混成も「混成」に入る。
            </li>
            <li>「初めて」は、収録している{firstYear}年以降の大会での判定。収録していない年がある(解説記事の注記を参照)。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
