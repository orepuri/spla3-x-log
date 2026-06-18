const assert = require("node:assert/strict");
const test = require("node:test");
const domain = require("../domain");

const matches = [
  match("1", "area", "ユノハナ大渓谷", "スプラシューター", "win", new Date(2026, 5, 18, 7, 0)),
  match("2", "area", "ユノハナ大渓谷", "スプラシューター", "lose", new Date(2026, 5, 18, 8, 0)),
  match("3", "tower", "デカライン高架下", "52ガロン", "win", new Date(2026, 5, 18, 19, 0)),
];

test("summarizeMatches returns wins, losses, total, and rounded win rate", () => {
  assert.deepEqual(domain.summarizeMatches(matches), {
    wins: 2,
    losses: 1,
    total: 3,
    winRate: 67,
  });
  assert.deepEqual(domain.summarizeMatches([]), {
    wins: 0,
    losses: 0,
    total: 0,
    winRate: null,
  });
});

test("filterMatches combines season, rule, weapon, stage, and time filters", () => {
  const filtered = domain.filterMatches(matches, {
    season: "2026-summer",
    rule: "area",
    weapon: "スプラシューター",
    stage: "ユノハナ大渓谷",
    time: "6-12",
  });

  assert.deepEqual(
    filtered.map((item) => item.id),
    ["1", "2"],
  );
});

test("breakdownRows sorts by match count and then win rate", () => {
  assert.deepEqual(domain.breakdownRows(matches, (item) => item.stage), [
    { name: "ユノハナ大渓谷", count: 2, rate: 50 },
    { name: "デカライン高架下", count: 1, rate: 100 },
  ]);
});

test("latestXpRecord returns the first record matching season and rule", () => {
  const records = [
    xpRecord("1", "area", 2100, "2026-06-18T10:00:00.000Z"),
    xpRecord("2", "tower", 2200, "2026-06-18T09:00:00.000Z"),
    xpRecord("3", "area", 2000, "2026-06-17T10:00:00.000Z"),
  ];

  assert.equal(domain.latestXpRecord(records, "2026-summer", "area").id, "1");
  assert.equal(domain.latestXpRecord(records, "2026-summer", "clam"), null);
});

test("xpDateRange supports saved periods, all records, and reversed custom dates", () => {
  const records = [
    xpRecord("1", "area", 2100, localIso(2026, 5, 10, 12)),
    xpRecord("2", "area", 2200, localIso(2026, 5, 15, 12)),
  ];
  const now = new Date(2026, 5, 18, 12);

  const recent = domain.xpDateRange({
    records,
    season: "2026-summer",
    rule: "area",
    period: "3",
    now,
  });
  assert.equal(recent.start.getTime(), new Date(2026, 5, 15, 12).getTime());
  assert.equal(recent.end.getTime(), now.getTime());

  const all = domain.xpDateRange({
    records,
    season: "2026-summer",
    rule: "area",
    period: "all",
    now,
  });
  assert.equal(all.start.getTime(), new Date(2026, 5, 10, 0, 0, 0, 0).getTime());
  assert.equal(all.end.getTime(), new Date(2026, 5, 15, 23, 59, 59, 999).getTime());

  const custom = domain.xpDateRange({
    records,
    season: "2026-summer",
    rule: "area",
    period: "custom",
    customStart: "2026-06-18",
    customEnd: "2026-06-12",
    now,
  });
  assert.equal(custom.start.getTime(), new Date(2026, 5, 12, 0, 0, 0, 0).getTime());
  assert.equal(custom.end.getTime(), new Date(2026, 5, 18, 23, 59, 59, 999).getTime());
});

function match(id, rule, stage, weapon, result, recordedAt) {
  return {
    id,
    season: "2026-summer",
    rule,
    stage,
    weapon,
    result,
    recordedAt: recordedAt.toISOString(),
  };
}

function xpRecord(id, rule, xp, recordedAt) {
  return {
    id,
    season: "2026-summer",
    rule,
    xp,
    recordedAt,
  };
}

function localIso(year, month, day, hour) {
  return new Date(year, month, day, hour).toISOString();
}
