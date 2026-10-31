import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { yearEvents } from "@/data/events";
import { safeExternalHref, safeImageSrc } from "@/lib/utils";
import {
  getEffectiveEventStatus,
  isEventSelectableForAllocation,
  isValidAcademicYear,
  normalizeAcademicYear,
  parseFlexibleDateToISO,
  sortEventsAlphabetically,
  validateAndComputeAllocation,
} from "@/lib/aicte";
import type {
  AICTEAllocationInput,
  AllocationMethod,
  ClubEvent,
  EventStatus,
  LoginInput,
  Member,
  MemberEventPointAllocation,
  RegistrationInput,
  ShowcaseEvent,
  UpcomingEvent,
  UpdateEventInput,
  UserRole,
  YearEvents,
} from "@/types";

export const ROLES: UserRole[] = [
  "Mentor",
  "Chairperson",
  "Vice Chairperson",
  "Creative Head",
  "Documentation Head",
  "Event Management Head",
  "Technical Head",
  "Working Committee - Technical",
  "Working Committee - Creative",
  "Working Committee - Event",
  "Working Committee - Documentation",
  "Member",
  "Guest",
];

export const BRANCHES = [
  "Comp",
  "AIML",
  "AIDS",
  "IOT",
  "Mech",
  "ECS",
  "Civil",
  "CSE(CS)",
  "CSE(IoT)",
  "EXTC",
  "IT",
];

export interface ClubSettings {
  currentAcademicYear: string;
  hoursPerAICTEPoint: number;
}

export const AICTE_LEDGER_PREFIX = "__actcet_aicte_ledger_v2__";
const LEGACY_LEDGER_PREFIX = "__actcet_aicte_ledger__";
export const SHOWCASE_EVENT_PREFIX = "__actcet_showcase_v1__";
export const UPCOMING_EVENT_PREFIX = "__actcet_upcoming_v1__";
const EVENT_META_REGEX = /\n?<!--actcet_meta:(\{.*?\})-->$/s;

export interface LedgerShardDoc {
  docId: string;
  shardIndex: number;
  academicYear: string;
  records: MemberEventPointAllocation[];
  revokedLegacyPairs: string[];
}

export interface ChunkedStoreDoc {
  docId: string;
  itemId: string;
  chunkIndex: number;
  totalChunks: number;
  payloadChunk: string;
}

export function isCollectionMetadata(id: string, data: DocumentData): boolean {
  return id === "_metadata" || data.type === "collection_metadata";
}

export function isAnyLedgerDocument(id: string, data: DocumentData): boolean {
  if (isCollectionMetadata(id, data)) return false;
  if (typeof data.name !== "string") return false;
  return (
    data.name.startsWith(AICTE_LEDGER_PREFIX) ||
    data.name.startsWith(LEGACY_LEDGER_PREFIX) ||
    data.name.startsWith(SHOWCASE_EVENT_PREFIX) ||
    data.name.startsWith(UPCOMING_EVENT_PREFIX)
  );
}

export function isActiveLedgerDocument(id: string, data: DocumentData): boolean {
  if (isCollectionMetadata(id, data)) return false;
  return typeof data.name === "string" && data.name.startsWith(AICTE_LEDGER_PREFIX);
}

export function parseChunkedStoreDocument(
  docId: string,
  data: DocumentData,
  prefix: string
): ChunkedStoreDoc | null {
  if (isCollectionMetadata(idOrEmpty(docId), data)) return null;
  if (typeof data.name !== "string" || !data.name.startsWith(prefix)) return null;
  const rest = data.name.slice(prefix.length);
  const lastSep = rest.lastIndexOf("__");
  if (lastSep <= 0) return null;
  const itemId = rest.slice(0, lastSep);
  const chunkIndex = Number(rest.slice(lastSep + 2));
  if (!itemId || !Number.isFinite(chunkIndex) || chunkIndex < 0) return null;
  const totalChunks =
    typeof data.aicteHours === "number" && data.aicteHours >= 1
      ? Math.round(data.aicteHours)
      : 1;
  return {
    docId,
    itemId,
    chunkIndex,
    totalChunks,
    payloadChunk: typeof data.description === "string" ? data.description : "",
  };
}

function idOrEmpty(id: string): string {
  return id || "";
}

export function reconstructChunkedItems<T extends { id: string; deleted?: boolean }>(
  chunks: ChunkedStoreDoc[],
  includeDeleted = false
): T[] {
  const byItem = new Map<string, ChunkedStoreDoc[]>();
  for (const c of chunks) {
    const list = byItem.get(c.itemId) || [];
    list.push(c);
    byItem.set(c.itemId, list);
  }

  const results: T[] = [];
  for (const [, group] of byItem.entries()) {
    group.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const totalNeeded = group[0]?.totalChunks || 1;
    const activeChunks = group.filter(
      (c) => c.chunkIndex < totalNeeded && c.payloadChunk.length > 0
    );
    if (activeChunks.length === 0) continue;
    const jsonStr = activeChunks.map((c) => c.payloadChunk).join("");
    try {
      const parsed = JSON.parse(jsonStr) as T;
      if (parsed && typeof parsed.id === "string" && (includeDeleted || !parsed.deleted)) {
        results.push(parsed);
      }
    } catch {
      // Ignore incomplete or malformed chunk group
    }
  }
  return results;
}

