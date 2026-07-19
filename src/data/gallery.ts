import { placeholderImage } from "@/lib/utils";
import type { GalleryImage } from "@/types";

export const galleryYears = ["2025–26", "2024–25", "2023–24", "2022–23"] as const;

const heights = [280, 220, 320, 240, 300, 230, 290, 250];

function buildYearGallery(year: string, count = 8): GalleryImage[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${year}-${i}`,
    year,
    caption: `${year} · Photo ${i + 1}`,
    image: placeholderImage(`actcet-gallery-${year}-${i}`, 500, heights[i % heights.length]),
    height: heights[i % heights.length],
  }));
}

export const galleryImages: Record<string, GalleryImage[]> = Object.fromEntries(
  galleryYears.map((year) => [year, buildYearGallery(year)])
);
