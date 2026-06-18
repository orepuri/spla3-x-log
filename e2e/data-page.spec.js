const { expect, test } = require("@playwright/test");

test("exports the current archive as JSON", async ({ page }) => {
  const archive = sampleArchive();
  await page.route("**/api/archive", (route) => json(route, archive));
  await page.goto("/data");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^spla-x-match-\d{8}\.json$/);
  await expect(page.getByText("Exportしました")).toBeVisible();
});

test("previews counts and confirms archive import", async ({ page }) => {
  const archive = sampleArchive();
  let imported;
  await page.route("**/api/archive", async (route) => {
    if (route.request().method() === "PUT") imported = route.request().postDataJSON();
    return json(route, archive);
  });
  await page.goto("/data");

  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(JSON.stringify(archive), "utf8"),
    mimeType: "application/json",
    name: "backup.json",
  });

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("2件").first()).toBeVisible();
  await expect(page.getByText("1件")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();

  await expect.poll(() => imported.matches.length).toBe(2);
  await expect(page.getByText("2試合と1件のXPをImportしました")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("rejects a malformed import file before sending it", async ({ page }) => {
  let putCount = 0;
  await page.route("**/api/archive", async (route) => {
    if (route.request().method() === "PUT") putCount += 1;
    return json(route, sampleArchive());
  });
  await page.goto("/data");

  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from('{"matches":[]}', "utf8"),
    mimeType: "application/json",
    name: "invalid.json",
  });

  await expect(page.getByText("JSONファイルを読み込めません")).toBeVisible();
  expect(putCount).toBe(0);
});

function sampleArchive() {
  return {
    settings: {
      season: "2026-summer",
      rule: "area",
      weapon: "スプラシューター",
      stageA: "デカライン高架下",
      stageB: "ユノハナ大渓谷",
    },
    matches: [
      match("match-2", "デカライン高架下", "win"),
      match("match-1", "ユノハナ大渓谷", "lose"),
    ],
    xpRecords: [
      {
        id: "xp-1",
        season: "2026-summer",
        rule: "area",
        xp: 2187.4,
        recordedAt: "2026-06-18T03:00:00.000Z",
      },
    ],
  };
}

function match(id, stage, result) {
  return {
    id,
    season: "2026-summer",
    rule: "area",
    stage,
    weapon: "スプラシューター",
    result,
    recordedAt: "2026-06-18T01:00:00.000Z",
  };
}

function json(route, body, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json; charset=utf-8",
    status,
  });
}
