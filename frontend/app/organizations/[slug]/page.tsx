import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareXLink } from "../../components/share-x-link";
import {
  findOrganizationBySlug,
  getFilteredResults,
  listOrganizations,
  organizationSlug,
  type ResultRecord
} from "../../../lib/results-data";
import { siteUrl } from "../../../lib/site-url";

type Params = { slug: string };

export const dynamicParams = true;

function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams(): Promise<Params[]> {
  const organizations = await listOrganizations();
  return organizations.map((name) => ({ slug: organizationSlug(name) }));
}

type MedalCounts = { gold: number; silver: number; bronze: number };

function medalCounts(rows: ResultRecord[]): MedalCounts {
  const finalA = rows.filter((row) => row.final_group === "Final A");
  return {
    gold: finalA.filter((row) => row.rank === 1).length,
    silver: finalA.filter((row) => row.rank === 2).length,
    bronze: finalA.filter((row) => row.rank === 3).length
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const organization = await findOrganizationBySlug(decodeSlug(params.slug));
  if (!organization) return {};

  const rows = await getFilteredResults({ organization });
  const medals = medalCounts(rows);
  const path = `/organizations/${encodeURIComponent(organizationSlug(organization))}`;
  const title = `${organization}のローイング・ボート記録`;
  const description = `${organization}のローイング（ボート）大会成績。通算${rows.length}件の記録、優勝${medals.gold}回・2位${medals.silver}回・3位${medals.bronze}回。種目別ベストタイムと年度別戦績を掲載しています。`;
  const ogImage = `${siteUrl}/og?title=${encodeURIComponent(organization)}&subtitle=${encodeURIComponent(`優勝${medals.gold}回 ・ 通算${rows.length}件の記録`)}`;

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

export default async function OrganizationPage({ params }: { params: Params }) {
  const organization = await findOrganizationBySlug(decodeSlug(params.slug));
  if (!organization) notFound();

  const rows = await getFilteredResults({ organization });
  if (rows.length === 0) notFound();

  const medals = medalCounts(rows);
  const path = `/organizations/${encodeURIComponent(organizationSlug(organization))}`;

  // 種目別ベストタイム（決勝グループを問わず最速の1件）
  const bestByEvent = new Map<string, ResultRecord>();
  rows.forEach((row) => {
    const current = bestByEvent.get(row.event_name);
    if (!current || row.time_seconds < current.time_seconds) {
      bestByEvent.set(row.event_name, row);
    }
  });
  const bestRows = Array.from(bestByEvent.values()).sort((a, b) =>
    a.event_name.localeCompare(b.event_name, "ja")
  );

  // 年度別戦績（新しい年から）
  const yearMap = new Map<number, ResultRecord[]>();
  rows.forEach((row) => {
    const list = yearMap.get(row.year) ?? [];
    list.push(row);
    yearMap.set(row.year, list);
  });
  const yearSummaries = Array.from(yearMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({ year, count: list.length, ...medalCounts(list) }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "検索", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "団体別成績", item: `${siteUrl}/organizations` },
          { "@type": "ListItem", position: 3, name: organization, item: `${siteUrl}${path}` }
        ]
      },
      {
        "@type": "SportsOrganization",
        name: organization,
        sport: "Rowing",
        url: `${siteUrl}${path}`
      }
    ]
  };

  return (
    <main className="site-container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">検索</Link>
        <span aria-hidden="true">›</span>
        <Link href="/organizations">団体別成績</Link>
        <span aria-hidden="true">›</span>
        <span>{organization}</span>
      </nav>
      <header className="hero">
        <div>
          <h1>{organization}のローイング・ボート記録</h1>
          <p className="subtitle">
            {organization}のローイング（ボート・漕艇）大会記録を通算{rows.length.toLocaleString()}件収録しています。
          </p>
          <ShareXLink
            text={`${organization}のローイング成績（優勝${medals.gold}回・通算${rows.length}件） | レガッタナビ`}
            path={path}
            hashtags={["ローイング", "ボート"]}
          />
        </div>
      </header>

      <section className="static-section">
        <h2>通算成績サマリー</h2>
        <div className="org-medal-grid">
          <div className="org-medal-card">
            <span className="org-medal-label">🥇 優勝</span>
            <span className="org-medal-value">{medals.gold}</span>
          </div>
          <div className="org-medal-card">
            <span className="org-medal-label">🥈 2位</span>
            <span className="org-medal-value">{medals.silver}</span>
          </div>
          <div className="org-medal-card">
            <span className="org-medal-label">🥉 3位</span>
            <span className="org-medal-value">{medals.bronze}</span>
          </div>
          <div className="org-medal-card">
            <span className="org-medal-label">収録記録数</span>
            <span className="org-medal-value">{rows.length.toLocaleString()}</span>
          </div>
        </div>
      </section>

      <section className="static-section">
        <h2>種目別ベストタイム</h2>
        <div className="static-table-wrap">
          <table className="static-table">
            <caption className="static-table-caption">{organization}の種目別ベストタイム（収録データ内）</caption>
            <thead>
              <tr>
                <th>種目</th>
                <th>ベストタイム</th>
                <th>年</th>
                <th>大会</th>
              </tr>
            </thead>
            <tbody>
              {bestRows.map((row) => (
                <tr key={row.event_name}>
                  <td>
                    <Link href={`/records/${encodeURIComponent(row.event_name)}`}>{row.event_name}</Link>
                  </td>
                  <td>{row.time_display}</td>
                  <td>{row.year}</td>
                  <td>
                    <Link href={`/results/${row.year}/${encodeURIComponent(row.competition_name)}`}>
                      {row.competition_name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="static-section">
        <h2>年度別戦績</h2>
        <div className="static-table-wrap">
          <table className="static-table">
            <caption className="static-table-caption">{organization}の年度別戦績（Final Aのメダル数）</caption>
            <thead>
              <tr>
                <th>年</th>
                <th>記録数</th>
                <th>優勝</th>
                <th>2位</th>
                <th>3位</th>
              </tr>
            </thead>
            <tbody>
              {yearSummaries.map((summary) => (
                <tr key={summary.year}>
                  <td>
                    <Link href={`/results/${summary.year}`}>{summary.year}</Link>
                  </td>
                  <td>{summary.count}</td>
                  <td>{summary.gold}</td>
                  <td>{summary.silver}</td>
                  <td>{summary.bronze}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="static-cta">
        個別のレース結果は
        <Link href={`/?${new URLSearchParams({ organization }).toString()}`}>
          記録検索ページで{organization}の記録を開く
        </Link>
        と確認できます。
      </p>
    </main>
  );
}
