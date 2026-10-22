import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

const projectId = "demo-actcet-members";
const ownerEmail = "actcet@tcetmumbai.in";
let testEnv;

const memberProfile = (
  uid,
  role = "member",
  membershipStatus = "active",
) => ({
  fullName: `Member ${uid}`,
  collegeEmail: `${uid}@tcetmumbai.in`,
  rollNumber: "123456",
  className: "EXTC",
  division: "A",
  academicYear: "2026-27",
  phoneNumber: "",
  profilePhotoUrl: "",
  membershipStatus,
  role,
  aicteHours: 0,
  createdAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
  updatedAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
});

const verifiedContext = (uid, email = `${uid}@tcetmumbai.in`) =>
  testEnv.authenticatedContext(uid, {
    email,
    email_verified: true,
  });

const submitRegistration = (db, uid, overrides = {}) =>
  setDoc(doc(db, `members/${uid}`), {
    ...memberProfile(uid, "member", "pending"),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  });

before(async () => {
  const rules = await readFile(
    new URL("../firestore.rules", import.meta.url),
    "utf8",
  );
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "accessControl/core-uid"), { role: "coreTeam" });
    await setDoc(doc(db, "accessControl/owner-uid"), { role: "admin" });
    await setDoc(doc(db, "accessControl/event-manager"), {
      role: "eventManager",
    });
    await setDoc(
      doc(db, "members/core-uid"),
      memberProfile("core-uid", "core_team"),
    );
    await setDoc(
      doc(db, "members/member-a"),
      memberProfile("member-a"),
    );
    await setDoc(
      doc(db, "members/member-b"),
      memberProfile("member-b"),
    );
    await setDoc(
      doc(db, "members/member-candidate"),
      memberProfile("member-candidate", "core_team"),
    );
    await setDoc(
      doc(db, "members/pending-user"),
      memberProfile("pending-user", "member", "pending"),
    );
    await setDoc(
      doc(db, "members/rejected-user"),
      memberProfile("rejected-user", "member", "rejected"),
    );
    await setDoc(doc(db, "members/member-a/registrations/reg-1"), {
      eventId: "event-1",
      eventName: "Stargazing",
      registrationDate: "2026-08-01",
      registrationDetails: "Two participants",
      attended: true,
      updatedAt: Timestamp.fromDate(new Date("2026-08-01T00:00:00Z")),
    });
    await setDoc(doc(db, "members/member-b/registrations/reg-1"), {
      eventId: "event-1",
      eventName: "Stargazing",
      registrationDate: "2026-08-01",
      registrationDetails: "Two participants",
      attended: true,
      updatedAt: Timestamp.fromDate(new Date("2026-08-01T00:00:00Z")),
    });
    await setDoc(doc(db, "events/published"), {
      id: "published",
      status: "published",
    });
    await setDoc(doc(db, "events/draft"), { id: "draft", status: "draft" });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test("verified members can submit only their own pending registration", async () => {
  const db = verifiedContext("applicant").firestore();

  await assertSucceeds(submitRegistration(db, "applicant"));
  await assertSucceeds(getDoc(doc(db, "members/applicant")));
  await assertFails(getDocs(collection(db, "members")));

  await assertFails(
    submitRegistration(db, "applicant", { membershipStatus: "active" }),
  );
  await assertFails(
    submitRegistration(db, "another-uid"),
  );
  await assertFails(
    submitRegistration(db, "applicant", { role: "core_team" }),
  );
});

test("only verified @tcetmumbai.in accounts can submit registrations", async () => {
  const unverifiedDb = testEnv
    .authenticatedContext("unverified", {
      email: "unverified@tcetmumbai.in",
      email_verified: false,
    })
    .firestore();
  const externalDb = testEnv
    .authenticatedContext("external", {
      email: "external@example.com",
      email_verified: true,
    })
    .firestore();

  await assertFails(submitRegistration(unverifiedDb, "unverified"));
  await assertFails(submitRegistration(externalDb, "external"));
  await assertFails(
    submitRegistration(
      verifiedContext("mismatch").firestore(),
      "mismatch",
      { collegeEmail: "other@tcetmumbai.in" },
    ),
  );
});

