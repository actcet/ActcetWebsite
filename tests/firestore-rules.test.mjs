import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, where, serverTimestamp, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
const projectId = process.env.FIRESTORE_EMULATOR_PROJECT_ID || "demo-actcet-members";
const emulatorAddress = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8081";
const emulatorSeparator = emulatorAddress.lastIndexOf(":");
const emulatorHost = emulatorAddress.slice(0, emulatorSeparator);
const emulatorPort = Number(process.env.FIRESTORE_EMULATOR_PORT || emulatorAddress.slice(emulatorSeparator + 1));
const eventId = "abcdefghijklmnopqrst";
let env;
const profile = (id, role = "Member", approvalStatus = "approved") => ({ name: `Test ${id}`, email: `${id}@example.test`, accountType: "member", branch: "Comp", division: "A", year: "TE", academicYear: "2026-27", requestedRole: role, role, approvalStatus, createdAt: Timestamp.fromMillis(1), approvedAt: approvalStatus === "approved" ? Timestamp.fromMillis(1) : null, approvedBy: approvalStatus === "approved" ? "owner" : null });
const dbFor = id => env.authenticatedContext(id, { email: `${id}@example.test` }).firestore();
const event = () => ({ name: "Controlled Test Event", academicYear: "2026-27", date: Timestamp.fromMillis(1), aicteHours: 4, description: "Emulator only", createdAt: serverTimestamp(), createdBy: "chair" });
const attendance = () => ({ memberId: "member", eventId, attended: true, updatedAt: serverTimestamp(), updatedBy: "chair" });
before(async () => { env = await initializeTestEnvironment({ projectId, firestore: { host: emulatorHost, port: emulatorPort, rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") } }); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const [id, role, status] of [["chair", "Chairperson", "approved"], ["mentor", "Mentor", "approved"], ["member", "Member", "approved"], ["pending", "Member", "pending"], ["rejected", "Member", "rejected"]]) await setDoc(doc(db, "users", id), profile(id, role, status));
    await setDoc(doc(db, "settings/club"), { currentAcademicYear: "2026-27", hoursPerAICTEPoint: 4 });
    await setDoc(doc(db, "events", eventId), { ...event(), createdAt: Timestamp.fromMillis(1) });
  });
});
after(async () => { await env?.cleanup(); });
test("Public can read only non-sensitive club settings", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, "settings/club")));
  for (const path of ["users/member", `events/${eventId}`, `attendance/member__${eventId}`]) await assertFails(getDoc(doc(db, path)));
  for (const name of ["users", "events", "attendance", "settings"]) await assertFails(getDocs(collection(db, name)));
});
test("Self registration creates only pending Member with separate requested role", async () => {
  const db = dbFor("new");
  await assertSucceeds(setDoc(doc(db, "users/new"), { ...profile("new", "Member", "pending"), requestedRole: "Chairperson", createdAt: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(db, "users/new")));
  await assertFails(updateDoc(doc(db, "users/new"), { approvalStatus: "approved", role: "Chairperson" }));
});
test("Student registration without accountType remains compatible with existing deployed rules", async () => {
  const db = dbFor("legacy-student");
  const { accountType: _accountType, ...studentProfile } = profile("legacy-student", "Member", "pending");
  await assertSucceeds(setDoc(doc(db, "users/legacy-student"), { ...studentProfile, createdAt: serverTimestamp() }));
});
test("Self registration cannot create a privileged club administrator profile", async () => {
  const db = dbFor("bootstrap-attempt");
  await assertFails(setDoc(doc(db, "users/bootstrap-attempt"), {
    ...profile("bootstrap-attempt", "Chairperson", "approved"),
    name: "ACTCET Administration", email: "actcet@tcetmumbai.in", accountType: "club_admin",
    branch: null, division: null, year: null, academicYear: null,
    requestedRole: "Chairperson", role: "Chairperson", approvalStatus: "approved",
  }));
});
for (const [label, overrides] of [["approved", { approvalStatus: "approved" }], ["admin role", { role: "Chairperson" }], ["forged email", { email: "other@example.test" }], ["backdated", { createdAt: Timestamp.fromMillis(1) }], ["extra field", { isAdmin: true }], ["invalid role", { requestedRole: "root" }], ["oversized name", { name: "x".repeat(121) }], ["invalid branch", { branch: "Fake" }], ["wrong type", { year: 3 }], ["privileged approval", { approvedBy: "new" }]]) {
  test(`Registration rejects ${label}`, async () => { await assertFails(setDoc(doc(dbFor("new"), "users/new"), { ...profile("new", "Member", "pending"), createdAt: serverTimestamp(), ...overrides })); });
}
test("Registration cannot create another UID's profile", async () => { await assertFails(setDoc(doc(dbFor("attacker"), "users/new"), { ...profile("attacker", "Member", "pending"), createdAt: serverTimestamp() })); });
test("Pending and rejected users cannot read portal data or approve", async () => {
  for (const id of ["pending", "rejected"]) {
    const db = dbFor(id);
    await assertSucceeds(getDoc(doc(db, "users", id)));
    await assertFails(getDocs(collection(db, "events")));
    await assertFails(getDoc(doc(db, "users/member")));
    await assertFails(updateDoc(doc(db, "users/member"), { role: "Mentor", approvalStatus: "approved", approvedAt: serverTimestamp(), approvedBy: id }));
  }
});
test("Approved member query is constrained to approved profiles", async () => {
  const db = dbFor("member");
  await assertSucceeds(getDocs(query(collection(db, "users"), where("approvalStatus", "==", "approved"))));
  await assertFails(getDocs(collection(db, "users")));
  await assertFails(getDoc(doc(db, "users/pending")));
  await assertSucceeds(getDocs(collection(db, "events")));
  await assertSucceeds(getDocs(collection(db, "attendance")));
});
test("Ordinary member cannot self elevate, create event or edit attendance", async () => {
  const db = dbFor("member");
  await assertFails(updateDoc(doc(db, "users/member"), { role: "Chairperson" }));
  await assertFails(updateDoc(doc(db, "users/pending"), { role: "Mentor", approvalStatus: "approved", approvedAt: serverTimestamp(), approvedBy: "member" }));
  await assertFails(setDoc(doc(db, "events", "zyxwvutsrqponmlkjihg"), { ...event(), createdBy: "member" }));
  await assertFails(setDoc(doc(db, "attendance", `member__${eventId}`), { ...attendance(), updatedBy: "member" }));
});
test("Chairperson and Mentor can approve and reject through verified role update", async () => {
  for (const id of ["chair", "mentor"]) {
    const db = dbFor(id);
    await assertSucceeds(getDocs(collection(db, "users")));
    await assertSucceeds(updateDoc(doc(db, "users/pending"), { role: "Technical Head", approvalStatus: "approved", approvedAt: serverTimestamp(), approvedBy: id }));
    await assertSucceeds(updateDoc(doc(db, "users/pending"), { role: "Member", approvalStatus: "rejected", approvedAt: null, approvedBy: id, rejectionReason: "Controlled rejection" }));
  }
});
test("Admin cannot change own authority, forge approver, rewrite identity, or delete profiles", async () => {
  const db = dbFor("chair");
  await assertFails(updateDoc(doc(db, "users/chair"), { approvalStatus: "approved", approvedAt: serverTimestamp(), approvedBy: "chair" }));
  await assertFails(updateDoc(doc(db, "users/pending"), { role: "Member", approvalStatus: "approved", approvedAt: serverTimestamp(), approvedBy: "mentor" }));
  await assertFails(updateDoc(doc(db, "users/pending"), { name: "Hijacked", role: "Member", approvalStatus: "approved", approvedAt: serverTimestamp(), approvedBy: "chair" }));
  await assertFails(deleteDoc(doc(db, "users/member")));
});
test("Revoked or deleted profile cannot retain privileged writes", async () => {
  const db = dbFor("chair");
  await env.withSecurityRulesDisabled(async c => { await updateDoc(doc(c.firestore(), "users/chair"), { approvalStatus: "rejected" }); });
  await assertFails(setDoc(doc(db, "events", "zyxwvutsrqponmlkjihg"), event()));
  await env.withSecurityRulesDisabled(async c => { await deleteDoc(doc(c.firestore(), "users/chair")); });
  await assertFails(setDoc(doc(db, "events", "zyxwvutsrqponmlkjihg"), event()));
});
test("Admin creates event and updates hours; identity and academic year immutable", async () => {
  const db = dbFor("chair"), ref = doc(db, "events", "zyxwvutsrqponmlkjihg");
  await assertSucceeds(setDoc(ref, event()));
  await assertSucceeds(updateDoc(ref, { aicteHours: 2.5 }));
  for (const values of [{ aicteHours: 0 }, { aicteHours: -1 }, { aicteHours: "4" }, { name: "x".repeat(161) }, { date: "tomorrow" }, { createdBy: "mentor" }, { academicYear: "2025-26" }, { extra: true }]) await assertFails(updateDoc(ref, values));
});
test("Attendance upsert uses one pair, allows check/uncheck, and validates references", async () => {
  const db = dbFor("chair"), ref = doc(db, "attendance", `member__${eventId}`);
  await assertSucceeds(setDoc(ref, attendance()));
  await assertSucceeds(setDoc(ref, { ...attendance(), attended: false }));
  await assertFails(setDoc(doc(db, "attendance/duplicate"), attendance()));
  for (const values of [{ attended: "yes" }, { updatedBy: "mentor" }, { memberId: "pending" }, { eventId: "zyxwvutsrqponmlkjihg" }, { extra: true }]) await assertFails(setDoc(ref, { ...attendance(), ...values }));
  await env.withSecurityRulesDisabled(async c => { await updateDoc(doc(c.firestore(), "users/member"), { academicYear: "2025-26" }); });
  await assertFails(setDoc(ref, attendance()));
});
test("Settings and unrelated paths deny client writes even for admin", async () => {
  const db = dbFor("chair");
  await assertFails(updateDoc(doc(db, "settings/club"), { hoursPerAICTEPoint: 1 }));
  await assertFails(setDoc(doc(db, "accessControl/chair"), { role: "admin" }));
  await assertFails(setDoc(doc(db, "members/chair"), { role: "admin" }));
});

test("Official-shaped club admin can manage students but no client can mutate its profile or attendance", async () => {
  const club = { ...profile("official", "Chairperson"), accountType: "club_admin", branch: null, division: null, year: null, academicYear: null };
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), "users/official"), club));
  const db = dbFor("official");
  await assertSucceeds(getDoc(doc(db, "users/official")));
  await assertSucceeds(updateDoc(doc(db, "users/pending"), { role: "Member", approvalStatus: "approved", approvedAt: serverTimestamp(), approvedBy: "official" }));
  await assertSucceeds(setDoc(doc(db, "events", "zyxwvutsrqponmlkjihg"), { ...event(), createdBy: "official" }));
  await assertFails(updateDoc(doc(dbFor("chair"), "users/official"), { approvedBy: "chair", approvedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db, "attendance", `official__${eventId}`), { ...attendance(), memberId: "official", updatedBy: "official" }));
  await assertSucceeds(getDocs(query(collection(db, "users"), where("approvalStatus", "==", "pending"))));
});
test("Session event and event-ID attendance subscription queries are authorized for approved users only", async () => {
  for (const id of ["member", "chair"]) {
    const db = dbFor(id);
    await assertSucceeds(getDocs(query(collection(db, "events"), where("academicYear", "in", ["2026-27", "2025-26"]))));
    await assertSucceeds(getDocs(query(collection(db, "attendance"), where("eventId", "in", [eventId]))));
  }
  for (const id of ["pending", "rejected"]) await assertFails(getDocs(query(collection(dbFor(id), "attendance"), where("eventId", "in", [eventId]))));
});
test("Attendance rejects nonexistent member using its correctly formed pair ID", async () => {
  await assertFails(setDoc(doc(dbFor("chair"), "attendance", `missing__${eventId}`), { ...attendance(), memberId: "missing" }));
});

