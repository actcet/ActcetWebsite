import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import UpcomingEventSweetAlert from "@/components/ui/UpcomingEventSweetAlert";
import type { AppRoute } from "@/hooks/useAppRouter";

interface WebsiteLayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, anchor?: string) => void;
}

export default function WebsiteLayout({
  children,
  currentRoute,
  onNavigate,
}: WebsiteLayoutProps) {
  return (
    <div className="min-h-screen bg-[#070d1f] text-ink relative flex flex-col justify-between">
      <Navbar currentRoute={currentRoute} onNavigate={onNavigate} />
      <UpcomingEventSweetAlert currentRoute={currentRoute} onNavigate={onNavigate} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
