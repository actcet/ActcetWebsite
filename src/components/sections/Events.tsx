import { useState, useMemo } from "react";
import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import Badge from "@/components/ui/Badge";
import CalendarDatePicker from "@/components/ui/CalendarDatePicker";
import { yearEvents } from "@/data/events";
import { useClubData } from "@/context/ClubDataContext";
import { parseFlexibleDateToISO } from "@/lib/aicte";
import EventCard from "./EventCard";
import OlderYearAccordion from "./OlderYearAccordion";

export default function Events() {
  const { mergedYearEvents } = useClubData();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");

  const displayYears =
    mergedYearEvents && mergedYearEvents.length > 0 ? mergedYearEvents : yearEvents;

  const allEventIsoDates = useMemo(() => {
    const dates: string[] = [];
    for (const yg of displayYears) {
      for (const evt of yg.events) {
        const iso = parseFlexibleDateToISO(evt.date);
        if (iso) dates.push(iso);
      }
    }
    return Array.from(new Set(dates));
  }, [displayYears]);

  const filteredYears = useMemo(() => {
    const targetIso = parseFlexibleDateToISO(selectedCalendarDate);
    if (!targetIso) return displayYears;
    return displayYears.map((yg) => ({
      ...yg,
      events: yg.events.filter(
        (evt) => parseFlexibleDateToISO(evt.date) === targetIso
      ),
    }));
  }, [displayYears, selectedCalendarDate]);

  const currentYear = filteredYears.find((y) => y.current) || filteredYears[0];
  const olderYears = filteredYears.filter((y) => y.id !== currentYear?.id);

  return (
    <section id="events" className="py-28 px-[6vw]">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Eyebrow>Mission Log</Eyebrow>
            <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-3">
              Events
            </h2>
            <p className="text-ink-soft max-w-xl text-[1.05rem]">
              Every workshop, outreach drive, and stargazing night — organised by academic year.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <label
              htmlFor="public-events-calendar-filter"
              className="block text-xs font-label uppercase tracking-wider text-ink-soft mb-1.5"
            >
              Browse Events by Calendar Date
            </label>
            <CalendarDatePicker
              id="public-events-calendar-filter"
              value={selectedCalendarDate}
              onChange={setSelectedCalendarDate}
              outputFormat="display"
              highlightedIsoDates={allEventIsoDates}
              placeholder="Click to open events calendar..."
              ariaLabel="Filter events by calendar date"
            />
          </div>
        </div>

        {currentYear && (
          <div id={currentYear.id} className="mb-24 scroll-mt-24">
            <div className="flex items-baseline gap-5 flex-wrap mb-6">
              <h2 className="font-display font-bold text-navy text-[clamp(2.2rem,5vw,3.4rem)]">
                {currentYear.year}
              </h2>
              <Badge>Current Year</Badge>
            </div>

            {currentYear.events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {currentYear.events.map((event, i) => (
                  <Reveal key={event.id} delay={(i % 3) * 0.06}>
                    <EventCard event={event} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="text-ink-soft max-w-xl mt-8">
                {selectedCalendarDate
                  ? `No events in ${currentYear.year} on ${selectedCalendarDate}.`
                  : `Events for the ${currentYear.year} academic year will be announced soon.`}
              </p>
            )}
          </div>
        )}

        <div>
          {olderYears.map((yearData) => (
            <OlderYearAccordion key={yearData.id} yearData={yearData} />
          ))}
        </div>
      </div>
    </section>
  );
}
