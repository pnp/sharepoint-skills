// library-roast collector. Runs unchanged inside an execute_plan script:
//   var C = new Function(COLLECT_TEXT)();
//   var p = C.plan({ site, now, utcOffsetMinutes, timeZone, dateSample, library, destination, lists });
//   library: the library title or URL the user named ("" if none). dateSample: tools.context.getDateTimeInfo() as returned.
//   p.candidates always lists the site's document libraries. If p.target is null, none matched: stop and ask.
//   var items = tools.lists.getItems({ listId: p.target.id, recursive: true, rowLimit: p.rowLimit, viewFields: p.fields });
//   var input = C.input(p, items);                        // items: getItems result ({ rows, truncated }) or rows array | { error }
//   var a = new Function('data', ANALYZE_TEXT)(input);   // references/analyze.js, unchanged
// lists: the result of tools.lists.discover() as returned. Dates from getItems are site-local display text
// ("10/1/2026 5:46 PM"); they are converted with utcOffsetMinutes because the plan sandbox has no Intl.
// Plain ES2020: no modules, DOM, network, lookbehind, or template literals.
var ROW_LIMIT = 5000;
var FIELDS = ['FileRef', 'FSObjType', 'Modified', 'File_x0020_Size'];
var EXCLUDED = /\/(AgentAssets|SiteAssets|Style Library|FormServerTemplates|PreservationHoldLibrary|_catalogs|SiteCollectionDocuments|SiteCollectionImages|SitePages)(\/|$)/i;
var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function str(v) { return v === null || v === undefined ? '' : String(v); }
function two(n) { return ('0' + n).slice(-2); }
function iso(ms) { return new Date(ms).toISOString(); }
function localParts(ms, off) { var d = new Date(ms + off * 60000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; }

// site-local text or ISO -> UTC milliseconds (null if unreadable)
function parseDate(v, off, order) {
  var s = str(v).trim(), m;
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) { var t = Date.parse(s); return isNaN(t) ? null : t; }
  var y, mo, d, h = 0, mi = 0, ap = '';
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?)?$/.exec(s))) { if (order === 'DMY') { d = +m[1]; mo = +m[2]; } else { mo = +m[1]; d = +m[2]; } y = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); ap = m[6] || ''; }
  else if ((m = /^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})\.?(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(s))) { d = +m[1]; mo = +m[2]; y = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); }
  else if ((m = /^(\d{4})[.\-/]\s?(\d{1,2})[.\-/]\s?(\d{1,2})\.?(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); }
  else if ((m = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?$/.exec(s)) && MONTHS[m[2].toLowerCase()]) { d = +m[1]; mo = MONTHS[m[2].toLowerCase()]; y = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); }
  else return null;
  if (/p/i.test(ap) && h < 12) h += 12;
  if (/a/i.test(ap) && h === 12) h = 0;
  return Date.UTC(y, mo - 1, d, h, mi) - off * 60000;
}

// Day/month order of the site's slash dates, from tools.context.getDateTimeInfo(): formattedValue vs isoDateTime.
function dateOrder(sample, off) {
  var f = sample && /^(\d{1,2})\/(\d{1,2})\/\d{4}/.exec(str(sample.formattedValue));
  var t = sample ? Date.parse(str(sample.isoDateTime)) : NaN;
  if (!f || isNaN(t)) return 'MDY';
  var lp = localParts(t, off), a = +f[1], b = +f[2];
  if (a === lp.d && b === lp.m && a !== b) return 'DMY';
  return 'MDY';
}

function refineOrder(order, rows) {
  var seen = { a: false, b: false };
  rows.forEach(function (it) {
    var m = /^(\d{1,2})\/(\d{1,2})\/\d{4}/.exec(str(it.Modified));
    if (m && +m[1] > 12) seen.a = true;
    if (m && +m[2] > 12) seen.b = true;
  });
  return seen.a && !seen.b ? 'DMY' : seen.b && !seen.a ? 'MDY' : order;
}

// File_x0020_Size: bytes as a number or text ("1234", "1,234"), or a display size ("1.5 MB", "12 KB").
function bytes(v) {
  var s = str(v).trim(), m = /^([\d.,\s\u00a0]+)\s*(B|KB|MB|GB)$/i.exec(s), u = { b: 1, kb: 1024, mb: 1048576, gb: 1073741824 };
  if (m) return Math.round(parseFloat(m[1].replace(/[\s\u00a0]/g, '').replace(',', '.')) * u[m[2].toLowerCase()]);
  s = s.replace(/[\s\u00a0.,]/g, '');
  return /^\d+$/.test(s) ? Number(s) : null;
}

