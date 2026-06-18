const { expect, test } = require("@playwright/test");

test("updates settings and records match, XP, and undo through resource APIs", async ({ page }) => {
  const api = await mockRecordApis(page);
  await page.goto("/record");

  await expect(page.getByLabel("武器")).toHaveValue("スプラシューター");
  await expect(page.getByText("2150.5")).toBeVisible();
  await expect(page.locator(".performance-surface .metric").nth(1).locator("strong")).toHaveText("50%");
  await expect(page.getByRole("heading", { name: "現在設定の直近10試合" })).toBeVisible();
  await expect(page.locator(".recent-match-row")).toHaveCount(2);
  expect(api.recentMatchStages).toEqual(["ユノハナ大渓谷", "マサバ海峡大橋"]);

  const settingLabels = await page.locator(".settings-surface .preview-field > span").allTextContents();
  expect(settingLabels.indexOf("シーズン")).toBeGreaterThan(settingLabels.indexOf("ステージB"));

  await page.getByLabel("ステージA").selectOption("デカライン高架下");
  await expect.poll(() => api.settings.stageA).toBe("デカライン高架下");
  await expect(page.getByRole("button", { name: "デカライン高架下 WIN" })).toBeVisible();

  await page.getByRole("button", { name: "デカライン高架下 WIN" }).click();
  await expect.poll(() => api.matches.length).toBe(3);
  expect(api.matches[0].stage).toBe("デカライン高架下");
  expect(api.matches[0].result).toBe("win");
  await expect(page.getByText("WINを保存しました")).toBeVisible();

  await page.getByLabel("現在XP").fill("2200.5");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "XP保存" }).click();
  await expect.poll(() => api.xpRecords[0].xp).toBe(2200.5);
  await expect(page.getByText("2200.5")).toBeVisible();

  await page.getByRole("button", { name: "最後を取り消す" }).click();
  await expect.poll(() => api.matches.length).toBe(2);
  await expect(page.getByText("最後の試合を取り消しました")).toBeVisible();
});

test("disables result actions while a match is being saved", async ({ page }) => {
  let releaseRequest;
  const pendingRequest = new Promise((resolve) => {
    releaseRequest = resolve;
  });
  const api = await mockRecordApis(page, { pendingMatch: pendingRequest });
  await page.goto("/record");

  const button = page.getByRole("button", { name: "ユノハナ大渓谷 WIN" });
  await button.click();
  await expect(button).toBeDisabled();
  await button.click({ force: true });
  expect(api.matchPostCount).toBe(1);

  releaseRequest();
  await expect(page.getByText("WINを保存しました")).toBeVisible();
});

test("prefills estimated XP when a set completes and links it to the completion match", async ({ page }) => {
  const api = await mockRecordApis(page);
  api.matches = [
    match("match-2", "ユノハナ大渓谷", "win", "2026-06-17T05:00:00.000Z"),
    match("match-1", "ユノハナ大渓谷", "win", "2026-06-17T04:00:00.000Z"),
  ];
  api.xpRecords[0].recordType = "completed";

  await page.goto("/record");
  await page.getByRole("button", { name: "ユノハナ大渓谷 WIN" }).click();

  await expect(page.getByText("未入力のXPがあります")).toBeVisible();
  await expect(page.getByLabel("確定XP")).toHaveValue("2175.1");
  await page.getByRole("button", { name: "確定XPを保存" }).click();

  await expect.poll(() => api.xpRecords[0].recordType).toBe("completed");
  expect(api.xpRecords[0].completedMatchId).toBe("match-new-1");
});

