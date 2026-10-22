import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { approveMember, createEvent, eventFromDocument, isCollectionMetadata, memberFromDocument, portalError, rejectMember, saveAttendance, settingsFromDocument } from "@/services/portalService";
import type { ClubSettings } from "@/services/portalService";
import type { AttendanceRecord, ClubEvent, Member, UserRole } from "@/types";
interface ClubDataContextType {
  members: Member[]; events: ClubEvent[]; attendance: AttendanceRecord[]; academicYears: string[];
  approvedMembers: Member[]; pendingMembers: Member[];
  settings: ClubSettings | null; isLoading: boolean; error: string | null;
  stats: { totalRegistered: number; pendingCount: number; approvedCount: number; totalEvents: number };
  approveUser: (id: string, role: UserRole) => Promise<boolean>;
  rejectUser: (id: string, reason?: string) => Promise<boolean>;
  updateAttendance: (memberId: string, eventId: string, attended: boolean) => Promise<boolean>;
  addEvent: (input: Omit<ClubEvent, "id">) => Promise<ClubEvent>;
}
const ClubDataContext = createContext<ClubDataContextType | undefined>(undefined);
export function ClubDataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const accessKey = isAuthenticated ? `${currentUser!.id}:${isAdmin}` : "";
  const [loadedAccessKey, setLoadedAccessKey] = useState("");
  useEffect(() => {
    setMembers([]); setEvents([]); setAttendance([]); setSettings(null); setError(null); setLoaded(new Set()); setLoadedAccessKey(accessKey);
    let active = true;
    const fail = (cause: unknown) => { if (active) setError(portalError(cause)); };
    const complete = (key: string) => { if (active) setLoaded(previous => new Set([...previous, key])); };
    let currentSettings: ClubSettings | null = null;
    let currentMembers: Member[] = [];
    let eventScope = "", attendanceScope = "";
    let stopEvents: (() => void)[] = [], stopAttendance: (() => void)[] = [];
    const chunks = <T,>(items: T[]) => Array.from({ length: Math.ceil(items.length / 10) }, (_, index) => items.slice(index * 10, index * 10 + 10));
    const subscribeAttendance = (eventIds: string[]) => {
      const scope = JSON.stringify([...eventIds].sort());
      if (scope === attendanceScope) return;
      attendanceScope = scope;
      stopAttendance.forEach(stop => stop());
      setLoaded(previous => { const next = new Set(previous); next.delete("attendance"); return next; });
      setAttendance([]);
      const batches = chunks(eventIds), values = new Map<number, AttendanceRecord[]>();
      if (!batches.length) complete("attendance");
      stopAttendance = batches.map((ids, index) => onSnapshot(query(collection(db, "attendance"), where("eventId", "in", ids)), snapshot => {
        if (!active || attendanceScope !== scope) return;
        values.set(index, snapshot.docs.filter(item => !isCollectionMetadata(item.id, item.data())).map(item => item.data() as AttendanceRecord));
        setAttendance([...values.values()].flat());
        if (values.size === batches.length) complete("attendance");
      }, fail));
    };
    const subscribeEvents = () => {
      if (!isAuthenticated || !currentSettings) return;
      const years = [...new Set([currentSettings.currentAcademicYear, ...currentMembers.filter(member => member.accountType !== "club_admin" && member.approvalStatus === "approved" && member.academicYear).map(member => member.academicYear as string)])].sort();
      const scope = JSON.stringify(years);
      if (scope === eventScope) return;
      eventScope = scope;
      stopEvents.forEach(stop => stop());
      setLoaded(previous => { const next = new Set(previous); next.delete("events"); return next; });
      setEvents([]); subscribeAttendance([]);
      const batches = chunks(years), values = new Map<number, ClubEvent[]>();
      stopEvents = batches.map((sessions, index) => onSnapshot(query(collection(db, "events"), where("academicYear", "in", sessions)), snapshot => {
        if (!active || eventScope !== scope) return;
        try {
          values.set(index, snapshot.docs.filter(item => !isCollectionMetadata(item.id, item.data())).map(item => eventFromDocument(item.id, item.data())));
          const next = [...values.values()].flat().sort((a, b) => a.date.localeCompare(b.date));
          setEvents(next); subscribeAttendance(next.map(event => event.id));
          if (values.size === batches.length) complete("events");
        } catch (cause) { fail(cause); }
      }, fail));
    };
    const unsubscribers = [onSnapshot(doc(db, "settings", "club"), snapshot => {
      if (!active) return;
      try { currentSettings = settingsFromDocument(snapshot.data()); setSettings(currentSettings); subscribeEvents(); complete("settings"); } catch (cause) { fail(cause); }
    }, fail)];
    if (isAuthenticated) {
      const statuses = isAdmin ? ["approved", "pending", "rejected"] : ["approved"];
      const values = new Map<string, Member[]>();
      for (const status of statuses) unsubscribers.push(onSnapshot(query(collection(db, "users"), where("approvalStatus", "==", status)), snapshot => {
        if (!active) return;
        try {
          values.set(status, snapshot.docs.map(item => memberFromDocument(item.id, item.data())));
          currentMembers = [...values.values()].flat();
          setMembers(currentMembers); subscribeEvents();
          if (values.size === statuses.length) complete("members");
        } catch (cause) { fail(cause); }
      }, fail));
    }
    return () => { active = false; [...unsubscribers, ...stopEvents, ...stopAttendance].forEach(unsubscribe => unsubscribe()); };
  }, [accessKey, isAuthenticated, isAdmin]);
  const canUseData = !!accessKey && accessKey === loadedAccessKey;
  const visibleMembers = canUseData ? members : [];
  const visibleEvents = canUseData ? events : [];
  const visibleAttendance = canUseData ? attendance : [];
  const approvedMembers = visibleMembers.filter(member => member.accountType !== "club_admin" && member.approvalStatus === "approved");
  const pendingMembers = visibleMembers.filter(member => member.accountType !== "club_admin" && member.approvalStatus === "pending");
  const academicYears = Array.from(new Set([...(settings ? [settings.currentAcademicYear] : []), ...visibleMembers.filter(member => member.accountType !== "club_admin" && member.academicYear).map(member => member.academicYear as string), ...visibleEvents.map(event => event.academicYear)])).sort().reverse();
  const write = async (action: () => Promise<unknown>, success: string) => {
    if (!isAdmin) { showToast("Only an approved Chairperson or Mentor can make this change.", "error"); return false; }
    try { await action(); showToast(success, "success"); return true; }
    catch (cause) { showToast(portalError(cause), "error"); return false; }
  };
  return <ClubDataContext.Provider value={{ members: visibleMembers, events: visibleEvents, attendance: visibleAttendance, academicYears, approvedMembers, pendingMembers, settings, error,
    isLoading: !canUseData || loaded.size < (isAuthenticated ? 4 : 1),
    stats: { totalRegistered: visibleMembers.length, pendingCount: pendingMembers.length, approvedCount: approvedMembers.length, totalEvents: visibleEvents.length },
    approveUser: (id, role) => write(() => approveMember(id, role), "Registration approved."),
    rejectUser: (id, reason) => write(() => rejectMember(id, reason), "Registration rejected."),
    updateAttendance: (memberId, eventId, attended) => write(() => saveAttendance(memberId, eventId, attended), "Attendance saved."),
    addEvent: async input => { if (!isAdmin) throw new Error("Only an approved Chairperson or Mentor can create events."); const event = await createEvent(input); showToast("Event created.", "success"); return event; },
  }}>{children}</ClubDataContext.Provider>;
}
export function useClubData() { const context = useContext(ClubDataContext); if (!context) throw new Error("useClubData must be used within a ClubDataProvider"); return context; }
