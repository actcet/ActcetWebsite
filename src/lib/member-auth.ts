import {
  createUserWithEmailAndPassword,
  getIdToken,
  reload,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface MemberRegistrationDetails {
  fullName: string;
  rollNumber: string;
  className: string;
  division: string;
  academicYear: string;
  phoneNumber: string;
}

const collegeEmailPattern = /^[^\s@]+@tcetmumbai\.in$/i;

export async function registerMemberAccount(
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!collegeEmailPattern.test(normalizedEmail)) {
    throw new Error("Registration requires a @tcetmumbai.in email address.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password,
  );
  await sendEmailVerification(credential.user);
  await signOut(auth);
}

export async function submitMemberApplication(
  details: MemberRegistrationDetails,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Sign in with your verified college account first.");
  }

  await reload(user);
  if (!user.emailVerified || !user.email) {
    throw new Error("Verify your college email before submitting the application.");
  }

  const collegeEmail = user.email.trim().toLowerCase();
  if (!collegeEmailPattern.test(collegeEmail)) {
    throw new Error("Registration requires a @tcetmumbai.in email address.");
  }

  await getIdToken(user, true);
  await setDoc(doc(db, "members", user.uid), {
    fullName: details.fullName.trim(),
    collegeEmail,
    rollNumber: details.rollNumber.trim(),
    className: details.className.trim(),
    division: details.division.trim(),
    academicYear: details.academicYear.trim(),
    phoneNumber: details.phoneNumber.trim(),
    profilePhotoUrl: "",
    membershipStatus: "pending",
    role: "member",
    aicteHours: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
