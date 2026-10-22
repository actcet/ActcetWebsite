const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const project = 'demo-actcet-members';
const base = process.env.PORTAL_TEST_BASE_URL || 'http://127.0.0.1:4175';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081';
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
assert.ok([new URL(base).hostname, firestoreHost.split(':')[0], authHost.split(':')[0]].every(host => host === '127.0.0.1'), 'Browser fixtures must stay local');
const rest = `http://${firestoreHost}/v1/projects/${project}/databases/(default)/documents`;
const password = 'ControlledTest@9842';
const checks = [], errors = [];
async function json(url, options = {}) { if (url.startsWith(`http://${firestoreHost}/`)) options.headers = { Authorization: 'Bearer owner', ...options.headers }; const r = await fetch(url, options); const body = await r.json(); if (!r.ok) throw new Error(JSON.stringify(body)); return body; }
const field = value => typeof value === 'string' ? { stringValue: value } : { doubleValue: value };
async function write(path, data, mask = '') {
  return json(`${rest}/${path}${mask}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: data }) });
}
async function fixture(email, name, role) {
  const user = await json(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  await write('users/' + user.localId, { accountType: field(role === 'Chairperson' ? 'club_admin' : 'member'), name: field(name), email: field(email), branch: field('Comp'), division: field('A'), year: field('TE'), academicYear: field('2026-27'), requestedRole: field(role), role: field(role), approvalStatus: field('approved'), createdAt: { timestampValue: new Date().toISOString() }, approvedAt: { timestampValue: new Date().toISOString() }, approvedBy: field('emulator-owner') });
  if (role === 'Chairperson') await write('users/' + user.localId, Object.fromEntries(['branch', 'division', 'year', 'academicYear'].map(key => [key, { nullValue: null }])), '?updateMask.fieldPaths=branch&updateMask.fieldPaths=division&updateMask.fieldPaths=year&updateMask.fieldPaths=academicYear');
  return user.localId;
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
  const contexts = [];
  const newPage = async () => {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } }); contexts.push(context);
    await context.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(15000);
    await page.goto(base); return page;
  };
  const visible = locator => locator.waitFor({ state: 'visible' });
  const check = async (name, fn) => { await fn(); checks.push(name); console.log('PASS', name); };
  const login = async (page, name, email) => {
    await page.getByPlaceholder('e.g. Aarav Sharma or Shinjini Dutta').fill(name);
    await page.getByPlaceholder('e.g. aarav.chairperson@tcetmumbai.in').fill(email);
    await page.getByPlaceholder('Enter your password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login to Portal', exact: true }).click();
  };
  const logout = async page => {
    await page.getByRole('button', { name: 'User account menu' }).click();
    await page.locator('nav').getByRole('button', { name: 'Logout', exact: true }).click();
    await visible(page.getByRole('heading', { name: 'Member Sign In' }));
  };
  const register = async (page, name, email, role = 'Member') => {
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await page.getByPlaceholder('e.g. Shinjini Dutta', { exact: true }).fill(name);
    await page.getByPlaceholder('e.g. shinjini.dutta@tcetmumbai.in').fill(email);
    await page.locator('select').last().selectOption(role);
    await page.getByPlaceholder('Create a strong password (minimum 8 characters)').fill(password);
    await page.locator('form button[type=submit]').click();
    await visible(page.getByRole('heading', { name: 'Waiting for Admin Approval' }));
  };
  const stamp = Date.now();
  try {
    for (const collection of ['events', 'attendance']) await write(collection + '/_metadata', { type: field('collection_metadata'), collectionName: field(collection), initialized: { booleanValue: true }, schemaVersion: field(1), description: field('Emulator metadata fixture'), createdAt: { timestampValue: new Date().toISOString() } });
    await write('settings/club', { currentAcademicYear: field('2026-27'), hoursPerAICTEPoint: field(4) });
    const chairUid = await fixture(`chair-${stamp}@example.test`, 'Controlled Test Chair', 'Chairperson');
    const chairBefore = await json(rest + '/users/' + chairUid);
    const member = await newPage();
    const memberEmail = `member-${stamp}@example.test`;
    await check('Real SDK registration creates pending profile with requested role separated from Member authority', async () => {
      await register(member, 'Controlled Test Member', memberEmail, 'Chairperson');
      assert.equal(await member.locator('nav').count(), 0);
      const docs = await json(rest + '/users');
      const profile = docs.documents.find(d => d.fields.email.stringValue === memberEmail);
      assert.equal(profile.fields.approvalStatus.stringValue, 'pending');
      assert.equal(profile.fields.role.stringValue, 'Member');
      assert.equal(profile.fields.accountType.stringValue, 'member');
      assert.equal(profile.fields.requestedRole.stringValue, 'Chairperson');
      assert.ok(profile.fields.createdAt.timestampValue);
    });
    const admin = await newPage();
    await check('Verified emulator Chairperson enters original site and Admin Portal', async () => {
      await login(admin, 'Controlled Test Chair', `chair-${stamp}@example.test`);
      await visible(admin.locator('nav'));
      for (const id of ['home', 'about', 'journey', 'events', 'committee', 'gallery', 'future', 'contact']) assert.equal(await admin.locator('#' + id).count(), 1);
      await admin.locator('nav').getByRole('link', { name: 'Admin Portal', exact: true }).click();
      await visible(admin.getByRole('button', { name: /Login Approvals/ }));
    });
    await check('Admin approval writes verified Member role and unlocks waiting browser in real time', async () => {
      const row = admin.locator('tbody tr').filter({ hasText: memberEmail });
      await row.getByRole('button', { name: 'Approve', exact: true }).click();
      await visible(member.locator('nav'));
      assert.equal(await member.locator('nav').getByRole('link', { name: 'Admin Portal', exact: true }).count(), 0);
      await member.locator('nav').getByRole('link', { name: 'Members Portal', exact: true }).click();
      await visible(member.getByRole('heading', { name: "Astronomy Members' Portal" }));
    });
    await check('Metadata-only collections load both portals with zero AICTE and no fake columns', async () => {
      await admin.getByRole('button', { name: /Member Update/ }).click();
      for (const page of [admin, member]) {
        const row = page.locator('tbody tr').filter({ hasText: memberEmail });
        await visible(row);
        assert.match(await row.locator('td').last().innerText(), /^0/);
        assert.equal(await page.getByRole('columnheader').filter({ hasText: /_metadata|collection_metadata|Emulator metadata/ }).count(), 0);
      }
    });
    await check('Admin creates three Firestore events; both tables acquire columns without refresh', async () => {
      await admin.getByRole('button', { name: /Member Update/ }).click();
      for (const [name, hours] of [['Controlled Four Hour Event', 4], ['Controlled Two Hour Event', 2], ['Controlled Three Hour Event', 3]]) {
        await admin.getByRole('button', { name: 'Add Event', exact: true }).click();
        await admin.getByPlaceholder('e.g. Meteor Shower Night Watch').fill(name);
        await admin.getByPlaceholder('e.g. 4', { exact: true }).fill(String(hours));
        await admin.getByRole('button', { name: 'Create Event & Add Column' }).click();
        await visible(member.getByRole('columnheader').filter({ hasText: name }));
        await visible(admin.getByRole('columnheader').filter({ hasText: name }));
      }
    });
    await check('New event attendance is initially unchecked with no preallocated records', async () => {
      assert.equal(await admin.getByRole('checkbox', { name: 'Mark attendance for Controlled Test Member in Controlled Four Hour Event', exact: true }).isChecked(), false);
      const empty = await json(rest + '/attendance');
      assert.equal((empty.documents || []).filter(doc => !doc.name.endsWith('/_metadata')).length, 0);
      assert.equal((empty.documents || []).filter(doc => doc.name.endsWith('/_metadata')).length, 1);
    });
    await check('Attendance persists and AICTE updates on another browser: 9 hours / 4 = 2.25', async () => {
      for (const name of ['Controlled Four Hour Event', 'Controlled Two Hour Event', 'Controlled Three Hour Event']) {
        await admin.getByRole('checkbox', { name: `Mark attendance for Controlled Test Member in ${name}`, exact: true }).check();
      }
      await member.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('Controlled Test Member'))?.lastElementChild.textContent.includes('2.25'));
      const docs = await json(rest + '/attendance');
      assert.ok(docs.documents.filter(d => !d.name.endsWith("/_metadata") && d.fields.attended.booleanValue).length >= 3);
      await member.reload();
      await visible(member.getByRole('heading', { name: "Astronomy Members' Portal" }));
      assert.match(await member.locator('tbody tr').filter({ hasText: memberEmail }).locator('td').last().innerText(), /2\.25/);
    });
    await check('Unchecking persists; changing event hours and conversion settings recalculates both tables', async () => {
      await admin.getByRole('checkbox', { name: 'Mark attendance for Controlled Test Member in Controlled Three Hour Event', exact: true }).uncheck();
      await member.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('Controlled Test Member'))?.lastElementChild.textContent.includes('1.5'));
      const docs = await json(rest + '/events');
      const event = docs.documents.find(d => !d.name.endsWith('/_metadata') && d.fields.name.stringValue === 'Controlled Four Hour Event');
      await write(event.name.split('/documents/')[1], { aicteHours: field(6) }, '?updateMask.fieldPaths=aicteHours');
      await member.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('Controlled Test Member'))?.lastElementChild.textContent.trim().startsWith('2'));
      await write('settings/club', { hoursPerAICTEPoint: field(8) }, '?updateMask.fieldPaths=hoursPerAICTEPoint');
      await member.waitForFunction(() => [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('Controlled Test Member'))?.lastElementChild.textContent.trim().startsWith('1'));
      await write('settings/club', { hoursPerAICTEPoint: field(4) }, '?updateMask.fieldPaths=hoursPerAICTEPoint');
    });
    await check('Different academic years receive only their own event columns', async () => {
      const oldUid = await fixture(`previous-${stamp}@example.test`, 'Controlled Previous Session Member', 'Member');
      await write('users/' + oldUid, { academicYear: field('2025-26') }, '?updateMask.fieldPaths=academicYear');
      await admin.getByRole('button', { name: 'Add Event', exact: true }).click();
      await admin.getByPlaceholder('e.g. Meteor Shower Night Watch').fill('Controlled Previous Session Event');
      await admin.locator('form select').selectOption('2025-26');
      await admin.getByRole('button', { name: 'Create Event & Add Column' }).click();
      await visible(member.getByRole('columnheader').filter({ hasText: 'Controlled Previous Session Event' }));
      const oldTable = member.locator('table').filter({ hasText: 'Controlled Previous Session Member' });
      const currentTable = member.locator('table').filter({ hasText: memberEmail });
      assert.equal(await oldTable.getByRole('columnheader').filter({ hasText: 'Controlled Four Hour Event' }).count(), 0);
      assert.equal(await currentTable.getByRole('columnheader').filter({ hasText: 'Controlled Previous Session Event' }).count(), 0);
    });
    await check('Search by name, branch and exact study year works', async () => {
      const search = member.getByPlaceholder('Search by name, branch, or year...');
      for (const q of ['Controlled Test Member', 'CSE(IoT)', 'SE']) { await search.fill(q); await visible(member.locator('tbody tr').filter({ hasText: memberEmail })); }
      await search.fill('');
      assert.ok(await member.getByText('Academic Year 2026-27', { exact: true }).count());
    });
    await check('Separate device signs in to same persisted data; wrong name and password rejected', async () => {
      const device = await newPage();
      await login(device, 'Wrong Name', memberEmail);
      await visible(device.getByText("The name does not match this account's member profile."));
      assert.equal(await device.locator('nav').count(), 0);
      await login(device, 'Controlled Test Member', memberEmail);
      await visible(device.locator('nav'));
      await device.goto(base + '/admin');
      await visible(device.getByRole('heading', { name: 'Access Denied' }));
      await logout(device);
      await device.getByPlaceholder('e.g. Aarav Sharma or Shinjini Dutta').fill('Controlled Test Member');
      await device.getByPlaceholder('e.g. aarav.chairperson@tcetmumbai.in').fill(memberEmail);
      await device.getByPlaceholder('Enter your password', { exact: true }).fill('WrongPassword@123');
      await device.getByRole('button', { name: 'Login to Portal', exact: true }).click();
      await visible(device.getByText('Email or password is incorrect.'));
    });
    await check('Admin rejection updates pending applicant screen live', async () => {
      const rejected = await newPage();
      await register(rejected, 'Controlled Rejected Applicant', `reject-${stamp}@example.test`);
      await admin.getByRole('button', { name: /Login Approvals/ }).click();
      await admin.locator('tbody tr').filter({ hasText: 'Controlled Rejected Applicant' }).getByRole('button', { name: 'Reject', exact: true }).click();
      await admin.getByRole('button', { name: 'Confirm Rejection' }).click();
      await visible(rejected.getByRole('heading', { name: 'Registration Not Approved' }));
    });
    await check('Existing Auth account without a profile resumes registration using the same UID', async () => {
      const email = `incomplete-${stamp}@example.test`;
      const account = await json(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
      const incomplete = await newPage();
      await login(incomplete, 'Controlled Incomplete Profile', email);
      await visible(incomplete.getByRole('heading', { name: 'Complete Your Member Profile' }));
      assert.equal(await incomplete.locator('nav').count(), 0);
      await incomplete.getByPlaceholder('e.g. Shinjini Dutta', { exact: true }).fill('Controlled Incomplete Profile');
      await incomplete.getByPlaceholder('Create a strong password (minimum 8 characters)').fill(password);
      await incomplete.getByRole('button', { name: 'Submit Profile', exact: true }).click();
      await visible(incomplete.getByRole('heading', { name: 'Waiting for Admin Approval' }));
      const stored = await json(rest + '/users/' + account.localId);
      assert.equal(stored.fields.email.stringValue, email);
      assert.equal(stored.fields.approvalStatus.stringValue, 'pending');
    });
    await check('Mobile portal preserves horizontal scrolling and no page overflow', async () => {
      await member.setViewportSize({ width: 390, height: 844 });
      assert.ok(await member.locator('.overflow-x-auto').evaluateAll(nodes => nodes.some(n => n.scrollWidth > n.clientWidth)));
      assert.ok(await member.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await member.screenshot({ path: (process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-members-mobile.png' });
    });
    await check('Club administrator is excluded from student tables and its profile stays unchanged', async () => {
      assert.equal(await member.locator('tbody tr').filter({ hasText: 'Controlled Test Chair' }).count(), 0);
      assert.deepEqual((await json(rest + '/users/' + chairUid)).fields, chairBefore.fields);
    });
    assert.deepEqual(errors, []);
  } finally {
    fs.writeFileSync((process.env.TEST_ARTIFACT_DIR || require('node:os').tmpdir()) + '/firebase-browser-results.json', JSON.stringify({ checks, errors }, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
