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
const defaultSeasonId = "2026-summer";

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
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

  if (url.pathname === "/api/state") {
    if (!database) {
      sendJson(res, 503, { error: "Database is not configured" });
      return;
    }

    if (req.method === "GET") {
      sendJson(res, 200, await readState(database));
      return;
    }

    if (req.method === "PUT") {
      const state = await readJsonBody(req);
      await writeState(database, state);
      sendJson(res, 200, await readState(database));
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (url.pathname === "/api/settings") {
    await handleSettingsRequest(req, res, database);
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

  if (url.pathname === "/api/analysis/current") {
    await handleCurrentAnalysisRequest(req, res, url, database);
    return;
  }

  if (url.pathname === "/api/analysis/summary") {
    await handleSummaryAnalysisRequest(req, res, url, database);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (isReactAppPath(url.pathname)) {
    serveReactApp(req, res, url);
    return;
  }

  serveStatic(req, res, url);
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id integer PRIMARY KEY DEFAULT 1,
      settings jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT single_settings_row CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id text PRIMARY KEY,
      season text,
      rule text NOT NULL,
      stage text NOT NULL,
      weapon text NOT NULL,
      result text NOT NULL CHECK (result IN ('win', 'lose')),
      recorded_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS xp_records (
      id text PRIMARY KEY,
      season text,
      rule text NOT NULL,
      xp numeric(6, 1) NOT NULL CHECK (xp >= 0),
      recorded_at timestamptz NOT NULL
    );

    ALTER TABLE matches ADD COLUMN IF NOT EXISTS season text;
    ALTER TABLE xp_records ADD COLUMN IF NOT EXISTS season text;
    UPDATE matches SET season = '${defaultSeasonId}' WHERE season IS NULL;
    UPDATE xp_records SET season = '${defaultSeasonId}' WHERE season IS NULL;

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
    database.query("SELECT id, season, rule, xp, recorded_at FROM xp_records ORDER BY recorded_at DESC"),
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
          INSERT INTO xp_records (id, season, rule, xp, recorded_at)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [record.id, record.season, record.rule, record.xp, record.recordedAt],
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
      ["stage", "stage"],
    ];
    const where = [];
    const values = [];

    for (const [parameter, column] of filters) {
      const value = url.searchParams.get(parameter);
      if (!value || value === "all") continue;
      values.push(value);
      where.push(`${column} = $${values.length}`);
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

    if (page.cursor) {
      values.push(page.cursor.recordedAt, page.cursor.id);
      where.push(`(recorded_at, id) < ($${values.length - 1}, $${values.length})`);
    }

    values.push(page.limit + 1);
    const result = await database.query(
      `
        SELECT id, season, rule, xp, recorded_at
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
        INSERT INTO xp_records (id, season, rule, xp, recorded_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, season, rule, xp, recorded_at
      `,
      [record.id, record.season, record.rule, record.xp, record.recordedAt],
    );
    sendJson(res, 201, xpRecordFromRow(result.rows[0]));
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
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
        SELECT id, season, rule, xp, recorded_at
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
        WHERE season = $1 AND rule = $2 AND weapon = $3
      `,
      [season, rule, weapon],
    ),
    stages.length
      ? database.query(
          `
            SELECT stage, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
            FROM matches
            WHERE season = $1 AND rule = $2 AND weapon = $3 AND stage = ANY($4::text[])
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

async function handleSummaryAnalysisRequest(req, res, url, database) {
  if (!requireDatabase(res, database)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const { whereSql, values } = analysisFilters(url);
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
        ${whereSql}
      `,
      values,
    ),
    ...Object.values(breakdownQueries).map((column) =>
      database.query(
        `
          SELECT ${column} AS name, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE result = 'win')::int AS wins
          FROM matches
          ${whereSql}
          GROUP BY ${column}
          ORDER BY total DESC, wins DESC
        `,
        values,
      ),
    ),
    database.query(
      `
        SELECT
          CASE
            WHEN EXTRACT(HOUR FROM recorded_at) < 6 THEN '0-6'
            WHEN EXTRACT(HOUR FROM recorded_at) < 12 THEN '6-12'
            WHEN EXTRACT(HOUR FROM recorded_at) < 18 THEN '12-18'
            ELSE '18-24'
          END AS name,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE result = 'win')::int AS wins
        FROM matches
        ${whereSql}
        GROUP BY name
        ORDER BY name
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

function analysisFilters(url) {
  const definitions = [
    ["season", "season"],
    ["rule", "rule"],
    ["weapon", "weapon"],
    ["stage", "stage"],
  ];
  const where = [];
  const values = [];
  for (const [parameter, column] of definitions) {
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
      where.push(`EXTRACT(HOUR FROM recorded_at) >= $${values.length - 1} AND EXTRACT(HOUR FROM recorded_at) < $${values.length}`);
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
    recordedAt: toIsoString(row.recorded_at),
  };
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
  if (match.result !== "win" && match.result !== "lose") return null;

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

function serveStatic(req, res, url) {
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const requested = path.join(root, safePath === "/" ? "index.html" : safePath);
  const filePath = requested.startsWith(root) ? requested : path.join(root, "index.html");
  serveFile(req, res, filePath);
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

function isReactAppPath(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    pathname === "/record" ||
    pathname === "/backfill" ||
    pathname === "/analysis" ||
    pathname.startsWith("/analysis/")
  );
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

module.exports = {
  handleRequest,
  isReactAppPath,
  normalizeState,
  readJsonBody,
};
