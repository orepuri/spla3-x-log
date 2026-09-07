const { expect, test } = require("@playwright/test");

test("updates settings and records match, XP, and undo through resource APIs", async ({ page }) => {
  const api = await mockRecordApis(page);
  await page.goto("/record");

  await expect(page.getByLabel("武器")).toHaveValue("スプラシューター");
  await expect(page.getByLabel("シーズン").locator('option[value="2026-autumn"]')).toHaveCount(1);
  await expect(page.getByText("2150.5")).toBeVisible();
  await expect(page.locator(".performance-surface .metric").nth(1).locator("strong")).toHaveText("50%");
  await expect(page.getByRole("button", { name: "ユノハナ大渓谷の攻略情報を開く" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "ステージ別成績" })).toBeVisible();
  await expect(page.getByLabel("ステージ別成績の期間").getByRole("button", { name: "今シーズン" })).toHaveClass(/active/);
  await expect(page.locator(".stage-performance-summary")).toContainText("2戦");
  await expect(page.locator(".stage-performance-summary")).toContainText("1-1");
  await expect(page.locator(".stage-performance-row")).toHaveCount(0);
  await page.getByRole("button", { name: "ステージ別を表示" }).click();
  await expect(page.locator(".stage-performance-row.selected").filter({ hasText: "ユノハナ大渓谷" })).toContainText("50%");
  await page.getByRole("button", { name: "14日" }).click();
  await expect.poll(() => api.stagePerformanceStartRequested).toBe(true);
  await expect(page.getByRole("heading", { name: "現在設定の直近10試合" })).toBeVisible();
  await expect(page.locator(".recent-match-row")).toHaveCount(2);
  expect(api.recentMatchStages).toEqual(["ユノハナ大渓谷", "マサバ海峡大橋"]);

  await page.getByLabel("ルール").selectOption("clam");
  await chooseStage(page, "ステージA", "namero", "ナメロウ金属");
  await chooseStage(page, "ステージB", "ryugu", "リュウグウターミナル");
  await expect.poll(() => api.settings.rule).toBe("clam");
  await expect.poll(() => api.settings.stageA).toBe("ナメロウ金属");
  await page.getByRole("button", { name: "ナメロウ金属の攻略情報を開く" }).click();
  await expect(page.getByRole("dialog")).toContainText("スプラシューター");
  await expect(page.getByRole("dialog")).toContainText("ガチアサリ");
  await expect(page.getByRole("dialog")).toContainText("中央の貝を管理");
  await expect(page.getByRole("img", { name: "ナメロウ金属 ガチアサリの攻略サマリ図" })).toBeVisible();
  await page.getByRole("link", { name: "詳細を見る" }).click();
  await expect(page).toHaveURL(/\/strategy\/clam_blitz_namero_metalworks_splattershot$/);
  await expect(page.getByRole("heading", { name: "ナメロウ金属 攻略詳細" })).toBeVisible();
  await expect(page.getByRole("img", { name: "ナメロウ金属 ガチアサリの攻略詳細図" })).toBeVisible();
  await page.getByRole("link", { name: "試合記録へ" }).click();

  const settingLabels = await page.locator(".settings-surface .preview-field > span").allTextContents();
  expect(settingLabels.indexOf("シーズン")).toBeGreaterThan(settingLabels.indexOf("ステージB"));

  await page.getByLabel("ルール").selectOption("area");
  await chooseStage(page, "ステージA", "deka", "デカライン高架下");
  await expect.poll(() => api.settings.rule).toBe("area");
  await page.getByRole("button", { name: "デカライン高架下の攻略情報を開く" }).click();
  await expect(page.getByRole("dialog")).toContainText("ガチエリア");
  await expect(page.getByRole("dialog")).toContainText("中央広場");
  await page.getByRole("button", { name: "攻略メモを閉じる" }).click();
  await chooseStage(page, "ステージB", "masaba", "マサバ海峡大橋");
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

  await page.getByRole("button", { name: "マサバ海峡大橋 通信切断負け" }).click();
  await expect.poll(() => api.matches.length).toBe(3);
  expect(api.matches[0].result).toBe("disconnect");
  await expect(page.getByText("通信切断を保存しました")).toBeVisible();
});

