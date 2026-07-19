import { cn } from "@/lib/utils";
import { navLinks } from "@/data/navigation";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-navy z-[1050] flex flex-col items-center justify-center gap-7 transition-transform duration-500",
        open ? "translate-y-0" : "-translate-y-full"
      )}
    >
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={onClose}
          className="text-[#EAFBFF] font-display text-2xl font-semibold"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
