import type {
  AICTESummary,
  AllocationMethod,
  AttendanceRecord,
  ClubEvent,
  EventStatus,
  MemberEventPointAllocation,
} from "@/types";

/**
 * Calculates total attended hours and resulting AICTE points for a member
 * from legacy attendance records.
 * Conversion factor is supplied from settings/club (normally 4 hours per point).
 */
export function calculateAICTEPoints(
  memberId: string,
  events: ClubEvent[],
  attendanceRecords: AttendanceRecord[],
  hoursPerAICTEPoint: number
): AICTESummary {
  const attendedEventIds = new Set(
    attendanceRecords
      .filter((rec) => rec.memberId === memberId && rec.attended)
      .map((rec) => rec.eventId)
  );

  let totalHours = 0;
  for (const event of events) {
    if (attendedEventIds.has(event.id)) {
      const hours = Number(event.aicteHours) || 0;
      if (hours > 0) {
        totalHours += hours;
      }
    }
  }

  if (!Number.isFinite(hoursPerAICTEPoint) || hoursPerAICTEPoint <= 0) {
    throw new Error("Invalid AICTE conversion factor in club settings.");
  }
  const points = totalHours / hoursPerAICTEPoint;
  const formattedPoints = formatCleanNumber(points);

  return {
    totalHours,
    points,
    formattedPoints,
  };
}

/**
 * Formats a number without unnecessary trailing zeros.
 * 1.50 -> "1.5"
 * 2.00 -> "2"
 * 0.75 -> "0.75"
 */
export function formatCleanNumber(value: number): string {
  if (isNaN(value) || value === 0) return "0";
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString();
}

/**
 * Normalizes an academic year string (e.g. "2025–26" -> "2025-26").
 */
export function normalizeAcademicYear(value: string): string {
  return (value || "").trim().replace(/[\u2013\u2014]/g, "-");
}

/**
 * Validates that an academic year matches YYYY-YY format (e.g., "2026-27").
 */
export function isValidAcademicYear(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(normalizeAcademicYear(value));
}

/**
 * Builds the deterministic uniqueness key for memberId + eventId + academicYear.
 */
export function makeAllocationId(
  memberId: string,
  eventId: string,
  academicYear: string
): string {
  return `${memberId.trim()}__${eventId.trim()}__${normalizeAcademicYear(academicYear)}`;
}

/**
 * Calculates AICTE points for hours-based allocation.
 * Rule: 4 completed hours = 1 AICTE point.
 * Partial hours (< 4 hrs) do not award fractional points.
 */
export function calculateHoursBasedPoints(
  hours: number,
  hoursPerAICTEPoint = 4
): number {
  if (!Number.isFinite(hoursPerAICTEPoint) || hoursPerAICTEPoint <= 0) {
    throw new Error("Invalid AICTE conversion factor in club settings.");
  }
  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error("Hours must be a non-negative number.");
  }
  return Math.floor(hours / hoursPerAICTEPoint);
}

/**
 * Validates and normalizes an AICTE allocation input, enforcing that
 * hours-based and direct points cannot both be active simultaneously.
 */
