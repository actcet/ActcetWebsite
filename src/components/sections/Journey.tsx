import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import { journeyYears } from "@/data/journey";

function scrollToYear(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Journey() {
  return (
    <section id="journey" className="py-28 px-[6vw] bg-bg-alt">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Our Timeline</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-4">
          Journey Through the Cosmos
        </h2>
        <p className="text-ink-soft max-w-xl text-[1.05rem] mb-6">
          Four years of orbits, outreach, and discovery — click a year to explore its missions.
        </p>

        {/* Desktop: horizontal orbit track. Mobile: vertical orbit track. */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-0 overflow-x-auto no-scrollbar pt-14 pb-4">
          {journeyYears.map((y, i) => (
            <Reveal key={y.id} delay={i * 0.08} className="relative md:min-w-[280px] shrink-0 md:px-6">
              {/* connecting orbit line */}
              <div className="hidden md:block absolute top-[26px] left-0 right-0 h-0.5 bg-[repeating-linear-gradient(90deg,#2596be_0_8px,transparent_8px_16px)] z-0" />
              <div className="md:hidden absolute top-0 bottom-0 left-[26px] w-0.5 bg-[repeating-linear-gradient(180deg,#2596be_0_8px,transparent_8px_16px)] z-0" />

              <div className="flex md:block gap-4">
                <button
                  onClick={() => scrollToYear(y.id)}
                  aria-label={`Jump to ${y.year} events`}
                  className="relative z-10 shrink-0 w-[52px] h-[52px] rounded-full mb-0 md:mb-6 md:mx-auto transition-transform hover:scale-110"
                  style={{
                    background: "radial-gradient(circle at 32% 30%, #bfe9f5, #2596be 65%, #0A192F)",
                    boxShadow: "0 0 0 8px rgba(37,150,190,0.08), 0 0 24px rgba(37,150,190,0.4)",
                  }}
                />

                <div
                  onClick={() => scrollToYear(y.id)}
                  className="relative z-10 flex-1 bg-surface border border-navy/[0.09] rounded-xl2 shadow-soft hover:-translate-y-1.5 hover:shadow-soft-lg transition-all duration-300 p-6 cursor-pointer"
                >
                  <Eyebrow className="mb-1.5">{y.year}</Eyebrow>
                  <h4 className="font-display font-semibold text-navy text-lg mb-3">{y.title}</h4>
                  <div className="grid grid-cols-2 gap-2.5 text-xs text-ink-soft">
                    <div>
                      <b className="block font-display text-lg text-navy">{y.events}</b>Events
                    </div>
                    <div>
                      <b className="block font-display text-lg text-navy">{y.outreach}</b>Outreach
                    </div>
                    <div>
                      <b className="block font-display text-lg text-navy">{y.workshops}</b>Workshops
                    </div>
                    <div>
                      <b className="block font-display text-lg text-navy">{y.stargazing}</b>Stargazing
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
