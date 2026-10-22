# Firebase portal integration — 22 October 2026

## Outcome

The recovered frontend on local `shinjini` now uses Firebase Email/Password Authentication and Firestore as the single source of truth for portal profiles, events, attendance and settings. No demo users, passwords, mock service, or localStorage business records remain in application workflows. Original static website content is retained.

Initial administrator provisioning is **blocked**, by design, until the named account exists and the project owner separately authorizes its actual UID and Chairperson role. Production privileged workflows are implemented and emulator-tested; they have not been exercised with a live privileged account.

## Git safety

- Started on clean `shinjini`, commit `96c8f128aa5a50403b2346c81a1c0c7323c47a80`.
- Verified recovered commit `178ccd6` is an ancestor and all recovered portal components exist.
- Created and verified `backup/shinjini-before-firebase-20261022-205855` at that original commit.
- Existing recovery backups remain intact. Removed files are recoverable from the backup branch.
- All implementation changes remain on local shinjini. No push, reset, force update, website deployment, or SQL Connect operation was performed.

## Firebase resources and actual operations

Verified with the Firebase plugin: existing project `astronomytcet-206c1`, web app `1:9325607607:web:795bccaa886869f8e4ab32`, Standard Firestore `(default)` in `asia-south1`, realtime enabled, billing disabled. Existing SDK configuration matches the registered web app.

Initial collection scan returned no collections. `settings/club` did not exist; created it with a create-only precondition, `currentAcademicYear: "2026-27"`, `hoursPerAICTEPoint: 4`. No existing document was overwritten.

Email/Password was configured through an auth-only Firebase plugin deployment. Independently verified the actual provider configuration with the authenticated CLI: `signIn.email.enabled: true`, `passwordRequired: true`. Existing authorized domains are the project's firebaseapp.com and web.app domains. Email/password login was tested successfully on localhost; OAuth/email-link domain configuration was not changed or needed for this workflow.

Rules passed emulator tests and Firebase's syntax validator. The plugin initially reported deployment success while the old rules were still active. This discrepancy was detected through the live settings read and remote rule retrieval. Performed explicit `firebase deploy --only firestore:rules --project astronomytcet-206c1 --non-interactive`; the CLI confirmed compilation and release. Retrieved the active rules with the plugin afterward and verified the new users/events/attendance/settings rules were active. Live unauthorized requests were rejected as expected.

No composite indexes were needed: members use one equality filter on `approvalStatus`; other portal collections are read directly and grouped/sorted client-side. Existing index configuration was preserved. No extra collection, database, Firebase project, Cloud SQL instance, SQL Connect service, or billing configuration was created or changed.

Firestore does not provision empty collections. The application addresses exactly `users`, `events`, `attendance`, and `settings`. Live registration temporarily created users documents; these were cleaned up. `events` and `attendance` remain empty in production until an owner-authorized administrator creates real records. Only settings/club remains from this task.

## Implemented behavior

- Registration validates inputs, creates a real Auth identity, then uses a transaction to create users/{uid} only when absent. Requested role is separate from Member authority; status is pending. No password is written to Firestore or application storage.
- Failed profile creation reconciles server state before attempting to delete only a newly-created Auth identity. Existing identities are never deleted by profile completion. If the result cannot be confirmed, an explicit recovery message is shown. A signed-in identity without a profile can complete the form using the same UID.
- Login uses email/password internally and validates the retained name against the retrieved profile before exposing approved content. Auth persistence and an ID-token listener handle sessions; a profile snapshot handles approval/role changes. Loading prevents protected content flashing.
- Pending and rejected users see dedicated standalone pages. Approval unlocks the site live and normalizes the route to home. Logout awaits sign-out.
- Approved Chairperson/Mentor see Admin Portal; other approved members are denied both navigation and direct admin access. Rules enforce protected writes independently.
- Admin approvals have an explicit verified-role selector defaulting to Member. Approval/rejection writes real status, acting UID and timestamps while preserving identity fields. Requested role alone grants nothing.
- Event creation writes one auto-ID document with name, session, Timestamp date, positive hours, description, actor and server timestamp. Both portals derive columns from snapshots.
- Attendance uses users/{uid} references and deterministic `{uid}__{eventAutoId}` document IDs. Rules reject duplicates under other IDs, missing/unapproved members, missing events and cross-session pairs. No document means not attended. Writes await completion, display errors, and disable pending controls; Firestore rolls back rejected local changes.
- Members Portal retains its exact title, italic caption, name/branch/year search, session groups, table structure and responsive scrolling.
- Both portals use the same production AICTE utility and the settings conversion factor. Hours/attendance/settings changes recalculate totals. No duplicated total is stored on users.
- Four obsolete localStorage keys are removed individually: actcet_members_v2, actcet_events_v2, actcet_attendance_v2, actcet_session_v2. Unrelated storage is preserved; Firebase manages its own authentication persistence.
- Missing/invalid settings and failed profile/data subscriptions show explicit loading/error states. Firebase errors never enable emulator data or fake records.

## Validation actually executed

