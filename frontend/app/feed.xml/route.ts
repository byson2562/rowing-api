import { availableYears, competitionsByRecency, getFilteredResults } from "../../lib/results-data";
import { siteUrl } from "../../lib/site-url";

// JARA自動更新パイプラインが新しい大会データをcommitすると再デプロイされ、
// このフィードにも新着大会として現れる（データに開催日はないため年初日を擬似日付に使う）
export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const items: { title: string; url: string; year: number; count: number }[] = [];
  for (const year of availableYears()) {
    const rows = await getFilteredResults({ year: String(year) });
    competitionsByRecency(rows).forEach((competition) => {
      items.push({
        title: `${competition}（${year}年）の結果`,
        url: `${siteUrl}/results/${year}/${encodeURIComponent(competition)}`,
        year,
        count: rows.filter((row) => row.competition_name === competition).length
      });
    });
  }
  items.sort((a, b) => b.year - a.year);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>レガッタナビ 大会結果</title>
    <link>${siteUrl}/results</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>ローイング（ボート）大会結果の新着フィード。全日本選手権・全日本大学選手権などの記録を大会単位で配信します。</description>
    <language>ja</language>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <description>${escapeXml(`種目別のFinal A/B結果 全${item.count}件を掲載。`)}</description>
      <pubDate>${new Date(Date.UTC(item.year, 0, 1)).toUTCString()}</pubDate>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}
