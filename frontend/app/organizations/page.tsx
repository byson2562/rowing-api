import type { Metadata } from "next";
import Link from "next/link";

import {
  allResults,
  isStudentOrganization,
  listOrganizations,
  organizationSlug
} from "../../lib/results-data";
import { siteUrl } from "../../lib/site-url";

export const metadata: Metadata = {
  title: "団体別ローイング成績一覧",
  description:
    "大学・クラブなど団体別のローイング（ボート）成績一覧。全日本選手権・全日本大学選手権などの通算メダル数・種目別ベストタイム・年度別戦績を団体ごとに確認できます。",
  alternates: { canonical: "/organizations" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/organizations",
    siteName: "レガッタナビ",
    title: "団体別ローイング成績一覧 | レガッタナビ",
    description: "大学・クラブなど団体別のローイング（ボート）成績一覧。",
    images: [
      {
        url: `${siteUrl}/og?title=${encodeURIComponent("団体別 成績一覧")}&subtitle=${encodeURIComponent("ローイング大会結果")}`,
        width: 1200,
        height: 630,
        alt: "団体別ローイング成績一覧"
      }
    ]
  }
};

export default async function OrganizationsIndexPage() {
  const [organizations, rows] = await Promise.all([listOrganizations(), allResults()]);

  const recordCount = new Map<string, number>();
  const goldCount = new Map<string, number>();
  rows.forEach((row) => {
    recordCount.set(row.organization, (recordCount.get(row.organization) ?? 0) + 1);
    if (row.final_group === "Final A" && row.rank === 1) {
      goldCount.set(row.organization, (goldCount.get(row.organization) ?? 0) + 1);
    }
  });

  const students = organizations.filter((name) => isStudentOrganization(name));
  const socials = organizations.filter((name) => !isStudentOrganization(name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "検索", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "団体別成績", item: `${siteUrl}/organizations` }
        ]
      },
      {
        "@type": "ItemList",
        name: "団体別ローイング成績",
        itemListElement: organizations.slice(0, 100).map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
          url: `${siteUrl}/organizations/${encodeURIComponent(organizationSlug(name))}`
        }))
      }
    ]
  };

  const renderGroup = (title: string, names: string[]) => (
    <section className="static-section">
      <h2>
        {title}
        <span className="static-count">{names.length}団体</span>
      </h2>
      <ul className="static-links org-links">
        {names.map((name) => (
          <li key={name}>
            <Link href={`/organizations/${encodeURIComponent(organizationSlug(name))}`}>{name}</Link>
            <span className="static-count">
              {(recordCount.get(name) ?? 0).toLocaleString()}件
              {goldCount.get(name) ? ` ・ 優勝${goldCount.get(name)}回` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <main className="container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">検索</Link>
        <span aria-hidden="true">›</span>
        <span>団体別成績</span>
      </nav>
      <header className="hero">
        <div>
          <h1>団体別ローイング成績一覧</h1>
          <p className="subtitle">
            全{organizations.length}団体の通算メダル数・種目別ベストタイム・年度別戦績を団体ごとのページで確認できます。
          </p>
        </div>
      </header>

      {renderGroup("大学・学校", students)}
      {renderGroup("社会人・クラブ", socials)}

      <p className="static-cta">
        条件を組み合わせて探す場合は<Link href="/">記録検索ページ</Link>をご利用ください。
      </p>
    </main>
  );
}
