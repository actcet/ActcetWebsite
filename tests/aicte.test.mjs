import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

// Exercise the production utility directly; its imports are types only.
const source = await readFile(new URL("../src/lib/aicte.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { calculateAICTEPoints, formatCleanNumber } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const events = [{ id: "one", aicteHours: 4 }, { id: "two", aicteHours: 2 }, { id: "three", aicteHours: 3 }];
test("Attended hours / live setting preserves fractional points and scopes member/event", () => {
  const attendance = ["one", "two", "three"].map(eventId => ({ eventId, memberId: "member", attended: true }));
  attendance.push({ eventId: "one", memberId: "member", attended: true }); // Duplicates never double-count an event.
  attendance.push({ eventId: "unknown", memberId: "member", attended: true });
  assert.deepEqual(calculateAICTEPoints("member", events, attendance, 4), { totalHours: 9, points: 2.25, formattedPoints: "2.25" });
  assert.equal(calculateAICTEPoints("member", events, attendance, 8).points, 1.125);
  assert.equal(calculateAICTEPoints("other", events, attendance, 4).points, 0);
  assert.equal(calculateAICTEPoints("member", events, [{ memberId: "member", eventId: "one", attended: false }], 4).points, 0);
});
test("Invalid settings fail explicitly and display formatting keeps fractions", () => {
  for (const factor of [0, -1, NaN, Infinity]) assert.throws(() => calculateAICTEPoints("member", events, [], factor));
  assert.equal(formatCleanNumber(1.5), "1.5");
  assert.equal(formatCleanNumber(2.25), "2.25");
  assert.equal(formatCleanNumber(0), "0");
});