export function validateAndComputeAllocation(
  input: {
    memberId: string;
    eventId: string;
    eventName: string;
    eventDate?: string;
    academicYear: string;
    allocationMethod: AllocationMethod;
    hours: number | null | undefined;
    aictePoints?: number | null;
  },
  hoursPerAICTEPoint = 4
): {
  id: string;
  memberId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  academicYear: string;
  allocationMethod: AllocationMethod;
  hours: number | null;
  aictePoints: number;
} {
  const memberId = (input.memberId || "").trim();
  const eventId = (input.eventId || "").trim();
  const eventName = (input.eventName || "").trim();
  const eventDate = (input.eventDate || "").trim();
  const academicYear = normalizeAcademicYear(input.academicYear);

  if (!memberId) throw new Error("Please select an approved member.");
  if (!eventId || !eventName) throw new Error("Please select a completed event.");
  if (!isValidAcademicYear(academicYear)) {
    throw new Error("Please provide a valid academic year (e.g. 2026-27).");
  }
  if (input.allocationMethod !== "hours" && input.allocationMethod !== "direct") {
    throw new Error("Select a valid allocation method (Hours-based or Direct AICTE points).");
  }

  if (input.allocationMethod === "hours") {
    if (input.hours === null || input.hours === undefined || !Number.isFinite(Number(input.hours))) {
      throw new Error("Please enter the number of hours attended.");
    }
    const numericHours = Math.round(Number(input.hours) * 100) / 100;
    if (numericHours < 0 || numericHours > 10000) {
      throw new Error("Hours must be a non-negative number.");
    }
    const calculatedPoints = calculateHoursBasedPoints(numericHours, hoursPerAICTEPoint);
    return {
      id: makeAllocationId(memberId, eventId, academicYear),
      memberId,
      eventId,
      eventName,
      eventDate,
      academicYear,
      allocationMethod: "hours",
      hours: numericHours,
      aictePoints: calculatedPoints,
    };
  }

  // Direct AICTE points mode: hours MUST be null/inactive
  if (input.hours !== null && input.hours !== undefined) {
    throw new Error("Hours and direct AICTE points cannot both be used in one allocation.");
  }
  if (input.aictePoints === null || input.aictePoints === undefined || !Number.isFinite(Number(input.aictePoints))) {
    throw new Error("Please enter the direct AICTE points to allocate.");
  }
  const numericPoints = Math.round(Number(input.aictePoints) * 100) / 100;
  if (numericPoints < 0 || numericPoints > 2500) {
    throw new Error("AICTE points must be a non-negative number.");
  }

  return {
    id: makeAllocationId(memberId, eventId, academicYear),
    memberId,
    eventId,
    eventName,
    eventDate,
    academicYear,
    allocationMethod: "direct",
    hours: null,
    aictePoints: numericPoints,
  };
}

const MONTH_MAP: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  sept: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

/**
 * Parses human-readable or ISO dates into a normalized YYYY-MM-DD string.
 */
