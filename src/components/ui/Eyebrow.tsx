import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}

export default function Eyebrow({ children, light, className }: EyebrowProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-label text-xs font-semibold uppercase tracking-[0.18em]",
        "before:content-[''] before:w-[22px] before:h-px",
        light ? "text-mint-bright before:bg-mint-bright" : "text-primary before:bg-primary",
        className
      )}
    >
      {children}
    </div>
  );
}
