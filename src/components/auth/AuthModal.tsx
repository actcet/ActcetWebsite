import React, { useState } from "react";
import { X, Eye, EyeOff, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, UserCheck, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Branch, Division, StudyYear, UserRole } from "@/types";

const BRANCH_OPTIONS: Branch[] = [
  "Comp",
  "AIML",
  "AIDS",
  "IOT",
  "Mech",
  "ECS",
  "Civil",
  "CSE(CS)",
  "CSE(IoT)",
  "EXTC",
  "IT",
];

const DIVISION_OPTIONS: Division[] = ["A", "B", "C", "D"];

const YEAR_OPTIONS: StudyYear[] = ["SE", "TE", "BE"];

const ROLE_OPTIONS: UserRole[] = [
  "Mentor",
  "Chairperson",
  "Vice Chairperson",
  "Creative Head",
  "Documentation Head",
  "Event Management Head",
  "Technical Head",
  "Working Committee - Technical",
  "Working Committee - Creative",
  "Working Committee - Event",
  "Working Committee - Documentation",
  "Member",
  "Guest",
];

const DEMO_PRESETS = [
  {
    label: "Chairperson (Admin)",
    name: "Aarav Sharma",
    email: "aarav.chairperson@tcetmumbai.in",
    pass: "Admin@1234",
    badge: "Admin",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    label: "Mentor (Admin)",
    name: "Dr. Rajesh Kumar",
    email: "rajesh.mentor@tcetmumbai.in",
    pass: "Admin@1234",
    badge: "Admin",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    label: "Technical Head",
    name: "Shinjini Dutta",
    email: "shinjini.tech@tcetmumbai.in",
    pass: "Member@1234",
    badge: "Lead",
    badgeColor: "bg-primary/20 text-blue-300 border-primary/30",
  },
  {
    label: "Regular Member",
    name: "Rohan Gupta",
    email: "rohan.member@tcetmumbai.in",
    pass: "Member@1234",
    badge: "Member",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    label: "Pending Account",
    name: "Vikram Singh",
    email: "vikram.pending@tcetmumbai.in",
    pass: "Pending@1234",
    badge: "Pending",
    badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  {
    label: "Rejected Account",
    name: "Neha Joshi",
    email: "neha.rejected@tcetmumbai.in",
    pass: "Rejected@1234",
    badge: "Rejected",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
];

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
    pendingRegisteredUser,
    clearPendingRegisteredUser,
  } = useAuth();

  // Mode state: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<"login" | "register">(authModalMode);

  // Sync tab with external open mode
  React.useEffect(() => {
    setActiveTab(authModalMode);
  }, [authModalMode]);

  // Login Form State
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regBranch, setRegBranch] = useState<Branch>("CSE(IoT)");
  const [regDivision, setRegDivision] = useState<Division>("A");
  const [regYear, setRegYear] = useState<StudyYear>("SE");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("Member");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginName.trim() || !loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter your name, email, and password.");
      return;
    }

    setIsSubmittingLogin(true);
    const result = await login({
      name: loginName,
      email: loginEmail,
      password: loginPassword,
    });
    setIsSubmittingLogin(false);

    if (!result.success && result.message) {
      setLoginError(result.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError("Please fill in all required fields.");
      return;
    }

    if (regPassword.length < 8) {
      setRegError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmittingReg(true);
    const result = await register({
      name: regName,
      branch: regBranch,
      division: regDivision,
      year: regYear,
      email: regEmail,
      role: regRole,
      password: regPassword,
    });
    setIsSubmittingReg(false);

    if (!result.success && result.error) {
      setRegError(result.error);
    }
  };

  const handleSelectDemoPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    setLoginName(preset.name);
    setLoginEmail(preset.email);
    setLoginPassword(preset.pass);
    setLoginError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        closeAuthModal();
        clearPendingRegisteredUser();
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[28px] border border-white/20 bg-[#070d1f]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] text-white p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => {
            closeAuthModal();
            clearPendingRegisteredUser();
          }}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/15 transition"
          aria-label="Close authentication modal"
        >
          <X size={20} />
        </button>

        {/* REGISTRATION CONFIRMATION SCREEN */}
        {pendingRegisteredUser ? (
          <div className="py-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5 text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-2">
              Registration Successful!
            </h3>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-ink-soft mb-6 text-left space-y-1.5">
              <p className="text-white font-medium">Applicant Profile Registered:</p>
              <p><span className="text-white/60">Name:</span> {pendingRegisteredUser.name}</p>
              <p><span className="text-white/60">Class:</span> {pendingRegisteredUser.year}-{pendingRegisteredUser.branch}-{pendingRegisteredUser.division}</p>
              <p><span className="text-white/60">Role:</span> {pendingRegisteredUser.role}</p>
              <p><span className="text-white/60">Email:</span> {pendingRegisteredUser.email}</p>
            </div>
            <p className="text-amber-200/90 text-sm mb-6 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
              Registration Successful! Your account is awaiting approval from the Chairperson or Mentor. You will be able to access the dashboard once your account has been approved.
            </p>
            <button
              onClick={() => {
                clearPendingRegisteredUser();
                setActiveTab("login");
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-dark text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)]"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {/* MODAL HEADER */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-primary-light text-xs font-label uppercase tracking-widest mb-1.5">
                <Sparkles size={14} />
                <span>Astronomy Club Portal</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {activeTab === "login" ? "Account Sign In" : "Create New Account"}
              </h2>
              <p className="text-sm text-ink-soft mt-1">
                {activeTab === "login"
                  ? "Access the ACTCET dashboard with your approved credentials."
                  : "Join the TCET Astronomy Club community and participate in missions."}
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div className="grid grid-cols-2 p-1 bg-white/[0.05] rounded-xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setLoginError(null);
                }}
                className={`py-2 text-sm font-label font-medium rounded-lg transition-all ${
                  activeTab === "login"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Returning User — Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setRegError(null);
                }}
                className={`py-2 text-sm font-label font-medium rounded-lg transition-all ${
                  activeTab === "register"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                First-Time User — Register
              </button>
            </div>

            {/* ========================================================= */}
            {/* 1B. LOGIN FORM */}
            {/* ========================================================= */}
            {activeTab === "login" && (
              <div>
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 mb-5">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="e.g. Aarav Sharma or Shinjini Dutta"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. aarav.chairperson@tcetmumbai.in"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-label uppercase tracking-wider text-white/80">
                        Password <span className="text-rose-400">*</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                        aria-label="Toggle password visibility"
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
                    >
                      {isSubmittingLogin ? "Verifying..." : "Login to Portal"}
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("register");
                        setLoginError(null);
                      }}
                      className="text-xs text-center text-primary-light hover:underline font-label"
                    >
                      Don't have an account? Create Account
                    </button>
                  </div>
                </form>

                {/* DEMO ACCOUNTS QUICK-PICKER */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-label uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                      <KeyRound size={13} className="text-primary-light" />
                      Quick 1-Click Demo Logins:
                    </span>
                    <span className="text-[11px] text-white/40">Select role below</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEMO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectDemoPreset(preset)}
                        className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-left transition flex flex-col gap-1 text-xs group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white group-hover:text-primary-light transition-colors truncate">
                            {preset.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink-soft truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1A. REGISTER FORM */}
            {/* ========================================================= */}
            {activeTab === "register" && (
              <div>
                {regError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 mb-5">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Field 1: Full Name */}
                  <div>
                    <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                      Field 1: Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Shinjini Dutta"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  {/* Field 2, 3, 4: Branch, Division, Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Field 2: Branch */}
                    <div>
                      <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                        Branch <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={regBranch}
                        onChange={(e) => setRegBranch(e.target.value as Branch)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0b1530] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      >
                        {BRANCH_OPTIONS.map((branch) => (
                          <option key={branch} value={branch} className="bg-[#0b1530] text-white">
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field 3: Division */}
                    <div>
                      <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                        Division <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={regDivision}
                        onChange={(e) => setRegDivision(e.target.value as Division)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0b1530] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      >
                        {DIVISION_OPTIONS.map((div) => (
                          <option key={div} value={div} className="bg-[#0b1530] text-white">
                            {div}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field 4: Year */}
                    <div>
                      <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                        Year <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value as StudyYear)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0b1530] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      >
                        {YEAR_OPTIONS.map((yr) => (
                          <option key={yr} value={yr} className="bg-[#0b1530] text-white">
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Field 5: Email */}
                  <div>
                    <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                      Field 5: Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. shinjini.dutta@tcetmumbai.in"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  {/* Field 6: Role */}
                  <div>
                    <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5">
                      Field 6: Role <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0b1530] border border-white/15 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role} className="bg-[#0b1530] text-white">
                          {role}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-ink-soft mt-1">
                      Working Committee subroles (Technical, Creative, Event, Documentation) are selectable individually.
                    </p>
                  </div>

                  {/* Field 7: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-label uppercase tracking-wider text-white/80">
                        Field 7: Password <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-white/50">Min 8 characters</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create a strong password (minimum 8 characters)"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                        aria-label="Toggle password visibility"
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingReg}
                      className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
                    >
                      {isSubmittingReg ? "Submitting..." : "Create Account"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
