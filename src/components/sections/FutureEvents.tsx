import Eyebrow from "@/components/ui/Eyebrow";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";

export default function FutureEvents() {
  return (
    <section id="future" className="py-28 px-[6vw] bg-bg-alt">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Upcoming Missions</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-4">Future Events</h2>

        <Reveal>
          <Card className="text-center py-20 px-8">
            <div
              className="w-[130px] h-[130px] mx-auto mb-8 rounded-full"
              style={{
                background: "radial-gradient(circle at 32% 30%, #dff4fb, #2596be 70%, #0A192F)",
                boxShadow: "0 0 0 14px rgba(37,150,190,0.06)",
              }}
            />
            <h3 className="font-display font-semibold text-navy text-xl mb-2.5">No Upcoming Missions Yet</h3>
            <p className="text-ink-soft max-w-md mx-auto">
              New missions are being charted. Follow our socials or subscribe below to be the first to know when the
              next one launches.
            </p>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
