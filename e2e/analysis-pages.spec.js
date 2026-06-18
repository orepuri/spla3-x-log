const { expect, test } = require("@playwright/test");

test("keeps summary filters in the URL and renders grouped results", async ({ page }) => {
  const api = await mockAnalysisApis(page);
  await page.goto("/analysis/summary");

  await expect(page.locator(".analysis-metrics .metric").first().locator("strong")).toHaveText("67%");
  await page.getByLabel("ルール").selectOption("area");
  await expect(page).toHaveURL(/rule=area/);
  await expect.poll(() => api.lastSummaryRule).toBe("area");
  await expect(page.locator(".analysis-breakdown-row strong").filter({ hasText: "デカライン高架下" })).toBeVisible();
  await expect(page.getByLabel("シーズン").locator('option[value="2025-winter"]')).toHaveCount(1);
  await expect(page.getByLabel("武器").locator('option[value="custom-weapon"]')).toHaveCount(1);

  await page.getByRole("link", { name: "履歴" }).click();
  await expect(page).toHaveURL(/\/analysis\/history\?rule=area/);
});

test("pages through history and edits one match", async ({ page }) => {
  const api = await mockAnalysisApis(page);
  await page.goto("/analysis/history");

  await expect(page.locator(".react-history-row")).toHaveCount(15);
  await page.getByRole("button", { name: "次へ" }).click();
  await expect(page.getByText("2ページ")).toBeVisible();
  await expect(page.locator(".react-history-row")).toHaveCount(3);

  await page.getByRole("button", { name: "編集" }).first().click();
  const edit = page.locator(".history-edit");
  await edit.getByLabel("シーズン").selectOption("2025-winter");
  await edit.getByLabel("勝敗").selectOption("lose");
  await edit.getByRole("button", { name: "保存" }).click();

  await expect.poll(() => api.matches[15].result).toBe("lose");
  expect(api.matches[15].season).toBe("2025-winter");
  await expect(page.locator(".history-edit")).toHaveCount(0);
});

test("saves the XP period and keeps it across analysis tabs", async ({ page }) => {
  const api = await mockAnalysisApis(page);
  await page.goto("/analysis/xp");

  await expect(page.getByLabel("期間")).toHaveValue("30");
  await expect(page.getByRole("img", { name: "XP推移" })).toBeVisible();
  await expect(page.locator(".xp-chart-legend")).toContainText("ガチエリア");
  await expect(page.locator(".xp-chart-legend")).toContainText("ガチヤグラ");
  await expect(page.getByLabel("ルール")).toHaveCount(0);
  await expect(page.locator(".react-xp-chart circle")).toHaveCount(6);
  await expect(page.locator(".react-xp-chart .xp-x-tick")).toHaveCount(6);
  await expect(page.locator(".react-xp-chart .xp-y-tick")).toHaveCount(5);
  await expect(page.locator(".react-xp-chart title").filter({ hasText: "ガチエリア 2137.0" })).toHaveCount(1);
  await expect(page.locator(".react-xp-chart title").filter({ hasText: "2120.0" })).toHaveCount(0);
  expect(api.requestedAllXpRules).toBe(true);
  await page.getByLabel("期間").selectOption("90");
  await expect.poll(() => api.preferences.xpPeriod).toBe("90");

  await page.getByRole("link", { name: "集計" }).click();
  await page.getByRole("link", { name: "XP" }).click();
  await expect(page.getByLabel("期間")).toHaveValue("90");

  await page.getByLabel("期間").selectOption("custom");
  await expect(page.getByLabel("開始")).not.toHaveValue("");
  await expect(page.getByLabel("終了")).not.toHaveValue("");
  await expect.poll(() => api.preferences.xpPeriod).toBe("custom");
});

async function mockAnalysisApis(page) {
  const api = {
    lastSummaryRule: "all",
    requestedAllXpRules: false,
    matches: Array.from({ length: 18 }, (_, index) =>
      match(
        `match-${18 - index}`,
        index % 2 ? "ユノハナ大渓谷" : "デカライン高架下",
        index % 3 ? "win" : "lose",
        new Date(Date.UTC(2026, 5, 18, 18 - index)).toISOString(),
      ),
    ),
    preferences: {
      xpPeriod: "30",
      xpStart: "",
      xpEnd: "",
      historyPageSize: 15,
    },
    xpRecords: [
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `xp-${index}`,
        season: "2026-summer",
        rule: index % 2 ? "tower" : "area",
        xp: 2100 + index * 18.5,
        recordedAt: new Date(Date.UTC(2026, 5, 13 + index, 12)).toISOString(),
      })),
      {
        id: "xp-same-day-earlier",
        season: "2026-summer",
        rule: "area",
        xp: 2120,
        recordedAt: new Date(Date.UTC(2026, 5, 15, 8)).toISOString(),
      },
    ].sort((left, right) => new Date(right.recordedAt) - new Date(left.recordedAt)),
  };

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname === "/api/preferences") {
      if (method === "PUT") api.preferences = request.postDataJSON();
      return json(route, api.preferences);
    }

    if (url.pathname === "/api/analysis/options") {
      return json(route, {
        seasons: ["2025-winter", "2026-summer"],
        rules: ["area", "tower"],
        weapons: ["custom-weapon", "スプラシューター"],
        stages: ["custom-stage", "デカライン高架下", "ユノハナ大渓谷"],
      });
    }

    if (url.pathname === "/api/analysis/summary") {
      api.lastSummaryRule = url.searchParams.get("rule") || "all";
      return json(route, summaryPayload(api.matches));
    }

    if (url.pathname === "/api/matches" && method === "GET") {
      const start = Number(url.searchParams.get("cursor") || 0);
      const limit = Number(url.searchParams.get("limit") || 25);
      const items = api.matches.slice(start, start + limit);
      return json(route, {
        items,
        nextCursor: start + limit < api.matches.length ? String(start + limit) : null,
      });
    }

    if (url.pathname.startsWith("/api/matches/") && method === "PATCH") {
      const id = decodeURIComponent(url.pathname.split("/").at(-1));
      const index = api.matches.findIndex((item) => item.id === id);
      api.matches[index] = { ...api.matches[index], ...request.postDataJSON() };
      return json(route, api.matches[index]);
    }

    if (url.pathname === "/api/xp-records") {
      const rule = url.searchParams.get("rule");
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");
      if (!rule && start) api.requestedAllXpRules = true;
      const items = api.xpRecords.filter(
        (record) =>
          (!rule || record.rule === rule) &&
          (!start || new Date(record.recordedAt) >= new Date(start)) &&
          (!end || new Date(record.recordedAt) <= new Date(end)),
      );
      return json(route, { items, nextCursor: null });
    }

    return json(route, {});
  });

  return api;
}

function summaryPayload(matches) {
  const summary = summarize(matches);
  return {
    ...summary,
    breakdown: {
      season: [{ name: "2026-summer", ...summary }],
      rule: [{ name: "area", ...summary }],
      stage: [
        { name: "デカライン高架下", ...summarize(matches.filter((item) => item.stage === "デカライン高架下")) },
        { name: "ユノハナ大渓谷", ...summarize(matches.filter((item) => item.stage === "ユノハナ大渓谷")) },
      ],
      weapon: [{ name: "スプラシューター", ...summary }],
      time: [{ name: "18-24", ...summary }],
    },
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

function json(route, body, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json; charset=utf-8",
    status,
  });
}
