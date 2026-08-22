import type { GalleryImage } from "@/types";

const galleryAssets = {
  "2026–27": [],
  "2025–26": [
    ["Orientation", "/images/Actcet%20Images/actet%202025-2026/ORIENTATION/Orientation%202025.jpg.jpg"],
    ["Telescope Workshop", "/images/Actcet%20Images/actet%202025-2026/TELESCOPE%20WORKSHOP/Telescope%20Workshop%202025.jpg.jpeg"],
    ["AR/VR Workshop", "/images/Actcet%20Images/actet%202025-2026/AR%20VR%20WORKSHOP/AR%20VR%202025.jpg"],
    ["Astromanthan", "/images/Actcet%20Images/actet%202025-2026/ASTROMANTHAN/AStromanthan%202025.JPG%20(1).jpeg"],
    ["Space Blitz", "/images/Actcet%20Images/actet%202025-2026/ZEPHYR%20SPACE%20BLITZ/Space%20Blitz%202025.jpg.jpeg"],
    ["Podcast", "/images/Actcet%20Images/actet%202025-2026/PODCAST/Podcast%202025.png"],
  ],
  "2024–25": [
    ["Gundecha Outreach", "/images/Actcet%20Images/actcet%202024-2025/OUTREACH%20AT%20GUNDECHA/GUNDECHA.jpeg"],
    ["TP Bhatia Outreach", "/images/Actcet%20Images/actcet%202024-2025/OUTREACH%20AT%20TP%20BHATIA/TP%20BHATIA.jpeg"],
    ["Rocket Blitz", "/images/Actcet%20Images/actcet%202024-2025/ZEPHYR%20ROCKET%20BLITZ/ROCKET%20BLITZ.jpeg"],
  ],
  "2023–24": [["Brahmaand Outreach", "/images/Actcet%20Images/ACTCET%202023-2024/brahmaan%202023%20-%202024.jpg.jpeg"]],
  "2022–23": [],
} satisfies Record<string, [string, string][]>;

export const galleryYears = Object.keys(galleryAssets) as Array<keyof typeof galleryAssets>;

export const galleryImages: Record<string, GalleryImage[]> = Object.fromEntries(
  galleryYears.map((year) => [
    year,
    galleryAssets[year].map(([caption, image], index) => ({
      id: `${year}-${index}`,
      year,
      caption: `${year} · ${caption}`,
      image,
      height: 280 + (index % 3) * 40,
    })),
  ])
);
