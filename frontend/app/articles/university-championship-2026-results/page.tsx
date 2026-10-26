import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug, type ResultRecord } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import { ogImages } from "../../../lib/og-image";
import { articleOg } from "../../../lib/og-targets";
import { formatMargin, formatRaceTime, shortOrgName } from "../../../lib/race-format";
import {
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

  const winningSchools = new Set(champions.map((c) => c.winner.organization)).size;

  // 学校別の金メダル数。学校同士の比較は男女で分けて数える(男子と女子は種目も勝つ学校も違う)。
  // 多い順で、同数は五十音ではなく種目順の初出で安定させる(Map の挿入順が種目順なので、安定ソートでそのまま残る)
  const goldsBySex = (["男子", "女子"] as const).map((sex) => {
    const list = champions.filter((c) => c.event.startsWith(sex));
    const bySchool = new Map<string, string[]>();
    list.forEach((c) =>
      bySchool.set(c.winner.organization, [...(bySchool.get(c.winner.organization) ?? []), c.event.replace(sex, "")])
    );
    const ranking = [...bySchool.entries()]
      .map(([org, events]) => ({ org, events }))
      .sort((a, b) => b.events.length - a.events.length);
    const top = ranking[0]?.events.length ?? 0;
    // 前年の最多校と、その学校の今年の金
    const prevBySchool = new Map<string, number>();
    prevYear
      .filter((r) => r.rank === 1 && r.event_name.startsWith(sex))
      .forEach((r) => prevBySchool.set(r.organization, (prevBySchool.get(r.organization) ?? 0) + 1));
    const prevTop = Math.max(0, ...prevBySchool.values());
    return {
      sex,
      events: list.length,
      ranking,
      leaders: ranking.filter((school) => school.events.length === top),
      prevLeaders: [...prevBySchool.entries()]
        .filter(([, count]) => count === prevTop)
        .map(([org, count]) => ({ org, count, now: bySchool.get(org) ?? [] }))
    };
  });

  // 同じ大学がその種目を何年続けて勝っているか(year から1年ずつさかのぼる)
  const golds = univ.filter((r) => r.final_group === "Final A" && r.rank === 1 && !isOpenEvent(r.event_name));
  const streakEnding = (event: string, org: string, year: number) => {
    let n = 0;
    while (golds.some((r) => r.year === year - n && r.event_name === event && r.organization === org)) n += 1;
    return n;
  };
  const menEightChamp = champions.find((c) => c.event === "男子エイト")!;
  const womenEightChamp = champions.find((c) => c.event === "女子エイト")!;
  const womenEightFirstWin = !golds.some(
    (r) => r.year < YEAR && r.event_name === "女子エイト" && r.organization === womenEightChamp.winner.organization
  );
  const dethroned = womenEightChamp.prev!;
  const dethronedStreak = streakEnding("女子エイト", dethroned.organization, PREV_YEAR);
  // 今年の優勝で、続けて勝っている年数がいちばん長いもの
  const longestRun = champions
    .map((c) => ({ c, n: streakEnding(c.event, c.winner.organization, YEAR) }))
    .sort((a, b) => b.n - a.n)[0];
  const namedInLead = new Set([
    menEightChamp.winner.organization,
    womenEightChamp.winner.organization,
    dethroned.organization
  ]);
  const nameOf = (org: string) => (namedInLead.has(org) ? shortOrgName(org) : org);

  const menEight = thisYear.filter((r) => r.event_name === "男子エイト").sort((a, b) => a.rank - b.rank);
  const womenEight = thisYear.filter((r) => r.event_name === "女子エイト").sort((a, b) => a.rank - b.rank);
  const menSingle = champions.find((c) => c.event === "男子シングルスカル")!;
  const womenSingle = champions.find((c) => c.event === "女子シングルスカル")!;
  const prevLeaders = goldsBySex.flatMap((g) => g.prevLeaders.map((leader) => ({ ...leader, sex: g.sex })));
  const prevLeadersWithGolds = prevLeaders
    .filter((leader) => leader.now.length > 0)
    .map((leader) => `${nameOf(leader.org)}が${leader.sex}${leader.now.join("・")}の${leader.now.length}つ`);
  const prevLeadersWithoutGolds = prevLeaders.filter((leader) => leader.now.length === 0).map((leader) => nameOf(leader.org));
  const dethronedRank = womenEight.find((r) => r.organization === dethroned.organization)?.rank;

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
            第53回全日本大学ローイング選手権(インカレ)は2026年8月26日から30日まで埼玉・戸田ボートコースで開かれ、男子エイトは
            <OrgLink name={menEightChamp.winner.organization} />が{formatRaceTime(menEightChamp.winner.time_seconds)}で
            {menEightChamp.prev?.organization === menEightChamp.winner.organization ? "連覇した" : "優勝した"}。女子エイトは
            <OrgLink name={womenEightChamp.winner.organization} />が{formatRaceTime(womenEightChamp.winner.time_seconds)}で制し、
            {dethronedStreak}連覇中だった<OrgLink name={dethroned.organization} />を破った。{champions.length}
            種目のFinal A優勝校とタイム、2位との差、前年からの入れ替わりを当サイトの収録データからまとめた。大会の成り立ちや種目構成は
            <Link href="/articles/university-championship-guide">インカレの解説記事</Link>へ。
          </p>
        </header>

        <h2>{champions.length}種目の優勝校とタイム</h2>
        <p>
          優勝は<Link href="/articles/rowing-glossary">Final A</Link>の1位(JO種目を除く)。{champions.length}種目を{winningSchools}
          校が分け合った。前年と同じ大学が勝ったのは
          {defended.length}種目({defended.map((c) => `${c.event}の${nameOf(c.winner.organization)}`).join("、")})で、残る
          {champions.length - defended.length}種目は優勝校が入れ替わった。
          {longestRun.n >= 3 ? (
            <>
              {longestRun.c.event}の<OrgLink name={longestRun.c.winner.organization} />は{YEAR - longestRun.n + 1}
              年から{longestRun.n}連覇。
            </>
          ) : null}
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
                    {formatMargin(c.gap)}({c.second.organization})
                  </td>
                  <td data-label="前年優勝" className={articleTd}>{c.prev ? c.prev.organization : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          最も競ったのは{closest.event}で、<OrgLink name={closest.winner.organization} />が
          <OrgLink name={closest.second.organization} />を{formatMargin(closest.gap)}差でかわした。Final Bを含む全着順は
          <Link href={competitionPath}>{YEAR}年大会の結果ページ</Link>にある。
        </p>

        <h2>
          男子エイトは{menEightChamp.winner.organization}
          {menEightChamp.prev?.organization === menEightChamp.winner.organization ? "が連覇" : "が優勝"}
        </h2>
        <p>
          <OrgLink name={menEight[2].organization} />は3位だった。日本大が男子エイトで2年続けて優勝を逃すのは、2019年から2021年以来となる(2021年は全日本選手権との合併開催で、優勝は社会人のNTT東日本。日本大は大学勢で最上位の4位だった)。
        </p>
        <FinalTable rows={menEight} />

        <h2>
          女子エイトは{womenEightChamp.winner.organization}、{dethroned.organization}の連覇を止める
        </h2>
        <p>
          {womenEightFirstWin
            ? `収録範囲で${nameOf(womenEightChamp.winner.organization)}が女子エイトを制したのは初めて。`
            : null}
          {PREV_YEAR - dethronedStreak + 1}年から{dethronedStreak}連覇中だった{nameOf(dethroned.organization)}は
          {dethronedRank}位だった。
        </p>
        <FinalTable rows={womenEight} />

        <h2>学校別の金メダル数</h2>
        <p>
          前年の最多は
          {goldsBySex
            .map((g) => `${g.sex}が${g.prevLeaders.map((s) => nameOf(s.org)).join("と")}(${g.prevLeaders[0]?.count ?? 0}つ)`)
            .join("、")}
          。{YEAR}年は{prevLeadersWithGolds.join("、")}
          {prevLeadersWithoutGolds.length > 0
            ? `${prevLeadersWithGolds.length > 0 ? "で、" : ""}${prevLeadersWithoutGolds.join("と")}は金メダルがなかった`
            : ""}
          。
        </p>
        <div className={articleEraGrid}>
          {goldsBySex.map((g) => (
            <div className={articleEraCard} key={g.sex}>
              <h3 className={articleEraCardTitle}>
                {g.sex}({g.events}種目・{g.ranking.length}校)
              </h3>
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
                    {g.ranking.map((school) => (
                      <tr key={school.org} className={articleTr}>
                        <td data-label="大学" className={`${articleTd} ${articleTdYear}`}>
                          <OrgLink name={school.org} />
                        </td>
                        <td data-label="金" className={articleTd}>{school.events.length}</td>
                        <td data-label="種目" className={articleTd}>{school.events.join("、")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <h2>シングルスカルの優勝者</h2>
        <p>
          男子は<OrgLink name={menSingle.winner.organization} />の<AthleteLink name={menSingle.winner.crew_name} />
          が{formatRaceTime(menSingle.winner.time_seconds)}、女子は<OrgLink name={womenSingle.winner.organization} />の
          <AthleteLink name={womenSingle.winner.crew_name} />が{formatRaceTime(womenSingle.winner.time_seconds)}で勝った。選手名のリンク先で、他の大会も含めた成績を追える。
        </p>

        <h2>ほかの年と団体別の推移</h2>
        <p>
          学校ごとの推移は<Link href="/organizations">団体別ページ</Link>
          、2009〜2025年の17年分の優勝校の流れは
          <Link href="/articles/university-power-map-2009-2025">勢力図の分析記事</Link>で追える。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>タイムは日本ローイング協会の公式結果から収録したFinal A・Bの記録で、予選や準決勝は含まない。</li>
            <li>
              JO(ジャパンオープン)種目は社会人も出場するオープン枠のため、{champions.length}種目の集計から除いた。2026年はJO男子エイトをNTT東日本、JO女子エイトをデンソーオルカリスが制した。
            </li>
            <li>女子エイトは収録データにFinal Aの記録がある年が2021年と2023年以降に限られる。「初めて」と連覇の数はその範囲での判定。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
