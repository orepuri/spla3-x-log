const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const root = __dirname;
const reactRoot = path.join(root, "dist");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "0.0.0.0";
const databaseUrl = process.env.DATABASE_URL;
const defaultSeasonId = "2026-autumn";
const appTimeZone = "Asia/Tokyo";
const seasonDefinitions = {
  "2026-summer": { endDate: "2026-08-31", startDate: "2026-06-01" },
  "2026-autumn": { endDate: null, startDate: "2026-09-01" },
};
const reportRuleIds = ["area", "tower", "rainmaker", "clam"];
const recordedHourSql = `EXTRACT(HOUR FROM recorded_at AT TIME ZONE '${appTimeZone}')`;

process.env.TZ = appTimeZone;

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      options: `-c timezone=${appTimeZone}`,
    })
  : null;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

async function start() {
  if (pool) {
    await migrate();
  }

  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: "Internal server error" });
    });
  });

  server.listen(port, host, () => {
    console.log(`http://${host}:${port}`);
  });
}

async function handleRequest(req, res, database = pool) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, database: Boolean(pool) });
    return;
  }

  if (url.pathname === "/api/archive") {
    await handleArchiveRequest(req, res, database);
    return;
  }

  if (url.pathname === "/api/settings") {
    await handleSettingsRequest(req, res, database);
    return;
  }

  if (url.pathname === "/api/preferences") {
    await handlePreferencesRequest(req, res, database);
    return;
  }

  if (url.pathname === "/api/matches") {
    await handleMatchesRequest(req, res, url, database);
    return;
  }

  const matchPath = url.pathname.match(/^\/api\/matches\/([^/]+)$/);
  if (matchPath) {
    await handleMatchRequest(req, res, database, decodeURIComponent(matchPath[1]));
    return;
  }

  if (url.pathname === "/api/xp-records") {
    await handleXpRecordsRequest(req, res, url, database);
    return;
  }

  const xpRecordPath = url.pathname.match(/^\/api\/xp-records\/([^/]+)$/);
  if (xpRecordPath) {
    await handleXpRecordRequest(req, res, database, decodeURIComponent(xpRecordPath[1]));
    return;
  }

  if (url.pathname === "/api/xp-state") {
    await handleXpStateRequest(req, res, url, database);
    return;
  }

  if (url.pathname === "/api/analysis/current") {
    await handleCurrentAnalysisRequest(req, res, url, database);
    return;
  }

  if (url.pathname === "/api/analysis/stages") {
    await handleStagePerformanceRequest(req, res, url, database);
    return;
  }

  if (url.pathname === "/api/analysis/stage-details") {
    await handleStageDetailsRequest(req, res, url, database);
    return;
  }

  if (url.pathname === "/api/analysis/options") {
    await handleAnalysisOptionsRequest(req, res, database);
    return;
  }

  if (url.pathname === "/api/analysis/summary") {
    await handleSummaryAnalysisRequest(req, res, url, database);
    return;
  }

  if (url.pathname === "/api/reports/monthly") {
    await handleMonthlyReportRequest(req, res, url, database);
    return;
  }

  if (url.pathname === "/api/reports/season") {
    await handleSeasonReportRequest(req, res, url, database);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  serveReactApp(req, res, url);
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id integer PRIMARY KEY DEFAULT 1,
      settings jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT single_settings_row CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS app_preferences (
      id integer PRIMARY KEY DEFAULT 1,
      preferences jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT single_preferences_row CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id text PRIMARY KEY,
      season text,
      rule text NOT NULL,
      stage text NOT NULL,
      weapon text NOT NULL,
      result text NOT NULL CHECK (result IN ('win', 'lose', 'disconnect')),
      recorded_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS xp_records (
      id text PRIMARY KEY,
      season text,
      rule text NOT NULL,
      xp numeric(6, 1) NOT NULL CHECK (xp >= 0),
      completed_match_id text,
      record_type text NOT NULL DEFAULT 'manual' CONSTRAINT xp_records_record_type_check CHECK (record_type IN ('completed', 'manual', 'initial')),
      recorded_at timestamptz NOT NULL
    );

    ALTER TABLE matches ADD COLUMN IF NOT EXISTS season text;
    ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_result_check;
    ALTER TABLE matches ADD CONSTRAINT matches_result_check CHECK (result IN ('win', 'lose', 'disconnect'));
    ALTER TABLE xp_records ADD COLUMN IF NOT EXISTS season text;
    ALTER TABLE xp_records ADD COLUMN IF NOT EXISTS completed_match_id text;
    ALTER TABLE xp_records ADD COLUMN IF NOT EXISTS record_type text;
    ALTER TABLE xp_records DROP CONSTRAINT IF EXISTS xp_records_record_type_check;
    ALTER TABLE xp_records ADD CONSTRAINT xp_records_record_type_check CHECK (record_type IN ('completed', 'manual', 'initial'));
    UPDATE matches SET season = '${defaultSeasonId}' WHERE season IS NULL;
    UPDATE xp_records SET season = '${defaultSeasonId}' WHERE season IS NULL;
    UPDATE xp_records SET record_type = 'completed' WHERE record_type IS NULL;
    ALTER TABLE xp_records ALTER COLUMN record_type SET DEFAULT 'manual';
    ALTER TABLE xp_records ALTER COLUMN record_type SET NOT NULL;

    CREATE INDEX IF NOT EXISTS matches_recorded_at_idx ON matches (recorded_at DESC);
    CREATE INDEX IF NOT EXISTS matches_season_idx ON matches (season);
    CREATE INDEX IF NOT EXISTS matches_rule_idx ON matches (rule);
    CREATE INDEX IF NOT EXISTS matches_stage_idx ON matches (stage);
    CREATE INDEX IF NOT EXISTS matches_weapon_idx ON matches (weapon);

    CREATE INDEX IF NOT EXISTS xp_records_recorded_at_idx ON xp_records (recorded_at DESC);
    CREATE INDEX IF NOT EXISTS xp_records_season_idx ON xp_records (season);
    CREATE INDEX IF NOT EXISTS xp_records_rule_idx ON xp_records (rule);
  `);
}

async function readState(database = pool) {
  const [settingsResult, matchesResult, xpResult] = await Promise.all([
    database.query("SELECT settings FROM app_settings WHERE id = 1"),
    database.query("SELECT id, season, rule, stage, weapon, result, recorded_at FROM matches ORDER BY recorded_at DESC"),
    database.query("SELECT id, season, rule, xp, completed_match_id, record_type, recorded_at FROM xp_records ORDER BY recorded_at DESC"),
  ]);

  return {
    settings: settingsResult.rows[0]?.settings || null,
    matches: matchesResult.rows.map((row) => ({
      id: row.id,
      season: row.season || defaultSeasonId,
      rule: row.rule,
      stage: row.stage,
      weapon: row.weapon,
      result: row.result,
      recordedAt: row.recorded_at.toISOString(),
    })),
    xpRecords: xpResult.rows.map((row) => ({
      id: row.id,
      season: row.season || defaultSeasonId,
      rule: row.rule,
      xp: Number(row.xp),
      completedMatchId: row.completed_match_id || null,
      recordType: row.record_type || "completed",
      recordedAt: row.recorded_at.toISOString(),
    })),
  };
}

async function writeState(database, state) {
  const normalized = normalizeState(state);
  const client = await database.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO app_settings (id, settings, updated_at)
        VALUES (1, $1, now())
        ON CONFLICT (id)
        DO UPDATE SET settings = EXCLUDED.settings, updated_at = now()
      `,
      [normalized.settings],
    );

    await client.query("DELETE FROM matches");
    await client.query("DELETE FROM xp_records");

    for (const match of normalized.matches) {
      await client.query(
        `
          INSERT INTO matches (id, season, rule, stage, weapon, result, recorded_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [match.id, match.season, match.rule, match.stage, match.weapon, match.result, match.recordedAt],
      );
    }

    for (const record of normalized.xpRecords) {
      await client.query(
        `
          INSERT INTO xp_records (id, season, rule, xp, completed_match_id, record_type, recorded_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [record.id, record.season, record.rule, record.xp, record.completedMatchId, record.recordType, record.recordedAt],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function handleSettingsRequest(req, res, database) {
  if (!requireDatabase(res, database)) return;

  if (req.method === "GET") {
    const result = await database.query("SELECT settings FROM app_settings WHERE id = 1");
    sendJson(res, 200, result.rows[0]?.settings || null);
    return;
  }

  if (req.method === "PUT") {
    const settings = await readJsonBody(req);
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      sendJson(res, 400, { error: "Settings must be an object" });
      return;
    }
    const result = await database.query(
      `
        INSERT INTO app_settings (id, settings, updated_at)
        VALUES (1, $1, now())
        ON CONFLICT (id)
        DO UPDATE SET settings = EXCLUDED.settings, updated_at = now()
        RETURNING settings
      `,
      [settings],
    );
    sendJson(res, 200, result.rows[0].settings);
    return;
  }

  if (req.method === "PATCH") {
    const patch = await readJsonBody(req);
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      sendJson(res, 400, { error: "Settings patch must be an object" });
      return;
    }
    const result = await database.query(
      `
        INSERT INTO app_settings (id, settings, updated_at)
        VALUES (1, $1, now())
        ON CONFLICT (id)
        DO UPDATE SET settings = app_settings.settings || EXCLUDED.settings, updated_at = now()
        RETURNING settings
      `,
      [patch],
    );
    sendJson(res, 200, result.rows[0].settings);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function handleArchiveRequest(req, res, database) {
  if (!requireDatabase(res, database)) return;

  if (req.method === "GET") {
    sendJson(res, 200, await readState(database));
    return;
  }

  if (req.method === "PUT") {
    const state = await readJsonBody(req);
    if (!isArchivePayload(state)) {
      sendJson(res, 400, { error: "Invalid archive" });
      return;
    }
    const normalized = normalizeState(state);
    await writeState(database, normalized);
    sendJson(res, 200, await readState(database));
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

function isArchivePayload(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value.settings === null || (typeof value.settings === "object" && !Array.isArray(value.settings))) &&
      Array.isArray(value.matches) &&
      Array.isArray(value.xpRecords),
  );
}

async function handlePreferencesRequest(req, res, database) {
  if (!requireDatabase(res, database)) return;

  if (req.method === "GET") {
    const result = await database.query("SELECT preferences FROM app_preferences WHERE id = 1");
    sendJson(res, 200, result.rows[0]?.preferences || {});
    return;
  }

  if (req.method === "PUT") {
    const preferences = await readJsonBody(req);
    if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
      sendJson(res, 400, { error: "Preferences must be an object" });
      return;
    }
    const result = await database.query(
      `
        INSERT INTO app_preferences (id, preferences, updated_at)
        VALUES (1, $1, now())
        ON CONFLICT (id)
        DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = now()
        RETURNING preferences
      `,
      [preferences],
    );
    sendJson(res, 200, result.rows[0].preferences);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function handleMatchesRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;

  if (req.method === "GET") {
    const page = paginationFromUrl(url);
    if (!page) {
      sendJson(res, 400, { error: "Invalid pagination cursor" });
      return;
    }
    const filters = [
      ["season", "season"],
      ["rule", "rule"],
      ["weapon", "weapon"],
    ];
    const where = [];
    const values = [];

    for (const [parameter, column] of filters) {
      const value = url.searchParams.get(parameter);
      if (!value || value === "all") continue;
      values.push(value);
      where.push(`${column} = $${values.length}`);
    }

    const stages = url.searchParams.getAll("stage").filter(Boolean);
    if (stages.length) {
      values.push(stages);
      where.push(`stage = ANY($${values.length}::text[])`);
    }

    const time = url.searchParams.get("time");
    if (time && time !== "all") {
      const [start, end] = time.split("-").map(Number);
      if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 24 && start < end) {
        values.push(start, end);
        where.push(`${recordedHourSql} >= $${values.length - 1} AND ${recordedHourSql} < $${values.length}`);
      }
    }

    if (page.cursor) {
      values.push(page.cursor.recordedAt, page.cursor.id);
      where.push(`(recorded_at, id) < ($${values.length - 1}, $${values.length})`);
    }

    values.push(page.limit + 1);
    const result = await database.query(
      `
        SELECT id, season, rule, stage, weapon, result, recorded_at
        FROM matches
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY recorded_at DESC, id DESC
        LIMIT $${values.length}
      `,
      values,
    );
    const hasMore = result.rows.length > page.limit;
    const items = result.rows.slice(0, page.limit).map(matchFromRow);
    sendJson(res, 200, {
      items,
      nextCursor: hasMore ? encodeCursor(items.at(-1)) : null,
    });
    return;
  }

  if (req.method === "POST") {
    const input = await readJsonBody(req);
    const match = normalizeMatch({
      ...input,
      id: input?.id || crypto.randomUUID(),
      recordedAt: input?.recordedAt || new Date().toISOString(),
    });
    if (!match) {
      sendJson(res, 400, { error: "Invalid match" });
      return;
    }
    const result = await database.query(
      `
        INSERT INTO matches (id, season, rule, stage, weapon, result, recorded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, season, rule, stage, weapon, result, recorded_at
      `,
      [match.id, match.season, match.rule, match.stage, match.weapon, match.result, match.recordedAt],
    );
    sendJson(res, 201, matchFromRow(result.rows[0]));
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function handleMatchRequest(req, res, database, matchId) {
  if (!requireDatabase(res, database)) return;
  if (!matchId) {
    sendJson(res, 400, { error: "Match id is required" });
    return;
  }

  if (req.method === "PATCH") {
    const currentResult = await database.query(
      "SELECT id, season, rule, stage, weapon, result, recorded_at FROM matches WHERE id = $1",
      [matchId],
    );
    if (currentResult.rows.length === 0) {
      sendJson(res, 404, { error: "Match not found" });
      return;
    }
    const input = await readJsonBody(req);
    const current = matchFromRow(currentResult.rows[0]);
    const match = normalizeMatch({ ...current, ...input, id: matchId });
    if (!match) {
      sendJson(res, 400, { error: "Invalid match" });
      return;
    }
    const result = await database.query(
      `
        UPDATE matches
        SET season = $2, rule = $3, stage = $4, weapon = $5, result = $6, recorded_at = $7
        WHERE id = $1
        RETURNING id, season, rule, stage, weapon, result, recorded_at
      `,
      [match.id, match.season, match.rule, match.stage, match.weapon, match.result, match.recordedAt],
    );
    sendJson(res, 200, matchFromRow(result.rows[0]));
    return;
  }

  if (req.method === "DELETE") {
    const result = await database.query("DELETE FROM matches WHERE id = $1 RETURNING id", [matchId]);
    if (result.rows.length === 0) {
      sendJson(res, 404, { error: "Match not found" });
      return;
    }
    res.writeHead(204);
    res.end();
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function handleXpRecordsRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;

  if (req.method === "GET") {
    const page = paginationFromUrl(url);
    if (!page) {
      sendJson(res, 400, { error: "Invalid pagination cursor" });
      return;
    }
    const where = [];
    const values = [];

    for (const [parameter, column] of [
      ["season", "season"],
      ["rule", "rule"],
    ]) {
      const value = url.searchParams.get(parameter);
      if (!value || value === "all") continue;
      values.push(value);
      where.push(`${column} = $${values.length}`);
    }

    for (const [parameter, operator] of [
      ["start", ">="],
      ["end", "<="],
    ]) {
      const value = url.searchParams.get(parameter);
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        sendJson(res, 400, { error: `Invalid ${parameter} date` });
        return;
      }
      values.push(date.toISOString());
      where.push(`recorded_at ${operator} $${values.length}`);
    }

    if (page.cursor) {
      values.push(page.cursor.recordedAt, page.cursor.id);
      where.push(`(recorded_at, id) < ($${values.length - 1}, $${values.length})`);
    }

    values.push(page.limit + 1);
    const result = await database.query(
      `
        SELECT id, season, rule, xp, completed_match_id, record_type, recorded_at
        FROM xp_records
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY recorded_at DESC, id DESC
        LIMIT $${values.length}
      `,
      values,
    );
    const hasMore = result.rows.length > page.limit;
    const items = result.rows.slice(0, page.limit).map(xpRecordFromRow);
    sendJson(res, 200, {
      items,
      nextCursor: hasMore ? encodeCursor(items.at(-1)) : null,
    });
    return;
  }

  if (req.method === "POST") {
    const input = await readJsonBody(req);
    const record = normalizeXpRecord({
      ...input,
      id: input?.id || crypto.randomUUID(),
      recordedAt: input?.recordedAt || new Date().toISOString(),
    });
    if (!record) {
      sendJson(res, 400, { error: "Invalid XP record" });
      return;
    }
    const result = await database.query(
      `
        INSERT INTO xp_records (id, season, rule, xp, completed_match_id, record_type, recorded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, season, rule, xp, completed_match_id, record_type, recorded_at
      `,
      [record.id, record.season, record.rule, record.xp, record.completedMatchId, record.recordType, record.recordedAt],
    );
    sendJson(res, 201, xpRecordFromRow(result.rows[0]));
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function handleXpRecordRequest(req, res, database, id) {
  if (!requireDatabase(res, database)) return;

  if (req.method === "PATCH") {
    const input = await readJsonBody(req);
    const record = normalizeXpRecord({ ...input, id });
    if (!record) {
      sendJson(res, 400, { error: "Invalid XP record" });
      return;
    }
    const result = await database.query(
      `
        UPDATE xp_records
        SET season = $2, rule = $3, xp = $4, completed_match_id = $5, record_type = $6, recorded_at = $7
        WHERE id = $1
        RETURNING id, season, rule, xp, completed_match_id, record_type, recorded_at
      `,
      [record.id, record.season, record.rule, record.xp, record.completedMatchId, record.recordType, record.recordedAt],
    );
    if (!result.rows.length) {
      sendJson(res, 404, { error: "XP record not found" });
      return;
    }
    sendJson(res, 200, xpRecordFromRow(result.rows[0]));
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function handleXpStateRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const season = url.searchParams.get("season");
  const rule = url.searchParams.get("rule");
  if (!season || !rule) {
    sendJson(res, 400, { error: "season and rule are required" });
    return;
  }

  const [matchesResult, xpResult] = await Promise.all([
    database.query(
      `
        SELECT id, season, rule, stage, weapon, result, recorded_at
        FROM matches
        WHERE rule = $1
        ORDER BY recorded_at ASC, id ASC
      `,
      [rule],
    ),
    database.query(
      `
        SELECT id, season, rule, xp, completed_match_id, record_type, recorded_at
        FROM xp_records
        WHERE rule = $1
        ORDER BY recorded_at ASC, id ASC
      `,
      [rule],
    ),
  ]);

  sendJson(
    res,
    200,
    computeXpState(
      matchesResult.rows.map(matchFromRow),
      xpResult.rows.map(xpRecordFromRow),
      season,
      rule,
    ),
  );
}

async function handleCurrentAnalysisRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const season = url.searchParams.get("season");
  const rule = url.searchParams.get("rule");
  const weapon = url.searchParams.get("weapon");
  const stages = url.searchParams.getAll("stage").filter(Boolean);
  if (!season || !rule || !weapon) {
    sendJson(res, 400, { error: "season, rule, and weapon are required" });
    return;
  }

  const [xpResult, weaponResult, stageResult] = await Promise.all([
    database.query(
      `
        SELECT id, season, rule, xp, completed_match_id, record_type, recorded_at
        FROM xp_records
        WHERE season = $1 AND rule = $2
        ORDER BY recorded_at DESC, id DESC
        LIMIT 1
      `,
      [season, rule],
    ),
    database.query(
      `
        SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        WHERE season = $1 AND rule = $2 AND weapon = $3 AND result IN ('win', 'lose')
      `,
      [season, rule, weapon],
    ),
    stages.length
      ? database.query(
          `
            SELECT stage, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
            FROM matches
            WHERE season = $1 AND rule = $2 AND weapon = $3 AND stage = ANY($4::text[]) AND result IN ('win', 'lose')
            GROUP BY stage
          `,
          [season, rule, weapon, stages],
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const stageRows = new Map(stageResult.rows.map((row) => [row.stage, row]));
  sendJson(res, 200, {
    latestXp: xpResult.rows[0] ? xpRecordFromRow(xpResult.rows[0]) : null,
    weapon: matchSummaryFromRow(weaponResult.rows[0]),
    stages: stages.map((stage) => ({
      stage,
      ...matchSummaryFromRow(stageRows.get(stage)),
    })),
  });
}

async function handleAnalysisOptionsRequest(req, res, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  const [seasonResult, ruleResult, weaponResult, stageResult] = await Promise.all([
    database.query(
      `
        SELECT value
        FROM (
          SELECT season AS value FROM matches
          UNION
          SELECT season AS value FROM xp_records
        ) options
        WHERE value IS NOT NULL AND value <> ''
        ORDER BY value
      `,
    ),
    database.query(
      `
        SELECT value
        FROM (
          SELECT rule AS value FROM matches
          UNION
          SELECT rule AS value FROM xp_records
        ) options
        WHERE value IS NOT NULL AND value <> ''
        ORDER BY value
      `,
    ),
    database.query("SELECT DISTINCT weapon AS value FROM matches WHERE weapon <> '' ORDER BY value"),
    database.query("SELECT DISTINCT stage AS value FROM matches WHERE stage <> '' ORDER BY value"),
  ]);
  sendJson(res, 200, {
    seasons: seasonResult.rows.map((row) => row.value),
    rules: ruleResult.rows.map((row) => row.value),
    weapons: weaponResult.rows.map((row) => row.value),
    stages: stageResult.rows.map((row) => row.value),
  });
}

async function handleStagePerformanceRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const season = url.searchParams.get("season");
  const rule = url.searchParams.get("rule");
  const start = url.searchParams.get("start");
  if (!season || !rule) {
    sendJson(res, 400, { error: "season and rule are required" });
    return;
  }

  const values = [season, rule];
  const where = ["season = $1", "rule = $2"];
  if (start) {
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      sendJson(res, 400, { error: "Invalid start date" });
      return;
    }
    values.push(startDate.toISOString());
    where.push(`recorded_at >= $${values.length}`);
  }
  where.push("result IN ('win', 'lose')");

  const [overallResult, stageResult] = await Promise.all([
    database.query(
      `
        SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        WHERE ${where.join(" AND ")}
      `,
      values,
    ),
    database.query(
      `
        SELECT stage, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        WHERE ${where.join(" AND ")}
        GROUP BY stage
        ORDER BY total DESC, wins DESC, stage ASC
      `,
      values,
    ),
  ]);
  sendJson(
    res,
    200,
    {
      stages: stageResult.rows.map((row) => ({
        stage: row.stage,
        ...matchSummaryFromRow(row),
      })),
      summary: matchSummaryFromRow(overallResult.rows[0]),
    },
  );
}

async function handleStageDetailsRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const { whereSql, values } = analysisFilters(url, new Set(["rule", "stage"]));
  const countedWhereSql = whereSql ? `${whereSql} AND result IN ('win', 'lose')` : "WHERE result IN ('win', 'lose')";
  const [overallResult, stageRuleResult] = await Promise.all([
    database.query(
      `
        SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        ${countedWhereSql}
      `,
      values,
    ),
    database.query(
      `
        SELECT stage, rule, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        ${countedWhereSql}
        GROUP BY stage, rule
        ORDER BY stage ASC, rule ASC
      `,
      values,
    ),
  ]);

  const stages = new Map();
  for (const row of stageRuleResult.rows) {
    if (!stages.has(row.stage)) {
      stages.set(row.stage, { rules: {}, stage: row.stage, total: emptyMatchSummary() });
    }
    const stage = stages.get(row.stage);
    const summary = matchSummaryFromRow(row);
    stage.rules[row.rule] = summary;
    stage.total.wins += summary.wins;
    stage.total.losses += summary.losses;
    stage.total.total += summary.total;
  }

  for (const stage of stages.values()) {
    stage.total.winRate = stage.total.total ? Math.round((stage.total.wins / stage.total.total) * 100) : null;
  }

  sendJson(res, 200, {
    stages: [...stages.values()],
    summary: matchSummaryFromRow(overallResult.rows[0]),
  });
}

async function handleSummaryAnalysisRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const { whereSql, values } = analysisFilters(url);
  const countedWhereSql = whereSql ? `${whereSql} AND result IN ('win', 'lose')` : "WHERE result IN ('win', 'lose')";
  const breakdownQueries = {
    season: "season",
    rule: "rule",
    stage: "stage",
    weapon: "weapon",
  };
  const [overallResult, ...breakdownResults] = await Promise.all([
    database.query(
      `
        SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        ${countedWhereSql}
      `,
      values,
    ),
    ...Object.values(breakdownQueries).map((column) =>
      database.query(
        `
          SELECT ${column} AS name, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
          FROM matches
          ${countedWhereSql}
          GROUP BY ${column}
          ORDER BY total DESC, wins DESC
        `,
        values,
      ),
    ),
    database.query(
      `
        SELECT
          (${recordedHourSql})::int::text AS name,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        ${countedWhereSql}
        GROUP BY (${recordedHourSql})::int
        ORDER BY (${recordedHourSql})::int
      `,
      values,
    ),
  ]);
  const breakdown = {};
  [...Object.keys(breakdownQueries), "time"].forEach((name, index) => {
    breakdown[name] = breakdownResults[index].rows.map((row) => ({
      name: row.name,
      ...matchSummaryFromRow(row),
    }));
  });
  sendJson(res, 200, {
    ...matchSummaryFromRow(overallResult.rows[0]),
    breakdown,
  });
}

async function handleMonthlyReportRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const range = monthRange(url.searchParams.get("month") || latestClosedMonthKey());
  if (!range) {
    sendJson(res, 400, { error: "Invalid month" });
    return;
  }
  if (range.month >= currentMonthKey()) {
    sendJson(res, 400, { error: "Monthly report is not available yet" });
    return;
  }

  const [matchesResult, xpResult] = await Promise.all([
    database.query(
      `
        SELECT id, season, rule, stage, weapon, result, recorded_at
        FROM matches
        WHERE recorded_at >= $1 AND recorded_at < $2
        ORDER BY recorded_at ASC, id ASC
      `,
      [range.start, range.end],
    ),
    database.query(
      `
        SELECT id, season, rule, xp, completed_match_id, record_type, recorded_at
        FROM xp_records
        WHERE recorded_at < $1
        ORDER BY recorded_at ASC, id ASC
      `,
      [range.end],
    ),
  ]);

  sendJson(
    res,
    200,
    buildMonthlyReport(
      range.month,
      range.start,
      range.end,
      matchesResult.rows.map(matchFromRow),
      xpResult.rows.map(xpRecordFromRow),
    ),
  );
}

async function handleSeasonReportRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const season = url.searchParams.get("season") || defaultSeasonId;
  const range = seasonRange(season);
  if (!range) {
    sendJson(res, 400, { error: "Invalid season" });
    return;
  }

  const [matchesResult, xpResult] = await Promise.all([
    database.query(
      `
        SELECT id, season, rule, stage, weapon, result, recorded_at
        FROM matches
        WHERE season = $1 AND recorded_at >= $2 AND recorded_at < $3
        ORDER BY recorded_at ASC, id ASC
      `,
      [season, range.start, range.end],
    ),
    database.query(
      `
        SELECT id, season, rule, xp, completed_match_id, record_type, recorded_at
        FROM xp_records
        WHERE recorded_at < $1
        ORDER BY recorded_at ASC, id ASC
      `,
      [range.end],
    ),
  ]);

  sendJson(
    res,
    200,
    buildSeasonReport(
      season,
      range.start,
      range.end,
      range.closed,
      matchesResult.rows.map(matchFromRow),
      xpResult.rows.map(xpRecordFromRow),
    ),
  );
}

function analysisFilters(url, ignoredParameters = new Set()) {
  const definitions = [
    ["season", "season"],
    ["rule", "rule"],
    ["weapon", "weapon"],
    ["stage", "stage"],
  ];
  const where = [];
  const values = [];
  for (const [parameter, column] of definitions) {
    if (ignoredParameters.has(parameter)) continue;
    const value = url.searchParams.get(parameter);
    if (!value || value === "all") continue;
    values.push(value);
    where.push(`${column} = $${values.length}`);
  }

  const time = url.searchParams.get("time");
  if (time && time !== "all") {
    const [start, end] = time.split("-").map(Number);
    if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 24 && start < end) {
      values.push(start, end);
      where.push(`${recordedHourSql} >= $${values.length - 1} AND ${recordedHourSql} < $${values.length}`);
    }
  }
  return {
    values,
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
  };
}

function matchSummaryFromRow(row) {
  const total = Number(row?.total || 0);
  const wins = Number(row?.wins || 0);
  return {
    wins,
    losses: total - wins,
    total,
    winRate: total ? Math.round((wins / total) * 100) : null,
  };
}

function emptyMatchSummary() {
  return {
    wins: 0,
    losses: 0,
    total: 0,
    winRate: null,
  };
}

function buildMonthlyReport(month, start, end, matches, xpRecords) {
  const periodMatches = matches.filter((match) => isInRange(match.recordedAt, start, end)).sort(compareRecordedAt);
  const countedPeriodMatches = periodMatches.filter(isCountedMatch);
  const periodRecords = xpRecords.filter((record) => isInRange(record.recordedAt, start, end)).sort(compareRecordedAt);
  const recordsBeforeStart = xpRecords.filter((record) => new Date(record.recordedAt).getTime() < new Date(start).getTime());
  const summary = summaryForMatches(countedPeriodMatches);
  const dayCounts = countBy(countedPeriodMatches, (match) => dateKeyInTokyo(match.recordedAt));
  const mostPlayedDay = [...dayCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([date, total]) => ({ date, total }))
    .at(0) || null;
  const overallStreak = streakStats(countedPeriodMatches);
  const rules = [...new Set([...countedPeriodMatches.map((match) => match.rule), ...xpRecords.map((record) => record.rule)])]
    .map((rule) => {
      const ruleMatches = countedPeriodMatches.filter((match) => match.rule === rule);
      const before = recordsBeforeStart.filter((record) => record.rule === rule).sort(compareRecordedAt).at(-1) || null;
      const inMonth = periodRecords.filter((record) => record.rule === rule);
      const points = [before, ...inMonth].filter(Boolean);
      const final = points.at(-1) || null;
      const highest = points.length ? points.reduce((best, record) => (record.xp > best.xp ? record : best), points[0]) : null;
      const lowest = points.length ? points.reduce((worst, record) => (record.xp < worst.xp ? record : worst), points[0]) : null;
      const startXp = before?.xp ?? null;
      const finalXp = final?.xp ?? null;
      return {
        ...summaryForMatches(ruleMatches),
        finalXp,
        highestXp: highest?.xp ?? null,
        lowestXp: lowest?.xp ?? null,
        maxLoseStreak: streakStats(ruleMatches).maxLoseStreak,
        maxWinStreak: streakStats(ruleMatches).maxWinStreak,
        rule,
        startXp,
        xpDelta: startXp === null || finalXp === null ? null : roundXp(finalXp - startXp),
      };
    })
    .filter((row) => row.total > 0 || row.finalXp !== null)
    .sort((left, right) => right.total - left.total || String(left.rule).localeCompare(String(right.rule)));
  const stages = [...groupBy(countedPeriodMatches, (match) => match.stage).entries()]
    .map(([stage, stageMatches]) => {
      const mainRules = [...countBy(stageMatches, (match) => match.rule).entries()]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 2)
        .map(([rule]) => rule);
      const streak = streakStats(stageMatches);
      return {
        ...summaryForMatches(stageMatches),
        mainRules,
        maxLoseStreak: streak.maxLoseStreak,
        maxWinStreak: streak.maxWinStreak,
        stage,
      };
    })
    .sort((left, right) => right.total - left.total || (right.winRate || 0) - (left.winRate || 0));
  const bestStage = stages.filter((stage) => stage.total >= 3).sort((left, right) => (right.winRate || 0) - (left.winRate || 0) || right.total - left.total)[0] || null;
  const toughStage = stages.filter((stage) => stage.total >= 3).sort((left, right) => (left.winRate || 0) - (right.winRate || 0) || right.total - left.total)[0] || null;
  const mostImprovedRule = rules
    .filter((rule) => rule.xpDelta !== null)
    .sort((left, right) => (right.xpDelta || 0) - (left.xpDelta || 0))[0] || null;
  const highestXpRule = rules
    .filter((rule) => rule.highestXp !== null)
    .sort((left, right) => (right.highestXp || 0) - (left.highestXp || 0))[0] || null;

  return {
    highlights: {
      bestStage: bestStage ? { stage: bestStage.stage, total: bestStage.total, winRate: bestStage.winRate } : null,
      highestXp: highestXpRule ? { rule: highestXpRule.rule, xp: highestXpRule.highestXp } : null,
      maxLoseStreak: overallStreak.maxLoseStreak,
      maxWinStreak: overallStreak.maxWinStreak,
      mostImprovedRule: mostImprovedRule ? { rule: mostImprovedRule.rule, xpDelta: mostImprovedRule.xpDelta } : null,
      mostPlayedDay,
      toughStage: toughStage ? { stage: toughStage.stage, total: toughStage.total, winRate: toughStage.winRate } : null,
    },
    month,
    range: { end, start },
    rules,
    stages,
    summary: {
      ...summary,
      activeDays: dayCounts.size,
      averageMatchesPerActiveDay: dayCounts.size ? Math.round((summary.total / dayCounts.size) * 10) / 10 : 0,
      maxLoseStreak: overallStreak.maxLoseStreak,
      maxWinStreak: overallStreak.maxWinStreak,
      mostPlayedDay,
    },
  };
}

function buildSeasonReport(season, start, end, closed, matches, xpRecords) {
  const periodMatches = matches.filter((match) => isInRange(match.recordedAt, start, end)).sort(compareRecordedAt);
  const countedPeriodMatches = periodMatches.filter(isCountedMatch);
  const periodRecords = xpRecords
    .filter((record) => record.season === season && isInRange(record.recordedAt, start, end))
    .sort(compareRecordedAt);
  const recordsBeforeStart = xpRecords
    .filter((record) => new Date(record.recordedAt).getTime() < new Date(start).getTime())
    .sort(compareRecordedAt);
  const summary = summaryForMatches(countedPeriodMatches);
  const dayCounts = countBy(countedPeriodMatches, (match) => dateKeyInTokyo(match.recordedAt));
  const mostPlayedDay = [...dayCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([date, total]) => ({ date, total }))
    .at(0) || null;
  const overallStreak = streakStats(countedPeriodMatches);
  const ruleIds = [...new Set([...reportRuleIds, ...countedPeriodMatches.map((match) => match.rule), ...periodRecords.map((record) => record.rule)])];
  const rules = ruleIds
    .map((rule) => {
      const ruleMatches = countedPeriodMatches.filter((match) => match.rule === rule);
      const before = recordsBeforeStart.filter((record) => record.rule === rule).at(-1) || null;
      const inSeason = periodRecords.filter((record) => record.rule === rule);
      const points = [before, ...inSeason].filter(Boolean);
      const final = points.at(-1) || null;
      const highest = points.length ? points.reduce((best, record) => (record.xp > best.xp ? record : best), points[0]) : null;
      const lowest = points.length ? points.reduce((worst, record) => (record.xp < worst.xp ? record : worst), points[0]) : null;
      const startXp = before?.xp ?? null;
      const finalXp = final?.xp ?? null;
      const streak = streakStats(ruleMatches);
      return {
        ...summaryForMatches(ruleMatches),
        finalXp,
        highestXp: highest?.xp ?? null,
        lowestXp: lowest?.xp ?? null,
        maxLoseStreak: streak.maxLoseStreak,
        maxWinStreak: streak.maxWinStreak,
        rule,
        startXp,
        xpDelta: startXp === null || finalXp === null ? null : roundXp(finalXp - startXp),
      };
    })
    .sort((left, right) => right.total - left.total || String(left.rule).localeCompare(String(right.rule)));
  const stages = [...groupBy(countedPeriodMatches, (match) => match.stage).entries()]
    .map(([stage, stageMatches]) => {
      const mainRules = [...countBy(stageMatches, (match) => match.rule).entries()]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 2)
        .map(([rule]) => rule);
      const streak = streakStats(stageMatches);
      return {
        ...summaryForMatches(stageMatches),
        mainRules,
        maxLoseStreak: streak.maxLoseStreak,
        maxWinStreak: streak.maxWinStreak,
        stage,
      };
    })
    .sort((left, right) => right.total - left.total || (right.winRate || 0) - (left.winRate || 0));
  const bestStage = stages.filter((stage) => stage.total >= 3).sort((left, right) => (right.winRate || 0) - (left.winRate || 0) || right.total - left.total)[0] || null;
  const toughStage = stages.filter((stage) => stage.total >= 3).sort((left, right) => (left.winRate || 0) - (right.winRate || 0) || right.total - left.total)[0] || null;
  const mostImprovedRule = rules
    .filter((rule) => rule.xpDelta !== null)
    .sort((left, right) => (right.xpDelta || 0) - (left.xpDelta || 0))[0] || null;
  const highestXpRule = rules
    .filter((rule) => rule.highestXp !== null)
    .sort((left, right) => (right.highestXp || 0) - (left.highestXp || 0))[0] || null;

  return {
    highlights: {
      bestStage: bestStage ? { stage: bestStage.stage, total: bestStage.total, winRate: bestStage.winRate } : null,
      highestXp: highestXpRule ? { rule: highestXpRule.rule, xp: highestXpRule.highestXp } : null,
      maxLoseStreak: overallStreak.maxLoseStreak,
      maxWinStreak: overallStreak.maxWinStreak,
      mostImprovedRule: mostImprovedRule ? { rule: mostImprovedRule.rule, xpDelta: mostImprovedRule.xpDelta } : null,
      mostPlayedDay,
      toughStage: toughStage ? { stage: toughStage.stage, total: toughStage.total, winRate: toughStage.winRate } : null,
    },
    xpTrend: buildSeasonXpTrend(periodRecords, recordsBeforeStart, start, end, ruleIds),
    range: { closed, end, start },
    rules,
    season,
    stages,
    summary: {
      ...summary,
      activeDays: dayCounts.size,
      averageMatchesPerActiveDay: dayCounts.size ? Math.round((summary.total / dayCounts.size) * 10) / 10 : 0,
      maxLoseStreak: overallStreak.maxLoseStreak,
      maxWinStreak: overallStreak.maxWinStreak,
      mostPlayedDay,
    },
  };
}

function buildSeasonXpTrend(periodRecords, recordsBeforeStart, start, end, ruleIds) {
  const current = Object.fromEntries(ruleIds.map((rule) => [rule, null]));
  for (const record of recordsBeforeStart) current[record.rule] = record.xp;
  const frames = [xpFrame(start, current, ruleIds)];
  let group = [];
  let groupTime = null;
  for (const record of periodRecords) {
    const recordedAt = new Date(record.recordedAt).getTime();
    if (group.length && recordedAt !== groupTime) {
      for (const groupedRecord of group) current[groupedRecord.rule] = groupedRecord.xp;
      frames.push(xpFrame(group[0].recordedAt, current, ruleIds));
      group = [];
    }
    groupTime = recordedAt;
    group.push(record);
  }
  if (group.length) {
    for (const record of group) current[record.rule] = record.xp;
    frames.push(xpFrame(group[0].recordedAt, current, ruleIds));
  }
  frames.push(xpFrame(end, current, ruleIds));
  return frames;
}

function xpFrame(recordedAt, current, ruleIds) {
  const xps = Object.fromEntries(ruleIds.map((rule) => [rule, current[rule] ?? null]));
  return { recordedAt, xps };
}

function summaryForMatches(matches) {
  const counted = matches.filter(isCountedMatch);
  return {
    ...scoreCountedMatches(counted),
    total: counted.length,
    winRate: counted.length ? Math.round((counted.filter((match) => match.result === "win").length / counted.length) * 100) : null,
  };
}

function streakStats(matches) {
  let currentResult = null;
  let currentLength = 0;
  let maxWinStreak = 0;
  let maxLoseStreak = 0;
  for (const match of matches.filter(isCountedMatch).sort(compareRecordedAt)) {
    if (match.result === currentResult) currentLength += 1;
    else {
      currentResult = match.result;
      currentLength = 1;
    }
    if (match.result === "win") maxWinStreak = Math.max(maxWinStreak, currentLength);
    else maxLoseStreak = Math.max(maxLoseStreak, currentLength);
  }
  return { maxLoseStreak, maxWinStreak };
}

function isCountedMatch(match) {
  return match.result === "win" || match.result === "lose";
}

function scoreCountedMatches(matches) {
  const wins = matches.filter((match) => match.result === "win").length;
  const losses = matches.filter((match) => match.result === "lose").length;
  return { losses, wins };
}

function groupBy(items, keyFn) {
  const result = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const values = result.get(key) || [];
    values.push(item);
    result.set(key, values);
  }
  return result;
}

