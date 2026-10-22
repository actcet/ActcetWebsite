import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, doc, getDocFromServer, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ClubEvent, LoginInput, Member, RegistrationInput, UserRole } from "@/types";

export const ROLES: UserRole[] = ["Mentor", "Chairperson", "Vice Chairperson", "Creative Head", "Documentation Head", "Event Management Head", "Technical Head", "Working Committee - Technical", "Working Committee - Creative", "Working Committee - Event", "Working Committee - Documentation", "Member", "Guest"];
export const BRANCHES = ["Comp", "AIML", "AIDS", "IOT", "Mech", "ECS", "Civil", "CSE(CS)", "CSE(IoT)", "EXTC", "IT"];
export interface ClubSettings { currentAcademicYear: string; hoursPerAICTEPoint: number }
export function isCollectionMetadata(id: string, data: DocumentData): boolean {
  return id === "_metadata" || data.type === "collection_metadata";
}
const iso = (value: unknown) => value instanceof Timestamp ? value.toDate().toISOString() : "";

export function memberFromDocument(id: string, data: DocumentData): Member {
  const accountType = data.accountType ?? "member"; // Existing student profiles predate this field.
  const studentProfileValid = BRANCHES.includes(data.branch) && ["A", "B", "C", "D"].includes(data.division) && ["SE", "TE", "BE"].includes(data.year) && typeof data.academicYear === "string";
  const adminProfileValid = accountType === "club_admin" && ["Chairperson", "Mentor"].includes(data.role) && data.approvalStatus === "approved" && data.branch === null && data.division === null && data.year === null && data.academicYear === null;
  if (typeof data.name !== "string" || !ROLES.includes(data.role) || !ROLES.includes(data.requestedRole) || !["pending", "approved", "rejected"].includes(data.approvalStatus) || (accountType !== "club_admin" && accountType !== "member") || (accountType === "club_admin" ? !adminProfileValid : !studentProfileValid)) throw new Error("A member profile has an invalid format. Contact the club administrator.");
  return { ...data, accountType, id, createdAt: iso(data.createdAt), approvedAt: data.approvedAt ? iso(data.approvedAt) : null } as Member;
}
export function eventFromDocument(id: string, data: DocumentData): ClubEvent {
  if (typeof data.name !== "string" || !(data.date instanceof Timestamp) || typeof data.academicYear !== "string" || !Number.isFinite(data.aicteHours) || data.aicteHours <= 0) throw new Error("An event has an invalid format. Contact the club administrator.");
  return { ...data, id, date: iso(data.date) } as ClubEvent;
}
export function settingsFromDocument(data: DocumentData | undefined): ClubSettings {
  if (!data || !/^\d{4}-\d{2}$/.test(data.currentAcademicYear) || !Number.isFinite(data.hoursPerAICTEPoint) || data.hoursPerAICTEPoint <= 0) throw new Error("Club settings are missing or invalid. Contact the project owner.");
  return { currentAcademicYear: data.currentAcademicYear, hoursPerAICTEPoint: data.hoursPerAICTEPoint };
}
export function portalError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "This email already has an account. Sign in to continue.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/user-disabled": "This account has been disabled. Contact the project owner.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/network-request-failed": "Unable to reach Firebase. Check your connection and retry.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled. Contact the project owner.",
    "auth/too-many-requests": "Too many attempts. Please wait before trying again.",
    "permission-denied": "You do not have permission for this action. Your approval or role may have changed.",
    "unavailable": "Firebase is temporarily unavailable. Check your connection and retry.",
  };
  return (code && messages[code]) || (error instanceof Error ? error.message : "Unable to complete the request. Please retry.");
}
export async function registerAccount(input: RegistrationInput): Promise<Member> {
  const name = input.name.trim(), email = input.email.trim().toLowerCase();
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !BRANCHES.includes(input.branch) || !["A", "B", "C", "D"].includes(input.division) || !["SE", "TE", "BE"].includes(input.year) || !ROLES.includes(input.role) || !input.password || input.password.length < 8) throw new Error("Check all registration fields and use a password of at least 8 characters.");
  const settings = settingsFromDocument((await getDocFromServer(doc(db, "settings", "club"))).data());
  const academicYear = settings.currentAcademicYear;
  if (!/^\d{4}-\d{2}$/.test(academicYear)) throw new Error("Select a valid academic session.");
  const existing = auth.currentUser;
  if (existing && existing.email?.toLowerCase() !== email) throw new Error("Sign out before registering a different email.");
  const user = existing || (await createUserWithEmailAndPassword(auth, email, input.password)).user;
  try {
    await runTransaction(db, async transaction => {
      const ref = doc(db, "users", user.uid);
      if ((await transaction.get(ref)).exists()) throw new Error("Your profile already exists. Sign in instead.");
      transaction.set(ref, { name, email, accountType: "member", branch: input.branch, division: input.division, year: input.year, academicYear, requestedRole: input.role, role: "Member", approvalStatus: "pending", createdAt: serverTimestamp(), approvedAt: null, approvedBy: null });
    });
    // A transaction commit does not update an existing listener's cached missing
    // snapshot. Read through a fresh transaction before confirming registration.
    const profile = await runTransaction(db, transaction => transaction.get(doc(db, "users", user.uid)));
    if (!profile.exists()) throw new Error("The profile write could not be confirmed. Sign in again to check its status.");
    return memberFromDocument(user.uid, profile.data());
  } catch (error) {
    // Preserve the Auth identity even when a write/read response is uncertain.
    // The existing same-UID profile-completion flow safely resumes registration.
    throw new Error(`${portalError(error)} Your sign-in account is preserved. Sign in again to check or complete your profile; do not create another account.`);
  }
}
export async function loginAccount(input: LoginInput): Promise<Member | null> {
  if (!input.name.trim() || !input.email.trim() || !input.password) throw new Error("Enter your name, email and password.");
  const { user } = await signInWithEmailAndPassword(auth, input.email.trim().toLowerCase(), input.password);
  const snapshot = await getDocFromServer(doc(db, "users", user.uid));
  if (!snapshot.exists()) return null;
  const member = memberFromDocument(user.uid, snapshot.data());
  if (member.name.trim().toLowerCase() !== input.name.trim().toLowerCase()) {
    await signOut(auth);
    throw new Error("The name does not match this account's member profile.");
  }
  return member;
}
export async function approveMember(id: string, role: UserRole) {
  if (!auth.currentUser || !ROLES.includes(role)) throw new Error("Choose a verified role before approving.");
  await updateDoc(doc(db, "users", id), { approvalStatus: "approved", role, approvedAt: serverTimestamp(), approvedBy: auth.currentUser.uid });
}
export async function rejectMember(id: string, reason?: string) {
  if (!auth.currentUser) throw new Error("Sign in first.");
  await updateDoc(doc(db, "users", id), { approvalStatus: "rejected", role: "Member", approvedAt: null, approvedBy: auth.currentUser.uid, rejectionReason: reason?.trim() || "Administrative review" });
}
export async function createEvent(input: Omit<ClubEvent, "id">) {
  if (!auth.currentUser || !input.name.trim() || input.name.trim().length > 160 || !/^\d{4}-\d{2}$/.test(input.academicYear) || !Number.isFinite(input.aicteHours) || input.aicteHours <= 0 || input.aicteHours > 10000 || (input.description?.trim().length || 0) > 4000 || !Number.isFinite(Date.parse(input.date))) throw new Error("Enter a valid event name, academic session, date and positive hours. Descriptions may contain up to 4000 characters.");
  const ref = await addDoc(collection(db, "events"), { name: input.name.trim(), academicYear: input.academicYear, date: Timestamp.fromDate(new Date(input.date)), aicteHours: input.aicteHours, description: input.description?.trim() || "", createdAt: serverTimestamp(), createdBy: auth.currentUser.uid });
  return { ...input, id: ref.id };
}
export async function saveAttendance(memberId: string, eventId: string, attended: boolean) {
  if (!auth.currentUser) throw new Error("Sign in first.");
  // Event IDs are fixed-length Firestore auto IDs; rules validate the complete pair.
  await setDoc(doc(db, "attendance", `${memberId}__${eventId}`), { memberId, eventId, attended, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
}