// discover() sometimes returns only id, title, and url. Then a library is anything outside /Lists/.
function isDocLib(l) {
  if (l.baseTemplate !== undefined && l.baseTemplate !== null) return Number(l.baseTemplate) === 101;
  if (l.isDocumentLibrary !== undefined && l.isDocumentLibrary !== null) return l.isDocumentLibrary === true;
  return !/\/Lists\//i.test(str(l.url)) && !/\/_catalogs\//i.test(str(l.url));
}
function matches(l, want, host) {
  if (!want) return false;
  var title = str(l.title).toLowerCase(), url = str(l.url).replace(/\/+$/, '').toLowerCase();
  var w = want.toLowerCase().replace(/\/+$/, '');
  if (host && w.indexOf(host.toLowerCase()) === 0) w = w.slice(host.length);
  w = w.replace(/\/forms\/[^\/]+\.aspx.*$/, '');
  return title === w || url === w || url.slice(-w.length - 1) === '/' + w;
}

function plan(input) {
  var off = Number(input.utcOffsetMinutes) || 0;
  var nowMs = Date.parse(str(input.now));
  if (isNaN(nowMs)) throw new Error('library-roast: input.now is missing or not an ISO date');
  var site = input.site || {};
  var host = str(site.url).replace(/^(https:\/\/[^\/]+).*$/, '$1');
  var want = str(input.library).trim(), dest = str(input.destination || 'Reports').trim();
  var discovered = Array.isArray(input.lists) ? input.lists : (input.lists && Array.isArray(input.lists.lists) ? input.lists.lists : []);
  var target = null, destination = null, candidates = [];
  discovered.forEach(function (l) {
    if (!isDocLib(l)) return;
    var url = str(l.url).replace(/\/+$/, ''), lib = { id: str(l.id), title: str(l.title), url: host + url, rootFolder: url, absUrl: host + url, itemCount: Number(l.itemCount) || 0 };
    var countKnown = l.itemCount !== undefined && l.itemCount !== null;
    if (!destination && matches(l, dest, host) && !/\/AgentAssets(\/|$)/i.test(url)) destination = lib;
    if (l.hidden === true || EXCLUDED.test(url)) return;
    candidates.push({ title: lib.title, itemCount: countKnown ? lib.itemCount : null });
    if (!target && matches(l, want, host)) target = lib;
  });
  candidates.sort(function (a, b) { return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1; });
  var p = localParts(nowMs, off);
  var name = target ? target.title.replace(/[^A-Za-z0-9\-]+/g, '') || 'Library' : '';
  return {
    target: target, candidates: candidates, destination: destination,
    fields: FIELDS, rowLimit: ROW_LIMIT,
    state: { off: off, order: dateOrder(input.dateSample, off), nowMs: nowMs, timeZone: str(input.timeZone) || 'UTC',
      site: { title: str(site.title), url: str(site.url).replace(/\/+$/, '') }, target: target,
      fileName: 'Library-roast-' + name + '-' + p.y + '-' + two(p.m) + '-' + two(p.d) + '-' + two(p.h) + two(p.mi) + '.html' }
  };
}

function input(p, items) {
  var st = p.state, notChecked = [];
  var rows = items && Array.isArray(items.rows) ? items.rows : Array.isArray(items) ? items : null;
  if (!rows) throw new Error('library-roast: the library couldn’t be read: ' + str(items && items.error ? items.error : 'no rows returned'));
  if (items && items.truncated) notChecked.push('The library has more than ' + ROW_LIMIT + ' items; the roast covers the first ' + rows.length + '.');
  var order = refineOrder(st.order, rows);
  var out = rows.map(function (it) {
    var ms = parseDate(it.Modified, st.off, order);   // unreadable dates become '' and analyze.js reports them
    return [str(it.FileRef), Number(it.FSObjType) === 1 || it.FSObjType === true ? 1 : 0, ms === null ? '' : iso(ms), bytes(it.File_x0020_Size)];
  });
  return {
    site: { title: st.site.title, url: st.site.url, timeZone: st.timeZone, generatedAt: iso(st.nowMs) },
    library: { title: st.target.title, url: st.target.url, rootFolder: st.target.rootFolder, itemCount: st.target.itemCount },
    rows: out, truncated: !!(items && items.truncated), notChecked: notChecked
  };
}

return { plan: plan, input: input, parseDate: parseDate, dateOrder: dateOrder, bytes: bytes };