async function saveChunkedItemToFirestore<T extends { id: string }>(
  prefix: string,
  item: T,
  existingChunks: ChunkedStoreDoc[],
  defaultAcademicYear = "2026-27"
): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in as an administrator first.");
  const uid = auth.currentUser.uid;
  const sessionYear = isValidAcademicYear(defaultAcademicYear)
    ? normalizeAcademicYear(defaultAcademicYear)
    : "2026-27";

  const cleanItemId = item.id.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
  const fullJson = JSON.stringify(item);
  const chunkSize = 3600;
  const chunkStrings: string[] = [];
  for (let offset = 0; offset < fullJson.length; offset += chunkSize) {
    chunkStrings.push(fullJson.slice(offset, offset + chunkSize));
  }
  if (chunkStrings.length === 0) {
    chunkStrings.push("{}");
  }

  const totalChunks = chunkStrings.length;
  const itemExisting = existingChunks
    .filter((c) => c.itemId === cleanItemId)
    .sort((a, b) => a.chunkIndex - b.chunkIndex);

  const maxIndex = Math.max(totalChunks, itemExisting.length);
  const nowTimestamp = Timestamp.fromDate(new Date());

  const operations: Promise<unknown>[] = [];
  for (let i = 0; i < maxIndex; i++) {
    const chunkName = `${prefix}${cleanItemId}__${i}`;
    const chunkText = i < totalChunks ? chunkStrings[i] : "";
    const existingDoc = itemExisting.find((c) => c.chunkIndex === i);

    if (existingDoc) {
      operations.push(
        updateDoc(doc(db, "events", existingDoc.docId), {
          name: chunkName,
          date: nowTimestamp,
          aicteHours: totalChunks,
          description: chunkText,
        })
      );
    } else if (i < totalChunks) {
      operations.push(
        addDoc(collection(db, "events"), {
          name: chunkName,
          academicYear: sessionYear,
          date: nowTimestamp,
          aicteHours: totalChunks,
          description: chunkText,
          createdAt: serverTimestamp(),
          createdBy: uid,
        })
      );
    }
  }

  await Promise.all(operations);
}

export async function saveShowcaseEventToFirestore(
  event: ShowcaseEvent,
  existingChunks: ChunkedStoreDoc[],
  defaultAcademicYear = "2026-27"
): Promise<ShowcaseEvent> {
  const cleanId = (event.id || `showcase-${Date.now()}`)
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .slice(0, 80);
  const cleanYear = normalizeAcademicYear(event.academicYear || defaultAcademicYear);
  if (!event.name.trim()) {
    throw new Error("Event name is required.");
  }
  if (!isValidAcademicYear(cleanYear)) {
    throw new Error("Please select or enter a valid Academic Year (e.g. 2025-26).");
  }

  const normalized: ShowcaseEvent = {
    ...event,
    id: cleanId,
    academicYear: cleanYear,
    name: event.name.trim(),
    date: event.date.trim() || "TBA",
    location: event.location.trim() || "TCET Campus",
    domain: event.domain.trim() || "Astronomy",
    category: event.category.trim() || "Event",
    participants: event.participants.trim() || "50+",
    objective: event.objective.trim() || "",
    outcome: event.outcome.trim() || "",
    description: event.description?.trim() || "",
    image: safeImageSrc(event.image),
    gallery: Array.isArray(event.gallery)
      ? event.gallery.map((g) => safeImageSrc(g)).filter(Boolean)
      : [],
    updatedAt: new Date().toISOString(),
    deleted: Boolean(event.deleted),
  };

  await saveChunkedItemToFirestore(
    SHOWCASE_EVENT_PREFIX,
    normalized,
    existingChunks,
    defaultAcademicYear
  );
  return normalized;
}

export async function deleteShowcaseEventFromFirestore(
  eventId: string,
  existingChunks: ChunkedStoreDoc[],
  defaultAcademicYear = "2026-27"
): Promise<void> {
  const cleanId = eventId.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
  await saveChunkedItemToFirestore(
    SHOWCASE_EVENT_PREFIX,
    { id: cleanId, deleted: true },
    existingChunks,
    defaultAcademicYear
  );
}

export async function saveUpcomingEventToFirestore(
  event: UpcomingEvent,
  existingChunks: ChunkedStoreDoc[],
  defaultAcademicYear = "2026-27"
): Promise<UpcomingEvent> {
  const cleanId = (event.id || `upcoming-${Date.now()}`)
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .slice(0, 80);
  const cleanYear = normalizeAcademicYear(event.academicYear || defaultAcademicYear);
  if (!event.title.trim()) {
    throw new Error("Upcoming event title is required.");
  }
  if (!isValidAcademicYear(cleanYear)) {
    throw new Error("Please select a valid Academic Year (e.g. 2026-27).");
  }

  const normalized: UpcomingEvent = {
    ...event,
    id: cleanId,
    title: event.title.trim(),
    academicYear: cleanYear,
    date: event.date.trim() || "Upcoming",
    time: event.time.trim() || "TBA",
    location: event.location.trim() || "TCET Campus",
    category: event.category.trim() || "Upcoming Mission",
    domain: event.domain.trim() || "Astronomy & Space",
    description: event.description.trim() || "",
    coverImage: safeImageSrc(event.coverImage),
    registrationLink: safeExternalHref(event.registrationLink) || "",
    registrationDeadline: event.registrationDeadline?.trim() || "",
    aicteHours:
      event.aicteHours !== undefined && Number(event.aicteHours) > 0
        ? Number(event.aicteHours)
        : undefined,
    updatedAt: new Date().toISOString(),
    deleted: Boolean(event.deleted),
  };

  await saveChunkedItemToFirestore(
    UPCOMING_EVENT_PREFIX,
    normalized,
    existingChunks,
    defaultAcademicYear
  );
  return normalized;
}

