import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout } from "node:timers/promises";

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("Run through npm run test:portal to isolate test records in emulators.");
const base = process.env.PORTAL_TEST_BASE_URL;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", new URL(base).port, "--strictPort"], {
  stdio: "inherit", env: { ...process.env, VITE_USE_FIREBASE_EMULATORS: "true" },
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error("Test web server exited before startup.");
    try { ready = (await fetch(base)).ok; } catch { /* startup */ }
    if (ready) break;
    await setTimeout(200);
  }
  if (!ready) throw new Error("Test web server did not start.");
  const test = spawn(process.execPath, ["tests/portal-browser.cjs"], { stdio: "inherit", env: process.env });
  const [code] = await once(test, "exit");
  process.exitCode = code ?? 1;
} finally {
  server.kill();
}
