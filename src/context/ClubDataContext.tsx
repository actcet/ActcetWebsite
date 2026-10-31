import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  approveMember,
  buildMergedYearEvents,
  createEvent,
  deleteShowcaseEventFromFirestore,
  deleteUpcomingEventFromFirestore,
  eventFromDocument,
  isActiveLedgerDocument,
  isAnyLedgerDocument,
  isCollectionMetadata,
  memberFromDocument,
  mergePortalAndCatalogEvents,
  parseChunkedStoreDocument,
  parseLedgerDocument,
  portalError,
  reconstructChunkedItems,
  rejectMember,
  resetAllMemberAllocationsToZero,
  revokeAICTEAllocationRecord,
  saveAICTEAllocationRecord,
  saveAttendance,
  saveShowcaseEventToFirestore,
  saveUpcomingEventToFirestore,
  settingsFromDocument,
  SHOWCASE_EVENT_PREFIX,
  updateClubEvent,
  UPCOMING_EVENT_PREFIX,
} from "@/services/portalService";
import type { ChunkedStoreDoc, ClubSettings, LedgerShardDoc } from "@/services/portalService";
import {
  getEffectiveEventStatus,
  isEventSelectableForAllocation,
  normalizeAcademicYear,
  parseFlexibleDateToISO,
  sortEventsAlphabetically,
  sortMembersAlphabetically,
} from "@/lib/aicte";
import type {
  AICTEAllocationInput,
  AttendanceRecord,
  ClubEvent,
  Member,
  MemberEventPointAllocation,
  ShowcaseEvent,
  UpcomingEvent,
  UpdateEventInput,
  UserRole,
  YearEvents,
} from "@/types";

interface ClubDataContextType {
  members: Member[];
  events: ClubEvent[];
  allEvents: ClubEvent[];
  completedEvents: ClubEvent[];
  mergedYearEvents: YearEvents[];
  showcaseEvents: ShowcaseEvent[];
  upcomingEvents: UpcomingEvent[];
  attendance: AttendanceRecord[];
  allocations: MemberEventPointAllocation[];
  academicYears: string[];
  approvedMembers: Member[];
  pendingMembers: Member[];
  settings: ClubSettings | null;
  isLoading: boolean;
  error: string | null;
  stats: {
    totalRegistered: number;
    pendingCount: number;
    approvedCount: number;
    totalEvents: number;
    completedEventsCount: number;
    totalAllocations: number;
  };
  approveUser: (id: string, role: UserRole) => Promise<boolean>;
  rejectUser: (id: string, reason?: string) => Promise<boolean>;
  updateAttendance: (memberId: string, eventId: string, attended: boolean) => Promise<boolean>;
  addEvent: (input: Omit<ClubEvent, "id">) => Promise<ClubEvent>;
  editEvent: (event: ClubEvent, changes: UpdateEventInput) => Promise<boolean>;
  archiveEventRecord: (event: ClubEvent, archived?: boolean) => Promise<boolean>;
  deleteEventRecord: (event: ClubEvent) => Promise<boolean>;
  saveAllocation: (
    input: AICTEAllocationInput,
    mode?: "create" | "update",
    previousAllocationId?: string
  ) => Promise<boolean>;
  deleteAllocation: (allocation: MemberEventPointAllocation) => Promise<boolean>;
  resetAllAllocations: () => Promise<boolean>;
  saveShowcaseEvent: (event: ShowcaseEvent) => Promise<ShowcaseEvent | null>;
  deleteShowcaseEvent: (eventId: string, eventName?: string) => Promise<boolean>;
  saveUpcomingEvent: (event: UpcomingEvent) => Promise<UpcomingEvent | null>;
  deleteUpcomingEvent: (eventId: string, eventTitle?: string) => Promise<boolean>;
}

const DEFAULT_ACADEMIC_YEARS = ["2026-27", "2025-26", "2024-25", "2023-24", "2022-23"];

const ClubDataContext = createContext<ClubDataContextType | undefined>(undefined);

