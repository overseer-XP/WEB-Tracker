// What a member and a view-only person can see and do.
// Usage: node tests/roles.js <member-preview.html> <view-preview.html>
// Build them with: make_preview.py .live app/index.html <out> member|view
const path = require('path');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const res = []; const check = (who, what, ok, d = '') => res.push([ok ? 'OK  ' : 'FAIL', who, what, d]);

(async () => {
  const b = await chromium.launch();
  const open = async (file, hash) => { const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto('file://' + path.resolve(file) + '#' + hash); await p.waitForTimeout(600); return p };
  const go = (p, h) => p.evaluate(h => { location.hash = h }, h).then(() => p.waitForTimeout(250));

  // Member
  let p = await open(process.argv[2], 'mine');
  check('Member', 'Starts on My tasks', await p.evaluate(() => location.hash) === '#mine' || (await p.$eval('main h1', e => e.innerText)) === 'My tasks');
  check('Member', 'No Settings in the menu', !(await p.$('.nav a[href="#settings"]')));
  await go(p, 'settings'); check('Member', 'Settings link opens the Overview instead', (await p.$eval('main h1', e => e.innerText)) === 'Overview');
  await go(p, 'brand-bespoke');
  check('Member', 'No Client view or Edit details button', !(await p.$('a[href="#client-bespoke"]')) && !(await p.$('.hero [data-kind=brand]')));
  await go(p, 'client-bespoke'); check('Member', 'Client page link is not available', !(await p.$('.client')));
  await go(p, 'brand-bespoke'); await p.click('button[data-tab=tasks]'); await p.waitForTimeout(200);
  await p.selectOption('#whoSel', 'Cat'); await p.waitForTimeout(200);
  const own = await p.$$eval('main .kc', cs => { const c = cs.find(x => x.querySelector('.av[title="Cat (owner)"]')); return c ? c.getAttribute('draggable') : null });
  if (own !== null) check('Member', 'Can move their own card', own === 'true');
  const notOwn = await p.$$eval('main .kc', cs => { const c = cs.find(x => ![...x.querySelectorAll('.av')].some(a => (a.title || '').startsWith('Cat '))); return c ? c.getAttribute('draggable') : null });
  if (notOwn !== null) check('Member', 'Cannot move someone else\'s card', notOwn === 'false');
  await go(p, 'sow'); await p.click('[data-act=sowview][data-v=list]'); await p.waitForTimeout(150);
  check('Member', 'SOW stage picker is read-only', await p.$eval('select[data-kind=sow]', e => e.disabled));
  check('Member', 'No script errors', p.errs.length === 0, p.errs.join(' | '));
  await p.close();

  // View only: writes are refused by the database
  p = await open(process.argv[3], 'overview');
  await go(p, 'brand-ora'); await p.click('button[data-tab=steps]'); await p.waitForTimeout(150);
  const code = await p.$$eval('select[data-code]', els => { const e = els.find(x => x.checkVisibility() && x.value !== 'Done'); return e && e.dataset.code });
  await p.selectOption(`select[data-code="${code}"]`, 'Done'); await p.waitForTimeout(500);
  check('View only', 'A refused change is rolled back', await p.$eval(`select[data-code="${code}"]`, e => e.value) !== 'Done');
  check('View only', 'Page says they can view but not change', (await p.$eval('body', e => e.innerText)).includes('view this tracker but not change it'));
  check('View only', 'Controls lock after the first refusal', await p.$eval(`select[data-code="${code}"]`, e => e.disabled));
  check('View only', 'No script errors', p.errs.length === 0, p.errs.join(' | '));
  await p.close();

  for (const r of res) console.log(r.filter(Boolean).join(' | '));
  const fails = res.filter(r => r[0] === 'FAIL').length; console.log(`\n${res.length - fails} of ${res.length} role checks pass`);
  await b.close(); process.exit(fails ? 1 : 0);
})();
