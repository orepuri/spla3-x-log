const { expect, test } = require("@playwright/test");

test("opens React routes directly and navigates between workflows", async ({ page }) => {
  await page.goto("/record");

  await expect(page.getByRole("heading", { level: 1, name: "試合記録" })).toBeVisible();
  await expect(page.locator(".sidebar")).toBeVisible();
  await expect(page.locator(".mobile-nav")).toBeHidden();

  await page.getByRole("link", { name: "過去入力" }).click();
  await expect(page).toHaveURL(/\/backfill$/);
  await expect(page.getByRole("heading", { level: 1, name: "過去データ入力" })).toBeVisible();

  await page.getByRole("link", { name: "分析" }).click();
  await expect(page).toHaveURL(/\/analysis\/summary$/);
  await page.getByRole("link", { name: "履歴" }).click();
  await expect(page).toHaveURL(/\/analysis\/history$/);
  await expect(page.getByRole("heading", { level: 2, name: "履歴" })).toBeVisible();
});

test("uses the React record page as the root application", async ({ page }) => {
  await page.route("**/api/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    let body = {};
    if (pathname === "/api/settings") {
      body = {
        season: "2026-summer",
        rule: "area",
        weapon: "スプラシューター",
        stageA: "ユノハナ大渓谷",
        stageB: "マサバ海峡大橋",
      };
    } else if (pathname === "/api/matches") {
      body = { items: [], nextCursor: null };
    } else if (pathname === "/api/analysis/current") {
      body = {
        latestXp: null,
        weapon: { wins: 0, losses: 0, total: 0, winRate: null },
        stages: [],
      };
    }
    return route.fulfill({
      body: JSON.stringify(body),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.goto("/");
  await expect(page).toHaveURL(/\/record$/);
  await expect(page.getByRole("heading", { level: 1, name: "試合記録" })).toBeVisible();
});

test("uses bottom navigation on an iPhone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/record");

  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".mobile-nav")).toBeVisible();
  await expect(page.locator(".mobile-nav .nav-link")).toHaveCount(4);
  await expect(page.getByRole("heading", { level: 1, name: "試合記録" })).toBeVisible();
});
