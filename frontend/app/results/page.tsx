import type { Metadata } from "next";
import Link from "next/link";

import {
  availableYears,
  COMPETITION_CATEGORY_RULES,
  competitionsByRecency,
  getFilteredResults
} from "../../lib/results-data";
import { siteUrl } from "../../lib/site-url";
import { ogImageUrl } from "../../lib/og-image";
import { FIXED_OG } from "../../lib/og-targets";

export const metadata: Metadata = {
  title: "年度別ローイング大会結果一覧",
  description:
    "ローイング（ボート）大会結果を年度別に一覧できます。全日本選手権・全日本大学選手権・全日本新人選手権などの記録を年度・大会ごとに確認できます。",
  alternates: { canonical: "/results" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/results",
    siteName: "レガッタナビ",
    title: "年度別ローイング大会結果一覧 | レガッタナビ",
    description: "ローイング（ボート）大会結果を年度別に一覧できます。",
    images: [
      {
        url: ogImageUrl(FIXED_OG.results),
        width: 1200,
        height: 630,
        alt: "年度別ローイング大会結果一覧"
      }
    ]
  }
};

type Category = (typeof COMPETITION_CATEGORY_RULES)[number];
type Cell = { competition: string; label: string; joint: boolean };

// 表の列は開催時期の順ではなく、検索で探されやすい順に固定する
const COLUMNS: { label: Category["label"]; heading: string }[] = [
  { label: "全日本選手権", heading: "全日本選手権" },
  { label: "全日本大学選手権", heading: "大学選手権（インカレ）" },
  { label: "全日本新人選手権", heading: "新人選手権" },
  { label: "全日本社会人選手権", heading: "社会人選手権" },
  { label: "全日本軽量級選手権", heading: "軽量級選手権" }
];

function rulesFor(competition: string): Category[] {
  return COMPETITION_CATEGORY_RULES.filter((rule) => rule.keywords.some((keyword) => competition.includes(keyword)));
}

// 併催の大会名(「／」「兼」でつないだもの)は、その大会の部分から回次を取る
function editionLabel(competition: string, rule: Category): string {
  const part = competition.split(/／|兼/).find((segment) => rule.keywords.some((keyword) => segment.includes(keyword)));
  const edition = part?.match(/第(\d+)回/);
  return edition ? `第${edition[1]}回` : "結果";
}

function buildRow(competitions: string[]) {
  const cells = new Map<string, Cell[]>();
  const others: string[] = [];
  for (const competition of competitions) {
    const rules = rulesFor(competition);
    if (rules.length === 0) others.push(competition);
    for (const rule of rules) {
      const cell = { competition, label: editionLabel(competition, rule), joint: rules.length > 1 };
      cells.set(rule.label, [...(cells.get(rule.label) ?? []), cell]);
    }
  }
  return { cells, others };
}

function competitionHref(year: number, competition: string): string {
  return `/results/${year}/${encodeURIComponent(competition)}`;
}

export default async function ResultsIndexPage() {
  const years = availableYears();
  const yearEntries = await Promise.all(
    years.map(async (year) => {
      const rows = await getFilteredResults({ year: String(year) });
      return {
        year,
        totalCount: rows.length,
        ...buildRow(competitionsByRecency(rows))
      };
    })
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
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
    <main className="site-container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
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

      <section className="static-section">
        <h2>年度・大会別の結果</h2>
        <div className="static-table-wrap">
          <table className="static-table results-matrix">
            <caption className="static-table-caption">回次を押すと、その大会の種目別の結果を開きます</caption>
            <thead>
              <tr>
                <th scope="col">年</th>
                {COLUMNS.map((column) => (
                  <th scope="col" key={column.label}>
                    {column.heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yearEntries.map((entry) => (
                <tr key={entry.year}>
                  <th scope="row">
                    <Link href={`/results/${entry.year}`}>{entry.year}年</Link>
                    <span className="results-matrix-count">{entry.totalCount.toLocaleString()}件</span>
                  </th>
                  {COLUMNS.map((column) => {
                    const cells = entry.cells.get(column.label) ?? [];
                    return (
                      <td key={column.label} data-label={column.heading} className={cells.length ? undefined : "is-empty"}>
                        {cells.length ? (
                          cells.map((cell) => (
                            <span className="results-matrix-cell" key={cell.competition}>
                              <Link href={competitionHref(entry.year, cell.competition)} title={cell.competition}>
                                {cell.label}
                              </Link>
                              {cell.joint ? <span className="results-matrix-note">併催</span> : null}
                            </span>
                          ))
                        ) : (
                          <span aria-label="開催なし・未収録">–</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {yearEntries.some((entry) => entry.others.length > 0) ? (
        <section className="static-section">
          <h2>その他の大会</h2>
          <ul className="static-links">
            {yearEntries.flatMap((entry) =>
              entry.others.map((competition) => (
                <li key={`${entry.year}-${competition}`}>
                  <Link href={competitionHref(entry.year, competition)}>
                    {entry.year}年 {competition}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      <p className="static-cta">
        条件を組み合わせて探す場合は<Link href="/search">記録検索ページ</Link>をご利用ください。
      </p>
    </main>
  );
}
