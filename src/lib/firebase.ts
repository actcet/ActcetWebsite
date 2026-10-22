import { getAnalytics, isSupported } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfJakqMJOKTUt2nvmuuCOVyHyhRa_o-0I",
  authDomain: "astronomytcet-206c1.firebaseapp.com",
  projectId: "astronomytcet-206c1",
  storageBucket: "astronomytcet-206c1.firebasestorage.app",
  messagingSenderId: "9325607607",
  appId: "1:9325607607:web:795bccaa886869f8e4ab32",
  measurementId: "G-ZKMCXH26QL",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);

export const analytics = isSupported().then((supported) =>
  supported ? getAnalytics(firebaseApp) : null,
);
