import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { parseFlexibleDateToISO } from "@/lib/aicte";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface CalendarDatePickerProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  required?: boolean;
  /**
   * "display" -> formats selected date as "20 August 2025"
   * "iso" -> formats selected date as "2025-08-20"
   */
  outputFormat?: "display" | "iso";
  /**
   * Optional list of ISO dates ("YYYY-MM-DD") to highlight with a dot indicator in the calendar
   */
  highlightedIsoDates?: string[];
  allowClear?: boolean;
  className?: string;
  ariaLabel?: string;
}

function toIsoDateString(year: number, monthIndex: number, day: number): string {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatToDisplayDate(year: number, monthIndex: number, day: number): string {
  return `${day} ${MONTH_NAMES[monthIndex]} ${year}`;
}

export default function CalendarDatePicker({
  id,
  value,
  onChange,
  placeholder = "Click to select date from calendar...",
  required = false,
  outputFormat = "display",
  highlightedIsoDates = [],
  allowClear = true,
  className = "",
  ariaLabel = "Select date",
}: CalendarDatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  // Parse currently selected date into ISO ("YYYY-MM-DD") if possible
  const selectedIso = useMemo(() => parseFlexibleDateToISO(value), [value]);

  const initialViewDate = useMemo(() => {
    if (selectedIso) {
      const [y, m, d] = selectedIso.split("-").map(Number);
      if (y && m && d) {
        return new Date(y, m - 1, d);
      }
    }
    return new Date();
  }, [selectedIso]);

  const [viewYear, setViewYear] = useState<number>(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialViewDate.getMonth());

  // Sync calendar month/year view when value changes externally
  useEffect(() => {
    if (selectedIso) {
      const [y, m] = selectedIso.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [selectedIso]);

  // Compute viewport-safe position and close pop-out calendar on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 310;
      const popoverHeight = 350;
      const padding = 12;

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - padding) {
        left = Math.max(padding, rect.right - popoverWidth);
      }
      if (left < padding) {
        left = padding;
      }

      let top = rect.bottom + 6;
      if (
        top + popoverHeight > window.innerHeight - padding &&
        rect.top - popoverHeight - 6 > padding
      ) {
        top = rect.top - popoverHeight - 6;
      }

      setPopoverCoords({ top, left });
    };

    updatePosition();

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const highlightedSet = useMemo(
    () => new Set(highlightedIsoDates),
    [highlightedIsoDates]
  );

  const yearsList = useMemo(() => {
    const currentY = new Date().getFullYear();
    const list: number[] = [];
    for (let y = currentY - 6; y <= currentY + 6; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const todayNow = new Date();
  const todayIso = toIsoDateString(
    todayNow.getFullYear(),
    todayNow.getMonth(),
    todayNow.getDate()
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const nextVal =
      outputFormat === "iso"
        ? toIsoDateString(viewYear, viewMonth, day)
        : formatToDisplayDate(viewYear, viewMonth, day);
    onChange(nextVal);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    const nextVal =
      outputFormat === "iso"
        ? toIsoDateString(now.getFullYear(), now.getMonth(), now.getDate())
        : formatToDisplayDate(now.getFullYear(), now.getMonth(), now.getDate());
    onChange(nextVal);
    setIsOpen(false);
  };

  const displayText = useMemo(() => {
    if (!value) return "";
    if (selectedIso) {
      const [y, m, d] = selectedIso.split("-").map(Number);
      if (y && m && d) {
        return formatToDisplayDate(y, m - 1, d);
      }
    }
    return value;
  }, [value, selectedIso]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Input Box — Clicking anywhere opens the pop-out calendar */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-light hover:text-white transition z-10"
          aria-label="Toggle pop-out calendar"
        >
          <CalendarIcon size={16} />
        </button>

        <input
          id={id}
          type="text"
          readOnly
          required={required}
          value={displayText}
          onClick={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 text-white text-sm placeholder-white/35 cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
        />

        {allowClear && value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
            aria-label="Clear selected date"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-label uppercase tracking-wider text-primary-light hover:text-white transition"
          >
            Pick
          </button>
        )}
      </div>

      {/* Pop-Out Mini Calendar Popover (Rendered in Portal so parent overflow never clips it) */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Calendar date picker"
            style={{
              position: "fixed",
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
            }}
            className="z-[9999] w-[300px] sm:w-[310px] p-4 rounded-2xl border border-white/20 bg-[#070d1f] shadow-[0_24px_60px_rgba(0,0,0,0.95)] text-white animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Calendar Header: Prev / Month + Year Selectors / Next */}
            <div className="flex items-center justify-between gap-1.5 mb-3 pb-2.5 border-b border-white/10">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.15] text-white/80 hover:text-white transition"
                aria-label="Previous month"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  aria-label="Select month"
                  className="px-2 py-1 rounded-lg bg-[#0b1530] border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-primary"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#0b1530] text-white">
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  aria-label="Select year"
                  className="px-2 py-1 rounded-lg bg-[#0b1530] border border-white/15 text-white text-xs font-mono font-semibold focus:outline-none focus:border-primary"
                >
                  {yearsList.map((yr) => (
                    <option key={yr} value={yr} className="bg-[#0b1530] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.15] text-white/80 hover:text-white transition"
                aria-label="Next month"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {SHORT_DAYS.map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-label uppercase tracking-wider text-ink-soft py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellIso = toIsoDateString(viewYear, viewMonth, dayNum);
                const isSelected = selectedIso === cellIso;
                const isToday = todayIso === cellIso;
                const hasEventDot = highlightedSet.has(cellIso);

                return (
                  <button
                    key={cellIso}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`relative h-8 rounded-lg text-xs font-mono flex flex-col items-center justify-center transition ${
                      isSelected
                        ? "bg-primary text-white font-bold shadow-[0_0_12px_rgba(19,54,212,0.7)]"
                        : isToday
                        ? "bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold"
                        : "text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasEventDot && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelected ? "bg-amber-300" : "bg-emerald-400"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Quick Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary-light font-label font-semibold transition"
              >
                Today
              </button>

              <div className="flex items-center gap-2">
                {allowClear && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setIsOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-ink-soft hover:text-white font-label transition"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-label transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
