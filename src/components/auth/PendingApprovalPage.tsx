import React from "react";
import { Clock, CheckCircle2, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface PendingApprovalPageProps {
  onBackToLogin: () => void;
}

export default function PendingApprovalPage({ onBackToLogin }: PendingApprovalPageProps) {
  const { pendingRegisteredUser, clearPendingState } = useAuth();
  const { showToast } = useToast();

  const handleBackToLogin = async () => {
    await clearPendingState();
    onBackToLogin();
  };

  const handleRefresh = () => {
    showToast("Checking approval status...", "info");
    // Reloading checks updated approval state
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-[#070d1f] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-white font-body">
      {/* Background celestial glow & stars */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
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
            <span className="block font-label font-medium text-[0.65rem] tracking-wider uppercase text-amber-300">
              Registration System
            </span>
          </div>
        </div>
      </div>

      {/* CARD */}
      <div className="w-full max-w-lg rounded-[28px] border border-amber-500/30 bg-[#0b1530]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-5 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.25)]">
          <Clock size={34} className="animate-pulse" />
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Waiting for Admin Approval
        </h2>

        {/* EXACT REQUIRED MESSAGE */}
        <p className="text-amber-200/95 text-xs sm:text-sm mb-6 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-left">
          Registration Successful! Your account is awaiting approval from the Chairperson or Mentor. You will be able to access the dashboard once your account has been approved.
        </p>

        {/* APPLICANT PROFILE SUMMARY */}
        {pendingRegisteredUser && (
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-ink-soft mb-6 text-left space-y-1.5 font-mono">
            <p className="text-white font-sans font-semibold mb-1 text-sm flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              Applicant Registration Record:
            </p>
            <p><span className="text-white/50">Name:</span> <strong className="text-white">{pendingRegisteredUser.name}</strong></p>
            <p><span className="text-white/50">Class:</span> {pendingRegisteredUser.year}-{pendingRegisteredUser.branch}-{pendingRegisteredUser.division}</p>
            <p><span className="text-white/50">Applied Role:</span> {pendingRegisteredUser.requestedRole}</p>
            <p><span className="text-white/50">Email:</span> {pendingRegisteredUser.email}</p>
            <p><span className="text-white/50">Status:</span> <span className="text-amber-300 font-bold uppercase tracking-wider">Awaiting Approval</span></p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleBackToLogin}
            className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>

          <button
            onClick={handleRefresh}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-ink-soft hover:text-white font-label text-xs transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={14} />
            Check Approval Status
          </button>
        </div>
      </div>
    </div>
  );
}
