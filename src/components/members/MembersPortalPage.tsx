import { useState, useMemo } from "react";
import {
  Search,
  X,
  Award,
  Calendar,
  Sparkles,
  History,
  Shield,
  CheckCircle2,
  Clock,
  User,
  Mail,
  GraduationCap,
  BellRing,
  ArrowRight,
} from "lucide-react";
import PortalDataStatus from "@/components/ui/PortalDataStatus";
import CalendarDatePicker from "@/components/ui/CalendarDatePicker";
import { playSweetAlertChime } from "@/components/ui/UpcomingEventSweetAlert";
import { useClubData } from "@/context/ClubDataContext";
import { useAuth } from "@/context/AuthContext";
import { useAppRouter } from "@/hooks/useAppRouter";
import {
  calculateMemberAllocationSummary,
  formatCleanNumber,
  formatEventDateDisplay,
  parseFlexibleDateToISO,
} from "@/lib/aicte";

function toIsoKey(rawDate?: string): string | null {
  if (!rawDate) return null;
  const iso = parseFlexibleDateToISO(rawDate);
  return iso || null;
}

export default function MembersPortalPage() {
  const { currentUser } = useAuth();
  const { navigateTo } = useAppRouter();
  const {
    approvedMembers,
    allocations,
    upcomingEvents,
    settings,
    isLoading,
    error,
  } = useClubData();

  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyYearFilter, setHistoryYearFilter] = useState<string>("all");

  // Logged-in individual account profile
  const myProfile = useMemo(() => {
    if (!currentUser) return null;
    return approvedMembers.find((m) => m.id === currentUser.id) || currentUser;
  }, [currentUser, approvedMembers]);

  // Individual member's AICTE summary & event history
  const mySummary = useMemo(
    () =>
      myProfile
        ? calculateMemberAllocationSummary(myProfile.id, allocations)
        : null,
    [myProfile, allocations]
  );

  // Distinct academic years in the member's own event history
  const myHistoryAcademicYears = useMemo(() => {
    if (!mySummary) return [];
    return Array.from(new Set(mySummary.history.map((item) => item.academicYear)))
      .filter(Boolean)
      .sort()
      .reverse();
  }, [mySummary]);

  // Filtered event history for the logged-in member
  const filteredMyHistory = useMemo(() => {
    if (!mySummary) return [];
    const q = historySearchQuery.trim().toLowerCase();
    return mySummary.history.filter((item) => {
      if (historyYearFilter !== "all" && item.academicYear !== historyYearFilter) {
        return false;
      }
      if (historyDateFilter && toIsoKey(item.eventDate) !== historyDateFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.eventName.toLowerCase().includes(q) ||
        item.academicYear.toLowerCase().includes(q) ||
        formatEventDateDisplay(item.eventDate).toLowerCase().includes(q)
      );
    });
  }, [mySummary, historySearchQuery, historyDateFilter, historyYearFilter]);

  if (error || isLoading || !settings) return <PortalDataStatus error={error} />;

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-[6vw] bg-[#070d1f] relative overflow-hidden">
      {/* Background celestial glow elements */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[420px] h-[420px] bg-mint/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-stars opacity-40 pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* HERO / HEADER SECTION */}
      {/* ======================================================== */}
      <div className="max-w-5xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md mb-4 text-xs font-label uppercase tracking-widest text-mint-bright">
          <Sparkles size={14} className="text-primary-light" />
          <span>ACTCET TCET Chapter • Individual Member Account</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
          Astronomy Member&apos;s Portal
        </h1>

        <p className="italic text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed font-body">
          &ldquo;Every astronomer starts with wonder. Every member here keeps that wonder alive.&rdquo;
        </p>
      </div>

      {/* ======================================================== */}
      {/* INDIVIDUAL MEMBER ACCOUNT DASHBOARD (READ-ONLY) */}
      {/* ======================================================== */}
      {myProfile && mySummary ? (
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Interactive Upcoming Event Banner (if Admin added Future Events) */}
          {upcomingEvents.length > 0 && (
            <button
              type="button"
              onClick={() => {
                playSweetAlertChime();
                navigateTo("home", "future");
              }}
              className="w-full text-left p-5 rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-[#171631]/90 to-primary/20 hover:border-amber-400/70 backdrop-blur-2xl shadow-[0_14px_40px_rgba(0,0,0,0.4)] transition group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  <BellRing size={20} className="animate-bounce" />
                </div>
                <div>
                  <span className="text-[11px] font-label font-bold uppercase tracking-wider text-amber-300 block">
                    {upcomingEvents.length > 1
                      ? `${upcomingEvents.length} Upcoming Missions Announced by Admin`
                      : "New Upcoming Mission Announced by Admin"}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                    {upcomingEvents[0].title} — {upcomingEvents[0].date} (
                    {upcomingEvents[0].location})
                  </h3>
                </div>
              </div>

              <span className="px-4 py-2.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-label font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition">
                <span>Open Future Events</span>
                <ArrowRight size={14} />
              </span>
            </button>
          )}

          {/* 1. Personal Profile & Total AICTE Points Card */}
          <section
            aria-label="Your Personal Account and AICTE Summary"
            className="rounded-3xl border border-primary/30 bg-gradient-to-br from-[#0b1530]/95 via-[#0e1b3d]/90 to-[#0b1530]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-6 sm:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/25 border border-primary/40 flex items-center justify-center text-white font-display font-bold text-xl shrink-0">
                  {myProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-label uppercase tracking-wider text-ink-soft mb-2">
                    <Shield size={12} className="text-primary-light" />
                    <span>Personal AICTE Activity Account (Read-Only)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                      {myProfile.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 size={12} />
                      <span>Approved {myProfile.role}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft mt-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={13} className="text-primary-light" />
                      <span>{myProfile.email}</span>
                    </span>
                    {myProfile.accountType !== "club_admin" && (
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <GraduationCap size={14} className="text-emerald-400" />
                        <span>
                          {myProfile.year || "—"}-{myProfile.branch || "—"}-
                          {myProfile.division || "—"} • Session{" "}
                          {myProfile.academicYear || settings.currentAcademicYear}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total AICTE Badge */}
              <div className="px-6 py-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-left lg:text-right shrink-0">
                <span className="text-[11px] font-label uppercase tracking-wider text-amber-200 block">
                  Your Total AICTE Points
                </span>
                <div className="flex items-baseline lg:justify-end gap-1.5 mt-0.5">
                  <span className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-300">
                    {mySummary.formattedPoints}
                  </span>
                  <span className="text-sm text-amber-200/80 font-semibold">pts</span>
                </div>
                <span className="text-xs text-ink-soft block mt-0.5">
                  {mySummary.formattedHours} hrs credited across {mySummary.count} event
                  {mySummary.count === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* Individual Account Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Award size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-label uppercase tracking-wider text-ink-soft block">
                    Total AICTE Points Earned
                  </span>
                  <span className="font-mono text-lg font-bold text-white">
                    {mySummary.formattedPoints} Points
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-label uppercase tracking-wider text-ink-soft block">
                    Total Credited Hours
                  </span>
                  <span className="font-mono text-lg font-bold text-white">
                    {mySummary.formattedHours} Hours
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-label uppercase tracking-wider text-ink-soft block">
                    Completed Club Events
                  </span>
                  <span className="font-mono text-lg font-bold text-white">
                    {mySummary.count} Event{mySummary.count === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Individual Event-Wise AICTE Point History Section */}
          <section
            aria-label="Your Event-Wise AICTE Point History"
            className="rounded-3xl border border-white/15 bg-[#0b1530]/85 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <History size={18} className="text-primary-light" />
                  <span>Your Event-Wise AICTE Point History</span>
                </h3>
                <p className="text-xs text-ink-soft mt-1">
                  Official record of club events you participated in and the AICTE points allotted to your account.
                </p>
              </div>

              {mySummary.history.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search own events */}
                  <div className="relative w-full sm:w-64">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search your events..."
                      aria-label="Search your event history"
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs sm:text-sm placeholder-white/35 focus:outline-none focus:border-primary transition"
                    />
                    {historySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setHistorySearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        aria-label="Clear event search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Pop-out Calendar Date Filter */}
                  <div className="w-full sm:w-64">
                    <CalendarDatePicker
                      id="member-history-date-filter"
                      value={historyDateFilter}
                      onChange={setHistoryDateFilter}
                      outputFormat="iso"
                      placeholder="Filter by calendar date..."
                      highlightedIsoDates={Array.from(
                        new Set(
                          mySummary.history
                            .map((h) => toIsoKey(h.eventDate))
                            .filter((d): d is string => Boolean(d))
                        )
                      )}
                      allowClear={true}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Academic Year Filter Pills (if member has events) */}
            {myHistoryAcademicYears.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryYearFilter("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-label uppercase tracking-wider transition ${
                    historyYearFilter === "all"
                      ? "bg-primary text-white font-semibold"
                      : "bg-white/[0.05] text-white/60 hover:text-white"
                  }`}
                >
                  All Academic Years ({mySummary.history.length})
                </button>
                {myHistoryAcademicYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setHistoryYearFilter(yr)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                      historyYearFilter === yr
                        ? "bg-primary text-white"
                        : "bg-white/[0.05] text-white/60 hover:text-white"
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}

            {mySummary.history.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
                <Award className="w-10 h-10 text-amber-300/40 mx-auto" />
                <p className="text-sm font-semibold text-white">
                  No AICTE Event Allocations Recorded Yet
                </p>
                <p className="text-xs text-ink-soft max-w-md mx-auto">
                  No completed event allocations have been recorded for your account yet. Points allocated by club administrators appear here automatically.
                </p>
              </div>
            ) : filteredMyHistory.length === 0 ? (
              <div className="py-10 px-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
                <p className="text-sm text-ink-soft">
                  No events in your history match the selected filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearchQuery("");
                    setHistoryDateFilter("");
                    setHistoryYearFilter("all");
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-label transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-label uppercase tracking-wider text-ink-soft">
                      <th className="py-3.5 px-4">Event Name</th>
                      <th className="py-3.5 px-4">Academic Year</th>
                      <th className="py-3.5 px-4">Event Date</th>
                      <th className="py-3.5 px-4">Allocation Method</th>
                      <th className="py-3.5 px-4 text-right">Hours</th>
                      <th className="py-3.5 px-4 text-right">AICTE Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMyHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {item.eventName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-primary-light">
                          {item.academicYear}
                        </td>
                        <td className="py-3.5 px-4 text-ink-soft">
                          {formatEventDateDisplay(item.eventDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] bg-white/[0.06] border border-white/10 text-white/80">
                            {item.allocationMethod === "hours"
                              ? "Hours-Based"
                              : "Direct Points"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-ink-soft">
                          {item.allocationMethod === "hours" && item.hours !== null
                            ? `${formatCleanNumber(item.hours)} hrs`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                          {formatCleanNumber(item.aictePoints)} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Note */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
              <span>
                AICTE Rule: {settings.hoursPerAICTEPoint} completed hours = 1 AICTE point (or direct club allocation)
              </span>
              <span>Read-only personal account view • Verified by ACTCET Administration</span>
            </div>
          </section>
        </div>
      ) : (
        <div className="max-w-xl mx-auto text-center py-16 px-6 rounded-3xl border border-white/10 bg-[#0b1530]/80 backdrop-blur-2xl">
          <User className="w-12 h-12 text-primary-light mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Sign In to View Your Member Account
          </h2>
          <p className="text-xs sm:text-sm text-ink-soft">
            Please sign in with your approved ACTCET member account to view your personal AICTE points and event participation history.
          </p>
        </div>
      )}
    </div>
  );
}
