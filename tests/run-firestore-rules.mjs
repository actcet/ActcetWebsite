import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = await mkdtemp(join(tmpdir(), "actcet-firestore-rules-"));

async function freePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const { port } = server.address();
  await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  return port;
}

const browserMode = process.argv.includes("--browser");
try {
  const [firestorePort, hubPort, loggingPort, authPort, vitePort, websocketPort] = await Promise.all([freePort(), freePort(), freePort(), freePort(), freePort(), freePort()]);
  const configPath = join(tempRoot, "firebase-emulators.json");
  const rulesPath = join(projectRoot, "firestore.rules").replaceAll("\\", "/");
  await writeFile(configPath, JSON.stringify({
    firestore: { database: "(default)", rules: rulesPath },
    emulators: {
      firestore: { host: "127.0.0.1", port: firestorePort, websocketPort },
      ...(browserMode ? { auth: { host: "127.0.0.1", port: authPort } } : {}),
      hub: { host: "127.0.0.1", port: hubPort },
      logging: { host: "127.0.0.1", port: loggingPort },
      ui: { enabled: false },
    },
  }));

  const globalWindowsCli = process.env.APPDATA ? join(process.env.APPDATA, "npm", "node_modules", "firebase-tools", "lib", "bin", "firebase.js") : "";
  const cliScript = process.env.FIREBASE_CLI_JS || (globalWindowsCli && existsSync(globalWindowsCli) ? globalWindowsCli : "");
  if (process.platform === "win32" && !cliScript) throw new Error("Firebase CLI JavaScript entrypoint not found. Set FIREBASE_CLI_JS to firebase-tools/lib/bin/firebase.js.");
  const cli = process.platform === "win32" ? process.execPath : process.env.FIREBASE_CLI || "firebase";
  const args = [...(process.platform === "win32" ? [cliScript] : []), "emulators:exec", "--config", configPath, "--only", browserMode ? "auth,firestore" : "firestore", "--project", "demo-actcet-members", browserMode ? "node tests/run-portal-browser.mjs" : "node --test tests/firestore-rules.test.mjs"];
  const exitCode = await new Promise((resolveExit, reject) => {
    const child = spawn(cli, args, { cwd: projectRoot, stdio: "inherit", env: { ...process.env, PORTAL_TEST_BASE_URL: `http://127.0.0.1:${vitePort}`, VITE_FIREBASE_AUTH_EMULATOR_PORT: String(authPort), VITE_FIRESTORE_EMULATOR_PORT: String(firestorePort) } });
    child.once("error", reject);
    child.once("exit", code => resolveExit(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
