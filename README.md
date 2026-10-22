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

## Firebase

The Firebase app, Authentication, and Firestore clients are exported from
`src/lib/firebase.ts`. The member frontend is intentionally not included; the
teammate building it should use the following contract. The portal backend is
designed to stay on Firebase's Spark plan and does not use Cloud Functions.

### Member data and client permissions

- A member profile lives at `members/{firebaseAuthUid}`. The document ID must be
  the signed-in Firebase Authentication user's UID.
- Profile fields: `fullName`, `collegeEmail`, `rollNumber`, `className`,
  `division`, `academicYear`, `phoneNumber`, `profilePhotoUrl`,
  `membershipStatus` (`pending`, `active`, `inactive`), `role`
  (`member`, `core_team`, `wc`), `aicteHours`, `createdAt`, and `updatedAt`.
- Event signups and attendance live in
  `members/{uid}/registrations/{registrationId}` with `eventId`, `eventName`,
  `registrationDate`, `registrationDetails`, `attended`, and `updatedAt`.
- A verified member can read only their own profile and registrations. From the
  client they may update only their own `phoneNumber` and `profilePhotoUrl`;
  use Firestore `serverTimestamp()` for `updatedAt`. Photo values are HTTPS
  URLs; file upload/storage rules are not included.
- Require `user.emailVerified` in the member frontend. After sign-in, send
  `sendEmailVerification(user)` when needed; refresh the user before loading the
  profile so the verified-email rule can be evaluated.
- A verified user whose UID has an owner-managed
  `accessControl/{uid}` document with `role: "coreTeam"` can read, create,
  update, and delete all member documents and nested club records. Core Team
  can manage academic details, membership, AICTE hours, attendance, and other
  club fields, but cannot change the privileged `role` field.
- A verified user whose UID has `accessControl/{uid}` with `role: "admin"` has
  full member-record permissions, including role changes. An
  `eventManager` role can manage events. These role documents are never
  readable or writable through client SDKs; Firestore Rules consult them as
  trusted authorization data.
- Only someone with Firebase project IAM access (the owner/admin in Firebase
  Console) should create or edit `accessControl` documents. Console/IAM access
  is distinct from portal access: only UIDs explicitly added there receive
  Admin or Core Team rules permissions.
- Do not enable public account creation. Create member Auth accounts in
  Firebase Console (Authentication → Users → Add user), then create matching
  `members/{uid}` documents using the exact Auth UID. Send members password
  reset emails to set their passwords.

The frontend should use `signInWithEmailAndPassword`, `signOut`,
`onAuthStateChanged`, Firestore reads and member-allowed phone/photo updates.
Access-control documents are intentionally unreadable from client SDKs. To
show role-specific UI, probe an operation that requires the permission (for
example, read a known member UID other than the current user's UID) and show
management tools only if it succeeds. Handle permission-denied as an ordinary
member result; the Firestore Rules remain authoritative if the UI is bypassed.
Import `auth` and `db` from `@/lib/firebase`. Never ship service-account
credentials to the browser.

### Spark-plan access setup

1. In Firebase Console for `astronomytcet-206c1`, enable **Authentication →
   Sign-in method → Email/Password**. Add `localhost` and deployed website
   domains under Authentication's authorized domains. Keep public sign-up off.
2. Add the owner and each Core Team member under **Authentication → Users**.
   Require and complete email verification.
3. In **Firestore → Data**, create an `accessControl` collection. For the
   owner's Auth account, add a document whose ID is that account's exact Auth
   UID and whose field is `role: "admin"`. For each approved Core Team member,
   add a document using their exact Auth UID and `role: "coreTeam"`. Add
   `role: "eventManager"` only for event editors. Never let users create or edit
   these access-control documents through the portal.
4. Create each member profile at `members/{authUid}`. The `role` values are
   `member`, `core_team`, or `wc`; only an `admin` can assign `core_team`.
   Core Team can create profile documents and can manage their fields, but
   cannot provision Firebase Auth users on Spark. Project admins must create
   Auth users in the Console and share password-reset emails.
5. Members and Core Team users sign in with their email/password account. If
   role access is changed, sign out and back in before testing it.

### Rules tests

Run `npm run test:rules` to start the Firestore Emulator and verify member
isolation, restricted self-updates, Core Team CRUD for profiles and nested
club records, role-escalation denial, console-managed access-control
protection, Admin access, and published-event reads. Tests use a demo project
and do not modify production data.

Public event queries must filter on `status == "published"`. The `(default)`
Standard database is in `asia-south1`; Firestore rules are in `firestore.rules`.

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
