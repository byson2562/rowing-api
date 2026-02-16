import { expect, test } from "@playwright/test";

test("mobile layout shows cards instead of table", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

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
        organizations: ["日本大学"]
      })
    });
  });

  await page.route("**/api/v1/results/stats**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ group_by: "year_count", data: [] })
    });
  });

  await page.route("**/api/v1/results?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: 1,
            year: 2024,
            competition_name: "第51回全日本大学ローイング選手権大会",
            event_name: "男子エイト",
            final_group: "Final A",
            crew_name: "日本大学",
            organization: "日本大学",
            rank: 1,
            time_seconds: 403.4,
            time_display: "06:43:40"
          }
        ],
        pagination: { page: 1, per_page: 50, total_count: 1, total_pages: 1 }
      })
    });
  });

  await page.goto("/");

  const tableDisplay = await page.locator(".table-scroll").evaluate((el) => window.getComputedStyle(el).display);
  expect(tableDisplay).toBe("none");

  await expect(page.locator(".results-mobile-cards")).toBeVisible();
  await expect(page.locator(".result-card")).toHaveCount(1);
  await expect(page.getByText("男子エイト")).toBeVisible();
});
