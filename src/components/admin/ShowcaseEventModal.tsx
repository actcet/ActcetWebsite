import React, { useState, useRef, useEffect } from "react";
import {
  X,
  MapPin,
  Users,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useClubData } from "@/context/ClubDataContext";
import { isValidAcademicYear, normalizeAcademicYear } from "@/lib/aicte";
import { compressImageFileToDataUrl } from "@/lib/imageUtils";
import { placeholderImage, safeImageSrc } from "@/lib/utils";
import CalendarDatePicker from "@/components/ui/CalendarDatePicker";
import type { ShowcaseEvent } from "@/types";

interface ShowcaseEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAcademicYear?: string;
  editingEvent?: ShowcaseEvent | null;
}

const PRESET_YEARS = ["2026-27", "2025-26", "2024-25", "2023-24", "2022-23"];
const CATEGORIES = [
  "Workshop",
  "Outreach",
  "Orientation",
  "Stargazing",
  "Competition",
  "National Space Day",
  "Webinar",
  "Fest",
];
const DOMAINS = [
  "Technology",
  "Outreach",
  "Community",
  "Innovation",
  "Research",
  "Observation",
  "Competition",
];

export default function ShowcaseEventModal({
  isOpen,
  onClose,
  defaultAcademicYear = "2025-26",
  editingEvent = null,
}: ShowcaseEventModalProps) {
  const { academicYears, saveShowcaseEvent } = useClubData();
  const isEditMode = Boolean(editingEvent?.id);

  const availableYears = Array.from(
    new Set([
      ...PRESET_YEARS,
      ...academicYears.map((y) => normalizeAcademicYear(y)),
      ...(editingEvent?.academicYear ? [normalizeAcademicYear(editingEvent.academicYear)] : []),
    ])
  )
    .filter(Boolean)
    .sort()
    .reverse();

  const initialYear = editingEvent?.academicYear
    ? normalizeAcademicYear(editingEvent.academicYear)
    : normalizeAcademicYear(defaultAcademicYear);

  const [selectedYear, setSelectedYear] = useState(initialYear || "2025-26");
  const [customYear, setCustomYear] = useState("");
  const [isCustomYear, setIsCustomYear] = useState(false);

  const [name, setName] = useState(editingEvent?.name || "");
  const [date, setDate] = useState(editingEvent?.date || "");
  const [location, setLocation] = useState(editingEvent?.location || "TCET Campus");
  const [category, setCategory] = useState(editingEvent?.category || "Workshop");
  const [domain, setDomain] = useState(editingEvent?.domain || "Technology");
  const [participants, setParticipants] = useState(editingEvent?.participants || "100+");
  const [objective, setObjective] = useState(editingEvent?.objective || "");
  const [outcome, setOutcome] = useState(editingEvent?.outcome || "");
  const [description, setDescription] = useState(editingEvent?.description || "");
  const [coverImage, setCoverImage] = useState(editingEvent?.image || "");
  const [gallery, setGallery] = useState<string[]>(editingEvent?.gallery || []);
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmRemoveCover, setConfirmRemoveCover] = useState(false);
  const [confirmRemoveGalleryIdx, setConfirmRemoveGalleryIdx] = useState<number | null>(
    null
  );

  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync and reset state whenever the modal opens or target event changes
  useEffect(() => {
    if (!isOpen) return;
    const yr = editingEvent?.academicYear
      ? normalizeAcademicYear(editingEvent.academicYear)
      : normalizeAcademicYear(defaultAcademicYear);
    setSelectedYear(yr || "2025-26");
    setCustomYear("");
    setIsCustomYear(false);
    setName(editingEvent?.name || "");
    setDate(editingEvent?.date || "");
    setLocation(editingEvent?.location || "TCET Campus");
    setCategory(editingEvent?.category || "Workshop");
    setDomain(editingEvent?.domain || "Technology");
    setParticipants(editingEvent?.participants || "100+");
    setObjective(editingEvent?.objective || "");
    setOutcome(editingEvent?.outcome || "");
    setDescription(editingEvent?.description || "");
    setCoverImage(editingEvent?.image || "");
    setGallery(Array.isArray(editingEvent?.gallery) ? editingEvent.gallery : []);
    setPhotoUrlInput("");
    setFormError(null);
    setConfirmRemoveCover(false);
    setConfirmRemoveGalleryIdx(null);
  }, [isOpen, editingEvent, defaultAcademicYear]);

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

  const finalAcademicYear = normalizeAcademicYear(isCustomYear ? customYear : selectedYear);

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setIsUploading(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 720, 500, 0.72);
      setCoverImage(dataUrl);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to process cover image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setFormError(null);
    if (gallery.length + files.length > 15) {
      setFormError("You can attach up to 15 gallery photos per event.");
      e.target.value = "";
      return;
    }
    setIsUploading(true);
    try {
      const compressed: string[] = [];
      for (const file of files) {
        const dataUrl = await compressImageFileToDataUrl(file, 660, 460, 0.68);
        compressed.push(dataUrl);
      }
      setGallery((prev) => [...prev, ...compressed]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to process gallery photos.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddGalleryUrl = () => {
    const safeUrl = safeImageSrc(photoUrlInput);
    if (!safeUrl) {
      setFormError("Please enter a valid image URL (https://... or /images/...).");
      return;
    }
    if (gallery.length >= 15) {
      setFormError("You can attach up to 15 gallery photos per event.");
      return;
    }
    setFormError(null);
    setGallery((prev) => [...prev, safeUrl]);
    setPhotoUrlInput("");
  };

  const handleRemoveGalleryPhoto = (idx: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
    setConfirmRemoveGalleryIdx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Event name is required.");
      return;
    }
    if (!isValidAcademicYear(finalAcademicYear)) {
      setFormError("Please select or enter a valid academic year (e.g. 2025-26).");
      return;
    }
    if (!date.trim()) {
      setFormError("Please enter the event date (e.g. 14 July 2025).");
      return;
    }
    if (!objective.trim()) {
      setFormError("Please enter the event objective.");
      return;
    }
    if (!outcome.trim()) {
      setFormError("Please enter the event outcome.");
      return;
    }

    const baseSlug =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 36) || "event";

    const eventId =
      editingEvent?.id ||
      `${baseSlug}-${finalAcademicYear}-${Date.now().toString(36).slice(-4)}`;

    const fallbackImg = placeholderImage(eventId, 600, 400);
    const sanitizedCover = safeImageSrc(coverImage) || gallery[0] || fallbackImg;
    const sanitizedGallery = gallery.map((g) => safeImageSrc(g)).filter(Boolean);

    setIsSubmitting(true);
    try {
      const saved = await saveShowcaseEvent({
        id: eventId,
        academicYear: finalAcademicYear,
        name: name.trim(),
        date: date.trim(),
        location: location.trim() || "TCET Campus",
        domain: domain.trim() || "Astronomy",
        category: category.trim() || "Workshop",
        participants: participants.trim() || "100+",
        objective: objective.trim(),
        outcome: outcome.trim(),
        description: description.trim(),
        image: sanitizedCover,
        gallery: sanitizedGallery.length > 0 ? sanitizedGallery : [sanitizedCover],
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
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0b1530]/95 backdrop-blur-2xl text-white shadow-[0_24px_64px_rgba(0,0,0,0.75)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="showcase-event-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0b1530]/95 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-light">
              <Sparkles size={20} />
            </div>
            <div>
              <h2
                id="showcase-event-modal-title"
                className="font-display text-xl sm:text-2xl font-bold text-white"
              >
                {isEditMode
                  ? "Edit Website Showcase Event & Gallery"
                  : "Publish Event to Website Events Section"}
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Displayed permanently in the website&apos;s Events section under the selected Academic Year. Members can view details and gallery photos.
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
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {formError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5"
            >
              <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Academic Year Selector Buttons */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-label uppercase tracking-wider text-amber-300 font-semibold">
                1. Choose Target Academic Year Section <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomYear(!isCustomYear)}
                className="text-xs text-primary-light hover:underline"
              >
                {isCustomYear ? "Choose from year buttons" : "+ Custom Academic Year"}
              </button>
            </div>

            {isCustomYear ? (
              <input
                type="text"
                value={customYear}
                onChange={(e) => setCustomYear(e.target.value)}
                placeholder="e.g. 2027-28"
                className="w-full px-4 py-2.5 rounded-xl bg-[#070d1f] border border-white/15 text-white text-sm focus:outline-none focus:border-primary"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableYears.map((yr) => {
                  const active = selectedYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYear(yr)}
                      className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border transition flex items-center gap-1.5 ${
                        active
                          ? "bg-primary text-white border-primary shadow-[0_4px_14px_rgba(19,54,212,0.5)]"
                          : "bg-[#070d1f] text-white/70 border-white/15 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {active && <CheckCircle2 size={13} />}
                      <span>{yr}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] text-ink-soft">
              This event will be showcased under the <strong>{finalAcademicYear}</strong> section on the website&apos;s Events page.
            </p>
          </div>

          {/* 2. Event Title, Date, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Event Name / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Astromanthan 2025 — National Space Day"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label
                htmlFor="showcase-event-date"
                className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
              >
                Event Date <span className="text-rose-400">*</span>
              </label>
              <CalendarDatePicker
                id="showcase-event-date"
                value={date}
                onChange={setDate}
                required
                outputFormat="display"
                placeholder="Click to select event date..."
                ariaLabel="Select Showcase Event Date"
              />
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Location / Venue <span className="text-rose-400">*</span>
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
                  placeholder="e.g. TCET Seminar Hall / Rooftop Observatory"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* 3. Category, Domain, Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Category
              </label>
              <input
                type="text"
                list="showcase-categories-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Workshop"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-primary transition"
              />
              <datalist id="showcase-categories-list">
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
                list="showcase-domains-list"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Technology"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-primary transition"
              />
              <datalist id="showcase-domains-list">
                {DOMAINS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Participants Count
              </label>
              <div className="relative">
                <Users
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="e.g. 120+"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* 4. Objective, Outcome & Full Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Objective <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="What was the core purpose of this event?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Outcome <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What impact or learning outcome was achieved?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary transition resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Additional Event Details / Highlights (Optional — shown in &ldquo;View Details&rdquo;)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add speaker names, key activities, or extended summary for members..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary transition resize-none"
              />
            </div>
          </div>

          {/* 5. Cover Image Upload & URL */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-label uppercase tracking-wider text-white/90 font-semibold block">
                  Cover Photo (Card Thumbnail)
                </span>
                <span className="text-[11px] text-ink-soft">
                  Upload a cover image from your computer or paste an image URL.
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
                  className="px-3.5 py-2 rounded-xl bg-primary/25 hover:bg-primary/35 border border-primary/40 text-white text-xs font-label font-semibold flex items-center gap-1.5 transition"
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
                placeholder="Or paste cover image URL (e.g. /images/... or https://...)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#070d1f] border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-primary"
              />
              {coverImage && (
                <div className="relative h-16 w-32 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-[#070d1f]">
                  <img
                    src={coverImage}
                    alt="Cover preview"
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
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-300 hover:text-white"
                      aria-label="Remove cover image"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 6. Gallery Photos Upload (Multiple Photos) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-label uppercase tracking-wider text-emerald-300 font-semibold block">
                  Event Gallery Photos ({gallery.length} Uploaded)
                </span>
                <span className="text-[11px] text-ink-soft">
                  Members can browse all these photos by clicking the &ldquo;Gallery&rdquo; button on the event card.
                </span>
              </div>

              <div>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFilesChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-label font-semibold flex items-center gap-1.5 transition"
                >
                  <ImageIcon size={14} />
                  <span>+ Upload Gallery Photos</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="Or paste an image URL to add to gallery..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#070d1f] border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddGalleryUrl}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-label flex items-center gap-1 transition"
              >
                <Plus size={14} />
                <span>Add URL</span>
              </button>
            </div>

            {gallery.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {gallery.map((photo, idx) => (
                  <div
                    key={`${photo.slice(0, 24)}-${idx}`}
                    className="relative h-20 rounded-xl overflow-hidden border border-white/15 bg-[#070d1f] group"
                  >
                    <img
                      src={photo}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {confirmRemoveGalleryIdx === idx ? (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-1 p-1">
                        <span className="text-[10px] font-label text-rose-200">
                          Delete photo?
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryPhoto(idx)}
                            className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-[10px] font-label font-bold text-white"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveGalleryIdx(null)}
                            className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px] font-label text-white"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveGalleryIdx(idx)}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-black/75 text-rose-300 hover:bg-rose-500 hover:text-white transition"
                        aria-label={`Remove gallery photo ${idx + 1}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Footer */}
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
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-xs uppercase tracking-wider transition shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? `Save Changes (${finalAcademicYear})`
                : `Publish to ${finalAcademicYear} Events`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
