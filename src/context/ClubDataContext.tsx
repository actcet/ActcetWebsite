import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { approveMember, createEvent, eventFromDocument, memberFromDocument, portalError, rejectMember, saveAttendance, settingsFromDocument } from "@/services/portalService";
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
    const unsubscribers = [onSnapshot(doc(db, "settings", "club"), snapshot => {
      try { setSettings(settingsFromDocument(snapshot.data())); complete("settings"); } catch (cause) { fail(cause); }
    }, fail)];
    if (isAuthenticated) {
      const memberQuery = isAdmin ? collection(db, "users") : query(collection(db, "users"), where("approvalStatus", "==", "approved"));
      unsubscribers.push(onSnapshot(memberQuery, snapshot => {
        try { setMembers(snapshot.docs.map(item => memberFromDocument(item.id, item.data()))); complete("members"); } catch (cause) { fail(cause); }
      }, fail));
      unsubscribers.push(onSnapshot(collection(db, "events"), snapshot => {
        try { setEvents(snapshot.docs.map(item => eventFromDocument(item.id, item.data())).sort((a, b) => a.date.localeCompare(b.date))); complete("events"); } catch (cause) { fail(cause); }
      }, fail));
      unsubscribers.push(onSnapshot(collection(db, "attendance"), snapshot => {
        setAttendance(snapshot.docs.map(item => item.data() as AttendanceRecord)); complete("attendance");
      }, fail));
    }
    return () => { active = false; unsubscribers.forEach(unsubscribe => unsubscribe()); };
  }, [accessKey, isAuthenticated, isAdmin]);
  const canUseData = !!accessKey && accessKey === loadedAccessKey;
  const visibleMembers = canUseData ? members : [];
  const visibleEvents = canUseData ? events : [];
  const visibleAttendance = canUseData ? attendance : [];
  const approvedMembers = visibleMembers.filter(member => member.approvalStatus === "approved");
  const pendingMembers = visibleMembers.filter(member => member.approvalStatus === "pending");
  const academicYears = Array.from(new Set([...(settings ? [settings.currentAcademicYear] : []), ...visibleMembers.map(member => member.academicYear), ...visibleEvents.map(event => event.academicYear)])).sort().reverse();
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
