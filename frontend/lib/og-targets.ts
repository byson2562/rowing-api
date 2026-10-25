// OG画像の (title, subtitle) の定義。
//
// 各ページの generateMetadata と、ビルド時に全画像を書き出す app/og-manifest.json の両方が
// ここを使うので、ページが参照する画像は必ず生成される。新しいページ種別を足したら
// listOgTargets にも足すこと。

import { articles, type ArticleMeta } from "./articles";
import type { OgTarget } from "./og-image";
import {
  availableYears,
  competitionsByRecency,
  getFilteredResults,
  isRecordEvent,
  listAthleteResults,
  type ResultRecord
} from "./results-data";

export const FIXED_OG = {
  default: {} as OgTarget,
  about: { title: "レガッタナビとは", subtitle: "ローイング大会結果データベース" },
  contact: { title: "お問い合わせ", subtitle: "レガッタナビ" },
  privacy: { title: "プライバシーポリシー", subtitle: "レガッタナビ" },
  sponsor: { title: "スポンサー募集", subtitle: "レガッタナビ" },
  articles: { title: "記事・データ分析", subtitle: "ローイング大会結果データベース" },
  results: { title: "年度別 大会結果一覧", subtitle: "ローイング大会結果" },
  records: { title: "歴代最速タイム", subtitle: "種目別ランキング" },
  organizations: { title: "団体別 成績一覧", subtitle: "ローイング大会結果" },
  athletes: { title: "選手別 成績一覧", subtitle: "シングルスカル" }
} satisfies Record<string, OgTarget>;

// 記事は見出しを OG 用に手で短くしている。ここに無い記事は「主題 | 補足」の分割で代用する
const ARTICLE_OG: Record<string, OgTarget> = {
  "freshman-championship-2026-results": {
    title: "全日本新人ローイング選手権2026の結果",
    subtitle: "第67回 種目別の優勝クルーとタイム"
  },
  "university-championship-2026-results": {
    title: "インカレ(ボート)2026の結果",
    subtitle: "全日本大学ローイング選手権 種目別の優勝校とタイム"
  },
  "rowing-glossary": { title: "ローイング用語集", subtitle: "種目・大会・練習でよく出る言葉" },
  "university-championship-guide": {
    title: "全日本大学ローイング選手権ガイド",
    subtitle: "種目・歴代優勝校・年別の結果"
  },
  "university-power-map-2009-2025": {
    title: "大学ボートの勢力図 2009-2025",
    subtitle: "金メダル202個を男女別に集計"
  },
  "freshman-championship-guide": {
    title: "全日本新人ローイング選手権とは",
    subtitle: "2026年の日程・種目・歴代優勝クルー"
  }
,
  "first-regatta": { title: "はじめてのボート大会", subtitle: "当日の流れと結果の見方" }
};

export function articleOg(article: Pick<ArticleMeta, "slug" | "title">): OgTarget {
  const fixed = ARTICLE_OG[article.slug];
  if (fixed) return fixed;
  const [main, ...rest] = article.title.split("|");
  const subtitle = rest.join("|").trim();
  return { title: main.trim(), subtitle: subtitle || undefined };
}

export const yearOg = (year: string | number): OgTarget => ({
  title: `${year}年の大会結果`,
  subtitle: "ローイング大会結果"
});

export const competitionOg = (year: string | number, competition: string): OgTarget => ({
  title: competition,
  subtitle: `${year}年 ローイング大会結果`
});

export const eventOg = (
  year: string | number,
  competition: string,
  event: string,
  winner: ResultRecord | undefined
): OgTarget => ({
  title: event,
  subtitle: winner ? `優勝 ${winner.organization} ${winner.time_display}（${year}年）` : `${year}年 ${competition}`
});

export const athleteOg = (name: string, best: ResultRecord): OgTarget => ({
  title: name,
  subtitle: `${best.event_name} ${best.time_display}（${best.year}年）`
});

export const organizationOg = (organization: string, gold: number, total: number): OgTarget => ({
  title: organization,
  subtitle: `優勝${gold}回 ・ 通算${total}件の記録`
});

export const recordOg = (event: string, best: ResultRecord | undefined): OgTarget => ({
  title: `${event} 歴代最速`,
  subtitle: best ? `${best.time_display} ${best.organization}（${best.year}年）` : "歴代タイムランキング"
});

export function finalAWinner(rows: ResultRecord[]): ResultRecord | undefined {
  return rows.find((row) => row.final_group === "Final A" && row.rank === 1);
}

export function fastest(rows: ResultRecord[]): ResultRecord | undefined {
  return [...rows].sort((a, b) => a.time_seconds - b.time_seconds)[0];
}

/** サイト内の全ページが参照する OG 画像の定義を列挙する(ビルド時の一括生成用) */
export async function listOgTargets(): Promise<OgTarget[]> {
  const targets: OgTarget[] = [...Object.values(FIXED_OG), ...articles.map(articleOg)];

  const allRows = await getFilteredResults({});
  const byOrganization = new Map<string, ResultRecord[]>();
  const byEvent = new Map<string, ResultRecord[]>();
  allRows.forEach((row) => {
    byOrganization.set(row.organization, [...(byOrganization.get(row.organization) ?? []), row]);
    byEvent.set(row.event_name, [...(byEvent.get(row.event_name) ?? []), row]);
  });

  for (const year of availableYears()) {
    targets.push(yearOg(year));
    const rows = await getFilteredResults({ year: String(year) });
    competitionsByRecency(rows).forEach((competition) => targets.push(competitionOg(year, competition)));
    const seen = new Set<string>();
    rows.forEach((row) => {
      const key = `${row.competition_name}|${row.event_name}`;
      if (seen.has(key)) return;
      seen.add(key);
      const eventRows = rows.filter((r) => r.competition_name === row.competition_name && r.event_name === row.event_name);
      targets.push(eventOg(year, row.competition_name, row.event_name, finalAWinner(eventRows)));
    });
  }

  const byAthlete = new Map<string, ResultRecord[]>();
  (await listAthleteResults()).forEach((row) => {
    byAthlete.set(row.crew_name, [...(byAthlete.get(row.crew_name) ?? []), row]);
  });
  byAthlete.forEach((rows, name) => {
    const best = fastest(rows);
    if (best) targets.push(athleteOg(name, best));
  });

  byOrganization.forEach((rows, organization) => {
    const gold = rows.filter((row) => row.final_group === "Final A" && row.rank === 1).length;
    targets.push(organizationOg(organization, gold, rows.length));
  });

  byEvent.forEach((rows, event) => {
    if (isRecordEvent(event)) targets.push(recordOg(event, fastest(rows)));
  });

  return targets;
}
