const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const test = require("node:test");
const { handleRequest, isReactAppPath, normalizeState } = require("../server");

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

test("React application routes are distinct from the legacy root", () => {
  assert.equal(isReactAppPath("/"), false);
  assert.equal(isReactAppPath("/record"), true);
  assert.equal(isReactAppPath("/backfill"), true);
  assert.equal(isReactAppPath("/analysis"), true);
  assert.equal(isReactAppPath("/analysis/history"), true);
  assert.equal(isReactAppPath("/assets/index.js"), true);
});

test("settings API reads and updates settings without using the legacy state endpoint", async () => {
  const calls = [];
  const database = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes("RETURNING settings")) {
        return { rows: [{ settings: values[0] }] };
      }
      return { rows: [{ settings: { rule: "area", weapon: "スプラシューター" } }] };
    },
  };

  const getResponse = createResponse();
  await handleRequest(createRequest("GET", "/api/settings"), getResponse, database);
  assert.deepEqual(JSON.parse(getResponse.body), { rule: "area", weapon: "スプラシューター" });

  const putResponse = createResponse();
  await handleRequest(
    createRequest("PUT", "/api/settings", { rule: "tower", weapon: "52ガロン" }),
    putResponse,
    database,
  );
  assert.equal(putResponse.status, 200);
  assert.deepEqual(JSON.parse(putResponse.body), { rule: "tower", weapon: "52ガロン" });
  assert.equal(calls.length, 2);
});

test("matches API applies filters and returns a reusable cursor", async () => {
  const calls = [];
  const rows = [
    matchRow("3", "2026-06-18T03:00:00.000Z"),
    matchRow("2", "2026-06-18T02:00:00.000Z"),
    matchRow("1", "2026-06-18T01:00:00.000Z"),
  ];
  const database = {
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows };
    },
  };

  const response = createResponse();
  await handleRequest(
    createRequest("GET", "/api/matches?season=2026-summer&rule=area&stage=デカライン高架下&limit=2"),
    response,
    database,
  );
  const page = JSON.parse(response.body);
  assert.equal(response.status, 200);
  assert.deepEqual(
    page.items.map((item) => item.id),
    ["3", "2"],
  );
  assert.ok(page.nextCursor);
  assert.match(calls[0].sql, /season = \$1/);
  assert.match(calls[0].sql, /rule = \$2/);
  assert.match(calls[0].sql, /stage = \$3/);
  assert.deepEqual(calls[0].values, ["2026-summer", "area", "デカライン高架下", 3]);

  const nextResponse = createResponse();
  await handleRequest(
    createRequest("GET", `/api/matches?limit=2&cursor=${encodeURIComponent(page.nextCursor)}`),
    nextResponse,
    database,
  );
  assert.match(calls[1].sql, /\(recorded_at, id\) < \(\$1, \$2\)/);
  assert.deepEqual(calls[1].values, ["2026-06-18T02:00:00.000Z", "2", 3]);
});

test("matches API creates, updates, and deletes one match", async () => {
  const stored = matchRow("match-1", "2026-06-18T01:00:00.000Z");
  const database = {
    async query(sql, values) {
      if (sql.includes("INSERT INTO matches")) {
        return {
          rows: [
            {
              id: values[0],
              season: values[1],
              rule: values[2],
              stage: values[3],
              weapon: values[4],
              result: values[5],
              recorded_at: values[6],
            },
          ],
        };
      }
      if (sql.includes("SELECT id") && sql.includes("WHERE id = $1")) {
        return { rows: [stored] };
      }
      if (sql.includes("UPDATE matches")) {
        return {
          rows: [
            {
              id: values[0],
              season: values[1],
              rule: values[2],
              stage: values[3],
              weapon: values[4],
              result: values[5],
              recorded_at: values[6],
            },
          ],
        };
      }
      if (sql.includes("DELETE FROM matches")) {
        return { rows: [{ id: values[0] }] };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };

  const createResponseValue = createResponse();
  await handleRequest(
    createRequest("POST", "/api/matches", {
      id: "match-1",
      season: "2026-summer",
      rule: "area",
      stage: "デカライン高架下",
      weapon: "スプラシューター",
      result: "win",
      recordedAt: "2026-06-18T01:00:00.000Z",
    }),
    createResponseValue,
    database,
  );
  assert.equal(createResponseValue.status, 201);
  assert.equal(JSON.parse(createResponseValue.body).stage, "デカライン高架下");

  const patchResponse = createResponse();
  await handleRequest(
    createRequest("PATCH", "/api/matches/match-1", { weapon: "52ガロン", result: "lose" }),
    patchResponse,
    database,
  );
  assert.equal(patchResponse.status, 200);
  assert.equal(JSON.parse(patchResponse.body).weapon, "52ガロン");
  assert.equal(JSON.parse(patchResponse.body).result, "lose");

  const deleteResponse = createResponse();
  await handleRequest(createRequest("DELETE", "/api/matches/match-1"), deleteResponse, database);
  assert.equal(deleteResponse.status, 204);
  assert.equal(deleteResponse.body, "");
});

test("XP records API creates and pages records", async () => {
  const database = {
    async query(sql, values) {
      if (sql.includes("INSERT INTO xp_records")) {
        return {
          rows: [
            {
              id: values[0],
              season: values[1],
              rule: values[2],
              xp: values[3],
              recorded_at: values[4],
            },
          ],
        };
      }
      return {
        rows: [
          xpRow("xp-2", 2200, "2026-06-18T02:00:00.000Z"),
          xpRow("xp-1", 2100, "2026-06-18T01:00:00.000Z"),
        ],
      };
    },
  };

  const createXpResponse = createResponse();
  await handleRequest(
    createRequest("POST", "/api/xp-records", {
      id: "xp-3",
      season: "2026-summer",
      rule: "area",
      xp: 2300.5,
      recordedAt: "2026-06-18T03:00:00.000Z",
    }),
    createXpResponse,
    database,
  );
  assert.equal(createXpResponse.status, 201);
  assert.equal(JSON.parse(createXpResponse.body).xp, 2300.5);

  const pageResponse = createResponse();
  await handleRequest(createRequest("GET", "/api/xp-records?rule=area&limit=1"), pageResponse, database);
  const page = JSON.parse(pageResponse.body);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].id, "xp-2");
  assert.ok(page.nextCursor);
});

