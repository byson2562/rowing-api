import { describe, expect, it } from "vitest";

import { formatMargin, formatRaceTime, shortOrgName } from "./race-format";

describe("formatRaceTime", () => {
  it("writes minutes, zero-padded seconds and hundredths", () => {
    expect(formatRaceTime(358.13)).toBe("5分58秒13");
    expect(formatRaceTime(361.26)).toBe("6分01秒26");
    expect(formatRaceTime(482.6)).toBe("8分02秒60");
  });

  it("drops the minutes under one minute", () => {
    expect(formatRaceTime(58.13)).toBe("58秒13");
  });

  it("rounds floating-point noise to the hundredth", () => {
    // 360.82 - 360.72 は 0.0999… になる
    expect(formatMargin(360.82 - 360.72)).toBe("0秒10");
    expect(formatMargin(435.78 - 434.13)).toBe("1秒65");
  });
});

describe("shortOrgName", () => {
  it("shortens only a trailing 大学", () => {
    expect(shortOrgName("日本大学")).toBe("日本大");
    expect(shortOrgName("富山国際大美方高混成")).toBe("富山国際大美方高混成");
    expect(shortOrgName("関西電力")).toBe("関西電力");
  });
});
