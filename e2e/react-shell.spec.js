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

test("uses bottom navigation on an iPhone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/record");

  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".mobile-nav")).toBeVisible();
  await expect(page.locator(".mobile-nav .nav-link")).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 1, name: "試合記録" })).toBeVisible();
});
