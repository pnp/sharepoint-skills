// library-roast analysis script. Runs unchanged inside an execute_plan script as new Function("data", <this text>)(input).
// Input:  { site: { title, url, timeZone, generatedAt }, library: { title, url, rootFolder, itemCount },
//           rows: [ [ ref, type, modified, size ] ], truncated, notChecked: [ "<reason>" ] }
//   truncated: true when the read stopped at the row limit (the caller reports it in notChecked).
//   ref = FileRef relative to rootFolder (a server-relative FileRef also works), type = FSObjType (0 file, 1 folder),
//   modified = Modified as returned, size = File_x0020_Size. Rows may also be objects { ref, type, modified, size }.
// Output: { version, site, library, generatedAt, cutoff, totals, score, band, bandKey, findings, plan, passed,
//           notChecked, readComplete, complete, summaryMarkdown }
//   readComplete: every item was read. complete: also every file had a readable date and size, so a
//   finding that is absent is a confirmed pass. With complete false, nothing is reported as passed for the whole library.
// Plain ES2020 for the plan sandbox: no modules, DOM, network, lookbehind, or template literals.
var VERSION = 'library-roast/1.0';
var BT = String.fromCharCode(96);
var GIANT = 52428800;
var HUGE = 262144000;
var POINTS = { High: 12, Medium: 7, Low: 3 };
var SEV_ORDER = { High: 0, Medium: 1, Low: 2 };
var LEGACY = { doc: 'docx', xls: 'xlsx', ppt: 'pptx', pps: 'ppsx', dot: 'dotx', xlt: 'xltx', pot: 'potx' };
var MARKER_SRC = '(^|[\\s_\\-.(\\[])(final|copy|v\\d+|rev\\d+|latest|backup|bak)(?=$|[\\s_\\-.)\\]])';
var NUMBERED = /\(\d+\)/;
var DATE_FORMATS = [
  ['yyyy-MM-dd', /(^|\D)(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?!\d)/],
  ['yyyyMMdd', /(^|\D)(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?!\d)/],
  ['dd.MM.yyyy', /(^|\D)(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d{2}(?!\d)/],
  ['yyMMdd', /(^|\D)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?!\d)/],
  ['yyyy-MM', /(^|\D)(19|20)\d{2}-(0[1-9]|1[0-2])(?![\d-])/],
  ['Month yyyy', /(^|[^a-z])(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)[\s_\-]+(19|20)\d{2}(?!\d)/i]
];
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var NAMES = {
  version: 'Version-suffix chaos', duplicates: 'Duplicate-looking names', stale: 'Untouched for 2+ years', nesting: 'Deep folder nesting',
  empty: 'Empty folders', giant: 'Giant files', naming: 'Inconsistent naming', root: 'Files dumped at the root', legacy: 'Ancient file types'
};

