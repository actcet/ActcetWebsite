import { useEffect, useState } from "react";
import { Menu, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { navLinks } from "@/data/navigation";
import Button from "@/components/ui/Button";
import MobileMenu from "./MobileMenu";

const flyers = [
  "/images/flyers/flyer1.png",
  "/images/flyers/flyer2.png",
  "/images/flyers/flyer3.png",
  "/images/flyers/flyer4.png",
  "/images/flyers/flyer5.png",
  "/images/flyers/flyer6.png",
];

export default function Navbar() {
  const scrolled = useScrolled(40);
  const [menuOpen, setMenuOpen] = useState(false);

  // Outreach popup
  const [outreachOpen, setOutreachOpen] = useState(false);

  // Full-size flyer
  const [selectedFlyer, setSelectedFlyer] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const sectionIds = navLinks.map((link) => link.href.replace("#", ""));

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => b.intersectionRatio - a.intersectionRatio
          )[0];

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

  // ESC key closes popup
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedFlyer) {
          setSelectedFlyer(null);
        } else if (outreachOpen) {
          setOutreachOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [outreachOpen, selectedFlyer]);

  return (
    <>
      <nav
        className={cn(
          "fixed left-0 right-0 z-[1000] flex items-center justify-between transition-all duration-300",
          "px-[6vw] top-0",
          scrolled
            ? "py-3 border-b border-white/10 bg-[color:var(--navbar-bg-scrolled)] backdrop-blur-xl shadow-[0_6px_24px_-12px_rgba(6,14,28,0.45)]"
            : "py-5 bg-[color:var(--navbar-bg-top)]"
        )}
      >
        {/* LOGO */}

        <a href="#home" className="flex items-center gap-3">
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

        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => {
            const id = link.href.replace("#", "");
            const isActive = activeSection === id;

            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "font-label text-sm font-medium relative pb-1 group transition-colors duration-300",
                  isActive
                    ? "text-[color:var(--navbar-accent)]"
                    : "text-[color:var(--navbar-text)] hover:text-[color:var(--navbar-accent)]"
                )}
              >
                {link.label}

                <span
                  className={cn(
                    "absolute left-0 bottom-0 h-0.5 bg-[color:var(--navbar-accent)] transition-all duration-300",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </a>
            );
          })}
        </div>

        {/* BUTTONS */}

        <div className="hidden md:flex gap-3">
          <Button
            variant="outline"
            href="#"
            className="!px-5 !py-2.5"
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
            className="!px-5 !py-2.5"
          >
            View Our Booklet
          </Button>
        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          className="md:hidden z-[1100] rounded-full p-2 text-[color:var(--navbar-text)] transition-colors duration-300 hover:bg-white/10"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* MOBILE MENU */}

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeSection={activeSection}
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
            className="
              relative
              w-full
              max-w-6xl
              max-h-[90vh]
              overflow-hidden
              rounded-[28px]
              border border-white/20
              bg-[color:var(--navbar-bg-scrolled)]
              backdrop-blur-2xl
              shadow-[0_25px_80px_rgba(0,0,0,0.45)]
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div className="
              sticky top-0 z-10
              flex items-center justify-between
              px-6 sm:px-8
              py-5
              border-b border-white/10
              bg-[color:var(--navbar-bg-scrolled)]/90
              backdrop-blur-xl
            ">
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
                className="
                  w-10 h-10
                  rounded-full
                  flex items-center justify-center
                  border border-white/10
                  bg-white/5
                  text-[color:var(--navbar-text)]
                  hover:bg-white/10
                  transition
                "
                aria-label="Close outreach flyers"
              >
                <X size={22} />
              </button>
            </div>

            {/* FLYERS */}

            <div className="overflow-y-auto max-h-[calc(90vh-90px)] p-6 sm:p-8">
              <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-6
              ">
                {flyers.map((flyer, index) => (
                  <button
                    key={flyer}
                    onClick={() => setSelectedFlyer(flyer)}
                    className="
                      group
                      relative
                      overflow-hidden
                      rounded-2xl
                      border border-white/10
                      bg-white/5
                      shadow-lg
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:border-white/25
                      hover:shadow-2xl
                    "
                  >
                    <img
                      src={flyer}
                      alt={`ACTCET Outreach Flyer ${index + 1}`}
                      className="
                        block
                        w-full
                        h-auto
                        object-contain
                        transition-transform
                        duration-500
                        group-hover:scale-[1.03]
                      "
                    />

                    {/* HOVER OVERLAY */}

                    <div className="
                      absolute
                      inset-0
                      flex
                      items-center
                      justify-center
                      bg-black/0
                      group-hover:bg-black/30
                      transition-all
                      duration-300
                    ">
                      <div className="
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-300
                        w-12
                        h-12
                        rounded-full
                        bg-white/20
                        backdrop-blur-md
                        border border-white/30
                        flex
                        items-center
                        justify-center
                        text-white
                      ">
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
          className="
            fixed
            inset-0
            z-[3000]
            flex
            items-center
            justify-center
            p-4
            sm:p-8
            bg-black/90
            backdrop-blur-md
          "
          onClick={() => setSelectedFlyer(null)}
        >
          {/* CLOSE */}

          <button
            onClick={() => setSelectedFlyer(null)}
            className="
              absolute
              top-5
              right-5
              z-10
              w-11
              h-11
              rounded-full
              flex
              items-center
              justify-center
              bg-black/60
              border border-white/20
              text-white
              hover:bg-white/10
              transition
            "
            aria-label="Close full size flyer"
          >
            <X size={24} />
          </button>

          {/* IMAGE */}

          <img
            src={selectedFlyer}
            alt="Full size ACTCET outreach flyer"
            className="
              max-w-full
              max-h-[92vh]
              object-contain
              rounded-xl
              shadow-[0_25px_100px_rgba(0,0,0,0.7)]
              animate-in
              fade-in
              zoom-in-95
              duration-200
            "
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}