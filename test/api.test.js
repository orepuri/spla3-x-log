const assert = require("node:assert/strict");
const test = require("node:test");
const { handleRequest, normalizeState } = require("../server");

test("health endpoint returns JSON with database status", async () => {
  const response = createResponse();

  await handleRequest(
    {
      headers: { host: "127.0.0.1" },
      method: "GET",
      url: "/api/health",
    },
    response,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(response.body), { ok: true, database: false });
});

test("state endpoint reports unavailable database without mutating data", async () => {
  const response = createResponse();

  await handleRequest(
    {
      headers: { host: "127.0.0.1" },
      method: "GET",
      url: "/api/state",
    },
    response,
  );

  assert.equal(response.status, 503);
  assert.deepEqual(JSON.parse(response.body), { error: "Database is not configured" });
});

test("normalizeState preserves valid Japanese stage and weapon names", () => {
  const normalized = normalizeState({
    settings: { weapon: "スプラシューター", stageA: "デカライン高架下" },
    matches: [
      {
        id: "match-1",
        season: "2026-summer",
        rule: "area",
        stage: "デカライン高架下",
        weapon: "スプラシューター",
        result: "win",
        recordedAt: "2026-06-18T00:00:00.000Z",
      },
    ],
    xpRecords: [],
  });

  assert.equal(normalized.matches[0].stage, "デカライン高架下");
  assert.equal(normalized.matches[0].weapon, "スプラシューター");
});

function createResponse() {
  return {
    body: "",
    headers: {},
    status: null,
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(body = "") {
      this.body += body;
    },
  };
}
