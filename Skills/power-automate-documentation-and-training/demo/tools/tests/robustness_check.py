#!/usr/bin/env python3
"""Headless Chrome checks for the template engine: escaping, the blocking data check,
optional sections, reduced motion, keyboard, a sandboxed frame, and the styles SharePoint adds
when Copilot saves the page.

Usage: robustness_check.py [--template PATH] [--libs DIR] [--chrome PATH]
Builds variants of the template's sample DATA block in a temp folder and opens each one
with local copies of D3 and Chart.js injected the way SharePoint supplies them.
"""
import argparse, copy, json, os, re, sys, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
NAME = "power-automate-documentation-and-training"
CANDS = [HERE.parent / NAME / "templates", HERE.parent.parent / NAME / "templates", HERE.parent.parent.parent / NAME / "templates"]
ap = argparse.ArgumentParser()
ap.add_argument('--template', default=str(next((c / "flow-training-template.html" for c in CANDS if (c / "flow-training-template.html").exists()), CANDS[0])))
ap.add_argument('--libs', default=os.environ.get('FT_LIBS', 'libs'), help='folder with d3-7.9.0.min.js and chart.umd.min.js')
ap.add_argument('--chrome', default='/usr/bin/google-chrome')
a = ap.parse_args()
TPL = open(a.template).read()
D3 = open(os.path.join(a.libs, 'd3-7.9.0.min.js')).read()
CH = open(os.path.join(a.libs, 'chart.umd.min.js')).read()
m = re.search(r"/\*FLOW_DATA_BEGIN\*/\s*var DATA=(.*?);\s*/\*FLOW_DATA_END\*/", TPL, re.S)
BASE = json.loads(m.group(1))
WRAP_CANDS = [HERE / 'fixtures' / 'sharepoint-wrapper-styles.html']
WRAP = next((c.read_text() for c in WRAP_CANDS if c.exists()), None)
TMP = Path(tempfile.mkdtemp(prefix='ft-robust-'))
FAIL = []

