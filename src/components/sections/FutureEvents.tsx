import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
  Award,
  X,
} from "lucide-react";
import Eyebrow from "@/components/ui/Eyebrow";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import CalendarDatePicker from "@/components/ui/CalendarDatePicker";
import { useClubData } from "@/context/ClubDataContext";
import { parseFlexibleDateToISO, formatEventDateDisplay } from "@/lib/aicte";
import { placeholderImage, safeExternalHref, safeImageSrc } from "@/lib/utils";
import type { UpcomingEvent } from "@/types";

function toIsoKey(rawDate: string): string | null {
  const iso = parseFlexibleDateToISO(rawDate);
  return iso || null;
}

export default function FutureEvents() {
  const { upcomingEvents } = useClubData();
  const [selectedMission, setSelectedMission] = useState<UpcomingEvent | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");

  useEffect(() => {
    if (!selectedMission) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMission(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMission]);

  const highlightedDates = useMemo(() => {
    const set = new Set<string>();
    for (const mission of upcomingEvents) {
      const iso = toIsoKey(mission.date);
      if (iso) set.add(iso);
    }
    return Array.from(set);
  }, [upcomingEvents]);

  const filteredUpcomingEvents = useMemo(() => {
    if (!selectedCalendarDate) return upcomingEvents;
    return upcomingEvents.filter(
      (mission) => toIsoKey(mission.date) === selectedCalendarDate
    );
  }, [upcomingEvents, selectedCalendarDate]);

  return (
    <section id="future" className="py-28 px-[6vw] bg-bg-alt">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <Eyebrow>Upcoming Missions</Eyebrow>
            <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-4">
              Future Events
            </h2>
            <p className="text-ink-soft max-w-xl text-[1.05rem]">
              Explore upcoming astronomy workshops, stargazing sessions, and club drives — register below to reserve your spot.
            </p>
          </div>

          {upcomingEvents.length > 0 && (
            <div className="w-full lg:w-[330px] p-4 rounded-2xl border border-white/10 bg-[#0b1530]/80 backdrop-blur-xl">
              <label
                htmlFor="future-events-calendar-filter"
                className="block text-[11px] font-label uppercase tracking-wider text-amber-300 font-semibold mb-1.5"
              >
                Browse Upcoming Missions by Calendar Date
              </label>
              <CalendarDatePicker
                id="future-events-calendar-filter"
                value={selectedCalendarDate}
                onChange={setSelectedCalendarDate}
                outputFormat="iso"
                placeholder="Click to pop out mission calendar..."
                highlightedIsoDates={highlightedDates}
                allowClear={true}
              />
            </div>
          )}
        </div>

        {selectedCalendarDate && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/35 bg-amber-500/10">
            <div className="flex items-center gap-2 text-sm text-white">
              <Calendar size={16} className="text-amber-300" />
              <span>
                Showing upcoming missions on{" "}
                <strong className="text-amber-300">
                  {formatEventDateDisplay(selectedCalendarDate)}
                </strong>{" "}
                ({filteredUpcomingEvents.length} found)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCalendarDate("")}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-label flex items-center gap-1.5 transition"
            >
              <X size={13} />
              <span>Show All Upcoming Missions</span>
            </button>
          </div>
        )}

        {filteredUpcomingEvents.length === 0 ? (
          <Reveal>
            <Card className="text-center py-20 px-8">
              <div
                className="w-[130px] h-[130px] mx-auto mb-8 rounded-full"
                style={{
                  background: "radial-gradient(circle at 32% 30%, #dff4fb, #2596be 70%, #0A192F)",
                  boxShadow: "0 0 0 14px rgba(37,150,190,0.06)",
                }}
              />
              <h3 className="font-display font-semibold text-navy text-xl mb-2.5">
                {selectedCalendarDate ? "No Missions Scheduled on Selected Date" : "No Upcoming Missions Yet"}
              </h3>
              <p className="text-ink-soft max-w-md mx-auto">
                {selectedCalendarDate
                  ? "No upcoming event matches that calendar date. Clear the date filter above to see all scheduled missions."
                  : "New missions are being charted. Follow our socials or check back soon to be the first to know when the next one launches."}
              </p>
            </Card>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredUpcomingEvents.map((mission, idx) => {
              const coverSrc = safeImageSrc(
                mission.coverImage,
                placeholderImage(mission.id || `upcoming-${idx}`, 600, 400)
              );
              const safeRegUrl = safeExternalHref(mission.registrationLink);

              return (
                <Reveal key={mission.id} delay={(idx % 3) * 0.06}>
                  <Card className="overflow-hidden flex flex-col h-full">
                    {/* Cover Page Photo */}
                    <div className="h-[195px] relative overflow-hidden bg-[#070d1f]">
                      <img
                        src={coverSrc}
                        alt={mission.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 font-label font-bold text-[11px] uppercase tracking-wider shadow">
                        Upcoming
                      </span>
                    </div>

                    <div className="p-6 flex flex-col gap-2.5 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge>{mission.category}</Badge>
                        <span className="text-xs font-mono text-ink-soft">
                          {mission.academicYear}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-navy text-xl leading-snug">
                        {mission.title}
                      </h3>

                      <div className="space-y-1.5 text-xs sm:text-sm text-ink-soft mt-1">
                        <div className="flex items-center gap-2 text-primary font-label font-semibold">
                          <Calendar size={14} className="shrink-0" />
                          <span>{mission.date}</span>
                          {mission.time && (
                            <>
                              <span>&middot;</span>
                              <Clock size={13} className="shrink-0" />
                              <span>{mission.time}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-400 shrink-0" />
                          <span>{mission.location}</span>
                        </div>

                        {mission.aicteHours && (
                          <div className="flex items-center gap-2 text-amber-300">
                            <Award size={14} className="shrink-0" />
                            <span>AICTE Activity Credit: {mission.aicteHours} hrs</span>
                          </div>
                        )}
                      </div>

                      {mission.description && (
                        <p className="text-sm text-ink-soft line-clamp-3 mt-1">
                          {mission.description}
                        </p>
                      )}

                      {mission.registrationDeadline && (
                        <div className="text-xs text-amber-300/90 font-label mt-1">
                          Registration Note: {mission.registrationDeadline}
                        </div>
                      )}

                      <div className="flex gap-2.5 mt-auto pt-4">
                        <button
                          type="button"
                          onClick={() => setSelectedMission(mission)}
                          className="flex-1 py-2.5 px-3 rounded-xl border border-navy/[0.09] text-navy font-label font-semibold text-xs hover:border-primary/40 transition-colors"
                        >
                          View Details
                        </button>

                        {safeRegUrl ? (
                          <a
                            href={safeRegUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white font-label font-semibold text-xs hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>Register Now</span>
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.06] text-ink-soft font-label font-medium text-xs text-center">
                            Registration Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Mission Details Modal */}
      {selectedMission && (
        <div
          className="fixed inset-0 z-[2600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedMission(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0b1530] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upcoming-mission-modal-title"
          >
            {/* Cover Banner */}
            <div className="relative h-56 sm:h-64 w-full bg-[#070d1f] overflow-hidden">
              <img
                src={
                  selectedMission.coverImage ||
                  placeholderImage(selectedMission.id || "upcoming", 600, 400)
                }
                alt={selectedMission.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1530] via-[#0b1530]/30 to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/15 transition"
                aria-label="Close upcoming event details"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-label font-semibold bg-amber-500 text-slate-950">
                  Upcoming Mission
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-label font-semibold bg-primary text-white">
                  {selectedMission.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/15 backdrop-blur-md text-white border border-white/20">
                  {selectedMission.academicYear}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h3
                  id="upcoming-mission-modal-title"
                  className="font-display text-2xl sm:text-3xl font-bold text-white"
                >
                  {selectedMission.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-ink-soft">
                    <Calendar size={15} className="text-primary-light shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase text-white/50">Date</span>
                      <strong className="text-white">{selectedMission.date}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-soft">
                    <Clock size={15} className="text-amber-300 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase text-white/50">Time</span>
                      <strong className="text-white">{selectedMission.time || "TBA"}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-soft">
                    <MapPin size={15} className="text-emerald-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase text-white/50">Venue</span>
                      <strong className="text-white">{selectedMission.location}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {selectedMission.description && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-sm">
                  <div className="flex items-center gap-2 text-xs font-label uppercase tracking-wider text-primary-light mb-1.5">
                    <Sparkles size={14} />
                    <span>Mission Details &amp; Agenda</span>
                  </div>
                  <p className="text-ink-soft leading-relaxed whitespace-pre-line">
                    {selectedMission.description}
                  </p>
                </div>
              )}

              {selectedMission.registrationDeadline && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <strong>Registration Note:</strong> {selectedMission.registrationDeadline}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                {safeExternalHref(selectedMission.registrationLink) ? (
                  <a
                    href={safeExternalHref(selectedMission.registrationLink)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition flex items-center gap-2"
                  >
                    <span>Register for This Event</span>
                    <ExternalLink size={15} />
                  </a>
                ) : (
                  <span className="text-xs text-ink-soft">
                    Registration link will be shared soon.
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedMission(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-label font-medium text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
