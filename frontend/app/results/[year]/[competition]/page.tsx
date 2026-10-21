import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareXLink } from "../../../components/share-x-link";
import ButtonLink from "../../../../components/ui/ButtonLink";
import { GapBars, type ChampionRow } from "../../../../components/results/gap-bars";
import * as rc from "../../../../components/results/results-classes";
import {
  availableYears,
  competitionsByRecency,
  getFilteredResults,
  isAthleteRecord,
  organizationSlug,
  previousYearWinners,
  sortForIndex,
  splitCompetitionName,
  type ResultRecord
} from "../../../../lib/results-data";
import { siteUrl } from "../../../../lib/site-url";
import { ogImageUrl } from "../../../../lib/og-image";
import { competitionOg } from "../../../../lib/og-targets";

type Params = { year: string; competition: string };

// 完全静的サイト(output: export)なので generateStaticParams の一覧だけを生成し、それ以外は 404
export const dynamicParams = false;

// Next.jsのdynamic paramsはURLエンコードされたまま渡ることがあるため、常に復号して扱う
function decodeCompetition(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams(): Promise<Params[]> {
  const params: Params[] = [];
  for (const year of availableYears()) {
    const rows = await getFilteredResults({ year: String(year) });
    competitionsByRecency(rows).forEach((competition) => {
      params.push({ year: String(year), competition });
    });
  }
  return params;
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const year = params.year;
  const competition = decodeCompetition(params.competition);
  const path = `/results/${year}/${encodeURIComponent(competition)}`;
  // 大会名自体に「ローイング」を含まない場合（改称前の大会等）のみキーワードを補う
  const title = competition.includes("ローイング")
    ? `${competition}（${year}年）結果`
    : `${competition}（${year}年）ローイング結果`;
  const description = `${year}年開催「${competition}」のローイング（ボート）競技結果。種目別のFinal A順位・クルー・タイムを掲載しています。`;
  const ogImage = ogImageUrl(competitionOg(year, competition));

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: path,
      siteName: "レガッタナビ",
      title: `${title} | レガッタナビ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | レガッタナビ`,
      description,
      images: [ogImage]
    }
  };
}

// 1位とのタイム差。計時が無い行(time_seconds<=0)は空にする
function gapText(row: ResultRecord, winner: ResultRecord | undefined): string {
  if (!winner || row.rank === 1 || row.time_seconds <= 0 || winner.time_seconds <= 0) return "";
  return `+${(row.time_seconds - winner.time_seconds).toFixed(2)}`;
}

function crewCell(row: ResultRecord) {
  if (isAthleteRecord(row)) {
    return (
      <>
        <Link href={`/athletes/${encodeURIComponent(row.crew_name)}`} className={rc.crewName}>
          {row.crew_name}
        </Link>
        <span className={rc.crewOrg}> · {row.organization}</span>
      </>
    );
  }
  return (
    <Link
      href={`/organizations/${encodeURIComponent(organizationSlug(row.organization))}`}
      className={rc.crewName}
    >
      {row.crew_name}
    </Link>
  );
}