function countBy(items, keyFn) {
  const result = new Map();
  for (const item of items) {
    const key = keyFn(item);
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}

function isInRange(value, start, end) {
  const time = new Date(value).getTime();
  return time >= new Date(start).getTime() && time < new Date(end).getTime();
}

function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return null;
  const start = new Date(Date.UTC(year, monthNumber - 1, 1, -9, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNumber, 1, -9, 0, 0, 0));
  return { end: end.toISOString(), month, start: start.toISOString() };
}

function seasonRange(season) {
  const definition = seasonDefinitions[season];
  if (!definition) return null;
  const start = calendarDateToJstStart(definition.startDate);
  const end = definition.endDate ? calendarDateToJstStart(addCalendarDay(definition.endDate)) : new Date().toISOString();
  return { closed: Boolean(definition.endDate), end, season, start };
}

function calendarDateToJstStart(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0)).toISOString();
}

function addCalendarDay(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function currentMonthKey() {
  return dateKeyInTokyo(new Date().toISOString()).slice(0, 7);
}

function latestClosedMonthKey() {
  const [year, month] = currentMonthKey().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dateKeyInTokyo(value) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    month: "2-digit",
    timeZone: appTimeZone,
    year: "numeric",
  })
    .formatToParts(new Date(value))
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function requireDatabase(res, database) {
  if (database) return true;
  sendJson(res, 503, { error: "Database is not configured" });
  return false;
}

