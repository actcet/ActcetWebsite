import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

// Exercise the production utility directly; its imports are types only.
const source = await readFile(new URL("../src/lib/aicte.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const {
  calculateAICTEPoints,
  formatCleanNumber,
  calculateHoursBasedPoints,
  validateAndComputeAllocation,
  makeAllocationId,
  normalizeAcademicYear,
  isValidAcademicYear,
  parseFlexibleDateToISO,
  getEffectiveEventStatus,
  isEventSelectableForAllocation,
  sortMembersAlphabetically,
  sortEventsAlphabetically,
  filterMembersBySearch,
  filterEventsBySearch,
  mergeAllocationsWithLegacyAttendance,
  calculateMemberAllocationSummary,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const events = [
  { id: "one", aicteHours: 4 },
  { id: "two", aicteHours: 2 },
  { id: "three", aicteHours: 3 },
];

test("Attended hours / live setting preserves fractional points and scopes member/event", () => {
  const attendance = ["one", "two", "three"].map((eventId) => ({
    eventId,
    memberId: "member",
    attended: true,
  }));
  attendance.push({ eventId: "one", memberId: "member", attended: true });
  attendance.push({ eventId: "unknown", memberId: "member", attended: true });
  assert.deepEqual(calculateAICTEPoints("member", events, attendance, 4), {
    totalHours: 9,
    points: 2.25,
    formattedPoints: "2.25",
  });
  assert.equal(calculateAICTEPoints("member", events, attendance, 8).points, 1.125);
  assert.equal(calculateAICTEPoints("other", events, attendance, 4).points, 0);
  assert.equal(
    calculateAICTEPoints(
      "member",
      events,
      [{ memberId: "member", eventId: "one", attended: false }],
      4
    ).points,
    0
  );
});

test("Invalid settings fail explicitly and display formatting keeps fractions", () => {
  for (const factor of [0, -1, NaN, Infinity]) {
    assert.throws(() => calculateAICTEPoints("member", events, [], factor));
  }
  assert.equal(formatCleanNumber(1.5), "1.5");
  assert.equal(formatCleanNumber(2.25), "2.25");
  assert.equal(formatCleanNumber(0), "0");
});

test("Members appear alphabetically and member search works by partial and case-insensitive name", () => {
  const unsorted = [
    { id: "3", name: "Shinjini Dutta", email: "shinjini@tcet.in", branch: "CSE(IoT)", year: "SE", division: "A", role: "Technical Head" },
    { id: "1", name: "aarav sharma", email: "aarav@tcet.in", branch: "Comp", year: "TE", division: "B", role: "Chairperson" },
    { id: "2", name: "Kimaya Jain", email: "kimaya@tcet.in", branch: "IOT", year: "SE", division: "A", role: "Member" },
  ];
  const sorted = sortMembersAlphabetically(unsorted);
  assert.deepEqual(sorted.map((m) => m.name), [
    "aarav sharma",
    "Kimaya Jain",
    "Shinjini Dutta",
  ]);

  assert.deepEqual(
    filterMembersBySearch(unsorted, "SHIN").map((m) => m.name),
    ["Shinjini Dutta"]
  );
  assert.deepEqual(
    filterMembersBySearch(unsorted, "aarav").map((m) => m.name),
    ["aarav sharma"]
  );
  assert.deepEqual(
    filterMembersBySearch(unsorted, "ja").map((m) => m.name),
    ["Kimaya Jain"]
  );
});

test("Completed events appear in event selector, sorted alphabetically, and upcoming/archived events are excluded", () => {
  const refMs = Date.parse("2026-10-31T12:00:00Z");
  const sampleEvents = [
    { id: "e1", name: "Telescope Workshop", academicYear: "2025-26", date: "29 July 2025", aicteHours: 4 },
    { id: "e2", name: "AC-TCET Club Orientation", academicYear: "2025-26", date: "14 July 2025", aicteHours: 4 },
    { id: "e3", name: "Moon Gazing", academicYear: "2026-27", date: "2026-08-15", aicteHours: 4, status: "completed" },
    { id: "e4", name: "Deep Space Future Symposium", academicYear: "2026-27", date: "2027-02-10", aicteHours: 4, status: "upcoming" },
    { id: "e5", name: "Archived Seminar", academicYear: "2024-25", date: "2024-09-10", aicteHours: 4, status: "archived", archived: true },
  ];

  assert.equal(getEffectiveEventStatus(sampleEvents[0], refMs), "completed");
  assert.equal(getEffectiveEventStatus(sampleEvents[3], refMs), "upcoming");
  assert.equal(getEffectiveEventStatus(sampleEvents[4], refMs), "archived");
  assert.equal(isEventSelectableForAllocation(sampleEvents[3], refMs), false);
  assert.equal(isEventSelectableForAllocation(sampleEvents[4], refMs), false);

  const selectable = filterEventsBySearch(sampleEvents, "", true, refMs);
  assert.deepEqual(selectable.map((e) => e.name), [
    "AC-TCET Club Orientation",
    "Moon Gazing",
    "Telescope Workshop",
  ]);

  const searched = filterEventsBySearch(sampleEvents, "moon", true, refMs);
  assert.deepEqual(searched.map((e) => e.name), ["Moon Gazing"]);
});

test("4 completed hours produces 1 AICTE point; direct point allocation works; hours and direct are mutually exclusive", () => {
  assert.equal(calculateHoursBasedPoints(4, 4), 1);
  assert.equal(calculateHoursBasedPoints(8, 4), 2);
  assert.equal(calculateHoursBasedPoints(6, 4), 1); // 4 completed hours = 1 point, partial hours do not award fractional points
  assert.equal(calculateHoursBasedPoints(3, 4), 0);

  const hoursAlloc = validateAndComputeAllocation(
    {
      memberId: "mem-1",
      eventId: "evt-moon",
      eventName: "Moon Gazing",
      eventDate: "2026-08-15",
      academicYear: "2026–27",
      allocationMethod: "hours",
      hours: 4,
    },
    4
  );
  assert.equal(hoursAlloc.id, "mem-1__evt-moon__2026-27");
  assert.equal(hoursAlloc.academicYear, "2026-27");
  assert.equal(hoursAlloc.allocationMethod, "hours");
  assert.equal(hoursAlloc.hours, 4);
  assert.equal(hoursAlloc.aictePoints, 1);

  const directAlloc = validateAndComputeAllocation(
    {
      memberId: "mem-1",
      eventId: "evt-astro",
      eventName: "Astromanthan 2025",
      eventDate: "2025-08-20",
      academicYear: "2025-26",
      allocationMethod: "direct",
      hours: null,
      aictePoints: 3,
    },
    4
  );
  assert.equal(directAlloc.allocationMethod, "direct");
  assert.equal(directAlloc.hours, null);
  assert.equal(directAlloc.aictePoints, 3);

  // Rejects when both hours and direct points are supplied in direct mode
  assert.throws(() =>
    validateAndComputeAllocation(
      {
        memberId: "mem-1",
        eventId: "evt-astro",
        eventName: "Astromanthan 2025",
        academicYear: "2025-26",
        allocationMethod: "direct",
        hours: 4,
        aictePoints: 2,
      },
      4
    )
  );

  // Rejects negative hours or negative points
  assert.throws(() =>
    validateAndComputeAllocation(
      {
        memberId: "mem-1",
        eventId: "evt-astro",
        eventName: "Astromanthan 2025",
        academicYear: "2025-26",
        allocationMethod: "hours",
        hours: -4,
      },
      4
    )
  );
  assert.throws(() =>
    validateAndComputeAllocation(
      {
        memberId: "mem-1",
        eventId: "evt-astro",
        eventName: "Astromanthan 2025",
        academicYear: "2025-26",
        allocationMethod: "direct",
        hours: null,
        aictePoints: -1,
      },
      4
    )
  );
});

test("Legacy Moon Gazing attendance is preserved and member totals recalculate on add, edit, and delete", () => {
  const clubEvents = [
    { id: "moon1234567890123456", name: "Moon Gazing", academicYear: "2026-27", date: "2026-08-15", aicteHours: 4 },
    { id: "cat_telescope-2025", name: "Telescope Workshop", academicYear: "2025-26", date: "2025-07-29", aicteHours: 8 },
  ];
  const legacyAttendance = [
    { memberId: "mem-1", eventId: "moon1234567890123456", attended: true },
  ];

  // 1. Legacy Moon Gazing attendance automatically maps to 1 AICTE point (4 hrs)
  let effective = mergeAllocationsWithLegacyAttendance([], legacyAttendance, clubEvents, 4);
  let summary = calculateMemberAllocationSummary("mem-1", effective);
  assert.equal(summary.totalPoints, 1);
  assert.equal(summary.totalHours, 4);
  assert.equal(summary.history.length, 1);
  assert.equal(summary.history[0].eventName, "Moon Gazing");
  assert.equal(summary.history[0].academicYear, "2026-27");

  // 2. Adding a new allocation in 2025-26 updates total across all years
  const newAlloc = {
    id: makeAllocationId("mem-1", "cat_telescope-2025", "2025-26"),
    memberId: "mem-1",
    eventId: "cat_telescope-2025",
    eventName: "Telescope Workshop",
    eventDate: "2025-07-29",
    academicYear: "2025-26",
    allocationMethod: "direct",
    hours: null,
    aictePoints: 2,
    createdAt: "2026-10-31T00:00:00Z",
    updatedAt: "2026-10-31T00:00:00Z",
    createdBy: "admin",
  };
  effective = mergeAllocationsWithLegacyAttendance([newAlloc], legacyAttendance, clubEvents, 4);
  summary = calculateMemberAllocationSummary("mem-1", effective);
  assert.equal(summary.totalPoints, 3);
  assert.equal(summary.count, 2);

  // 3. Editing Moon Gazing allocation overrides the legacy record without duplicating
  const editedMoon = {
    id: makeAllocationId("mem-1", "moon1234567890123456", "2026-27"),
    memberId: "mem-1",
    eventId: "moon1234567890123456",
    eventName: "Moon Gazing",
    eventDate: "2026-08-15",
    academicYear: "2026-27",
    allocationMethod: "hours",
    hours: 8,
    aictePoints: 2,
    createdAt: "2026-10-31T00:00:00Z",
    updatedAt: "2026-10-31T01:00:00Z",
    createdBy: "admin",
  };
  effective = mergeAllocationsWithLegacyAttendance(
    [newAlloc, editedMoon],
    legacyAttendance,
    clubEvents,
    4
  );
  summary = calculateMemberAllocationSummary("mem-1", effective);
  assert.equal(summary.totalPoints, 4);
  assert.equal(summary.count, 2);

  // 4. Deleting an allocation recalculates total immediately
  effective = mergeAllocationsWithLegacyAttendance([editedMoon], legacyAttendance, clubEvents, 4);
  summary = calculateMemberAllocationSummary("mem-1", effective);
  assert.equal(summary.totalPoints, 2);
  assert.equal(summary.count, 1);
});

test("Date and academic year utilities parse website event formats accurately", () => {
  assert.equal(normalizeAcademicYear("2025–26"), "2025-26");
  assert.equal(isValidAcademicYear("2026-27"), true);
  assert.equal(isValidAcademicYear("2026"), false);
  assert.equal(parseFlexibleDateToISO("14 July 2025"), "2025-07-14");
  assert.equal(parseFlexibleDateToISO("20–21 August 2025"), "2025-08-20");
  assert.equal(parseFlexibleDateToISO("August 2024"), "2024-08-01");
});