def check(cond, msg):
    print(('ok   ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)

def page_for(data, name):
    js = json.dumps(data, ensure_ascii=True).replace('</', '<\\/')
    out = TPL[:m.start(1)] + js + TPL[m.end(1):]
    p = TMP / f'{name}.html'; p.write_text(out); return 'file://' + str(p)

def open_page(b, url, rm=False, w=1280, h=800):
    ctx = b.new_context(viewport={'width': w, 'height': h}, reduced_motion='reduce' if rm else 'no-preference')
    pg = ctx.new_page(); errs = []
    pg.on('console', lambda x: errs.append(x.text) if x.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.add_init_script(D3); pg.add_init_script(CH)
    pg.goto(url); pg.wait_for_timeout(1500)
    return ctx, pg, errs

def build_all(pg):
    for _ in range(40):
        if pg.is_visible('.opts button'):
            pg.click('.opts button >> nth=0'); pg.wait_for_timeout(300)
        av = pg.evaluate('window.__flowTraining.available()')
        if av == ['finish']: break
        pg.evaluate('window.__flowTraining.next()'); pg.wait_for_timeout(1600)
    pg.evaluate('window.__flowTraining.next()'); pg.wait_for_timeout(2500)

XSS = '<img src=x onerror="window.__x=1">"q\'s <b>&amp;'
def escaping(b):
    d = copy.deepcopy(BASE)
    d['meta']['title'] = 'T ' + XSS; d['meta']['summaryLead'] = XSS; d['meta']['summaryHeading'] = XSS
    for s in d['steps']:
        s['title'] = s['title'] + ' ' + XSS; s['what'] = XSS; s['why'] = XSS; s['k'] = XSS
        s['cfg'] = [[XSS, XSS]]; s['crumb'] = [XSS, XSS]
        if s.get('armName'): s['armName'] = XSS
    q = d['steps'][1]['quiz']; q['ask'] = XSS
    for o in q['opts']: o['t'] = o['t'] + XSS; o['fb'] = XSS
    d['steps'][1]['guard'] = ['1" onmouseover="window.__x=2', XSS]
    d['guards'] = [[XSS, XSS], ['Two', XSS]]
    d['checks']['title'] = XSS; d['checks']['center'] = 'c" onfocus="window.__x=3'; d['checks']['caption'] = XSS
    d['checks']['items'] = [{'t': XSS, 'done': True}, {'t': 'B', 'done': False}]
    ctx, pg, errs = open_page(b, page_for(d, 'escaping'))
    pg.evaluate('window.__flowTraining.open(1)'); pg.wait_for_timeout(500)
    check('<img' in pg.inner_text('#cin h2'), 'escaping: markup in a step title shows as text')
    check('onmouseover' in pg.inner_text('#cin .guard'), 'escaping: a quote in guard[0] stays text')
    build_all(pg)
    check(pg.is_visible('#end'), 'escaping: finish screen opens')
    label = pg.get_attribute('#ft-chart', 'aria-label') or ''
    check('onfocus' in label, 'escaping: a quote in checks.center stays inside aria-label')
    bad = pg.evaluate("document.querySelectorAll('img,[onerror],[onmouseover],[onfocus],[onload]').length")
    check(bad == 0, f'escaping: no injected elements or handlers ({bad})')
    check(pg.evaluate('window.__x===undefined'), 'escaping: no injected script ran')
    check(not errs, f'escaping: zero console errors {errs[:2]}')
    ctx.close()

def broken(b):
    S = BASE['steps']
    def v(fn):
        d = copy.deepcopy(BASE); fn(d); return d
    cases = [
        ('no steps', v(lambda d: d.__setitem__('steps', [])), 'DATA.steps is empty'),
        ('steps missing', v(lambda d: d.pop('steps')), 'DATA.steps is empty'),
        ('duplicate id', v(lambda d: d['steps'][2].__setitem__('id', d['steps'][0]['id'])), 'id is used twice'),
        ('blank what', v(lambda d: d['steps'][0].__setitem__('what', '  ')), 'what is empty'),
        ('blank title', v(lambda d: d['steps'][2].__setitem__('title', '')), 'title is empty'),
        ('bad kind', v(lambda d: d['steps'][0].__setitem__('kind', 'box')), 'kind must be'),
        ('quiz no ok', v(lambda d: [o.__setitem__('ok', False) for o in d['steps'][1]['quiz']['opts']]), 'exactly one option'),
        ('quiz two ok', v(lambda d: [o.__setitem__('ok', True) for o in d['steps'][1]['quiz']['opts']]), 'exactly one option'),
        ('quiz one option', v(lambda d: d['steps'][1]['quiz'].__setitem__('opts', d['steps'][1]['quiz']['opts'][:1])), 'two or three options'),
        ('quiz blank feedback', v(lambda d: d['steps'][1]['quiz']['opts'][0].__setitem__('fb', '')), 'needs both t and fb'),
        ('unknown parent', v(lambda d: d['steps'][2].__setitem__('parent', 'Nope')), 'is not a step id'),
        ('child before parent', v(lambda d: d['steps'].insert(0, d['steps'].pop(2))), 'comes before its parent'),
        ('blank cfg value', v(lambda d: d['steps'][0].__setitem__('cfg', [['Form', '']])), 'cfg must be'),
        ('blank guardrail', v(lambda d: d.__setitem__('guards', [['Title', '']])), 'Guardrail 1'),
        ('blank checklist item', v(lambda d: d['checks']['items'][0].__setitem__('t', '')), 'Checklist item 1'),
        ('unknown part step', v(lambda d: d['parts'][0]['steps'].append('Ghost')), 'Ghost is not a step id'),
    ]
    for name, d, expect in cases:
        ctx, pg, errs = open_page(b, page_for(d, 'bad-' + re.sub(r'\W+', '-', name)))
        vis = pg.is_visible('#fallback'); txt = pg.inner_text('#fallback') if vis else ''
        role = pg.get_attribute('#fallback', 'role')
        started = pg.evaluate('!!window.__flowTraining')
        sample = BASE['steps'][0]['title'] in pg.inner_text('body')
        check(vis and role == 'alert' and expect in txt and not started and not pg.is_visible('#bar') and not sample,
              f'data check: {name} blocks with "{expect}" and no sample content')
        ctx.close()

def optional(b):
    d = copy.deepcopy(BASE)
    d['steps'] = [dict(BASE['steps'][0])]; d['steps'][0].pop('crumb', None)
    d['parts'] = []; d['guards'] = []; d['checks'] = {'items': []}
    ctx, pg, errs = open_page(b, page_for(d, 'minimal'))
    check(pg.evaluate('window.__flowTraining.steps()') == 1, 'optional: one step, no guardrails, checks, parts, or quiz starts')
    pg.evaluate('window.__flowTraining.next()'); pg.wait_for_timeout(2500)
    check(pg.is_visible('#end'), 'optional: finish screen opens')
    check(pg.evaluate("document.querySelectorAll('.gcard').length") == 0 and pg.evaluate("!document.getElementById('ft-chart')"),
          'optional: no guardrail cards and no doughnut when there are none')
    check(not errs, f'optional: zero console errors {errs[:2]}')
    ctx.close()

def motion(b):
    url = page_for(BASE, 'motion')
    ctx, pg, errs = open_page(b, url, rm=True)
    pg.evaluate('window.__flowTraining.next()')
    check(not pg.evaluate('window.__flowTraining.busy()'), 'reduced motion at startup: steps add instantly')
    check(pg.evaluate("document.querySelectorAll('#flow [stroke-dasharray]').length") == 0, 'reduced motion at startup: no draw-in strokes')
    ctx.close()
    ctx, pg, errs = open_page(b, url, rm=False)
    pg.evaluate('window.__flowTraining.next()')
    check(pg.evaluate('window.__flowTraining.busy()'), 'motion allowed: steps animate')
    pg.wait_for_timeout(2000)
    pg.emulate_media(reduced_motion='reduce'); pg.wait_for_timeout(100)
    pg.click('.opts button >> nth=1') if pg.is_visible('.opts button') else None
    pg.wait_for_timeout(300)
    pg.evaluate('window.__flowTraining.next()')
    check(not pg.evaluate('window.__flowTraining.busy()'), 'reduced motion switched on later: next step adds instantly')
    pg.emulate_media(reduced_motion='no-preference'); pg.wait_for_timeout(100)
    pg.evaluate('window.__flowTraining.replay()') if pg.evaluate("typeof window.__flowTraining.replay==='function'") else pg.click('#bReplay')
    pg.wait_for_timeout(200)
    check(pg.evaluate('window.__flowTraining.busy()'), 'reduced motion switched off again: animation returns')
    check(not errs, f'motion: zero console errors {errs[:2]}')
    ctx.close()

def keyboard(b):
    ctx, pg, errs = open_page(b, page_for(BASE, 'keys'), rm=True)
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(300)
    check(len(pg.evaluate('window.__flowTraining.order()')) == 2, 'keyboard: ArrowRight adds the next step')
    pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(300)
    check(len(pg.evaluate('window.__flowTraining.order()')) == 1, 'keyboard: ArrowLeft removes it')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check(pg.evaluate("document.getElementById('card').classList.contains('min')"), 'keyboard: Escape collapses the card')
    pg.keyboard.press('Escape')
    pg.focus('#bBack'); seen = set()
    for _ in range(12):
        pg.keyboard.press('Tab'); seen.add(pg.evaluate('document.activeElement.id||document.activeElement.textContent.trim().slice(0,20)'))
    check({'bNext', 'bWhole', 'bReplay'} <= seen, f'keyboard: Tab reaches the toolbar buttons')
    pg.focus('#bNext'); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    check(len(pg.evaluate('window.__flowTraining.order()')) == 2, 'keyboard: Enter on Add step adds a step')
    check(not errs, f'keyboard: zero console errors {errs[:2]}')
    ctx.close()

def sandboxed(b):
    page = Path(page_for(BASE, 'inner')[7:]).read_text()
    host = TMP / 'host.html'
    host.write_text('<!doctype html><iframe id="f" sandbox="allow-scripts" style="width:1200px;height:760px" srcdoc="'
                    + page.replace('&', '&amp;').replace('"', '&quot;') + '"></iframe>')
    ctx, pg, errs = open_page(b, 'file://' + str(host))
    fr = pg.frames[1]
    check(fr.evaluate('!!window.__flowTraining'), 'sandboxed frame: page starts')
    fr.evaluate('window.__flowTraining.next()'); pg.wait_for_timeout(1800)
    check(len(fr.evaluate('window.__flowTraining.order()')) == 2, 'sandboxed frame: steps add (hash writes may be ignored)')
    check(not errs, f'sandboxed frame: zero console errors {errs[:2]}')
    ctx.close()

PROPS = ['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height',
         'margin-top', 'margin-bottom', 'padding-left', 'text-decoration-line']
SNAP = """(P)=>{const o={};let k=0;document.querySelectorAll('body *').forEach(e=>{if(e.closest('svg'))return;
  const r=e.getBoundingClientRect();if(!r.width&&!r.height)return;const c=getComputedStyle(e);
  o[(k++)+':'+e.tagName+(e.id?'#'+e.id:'')]=P.map(p=>c.getPropertyValue(p));});return o;}"""
CONTRAST = """(sel)=>{function rgb(s){return s.match(/[\\d.]+/g).slice(0,3).map(Number);}
  function lum(c){return c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}).reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i],0);}
  const e=document.querySelector(sel),f=lum(rgb(getComputedStyle(e).color)),b=lum(rgb(getComputedStyle(document.querySelector('.top')).backgroundColor));
  return (Math.max(f,b)+0.05)/(Math.min(f,b)+0.05);}"""

def host_wrapper(b):
    if WRAP is None:
        print('skip SharePoint wrapper checks: tests/fixtures/sharepoint-wrapper-styles.html not found'); return
    base_html = Path(page_for(BASE, 'host-base')[7:]).read_text()
    def snaps(html, name, libs=True):
        p = TMP / f'{name}.html'; p.write_text(html); url = 'file://' + str(p)
        ctx = b.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce'); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        if libs: pg.add_init_script(D3); pg.add_init_script(CH)
        pg.goto(url); pg.wait_for_timeout(800 if libs else 5600)
        out = {'first': pg.evaluate(SNAP, PROPS)}
        ratios = [pg.evaluate(CONTRAST, s) for s in ('#ft-title', '#ft-eyebrow', '#ft-lede')]
        if libs:
            pg.evaluate('window.__flowTraining.open(1)'); out['quiz'] = pg.evaluate(SNAP, PROPS)
            pg.goto(url + '#done'); pg.reload(); pg.wait_for_timeout(1500); out['end'] = pg.evaluate(SNAP, PROPS)
        ctx.close(); return out, ratios, errs
    for libs in (True, False):
        ref, _, _ = snaps(base_html, f'host-ref-{libs}', libs)
        for where, html in (('before', base_html.replace('<head>', '<head>' + WRAP, 1)),
                            ('after', base_html.replace('</head>', WRAP + '</head>', 1))):
            got, ratios, errs = snaps(html, f'host-{where}-{libs}', libs)
            tag = f'SharePoint wrapper styles {where} the template{"" if libs else ", no libraries"}'
            check(min(ratios) >= 4.5, f'{tag}: header title, eyebrow, and lede readable (contrast {", ".join("%.1f" % r for r in ratios)})')
            diffs = [f'{st} {k} {PROPS[i]}: {a} -> {c}' for st in ref for k, v in ref[st].items()
                     for i, (a, c) in enumerate(zip(v, got.get(st, {}).get(k, v))) if a != c]
            check(not diffs, f'{tag}: page keeps its own colors, fonts, and spacing {diffs[:3]}')
            check(not errs, f'{tag}: zero page errors {errs[:2]}')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=a.chrome)
    escaping(b); broken(b); optional(b); motion(b); keyboard(b); sandboxed(b); host_wrapper(b)
    b.close()
print('RESULT', 'PASS' if not FAIL else f'FAIL ({len(FAIL)})')
sys.exit(1 if FAIL else 0)
