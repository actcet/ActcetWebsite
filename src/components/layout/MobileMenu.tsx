import { cn } from "@/lib/utils";
import { navLinks } from "@/data/navigation";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  activeSection: string;
}

export default function MobileMenu({ open, onClose, activeSection }: MobileMenuProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[1050] flex flex-col items-center justify-center gap-7 bg-[color:var(--navbar-bg-scrolled)] backdrop-blur-xl transition-all duration-500",
        open ? "translate-y-0" : "-translate-y-full"
      )}
    >
      {navLinks.map((link) => {
        const id = link.href.replace("#", "");
        const isActive = activeSection === id;

        return (
          <a
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={cn(
              "font-display text-2xl font-semibold transition-colors duration-300",
              isActive
                ? "text-[color:var(--navbar-accent)]"
                : "text-[color:var(--navbar-text)] hover:text-[color:var(--navbar-accent)]"
            )}
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
