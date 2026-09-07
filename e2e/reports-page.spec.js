const { expect, test } = require("@playwright/test");

test("renders a monthly report and copies share text", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/reports/monthly**", (route) => json(route, monthlyReport()));

  await page.goto("/reports/monthly");
  await expect(page.getByRole("heading", { level: 1, name: "レポート" })).toBeVisible();
  await expect(page.getByLabel("対象月")).toHaveValue(latestClosedMonthKey());
  await expect(page.getByLabel("対象月")).toHaveAttribute("max", latestClosedMonthKey());
  const thumbnail = page.getByLabel("投稿用サムネイル");
  await expect(thumbnail).toContainText("Xマッチレポート");
  await expect(thumbnail).toContainText("月間");
  await expect(thumbnail).toContainText("2026年6月");
  await expect(thumbnail).toContainText("ガチエリア");
  await expect(thumbnail).toContainText("2187.4");
  await expect(thumbnail).toContainText("▲ 25.5");
  await expect(thumbnail).toContainText("▼ 8.0");
  await expect(thumbnail).toContainText("最大連敗");
  await expect(thumbnail).not.toContainText("得意");
  await expect(thumbnail).not.toContainText("Splatoon 3 X Match Report");

  await page.getByRole("button", { name: "投稿文コピー" }).click();
  await expect(page.getByRole("button", { name: "コピー済み" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("2026年6月 Xマッチレポート");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "画像保存" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("spla-report-2026-06.png");
});

test("renders a season report with an animated XP chart", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/reports/season**", (route) => json(route, seasonReport()));

  await page.goto("/reports/season");
  await expect(page.getByRole("heading", { level: 1, name: "レポート" })).toBeVisible();
  await expect(page.getByLabel("対象シーズン")).toHaveValue("2026-summer");
  await expect(page.getByText("6/1 〜 8/31")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "全ルールXPの推移" })).toBeVisible();
  const chart = page.getByRole("img", { name: "全ルールXPの推移グラフ" });
  await expect(chart).toBeVisible();
  await expect(page.getByText("実況ダイジェスト")).toBeVisible();
  await expect(page.locator(".xp-moment-card").filter({ hasText: "自己ベスト更新" })).toBeVisible();
  await expect(page.locator(".xp-current-item").first()).toContainText("シーズン差");
  await expect(page.getByText("ガチエリア").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "最初から" })).toBeVisible();
  await expect(page.getByRole("button", { name: "動画保存" })).toBeVisible();

  await page.getByRole("button", { name: "最初から" }).click();
  await expect(page.getByRole("button", { name: "一時停止" })).toBeVisible();
  await page.getByRole("button", { name: "一時停止" }).click();
  const initialAxis = await chart.locator(".xp-axis-label").allTextContents();
  await page.getByLabel("再生位置").press("End");
  const expandedAxis = await chart.locator(".xp-axis-label").allTextContents();
  expect(expandedAxis).not.toEqual(initialAxis);

  await page.getByRole("button", { name: "投稿文コピー" }).click();
  await expect(page.getByRole("button", { name: "コピー済み" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("2026夏 Sizzle Season Xマッチレポート");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "画像保存" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("spla-season-2026-summer.png");
});

function latestClosedMonthKey() {
  const now = new Date();
  const previous = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthlyReport() {
  return {
    highlights: {
      bestStage: { stage: "デカライン高架下", total: 12, winRate: 75 },
      highestXp: { rule: "area", xp: 2187.4 },
      maxLoseStreak: 2,
      maxWinStreak: 5,
      mostImprovedRule: { rule: "area", xpDelta: 25.5 },
      mostPlayedDay: { date: "2026-06-18", total: 14 },
      toughStage: { stage: "ユノハナ大渓谷", total: 8, winRate: 38 },
    },
    month: "2026-06",
    range: { start: "2026-05-31T15:00:00.000Z", end: "2026-06-30T15:00:00.000Z" },
    rules: [
      {
        finalXp: 2187.4,
        highestXp: 2187.4,
        lowestXp: 2100,
        losses: 10,
        maxLoseStreak: 2,
        maxWinStreak: 5,
        rule: "area",
        startXp: 2161.9,
        total: 30,
        winRate: 67,
        wins: 20,
        xpDelta: 25.5,
      },
      {
        finalXp: 2090.1,
        highestXp: 2110.1,
        lowestXp: 2090.1,
        losses: 8,
        maxLoseStreak: 3,
        maxWinStreak: 4,
        rule: "tower",
        startXp: 2098.1,
        total: 18,
        winRate: 56,
        wins: 10,
        xpDelta: -8,
      },
      {
        finalXp: 2055,
        highestXp: 2055,
        lowestXp: 2030,
        losses: 7,
        maxLoseStreak: 2,
        maxWinStreak: 3,
        rule: "rainmaker",
        startXp: 2055,
        total: 14,
        winRate: 50,
        wins: 7,
        xpDelta: 0,
      },
      {
        finalXp: null,
        highestXp: null,
        lowestXp: null,
        losses: 0,
        maxLoseStreak: 0,
        maxWinStreak: 0,
        rule: "clam",
        startXp: null,
        total: 0,
        winRate: null,
        wins: 0,
        xpDelta: null,
      },
    ],
    stages: [
      {
        losses: 3,
        mainRules: ["area"],
        maxLoseStreak: 1,
        maxWinStreak: 4,
        stage: "デカライン高架下",
        total: 12,
        winRate: 75,
        wins: 9,
      },
    ],
    summary: {
      activeDays: 8,
      averageMatchesPerActiveDay: 3.8,
      losses: 10,
      maxLoseStreak: 2,
      maxWinStreak: 5,
      mostPlayedDay: { date: "2026-06-18", total: 14 },
      total: 30,
      winRate: 67,
      wins: 20,
    },
  };
}

function seasonReport() {
  return {
    highlights: {
      bestStage: { stage: "デカライン高架下", total: 12, winRate: 75 },
      highestXp: { rule: "area", xp: 2187.4 },
      maxLoseStreak: 2,
      maxWinStreak: 5,
      mostImprovedRule: { rule: "area", xpDelta: 25.5 },
      mostPlayedDay: { date: "2026-06-18", total: 14 },
      toughStage: { stage: "ユノハナ大渓谷", total: 8, winRate: 38 },
    },
    xpTrend: [
      {
        recordedAt: "2026-05-31T15:00:00.000Z",
        xps: { area: 2161.9, tower: null, rainmaker: null, clam: null },
      },
      {
        recordedAt: "2026-06-18T04:00:00.000Z",
        xps: { area: 2450, tower: 2090.1, rainmaker: 2055, clam: 1980 },
      },
      {
        recordedAt: "2026-08-31T15:00:00.000Z",
        xps: { area: 2450, tower: 2090.1, rainmaker: 2055, clam: 1980 },
      },
    ],
    range: { closed: true, start: "2026-05-31T15:00:00.000Z", end: "2026-08-31T15:00:00.000Z" },
    rules: [
      { finalXp: 2187.4, highestXp: 2187.4, lowestXp: 2161.9, losses: 10, maxLoseStreak: 2, maxWinStreak: 5, rule: "area", startXp: 2161.9, total: 30, winRate: 67, wins: 20, xpDelta: 25.5 },
      { finalXp: 2090.1, highestXp: 2110.1, lowestXp: 2090.1, losses: 8, maxLoseStreak: 3, maxWinStreak: 4, rule: "tower", startXp: 2098.1, total: 18, winRate: 56, wins: 10, xpDelta: -8 },
      { finalXp: 2055, highestXp: 2055, lowestXp: 2030, losses: 7, maxLoseStreak: 2, maxWinStreak: 3, rule: "rainmaker", startXp: 2055, total: 14, winRate: 50, wins: 7, xpDelta: 0 },
      { finalXp: 1980, highestXp: 1980, lowestXp: 1980, losses: 0, maxLoseStreak: 0, maxWinStreak: 0, rule: "clam", startXp: 1980, total: 0, winRate: null, wins: 0, xpDelta: 0 },
    ],
    season: "2026-summer",
    stages: [
      { losses: 3, mainRules: ["area"], maxLoseStreak: 1, maxWinStreak: 4, stage: "デカライン高架下", total: 12, winRate: 75, wins: 9 },
    ],
    summary: { activeDays: 8, averageMatchesPerActiveDay: 3.8, losses: 10, maxLoseStreak: 2, maxWinStreak: 5, mostPlayedDay: { date: "2026-06-18", total: 14 }, total: 30, winRate: 67, wins: 20 },
  };
}

function json(route, body, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json; charset=utf-8",
    status,
  });
}
