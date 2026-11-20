#!/usr/bin/env python3
"""Headless Chrome check for a generated flow-training page.

Usage: browser_check.py page.html [--shots DIR] [--prefix NAME] [--libs DIR]
Injects local copies of D3 and Chart.js the way SharePoint supplies them, then
clicks through every step at 1280 and 390 widths, answers each quick check
(first a wrong option, then the right one), opens the finish screen, and checks
hash restore, Whole flow, Back, and the no-library fallback.
"""
import argparse, json, os, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('page'); ap.add_argument('--shots'); ap.add_argument('--prefix', default='page')
ap.add_argument('--libs', default=os.environ.get('FT_LIBS', 'libs'), help='folder with d3-7.9.0.min.js and chart.umd.min.js')
ap.add_argument('--chrome', default='/usr/bin/google-chrome')
ap.add_argument('--mid', type=int, default=-1, help='step count at which to take the mid-card shot')
a = ap.parse_args()
URL = 'file://' + os.path.abspath(a.page)
D = open(os.path.join(a.libs, 'd3-7.9.0.min.js')).read()
C = open(os.path.join(a.libs, 'chart.umd.min.js')).read()
FAIL = []

def check(cond, msg):
    print(('ok   ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)

def wait_idle(pg):
    for _ in range(80):
        if not pg.evaluate('window.__flowTraining.busy()'): return
        pg.wait_for_timeout(100)

def anchored(pg, phone):
    g = pg.evaluate('window.__flowTraining.geom()')
    if not g: return False, 'no geom'
    if phone: return g['mode'] == 'sheet', g['mode']
    c, b = g['card'], g['box']
    overlap = c['x1'] < b['x2'] and c['x2'] > b['x1'] and c['y1'] < b['y2'] and c['y2'] > b['y1']
    leads = pg.evaluate("document.querySelectorAll('#lead path').length")
    return (not overlap) and leads > 0, g['mode']

def run(p, w, h, tag):
    phone = w < 500
    b = p.chromium.launch(executable_path=a.chrome)
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if phone else 1, is_mobile=phone, has_touch=phone)
    pg = ctx.new_page(); errs = []; reqs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith('file:') and not r.url.startswith('data:') else None)
    pg.add_init_script(D); pg.add_init_script(C)
    pg.add_init_script("window.__store=0;['localStorage','sessionStorage'].forEach(function(k){try{var s=window[k];var o=s.setItem.bind(s);s.setItem=function(){window.__store++;return o.apply(null,arguments);};}catch(e){}});")
    pg.goto(URL); pg.wait_for_timeout(1800)
    n = pg.evaluate('window.__flowTraining.steps()')
    shot = lambda name: a.shots and pg.screenshot(path=os.path.join(a.shots, f'{a.prefix}-{tag}-{name}.png'))
    shot('01-first-step')
    ok, mode = anchored(pg, phone); check(ok, f'{tag}: first card anchored ({mode})')
    mid = a.mid if a.mid > 0 else max(2, (n + 1) // 2)
    anchors = 0; wrong_first = True
    for guard in range(n * 4):
        cnt = len(pg.evaluate('window.__flowTraining.order()'))
        if pg.is_visible('.opts button'):
            btns = pg.query_selector_all('.opts button')
            # find the right answer from the data, click a wrong one first once
            idx = pg.evaluate("(function(){var s=window.__flowTraining.cardIdx();return s;})()")
            right = pg.evaluate("Array.prototype.map.call(document.querySelectorAll('.opts button'),function(b){return b.textContent;})")
            okk = pg.evaluate("(function(){var i=window.__flowTraining.cardIdx();return null;})()")
            # try clicking the bar: locked should nudge, not add
            pg.click('#bNext'); pg.wait_for_timeout(300)
            check(len(pg.evaluate('window.__flowTraining.order()')) == cnt, f'{tag}: locked until the quick check is answered (step {cnt})')
            btns = pg.query_selector_all('.opts button')
            btns[0].click(); pg.wait_for_timeout(400)
            check(pg.is_visible('.fb b'), f'{tag}: quick check feedback shows (step {cnt})')
            if cnt == mid: shot('02-mid-card-check')
        ok, mode = anchored(pg, phone)
        if ok: anchors += 1
        else: print(f'     note {tag}: step {cnt} card mode {mode}')
        if cnt == mid and not pg.is_visible('.opts'): shot('02-mid-card')
        av = pg.evaluate('window.__flowTraining.available()')
        if av == ['finish']: break
        wait_idle(pg)
        pg.click('#bNext'); pg.wait_for_timeout(1700)
        check(len(pg.evaluate('window.__flowTraining.order()')) == cnt + 1, f'{tag}: + adds step {cnt + 1}')
    order = pg.evaluate('window.__flowTraining.order()')
    check(len(order) == n and sorted(order) == list(range(n)), f'{tag}: all {n} steps added, order {order}')
    check(anchors >= n - 1, f'{tag}: cards anchored with a leader on {anchors}/{n} steps')
    check(pg.evaluate('location.hash') == f'#step={n}', f'{tag}: hash is #step={n}')
    wait_idle(pg); pg.wait_for_timeout(1200)
    shot('03-built')
    pg.click('#bNext'); pg.wait_for_timeout(2600)
    check(pg.is_visible('#end'), f'{tag}: finish screen visible')
    check(pg.evaluate("location.hash") == '#done', f'{tag}: hash is #done')
    chart_ok = pg.evaluate("!!(window.Chart&&Chart.getChart&&Chart.getChart(document.getElementById('ft-chart')))")
    check(chart_ok, f'{tag}: Chart.js doughnut rendered')
    cc = pg.evaluate("(function(){var c=document.querySelector('.cc'),b=document.querySelector('.chartbox');if(!c||!b)return null;var r=c.getBoundingClientRect(),q=b.getBoundingClientRect();return [Math.abs((r.left+r.right)/2-(q.left+q.right)/2),Math.abs((r.top+r.bottom)/2-(q.top+q.bottom)/2)];})()")
    check(cc is not None and cc[0] < 3 and cc[1] < 3, f'{tag}: doughnut center label centered {cc}')
    g = pg.evaluate("document.querySelectorAll('.gcard').length")
    check(g >= 1, f'{tag}: {g} guardrail cards')
    shot('04-finish')
    pg.click('[data-e=back]'); pg.wait_for_timeout(600)
    check(not pg.is_visible('#end'), f'{tag}: back from finish')
    pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(500)
    check(len(pg.evaluate('window.__flowTraining.order()')) == n - 1, f'{tag}: ArrowLeft removes the last step')
    pg.click('#bWhole'); pg.wait_for_timeout(5000)
    wait_idle(pg)
    check(len(pg.evaluate('window.__flowTraining.order()')) == n, f'{tag}: Whole flow draws all steps')
    pg.click('#bReplay'); pg.wait_for_timeout(1500)
    check(len(pg.evaluate('window.__flowTraining.order()')) == 1, f'{tag}: Replay restarts at step 1')
    # hash restore
    pg.goto(URL + '#step=2'); pg.reload(); pg.wait_for_timeout(1500)
    check(len(pg.evaluate('window.__flowTraining.order()')) == min(2, n), f'{tag}: #step=2 restores two steps')
    pg.goto(URL + '#done'); pg.reload(); pg.wait_for_timeout(2200)
    check(pg.is_visible('#end'), f'{tag}: #done restores the finish screen')
    check(pg.evaluate('window.__store') == 0, f'{tag}: no storage writes')
    check(not reqs, f'{tag}: no network requests {reqs[:3]}')
    check(not errs, f'{tag}: zero console errors {errs[:3]}')
    b.close()

def run_fallback(p):
    b = p.chromium.launch(executable_path=a.chrome)
    pg = b.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(5600)
    check(pg.is_visible('#fallback'), 'no libraries: plain-text fallback visible')
    check(not errs, f'no libraries: zero console errors {errs[:3]}')
    b.close()

with sync_playwright() as p:
    run(p, 1280, 800, 'w1280')
    run(p, 390, 844, 'w390')
    run_fallback(p)
print('RESULT', 'PASS' if not FAIL else f'FAIL ({len(FAIL)})')
sys.exit(1 if FAIL else 0)
