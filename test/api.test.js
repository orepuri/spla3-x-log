const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const test = require("node:test");
const { computeXpState, handleRequest, normalizeState } = require("../server");

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

test("unknown API routes return JSON 404", async () => {
  const response = createResponse();
  await handleRequest(createRequest("GET", "/api/unknown"), response);
  assert.equal(response.status, 404);
  assert.deepEqual(JSON.parse(response.body), { error: "Not found" });
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

test("settings API reads and updates settings", async () => {
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

test("settings PATCH merges only the changed fields", async () => {
  const database = {
    async query(sql, values) {
      assert.match(sql, /app_settings\.settings \|\| EXCLUDED\.settings/);
      assert.deepEqual(values, [{ stageA: "デカライン高架下" }]);
      return {
        rows: [
          {
            settings: {
              season: "2026-summer",
              rule: "area",
              weapon: "スプラシューター",
              stageA: "デカライン高架下",
              stageB: "ユノハナ大渓谷",
            },
          },
        ],
      };
    },
  };
  const response = createResponse();

  await handleRequest(
    createRequest("PATCH", "/api/settings", { stageA: "デカライン高架下" }),
    response,
    database,
  );

  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.body).stageB, "ユノハナ大渓谷");
});

test("archive API exports data and rejects malformed imports", async () => {
  const database = {
    async query(sql) {
      if (sql.includes("FROM app_settings")) return { rows: [{ settings: { rule: "area" } }] };
      if (sql.includes("FROM matches")) return { rows: [matchRow("match-1", "2026-06-18T01:00:00.000Z")] };
      if (sql.includes("FROM xp_records")) return { rows: [xpRow("xp-1", 2100, "2026-06-18T02:00:00.000Z")] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const exportResponse = createResponse();
  await handleRequest(createRequest("GET", "/api/archive"), exportResponse, database);
  const archive = JSON.parse(exportResponse.body);
  assert.equal(archive.matches[0].stage, "デカライン高架下");
  assert.equal(archive.xpRecords[0].xp, 2100);

  const invalidResponse = createResponse();
  await handleRequest(createRequest("PUT", "/api/archive", { matches: [] }), invalidResponse, database);
  assert.equal(invalidResponse.status, 400);
  assert.deepEqual(JSON.parse(invalidResponse.body), { error: "Invalid archive" });
});

test("preferences API reads and updates analysis display settings", async () => {
  const database = {
    async query(sql, values = []) {
      if (sql.includes("RETURNING preferences")) return { rows: [{ preferences: values[0] }] };
      return { rows: [{ preferences: { xpPeriod: "30", historyPageSize: 25 } }] };
    },
  };
  const getResponse = createResponse();
  await handleRequest(createRequest("GET", "/api/preferences"), getResponse, database);
  assert.deepEqual(JSON.parse(getResponse.body), { xpPeriod: "30", historyPageSize: 25 });

  const putResponse = createResponse();
  const preferences = { xpPeriod: "90", xpStart: "", xpEnd: "", historyPageSize: 50 };
  await handleRequest(createRequest("PUT", "/api/preferences", preferences), putResponse, database);
  assert.deepEqual(JSON.parse(putResponse.body), preferences);
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
    createRequest(
      "GET",
      "/api/matches?season=2026-summer&rule=area&stage=デカライン高架下&stage=ユノハナ大渓谷&limit=2",
    ),
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
  assert.match(calls[0].sql, /stage = ANY\(\$3::text\[\]\)/);
  assert.deepEqual(calls[0].values, [
    "2026-summer",
    "area",
    ["デカライン高架下", "ユノハナ大渓谷"],
    3,
  ]);

  const nextResponse = createResponse();
  await handleRequest(
    createRequest("GET", `/api/matches?limit=2&cursor=${encodeURIComponent(page.nextCursor)}`),
    nextResponse,
    database,
  );
  assert.match(calls[1].sql, /\(recorded_at, id\) < \(\$1, \$2\)/);
  assert.deepEqual(calls[1].values, ["2026-06-18T02:00:00.000Z", "2", 3]);
});

test("matches API applies time filters in Asia/Tokyo", async () => {
  const calls = [];
  const database = {
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows: [matchRow("1", "2026-06-25T17:42:17.647Z")] };
    },
  };
  const response = createResponse();

  await handleRequest(createRequest("GET", "/api/matches?time=0-6"), response, database);

  assert.equal(response.status, 200);
  assert.match(calls[0].sql, /recorded_at AT TIME ZONE 'Asia\/Tokyo'/);
  assert.deepEqual(calls[0].values, [0, 6, 26]);
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
  const calls = [];
  const database = {
    async query(sql, values) {
      calls.push({ sql, values });
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
  await handleRequest(
    createRequest(
      "GET",
      "/api/xp-records?rule=area&limit=1&start=2026-06-01T00:00:00.000Z&end=2026-06-30T23:59:59.999Z",
    ),
    pageResponse,
    database,
  );
  const page = JSON.parse(pageResponse.body);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].id, "xp-2");
  assert.ok(page.nextCursor);
  assert.match(calls[1].sql, /recorded_at >= \$2/);
  assert.match(calls[1].sql, /recorded_at <= \$3/);
});

test("XP records API updates one record", async () => {
  const calls = [];
  const database = {
    async query(sql, values) {
      calls.push({ sql, values });
      assert.match(sql, /UPDATE xp_records/);
      return {
        rows: [
          {
            completed_match_id: values[4],
            id: values[0],
            record_type: values[5],
            recorded_at: new Date(values[6]),
            rule: values[2],
            season: values[1],
            xp: values[3],
          },
        ],
      };
    },
  };
  const response = createResponse();

  await handleRequest(
    createRequest("PATCH", "/api/xp-records/xp-1", {
      completedMatchId: null,
      recordType: "manual",
      recordedAt: "2026-06-18T03:00:00.000Z",
      rule: "tower",
      season: "2026-summer",
      xp: 2199.8,
    }),
    response,
    database,
  );

  assert.equal(response.status, 200);
  assert.equal(calls[0].values[0], "xp-1");
  assert.equal(calls[0].values[3], 2199.8);
  assert.deepEqual(JSON.parse(response.body), {
    completedMatchId: null,
    id: "xp-1",
    recordType: "manual",
    recordedAt: "2026-06-18T03:00:00.000Z",
    rule: "tower",
    season: "2026-summer",
    xp: 2199.8,
  });
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

test("XP state keeps completed sets pending and estimates from the completed score", () => {
  const matches = [
    ...scoredMatches("old", "2025-winter", ["win", "lose", "win", "win"], "2026-01-01T00:00:00.000Z"),
    ...scoredMatches("new-a", "2026-summer", ["win", "lose", "win", "win"], "2026-06-18T00:00:00.000Z"),
    ...scoredMatches("new-b", "2026-summer", ["lose", "lose", "lose"], "2026-06-18T01:00:00.000Z"),
    {
      ...matchRow("current-1", "2026-06-18T02:00:00.000Z"),
      season: "2026-summer",
      result: "win",
      recordedAt: "2026-06-18T02:00:00.000Z",
    },
  ].map(normalizeTestMatch);
  const xpRecords = [
    xpRecord("old-base", "2025-winter", 2100, "2025-12-31T23:59:00.000Z"),
    xpRecord("old-complete", "2025-winter", 2124.6, "2026-01-01T00:03:00.000Z", "old-4"),
    xpRecord("new-base", "2026-summer", 2200, "2026-06-17T23:59:00.000Z"),
  ];

  const state = computeXpState(matches, xpRecords, "2026-summer", "area");

  assert.deepEqual(state.current, { wins: 1, losses: 0 });
  assert.equal(state.pending.length, 2);
  assert.deepEqual(
    { wins: state.pending[0].wins, losses: state.pending[0].losses, estimatedXp: state.pending[0].estimatedXp },
    { wins: 3, losses: 1, estimatedXp: 2250 },
  );
  assert.equal(state.pending[1].completedMatchId, "new-b-3");
  assert.equal(state.pending[1].estimatedXp, 2125);
});

test("XP state applies the basic XP delta for every completed score", () => {
  const cases = [
    { results: ["win", "win", "win"], expected: 2275 },
    { results: ["win", "lose", "win", "win"], expected: 2250 },
    { results: ["win", "lose", "lose", "win", "win"], expected: 2225 },
    { results: ["lose", "lose", "lose"], expected: 2125 },
    { results: ["win", "lose", "lose", "lose"], expected: 2150 },
    { results: ["win", "win", "lose", "lose", "lose"], expected: 2175 },
  ];

  for (const [index, testCase] of cases.entries()) {
    const matches = scoredMatches(
      `score-${index}`,
      "2026-summer",
      testCase.results,
      "2026-06-18T00:00:00.000Z",
    ).map(normalizeTestMatch);
    const state = computeXpState(
      matches,
      [xpRecord("base", "2026-summer", 2200, "2026-06-17T23:59:00.000Z")],
      "2026-summer",
      "area",
    );

    assert.equal(state.pending[0].estimatedXp, testCase.expected);
  }
});

test("manual XP records do not reset the current set", () => {
  const matches = scoredMatches(
    "current",
    "2026-summer",
    ["win", "lose"],
    "2026-06-18T00:00:00.000Z",
  ).map(normalizeTestMatch);
  const records = [
    xpRecord("base", "2026-summer", 2200, "2026-06-17T23:59:00.000Z"),
    {
      ...xpRecord("manual", "2026-summer", 2208, "2026-06-18T00:01:30.000Z"),
      recordType: "manual",
    },
  ];

  const state = computeXpState(matches, records, "2026-summer", "area");

  assert.deepEqual(state.current, { wins: 1, losses: 1 });
  assert.equal(state.latestXp.id, "manual");
});

test("analysis options API returns distinct values from stored history", async () => {
  const results = [
    { rows: [{ value: "2025-winter" }, { value: "2026-summer" }] },
    { rows: [{ value: "area" }, { value: "tower" }] },
    { rows: [{ value: "52ガロン" }, { value: "スプラシューター" }] },
    { rows: [{ value: "デカライン高架下" }, { value: "ユノハナ大渓谷" }] },
  ];
  let index = 0;
  const database = {
    async query() {
      return results[index++];
    },
  };
  const response = createResponse();

  await handleRequest(createRequest("GET", "/api/analysis/options"), response, database);

  assert.deepEqual(JSON.parse(response.body), {
    seasons: ["2025-winter", "2026-summer"],
    rules: ["area", "tower"],
    weapons: ["52ガロン", "スプラシューター"],
    stages: ["デカライン高架下", "ユノハナ大渓谷"],
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
    { rows: [{ name: "18", total: 3, wins: 2 }] },
  ];
  const database = {
    async query(sql, values) {
      assert.match(sql, /season = \$1/);
      if (sql.includes("GROUP BY name")) assert.match(sql, /recorded_at AT TIME ZONE 'Asia\/Tokyo'/);
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
  assert.equal(result.breakdown.time[0].name, "18");
});

test("monthly report API summarizes matches and XP in a JST month", async () => {
  const calls = [];
  const database = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes("FROM matches")) {
        return {
          rows: [
            reportMatch("m-1", "area", "バイガイ亭", "win", "2026-05-31T15:10:00.000Z"),
            reportMatch("m-2", "area", "バイガイ亭", "win", "2026-06-01T01:00:00.000Z"),
            reportMatch("m-3", "area", "デカライン高架下", "lose", "2026-06-01T02:00:00.000Z"),
            reportMatch("m-4", "area", "デカライン高架下", "lose", "2026-06-01T03:00:00.000Z"),
            reportMatch("m-5", "tower", "バイガイ亭", "win", "2026-06-02T03:00:00.000Z"),
          ],
        };
      }
      if (sql.includes("FROM xp_records")) {
        return {
          rows: [
            reportXp("xp-0", "area", 1600, "2026-05-30T12:00:00.000Z"),
            reportXp("xp-1", "area", 1650, "2026-06-01T04:00:00.000Z"),
            reportXp("xp-2", "area", 1700, "2026-06-02T04:00:00.000Z"),
            reportXp("xp-3", "tower", 1800, "2026-06-02T05:00:00.000Z"),
          ],
        };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const response = createResponse();

  await handleRequest(createRequest("GET", "/api/reports/monthly?month=2026-06"), response, database);

  assert.equal(response.status, 200);
  assert.deepEqual(calls[0].values, ["2026-05-31T15:00:00.000Z", "2026-06-30T15:00:00.000Z"]);
  assert.deepEqual(calls[1].values, ["2026-06-30T15:00:00.000Z"]);
  const report = JSON.parse(response.body);
  assert.equal(report.month, "2026-06");
  assert.equal(report.summary.total, 5);
  assert.equal(report.summary.wins, 3);
  assert.equal(report.summary.maxWinStreak, 2);
  assert.equal(report.summary.maxLoseStreak, 2);
  assert.deepEqual(report.summary.mostPlayedDay, { date: "2026-06-01", total: 4 });
  const area = report.rules.find((rule) => rule.rule === "area");
  assert.equal(area.startXp, 1600);
  assert.equal(area.finalXp, 1700);
  assert.equal(area.xpDelta, 100);
  assert.equal(report.highlights.bestStage.stage, "バイガイ亭");
  assert.equal(report.highlights.mostImprovedRule.rule, "area");
});

test("monthly report API rejects months that are not closed yet", async () => {
  const database = {
    async query() {
      throw new Error("Database should not be queried for unavailable months");
    },
  };
  const response = createResponse();

  await handleRequest(createRequest("GET", "/api/reports/monthly?month=2999-01"), response, database);

  assert.equal(response.status, 400);
  assert.deepEqual(JSON.parse(response.body), { error: "Monthly report is not available yet" });
});

function createRequest(method, url, body) {
  const request = body === undefined ? Readable.from([]) : Readable.from([Buffer.from(JSON.stringify(body), "utf8")]);
  request.method = method;
  request.url = url;
  request.headers = { host: "127.0.0.1" };
  return request;
}

function reportMatch(id, rule, stage, result, recordedAt) {
  return {
    id,
    result,
    rule,
    season: "2026-summer",
    stage,
    weapon: "スプラシューター",
    recorded_at: new Date(recordedAt),
  };
}

function reportXp(id, rule, xp, recordedAt) {
  return {
    completed_match_id: null,
    id,
    record_type: "completed",
    recorded_at: new Date(recordedAt),
    rule,
    season: "2026-summer",
    xp,
  };
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

function scoredMatches(prefix, season, results, start) {
  const startTime = new Date(start).getTime();
  return results.map((result, index) => ({
    ...matchRow(`${prefix}-${index + 1}`, new Date(startTime + index * 60_000).toISOString()),
    result,
    season,
  }));
}

function normalizeTestMatch(match) {
  return {
    ...match,
    recordedAt: match.recordedAt || match.recorded_at.toISOString(),
  };
}

function xpRecord(id, season, xp, recordedAt, completedMatchId = null) {
  return {
    completedMatchId,
    id,
    recordType: "completed",
    recordedAt,
    rule: "area",
    season,
    xp,
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
