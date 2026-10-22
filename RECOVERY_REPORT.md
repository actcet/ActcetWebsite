# Local Git recovery — 22 October 2026

## Original state and preservation

The working tree was clean, with no untracked source files or stashes. Ignored directories were node_modules, dist, .ts-build, and tsconfig.tsbuildinfo. The existing dist output was archived before the successful production build.

| Reference | Original commit |
| --- | --- |
| main | 9c2d39015ca09ad7b2502ebbaf9e4835c1180763 |
| shinjini | cc5be9d6efa77f69eec837f053526fcb38a29699 |
| recover-work | 178ccd6ff69d5bd8ad68c1131229a1a120e78522 |
| origin/main | cc5be9d6efa77f69eec837f053526fcb38a29699 |

Verified backup branches:

- backup/main-before-recovery-20261022-204430
- backup/shinjini-before-recovery-20261022-204430
- backup/recover-work-before-recovery-20261022-204430

Fetched origin without updating any local branch. origin/main remained cc5be9d. Local main was four commits behind origin/main; integration uses the latter baseline, including 19a650b, 46d191c, b4c0ef3, and cc5be9d.

The recovered frontend commit 178ccd6 shares ancestor 9c2d390 with latest main. Reviewed all reflogs, branch histories, stashes, remote refs, Codex checkpoint trees, and unreachable objects. No additional frontend implementation was found. Checkpoint 9f5229c is identical to recover-work; 488e407 has the same frontend without the recovered SQL schema extension. Unreachable tree a4c425d contains the same frontend combined with newer main backend files. Its src tree a1141d4 differs only by main's Firebase files/bootstrap.

All 19 unreachable blobs/trees were exported, along with ref and reflog evidence, outside the repository at:

`C:/Users/dutta/.codex/visualizations/2026/10/22/01a1642c-6922-7041-944f-f41acbe10917/recovery-evidence/`

## Integration and conflict resolution

Temporary branch: codex/recovery-integration-20261022, created from origin/main. Reviewed the differences before merging recover-work using a normal two-parent merge. This retains the recovered commit and all main commits in history. The validated result is integrated into local shinjini with a fast-forward; no reset, force update, deletion, or push is used.

Only Git conflict: package-lock.json. The recovery changed optional-package metadata and had no frontend dependency additions; newer main added Firebase dependencies and rule-test dependencies. Retained origin/main's package.json and package-lock.json exactly, preserving all newer dependencies. Both input versions remain available on the backup branches.

The recovery also added portal tables to dataconnect/schema/schema.gql. Retained origin/main's schema exactly to honor the frontend-only scope and preserve existing SQL Connect configuration. The recovered schema extension remains intact in recover-work and its backup. No frontend feature uses that extension.

No source-file merge conflicts occurred: latest main's four commits changed backend files, dependencies, documentation, and bootstrap, while the recovered frontend extended separate files. Compared App, navbar, mobile menu, and all modified/new frontend files. Original homepage section components and order are retained. Fixed one recovered routing defect: navigation now updates pathname together with hash, so a direct visit to /admin or /members cannot leave a stale pathname overriding later home/login navigation. Removed a trailing blank line in types/index.ts.

Added files:

- src/components/admin/AddEventModal.tsx, AdminPortalPage.tsx
- src/components/auth/AccountRejectedPage.tsx, AuthLoadingScreen.tsx, AuthModal.tsx, LoginPage.tsx, PendingApprovalPage.tsx, RouteGuard.tsx, UnauthorizedAdminPage.tsx
- src/components/layout/WebsiteLayout.tsx
- src/components/members/MembersPortalPage.tsx
- src/context/AuthContext.tsx, ClubDataContext.tsx, ToastContext.tsx
- src/hooks/useAppRouter.ts
- src/lib/aicte.ts
- src/services/mockDataService.ts
- src/types/club.ts
- scratch/test_auth_flow.mjs, scratch/test_flows.mjs
- RECOVERY_REPORT.md

Modified files:

- src/App.tsx
- src/components/layout/Navbar.tsx, MobileMenu.tsx
- src/data/navigation.ts
- src/types/index.ts

