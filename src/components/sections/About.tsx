import { Telescope, Search, Lightbulb, Rocket, GraduationCap, Cpu, Mic, Users } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import { pillars } from "@/data/pillars";

const iconMap: Record<string, React.ElementType> = {
  astronomy: Telescope,
  research: Search,
  innovation: Lightbulb,
  outreach: Rocket,
  education: GraduationCap,
  technology: Cpu,
  podcast: Mic,
  community: Users,
};

const missionItems = [
  {
    num: "01",
    title: "Mission",
    text: "Make astronomy and space science accessible, hands-on, and exciting for every student.",
  },
  {
    num: "02",
    title: "Vision",
    text: "To be TCET's gateway to the space sciences — a launchpad for future researchers, engineers, and explorers.",
  },
  {
    num: "03",
    title: "Values",
    text: "Curiosity, rigour, openness, and outreach — science shared is science multiplied.",
  },
];

export default function About() {
  return (
    <section id="about" className="py-28 px-[6vw]">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>About ACTCET</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-4 leading-tight">
          A community built for
          <br />
          the curious and the committed
        </h2>

        <div className="grid md:grid-cols-2 gap-14 items-start mt-8">
          <Reveal>
            <p className="text-ink-soft text-[1.05rem] max-w-xl">
              ACTCET is the official Astronomy Club of Thakur College of Engineering &amp; Technology — a
              student-led community of stargazers, engineers, and researchers who believe science should be seen,
              not just studied. Since our founding, we&apos;ve grown into a recognised outreach body under ISRO,
              hosting workshops, observations, competitions, and a growing podcast that brings the cosmos closer to
              campus and community alike.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-6">
              {missionItems.map((item) => (
                <div key={item.num} className="flex gap-4 items-start">
                  <div className="font-display font-bold text-primary text-lg min-w-[34px]">{item.num}</div>
                  <div>
                    <h4 className="font-display font-semibold text-navy mb-1">{item.title}</h4>
                    <p className="text-sm text-ink-soft">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {pillars.map((pillar, i) => {
            const Icon = iconMap[pillar.key];
            return (
              <Reveal key={pillar.key} delay={i * 0.05}>
                <div className="bg-surface border border-navy/[0.09] rounded-xl2 shadow-soft hover:-translate-y-1.5 hover:shadow-soft-lg transition-all duration-300 p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-mint flex items-center justify-center mb-4">
                    <Icon size={22} className="text-white" strokeWidth={1.8} />
                  </div>
                  <h4 className="font-display font-semibold text-navy mb-1.5">{pillar.title}</h4>
                  <p className="text-sm text-ink-soft">{pillar.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
