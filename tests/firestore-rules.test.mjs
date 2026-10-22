import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, where, serverTimestamp, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
const projectId = "demo-actcet-members";
const eventId = "abcdefghijklmnopqrst";
let env;
const profile = (id, role = "Member", approvalStatus = "approved") => ({ name: `Test ${id}`, email: `${id}@example.test`, branch: "Comp", division: "A", year: "TE", academicYear: "2026-27", requestedRole: role, role, approvalStatus, createdAt: Timestamp.fromMillis(1), approvedAt: approvalStatus === "approved" ? Timestamp.fromMillis(1) : null, approvedBy: approvalStatus === "approved" ? "owner" : null });
const dbFor = id => env.authenticatedContext(id, { email: `${id}@example.test` }).firestore();
const event = () => ({ name: "Controlled Test Event", academicYear: "2026-27", date: Timestamp.fromMillis(1), aicteHours: 4, description: "Emulator only", createdAt: serverTimestamp(), createdBy: "chair" });
const attendance = () => ({ memberId: "member", eventId, attended: true, updatedAt: serverTimestamp(), updatedBy: "chair" });
before(async () => { env = await initializeTestEnvironment({ projectId, firestore: { host: "127.0.0.1", port: 8081, rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") } }); });
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
