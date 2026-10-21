import { describe, expect, it } from "vitest";

import { formatDateRange, pickFeaturedCompetition, todayInTokyo, type ScheduledCompetition } from "./schedule";

const freshman: ScheduledCompetition = {
  name: "第67回全日本新人ローイング選手権大会",
  category: "全日本新人選手権",
  start: "2026-10-23",
  end: "2026-10-25",
  venue: "戸田",
  url: "https://example.invalid/"
};
const univ: ScheduledCompetition = {
  name: "第53回全日本大学ローイング選手権大会",
  category: "全日本大学選手権",
  start: "2026-08-26",
  end: "2026-08-30",
  venue: "戸田",
  url: "https://example.invalid/"
};
const all = [freshman, univ];
const none = () => false;
const allRecorded = () => true;

describe("pickFeaturedCompetition", () => {
  it("開始前は90日以内の次の大会を upcoming で返す", () => {
    const picked = pickFeaturedCompetition(all, "2026-10-21", allRecorded);
    expect(picked).toMatchObject({ status: "upcoming", competition: freshman, daysUntil: 2 });
  });

  it("開催期間中は ongoing(初日と最終日を含む)", () => {
    expect(pickFeaturedCompetition(all, "2026-10-23", allRecorded)?.status).toBe("ongoing");
    expect(pickFeaturedCompetition(all, "2026-10-25", allRecorded)?.status).toBe("ongoing");
  });

  it("終了後、収録前は awaiting_results。収録後は次の大会へ", () => {
    expect(pickFeaturedCompetition(all, "2026-10-26", none)).toMatchObject({ status: "awaiting_results", competition: freshman });
    expect(pickFeaturedCompetition(all, "2026-10-26", allRecorded)).toBeNull();
  });

  it("結果待ちが複数あれば最後に終わった大会を出す", () => {
    const picked = pickFeaturedCompetition(all, "2026-11-01", none);
    expect(picked?.competition).toBe(freshman);
  });

  it("次の大会が90日より先なら何も出さない", () => {
    expect(pickFeaturedCompetition(all, "2026-05-01", allRecorded)).toBeNull();
    expect(pickFeaturedCompetition(all, "2026-05-28", allRecorded)?.status).toBe("upcoming");
  });
});

describe("formatDateRange", () => {
  it("同じ月は2つ目の月を省き、曜日を付ける", () => {
    expect(formatDateRange("2026-10-23", "2026-10-25")).toBe("10月23日(金)〜25日(日)");
  });
  it("月をまたぐときは両方に月を付ける", () => {
    expect(formatDateRange("2026-08-30", "2026-09-01")).toBe("8月30日(日)〜9月1日(火)");
  });
  it("1日だけの大会は範囲にしない", () => {
    expect(formatDateRange("2026-11-01", "2026-11-01")).toBe("11月1日(日)");
  });
});

describe("todayInTokyo", () => {
  it("UTC の深夜でも JST の日付を返す", () => {
    expect(todayInTokyo(new Date("2026-10-22T16:00:00Z"))).toBe("2026-10-23");
  });
});
