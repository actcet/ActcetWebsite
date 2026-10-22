import { getAnalytics, isSupported } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, connectAuthEmulator, getAuth, setPersistence } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const firebaseConfig = {
  apiKey: "AIzaSyBfJakqMJOKTUt2nvmuuCOVyHyhRa_o-0I",
  authDomain: "astronomytcet-206c1.firebaseapp.com",
  projectId: useEmulators ? "demo-actcet-members" : "astronomytcet-206c1",
  storageBucket: "astronomytcet-206c1.firebasestorage.app",
  messagingSenderId: "9325607607",
  appId: "1:9325607607:web:795bccaa886869f8e4ab32",
  measurementId: "G-ZKMCXH26QL",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

// Explicit development setting; Firebase errors never switch to emulator or demo data.
if (useEmulators) {
  if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") throw new Error("Firebase emulators may only be used on localhost.");
  connectAuthEmulator(auth, `http://127.0.0.1:${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || "9099"}`, { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || "8081"));
}
export const authReady = setPersistence(auth, browserLocalPersistence);
for (const key of ["actcet_members_v2", "actcet_events_v2", "actcet_attendance_v2", "actcet_session_v2"]) {
  try { localStorage.removeItem(key); } catch { /* Auth persistence reports restricted storage. */ }
}

export const analytics = isSupported().then((supported) =>
  supported && !useEmulators ? getAnalytics(firebaseApp) : null,
).catch(() => null);
