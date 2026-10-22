import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Member, ClubEvent, AttendanceRecord } from "@/types";
import { mockDataService } from "@/services/mockDataService";
import { useToast } from "./ToastContext";

interface ClubDataContextType {
  members: Member[];
  events: ClubEvent[];
  attendance: AttendanceRecord[];
  academicYears: string[];
  approvedMembers: Member[];
  pendingMembers: Member[];
  stats: {
    totalRegistered: number;
    pendingCount: number;
    approvedCount: number;
    totalEvents: number;
  };
  approveUser: (memberId: string) => void;
  rejectUser: (memberId: string, reason?: string) => void;
  updateAttendance: (memberId: string, eventId: string, attended: boolean) => void;
  addEvent: (eventData: Omit<ClubEvent, "id">) => ClubEvent;
  resetData: () => void;
}

const ClubDataContext = createContext<ClubDataContextType | undefined>(undefined);

export function ClubDataProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const { showToast } = useToast();

  const syncData = useCallback(() => {
    setMembers(mockDataService.getAllMembers());
    setEvents(mockDataService.getEvents());
    setAttendance(mockDataService.getAttendance());
    setAcademicYears(mockDataService.getAcademicYears());
  }, []);

  useEffect(() => {
    syncData();
    const unsubscribe = mockDataService.subscribe(syncData);
    return () => unsubscribe();
  }, [syncData]);

  const approveUser = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    const success = mockDataService.approveUser(memberId);
    if (success) {
      showToast(`Approved registration for ${member?.name || "Member"}.`, "success");
    }
  };

  const rejectUser = (memberId: string, reason?: string) => {
    const member = members.find((m) => m.id === memberId);
    const success = mockDataService.rejectUser(memberId, reason);
    if (success) {
      showToast(`Rejected registration for ${member?.name || "Member"}.`, "error");
    }
  };

  const updateAttendance = (memberId: string, eventId: string, attended: boolean) => {
    mockDataService.updateAttendance(memberId, eventId, attended);
    showToast(`Attendance marked ${attended ? "Attended" : "Unattended"}.`, "info");
  };

  const addEvent = (eventData: Omit<ClubEvent, "id">) => {
    const newEvent = mockDataService.addEvent(eventData);
    showToast(`Event "${newEvent.name}" added successfully!`, "success");
    return newEvent;
  };

  const resetData = () => {
    mockDataService.resetToDefault();
    showToast("Mock data reset to initial seed values.", "info");
  };

  const approvedMembers = members.filter((m) => m.approvalStatus === "approved");
  const pendingMembers = members.filter((m) => m.approvalStatus === "pending");

  const stats = {
    totalRegistered: members.length,
    pendingCount: pendingMembers.length,
    approvedCount: approvedMembers.length,
    totalEvents: events.length,
  };

  return (
    <ClubDataContext.Provider
      value={{
        members,
        events,
        attendance,
        academicYears,
        approvedMembers,
        pendingMembers,
        stats,
        approveUser,
        rejectUser,
        updateAttendance,
        addEvent,
        resetData,
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
