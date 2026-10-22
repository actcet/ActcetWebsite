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
`src/lib/firebase.ts`; import `auth` and `db` from `@/lib/firebase`. The member
portal UI is not included. The contract below is enforced by Firestore Rules
and is designed to run on Firebase's Spark plan without Cloud Functions or
service-account credentials in the browser.

### Registration and approval

- Enable **Authentication → Sign-in method → Email/Password** and public
  account creation. The registration UI must accept only addresses ending in
  `@tcetmumbai.in`. Use `registerMemberAccount(email, password)` from
  `@/lib/member-auth` to create the Auth account, send the verification email,
  and sign out until verification is complete.
- After the user verifies their email and signs in again (or refreshes the
  Auth user/token), call `submitMemberApplication(details)` from
  `@/lib/member-auth`. It refreshes the Auth token and creates a profile at
  `members/{firebaseAuthUid}`. The document ID and `collegeEmail` must match
  the verified Auth UID and email. On initial creation the Rules require
  `membershipStatus: "pending"`, `role: "member"`, `aicteHours: 0`, and
  `createdAt`/`updatedAt` from `serverTimestamp()`.
- Pending and rejected applicants can read only their own profile/status.
  They cannot read registrations or member data. An active member can read
  their own profile and registrations, and update only `phoneNumber`,
  `profilePhotoUrl`, and `updatedAt`.
- Firebase Auth on Spark has no blocking hook to reject an out-of-domain
  account at account-creation time. The UI must reject it before signup, while
  Firestore Rules independently reject unverified or non-`@tcetmumbai.in`
  users from registering or accessing member data. This is the strongest
  domain restriction available without upgrading to a paid Auth feature.

### Admin and Core Team permissions

- The Chairperson's verified Auth UID is the sole initial Admin. Admin access
  is granted by the trusted document `accessControl/{uid}` with `role: "admin"`.
  Bootstrap this record in Firebase Console; no client can grant Admin access.
- Only Admin can list/review pending profiles and change `membershipStatus`
  (`pending`, `active`, `inactive`, `rejected`). A Core Team member cannot
  approve or reject anyone, including themself.
- Admin can assign Core Team access by first setting an approved member's
  profile `role` to `core_team`, then creating
  `accessControl/{uid}` with `role: "coreTeam"`. To revoke it, delete that
  access-control document and change the profile role as appropriate. Rules
  authorize Core Team from the trusted access-control record plus the
  associated profile being active and having `role: "core_team"`; a profile
  role alone never grants access.
- Core Team can manage active member records and their nested registrations,
  including attendance and AICTE hours, but cannot change profile roles,
  approval status, access-control records, or delete member profiles.
  Core Team member-list queries must filter `membershipStatus == "active"`;
  only Admin can review pending/rejected applications.
- Admin can read/manage members and assign/revoke Core Team access. Admin
  access-control records cannot be created, updated, or deleted through the
  app; provision the Chairperson's Admin record in Firebase Console. Existing
  `eventManager` access remains separate and limited to event management.
- CoreTeam members must be verified and approved. The UI should refresh the
  Auth user after email verification and handle permission-denied responses;
  Firestore Rules, not hidden UI controls, are authoritative.

### Profile and registration data

- Profile path: `members/{firebaseAuthUid}`. Required fields:
  `fullName`, `collegeEmail`, `rollNumber`, `className`, `division`,
  `academicYear`, `phoneNumber`, `profilePhotoUrl`, `membershipStatus`,
  `role`, `aicteHours`, `createdAt`, and `updatedAt`.
- Profile `role` values: `member`, `core_team`, `wc`. Approval statuses:
  `pending`, `active`, `inactive`, `rejected`.
- Event registrations and attendance:
  `members/{uid}/registrations/{registrationId}` with `eventId`, `eventName`,
  `registrationDate`, `registrationDetails`, `attended`, and `updatedAt`.
- Member photo fields accept HTTPS URLs; Firebase Storage upload/rules are not
  configured.
- Public event queries must filter on `status == "published"`. The `(default)`
  Standard Firestore database is in `asia-south1`.

### Chairperson setup

1. In Firebase Console for `astronomytcet-206c1`, enable Email/Password
   Authentication and add `localhost` plus deployed website domains under
   **Authorized domains**.
2. Create/verify the Chairperson's `@tcetmumbai.in` Auth account. In
   **Firestore → Data**, create `accessControl/{chairpersonAuthUid}` with the
   single field `role: "admin"`. The exact Auth UID is required.
3. The Chairperson adds Core Team access through the portal's trusted Admin
   workflow. Admin provisioning itself remains Console-only. Create member
   accounts through public signup and require verification/approval.

### Rules tests

Run `npm run test:rules` to start the Firestore Emulator and validate verified
domain registration, UID matching, pending/rejected isolation, Admin approval
and rejection, self-update limits, Core Team permissions, trusted role
assignment/revocation, event-manager separation, and published-event reads.
The tests use a demo project and do not modify production data.

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