test("current analysis API returns latest XP and win rates for selected stages", async () => {
  const database = {
    async query(sql) {
      if (sql.includes("FROM xp_records")) {
        return { rows: [xpRow("xp-1", 2150.5, "2026-06-18T03:00:00.000Z")] };
      }
      if (sql.includes("stage = ANY")) {
        return {
          rows: [
            { stage: "デカライン高架下", total: 4, wins: 3 },
            { stage: "ユノハナ大渓谷", total: 2, wins: 1 },
          ],
        };
      }
      return { rows: [{ total: 10, wins: 6 }] };
    },
  };
  const response = createResponse();

  await handleRequest(
    createRequest(
      "GET",
      "/api/analysis/current?season=2026-summer&rule=area&weapon=スプラシューター&stage=デカライン高架下&stage=ユノハナ大渓谷",
    ),
    response,
    database,
  );

  const result = JSON.parse(response.body);
  assert.equal(result.latestXp.xp, 2150.5);
  assert.deepEqual(result.weapon, { wins: 6, losses: 4, total: 10, winRate: 60 });
  assert.deepEqual(result.stages[0], {
    stage: "デカライン高架下",
    wins: 3,
    losses: 1,
    total: 4,
    winRate: 75,
  });
});

test("summary analysis API returns overall and grouped results", async () => {
  let queryIndex = 0;
  const results = [
    { rows: [{ total: 6, wins: 4 }] },
    { rows: [{ name: "2026-summer", total: 6, wins: 4 }] },
    { rows: [{ name: "area", total: 6, wins: 4 }] },
    { rows: [{ name: "デカライン高架下", total: 4, wins: 3 }] },
    { rows: [{ name: "スプラシューター", total: 6, wins: 4 }] },
    { rows: [{ name: "18-24", total: 3, wins: 2 }] },
  ];
  const database = {
    async query(sql, values) {
      assert.match(sql, /season = \$1/);
      assert.deepEqual(values, ["2026-summer"]);
      return results[queryIndex++];
    },
  };
  const response = createResponse();

  await handleRequest(createRequest("GET", "/api/analysis/summary?season=2026-summer"), response, database);

  const result = JSON.parse(response.body);
  assert.deepEqual(
    { wins: result.wins, losses: result.losses, total: result.total, winRate: result.winRate },
    { wins: 4, losses: 2, total: 6, winRate: 67 },
  );
  assert.equal(result.breakdown.stage[0].name, "デカライン高架下");
  assert.equal(result.breakdown.stage[0].winRate, 75);
  assert.equal(result.breakdown.time[0].name, "18-24");
});

function createRequest(method, url, body) {
  const request = body === undefined ? Readable.from([]) : Readable.from([Buffer.from(JSON.stringify(body), "utf8")]);
  request.method = method;
  request.url = url;
  request.headers = { host: "127.0.0.1" };
  return request;
}

function matchRow(id, recordedAt) {
  return {
    id,
    season: "2026-summer",
    rule: "area",
    stage: "デカライン高架下",
    weapon: "スプラシューター",
    result: "win",
    recorded_at: new Date(recordedAt),
  };
}

function xpRow(id, xp, recordedAt) {
  return {
    id,
    season: "2026-summer",
    rule: "area",
    xp,
    recorded_at: new Date(recordedAt),
  };
}

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
