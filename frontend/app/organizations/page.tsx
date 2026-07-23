import type { Metadata } from "next";
import Link from "next/link";

import {
  allResults,
  isStudentOrganization,
  listOrganizations,
  organizationSlug
} from "../../lib/results-data";
import { siteUrl } from "../../lib/site-url";
import {
  OrganizationsIndex,
  type OrganizationGroup
} from "../../components/organizations-index";

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

  // 高校(高校・高等学校を含む名称) / 大学(その他の学生団体・高専・混成含む) / 社会人・クラブ に分ける
  const isHighSchool = (name: string) => /高校|高等学校/.test(name);
  const highSchools = organizations.filter((name) => isHighSchool(name));
  const universities = organizations.filter(
    (name) => !isHighSchool(name) && isStudentOrganization(name)
  );
  const socials = organizations.filter(
    (name) => !isHighSchool(name) && !isStudentOrganization(name)
  );

  const toEntries = (names: string[]) =>
    names.map((name) => ({
      name,
      slug: organizationSlug(name),
      count: recordCount.get(name) ?? 0,
      gold: goldCount.get(name) ?? 0
    }));

  const groups: OrganizationGroup[] = [
    { title: "大学", items: toEntries(universities) },
    { title: "高校", items: toEntries(highSchools) },
    { title: "社会人・クラブ", items: toEntries(socials) }
  ].filter((group) => group.items.length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
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

  return (
    <main className="site-container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
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

      <OrganizationsIndex groups={groups} />

      <p className="static-cta">
        条件を組み合わせて探す場合は<Link href="/search">記録検索ページ</Link>をご利用ください。
      </p>
    </main>
  );
}
