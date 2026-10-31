import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Clock,
  MapPin,
  Link as LinkIcon,
  Upload,
  AlertTriangle,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { useClubData } from "@/context/ClubDataContext";
import { isValidAcademicYear, normalizeAcademicYear } from "@/lib/aicte";
import { compressImageFileToDataUrl } from "@/lib/imageUtils";
import { placeholderImage, safeExternalHref, safeImageSrc } from "@/lib/utils";
import CalendarDatePicker from "@/components/ui/CalendarDatePicker";
import type { UpcomingEvent } from "@/types";

interface UpcomingEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAcademicYear?: string;
  editingUpcoming?: UpcomingEvent | null;
}

const PRESET_YEARS = ["2026-27", "2025-26", "2024-25"];
const CATEGORIES = [
  "Stargazing",
  "Workshop",
  "Outreach",
  "Competition",
  "Guest Lecture",
  "Webinar",
  "Orientation",
  "Fest",
];

export default function UpcomingEventModal({
  isOpen,
  onClose,
  defaultAcademicYear = "2026-27",
  editingUpcoming = null,
}: UpcomingEventModalProps) {
  const { academicYears, saveUpcomingEvent } = useClubData();
  const isEditMode = Boolean(editingUpcoming?.id);

  const availableYears = Array.from(
    new Set([
      ...PRESET_YEARS,
      ...academicYears.map((y) => normalizeAcademicYear(y)),
      ...(editingUpcoming?.academicYear
        ? [normalizeAcademicYear(editingUpcoming.academicYear)]
        : []),
    ])
  )
    .filter(Boolean)
    .sort()
    .reverse();

  const [selectedYear, setSelectedYear] = useState(
    editingUpcoming?.academicYear
      ? normalizeAcademicYear(editingUpcoming.academicYear)
      : normalizeAcademicYear(defaultAcademicYear)
  );
  const [title, setTitle] = useState(editingUpcoming?.title || "");
  const [date, setDate] = useState(editingUpcoming?.date || "");
  const [time, setTime] = useState(editingUpcoming?.time || "");
  const [location, setLocation] = useState(editingUpcoming?.location || "TCET Campus");
  const [category, setCategory] = useState(editingUpcoming?.category || "Workshop");
  const [domain, setDomain] = useState(editingUpcoming?.domain || "Astronomy & Space");
  const [aicteHours, setAicteHours] = useState(
    editingUpcoming?.aicteHours ? String(editingUpcoming.aicteHours) : ""
  );
  const [registrationLink, setRegistrationLink] = useState(
    editingUpcoming?.registrationLink || ""
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    editingUpcoming?.registrationDeadline || ""
  );
  const [description, setDescription] = useState(editingUpcoming?.description || "");
  const [coverImage, setCoverImage] = useState(editingUpcoming?.coverImage || "");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmRemoveCover, setConfirmRemoveCover] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync and reset state whenever the modal opens or target mission changes
  useEffect(() => {
    if (!isOpen) return;
    setSelectedYear(
      editingUpcoming?.academicYear
        ? normalizeAcademicYear(editingUpcoming.academicYear)
        : normalizeAcademicYear(defaultAcademicYear)
    );
    setTitle(editingUpcoming?.title || "");
    setDate(editingUpcoming?.date || "");
    setTime(editingUpcoming?.time || "");
    setLocation(editingUpcoming?.location || "TCET Campus");
    setCategory(editingUpcoming?.category || "Workshop");
    setDomain(editingUpcoming?.domain || "Astronomy & Space");
    setAicteHours(editingUpcoming?.aicteHours ? String(editingUpcoming.aicteHours) : "");
    setRegistrationLink(editingUpcoming?.registrationLink || "");
    setRegistrationDeadline(editingUpcoming?.registrationDeadline || "");
    setDescription(editingUpcoming?.description || "");
    setCoverImage(editingUpcoming?.coverImage || "");
    setFormError(null);
    setConfirmRemoveCover(false);
  }, [isOpen, editingUpcoming, defaultAcademicYear]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setIsUploading(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 760, 520, 0.74);
      setCoverImage(dataUrl);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to process cover image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalYear = normalizeAcademicYear(selectedYear);
    if (!title.trim()) {
      setFormError("Upcoming event title is required.");
      return;
    }
    if (!isValidAcademicYear(finalYear)) {
      setFormError("Please select a valid academic year.");
      return;
    }
    if (!date.trim()) {
      setFormError("Please enter the upcoming event date.");
      return;
    }
    if (!location.trim()) {
      setFormError("Please enter the event venue/location.");
      return;
    }

    const rawRegLink = registrationLink.trim();
    const safeRegLink = rawRegLink ? safeExternalHref(rawRegLink) : "";
    if (rawRegLink && !safeRegLink) {
      setFormError(
        "Please enter a valid registration URL (e.g. https://forms.gle/...)."
      );
      return;
    }

    const parsedHours = aicteHours.trim() ? Number(aicteHours) : undefined;
    if (parsedHours !== undefined && (!Number.isFinite(parsedHours) || parsedHours <= 0)) {
      setFormError("AICTE hours must be a positive number if provided.");
      return;
    }

    const baseSlug =
      title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 36) || "mission";

    const upcomingId =
      editingUpcoming?.id ||
      `upcoming-${baseSlug}-${Date.now().toString(36).slice(-5)}`;

    const sanitizedCover =
      safeImageSrc(coverImage) || placeholderImage(upcomingId, 600, 400);

    setIsSubmitting(true);
    try {
      const saved = await saveUpcomingEvent({
        id: upcomingId,
        title: title.trim(),
        academicYear: finalYear,
        date: date.trim(),
        time: time.trim() || "TBA",
        location: location.trim(),
        category: category.trim() || "Upcoming Mission",
        domain: domain.trim() || "Astronomy & Space",
        description: description.trim(),
        coverImage: sanitizedCover,
        registrationLink: safeRegLink || "",
        registrationDeadline: registrationDeadline.trim(),
        aicteHours: parsedHours,
      });

      if (saved) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2700] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-amber-500/30 bg-[#0b1530]/95 backdrop-blur-2xl text-white shadow-[0_24px_64px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upcoming-event-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0b1530]/95 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Rocket size={20} />
            </div>
            <div>
              <h2
                id="upcoming-event-modal-title"
                className="font-display text-xl sm:text-2xl font-bold text-white"
              >
                {isEditMode
                  ? "Edit Upcoming Event & Registration"
                  : "Post New Upcoming Event (Future Missions)"}
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Showcased in the &ldquo;Future Events&rdquo; section with cover page photo and direct member registration link.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {formError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5"
            >
              <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Academic Year Pills */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <label className="block text-xs font-label uppercase tracking-wider text-amber-300 font-semibold">
              Academic Year Session <span className="text-rose-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableYears.map((yr) => {
                const active = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition flex items-center gap-1.5 ${
                      active
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow"
                        : "bg-[#070d1f] text-white/70 border-white/15 hover:text-white"
                    }`}
                  >
                    {active && <CheckCircle2 size={13} />}
                    <span>{yr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Title */}
          <div>
            <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
              Upcoming Event / Mission Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Sky Overnight Stargazing Camp 2026"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Date, Time, Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="upcoming-event-date"
                className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
              >
                Event Date <span className="text-rose-400">*</span>
              </label>
              <CalendarDatePicker
                id="upcoming-event-date"
                value={date}
                onChange={setDate}
                required
                outputFormat="display"
                placeholder="Click to select event date..."
                ariaLabel="Select Upcoming Event Date"
              />
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Time / Schedule
              </label>
              <div className="relative">
                <Clock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 6:30 PM – 9:30 PM"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Venue / Location <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. TCET Observatory"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Category, Domain, AICTE Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Category
              </label>
              <input
                type="text"
                list="upcoming-categories-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Stargazing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 transition"
              />
              <datalist id="upcoming-categories-list">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Observation"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Expected AICTE Hours
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={aicteHours}
                onChange={(e) => setAicteHours(e.target.value)}
                placeholder="Optional (e.g. 4)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Registration Link for Members & Deadline Note */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3">
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-primary-light font-semibold mb-1.5">
                Member Registration Link (Google Form / Unstop / Registration URL)
              </label>
              <div className="relative">
                <LinkIcon
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
                <input
                  type="url"
                  value={registrationLink}
                  onChange={(e) => setRegistrationLink(e.target.value)}
                  placeholder="https://forms.gle/your-registration-link"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary transition"
                />
              </div>
              <p className="text-[11px] text-ink-soft mt-1">
                Members will see a &ldquo;Register Now&rdquo; button on the Future Events card that opens this link.
              </p>
            </div>

            <div>
              <label
                htmlFor="upcoming-deadline-date"
                className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
              >
                Registration Deadline Date (Optional)
              </label>
              <CalendarDatePicker
                id="upcoming-deadline-date"
                value={registrationDeadline}
                onChange={setRegistrationDeadline}
                outputFormat="display"
                placeholder="Click to pick registration deadline date..."
                ariaLabel="Select Registration Deadline Date"
              />
            </div>
          </div>

          {/* Cover Page Photo Upload */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-label uppercase tracking-wider text-amber-300 font-semibold block">
                  Upcoming Event Cover Page Photo
                </span>
                <span className="text-[11px] text-ink-soft">
                  Upload a cover poster/photo from your device or paste an image URL.
                </span>
              </div>

              <div>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-label font-semibold flex items-center gap-1.5 transition"
                >
                  <Upload size={14} />
                  <span>{coverImage ? "Replace Cover Photo" : "Upload Cover Photo"}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <input
                type="text"
                value={coverImage.startsWith("data:") ? "" : coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Or paste cover photo URL (e.g. https://...)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#070d1f] border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-amber-400"
              />
              {coverImage && (
                <div className="relative h-20 w-36 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-[#070d1f]">
                  <img
                    src={coverImage}
                    alt="Upcoming Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  {confirmRemoveCover ? (
                    <div className="absolute inset-0 bg-black/85 flex items-center justify-center gap-1.5 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage("");
                          setConfirmRemoveCover(false);
                        }}
                        className="px-2 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-[10px] font-label font-bold text-white"
                      >
                        Remove?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveCover(false)}
                        className="px-1.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-[10px] font-label text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveCover(true)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-rose-300 hover:text-white"
                      aria-label="Remove cover photo"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description / Details */}
          <div>
            <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
              Event Description / Mission Highlights <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what members will experience, prerequisites, equipment provided, or schedule..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-label font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-label font-bold text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50"
            >
              {isSubmitting
                ? "Publishing..."
                : isEditMode
                ? "Update Upcoming Event"
                : "Publish Upcoming Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