function input() {
  var d = (typeof data !== 'undefined') ? data : null;
  if (typeof d === 'string') d = JSON.parse(d);
  if (!d || !d.library || !Array.isArray(d.rows)) throw new Error('library-roast: input must be an object with library and rows');
  return d;
}
function str(v) { return v === null || v === undefined ? '' : String(v); }
function plural(n, w, p) { return n + ' ' + (n === 1 ? w : (p || w + 's')); }
function pct(n, d) { return d ? Math.round(n * 100 / d) : 0; }
function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function lower(s) { return str(s).toLowerCase(); }
function splitName(name) {
  var i = name.lastIndexOf('.');
  return i > 0 ? { base: name.slice(0, i), ext: lower(name.slice(i + 1)) } : { base: name, ext: '' };
}
function leaf(path) { var i = path.lastIndexOf('/'); return i < 0 ? path : path.slice(i + 1); }
function parent(path) { var i = path.lastIndexOf('/'); return i < 0 ? '' : path.slice(0, i); }
function markerCount(base) { var m = base.match(new RegExp(MARKER_SRC, 'gi')); return m ? m.length : 0; }
function hasMarker(name) { return markerCount(splitName(name).base) > 0 || NUMBERED.test(name); }
function dupKey(name) {
  var p = splitName(name);
  var k = p.base.toLowerCase().replace(/\(\d+\)/g, ' ').replace(/^copy of\s+/, '');
  var rx = new RegExp(MARKER_SRC, 'gi');
  k = k.replace(rx, '$1 ').replace(rx, '$1 ');
  k = k.replace(/[\s_\-.]+/g, ' ').trim();
  return k + '.' + (LEGACY[p.ext] || p.ext);
}
function parseDate(v) {
  if (v instanceof Date) return v;
  var s = str(v).trim();
  if (!s) return null;
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i);
  if (m) {
    var h = +(m[4] || 0);
    if (m[7] && /pm/i.test(m[7]) && h < 12) h += 12;
    if (m[7] && /am/i.test(m[7]) && h === 12) h = 0;
    return new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], h, +(m[5] || 0)));
  }
  var t = Date.parse(s);
  return isNaN(t) ? null : new Date(t);
}
function isoDay(d) { return d.toISOString().slice(0, 10); }
function niceDay(d) { return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
function monthYear(d) { return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
function mb(n) { return Math.round(n / 1048576) + ' MB'; }
function sevShare(share, hi, med) { return share >= hi ? 'High' : share >= med ? 'Medium' : 'Low'; }
function ex(name, kind) { return { name: name, kind: kind || 'file' }; }

function main() {
  var d = input();
  var lib = d.library;
  var root = str(lib.rootFolder).replace(/\/+$/, '');
  if (!root && lib.url) root = str(lib.url).replace(/^https?:\/\/[^\/]+/i, '').replace(/\/+$/, '');
  var now = parseDate(d.site && d.site.generatedAt) || new Date();
  var cutoff = new Date(Date.UTC(now.getUTCFullYear() - 2, now.getUTCMonth(), now.getUTCDate()));
  var notChecked = (d.notChecked || []).map(str).filter(Boolean);

  var files = [], folders = [], unparsed = 0, noSize = 0, outside = 0;
  d.rows.forEach(function (r) {
    if (Array.isArray(r)) r = { ref: r[0], type: r[1], modified: r[2], size: r[3] };
    var ref = str(r.ref || r.FileRef);
    var rel = ref;
    if (ref.charAt(0) !== '/') rel = ref.replace(/^\.?\/+/, '');
    else if (root && ref.toLowerCase().indexOf(root.toLowerCase() + '/') === 0) rel = ref.slice(root.length + 1);
    else if (root) { outside++; return; }
    if (!rel || rel === 'Forms' || rel.indexOf('Forms/') === 0) return;
    var type = +(r.type !== undefined ? r.type : r.FSObjType);
    if (type === 1) { folders.push(rel); return; }
    var name = leaf(rel);
    if (/^Library-roast-/i.test(name)) return;
    var mod = parseDate(r.modified !== undefined ? r.modified : r.Modified);
    if (!mod) unparsed++;
    var size = parseInt(str(r.size !== undefined ? r.size : r.File_x0020_Size), 10);
    if (isNaN(size)) { noSize++; size = null; }
    files.push({ path: rel, name: name, modified: mod, size: size, level: (rel.match(/\//g) || []).length });
  });
  var expected = +lib.itemCount || 0;
  var readComplete = !d.truncated && (!expected || d.rows.length >= expected);
  var complete = readComplete && !unparsed && !noSize;
  if (!readComplete && !d.truncated) notChecked.push('Read ' + d.rows.length + ' of ' + expected + ' items in ' + str(lib.title) + '; the findings cover only what was read.');
  if (!readComplete) notChecked.push('Empty folders were not checked: with a partial read, a folder can look empty because its files were not read.');
  if (outside) notChecked.push(plural(outside, 'row') + ' outside the library root folder were ignored.');
  if (unparsed) notChecked.push(plural(unparsed, 'file') + ' had no readable Modified date and were left out of the 2-year check.');
  if (noSize) notChecked.push(plural(noSize, 'file') + ' had no size and were left out of the giant-file check.');

  // folder set: listed folders plus every parent of a file or folder
  var fset = {};
  folders.forEach(function (f) { fset[f] = true; });
  files.forEach(function (f) { var p = parent(f.path); while (p) { fset[p] = true; p = parent(p); } });
  Object.keys(fset).forEach(function (f) { var p = parent(f); while (p) { fset[p] = true; p = parent(p); } });
  var allFolders = Object.keys(fset).sort();
  var used = {};
  files.forEach(function (f) { var p = parent(f.path); if (p) used[p] = true; });
  allFolders.forEach(function (f) { var p = parent(f); if (p) used[p] = true; });
  function flevel(f) { return (f.match(/\//g) || []).length + 1; }

  var N = files.length;
  var findings = [];
  function add(f) { f.name = NAMES[f.key]; findings.push(f); }
  var byName = function (a, b) { return cmp(a.name.toLowerCase(), b.name.toLowerCase()); };

  if (N) {
    // 1 version-suffix chaos
    var ver = files.filter(function (f) { return hasMarker(f.name); });
    if (ver.length) {
      ver.sort(function (a, b) {
        var ma = markerCount(splitName(a.name).base) + (NUMBERED.test(a.name) ? 1 : 0), mbb = markerCount(splitName(b.name).base) + (NUMBERED.test(b.name) ? 1 : 0);
        return mbb - ma || byName(a, b);
      });
      add({ key: 'version', n: 1, severity: sevShare(ver.length / N, 0.20, 0.05), count: ver.length,
        label: ver.length + ' of ' + plural(N, 'file') + ' (' + pct(ver.length, N) + '%) carry final, v2, copy or (1)',
        examples: ver.slice(0, 10).map(function (f) { return ex(f.name); }),
        facts: plural(ver.length, 'file') + ' of ' + N + ' (' + pct(ver.length, N) + '%) have a version marker (final, copy, v2, rev2, latest, backup) or a (1) in the name. Most marked: ' + ver.slice(0, 3).map(function (f) { return '"' + f.name + '"'; }).join(', ') + '.' });
    }
    // 2 duplicate-looking names
    var groups = {};
    files.forEach(function (f) { var k = dupKey(f.name); (groups[k] = groups[k] || []).push(f); });
    Object.keys(groups).forEach(function (k) { groups[k].sort(function (a, b) { return byName(a, b) || cmp(a.path.toLowerCase(), b.path.toLowerCase()); }); });
    var dups = Object.keys(groups).filter(function (k) { return groups[k].length > 1; })
      .sort(function (a, b) { return groups[b].length - groups[a].length || cmp(a, b); });
    if (dups.length) {
      var dfiles = 0, exs = [];
      dups.forEach(function (k) { dfiles += groups[k].length; groups[k].forEach(function (f) { exs.push(ex(f.name)); }); });
      var g0 = groups[dups[0]];
      add({ key: 'duplicates', n: 2, severity: sevShare(dfiles / N, 0.15, 0.05), count: dfiles, groups: dups.length,
        label: plural(dfiles, 'file') + ' in ' + plural(dups.length, 'look-alike group'),
        examples: exs.slice(0, 10),
        groupList: dups.slice(0, 20).map(function (k) { return groups[k].map(function (f) { return f.path; }); }),
        facts: plural(dfiles, 'file') + ' fall into ' + plural(dups.length, 'group') + ' of look-alike names. Largest group (' + g0.length + '): ' + g0.map(function (f) { return '"' + f.name + '"'; }).join(', ') + '.' });
    }
    // 3 untouched for 2+ years
    var stale = files.filter(function (f) { return f.modified && f.modified < cutoff; })
      .sort(function (a, b) { return a.modified - b.modified || byName(a, b); });
    if (stale.length) {
      add({ key: 'stale', n: 3, severity: sevShare(stale.length / N, 0.30, 0.10), count: stale.length, oldest: isoDay(stale[0].modified),
        label: stale.length + ' of ' + plural(N, 'file') + ' (' + pct(stale.length, N) + '%) not modified since before ' + niceDay(cutoff),
        examples: stale.slice(0, 10).map(function (f) { return ex(f.name); }),
        facts: plural(stale.length, 'file') + ' of ' + N + ' (' + pct(stale.length, N) + '%) were last modified before ' + niceDay(cutoff) + '. Oldest: "' + stale[0].name + '", last modified ' + monthYear(stale[0].modified) + '.' });
    }
    // 4 deep folder nesting
    var deep = allFolders.filter(function (f) { return flevel(f) >= 5; });
    if (deep.length) {
      var maxL = 0; deep.forEach(function (f) { maxL = Math.max(maxL, flevel(f)); });
      var deepAll = deep.filter(function (f) { return flevel(f) === maxL; }).sort();
      var deepest = deepAll.filter(function (f) { return files.some(function (x) { return parent(x.path) === f; }); })[0] || deepAll[0];
      var inside = files.filter(function (f) { return parent(f.path) === deepest; }).sort(byName);
      var dex = [ex(deepest, 'folder')].concat(inside.slice(0, 3).map(function (f) { return ex(f.name); }));
      add({ key: 'nesting', n: 4, severity: maxL >= 7 ? 'High' : 'Medium', count: maxL, folders: deep.length, deepestPath: deepest,
        label: 'levels deep · ' + plural(deep.length, 'folder') + ' at level 5 or deeper', examples: dex,
        facts: 'The deepest folder is ' + maxL + ' levels down: ' + deepest.split('/').join(' > ') + '. ' + plural(deep.length, 'folder') + ' sit at level 5 or deeper.' + (inside.length ? ' Inside the deepest one: "' + inside[0].name + '".' : '') });
    }
    // 5 empty folders
    var empty = !readComplete ? [] : allFolders.filter(function (f) { return !used[f]; }).sort(function (a, b) { return flevel(a) - flevel(b) || cmp(a.toLowerCase(), b.toLowerCase()); });
    if (empty.length) {
      add({ key: 'empty', n: 5, severity: empty.length >= 5 ? 'High' : empty.length >= 2 ? 'Medium' : 'Low', count: empty.length,
        label: plural(empty.length, 'folder') + ' with nothing in them', examples: empty.slice(0, 10).map(function (f) { return ex(f, 'folder'); }),
        facts: plural(empty.length, 'empty folder') + ': ' + empty.slice(0, 5).map(function (f) { return '"' + f + '"'; }).join(', ') + '.' });
    }
    // 6 giant files
    var big = files.filter(function (f) { return f.size !== null && f.size >= GIANT; }).sort(function (a, b) { return b.size - a.size || byName(a, b); });
    if (big.length) {
      add({ key: 'giant', n: 6, severity: big[0].size >= HUGE ? 'High' : 'Medium', count: big.length, largestMB: Math.round(big[0].size / 1048576),
        label: plural(big.length, 'file') + ' of 50 MB or more · largest ' + mb(big[0].size), examples: big.slice(0, 10).map(function (f) { return ex(f.name); }),
        facts: plural(big.length, 'file') + ' of 50 MB or more. Largest: "' + big[0].name + '" at ' + mb(big[0].size) + '.' });
    }
    // 7 inconsistent naming
    var styles = { spaces: [], underscores: [], hyphens: [] }, fmts = {}, fmtOrder = [];
    files.forEach(function (f) {
      var b = splitName(f.name).base;
      var s = b.indexOf(' ') >= 0 ? 'spaces' : b.indexOf('_') >= 0 ? 'underscores' : b.indexOf('-') >= 0 ? 'hyphens' : null;
      if (s) styles[s].push(f);
      DATE_FORMATS.forEach(function (df) {
        if (df[1].test(b)) { if (!fmts[df[0]]) { fmts[df[0]] = []; fmtOrder.push(df[0]); } fmts[df[0]].push(f); }
      });
    });
    var counted = ['spaces', 'underscores', 'hyphens'].filter(function (s) { return styles[s].length >= 3; });
    var fmtNames = DATE_FORMATS.map(function (df) { return df[0]; }).filter(function (k) { return fmts[k]; });
    if (counted.length >= 2 || fmtNames.length >= 2) {
      var nex = [], seen = {};
      fmtNames.forEach(function (k) { var f = fmts[k].slice().sort(byName)[0]; if (!seen[f.name]) { seen[f.name] = 1; nex.push(ex(f.name)); } });
      counted.forEach(function (s) { var f = styles[s].slice().sort(byName)[0]; if (!seen[f.name]) { seen[f.name] = 1; nex.push(ex(f.name)); } });
      var styleText = counted.map(function (s) { return s + ' ' + styles[s].length; }).join(', ');
      add({ key: 'naming', n: 7, severity: (counted.length >= 2 && fmtNames.length >= 2) ? 'High' : 'Medium', count: fmtNames.length,
        styles: counted.map(function (s) { return { style: s, files: styles[s].length }; }),
        dateFormats: fmtNames.map(function (k) { return { format: k, files: fmts[k].length, example: fmts[k].slice().sort(byName)[0].name }; }),
        label: (fmtNames.length === 1 ? 'date format' : 'date formats') + (styleText ? ' · ' + styleText : ''), examples: nex.slice(0, 10),
        facts: plural(counted.length, 'naming style') + ' (' + (styleText || 'none') + ') and ' + plural(fmtNames.length, 'date format') + ' in file names (' +
          fmtNames.map(function (k) { return k + ' e.g. "' + fmts[k].slice().sort(byName)[0].name + '"'; }).join('; ') + ').' });
    }
    // 8 files dumped at the root
    var root0 = files.filter(function (f) { return f.level === 0; }).sort(byName);
    if (root0.length >= 10 && allFolders.length > 0) {
      add({ key: 'root', n: 8, severity: sevShare(root0.length / N, 0.50, 0.25), count: root0.length,
        label: root0.length + ' of ' + plural(N, 'file') + ' (' + pct(root0.length, N) + '%) in the library root', examples: root0.slice(0, 10).map(function (f) { return ex(f.name); }),
        facts: root0.length + ' of ' + N + ' files (' + pct(root0.length, N) + '%) sit in the library root next to ' + plural(allFolders.length, 'folder') + '. For example "' + root0[0].name + '".' });
    }
    // 9 ancient file types
    var anc = files.filter(function (f) { return LEGACY[splitName(f.name).ext]; })
      .sort(function (a, b) { return (a.modified && b.modified ? a.modified - b.modified : 0) || byName(a, b); });
    if (anc.length) {
      var per = {};
      anc.forEach(function (f) { var e = '.' + splitName(f.name).ext; per[e] = (per[e] || 0) + 1; });
      var perText = Object.keys(per).sort(function (a, b) { return per[b] - per[a] || cmp(a, b); }).map(function (e) { return e + ' ' + per[e]; }).join(', ');
      add({ key: 'legacy', n: 9, severity: sevShare(anc.length / N, 0.10, 0.03), count: anc.length, perExtension: per,
        label: plural(anc.length, 'file') + ' in legacy formats (' + perText + ')', examples: anc.slice(0, 10).map(function (f) { return ex(f.name); }),
        facts: plural(anc.length, 'file') + ' use pre-2007 Office formats (' + perText + '). Oldest: "' + anc[0].name + '".' });
    }
  }
  findings.sort(function (a, b) { return SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.n - b.n; });
  findings.forEach(function (f) { f.more = (f.key === 'nesting' || f.key === 'naming') ? 0 : Math.max(0, f.count - Math.min(4, f.examples.length)); });

  var score = 0, counts = { High: 0, Medium: 0, Low: 0 };
  findings.forEach(function (f) { score += POINTS[f.severity]; counts[f.severity]++; });
  score = Math.min(100, score);
  var band = score === 0 ? (complete ? ['Nothing to roast', 'none'] : ['Nothing found in what was read', 'none']) : score < 25 ? ['Light roast', 'light'] : score < 50 ? ['Medium roast', 'medium'] : score < 75 ? ['Dark roast', 'dark'] : ['Charcoal', 'charcoal'];

  // cleanup plan
  var F = {}; findings.forEach(function (f) { F[f.key] = f; });
  function prio(keys) { var best = 3; keys.forEach(function (k) { if (F[k]) best = Math.min(best, SEV_ORDER[F[k].severity]); }); return ['Now', 'Next', 'Later'][best]; }
  var plan = [];
  function step(order, keys, title, why, skill, how) { plan.push({ order: order, priority: prio(keys), key: keys.join('+'), title: title, why: why, skill: skill, how: how }); }
  if (F.version || F.duplicates) step(1, ['version', 'duplicates'], 'Merge the duplicates and drop the version suffixes',
    [F.duplicates ? plural(F.duplicates.count, 'file') + ' in ' + plural(F.duplicates.groups, 'look-alike group') : '', F.version ? plural(F.version.count, 'file') + ' named final, v2, copy or (1)' : ''].filter(Boolean).join('; ') + '. Version history already keeps every earlier version.',
    'library-cleanup', 'Shows a cleanup plan and doesn\'t change anything until you approve it.');
  if (F.empty || F.nesting) step(2, ['empty', 'nesting'], 'Delete the empty folders and flatten the deep ones',
    [F.empty ? plural(F.empty.count, 'empty folder') : '', F.nesting ? plural(F.nesting.folders, 'folder') + ' at level 5 or deeper (deepest: ' + F.nesting.count + ')' : ''].filter(Boolean).join('; ') + '.',
    'library-cleanup', 'Proposes a flatter structure first and asks before it moves or deletes anything.');
  if (F.naming) step(3, ['naming'], 'Pick one naming pattern and one date format',
    (F.naming.styles.length ? plural(F.naming.styles.length, 'naming style') + ' and ' : '') + plural(F.naming.count, 'date format') + ' in file names.',
    F.naming.count >= 2 ? 'rename-files-date-prefix' : 'Manual',
    F.naming.count >= 2 ? 'Puts one date prefix (yyMMdd, from the created date) on every file, after a preview.' : 'Agree on one separator style (for example hyphens) and use it for new files.');
  if (F.stale) step(4, ['stale'], 'Review or archive the files nobody has touched in 2 years',
    plural(F.stale.count, 'file') + ' not modified since before ' + niceDay(cutoff) + '.', 'Manual', 'Review the list with the content owners, then move what\'s still needed to an archive library.');
  if (F.legacy) step(5, ['legacy'], 'Save legacy Office files in current formats',
    plural(F.legacy.count, 'file') + ' in ' + Object.keys(F.legacy.perExtension).sort().join(', ') + '.', 'Manual', 'Open each file and use Save As to .docx, .xlsx or .pptx.');
  if (F.root) step(6, ['root'], 'Give the root files a home',
    F.root.count + ' of ' + plural(N, 'file') + ' are in the library root.', 'organize-library', 'Sorts files by content type and adds metadata and views, so folders matter less.');
  if (F.giant) step(7, ['giant'], 'Move giant files where they belong',
    plural(F.giant.count, 'file') + ' of 50 MB or more (largest ' + F.giant.largestMB + ' MB).', 'Manual', 'For example, move video to Stream and link to it from the library.');
  if (F.empty || F.nesting || F.root) plan.push({ order: 8, priority: 'Later', key: 'metadata', title: 'Check the metadata after the restructure',
    why: 'Once files are sorted with columns instead of folders, the columns need values.', skill: 'metadata-completeness-auditor', how: 'Reports which files are missing metadata; it changes nothing.' });
  if (!findings.length && N && complete) plan.push({ order: 9, priority: 'Later', key: 'keep', title: 'Keep it this way', why: 'All 9 checks passed.',
    skill: 'metadata-completeness-auditor', how: 'Optional: check that the columns are filled in too.' });
  var P = { Now: 0, Next: 1, Later: 2 };
  plan.sort(function (a, b) { return P[a.priority] - P[b.priority] || a.order - b.order; });

  // A pass is only claimed for the whole library: never after a partial read, and never for a check that skipped files.
  var passed = [];
  if (N && readComplete) {
    if (!F.version && !F.duplicates) passed.push('No version suffixes or look-alike names');
    if (!F.stale && !unparsed) passed.push('Nothing untouched for 2 years');
    if (!F.nesting && !F.empty) passed.push('No deep nesting or empty folders');
    if (!F.giant && !F.legacy && !noSize) passed.push('No giant files or legacy formats');
    if (!F.naming && !F.root) passed.push('Consistent names and nothing dumped at the root');
  }

  var md = [];
  md.push('**Roast-o-meter: ' + score + '/100 (' + band[0] + ')** · ' + plural(N, 'file') + ' · ' + plural(allFolders.length, 'folder') + ' · ' + plural(findings.length, 'finding'));
  if (findings.length) {
    md.push('');
    md.push('| Finding | Severity | Evidence |');
    md.push('|---|---|---|');
    findings.forEach(function (f) { md.push('| ' + f.name + ' | ' + ({ High: 'Scorching', Medium: 'Spicy', Low: 'Mild' })[f.severity] + ' | ' + (f.key === 'nesting' || f.key === 'naming' ? f.count + ' ' + f.label : f.label) + ' |'); });
  }
  md.push('');
  md.push('**The serious part**');
  plan.forEach(function (s, i) { md.push((i + 1) + '. ' + s.priority + ' · ' + s.title + ' → ' + (s.skill === 'Manual' ? 'manual' : BT + s.skill + BT)); });

  return {
    version: VERSION,
    site: d.site || {},
    library: { title: str(lib.title), url: str(lib.url), rootFolder: root, itemCount: expected },
    generatedAt: now.toISOString(),
    cutoff: isoDay(cutoff),
    cutoffText: niceDay(cutoff),
    totals: { files: N, folders: allFolders.length, findings: findings.length, high: counts.High, medium: counts.Medium, low: counts.Low, rowsRead: d.rows.length },
    score: score, band: band[0], bandKey: band[1],
    findings: findings, plan: plan, passed: passed,
    notChecked: notChecked, readComplete: readComplete, complete: complete,
    summaryMarkdown: md.join('\n')
  };
}
return main();
