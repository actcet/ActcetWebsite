import { cn } from "@/lib/utils";
import { navLinks } from "@/data/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";
import type { AppRoute } from "@/hooks/useAppRouter";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  activeSection: string;
  currentRoute?: AppRoute;
  onNavigate?: (route: AppRoute, anchor?: string) => void;
}

export default function MobileMenu({
  open,
  onClose,
  activeSection,
  currentRoute = "home",
  onNavigate,
}: MobileMenuProps) {
  const { currentUser, isAdmin, logout } = useAuth();

  // If Chairperson or Mentor, include Admin Portal
  const displayLinks = [...navLinks];
  if (isAdmin && !displayLinks.some((l) => l.href === "#admin" || l.href === "#admin-portal")) {
    displayLinks.push({ label: "Admin Portal", href: "#admin" });
  }

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    onClose();
    if (href.includes("members")) {
      e.preventDefault();
      onNavigate?.("members");
      return;
    }
    if (href.includes("admin")) {
      e.preventDefault();
      onNavigate?.("admin");
      return;
    }

    const anchorId = href.replace("#", "");
    if (currentRoute !== "home") {
      e.preventDefault();
      onNavigate?.("home", anchorId);
      return;
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    onNavigate?.("login");
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[1050] flex flex-col items-center justify-center gap-5 bg-[color:var(--navbar-bg-scrolled)] backdrop-blur-2xl transition-all duration-500 px-6 overflow-y-auto py-12",
        open ? "translate-y-0" : "-translate-y-full"
      )}
    >
      {/* USER PROFILE IN MOBILE MENU */}
      {currentUser && (
        <div className="w-full max-w-xs p-4 rounded-2xl bg-white/[0.06] border border-white/10 text-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/30 border border-primary/50 text-white font-bold flex items-center justify-center mx-auto mb-2 text-base shadow-lg">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <p className="font-semibold text-white text-sm">{currentUser.name}</p>
          <p className="text-xs text-primary-light font-medium">{currentUser.role}</p>
          <p className="text-[11px] text-ink-soft truncate mt-0.5">{currentUser.email}</p>
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider font-semibold">
              Status: {currentUser.approvalStatus}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1 font-label ml-2"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION LINKS */}
      <div className="flex flex-col items-center gap-4 w-full">
        {displayLinks.map((link) => {
          const isMembers = link.href.includes("members");
          const isAdminLink = link.href.includes("admin");
          const id = link.href.replace("#", "");

          const isActive =
            (isMembers && currentRoute === "members") ||
            (isAdminLink && currentRoute === "admin") ||
            (currentRoute === "home" && activeSection === id);

          return (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className={cn(
                "font-display text-xl sm:text-2xl font-semibold transition-colors duration-300 text-center cursor-pointer",
                isActive
                  ? "text-[color:var(--navbar-accent)]"
                  : isAdminLink
                  ? "text-amber-300 hover:text-amber-200"
                  : "text-[color:var(--navbar-text)] hover:text-[color:var(--navbar-accent)]"
              )}
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
