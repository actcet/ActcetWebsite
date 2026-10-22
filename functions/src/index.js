import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const PROJECT_OWNER_EMAIL = "actcet@tcetmumbai.in";
const REGION = "asia-south1";
const PROFILE_FIELDS = [
  "fullName",
  "collegeEmail",
  "rollNumber",
  "className",
  "division",
  "academicYear",
  "phoneNumber",
  "profilePhotoUrl",
  "membershipStatus",
  "role",
  "aicteHours",
];
const MEMBER_ROLES = ["member", "core_team", "wc"];
const MEMBERSHIP_STATUSES = ["pending", "active", "inactive"];

initializeApp();

const auth = getAuth();
const db = getFirestore();

function requireOwner(request) {
  const token = request.auth?.token;
  if (
    !token ||
    token.admin !== true ||
    token.email !== PROJECT_OWNER_EMAIL ||
    token.email_verified !== true
  ) {
    throw new HttpsError("permission-denied", "Only the verified project owner can manage member records.");
  }
}

function requireMemberManager(request) {
  const token = request.auth?.token;
  const isOwner =
    token?.admin === true &&
    token.email === PROJECT_OWNER_EMAIL &&
    token.email_verified === true;
  const isCoreTeam = token?.coreTeam === true && token.email_verified === true;

  if (!isOwner && !isCoreTeam) {
    throw new HttpsError("permission-denied", "A verified owner or Core Team account is required.");
  }
}

function requireExactKeys(value, expectedKeys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
}

function requireString(value, field, maxLength, { allowEmpty = false } = {}) {
  if (
    typeof value !== "string" ||
    value.length > maxLength ||
    (!allowEmpty && value.trim().length === 0)
  ) {
    throw new HttpsError("invalid-argument", `Invalid ${field}.`);
  }
  return value.trim();
}