export async function deleteUpcomingEventFromFirestore(
  eventId: string,
  existingChunks: ChunkedStoreDoc[],
  defaultAcademicYear = "2026-27"
): Promise<void> {
  const cleanId = eventId.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
  await saveChunkedItemToFirestore(
    UPCOMING_EVENT_PREFIX,
    { id: cleanId, deleted: true },
    existingChunks,
    defaultAcademicYear
  );
}

/**
 * Merges static `yearEvents` (`src/data/events.ts`) with admin-added and admin-edited
 * `ShowcaseEvent` records from Firestore, grouped by Academic Year (newest year first).
 */
export function buildMergedYearEvents(
  allShowcaseRecords: (ShowcaseEvent & { deleted?: boolean })[]
): YearEvents[] {
  const deletedIds = new Set<string>();
  const overrideMap = new Map<string, ShowcaseEvent>();

  for (const rec of allShowcaseRecords) {
    if (!rec || typeof rec.id !== "string") continue;
    if (rec.deleted) {
      deletedIds.add(rec.id);
    } else {
      overrideMap.set(rec.id, rec);
    }
  }

  const consumedIds = new Set<string>();
  const yearGroupsMap = new Map<string, YearEvents>();

  // 1. Seed with static year groups
  for (const yg of yearEvents) {
    const normYear = normalizeAcademicYear(yg.year);
    const displayYear = normYear.replace("-", "–");
    const eventsForGroup = [];

    for (const staticEvt of yg.events) {
      if (deletedIds.has(staticEvt.id)) {
        consumedIds.add(staticEvt.id);
        continue;
      }
      const override = overrideMap.get(staticEvt.id);
      if (override) {
        const targetYear = normalizeAcademicYear(override.academicYear || normYear);
        if (targetYear === normYear) {
          consumedIds.add(staticEvt.id);
          eventsForGroup.push({
            id: override.id,
            name: override.name,
            date: override.date,
            location: override.location,
            domain: override.domain,
            category: override.category,
            participants: override.participants,
            objective: override.objective,
            outcome: override.outcome,
            description: override.description,
            academicYear: normYear,
            image: override.image || staticEvt.image,
            gallery:
              override.gallery && override.gallery.length > 0
                ? override.gallery
                : staticEvt.gallery,
          });
        }
        // If override moved this event to a different academic year, it will be added in step 2
      } else {
        eventsForGroup.push({
          ...staticEvt,
          academicYear: normYear,
        });
      }
    }

    yearGroupsMap.set(normYear, {
      id: yg.id || `year-${normYear}`,
      year: displayYear,
      current: yg.current,
      progression: [...yg.progression],
      events: eventsForGroup,
    });
  }

  // 2. Add new or year-moved showcase events into their target academicYear group
  for (const [id, item] of overrideMap.entries()) {
    if (consumedIds.has(id) || deletedIds.has(id)) continue;
    const normYear = normalizeAcademicYear(item.academicYear || "2026-27");
    const displayYear = normYear.replace("-", "–");

    let group = yearGroupsMap.get(normYear);
    if (!group) {
      group = {
        id: `year-${normYear}`,
        year: displayYear,
        current: normYear === "2026-27",
        progression: ["Workshops", "Outreach", "Stargazing"],
        events: [],
      };
      yearGroupsMap.set(normYear, group);
    }

    // Put newly added events at the top of that academic year's list or in order
    group.events.push({
      id: item.id,
      name: item.name,
      date: item.date,
      location: item.location,
      domain: item.domain,
      category: item.category,
      participants: item.participants,
      objective: item.objective,
      outcome: item.outcome,
      description: item.description,
      academicYear: normYear,
      image: item.image,
      gallery: item.gallery || [],
    });
  }

  // Sort academic years descending (e.g. 2026-27, 2025-26, 2024-25, 2023-24)
  return Array.from(yearGroupsMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, group]) => group);
}

/**
 * Encodes event status, archived flag, and catalogId inside the event's description string
 * so event documents remain 100% compatible with strict 7-field deployed Firestore rules.
 */
export function encodeEventDescription(
  description: string,
  meta?: {
    status?: EventStatus;
    archived?: boolean;
    deleted?: boolean;
    catalogId?: string;
  }
): string {
  const cleanDesc = (description || "").replace(EVENT_META_REGEX, "").trim();
  if (!meta || (!meta.status && !meta.archived && !meta.deleted && !meta.catalogId)) {
    return cleanDesc.slice(0, 3900);
  }
  const metaJson = JSON.stringify({
    s: meta.status,
    a: Boolean(meta.archived),
    ...(meta.deleted ? { d: true } : {}),
    ...(meta.catalogId ? { c: meta.catalogId } : {}),
  });
  const suffix = `\n<!--actcet_meta:${metaJson}-->`;
  const maxDescLen = Math.max(0, 4000 - suffix.length);
  return `${cleanDesc.slice(0, maxDescLen)}${suffix}`;
}

