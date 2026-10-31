import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Eyebrow from "@/components/ui/Eyebrow";
import Lightbox from "@/components/ui/Lightbox";
import { galleryYears, galleryImages } from "@/data/gallery";
import { useClubData } from "@/context/ClubDataContext";
import { normalizeAcademicYear } from "@/lib/aicte";
import type { GalleryImage } from "@/types";

export default function Gallery() {
  const { showcaseEvents } = useClubData();

  const mergedGallery = useMemo(() => {
    const byYear: Record<string, GalleryImage[]> = {};
    for (const yr of galleryYears) {
      byYear[yr] = [...(galleryImages[yr] || [])];
    }

    for (const evt of showcaseEvents) {
      const displayYear = normalizeAcademicYear(evt.academicYear || "2025-26").replace(
        "-",
        "–"
      );
      if (!byYear[displayYear]) {
        byYear[displayYear] = [];
      }
      const existingUrls = new Set(byYear[displayYear].map((g) => g.image));
      const photos = [evt.image, ...(evt.gallery || [])].filter(Boolean);
      photos.forEach((imgUrl, idx) => {
        if (!existingUrls.has(imgUrl)) {
          existingUrls.add(imgUrl);
          byYear[displayYear].unshift({
            id: `sc-gal-${evt.id}-${idx}`,
            year: displayYear,
            caption: `${evt.name} (${evt.date})`,
            image: imgUrl,
            height: 360,
          });
        }
      });
    }

    return byYear;
  }, [showcaseEvents]);

  const allYears = useMemo(() => {
    const keys = Object.keys(mergedGallery);
    return Array.from(new Set([...galleryYears, ...keys]));
  }, [mergedGallery]);

  const [activeYear, setActiveYear] = useState<string>(galleryYears[0]);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  const activeImages = mergedGallery[activeYear] || [];

  return (
    <section id="gallery" className="py-28 px-[6vw]">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Visuals</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-6">
          Gallery
        </h2>

        <div className="flex flex-wrap gap-2.5 mb-8">
          {allYears.map((year) => (
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
          {activeImages.map((img) => (
            <button
              key={img.id}
              onClick={() => setLightboxImage(img)}
              className="block w-full mb-4 rounded-2xl overflow-hidden break-inside-avoid"
            >
              <img
                src={img.image}
                alt={img.caption}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </section>
  );
}
