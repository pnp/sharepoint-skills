// Deterministic checks for how the digest reports containers it couldn't read.
// Runs collect.js and the template's engine and render scripts the same way the skill does, with no SharePoint.
// Usage: node Skills/what-changed-digest/demo/coverage-checks.js
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const pkg = path.join(__dirname, '..', 'what-changed-digest');
const COLLECT = fs.readFileSync(path.join(pkg, 'references', 'collect.js'), 'utf8');
const TEMPLATE = fs.readFileSync(path.join(pkg, 'assets', 'digest-template.html'), 'utf8');
const script = (id) => TEMPLATE.split('<script id="' + id + '">')[1].split('</script>')[0];
const digestModel = new Function(script('engine') + '\nreturn digestModel;')();

const SITE = { title: 'Contoso Projects', url: 'https://contoso.sharepoint.com/sites/projects', serverRelativeUrl: '/sites/projects' };
const LISTS = [
  { id: 'doc-1', title: 'Documents', url: '/sites/projects/Shared Documents', baseTemplate: 101, itemCount: 4 },
  { id: 'doc-2', title: 'Contracts', url: '/sites/projects/Contracts', baseTemplate: 101, itemCount: 3 },
  { id: 'list-1', title: 'Tasks', url: '/sites/projects/Lists/Tasks', baseTemplate: 100, itemCount: 2 }
];
const NOW = '2026-11-09T09:00:00Z';
const OLD = { FileRef: '/sites/projects/Shared Documents/Old.docx', FileLeafRef: 'Old.docx', FSObjType: '0', ID: 1, Title: '', Modified: '9/1/2026 10:00 AM', Created: '9/1/2026 10:00 AM', Editor: [{ title: 'Ana Silva' }], _UIVersionString: '1.0' };
const NEW = { FileRef: '/sites/projects/Shared Documents/Plan.docx', FileLeafRef: 'Plan.docx', FSObjType: '0', ID: 2, Title: '', Modified: '11/6/2026 2:15 PM', Created: '11/6/2026 2:15 PM', Editor: [{ title: 'Ben Ito' }], _UIVersionString: '1.0' };

function run(results) {
  const C = new Function(COLLECT)();
  const p = C.plan({ site: SITE, now: NOW, utcOffsetMinutes: 0, timeZone: 'UTC', days: 7, destination: 'Reports', lists: LISTS });
  assert.deepStrictEqual(p.containers.map((c) => c.id), ['doc-2', 'doc-1', 'list-1']);
  const r = C.build(p, results);
  const m = digestModel(r.blob);
  return { blob: r.blob, m, page: render(r.blob) };
}

// Runs the template's render script against a minimal DOM stub and returns the text of each element it fills.
function render(blob) {
  const els = {};
  const el = (id) => els[id] || (els[id] = { innerHTML: '', textContent: '', style: { setProperty() {} } });
  const html = TEMPLATE.split('{{DATA_JSON}}').join(JSON.stringify(blob).replace(/</g, '\\u003c'));
  const dataText = html.split('<script type="application/json" id="data">')[1].split('</script>')[0];
  el('data').textContent = dataText;
  const document = { title: '', getElementById: el };
  new Function('document', 'digestModel', script('render'))(document, digestModel);
  return els;
}

const checks = [];
const check = (name, fn) => checks.push([name, fn]);
const err = { error: 'The request was throttled' };

check('all containers failed: unable to determine, no zero counts, no "nobody changed" text', () => {
  const { blob, m, page } = run({ 'doc-1': err, 'doc-2': err, 'list-1': { error: 'Access denied' } });
  assert.deepStrictEqual(blob.C.map((c) => c.f), [1, 1, 1]);
  assert.strictEqual(m.coverage, 'none');
  assert.strictEqual(m.total, null);
  assert.ok(Object.values(m.kpis).every((v) => v === null));
  assert.deepStrictEqual(m.days, []);
  assert.match(m.highlights[0], /^Unable to determine what changed: none of the 3 libraries and lists could be read/);
  assert.ok(!m.highlights.some((h) => /No changes/.test(h)));
  assert.strictEqual(m.notes.length, 3);
  assert.ok(!/Nobody changed/.test(page.people.innerHTML));
  assert.match(page.people.innerHTML, /Unknown: no library or list could be read/);
  assert.ok(!/class="n">0</.test(page.kpis.innerHTML), 'KPIs must not show 0');
  assert.match(page.kpis.innerHTML, /class="n">–</);
  assert.match(page['not-checked'].innerHTML, /Not checked/);
});

check('some failed, zero rows from the rest: no confirmed zero', () => {
  const { m, page } = run({ 'doc-1': { rows: [OLD], truncated: false }, 'doc-2': err, 'list-1': [] });
  assert.strictEqual(m.coverage, 'partial');
  assert.strictEqual(m.total, 0);
  assert.match(m.highlights[0], /^No changes found in the libraries and lists that could be checked, but 1 library or list wasn’t fully checked, so this isn’t a confirmed zero/);
  assert.ok(!m.highlights.includes('No changes in this window.'));
  assert.deepStrictEqual(m.notes, ['Contracts: The request was throttled']);
  assert.match(page.people.innerHTML, /Nobody changed anything in the libraries and lists that could be checked/);
  assert.ok(!/Nobody changed anything in this window/.test(page.people.innerHTML));
});

check('some failed, changes in the rest: counts marked as incomplete', () => {
  const { m } = run({ 'doc-1': [OLD, NEW], 'doc-2': err, 'list-1': [] });
  assert.strictEqual(m.coverage, 'partial');
  assert.strictEqual(m.total, 1);
  assert.match(m.highlights[0], /^Incomplete digest: 1 library or list wasn’t fully checked/);
  assert.strictEqual(m.people[0].name, 'Ben Ito');
});

check('every container read, nothing in the window: a confirmed zero', () => {
  const { blob, m, page } = run({ 'doc-1': [OLD], 'doc-2': [], 'list-1': { rows: [], truncated: false } });
  assert.ok(blob.C.every((c) => !c.f && !c.x));
  assert.strictEqual(m.coverage, 'full');
  assert.strictEqual(m.total, 0);
  assert.deepStrictEqual(m.highlights, ['No changes in this window.']);
  assert.ok(Object.values(m.kpis).every((v) => v === 0));
  assert.strictEqual(m.days.length, 8);
  assert.deepStrictEqual(m.notes, []);
  assert.match(page.people.innerHTML, /Nobody changed anything in this window/);
  assert.ok(!page['not-checked'] || page['not-checked'].innerHTML === '');
});

let failed = 0;
for (const [name, fn] of checks) {
  try { fn(); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n  ' + e.message); }
}
console.log(failed ? failed + ' of ' + checks.length + ' checks failed' : 'All ' + checks.length + ' checks passed');
process.exit(failed ? 1 : 0);
