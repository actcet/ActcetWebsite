import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Plus,
  Sparkles,
  ShieldCheck,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Archive,
  RotateCcw,
  Calculator,
  Sliders,
  History,
  Check,
  Info,
  Images,
  Rocket,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { useClubData } from "@/context/ClubDataContext";
import { useAuth } from "@/context/AuthContext";
import {
  calculateHoursBasedPoints,
  calculateMemberAllocationSummary,
  filterEventsBySearch,
  filterMembersBySearch,
  formatCleanNumber,
  formatEventDateDisplay,
  getEffectiveEventStatus,
  isEventSelectableForAllocation,
  isValidAcademicYear,
  makeAllocationId,
  normalizeAcademicYear,
  parseFlexibleDateToISO,
  sortEventsAlphabetically,
} from "@/lib/aicte";
import AddEventModal from "./AddEventModal";
import ShowcaseEventModal from "./ShowcaseEventModal";
import UpcomingEventModal from "./UpcomingEventModal";
import CalendarDatePicker from "@/components/ui/CalendarDatePicker";
import { ROLES } from "@/services/portalService";
import PortalDataStatus from "@/components/ui/PortalDataStatus";
import { placeholderImage, safeExternalHref } from "@/lib/utils";
import type {
  AllocationMethod,
  ClubEvent,
  EventItem,
  Member,
  MemberEventPointAllocation,
  ShowcaseEvent,
  UpcomingEvent,
  UserRole,
} from "@/types";

