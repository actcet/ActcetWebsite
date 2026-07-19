import type { EventItem } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="h-[170px] relative overflow-hidden">
        <img src={event.image} alt={event.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-6 flex flex-col gap-2.5 flex-1">
        <Badge>{event.category}</Badge>
        <h4 className="font-display font-semibold text-navy text-lg leading-snug">{event.name}</h4>
        <div className="text-primary font-label font-semibold text-sm">{event.date}</div>
        <div className="text-sm text-ink-soft">
          {event.location} &middot; {event.participants} participants
        </div>
        <div className="text-sm text-ink-soft">
          <b className="text-ink">Domain:</b> {event.domain}
        </div>
        <div className="text-sm text-ink-soft">
          <b className="text-ink">Objective:</b> {event.objective}
        </div>
        <div className="text-sm text-ink-soft">
          <b className="text-ink">Outcome:</b> {event.outcome}
        </div>
        <div className="flex gap-2.5 mt-4">
          <button className="flex-1 py-2.5 rounded-xl bg-primary text-white font-label font-semibold text-xs hover:bg-primary-dark transition-colors">
            View Details
          </button>
          <button className="flex-1 py-2.5 rounded-xl border border-navy/[0.09] text-navy font-label font-semibold text-xs hover:border-primary/40 transition-colors">
            Gallery
          </button>
        </div>
      </div>
    </Card>
  );
}