| Check | Result / environment |
| --- | --- |
| Firebase rule syntax validation | Passed through plugin; CLI compilation also passed |
| Firestore security rules | 22 test groups passed against real local Firestore emulator |
| Production calculation utility | 2 groups passed, importing transpiled src/lib/aicte.ts rather than duplicating it |
| Browser end-to-end | 11 groups passed against Firebase Auth + Firestore emulators, using actual UI and SDK |
| Live registration | Passed against astronomytcet-206c1: real Auth account plus timestamped pending profile |
| Live role separation | Requested Chairperson stored separately; actual role remained Member |
| Live unauthorized operations | Self-promotion, event creation and public profile read all returned HTTP 403 |
| Live persistence | Refresh, sign-out and returning sign-in passed; pending access remained blocked |
| Storage cleanup | Obsolete keys removed, unrelated preference preserved in isolated test context |
| TypeScript | tsc -b --force passed |
| Production build | npm run build passed using existing local Vite 8.1.5 |
| Original website preservation | Git diff confirmed all section components, static data, public assets, CSS, Footer, SQL Connect files, hosting workflows and dependency files unchanged |
| Lint | No lint script/configuration exists |

Browser emulator groups cover registration, role separation, Chairperson access, live approval, real event creation, dynamic columns, check/uncheck attendance, cross-browser synchronization, 9/4=2.25, event-hour and conversion-setting changes, refresh persistence, search, grouping, name/password rejection, member admin denial, rejection screens, missing-profile recovery and 390px table scrolling. No page JavaScript errors were recorded. Controlled privileged fixtures existed only in the demo emulator project.

Security tests attempt anonymous listing, unauthorized reads/writes, self-approval, role escalation, forged identity/approver, invalid schemas/types/lengths, immutable-field changes, revoked/deleted-profile administration, duplicate attendance IDs, nonexistent references and cross-year attendance. Approved-member queries and legitimate admin operations also pass.

Controlled live test accounts used reserved example.test emails and were never approved or privileged. Two created profile UIDs were OL7vRDjWhnOu95hcGZ7yP9pJUXo1 and KiwHQOa69FNAcF7aFvG4Z1L0jvG3. Verified their exact controlled names/emails, removed profiles with matching updateTime preconditions, and independently confirmed no corresponding Auth identities remain. Confirmed live users/events/attendance collections contain no documents afterward. Failed attempts before rule propagation created no other persistent records.

## Blocked or untested

- Both plugin and independent CLI Auth lookup found no account for astrid.topic1024@gmail.com. No UID or first-admin privileges were provisioned. Follow [the owner procedure](FIREBASE_ADMIN_PROVISIONING.md) after registration and separate owner authorization.
- Live privileged approval, event creation, attendance management and approved-device synchronization are therefore not production-verified. Those workflows passed emulator UI and rule tests. No live user was elevated for testing.
- Auth-only disable/delete does not immediately revoke issued ID tokens. Revoke the live Firestore approval first for immediate rules enforcement; see owner procedure.
- Ambiguous network-failure reconciliation/rollback is implemented; arbitrary network loss during every registration stage was not exhaustively fault-injected.
- External videos, analytics, outbound links and every original homepage animation were not exhaustively browser-tested. Static source/assets were unchanged. Six pre-existing outreach flyer image paths still lack corresponding files.
- The prior recovery identified a clean dependency-install blocker involving unavailable rolldown versions. Manifest/lockfile were preserved. Builds use the existing toolchain, with missing Firebase packages linked from the prior recovery-dependencies directory. A fresh npm ci has not been demonstrated; keep that local dependency directory until dependency maintenance is separately addressed.
- Build reports a non-failing bundle-size warning (about 749 kB minified JS). No code splitting or website redesign was introduced.

## Files

Created: src/services/portalService.ts; src/components/ui/PortalDataStatus.tsx; tests/aicte.test.mjs; tests/portal-browser.cjs; docs/FIREBASE_ADMIN_PROVISIONING.md; docs/FIREBASE_INTEGRATION_REPORT.md; docs/FIRESTORE_RULES_AUDIT.json.

Modified: README.md; firebase.json; firestore.rules; src/App.tsx; src/context/AuthContext.tsx; src/context/ClubDataContext.tsx; src/lib/firebase.ts; src/lib/aicte.ts; src/types/club.ts; src/components/auth/LoginPage.tsx; PendingApprovalPage.tsx; AccountRejectedPage.tsx; src/components/admin/AdminPortalPage.tsx; AddEventModal.tsx; src/components/members/MembersPortalPage.tsx; src/components/layout/Navbar.tsx; MobileMenu.tsx; tests/firestore-rules.test.mjs.

Removed after real-service emulator verification: src/services/mockDataService.ts; unused modal/guard compatibility files src/components/auth/AuthModal.tsx and RouteGuard.tsx; unused conflicting legacy registration helper src/lib/member-auth.ts; copied-logic mock scripts scratch/test_auth_flow.mjs and scratch/test_flows.mjs. Standalone authentication and actual App route protection remain.

Preserved unchanged: package.json and package-lock.json; firestore.indexes.json; .firebaserc; hosting configuration/workflows; public assets; all original section components and static data; existing recovery report and backups; SQL Connect schemas/configuration/services. Original navbar appearance is retained, with only asynchronous logout handling changed in this task.

Evidence outside Git: `C:/Users/dutta/.codex/visualizations/2026/10/22/01a1642c-6922-7041-944f-f41acbe10917/` contains browser JSON results, screenshots, live test record, original deployed rules snapshot and local model/audit notes. Test passwords/tokens are not committed or printed.

## Rules review note

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for private approved-member reads, pending self-registration, and live Chairperson/Mentor-authorized writes with explicit schemas and immutable identity fields. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
