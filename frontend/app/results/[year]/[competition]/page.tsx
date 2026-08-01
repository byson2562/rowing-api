import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareXLink } from "../../../components/share-x-link";
import {
  availableYears,
  competitionsByRecency,
  getFilteredResults,
  isAthleteRecord,
  organizationSlug,
  sortForIndex,
  type ResultRecord
} from "../../../../lib/results-data";
import { siteUrl } from "../../../../lib/site-url";

type Params = { year: string; competition: string };

// ビルド時に全大会ページを生成しつつ、未知パラメータはページ内のnotFound判定に任せる
// （多バイトのdynamic paramsはdevでdynamicParams:falseの照合と相性が悪い）
export const dynamicParams = true;

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
  const ogImage = `${siteUrl}/og?title=${encodeURIComponent(competition)}&subtitle=${encodeURIComponent(`${year}年 ローイング大会結果`)}`;

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
            item: `${siteUrl}/results/${params.year}/${encodeURIComponent(competition)}`
          }
        ]
      }
    ]
  };

  return (
    <main className="site-container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link href="/results">大会結果一覧</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/results/${params.year}`}>{params.year}年</Link>
        <span aria-hidden="true">›</span>
        <span>{competition}</span>
      </nav>
      <header className="hero">
        <div>
          <h1>
            {competition}（{params.year}年）の結果
          </h1>
          <p className="subtitle">
            全{rows.length.toLocaleString()}件の記録のうち、種目別のFinal A結果（順位・クルー・タイム）を掲載しています。
          </p>
        </div>
      </header>

      {eventNames.map((eventName) => {
        const winner = (rowsByEvent.get(eventName) ?? []).find((row) => row.rank === 1);
        return (
        <section key={eventName} className="static-section">
          <h2>
            <Link href={`/results/${params.year}/${encodeURIComponent(competition)}/${encodeURIComponent(eventName)}`}>
              {eventName}
            </Link>
            <ShareXLink
              text={
                winner
                  ? `${params.year}年 ${competition} ${eventName} 優勝は${winner.organization}（${winner.time_display}） | レガッタナビ`
                  : `${params.year}年 ${competition} ${eventName}の結果 | レガッタナビ`
              }
              path={`/results/${params.year}/${encodeURIComponent(competition)}`}
              hashtags={["ローイング", "ボート"]}
            />
          </h2>
          <div className="static-table-wrap">
            <table className="static-table">
              <caption className="static-table-caption">
                {eventName} Final A（{params.year}年 {competition}）
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
                {(rowsByEvent.get(eventName) ?? []).map((row) => (
                  <tr key={row.id}>
                    <td data-label="順位">{row.rank}</td>
                    <td data-label="クルー">
                      {isAthleteRecord(row) ? (
                        <Link href={`/athletes/${encodeURIComponent(row.crew_name)}`}>{row.crew_name}</Link>
                      ) : (
                        row.crew_name
                      )}
                    </td>
                    <td data-label="団体">
                      <Link href={`/organizations/${encodeURIComponent(organizationSlug(row.organization))}`}>
                        {row.organization}
                      </Link>
                    </td>
                    <td data-label="タイム">{row.time_display}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        );
      })}

      <p className="static-cta">
        予選・敗者復活戦を含む全結果は
        <Link href={`/search?${searchQuery}`}>記録検索ページでこの大会を開く</Link>
        と確認できます。
      </p>
    </main>
  );
}
