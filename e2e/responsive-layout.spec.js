const { expect, test } = require("@playwright/test");

const viewports = [
  { name: "iPad landscape", width: 1024, height: 768, mobile: false },
  { name: "iPad Air landscape", width: 1180, height: 820, mobile: false },
  { name: "iPad Pro landscape", width: 1366, height: 1024, mobile: false },
  { name: "iPhone", width: 390, height: 844, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
];

for (const viewport of viewports) {
  test(`${viewport.name} has no horizontal overflow on primary workflows`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockResponsiveApis(page);

    for (const route of ["/record", "/backfill", "/analysis/summary?rule=area", "/reports/monthly", "/data"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }

    if (viewport.mobile) {
      await expect(page.locator(".sidebar")).toBeHidden();
      await expect(page.locator(".mobile-nav")).toBeVisible();
      const navBox = await page.locator(".mobile-nav").boundingBox();
      expect(navBox.y + navBox.height).toBeLessThanOrEqual(viewport.height + 1);
    } else {
      await expect(page.locator(".sidebar")).toBeVisible();
      await expect(page.locator(".mobile-nav")).toBeHidden();
    }
  });
}

test("iPad landscape keeps record actions in the initial viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await mockResponsiveApis(page);
  await page.goto("/record");

  const resultSurface = page.locator(".result-surface");
  await expect(resultSurface).toBeVisible();
  const resultBox = await resultSurface.boundingBox();
  expect(resultBox.y).toBeLessThan(768);
  expect(resultBox.y + resultBox.height).toBeLessThanOrEqual(768);
});

test("iPhone bottom navigation does not cover the final form action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockResponsiveApis(page);
  await page.goto("/backfill");
  await expect(page.getByRole("button", { name: "XPを保存" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(50);

  const actionBox = await page.getByRole("button", { name: "XPを保存" }).boundingBox();
  const navBox = await page.locator(".mobile-nav").boundingBox();
  expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(navBox.y);
});

async function mockResponsiveApis(page) {
  const matches = [
    match("m3", "デカライン高架下", "win", "2026-06-18T03:00:00.000Z"),
    match("m2", "ユノハナ大渓谷", "lose", "2026-06-18T02:00:00.000Z"),
    match("m1", "ユノハナ大渓谷", "win", "2026-06-18T01:00:00.000Z"),
  ];
  const settings = {
    season: "2026-summer",
    rule: "area",
    weapon: "スプラシューター",
    stageA: "デカライン高架下",
    stageB: "ユノハナ大渓谷",
  };
  const summary = summarize(matches);

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/settings") return json(route, settings);
    if (url.pathname === "/api/preferences") {
      return json(route, { xpPeriod: "30", xpStart: "", xpEnd: "", historyPageSize: 15 });
    }
    if (url.pathname === "/api/analysis/current") {
      return json(route, {
        latestXp: { id: "xp-1", season: "2026-summer", rule: "area", xp: 2187.4, recordedAt: "2026-06-18T04:00:00.000Z" },
        weapon: summary,
        stages: [
          { stage: "デカライン高架下", ...summarize(matches.filter((item) => item.stage === "デカライン高架下")) },
          { stage: "ユノハナ大渓谷", ...summarize(matches.filter((item) => item.stage === "ユノハナ大渓谷")) },
        ],
      });
    }
    if (url.pathname === "/api/xp-state") {
      return json(route, {
        current: { wins: 0, losses: 0 },
        latestXp: null,
        pending: [],
      });
    }
    if (url.pathname === "/api/analysis/summary") {
      return json(route, {
        ...summary,
        breakdown: {
          season: [{ name: "2026-summer", ...summary }],
          rule: [{ name: "area", ...summary }],
          stage: [{ name: "デカライン高架下", ...summary }],
          weapon: [{ name: "スプラシューター", ...summary }],
          time: [{ name: "0-6", ...summary }],
        },
      });
    }
    if (url.pathname === "/api/reports/monthly") {
      return json(route, monthlyReport(summary));
    }
    if (url.pathname === "/api/matches") return json(route, { items: matches, nextCursor: null });
    if (url.pathname === "/api/xp-records") return json(route, { items: [], nextCursor: null });
    return json(route, {});
  });
}

function monthlyReport(summary) {
  return {
    highlights: {
      bestStage: { stage: "デカライン高架下", total: 3, winRate: 67 },
      highestXp: { rule: "area", xp: 2187.4 },
      maxLoseStreak: 1,
      maxWinStreak: 1,
      mostImprovedRule: { rule: "area", xpDelta: 25.5 },
      mostPlayedDay: { date: "2026-06-18", total: 3 },
      toughStage: { stage: "ユノハナ大渓谷", total: 2, winRate: 50 },
    },
    month: "2026-06",
    range: { start: "2026-05-31T15:00:00.000Z", end: "2026-06-30T15:00:00.000Z" },
    rules: [
      {
        ...summary,
        finalXp: 2187.4,
        highestXp: 2187.4,
        lowestXp: 2161.9,
        maxLoseStreak: 1,
        maxWinStreak: 1,
        rule: "area",
        startXp: 2161.9,
        xpDelta: 25.5,
      },
    ],
    stages: [
      {
        ...summary,
        mainRules: ["area"],
        maxLoseStreak: 1,
        maxWinStreak: 1,
        stage: "デカライン高架下",
      },
    ],
    summary: {
      ...summary,
      activeDays: 1,
      averageMatchesPerActiveDay: 3,
      maxLoseStreak: 1,
      maxWinStreak: 1,
      mostPlayedDay: { date: "2026-06-18", total: 3 },
    },
  };
}

function match(id, stage, result, recordedAt) {
  return {
    id,
    season: "2026-summer",
    rule: "area",
    stage,
    weapon: "スプラシューター",
    result,
    recordedAt,
  };
}

function summarize(items) {
  const wins = items.filter((item) => item.result === "win").length;
  return {
    wins,
    losses: items.length - wins,
    total: items.length,
    winRate: items.length ? Math.round((wins / items.length) * 100) : null,
  };
}

function json(route, body) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json; charset=utf-8",
    status: 200,
  });
}