export function decodeEventDescription(rawDescription: unknown): {
  description: string;
  status?: EventStatus;
  archived?: boolean;
  deleted?: boolean;
  catalogId?: string;
} {
  if (typeof rawDescription !== "string") {
    return { description: "" };
  }
  const match = rawDescription.match(EVENT_META_REGEX);
  if (!match) {
    return { description: rawDescription };
  }
  const cleanDescription = rawDescription.replace(EVENT_META_REGEX, "").trim();
  try {
    const parsed = JSON.parse(match[1]) as {
      s?: EventStatus;
      a?: boolean;
      d?: boolean;
      c?: string;
    };
    return {
      description: cleanDescription,
      status:
        parsed.s === "completed" || parsed.s === "upcoming" || parsed.s === "archived"
          ? parsed.s
          : undefined,
      archived: Boolean(parsed.a),
      deleted: Boolean(parsed.d),
      catalogId: typeof parsed.c === "string" ? parsed.c : undefined,
    };
  } catch {
    return { description: cleanDescription };
  }
}

export function parseLedgerDocument(
  docId: string,
  data: DocumentData
): LedgerShardDoc | null {
  if (!isActiveLedgerDocument(docId, data)) return null;
  const suffix = String(data.name).slice(AICTE_LEDGER_PREFIX.length);
  const shardIndex = Number.isFinite(Number(suffix)) ? Number(suffix) : 0;
  try {
    const parsed = JSON.parse(String(data.description || "{}")) as {
      records?: MemberEventPointAllocation[];
      revokedLegacyPairs?: string[];
    };
    const records = Array.isArray(parsed.records)
      ? parsed.records.filter(
          (r) =>
            r &&
            typeof r.id === "string" &&
            typeof r.memberId === "string" &&
            typeof r.eventId === "string" &&
            typeof r.academicYear === "string"
        )
      : [];
    const revokedLegacyPairs = Array.isArray(parsed.revokedLegacyPairs)
      ? parsed.revokedLegacyPairs.filter((p) => typeof p === "string")
      : [];
    return {
      docId,
      shardIndex,
      academicYear: String(data.academicYear || "2026-27"),
      records,
      revokedLegacyPairs,
    };
  } catch {
    return {
      docId,
      shardIndex,
      academicYear: String(data.academicYear || "2026-27"),
      records: [],
      revokedLegacyPairs: [],
    };
  }
}

const iso = (value: unknown) =>
  value instanceof Timestamp
    ? value.toDate().toISOString()
    : typeof value === "string"
    ? value
    : "";

/**
 * Builds normalized ClubEvent records from the website's static Events section (`src/data/events.ts`),
 * plus "Moon Gazing" so all completed club events are available for AICTE allocation.
 */
export function getCatalogClubEvents(): ClubEvent[] {
  const catalog: ClubEvent[] = [
    {
      id: "cat_moon-gazing-2026-27",
      catalogId: "cat_moon-gazing-2026-27",
      name: "Moon Gazing",
      academicYear: "2026-27",
      date: "2026-08-15",
      aicteHours: 4,
      description: "Guided lunar and planetary observation session.",
      status: "completed",
      archived: false,
      isCatalogEvent: true,
    },
  ];

  const usedIds = new Set<string>(catalog.map((e) => e.id));

  for (const yearGroup of yearEvents) {
    const academicYear = normalizeAcademicYear(yearGroup.year);
    if (!isValidAcademicYear(academicYear)) continue;

    for (const item of yearGroup.events) {
      const baseSlug = `cat_${item.id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
      let uniqueId = baseSlug;
      let counter = 2;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseSlug}-${counter}`;
        counter += 1;
      }
      usedIds.add(uniqueId);

      const parsedDate = parseFlexibleDateToISO(item.date) || "2025-08-01";
      catalog.push({
        id: uniqueId,
        catalogId: uniqueId,
        name: item.name.trim(),
        academicYear,
        date: parsedDate,
        aicteHours: 4,
        description: item.objective || item.outcome || "",
        status: "completed",
        archived: false,
        isCatalogEvent: true,
      });
    }
  }

  return sortEventsAlphabetically(catalog);
}

/**
 * Merges Firestore `events` documents with the static catalog events from `src/data/events.ts`.
 * Firestore events take precedence over catalog events if they match by `catalogId` or `(name, academicYear)`.
 */
export function mergePortalAndCatalogEvents(firestoreEvents: ClubEvent[]): ClubEvent[] {
  const catalogEvents = getCatalogClubEvents();
  const overriddenCatalogIds = new Set<string>();
  const overriddenNameYearKeys = new Set<string>();

  for (const fsEvt of firestoreEvents) {
    if (fsEvt.catalogId) {
      overriddenCatalogIds.add(fsEvt.catalogId);
    }
    const key = `${fsEvt.name.trim().toLowerCase()}__${normalizeAcademicYear(fsEvt.academicYear)}`;
    overriddenNameYearKeys.add(key);
  }

  const merged: ClubEvent[] = firestoreEvents.filter((evt) => !evt.deleted);
  for (const catEvt of catalogEvents) {
    const key = `${catEvt.name.trim().toLowerCase()}__${normalizeAcademicYear(catEvt.academicYear)}`;
    if (overriddenCatalogIds.has(catEvt.id) || overriddenNameYearKeys.has(key)) {
      continue;
    }
    merged.push(catEvt);
  }

  return sortEventsAlphabetically(merged);
}

