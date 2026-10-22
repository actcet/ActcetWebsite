import type { ClubEvent, AttendanceRecord, AICTESummary } from "@/types";

/**
 * Calculates total attended hours and resulting AICTE points for a member.
 * Conversion factor is supplied from settings/club (normally 4 hours per point).
 *
 * @param memberId - Member unique identifier
 * @param events - List of events for the academic year or overall
 * @param attendanceRecords - List of attendance records
 * @returns AICTESummary with totalHours, points, and formatted clean string
 */
export function calculateAICTEPoints(
  memberId: string,
  events: ClubEvent[],
  attendanceRecords: AttendanceRecord[],
  hoursPerAICTEPoint: number
): AICTESummary {
  // Build a fast lookup set of attended event IDs for this member
  const attendedEventIds = new Set(
    attendanceRecords
      .filter((rec) => rec.memberId === memberId && rec.attended)
      .map((rec) => rec.eventId)
  );

  // Sum hours only for events marked as attended
  let totalHours = 0;
  for (const event of events) {
    if (attendedEventIds.has(event.id)) {
      const hours = Number(event.aicteHours) || 0;
      if (hours > 0) {
        totalHours += hours;
      }
    }
  }

  // Use the current server-provided conversion factor in both portals.
  if (!Number.isFinite(hoursPerAICTEPoint) || hoursPerAICTEPoint <= 0) throw new Error("Invalid AICTE conversion factor in club settings.");
  const points = totalHours / hoursPerAICTEPoint;

  // Format cleanly without trailing zeros (e.g., "1.5", "2", "0.75", "0")
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
  // Round to max 2 decimal places to avoid floating point precision artifacts (like 1.500000000002)
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString();
}
