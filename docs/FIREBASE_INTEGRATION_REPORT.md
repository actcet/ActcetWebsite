# ACTCET Firestore integration verification — 2026-10-22

## Outcome

The existing portal uses Firebase Authentication and Cloud Firestore users, events, attendance and settings. There is no mock portal service, seeded production roster, fallback database or localStorage business-record source. Target project astronomytcet-206c1 and registered app 1:9325607607:web:795bccaa886869f8e4ab32 were verified. The existing Standard edition (default) database in asia-south1 was reused.

The official administrator profile and settings/club were read before and after operations. Every profile field, timestamps, approvedBy and document updateTime remained identical. Auth UID/email/password metadata remained unchanged; emailVerified remains false. No custom claims or additional administrators were assigned.

## Changes in this task

- Registration writes accountType member, safe Member authority, pending status, requestedRole and the active settings academic session. The session field displays that active value as read-only.
- Fixed a live-only registration confirmation race: a listener-backed getDocFromServer could return an old missing snapshot after the transaction committed. A fresh transaction read now confirms the saved profile. Registration failures preserve the Auth identity rather than deleting it on an uncertain read.
- Approved/pending/rejected profile listeners use status queries. Portal event subscriptions use relevant member/current academic sessions, and attendance listeners use event-ID batches. Old listeners unsubscribe when scopes or roles change, with generation guards against stale callbacks.
- Deployed rules support member and club_admin schemas, deny frontend changes to club administrator profiles, and explicitly forbid attendance for club administrators. Existing approved Chairperson/Mentor authority remains compatible.
- Expanded security tests and added reproducible browser-emulator orchestration with dynamic ports, plus an opt-in disposable live registration test.
- Preserved Add Event, approval role selection, checkbox UI, italic Members Portal caption, original website sections and static assets.

## Verification actually executed

| Check | Environment | Result |
| --- | --- | --- |
| Security-rule suite | Local Firestore emulator | 27 passed, 0 failed |
| Full browser suite after final registration fix | Local Auth + Firestore emulators | 14 groups passed, no page JavaScript errors |
| Live registration | Existing Firebase project | Auth identity + explicit member pending profile created successfully |
| Live pending protection and session | Existing Firebase project | Homepage blocked; refresh, logout and returning login passed |
| Live denied requests | Existing deployed rules | Self-promotion, event creation and public PII read each returned HTTP 403 |
| AICTE production utility | Node tests | 2 passed; 9/4 = 2.25, zero attendance and changing factors checked |
| TypeScript + production build | npm run build | Passed; existing chunk-size warning remains |
| Whitespace/conflict checks | Git/source | Passed; no merge conflicts |
| Administrator document preservation | Live read-back | All fields and updateTime identical |
| settings/club preservation | Live read-back | All fields and updateTime identical |

Emulator browser groups cover registration with requested Chairperson remaining pending Member, club_admin login and exclusion, live approval, rejection, three dynamic event columns, initially unchecked boxes with no preallocated attendance, check/uncheck, AICTE recalculation, event-hour/settings changes, browser refresh and separate sessions, two academic years, search, direct admin-route denial, wrong credentials/name, incomplete-profile recovery and mobile scrolling.

## Remote operations

Deployed only firestore:rules using explicit --project astronomytcet-206c1. Firebase's validator returned no errors, all rule/browser tests passed before release, and the retrieved deployed source matched local firestore.rules exactly after release. No Hosting, Storage, SQL Connect, billing, project, database or IAM changes were made.

Queries use equality or single-field IN filters and client-side sorting; no composite index is required. Existing indexes were inspected and not changed. settings/club already contains currentAcademicYear 2026-27 and hoursPerAICTEPoint 4; it was not overwritten.

Three clearly labelled example.test registration attempts were used. The first two revealed the confirmation bug and their Auth identities were removed by the old failing rollback; their exact orphan profiles were identified and deleted with updateTime preconditions. The third passed all four live groups, then its exact Auth identity and profile were deleted. Final database inspection is recorded separately. No official administrator was used as test data. No production event or attendance placeholder was created; these collections materialize when real records are saved.

## Files

Modified during this task: firestore.rules; package.json; src/services/portalService.ts; src/context/ClubDataContext.tsx; src/components/auth/LoginPage.tsx; src/lib/firebase.ts; tests/firestore-rules.test.mjs; tests/portal-browser.cjs; tests/run-firestore-rules.mjs; docs/FIREBASE_ADMIN_PROVISIONING.md; docs/FIREBASE_INTEGRATION_REPORT.md; docs/FIRESTORE_RULES_AUDIT.json.

New test files: tests/run-portal-browser.mjs; tests/portal-live-registration.cjs. tests/run-firestore-rules.mjs was already untracked when this task began and remains untracked. No source file was deleted in this task. Existing uncommitted account-type/frontend work in AuthContext, admin/member pages and types was preserved.

No changes to src/data, original section components, public assets, SQL Connect or deployment configuration. Static data/events.ts remains the homepage event source.

## Remaining acceptance and limits

Live privileged approval, event creation and attendance operations were not exercised: that requires an authorized administrator browser session. No password was requested or known, and no disposable live user was elevated. All those workflows passed real-SDK UI tests in the isolated emulators. Production cross-device approved-member synchronization is therefore not claimed; cross-session synchronization passed in the emulators.

Original homepage section presence was browser-checked. Exhaustive remote-image/video/animation availability was not retested. A pre-existing duplicate brahmaand-outreach-2024 React key warning remains in the unchanged static Events section. The build emits its existing large-bundle warning. There is no configured lint script.

## Git and safety

Branch shinjini, HEAD 32f4dbde1955367f9138507647a938e82fc9a543. Changes remain uncommitted for review. No reset, rebase, merge, commit or push was performed. Backup ref codex/backup-before-live-integration-20261022-1 preserves HEAD. A file-by-file hash-verified snapshot of tracked and untracked nonignored source was saved outside the repository under the Codex visualizations directory (actcet-before-live-integration-20261022-224006). Pre-release deployed rules were also saved there.

## Reproduce checks

npm run build
npm run test:aicte
npm run test:rules
npm run test:portal

Browser tests require Playwright (PLAYWRIGHT_MODULE may point to the installed Codex runtime module) and a browser (CHROME_PATH can select existing Chrome). TEST_ARTIFACT_DIR controls results/screenshots. The emulator runner allocates dynamic ports and uses demo-actcet-members, with all fixtures discarded at emulator shutdown. The live test requires ACTCET_ALLOW_LIVE_DISPOSABLE_TEST=1 and a local server configured for production Firebase; its exact profile must be removed through trusted IAM after its Auth cleanup. Never use the official admin as a disposable test fixture.


## Subsequent collection initialization

At the user’s explicit request, events/_metadata and attendance/_metadata were created live on 2026-10-22 with server timestamps. This supersedes the earlier empty-collection statement. All four collections now appear in the live API listing. No business records or protected data were changed. Metadata compatibility passed 28 rule tests, 15 emulator browser groups and 2 AICTE tests. See FIRESTORE_COLLECTION_INITIALIZATION.md for the exact live audit and file list.