export function memberFromDocument(id: string, data: DocumentData): Member {
  const accountType = data.accountType ?? "member";
  const studentProfileValid =
    BRANCHES.includes(data.branch) &&
    ["A", "B", "C", "D"].includes(data.division) &&
    ["SE", "TE", "BE"].includes(data.year) &&
    typeof data.academicYear === "string";
  const adminProfileValid =
    accountType === "club_admin" &&
    ["Chairperson", "Mentor"].includes(data.role) &&
    data.approvalStatus === "approved" &&
    data.branch === null &&
    data.division === null &&
    data.year === null &&
    data.academicYear === null;
  if (
    typeof data.name !== "string" ||
    !ROLES.includes(data.role) ||
    !ROLES.includes(data.requestedRole) ||
    !["pending", "approved", "rejected"].includes(data.approvalStatus) ||
    (accountType !== "club_admin" && accountType !== "member") ||
    (accountType === "club_admin" ? !adminProfileValid : !studentProfileValid)
  ) {
    throw new Error("A member profile has an invalid format. Contact the club administrator.");
  }
  return {
    ...data,
    accountType,
    id,
    createdAt: iso(data.createdAt),
    approvedAt: data.approvedAt ? iso(data.approvedAt) : null,
  } as Member;
}

export function eventFromDocument(id: string, data: DocumentData): ClubEvent {
  if (
    typeof data.name !== "string" ||
    !(data.date instanceof Timestamp) ||
    typeof data.academicYear !== "string" ||
    !Number.isFinite(data.aicteHours) ||
    data.aicteHours <= 0
  ) {
    throw new Error("An event has an invalid format. Contact the club administrator.");
  }
  const dateStr = iso(data.date);
  const decoded = decodeEventDescription(data.description);
  const deleted = Boolean(data.deleted) || Boolean(decoded.deleted);
  const rawStatus = (data.status as EventStatus | undefined) ?? decoded.status;
  const archived =
    deleted ||
    Boolean(data.archived) ||
    Boolean(decoded.archived) ||
    rawStatus === "archived";
  const status: EventStatus = archived
    ? "archived"
    : rawStatus === "upcoming" || rawStatus === "completed"
    ? rawStatus
    : getEffectiveEventStatus({ date: dateStr });
  const catalogId =
    typeof data.catalogId === "string" ? data.catalogId : decoded.catalogId;

  return {
    ...data,
    id,
    academicYear: normalizeAcademicYear(data.academicYear),
    date: dateStr,
    description: decoded.description,
    status,
    archived,
    deleted,
    catalogId,
    isCatalogEvent: false,
  } as ClubEvent;
}

export function allocationFromDocument(
  id: string,
  data: DocumentData
): MemberEventPointAllocation {
  const allocationMethod: AllocationMethod =
    data.allocationMethod === "direct" ? "direct" : "hours";
  const hours =
    allocationMethod === "hours" && Number.isFinite(Number(data.hours))
      ? Number(data.hours)
      : null;
  const aictePoints = Number.isFinite(Number(data.aictePoints))
    ? Number(data.aictePoints)
    : 0;

  return {
    id,
    memberId: String(data.memberId || ""),
    eventId: String(data.eventId || ""),
    eventName: String(data.eventName || ""),
    eventDate: String(data.eventDate || ""),
    academicYear: normalizeAcademicYear(String(data.academicYear || "")),
    allocationMethod,
    hours,
    aictePoints,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
    createdBy: String(data.createdBy || ""),
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
  };
}

export function settingsFromDocument(data: DocumentData | undefined): ClubSettings {
  if (
    !data ||
    !/^\d{4}-\d{2}$/.test(data.currentAcademicYear) ||
    !Number.isFinite(data.hoursPerAICTEPoint) ||
    data.hoursPerAICTEPoint <= 0
  ) {
    throw new Error("Club settings are missing or invalid. Contact the project owner.");
  }
  return {
    currentAcademicYear: data.currentAcademicYear,
    hoursPerAICTEPoint: data.hoursPerAICTEPoint,
  };
}

export function portalError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "This email already has an account. Sign in to continue.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/user-disabled": "This account has been disabled. Contact the project owner.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/network-request-failed": "Unable to reach Firebase. Check your connection and retry.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled. Contact the project owner.",
    "auth/too-many-requests": "Too many attempts. Please wait before trying again.",
    "permission-denied": "You do not have permission for this action. Your approval or role may have changed.",
    unavailable: "Firebase is temporarily unavailable. Check your connection and retry.",
  };
  return (
    (code && messages[code]) ||
    (error instanceof Error ? error.message : "Unable to complete the request. Please retry.")
  );
}