function validateProfile(input, expectedEmail) {
  if (!requireExactKeys(input, PROFILE_FIELDS)) {
    throw new HttpsError("invalid-argument", "Member profile fields are incomplete or contain unsupported fields.");
  }

  const profile = {
    fullName: requireString(input.fullName, "full name", 120),
    collegeEmail: requireString(input.collegeEmail, "college email", 254).toLowerCase(),
    rollNumber: requireString(input.rollNumber, "roll number", 40),
    className: requireString(input.className, "class", 40),
    division: requireString(input.division, "division", 20),
    academicYear: requireString(input.academicYear, "academic year", 20),
    phoneNumber: requireString(input.phoneNumber, "phone number", 30, { allowEmpty: true }),
    profilePhotoUrl: requireString(input.profilePhotoUrl, "profile photo URL", 2048, { allowEmpty: true }),
    membershipStatus: input.membershipStatus,
    role: input.role,
    aicteHours: input.aicteHours,
  };

  if (profile.collegeEmail !== expectedEmail.toLowerCase()) {
    throw new HttpsError("invalid-argument", "College email must match the Firebase Authentication account.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.collegeEmail)) {
    throw new HttpsError("invalid-argument", "College email is not valid.");
  }
  if (!/^[+()\d .-]{7,30}$/.test(profile.phoneNumber) && profile.phoneNumber !== "") {
    throw new HttpsError("invalid-argument", "Phone number contains unsupported characters.");
  }
  if (
    profile.profilePhotoUrl !== "" &&
    !/^https:\/\/[^\s]+$/i.test(profile.profilePhotoUrl)
  ) {
    throw new HttpsError("invalid-argument", "Profile photo must be an HTTPS URL.");
  }
  if (!MEMBERSHIP_STATUSES.includes(profile.membershipStatus)) {
    throw new HttpsError("invalid-argument", "Membership status must be pending, active, or inactive.");
  }
  if (!MEMBER_ROLES.includes(profile.role)) {
    throw new HttpsError("invalid-argument", "Role must be member, core_team, or wc.");
  }
  if (
    typeof profile.aicteHours !== "number" ||
    !Number.isFinite(profile.aicteHours) ||
    profile.aicteHours < 0 ||
    profile.aicteHours > 5000
  ) {
    throw new HttpsError("invalid-argument", "AICTE hours must be between 0 and 5000.");
  }
  return profile;
}

export const createMember = onCall({ region: REGION }, async (request) => {
  requireMemberManager(request);
  const email = requireString(request.data?.collegeEmail, "college email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "College email is not valid.");
  }

  const profile = validateProfile(request.data?.profile, email);
  if (profile.role === "core_team") {
    throw new HttpsError(
      "permission-denied",
      "Only the project owner can assign the Core Team role.",
    );
  }
  const user = await auth.createUser({
    email,
    emailVerified: false,
    displayName: profile.fullName,
    disabled: false,
  });

  try {
    await db.collection("members").doc(user.uid).create({
      ...profile,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    let accountRemoved = false;
    try {
      await auth.deleteUser(user.uid);
      accountRemoved = true;
    } catch (cleanupError) {
      console.error("Failed to remove Auth user after profile creation error.", cleanupError);
    }
    console.error("Failed to create member profile.", error);
    throw new HttpsError(
      "internal",
      accountRemoved
        ? "Member profile could not be created; the new Auth account was removed."
        : `Member profile could not be created. Check the Auth users list for orphan account ${user.uid}.`,
    );
  }

  return { uid: user.uid, email: user.email };
});

export const saveMember = onCall({ region: REGION }, async (request) => {
  requireMemberManager(request);
  const uid = requireString(request.data?.uid, "member UID", 128);
  const user = await auth.getUser(uid);
  if (!user.email) {
    throw new HttpsError("failed-precondition", "The Auth user does not have an email address.");
  }
  const profile = validateProfile(request.data?.profile, user.email);
  const memberRef = db.collection("members").doc(uid);
  const memberSnapshot = await memberRef.get();
  if (!memberSnapshot.exists) {
    throw new HttpsError("not-found", "Member profile does not exist.");
  }
  if (profile.role !== memberSnapshot.get("role")) {
    throw new HttpsError(
      "permission-denied",
      "Member roles can only be changed by the project owner using setMemberRole.",
    );
  }

  await memberRef.update({
    ...profile,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { uid };
});

export const saveRegistration = onCall({ region: REGION }, async (request) => {
  requireMemberManager(request);
  const data = request.data;
  const fields = [
    "uid",
    "registrationId",
    "eventId",
    "eventName",
    "registrationDate",
    "registrationDetails",
    "attended",
  ];
  if (!requireExactKeys(data, fields)) {
    throw new HttpsError("invalid-argument", "Registration fields are incomplete or contain unsupported fields.");
  }

  const uid = requireString(data.uid, "member UID", 128);
  const registrationId = requireString(data.registrationId, "registration ID", 128);
  const registration = {
    eventId: requireString(data.eventId, "event ID", 128),
    eventName: requireString(data.eventName, "event name", 160),
    registrationDate: requireString(data.registrationDate, "registration date", 40),
    registrationDetails: requireString(data.registrationDetails, "registration details", 2000, {
      allowEmpty: true,
    }),
    attended: data.attended,
  };
  if (typeof registration.attended !== "boolean") {
    throw new HttpsError("invalid-argument", "Attendance must be true or false.");
  }
  if (!Number.isFinite(Date.parse(registration.registrationDate))) {
    throw new HttpsError("invalid-argument", "Registration date must be a valid date string.");
  }
  const memberRef = db.collection("members").doc(uid);
  if (!(await memberRef.get()).exists) {
    throw new HttpsError("not-found", "Member profile does not exist.");
  }

  await memberRef.collection("registrations").doc(registrationId).set({
    ...registration,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { uid, registrationId };
});

export const setMemberRole = onCall({ region: REGION }, async (request) => {
  requireOwner(request);
  if (!requireExactKeys(request.data, ["uid", "role"])) {
    throw new HttpsError("invalid-argument", "Expected only a member UID and role.");
  }

  const uid = requireString(request.data.uid, "member UID", 128);
  const role = request.data.role;
  if (!MEMBER_ROLES.includes(role)) {
    throw new HttpsError("invalid-argument", "Role must be member, core_team, or wc.");
  }

  const memberRef = db.collection("members").doc(uid);
  const memberSnapshot = await memberRef.get();
  if (!memberSnapshot.exists) {
    throw new HttpsError("not-found", "Member profile does not exist.");
  }

  const user = await auth.getUser(uid);
  if (role === "core_team" && !user.emailVerified) {
    throw new HttpsError(
      "failed-precondition",
      "Verify the member's email before granting Core Team access.",
    );
  }

  const { coreTeam: _previousCoreTeam, ...otherClaims } = user.customClaims ?? {};
  if (role === "core_team") {
    await memberRef.update({
      role,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await auth.setCustomUserClaims(uid, {
      ...otherClaims,
      coreTeam: true,
    });
  } else {
    await auth.setCustomUserClaims(uid, otherClaims);
    await memberRef.update({
      role,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { uid, role };
});
