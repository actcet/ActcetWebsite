import Reveal from "@/components/ui/Reveal";
import { ExternalLink } from "lucide-react";

const isroSpaceTutorUrl = "https://www.isro.gov.in/spacetutor.html";

export default function IsroAssociation() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-2 text-white py-24 px-[6vw]">
      <div className="absolute inset-0 bg-stars opacity-25" />
      <div className="relative z-10 max-w-[1120px] mx-auto">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
          <Reveal>
            <div>
              <p className="font-label text-xs tracking-[0.16em] uppercase text-mint-bright font-semibold mb-5">
                Space education, made accessible
              </p>
              <h2 className="font-display font-bold text-[clamp(2.2rem,4.5vw,4rem)] leading-[1.05] text-white mb-6">
                Bringing the universe closer to every curious mind.
              </h2>
              <div className="text-[#B8CDE0] text-[1.05rem] leading-relaxed space-y-5">
                <p>
                  In tune with changing times, ISRO plays a vibrant role in sharing enriched knowledge of space with
                  students and society. Space Tutors make that learning journey more personal through modules,
                  hands-on activities, digital content, and virtual classrooms.
                </p>
                <p>
                  Astronomy Club of Thakur College of Engineering and Technology carries that spirit forward through
                  astronomy, astrophysics, and space-science workshops, observations, podcasts, competitions, and
                  outreach activities.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative rounded-[28px] border border-mint-bright/25 bg-[#102746]/90 p-7 sm:p-9 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-lg">
                    <img src="/images/Actcet%20Images/IMP%20LOGO/ISRO%20SPACE%20TUTOR%20LOGO%20(1).png" alt="ISRO" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <p className="font-label text-[0.65rem] tracking-[0.12em] uppercase text-mint-bright font-bold">
                      Official listing
                    </p>
                    <p className="font-display font-semibold text-white">ISRO Space Tutor</p>
                  </div>

                </div>
              </div>
              <div className="flex items-end gap-4 mb-7">
                <span className="font-display text-7xl leading-none font-bold text-mint-bright">52</span>
                <span className="font-label text-sm text-[#B8CDE0] pb-1">Serial number</span>
              </div>
              <div className="border-t border-white/10 pt-6">
                <p className="font-label text-xs tracking-[0.12em] uppercase text-[#7C93A8] mb-3">Space Tutor</p>
                <h3 className="font-display font-semibold text-2xl leading-tight text-white">
                  Thakur College of Engineering and Technology
                </h3>
                <p className="text-[#B8CDE0] mt-3">Maharashtra, India</p>
              </div>
              <a
                href={isroSpaceTutorUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-8 text-sm text-mint-bright hover:text-white transition-colors"
              >
                Verify on the official ISRO list <ExternalLink size={15} />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
