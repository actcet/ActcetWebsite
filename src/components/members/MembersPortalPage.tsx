import React, { useState, useMemo } from "react";
import { Search, X, Check, Minus, Award, Calendar, Sparkles, Compass, Users } from "lucide-react";
import PortalDataStatus from "@/components/ui/PortalDataStatus";
import { useClubData } from "@/context/ClubDataContext";
import { calculateAICTEPoints } from "@/lib/aicte";
import type { Member, ClubEvent } from "@/types";

export default function MembersPortalPage() {
  const { approvedMembers, events, attendance, academicYears, settings, isLoading, error } = useClubData();
  const [searchQuery, setSearchQuery] = useState("");

  // Normalized, field-aware filter for members
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return approvedMembers;

    return approvedMembers.filter((member) => {
      // 1. Year match: normalized field comparison
      // If user specifically types 'se', 'te', or 'be', match study year only
      // so short year values do not accidentally match unrelated text
      const isSpecificYearQuery = q === "se" || q === "te" || q === "be";
      if (isSpecificYearQuery) {
        return member.year.toLowerCase() === q;
      }

      // 2. Name match (case-insensitive substring)
      if (member.name.toLowerCase().includes(q)) return true;

      // 3. Branch match (exact or substring, e.g. "aiml", "cse", "cse(iot)")
      if (member.branch.toLowerCase().includes(q)) return true;

      // 4. Year substring match (if query is longer/part of class)
      if (member.year.toLowerCase().includes(q)) return true;

      // 5. Combined Class format e.g. "SE-CSE(IoT)-A"
      const classPattern = `${member.year}-${member.branch}-${member.division}`.toLowerCase();
      if (classPattern.includes(q)) return true;

      // 6. Role match
      if (member.role.toLowerCase().includes(q)) return true;

      return false;
    });
  }, [approvedMembers, searchQuery]);

  // Group filtered members by academic year
  const groupedData = useMemo(() => {
    return academicYears.map((academicYear) => {
      const yearMembers = filteredMembers.filter((m) => m.academicYear === academicYear);
      const yearEvents = events.filter((e) => e.academicYear === academicYear);
      return {
        academicYear,
        members: yearMembers,
        events: yearEvents,
      };
    });
  }, [academicYears, filteredMembers, events]);

  const hasAnyMembers = approvedMembers.length > 0;
  const hasSearchResults = groupedData.some((g) => g.members.length > 0);

  if (error || isLoading || !settings) return <PortalDataStatus error={error} />;

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-[6vw] bg-[#070d1f] relative overflow-hidden">
      {/* Background celestial glow elements */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[420px] h-[420px] bg-mint/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-stars opacity-40 pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* 3B. HERO / HEADER SECTION */}
      {/* ======================================================== */}
      <div className="max-w-5xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md mb-4 text-xs font-label uppercase tracking-widest text-mint-bright">
          <Sparkles size={14} className="text-primary-light" />
          <span>ACTCET TCET Chapter</span>
        </div>

        {/* Page Title */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
          Astronomy Members' Portal
        </h1>

        {/* Caption — EXACT TEXT in italics directly below title */}
        <p className="italic text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed font-body">
          "Every astronomer starts with wonder. Every member here keeps that wonder alive."
        </p>
      </div>

      {/* ======================================================== */}
      {/* 3C. SEARCH BAR */}
      {/* ======================================================== */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-primary-light transition-colors">
            <Search size={20} />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, branch, or year..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-white placeholder-white/35 text-sm sm:text-base backdrop-blur-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-lg transition-all"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="flex items-center justify-between text-xs text-ink-soft px-3 pt-2">
            <span>
              Searching for: <strong className="text-white">"{searchQuery}"</strong>
            </span>
            <span>
              {filteredMembers.length} matching member{filteredMembers.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3D. ACADEMIC YEAR-WISE MEMBER TABLES */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto space-y-12">
        {!hasAnyMembers ? (
          <div className="text-center py-20 p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">
              No Member Records Available
            </h3>
            <p className="text-sm text-ink-soft max-w-md mx-auto">
              There are currently no approved club members registered in the system.
            </p>
          </div>
        ) : !hasSearchResults ? (
          <div className="text-center py-16 p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <Compass className="w-14 h-14 text-primary-light/40 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">
              No members found
            </h3>
            <p className="text-sm text-ink-soft max-w-md mx-auto mb-6">
              No registered members match your search criteria "{searchQuery}". Try searching by a different name, branch, or year.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-label text-xs uppercase tracking-wider transition"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          groupedData.map(({ academicYear, members: yearMembers, events: yearEvents }) => {
            if (yearMembers.length === 0 && searchQuery) {
              return null; // hide section if search yielded no members in this year
            }

            return (
              <div
                key={academicYear}
                className="rounded-3xl border border-white/15 bg-[#0b1530]/75 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden"
              >
                {/* SECTION HEADER */}
                <div className="px-6 sm:px-8 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-light">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Academic Year {academicYear}
                      </h2>
                      <p className="text-xs text-ink-soft">
                        Official participation registry & AICTE point status
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-label bg-white/[0.06] border border-white/10 text-ink-soft">
                      {yearMembers.length} Active Member{yearMembers.length === 1 ? "" : "s"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-label bg-primary/20 border border-primary/30 text-primary-light">
                      {yearEvents.length} Event{yearEvents.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* TABLE CONTAINER — HORIZONTALLY SCROLLABLE WITH STICKY NAME */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-label uppercase tracking-wider text-ink-soft">
                        <th className="py-4 px-5 sticky left-0 z-20 bg-[#0b1530] min-w-[180px] shadow-[2px_0_8px_rgba(0,0,0,0.3)]">
                          Name
                        </th>
                        <th className="py-4 px-4 min-w-[140px]">Year-Branch-Div</th>
                        <th className="py-4 px-4 min-w-[200px]">Email</th>
                        <th className="py-4 px-4 min-w-[150px]">Role</th>

                        {/* DYNAMIC EVENT COLUMNS */}
                        {yearEvents.map((event) => (
                          <th
                            key={event.id}
                            className="py-4 px-4 min-w-[150px] text-center"
                            title={`${event.name} (${event.aicteHours} hrs on ${event.date})`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-white normal-case font-semibold text-xs truncate max-w-[140px]">
                                {event.name}
                              </span>
                              <span className="text-[10px] text-primary-light tracking-normal lowercase">
                                {event.aicteHours} hrs
                              </span>
                            </div>
                          </th>
                        ))}

                        {/* TOTAL AICTE COLUMN */}
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
                            No members found in academic year {academicYear}.
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
                              {/* Name (Sticky on desktop) */}
                              <td className="py-4 px-5 sticky left-0 z-10 bg-[#0b1530] group-hover:bg-[#0e1b3d] shadow-[2px_0_8px_rgba(0,0,0,0.3)] transition-colors">
                                <div className="font-semibold text-white group-hover:text-primary-light transition-colors">
                                  {member.name}
                                </div>
                              </td>

                              {/* Year-Branch-Division (e.g. SE-CSE(IoT)-A) */}
                              <td className="py-4 px-4">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 font-mono text-xs text-ink-soft">
                                  {member.year}-{member.branch}-{member.division}
                                </span>
                              </td>

                              {/* Email */}
                              <td className="py-4 px-4 text-ink-soft text-xs font-mono truncate max-w-[200px]">
                                {member.email}
                              </td>

                              {/* Role */}
                              <td className="py-4 px-4">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                                    member.role === "Chairperson" || member.role === "Mentor"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : member.role.includes("Head")
                                      ? "bg-primary/20 text-blue-300 border border-primary/30"
                                      : member.role.includes("Working Committee")
                                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                      : "bg-white/[0.05] text-white/80 border border-white/10"
                                  }`}
                                >
                                  {member.role}
                                </span>
                              </td>

                              {/* Dynamic Event Attendance Columns (Read-only) */}
                              {yearEvents.map((event) => {
                                const isAttended = attendance.some(
                                  (a) =>
                                    a.memberId === member.id &&
                                    a.eventId === event.id &&
                                    a.attended
                                );

                                return (
                                  <td
                                    key={event.id}
                                    className="py-4 px-4 text-center"
                                  >
                                    {isAttended ? (
                                      <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium"
                                        title={`Attended (${event.aicteHours} hrs earned)`}
                                      >
                                        <Check size={12} className="stroke-[3]" />
                                        <span>Attended</span>
                                      </span>
                                    ) : (
                                      <span
                                        className="text-white/30 text-sm"
                                        title="Not attended (0 hrs)"
                                      >
                                        —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Total AICTE Points */}
                              <td className="py-4 px-5 text-right font-mono font-bold text-sm bg-primary/5 group-hover:bg-primary/10 transition-colors">
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

                {/* FOOTER SUMMARY */}
                <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-ink-soft">
                  <span>AICTE Formula: {settings.hoursPerAICTEPoint} hours of attended events = 1 AICTE point</span>
                  <span>Auto-calculated in real time</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