export function parseFlexibleDateToISO(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const dmyMatch = trimmed
    .replace(/[\u2013\u2014]/g, "-")
    .match(/^(\d{1,2})(?:\s*-\s*\d{1,2})?\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = MONTH_MAP[dmyMatch[2].toLowerCase()];
    const year = dmyMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  const myMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (myMatch) {
    const month = MONTH_MAP[myMatch[1].toLowerCase()];
    const year = myMatch[2];
    if (month) return `${year}-${month}-01`;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString().split("T")[0];
  }
  return "";
}

/**
 * Formats an ISO/raw date string into a readable format (e.g. "30 Mar 2026").
 */
export function formatEventDateDisplay(rawDate: string): string {
  const iso = parseFlexibleDateToISO(rawDate);
  if (!iso) return rawDate || "Date TBA";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return rawDate;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Determines the effective status of an event ("completed" | "upcoming" | "archived").
 * If no explicit status is stored on the event, completion is inferred from the event date.
 */
export function getEffectiveEventStatus(
  event: Pick<ClubEvent, "date" | "status" | "archived">,
  referenceDateMs: number = Date.now()
): EventStatus {
  if (event.archived || event.status === "archived") {
    return "archived";
  }
  if (event.status === "upcoming") {
    return "upcoming";
  }
  if (event.status === "completed") {
    return "completed";
  }

  const isoDate = parseFlexibleDateToISO(event.date);
  if (!isoDate) return "completed";

  const [y, m, d] = isoDate.split("-").map(Number);
  const eventEndOfDayMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
  return eventEndOfDayMs <= referenceDateMs ? "completed" : "upcoming";
}

/**
 * Returns true if the event is completed and eligible for AICTE point allocation.
 */
export function isEventSelectableForAllocation(
  event: Pick<ClubEvent, "date" | "status" | "archived">,
  referenceDateMs: number = Date.now()
): boolean {
  return getEffectiveEventStatus(event, referenceDateMs) === "completed";
}

/**
 * Sorts members alphabetically by full name (case-insensitive).
 */
export function sortMembersAlphabetically<T extends { name: string; id?: string }>(
  members: T[]
): T[] {
  return [...members].sort(
    (a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" }) ||
      (a.id || "").localeCompare(b.id || "")
  );
}

/**
 * Sorts events alphabetically by event name (case-insensitive), then by academicYear descending.
 */
export function sortEventsAlphabetically<
  T extends { name: string; academicYear?: string; id?: string }
>(events: T[]): T[] {
  return [...events].sort(
    (a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" }) ||
      normalizeAcademicYear(b.academicYear || "").localeCompare(
        normalizeAcademicYear(a.academicYear || "")
      ) ||
      (a.id || "").localeCompare(b.id || "")
  );
}

/**
 * Filters and alphabetically sorts members by search query (case-insensitive partial name, email, branch, year, or role).
 */
export function filterMembersBySearch<
  T extends {
    name: string;
    email?: string;
    branch?: string | null;
    year?: string | null;
    division?: string | null;
    role?: string;
    academicYear?: string | null;
    id?: string;
  }
>(members: T[], searchQuery: string): T[] {
  const sorted = sortMembersAlphabetically(members);
  const q = (searchQuery || "").trim().toLowerCase();
  if (!q) return sorted;

  return sorted.filter((m) => {
    if (m.name.toLowerCase().includes(q)) return true;

    const isSpecificYearQuery = q === "se" || q === "te" || q === "be";
    if (isSpecificYearQuery) {
      return (m.year || "").toLowerCase() === q;
    }

    if ((m.email || "").toLowerCase().includes(q)) return true;
    if ((m.branch || "").toLowerCase().includes(q)) return true;
    if ((m.year || "").toLowerCase().includes(q)) return true;
    if ((m.academicYear || "").toLowerCase().includes(q)) return true;

    const classPattern = `${m.year || ""}-${m.branch || ""}-${m.division || ""}`.toLowerCase();
    if (classPattern.includes(q)) return true;

    if ((m.role || "").toLowerCase().includes(q)) return true;
    return false;
  });
}

/**
 * Filters and alphabetically sorts events by search query and completion status.
 */
export function filterEventsBySearch<T extends ClubEvent>(
  events: T[],
  searchQuery: string,
  onlyCompleted = true,
  referenceDateMs: number = Date.now()
): T[] {
  const base = onlyCompleted
    ? events.filter((e) => isEventSelectableForAllocation(e, referenceDateMs))
    : events.filter((e) => getEffectiveEventStatus(e, referenceDateMs) !== "archived");

  const sorted = sortEventsAlphabetically(base);
  const q = (searchQuery || "").trim().toLowerCase();
  if (!q) return sorted;

  return sorted.filter((event) => {
    const label = `${event.name} — ${event.academicYear} ${event.date} ${formatEventDateDisplay(event.date)}`.toLowerCase();
    return label.includes(q);
  });
}

/**
 * Merges saved memberEventPoints allocations with legacy attendance records (such as Moon Gazing),
 * ensuring no legacy attendance points or member history are lost.
 */
export function mergeAllocationsWithLegacyAttendance(
  allocations: MemberEventPointAllocation[],
  attendanceRecords: AttendanceRecord[],
  events: ClubEvent[],
  hoursPerAICTEPoint = 4,
  revokedLegacyPairs: Set<string> = new Set()
): MemberEventPointAllocation[] {
  const eventsById = new Map<string, ClubEvent>();
  for (const evt of events) {
    eventsById.set(evt.id, evt);
  }

  const mergedById = new Map<string, MemberEventPointAllocation>();
  const coveredMemberEventPairs = new Set<string>(revokedLegacyPairs);

  for (const alloc of allocations) {
    const linkedEvent = eventsById.get(alloc.eventId);
    const normalizedYear = normalizeAcademicYear(
      alloc.academicYear || linkedEvent?.academicYear || "2026-27"
    );
    const id = makeAllocationId(alloc.memberId, alloc.eventId, normalizedYear);
    mergedById.set(id, {
      ...alloc,
      id,
      academicYear: normalizedYear,
      eventName: linkedEvent?.name || alloc.eventName || "Moon Gazing",
      eventDate: linkedEvent?.date || alloc.eventDate || "",
    });
    coveredMemberEventPairs.add(`${alloc.memberId}__${alloc.eventId}`);
  }

  const safeFactor =
    Number.isFinite(hoursPerAICTEPoint) && hoursPerAICTEPoint > 0
      ? hoursPerAICTEPoint
      : 4;

  for (const rec of attendanceRecords) {
    if (!rec.attended) continue;
    const pairKey = `${rec.memberId}__${rec.eventId}`;
    if (coveredMemberEventPairs.has(pairKey)) continue;

    const evt = eventsById.get(rec.eventId);
    const academicYear = normalizeAcademicYear(evt?.academicYear || "2026-27");
    const id = makeAllocationId(rec.memberId, rec.eventId, academicYear);
    if (mergedById.has(id)) continue;

    const hours = Number(evt?.aicteHours) > 0 ? Number(evt?.aicteHours) : 4;
    const legacyPoints = Math.round((hours / safeFactor) * 100) / 100;

    mergedById.set(id, {
      id,
      memberId: rec.memberId,
      eventId: rec.eventId,
      eventName: evt?.name || "Moon Gazing",
      eventDate: evt?.date || "",
      academicYear,
      allocationMethod: "hours",
      hours,
      aictePoints: legacyPoints,
      createdAt: evt?.date || new Date(0).toISOString(),
      updatedAt: evt?.date || new Date(0).toISOString(),
      createdBy: "legacy_attendance",
      isLegacyMigrated: true,
    });
    coveredMemberEventPairs.add(pairKey);
  }

  return Array.from(mergedById.values());
}

/**
 * Calculates a member's total AICTE points, total hours, and sorted event-wise history
 * across all events and academic years from allocation records.
 */
export function calculateMemberAllocationSummary(
  memberId: string,
  allocations: MemberEventPointAllocation[]
): {
  totalPoints: number;
  formattedPoints: string;
  totalHours: number;
  formattedHours: string;
  count: number;
  history: MemberEventPointAllocation[];
} {
  const history = allocations
    .filter((a) => a.memberId === memberId)
    .sort((a, b) => {
      const yearCmp = normalizeAcademicYear(b.academicYear).localeCompare(
        normalizeAcademicYear(a.academicYear)
      );
      if (yearCmp !== 0) return yearCmp;
      const dateA = parseFlexibleDateToISO(a.eventDate) || a.updatedAt || "";
      const dateB = parseFlexibleDateToISO(b.eventDate) || b.updatedAt || "";
      const dateCmp = dateB.localeCompare(dateA);
      if (dateCmp !== 0) return dateCmp;
      return a.eventName.localeCompare(b.eventName, undefined, { sensitivity: "base" });
    });

  let totalPoints = 0;
  let totalHours = 0;

  for (const item of history) {
    const pts = Number(item.aictePoints) || 0;
    if (pts > 0) totalPoints += pts;
    if (item.hours !== null && item.hours !== undefined && Number(item.hours) > 0) {
      totalHours += Number(item.hours);
    }
  }

  totalPoints = Math.round(totalPoints * 100) / 100;
  totalHours = Math.round(totalHours * 100) / 100;

  return {
    totalPoints,
    formattedPoints: formatCleanNumber(totalPoints),
    totalHours,
    formattedHours: formatCleanNumber(totalHours),
    count: history.length,
    history,
  };
}