test("Collection metadata stays readable to approved accounts but immutable through all clients", async () => {
  const metadata = name => ({ type: "collection_metadata", collectionName: name, initialized: true, schemaVersion: 1, description: "Collection initialization", createdAt: Timestamp.fromMillis(1) });
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    for (const name of ["events", "attendance"]) await setDoc(doc(db, name, "_metadata"), metadata(name));
  });
  for (const id of ["member", "chair", "mentor", "pending", "rejected"]) {
    const db = dbFor(id);
    for (const name of ["events", "attendance"]) {
      const ref = doc(db, name, "_metadata");
      if (["member", "chair", "mentor"].includes(id)) await assertSucceeds(getDoc(ref));
      else await assertFails(getDoc(ref));
      await assertFails(setDoc(ref, metadata(name)));
      await assertFails(updateDoc(ref, { description: "Overwrite attempted" }));
      await assertFails(deleteDoc(ref));
    }
  }
  for (const name of ["events", "attendance"]) await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), name, "_metadata"), metadata(name)));
  const db = dbFor("member");
  const events = await assertSucceeds(getDocs(query(collection(db, "events"), where("academicYear", "in", ["2026-27"]))));
  if (events.docs.some(item => item.id === "_metadata")) throw new Error("Metadata leaked into event query");
  const records = await assertSucceeds(getDocs(query(collection(db, "attendance"), where("eventId", "in", [eventId]))));
  if (records.docs.length) throw new Error("Metadata leaked into empty attendance query");
});
