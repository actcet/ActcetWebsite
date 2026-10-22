import React from "react";
import { Ban, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AccountRejectedPageProps {
  onBackToLogin: () => void;
}

export default function AccountRejectedPage({ onBackToLogin }: AccountRejectedPageProps) {
  const { rejectedUser, clearPendingState } = useAuth();

  const handleBackToLogin = () => {
    clearPendingState();
    onBackToLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[#070d1f] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-white font-body">
      {/* Background celestial glow & stars */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-stars opacity-50 pointer-events-none -z-10" />

      {/* BRAND HEADER */}
      <div className="text-center mb-8 max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-[52px] h-[38px]">
            <img
              src="/images/Actcet%20Images/IMP%20LOGO/ACTCET%20LOGO%20(1).png"
              alt="ACTCET Astronomy Club"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-left">
            <h1 className="font-display font-bold text-2xl tracking-tight text-white leading-tight">
              ACTCET
            </h1>
            <span className="block font-label font-medium text-[0.65rem] tracking-wider uppercase text-rose-300">
              Registration System
            </span>
          </div>
        </div>
      </div>

      {/* CARD */}
      <div className="w-full max-w-lg rounded-[28px] border border-rose-500/30 bg-[#160b14]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-5 text-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.25)]">
          <Ban size={34} />
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Registration Not Approved
        </h2>

        {/* EXACT REQUIRED MESSAGE */}
        <p className="text-rose-200/95 text-xs sm:text-sm mb-6 leading-relaxed bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-left">
          Your account registration has not been approved. Please contact the club administration.
        </p>

        {rejectedUser && (
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-ink-soft mb-6 text-left space-y-1.5 font-mono">
            <p className="text-white font-sans font-semibold mb-1 text-sm">
              Account Details:
            </p>
            <p><span className="text-white/50">Name:</span> {rejectedUser.name}</p>
            <p><span className="text-white/50">Email:</span> {rejectedUser.email}</p>
            <p><span className="text-white/50">Status:</span> <span className="text-rose-400 font-bold uppercase">Rejected</span></p>
            {rejectedUser.rejectionReason && (
              <p><span className="text-white/50">Note:</span> <span className="text-white">{rejectedUser.rejectionReason}</span></p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleBackToLogin}
            className="w-full py-3.5 px-6 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-label font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
