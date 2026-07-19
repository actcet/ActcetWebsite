import Eyebrow from "@/components/ui/Eyebrow";
import Card from "@/components/ui/Card";
import { episodes } from "@/data/podcast";

export default function Podcast() {
  return (
    <section className="py-28 px-[6vw] bg-bg-alt">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Listen</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-10">
          Across the Astroverse
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-xl2 h-[340px] flex items-center justify-center text-white/70 font-label text-sm shadow-soft bg-gradient-to-br from-navy to-primary">
            Spotify Embed Placeholder
          </div>

          <div>
            <h4 className="font-display font-semibold text-navy text-lg mb-4">Latest Episodes</h4>
            {episodes.map((ep, i) => (
              <Card key={ep.id} className="flex gap-4 items-center p-4 mb-3.5">
                <div className="w-[38px] h-[38px] rounded-full bg-bg-alt flex items-center justify-center font-display font-bold text-primary shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h5 className="font-display font-semibold text-navy text-sm">{ep.title}</h5>
                  <span className="text-xs text-ink-soft">{ep.description}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
