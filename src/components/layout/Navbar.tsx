import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { navLinks } from "@/data/navigation";
import Button from "@/components/ui/Button";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const scrolled = useScrolled(40);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between transition-all duration-300",
          "px-[6vw]",
          scrolled
            ? "py-3 bg-bg/70 backdrop-blur-xl border-b border-navy/[0.09] shadow-[0_6px_24px_-12px_rgba(10,25,47,0.15)]"
            : "py-5"
        )}
      >
        <a href="#home" className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center shadow-[0_0_0_3px_rgba(255,255,255,0.6),0_6px_16px_-4px_rgba(37,150,190,0.5)] bg-[conic-gradient(from_200deg,#2596be,#64FFDA,#0A192F,#2596be)]">
            <span className="text-white font-display font-extrabold text-xs">AC</span>
          </div>
          <div className="font-display font-bold text-sm leading-tight text-navy">
            ACTCET
            <span className="block font-label font-medium text-[0.62rem] tracking-wider uppercase text-ink-soft">
              Astronomy Club · TCET
            </span>
          </div>
        </a>

        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-label text-sm font-medium text-navy relative pb-1 group"
            >
              {link.label}
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
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
          className="md:hidden z-[1100] text-navy"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