async function mockRecordApis(page, options = {}) {
  const api = {
    matchPostCount: 0,
    recentMatchStages: [],
    matches: [
      match("match-2", "ユノハナ大渓谷", "lose", "2026-06-17T02:00:00.000Z"),
      match("match-1", "ユノハナ大渓谷", "win", "2026-06-17T01:00:00.000Z"),
    ],
    settings: {
      season: "2026-summer",
      rule: "area",
      weapon: "スプラシューター",
      stageA: "ユノハナ大渓谷",
      stageB: "マサバ海峡大橋",
    },
    xpRecords: [
      {
        id: "xp-1",
        season: "2026-summer",
        rule: "area",
        xp: 2150.5,
        recordedAt: "2026-06-17T03:00:00.000Z",
      },
    ],
  };

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname === "/api/settings") {
      if (method === "PUT") api.settings = request.postDataJSON();
      if (method === "PATCH") api.settings = { ...api.settings, ...request.postDataJSON() };
      return json(route, api.settings);
    }

    if (url.pathname === "/api/analysis/current") {
      const stageNames = url.searchParams.getAll("stage");
      return json(route, currentAnalysis(api, stageNames));
    }

    if (url.pathname === "/api/xp-state") {
      return json(route, xpState(api));
    }

    if (url.pathname === "/api/matches" && method === "GET") {
      const requestedStages = url.searchParams.getAll("stage");
      if (requestedStages.length) api.recentMatchStages = requestedStages;
      return json(route, { items: api.matches.slice(0, Number(url.searchParams.get("limit") || 25)), nextCursor: null });
    }

    if (url.pathname === "/api/matches" && method === "POST") {
      api.matchPostCount += 1;
      if (options.pendingMatch) await options.pendingMatch;
      const input = request.postDataJSON();
      const created = {
        ...input,
        id: `match-new-${api.matchPostCount}`,
        recordedAt: new Date().toISOString(),
      };
      api.matches.unshift(created);
      return json(route, created, 201);
    }

    if (url.pathname.startsWith("/api/matches/") && method === "DELETE") {
      const id = decodeURIComponent(url.pathname.split("/").at(-1));
      api.matches = api.matches.filter((item) => item.id !== id);
      return route.fulfill({ status: 204 });
    }

    if (url.pathname === "/api/xp-records" && method === "POST") {
      const input = request.postDataJSON();
      const created = {
        ...input,
        id: "xp-new",
        recordedAt: new Date().toISOString(),
      };
      api.xpRecords.unshift(created);
      return json(route, created, 201);
    }

    return route.continue();
  });

  return api;
}

function currentAnalysis(api, stageNames) {
  const relevant = api.matches.filter(
    (item) =>
      item.season === api.settings.season &&
      item.rule === api.settings.rule &&
      item.weapon === api.settings.weapon,
  );
  return {
    latestXp: api.xpRecords.find(
      (item) => item.season === api.settings.season && item.rule === api.settings.rule,
    ),
    weapon: summary(relevant),
    stages: stageNames.map((stage) => ({
      stage,
      ...summary(relevant.filter((item) => item.stage === stage)),
    })),
  };
}

function xpState(api) {
  const base = api.xpRecords.find(
    (item) => item.season === api.settings.season && item.rule === api.settings.rule && item.recordType !== "manual",
  );
  const relevant = api.matches
    .filter((item) => item.season === api.settings.season && item.rule === api.settings.rule)
    .filter((item) => !base || new Date(item.recordedAt) > new Date(base.recordedAt))
    .sort((left, right) => new Date(left.recordedAt) - new Date(right.recordedAt));
  const pending = [];
  let current = [];
  for (const item of relevant) {
    current.push(item);
    const score = summary(current);
    if (score.wins !== 3 && score.losses !== 3) continue;
    pending.push({
      completedAt: item.recordedAt,
      completedMatchId: item.id,
      estimatedXp: base ? base.xp + 24.6 : null,
      losses: score.losses,
      wins: score.wins,
    });
    current = [];
  }
  const score = summary(current);
  return {
    current: { wins: score.wins, losses: score.losses },
    latestXp: api.xpRecords[0] || null,
    pending,
  };
}

function summary(items) {
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