test("pending and rejected applicants can view only their own status", async () => {
  const pendingDb = verifiedContext("pending-user").firestore();
  const rejectedDb = verifiedContext("rejected-user").firestore();

  await assertSucceeds(getDoc(doc(pendingDb, "members/pending-user")));
  await assertSucceeds(getDoc(doc(rejectedDb, "members/rejected-user")));
  await assertFails(
    getDoc(doc(pendingDb, "members/pending-user/registrations/reg-1")),
  );
  await assertFails(getDoc(doc(pendingDb, "members/member-a")));
});

test("members cannot read or modify another member profile or registration", async () => {
  const db = verifiedContext("member-a").firestore();

  await assertSucceeds(getDoc(doc(db, "members/member-a")));
  await assertSucceeds(
    getDoc(doc(db, "members/member-a/registrations/reg-1")),
  );
  await assertFails(getDoc(doc(db, "members/member-b")));
  await assertFails(
    getDoc(doc(db, "members/member-b/registrations/reg-1")),
  );
  await assertFails(getDocs(collection(db, "members")));
  await assertFails(
    updateDoc(doc(db, "members/member-b"), {
      phoneNumber: "+91 98765 43210",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(deleteDoc(doc(db, "members/member-b")));
});

test("members can update only their own phone and profile photo", async () => {
  const db = verifiedContext("member-a").firestore();
  const ownProfile = doc(db, "members/member-a");

  await assertSucceeds(
    updateDoc(ownProfile, {
      phoneNumber: "+91 98765 43210",
      profilePhotoUrl: "https://example.com/member-a.png",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(updateDoc(ownProfile, { role: "wc" }));
  await assertFails(updateDoc(ownProfile, { aicteHours: 100 }));
  await assertFails(updateDoc(ownProfile, { membershipStatus: "active" }));
  await assertFails(updateDoc(ownProfile, { rollNumber: "654321" }));
  await assertFails(
    updateDoc(ownProfile, { collegeEmail: "other@example.com" }),
  );
  await assertFails(updateDoc(ownProfile, { updatedAt: Timestamp.now() }));
});

test("only the Admin can approve or reject a registration", async () => {
  const applicantDb = verifiedContext("pending-user").firestore();
  const coreDb = verifiedContext("core-uid").firestore();
  const adminDb = verifiedContext("owner-uid", ownerEmail).firestore();
  const applicant = doc(applicantDb, "members/pending-user");

  await assertFails(
    updateDoc(applicant, {
      membershipStatus: "active",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(coreDb, "members/pending-user"), {
      membershipStatus: "active",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(adminDb, "members/pending-user"), {
      membershipStatus: "active",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(adminDb, "members/rejected-user"), {
      membershipStatus: "rejected",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(coreDb, "members/core-uid"), {
      membershipStatus: "inactive",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("Core Team can manage active records and registrations, not approvals or roles", async () => {
  const db = verifiedContext("core-uid").firestore();
  const target = doc(db, "members/member-b");

  await assertSucceeds(getDoc(target));
  await assertSucceeds(
    getDocs(
      query(collection(db, "members"), where("membershipStatus", "==", "active")),
    ),
  );
  await assertSucceeds(
    updateDoc(target, {
      fullName: "Updated by Core Team",
      rollNumber: "654321",
      className: "IT",
      division: "B",
      academicYear: "2027-28",
      aicteHours: 32,
      workingGroup: "outreach",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(target, {
      membershipStatus: "inactive",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(target, {
      role: "core_team",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(
      doc(db, "members/new-member"),
      memberProfile("new-member", "member", "active"),
    ),
  );
  await assertSucceeds(
    setDoc(doc(db, "members/member-b/registrations/core-created"), {
      eventId: "event-2",
      eventName: "Workshop",
      registrationDate: "2026-09-01",
      registrationDetails: "Core Team managed registration",
      attended: false,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(db, "members/member-b/registrations/reg-1"), {
      attended: false,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    deleteDoc(doc(db, "members/member-b/registrations/reg-1")),
  );
  await assertFails(deleteDoc(target));
});

test("profile roles do not grant Core Team access without trusted access control", async () => {
  const db = verifiedContext("member-candidate").firestore();

  await assertSucceeds(getDoc(doc(db, "members/member-candidate")));
  await assertFails(getDoc(doc(db, "members/member-b")));
  await assertFails(getDocs(collection(db, "members")));
});

test("only an active, approved Core Team member can use Core Team permissions", async () => {
  const db = verifiedContext("pending-user").firestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "accessControl/pending-user"), {
      role: "coreTeam",
    });
  });

  await assertFails(getDoc(doc(db, "members/member-a")));
  await assertFails(getDocs(collection(db, "members")));
  await assertFails(
    getDoc(doc(db, "members/pending-user/registrations/reg-1")),
  );
});

test("Admin can assign and revoke Core Team but cannot grant Admin through the app", async () => {
  const adminDb = verifiedContext("owner-uid", ownerEmail).firestore();
  const member = doc(adminDb, "members/member-b");
  const access = doc(adminDb, "accessControl/member-b");

  await assertSucceeds(
    updateDoc(member, {
      role: "core_team",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(setDoc(access, { role: "coreTeam" }));
  await assertSucceeds(getDoc(access));

  await assertFails(
    setDoc(doc(adminDb, "accessControl/another-admin"), { role: "admin" }),
  );
  await assertFails(
    setDoc(doc(adminDb, "accessControl/member-a"), { role: "coreTeam" }),
  );
  await assertFails(
    updateDoc(doc(adminDb, "accessControl/core-uid"), { role: "admin" }),
  );
  await assertSucceeds(deleteDoc(access));
});

test("access-control data is private to Admin and Core Team cannot change permissions", async () => {
  const adminDb = verifiedContext("owner-uid", ownerEmail).firestore();
  const coreDb = verifiedContext("core-uid").firestore();

  await assertSucceeds(getDocs(collection(adminDb, "accessControl")));
  await assertFails(getDoc(doc(coreDb, "accessControl/core-uid")));
  await assertFails(
    setDoc(doc(coreDb, "accessControl/member-a"), { role: "admin" }),
  );
  await assertFails(
    updateDoc(doc(coreDb, "accessControl/core-uid"), {
      role: "admin",
    }),
  );
});

test("unverified and unauthenticated users cannot access member data", async () => {
  const unverifiedDb = testEnv
    .authenticatedContext("member-a", {
      email: "member-a@tcetmumbai.in",
      email_verified: false,
    })
    .firestore();
  const anonymousDb = testEnv.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(unverifiedDb, "members/member-a")));
  await assertFails(getDoc(doc(anonymousDb, "members/member-a")));
});

test("an Auth admin claim without a console-managed access record grants no privileges", async () => {
  const db = testEnv
    .authenticatedContext("unassigned-admin", {
      email: ownerEmail,
      email_verified: true,
      admin: true,
    })
    .firestore();

  await assertFails(getDocs(collection(db, "members")));
  await assertFails(
    updateDoc(doc(db, "members/member-a"), {
      role: "core_team",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("eventManager access remains separate from member permissions", async () => {
  const db = verifiedContext("event-manager").firestore();

  await assertSucceeds(getDoc(doc(db, "events/draft")));
  await assertFails(getDoc(doc(db, "members/member-a")));
  await assertFails(getDocs(collection(db, "members")));
});

test("public visitors can read published events but not drafts", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(db, "events/published")));
  await assertFails(getDoc(doc(db, "events/draft")));
});
