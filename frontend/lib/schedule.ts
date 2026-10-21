// 「次の大会」の判定。data/schedule.json(手で転記した年度日程)と収録データを突き合わせ、
// ホームの帯に出す1件を決める。サイトは静的ビルドなので「今日」はビルド時の日付(JST)で固定される。
import scheduleJson from "../data/schedule.json";
import { allResults, competitionCategoryOf } from "./results-data";

export type ScheduledCompetition = {
  name: string;
  category: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  venue: string;
  url: string;
  guide?: string; // 関連するガイド記事の slug
};

export type ScheduleStatus = "upcoming" | "ongoing" | "awaiting_results";

export type FeaturedCompetition = {
  status: ScheduleStatus;
  competition: ScheduledCompetition;
  daysUntil: number; // upcoming のとき開始日までの日数(0=当日)
};

const schedule = scheduleJson as { competitions: ScheduledCompetition[] };

// 「次の大会」を出すのは開始が何日先まで、か。遠すぎる大会を出し続けないための上限
const UPCOMING_WINDOW_DAYS = 90;

/** JST の今日を YYYY-MM-DD で返す */
export function todayInTokyo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(now);
}

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * 日程と「収録済みか」から、帯に出す1件を選ぶ。
 * 優先順: 開催中 > 終了して結果待ち(収録前) > 90日以内に始まる次の大会。該当なしは null。
 */
export function pickFeaturedCompetition(
  competitions: ScheduledCompetition[],
  today: string,
  hasResults: (competition: ScheduledCompetition) => boolean
): FeaturedCompetition | null {
  const sorted = [...competitions].sort((a, b) => a.start.localeCompare(b.start));

  const ongoing = sorted.find((c) => c.start <= today && today <= c.end);
  if (ongoing) return { status: "ongoing", competition: ongoing, daysUntil: 0 };

  const awaiting = sorted.filter((c) => c.end < today && !hasResults(c)).pop();
  if (awaiting) return { status: "awaiting_results", competition: awaiting, daysUntil: 0 };

  const upcoming = sorted.find((c) => c.start > today);
  if (upcoming) {
    const daysUntil = dayDiff(today, upcoming.start);
    if (daysUntil <= UPCOMING_WINDOW_DAYS) return { status: "upcoming", competition: upcoming, daysUntil };
  }
  return null;
}

/** 収録データに、その大会(同じ年・同じカテゴリ)の結果があるか */
export async function hasRecordedResults(competition: ScheduledCompetition): Promise<boolean> {
  const year = Number(competition.start.slice(0, 4));
  const rows = await allResults({ year: String(year) });
  return rows.some((row) => competitionCategoryOf(row.competition_name) === competition.category);
}

/** ホーム用: ビルド時の今日で判定した「次の大会」 */
export async function featuredCompetition(now: Date = new Date()): Promise<FeaturedCompetition | null> {
  const today = todayInTokyo(now);
  const recorded = new Map<string, boolean>();
  for (const c of schedule.competitions) recorded.set(c.name, await hasRecordedResults(c));
  return pickFeaturedCompetition(schedule.competitions, today, (c) => recorded.get(c.name) ?? false);
}

/** 「10月23日(金)〜25日(日)」のような日程表記 */
export function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string, withMonth: boolean) => {
    // 正午UTCの時刻で曜日を取ると、タイムゾーンに関係なくその日付の曜日になる
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][new Date(`${iso}T12:00:00Z`).getUTCDay()];
    const month = Number(iso.slice(5, 7));
    const day = Number(iso.slice(8, 10));
    return `${withMonth ? `${month}月` : ""}${day}日(${weekday})`;
  };
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  if (start === end) return fmt(start, true);
  return `${fmt(start, true)}〜${fmt(end, !sameMonth)}`;
}
