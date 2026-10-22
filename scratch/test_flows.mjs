// Scratch test script for ACTCET club data services and calculations
import assert from "node:assert";

// 1. Test AICTE calculation logic
function calculateAICTEPoints(memberId, events, attendanceRecords) {
  const attendedEventIds = new Set(
    attendanceRecords
      .filter((rec) => rec.memberId === memberId && rec.attended)
      .map((rec) => rec.eventId)
  );

  let totalHours = 0;
  for (const event of events) {
    if (attendedEventIds.has(event.id)) {
      const hours = Number(event.aicteHours) || 0;
      if (hours > 0) totalHours += hours;
    }
  }

  const points = totalHours / 4;
  const rounded = Math.round(points * 100) / 100;
  const formattedPoints = rounded.toString();

  return { totalHours, points, formattedPoints };
}

console.log("=== Testing AICTE Calculation ===");
const sampleEvents = [
  { id: "evt-1", name: "Telescope Observation", aicteHours: 4 },
  { id: "evt-2", name: "Astrophotography Workshop", aicteHours: 2 },
  { id: "evt-3", name: "Astronomy Quiz", aicteHours: 3 },
];

// Member attended evt-1 (4h) and evt-2 (2h) -> 6h -> 1.5 points
const att1 = [
  { memberId: "m1", eventId: "evt-1", attended: true },
  { memberId: "m1", eventId: "evt-2", attended: true },
  { memberId: "m1", eventId: "evt-3", attended: false },
];
const res1 = calculateAICTEPoints("m1", sampleEvents, att1);
assert.strictEqual(res1.totalHours, 6, "Total hours should be 6");
assert.strictEqual(res1.points, 1.5, "Points should be 1.5");
assert.strictEqual(res1.formattedPoints, "1.5", "Formatted points should be 1.5 without trailing zero");
console.log("✓ Case 1 Passed: 6 hours = 1.5 points (cleanly formatted)");

// Member attended evt-1 (4h), evt-2 (2h), evt-3 (3h) -> 9h -> 2.25 points
const att2 = [
  { memberId: "m2", eventId: "evt-1", attended: true },
  { memberId: "m2", eventId: "evt-2", attended: true },
  { memberId: "m2", eventId: "evt-3", attended: true },
];
const res2 = calculateAICTEPoints("m2", sampleEvents, att2);
assert.strictEqual(res2.totalHours, 9);
assert.strictEqual(res2.points, 2.25);
assert.strictEqual(res2.formattedPoints, "2.25");
console.log("✓ Case 2 Passed: 9 hours = 2.25 points");

// Member attended none -> 0 hours = 0 points
const res3 = calculateAICTEPoints("m3", sampleEvents, []);
assert.strictEqual(res3.totalHours, 0);
assert.strictEqual(res3.points, 0);
assert.strictEqual(res3.formattedPoints, "0");
console.log("✓ Case 3 Passed: 0 hours = 0 points");

console.log("\n=== Testing Search Field-Aware Matching ===");
function matchesMember(member, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const isSpecificYearQuery = q === "se" || q === "te" || q === "be";
  if (isSpecificYearQuery) {
    return member.year.toLowerCase() === q;
  }

  if (member.name.toLowerCase().includes(q)) return true;
  if (member.branch.toLowerCase().includes(q)) return true;
  if (member.year.toLowerCase().includes(q)) return true;
  const classPattern = `${member.year}-${member.branch}-${member.division}`.toLowerCase();
  if (classPattern.includes(q)) return true;
  if (member.role.toLowerCase().includes(q)) return true;
  return false;
}

const testMembers = [
  { name: "Shinjini Dutta", year: "SE", branch: "CSE(IoT)", division: "A", role: "Technical Head" },
  { name: "Aarav Sharma", year: "TE", branch: "Comp", division: "B", role: "Chairperson" },
  { name: "Jesse Pinkman", year: "BE", branch: "Mech", division: "C", role: "Member" },
];

assert.strictEqual(matchesMember(testMembers[0], "Shinjini"), true);
assert.strictEqual(matchesMember(testMembers[0], "CSE(IoT)"), true);
assert.strictEqual(matchesMember(testMembers[0], "se"), true);
assert.strictEqual(matchesMember(testMembers[1], "se"), false);
assert.strictEqual(matchesMember(testMembers[2], "se"), false);
assert.strictEqual(matchesMember(testMembers[2], "be"), true);
console.log("✓ Normalized field-aware year search correctly discriminates 'se' from substrings");

console.log("\nAll core calculation and search logic verified successfully!");
