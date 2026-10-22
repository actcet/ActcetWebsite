import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Member, LoginInput, RegistrationInput, ApprovalStatus } from "@/types";
import { mockDataService } from "@/services/mockDataService";
import { useToast } from "./ToastContext";

interface LoginResult {
  success: boolean;
  member?: Member;
  status?: ApprovalStatus;
  message?: string;
}

interface RegisterResult {
  success: boolean;
  member?: Member;
  error?: string;
}

interface AuthContextType {
  currentUser: Member | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<LoginResult>;
  register: (input: RegistrationInput) => Promise<RegisterResult>;
  logout: () => void;
  switchDemoUser: (memberId: string) => void;
  pendingRegisteredUser: Member | null;
  rejectedUser: Member | null;
  setPendingRegisteredUser: (member: Member | null) => void;
  clearPendingState: () => void;
  // Modal backwards compatibility
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  clearPendingRegisteredUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRegisteredUser, setPendingRegisteredUser] = useState<Member | null>(null);
  const [rejectedUser, setRejectedUser] = useState<Member | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const { showToast } = useToast();

  const syncCurrentUser = useCallback(() => {
    const user = mockDataService.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    syncCurrentUser();
    const unsubscribe = mockDataService.subscribe(syncCurrentUser);
    return () => unsubscribe();
  }, [syncCurrentUser]);

  const login = async (input: LoginInput): Promise<LoginResult> => {
    const result = mockDataService.loginUser(input);
    if (result.success && result.member) {
      setCurrentUser(result.member);
      setPendingRegisteredUser(null);
      setRejectedUser(null);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${result.member.name}!`, "success");
      return { success: true, member: result.member };
    }

    if (result.status === "pending" && result.member) {
      setPendingRegisteredUser(result.member);
      return {
        success: false,
        status: "pending",
        member: result.member,
        message: result.message,
      };
    }

    if (result.status === "rejected" && result.member) {
      setRejectedUser(result.member);
      return {
        success: false,
        status: "rejected",
        member: result.member,
        message: result.message,
      };
    }

    return { success: false, message: result.message };
  };

  const register = async (input: RegistrationInput): Promise<RegisterResult> => {
    const result = mockDataService.registerUser(input);
    if (result.success && result.member) {
      setPendingRegisteredUser(result.member);
      showToast("Account registration submitted!", "info");
      return { success: true, member: result.member };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    mockDataService.logoutUser();
    setCurrentUser(null);
    setPendingRegisteredUser(null);
    setRejectedUser(null);
    setIsAuthModalOpen(false);
    showToast("You have been logged out.", "info");
  };

  const switchDemoUser = (memberId: string) => {
    const member = mockDataService.setCurrentUserById(memberId);
    if (member) {
      setCurrentUser(member);
      setPendingRegisteredUser(null);
      setRejectedUser(null);
      showToast(`Switched active user to ${member.name} (${member.role})`, "success");
    }
  };

  const clearPendingState = () => {
    setPendingRegisteredUser(null);
    setRejectedUser(null);
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const clearPendingRegisteredUser = () => {
    setPendingRegisteredUser(null);
  };

  const isAdmin =
    currentUser?.approvalStatus === "approved" &&
    (currentUser?.role === "Chairperson" || currentUser?.role === "Mentor");

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser && currentUser.approvalStatus === "approved",
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        switchDemoUser,
        pendingRegisteredUser,
        rejectedUser,
        setPendingRegisteredUser,
        clearPendingState,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        clearPendingRegisteredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
