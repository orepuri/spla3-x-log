const { expect, test } = require("@playwright/test");

test("records a match with the current settings", async ({ page }) => {
  const api = await mockStateApi(page);
  await page.goto("/legacy");

  await expect(page.getByRole("heading", { name: "Xマッチログ" })).toBeVisible();
  await expect(page.locator("#matchCount")).toHaveText("3戦");

  await page.locator("#stageAInput").selectOption("デカライン高架下");
  await expect.poll(() => api.state.settings.stageA).toBe("デカライン高架下");

  await page.locator('[data-stage="デカライン高架下"][data-result="win"]').click();

  await expect(page.locator("#matchCount")).toHaveText("4戦");
  await expect.poll(() => api.state.matches[0].stage).toBe("デカライン高架下");
  expect(api.state.matches[0].weapon).toBe("スプラシューター");
  expect(api.state.matches[0].result).toBe("win");
});

test("filters analysis and shows history without changing saved data", async ({ page }) => {
  const api = await mockStateApi(page);
  await page.goto("/legacy");

  await expect(page.locator("#winRate")).toHaveText("67%");
  await page.locator("#filterStage").selectOption("ユノハナ大渓谷");
  await expect(page.locator("#winRate")).toHaveText("50%");
  await expect(page.locator("#totalMatches")).toHaveText("2");

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.locator("#historyList .history-row")).toHaveCount(2);
  await expect(page.locator("#historyList")).toContainText("スプラシューター");
  expect(api.putCount).toBe(0);
});

async function mockStateApi(page) {
  const api = {
    putCount: 0,
    state: initialState(),
  };

  await page.route("**/api/state", async (route) => {
    if (route.request().method() === "PUT") {
      api.putCount += 1;
      api.state = route.request().postDataJSON();
    }

    await route.fulfill({
      body: JSON.stringify(api.state),
      contentType: "application/json; charset=utf-8",
      status: 200,
    });
  });

  return api;
}

function initialState() {
  return {
    settings: {
      season: "2026-summer",
      rule: "area",
      weapon: "スプラシューター",
      stageA: "ユノハナ大渓谷",
      stageB: "マサバ海峡大橋",
    },
    matches: [
      match("match-3", "デカライン高架下", "52ガロン", "win", "2026-06-17T10:00:00.000Z"),
      match("match-2", "ユノハナ大渓谷", "スプラシューター", "lose", "2026-06-17T09:00:00.000Z"),
      match("match-1", "ユノハナ大渓谷", "スプラシューター", "win", "2026-06-17T08:00:00.000Z"),
    ],
    xpRecords: [
      {
        id: "xp-1",
        season: "2026-summer",
        rule: "area",
        xp: 2100,
        recordedAt: "2026-06-17T10:00:00.000Z",
      },
    ],
  };
}

function match(id, stage, weapon, result, recordedAt) {
  return {
    id,
    season: "2026-summer",
    rule: "area",
    stage,
    weapon,
    result,
    recordedAt,
  };
}
