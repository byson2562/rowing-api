import type { Metadata } from "next";
import Link from "next/link";

import { availableYears, competitionsByRecency, getFilteredResults } from "../../lib/results-data";
import { siteUrl } from "../../lib/site-url";

export const metadata: Metadata = {
  title: "年度別ローイング大会結果一覧",
  description:
    "ローイング（ボート）大会結果を年度別に一覧できます。全日本選手権・全日本大学選手権・全日本新人選手権などの記録を年度・大会ごとに確認できます。",
  alternates: { canonical: "/results" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/results",
    siteName: "RowingAPI",
    title: "年度別ローイング大会結果一覧 | RowingAPI",
    description: "ローイング（ボート）大会結果を年度別に一覧できます。",
    images: [
      {
        url: `${siteUrl}/og?title=${encodeURIComponent("年度別 大会結果一覧")}&subtitle=${encodeURIComponent("ローイング大会結果")}`,
        width: 1200,
        height: 630,
        alt: "年度別ローイング大会結果一覧"
      }
    ]
  }
};

export default async function ResultsIndexPage() {
  const years = availableYears();
  const yearEntries = await Promise.all(
    years.map(async (year) => {
      const rows = await getFilteredResults({ year: String(year) });
      return {
        year,
        totalCount: rows.length,
        competitions: competitionsByRecency(rows)
      };
    })
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "検索", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "大会結果一覧", item: `${siteUrl}/results` }
        ]
      },
      {
        "@type": "ItemList",
        name: "年度別ローイング大会結果",
        itemListElement: years.map((year, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${year}年のローイング大会結果`,
          url: `${siteUrl}/results/${year}`
        }))
      }
    ]
  };

  return (
    <main className="container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">検索</Link>
        <span aria-hidden="true">›</span>
        <span>大会結果一覧</span>
      </nav>
      <header className="hero">
        <div>
          <h1>年度別ローイング大会結果一覧</h1>
          <p className="subtitle">
            全日本選手権・全日本大学選手権・全日本新人選手権などのローイング（ボート）大会結果を年度別に掲載しています。
          </p>
        </div>
      </header>

      {yearEntries.map((entry) => (
        <section key={entry.year} className="static-section">
          <h2>
            <Link href={`/results/${entry.year}`}>{entry.year}年のローイング大会結果</Link>
            <span className="static-count">{entry.totalCount.toLocaleString()}件</span>
          </h2>
          <ul className="static-links">
            {entry.competitions.map((competition) => (
              <li key={competition}>
                <Link href={`/results/${entry.year}/${encodeURIComponent(competition)}`}>{competition}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="static-cta">
        条件を組み合わせて探す場合は<Link href="/">記録検索ページ</Link>をご利用ください。
      </p>
    </main>
  );
}
