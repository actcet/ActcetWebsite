import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { navLinks } from "@/data/navigation";
import Button from "@/components/ui/Button";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const scrolled = useScrolled(40);
  const [menuOpen, setMenuOpen] = useState(false);
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
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-20% 0px -45% 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between transition-all duration-300",
          "px-[6vw]",
          scrolled
            ? "py-3 border-b border-white/10 bg-[color:var(--navbar-bg-scrolled)] backdrop-blur-xl shadow-[0_6px_24px_-12px_rgba(6,14,28,0.45)]"
            : "py-5 bg-[color:var(--navbar-bg-top)]"
        )}
      >
        <a href="#home" className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center shadow-[0_0_0_3px_rgba(255,255,255,0.6),0_6px_16px_-4px_rgba(37,150,190,0.5)] bg-[conic-gradient(from_200deg,#2596be,#64FFDA,#0A192F,#2596be)]">
            <span className="text-white font-display font-extrabold text-xs">AC</span>
          </div>
          <div className="font-display font-bold text-sm leading-tight text-[color:var(--navbar-text)]">
            ACTCET
            <span className="block font-label font-medium text-[0.62rem] tracking-wider uppercase text-[color:var(--navbar-text-muted)]">
              Astronomy Club · TCET
            </span>
          </div>
        </a>

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

        <div className="hidden md:flex gap-3">
          <Button variant="outline" href="#" className="!px-5 !py-2.5">
            Brochure
          </Button>
          <Button variant="primary" href="#events" className="!px-5 !py-2.5">
            Explore Events
          </Button>
        </div>

        <button
          className="md:hidden z-[1100] rounded-full p-2 text-[color:var(--navbar-text)] transition-colors duration-300 hover:bg-white/10"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} activeSection={activeSection} />
    </>
  );
}
