import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BellRing,
  Calendar,
  MapPin,
  Volume2,
  X,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useClubData } from "@/context/ClubDataContext";
import { useAuth } from "@/context/AuthContext";
import { placeholderImage } from "@/lib/utils";
import type { AppRoute } from "@/hooks/useAppRouter";
import type { UpcomingEvent } from "@/types";

interface UpcomingEventSweetAlertProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, anchor?: string) => void;
}

// Persistent singleton AudioContext + synthesized WAV fallback so browsers always play the "tring" sound clearly
let sharedAudioCtx: AudioContext | null = null;
let pendingGestureChime = false;
let fallbackWavDataUri: string | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  return sharedAudioCtx;
}

/**
 * Generates an in-memory 16-bit PCM WAV data URI of a warm, uplifting,
 * positive Major-chord arpeggio chime (C5 -> E5 -> G5 -> C6) with smooth attack
 * envelopes so `new Audio(uri).play()` sounds cheerful and musical across all browsers.
 */
function getBellChimeWavUri(): string {
  if (fallbackWavDataUri) return fallbackWavDataUri;

  const sampleRate = 44100;
  const durationSec = 1.15;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Uplifting, warm C-Major arpeggio (C5 -> E5 -> G5 -> C6 + warm harmony chord)
  const notes = [
    { freq: 523.25, overtone: 1046.5, start: 0.0, length: 0.45, decay: 6.5, amp: 0.28 }, // C5
    { freq: 659.25, overtone: 1318.51, start: 0.095, length: 0.48, decay: 6.2, amp: 0.30 }, // E5
    { freq: 783.99, overtone: 1567.98, start: 0.19, length: 0.55, decay: 5.8, amp: 0.32 }, // G5
    { freq: 1046.5, overtone: 2093.0, start: 0.29, length: 0.82, decay: 4.2, amp: 0.38 }, // C6 (bright joyful resolve)
    { freq: 659.25, overtone: 1318.51, start: 0.29, length: 0.78, decay: 4.8, amp: 0.16 }, // Warm E5 harmony on resolve
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const n of notes) {
      if (t >= n.start && t <= n.start + n.length) {
        const localT = t - n.start;
        // Smooth 14ms cosine/linear fade-in prevents harsh clicking on note attack
        const attack = Math.min(1, localT / 0.014);
        const decayEnv = Math.exp(-localT * n.decay);
        const env = attack * decayEnv;
        const wave =
          0.82 * Math.sin(2 * Math.PI * n.freq * localT) +
          0.18 * Math.sin(2 * Math.PI * n.overtone * localT);
        sample += wave * env * n.amp;
      }
    }

    // Soft saturation for warm celesta/chime tone
    const warmSample = Math.tanh(sample * 1.15);
    const clamped = Math.max(-1, Math.min(1, warmSample));
    view.setInt16(44 + i * 2, Math.floor(clamped * 32767), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  fallbackWavDataUri = `data:audio/wav;base64,${btoa(binary)}`;
  return fallbackWavDataUri;
}

/**
 * Plays a warm, uplifting, positive Major-chord notification chime.
 * If the browser blocks audio before the first user click (e.g. on page refresh),
 * it automatically queues and plays on the very next click/keydown.
 */
export function playSweetAlertChime(): void {
  try {
    // 1. Try HTML5 Audio element with synthesized WAV positive arpeggio chime
    const wavUri = getBellChimeWavUri();
    const audioEl = new Audio(wavUri);
    audioEl.volume = 0.85;
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Audio API or queue for next user gesture
        pendingGestureChime = true;
      });
      return;
    }
  } catch {
    // Fall through to Web Audio API
  }

  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const triggerOscillators = () => {
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0.0, duration: 0.35, gain: 0.22 },
        { freq: 659.25, start: 0.095, duration: 0.38, gain: 0.24 },
        { freq: 783.99, start: 0.19, duration: 0.45, gain: 0.26 },
        { freq: 1046.5, start: 0.29, duration: 0.7, gain: 0.3 },
      ];
      for (const n of notes) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.freq, now + n.start);
        gainNode.gain.setValueAtTime(0.001, now + n.start);
        gainNode.gain.linearRampToValueAtTime(n.gain, now + n.start + 0.016);
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          now + n.start + n.duration
        );
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + n.start);
        osc.stop(now + n.start + n.duration + 0.02);
      }
    };

    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          triggerOscillators();
        })
        .catch(() => {
          pendingGestureChime = true;
        });
    } else {
      triggerOscillators();
    }
  } catch {
    pendingGestureChime = true;
  }
}

