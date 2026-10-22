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
} from "firebase/firestore";

const projectId = "demo-actcet-members";
const ownerEmail = "actcet@tcetmumbai.in";
let testEnv;

const memberProfile = (uid, role = "member") => ({
  fullName: `Member ${uid}`,
  collegeEmail: `${uid}@tcetmumbai.in`,
  rollNumber: "123456",
  className: "EXTC",
  division: "A",
  academicYear: "2026-27",
  phoneNumber: "",
  profilePhotoUrl: "",
  membershipStatus: "active",
  role,
  aicteHours: 0,
  createdAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
  updatedAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
});

before(async () => {
  const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
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
    await setDoc(doc(db, "accessControl/event-manager"), { role: "eventManager" });
    await setDoc(doc(db, "members/member-a"), memberProfile("member-a"));
    await setDoc(doc(db, "members/member-b"), memberProfile("member-b"));
    await setDoc(
      doc(db, "members/member-candidate"),
      memberProfile("member-candidate", "core_team"),
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

test("a verified member can read their own profile and registration", async () => {
  const db = testEnv
    .authenticatedContext("member-a", {
      email: "member-a@tcetmumbai.in",
      email_verified: true,
    })
    .firestore();

  await assertSucceeds(getDoc(doc(db, "members/member-a")));
  await assertSucceeds(getDoc(doc(db, "members/member-a/registrations/reg-1")));
});

test("a member cannot read another member profile or registration", async () => {
  const db = testEnv
    .authenticatedContext("member-a", {
      email: "member-a@tcetmumbai.in",
      email_verified: true,
    })
    .firestore();

  await assertFails(getDoc(doc(db, "members/member-b")));
  await assertFails(getDoc(doc(db, "members/member-b/registrations/reg-1")));
  await assertFails(getDocs(collection(db, "members")));
  await assertFails(
    updateDoc(doc(db, "members/member-b"), {
      phoneNumber: "+91 98765 43210",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(deleteDoc(doc(db, "members/member-b")));
});

test("a member can update only their phone and profile photo", async () => {
  const db = testEnv
    .authenticatedContext("member-a", {
      email: "member-a@tcetmumbai.in",
      email_verified: true,
    })
    .firestore();
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
  await assertFails(updateDoc(ownProfile, { membershipStatus: "inactive" }));
  await assertFails(updateDoc(ownProfile, { rollNumber: "654321" }));
  await assertFails(updateDoc(ownProfile, { collegeEmail: "other@example.com" }));
  await assertFails(updateDoc(ownProfile, { updatedAt: Timestamp.now() }));
});

test("members cannot create or delete profiles or write registrations", async () => {
  const db = testEnv
    .authenticatedContext("member-a", {
      email: "member-a@tcetmumbai.in",
      email_verified: true,
    })
    .firestore();

  await assertFails(setDoc(doc(db, "members/new-member"), memberProfile("new-member")));
  await assertFails(setDoc(doc(db, "members/member-a/registrations/forged"), {
    eventId: "event-2",
    eventName: "Forged attendance",
    registrationDate: "2026-08-02",
    registrationDetails: "",
    attended: true,
    updatedAt: serverTimestamp(),
  }));
});

test("console-assigned Core Team roles can manage member records and club subcollections", async () => {
  const db = testEnv
    .authenticatedContext("core-uid", {
      email: "core@tcetmumbai.in",
      email_verified: true,
    })
    .firestore();
  const target = doc(db, "members/member-b");

  await assertSucceeds(getDoc(target));
  await assertSucceeds(getDocs(collection(db, "members")));
  await assertSucceeds(
    setDoc(
      doc(db, "members/new-member"),
      memberProfile("new-member", "wc"),
    ),
  );
  await assertSucceeds(
    updateDoc(target, {
      fullName: "Updated by Core Team",
      rollNumber: "654321",
      className: "IT",
      division: "B",
      academicYear: "2027-28",
      membershipStatus: "inactive",
      aicteHours: 32,
      workingGroup: "outreach",
      updatedAt: serverTimestamp(),
    }),
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
  await assertSucceeds(deleteDoc(doc(db, "members/member-b/registrations/reg-1")));
  await assertSucceeds(deleteDoc(target));
});

test("Core Team cannot assign or change member roles", async () => {
  const db = testEnv
    .authenticatedContext("core-uid", {
      email: "core@tcetmumbai.in",
      email_verified: true,
    })
    .firestore();
  const existingProfile = await getDoc(doc(db, "members/member-b"));

  await assertFails(setDoc(
    doc(db, "members/new-core-member"),
    memberProfile("new-core-member", "core_team"),
  ));
  await assertFails(
    updateDoc(doc(db, "members/member-b"), {
      role: "core_team",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(db, "members/member-b"), {
      role: "wc",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(db, "members/member-b"), {
      role: "core_team",
      updatedAt: serverTimestamp(),
    }),
  );
  assert.equal(existingProfile.data().role, "member");
});

test("a core_team profile field without a trusted claim grants no access", async () => {
  const db = testEnv
    .authenticatedContext("member-candidate", {
      email: "member-candidate@tcetmumbai.in",
      email_verified: true,
      coreTeam: true,
    })
    .firestore();

  await assertSucceeds(getDoc(doc(db, "members/member-candidate")));
  await assertFails(getDoc(doc(db, "members/member-b")));
  await assertFails(getDocs(collection(db, "members")));
});

test("unverified and unauthenticated users cannot read member data", async () => {
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

test("only a console-assigned admin can read all member records", async () => {
  const ownerDb = testEnv
    .authenticatedContext("owner-uid", {
      email: ownerEmail,
      email_verified: true,
    })
    .firestore();
  const otherAdminDb = testEnv
    .authenticatedContext("other-admin", {
      email: "someone-else@example.com",
      email_verified: true,
    })
    .firestore();

  await assertSucceeds(getDoc(doc(ownerDb, "members/member-a")));
  await assertSucceeds(getDocs(collection(ownerDb, "members")));
  await assertSucceeds(getDoc(doc(ownerDb, "members/member-a/registrations/reg-1")));
  await assertFails(getDoc(doc(otherAdminDb, "members/member-a")));
  await assertSucceeds(
    updateDoc(doc(ownerDb, "members/member-a"), {
      role: "wc",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("an admin can assign Core Team member roles but cannot edit access-control docs from the client", async () => {
  const adminDb = testEnv
    .authenticatedContext("owner-uid", {
      email: ownerEmail,
      email_verified: true,
    })
    .firestore();

  await assertSucceeds(
    updateDoc(doc(adminDb, "members/member-b"), {
      role: "core_team",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(setDoc(doc(adminDb, "accessControl/member-b"), { role: "coreTeam" }));
  await assertFails(updateDoc(doc(adminDb, "accessControl/core-uid"), { role: "admin" }));
  await assertFails(getDoc(doc(adminDb, "accessControl/core-uid")));
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
  await assertFails(updateDoc(doc(db, "members/member-a"), {
    role: "core_team",
    updatedAt: serverTimestamp(),
  }));
});

test("an eventManager access record grants only the existing event permissions", async () => {
  const db = testEnv
    .authenticatedContext("event-manager", {
      email: "events@tcetmumbai.in",
      email_verified: true,
    })
    .firestore();

  await assertSucceeds(getDoc(doc(db, "events/draft")));
  await assertFails(getDoc(doc(db, "members/member-a")));
  await assertFails(getDocs(collection(db, "members")));
});

test("public visitors can read published events but not drafts", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(db, "events/published")));
  await assertFails(getDoc(doc(db, "events/draft")));
});
