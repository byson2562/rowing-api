import { describe, expect, it } from "vitest";

import {
  formatTimeDisplay,
  normalizeEventName,
  organizationSlug,
  paginate
} from "./results-data";

describe("normalizeEventName", () => {
  it("表記ゆれを統一する", () => {
    expect(normalizeEventName("男子舵手付きフォア")).toBe("男子舵手つきフォア");
    expect(normalizeEventName("男子舵手付フォア")).toBe("男子舵手つきフォア");
    expect(normalizeEventName("男子クオドルプル")).toBe("男子クォドルプル");
  });

  it("正規の表記はそのまま返す", () => {
    expect(normalizeEventName("男子エイト")).toBe("男子エイト");
  });
});

describe("formatTimeDisplay", () => {
  it("秒を m:ss.cc 形式にする", () => {
    expect(formatTimeDisplay(372.08)).toBe("6:12.08");
    expect(formatTimeDisplay(353.14)).toBe("5:53.14");
  });

  it("繰り上がりを正しく処理する", () => {
    // センチ秒が丸めで100になるケース
    expect(formatTimeDisplay(372.995)).toBe("6:13.00");
  });

  it("0以下や不正な値は空文字にする", () => {
    expect(formatTimeDisplay(0)).toBe("");
    expect(formatTimeDisplay(-5)).toBe("");
    expect(formatTimeDisplay(Number.NaN)).toBe("");
  });
});

describe("organizationSlug", () => {
  it("スラッシュを -- に置き換える", () => {
    expect(organizationSlug("A/B")).toBe("A--B");
    expect(organizationSlug("日本大学")).toBe("日本大学");
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 120 }, (_, i) => i);

  it("ページとper_pageで切り出す", () => {
    const { data, pagination } = paginate(rows, "2", "50");
    expect(data).toHaveLength(50);
    expect(data[0]).toBe(50);
    expect(pagination).toEqual({ page: 2, per_page: 50, total_count: 120, total_pages: 3 });
  });

  it("不正値はクランプする(page>=1, per_page 1..200)", () => {
    expect(paginate(rows, "0", "500").pagination).toMatchObject({ page: 1, per_page: 200 });
    expect(paginate(rows, "abc", "0").pagination).toMatchObject({ page: 1, per_page: 50 });
  });
});
