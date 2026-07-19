# ACTCET Website

Official website of the Astronomy Club of Thakur College of Engineering & Technology,
built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/
    ui/         Reusable primitives (Button, Card, Badge, Reveal, Eyebrow, Tabs, Lightbox, CountUp)
    layout/     Navbar, MobileMenu, Footer
    sections/   One file per page section (Hero, About, Journey, Events, Committee, Gallery, etc.)
  data/         All content as typed data (events, committee members, gallery, stats, etc.)
                Edit these files to update site content without touching components.
  hooks/        Small reusable hooks (scroll state, count-up animation)
  types/        Shared TypeScript interfaces
  lib/          Utility helpers
```

## Replacing placeholder photos

All images currently point to seeded placeholder photos (`picsum.photos`) so every
card, gallery tile, and profile photo has a real image to preview the layout.
To use real photos:

1. Drop your images into `public/images/...`
2. Replace the corresponding `image` field in `src/data/*.ts` with `/images/your-file.jpg`

## Content you'll likely want to edit first

- `src/data/events.ts` — event details, dates, images
- `src/data/committee.ts` — committee member names, roles, photos
- `src/data/gallery.ts` — gallery images by year
- `src/data/contact.ts` — email, socials, address
- `src/data/mentor.ts` — faculty mentor bio and photo
