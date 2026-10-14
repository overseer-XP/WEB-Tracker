// Stress test: times every page and common edits on a large data set.
// Usage: node tests/stress.js <stress-preview.html>   (build it with tests/make_stress_data.py + make_preview.py)
const path = require('path');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const url = 'file://' + path.resolve(process.argv[2]);
const LIMIT = 1500; // ms a page may take to draw before we call it slow
const LOAD_LIMIT = 3000; // first load includes reading the 1.4 MB test file

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now(); await p.goto(url + '#overview'); await p.waitForFunction(() => document.querySelector('.tiles')); const load = Date.now() - t0;
  await p.selectOption('#whoSel', 'Cat');
  const time = async (label, fn) => { const s = Date.now(); await fn(); const ms = Date.now() - s; rows.push([label, ms]); };
  const rows = [['First load to Overview', load]];
  const nav = h => p.evaluate(h => new Promise(r => { location.hash = h; requestAnimationFrame(() => setTimeout(r, 0)) }), h);
  const brands = await p.$$eval('.rail .blink', as => as.map(a => a.getAttribute('href').slice(1)));
  for (const h of ['overview', 'mine', 'people', 'sow', 'access', 'bp', 'settings', brands[0], brands[brands.length - 1]]) await time('Open #' + h, () => nav(h));
  await nav('sow'); await p.click('[data-act=sowview][data-v=list]').catch(() => {}); await time('SOW list view', () => nav('sow'));
  await p.click('[data-act=sowview][data-v=board]').catch(() => {});
  await nav(brands[0]); await p.click('button[data-tab=steps]');
  await time('Change a step status (all screens redraw)', async () => { const code = await p.$$eval('select[data-code]', els => els.find(e => e.checkVisibility() && e.value !== 'In Progress').dataset.code); await p.selectOption(`select[data-code="${code}"]`, 'In Progress') });
  await nav('mine');
  await time('Change a task status from My tasks', async () => { const s = await p.$('main select[data-kind=task]'); if (s) await s.selectOption('In Progress') });
  await nav('overview');
  await time('Type in search (6 letters)', async () => { await p.click('#q'); await p.keyboard.type('bespok'); await p.waitForSelector('#sres:not([hidden])') });
  await p.keyboard.press('Escape');
  await time('Sort brands table', () => p.click('[data-act=sort][data-k=health]'));
  const counts = await p.evaluate(() => ({ brands: document.querySelectorAll('.rail .blink').length, domNodes: document.getElementsByTagName('*').length }));
  console.log(`Data: ${counts.brands} brands in the menu, ${counts.domNodes} page elements on the Overview`);
  let slow = 0;
  for (const [l, ms] of rows) { const bad = ms > (l.startsWith('First load') ? LOAD_LIMIT : LIMIT); if (bad) slow++; console.log(`${bad ? 'SLOW' : 'OK  '} ${String(ms).padStart(5)} ms  ${l}`) }
  console.log(`script errors: ${errs.length}`); errs.slice(0, 10).forEach(e => console.log('  ' + e));
  await b.close(); process.exit(slow || errs.length ? 1 : 0);
})();
