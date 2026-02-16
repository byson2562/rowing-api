import { expect, test } from "@playwright/test";

test("filter selects can change directly without resetting to all", async ({ page }) => {
  await page.route("**/api/v1/results/filters*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        years: [2025, 2024],
        genders: ["男子", "女子"],
        affiliation_types: ["学生", "社会人"],
        final_groups: ["Final A", "Final B"],
        competitions: ["第103回全日本ローイング選手権大会", "第66回全日本新人ローイング選手権大会"],
        events: ["男子シングルスカル", "女子シングルスカル"],
        organizations: ["明治大学", "早稲田大学"]
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
        data: [],
        pagination: { page: 1, per_page: 50, total_count: 0, total_pages: 0 }
      })
    });
  });

  await page.goto("/");

  const yearSelect = page.getByTestId("year-select");
  const competitionSelect = page.getByTestId("competition-select");
  const affiliationTypeSelect = page.getByTestId("affiliation-type-select");
  const eventSelect = page.getByTestId("event-select");
  const organizationComboboxInput = page.getByTestId("organization-combobox-input");
  const rankSelect = page.getByTestId("rank-select");
  const perPageSelect = page.getByTestId("per-page-select");

  await expect(yearSelect).toBeVisible();
  await expect(competitionSelect).toBeVisible();
  await expect(affiliationTypeSelect).toBeVisible();
  await expect(organizationComboboxInput).toBeVisible();
  await expect(rankSelect).toBeVisible();
  await expect(perPageSelect).toBeVisible();

  await yearSelect.selectOption("2025");
  await expect(yearSelect).toHaveValue("2025");

  await competitionSelect.selectOption({ label: "第103回全日本ローイング選手権大会" });
  await expect(competitionSelect).toHaveValue("第103回全日本ローイング選手権大会");
  await competitionSelect.selectOption({ label: "第66回全日本新人ローイング選手権大会" });
  await expect(competitionSelect).toHaveValue("第66回全日本新人ローイング選手権大会");

  await affiliationTypeSelect.selectOption({ label: "学生" });
  await expect(affiliationTypeSelect).toHaveValue("学生");
  await affiliationTypeSelect.selectOption({ label: "社会人" });
  await expect(affiliationTypeSelect).toHaveValue("社会人");

  await eventSelect.selectOption({ label: "男子シングルスカル" });
  await expect(eventSelect).toHaveValue("男子シングルスカル");
  await eventSelect.selectOption({ label: "女子シングルスカル" });
  await expect(eventSelect).toHaveValue("女子シングルスカル");

  await organizationComboboxInput.fill("早稲田");
  await page.getByTestId("organization-option-早稲田大学").click();
  await expect(organizationComboboxInput).toHaveValue("早稲田大学");

  await rankSelect.selectOption("1");
  await expect(rankSelect).toHaveValue("1");
  await rankSelect.selectOption("3");
  await expect(rankSelect).toHaveValue("3");

  await perPageSelect.selectOption("100");
  await expect(perPageSelect).toHaveValue("100");
});