function paginationFromUrl(url) {
  const requestedLimit = Number(url.searchParams.get("limit") || 25);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 25;
  const encodedCursor = url.searchParams.get("cursor");
  if (!encodedCursor) return { cursor: null, limit };
  const cursor = decodeCursor(encodedCursor);
  return cursor ? { cursor, limit } : null;
}

function encodeCursor(record) {
  if (!record) return null;
  return Buffer.from(JSON.stringify({ recordedAt: record.recordedAt, id: record.id }), "utf8").toString("base64url");
}

function decodeCursor(value) {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || !parsed.id || Number.isNaN(new Date(parsed.recordedAt).getTime())) return null;
    return {
      id: String(parsed.id),
      recordedAt: new Date(parsed.recordedAt).toISOString(),
    };
  } catch (_error) {
    return null;
  }
}

function matchFromRow(row) {
  return {
    id: row.id,
    season: row.season || defaultSeasonId,
    rule: row.rule,
    stage: row.stage,
    weapon: row.weapon,
    result: row.result,
    recordedAt: toIsoString(row.recorded_at),
  };
}

function xpRecordFromRow(row) {
  return {
    id: row.id,
    season: row.season || defaultSeasonId,
    rule: row.rule,
    xp: Number(row.xp),
    completedMatchId: row.completed_match_id || null,
    recordType: row.record_type || "completed",
    recordedAt: toIsoString(row.recorded_at),
  };
}

