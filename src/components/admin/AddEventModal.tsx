import React, { useState } from "react";
import { X, Calendar, Plus, Sparkles, AlertCircle } from "lucide-react";
import { portalError } from "@/services/portalService";
import { useClubData } from "@/context/ClubDataContext";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAcademicYear: string;
}

export default function AddEventModal({
  isOpen,
  onClose,
  defaultAcademicYear,
}: AddEventModalProps) {
  const { addEvent, academicYears, settings } = useClubData();

  const [eventName, setEventName] = useState("");
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [customYear, setCustomYear] = useState("");
  const [isAddingCustomYear, setIsAddingCustomYear] = useState(false);
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [aicteHours, setAicteHours] = useState("4");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = eventName.trim();
    const finalYear = isAddingCustomYear ? customYear.trim() : academicYear.trim();
    const parsedHours = parseFloat(aicteHours);

    // Validations
    if (!cleanName) {
      setError("Please enter the event name.");
      return;
    }

    if (!finalYear) {
      setError("Please specify an academic year (e.g. 2026-27).");
      return;
    }

    if (!eventDate) {
      setError("Please choose a valid event date.");
      return;
    }

    if (isNaN(parsedHours) || parsedHours <= 0) {
      setError("AICTE hours must be a positive number (e.g. 1, 2, 3, 4).");
      return;
    }

    // Call shared service
    setIsSubmitting(true);
    try {
      await addEvent({
        name: cleanName,
        academicYear: finalYear,
        date: eventDate,
        aicteHours: parsedHours,
        description: description.trim() || undefined,
      });

    // Reset & Close
      setEventName("");
      setDescription("");
      setAicteHours("4");
      setError(null);
      onClose();
    } catch (cause) { setError(portalError(cause)); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[2600] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-white/20 bg-[#070d1f]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] text-white p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
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
            <span>Admin Event Management</span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Add New Club Event
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            New events dynamically appear as interactive columns in both Members Portal and Member Update tables.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Name */}
          <div>
            <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
              Event Name <span className="text-rose-400">*</span>
            </label>
            <input
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
                <label className="text-xs font-label uppercase tracking-wider text-white/80">
                  Academic Year <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomYear(!isAddingCustomYear)}
                  className="text-[10px] text-primary-light hover:underline"
                >
                  {isAddingCustomYear ? "Use existing" : "+ New session"}
                </button>
              </div>

              {isAddingCustomYear ? (
                <input
                  type="text"
                  required
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="e.g. 2027-28"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              ) : (
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b1530] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
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
              <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                Event Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0b1530] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          {/* AICTE Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-label uppercase tracking-wider text-white/80">
                AICTE Hours <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-amber-300">
                {settings ? (parseFloat(aicteHours) || 0) / settings.hoursPerAICTEPoint : "—"} AICTE point(s) earned
              </span>
            </div>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="40"
              required
              value={aicteHours}
              onChange={(e) => setAicteHours(e.target.value)}
              placeholder="e.g. 4"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <p className="text-[11px] text-ink-soft mt-1">
              Rule: {settings?.hoursPerAICTEPoint} hours = 1 AICTE point.
            </p>
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
              Description <span className="text-white/40 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of event objectives or telescope equipment used..."
              className="w-full px-4 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !settings}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Event & Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
