import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  availableYears,
  competitionsByRecency,
  getFilteredResults,
  sortForIndex
} from "../../../lib/results-data";
import { siteUrl } from "../../../lib/site-url";

type Params = { year: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return availableYears().map((year) => ({ year: String(year) }));
}

function isValidYear(value: string): boolean {
  const year = Number(value);
  return Number.isInteger(year) && availableYears().includes(year);
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const year = params.year;
  const title = `${year}年のローイング大会結果`;
  const description = `${year}年に開催されたローイング（ボート）大会の結果一覧。全日本選手権などの種目別優勝クルー・タイムを掲載しています。`;
  const ogImage = `${siteUrl}/og?title=${encodeURIComponent(`${year}年の大会結果`)}&subtitle=${encodeURIComponent("ローイング大会結果")}`;

  return {
    title,
    description,
    alternates: { canonical: `/results/${year}` },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: `/results/${year}`,
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

export default async function YearResultsPage({ params }: { params: Params }) {
  if (!isValidYear(params.year)) notFound();
  const year = Number(params.year);

  const rows = sortForIndex(await getFilteredResults({ year: params.year }));
  const competitions = competitionsByRecency(rows);
  const years = availableYears();
  const yearIndex = years.indexOf(year);
  const newerYear = yearIndex > 0 ? years[yearIndex - 1] : null;
  const olderYear = yearIndex >= 0 && yearIndex < years.length - 1 ? years[yearIndex + 1] : null;

  const sections = competitions.map((competition) => ({
    competition,
    champions: rows.filter(
      (row) => row.competition_name === competition && row.final_group === "Final A" && row.rank === 1
    )
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "大会結果一覧", item: `${siteUrl}/results` },
          { "@type": "ListItem", position: 3, name: `${year}年`, item: `${siteUrl}/results/${year}` }
        ]
      },
      {
        "@type": "ItemList",
        name: `${year}年のローイング大会`,
        itemListElement: competitions.map((competition, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: competition,
          url: `${siteUrl}/results/${year}/${encodeURIComponent(competition)}`
        }))
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
        <span>{year}年</span>
      </nav>
      <header className="hero">
        <div>
          <h1>{year}年のローイング大会結果</h1>
          <p className="subtitle">
            {year}年に開催された{competitions.length}大会・全{rows.length.toLocaleString()}
            件のローイング（ボート）記録から、種目別の優勝クルーとタイムを掲載しています。
          </p>
        </div>
      </header>

      {sections.map((section) => (
        <section key={section.competition} className="static-section">
          <h2>
            <Link href={`/results/${year}/${encodeURIComponent(section.competition)}`}>{section.competition}</Link>
          </h2>
          <div className="static-table-wrap">
            <table className="static-table">
              <caption className="static-table-caption">種目別の優勝クルー（Final A 1位）</caption>
              <thead>
                <tr>
                  <th>種目</th>
                  <th>優勝クルー</th>
                  <th>団体</th>
                  <th>タイム</th>
                </tr>
              </thead>
              <tbody>
                {section.champions.map((row) => (
                  <tr key={row.id}>
                    <td>{row.event_name}</td>
                    <td>{row.crew_name}</td>
                    <td>{row.organization}</td>
                    <td>{row.time_display}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="static-more">
            <Link href={`/results/${year}/${encodeURIComponent(section.competition)}`}>
              {section.competition}のFinal A全結果を見る →
            </Link>
          </p>
        </section>
      ))}

      <nav className="static-year-nav" aria-label="年度ナビゲーション">
        {olderYear ? <Link href={`/results/${olderYear}`}>← {olderYear}年の大会結果</Link> : <span />}
        {newerYear ? <Link href={`/results/${newerYear}`}>{newerYear}年の大会結果 →</Link> : <span />}
      </nav>

      <p className="static-cta">
        種目・団体・順位などで絞り込む場合は
        <Link href={`/?year=${year}`}>{year}年の記録を検索ページで開く</Link>
        こともできます。
      </p>
    </main>
  );
}