function computeXpState(matches, xpRecords, selectedSeason, selectedRule) {
  const ruleMatches = matches
    .filter((match) => match.rule === selectedRule)
    .sort(compareRecordedAt);
  const ruleRecords = xpRecords
    .filter((record) => record.rule === selectedRule)
    .sort(compareRecordedAt);
  const matchesBySeason = new Map();
  for (const match of ruleMatches) {
    const items = matchesBySeason.get(match.season) || [];
    items.push(match);
    matchesBySeason.set(match.season, items);
  }

  const selectedMatches = matchesBySeason.get(selectedSeason) || [];
  const selectedRecords = ruleRecords.filter((record) => record.season === selectedSeason);
  const latestBaseline = [...selectedRecords]
    .filter((record) => record.recordType === "completed" || record.recordType === "initial")
    .map((record) => ({ boundaryIndex: completedBoundaryIndex(record, selectedMatches), record }))
    .filter((item) => !item.record.completedMatchId || item.boundaryIndex >= 0)
    .sort((left, right) => left.boundaryIndex - right.boundaryIndex || compareRecordedAt(left.record, right.record))
    .at(-1);
  const unmatched = selectedMatches.slice((latestBaseline?.boundaryIndex ?? -1) + 1);
  const pending = [];
  let currentMatches = [];

  for (const match of unmatched) {
    currentMatches.push(match);
    const score = scoreMatches(currentMatches);
    if (!isCompletedScore(score)) continue;
    const delta = estimatedXpDelta(score);
    pending.push({
      completedAt: match.recordedAt,
      completedMatchId: match.id,
      estimatedXp: !latestBaseline ? null : roundXp(latestBaseline.record.xp + delta),
      losses: score.losses,
      wins: score.wins,
    });
    currentMatches = [];
  }

  return {
    current: scoreMatches(currentMatches),
    latestXp: [...selectedRecords].sort(compareRecordedAt).at(-1) || null,
    pending,
  };
}

