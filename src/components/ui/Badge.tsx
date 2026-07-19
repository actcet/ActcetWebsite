import { cn } from "@/lib/utils";

export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block font-label text-[0.68rem] font-semibold uppercase tracking-wider",
        "px-3 py-1 rounded-full bg-primary/10 text-primary w-fit",
        className
      )}
    >
      {children}
    </span>
  );
}
