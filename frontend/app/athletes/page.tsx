import type { Metadata } from "next";
import Link from "next/link";

import { listAthleteResults, type ResultRecord } from "../../lib/results-data";
import { siteUrl } from "../../lib/site-url";

export const metadata: Metadata = {
  title: "選手別シングルスカル成績一覧",
  description:
    "ローイング（ボート）シングルスカル種目の選手別成績一覧。全日本選手権・全日本大学選手権などの自己ベストタイムと年度別成績を選手ごとに確認できます。",
  alternates: { canonical: "/athletes" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/athletes",
    siteName: "RowingAPI",
    title: "選手別シングルスカル成績一覧 | RowingAPI",
    description: "ローイング（ボート）シングルスカル種目の選手別成績一覧。",
    images: [
      {
        url: `${siteUrl}/og?title=${encodeURIComponent("選手別 成績一覧")}&subtitle=${encodeURIComponent("シングルスカル")}`,
        width: 1200,
        height: 630,
        alt: "選手別シングルスカル成績一覧"
      }
    ]
  }
};

export default async function AthletesIndexPage() {
  const rows = await listAthleteResults();

  const byName = new Map<string, ResultRecord[]>();
  rows.forEach((row) => {
    const list = byName.get(row.crew_name) ?? [];
    list.push(row);
    byName.set(row.crew_name, list);
  });
  const athletes = Array.from(byName.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "ja"))
    .map(([name, list]) => {
      const best = [...list].sort((a, b) => a.time_seconds - b.time_seconds)[0];
      return { name, count: list.length, best };
    });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "検索", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "選手別成績", item: `${siteUrl}/athletes` }
        ]
      },
      {
        "@type": "ItemList",
        name: "選手別シングルスカル成績",
        itemListElement: athletes.slice(0, 100).map((athlete, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: athlete.name,
          url: `${siteUrl}/athletes/${encodeURIComponent(athlete.name)}`
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
        <span>選手別成績</span>
      </nav>
      <header className="hero">
        <div>
          <p className="hero-kicker">Rowing Athletes</p>
          <h1>選手別シングルスカル成績一覧</h1>
          <p className="subtitle">
            収録データで個人名が記録されているシングルスカル種目の選手、全{athletes.length}名の成績を掲載しています。
            団体種目（ペア〜エイト）は個人名が記録されていないため対象外です。
          </p>
        </div>
      </header>

      <section className="static-section">
        <h2>
          選手一覧
          <span className="static-count">{athletes.length}名</span>
        </h2>
        <ul className="static-links org-links">
          {athletes.map((athlete) => (
            <li key={athlete.name}>
              <Link href={`/athletes/${encodeURIComponent(athlete.name)}`}>{athlete.name}</Link>
              <span className="static-count">
                {athlete.best.organization} ・ ベスト{athlete.best.time_display} ・ {athlete.count}レース
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="static-cta">
        条件を組み合わせて探す場合は<Link href="/">記録検索ページ</Link>をご利用ください。
      </p>
    </main>
  );
}
