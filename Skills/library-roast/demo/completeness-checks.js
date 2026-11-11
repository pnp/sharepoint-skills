// Deterministic checks for how the roast reports a library it couldn't fully read.
// Runs references/collect.js and references/analyze.js the same way the skill's plan does, and renders
// assets/roast-template.html against a small DOM stub. It never contacts a SharePoint tenant.
// Usage: node Skills/library-roast/demo/completeness-checks.js
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const pkg = path.join(__dirname, '..', 'library-roast');
const COLLECT = fs.readFileSync(path.join(pkg, 'references', 'collect.js'), 'utf8');
const ANALYZE = fs.readFileSync(path.join(pkg, 'references', 'analyze.js'), 'utf8');
const TEMPLATE = fs.readFileSync(path.join(pkg, 'assets', 'roast-template.html'), 'utf8');

const SITE = { title: 'Contoso Projects', url: 'https://contoso.sharepoint.com/sites/projects' };
const LIB = '/sites/projects/Team Files';
// discover() in its short form: id, title and url only, so itemCount is unknown.
const LISTS = [
  { id: 'lib-1', title: 'Team Files', url: LIB },
  { id: 'lib-2', title: 'Reports', url: '/sites/projects/Reports' }
];
const NOW = '2026-11-09T09:00:00Z';
const row = (rel, type, modified, size) => ({ FileRef: LIB + '/' + rel, FSObjType: String(type), Modified: modified, File_x0020_Size: size });
const TIDY = [
  row('Plans', 1, '10/1/2026 9:00 AM', ''),
  row('Plans/Roadmap.docx', 0, '10/1/2026 9:00 AM', '20480'),
  row('Plans/Budget.xlsx', 0, '10/2/2026 9:00 AM', '30720'),
  row('Notes', 1, '10/3/2026 9:00 AM', ''),
  row('Notes/Kickoff.docx', 0, '10/3/2026 9:00 AM', '10240')
];

function run(items) {
  const C = new Function(COLLECT)();
  const p = C.plan({ site: SITE, now: NOW, utcOffsetMinutes: 0, timeZone: 'UTC', library: 'Team Files', destination: 'Reports', lists: LISTS });
  assert.strictEqual(p.target.id, 'lib-1');
  const a = new Function('data', ANALYZE)(C.input(p, items));
  return { a, page: render(a) };
}

function render(a) {
  const D = Object.assign({}, a, { lang: 'en', opener: 'Hello.', jokes: {}, nothingLine: '', i18n: null });
  const html = TEMPLATE.split('{{DATA_JSON}}').join(JSON.stringify(D).replace(/</g, '\\u003c'));
  const scripts = html.split('<script>').slice(1).map((s) => s.split('</script>')[0]);
  const dataText = html.split('<script type="application/json" id="data">')[1].split('</script>')[0];
  const els = {};
  const el = (id) => els[id] || (els[id] = { id, innerHTML: '', textContent: id === 'data' ? dataText : '', style: { setProperty() {} }, setAttribute() {}, appendChild() {}, classList: { add() {} } });
  const document = { title: '', documentElement: el('html'), body: el('body'), getElementById: el, querySelector: () => el('q'), createElement: (t) => el('new-' + t) };
  scripts.forEach((s) => new Function('document', 'window', s)(document, { matchMedia: () => ({ matches: false }) }));
  return Object.values(els).map((e) => e.innerHTML).join('\n');
}

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check('read stopped at the row limit, item count unknown: nothing passes, no empty-folder finding, no "Nothing to roast"', () => {
  const rows = TIDY.concat([row('Archive', 1, '10/4/2026 9:00 AM', '')]); // Archive looks empty only because the read stopped
  const { a, page } = run({ rows, truncated: true });
  assert.strictEqual(a.readComplete, false);
  assert.strictEqual(a.complete, false);
  assert.ok(!a.findings.some((f) => f.key === 'empty'), 'empty-folder finding on a partial read');
  assert.deepStrictEqual(a.passed, []);
  assert.strictEqual(a.band, 'Nothing found in what was read');
  assert.ok(!a.plan.some((s) => s.key === 'keep'));
  assert.ok(a.notChecked.some((n) => /more than 5000 items/.test(n)));
  assert.ok(a.notChecked.some((n) => /Empty folders were not checked/.test(n)));
  assert.ok(!/Nothing to roast\./.test(page) && /Nothing found in what was read\./.test(page));
  assert.ok(!/No cleanup needed/.test(page));
});

check('unreadable dates and missing sizes: those checks are not reported as passed', () => {
  const rows = TIDY.map((r) => r.FileRef.endsWith('Roadmap.docx') ? Object.assign({}, r, { Modified: 'sometime', File_x0020_Size: '' }) : r);
  const { a } = run({ rows, truncated: false });
  assert.strictEqual(a.readComplete, true);
  assert.strictEqual(a.complete, false);
  assert.ok(!a.passed.includes('Nothing untouched for 2 years'));
  assert.ok(!a.passed.includes('No giant files or legacy formats'));
  assert.ok(a.passed.includes('No version suffixes or look-alike names'));
  assert.strictEqual(a.notChecked.filter((n) => /Modified date/.test(n)).length, 1);
  assert.ok(a.notChecked.some((n) => /had no size/.test(n)));
  assert.strictEqual(a.band, 'Nothing found in what was read');
});

check('full read of a tidy library: a confirmed "Nothing to roast"', () => {
  const { a, page } = run({ rows: TIDY, truncated: false });
  assert.strictEqual(a.complete, true);
  assert.strictEqual(a.score, 0);
  assert.strictEqual(a.band, 'Nothing to roast');
  assert.strictEqual(a.passed.length, 5);
  assert.ok(a.plan.some((s) => s.key === 'keep'));
  assert.deepStrictEqual(a.notChecked, []);
  assert.ok(/Nothing to roast\./.test(page) && /No cleanup needed/.test(page));
});

check('full read with a real empty folder: reported as a finding', () => {
  const { a } = run({ rows: TIDY.concat([row('Archive', 1, '10/4/2026 9:00 AM', '')]), truncated: false });
  assert.strictEqual(a.complete, true);
  const f = a.findings.find((x) => x.key === 'empty');
  assert.ok(f && f.count === 1 && f.examples[0].name === 'Archive');
  assert.ok(!a.passed.includes('No deep nesting or empty folders'));
});

check('library that can\'t be read: the collector stops with the error', () => {
  assert.throws(() => run({ error: 'Access denied' }), /couldn’t be read: Access denied/);
});

let failed = 0;
for (const [name, fn] of checks) {
  try { fn(); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n  ' + e.message); }
}
console.log(failed ? failed + ' of ' + checks.length + ' checks failed' : 'All ' + checks.length + ' checks passed');
process.exit(failed ? 1 : 0);
