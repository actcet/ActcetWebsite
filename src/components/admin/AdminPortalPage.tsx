import React, { useState, useMemo } from "react";
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
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useClubData } from "@/context/ClubDataContext";
import { useAuth } from "@/context/AuthContext";
import { calculateAICTEPoints } from "@/lib/aicte";
import AddEventModal from "./AddEventModal";
import { ROLES } from "@/services/portalService";
import PortalDataStatus from "@/components/ui/PortalDataStatus";
import type { Member, UserRole } from "@/types";

export default function AdminPortalPage() {
  const { currentUser } = useAuth();
  const {
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
    settings,
    isLoading,
    error,
  } = useClubData();

  // Active admin section tab: "approvals" | "member-update"
  const [activeTab, setActiveTab] = useState<"approvals" | "member-update">("approvals");
  const clubAdminAccounts = members.filter(member => member.accountType === "club_admin");

  const [verifiedRoles, setVerifiedRoles] = useState<Record<string, UserRole>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const perform = async (key: string, action: () => Promise<unknown>) => {
    setBusy(previous => ({ ...previous, [key]: true }));
    try { await action(); } finally { setBusy(previous => ({ ...previous, [key]: false })); }
  };

  // Search filter for Member Update
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Search filter for Login Approvals
  const [approvalSearchQuery, setApprovalSearchQuery] = useState("");

  // Add Event modal state
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Rejection confirmation dialog state
  const [rejectingMember, setRejectingMember] = useState<Member | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  // Filtered approved members for Member Update
  const filteredApproved = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (!q) return approvedMembers;

    return approvedMembers.filter((m) => {
      const isSpecificYearQuery = q === "se" || q === "te" || q === "be";
      if (isSpecificYearQuery) {
        return (m.year || "").toLowerCase() === q;
      }

      if (m.name.toLowerCase().includes(q)) return true;
      if ((m.branch || "").toLowerCase().includes(q)) return true;
      if ((m.year || "").toLowerCase().includes(q)) return true;

      const classPattern = `${m.year || ""}-${m.branch || ""}-${m.division || ""}`.toLowerCase();
      if (classPattern.includes(q)) return true;

      if (m.role.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [approvedMembers, memberSearchQuery]);

  // Group approved members by academic year
  const groupedMemberData = useMemo(() => {
    return academicYears.map((academicYear) => {
      const yearMembers = filteredApproved.filter((m) => m.academicYear === academicYear);
      const yearEvents = events.filter((e) => e.academicYear === academicYear);
      return {
        academicYear,
        members: yearMembers,
        events: yearEvents,
      };
    });
  }, [academicYears, filteredApproved, events]);

  const handleConfirmReject = async () => {
    if (rejectingMember) {
      if (!await rejectUser(rejectingMember.id, rejectionReason || "Administrative review")) return;
      setRejectingMember(null);
      setRejectionReason("");
    }
  };

  if (error || isLoading || !settings) return <PortalDataStatus error={error} />;

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-[6vw] bg-[#070d1f] relative overflow-hidden">
      {/* Background celestial glow */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-stars opacity-40 pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* 4A. ADMIN PORTAL HEADER */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-label uppercase tracking-widest mb-3">
              <ShieldCheck size={14} />
              <span>Privileged Administrator Access</span>
            </div>

            {/* Page Heading */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Admin Portal
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-ink-soft mt-1.5 font-body">
              Manage registrations, members, and event attendance.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_16px_rgba(19,54,212,0.4)] flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>


          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0b1530]/70 p-5" aria-label="Administrative accounts">
          <h2 className="font-display text-lg font-bold text-white">Administrative Accounts</h2>
          <p className="mt-1 text-xs text-ink-soft">Club administrator identities are kept separate from student attendance and AICTE tables.</p>
          {clubAdminAccounts.length === 0 ? <p className="mt-4 text-sm text-ink-soft">No club administrator profiles are provisioned.</p> : (
            <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase text-ink-soft"><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Role</th><th className="py-2">Status</th></tr></thead><tbody>{clubAdminAccounts.map(account => <tr key={account.id} className="border-b border-white/5"><td className="py-3 pr-4 text-white">{account.name}</td><td className="py-3 pr-4 font-mono text-xs text-ink-soft">{account.email}</td><td className="py-3 pr-4 text-white">{account.role}</td><td className="py-3 text-emerald-300">{account.approvalStatus}</td></tr>)}</tbody></table></div>
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
                Total Events
              </p>
              <p className="font-display text-2xl font-bold text-white mt-0.5">
                {stats.totalEvents}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION TABS */}
        <div className="flex border-b border-white/10 mt-10">
          <button
            onClick={() => setActiveTab("approvals")}
            className={`pb-4 px-6 font-display text-base font-semibold border-b-2 transition-all flex items-center gap-2.5 ${
              activeTab === "approvals"
                ? "border-primary text-white"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Clock size={18} className={activeTab === "approvals" ? "text-primary-light" : ""} />
            <span>Login Approvals</span>
            {pendingMembers.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                {pendingMembers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("member-update")}
            className={`pb-4 px-6 font-display text-base font-semibold border-b-2 transition-all flex items-center gap-2.5 ${
              activeTab === "member-update"
                ? "border-primary text-white"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Users size={18} className={activeTab === "member-update" ? "text-primary-light" : ""} />
            <span>Member Update</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/[0.06] text-ink-soft">
              {approvedMembers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4B. LOGIN APPROVALS SECTION */}
      {/* ======================================================== */}
      {activeTab === "approvals" && (
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl border border-white/15 bg-[#0b1530]/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Header with Search */}
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
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
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

            {/* Approvals Table */}
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
                        {/* Name */}
                        <td className="py-4 px-6 font-semibold text-white">
                          {member.name}
                        </td>

                        {/* Year-Branch-Division */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 font-mono text-xs text-ink-soft">
                            {member.year || "—"}-{member.branch || "—"}-{member.division || "—"}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 text-xs font-mono text-ink-soft truncate max-w-[200px]">
                          {member.email}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span className="block text-xs mb-2">Requested: {member.requestedRole}</span>
                          <select aria-label={`Verified role for ${member.name}`} value={verifiedRoles[member.id] || "Member"} onChange={e => setVerifiedRoles(previous => ({ ...previous, [member.id]: e.target.value as UserRole }))} className="rounded-lg bg-[#0b1530] border border-white/15 px-2 py-1 text-xs">
                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                          </select>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock size={12} />
                            <span>Pending</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={busy[member.id]}
                              onClick={() => perform(member.id, () => approveUser(member.id, verifiedRoles[member.id] || "Member"))}
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
      {/* PHASE 5: MEMBER UPDATE (ATTENDANCE WITH CHECKBOXES) */}
      {/* ======================================================== */}
      {activeTab === "member-update" && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Search bar for members */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b1530]/80 border border-white/10 backdrop-blur-xl">
            <div className="relative w-full sm:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search approved members by name, branch, year..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-primary transition"
              />
              {memberSearchQuery && (
                <button
                  onClick={() => setMemberSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time persistence enabled (updates auto-save)</span>
            </div>
          </div>

          {/* Academic Year Grouped Member Update Tables */}
          {groupedMemberData.map(({ academicYear, members: yearMembers, events: yearEvents }) => {
            if (yearMembers.length === 0 && memberSearchQuery) return null;

            return (
              <div
                key={academicYear}
                className="rounded-3xl border border-white/15 bg-[#0b1530]/80 backdrop-blur-2xl shadow-2xl overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-light">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        Academic Year {academicYear} — Attendance Management
                      </h3>
                      <p className="text-[11px] text-ink-soft">
                        Toggle event checkboxes to record attendance. AICTE points recalculate instantly.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-label bg-white/[0.06] border border-white/10 text-ink-soft">
                    {yearMembers.length} Approved Members
                  </span>
                </div>

                {/* Table with interactive checkboxes */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-label uppercase tracking-wider text-ink-soft">
                        <th className="py-4 px-5 sticky left-0 z-20 bg-[#0b1530] min-w-[180px] shadow-[2px_0_8px_rgba(0,0,0,0.3)]">
                          Name
                        </th>
                        <th className="py-4 px-4 min-w-[140px]">Year-Branch-Div</th>
                        <th className="py-4 px-4 min-w-[180px]">Email</th>
                        <th className="py-4 px-4 min-w-[140px]">Role</th>

                        {/* DYNAMIC EVENT COLUMNS (EDITABLE) */}
                        {yearEvents.map((event) => (
                          <th
                            key={event.id}
                            className="py-4 px-4 min-w-[160px] text-center"
                            title={`${event.name} (${event.aicteHours} hrs on ${event.date})`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-white normal-case font-semibold text-xs truncate max-w-[140px]">
                                {event.name}
                              </span>
                              <span className="text-[10px] text-amber-300 font-normal lowercase">
                                {event.aicteHours} hrs (checkbox)
                              </span>
                            </div>
                          </th>
                        ))}

                        {/* TOTAL AICTE */}
                        <th className="py-4 px-5 text-right min-w-[120px] bg-primary/10">
                          <div className="flex items-center justify-end gap-1.5 text-white">
                            <Award size={14} className="text-amber-400" />
                            <span>Total AICTE</span>
                          </div>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {yearMembers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5 + yearEvents.length}
                            className="py-8 text-center text-xs text-ink-soft italic"
                          >
                            No approved members in {academicYear}.
                          </td>
                        </tr>
                      ) : (
                        yearMembers.map((member) => {
                          const aicte = calculateAICTEPoints(member.id, yearEvents, attendance, settings.hoursPerAICTEPoint);

                          return (
                            <tr
                              key={member.id}
                              className="hover:bg-white/[0.03] transition-colors group"
                            >
                              {/* Sticky Name */}
                              <td className="py-3.5 px-5 sticky left-0 z-10 bg-[#0b1530] group-hover:bg-[#0e1b3d] shadow-[2px_0_8px_rgba(0,0,0,0.3)] transition-colors">
                                <span className="font-semibold text-white">
                                  {member.name}
                                </span>
                              </td>

                              {/* Class */}
                              <td className="py-3.5 px-4 font-mono text-xs text-ink-soft">
                                {member.year || "—"}-{member.branch || "—"}-{member.division || "—"}
                              </td>

                              {/* Email */}
                              <td className="py-3.5 px-4 text-xs font-mono text-ink-soft truncate max-w-[180px]">
                                {member.email}
                              </td>

                              {/* Role */}
                              <td className="py-3.5 px-4 text-xs text-white/90">
                                {member.role}
                              </td>

                              {/* DYNAMIC EVENT EDITABLE CHECKBOXES */}
                              {yearEvents.map((event) => {
                                const isChecked = attendance.some(
                                  (a) =>
                                    a.memberId === member.id &&
                                    a.eventId === event.id &&
                                    a.attended
                                );

                                return (
                                  <td
                                    key={event.id}
                                    className="py-3.5 px-4 text-center"
                                  >
                                    <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={busy[`${member.id}:${event.id}`]}
                                        onChange={(e) => { const attended = e.target.checked; void perform(`${member.id}:${event.id}`, () => updateAttendance(member.id, event.id, attended)); }}
                                        className="w-4 h-4 rounded border-white/30 text-primary bg-white/10 focus:ring-primary focus:ring-offset-0 transition cursor-pointer accent-primary"
                                        aria-label={`Mark attendance for ${member.name} in ${event.name}`}
                                      />
                                    </label>
                                  </td>
                                );
                              })}

                              {/* Live Recalculated Total AICTE */}
                              <td className="py-3.5 px-5 text-right font-mono font-bold text-sm bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                <span
                                  className={
                                    aicte.points > 0
                                      ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                                      : "text-white/40"
                                  }
                                >
                                  {aicte.formattedPoints}
                                </span>
                                <span className="text-[10px] text-white/40 font-normal ml-1">
                                  pts
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
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
              <strong className="text-white">{rejectingMember.name}</strong> ({rejectingMember.email})?
              This user will not receive dashboard access.
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

      {/* ADD EVENT MODAL */}
      <AddEventModal
        key={settings.currentAcademicYear}
        defaultAcademicYear={settings.currentAcademicYear}
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
      />
    </div>
  );
}