export function ClubDataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [firestoreEvents, setFirestoreEvents] = useState<ClubEvent[]>([]);
  const [ledgerShards, setLedgerShards] = useState<LedgerShardDoc[]>([]);
  const [showcaseChunks, setShowcaseChunks] = useState<ChunkedStoreDoc[]>([]);
  const [upcomingChunks, setUpcomingChunks] = useState<ChunkedStoreDoc[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const cleanedLegacyRef = useRef(false);

  const accessKey = isAuthenticated ? `${currentUser!.id}:${isAdmin}` : "";
  const [loadedAccessKey, setLoadedAccessKey] = useState("");

  useEffect(() => {
    setMembers([]);
    setFirestoreEvents([]);
    setLedgerShards([]);
    setShowcaseChunks([]);
    setUpcomingChunks([]);
    setAttendance([]);
    setSettings(null);
    setError(null);
    setLoaded(new Set());
    setLoadedAccessKey(accessKey);

    let active = true;
    const fail = (cause: unknown) => {
      if (active) setError(portalError(cause));
    };
    const complete = (key: string) => {
      if (active) setLoaded((previous) => new Set([...previous, key]));
    };

    const unsubscribers: (() => void)[] = [
      onSnapshot(
        doc(db, "settings", "club"),
        (snapshot) => {
          if (!active) return;
          try {
            const nextSettings = settingsFromDocument(snapshot.data());
            setSettings(nextSettings);
            complete("settings");
          } catch (cause) {
            fail(cause);
          }
        },
        fail
      ),
    ];

    if (isAuthenticated) {
      const statuses = isAdmin ? ["approved", "pending", "rejected"] : ["approved"];
      const memberBuckets = new Map<string, Member[]>();

      for (const status of statuses) {
        unsubscribers.push(
          onSnapshot(
            query(collection(db, "users"), where("approvalStatus", "==", status)),
            (snapshot) => {
              if (!active) return;
              try {
                memberBuckets.set(
                  status,
                  snapshot.docs.map((item) => memberFromDocument(item.id, item.data()))
                );
                setMembers([...memberBuckets.values()].flat());
                if (memberBuckets.size === statuses.length) complete("members");
              } catch (cause) {
                fail(cause);
              }
            },
            fail
          )
        );
      }

      // Subscribe to Firestore events, AICTE ledger shards, Showcase Event chunks, and Upcoming Event chunks
      unsubscribers.push(
        onSnapshot(
          collection(db, "events"),
          (snapshot) => {
            if (!active) return;
            try {
              const nextEvents: ClubEvent[] = [];
              const nextShards: LedgerShardDoc[] = [];
              const nextShowcaseChunks: ChunkedStoreDoc[] = [];
              const nextUpcomingChunks: ChunkedStoreDoc[] = [];

              for (const item of snapshot.docs) {
                const data = item.data();
                if (isCollectionMetadata(item.id, data)) continue;

                const showcaseChunk = parseChunkedStoreDocument(
                  item.id,
                  data,
                  SHOWCASE_EVENT_PREFIX
                );
                if (showcaseChunk) {
                  nextShowcaseChunks.push(showcaseChunk);
                  continue;
                }

                const upcomingChunk = parseChunkedStoreDocument(
                  item.id,
                  data,
                  UPCOMING_EVENT_PREFIX
                );
                if (upcomingChunk) {
                  nextUpcomingChunks.push(upcomingChunk);
                  continue;
                }

                if (isAnyLedgerDocument(item.id, data)) {
                  if (isActiveLedgerDocument(item.id, data)) {
                    const parsedShard = parseLedgerDocument(item.id, data);
                    if (parsedShard) nextShards.push(parsedShard);
                  }
                  continue;
                }
                nextEvents.push(eventFromDocument(item.id, data));
              }

              setFirestoreEvents(sortEventsAlphabetically(nextEvents));
              setLedgerShards(nextShards.sort((a, b) => a.shardIndex - b.shardIndex));
              setShowcaseChunks(nextShowcaseChunks);
              setUpcomingChunks(nextUpcomingChunks);
              complete("events");
            } catch (cause) {
              fail(cause);
            }
          },
          fail
        )
      );

      // Subscribe to attendance collection
      unsubscribers.push(
        onSnapshot(
          collection(db, "attendance"),
          (snapshot) => {
            if (!active) return;
            const nextAttendance = snapshot.docs
              .filter((item) => !isCollectionMetadata(item.id, item.data()))
              .map((item) => item.data() as AttendanceRecord);
            setAttendance(nextAttendance);
            complete("attendance");
          },
          fail
        )
      );
    }

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [accessKey, isAuthenticated, isAdmin]);

  const canUseData = !!accessKey && accessKey === loadedAccessKey;
  const visibleMembers = canUseData ? members : [];
  const visibleFirestoreEvents = canUseData ? firestoreEvents : [];
  const visibleAttendance = canUseData ? attendance : [];
  const visibleShards = canUseData ? ledgerShards : [];
  const visibleShowcaseChunks = canUseData ? showcaseChunks : [];
  const visibleUpcomingChunks = canUseData ? upcomingChunks : [];

  // Reconstruct Showcase Events (including soft-deleted markers for buildMergedYearEvents)
  const rawShowcaseRecords = useMemo(
    () =>
      canUseData
        ? reconstructChunkedItems<ShowcaseEvent>(visibleShowcaseChunks, true)
        : [],
    [canUseData, visibleShowcaseChunks]
  );

  const showcaseEvents = useMemo(
    () => rawShowcaseRecords.filter((item) => !item.deleted),
    [rawShowcaseRecords]
  );

  // Merged academic year events for the website's #events section and Admin Showcase manager
  const mergedYearEvents = useMemo(
    () => buildMergedYearEvents(rawShowcaseRecords),
    [rawShowcaseRecords]
  );

  // Reconstruct Upcoming Events for the website's #future section and Admin Upcoming manager
  const upcomingEvents = useMemo(
    () =>
      canUseData
        ? reconstructChunkedItems<UpcomingEvent>(visibleUpcomingChunks, false)
        : [],
    [canUseData, visibleUpcomingChunks]
  );

  // Merge Firestore events with static catalog events + any newly added Showcase Events
  const allEvents = useMemo(() => {
    if (!canUseData) return [];
    const baseMerged = mergePortalAndCatalogEvents(visibleFirestoreEvents);
    const deletedCatalogIds = new Set(
      visibleFirestoreEvents
        .filter((e) => e.deleted && e.catalogId)
        .map((e) => e.catalogId as string)
    );
    const deletedNameYearKeys = new Set(
      visibleFirestoreEvents
        .filter((e) => e.deleted)
        .map(
          (e) => `${e.name.trim().toLowerCase()}__${normalizeAcademicYear(e.academicYear)}`
        )
    );
    const existingKeys = new Set([
      ...baseMerged.map(
        (e) => `${e.name.trim().toLowerCase()}__${normalizeAcademicYear(e.academicYear)}`
      ),
      ...deletedNameYearKeys,
    ]);
    const extraFromShowcase: ClubEvent[] = [];
    for (const sc of showcaseEvents) {
      const normYear = normalizeAcademicYear(sc.academicYear);
      const key = `${sc.name.trim().toLowerCase()}__${normYear}`;
      const catId = `cat_${sc.id}`;
      if (existingKeys.has(key) || deletedCatalogIds.has(catId)) continue;
      existingKeys.add(key);
      const parsedDate = parseFlexibleDateToISO(sc.date) || "2025-08-01";
      extraFromShowcase.push({
        id: catId,
        catalogId: catId,
        name: sc.name,
        academicYear: normYear,
        date: parsedDate,
        aicteHours: 4,
        description: sc.objective || sc.outcome || sc.description || "",
        status: "completed",
        archived: false,
        isCatalogEvent: true,
      });
    }
    return sortEventsAlphabetically([...baseMerged, ...extraFromShowcase]);
  }, [canUseData, visibleFirestoreEvents, showcaseEvents]);

  // Active (non-archived) events sorted alphabetically
  const events = useMemo(
    () =>
      sortEventsAlphabetically(
        allEvents.filter((e) => getEffectiveEventStatus(e) !== "archived")
      ),
    [allEvents]
  );

  // Completed (and non-archived) events eligible for AICTE point allocation, sorted alphabetically
  const completedEvents = useMemo(
    () => sortEventsAlphabetically(allEvents.filter((e) => isEventSelectableForAllocation(e))),
    [allEvents]
  );

  const revokedLegacyPairs = useMemo(
    () => Array.from(new Set(visibleShards.flatMap((s) => s.revokedLegacyPairs))),
    [visibleShards]
  );

  // Active allocations come strictly from the clean v2 ledger shards (starting all members at 0 pts)
  const allocations = useMemo(() => {
    if (!canUseData) return [];
    const eventsById = new Map(allEvents.map((e) => [e.id, e]));
    return visibleShards.flatMap((s) =>
      s.records.map((rec) => {
        const linkedEvent = eventsById.get(rec.eventId);
        return {
          ...rec,
          academicYear: normalizeAcademicYear(rec.academicYear),
          eventName: linkedEvent?.name || rec.eventName,
          eventDate: linkedEvent?.date || rec.eventDate,
        };
      })
    );
  }, [canUseData, visibleShards, allEvents]);

  // Ensure any leftover legacy attendance checkboxes are unchecked so all registered members start at 0
  useEffect(() => {
    if (!canUseData || !isAdmin || cleanedLegacyRef.current) return;
    if (visibleShards.length === 0 && visibleAttendance.some((a) => a.attended)) {
      cleanedLegacyRef.current = true;
      for (const rec of visibleAttendance) {
        if (rec.attended && /^[A-Za-z0-9]{20}$/.test(rec.eventId)) {
          void saveAttendance(rec.memberId, rec.eventId, false).catch(() => {});
        }
      }
    }
  }, [canUseData, isAdmin, visibleShards.length, visibleAttendance]);

  // Approved members sorted alphabetically by full name by default
  const approvedMembers = useMemo(
    () =>
      sortMembersAlphabetically(
        visibleMembers.filter(
          (member) => member.accountType !== "club_admin" && member.approvalStatus === "approved"
        )
      ),
    [visibleMembers]
  );

  const pendingMembers = useMemo(
    () =>
      sortMembersAlphabetically(
        visibleMembers.filter(
          (member) => member.accountType !== "club_admin" && member.approvalStatus === "pending"
        )
      ),
    [visibleMembers]
  );

  const academicYears = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_ACADEMIC_YEARS,
          ...(settings ? [normalizeAcademicYear(settings.currentAcademicYear)] : []),
          ...visibleMembers
            .filter((member) => member.accountType !== "club_admin" && member.academicYear)
            .map((member) => normalizeAcademicYear(member.academicYear as string)),
          ...allEvents.map((event) => normalizeAcademicYear(event.academicYear)),
          ...allocations.map((alloc) => normalizeAcademicYear(alloc.academicYear)),
          ...mergedYearEvents.map((yg) => normalizeAcademicYear(yg.year)),
        ])
      )
        .filter(Boolean)
        .sort()
        .reverse(),
    [settings, visibleMembers, allEvents, allocations, mergedYearEvents]
  );

  const write = async (action: () => Promise<unknown>, success: string) => {
    if (!isAdmin) {
      showToast("Only an approved Chairperson or Mentor can make this change.", "error");
      return false;
    }
    try {
      await action();
      showToast(success, "success");
      return true;
    } catch (cause) {
      showToast(portalError(cause), "error");
      return false;
    }
  };

  return (
    <ClubDataContext.Provider
      value={{
        members: visibleMembers,
        events,
        allEvents,
        completedEvents,
        mergedYearEvents,
        showcaseEvents,
        upcomingEvents,
        attendance: visibleAttendance,
        allocations,
        academicYears,
        approvedMembers,
        pendingMembers,
        settings,
        error,
        isLoading: !canUseData || loaded.size < (isAuthenticated ? 4 : 1),
        stats: {
          totalRegistered: visibleMembers.length,
          pendingCount: pendingMembers.length,
          approvedCount: approvedMembers.length,
          totalEvents: events.length,
          completedEventsCount: completedEvents.length,
          totalAllocations: allocations.length,
        },
        approveUser: (id, role) =>
          write(() => approveMember(id, role), "Registration approved."),
        rejectUser: (id, reason) =>
          write(() => rejectMember(id, reason), "Registration rejected."),
        updateAttendance: (memberId, eventId, attended) =>
          write(() => saveAttendance(memberId, eventId, attended), "Attendance saved."),
        addEvent: async (input) => {
          if (!isAdmin) {
            throw new Error("Only an approved Chairperson or Mentor can create events.");
          }
          const event = await createEvent(input, allEvents);
          showToast("AICTE dropdown event created successfully.", "success");
          return event;
        },
        editEvent: (event, changes) =>
          write(
            () => updateClubEvent(event, changes, allEvents),
            "Event updated successfully."
          ),
        archiveEventRecord: (event, archived = true) =>
          write(
            () =>
              updateClubEvent(
                event,
                {
                  status: archived ? "archived" : "completed",
                  archived,
                },
                allEvents
              ),
            archived
              ? `Event "${event.name}" archived safely. Existing member allocations remain intact.`
              : `Event "${event.name}" restored.`
          ),
        deleteEventRecord: (event) =>
          write(
            () =>
              updateClubEvent(
                event,
                {
                  status: "archived",
                  archived: true,
                  deleted: true,
                },
                allEvents
              ),
            `Event "${event.name}" removed from AICTE dropdown.`
          ),
        saveAllocation: (input, mode = "create", previousAllocationId) =>
          write(
            () =>
              saveAICTEAllocationRecord(
                input,
                settings?.hoursPerAICTEPoint ?? 4,
                mode,
                allEvents,
                allocations,
                visibleShards,
                revokedLegacyPairs,
                settings?.currentAcademicYear || "2026-27",
                previousAllocationId
              ),
            mode === "update"
              ? "AICTE allocation updated successfully."
              : "AICTE points allocated successfully."
          ),
        deleteAllocation: (allocation) =>
          write(
            () =>
              revokeAICTEAllocationRecord(
                allocation,
                visibleShards,
                revokedLegacyPairs,
                settings?.currentAcademicYear || "2026-27"
              ),
            `AICTE allocation for "${allocation.eventName}" revoked.`
          ),
        resetAllAllocations: () =>
          write(
            () =>
              resetAllMemberAllocationsToZero(
                visibleShards,
                visibleAttendance,
                settings?.currentAcademicYear || "2026-27"
              ),
            "All member AICTE points have been reset to 0."
          ),
        saveShowcaseEvent: async (event) => {
          if (!isAdmin) {
            showToast("Only an approved Chairperson or Mentor can publish website events.", "error");
            return null;
          }
          try {
            const saved = await saveShowcaseEventToFirestore(
              event,
              visibleShowcaseChunks,
              settings?.currentAcademicYear || "2026-27"
            );
            showToast(
              `Event "${saved.name}" saved to ${saved.academicYear} Events Showcase.`,
              "success"
            );
            return saved;
          } catch (cause) {
            showToast(portalError(cause), "error");
            return null;
          }
        },
        deleteShowcaseEvent: (eventId, eventName) =>
          write(
            () =>
              deleteShowcaseEventFromFirestore(
                eventId,
                visibleShowcaseChunks,
                settings?.currentAcademicYear || "2026-27"
              ),
            `Removed "${eventName || "Event"}" from Website Events Showcase.`
          ),
        saveUpcomingEvent: async (event) => {
          if (!isAdmin) {
            showToast("Only an approved Chairperson or Mentor can post upcoming events.", "error");
            return null;
          }
          try {
            const saved = await saveUpcomingEventToFirestore(
              event,
              visibleUpcomingChunks,
              settings?.currentAcademicYear || "2026-27"
            );
            showToast(`Upcoming event "${saved.title}" published.`, "success");
            return saved;
          } catch (cause) {
            showToast(portalError(cause), "error");
            return null;
          }
        },
        deleteUpcomingEvent: (eventId, eventTitle) =>
          write(
            () =>
              deleteUpcomingEventFromFirestore(
                eventId,
                visibleUpcomingChunks,
                settings?.currentAcademicYear || "2026-27"
              ),
            `Upcoming event "${eventTitle || "Event"}" removed.`
          ),
      }}
    >
      {children}
    </ClubDataContext.Provider>
  );
}

export function useClubData() {
  const context = useContext(ClubDataContext);
  if (!context) {
    throw new Error("useClubData must be used within a ClubDataProvider");
  }
  return context;
}
