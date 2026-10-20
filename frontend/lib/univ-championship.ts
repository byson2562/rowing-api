// 全日本大学ローイング選手権(インカレ)の集計。ホームの小さな図と、年別の結果記事が同じ数字を使う。
// 記事側(app/articles/university-*)は独自に集計しているが、定義はここと同じ:
//   - 大会名に「大学(ローイング)選手権」を含む大会
//   - JO(ジャパンオープン)種目は社会人も出るオープン枠なので、大学の種目別優勝からは外す
import { allResults, type ResultRecord } from "./results-data";

export const isUnivChampionship = (name: string) => /大学(ローイング)?選手権/.test(name);
export const isOpenEvent = (eventName: string) => eventName.startsWith("JO");

export const UNIV_EVENT_ORDER = [
  "男子エイト",
  "女子エイト",
  "男子舵手つきフォア",
  "女子舵手つきフォア",
  "男子フォア",
  "男子クォドルプル",
  "女子クォドルプル",
  "男子ダブルスカル",
  "女子ダブルスカル",
  "男子ペア",
  "女子ペア",
  "男子シングルスカル",
  "女子シングルスカル"
];

function eventIndex(name: string): number {
  const index = UNIV_EVENT_ORDER.indexOf(name);
  return index === -1 ? 99 : index;
}

async function univFinalA(): Promise<ResultRecord[]> {
  return (await allResults()).filter(
    (row) => isUnivChampionship(row.competition_name) && row.final_group === "Final A" && !isOpenEvent(row.event_name)
  );
}

export type ChampionGap = { event: string; winner: ResultRecord; gap: number };

/** その年のインカレ Final A の、種目ごとの優勝クルーと2位との差(秒)。2位の計時が無い種目は除く */
export async function championGaps(year: number): Promise<ChampionGap[]> {
  const rows = (await univFinalA()).filter((row) => row.year === year);
  const events = Array.from(new Set(rows.map((row) => row.event_name))).sort((a, b) => eventIndex(a) - eventIndex(b));
  return events.flatMap((event) => {
    const winner = rows.find((row) => row.event_name === event && row.rank === 1);
    const second = rows.find((row) => row.event_name === event && row.rank === 2);
    if (!winner || !second || winner.time_seconds <= 0 || second.time_seconds <= 0) return [];
    return [{ event, winner, gap: second.time_seconds - winner.time_seconds }];
  });
}

/** 年ごとの優勝団体(指定種目の Final A 1位)。収録のある年だけ返す */
export async function winnersByYear(eventName: string): Promise<{ year: number; organization: string }[]> {
  const rows = (await univFinalA()).filter((row) => row.event_name === eventName && row.rank === 1);
  const byYear = new Map<number, string>();
  rows.forEach((row) => {
    if (!byYear.has(row.year)) byYear.set(row.year, row.organization);
  });
  return Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, organization]) => ({ year, organization }));
}

/** 期間内の Final A 1位の回数を団体ごとに数える(多い順) */
export async function goldCounts(fromYear: number, toYear: number): Promise<{ organization: string; count: number }[]> {
  const rows = (await univFinalA()).filter((row) => row.rank === 1 && row.year >= fromYear && row.year <= toYear);
  const counts = new Map<string, number>();
  rows.forEach((row) => counts.set(row.organization, (counts.get(row.organization) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([organization, count]) => ({ organization, count }));
}
