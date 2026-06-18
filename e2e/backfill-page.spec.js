const { expect, test } = require("@playwright/test");

test("records past matches and XP while preserving repeated-entry values", async ({ page }) => {
  const api = await mockBackfillApis(page);
  await page.goto("/backfill");

  const recordedAt = page.getByLabel("記録日時");
  const initialTime = await recordedAt.inputValue();
  await page.getByRole("button", { name: "+5分" }).click();
  await expect(recordedAt).toHaveValue(shiftMinutes(initialTime, 5));
  await page.getByRole("button", { name: "-5分" }).click();
  await expect(recordedAt).toHaveValue(initialTime);

  const matchSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "過去の試合" }) });
  await matchSection.getByLabel("ステージ").selectOption("デカライン高架下");
  await matchSection.getByLabel("勝敗").selectOption("lose");
  await matchSection.getByRole("button", { name: "試合を保存" }).click();

  await expect.poll(() => api.matches.length).toBe(1);
  expect(api.matches[0].stage).toBe("デカライン高架下");
  expect(api.matches[0].result).toBe("lose");
  await expect(recordedAt).toHaveValue(shiftMinutes(initialTime, 5));
  await expect(matchSection.getByLabel("ステージ")).toHaveValue("デカライン高架下");
  await expect(matchSection.getByLabel("勝敗")).toHaveValue("lose");
  await expect(page.getByText("過去の試合を保存しました")).toBeVisible();

  const xpSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "過去のXP" }) });
  await xpSection.getByLabel("XP").fill("2199.8");
  await xpSection.getByRole("button", { name: "XPを保存" }).click();

  await expect.poll(() => api.xpRecords.length).toBe(1);
  expect(api.xpRecords[0].xp).toBe(2199.8);
  await expect(xpSection.getByLabel("XP")).toHaveValue("");
  await expect(page.getByText("過去のXPを保存しました")).toBeVisible();
});

test("prevents duplicate past-match submission while saving", async ({ page }) => {
  let releaseRequest;
  const pendingRequest = new Promise((resolve) => {
    releaseRequest = resolve;
  });
  const api = await mockBackfillApis(page, pendingRequest);
  await page.goto("/backfill");

  const button = page.getByRole("button", { name: "試合を保存" });
  await button.click();
  await expect(button).toBeDisabled();
  await button.click({ force: true });
  expect(api.matchPostCount).toBe(1);

  releaseRequest();
  await expect(page.getByText("過去の試合を保存しました")).toBeVisible();
});

async function mockBackfillApis(page, pendingMatch) {
  const api = {
    matchPostCount: 0,
    matches: [],
    xpRecords: [],
  };
  const settings = {
    season: "2026-summer",
    rule: "area",
    weapon: "スプラシューター",
    stageA: "ユノハナ大渓谷",
    stageB: "マサバ海峡大橋",
  };

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/api/settings") return json(route, settings);
    if (url.pathname === "/api/matches" && request.method() === "POST") {
      api.matchPostCount += 1;
      if (pendingMatch) await pendingMatch;
      const match = { ...request.postDataJSON(), id: `match-${api.matchPostCount}` };
      api.matches.push(match);
      return json(route, match, 201);
    }
    if (url.pathname === "/api/xp-records" && request.method() === "POST") {
      const record = { ...request.postDataJSON(), id: "xp-1" };
      api.xpRecords.push(record);
      return json(route, record, 201);
    }
    return json(route, { items: [], nextCursor: null });
  });

  return api;
}

function shiftMinutes(value, minutes) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function json(route, body, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json; charset=utf-8",
    status,
  });
}