export default async function CompetitionResultsPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const competition = decodeCompetition(params.competition);
  const yearNumber = Number(params.year);
  if (!Number.isInteger(yearNumber) || !availableYears().includes(yearNumber)) notFound();

  const rows = sortForIndex(await getFilteredResults({ year: params.year, competition }));
  if (rows.length === 0) notFound();

  const finalARows = rows.filter((row) => row.final_group === "Final A");
  const eventNames: string[] = [];
  const rowsByEvent = new Map<string, ResultRecord[]>();
  finalARows.forEach((row) => {
    const list = rowsByEvent.get(row.event_name);
    if (list) {
      list.push(row);
    } else {
      rowsByEvent.set(row.event_name, [row]);
      eventNames.push(row.event_name);
    }
  });

  const prevWinners = await previousYearWinners(yearNumber, competition);
  const competitionPath = `/results/${params.year}/${encodeURIComponent(competition)}`;
  const champions: ChampionRow[] = eventNames.flatMap((eventName) => {
    const list = rowsByEvent.get(eventName) ?? [];
    const winner = list.find((row) => row.rank === 1);
    if (!winner) return [];
    const second = list.find((row) => row.rank === 2);
    const gap =
      second && second.time_seconds > 0 && winner.time_seconds > 0
        ? second.time_seconds - winner.time_seconds
        : null;
    const prev = prevWinners?.get(eventName);
    return [
      {
        eventName,
        eventHref: `${competitionPath}/${encodeURIComponent(eventName)}`,
        winner,
        gap,
        prev,
        defended: Boolean(prev && prev.organization === winner.organization)
      }
    ];
  });
  const defendedCount = champions.filter((c) => c.defended).length;
  const { main: shortName, coHosted } = splitCompetitionName(competition);

  const searchQuery = new URLSearchParams({ year: params.year, competition }).toString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "大会結果一覧", item: `${siteUrl}/results` },
          { "@type": "ListItem", position: 3, name: `${params.year}年`, item: `${siteUrl}/results/${params.year}` },
          {
            "@type": "ListItem",
            position: 4,
            name: competition,
            item: `${siteUrl}${competitionPath}`
          }
        ]
      }
    ]
  };

  return (
    <main className="site-container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={rc.narrowPage}>
        <nav className="breadcrumbs" aria-label="パンくずリスト">
          <Link href="/">ホーム</Link>
          <span aria-hidden="true">›</span>
          <Link href="/results">大会結果一覧</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/results/${params.year}`}>{params.year}年</Link>
          <span aria-hidden="true">›</span>
          <span>{shortName}</span>
        </nav>

        <header className="mt-6">
          <p className={rc.eyebrow}>大会結果 · {params.year}年</p>
          <h1 className={rc.pageTitle}>{shortName}</h1>
          <p className={rc.lead}>
            {coHosted.length > 0 ? `${coHosted.join("、")}と同時開催。` : ""}
            {champions.length}種目のFinal Aを{new Set(champions.map((c) => c.winner.organization)).size}団体が分け合った。
            {prevWinners
              ? defendedCount > 0
                ? `前年と同じ団体が勝ったのは${defendedCount}種目。`
                : "前年と同じ団体が勝った種目は無かった。"
              : ""}
          </p>
          <p className={rc.metaLine}>
            <span>収録{rows.length.toLocaleString()}件(Final A・B)</span>
            <span>優勝クルー {champions.length}種目</span>
            <span>Final A {finalARows.length}クルー</span>
          </p>
          <div className={rc.metaActions}>
            <ButtonLink href={`/search?${searchQuery}`} variant="secondary" size="sm">
              記録検索でこの大会を開く
            </ButtonLink>
            <ShareXLink
              text={`${params.year}年 ${shortName}の結果 | レガッタナビ`}
              path={competitionPath}
              hashtags={["ローイング", "ボート"]}
            />
          </div>
        </header>

        <figure id="champions" className={rc.figureRuled}>
          <figcaption>
            <span className={`block ${rc.figureTitle}`}>優勝クルーと2位との差</span>
            <span className={`block ${rc.figureSub}`}>
              Final A 1位。差が小さいほど接戦で、青は1秒未満
              {prevWinners ? "。前年の優勝団体も添えた" : ""}
            </span>
          </figcaption>
          <GapBars rows={champions} showPrev={Boolean(prevWinners)} renderCrew={crewCell} />
        </figure>

        <section id="events" className="static-section mt-14">
          <h2>種目別の結果</h2>
          <p className={rc.figureSub}>各種目のFinal A。差は1位とのタイム差(秒)。</p>
          <div className={rc.eventGrid}>
            {eventNames.map((eventName) => {
              const list = rowsByEvent.get(eventName) ?? [];
              const winner = list.find((row) => row.rank === 1);
              const eventPath = `${competitionPath}/${encodeURIComponent(eventName)}`;
              return (
                <div key={eventName} className={rc.eventBlock}>
                  <h3 className={rc.eventHeading}>
                    <Link href={eventPath} className={rc.eventHeadingLink}>
                      {eventName}
                    </Link>
                    <Link href={eventPath} className={rc.eventMore}>
                      Final Bも見る
                    </Link>
                  </h3>
                  <table className={rc.eventTable}>
                    <caption className="sr-only">
                      {eventName} Final A({params.year}年 {competition})
                    </caption>
                    <tbody>
                      {list.map((row) => (
                        <tr key={row.id}>
                          <td className={rc.eventTdRank}>
                            <span className={rc.rankBadgeClass(row.rank)}>{row.rank}</span>
                          </td>
                          <td className={rc.eventTd}>{crewCell(row)}</td>
                          <td className={rc.eventTdTime}>{row.time_display}</td>
                          <td className={rc.eventTdGap}>{gapText(row, winner)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>

        <p className="static-cta">
          予選・敗者復活戦を含む全結果は
          <Link href={`/search?${searchQuery}`}>記録検索ページでこの大会を開く</Link>
          と確認できます。
        </p>
      </div>
    </main>
  );
}
