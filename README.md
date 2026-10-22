# ACTCET Website

Official website of the Astronomy Club of Thakur College of Engineering & Technology,
built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Firebase portal
+
+The recovered Login, Members Portal and Admin Portal now use real Email/Password
+Firebase Auth and Firestore in project `astronomytcet-206c1`, database `(default)`.
+Registration creates a pending `users/{uid}` profile with a separate requested role.
+An owner-authorized Chairperson/Mentor approves it. Events and attendance synchronize
+through Firestore listeners; AICTE uses `settings/club.hoursPerAICTEPoint`.
+Original homepage event data and other static website content remain unchanged.
+
+Read [implementation and actual validation results](docs/FIREBASE_INTEGRATION_REPORT.md)
+and [first-admin provisioning](docs/FIREBASE_ADMIN_PROVISIONING.md). No first
+administrator has been provisioned yet: the proposed account must first register,
+then the project owner must explicitly authorize its actual UID and role.
+
+The browser never receives service-account credentials. Rules enforce pending
+self-registration, approved-member privacy, verified admin writes, immutable
+identity fields and deterministic attendance IDs. It never falls back to demo data.
+
+### Local tests
+
+Use the installed Firebase CLI and Java 21 or later:
+
+```powershell
+firebase emulators:start --only auth,firestore --project demo-actcet-members
+```
+
+In another terminal, run rule and calculation tests:
+
+```powershell
+node --test tests/firestore-rules.test.mjs
+node --test tests/aicte.test.mjs
+```
+
+For the optional browser suite, use a separately installed Playwright and Chrome:
+
+```powershell
+$env:VITE_USE_FIREBASE_EMULATORS = "true"
+npm run dev -- --host 127.0.0.1 --port 4175 --strictPort
+# In a separate terminal, set PLAYWRIGHT_MODULE to the installed Playwright package
+# and CHROME_PATH to Chrome if using a system browser, then run:
+node tests/portal-browser.cjs
+```
+
+The browser suite expects fresh disposable emulator data. Do not point it at
+production. Its privileged fixtures and owner bypass calls are restricted to
+localhost and the demo project. Test results/screenshots go to TEST_ARTIFACT_DIR
+when set, otherwise the OS temporary directory. Normal local development connects
+to the real project when VITE_USE_FIREBASE_EMULATORS is unset; production builds
+ignore that development-only flag. No .env file was added to switch modes silently.
+
+TypeScript and production build pass using the existing installed toolchain.
+The inherited lockfile has an unresolved fresh-install rolldown availability
+problem; see the integration report before replacing local node_modules.
+