function completedBoundaryIndex(record, matches) {
  if (record.completedMatchId) return matches.findIndex((match) => match.id === record.completedMatchId);
  const recordedAt = new Date(record.recordedAt).getTime();
  let boundaryIndex = -1;
  matches.forEach((match, index) => {
    if (new Date(match.recordedAt).getTime() <= recordedAt) boundaryIndex = index;
  });
  return boundaryIndex;
}

function compareRecordedAt(left, right) {
  const difference = new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime();
  return difference || String(left.id).localeCompare(String(right.id));
}

function scoreMatches(matches) {
  const wins = matches.filter((match) => match.result === "win").length;
  return { wins, losses: matches.length - wins };
}

function isCompletedScore(score) {
  return score.wins === 3 || score.losses === 3;
}

function estimatedXpDelta(score) {
  if (score.wins === 3) return 75 - score.losses * 25;
  return -(75 - score.wins * 25);
}

function roundXp(value) {
  return Math.round(value * 10) / 10;
}

function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeState(value) {
  return {
    settings: value && typeof value.settings === "object" && value.settings ? value.settings : {},
    matches: Array.isArray(value && value.matches) ? value.matches.map(normalizeMatch).filter(Boolean) : [],
    xpRecords: Array.isArray(value && value.xpRecords) ? value.xpRecords.map(normalizeXpRecord).filter(Boolean) : [],
  };
}

