import React from "react";
import { ShieldAlert, ArrowLeft, Home, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface UnauthorizedAdminPageProps {
  onNavigateHome: () => void;
  onNavigateMembers: () => void;
}

export default function UnauthorizedAdminPage({
  onNavigateHome,
  onNavigateMembers,
}: UnauthorizedAdminPageProps) {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-24">
      <div className="max-w-md w-full p-8 rounded-3xl border border-amber-500/30 bg-[#0b1530]/90 backdrop-blur-2xl shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-6 text-amber-300">
          <ShieldAlert size={34} />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-ink-soft mb-4 leading-relaxed">
          The Admin Portal is restricted to <strong>Chairperson</strong> and <strong>Mentor</strong> roles only.
        </p>
        <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-ink-soft mb-6 text-left space-y-1 font-mono">
          <p><span className="text-white/50">Current Member:</span> <strong className="text-white font-sans">{currentUser?.name}</strong></p>
          <p><span className="text-white/50">Assigned Role:</span> <span className="text-primary-light font-semibold">{currentUser?.role}</span></p>
          <p><span className="text-white/50">Required Role:</span> Chairperson or Mentor</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onNavigateHome}
            className="w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Return to Homepage
          </button>
          <button
            onClick={onNavigateMembers}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-label text-xs transition flex items-center justify-center gap-2"
          >
            <Users size={14} />
            Go to Members Portal
          </button>
        </div>
      </div>
    </div>
  );
}
