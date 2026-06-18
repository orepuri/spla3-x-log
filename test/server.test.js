const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const test = require("node:test");
const { readJsonBody } = require("../server");

test("readJsonBody preserves UTF-8 characters split across request chunks", async () => {
  const payload = {
    settings: {
      stageA: "デカライン高架下",
      weapon: "スプラシューター",
    },
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  const stageSplit = splitInsideCharacter(body, "高");
  const weaponSplit = splitInsideCharacter(body, "シ", stageSplit);
  const request = Readable.from([
    body.subarray(0, stageSplit),
    body.subarray(stageSplit, weaponSplit),
    body.subarray(weaponSplit),
  ]);

  assert.deepEqual(await readJsonBody(request), payload);
});

function splitInsideCharacter(buffer, character, after = 0) {
  const characterBytes = Buffer.from(character, "utf8");
  const start = buffer.indexOf(characterBytes, after);
  assert.notEqual(start, -1);
  return start + 1;
}
