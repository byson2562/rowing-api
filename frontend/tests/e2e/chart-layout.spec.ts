import { expect, test } from "@playwright/test";

test("organization chart keeps compact height on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });

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
    const data =
      groupBy === "organization_golds"
        ? [
            { label: "日本大学", value: 120 },
            { label: "早稲田大学", value: 60 },
            { label: "明治大学", value: 48 },
            { label: "立命館大学", value: 35 },
            { label: "NTT東日本", value: 28 }
          ]
        : [
            { label: "明治大学", value: 172 },
            { label: "日本大学", value: 120 },
            { label: "早稲田大学", value: 98 },
            { label: "立命館大学", value: 82 },
            { label: "NTT東日本", value: 76 }
          ];

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ group_by: groupBy ?? "", data })
    });
  });

  await page.goto("/");
  await expect(page.locator(".chart-card").first().locator("svg")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".chart-card"));
    const firstCard = cards[0];
    const thirdCard = cards[2];
    const wrap = firstCard?.querySelector(".chart-wrap");
    const svg = wrap?.querySelector("svg");
    return {
      firstCardHeight: firstCard?.getBoundingClientRect().height ?? 0,
      thirdCardHeight: thirdCard?.getBoundingClientRect().height ?? 0,
      wrapHeight: wrap?.getBoundingClientRect().height ?? 0,
      svgHeight: svg?.getBoundingClientRect().height ?? 0
    };
  });

  expect(Math.abs(metrics.firstCardHeight - metrics.thirdCardHeight)).toBeLessThanOrEqual(2);
  expect(metrics.wrapHeight).toBeLessThanOrEqual(265);
  expect(metrics.svgHeight).toBeGreaterThanOrEqual(240);
});
