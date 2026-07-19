import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  light?: boolean;
  center?: boolean;
}

import Eyebrow from "./Eyebrow";

export default function SectionHeading({ eyebrow, title, subtitle, light, center }: SectionHeadingProps) {
  return (
    <div className={cn(center && "text-center flex flex-col items-center")}>
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          "font-display font-bold leading-tight mt-2 mb-4 text-[clamp(2rem,4vw,3rem)]",
          light ? "text-white" : "text-navy"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn("max-w-xl text-[1.05rem]", light ? "text-[#B8CDE0]" : "text-ink-soft")}>{subtitle}</p>
      )}
    </div>
  );
}
