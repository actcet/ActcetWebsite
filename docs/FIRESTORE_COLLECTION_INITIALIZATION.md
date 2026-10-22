# Live collection initialization — 2026-10-22

Project: astronomytcet-206c1. Database: (default). Branch: shinjini.

| Collection | Exists live | Documents | Result |
| --- | --- | --- | --- |
| users | Yes | WaEG76cAKLQGOuwBRjbNiuHPS8k2 | Existing administrator unchanged |
| events | Yes | _metadata | Created and read back |
| attendance | Yes | _metadata | Created and read back |
| settings | Yes | club | Existing settings unchanged |

Both metadata documents have type collection_metadata, their respective collectionName, initialized true, schemaVersion numeric 1, the exact requested descriptions and server timestamp createdAt 2026-10-22T17:52:40.656Z. No fake member, event or attendance document was created. The Firestore API lists all four top-level collections; refresh Firebase Console to see them. Console UI was not opened by the agent.

## Safety and live operations

The official Firebase plugin verified the project, listed records and retrieved deployed rules. Both target documents were confirmed missing. The Firebase CLI authenticated administrative API verified datastore read/create IAM permissions and the existing database, then atomically committed only the two requested documents, with currentDocument.exists false and createdAt REQUEST_TIME transforms. It did not use keys, public permissions, another project/database or another service.

All administrator fields, approvedBy, timestamps and document updateTime were compared before/after and are identical. settings/club remains currentAcademicYear 2026-27, hoursPerAICTEPoint 4; its complete document and updateTime are identical. Users and settings contain no new documents. No Authentication operation was performed. Deployed rules were retrieved before/after and are identical; no rules deployment was needed.

Reapplying the initializer returned created: [] and preserved the existing metadata. The reusable script is scripts/initialize-portal-collections.cjs. Its default mode is read-only; --apply creates only missing documents, verifies existing metadata and refuses malformed existing records. A concurrent create causes a failed precondition rather than an overwrite. Credentials are obtained in memory from the existing Firebase CLI login and are never printed.

## Frontend compatibility

Portal event queries filter academicYear and attendance queries filter eventId, naturally excluding metadata that lacks these fields. A defensive isCollectionMetadata filter also excludes reserved IDs/type markers before mapping. Both portals retain the existing UI, attendance representation, event IDs and AICTE utility. A refresh loading race revealed by the browser test was fixed: scoped event/attendance data must finish loading before displaying totals.

Live filtered queries returned zero event records and zero attendance records, excluding metadata. MCP's query helper initially sent a read_time ahead of server time; the same latest-read queries succeeded through the authenticated CLI without a client timestamp. This tool clock issue did not require changing rules or records.

## Executed checks

- npm run build: TypeScript compilation and production build passed; existing bundle-size warning remains.
- npm run test:aicte: 2 passed.
- npm run test:rules: 28 passed, including metadata read permissions and denied client overwrites/updates/deletes.
- npm run test:portal: 15 browser groups passed with both metadata fixtures present; zero page JavaScript errors. Covers metadata-only empty tables, zero AICTE, normal event creation, dynamic columns, attendance check/uncheck, refresh persistence, separate sessions and academic-year grouping.
- Initial test-harness assumptions about raw collection documents were corrected to exclude metadata. One test fixture initialized a Firestore context twice; that fixture was corrected before the passing run.
- The unchanged static Events section still emits its pre-existing duplicate-key warning.
- Live privileged browser testing was not performed. Portal UI verification used local Auth/Firestore emulators; live writes were restricted to the two metadata documents.

## Files changed in this task

src/services/portalService.ts; src/context/ClubDataContext.tsx; tests/firestore-rules.test.mjs; tests/portal-browser.cjs. Added scripts/initialize-portal-collections.cjs and this report. Appended the initialization note to the integration report. Existing uncommitted work remains preserved. No marketing content/assets, rules, Firebase service configuration, Auth identities, Git history, GitHub or Hosting deployment were changed.
