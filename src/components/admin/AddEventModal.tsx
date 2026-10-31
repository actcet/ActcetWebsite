import React, { useEffect, useState } from "react";
import { X, Plus, Sparkles, AlertCircle, Save, Trash2 } from "lucide-react";
import { portalError } from "@/services/portalService";
import { useClubData } from "@/context/ClubDataContext";
import {
  calculateHoursBasedPoints,
  isValidAcademicYear,
  normalizeAcademicYear,
  parseFlexibleDateToISO,
} from "@/lib/aicte";
import CalendarDatePicker from "@/components/ui/CalendarDatePicker";
import type { ClubEvent } from "@/types";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAcademicYear: string;
  editingEvent?: ClubEvent | null;
  onEventCreated?: (event: ClubEvent) => void;
}

export default function AddEventModal({
  isOpen,
  onClose,
  defaultAcademicYear,
  editingEvent = null,
  onEventCreated,
}: AddEventModalProps) {
  const { addEvent, editEvent, deleteEventRecord, academicYears, settings } = useClubData();

  const [eventName, setEventName] = useState("");
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [customYear, setCustomYear] = useState("");
  const [isAddingCustomYear, setIsAddingCustomYear] = useState(false);
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [aicteHours, setAicteHours] = useState("4");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteInModal, setConfirmDeleteInModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setConfirmDeleteInModal(false);
    if (editingEvent) {
      setEventName(editingEvent.name);
      const normYear = normalizeAcademicYear(editingEvent.academicYear);
      if (academicYears.includes(normYear)) {
        setAcademicYear(normYear);
        setIsAddingCustomYear(false);
      } else {
        setCustomYear(normYear);
        setIsAddingCustomYear(true);
      }
      setEventDate(
        parseFlexibleDateToISO(editingEvent.date) || new Date().toISOString().split("T")[0]
      );
      setAicteHours(String(editingEvent.aicteHours || 4));
      setDescription(editingEvent.description || "");
    } else {
      setEventName("");
      setAcademicYear(defaultAcademicYear);
      setCustomYear("");
      setIsAddingCustomYear(false);
      setEventDate(new Date().toISOString().split("T")[0]);
      setAicteHours("4");
      setDescription("");
    }
  }, [isOpen, editingEvent, defaultAcademicYear, academicYears]);

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

  const hoursPerPoint = settings?.hoursPerAICTEPoint ?? 4;
  const parsedHoursPreview = aicteHours.trim() === "" ? 4 : parseFloat(aicteHours);
  const previewPoints =
    Number.isFinite(parsedHoursPreview) && parsedHoursPreview >= 0
      ? calculateHoursBasedPoints(parsedHoursPreview, hoursPerPoint)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = eventName.trim();
    const finalYear = normalizeAcademicYear(
      isAddingCustomYear ? customYear : academicYear
    );
    const trimmedHours = aicteHours.trim();
    const parsedHours = trimmedHours === "" ? 4 : parseFloat(trimmedHours);

    if (!cleanName) {
      setError("Event name is required.");
      return;
    }

    if (!finalYear || !isValidAcademicYear(finalYear)) {
      setError("Please specify a valid academic year in YYYY-YY format (e.g. 2026-27).");
      return;
    }

    const normalizedIsoDate = parseFlexibleDateToISO(eventDate);
    if (!normalizedIsoDate || !Number.isFinite(Date.parse(normalizedIsoDate))) {
      setError("Please choose a valid event date.");
      return;
    }

    if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 10000) {
      setError("Event duration/hours must be a positive number (defaults to 4 hrs if left blank).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEvent) {
        const ok = await editEvent(editingEvent, {
          name: cleanName,
          academicYear: finalYear,
          date: normalizedIsoDate,
          aicteHours: parsedHours,
          description: description.trim() || "",
          status: "completed",
          archived: false,
        });
        if (ok) {
          onClose();
        }
      } else {
        const created = await addEvent({
          name: cleanName,
          academicYear: finalYear,
          date: normalizedIsoDate,
          aicteHours: parsedHours,
          description: description.trim() || undefined,
          status: "completed",
          archived: false,
        });
        onEventCreated?.(created);
        setEventName("");
        setDescription("");
        setAicteHours("4");
        setError(null);
        onClose();
      }
    } catch (cause) {
      setError(portalError(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2600] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-white/20 bg-[#070d1f]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] text-white p-6 sm:p-8 my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/15 transition"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary-light text-xs font-label uppercase tracking-widest mb-1.5">
            <Sparkles size={14} />
            <span>1. AICTE Allocation Dropdown Event</span>
          </div>
          <h2 id="event-modal-title" className="font-display text-2xl font-bold tracking-tight">
            {editingEvent ? "Edit AICTE Dropdown Event" : "Add Event to AICTE Dropdown"}
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            Adds an event name, academic year, date, and default hours to the dropdown used when allotting AICTE points to members.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-4"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Name */}
          <div>
            <label
              htmlFor="admin-event-name"
              className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
            >
              Event Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="admin-event-name"
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Meteor Shower Night Watch"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          {/* Academic Year & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Academic Year */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-event-year"
                  className="text-xs font-label uppercase tracking-wider text-white/80"
                >
                  Academic Year <span className="text-rose-400">*</span>
                </label>
                {(!editingEvent || editingEvent.isCatalogEvent) && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomYear(!isAddingCustomYear)}
                    className="text-[10px] text-primary-light hover:underline"
                  >
                    {isAddingCustomYear ? "Use existing" : "+ New session"}
                  </button>
                )}
              </div>

              {isAddingCustomYear ? (
                <input
                  id="admin-event-year"
                  type="text"
                  required
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="e.g. 2026-27"
                  disabled={Boolean(editingEvent && !editingEvent.isCatalogEvent)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition disabled:opacity-60"
                />
              ) : (
                <select
                  id="admin-event-year"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  disabled={Boolean(editingEvent && !editingEvent.isCatalogEvent)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b1530] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition disabled:opacity-60"
                >
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr} className="bg-[#0b1530] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Event Date */}
            <div>
              <label
                htmlFor="admin-event-date"
                className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
              >
                Event Date <span className="text-rose-400">*</span>
              </label>
              <CalendarDatePicker
                id="admin-event-date"
                value={eventDate}
                onChange={setEventDate}
                required
                outputFormat="display"
                allowClear={false}
                placeholder="Click to pick event date..."
                ariaLabel="Select Event Date"
              />
            </div>
          </div>

          {/* Optional Event Duration / AICTE Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-event-hours"
                className="text-xs font-label uppercase tracking-wider text-white/80"
              >
                Default Event Duration (Hours){" "}
                <span className="text-white/40 font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] text-amber-300">
                {previewPoints} AICTE point(s) default
              </span>
            </div>
            <input
              id="admin-event-hours"
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={aicteHours}
              onChange={(e) => setAicteHours(e.target.value)}
              placeholder="e.g. 4"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <p className="text-[11px] text-ink-soft mt-1">
              Rule: {hoursPerPoint} completed hours = 1 AICTE point. Defaults to 4 hours if left blank.
            </p>
          </div>

          {/* Optional Description */}
          <div>
            <label
              htmlFor="admin-event-description"
              className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5"
            >
              Description <span className="text-white/40 font-normal">(Optional)</span>
            </label>
            <textarea
              id="admin-event-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of event objectives or telescope equipment used..."
              className="w-full px-4 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
            />
          </div>

          {/* Submit & Delete buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isSubmitting || !settings}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {editingEvent ? (
                <>
                  <Save size={18} />
                  <span>Save Event Changes</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Create Event</span>
                </>
              )}
            </button>

            {editingEvent && (
              <div>
                {confirmDeleteInModal ? (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-between gap-2">
                    <span className="text-xs text-rose-200 font-medium">
                      Delete &ldquo;{editingEvent.name}&rdquo; from dropdown?
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteInModal(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-label transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            const ok = await deleteEventRecord(editingEvent);
                            if (ok) onClose();
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-xs text-white font-label font-bold transition flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Confirm Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteInModal(true)}
                    className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-label font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Delete This Event from Dropdown</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
