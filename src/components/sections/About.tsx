import { useState } from "react";
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
    text: "ACTCET’s mission is to stay aligned with the evolving space sector by actively learning emerging trends while building strong practical skills through tools such as telescopes and AR/VR technologies. We aim to create a hands-on learning environment through workshops, seminars, webinars, and hackathons, fostering deeper engagement with astronomy and encouraging students to explore it beyond theory.",
  },
  {
    num: "02",
    title: "Vision",
    text: "ACTCET envisions a future where curiosity about space turns into real career paths. Our aim is to actively spread awareness of space science and related activities among school and college students, encouraging more of them to pursue this field seriously. We strive to build a community of individuals driven by curiosity, and provide them with meaningful opportunities to learn, explore, and grow within the space domain.",
  },
  {
    num: "03",
    title: "Club Objective",
    text: "To promote awareness and understanding of space science. We aim to inspire curiosity and make astronomy accessible to all.",
  },
  {
    num: "04",
    title: "Club Outcome",
    outcomes: [
      "Practical experience in observing celestial objects",
      "Improved public speaking and discussion skills",
      "Exposure to workshops, seminars, podcasts and research topics",
      "Real-world learning through stargazing and outreach",
      "Strong foundation in astronomy and space science",
    ],
  },
];

export default function About() {
  const [aboutExpanded, setAboutExpanded] = useState(false);

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
            <p className={`text-ink-soft text-[1.2rem] leading-8 max-w-xl ${aboutExpanded ? "" : "line-clamp-4"}`}>
              The Astronomy Club of TCET (AC - TCET) under ISRO SPACE TUTOR has been committed to fostering a
              community of individuals who share a deep interest in astronomy and providing them with opportunities
              to expand their knowledge and skills. Over the course of the previous year, our organization arranged
              an assortment of events, including observing sessions, workshops, and podcasts, all of which were
              geared toward promoting an appreciation for astronomy. Our members actively contributed to the group&apos;s
              endeavors by sharing their experiences and collaborating on astronomy-related projects. We also
              expanded our outreach to encompass schools and college events to showcase our passion for astronomy.
              Additionally, we created an Instagram account to share noteworthy discoveries and accomplishments in
              the field. Ultimately, our primary objective is to foster a welcoming community of individuals with an
              interest in astronomy, where they can provide support to one another and deepen their understanding of
              the subject.
            </p>
            <button
              type="button"
              onClick={() => setAboutExpanded((expanded) => !expanded)}
              className="mt-2 font-label text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              aria-expanded={aboutExpanded}
            >
              {aboutExpanded ? "Show less" : "Read more"}
            </button>
            <div className="mt-10 w-full max-w-xl rounded-xl2 bg-white/45 p-2 shadow-[0_8px_24px_rgba(10,25,47,0.06)]">
              <img
                src="/images/image.png"
                alt="ACTCET students attending a space science outreach session"
                className="w-full h-auto rounded-lg object-contain"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-5">
              {missionItems.map((item) => (
                <div
                  key={item.num}
                  className="flex min-h-[220px] gap-4 items-start rounded-xl2 border border-navy/[0.08] bg-white/80 p-5 md:p-6 shadow-[0_8px_24px_rgba(10,25,47,0.06)]"
                >
                  <div className="font-display font-bold text-primary text-xl min-w-[38px]">{item.num}</div>
                  <div className="min-w-0">
                    <h4 className="font-display font-semibold text-navy text-lg mb-2">{item.title}</h4>
                    {item.text && <p className="text-[0.98rem] leading-7 text-ink-soft">{item.text}</p>}
                    {item.outcomes && (
                      <ul className="text-[0.98rem] leading-7 text-ink-soft list-disc pl-4 space-y-1">
                        {item.outcomes.map((outcome) => (
                          <li key={outcome}>{outcome}</li>
                        ))}
                      </ul>
                    )}
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
