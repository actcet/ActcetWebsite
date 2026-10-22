import React from "react";
import { ShieldAlert, Clock, Ban, Lock, Home, ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface GuardProps {
  children: React.ReactNode;
  onNavigateHome: () => void;
  onNavigateMembers: () => void;
}

export function AdminRouteGuard({ children, onNavigateHome, onNavigateMembers }: GuardProps) {
  const { currentUser, isAuthenticated, isAdmin, openAuthModal, logout } = useAuth();

  // 1. Not logged in
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full p-8 rounded-3xl border border-white/15 bg-[#0b1530]/90 backdrop-blur-2xl shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6 text-primary-light">
            <Lock size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Admin Authentication Required
          </h2>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            The Admin Portal is protected and requires an authorized Chairperson or Mentor account. Please log in to continue.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => openAuthModal("login")}
              className="w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Login with Admin Credentials
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full py-3 px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-label text-sm transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pending account
  if (currentUser.approvalStatus === "pending") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full p-8 rounded-3xl border border-amber-500/30 bg-[#0b1530]/90 backdrop-blur-2xl shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-6 text-amber-300">
            <Clock size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Pending Administrator Approval
          </h2>
          <p className="text-sm text-ink-soft mb-4 leading-relaxed">
            Your account is awaiting approval from the Chairperson or Mentor. You will be able to access the dashboard once your account has been approved.
          </p>
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-ink-soft mb-6 text-left space-y-1">
            <p><span className="text-white/60">Registered Name:</span> {currentUser.name}</p>
            <p><span className="text-white/60">Applied Role:</span> {currentUser.role}</p>
            <p><span className="text-white/60">Status:</span> <span className="text-amber-300 font-semibold uppercase">Pending</span></p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={onNavigateHome}
              className="w-full py-3 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-label text-sm transition flex items-center justify-center gap-2"
            >
              <Home size={16} />
              Back to Home
            </button>
            <button
              onClick={logout}
              className="text-xs text-rose-300 hover:text-rose-200 transition font-label"
            >
              Log out of this account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Rejected account
  if (currentUser.approvalStatus === "rejected") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full p-8 rounded-3xl border border-rose-500/30 bg-[#160b14]/90 backdrop-blur-2xl shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-6 text-rose-400">
            <Ban size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Account Registration Not Approved
          </h2>
          <p className="text-sm text-rose-200/90 mb-6 leading-relaxed">
            Your account registration has not been approved. Please contact the club administration.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onNavigateHome}
              className="w-full py-3 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-label text-sm transition"
            >
              Back to Home
            </button>
            <button
              onClick={logout}
              className="text-xs text-white/50 hover:text-white transition font-label"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Approved, but not admin (e.g. Member, Technical Head, Guest)
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full p-8 rounded-3xl border border-amber-500/30 bg-[#0b1530]/90 backdrop-blur-2xl shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-6 text-amber-300">
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Unauthorized Access
          </h2>
          <p className="text-sm text-ink-soft mb-4 leading-relaxed">
            Access Denied: The Admin Portal is restricted to Chairperson and Mentor roles only.
          </p>
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-ink-soft mb-6 text-left space-y-1">
            <p><span className="text-white/60">Current User:</span> {currentUser.name}</p>
            <p><span className="text-white/60">Your Role:</span> <span className="text-primary-light font-semibold">{currentUser.role}</span></p>
            <p><span className="text-white/60">Required Roles:</span> Chairperson or Mentor</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={onNavigateMembers}
              className="w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
            >
              Go to Members Portal
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full py-3 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-label text-sm transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Approved Chairperson or Mentor
  return <>{children}</>;
}