Verified unchanged against origin/main: all src/components/sections files, all original data except navigation, Footer, CSS, public assets, package manifest/lockfile, Firebase configuration/rules/indexes/client utilities/bootstrap, SQL Connect files, backend tests, README, and GitHub deployment workflows. No files removed.

## Frontend restored

- Standalone first-visit login, name/email/password fields, registration fields and validation. Unauthenticated direct portal visits show login without homepage sections.
- Pending Approval and Rejected Account pages, frontend auth state, persisted approved sessions, protected routing, logout.
- Approved Chairperson/Mentor Admin navigation; other approved members cannot access Admin. Members Portal immediately follows Committee.
- Astronomy Members' Portal title and original italic caption; academic-year grouping, name/branch/year search, class/email/role columns, dynamic event columns, attendance indicators, AICTE totals, horizontal scrolling.
- Admin Login Approvals, pending registration list, Approve/Reject and rejection modal, Member Update tables, attendance checkboxes, event creation modal.
- Shared AuthContext, ClubDataContext, ToastContext, mock service, types, router, AICTE utility, and recovered compatibility components.
- AICTE = sum of attended event hours / 4. Mock service remains the portal data/auth provider. No Firebase integration was added or deployed.

## Validation and evidence

- TypeScript: `node node_modules/typescript/bin/tsc -b --force` passed.
- Production: `npm run build` passed with existing local Vite 8.1.5. Non-failing warning: main bundle exceeds 500 kB.
- Recovered scratch scripts both passed. They duplicate logic rather than importing production code; browser tests supply the runtime evidence.
- Playwright with installed Chrome against the production preview: ten groups passed, with zero page JavaScript errors. Tested unauthenticated /, /members and /admin; pending/rejected accounts; registration validation; approved Chairperson session persistence; original homepage DOM; navbar order; Members search; approval/rejection; attendance; new event columns; ordinary-member admin denial; Mentor admin navigation; logout; mobile menu and horizontal tables at 390px.
- Actual UI totals checked: 6 hours -> 1.5 points, adding 3 hours -> 2.25, adding 4 hours -> 3.25.
- Desktop/mobile screenshots were inspected. Homepage sections, original data, animations, and assets were also verified unchanged through Git comparison. A full visual comparison of every homepage section was not performed.
- No unresolved index entries or conflict markers. Final whitespace checks pass.
- No lint script/configuration exists. Existing Firestore emulator tests were retained but not run: backend files are unchanged, and this recovery did not operate Firebase services.
- Browser external requests were blocked. Production Firebase services, analytics, external video embeds, and external links were not tested.

Browser runner, JSON results, asset audit, and screenshots are in the visualization directory above (one level above recovery-evidence). Browser test data used an isolated Chrome context and does not seed committed source or the user's normal browser storage.

## Existing limitations discovered

1. A fresh npm installation is blocked by an unavailable rolldown version referenced by the current dependency tree. Main's lockfile specifies Vite 8.3.5/rolldown 1.2.15; local installed Vite is 8.1.5, and the attempted install reported unavailable rolldown ~1.2.1. Manifest and lockfile were intentionally preserved. Builds were validated against the working installed toolchain, not a clean lockfile installation.
2. Missing local Firebase 9.14.0 and @firebase/rules-unit-testing 2.0.7 were installed into the visualization directory's recovery-dependencies folder. node_modules/firebase and node_modules/@firebase are junctions to that folder. Keep that folder while using this local dependency setup. No tracked dependency files changed.
3. Main already references six absent files, /images/flyers/flyer1.png through flyer6.png. The outreach viewer cannot display those missing assets. Other original images and paths remain unchanged; the /images/orientation-1.jpg string is only a source comment, not an active asset reference.
4. Recovered mock authentication is demonstration logic: registered passwords live only in memory, and unknown stored credentials are not strictly checked after reload. It is not production authentication. Pending-page refresh does not automatically sign in a newly approved applicant; return to Login to sign in. Cross-tab live synchronization was not added. These behaviors were preserved without connecting Firebase Auth.

## Final branch guarantees

Local shinjini contains both latest fetched origin/main and recovered 178ccd6 as ancestors. main, origin/main, recover-work, and the three backup branch tips remain unchanged. Working tree is left on shinjini and verified clean after commit and final build. No GitHub branches or remote history were changed, and nothing was pushed.
