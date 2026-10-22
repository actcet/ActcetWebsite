// Trusted owner/Editor CLI operation. Uses existing CLI login, never service-account keys.
// Default is read-only; --apply creates only missing metadata with server timestamps.
const { join } = require('node:path');
const assert = require('node:assert/strict');
const cliRoot = process.env.FIREBASE_CLI_ROOT || join(process.env.APPDATA, 'npm/node_modules/firebase-tools');
const { Client } = require(join(cliRoot, 'lib/apiv2'));
const { requireAuth } = require(join(cliRoot, 'lib/requireAuth'));
const accounts = require(join(cliRoot, 'lib/auth'));
const project = 'astronomytcet-206c1';
const database = `projects/${project}/databases/(default)`;
const root = `${database}/documents`;
const api = new Client({ auth: true, apiVersion: 'v1', urlPrefix: 'https://firestore.googleapis.com' });
const descriptions = { events: 'ACTCET Astronomy Club events collection', attendance: 'ACTCET member event attendance collection' };
const protectedPaths = ['users/WaEG76cAKLQGOuwBRjbNiuHPS8k2', 'settings/club'];
async function read(path) {
  try { return (await api.get(`${root}/${path}`)).body; }
  catch (error) { if (error.status === 404) return null; throw error; }
}
function fields(name) {
  return { type: { stringValue: 'collection_metadata' }, collectionName: { stringValue: name }, initialized: { booleanValue: true },
    description: { stringValue: descriptions[name] }, schemaVersion: { integerValue: '1' } };
}
function verify(name, document) {
  assert.ok(document, `Missing ${name}/_metadata`);
  for (const [key, value] of Object.entries(fields(name))) assert.deepEqual(document.fields[key], value, `Unexpected ${name}.${key}; refusing overwrite`);
  assert.ok(document.fields.createdAt?.timestampValue, 'Server timestamp missing');
  assert.deepEqual(Object.keys(document.fields).sort(), [...Object.keys(fields(name)), 'createdAt'].sort());
}
(async () => {
  const account = accounts.getProjectDefaultAccount(process.cwd()) || accounts.getGlobalDefaultAccount();
  assert.ok(account, 'Sign in through the Firebase CLI first');
  await requireAuth({ project, ...account, nonInteractive: true });
  const config = (await api.get(database)).body;
  assert.equal(config.name, database);
  const before = await Promise.all(protectedPaths.map(read));
  assert.ok(before.every(Boolean), 'Protected records must already exist');
  assert.equal(before[0].fields.email.stringValue, 'actcet@tcetmumbai.in');
  const crm = new Client({ auth: true, apiVersion: 'v1', urlPrefix: 'https://cloudresourcemanager.googleapis.com' });
  const required = ['datastore.entities.get', 'datastore.entities.create'];
  const permission = (await crm.post(`projects/${project}:testIamPermissions`, { permissions: required })).body;
  assert.ok(required.every(item => permission.permissions?.includes(item)), 'CLI account lacks required read/create IAM permissions');
  const writes = [];
  for (const name of Object.keys(descriptions)) {
    const existing = await read(`${name}/_metadata`);
    if (existing) { verify(name, existing); continue; }
    writes.push({ update: { name: `${root}/${name}/_metadata`, fields: fields(name) },
      currentDocument: { exists: false }, updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }] });
  }
  // Direct latest reads avoid the MCP query helper's local-clock readTime.
  const portalQueryCounts = {};
  for (const [name, fieldPath, value] of [['events', 'academicYear', before[1].fields.currentAcademicYear.stringValue], ['attendance', 'eventId', 'abcdefghijklmnopqrst']]) {
    const result = (await api.post(`${root}:runQuery`, { structuredQuery: {
      from: [{ collectionId: name }], where: { fieldFilter: { field: { fieldPath }, op: 'IN', value: { arrayValue: { values: [{ stringValue: value }] } } } },
    } })).body;
    const documents = result.filter(item => item.document).map(item => item.document);
    assert.ok(documents.every(item => !item.name.endsWith('/_metadata')), 'Metadata leaked into a portal query');
    portalQueryCounts[name] = documents.length;
  }
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ project, database: '(default)', mode: 'read-only', missing: writes.map(write => write.update.name), permissionsVerified: true, portalQueryCounts }));
    return;
  }
  // Atomic create-only commit: concurrent changes fail preconditions instead of overwriting.
  if (writes.length) await api.post(`${root}:commit`, { writes });
  for (const name of Object.keys(descriptions)) verify(name, await read(`${name}/_metadata`));
  const after = await Promise.all(protectedPaths.map(read));
  assert.deepEqual(after, before, 'Protected records changed during initialization');
  console.log(JSON.stringify({ project, database: '(default)', created: writes.map(write => write.update.name), metadataVerified: true, protectedRecordsUnchanged: true }));
})().catch(error => { console.error(`Initialization failed: ${error.message}`); process.exitCode = 1; });
