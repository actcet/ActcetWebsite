import React from "react";
import Hero from "@/components/sections/Hero";
import IsroAssociation from "@/components/sections/IsroAssociation";
import About from "@/components/sections/About";
import Journey from "@/components/sections/Journey";
import Events from "@/components/sections/Events";
import FutureEvents from "@/components/sections/FutureEvents";
import Mentor from "@/components/sections/Mentor";
import Committee from "@/components/sections/Committee";
import Gallery from "@/components/sections/Gallery";
import Podcast from "@/components/sections/Podcast";
import Stats from "@/components/sections/Stats";
import Achievements from "@/components/sections/Achievements";
import Contact from "@/components/sections/Contact";

import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ClubDataProvider } from "@/context/ClubDataContext";
import { useAppRouter } from "@/hooks/useAppRouter";

import WebsiteLayout from "@/components/layout/WebsiteLayout";
import LoginPage from "@/components/auth/LoginPage";
import PendingApprovalPage from "@/components/auth/PendingApprovalPage";
import AccountRejectedPage from "@/components/auth/AccountRejectedPage";
import UnauthorizedAdminPage from "@/components/auth/UnauthorizedAdminPage";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import MembersPortalPage from "@/components/members/MembersPortalPage";
import AdminPortalPage from "@/components/admin/AdminPortalPage";

// PRESERVE ALL ORIGINAL HOMEPAGE SECTIONS IN ORIGINAL SEQUENCE
function HomePageSections() {
  return (
    <>
      <Hero />
      <IsroAssociation />
      <About />
      <Journey />
      <Events />
      <FutureEvents />
      <Mentor />
      <Committee />
      <Gallery />
      <Podcast />
      <Stats />
      <Achievements />
      <Contact />
    </>
  );
}

function MainContent() {
  const { currentRoute, navigateTo } = useAppRouter();
  const { currentUser, isAuthenticated, isAdmin, isLoading } = useAuth();

  // 1. Loading splash to avoid brief flash of protected content
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // 2. AUTH LAYOUT (STANDALONE PAGES — NO WEBSITE NAVBAR / SECTIONS BEHIND)
  // If the user is NOT authenticated with an approved account:
  if (!isAuthenticated) {
    // If user's account is pending approval:
    if (currentUser?.approvalStatus === "pending" || currentRoute === "pending-approval") {
      return (
        <PendingApprovalPage
          onBackToLogin={() => navigateTo("login")}
        />
      );
    }

    // If user's account has been rejected:
    if (currentUser?.approvalStatus === "rejected" || currentRoute === "rejected") {
      return (
        <AccountRejectedPage
          onBackToLogin={() => navigateTo("login")}
        />
      );
    }

    // Default first page: Standalone Login / Registration Page!
    return (
      <LoginPage
        onSuccessApproved={() => navigateTo("home")}
        onNavigatePending={() => navigateTo("pending-approval")}
        onNavigateRejected={() => navigateTo("rejected")}
      />
    );
  }

  // 3. WEBSITE LAYOUT (APPROVED AUTHENTICATED USERS ONLY)
  // If user is already approved and visits /login, /pending-approval, or /rejected, redirect to home:
  if (
    currentRoute === "login" ||
    currentRoute === "pending-approval" ||
    currentRoute === "rejected"
  ) {
    return (
      <WebsiteLayout currentRoute="home" onNavigate={navigateTo}>
        <HomePageSections />
      </WebsiteLayout>
    );
  }

  // Members Portal (/members)
  if (currentRoute === "members") {
    return (
      <WebsiteLayout currentRoute="members" onNavigate={navigateTo}>
        <MembersPortalPage />
      </WebsiteLayout>
    );
  }

  // Admin Portal (/admin)
  if (currentRoute === "admin") {
    if (!isAdmin) {
      // Ordinary approved user trying to access /admin -> Access Denied!
      return (
        <WebsiteLayout currentRoute="admin" onNavigate={navigateTo}>
          <UnauthorizedAdminPage
            onNavigateHome={() => navigateTo("home")}
            onNavigateMembers={() => navigateTo("members")}
          />
        </WebsiteLayout>
      );
    }

    // Chairperson / Mentor
    return (
      <WebsiteLayout currentRoute="admin" onNavigate={navigateTo}>
        <AdminPortalPage />
      </WebsiteLayout>
    );
  }

  // Default: Main Website Homepage (/)
  return (
    <WebsiteLayout currentRoute="home" onNavigate={navigateTo}>
      <HomePageSections />
    </WebsiteLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ClubDataProvider>
          <MainContent />
        </ClubDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
