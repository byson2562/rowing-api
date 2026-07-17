import { expect, test, type Page } from "@playwright/test";

async function mockApi(page: Page) {
  await page.route("**/api/v1/results/filters*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        years: [2024],
        genders: ["男子", "女子"],
        affiliation_types: ["学生"],
        competition_categories: ["全日本大学選手権"],
        final_groups: ["Final A"],
        competitions: ["第51回全日本大学ローイング選手権大会"],
        events: ["男子エイト"],
        organizations: ["日本大学", "早稲田大学", "明治大学", "立命館大学", "NTT東日本"]
      })
    });
  });

  await page.route("**/api/v1/results?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, per_page: 50, total_count: 0, total_pages: 0 }
      })
    });
  });

  await page.route("**/api/v1/results/stats**", async (route) => {
    const url = new URL(route.request().url());
    const groupBy = url.searchParams.get("group_by");
    let data: Array<{ label: string; value: number }>;
    if (groupBy === "winner_time_trend") {
      data = [
        { label: "2021", value: 352.4 },
        { label: "2022", value: 349.8 },
        { label: "2023", value: 351.1 },
        { label: "2024", value: 347.6 }
      ];
    } else if (groupBy === "organization_golds") {
      data = [
        { label: "日本大学", value: 120 },
        { label: "早稲田大学", value: 60 },
        { label: "明治大学", value: 48 },
        { label: "立命館大学", value: 35 },
        { label: "NTT東日本", value: 28 }
      ];
    } else {
      data = [
        { label: "明治大学", value: 172 },
        { label: "日本大学", value: 120 },
        { label: "早稲田大学", value: 98 },
        { label: "立命館大学", value: 82 },
        { label: "NTT東日本", value: 76 }
      ];
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ group_by: groupBy ?? "", data })
    });
  });
}

test("medal charts keep compact equal height on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await mockApi(page);

  await page.goto("/");
  await expect(page.locator(".medal-chart-card").first().locator("svg")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".medal-chart-card"));
    const wrap = cards[0]?.querySelector(".chart-wrap");
    const svg = wrap?.querySelector("svg");
    return {
      medalCardHeight: cards[0]?.getBoundingClientRect().height ?? 0,
      goldCardHeight: cards[1]?.getBoundingClientRect().height ?? 0,
      wrapHeight: wrap?.getBoundingClientRect().height ?? 0,
      svgHeight: svg?.getBoundingClientRect().height ?? 0
    };
  });

  expect(Math.abs(metrics.medalCardHeight - metrics.goldCardHeight)).toBeLessThanOrEqual(2);
  expect(metrics.wrapHeight).toBeLessThanOrEqual(265);
  expect(metrics.svgHeight).toBeGreaterThanOrEqual(240);
});

test("winner trend chart renders when an event filter is selected", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await mockApi(page);

  await page.goto("/");
  await expect(page.locator(".medal-chart-card").first().locator("svg")).toBeVisible();

  await page.getByLabel("種目").selectOption("男子エイト");

  const trendSvg = page.locator(".winner-trend-card svg");
  await expect(trendSvg).toBeVisible();

  const metrics = await page.evaluate(() => {
    const wrap = document.querySelector(".winner-trend-card .chart-wrap");
    const svg = wrap?.querySelector("svg");
    return {
      wrapHeight: wrap?.getBoundingClientRect().height ?? 0,
      svgHeight: svg?.getBoundingClientRect().height ?? 0
    };
  });

  expect(metrics.wrapHeight).toBeLessThanOrEqual(265);
  expect(metrics.svgHeight).toBeGreaterThanOrEqual(240);
});
