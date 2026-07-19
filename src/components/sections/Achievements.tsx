import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import { achievements } from "@/data/achievements";

export default function Achievements() {
  return (
    <section className="py-28 px-[6vw]">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Milestones</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-12">Achievements</h2>

        <div className="border-l-2 border-navy/[0.09] pl-9 flex flex-col gap-9">
          {achievements.map((a, i) => (
            <Reveal key={`${a.title}-${i}`} delay={i * 0.05} className="relative">
              <div className="absolute -left-[46px] top-1 w-3.5 h-3.5 rounded-full bg-primary shadow-[0_0_0_5px_rgba(37,150,190,0.12)]" />
              <span className="text-primary font-label font-semibold text-xs">{a.year}</span>
              <h4 className="font-display font-semibold text-navy text-lg mb-1 mt-0.5">{a.title}</h4>
              <p className="text-ink-soft text-sm">{a.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
