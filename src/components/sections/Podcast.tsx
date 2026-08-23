import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Eyebrow from "@/components/ui/Eyebrow";
import Card from "@/components/ui/Card";
import { episodes } from "@/data/podcast";

export default function Podcast() {
  const playableEpisodes = episodes.filter((episode) => episode.videoId);
  const [selectedEpisode, setSelectedEpisode] = useState(playableEpisodes[0]);
  const [visibleStart, setVisibleStart] = useState(0);
  const visibleEpisodes = episodes.slice(visibleStart, visibleStart + 4);
  const hasMoreEpisodes = episodes.length > 4;

  function showPreviousEpisodes() {
    setVisibleStart((start) => Math.max(0, start - 1));
  }

  function showNextEpisodes() {
    setVisibleStart((start) => Math.min(episodes.length - 4, start + 1));
  }

  return (
    <section className="py-28 px-[6vw] bg-bg-alt">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Listen</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-10">
          Across the Astroverse
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-xl2 overflow-hidden h-[340px] shadow-soft bg-navy">
            <iframe
              src={`https://www.youtube.com/embed/${selectedEpisode.videoId}`}
              title={selectedEpisode.title}
              className="w-full h-full border-0"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h4 className="font-display font-semibold text-navy text-lg">Latest Episodes</h4>
              {hasMoreEpisodes && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={showPreviousEpisodes}
                    disabled={visibleStart === 0}
                    aria-label="Show previous episodes"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-navy/15 text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-35 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={showNextEpisodes}
                    disabled={visibleStart >= episodes.length - 4}
                    aria-label="Show more episodes"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-navy/15 text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-35 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
            {visibleEpisodes.map((ep, index) => (
              <button
                key={ep.id}
                type="button"
                disabled={!ep.videoId}
                onClick={() => ep.videoId && setSelectedEpisode(ep)}
                className={`w-full text-left ${!ep.videoId ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                <Card className={`flex gap-4 items-center p-4 mb-3.5 ${selectedEpisode.id === ep.id ? "border-primary/40 shadow-[0_8px_24px_rgba(37,150,190,0.14)]" : ""}`}>
                  <div className="w-[38px] h-[38px] rounded-full bg-bg-alt flex items-center justify-center font-display font-bold text-primary shrink-0">
                    {visibleStart + index + 1}
                  </div>
                  <div>
                    <h5 className="font-display font-semibold text-navy text-sm">{ep.title}</h5>
                    <span className="text-xs text-ink-soft">{ep.description}</span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