export async function registerAccount(input: RegistrationInput): Promise<Member> {
  const name = input.name.trim(),
    email = input.email.trim().toLowerCase();
  if (
    !name ||
    name.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !BRANCHES.includes(input.branch) ||
    !["A", "B", "C", "D"].includes(input.division) ||
    !["SE", "TE", "BE"].includes(input.year) ||
    !ROLES.includes(input.role) ||
    !input.password ||
    input.password.length < 8
  ) {
    throw new Error("Check all registration fields and use a password of at least 8 characters.");
  }
  const settings = settingsFromDocument(
    (await getDocFromServer(doc(db, "settings", "club"))).data()
  );
  const academicYear = settings.currentAcademicYear;
  if (!/^\d{4}-\d{2}$/.test(academicYear)) {
    throw new Error("Select a valid academic session.");
  }
  const existing = auth.currentUser;
  if (existing && existing.email?.toLowerCase() !== email) {
    throw new Error("Sign out before registering a different email.");
  }
  const user =
    existing || (await createUserWithEmailAndPassword(auth, email, input.password)).user;
  try {
    await runTransaction(db, async (transaction) => {
      const ref = doc(db, "users", user.uid);
      if ((await transaction.get(ref)).exists()) {
        throw new Error("Your profile already exists. Sign in instead.");
      }
      transaction.set(ref, {
        name,
        email,
        accountType: "member",
        branch: input.branch,
        division: input.division,
        year: input.year,
        academicYear,
        requestedRole: input.role,
        role: "Member",
        approvalStatus: "pending",
        createdAt: serverTimestamp(),
        approvedAt: null,
        approvedBy: null,
      });
    });
    const profile = await runTransaction(db, (transaction) =>
      transaction.get(doc(db, "users", user.uid))
    );
    if (!profile.exists()) {
      throw new Error(
        "The profile write could not be confirmed. Sign in again to check its status."
      );
    }
    return memberFromDocument(user.uid, profile.data());
  } catch (error) {
    throw new Error(
      `${portalError(error)} Your sign-in account is preserved. Sign in again to check or complete your profile; do not create another account.`
    );
  }
}

export async function loginAccount(input: LoginInput): Promise<Member | null> {
  if (!input.name.trim() || !input.email.trim() || !input.password) {
    throw new Error("Enter your name, email and password.");
  }
  const { user } = await signInWithEmailAndPassword(
    auth,
    input.email.trim().toLowerCase(),
    input.password
  );
  const snapshot = await getDocFromServer(doc(db, "users", user.uid));
  if (!snapshot.exists()) return null;
  const member = memberFromDocument(user.uid, snapshot.data());
  if (member.name.trim().toLowerCase() !== input.name.trim().toLowerCase()) {
    await signOut(auth);
    throw new Error("The name does not match this account's member profile.");
  }
  return member;
}

export async function approveMember(id: string, role: UserRole) {
  if (!auth.currentUser || !ROLES.includes(role)) {
    throw new Error("Choose a verified role before approving.");
  }
  await updateDoc(doc(db, "users", id), {
    approvalStatus: "approved",
    role,
    approvedAt: serverTimestamp(),
    approvedBy: auth.currentUser.uid,
  });
}

export async function rejectMember(id: string, reason?: string) {
  if (!auth.currentUser) throw new Error("Sign in first.");
  await updateDoc(doc(db, "users", id), {
    approvalStatus: "rejected",
    role: "Member",
    approvedAt: null,
    approvedBy: auth.currentUser.uid,
    rejectionReason: reason?.trim() || "Administrative review",
  });
}

export async function createEvent(
  input: Omit<ClubEvent, "id">,
  existingEvents: ClubEvent[] = []
): Promise<ClubEvent> {
  if (!auth.currentUser) throw new Error("Sign in first.");
  const cleanName = input.name.trim();
  const cleanYear = normalizeAcademicYear(input.academicYear);
  const aicteHours =
    input.aicteHours !== undefined && input.aicteHours !== null && Number(input.aicteHours) > 0
      ? Number(input.aicteHours)
      : 4;
  const parsedDateMs = Date.parse(input.date);

  if (
    !cleanName ||
    cleanName.length > 160 ||
    !isValidAcademicYear(cleanYear) ||
    !Number.isFinite(aicteHours) ||
    aicteHours <= 0 ||
    aicteHours > 10000 ||
    (input.description?.trim().length || 0) > 3800 ||
    !Number.isFinite(parsedDateMs)
  ) {
    throw new Error(
      "Enter a valid event name, academic session (YYYY-YY), valid date, and positive hours."
    );
  }

  const isDuplicate = existingEvents.some(
    (evt) =>
      !evt.archived &&
      evt.status !== "archived" &&
      evt.name.trim().toLowerCase() === cleanName.toLowerCase() &&
      normalizeAcademicYear(evt.academicYear) === cleanYear
  );
  if (isDuplicate) {
    throw new Error(
      `An event named "${cleanName}" already exists for academic year ${cleanYear}.`
    );
  }

  const effectiveStatus: EventStatus =
    input.status === "upcoming" || input.status === "completed" || input.status === "archived"
      ? input.status
      : getEffectiveEventStatus({ date: input.date });

  const encodedDescription = encodeEventDescription(input.description?.trim() || "", {
    status: effectiveStatus,
    archived: effectiveStatus === "archived",
    catalogId: input.catalogId,
  });

  const ref = await addDoc(collection(db, "events"), {
    name: cleanName,
    academicYear: cleanYear,
    date: Timestamp.fromDate(new Date(parsedDateMs)),
    aicteHours,
    description: encodedDescription,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid,
  });

  return {
    ...input,
    id: ref.id,
    name: cleanName,
    academicYear: cleanYear,
    aicteHours,
    description: input.description?.trim() || "",
    status: effectiveStatus,
    archived: effectiveStatus === "archived",
  };
}

