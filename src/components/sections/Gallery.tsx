import { useState } from "react";
import { cn } from "@/lib/utils";
import Eyebrow from "@/components/ui/Eyebrow";
import Lightbox from "@/components/ui/Lightbox";
import { galleryYears, galleryImages } from "@/data/gallery";
import type { GalleryImage } from "@/types";

export default function Gallery() {
  const [activeYear, setActiveYear] = useState<string>(galleryYears[0]);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  return (
    <section id="gallery" className="py-28 px-[6vw]">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Visuals</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-6">Gallery</h2>

        <div className="flex flex-wrap gap-2.5 mb-8">
          {galleryYears.map((year) => (
            <button
              key={year}
              onClick={() => setActiveYear(year)}
              className={cn(
                "px-6 py-3 rounded-full font-label font-semibold text-sm border transition-colors",
                activeYear === year
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-ink-soft border-navy/[0.09] hover:border-primary/40"
              )}
            >
              {year}
            </button>
          ))}
        </div>

        <div className="columns-2 md:columns-4 gap-4 [column-fill:balance]">
          {galleryImages[activeYear].map((img) => (
            <button
              key={img.id}
              onClick={() => setLightboxImage(img)}
              className="block w-full mb-4 rounded-2xl overflow-hidden break-inside-avoid"
            >
              <img src={img.image} alt={img.caption} className="w-full h-auto object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </section>
  );
}
