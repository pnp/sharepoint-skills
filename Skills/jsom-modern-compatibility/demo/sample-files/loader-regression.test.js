#!/usr/bin/env node
/*
 * Regression harness for the jsom-modern-compatibility mandatory loader.
 *
 * It extracts the "Mandatory compatibility boilerplate" code block straight from
 * ../../jsom-modern-compatibility/SKILL.md, so the code under test is always the
 * exact code the skill tells Copilot to emit. It runs that code in an isolated
 * Node VM with a minimal simulated DOM. No SharePoint tenant is contacted.
 *
 * Run:  node loader-regression.test.js
 * Needs Node.js 18 or later. No npm packages.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var SKILL_PATH = path.join(__dirname, '..', '..', 'jsom-modern-compatibility', 'SKILL.md');
var SITE = 'https://contoso.sharepoint.com/sites/playground';
var TEST_TIMEOUT_MS = 300;      // loader timeout used in tests
var HANG_GUARD_MS = 3000;       // a test still pending after this is reported as a hang

function extractBoilerplate() {
  var md = fs.readFileSync(SKILL_PATH, 'utf8');
  var start = md.indexOf('## Mandatory compatibility boilerplate');
  if (start < 0) { throw new Error('Boilerplate heading not found in SKILL.md'); }
  var fenceStart = md.indexOf('```javascript', start);
  var codeStart = md.indexOf('\n', fenceStart) + 1;
  var codeEnd = md.indexOf('\n```', codeStart);
  return md.slice(codeStart, codeEnd);
}

// What each library defines once it has executed.
var DEFINERS = {
  'init.js': function (w) { w.SP = w.SP || {}; w.SP.SOD = { executeOrDelayUntilScriptLoaded: function () {} }; },
  'microsoftajax.js': function (w) { w.Type = { registerNamespace: function () {} }; },
  'sp.runtime.js': function (w) { w.SP = w.SP || {}; w.SP.ClientRuntimeContext = function () {}; },
  'sp.js': function (w) { w.SP = w.SP || {}; w.SP.ClientContext = function () {}; },
  'sp.search.js': function (w) {
    w.Microsoft = { SharePoint: { Client: { Search: { Query: { KeywordQuery: function () {} } } } } };
  }
};
var CORE = ['init.js', 'MicrosoftAjax.js', 'SP.Runtime.js', 'SP.js'];

function fileOf(src) { return src.split('/').pop().toLowerCase(); }

function FakeScript(env) {
  this.env = env;
  this.src = '';
  this.dataset = {};
  this.listeners = { load: [], error: [] };
  this.onload = null;
  this.onerror = null;
}
FakeScript.prototype.addEventListener = function (type, fn) { this.listeners[type].push(fn); };
FakeScript.prototype.removeEventListener = function (type, fn) {
  this.listeners[type] = this.listeners[type].filter(function (f) { return f !== fn; });
};
FakeScript.prototype.fire = function (type) {
  var handler = this['on' + type];
  if (handler) { handler.call(this); }
  this.listeners[type].slice().forEach(function (fn) { fn(); });
};

// network: file (lowercase) -> 'ok' | 'fail' | 'hang' | 'load-without-init'. Default 'ok'.
function makeEnv(options) {
  options = options || {};
  var network = options.network || {};
  var env = { requests: [], scripts: [], logs: [] };
  var head = {
    appendChild: function (script) {
      env.scripts.push(script);
      env.requests.push(script.src);
      var file = fileOf(script.src);
      var behaviour = network[file] || 'ok';
      setTimeout(function () {
        if (behaviour === 'ok') { DEFINERS[file] && DEFINERS[file](sandbox); script.fire('load'); }
        else if (behaviour === 'fail') { script.fire('error'); }
        else if (behaviour === 'load-without-init') { script.fire('load'); }
        // 'hang': never responds
      }, 5);
      return script;
    }
  };
  var sandbox = {
    console: {
      log: function (m) { env.logs.push(m); },
      warn: function (m) { env.logs.push(m); },
      error: function (m) { env.logs.push(m); }
    },
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    setInterval: setInterval, clearInterval: clearInterval,
    Promise: Promise, Map: Map, Error: Error
  };
  sandbox.window = sandbox;
  sandbox.document = {
    head: head,
    createElement: function () { return new FakeScript(env); },
    getElementsByTagName: function () { return env.scripts; },
    querySelector: function (sel) {
      var m = /script\[src="(.*)"\]/.exec(sel);
      return m ? (env.scripts.filter(function (s) { return s.src === m[1]; })[0] || null) : null;
    }
  };
  if (options.pageContext !== false) {
    sandbox._spPageContextInfo = { webAbsoluteUrl: SITE + '/' };
  }
  // Pre-existing tags inserted by SharePoint or another loader (no data-load-state marker unless given).
  (options.existing || []).forEach(function (e) {
    var s = new FakeScript(env);
    s.src = SITE + '/_layouts/15/' + e.file;
    if (e.loadState) { s.dataset.loadState = e.loadState; }
    env.scripts.push(s);
    if (e.ready) { DEFINERS[e.file.toLowerCase()](sandbox); }
    if (e.later) { setTimeout(function () { e.later(s, sandbox); }, e.laterMs || 30); }
  });
  vm.createContext(sandbox);
  vm.runInContext(extractBoilerplate(), sandbox, { filename: 'SKILL.md#boilerplate' });
  vm.runInContext('JSOM_LOAD_TIMEOUT_MS = ' + TEST_TIMEOUT_MS + ';', sandbox);
  env.sandbox = sandbox;
  env.ensure = function (extra) { return sandbox.ensureJSOMLibraries(extra); };
  return env;
}

function settle(promise) {
  var guard;
  var started = Date.now();
  return Promise.race([
    promise.then(function () { return { status: 'resolved', ms: Date.now() - started }; },
      function (e) { return { status: 'rejected', error: e.message, ms: Date.now() - started }; }),
    new Promise(function (r) { guard = setTimeout(function () { r({ status: 'pending' }); }, HANG_GUARD_MS); })
  ]).then(function (res) { clearTimeout(guard); return res; });
}

function assert(cond, msg) { if (!cond) { throw new Error(msg); } }

var cases = [
  ['Successful load on a modern page, from the current site URL', async function () {
    var env = makeEnv();
    var r = await settle(env.ensure());
    assert(r.status === 'resolved', 'expected resolve, got ' + JSON.stringify(r));
    assert(env.requests.length === 4, 'expected 4 requests, got ' + env.requests.length);
    env.requests.forEach(function (u) { assert(u.indexOf(SITE + '/_layouts/15/') === 0, 'not site-relative: ' + u); });
    assert(typeof env.sandbox.SP.ClientContext === 'function', 'SP.ClientContext missing after readiness');
  }],
  ['Feature library (SP.Search.js) loads from the current site', async function () {
    var env = makeEnv();
    var r = await settle(env.ensure(['SP.Search.js']));
    assert(r.status === 'resolved', JSON.stringify(r));
    assert(env.requests[4] === SITE + '/_layouts/15/SP.Search.js', 'wrong search URL ' + env.requests[4]);
  }],
  ['Required load failure stops the chain and rejects', async function () {
    var env = makeEnv({ network: { 'sp.runtime.js': 'fail' } });
    var r = await settle(env.ensure());
    assert(r.status === 'rejected' && /SP\.Runtime\.js/.test(r.error), JSON.stringify(r));
    assert(env.requests.every(function (u) { return fileOf(u) !== 'sp.js'; }), 'SP.js requested after a required failure');
  }],
  ['Load event without library initialization rejects', async function () {
    var env = makeEnv({ network: { 'sp.js': 'load-without-init' } });
    var r = await settle(env.ensure());
    assert(r.status === 'rejected' && /not initialized/.test(r.error), JSON.stringify(r));
  }],
  ['Tracked in-flight tag: waits for its load event, no duplicate tag', async function () {
    var env = makeEnv({ existing: [{ file: 'init.js', loadState: 'loading',
      later: function (s, w) { DEFINERS['init.js'](w); s.fire('load'); } }] });
    var r = await settle(env.ensure());
    assert(r.status === 'resolved', JSON.stringify(r));
    assert(env.requests.every(function (u) { return fileOf(u) !== 'init.js'; }), 'duplicate init.js tag added');
  }],
  ['Tracked failed tag rejects immediately', async function () {
    var env = makeEnv({ existing: [{ file: 'init.js', loadState: 'failed' }] });
    var r = await settle(env.ensure());
    assert(r.status === 'rejected' && /Previously failed/.test(r.error), JSON.stringify(r));
    assert(r.ms < TEST_TIMEOUT_MS, 'should not wait for timeout');
  }],
  ['Untracked already-loaded tags (classic page): resolves without new requests', async function () {
    var env = makeEnv({ existing: CORE.map(function (f) { return { file: f, ready: true }; }) });
    var r = await settle(env.ensure());
    assert(r.status === 'resolved', JSON.stringify(r));
    assert(env.requests.length === 0, 'unexpected requests: ' + env.requests.join(', '));
  }],
  ['Partially initialized page: untracked loaded init.js, rest loaded by the loader', async function () {
    var env = makeEnv({ existing: [{ file: 'init.js', ready: true }] });
    var r = await settle(env.ensure());
    assert(r.status === 'resolved', JSON.stringify(r));
    assert(env.requests.length === 3, 'expected 3 requests, got ' + env.requests.join(', '));
  }],
  ['Reviewer repro: untracked init.js tag, empty dataset, no events, JSOM not ready -> bounded rejection', async function () {
    var env = makeEnv({ existing: [{ file: 'init.js' }] });
    var r = await settle(env.ensure());
    assert(r.status !== 'pending', 'promise is still pending (hang)');
    assert(r.status === 'rejected' && /Timed out/.test(r.error), JSON.stringify(r));
  }],
  ['Untracked already-failed SP.js tag (error happened before listeners) -> bounded rejection', async function () {
    var env = makeEnv({ existing: [{ file: 'SP.js' }] });
    var r = await settle(env.ensure());
    assert(r.status === 'rejected' && /Timed out.*SP\.js/.test(r.error), JSON.stringify(r));
  }],
  ['Untracked in-flight tag that later fires load', async function () {
    var env = makeEnv({ existing: [{ file: 'MicrosoftAjax.js',
      later: function (s, w) { DEFINERS['microsoftajax.js'](w); s.fire('load'); } }] });
    var r = await settle(env.ensure());
    assert(r.status === 'resolved', JSON.stringify(r));
    assert(env.requests.every(function (u) { return fileOf(u) !== 'microsoftajax.js'; }), 'duplicate tag added');
  }],
  ['Untracked in-flight tag that later fires error', async function () {
    var env = makeEnv({ existing: [{ file: 'SP.Runtime.js', later: function (s) { s.fire('error'); } }] });
    var r = await settle(env.ensure());
    assert(r.status === 'rejected' && /Load failed/.test(r.error), JSON.stringify(r));
  }],
  ['Untracked tag whose library becomes ready with no observed event (readiness polling)', async function () {
    var env = makeEnv({ existing: [{ file: 'SP.js', later: function (s, w) { DEFINERS['sp.js'](w); } }] });
    var r = await settle(env.ensure());
    assert(r.status === 'resolved', JSON.stringify(r));
  }],
  ['New tag whose request never answers -> bounded rejection', async function () {
    var env = makeEnv({ network: { 'sp.js': 'hang' } });
    var r = await settle(env.ensure());
    assert(r.status === 'rejected' && /Timed out/.test(r.error), JSON.stringify(r));
  }],
  ['Concurrent calls share loads (one tag per library)', async function () {
    var env = makeEnv();
    var results = await Promise.all([settle(env.ensure()), settle(env.ensure()), settle(env.ensure(['SP.Search.js']))]);
    results.forEach(function (r) { assert(r.status === 'resolved', JSON.stringify(r)); });
    var counts = {};
    env.requests.forEach(function (u) { counts[u] = (counts[u] || 0) + 1; });
    Object.keys(counts).forEach(function (u) { assert(counts[u] === 1, u + ' requested ' + counts[u] + ' times'); });
  }],
  ['Modern page without _spPageContextInfo: fails clearly, no tenant-root fallback', async function () {
    var env = makeEnv({ pageContext: false });
    var r = await settle(env.ensure());
    assert(r.status === 'rejected' && /webAbsoluteUrl/.test(r.error), JSON.stringify(r));
    assert(env.requests.length === 0, 'requests made without a verified site URL');
  }]
];

(async function () {
  var failed = 0;
  console.log('Node ' + process.version + ' | loader timeout ' + TEST_TIMEOUT_MS + ' ms (production default 15000 ms)');
  for (var i = 0; i < cases.length; i++) {
    try {
      await cases[i][1]();
      console.log('PASS ' + (i + 1) + '. ' + cases[i][0]);
    } catch (e) {
      failed++;
      console.log('FAIL ' + (i + 1) + '. ' + cases[i][0] + '\n     ' + e.message);
    }
  }
  console.log('\n' + (cases.length - failed) + '/' + cases.length + ' passed');
  process.exit(failed ? 1 : 0);
})();
