import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onIdTokenChanged, sendEmailVerification, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, authReady, db } from "@/lib/firebase";
import { loginAccount, memberFromDocument, portalError, registerAccount } from "@/services/portalService";
import type { ApprovalStatus, LoginInput, Member, RegistrationInput } from "@/types";

interface AuthContextType {
  currentUser: Member | null; authUser: User | null;
  isAuthenticated: boolean; isAdmin: boolean; isLoading: boolean;
  profileMissing: boolean; error: string | null;
  emailVerified: boolean;
  sendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  login: (input: LoginInput) => Promise<{ success: boolean; member?: Member; status?: ApprovalStatus; message?: string }>;
  register: (input: RegistrationInput) => Promise<{ success: boolean; member?: Member; error?: string }>;
  logout: () => Promise<void>;
  pendingRegisteredUser: Member | null; rejectedUser: Member | null;
  clearPendingState: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operation = useRef(false);
  useEffect(() => {
    let alive = true;
    let unsubscribeProfile = () => {};
    let unsubscribeAuth = () => {};
    authReady.then(() => {
      if (!alive) return;
      unsubscribeAuth = onIdTokenChanged(auth, user => {
        unsubscribeProfile();
        setAuthUser(user); setEmailVerified(user?.emailVerified ?? false); setCurrentUser(null); setProfileMissing(false); setError(null);
        if (!user) { setIsLoading(false); return; }
        if (!operation.current) setIsLoading(true);
        unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), snapshot => {
          if (!alive) return;
          // Sign-in validates the retained name field before exposing an approved profile.
          if (operation.current) return;
          try {
            setCurrentUser(snapshot.exists() ? memberFromDocument(snapshot.id, snapshot.data()) : null);
            setProfileMissing(!snapshot.exists()); setError(null);
          } catch (cause) { setCurrentUser(null); setError(portalError(cause)); }
          setIsLoading(false);
        }, cause => { if (alive) { setCurrentUser(null); setError(portalError(cause)); setIsLoading(false); } });
      }, cause => { if (alive) { setCurrentUser(null); setError(portalError(cause)); setIsLoading(false); } });
    }).catch(cause => { if (alive) { setError(portalError(cause)); setIsLoading(false); } });
    return () => { alive = false; unsubscribeAuth(); unsubscribeProfile(); };
  }, []);
  const login: AuthContextType["login"] = async input => {
    operation.current = true; setError(null);
    try {
      await authReady;
      const member = await loginAccount(input);
      setCurrentUser(member); setProfileMissing(!member);
      if (!member) return { success: false, message: "Your account needs a member profile. Complete the registration form below." };
      return { success: member.approvalStatus === "approved", member, status: member.approvalStatus };
    } catch (cause) { return { success: false, message: portalError(cause) }; }
    finally { operation.current = false; }
  };
  const register: AuthContextType["register"] = async input => {
    operation.current = true; setError(null);
    try {
      await authReady;
      const member = await registerAccount(input);
      setCurrentUser(member); setProfileMissing(false);
      return { success: true, member };
    } catch (cause) { const message = portalError(cause); setError(message); return { success: false, error: message }; }
    finally { operation.current = false; }
  };
  const logout = async () => {
    try { await signOut(auth); setCurrentUser(null); setProfileMissing(false); setError(null); }
    catch (cause) { setError(portalError(cause)); }
  };
  const sendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Sign in to the account before requesting email verification.");
    await sendEmailVerification(user);
  };
  const refreshEmailVerification = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Sign in to the account before checking email verification.");
    await user.reload();
    const verified = auth.currentUser?.emailVerified ?? false;
    setEmailVerified(verified);
    return verified;
  };
  const isAuthenticated = !!authUser && currentUser?.approvalStatus === "approved" && !error;
  const isAdmin = isAuthenticated && (currentUser?.role === "Chairperson" || currentUser?.role === "Mentor");
  return <AuthContext.Provider value={{ currentUser, authUser, isAuthenticated, isAdmin, isLoading, profileMissing, error, emailVerified, sendVerificationEmail, refreshEmailVerification, login, register, logout, pendingRegisteredUser: currentUser?.approvalStatus === "pending" ? currentUser : null, rejectedUser: currentUser?.approvalStatus === "rejected" ? currentUser : null, clearPendingState: logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within an AuthProvider"); return context; }