export default function AdminPortalPage() {
  const { isAdmin } = useAuth();
  const {
    members,
    allEvents,
    completedEvents,
    mergedYearEvents,
    upcomingEvents,
    allocations,
    academicYears,
    approvedMembers,
    pendingMembers,
    stats,
    approveUser,
    rejectUser,
    editEvent,
    archiveEventRecord,
    deleteEventRecord,
    saveAllocation,
    deleteAllocation,
    deleteShowcaseEvent,
    deleteUpcomingEvent,
    settings,
    isLoading,
    error,
  } = useClubData();

  // Active admin section tab:
  // 1. "approvals" -> Login Approvals
  // 2. "member-update" -> Member Update (AICTE Points)
  // 3. "showcase-events" -> Website Events Showcase (Permanent Events by Academic Year)
  // 4. "upcoming-events" -> Upcoming Events (Future Missions with Cover Photo & Registration Link)
  const [activeTab, setActiveTab] = useState<
    "approvals" | "member-update" | "showcase-events" | "upcoming-events"
  >("approvals");
  const clubAdminAccounts = members.filter((member) => member.accountType === "club_admin");

  const [verifiedRoles, setVerifiedRoles] = useState<Record<string, UserRole>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const perform = async (key: string, action: () => Promise<unknown>) => {
    setBusy((previous) => ({ ...previous, [key]: true }));
    try {
      await action();
    } finally {
      setBusy((previous) => ({ ...previous, [key]: false }));
    }
  };

  // Pop-up modal state for Approved Club Members — AICTE Point Registry
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Search filter for Member AICTE Points list inside the pop-up modal
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [expandedMemberIds, setExpandedMemberIds] = useState<Record<string, boolean>>({});

  // Search filter for Login Approvals
  const [approvalSearchQuery, setApprovalSearchQuery] = useState("");

  // 1. AICTE Dropdown Event modal state (Feature #1)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

  // 2. Website Showcase Event modal state (Feature #2)
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [editingShowcaseEvent, setEditingShowcaseEvent] = useState<ShowcaseEvent | null>(
    null
  );
  const [showcaseYearFilter, setShowcaseYearFilter] = useState<string>("all");
  const [showcaseSearchQuery, setShowcaseSearchQuery] = useState("");
  const [showcaseDateFilter, setShowcaseDateFilter] = useState("");

  // 3. Upcoming Event modal state (Feature #3)
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const [editingUpcomingEvent, setEditingUpcomingEvent] = useState<UpcomingEvent | null>(
    null
  );

  // Rejection confirmation dialog state
  const [rejectingMember, setRejectingMember] = useState<Member | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Allocation Revoke confirmation dialog state
  const [revokingAllocation, setRevokingAllocation] =
    useState<MemberEventPointAllocation | null>(null);

  // Archive Event confirmation dialog state
  const [archivingEvent, setArchivingEvent] = useState<ClubEvent | null>(null);

  // Delete AICTE Dropdown Event confirmation dialog state
  const [deletingDropdownEvent, setDeletingDropdownEvent] = useState<ClubEvent | null>(
    null
  );

  // Showcase Event Delete confirmation dialog state
  const [deletingShowcaseEvent, setDeletingShowcaseEvent] = useState<{
    id: string;
    name: string;
    academicYear: string;
    date?: string;
  } | null>(null);

  // Upcoming Event Delete confirmation dialog state
  const [deletingUpcomingEvent, setDeletingUpcomingEvent] =
    useState<UpcomingEvent | null>(null);

  // Manage AICTE Dropdown Events section filter state
  const [eventManagerSearch, setEventManagerSearch] = useState("");
  const [eventManagerDateFilter, setEventManagerDateFilter] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState<
    "all" | "completed" | "upcoming" | "archived"
  >("all");
  const [showManageEvents, setShowManageEvents] = useState(true);

  const toIsoKey = (rawDate?: string): string | null => {
    if (!rawDate) return null;
    const iso = parseFlexibleDateToISO(rawDate);
    return iso || null;
  };

  // ========================================================
  // AICTE ALLOCATION FORM STATE (INITIALLY EMPTY — NO AUTO-SELECTION)
  // ========================================================
  const formRef = useRef<HTMLDivElement | null>(null);
  const memberDropdownRef = useRef<HTMLDivElement | null>(null);
  const eventDropdownRef = useRef<HTMLDivElement | null>(null);
  const memberInputRef = useRef<HTMLInputElement | null>(null);
  const eventInputRef = useRef<HTMLInputElement | null>(null);

  const [editingAllocation, setEditingAllocation] =
    useState<MemberEventPointAllocation | null>(null);

  // Unified Member Combobox state
  const [memberSelectorSearch, setMemberSelectorSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  // Unified Event Combobox state
  const [eventSelectorSearch, setEventSelectorSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [customAllocationYear, setCustomAllocationYear] = useState("");
  const [isCustomAllocationYear, setIsCustomAllocationYear] = useState(false);
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>("hours");
  const [hoursInput, setHoursInput] = useState("4");
  const [directPointsInput, setDirectPointsInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);

  const hoursPerPoint = settings?.hoursPerAICTEPoint ?? 4;

  // Close combobox dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(e.target as Node)
      ) {
        setIsMemberDropdownOpen(false);
      }
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(e.target as Node)
      ) {
        setIsEventDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered options for the Allocation Form's Member combobox (alphabetical, real-time)
  const selectableMembers = useMemo(
    () => filterMembersBySearch(approvedMembers, memberSelectorSearch),
    [approvedMembers, memberSelectorSearch]
  );

  // Filtered options for the Allocation Form's Completed Event combobox (alphabetical, real-time)
  const selectableCompletedEvents = useMemo(
    () => filterEventsBySearch(completedEvents, eventSelectorSearch, true),
    [completedEvents, eventSelectorSearch]
  );

  const selectedMember = useMemo(
    () => approvedMembers.find((m) => m.id === selectedMemberId) || null,
    [approvedMembers, selectedMemberId]
  );

  const selectedEvent = useMemo(
    () => allEvents.find((e) => e.id === selectedEventId) || null,
    [allEvents, selectedEventId]
  );

  const effectiveAcademicYear = normalizeAcademicYear(
    isCustomAllocationYear
      ? customAllocationYear
      : selectedAcademicYear ||
          selectedEvent?.academicYear ||
          settings?.currentAcademicYear ||
          "2026-27"
  );

  // Handle selecting a member from the real-time dropdown
  const handleSelectMember = (member: Member) => {
    setSelectedMemberId(member.id);
    setMemberSelectorSearch("");
    setIsMemberDropdownOpen(false);
    setFormError(null);
  };

  // Clear selected member and focus the search input
  const handleClearSelectedMember = () => {
    setSelectedMemberId("");
    setMemberSelectorSearch("");
    setFormError(null);
    setIsMemberDropdownOpen(true);
    setTimeout(() => memberInputRef.current?.focus(), 0);
  };

  // Handle selecting an event from the real-time dropdown: auto-fill its academicYear and default hours
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventSelectorSearch("");
    setIsEventDropdownOpen(false);
    setFormError(null);
    const evt = allEvents.find((e) => e.id === eventId);
    if (evt) {
      const normYear = normalizeAcademicYear(evt.academicYear);
      setSelectedAcademicYear(normYear);
      setIsCustomAllocationYear(false);
      if (allocationMethod === "hours" && !editingAllocation) {
        setHoursInput(String(evt.aicteHours || 4));
      }
    }
  };

  // Clear selected event and focus the search input
  const handleClearSelectedEvent = () => {
    setSelectedEventId("");
    setEventSelectorSearch("");
    setSelectedAcademicYear("");
    setFormError(null);
    setIsEventDropdownOpen(true);
    setTimeout(() => eventInputRef.current?.focus(), 0);
  };

  // Reset allocation form back to clean empty state
  const resetAllocationForm = () => {
    setEditingAllocation(null);
    setSelectedMemberId("");
    setMemberSelectorSearch("");
    setIsMemberDropdownOpen(false);
    setSelectedEventId("");
    setEventSelectorSearch("");
    setIsEventDropdownOpen(false);
    setSelectedAcademicYear("");
    setCustomAllocationYear("");
    setIsCustomAllocationYear(false);
    setAllocationMethod("hours");
    setHoursInput("4");
    setDirectPointsInput("");
    setFormError(null);
  };

  // Switch between mutually exclusive "hours" and "direct" methods
  const handleSwitchMethod = (method: AllocationMethod) => {
    setAllocationMethod(method);
    setFormError(null);
    if (method === "hours") {
      setDirectPointsInput("");
      if (!hoursInput) {
        setHoursInput(String(selectedEvent?.aicteHours || 4));
      }
    } else {
      setHoursInput("");
      if (!directPointsInput) {
        setDirectPointsInput("1");
      }
    }
  };

  // Check if an allocation already exists ONLY when both a member and an event are explicitly selected
  const existingDuplicateAllocation = useMemo(() => {
    if (!selectedMemberId || !selectedEventId || !effectiveAcademicYear) return null;
    const candidateId = makeAllocationId(
      selectedMemberId,
      selectedEventId,
      effectiveAcademicYear
    );
    const match = allocations.find((a) => a.id === candidateId) || null;
    if (editingAllocation && match && match.id === editingAllocation.id) {
      return null;
    }
    return match;
  }, [allocations, selectedMemberId, selectedEventId, effectiveAcademicYear, editingAllocation]);

  // Live preview of calculated AICTE points in the form
  const previewAllocationPoints = useMemo(() => {
    if (allocationMethod === "hours") {
      const h = parseFloat(hoursInput);
      if (!Number.isFinite(h) || h < 0) return null;
      return calculateHoursBasedPoints(h, hoursPerPoint);
    } else {
      const p = parseFloat(directPointsInput);
      if (!Number.isFinite(p) || p < 0) return null;
      return Math.round(p * 100) / 100;
    }
  }, [allocationMethod, hoursInput, directPointsInput, hoursPerPoint]);

  // Load an existing allocation into the form for editing
  const handleStartEditAllocation = (alloc: MemberEventPointAllocation) => {
    setIsMembersModalOpen(false);
    setEditingAllocation(alloc);
    setFormError(null);
    setMemberSelectorSearch("");
    setEventSelectorSearch("");
    setIsMemberDropdownOpen(false);
    setIsEventDropdownOpen(false);
    setSelectedMemberId(alloc.memberId);
    setSelectedEventId(alloc.eventId);
    const normYear = normalizeAcademicYear(alloc.academicYear);
    if (academicYears.includes(normYear)) {
      setSelectedAcademicYear(normYear);
      setIsCustomAllocationYear(false);
    } else {
      setCustomAllocationYear(normYear);
      setIsCustomAllocationYear(true);
    }
    setAllocationMethod(alloc.allocationMethod);
    if (alloc.allocationMethod === "hours") {
      setHoursInput(String(alloc.hours ?? 4));
      setDirectPointsInput("");
    } else {
      setHoursInput("");
      setDirectPointsInput(String(alloc.aictePoints));
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleQuickSelectMemberForAllocation = (member: Member) => {
    setIsMembersModalOpen(false);
    setEditingAllocation(null);
    setFormError(null);
    setMemberSelectorSearch("");
    setIsMemberDropdownOpen(false);
    setSelectedMemberId(member.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isAdmin) {
      setFormError("Only an approved Chairperson or Mentor can allocate AICTE points.");
      return;
    }

    if (!selectedMember) {
      setFormError("Please select an approved club member first.");
      return;
    }

    if (!selectedEvent) {
      setFormError("Please select a completed event first.");
      return;
    }

    if (!isEventSelectableForAllocation(selectedEvent)) {
      setFormError(
        `Event "${selectedEvent.name}" is not marked as Completed yet and cannot be used for AICTE point allocation.`
      );
      return;
    }

    if (!isValidAcademicYear(effectiveAcademicYear)) {
      setFormError("Please enter a valid academic year in YYYY-YY format (e.g. 2026-27).");
      return;
    }

    if (!editingAllocation && existingDuplicateAllocation) {
      setFormError(
        `Duplicate allocation prevented: ${selectedMember.name} already has AICTE points recorded for "${selectedEvent.name}" (${effectiveAcademicYear}). Click "Edit Existing Record" above if you want to modify their points.`
      );
      return;
    }

    let finalHours: number | null = null;
    let finalDirectPoints: number | undefined = undefined;

    if (allocationMethod === "hours") {
      const parsedH = parseFloat(hoursInput);
      if (hoursInput.trim() === "" || !Number.isFinite(parsedH) || parsedH < 0) {
        setFormError("Please enter a valid non-negative number of hours.");
        return;
      }
      finalHours = Math.round(parsedH * 100) / 100;
    } else {
      const parsedP = parseFloat(directPointsInput);
      if (directPointsInput.trim() === "" || !Number.isFinite(parsedP) || parsedP < 0) {
        setFormError("Please enter a valid non-negative number of AICTE points.");
        return;
      }
      finalHours = null;
      finalDirectPoints = Math.round(parsedP * 100) / 100;
    }

    const targetMemberId = selectedMember.id;
    setIsSavingAllocation(true);
    try {
      const ok = await saveAllocation(
        {
          memberId: selectedMember.id,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          eventDate: selectedEvent.date,
          academicYear: effectiveAcademicYear,
          allocationMethod,
          hours: finalHours,
          aictePoints: finalDirectPoints,
        },
        editingAllocation ? "update" : "create",
        editingAllocation?.id
      );

      if (ok) {
        setExpandedMemberIds((prev) => ({ ...prev, [targetMemberId]: true }));
        resetAllocationForm();
      }
    } finally {
      setIsSavingAllocation(false);
    }
  };

  // Filtered pending members
  const filteredPending = useMemo(() => {
    const q = approvalSearchQuery.trim().toLowerCase();
    if (!q) return pendingMembers;
    return pendingMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.branch || "").toLowerCase().includes(q) ||
        m.requestedRole.toLowerCase().includes(q)
    );
  }, [pendingMembers, approvalSearchQuery]);

  // Filtered & alphabetically sorted approved members for Member AICTE Points modal
  const filteredApproved = useMemo(
    () => filterMembersBySearch(approvedMembers, memberSearchQuery),
    [approvedMembers, memberSearchQuery]
  );

  // Precompute member allocation summaries for fast rendering
  const memberSummaries = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof calculateMemberAllocationSummary>
    >();
    for (const member of approvedMembers) {
      map.set(member.id, calculateMemberAllocationSummary(member.id, allocations));
    }
    return map;
  }, [approvedMembers, allocations]);

  // Filtered events for Manage AICTE Dropdown Events section (alphabetical)
  const filteredManagedEvents = useMemo(() => {
    const sorted = sortEventsAlphabetically(allEvents);
    const q = eventManagerSearch.trim().toLowerCase();
    return sorted.filter((evt) => {
      const status = getEffectiveEventStatus(evt);
      if (eventStatusFilter !== "all" && status !== eventStatusFilter) {
        return false;
      }
      if (eventManagerDateFilter && toIsoKey(evt.date) !== eventManagerDateFilter) {
        return false;
      }
      if (!q) return true;
      return (
        evt.name.toLowerCase().includes(q) ||
        evt.academicYear.toLowerCase().includes(q) ||
        evt.date.toLowerCase().includes(q) ||
        formatEventDateDisplay(evt.date).toLowerCase().includes(q)
      );
    });
  }, [allEvents, eventManagerSearch, eventStatusFilter, eventManagerDateFilter]);

  // Total count of showcase events across all academic years
  const totalShowcaseEventsCount = useMemo(
    () => mergedYearEvents.reduce((sum, yg) => sum + yg.events.length, 0),
    [mergedYearEvents]
  );

  // Convert an EventItem from mergedYearEvents into a ShowcaseEvent for editing
  const handleEditShowcaseEventItem = (item: EventItem, yearStr: string) => {
    setEditingShowcaseEvent({
      id: item.id,
      academicYear: normalizeAcademicYear(item.academicYear || yearStr),
      name: item.name,
      date: item.date,
      location: item.location,
      domain: item.domain,
      category: item.category,
      participants: item.participants,
      objective: item.objective,
      outcome: item.outcome,
      description: item.description || "",
      image: item.image,
      gallery: item.gallery || [],
    });
    setIsShowcaseModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (rejectingMember) {
      if (!(await rejectUser(rejectingMember.id, rejectionReason || "Administrative review"))) {
        return;
      }
      setRejectingMember(null);
      setRejectionReason("");
    }
  };

  const handleConfirmRevokeAllocation = async () => {
    if (!revokingAllocation) return;
    const target = revokingAllocation;
    const ok = await deleteAllocation(target);
    if (ok) {
      if (editingAllocation?.id === target.id) {
        resetAllocationForm();
      }
      setRevokingAllocation(null);
    }
  };

  const handleConfirmArchiveEvent = async () => {
    if (!archivingEvent) return;
    const ok = await archiveEventRecord(archivingEvent, true);
    if (ok) {
      setArchivingEvent(null);
    }
  };

  const handleConfirmDeleteDropdownEvent = async () => {
    if (!deletingDropdownEvent) return;
    const target = deletingDropdownEvent;
    const ok = await deleteEventRecord(target);
    if (ok) {
      if (selectedEventId === target.id) {
        setSelectedEventId("");
      }
      setDeletingDropdownEvent(null);
    }
  };

  const handleConfirmDeleteShowcaseEvent = async () => {
    if (!deletingShowcaseEvent) return;
    const target = deletingShowcaseEvent;
    const ok = await deleteShowcaseEvent(target.id, target.name);
    if (ok) {
      setDeletingShowcaseEvent(null);
    }
  };

  const handleConfirmDeleteUpcomingEvent = async () => {
    if (!deletingUpcomingEvent) return;
    const target = deletingUpcomingEvent;
    const ok = await deleteUpcomingEvent(target.id, target.title);
    if (ok) {
      setDeletingUpcomingEvent(null);
    }
  };

  const toggleMemberHistory = (memberId: string) => {
    setExpandedMemberIds((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  if (error || isLoading || !settings) return <PortalDataStatus error={error} />;

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-[6vw] bg-[#070d1f] relative overflow-hidden">
      {/* Background celestial glow */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-stars opacity-40 pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* 4A. ADMIN PORTAL HEADER WITH 3 DISTINCT EVENT BUTTONS */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-label uppercase tracking-widest mb-3">
              <ShieldCheck size={14} />
              <span>Privileged Administrator Access</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Admin Portal
            </h1>

            <p className="text-sm sm:text-base text-ink-soft mt-1.5 font-body">
              Manage registrations, member AICTE points, permanent website event showcases, and upcoming event registrations.
            </p>
          </div>

          {/* 3 Clearly Named, Purpose-Specific Event Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Button 1: Add Event to AICTE Allocation Dropdown */}
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setIsAddEventOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 text-white font-label font-semibold text-xs uppercase tracking-wider transition flex items-center gap-2"
              title="Add a completed event name & hours to the AICTE Point Allocation dropdown"
            >
              <Award size={15} className="text-primary-light" />
              <span>+ Add AICTE Dropdown Event</span>
            </button>

            {/* Button 2: Publish Event to Website Events Showcase (by Academic Year) */}
            <button
              type="button"
              onClick={() => {
                setEditingShowcaseEvent(null);
                setIsShowcaseModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition shadow-[0_4px_16px_rgba(19,54,212,0.4)] flex items-center gap-2"
              title="Publish a permanent event with cover image and gallery photos to the website's Events section"
            >
              <Images size={15} />
              <span>+ Publish Website Event</span>
            </button>

            {/* Button 3: Post Upcoming Event with Cover Photo & Registration Link */}
            <button
              type="button"
              onClick={() => {
                setEditingUpcomingEvent(null);
                setIsUpcomingModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-label font-bold text-xs uppercase tracking-wider transition shadow-[0_4px_16px_rgba(245,158,11,0.35)] flex items-center gap-2"
              title="Post a new Upcoming Event with cover photo and registration link for members"
            >
              <Rocket size={15} />
              <span>+ Post Upcoming Event</span>
            </button>
          </div>
        </div>

        <section
          className="mt-6 rounded-2xl border border-white/10 bg-[#0b1530]/70 p-5"
          aria-label="Administrative accounts"
        >
          <h2 className="font-display text-lg font-bold text-white">Administrative Accounts</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Club administrator identities are kept separate from student attendance and AICTE tables.
          </p>
          {clubAdminAccounts.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              No club administrator profiles are provisioned.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-ink-soft">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clubAdminAccounts.map((account) => (
                    <tr key={account.id} className="border-b border-white/5">
                      <td className="py-3 pr-4 text-white">{account.name}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-ink-soft">
                        {account.email}
                      </td>
                      <td className="py-3 pr-4 text-white">{account.role}</td>
                      <td className="py-3 text-emerald-300">{account.approvalStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* OVERVIEW STATS CARDS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-5 rounded-2xl bg-[#0b1530]/80 border border-white/10 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-wider text-ink-soft">
                Total Registered
              </p>
              <p className="font-display text-2xl font-bold text-white mt-0.5">
                {stats.totalRegistered}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1530]/80 border border-white/10 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-wider text-ink-soft">
                Pending Approvals
              </p>
              <p className="font-display text-2xl font-bold text-amber-300 mt-0.5">
                {stats.pendingCount}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1530]/80 border border-white/10 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-wider text-ink-soft">
                Approved Members
              </p>
              <p className="font-display text-2xl font-bold text-white mt-0.5">
                {stats.approvedCount}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b1530]/80 border border-white/10 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mint/20 border border-mint/30 flex items-center justify-center text-mint-bright">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-wider text-ink-soft">
                Completed Events
              </p>
              <p className="font-display text-2xl font-bold text-white mt-0.5">
                {stats.completedEventsCount}
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION TABS */}
        {/* ======================================================== */}
        <div className="flex flex-wrap border-b border-white/10 mt-10 gap-1">
          {/* Tab 1: Login Approvals */}
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`pb-4 px-5 font-display text-sm sm:text-base font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "approvals"
                ? "border-primary text-white"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Clock
              size={17}
              className={activeTab === "approvals" ? "text-primary-light" : ""}
            />
            <span>Login Approvals</span>
            {pendingMembers.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                {pendingMembers.length}
              </span>
            )}
          </button>

          {/* Tab 2: Member Update (AICTE Points) */}
          <button
            type="button"
            onClick={() => setActiveTab("member-update")}
            className={`pb-4 px-5 font-display text-sm sm:text-base font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "member-update"
                ? "border-primary text-white"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Award
              size={17}
              className={activeTab === "member-update" ? "text-amber-400" : ""}
            />
            <span>Member Update (AICTE Points)</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/[0.06] text-ink-soft">
              {approvedMembers.length}
            </span>
          </button>

          {/* Tab 3: Website Events Showcase (Permanent Events by Academic Year) */}
          <button
            type="button"
            onClick={() => setActiveTab("showcase-events")}
            className={`pb-4 px-5 font-display text-sm sm:text-base font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "showcase-events"
                ? "border-primary text-white"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Images
              size={17}
              className={activeTab === "showcase-events" ? "text-emerald-400" : ""}
            />
            <span>Website Events Showcase</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/[0.06] text-ink-soft">
              {totalShowcaseEventsCount}
            </span>
          </button>

          {/* Tab 4: Upcoming Events (Future Missions & Member Registrations) */}
          <button
            type="button"
            onClick={() => setActiveTab("upcoming-events")}
            className={`pb-4 px-5 font-display text-sm sm:text-base font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "upcoming-events"
                ? "border-amber-400 text-white"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Rocket
              size={17}
              className={activeTab === "upcoming-events" ? "text-amber-400" : ""}
            />
            <span>Upcoming Events</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
              {upcomingEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LOGIN APPROVALS SECTION */}
      {/* ======================================================== */}
      {activeTab === "approvals" && (
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl border border-white/15 bg-[#0b1530]/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Pending Account Approvals
                </h2>
                <p className="text-xs text-ink-soft mt-0.5">
                  Review new registration applications and grant dashboard access.
                </p>
              </div>

              {pendingMembers.length > 0 && (
                <div className="relative w-full sm:w-72">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    value={approvalSearchQuery}
                    onChange={(e) => setApprovalSearchQuery(e.target.value)}
                    placeholder="Filter pending applicants..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-primary transition"
                  />
                  {approvalSearchQuery && (
                    <button
                      onClick={() => setApprovalSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              {filteredPending.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-1">
                    No pending registration requests.
                  </h3>
                  <p className="text-xs text-ink-soft max-w-sm mx-auto">
                    All submitted registration applications have been reviewed. New applicant requests will appear here immediately.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-label uppercase tracking-wider text-ink-soft">
                      <th className="py-4 px-6 min-w-[180px]">Name</th>
                      <th className="py-4 px-4 min-w-[140px]">Year-Branch-Division</th>
                      <th className="py-4 px-4 min-w-[200px]">Email</th>
                      <th className="py-4 px-4 min-w-[160px]">Requested / Verified Role</th>
                      <th className="py-4 px-4 min-w-[100px]">Status</th>
                      <th className="py-4 px-6 text-right min-w-[180px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPending.map((member) => (
                      <tr key={member.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 px-6 font-semibold text-white">{member.name}</td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 font-mono text-xs text-ink-soft">
                            {member.year || "—"}-{member.branch || "—"}-{member.division || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-ink-soft truncate max-w-[200px]">
                          {member.email}
                        </td>
                        <td className="py-4 px-4">
                          <span className="block text-xs mb-2">
                            Requested: {member.requestedRole}
                          </span>
                          <select
                            aria-label={`Verified role for ${member.name}`}
                            value={verifiedRoles[member.id] || "Member"}
                            onChange={(e) =>
                              setVerifiedRoles((previous) => ({
                                ...previous,
                                [member.id]: e.target.value as UserRole,
                              }))
                            }
                            className="rounded-lg bg-[#0b1530] border border-white/15 px-2 py-1 text-xs"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock size={12} />
                            <span>Pending</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={busy[member.id]}
                              onClick={() =>
                                perform(member.id, () =>
                                  approveUser(member.id, verifiedRoles[member.id] || "Member")
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-label font-medium text-xs transition shadow-sm flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectingMember(member)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-label font-medium text-xs transition flex items-center gap-1.5"
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MEMBER AICTE POINTS MANAGEMENT SECTION */}
      {/* ======================================================== */}
      {activeTab === "member-update" && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Section Page Heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-white/15 bg-gradient-to-r from-[#0b1530]/90 via-[#0e1b3d]/80 to-[#0b1530]/90 backdrop-blur-2xl shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-label uppercase tracking-widest mb-1">
                <Award size={14} />
                <span>Normalized AICTE Activity Registry</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Member AICTE Points
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1 max-w-2xl">
                Allot AICTE points to approved members for completed club events using either hours-based calculation ({hoursPerPoint} completed hours = 1 AICTE point) or direct point entry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMembersModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-label font-semibold text-xs uppercase tracking-wider transition flex items-center gap-2"
              >
                <Users size={15} />
                <span>Approved Members ({approvedMembers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setIsAddEventOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition flex items-center gap-2"
              >
                <Plus size={15} />
                <span>+ Add AICTE Dropdown Event</span>
              </button>
            </div>
          </div>

          {/* 1. AICTE ALLOCATION FORM */}
          <div
            ref={formRef}
            className="rounded-3xl border border-white/15 bg-[#0b1530]/85 backdrop-blur-2xl shadow-2xl overflow-visible scroll-mt-28"
          >
            <div className="px-6 sm:px-8 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/15 via-transparent to-amber-500/5 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Award size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                      {editingAllocation
                        ? "Edit Member AICTE Allocation"
                        : "Allot AICTE Points to Member"}
                    </h3>
                    {editingAllocation && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-label uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        Editing Existing Record
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Click the member and event boxes below to search in real time, choose an allocation method, and review the summary before saving.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMembersModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-emerald-300 text-xs font-label font-medium flex items-center gap-1.5 transition"
                >
                  <Users size={14} />
                  <span>View Approved Members List ({approvedMembers.length})</span>
                </button>

                {(editingAllocation || selectedMemberId || selectedEventId) && (
                  <button
                    type="button"
                    onClick={resetAllocationForm}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-label flex items-center gap-1.5 transition"
                  >
                    <X size={14} />
                    <span>{editingAllocation ? "Cancel Edit" : "Clear Selection"}</span>
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleAllocationSubmit} className="p-6 sm:p-8 space-y-6">
              {formError && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-3"
                >
                  <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Duplicate Allocation Warning Banner */}
              {!editingAllocation && existingDuplicateAllocation && (
                <div
                  role="status"
                  className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">
                        Duplicate Allocation Detected
                      </p>
                      <p className="text-xs text-amber-200/90 mt-0.5">
                        <strong>{selectedMember?.name}</strong> already has an AICTE record for{" "}
                        <strong>{existingDuplicateAllocation.eventName}</strong> (
                        {existingDuplicateAllocation.academicYear}):{" "}
                        <strong>{existingDuplicateAllocation.aictePoints} pts</strong> (
                        {existingDuplicateAllocation.allocationMethod === "hours"
                          ? `${existingDuplicateAllocation.hours} hrs`
                          : "Direct Points"}
                        ).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartEditAllocation(existingDuplicateAllocation)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-label font-bold text-xs uppercase tracking-wider shrink-0 transition flex items-center gap-1.5"
                  >
                    <Edit3 size={14} />
                    <span>Edit Existing Record</span>
                  </button>
                </div>
              )}

              {/* Row 1: Single-Input Real-Time Comboboxes for Member & Completed Event */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1A. Unified Searchable Member Combobox */}
                <div
                  ref={memberDropdownRef}
                  className="relative p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="allocation-member-combobox"
                      className="text-xs font-label uppercase tracking-wider text-white/90 font-semibold"
                    >
                      1. Select Approved Member <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsMembersModalOpen(true)}
                      className="text-[11px] text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      <Users size={12} />
                      <span>All Members ({approvedMembers.length})</span>
                    </button>
                  </div>

                  {selectedMember ? (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-white">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-sm font-semibold text-white truncate">
                            {selectedMember.name}
                          </div>
                          <div className="text-[11px] text-emerald-200/80 font-mono truncate">
                            {selectedMember.year || "—"}-{selectedMember.branch || "—"}-
                            {selectedMember.division || "—"} • {selectedMember.email}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelectedMember}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/90 font-label shrink-0 flex items-center gap-1 transition"
                        aria-label="Change selected member"
                      >
                        <X size={13} />
                        <span>Change</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                      />
                      <input
                        ref={memberInputRef}
                        id="allocation-member-combobox"
                        type="text"
                        autoComplete="off"
                        value={memberSelectorSearch}
                        onFocus={() => setIsMemberDropdownOpen(true)}
                        onClick={() => setIsMemberDropdownOpen(true)}
                        onChange={(e) => {
                          setMemberSelectorSearch(e.target.value);
                          setIsMemberDropdownOpen(true);
                        }}
                        placeholder="Click here and type member name to search..."
                        aria-label="Search and select approved member"
                        aria-expanded={isMemberDropdownOpen}
                        className="w-full pl-10 pr-9 py-3 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                      <button
                        type="button"
                        onClick={() => setIsMemberDropdownOpen((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        aria-label="Toggle member dropdown list"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}

                  {/* Floating Real-Time Member Dropdown List */}
                  {!selectedMember && isMemberDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Matching Approved Members"
                      className="absolute left-4 right-4 top-[calc(100%-8px)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-white/20 bg-[#070d1f] shadow-[0_20px_50px_rgba(0,0,0,0.85)] divide-y divide-white/5"
                    >
                      {selectableMembers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-ink-soft">
                          No approved members match &ldquo;{memberSelectorSearch}&rdquo;.
                        </div>
                      ) : (
                        selectableMembers.map((member) => {
                          const mSum = memberSummaries.get(member.id);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              role="option"
                              aria-selected={selectedMemberId === member.id}
                              onClick={() => handleSelectMember(member)}
                              className="w-full text-left px-4 py-3 hover:bg-primary/20 focus:bg-primary/20 transition flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-white truncate">
                                  {member.name}
                                </div>
                                <div className="text-[11px] text-ink-soft font-mono truncate">
                                  {member.year || "—"}-{member.branch || "—"}-
                                  {member.division || "—"} • {member.email}
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/[0.06] text-amber-300 shrink-0">
                                {mSum?.formattedPoints || "0"} pts
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-ink-soft">
                    {selectedMember
                      ? `Selected: ${selectedMember.name} (${selectedMember.role})`
                      : "No member selected yet. Click the box above and type to filter members in real time."}
                  </p>
                </div>

                {/* 1B. Unified Searchable Completed Event Combobox */}
                <div
                  ref={eventDropdownRef}
                  className="relative p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="allocation-event-combobox"
                      className="text-xs font-label uppercase tracking-wider text-white/90 font-semibold"
                    >
                      2. Select Completed Event <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(null);
                        setIsAddEventOpen(true);
                      }}
                      className="text-[11px] text-primary-light hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Add to AICTE Dropdown</span>
                    </button>
                  </div>

                  {selectedEvent ? (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-white">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-sm font-semibold text-white truncate">
                            {selectedEvent.name} — {selectedEvent.academicYear}
                          </div>
                          <div className="text-[11px] text-emerald-200/80 font-mono truncate">
                            Date: {formatEventDateDisplay(selectedEvent.date)} • Default:{" "}
                            {selectedEvent.aicteHours} hrs
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(selectedEvent);
                            setIsAddEventOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                          title={`Edit ${selectedEvent.name}`}
                          aria-label={`Edit ${selectedEvent.name}`}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDropdownEvent(selectedEvent)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 hover:text-white transition"
                          title={`Delete ${selectedEvent.name} from dropdown`}
                          aria-label={`Delete ${selectedEvent.name} from dropdown`}
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={handleClearSelectedEvent}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/90 font-label flex items-center gap-1 transition"
                          aria-label="Change selected event"
                        >
                          <X size={13} />
                          <span>Change</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                      />
                      <input
                        ref={eventInputRef}
                        id="allocation-event-combobox"
                        type="text"
                        autoComplete="off"
                        value={eventSelectorSearch}
                        onFocus={() => setIsEventDropdownOpen(true)}
                        onClick={() => setIsEventDropdownOpen(true)}
                        onChange={(e) => {
                          setEventSelectorSearch(e.target.value);
                          setIsEventDropdownOpen(true);
                        }}
                        placeholder="Click here and type event name or year to search..."
                        aria-label="Search and select completed event"
                        aria-expanded={isEventDropdownOpen}
                        className="w-full pl-10 pr-9 py-3 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEventDropdownOpen((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        aria-label="Toggle event dropdown list"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}

                  {/* Floating Real-Time Completed Event Dropdown List */}
                  {!selectedEvent && isEventDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Matching Completed Events"
                      className="absolute left-4 right-4 top-[calc(100%-8px)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-white/20 bg-[#070d1f] shadow-[0_20px_50px_rgba(0,0,0,0.85)] divide-y divide-white/5"
                    >
                      {selectableCompletedEvents.length === 0 ? (
                        <div className="p-4 text-center text-xs text-ink-soft">
                          No completed events match &ldquo;{eventSelectorSearch}&rdquo;.
                        </div>
                      ) : (
                        selectableCompletedEvents.map((event) => (
                          <div
                            key={event.id}
                            role="option"
                            aria-selected={selectedEventId === event.id}
                            className="w-full px-4 py-2.5 hover:bg-primary/20 focus-within:bg-primary/20 transition flex items-center justify-between gap-2 group"
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectEvent(event.id)}
                              className="flex-1 text-left min-w-0 py-0.5"
                            >
                              <div className="font-semibold text-sm text-white truncate">
                                {event.name} —{" "}
                                <span className="text-primary-light font-mono">
                                  {event.academicYear}
                                </span>
                              </div>
                              <div className="text-[11px] text-ink-soft truncate">
                                {formatEventDateDisplay(event.date)}
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/[0.06] text-ink-soft">
                                {event.aicteHours} hrs
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEventDropdownOpen(false);
                                  setEditingEvent(event);
                                  setIsAddEventOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-primary/30 text-white/60 hover:text-white border border-white/10 transition"
                                title={`Edit ${event.name}`}
                                aria-label={`Edit ${event.name}`}
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEventDropdownOpen(false);
                                  setDeletingDropdownEvent(event);
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/35 text-rose-300 hover:text-white border border-rose-500/30 transition"
                                title={`Delete ${event.name} from dropdown`}
                                aria-label={`Delete ${event.name} from dropdown`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-ink-soft">
                    {selectedEvent
                      ? `Selected: ${selectedEvent.name} — ${selectedEvent.academicYear}`
                      : `No event selected yet. Click the box above to browse ${completedEvents.length} completed events (sorted A–Z).`}
                  </p>
                </div>
              </div>

              {/* Row 2: Academic Year Stamp & Mutually Exclusive Allocation Method */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2A. Academic Year / Year Stamp */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="allocation-academic-year"
                      className="text-xs font-label uppercase tracking-wider text-white/90 font-semibold"
                    >
                      3. Academic Year Stamp <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomAllocationYear(!isCustomAllocationYear)}
                      className="text-[11px] text-primary-light hover:underline"
                    >
                      {isCustomAllocationYear ? "Select from list" : "Custom session"}
                    </button>
                  </div>

                  {isCustomAllocationYear ? (
                    <input
                      id="allocation-academic-year"
                      type="text"
                      value={customAllocationYear}
                      onChange={(e) => setCustomAllocationYear(e.target.value)}
                      placeholder="e.g. 2026-27"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm focus:outline-none focus:border-primary transition"
                    />
                  ) : (
                    <select
                      id="allocation-academic-year"
                      aria-label="Allocation Academic Year"
                      value={selectedAcademicYear || effectiveAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm focus:outline-none focus:border-primary transition"
                    >
                      {academicYears.map((yr) => (
                        <option key={yr} value={yr} className="bg-[#070d1f]">
                          {yr}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="text-[11px] text-ink-soft">
                    {selectedEvent
                      ? `Auto-populated from selected event (${selectedEvent.academicYear}), or selectable by admin.`
                      : "Select an event to auto-populate its academic year, or choose manually."}
                  </p>
                </div>

                {/* 2B. Allocation Method Selector & Value Input */}
                <div className="lg:col-span-2 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-label uppercase tracking-wider text-white/90 font-semibold">
                      4. AICTE Point Allocation Method <span className="text-rose-400">*</span>
                    </span>

                    <div
                      className="inline-flex rounded-xl bg-[#070d1f] p-1 border border-white/15"
                      role="radiogroup"
                      aria-label="AICTE Allocation Method"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={allocationMethod === "hours"}
                        onClick={() => handleSwitchMethod("hours")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-label font-semibold flex items-center gap-1.5 transition ${
                          allocationMethod === "hours"
                            ? "bg-primary text-white shadow"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <Calculator size={14} />
                        <span>Hours-Based ({hoursPerPoint} hrs = 1 pt)</span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={allocationMethod === "direct"}
                        onClick={() => handleSwitchMethod("direct")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-label font-semibold flex items-center gap-1.5 transition ${
                          allocationMethod === "direct"
                            ? "bg-amber-500 text-slate-950 shadow"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <Sliders size={14} />
                        <span>Direct AICTE Points</span>
                      </button>
                    </div>
                  </div>

                  {/* Mutually Exclusive Input Area */}
                  {allocationMethod === "hours" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <label
                          htmlFor="allocation-hours-input"
                          className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
                        >
                          Credited Hours Attended <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="allocation-hours-input"
                          type="number"
                          min="0"
                          max="10000"
                          step="0.5"
                          required
                          value={hoursInput}
                          onChange={(e) => setHoursInput(e.target.value)}
                          placeholder="e.g. 4"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm focus:outline-none focus:border-primary transition"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30">
                        <p className="text-[11px] font-label uppercase tracking-wider text-primary-light">
                          Calculated AICTE Points
                        </p>
                        <p className="font-display text-2xl font-bold text-amber-300 mt-0.5">
                          {previewAllocationPoints !== null
                            ? formatCleanNumber(previewAllocationPoints)
                            : "—"}{" "}
                          <span className="text-xs font-normal text-white/70">point(s)</span>
                        </p>
                        <p className="text-[11px] text-ink-soft mt-1">
                          Rule: {hoursPerPoint} completed hours = 1 AICTE point. Partial hours (&lt; {hoursPerPoint} hrs) do not award fractional points.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <label
                          htmlFor="allocation-direct-points-input"
                          className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
                        >
                          Direct AICTE Points <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="allocation-direct-points-input"
                          type="number"
                          min="0"
                          max="2500"
                          step="0.5"
                          required
                          value={directPointsInput}
                          onChange={(e) => setDirectPointsInput(e.target.value)}
                          placeholder="e.g. 2"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <p className="text-[11px] font-label uppercase tracking-wider text-amber-300">
                          Direct Point Credit
                        </p>
                        <p className="font-display text-2xl font-bold text-amber-300 mt-0.5">
                          {previewAllocationPoints !== null
                            ? formatCleanNumber(previewAllocationPoints)
                            : "—"}{" "}
                          <span className="text-xs font-normal text-white/70">point(s)</span>
                        </p>
                        <p className="text-[11px] text-ink-soft mt-1">
                          Hours are disabled in Direct mode so hours and direct points are never active simultaneously.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-Save Summary Box */}
              <div
                aria-label="Allocation Summary Before Saving"
                className="p-5 rounded-2xl bg-[#070d1f]/90 border border-white/15 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-label uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Pre-Save Allocation Summary</span>
                  </span>
                  <span className="text-[11px] text-ink-soft">
                    Verify details before committing to member history
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                  <div>
                    <span className="text-ink-soft block">Member Name</span>
                    <strong className="text-white font-semibold mt-0.5 block truncate">
                      {selectedMember?.name || "Not selected"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block">Event Name</span>
                    <strong className="text-white font-semibold mt-0.5 block truncate">
                      {selectedEvent?.name || "Not selected"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block">Academic Year</span>
                    <strong className="text-primary-light font-mono mt-0.5 block">
                      {selectedEvent || selectedAcademicYear ? effectiveAcademicYear : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block">Event Date</span>
                    <strong className="text-white mt-0.5 block">
                      {selectedEvent ? formatEventDateDisplay(selectedEvent.date) : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block">Method &amp; Hours</span>
                    <strong className="text-white mt-0.5 block">
                      {allocationMethod === "hours"
                        ? `Hours-based (${hoursInput || "0"} hrs)`
                        : "Direct Points (N/A hrs)"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block">AICTE Points</span>
                    <strong className="text-amber-300 font-mono text-base font-bold mt-0.5 block">
                      {previewAllocationPoints !== null
                        ? `${formatCleanNumber(previewAllocationPoints)} pts`
                        : "—"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Submit / Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsMembersModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-label font-medium text-xs transition flex items-center gap-2"
                >
                  <Users size={15} className="text-emerald-400" />
                  <span>See Approved Members &amp; Point Details ({approvedMembers.length})</span>
                </button>

                <div className="flex flex-wrap items-center gap-3 ml-auto">
                  {editingAllocation && (
                    <button
                      type="button"
                      onClick={() => setRevokingAllocation(editingAllocation)}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-label font-semibold text-xs uppercase tracking-wider transition flex items-center gap-2"
                    >
                      <Trash2 size={15} />
                      <span>Revoke This Allocation</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isSavingAllocation ||
                      !selectedMember ||
                      !selectedEvent ||
                      (!editingAllocation && Boolean(existingDuplicateAllocation))
                    }
                    className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center gap-2 disabled:opacity-50"
                  >
                    <Check size={16} />
                    <span>
                      {editingAllocation
                        ? "Update AICTE Allocation"
                        : "Save AICTE Allocation"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* 2. MANAGE AICTE DROPDOWN EVENTS SECTION */}
          <div className="rounded-3xl border border-white/15 bg-[#0b1530]/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-primary-light" />
                  <h3 className="font-display text-xl font-bold text-white">
                    Manage AICTE Dropdown Events
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-label bg-white/[0.06] text-ink-soft">
                    {allEvents.length} Total
                  </span>
                </div>
                <p className="text-xs text-ink-soft mt-1">
                  Events listed here populate the AICTE Point Allocation dropdown above.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setIsAddEventOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>+ Add AICTE Dropdown Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManageEvents(!showManageEvents)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-label flex items-center gap-1.5 transition"
                >
                  <span>{showManageEvents ? "Collapse" : "Expand"}</span>
                  {showManageEvents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {showManageEvents && (
              <div>
                {/* Filter Bar */}
                <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {(["all", "completed", "upcoming", "archived"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEventStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-label uppercase tracking-wider transition ${
                          eventStatusFilter === st
                            ? "bg-primary text-white font-semibold"
                            : "bg-white/[0.05] text-white/60 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="w-full sm:w-64">
                      <CalendarDatePicker
                        id="admin-manage-events-date-filter"
                        value={eventManagerDateFilter}
                        onChange={setEventManagerDateFilter}
                        outputFormat="iso"
                        placeholder="Filter by calendar date..."
                        highlightedIsoDates={
                          Array.from(
                            new Set(
                              allEvents
                                .map((e) => toIsoKey(e.date))
                                .filter((d): d is string => Boolean(d))
                            )
                          )
                        }
                        allowClear={true}
                      />
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        type="text"
                        value={eventManagerSearch}
                        onChange={(e) => setEventManagerSearch(e.target.value)}
                        placeholder="Filter dropdown events by name or year..."
                        aria-label="Filter managed events"
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-white text-xs placeholder-white/35 focus:outline-none focus:border-primary transition"
                      />
                      {eventManagerSearch && (
                        <button
                          type="button"
                          onClick={() => setEventManagerSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Events Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-label uppercase tracking-wider text-ink-soft">
                        <th className="py-3.5 px-6 min-w-[220px]">Event Name (A–Z)</th>
                        <th className="py-3.5 px-4 min-w-[120px]">Academic Year</th>
                        <th className="py-3.5 px-4 min-w-[130px]">Event Date</th>
                        <th className="py-3.5 px-4 min-w-[100px]">Default Hours</th>
                        <th className="py-3.5 px-4 min-w-[120px]">Status</th>
                        <th className="py-3.5 px-4 min-w-[110px]">Allocations</th>
                        <th className="py-3.5 px-6 text-right min-w-[230px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredManagedEvents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 text-center text-xs text-ink-soft italic"
                          >
                            No events match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredManagedEvents.map((evt) => {
                          const effStatus = getEffectiveEventStatus(evt);
                          const linkedCount = allocations.filter(
                            (a) => a.eventId === evt.id
                          ).length;

                          return (
                            <tr
                              key={evt.id}
                              className="hover:bg-white/[0.03] transition-colors"
                            >
                              <td className="py-3.5 px-6 font-semibold text-white">
                                <div>{evt.name}</div>
                                {evt.description && (
                                  <div className="text-[11px] text-ink-soft font-normal truncate max-w-xs">
                                    {evt.description}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs text-primary-light">
                                {evt.academicYear}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-ink-soft">
                                {formatEventDateDisplay(evt.date)}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs text-white">
                                {evt.aicteHours} hrs
                              </td>
                              <td className="py-3.5 px-4">
                                {effStatus === "completed" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 size={12} />
                                    <span>Completed</span>
                                  </span>
                                ) : effStatus === "upcoming" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <Clock size={12} />
                                    <span>Upcoming</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/60 border border-white/20">
                                    <Archive size={12} />
                                    <span>Archived</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-mono text-ink-soft">
                                {linkedCount} record{linkedCount === 1 ? "" : "s"}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {effStatus === "upcoming" && (
                                    <button
                                      type="button"
                                      disabled={busy[`evt:${evt.id}`]}
                                      onClick={() =>
                                        perform(`evt:${evt.id}`, () =>
                                          editEvent(evt, {
                                            status: "completed",
                                            archived: false,
                                          })
                                        )
                                      }
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-label transition flex items-center gap-1"
                                    >
                                      <CheckCircle2 size={12} />
                                      <span>Mark Completed</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEvent(evt);
                                      setIsAddEventOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-label transition flex items-center gap-1"
                                  >
                                    <Edit3 size={12} />
                                    <span>Edit</span>
                                  </button>

                                  {effStatus === "archived" ? (
                                    <button
                                      type="button"
                                      disabled={busy[`arch:${evt.id}`]}
                                      onClick={() =>
                                        perform(`arch:${evt.id}`, () =>
                                          archiveEventRecord(evt, false)
                                        )
                                      }
                                      className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light text-xs font-label transition flex items-center gap-1"
                                    >
                                      <RotateCcw size={12} />
                                      <span>Restore</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setArchivingEvent(evt)}
                                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-white/70 hover:text-amber-300 text-xs font-label transition flex items-center gap-1"
                                    >
                                      <Archive size={12} />
                                      <span>Archive</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setDeletingDropdownEvent(evt)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-label transition flex items-center gap-1"
                                    title={`Delete ${evt.name} from dropdown`}
                                    aria-label={`Delete ${evt.name}`}
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: WEBSITE EVENTS SHOWCASE (PERMANENT BY ACADEMIC YEAR) */}
      {/* ======================================================== */}
      {activeTab === "showcase-events" && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-white/15 bg-gradient-to-r from-[#0b1530]/90 via-[#0e1b3d]/80 to-[#0b1530]/90 backdrop-blur-2xl shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-label uppercase tracking-widest mb-1">
                <Images size={14} />
                <span>2. Permanent Website Events Showcase</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Website Events &amp; Gallery by Academic Year
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1 max-w-2xl">
                Publish permanent club events into any academic year (e.g. 2026-27, 2025-26, 2024-25). Upload cover images and gallery photos anytime — members can view full details and browse photos in read-only mode.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingShowcaseEvent(null);
                  setIsShowcaseModalOpen(true);
                }}
                className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center gap-2"
              >
                <Plus size={16} />
                <span>+ Publish Website Event</span>
              </button>
            </div>
          </div>

          {/* Academic Year Filter Buttons & Search */}
          <div className="p-5 rounded-3xl border border-white/15 bg-[#0b1530]/80 backdrop-blur-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowcaseYearFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-label font-semibold uppercase tracking-wider transition ${
                  showcaseYearFilter === "all"
                    ? "bg-primary text-white shadow"
                    : "bg-white/[0.05] text-white/60 hover:text-white"
                }`}
              >
                All Years ({totalShowcaseEventsCount})
              </button>
              {mergedYearEvents.map((yg) => {
                const normYr = normalizeAcademicYear(yg.year);
                return (
                  <button
                    key={yg.id}
                    type="button"
                    onClick={() => setShowcaseYearFilter(normYr)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                      showcaseYearFilter === normYr
                        ? "bg-primary text-white shadow"
                        : "bg-white/[0.05] text-white/60 hover:text-white"
                    }`}
                  >
                    {normYr} ({yg.events.length})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              <div className="w-full sm:w-64">
                <CalendarDatePicker
                  id="admin-showcase-date-filter"
                  value={showcaseDateFilter}
                  onChange={setShowcaseDateFilter}
                  outputFormat="iso"
                  placeholder="Filter by calendar date..."
                  highlightedIsoDates={
                    Array.from(
                      new Set(
                        mergedYearEvents
                          .flatMap((yg) => yg.events)
                          .map((e) => toIsoKey(e.date))
                          .filter((d): d is string => Boolean(d))
                      )
                    )
                  }
                  allowClear={true}
                />
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type="text"
                  value={showcaseSearchQuery}
                  onChange={(e) => setShowcaseSearchQuery(e.target.value)}
                  placeholder="Search showcase events by name, category..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-white text-xs placeholder-white/35 focus:outline-none focus:border-primary"
                />
                {showcaseSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setShowcaseSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Year-wise Showcase Events Cards */}
          {mergedYearEvents
            .filter(
              (yg) =>
                showcaseYearFilter === "all" ||
                normalizeAcademicYear(yg.year) === showcaseYearFilter
            )
            .map((yg) => {
              const normYr = normalizeAcademicYear(yg.year);
              const q = showcaseSearchQuery.trim().toLowerCase();
              const filteredEvts = yg.events.filter((e) => {
                if (showcaseDateFilter && toIsoKey(e.date) !== showcaseDateFilter) {
                  return false;
                }
                if (!q) return true;
                return (
                  e.name.toLowerCase().includes(q) ||
                  e.category.toLowerCase().includes(q) ||
                  e.domain.toLowerCase().includes(q) ||
                  e.location.toLowerCase().includes(q)
                );
              });

              return (
                <div
                  key={yg.id}
                  className="rounded-3xl border border-white/15 bg-[#0b1530]/80 backdrop-blur-2xl p-6 space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-2xl font-bold text-white">
                        Academic Year {normYr}
                      </h3>
                      <span className="px-3 py-0.5 rounded-full text-xs font-label bg-primary/20 border border-primary/30 text-primary-light">
                        {filteredEvts.length} Event{filteredEvts.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingShowcaseEvent({
                          id: "",
                          academicYear: normYr,
                          name: "",
                          date: "",
                          location: "TCET Campus",
                          domain: "Technology",
                          category: "Workshop",
                          participants: "100+",
                          objective: "",
                          outcome: "",
                          description: "",
                          image: "",
                          gallery: [],
                        });
                        setIsShowcaseModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-white text-xs font-label font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus size={14} />
                      <span>+ Add Event to {normYr}</span>
                    </button>
                  </div>

                  {filteredEvts.length === 0 ? (
                    <div className="py-10 text-center text-xs text-ink-soft">
                      No events published for {normYr} yet. Click &ldquo;+ Add Event to {normYr}&rdquo; above to showcase an event here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvts.map((evt) => {
                        const photoCount = Array.from(
                          new Set([evt.image, ...(evt.gallery || [])].filter(Boolean))
                        ).length;

                        return (
                          <div
                            key={evt.id}
                            className="rounded-2xl border border-white/10 bg-[#070d1f]/90 overflow-hidden flex flex-col"
                          >
                            <div className="h-40 relative bg-[#050914] overflow-hidden">
                              <img
                                src={evt.image || placeholderImage(evt.id, 600, 400)}
                                alt={evt.name}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-primary text-white text-[11px] font-label font-semibold">
                                {evt.category}
                              </span>
                              <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/75 text-emerald-300 text-[11px] font-mono border border-white/15 flex items-center gap-1">
                                <Images size={11} />
                                <span>{photoCount} Photos</span>
                              </span>
                            </div>

                            <div className="p-4 flex-1 flex flex-col gap-1.5">
                              <h4 className="font-display font-bold text-white text-base leading-snug">
                                {evt.name}
                              </h4>
                              <div className="text-xs text-primary-light font-label font-semibold">
                                {evt.date}
                              </div>
                              <div className="text-xs text-ink-soft">
                                {evt.location} • {evt.participants} participants
                              </div>
                              <p className="text-xs text-ink-soft line-clamp-2 mt-1">
                                <strong className="text-white/80">Objective:</strong>{" "}
                                {evt.objective}
                              </p>

                              <div className="flex items-center gap-2 mt-auto pt-4">
                                <button
                                  type="button"
                                  onClick={() => handleEditShowcaseEventItem(evt, normYr)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-primary/25 hover:bg-primary/40 border border-primary/40 text-white text-xs font-label font-semibold flex items-center justify-center gap-1.5 transition"
                                >
                                  <Edit3 size={13} />
                                  <span>Edit Details &amp; Photos</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeletingShowcaseEvent({
                                      id: evt.id,
                                      name: evt.name,
                                      academicYear: normYr,
                                      date: evt.date,
                                    })
                                  }
                                  className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 transition"
                                  title="Remove from website showcase"
                                  aria-label={`Remove ${evt.name}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: UPCOMING EVENTS (FUTURE MISSIONS & REGISTRATIONS) */}
      {/* ======================================================== */}
      {activeTab === "upcoming-events" && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-amber-500/25 bg-gradient-to-r from-[#0b1530]/90 via-[#19162b]/85 to-[#0b1530]/90 backdrop-blur-2xl shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-label uppercase tracking-widest mb-1">
                <Rocket size={14} />
                <span>3. Upcoming Missions &amp; Member Registrations</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Upcoming Events Manager
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1 max-w-2xl">
                Post upcoming club events with a cover page photo, schedule, venue, and direct registration link for members. Displayed live in the website&apos;s &ldquo;Future Events&rdquo; section.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingUpcomingEvent(null);
                setIsUpcomingModalOpen(true);
              }}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-label font-bold text-xs uppercase tracking-wider transition shadow-[0_8px_24px_-6px_rgba(245,158,11,0.5)] flex items-center gap-2"
            >
              <Rocket size={16} />
              <span>+ Post Upcoming Event</span>
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-[#0b1530]/80 p-14 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 mx-auto">
                <Rocket size={26} />
              </div>
              <h3 className="font-display text-xl font-bold text-white">
                No Upcoming Events Posted Yet
              </h3>
              <p className="text-xs sm:text-sm text-ink-soft max-w-md mx-auto">
                Click &ldquo;+ Post Upcoming Event&rdquo; to upload a cover page photo, enter event details, and provide a registration link for members.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingUpcomingEvent(null);
                  setIsUpcomingModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-label font-bold text-xs uppercase tracking-wider transition inline-flex items-center gap-2"
              >
                <Plus size={15} />
                <span>Post First Upcoming Event</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((mission) => (
                <div
                  key={mission.id}
                  className="rounded-3xl border border-white/15 bg-[#0b1530]/85 overflow-hidden flex flex-col shadow-xl"
                >
                  <div className="h-44 relative bg-[#050914] overflow-hidden">
                    <img
                      src={mission.coverImage || placeholderImage(mission.id, 600, 400)}
                      alt={mission.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-label font-bold uppercase">
                      {mission.category}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/75 text-white text-[11px] font-mono border border-white/15">
                      {mission.academicYear}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-2">
                    <h3 className="font-display text-lg font-bold text-white leading-snug">
                      {mission.title}
                    </h3>
                    <div className="text-xs text-primary-light font-label font-semibold flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{mission.date}</span>
                      {mission.time && <span>• {mission.time}</span>}
                    </div>
                    <div className="text-xs text-ink-soft flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-400 shrink-0" />
                      <span>{mission.location}</span>
                    </div>
                    <p className="text-xs text-ink-soft line-clamp-2 mt-1">
                      {mission.description}
                    </p>

                    {safeExternalHref(mission.registrationLink) ? (
                      <a
                        href={safeExternalHref(mission.registrationLink)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-300 hover:underline flex items-center gap-1 mt-1 truncate"
                      >
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="truncate">{mission.registrationLink}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-white/40 italic mt-1">
                        No registration link set
                      </span>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUpcomingEvent(mission);
                          setIsUpcomingModalOpen(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-label font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit3 size={13} />
                        <span>Edit Mission</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingUpcomingEvent(mission)}
                        className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-label font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* APPROVED MEMBERS LIST & EVENT-WISE DETAILS POP-UP MODAL */}
      {/* ======================================================== */}
      {isMembersModalOpen && (
        <div
          className="fixed inset-0 z-[2650] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsMembersModalOpen(false)}
        >
          <div
            className="w-full max-w-6xl max-h-[88vh] flex flex-col rounded-3xl border border-white/15 bg-[#0b1530]/95 backdrop-blur-2xl text-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approved-members-modal-title"
          >
            {/* Modal Header & Real-Time Search Box */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-primary/15 via-transparent to-emerald-500/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <Users size={20} className="text-emerald-400" />
                  <h3
                    id="approved-members-modal-title"
                    className="font-display text-lg sm:text-xl font-bold text-white"
                  >
                    Approved Club Members — AICTE Point Registry
                  </h3>
                  <span className="px-3 py-0.5 rounded-full text-xs font-label bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                    {filteredApproved.length} Approved
                  </span>
                </div>
                <p className="text-xs text-ink-soft mt-1">
                  Sorted alphabetically by full name. Click &ldquo;View Details&rdquo; on any member to inspect or edit their event-wise AICTE history.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search box while typing */}
                <div className="relative w-full sm:w-80">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search members by name, branch, year..."
                    aria-label="Search approved members by name"
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs sm:text-sm placeholder-white/35 focus:outline-none focus:border-primary transition"
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      aria-label="Clear member search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsMembersModalOpen(false)}
                  className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white/80 hover:text-white transition shrink-0"
                  aria-label="Close Approved Members pop-up"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Members Table Inside Modal */}
            <div className="overflow-y-auto overflow-x-auto flex-1">
              {filteredApproved.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <h4 className="font-display text-lg font-bold text-white mb-1">
                    {approvedMembers.length === 0
                      ? "No Approved Members Yet"
                      : "No Matching Members Found"}
                  </h4>
                  <p className="text-xs text-ink-soft max-w-md mx-auto">
                    {approvedMembers.length === 0
                      ? "Approve pending member registrations in the Login Approvals tab to manage their AICTE points."
                      : `No approved members matched "${memberSearchQuery}".`}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 z-30 bg-[#0b1530] shadow-sm">
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-label uppercase tracking-wider text-ink-soft">
                      <th className="py-4 px-5 sticky left-0 z-20 bg-[#0b1530] min-w-[190px] shadow-[2px_0_8px_rgba(0,0,0,0.3)]">
                        Full Name (A–Z)
                      </th>
                      <th className="py-4 px-4 min-w-[180px]">Email</th>
                      <th className="py-4 px-3 min-w-[70px]">Year</th>
                      <th className="py-4 px-3 min-w-[90px]">Branch</th>
                      <th className="py-4 px-3 min-w-[70px]">Division</th>
                      <th className="py-4 px-4 min-w-[150px]">Role / Status</th>
                      <th className="py-4 px-4 text-right min-w-[140px] bg-primary/10">
                        <div className="flex items-center justify-end gap-1.5 text-white">
                          <Award size={14} className="text-amber-400" />
                          <span>Total AICTE</span>
                        </div>
                      </th>
                      <th className="py-4 px-5 text-right min-w-[210px]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {filteredApproved.map((member) => {
                      const summary = memberSummaries.get(member.id) || {
                        totalPoints: 0,
                        formattedPoints: "0",
                        totalHours: 0,
                        formattedHours: "0",
                        count: 0,
                        history: [],
                      };
                      const isExpanded = Boolean(expandedMemberIds[member.id]);

                      return (
                        <React.Fragment key={member.id}>
                          <tr className="hover:bg-white/[0.03] transition-colors group">
                            <td className="py-4 px-5 sticky left-0 z-10 bg-[#0b1530] group-hover:bg-[#0e1b3d] shadow-[2px_0_8px_rgba(0,0,0,0.3)] transition-colors">
                              <div className="font-semibold text-white">{member.name}</div>
                              <div className="text-[11px] text-ink-soft font-mono">
                                Session: {member.academicYear || "—"}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-xs font-mono text-ink-soft truncate max-w-[200px]">
                              {member.email}
                            </td>

                            <td className="py-4 px-3 font-mono text-xs text-white">
                              {member.year || "—"}
                            </td>

                            <td className="py-4 px-3 font-mono text-xs text-ink-soft">
                              {member.branch || "—"}
                            </td>

                            <td className="py-4 px-3 font-mono text-xs text-ink-soft">
                              {member.division || "—"}
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-xs font-medium text-white">
                                  {member.role}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 size={10} />
                                  <span>Approved</span>
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-right font-mono bg-primary/5 group-hover:bg-primary/10 transition-colors">
                              <div>
                                <span
                                  className={`text-base font-bold ${
                                    summary.totalPoints > 0
                                      ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                                      : "text-white/40"
                                  }`}
                                >
                                  {summary.formattedPoints}
                                </span>
                                <span className="text-[10px] text-white/50 ml-1">pts</span>
                              </div>
                              <div className="text-[10px] text-ink-soft">
                                {summary.count} event{summary.count === 1 ? "" : "s"} •{" "}
                                {summary.formattedHours} hrs
                              </div>
                            </td>

                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleMemberHistory(member.id)}
                                  aria-expanded={isExpanded}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-label font-medium transition flex items-center gap-1.5 ${
                                    isExpanded
                                      ? "bg-primary/25 border-primary/50 text-white"
                                      : "bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-white/90"
                                  }`}
                                >
                                  <History size={13} />
                                  <span>
                                    {isExpanded ? "Hide History" : `View Details (${summary.count})`}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp size={13} />
                                  ) : (
                                    <ChevronDown size={13} />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuickSelectMemberForAllocation(member)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-label font-semibold transition flex items-center gap-1"
                                  title={`Select ${member.name} in allocation form`}
                                >
                                  <Plus size={13} />
                                  <span>Allot</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Event-Wise Point History Section */}
                          {isExpanded && (
                            <tr className="bg-[#070d1f]/90">
                              <td colSpan={8} className="p-5 sm:p-6 border-t border-white/10">
                                <div className="rounded-2xl border border-white/15 bg-[#0b1530]/90 p-5 space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                                    <div>
                                      <h4 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                        <History size={17} className="text-primary-light" />
                                        <span>
                                          Event-Wise AICTE History — {member.name}
                                        </span>
                                      </h4>
                                      <p className="text-xs text-ink-soft mt-0.5">
                                        {member.year}-{member.branch}-{member.division} •{" "}
                                        {member.email} • {member.role}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-right">
                                        <span className="text-[10px] font-label uppercase tracking-wider text-amber-200 block">
                                          Total AICTE Points Earned
                                        </span>
                                        <span className="font-mono text-lg font-extrabold text-amber-300">
                                          {summary.formattedPoints} pts
                                        </span>
                                        <span className="text-[11px] text-ink-soft ml-2">
                                          ({summary.formattedHours} hrs across {summary.count}{" "}
                                          event{summary.count === 1 ? "" : "s"})
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickSelectMemberForAllocation(member)
                                        }
                                        className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-label font-semibold transition flex items-center gap-1.5"
                                      >
                                        <Plus size={14} />
                                        <span>Allot Points to {member.name.split(" ")[0]}</span>
                                      </button>
                                    </div>
                                  </div>

                                  {summary.history.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-ink-soft">
                                      No AICTE point allocations recorded for {member.name} yet. Click &ldquo;Allot&rdquo; to select this member in the form.
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                        <thead>
                                          <tr className="border-b border-white/10 text-[11px] font-label uppercase tracking-wider text-ink-soft">
                                            <th className="py-3 px-4">Event Name</th>
                                            <th className="py-3 px-3">Event Date</th>
                                            <th className="py-3 px-3">Academic Year</th>
                                            <th className="py-3 px-3">Allocation Method</th>
                                            <th className="py-3 px-3 text-right">Hours</th>
                                            <th className="py-3 px-3 text-right">AICTE Points</th>
                                            <th className="py-3 px-3">Last Updated</th>
                                            <th className="py-3 px-4 text-right">
                                              Admin Controls
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                          {summary.history.map((record) => (
                                            <tr
                                              key={record.id}
                                              className="hover:bg-white/[0.03] transition-colors"
                                            >
                                              <td className="py-3 px-4 font-semibold text-white">
                                                {record.eventName}
                                              </td>
                                              <td className="py-3 px-3 text-ink-soft">
                                                {formatEventDateDisplay(record.eventDate)}
                                              </td>
                                              <td className="py-3 px-3 font-mono text-primary-light">
                                                {record.academicYear}
                                              </td>
                                              <td className="py-3 px-3">
                                                <span
                                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                                    record.allocationMethod === "hours"
                                                      ? "bg-primary/20 text-blue-300 border border-primary/30"
                                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                                  }`}
                                                >
                                                  {record.allocationMethod === "hours"
                                                    ? "Hours-Based"
                                                    : "Direct Points"}
                                                </span>
                                              </td>
                                              <td className="py-3 px-3 text-right font-mono text-ink-soft">
                                                {record.allocationMethod === "hours" &&
                                                record.hours !== null
                                                  ? `${formatCleanNumber(record.hours)} hrs`
                                                  : "—"}
                                              </td>
                                              <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                                                {formatCleanNumber(record.aictePoints)} pts
                                              </td>
                                              <td className="py-3 px-3 text-xs text-ink-soft">
                                                {record.updatedAt
                                                  ? formatEventDateDisplay(record.updatedAt)
                                                  : "Recorded"}
                                              </td>
                                              <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleStartEditAllocation(record)
                                                    }
                                                    className="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-label flex items-center gap-1 transition"
                                                    aria-label={`Edit allocation for ${member.name} in ${record.eventName}`}
                                                  >
                                                    <Edit3 size={12} />
                                                    <span>Edit</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setRevokingAllocation(record)
                                                    }
                                                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-label flex items-center gap-1 transition"
                                                    aria-label={`Delete allocation for ${member.name} in ${record.eventName}`}
                                                  >
                                                    <Trash2 size={12} />
                                                    <span>Delete</span>
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#070d1f]/90 flex items-center justify-between text-xs text-ink-soft">
              <span>
                Showing {filteredApproved.length} of {approvedMembers.length} approved member(s)
              </span>
              <button
                type="button"
                onClick={() => setIsMembersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-label font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REVOKE ALLOCATION CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {revokingAllocation && (
        <div
          className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setRevokingAllocation(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-3xl border border-rose-500/30 bg-[#160b14]/95 backdrop-blur-2xl text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-allocation-title"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 id="revoke-allocation-title" className="font-display text-xl font-bold mb-2">
              Revoke AICTE Point Allocation?
            </h3>

            <p className="text-xs text-ink-soft mb-4 leading-relaxed">
              Are you sure you want to remove the AICTE allocation for{" "}
              <strong className="text-white">
                {approvedMembers.find((m) => m.id === revokingAllocation.memberId)?.name ||
                  "Member"}
              </strong>{" "}
              in <strong className="text-white">{revokingAllocation.eventName}</strong> (
              {revokingAllocation.academicYear})? This will deduct{" "}
              <strong className="text-amber-300">
                {formatCleanNumber(revokingAllocation.aictePoints)} AICTE point(s)
              </strong>{" "}
              from their total immediately.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevokingAllocation(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-label transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeAllocation}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-label font-medium transition"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ARCHIVE EVENT CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {archivingEvent && (
        <div
          className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setArchivingEvent(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-3xl border border-amber-500/30 bg-[#0b1530]/95 backdrop-blur-2xl text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-event-title"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-4">
              <Info size={24} />
            </div>

            <h3 id="archive-event-title" className="font-display text-xl font-bold mb-2">
              Archive Event Safely?
            </h3>

            <p className="text-xs text-ink-soft mb-4 leading-relaxed">
              Archiving <strong className="text-white">{archivingEvent.name}</strong> (
              {archivingEvent.academicYear}) will remove it from the active event dropdown for new allocations, while preserving all existing member AICTE point records and history intact.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setArchivingEvent(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-label transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchiveEvent}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-label font-bold transition"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE AICTE DROPDOWN EVENT CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingDropdownEvent && (
        <div
          className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeletingDropdownEvent(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-3xl border border-rose-500/35 bg-[#160b14]/95 backdrop-blur-2xl text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dropdown-event-title"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3
              id="delete-dropdown-event-title"
              className="font-display text-xl font-bold mb-2"
            >
              Remove Event from AICTE Dropdown?
            </h3>

            <p className="text-xs text-ink-soft mb-5 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-white">{deletingDropdownEvent.name}</strong> (
              {deletingDropdownEvent.academicYear} •{" "}
              {formatEventDateDisplay(deletingDropdownEvent.date)}) from the AICTE event
              dropdown? Existing member AICTE point history will remain safely preserved.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingDropdownEvent(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-label transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDropdownEvent}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-label font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE WEBSITE SHOWCASE EVENT CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingShowcaseEvent && (
        <div
          className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeletingShowcaseEvent(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-3xl border border-rose-500/35 bg-[#160b14]/95 backdrop-blur-2xl text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-showcase-event-title"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3
              id="delete-showcase-event-title"
              className="font-display text-xl font-bold mb-2"
            >
              Remove Event from Website Showcase?
            </h3>

            <p className="text-xs text-ink-soft mb-5 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-white">{deletingShowcaseEvent.name}</strong> (
              {deletingShowcaseEvent.academicYear}
              {deletingShowcaseEvent.date ? ` • ${deletingShowcaseEvent.date}` : ""}) from the
              website&apos;s permanent Events section? Please confirm to prevent accidental deletion.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingShowcaseEvent(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-label transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShowcaseEvent}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-label font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE UPCOMING EVENT CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingUpcomingEvent && (
        <div
          className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeletingUpcomingEvent(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-3xl border border-rose-500/35 bg-[#160b14]/95 backdrop-blur-2xl text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-upcoming-event-title"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3
              id="delete-upcoming-event-title"
              className="font-display text-xl font-bold mb-2"
            >
              Remove Upcoming Event?
            </h3>

            <p className="text-xs text-ink-soft mb-5 leading-relaxed">
              Are you sure you want to remove the upcoming mission{" "}
              <strong className="text-white">{deletingUpcomingEvent.title}</strong> (
              {deletingUpcomingEvent.academicYear}
              {deletingUpcomingEvent.date ? ` • ${deletingUpcomingEvent.date}` : ""}) from the
              Future Events section? Please confirm to prevent accidental deletion.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingUpcomingEvent(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-label transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUpcomingEvent}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-label font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REJECTION CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {rejectingMember && (
        <div
          className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setRejectingMember(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-3xl border border-rose-500/30 bg-[#160b14]/95 backdrop-blur-2xl text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="font-display text-xl font-bold mb-2">
              Reject Registration Application?
            </h3>

            <p className="text-xs text-ink-soft mb-4 leading-relaxed">
              Are you sure you want to reject the registration request for{" "}
              <strong className="text-white">{rejectingMember.name}</strong> (
              {rejectingMember.email})? This user will not receive dashboard access.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Rejection Reason (optional)
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete verification or duplicate"
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-rose-400 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectingMember(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-label transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-label font-medium transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. AICTE DROPDOWN EVENT MODAL */}
      <AddEventModal
        key={editingEvent ? `edit-${editingEvent.id}` : `add-${settings.currentAcademicYear}`}
        defaultAcademicYear={settings.currentAcademicYear}
        editingEvent={editingEvent}
        isOpen={isAddEventOpen}
        onClose={() => {
          setIsAddEventOpen(false);
          setEditingEvent(null);
        }}
        onEventCreated={(created) => {
          if (isEventSelectableForAllocation(created)) {
            handleSelectEvent(created.id);
          }
        }}
      />

      {/* 2. PERMANENT WEBSITE SHOWCASE EVENT MODAL (BY ACADEMIC YEAR) */}
      <ShowcaseEventModal
        key={
          editingShowcaseEvent
            ? `showcase-${editingShowcaseEvent.id}-${editingShowcaseEvent.academicYear}`
            : `showcase-new-${settings.currentAcademicYear}`
        }
        isOpen={isShowcaseModalOpen}
        onClose={() => {
          setIsShowcaseModalOpen(false);
          setEditingShowcaseEvent(null);
        }}
        defaultAcademicYear={settings.currentAcademicYear}
        editingEvent={editingShowcaseEvent}
      />

      {/* 3. UPCOMING EVENT MODAL (WITH COVER PHOTO & REGISTRATION LINK) */}
      <UpcomingEventModal
        key={
          editingUpcomingEvent
            ? `upcoming-${editingUpcomingEvent.id}`
            : `upcoming-new-${settings.currentAcademicYear}`
        }
        isOpen={isUpcomingModalOpen}
        onClose={() => {
          setIsUpcomingModalOpen(false);
          setEditingUpcomingEvent(null);
        }}
        defaultAcademicYear={settings.currentAcademicYear}
        editingUpcoming={editingUpcomingEvent}
      />
    </div>
  );
}
