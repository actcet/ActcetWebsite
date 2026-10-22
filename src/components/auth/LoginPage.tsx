import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  KeyRound,
  UserPlus,
  LogIn,
} from "lucide-react";
import { useClubData } from "@/context/ClubDataContext";
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

interface LoginPageProps {
  onSuccessApproved: () => void;
  onNavigatePending: () => void;
  onNavigateRejected: () => void;
  initialMode?: "login" | "register";
}

export default function LoginPage({
  onSuccessApproved,
  onNavigatePending,
  onNavigateRejected,
  initialMode = "login",
}: LoginPageProps) {
  const { login, register, authUser, profileMissing } = useAuth();
  const { settings, error: settingsError } = useClubData();
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);

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
  const [regEmail, setRegEmail] = useState(authUser?.email || "");
  const [regAcademicYear, setRegAcademicYear] = useState("");
  useEffect(() => { if (settings) setRegAcademicYear(previous => previous || settings.currentAcademicYear); }, [settings]);
  useEffect(() => { if (profileMissing) { setActiveTab("register"); setRegEmail(authUser?.email || ""); } }, [profileMissing, authUser?.email]);
  const [regRole, setRegRole] = useState<UserRole>("Member");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

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

    if (result.success) {
      onSuccessApproved();
    } else if (result.status === "pending") {
      onNavigatePending();
    } else if (result.status === "rejected") {
      onNavigateRejected();
    } else if (result.message) {
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
      academicYear: regAcademicYear,
      password: regPassword,
    });
    setIsSubmittingReg(false);

    if (result.success) {
      onNavigatePending();
    } else if (result.error) {
      setRegError(result.error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070d1f] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-white font-body">
      {/* Background celestial glow & stars */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-mint/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-stars opacity-50 pointer-events-none -z-10" />

      {/* ACTCET BRAND HEADER */}
      <div className="text-center mb-8 max-w-lg">
        <div className="flex items-center justify-center gap-3.5 mb-3">
          <div className="w-[62px] h-[44px]">
            <img
              src="/images/Actcet%20Images/IMP%20LOGO/ACTCET%20LOGO%20(1).png"
              alt="ACTCET Astronomy Club"
              className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(75,141,255,0.4)]"
            />
          </div>
          <div className="text-left">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white leading-tight">
              ACTCET
            </h1>
            <span className="block font-label font-semibold text-[0.7rem] tracking-[0.2em] uppercase text-primary-light">
              Astronomy Club · TCET Mumbai
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-ink-soft italic">
          "Every astronomer starts with wonder. Sign in to enter the mission control portal."
        </p>
      </div>

      {/* AUTH CARD */}
      <div className="w-full max-w-xl rounded-[28px] border border-white/20 bg-[#0b1530]/90 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.7)] p-6 sm:p-8 relative">
        {/* TAB SELECTOR */}
        <div className="grid grid-cols-2 p-1.5 bg-white/[0.05] rounded-2xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setLoginError(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-label font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === "login"
                ? "bg-primary text-white shadow-[0_4px_16px_rgba(19,54,212,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <LogIn size={15} />
            <span>Login (Existing Users)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setRegError(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-label font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === "register"
                ? "bg-primary text-white shadow-[0_4px_16px_rgba(19,54,212,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* LOGIN TAB */}
        {/* ======================================================== */}
        {activeTab === "login" && (
          <div>
            <div className="mb-5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Member Sign In
              </h2>
              <p className="text-xs text-ink-soft mt-1">
                Enter your credentials to enter the astronomy dashboard.
              </p>
            </div>

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
                  {isSubmittingLogin ? "Authenticating..." : "Login to Portal"}
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setLoginError(null);
                  }}
                  className="text-xs text-center text-primary-light hover:underline font-label py-1"
                >
                  New to ACTCET? Create an Account
                </button>
              </div>
            </form>

          </div>
        )}

        {/* ======================================================== */}
        {/* REGISTRATION TAB */}
        {/* ======================================================== */}
        {activeTab === "register" && (
          <div>
            <div className="mb-5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                {profileMissing ? "Complete Your Member Profile" : "First-Time User — Create Account"}
              </h2>
              <p className="text-xs text-ink-soft mt-1">
                Fill in your student details. New accounts require Chairperson/Mentor approval.
              </p>
            </div>

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
                    Field 2: Branch <span className="text-rose-400">*</span>
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
                    Field 3: Div <span className="text-rose-400">*</span>
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
                    Field 4: Year <span className="text-rose-400">*</span>
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
                  Working Committee has four selectable subroles: Technical, Creative, Event, Documentation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-label uppercase tracking-wider text-white/80 mb-1.5" htmlFor="academic-session">Academic Session</label>
                <input id="academic-session" value={regAcademicYear} onChange={e => setRegAcademicYear(e.target.value)} required pattern="[0-9]{4}-[0-9]{2}" placeholder="2026-27" className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm" />
                {settingsError && <p role="alert" className="text-rose-300 text-xs mt-1">{settingsError}</p>}
              </div>
              {/* Password */}
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

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingReg || !settings}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-label font-semibold text-sm transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(19,54,212,0.6)] flex items-center justify-center gap-2"
                >
                  {isSubmittingReg ? "Submitting..." : profileMissing ? "Submit Profile" : "Create Account"}
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setRegError(null);
                  }}
                  className="text-xs text-center text-primary-light hover:underline font-label py-1"
                >
                  Already have an account? Login here
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
