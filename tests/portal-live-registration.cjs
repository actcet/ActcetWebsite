if (process.env.ACTCET_ALLOW_LIVE_DISPOSABLE_TEST !== '1') throw new Error('Explicit live disposable-test opt-in required.');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const password = 'Test@' + crypto.randomBytes(18).toString('base64url');
const email = `actcet-portal-check-${Date.now()}@example.test`;
const name = 'Controlled Firebase Integration Test';
const checks = [], errors = [];
let record = { email, name, uid: null, authDeleted: false };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firestore.googleapis.com'].includes(url.hostname) ? route.continue() : route.abort();
  });
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('migration-test-seeded')) {
      for (const key of ['actcet_members_v2', 'actcet_events_v2', 'actcet_attendance_v2', 'actcet_session_v2']) localStorage.setItem(key, 'controlled obsolete data');
      localStorage.setItem('unrelated-browser-preference', 'preserve');
      sessionStorage.setItem('migration-test-seeded', 'true');
    }
  });
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('response', response => { if (response.status() >= 400) console.log('HTTP', response.status(), new URL(response.url()).origin + new URL(response.url()).pathname); });
  page.on('pageerror', e => errors.push(e.message));
  const visible = locator => locator.waitFor({ state: 'visible' });
  const check = async (label, fn) => { await fn(); checks.push(label); console.log('PASS', label); };
  try {
    await page.goto(process.env.PORTAL_TEST_BASE_URL || 'http://127.0.0.1:4174/');
    await visible(page.getByRole('heading', { name: 'Member Sign In' }));
    await check('Live Firebase initializes; targeted migration preserves unrelated browser preference', async () => {
      const state = await page.evaluate(() => ({ preference: localStorage.getItem('unrelated-browser-preference'), old: localStorage.getItem('actcet_members_v2') }));
      assert.equal(state.preference, 'preserve'); assert.equal(state.old, null);
    });
    await check('Live Email/Password registration and Firestore pending profile creation', async () => {
      await page.getByRole('button', { name: 'Create Account', exact: true }).click();
      await page.getByPlaceholder('e.g. Shinjini Dutta', { exact: true }).fill(name);
      await page.getByPlaceholder('e.g. shinjini.dutta@tcetmumbai.in').fill(email);
      await page.locator('select').last().selectOption('Chairperson');
      await page.getByPlaceholder('Create a strong password (minimum 8 characters)').fill(password);
      await page.locator('form button[type=submit]').click();
      await visible(page.getByRole('heading', { name: 'Waiting for Admin Approval' }));
      const data = await page.evaluate(async () => {
        const { auth } = await import('/src/lib/firebase.ts');
        const token = await auth.currentUser.getIdToken();
        const uid = auth.currentUser.uid;
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/astronomytcet-206c1/databases/(default)/documents/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
        return { uid, profile: await response.json(), status: response.status };
      });
      record.uid = data.uid;
      fs.writeFileSync((process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-live-test-record.json', JSON.stringify(record, null, 2));
      assert.equal(data.status, 200);
      assert.equal(data.profile.fields.email.stringValue, email);
      assert.equal(data.profile.fields.role.stringValue, 'Member');
      assert.equal(data.profile.fields.accountType.stringValue, 'member');
      assert.equal(data.profile.fields.requestedRole.stringValue, 'Chairperson');
      assert.equal(data.profile.fields.approvalStatus.stringValue, 'pending');
      assert.ok(data.profile.fields.createdAt.timestampValue);
      assert.equal(data.profile.fields.password, undefined);
      assert.equal(await page.locator('nav').count(), 0);
    });
    await check('Live deployed rules reject self promotion, event creation and public PII reads', async () => {
      const status = await page.evaluate(async () => {
        const { auth } = await import('/src/lib/firebase.ts');
        const token = await auth.currentUser.getIdToken();
        const base = 'https://firestore.googleapis.com/v1/projects/astronomytcet-206c1/databases/(default)/documents';
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        const self = await fetch(`${base}/users/${auth.currentUser.uid}?updateMask.fieldPaths=role`, { method: 'PATCH', headers, body: JSON.stringify({ fields: { role: { stringValue: 'Chairperson' } } }) });
        const event = await fetch(`${base}/events`, { method: 'POST', headers, body: JSON.stringify({ fields: { name: { stringValue: 'Denied controlled test event' } } }) });
        const pub = await fetch(`${base}/users/${auth.currentUser.uid}`);
        return [self.status, event.status, pub.status];
      });
      assert.deepEqual(status, [403, 403, 403]);
    });
    await check('Live refresh persists Auth session and pending account; logout and login work', async () => {
      await page.reload();
      await visible(page.getByRole('heading', { name: 'Waiting for Admin Approval' }));
      await page.getByRole('button', { name: 'Back to Login', exact: true }).click();
      await visible(page.getByRole('heading', { name: 'Member Sign In' }));
      await page.getByPlaceholder('e.g. Aarav Sharma or Shinjini Dutta').fill(name);
      await page.getByPlaceholder('e.g. aarav.chairperson@tcetmumbai.in').fill(email);
      await page.getByPlaceholder('Enter your password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Login to Portal', exact: true }).click();
      await visible(page.getByRole('heading', { name: 'Waiting for Admin Approval' }));
      await page.screenshot({ path: (process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-live-pending.png' });
    });
    assert.deepEqual(errors, []);
  } finally {
    try {
      fs.writeFileSync((process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-live-diagnostic.txt', await page.locator('body').innerText());
      await page.screenshot({ path: (process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-live-diagnostic.png' });
      if (!record.uid) record.uid = await page.evaluate(async expectedEmail => { const { auth } = await import('/src/lib/firebase.ts'); return auth.currentUser?.email === expectedEmail ? auth.currentUser.uid : null; }, email);
      if (record.uid) {
        record.authDeleted = await page.evaluate(async expected => {
          const { auth } = await import('/src/lib/firebase.ts');
          if (auth.currentUser?.uid !== expected) throw new Error('Cleanup UID mismatch');
          const token = await auth.currentUser.getIdToken();
          const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyBfJakqMJOKTUt2nvmuuCOVyHyhRa_o-0I', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) });
          return response.ok;
        }, record.uid);
      }
    } finally {
      fs.writeFileSync((process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-live-test-record.json', JSON.stringify(record, null, 2));
      fs.writeFileSync((process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-live-results.json', JSON.stringify({ checks, errors, record }, null, 2));
      await browser.close();
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
