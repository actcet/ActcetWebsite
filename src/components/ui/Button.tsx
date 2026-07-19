import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "outline";

interface ButtonProps extends React.ComponentPropsWithoutRef<"a"> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-[0_8px_24px_-6px_rgba(37,150,190,0.55)] hover:bg-primary-dark hover:-translate-y-0.5",
  ghost: "border border-white/35 text-white bg-white/[0.06] hover:bg-white/15 hover:-translate-y-0.5",
  outline: "border border-primary text-primary hover:bg-primary hover:text-white",
};

export default function Button({ variant = "primary", className, children, ...rest }: ButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-label font-semibold text-sm transition-all duration-300",
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