export async function updateClubEvent(
  event: ClubEvent,
  changes: UpdateEventInput,
  allEvents: ClubEvent[] = []
): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in first.");
  const nextName = (changes.name ?? event.name).trim();
  const nextYear = normalizeAcademicYear(changes.academicYear ?? event.academicYear);
  const nextDateStr = changes.date ?? event.date;
  const parsedDateMs = Date.parse(nextDateStr);
  const nextHours =
    changes.aicteHours !== undefined ? Number(changes.aicteHours) : Number(event.aicteHours) || 4;
  const nextDescription =
    changes.description !== undefined ? changes.description.trim() : event.description?.trim() || "";
  const nextDeleted =
    changes.deleted !== undefined ? Boolean(changes.deleted) : Boolean(event.deleted);
  const nextArchived =
    nextDeleted ||
    (changes.archived !== undefined
      ? changes.archived
      : changes.status === "archived"
      ? true
      : Boolean(event.archived));
  const nextStatus: EventStatus = nextArchived
    ? "archived"
    : changes.status ?? event.status ?? getEffectiveEventStatus({ date: nextDateStr });

  if (
    !nextName ||
    nextName.length > 160 ||
    !isValidAcademicYear(nextYear) ||
    !Number.isFinite(parsedDateMs) ||
    !Number.isFinite(nextHours) ||
    nextHours <= 0 ||
    nextHours > 10000 ||
    nextDescription.length > 3800
  ) {
    throw new Error("Check all event fields before saving changes.");
  }

  if (!nextDeleted) {
    const isDuplicate = allEvents.some(
      (other) =>
        other.id !== event.id &&
        (!event.catalogId || other.id !== event.catalogId) &&
        !other.archived &&
        !other.deleted &&
        other.status !== "archived" &&
        other.name.trim().toLowerCase() === nextName.toLowerCase() &&
        normalizeAcademicYear(other.academicYear) === nextYear
    );
    if (isDuplicate) {
      throw new Error(
        `Another event named "${nextName}" already exists in academic year ${nextYear}.`
      );
    }
  }

  const encodedDescription = encodeEventDescription(nextDescription, {
    status: nextStatus,
    archived: nextArchived,
    deleted: nextDeleted,
    catalogId: event.catalogId || (event.isCatalogEvent ? event.id : undefined),
  });

  if (event.isCatalogEvent) {
    await addDoc(collection(db, "events"), {
      name: nextName,
      academicYear: nextYear,
      date: Timestamp.fromDate(new Date(parsedDateMs)),
      aicteHours: nextHours,
      description: encodedDescription,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
    });
    return;
  }

  await updateDoc(doc(db, "events", event.id), {
    name: nextName,
    date: Timestamp.fromDate(new Date(parsedDateMs)),
    aicteHours: nextHours,
    description: encodedDescription,
  });
}

export async function saveAttendance(
  memberId: string,
  eventId: string,
  attended: boolean
) {
  if (!auth.currentUser) throw new Error("Sign in first.");
  await setDoc(doc(db, "attendance", `${memberId}__${eventId}`), {
    memberId,
    eventId,
    attended,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid,
  });
}

/**
 * Persists the normalized AICTE allocations list into Firestore `events` ledger shard documents.
 */
async function persistLedgerToFirestore(
  records: MemberEventPointAllocation[],
  revokedLegacyPairs: string[],
  existingShards: LedgerShardDoc[],
  defaultAcademicYear: string
): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in as an administrator first.");
  const uid = auth.currentUser.uid;
  const sessionYear = isValidAcademicYear(defaultAcademicYear)
    ? normalizeAcademicYear(defaultAcademicYear)
    : "2026-27";

  const uniqueRevoked = Array.from(new Set(revokedLegacyPairs));

  const chunks: { records: MemberEventPointAllocation[]; revokedLegacyPairs: string[] }[] = [];
  let currentRecords: MemberEventPointAllocation[] = [];
  let currentRevoked = uniqueRevoked;

  for (const rec of records) {
    const candidate = [...currentRecords, rec];
    const jsonLen = JSON.stringify({
      type: "aicte_ledger_v2",
      records: candidate,
      revokedLegacyPairs: currentRevoked,
    }).length;
    if (jsonLen > 3600 && currentRecords.length > 0) {
      chunks.push({ records: currentRecords, revokedLegacyPairs: currentRevoked });
      currentRecords = [rec];
      currentRevoked = [];
    } else {
      currentRecords = candidate;
    }
  }
  chunks.push({ records: currentRecords, revokedLegacyPairs: currentRevoked });

  const sortedShards = [...existingShards].sort((a, b) => a.shardIndex - b.shardIndex);
  const totalNeeded = Math.max(chunks.length, sortedShards.length);

  for (let i = 0; i < totalNeeded; i++) {
    const chunk = chunks[i] || { records: [], revokedLegacyPairs: [] };
    const descriptionPayload = JSON.stringify({
      type: "aicte_ledger_v2",
      shard: i,
      records: chunk.records,
      revokedLegacyPairs: chunk.revokedLegacyPairs,
    });
    const existingShard = sortedShards.find((s) => s.shardIndex === i);

    if (existingShard) {
      await updateDoc(doc(db, "events", existingShard.docId), {
        description: descriptionPayload,
      });
    } else if (chunk.records.length > 0 || chunk.revokedLegacyPairs.length > 0 || i === 0) {
      await addDoc(collection(db, "events"), {
        name: `${AICTE_LEDGER_PREFIX}${i}`,
        academicYear: sessionYear,
        date: Timestamp.fromDate(new Date("2026-07-01T00:00:00.000Z")),
        aicteHours: 4,
        description: descriptionPayload,
        createdAt: serverTimestamp(),
        createdBy: uid,
      });
    }
  }
}

