import Reveal from "@/components/ui/Reveal";

export default function IsroAssociation() {
  return (
    <section className="relative overflow-hidden text-center bg-gradient-to-b from-navy to-navy-2 text-white py-28 px-[6vw]">
      <div className="absolute inset-0 bg-stars opacity-25" />
      <div className="relative z-10 max-w-[900px] mx-auto">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-mint-bright/10 border border-mint-bright/30 text-mint-bright px-5 py-2 rounded-full font-label text-xs tracking-[0.1em] uppercase font-semibold">
            Proudly Associated with ISRO
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="font-display font-bold text-[clamp(2rem,4vw,3rem)] text-white mt-5 mb-10">
            Operating Under the ISRO Outreach Programme
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="flex items-center justify-center gap-10 flex-wrap mb-10">
            <div className="w-[120px] h-[120px] rounded-[28px] bg-white/[0.06] border border-white/15 backdrop-blur-md flex items-center justify-center text-[#B8CDE0] font-label text-[0.68rem] text-center p-2.5">
              ISRO Outreach Programme
            </div>
            <div className="text-mint-bright text-2xl">&#8595;</div>
            <div className="w-[120px] h-[120px] rounded-[28px] bg-white/[0.06] border border-white/15 backdrop-blur-md flex items-center justify-center text-[#B8CDE0] font-label text-[0.68rem] text-center p-2.5">
              ACTCET Astronomy Club
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="text-[#B8CDE0] text-[1.05rem] max-w-[700px] mx-auto">
            ACTCET proudly operates under the ISRO Outreach Programme and is committed to promoting astronomy,
            astrophysics, and space science through workshops, outreach initiatives, observations, podcasts,
            competitions, and educational activities — spreading scientific awareness among students and society.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
