import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Target,
  Award,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { EventItem } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { placeholderImage, safeImageSrc } from "@/lib/utils";

export default function EventCard({ event }: { event: EventItem }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const coverSrc = safeImageSrc(
    event.image,
    placeholderImage(event.id || "actcet-event", 600, 400)
  );

  const allPhotos = Array.from(
    new Set(
      [
        coverSrc,
        ...(Array.isArray(event.gallery)
          ? event.gallery.map((g) => safeImageSrc(g)).filter(Boolean)
          : []),
      ].filter(Boolean)
    )
  );

  // Keyboard support for Details & Gallery modals (Escape to close, Arrow keys to switch photos)
  useEffect(() => {
    if (!isDetailsOpen && !isGalleryOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDetailsOpen(false);
        setIsGalleryOpen(false);
      } else if (isGalleryOpen && allPhotos.length > 1) {
        if (e.key === "ArrowLeft") {
          setActivePhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
        } else if (e.key === "ArrowRight") {
          setActivePhotoIndex((prev) => (prev + 1) % allPhotos.length);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailsOpen, isGalleryOpen, allPhotos.length]);

  const handleOpenGallery = (startIndex = 0) => {
    setActivePhotoIndex(startIndex);
    setIsDetailsOpen(false);
    setIsGalleryOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <div className="h-[170px] relative overflow-hidden bg-[#070d1f]">
          <img
            src={coverSrc}
            alt={event.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {allPhotos.length > 1 && (
            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-label flex items-center gap-1 border border-white/15">
              <Images size={12} />
              <span>{allPhotos.length} Photos</span>
            </span>
          )}
        </div>
        <div className="p-6 flex flex-col gap-2.5 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge>{event.category}</Badge>
            {event.academicYear && (
              <span className="text-xs font-mono text-ink-soft">{event.academicYear}</span>
            )}
          </div>
          <h4 className="font-display font-semibold text-navy text-lg leading-snug">
            {event.name}
          </h4>
          <div className="text-primary font-label font-semibold text-sm">{event.date}</div>
          <div className="text-sm text-ink-soft">
            {event.location} &middot; {event.participants} participants
          </div>
          <div className="text-sm text-ink-soft">
            <b className="text-ink">Domain:</b> {event.domain}
          </div>
          <div className="text-sm text-ink-soft line-clamp-2">
            <b className="text-ink">Objective:</b> {event.objective}
          </div>
          <div className="text-sm text-ink-soft line-clamp-2">
            <b className="text-ink">Outcome:</b> {event.outcome}
          </div>
          <div className="flex gap-2.5 mt-auto pt-4">
            <button
              type="button"
              onClick={() => setIsDetailsOpen(true)}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-label font-semibold text-xs hover:bg-primary-dark transition-colors"
            >
              View Details
            </button>
            <button
              type="button"
              onClick={() => handleOpenGallery(0)}
              className="flex-1 py-2.5 rounded-xl border border-navy/[0.09] text-navy font-label font-semibold text-xs hover:border-primary/40 transition-colors"
            >
              Gallery ({allPhotos.length})
            </button>
          </div>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* READ-ONLY EVENT DETAILS MODAL FOR MEMBERS */}
      {/* ======================================================== */}
      {isDetailsOpen && (
        <div
          className="fixed inset-0 z-[2600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0b1530] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`event-detail-title-${event.id}`}
          >
            {/* Cover Banner */}
            <div className="relative h-56 sm:h-64 w-full bg-[#070d1f] overflow-hidden">
              <img
                src={coverSrc}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1530] via-[#0b1530]/30 to-transparent" />
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/15 transition"
                aria-label="Close event details"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-label font-semibold bg-primary text-white">
                  {event.category}
                </span>
                {event.academicYear && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/15 backdrop-blur-md text-white border border-white/20">
                    Session {event.academicYear}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-label bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {event.domain}
                </span>
              </div>
            </div>

            {/* Event Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h3
                  id={`event-detail-title-${event.id}`}
                  className="font-display text-2xl sm:text-3xl font-bold text-white"
                >
                  {event.name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-ink-soft">
                    <Calendar size={15} className="text-primary-light shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase text-white/50">Date</span>
                      <strong className="text-white">{event.date}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-soft">
                    <MapPin size={15} className="text-emerald-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase text-white/50">Location</span>
                      <strong className="text-white">{event.location}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink-soft">
                    <Users size={15} className="text-amber-300 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase text-white/50">
                        Participants
                      </span>
                      <strong className="text-white">{event.participants}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                {event.objective && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 text-xs font-label uppercase tracking-wider text-primary-light mb-1">
                      <Target size={14} />
                      <span>Objective</span>
                    </div>
                    <p className="text-ink-soft leading-relaxed">{event.objective}</p>
                  </div>
                )}

                {event.outcome && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 text-xs font-label uppercase tracking-wider text-emerald-300 mb-1">
                      <Award size={14} />
                      <span>Outcome &amp; Impact</span>
                    </div>
                    <p className="text-ink-soft leading-relaxed">{event.outcome}</p>
                  </div>
                )}

                {event.description && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 text-xs font-label uppercase tracking-wider text-amber-300 mb-1">
                      <Sparkles size={14} />
                      <span>Event Highlights &amp; Details</span>
                    </div>
                    <p className="text-ink-soft leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleOpenGallery(0)}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition flex items-center gap-2"
                >
                  <Images size={15} />
                  <span>View Event Gallery ({allPhotos.length} Photos)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-label font-medium text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* READ-ONLY EVENT PHOTO GALLERY MODAL FOR MEMBERS */}
      {/* ======================================================== */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-[2600] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsGalleryOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-[#0b1530] text-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`event-gallery-title-${event.id}`}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <h3
                  id={`event-gallery-title-${event.id}`}
                  className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2"
                >
                  <Images size={18} className="text-primary-light" />
                  <span>{event.name} — Photo Gallery</span>
                </h3>
                <p className="text-xs text-ink-soft">
                  {event.date} • {allPhotos.length} photo{allPhotos.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white transition"
                aria-label="Close event gallery"
              >
                <X size={18} />
              </button>
            </div>

            {/* Active Photo Stage */}
            <div className="relative bg-[#050914] flex items-center justify-center min-h-[280px] sm:min-h-[380px] max-h-[55vh] overflow-hidden">
              <img
                src={allPhotos[activePhotoIndex] || coverSrc}
                alt={`${event.name} photo ${activePhotoIndex + 1}`}
                className="max-h-[55vh] w-auto max-w-full object-contain"
              />

              {allPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex(
                        (prev) => (prev - 1 + allPhotos.length) % allPhotos.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/15 transition"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) => (prev + 1) % allPhotos.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/15 transition"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-mono border border-white/15">
                {activePhotoIndex + 1} / {allPhotos.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="p-4 bg-[#0b1530] border-t border-white/10 overflow-x-auto">
              <div className="flex items-center gap-3">
                {allPhotos.map((photoUrl, idx) => (
                  <button
                    key={`${photoUrl.slice(0, 32)}-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative h-16 w-24 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                      activePhotoIndex === idx
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={photoUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
