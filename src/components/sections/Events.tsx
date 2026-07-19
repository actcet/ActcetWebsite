import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import Badge from "@/components/ui/Badge";
import { yearEvents } from "@/data/events";
import EventCard from "./EventCard";
import MiniProgress from "./MiniProgress";
import OlderYearAccordion from "./OlderYearAccordion";

export default function Events() {
  const currentYear = yearEvents.find((y) => y.current);
  const olderYears = yearEvents.filter((y) => !y.current);

  return (
    <section id="events" className="py-28 px-[6vw]">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Mission Log</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-4">Events</h2>
        <p className="text-ink-soft max-w-xl text-[1.05rem] mb-10">
          Every workshop, outreach drive, and stargazing night — organised by academic year.
        </p>

        {currentYear && (
          <div id={currentYear.id} className="mb-24 scroll-mt-24">
            <div className="flex items-baseline gap-5 flex-wrap mb-1">
              <h2 className="font-display font-bold text-navy text-[clamp(2.2rem,5vw,3.4rem)]">
                {currentYear.year}
              </h2>
              <Badge>Current Year</Badge>
            </div>

            <MiniProgress steps={currentYear.progression} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {currentYear.events.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.06}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
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
