import { cn } from "@/lib/utils";

export default function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-navy/[0.09] rounded-xl2 shadow-soft transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-soft-lg",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
