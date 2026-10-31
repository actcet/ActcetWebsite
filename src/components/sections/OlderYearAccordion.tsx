import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { YearEvents } from "@/types";
import EventCard from "./EventCard";

export default function OlderYearAccordion({ yearData }: { yearData: YearEvents }) {
  const [open, setOpen] = useState(false);

  return (
    <div id={yearData.id} className="mb-4 scroll-mt-24">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-8 py-6 rounded-xl2 bg-surface border border-navy/[0.09] hover:border-primary/40 transition-colors mb-3.5"
      >
        <h3 className="font-display font-bold text-navy text-2xl">{yearData.year}</h3>
        <ChevronDown
          size={20}
          className={`text-navy transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 py-2 pb-8">
            {yearData.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