export async function saveAICTEAllocationRecord(
  input: AICTEAllocationInput,
  hoursPerAICTEPoint: number,
  mode: "create" | "update",
  events: ClubEvent[],
  existingAllocations: MemberEventPointAllocation[] = [],
  existingShards: LedgerShardDoc[] = [],
  revokedLegacyPairs: string[] = [],
  defaultAcademicYear = "2026-27",
  previousAllocationId?: string
): Promise<MemberEventPointAllocation> {
  if (!auth.currentUser) throw new Error("Sign in as an administrator first.");

  const targetEvent = events.find((e) => e.id === input.eventId);
  if (targetEvent && !isEventSelectableForAllocation(targetEvent)) {
    throw new Error(
      `Event "${targetEvent.name}" is marked as ${getEffectiveEventStatus(targetEvent)} and is not eligible for AICTE point allocation until completed.`
    );
  }

  const validated = validateAndComputeAllocation(
    {
      memberId: input.memberId,
      eventId: input.eventId,
      eventName: targetEvent?.name || input.eventName,
      eventDate: targetEvent?.date || input.eventDate,
      academicYear: input.academicYear,
      allocationMethod: input.allocationMethod,
      hours: input.hours,
      aictePoints: input.aictePoints,
    },
    hoursPerAICTEPoint
  );

  if (mode === "create") {
    const duplicate = existingAllocations.find((a) => a.id === validated.id);
    if (duplicate) {
      throw new Error(
        `Duplicate allocation: This member already has AICTE points recorded for "${validated.eventName}" (${validated.academicYear}). Please edit the existing record instead.`
      );
    }
  } else if (
    mode === "update" &&
    previousAllocationId &&
    previousAllocationId !== validated.id
  ) {
    const duplicate = existingAllocations.find((a) => a.id === validated.id);
    if (duplicate) {
      throw new Error(
        `Duplicate allocation: This member already has AICTE points recorded for "${validated.eventName}" (${validated.academicYear}).`
      );
    }
  }

  const uid = auth.currentUser.uid;
  const nowIso = new Date().toISOString();
  const prevRecord = existingAllocations.find(
    (a) => a.id === (previousAllocationId || validated.id)
  );

  const savedRecord: MemberEventPointAllocation = {
    ...validated,
    createdAt: prevRecord?.createdAt || nowIso,
    updatedAt: nowIso,
    createdBy: prevRecord?.createdBy || uid,
    updatedBy: uid,
    isLegacyMigrated: false,
  };

  const persistedRecords = existingShards.flatMap((s) => s.records);
  const filteredRecords = persistedRecords.filter(
    (r) => r.id !== validated.id && (!previousAllocationId || r.id !== previousAllocationId)
  );
  filteredRecords.push(savedRecord);

  const pairKey = `${validated.memberId}__${validated.eventId}`;
  const nextRevoked = revokedLegacyPairs.filter((k) => k !== pairKey);

  await persistLedgerToFirestore(
    filteredRecords,
    nextRevoked,
    existingShards,
    defaultAcademicYear
  );

  return savedRecord;
}

export async function revokeAICTEAllocationRecord(
  allocation: MemberEventPointAllocation,
  existingShards: LedgerShardDoc[] = [],
  revokedLegacyPairs: string[] = [],
  defaultAcademicYear = "2026-27"
): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in as an administrator first.");
  const uid = auth.currentUser.uid;

  const persistedRecords = existingShards.flatMap((s) => s.records);
  const nextRecords = persistedRecords.filter((r) => r.id !== allocation.id);
  const pairKey = `${allocation.memberId}__${allocation.eventId}`;
  const nextRevoked = Array.from(new Set([...revokedLegacyPairs, pairKey]));

  await persistLedgerToFirestore(
    nextRecords,
    nextRevoked,
    existingShards,
    defaultAcademicYear
  );

  if (/^[A-Za-z0-9]{20}$/.test(allocation.eventId)) {
    const legacyRef = doc(db, "attendance", `${allocation.memberId}__${allocation.eventId}`);
    try {
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists() && legacySnap.data().attended) {
        await setDoc(legacyRef, {
          memberId: allocation.memberId,
          eventId: allocation.eventId,
          attended: false,
          updatedAt: serverTimestamp(),
          updatedBy: uid,
        });
      }
    } catch {
      // Ignored if cross-session legacy attendance rule prevents direct attendance doc update
    }
  }
}

export async function resetAllMemberAllocationsToZero(
  existingShards: LedgerShardDoc[] = [],
  attendanceRecords: { memberId: string; eventId: string; attended: boolean }[] = [],
  defaultAcademicYear = "2026-27"
): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in as an administrator first.");
  const uid = auth.currentUser.uid;

  const allLegacyPairs = attendanceRecords.map(
    (rec) => `${rec.memberId}__${rec.eventId}`
  );

  await persistLedgerToFirestore([], allLegacyPairs, existingShards, defaultAcademicYear);

  for (const rec of attendanceRecords) {
    if (!rec.attended) continue;
    if (/^[A-Za-z0-9]{20}$/.test(rec.eventId)) {
      try {
        await setDoc(doc(db, "attendance", `${rec.memberId}__${rec.eventId}`), {
          memberId: rec.memberId,
          eventId: rec.eventId,
          attended: false,
          updatedAt: serverTimestamp(),
          updatedBy: uid,
        });
      } catch {
        // Already suppressed via allLegacyPairs in ledger
      }
    }
  }
}
