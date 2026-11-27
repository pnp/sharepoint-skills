const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'sample-files', 'halloween-haunt.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const initialization = script.slice(script.indexOf('var mq='), script.indexOf('/* ---------- status line'));
const camera = script.slice(script.indexOf('demoCam=function(t)'), script.indexOf('if(D.step){window.__demoStep', script.indexOf('demoCam=function(t)')));
const tick = script.slice(script.indexOf('var FLASHK='), script.indexOf('function demoStart'));

for (const initialReduced of [true, false]) {
  for (const legacy of [true, false]) {
    let change;
    const mq = { matches: initialReduced };
    mq[legacy ? 'addListener' : 'addEventListener'] = (...args) => { change = args.at(-1); };
    const context = vm.createContext({
      window: { matchMedia: () => mq },
      location: { search: '?demo=1&sound=0', hash: '' },
      document: { documentElement: { classList: { add() {} } } },
      setTimeout() {},
      warn: (...args) => { throw new Error(args.join(' ')); }
    });
    vm.runInContext(initialization, context);
    assert.equal(context.reduced, initialReduced, 'demo must retain the initial preference');
    assert.equal(context.DEMO, true);
    assert.equal(typeof change, 'function', 'fallback must also observe preference changes');
    mq.matches = !initialReduced;
    change();
    assert.equal(context.reduced, !initialReduced);
    mq.matches = initialReduced;
    change();
    assert.equal(context.reduced, initialReduced);

    vm.runInContext("var cam={target:{copyFromFloats(){throw Error('camera moved');}}}; var reduced=true;", context);
    vm.runInContext(camera, context);
    context.demoCam(8000);

    Object.assign(context, { demoMs: 0, demoFlash: 0, demoNext: 0, DEMO_EV: [], FLASHK: [], flashEl: { style: {} } });
    vm.runInContext(tick, context);
    context.demoTick(78);
    assert.ok(Number(context.flashEl.style.opacity) <= .14, 'reduced demo flash must be gentle');
    context.reduced = false;
    context.demoMs = 0;
    context.demoTick(78);
    assert.ok(Number(context.flashEl.style.opacity) > .5, 'normal demo keeps its original flash');
  }
}
console.log('PASS initial/live reduced-motion preferences, modern/legacy listeners, stationary demo camera, gentle/normal demo flash');
