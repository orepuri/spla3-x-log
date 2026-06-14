const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const root = __dirname;
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
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

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

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, database: Boolean(pool) });
    return;
  }

  if (url.pathname === "/api/state") {
    if (!pool) {
      sendJson(res, 503, { error: "Database is not configured" });
      return;
    }

    if (req.method === "GET") {
      sendJson(res, 200, await readState());
      return;
    }

    if (req.method === "PUT") {
      const state = await readJsonBody(req);
      await writeState(state);
      sendJson(res, 200, await readState());
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 404, { error: "Not found" });
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

async function readState() {
  const [settingsResult, matchesResult, xpResult] = await Promise.all([
    pool.query("SELECT settings FROM app_settings WHERE id = 1"),
    pool.query("SELECT id, season, rule, stage, weapon, result, recorded_at FROM matches ORDER BY recorded_at DESC"),
    pool.query("SELECT id, season, rule, xp, recorded_at FROM xp_records ORDER BY recorded_at DESC"),
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

async function writeState(state) {
  const normalized = normalizeState(state);
  const client = await pool.connect();

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
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        req.destroy();
        reject(new Error("Request body is too large"));
      }
    });

    req.on("end", () => {
      try {
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