export default function UpcomingEventSweetAlert({
  currentRoute,
  onNavigate,
}: UpcomingEventSweetAlertProps) {
  const { isAuthenticated, currentUser } = useAuth();
  const { upcomingEvents, isLoading } = useClubData();

  const [isOpen, setIsOpen] = useState(false);
  const [featuredEvent, setFeaturedEvent] = useState<UpcomingEvent | null>(null);

  const shownOnHomeSignatureRef = useRef<string>("");
  const shownOnMembersSignatureRef = useRef<string>("");

  const eventsSignature = upcomingEvents
    .map((e) => `${e.id}:${e.updatedAt || e.title}`)
    .join("|");

  // Unlock audio on any user interaction and play queued chime if browser blocked initial autoplay
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state === "suspended") {
        void ctx.resume().catch(() => {});
      }
      if (pendingGestureChime) {
        pendingGestureChime = false;
        playSweetAlertChime();
      }
    };
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUser || isLoading) return;
    if (upcomingEvents.length === 0) {
      setIsOpen(false);
      return;
    }

    const latestUpcoming = upcomingEvents[0];

    const shouldShowOnHome =
      currentRoute === "home" &&
      shownOnHomeSignatureRef.current !== eventsSignature;

    const shouldShowOnMembers =
      currentRoute === "members" &&
      shownOnMembersSignatureRef.current !== eventsSignature;

    if (!shouldShowOnHome && !shouldShowOnMembers) return;

    // Wait 1.5 seconds after opening the page so the member's attention settles before popping the alert & chime
    const timerId = window.setTimeout(() => {
      if (shouldShowOnHome) {
        shownOnHomeSignatureRef.current = eventsSignature;
      }
      if (shouldShowOnMembers) {
        shownOnMembersSignatureRef.current = eventsSignature;
      }
      setFeaturedEvent(latestUpcoming);
      setIsOpen(true);
      playSweetAlertChime();
    }, 1500);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    isAuthenticated,
    currentUser,
    isLoading,
    currentRoute,
    upcomingEvents,
    eventsSignature,
  ]);

  if (!isOpen || !featuredEvent) return null;

  const handleGoToFutureEvents = () => {
    setIsOpen(false);
    onNavigate("home", "future");
    setTimeout(() => {
      const el = document.getElementById("future");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  };

  const coverSrc =
    featuredEvent.coverImage ||
    placeholderImage(featuredEvent.id || "upcoming-mission", 300, 200);

  return typeof document !== "undefined"
    ? createPortal(
        <aside
          role="alert"
          aria-live="polite"
          aria-label="Upcoming event reminder"
          className="fixed top-24 right-4 sm:right-6 z-[9990] w-[calc(100vw-2rem)] max-w-[375px] pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300"
        >
          <div className="relative rounded-2xl border border-amber-400/45 bg-[#0b1530]/95 backdrop-blur-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Top SweetAlert Progress/Accent Strip */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-primary-light to-emerald-400" />

            {/* Compact Header Row */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <BellRing size={13} className="animate-bounce" />
                </span>
                <span className="text-[11px] font-label font-extrabold uppercase tracking-wider text-amber-300 truncate">
                  {upcomingEvents.length > 1
                    ? `${upcomingEvents.length} Upcoming Events Reminder`
                    : "Upcoming Event Reminder"}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playSweetAlertChime();
                  }}
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.15] text-amber-300 transition"
                  title="Replay alert sound"
                  aria-label="Replay alert sound"
                >
                  <Volume2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.15] text-white/60 hover:text-white transition"
                  title="Dismiss reminder"
                  aria-label="Dismiss reminder"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Clickable Body -> Transfers member directly to Future Events */}
            <div
              onClick={handleGoToFutureEvents}
              className="p-3.5 cursor-pointer hover:bg-white/[0.04] transition flex items-start gap-3.5 group"
            >
              {/* Small Event Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/15 bg-[#050914] shrink-0">
                <img
                  src={coverSrc}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Event Details */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-label uppercase tracking-wider text-primary-light">
                  <Sparkles size={10} />
                  <span className="truncate">
                    {featuredEvent.category} • {featuredEvent.academicYear}
                  </span>
                </div>

                <h4 className="font-display text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                  {featuredEvent.title}
                </h4>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-ink-soft">
                  <span className="inline-flex items-center gap-1 text-white/85">
                    <Calendar size={11} className="text-amber-300 shrink-0" />
                    <span>{featuredEvent.date}</span>
                  </span>

                  {featuredEvent.time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} className="text-primary-light shrink-0" />
                      <span>{featuredEvent.time}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-emerald-300 truncate max-w-[140px]">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{featuredEvent.location}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Action Footer */}
            <div className="px-3.5 pb-3 pt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleGoToFutureEvents}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-label font-extrabold text-[11px] uppercase tracking-wider shadow transition flex items-center justify-center gap-1.5"
              >
                <span>Open Future Events</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-label text-ink-soft hover:text-white transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </aside>,
        document.body
      )
    : null;
}
