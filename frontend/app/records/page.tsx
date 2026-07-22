import type { Metadata } from "next";
import Link from "next/link";

import { allResults, listRecordEventNames, type ResultRecord } from "../../lib/results-data";
import { siteUrl } from "../../lib/site-url";

export const metadata: Metadata = {
  title: "種目別 歴代最速タイムランキング",
  description:
    "ローイング（ボート）の種目別・歴代最速タイムランキング。全日本選手権・全日本大学選手権などの2000mレース記録から、男子エイト・シングルスカルなど各種目の歴代最速記録を掲載しています。",
  alternates: { canonical: "/records" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/records",
    siteName: "レガッタナビ",
    title: "種目別 歴代最速タイムランキング | レガッタナビ",
    description: "ローイング（ボート）の種目別・歴代最速タイムランキング。",
    images: [
      {
        url: `${siteUrl}/og?title=${encodeURIComponent("歴代最速タイム")}&subtitle=${encodeURIComponent("種目別ランキング")}`,
        width: 1200,
        height: 630,
        alt: "種目別 歴代最速タイムランキング"
      }
    ]
  }
};

const EVENT_GROUPS = [
  { label: "男子", match: (name: string) => name.startsWith("男子") },
  { label: "女子", match: (name: string) => name.startsWith("女子") },
  { label: "軽量級", match: (name: string) => name.startsWith("軽量級") }
] as const;

export default async function RecordsIndexPage() {
  const [events, rows] = await Promise.all([listRecordEventNames(), allResults()]);

  const bestByEvent = new Map<string, ResultRecord>();
  rows.forEach((row) => {
    const current = bestByEvent.get(row.event_name);
    if (!current || row.time_seconds < current.time_seconds) {
      bestByEvent.set(row.event_name, row);
    }
  });

  const grouped: { label: string; events: string[] }[] = [];
  const used = new Set<string>();
  EVENT_GROUPS.forEach((group) => {
    const names = events.filter((name) => !used.has(name) && group.match(name));
    names.forEach((name) => used.add(name));
    if (names.length > 0) grouped.push({ label: group.label, events: names });
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "検索", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "歴代最速タイム", item: `${siteUrl}/records` }
        ]
      },
      {
        "@type": "ItemList",
        name: "種目別 歴代最速タイムランキング",
        itemListElement: events.map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${name}の歴代最速タイム`,
          url: `${siteUrl}/records/${encodeURIComponent(name)}`
        }))
      }
    ]
  };

  return (
    <main className="site-container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">検索</Link>
        <span aria-hidden="true">›</span>
        <span>歴代最速タイム</span>
      </nav>
      <header className="hero">
        <div>
          <h1>種目別 歴代最速タイムランキング</h1>
          <p className="subtitle">
            収録している全日本規模の大会結果（2009年以降）から、種目ごとの歴代最速タイムをランキング形式で掲載しています。
          </p>
        </div>
      </header>

      {grouped.map((group) => (
        <section key={group.label} className="static-section">
          <h2>
            {group.label}
            <span className="static-count">{group.events.length}種目</span>
          </h2>
          <div className="static-table-wrap">
            <table className="static-table">
              <caption className="static-table-caption">{group.label}種目の現在の最速記録</caption>
              <thead>
                <tr>
                  <th>種目</th>
                  <th>最速タイム</th>
                  <th>団体</th>
                  <th>年</th>
                </tr>
              </thead>
              <tbody>
                {group.events.map((name) => {
                  const best = bestByEvent.get(name);
                  return (
                    <tr key={name}>
                      <td>
                        <Link href={`/records/${encodeURIComponent(name)}`}>{name}</Link>
                      </td>
                      <td>{best?.time_display ?? "-"}</td>
                      <td>{best?.organization ?? "-"}</td>
                      <td>{best?.year ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="static-cta">
        条件を組み合わせて探す場合は<Link href="/">記録検索ページ</Link>をご利用ください。
      </p>
    </main>
  );
}
