// what-changed-digest collector. Runs unchanged inside an execute_plan script:
//   var C = new Function(COLLECT_TEXT)();
//   var p = C.plan({ site, now, utcOffsetMinutes, timeZone, dateSample, days, start, end, scope, destination, lists });
//   dateSample: tools.context.getDateTimeInfo() as returned (its formattedValue/isoDateTime pair gives the day/month order).
//   ... for each container in p.containers: results[c.id] = tools.lists.getItems({ listId: c.id, ..., viewFields: p.fields }) ...
//   var r = C.build(p, results);   // results: { "<list id>": getItems result ({ rows, truncated }) or rows array | { error: "<reason>" } }
//   r.blob is the digest data for the template, r.fileName the file name, r.destination the destination library.
// lists: the result of tools.lists.discover() as returned. Dates from getItems are site-local display text
// ("10/1/2026 5:46 PM"); they are converted with utcOffsetMinutes because the plan sandbox has no Intl.
// Plain ES2020: no modules, DOM, network, lookbehind, or template literals.
var PER_CONTAINER = 200;
var TOTAL = 600;
var FIELDS = ['ID', 'Title', 'FileLeafRef', 'FileRef', 'FSObjType', 'Created', 'Modified', 'Editor', '_UIVersionString'];
var LIST_TEMPLATES = { 100: 1, 103: 1, 104: 1, 105: 1, 106: 1, 107: 1, 108: 1, 150: 1, 171: 1 };
var EXCLUDED = /\/(AgentAssets|SiteAssets|Style Library|FormServerTemplates|PreservationHoldLibrary|_catalogs|SiteCollectionDocuments|SiteCollectionImages)(\/|$)/i;
var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function str(v) { return v === null || v === undefined ? '' : String(v); }
function two(n) { return ('0' + n).slice(-2); }
function iso(ms) { var d = new Date(ms); return d.getUTCFullYear() + '-' + two(d.getUTCMonth() + 1) + '-' + two(d.getUTCDate()) + 'T' + two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + 'Z'; }
function localParts(ms, off) { var d = new Date(ms + off * 60000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; }
function localDay(ms, off) { var p = localParts(ms, off); return p.y + '-' + two(p.m) + '-' + two(p.d); }

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

function person(v) {
  var x = Array.isArray(v) ? v[0] : v;
  if (x && typeof x === 'object') return str(x.title || x.Title || x.lookupValue || x.LookupValue || x.displayName);
  return str(x).replace(/\s*(mailto:)?\S+@\S+/g, '').trim();
}

function kindOf(l) {
  var t = Number(l.baseTemplate);
  if (t === 119) return 'page';
  if (t === 101 || l.isDocumentLibrary === true) return 'doc';
  if (LIST_TEMPLATES[t]) return 'list';
  return null;
}

function plan(input) {
  var off = Number(input.utcOffsetMinutes) || 0;
  var nowMs = Date.parse(str(input.now));
  if (isNaN(nowMs)) throw new Error('what-changed-digest: input.now is missing or not an ISO date');
  var order = dateOrder(input.dateSample, off);
  var endMs = input.end ? (parseDate(input.end, off, 'YMD') || nowMs) : nowMs;
  var startMs = input.start ? parseDate(input.start, off, 'YMD') : null;
  if (startMs === null) startMs = endMs - (Number(input.days) || 7) * 86400000;
  var site = input.site || {}, srv = str(site.serverRelativeUrl || str(site.url).replace(/^https:\/\/[^\/]+/, '')).replace(/\/+$/, '');
  var host = str(site.url).replace(/^(https:\/\/[^\/]+).*$/, '$1');
  var dest = str(input.destination || 'Reports').toLowerCase();
  var scope = (input.scope || []).map(function (s) { return str(s).toLowerCase(); });
  var containers = [], destination = null;
  var discovered = Array.isArray(input.lists) ? input.lists : (input.lists && Array.isArray(input.lists.lists) ? input.lists.lists : []);
  discovered.forEach(function (l) {
    var url = str(l.url).replace(/\/+$/, ''), title = str(l.title), kind = kindOf(l);
    if (kind === 'doc' && (title.toLowerCase() === dest || url.toLowerCase().slice(-dest.length - 1) === '/' + dest)) destination = { id: str(l.id), title: title, url: url, absUrl: host + url };
    if (!kind || l.hidden === true || EXCLUDED.test(url) || /\/_catalogs\//i.test(url)) return;
    if (scope.length && scope.indexOf(title.toLowerCase()) < 0) return;
    if (Number(l.itemCount) === 0) return;
    containers.push({ id: str(l.id), title: title, url: url, absUrl: host + url, kind: kind });
  });
  containers.sort(function (a, b) { return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : a.title.toLowerCase() > b.title.toLowerCase() ? 1 : 0; });
  var e = localParts(endMs, off);
  return {
    containers: containers, fields: FIELDS, rowLimit: PER_CONTAINER + 1,
    startUtc: new Date(startMs).toISOString(), endUtc: new Date(endMs).toISOString(),
    camlFilter: '<Geq><FieldRef Name="Modified"/><Value Type="DateTime" IncludeTimeValue="TRUE" StorageTZ="TRUE">' + new Date(startMs).toISOString() + '</Value></Geq>',
    destination: destination,
    state: { off: off, order: order, startMs: startMs, endMs: endMs, explicitEnd: !!input.end, site: { title: str(site.title), url: str(site.url).replace(/\/+$/, '') }, srv: srv, timeZone: str(input.timeZone) || 'UTC', nowMs: nowMs,
      fileName: 'What-changed-' + localDay(startMs, off) + '-to-' + localDay(endMs, off) + '-' + two(e.h) + two(e.mi) + '.html' }
  };
}

function refineOrder(order, results) {
  var seen = { a: false, b: false };
  Object.keys(results || {}).forEach(function (k) {
    var rs = results[k] && Array.isArray(results[k].rows) ? results[k].rows : results[k];
    if (!Array.isArray(rs)) return;
    rs.forEach(function (it) {
      [it.Modified, it.Created].forEach(function (v) {
        var m = /^(\d{1,2})\/(\d{1,2})\/\d{4}/.exec(str(v));
        if (m && +m[1] > 12) seen.a = true;
        if (m && +m[2] > 12) seen.b = true;
      });
    });
  });
  return seen.a && !seen.b ? 'DMY' : seen.b && !seen.a ? 'MDY' : order;
}

function build(p, results) {
  p.state.order = refineOrder(p.state.order, results);
  var st = p.state, off = st.off, P = [], pIndex = {}, C = [], all = [];
  p.containers.forEach(function (c, ci) {
    var res = results ? results[c.id] : undefined, truncated = false;
    if (res && !Array.isArray(res) && Array.isArray(res.rows)) { truncated = !!res.truncated; res = res.rows; }
    var entry = { t: c.title, u: c.absUrl, k: c.kind, s: false, x: '' };
    C.push(entry);
    if (!Array.isArray(res)) { entry.x = res && res.error ? str(res.error) : 'couldn’t be read'; return; }
    var rows = [], unreadable = 0;
    res.forEach(function (it) {
      if (str(it.FSObjType) === '1') return;
      var leaf = str(it.FileLeafRef);
      if (/^What-changed-/i.test(leaf)) return;
      var mod = parseDate(it.Modified, off, st.order), cre = parseDate(it.Created, off, st.order);
      if (mod === null) { unreadable++; return; }
      if (mod < st.startMs || (st.explicitEnd && mod > st.endMs)) return;
      var ref = str(it.FileRef), path = ref.indexOf(c.url + '/') === 0 ? ref.slice(c.url.length + 1) : leaf;
      rows.push({ c: ci, path: c.kind === 'list' ? str(it.Title) : path, id: Number(it.ID), isNew: cre !== null && cre >= st.startMs ? 1 : 0, mod: mod,
        who: person(it.Editor) || 'Unknown', ver: c.kind === 'list' ? '' : str(it._UIVersionString), pageTitle: c.kind === 'page' ? str(it.Title) : '' });
    });
    rows.sort(function (a, b) { return b.mod - a.mod || b.id - a.id; });
    if (truncated || res.length >= p.rowLimit || rows.length > PER_CONTAINER) { entry.s = true; rows = rows.slice(0, PER_CONTAINER); }
    if (unreadable) entry.x = unreadable + (unreadable === 1 ? ' item had' : ' items had') + ' a date that couldn\u2019t be read';
    all = all.concat(rows);
  });
  all.sort(function (a, b) { return b.mod - a.mod || a.c - b.c || b.id - a.id; });
  if (all.length > TOTAL) { all.slice(TOTAL).forEach(function (r) { C[r.c].s = true; }); all = all.slice(0, TOTAL); }
  var R = all.map(function (r) {
    if (!(r.who in pIndex)) { pIndex[r.who] = P.length; P.push(r.who); }
    return [r.c, r.path, r.id, r.isNew, iso(r.mod), pIndex[r.who], r.ver, r.pageTitle];
  });
  var blob = {
    site: st.site,
    window: { start: iso(st.startMs), end: iso(st.endMs), timeZone: st.timeZone, utcOffsetMinutes: off },
    generatedAt: iso(st.nowMs), P: P, C: C, R: R
  };
  return { blob: blob, fileName: st.fileName, destination: p.destination, rowCount: R.length };
}

return { plan: plan, build: build, parseDate: parseDate, dateOrder: dateOrder };
