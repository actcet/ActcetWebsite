import { useEffect, useState, useRef } from "react";
import { Menu, X, Maximize2, ChevronDown, LogOut, LogIn, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { navLinks } from "@/data/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import MobileMenu from "./MobileMenu";
import type { AppRoute } from "@/hooks/useAppRouter";

const flyers = [
  "/images/flyers/flyer1.png",
  "/images/flyers/flyer2.png",
  "/images/flyers/flyer3.png",
  "/images/flyers/flyer4.png",
  "/images/flyers/flyer5.png",
  "/images/flyers/flyer6.png",
];

interface NavbarProps {
  currentRoute?: AppRoute;
  onNavigate?: (route: AppRoute, anchor?: string) => void;
}

export default function Navbar({ currentRoute = "home", onNavigate }: NavbarProps) {
  const scrolled = useScrolled(40);
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, isAdmin, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Outreach popup
  const [outreachOpen, setOutreachOpen] = useState(false);

  // Full-size flyer
  const [selectedFlyer, setSelectedFlyer] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState("home");

  // Filter visible nav links: Chairperson & Mentor see Admin Portal, others do not
  const visibleNavLinks = [...navLinks];
  if (isAdmin && !visibleNavLinks.some((l) => l.href === "#admin" || l.href === "#admin-portal")) {
    visibleNavLinks.push({ label: "Admin Portal", href: "#admin" });
  }

  // Sync active section based on route or scroll intersection
  useEffect(() => {
    if (currentRoute === "members") {
      setActiveSection("members");
      return;
    }
    if (currentRoute === "admin") {
      setActiveSection("admin");
      return;
    }

    const sectionIds = navLinks
      .map((link) => link.href.replace("#", ""))
      .filter((id) => !id.includes("members") && !id.includes("admin"));

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (currentRoute !== "home") return;

        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6],
        rootMargin: "-20% 0px -45% 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [currentRoute]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scrolling while popup is open
  useEffect(() => {
    if (outreachOpen || selectedFlyer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [outreachOpen, selectedFlyer]);

  // ESC key closes popup & dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedFlyer) {
          setSelectedFlyer(null);
        } else if (outreachOpen) {
          setOutreachOpen(false);
        } else if (profileDropdownOpen) {
          setProfileDropdownOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [outreachOpen, selectedFlyer, profileDropdownOpen]);

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
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

    // On home view, let standard anchor scroll take effect
  };

  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    logout();
    onNavigate?.("login");
  };

  return (
    <>
      <nav
        className={cn(
          "fixed left-0 right-0 z-[1000] flex items-center justify-between transition-all duration-300",
          "px-[4vw] sm:px-[6vw] top-0",
          scrolled
            ? "py-3 border-b border-white/10 bg-[color:var(--navbar-bg-scrolled)] backdrop-blur-xl shadow-[0_6px_24px_-12px_rgba(6,14,28,0.45)]"
            : "py-5 bg-[color:var(--navbar-bg-top)]"
        )}
      >
        {/* LOGO */}
        <a
          href="#home"
          onClick={(e) => {
            if (currentRoute !== "home") {
              e.preventDefault();
              onNavigate?.("home", "home");
            }
          }}
          className="flex items-center gap-3"
        >
          <div className="w-[52px] h-[38px]">
            <img
              src="/images/Actcet%20Images/IMP%20LOGO/ACTCET%20LOGO%20(1).png"
              alt="ACTCET Astronomy Club"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="font-display font-bold text-sm leading-tight text-[color:var(--navbar-text)]">
            ACTCET
            <span className="block font-label font-medium text-[0.62rem] tracking-wider uppercase text-[color:var(--navbar-text-muted)]">
              Astronomy Club · TCET
            </span>
          </div>
        </a>

        {/* DESKTOP NAV */}
        <div className="hidden lg:flex gap-6 xl:gap-8 items-center">
          {visibleNavLinks.map((link) => {
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
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "font-label text-sm font-medium relative pb-1 group transition-colors duration-300 cursor-pointer",
                  isActive
                    ? "text-[color:var(--navbar-accent)]"
                    : isAdminLink
                    ? "text-amber-300 hover:text-amber-200"
                    : "text-[color:var(--navbar-text)] hover:text-[color:var(--navbar-accent)]"
                )}
              >
                {link.label}

                <span
                  className={cn(
                    "absolute left-0 bottom-0 h-0.5 transition-all duration-300",
                    isAdminLink ? "bg-amber-400" : "bg-[color:var(--navbar-accent)]",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </a>
            );
          })}
        </div>

        {/* BUTTONS & PROFILE */}
        <div className="hidden md:flex gap-2.5 items-center">
          <Button
            variant="outline"
            href="#"
            className="!px-4 !py-2 text-xs"
            onClick={(e) => {
              e.preventDefault();
              setOutreachOpen(true);
            }}
          >
            Outreach Details
          </Button>

          <Button
            variant="primary"
            href="https://online.pubhtml5.com/kjslb/gias/"
            target="_blank"
            rel="noreferrer"
            className="!px-4 !py-2 text-xs"
          >
            Booklet
          </Button>

          {/* PROFILE & AVATAR DROPDOWN */}
          {currentUser ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition-all text-left"
                aria-label="User account menu"
              >
                <div className="w-7 h-7 rounded-full bg-primary/40 border border-primary/60 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden xl:block">
                  <span className="block text-xs font-semibold text-white leading-tight truncate max-w-[90px]">
                    {currentUser.name.split(" ")[0]}
                  </span>
                  <span className="block text-[10px] text-primary-light font-medium leading-tight truncate max-w-[90px]">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown size={14} className="text-white/60" />
              </button>

              {/* DROPDOWN MENU */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0b1530]/95 backdrop-blur-2xl border border-white/20 shadow-2xl p-4 text-white z-[1200] animate-in fade-in zoom-in-95 duration-150">
                  <div className="pb-3 border-b border-white/10 mb-3">
                    <p className="font-semibold text-sm text-white">{currentUser.name}</p>
                    <p className="text-xs text-primary-light font-medium">{currentUser.role}</p>
                    <p className="text-[11px] text-ink-soft truncate mt-0.5">{currentUser.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider font-semibold">
                        Status: {currentUser.approvalStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigate?.("members");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-ink-soft hover:text-white transition flex items-center gap-2"
                    >
                      <Users size={14} />
                      <span>Members Portal</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate?.("admin");
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-amber-300 hover:text-amber-200 transition flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck size={14} />
                        <span>Admin Portal</span>
                      </button>
                    )}

                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition flex items-center gap-2 mt-1"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate?.("login")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label font-semibold text-xs transition-all duration-300 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light hover:text-white"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            className="rounded-full p-2 text-[color:var(--navbar-text)] transition-colors duration-300 hover:bg-white/10"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeSection={activeSection}
        currentRoute={currentRoute}
        onNavigate={onNavigate}
      />

      {/* ===================================================== */}
      {/* OUTREACH FLYER POPUP */}
      {/* ===================================================== */}
      {outreachOpen && !selectedFlyer && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 bg-black/70 backdrop-blur-md"
          onClick={() => setOutreachOpen(false)}
        >
          <div
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[28px] border border-white/20 bg-[color:var(--navbar-bg-scrolled)] backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-[color:var(--navbar-bg-scrolled)]/90 backdrop-blur-xl">
              <div>
                <p className="font-label text-xs uppercase tracking-[0.25em] text-[color:var(--navbar-accent)]">
                  ACTCET
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[color:var(--navbar-text)]">
                  Outreach Flyers
                </h2>
              </div>

              <button
                onClick={() => setOutreachOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-[color:var(--navbar-text)] hover:bg-white/10 transition"
                aria-label="Close outreach flyers"
              >
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-90px)] p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {flyers.map((flyer, index) => (
                  <button
                    key={flyer}
                    onClick={() => setSelectedFlyer(flyer)}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-2xl"
                  >
                    <img
                      src={flyer}
                      alt={`ACTCET Outreach Flyer ${index + 1}`}
                      className="block w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                        <Maximize2 size={21} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* FULL SIZE FLYER */}
      {/* ===================================================== */}
      {selectedFlyer && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedFlyer(null)}
        >
          <button
            onClick={() => setSelectedFlyer(null)}
            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full flex items-center justify-center bg-black/60 border border-white/20 text-white hover:bg-white/10 transition"
            aria-label="Close full size flyer"
          >
            <X size={24} />
          </button>

          <img
            src={selectedFlyer}
            alt="Full size ACTCET outreach flyer"
            className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-[0_25px_100px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}