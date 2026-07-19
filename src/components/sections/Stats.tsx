import { useCountUp } from "@/hooks/useCountUp";
import Eyebrow from "@/components/ui/Eyebrow";
import type { StatItem } from "@/types";
import { clubStats } from "@/data/stats";

function StatBlock({ stat }: { stat: StatItem }) {
  const { ref, value } = useCountUp(stat.value);
  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-bold text-4xl text-mint-bright">
        {value.toLocaleString()}
        {stat.suffix ?? ""}
      </div>
      <div className="text-sm text-[#B8CDE0] font-label mt-1.5">{stat.label}</div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="py-28 px-[6vw] bg-gradient-to-b from-navy-2 to-navy text-white">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow light>By The Numbers</Eyebrow>
        <h2 className="font-display font-bold text-white text-[clamp(2rem,4vw,3rem)] mt-2 mb-12">Club Impact</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {clubStats.map((stat) => (
            <StatBlock key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
