# Initial administrator provisioning

Target: `astronomytcet-206c1`, Firestore `(default)`, existing registered web app `1:9325607607:web:795bccaa886869f8e4ab32`.

Proposed identity: **astrid.topic1024@gmail.com**, proposed role **Chairperson**.

Status at implementation: the Firebase MCP lookup and independent authenticated CLI lookup both found **no Firebase Authentication user** for this email. No UID has been invented, no duplicate account created, and no privilege granted. Being signed into the Firebase CLI with this Google email does not automatically create a website Firebase Auth account.

The user explicitly requires a separate project-owner authorization before this identity receives Chairperson permissions. Selecting Chairperson in registration only writes `requestedRole`; the actual `role` stays `Member` and `approvalStatus` stays `pending`.

## Owner procedure

1. Run the real application locally (`npm run dev`, without `VITE_USE_FIREBASE_EMULATORS`) and register the proposed email through the recovered registration form. The account holder supplies their own password and accurate profile details. Do not send or commit the password.
2. The project owner opens Firebase Console for **astronomytcet-206c1 → Authentication → Users** and checks the exact email, actual UID, disabled state, and account ownership. Verify control of the email through an owner-approved verification process. A matching display name or a requested role alone is insufficient.
3. Read **Firestore `(default)` → users → that exact UID**. Confirm its email and profile match the intended identity, its current status is pending, its actual role is Member, and the requested role is Chairperson. Preserve all registration details and timestamps.
4. Obtain and record explicit owner authorization for that exact UID/email and role. This step has not been completed during this implementation.
5. Using the owner's authenticated Firebase Console/IAM permissions, update only `role` to `Chairperson`, `approvalStatus` to `approved`, `approvedAt` to a timestamp for the authorization, and `approvedBy` to the actual authorizing owner identity (a string of at most 128 characters). Do not change name, email, academic fields, or `createdAt`. Read the document back to verify the update. No service-account key is necessary.
6. The user's existing profile listener will reflect approval and display Admin Portal. Verify the navbar and `/admin` using that identity. These production administrator checks are pending until the owner performs or expressly authorizes provisioning.

The same process can provision a Mentor if that identity and role are separately owner-authorized. Do not provision any other privileged identity automatically. The browser has no bootstrap endpoint, email allowlist, default admin, or way to create an approved profile.

## Subsequent approvals

Approved Chairperson/Mentor accounts use Login Approvals. The UI shows the requested role and a separate **verified-role selector**, defaulting to Member. The administrator chooses the role they have actually verified before approving. Rules require a currently approved administrator profile, reject self-authorization changes, preserve identity fields, and record the acting administrator and server timestamp.

## Revocation and disabled/deleted Auth accounts

Revoke live Firestore approval first (`approvalStatus: rejected`, `role: Member`, `approvedAt: null`, `approvedBy: the acting administrator`), then disable/delete the Auth account as appropriate. Admin Portal rejection or a trusted owner can revoke the profile. Rules consult that current profile on every protected operation and snapshots remove access in the UI.

Disabling/deleting an Auth account alone does not immediately invalidate an already-issued Firebase ID token; it may remain usable until expiration (normally up to an hour). Firestore Rules cannot query the Auth user directory. Immediate revocation therefore requires revoking/deleting the Firestore profile as well. No billable token-revocation backend or Cloud Function was introduced. See [Firebase session management](https://firebase.google.com/docs/auth/admin/manage-sessions).
