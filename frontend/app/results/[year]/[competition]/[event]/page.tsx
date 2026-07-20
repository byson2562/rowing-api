import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareXLink } from "../../../../components/share-x-link";
import {
  availableYears,
  getFilteredResults,
  isAthleteRecord,
  organizationSlug,
  sortForIndex,
  type ResultRecord
} from "../../../../../lib/results-data";
import { siteUrl } from "../../../../../lib/site-url";

type Params = { year: string; competition: string; event: string };

export const dynamicParams = true;

function decodeSegment(raw: string): string {
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
    const seen = new Set<string>();
    rows.forEach((row) => {
      const key = `${row.competition_name}|${row.event_name}`;
      if (seen.has(key)) return;
      seen.add(key);
      params.push({ year: String(year), competition: row.competition_name, event: row.event_name });
    });
  }
  return params;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const competition = decodeSegment(params.competition);
  const event = decodeSegment(params.event);
  const rows = await getFilteredResults({ year: params.year, competition, event });
  if (rows.length === 0) return {};

  const winner = rows.find((row) => row.final_group === "Final A" && row.rank === 1);
  const path = `/results/${params.year}/${encodeURIComponent(competition)}/${encodeURIComponent(event)}`;
  // 大会名自体に「ローイング」を含まない場合（改称前の大会等）のみキーワードを補う
  const title = competition.includes("ローイング")
    ? `${event}の結果｜${competition}（${params.year}年）`
    : `${event}の結果｜${competition}ローイング（${params.year}年）`;
  const description = `${params.year}年「${competition}」${event}のローイング（ボート）競技結果。${winner ? `優勝は${winner.organization}（${winner.time_display}）。` : ""}Final A・Final Bの順位・クルー・タイムを掲載しています。`;
  const ogImage = `${siteUrl}/og?title=${encodeURIComponent(event)}&subtitle=${encodeURIComponent(winner ? `優勝 ${winner.organization} ${winner.time_display}（${params.year}年）` : `${params.year}年 ${competition}`)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: path,
      siteName: "RowingAPI",
      title: `${title} | RowingAPI`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | RowingAPI`,
      description,
      images: [ogImage]
    }
  };
}

function crewCell(row: ResultRecord) {
  if (isAthleteRecord(row)) {
    return <Link href={`/athletes/${encodeURIComponent(row.crew_name)}`}>{row.crew_name}</Link>;
  }
  return row.crew_name;
}

export default async function CompetitionEventPage({ params }: { params: Params }) {
  const competition = decodeSegment(params.competition);
  const event = decodeSegment(params.event);
  const yearNumber = Number(params.year);
  if (!Number.isInteger(yearNumber) || !availableYears().includes(yearNumber)) notFound();

  const rows = sortForIndex(await getFilteredResults({ year: params.year, competition, event }));
  if (rows.length === 0) notFound();

  const groups = ["Final A", "Final B"].filter((group) => rows.some((row) => row.final_group === group));
  const winner = rows.find((row) => row.final_group === "Final A" && row.rank === 1);
  const path = `/results/${params.year}/${encodeURIComponent(competition)}/${encodeURIComponent(event)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "検索", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "大会結果一覧", item: `${siteUrl}/results` },
          { "@type": "ListItem", position: 3, name: `${params.year}年`, item: `${siteUrl}/results/${params.year}` },
          {
            "@type": "ListItem",
            position: 4,
            name: competition,
            item: `${siteUrl}/results/${params.year}/${encodeURIComponent(competition)}`
          },
          { "@type": "ListItem", position: 5, name: event, item: `${siteUrl}${path}` }
        ]
      },
      {
        "@type": "SportsEvent",
        name: `${competition} ${event}`,
        sport: "Rowing",
        startDate: params.year,
        eventStatus: "https://schema.org/EventScheduled",
        url: `${siteUrl}${path}`
      }
    ]
  };

  return (
    <main className="container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">検索</Link>
        <span aria-hidden="true">›</span>
        <Link href="/results">大会結果一覧</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/results/${params.year}`}>{params.year}年</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/results/${params.year}/${encodeURIComponent(competition)}`}>{competition}</Link>
        <span aria-hidden="true">›</span>
        <span>{event}</span>
      </nav>
      <header className="hero">
        <div>
          <h1>
            {event}の結果（{params.year}年 {competition}）
          </h1>
          <p className="subtitle">
            {winner
              ? `優勝は${winner.organization}（${winner.time_display}）。`
              : ""}
            Final A・Final Bの順位・クルー・タイムを掲載しています。
          </p>
          <ShareXLink
            text={
              winner
                ? `${params.year}年 ${competition} ${event} 優勝は${winner.organization}（${winner.time_display}） | RowingAPI`
                : `${params.year}年 ${competition} ${event}の結果 | RowingAPI`
            }
            path={path}
            hashtags={["ローイング", "ボート"]}
          />
        </div>
      </header>

      {groups.map((group) => (
        <section key={group} className="static-section">
          <h2>{group}</h2>
          <div className="static-table-wrap">
            <table className="static-table">
              <caption className="static-table-caption">
                {event} {group}（{params.year}年 {competition}）
              </caption>
              <thead>
                <tr>
                  <th>順位</th>
                  <th>クルー</th>
                  <th>団体</th>
                  <th>タイム</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((row) => row.final_group === group)
                  .map((row) => (
                    <tr key={row.id}>
                      <td>{row.rank}</td>
                      <td>{crewCell(row)}</td>
                      <td>
                        <Link href={`/organizations/${encodeURIComponent(organizationSlug(row.organization))}`}>
                          {row.organization}
                        </Link>
                      </td>
                      <td>{row.time_display}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="static-cta">
        {event}の歴代最速タイムは<Link href={`/records/${encodeURIComponent(event)}`}>歴代記録ページ</Link>
        で、この大会の全種目は
        <Link href={`/results/${params.year}/${encodeURIComponent(competition)}`}>大会結果ページ</Link>
        で確認できます。
      </p>
    </main>
  );
}