async function chooseStage(page, label, query, stage) {
  await page.getByLabel(label).fill(query);
  await page.getByRole("option", { name: new RegExp(stage) }).click();
}

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
  await expect(page.getByLabel("確定XP")).toHaveValue("2225.5");
  await page.getByRole("button", { name: "確定XPを保存" }).click();

  await expect.poll(() => api.xpRecords[0].recordType).toBe("completed");
  expect(api.xpRecords[0].completedMatchId).toBe("match-new-1");
});

test("saves an initial season XP and resets the set counter", async ({ page }) => {
  const api = await mockRecordApis(page);
  api.settings.season = "2026-autumn";

  await page.goto("/record");
  await page.getByLabel("現在XP").fill("2300.0");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "シーズン初期値として保存" }).click();

  await expect.poll(() => api.xpRecords[0].recordType).toBe("initial");
  expect(api.xpRecords[0].season).toBe("2026-autumn");
  expect(api.xpRecords[0].xp).toBe(2300);
  await expect(page.getByText("シーズン初期XPを保存しました（勝敗数をリセット）")).toBeVisible();
});

test("switches stage performance between all seasons and the previous season", async ({ page }) => {
  const api = await mockRecordApis(page);
  api.settings.season = "2026-autumn";
  api.matches = api.matches.map((item) => ({ ...item, season: "2026-autumn" }));

  await page.goto("/record");
  await expect(page.getByRole("button", { name: "すべて" })).toBeVisible();
  await expect(page.getByRole("button", { name: "前シーズン" })).toBeEnabled();

  await page.getByRole("button", { name: "すべて" }).click();
  await expect.poll(() => api.stagePerformanceSeasonRequested).toBe("all");

  await page.getByRole("button", { name: "前シーズン" }).click();
  await expect.poll(() => api.stagePerformanceSeasonRequested).toBe("2026-summer");
});

async function mockRecordApis(page, options = {}) {
  const api = {
    matchPostCount: 0,
    recentMatchStages: [],
    stagePerformanceSeasonRequested: "",
    stagePerformanceStartRequested: false,
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

    if (url.pathname === "/api/analysis/stages") {
      api.stagePerformanceStartRequested = Boolean(url.searchParams.get("start"));
      api.stagePerformanceSeasonRequested = url.searchParams.get("season");
      return json(route, stagePerformanceReport(api, api.stagePerformanceSeasonRequested));
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

function stagePerformanceReport(api, season = api.settings.season) {
  const relevant = api.matches.filter(
    (item) => (season === "all" || item.season === season) && item.rule === api.settings.rule,
  );
  const stageNames = Array.from(new Set(relevant.map((item) => item.stage)));
  return {
    stages: stageNames.map((stage) => ({
      stage,
      ...summary(relevant.filter((item) => item.stage === stage)),
    })),
    summary: summary(relevant),
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
    const score = xpScore(current);
    if (score.wins !== 3 && score.losses !== 3) continue;
    pending.push({
      completedAt: item.recordedAt,
      completedMatchId: item.id,
      estimatedXp: base ? base.xp + estimateDelta(score) : null,
      losses: score.losses,
      wins: score.wins,
    });
    current = [];
  }
  const score = xpScore(current);
  return {
    current: { wins: score.wins, losses: score.losses },
    latestXp: api.xpRecords[0] || null,
    pending,
  };
}

function estimateDelta(score) {
  if (score.wins === 3) return 75 - score.losses * 25;
  return -(75 - score.wins * 25);
}

function summary(items) {
  const wins = items.filter((item) => item.result === "win").length;
  const losses = items.filter((item) => item.result === "lose").length;
  return {
    wins,
    losses,
    total: wins + losses,
    winRate: wins + losses ? Math.round((wins / (wins + losses)) * 100) : null,
  };
}

function xpScore(items) {
  const wins = items.filter((item) => item.result === "win").length;
  return {
    wins,
    losses: items.length - wins,
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