function normalizeMatch(match) {
  if (!match || !match.id || !match.rule || !match.stage || !match.weapon) return null;
  if (match.result !== "win" && match.result !== "lose" && match.result !== "disconnect") return null;

  return {
    id: String(match.id),
    season: String(match.season || defaultSeasonId),
    rule: String(match.rule),
    stage: String(match.stage),
    weapon: String(match.weapon),
    result: match.result,
    recordedAt: validDate(match.recordedAt),
  };
}

function normalizeXpRecord(record) {
  const xp = Number(record && record.xp);
  if (!record || !record.id || !record.rule || !Number.isFinite(xp) || xp < 0) return null;

  return {
    id: String(record.id),
    season: String(record.season || defaultSeasonId),
    rule: String(record.rule),
    xp,
    completedMatchId: record.completedMatchId ? String(record.completedMatchId) : null,
    recordType: record.recordType === "initial" ? "initial" : record.recordType === "manual" ? "manual" : "completed",
    recordedAt: validDate(record.recordedAt),
  };
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bodyLength = 0;

    req.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bodyLength += buffer.length;
      if (bodyLength > 5_000_000) {
        req.destroy();
        reject(new Error("Request body is too large"));
        return;
      }
      chunks.push(buffer);
    });

    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks, bodyLength).toString("utf8");
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function serveReactApp(req, res, url) {
  const isAsset = url.pathname.startsWith("/assets/");
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const requested = path.join(reactRoot, safePath);
  const filePath = isAsset && requested.startsWith(reactRoot) ? requested : path.join(reactRoot, "index.html");
  serveFile(req, res, filePath);
}

function serveFile(req, res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "content-type": types[path.extname(filePath)] || "application/octet-stream" });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(data);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

module.exports = {
  computeXpState,
  handleRequest,
  normalizeState,
  readJsonBody,
};
