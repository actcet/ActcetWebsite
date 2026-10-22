import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = "astronomytcet-206c1";
const ownerEmail = "actcet@tcetmumbai.in";

initializeApp({
  credential: applicationDefault(),
  projectId,
});

try {
  const auth = getAuth();
  const user = await auth.getUserByEmail(ownerEmail);

  if (!user.emailVerified) {
    throw new Error(
      `${ownerEmail} must first be verified in Firebase Authentication. Verify the account, then rerun this script.`,
    );
  }

  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    admin: true,
  });

  console.log(`Granted the admin claim to ${ownerEmail} (${user.uid}).`);
  console.log("Sign out and sign back in to refresh the user's ID token.");
} catch (error) {
  console.error("Admin bootstrap failed:", error);
  process.exitCode = 1;
}
