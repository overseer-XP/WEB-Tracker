// Every kind of update, made through the screens, must show up everywhere it should.
// Usage: node tests/propagation.test.js <preview.html>   (LIVE=<export dir>, default .live)
// The preview runs the real app on a copy of exported data (docs/feature_map/make_preview.py). Nothing is saved.
const path = require('path');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const preview = path.resolve(process.argv[2]);
const results = [];
const check = (area, what, ok, detail = '') => results.push({ area, what, ok: !!ok, detail });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**/fonts.*/**', r => r.abort());
  p.setDefaultTimeout(5000);
  const closeAllSafe = async () => { try { await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(150) } catch (e) {} };
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  const url = 'file://' + preview;
  await p.goto(url + '#overview'); await p.evaluate(() => localStorage.setItem('vt-rows', '0')); await p.reload(); await p.waitForTimeout(500);
  const go = async h => { await p.evaluate(h => { location.hash = h }, h); await p.waitForTimeout(250); };
  const text = sel => p.$eval(sel, e => e.innerText).catch(() => '');
  const mainText = () => text('main');
  const railGroup = name => p.evaluate(name => { let g = ''; const out = {}; for (const el of document.querySelectorAll('.rail h3, .rail .blink')) { if (el.tagName === 'H3') g = (el.querySelector('.rgl') || el).innerText.trim(); else out[[...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()] = g } return out[name] }, name);
  const tile = async label => { await go('overview'); return p.evaluate(l => { for (const t of document.querySelectorAll('.tile, .it')) if (t.innerText.toLowerCase().includes(l.toLowerCase())) { const leg = t.querySelectorAll('.itleg b'); if (leg.length) return [...leg].reduce((a, b) => a + +b.innerText, 0); const h = t.querySelector('.ithero b') || t.querySelector('b'); return +h.innerText } return null }, label) };
  const planColumn = async name => { await go('overview/plan'); return p.evaluate(n => { for (const w of document.querySelectorAll('.week')) for (const c of w.querySelectorAll('.chip .nm')) if (c.innerText === n) return w.querySelector('h3').innerText; return null }, name) };
  const overviewRow = async name => { if (!/^#overview\/all/.test(await p.evaluate(() => location.hash))) await go('overview/all'); return p.evaluate(n => { const tbs = document.querySelectorAll('main table'); const last = tbs[tbs.length - 1]; if (!last) return ''; for (const r of last.querySelectorAll('tbody tr')) if (r.querySelector('.bname') && r.querySelector('.bname').innerText === n) return r.innerText.replace(/\s+/g, ' '); return '' }, name) };
  const openBrandEditor = async id => { await go('brand-' + id); await p.click('.hero [data-act=open][data-kind=brand]'); await p.waitForTimeout(200) };
  const ctab = async v => { const b = await p.$(`[data-act=campview][data-v=${v}]`); if (b) { await b.click(); await p.waitForTimeout(150) } };
  const openMore = () => p.evaluate(() => { const d = document.getElementById('cb-more'); if (d) d.open = true });
  const drawerSave = async () => { const s = await p.$('#drawer [data-act=dsave]'); if (s && await s.isVisible()) await s.click(); else await p.click('#drawer [data-act=close]').catch(() => p.keyboard.press('Escape')); await p.waitForTimeout(350) };
  const view = async (k, v) => { const b = await p.$(`[data-act=${k}][data-v="${v}"]`); if (b) { await b.click(); await p.waitForTimeout(200) } };
  const setMe = async name => { await p.selectOption('[data-act=viewas]', name); await p.waitForTimeout(250) };

  // 1. Brand stage to On Hold (MUMUK)
  try {
  await go('overview');
  var active0 = await tile('active brands');
  await openBrandEditor('mumuk'); await p.selectOption('#d-stage', 'On Hold'); await drawerSave();
  await go('overview');
  check('Brand stage On Hold', 'Left menu moves it under On Hold', (await railGroup('MUMUK') || '').toUpperCase() === 'ON HOLD', await railGroup('MUMUK'));
  check('Brand stage On Hold', 'Overview health says On Hold', (await overviewRow('MUMUK')).includes('On Hold'));
  check('Brand stage On Hold', 'Active brands tile drops by 1', (await tile('active brands')) === active0 - 1, `${active0} to ${await tile('active brands')}`);
  check('Brand stage On Hold', 'SOW signing plan shows it under On hold, not a week', (await planColumn('MUMUK')) === 'On hold', await planColumn('MUMUK'));
  await go('sow'); await view('sowview', 'list');
  check('Brand stage On Hold', 'SOW tracker tags it Brand on hold', await p.evaluate(() => [...document.querySelectorAll('table.sowl tbody tr')].some(r => r.innerText.startsWith('MUMUK') && /On hold/.test(r.innerText))));
  await go('brand-mumuk');
  check('Brand stage On Hold', 'Brand page shows the on hold notice', (await mainText()).includes('is on hold'));
  check('Brand stage On Hold', 'Brand page SOW tile says On hold', (await text('.troad')).includes('On hold'));
  await setMe('Cyrus'); await go('mine');
  await view('minetab', 'onboarding');
  await p.selectOption('#m-cols','brand'); await p.waitForTimeout(150);
  check('Brand stage On Hold', 'My tasks: its brand column is greyed as On hold and sorted last', await p.evaluate(() => { const cs = [...document.querySelectorAll('.mineb .kcol')]; const c = cs.find(x => x.querySelector('header .bname') && x.querySelector('header .bname').innerText === 'MUMUK'); return !!c && c.classList.contains('held') && cs.indexOf(c) === cs.length - 1 }));
  } catch (e) { check('1. Brand stage to On Hold', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 2. Paused flag (Sourced Food Co.) counts as on hold too
  try {
  await openBrandEditor('sourced-food-co'); await p.selectOption('#d-paused', 'Yes'); await drawerSave();
  await go('overview');
  check('Paused flag', 'Overview health says On Hold', (await overviewRow('Sourced Food Co.')).includes('On Hold'));
  check('Paused flag', 'SOW plan shows it under On hold', (await planColumn('Sourced Food Co.')) === 'On hold', await planColumn('Sourced Food Co.'));
  } catch (e) { check('2. Paused flag', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 3. SOW stage changed on the SOW tracker (IDEO to Blocked, needs a reason)
  try {
  await go('sow'); await view('sowview', 'list');
  await p.selectOption('select[data-kind=sow][data-id=ideo]', 'Blocked'); await p.waitForTimeout(200);
  // the blocker box only opens when the SOW has no blocker written yet
  var ideoBlocker = 'Waiting on founder';
  if (await p.isVisible('#b-text')) { await p.fill('#b-text', ideoBlocker); await p.selectOption('#b-person', 'Ben'); await p.click('#bform button[type=submit]'); await p.waitForTimeout(350) }
  else ideoBlocker = JSON.parse(require('fs').readFileSync(path.join(process.env.LIVE || '.live', 'sow', 'ideo.json'))).blocker;
  await go('overview');
  check('SOW stage', 'Overview SOW column shows Blocked', (await overviewRow('IDEO')).includes('Blocked'));
  await go('overview/plan'); check('SOW stage', 'Signing plan chip shows Blocked tag', await p.evaluate(() => [...document.querySelectorAll('.week .chip')].some(c => c.innerText.includes('IDEO') && c.querySelector('.tag.bad'))));
  check('SOW stage', 'Brand health turns Blocked', (await overviewRow('IDEO')).includes('IDEO Best Practices + Briefs Blocked'));
  await go('brand-ideo'); await p.click('.rsub [data-tab=sow]'); await p.waitForTimeout(150);
  check('SOW stage', 'Brand SOW tab shows the blocker', !!ideoBlocker && (await mainText()).includes(ideoBlocker.slice(0, 30)), ideoBlocker);
  } catch (e) { check('3. SOW stage changed on the SOW tracker', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 4. SOW target date moves the signing plan week (Setosa to next week)
  try {
  var nd = new Date(); nd.setDate(nd.getDate() + 7); const iso = nd.toISOString().slice(0, 10);
  await go('sow'); await view('sowview', 'list'); await p.click('[data-act=open][data-kind=sow][data-id=setosa-skincare]'); await p.waitForTimeout(200);
  await p.fill('#d-target_sign', iso); await drawerSave();
  await go('overview');
  check('SOW target date', 'Signing plan moves it to Next week', (await planColumn('Setosa Skincare')) === 'Next week', await planColumn('Setosa Skincare'));
  } catch (e) { check('4. SOW target date moves the signing plan week', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 5. Task status to Blocked, with reason, on a brand that was On Track (CELF)
  try {
  await go('overview'); const celf0 = await overviewRow('CELF');
  await go('brand-celf'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board');
  await p.click('main .kc'); await p.waitForTimeout(250); await p.selectOption('#d-status', 'Blocked'); if (await p.$('[data-act=dsave]')) await p.click('[data-act=dsave]'); await p.waitForTimeout(250);
  await p.fill('#b-text', 'Need founder files'); await p.selectOption('#b-person', 'Cat'); await p.click('#bform button[type=submit]'); await p.waitForTimeout(350);
  await go('overview');
  check('Task blocked', 'Brand health turns Has blockers (or Blocked if the task is High or Urgent)', !celf0.includes('Blocked') && !celf0.includes('Has blockers') && /Has blockers|Blocked/.test(await overviewRow('CELF')), (await overviewRow('CELF')).slice(0, 60));
  check('Task blocked', 'Left menu dot turns red', await p.evaluate(() => [...document.querySelectorAll('.rail .blink')].some(a => [...a.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() === 'CELF' && a.querySelector('.dot.h-Blocked, .dot.h-Hasblockers'))));
  await go('brand-celf'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board'); await p.click('[data-act=dept][data-dep=""]').catch(() => {}); await p.waitForTimeout(150);
  check('Task blocked', 'Board shows the card as blocked with its reason', (await text('.kc.kc-bad')).includes('Need founder files'));
  } catch (e) { check('5. Task status to Blocked, with reason, on a brand that was On Track', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 6. Task deadline in the past makes it late (Tiny Wins)
  try {
  await go('brand-tiny-wins'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board');
  await p.click('main .kc'); await p.waitForTimeout(200);
  var past = new Date(); past.setDate(past.getDate() - 2); await p.fill('#d-deadline', past.toISOString().slice(0, 10)); await drawerSave();
  await go('overview');
  check('Task deadline', 'Brand health turns At Risk', (await overviewRow('Tiny Wins')).includes('At Risk'), (await overviewRow('Tiny Wins')).slice(0, 60));
  await go('brand-tiny-wins/tasks'); await p.waitForTimeout(150);
  check('Task deadline', 'Card shows a red due date', !!(await p.$('.kc .kbg.bad')));
  } catch (e) { check('6. Task deadline in the past makes it late', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 7. Step Done updates onboarding % (ORA, first open step)
  try {
  await go('brand-ora'); await p.click('.rsub [data-tab=sow]'); await p.waitForTimeout(200);
  var pct = async () => +(((await text('.rsub [data-tab=sow]')).match(/(\d+)%/) || [])[1] || -1);
  var open = await p.$$eval('select[data-code]', els => els.filter(e => !['Done', 'N/A'].includes(e.value)).map(e => e.dataset.code));
  var pct0 = await pct();
  await p.selectOption(`select[data-code="${open[0]}"]`, 'Done'); await p.waitForTimeout(300);
  var pct1 = await pct();
  check('Step done', 'Brand header onboarding % goes up', pct1 > pct0, `${open[0]}: ${pct0}% to ${pct1}%`);
  await go('overview');
  check('Step done', 'Overview onboarding column goes up', (await overviewRow('ORA')).includes(pct1 + '%'));
  } catch (e) { check('7. Step Done updates onboarding %', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 8. Step owner + blocker reach My tasks and the brand header (ORA, next open step)
  try {
  await go('brand-ora'); await p.click('.rsub [data-tab=sow]'); await p.waitForTimeout(150);
  open[1] = (await p.$$eval('select[data-code]', els => els.filter(e => !['Done', 'N/A'].includes(e.value)).map(e => e.dataset.code)))[0];
  var stepName = await p.$eval(`select[data-code="${open[1]}"]`, e => e.closest('tr, .step, li, div').innerText.split('\n')[0].trim()).catch(() => '');
  var blocked0 = await p.evaluate(() => [...document.querySelectorAll('.step .blk')].length);
  await p.click(`[data-act=open][data-kind=step][data-code="${open[1]}"]`); await p.waitForTimeout(200);
  await p.selectOption('#d-owner', 'Noopur'); await p.fill('#d-blk_text', 'Founder not replying'); await p.selectOption('#d-blk_person', 'Ben'); await drawerSave();
  await go('brand-ora'); check('Step blocker', 'Brand health tile counts the blocked step', (await text('.bt.health')).includes((blocked0 + 1) + ' onboarding step' + (blocked0 ? 's' : '') + ' blocked'), await text('.bt.health'));
  await setMe('Noopur'); await go('mine');
  await view('minetab', 'onboarding');
  await p.selectOption('#m-cols','brand'); await p.waitForTimeout(150);
  check('Step owner', 'My tasks shows the step as blocked in the ORA column', await p.evaluate(code => { const c = [...document.querySelectorAll('.mineb .kcol')].find(x => x.querySelector('header .bname') && x.querySelector('header .bname').innerText === 'ORA'); return !!c && [...c.querySelectorAll('.kc')].some(i => i.innerText.includes(code) && !!i.querySelector('.blk')) }, open[1]));
  } catch (e) { check('8. Step owner + blocker reach My tasks and the brand header', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 9. Platform access Blocked turns brand Blocked (Bespoke row)
  try {
  await go('access'); await view('simple', '0'); await p.click('[data-act=accq][data-v=open]'); await p.click('[data-act=accb][data-id=bespoke]'); await p.waitForTimeout(150); await p.selectOption('select[data-kind=access]', 'Blocked'); await p.waitForTimeout(250);
  if (await p.$('#bform')) { await p.fill('#b-text', 'Login not shared'); await p.selectOption('#b-person', 'Ash Ghorab'); await p.click('#bform button[type=submit]'); await p.waitForTimeout(300) }
  await go('overview');
  check('Platform access', 'Access column says Blocked', /Blocked/.test((await overviewRow('Bespoke')).split('Live')[1] || ''));
  } catch (e) { check('9. Platform access Blocked turns brand Blocked', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 10. BP section Blocked (KNDZ)
  try {
  await go('brand-kndz'); await p.click('.rsub [data-tab=bp]'); await p.waitForTimeout(150);
  await p.selectOption('select[data-act=bpsec][data-sec="Paid Amazon"]', 'Blocked'); await p.waitForTimeout(300);
  await go('bp');
  check('BP section', 'BP grid shows KNDZ overall Blocked', await p.evaluate(() => [...document.querySelectorAll('main tbody tr')].some(r => r.innerText.startsWith('KNDZ') && r.innerText.includes('Blocked'))));
  await go('overview');
  check('BP section', 'Brand health turns Blocked', (await overviewRow('KNDZ')).includes('KNDZ Founder Workshops Blocked'));
  } catch (e) { check('10. BP section Blocked', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 11. Task team change moves it between cards (Eco Protein)
  try {
  await go('brand-eco-protein'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board'); const moved = await p.$eval('main .kc', e => e.dataset.id);
  await p.click('main .kc'); await p.waitForTimeout(200); await openMore(); await p.selectOption('#d-department', 'Finance'); await drawerSave();
  check('Task team', 'Card moves to the Finance list', !!(await p.$(`.kcol:has(.kname:text-is("Finance")) .kc[data-id="${moved}"]`)));
  } catch (e) { check('11. Task team change moves it between cards', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 12. Brand lead and next step reach the Overview
  try {
  await openBrandEditor('daisyface-skincare'); await p.selectOption('#d-lead', 'Cat'); await p.fill('#d-next_step', 'Book kickoff call'); await drawerSave();
  await go('overview');
  check('Brand lead / next step', 'Overview shows new lead', (await overviewRow('Daisyface Skincare')).endsWith('Cat'));
  check('Brand lead / next step', 'Overview shows new next step', (await overviewRow('Daisyface Skincare')).includes('Book kickoff call'));
  } catch (e) { check('12. Brand lead and next step reach the Overview', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 13. Taking a brand off hold brings it back everywhere (MUMUK)
  try {
  await openBrandEditor('mumuk'); await p.selectOption('#d-stage', 'Best Practices + Briefs'); await drawerSave();
  await go('overview');
  check('Off hold again', 'Back in the signing plan weeks', !['On hold', null].includes(await planColumn('MUMUK')), await planColumn('MUMUK'));
  check('Off hold again', 'Health no longer On Hold', !(await overviewRow('MUMUK')).includes('On Hold'));
  } catch (e) { check('13. Taking a brand off hold brings it back everywhere', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 14. SOW progress board: a square opens its steps, changing them recolours the square and moves onboarding % (CELF, W1)
  try {
  var lastPct = t => { const m = [...t.matchAll(/(\d+)%/g)]; return m.length ? +m[m.length - 1][1] : -1 };
  await go('overview'); const celfPct0 = lastPct(await overviewRow('CELF'));
  await go('sow'); await view('sowview', 'board');
  var sq = 'button.bd[data-b=celf][data-c="1.0"]';
  var sqBefore = await p.$eval(sq, e => e.className);
  await p.click(sq); await p.waitForTimeout(250);
  for (const c of await p.$$eval('#drawer select[data-code]', ss => ss.map(x => x.dataset.code))) { await p.selectOption(`#drawer select[data-code="${c}"]`, 'Done'); await p.waitForTimeout(250) }
  await p.click('[data-act=close]'); await p.waitForTimeout(200);
  check('SOW board', 'Square turns Done after its steps are Done', !sqBefore.includes('bd-done') && (await p.$eval(sq, e => e.className)).includes('bd-done'), sqBefore);
  await go('overview');
  check('SOW board', 'Overview onboarding % goes up', lastPct(await overviewRow('CELF')) > celfPct0, celfPct0 + ' to ' + lastPct(await overviewRow('CELF')));
  } catch (e) { check('14. SOW progress board: a square opens its steps, changing them recolours the square and moves onboarding %', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 15. Platform access grid: + adds a platform for a brand, editing it updates the grid (CELF TikTok Ads)
  try {
  await go('access'); await view('simple', '1');
  var plus = 'button.acd-empty[data-b=celf][data-p="TikTok Ads"]';
  check('Access grid', 'Untracked platform shows a +', !!(await p.$(plus)));
  await p.click(plus); await p.waitForTimeout(350);
  await p.selectOption('#d-status', 'Granted'); await drawerSave(); await p.click('[data-act=close]').catch(() => {}); await p.waitForTimeout(200);
  await go('access');
  check('Access grid', 'New square shows Granted', await p.evaluate(() => [...document.querySelectorAll('main tbody tr')].some(r => r.innerText.startsWith('CELF') && r.querySelector('button.acd.s-ok'))));
  await go('brand-celf'); await p.click('.rsub [data-tab=access]'); await p.waitForTimeout(150);
  check('Access grid', 'Brand access tab lists the new row', (await mainText()).includes('TikTok Ads'));


  await view('simple', '0');
  } catch (e) { check('15. Platform access grid: + adds a platform for a brand, editing it updates the grid', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 16. Search finds a brand and a task and takes you there
  try {
  await go('overview'); await p.click('#q'); await p.keyboard.type('Seoul'); await p.waitForTimeout(150);
  check('Search', 'Brand result shows', (await text('#sres')).includes('Seoul Tonic'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  check('Search', 'Enter opens the first result', await p.evaluate(() => location.hash) === '#brand-seoul-tonic');
  var anyTask = await p.evaluate(() => { const t = Object.values(window.__SEED.tasks).find(t => t.title && t.brand && t.status !== 'Complete' && t.title.length > 12); return t.title });
  await p.click('#q'); await p.keyboard.type(anyTask.slice(0, 12)); await p.waitForTimeout(150);
  var taskRow = await p.$$eval('#sres .sr-row', rs => rs.findIndex(r => r.innerText.toLowerCase().startsWith('task')));
  await (await p.$$('#sres .sr-row'))[taskRow].click(); await p.waitForTimeout(400);
  check('Search', 'Task result opens its brand page with the task highlighted', !!(await p.$('.kc.flash')));
  } catch (e) { check('16. Search finds a brand and a task and takes you there', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 17. Sort the brands table
  try {
  await go('overview/all'); await p.click('[data-act=sort][data-k=health]'); await p.waitForTimeout(150);
  var firstH = await p.evaluate(() => { const tbs = document.querySelectorAll('main table'); return tbs[tbs.length - 1].querySelector('tbody tr td:nth-child(3)').innerText.trim() }).catch(() => '');
  check('Sort', 'Sorting by health puts Blocked first', firstH === 'Blocked', firstH);
  await p.click('[data-act=sort][data-k=health]'); await p.waitForTimeout(150);
  var firstH2 = await p.evaluate(() => { const tbs = document.querySelectorAll('main table'); return tbs[tbs.length - 1].querySelector('tbody tr td:nth-child(3)').innerText.trim() }).catch(() => '');
  check('Sort', 'Clicking again reverses it', firstH2 !== 'Blocked', firstH2);
  } catch (e) { check('17. Sort the brands table', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 18. A past SOW target shows in Needs attention
  try {
  await go('sow'); await view('sowview', 'list'); await p.click('[data-act=open][data-kind=sow][data-id=tiny-wins]'); await p.waitForTimeout(200);
  var pastD = new Date(); pastD.setDate(pastD.getDate() - 3); await p.fill('#d-target_sign', pastD.toISOString().slice(0, 10)); await drawerSave();
  await go('overview');
  await go('overview/attention'); check('Needs attention', 'Past SOW target appears for Tiny Wins', await p.evaluate(() => [...document.querySelectorAll('.att tr')].some(r => r.innerText.includes('Past SOW target') && r.innerText.includes('Tiny Wins'))));
  } catch (e) { check('18. A past SOW target shows in Needs attention', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 19. Stage change starts the days-in-stage clock
  try {
  await openBrandEditor('celf'); await p.selectOption('#d-stage', 'Founder Workshops'); await drawerSave();
  check('Stage age', 'Brand facts show days in stage', (await text('.hero')).includes('for 0 days'));
  } catch (e) { check('19. Stage change starts the days-in-stage clock', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 20. Gate sign-off is recorded with the person and date
  try {
  await setMe('Noopur'); await go('brand-bespoke'); await p.click('.rsub [data-tab=sow]'); await p.waitForTimeout(200);
  for (const n of await p.$$('.pnode')) { if (await p.$('.step.isgate select[data-code]')) break; await n.click(); await p.waitForTimeout(150) }
  var gate = await p.$$eval('.step.isgate select[data-code]', els => { const e = els.find(x => x.offsetHeight); return e && e.dataset.code });
  await p.selectOption(`select[data-code="${gate}"]`, 'In Progress'); await p.waitForTimeout(200);
  await p.selectOption(`select[data-code="${gate}"]`, 'Done'); await p.waitForTimeout(300);
  check('Gate sign-off', 'Done gate shows Signed off by Noopur', await p.evaluate(c => { const s = document.querySelector(`select[data-code="${c}"]`).closest('.step'); return s.innerText.includes('Signed off by Noopur') }, gate));
  } catch (e) { check('20. Gate sign-off is recorded with the person and date', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 21. Comment with a mention reaches that person's My tasks
  try {
  await go('brand-kndz'); await p.click('.rsub [data-tab=updates]'); await p.waitForTimeout(150);
  await p.fill('#c-text', 'Founder sent the GF numbers, @Cat please check'); await p.click('#cform button[type=submit]'); await p.waitForTimeout(300);
  check('Comments', 'Comment shows on the brand Updates tab', (await mainText()).includes('Founder sent the GF numbers'));
  check('Comments', 'Updates tile counts it', (await text('.rsub [data-tab=updates] .n')) === '1');
  await setMe('Cat'); await go('mine');
  check('Comments', 'Mention shows in Cat\'s My tasks', await p.evaluate(() => [...document.querySelectorAll('.item.men')].some(x => x.innerText.includes('KNDZ'))));
  } catch (e) { check("21. Comment with a mention reaches that person's My tasks", "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 22. Task template: create in Settings, use on a brand
  try {
  await go('settings'); await p.click('[data-act=settab][data-tab=templates]'); await p.waitForTimeout(150);
  await p.fill('#t-name', 'UGC kickoff'); await p.selectOption('#t-vert', 'UGC'); await p.fill('#t-lines', 'Shortlist creators | Creator Partnerships | 5\nSend brief to creators | Creator Partnerships | 7');
  await p.click('#tform button[type=submit]'); await p.waitForTimeout(300);
  check('Templates', 'Template is listed', (await mainText()).includes('UGC kickoff'));
  await go('brand-ora'); await p.click('.rsub [data-tab=tasks]'); await p.click('[data-act=dept][data-dep=""]').catch(() => {}); await p.waitForTimeout(150);
  var before22 = +(await text('.rsub [data-tab=tasks] .n'));
  await p.selectOption('select[data-act=use-tpl]', '0'); await p.waitForTimeout(150); await p.click('[data-act=mok]'); await p.waitForTimeout(500);
  check('Templates', 'Using it adds 2 tasks to the brand', +(await text('.rsub [data-tab=tasks] .n')) === before22 + 2);
  } catch (e) { check('22. Task template: create in Settings, use on a brand', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 23. People page is now Org structure: the old address opens it, a person opens their edit panel
  try {
  await go('people'); await p.waitForTimeout(150);
  check('Org structure', 'The old People address opens Org structure', (await text('main h1')) === 'Org structure');
  await p.click('main [data-act=org-pick][data-name]:not([data-name=""])'); await p.waitForTimeout(200);
  check('Org structure', 'Clicking a person opens their edit panel', !!(await p.$('[data-act=person][data-f=leadership]')));
  } catch (e) { check('23. Org structure', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 24. My tasks vertical filter
  try {
  await setMe('Cat'); await go('mine'); const n24 = (await p.$$('.mineb .kc')).length;
  await p.selectOption('#m-vert', 'UGC'); await p.waitForTimeout(150);
  check('My tasks', 'Vertical filter never adds cards', (await p.$$('.mineb .kc')).length <= n24, n24 + ' to ' + (await p.$$('.mineb .kc')).length);
  await p.selectOption('#m-vert', '');
  } catch (e) { check('24. My tasks vertical filter', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 25. Founder view shows no internal data
  try {
  await go('client-bespoke');
  var internal = await p.evaluate(() => Object.values(window.__SEED.tasks).filter(t => t.brand === 'bespoke').map(t => t.title).filter(Boolean));
  var ct = await mainText();
  check('Founder view', 'No task names appear on the founder page', !internal.some(t => t.length > 8 && ct.includes(t)));
  check('Founder view', 'Download button is there', !!(await p.$('[data-act=client-dl]')));
  var nextStep = await p.evaluate(() => (window.__SEED.brands.bespoke || {}).next_step || '');
  var stepNames = await p.evaluate(() => Object.values(window.__SEED.steps).map(s => s.name).filter(n => n.length > 26));
  check('Founder view', 'Shows the founder stages with one marked current', (await p.$$('.fv .fvst')).length >= 7 && (await p.$$('.fv .fvst.fvcur')).length <= 1);
  check('Founder view', 'No internal notes or step names on the founder page', !(nextStep && ct.includes(nextStep.slice(0, 40))) && !stepNames.some(n => ct.includes(n)));
  } catch (e) { check('25. Founder view shows no internal data', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 26. Leadership is an access: only people ticked in Org structure get the Leadership page
  try {
  var noLead = await p.evaluate(() => { const ps = (window.__SEED.config.people || {}).people || []; const x = ps.find(q => q.active !== false && (q.kind || 'team') === 'team' && !q.leadership); return x ? x.name : '' });
  await setMe(noLead); await go('overview');
  check('Leadership', 'No Leadership page in the menu without the tick', !(await p.$('.nav a[href="#leadership"]')), noLead);
  await go('org'); await p.click(`main [data-act=org-pick][data-name="${noLead}"]`); await p.waitForTimeout(200);
  await p.check('[data-act=person][data-f=leadership]'); await p.waitForTimeout(300);
  check('Leadership', 'Leadership page appears in the menu once they have the tick', !!(await p.$('.nav a[href="#leadership"]')));
  await go('leadership');
  check('Leadership', 'Page opens on one screen of tiles, each opening its own page', (await text('main h1')) === 'Leadership' && (await p.$$('main a.it')).length === 9);
  await go('leadership/attention');
  check('Leadership', 'Needs attention page lists the top exceptions', (await text('main h1')) === 'Needs attention' && (await p.$$('.exc')).length > 0 && (await p.$$('.exc')).length <= 5);
  await go('org'); await p.waitForTimeout(200); if (!(await p.$('[data-act=person][data-f=leadership]'))) { await p.click(`main [data-act=org-pick][data-name="${noLead}"]`); await p.waitForTimeout(200) } await p.uncheck('[data-act=person][data-f=leadership]'); await p.waitForTimeout(300); await go('leadership');
  check('Leadership', 'Someone without the tick is sent to the Overview', (await text('main h1')) === 'Overview' && !(await p.$('.nav a[href="#leadership"]')));
  await setMe('Noopur');
  } catch (e) { check('26. Leadership is an access: only people ticked in Settings get the Leadership page', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 27. Simple / Full is back for everyone
  try {
  await go('overview/all'); await p.click('[data-act=simple][data-v="1"]'); await p.waitForTimeout(150);
  var simpleCols = await p.evaluate(() => { const t = document.querySelectorAll('main table'); return t[t.length - 1].querySelectorAll('thead th').length });
  await p.click('[data-act=simple][data-v="0"]'); await p.waitForTimeout(150);
  var fullCols = await p.evaluate(() => { const t = document.querySelectorAll('main table'); return t[t.length - 1].querySelectorAll('thead th').length });
  check('Simple / Full', 'Simple shows fewer columns than Full', simpleCols < fullCols, `${simpleCols} vs ${fullCols}`);
  } catch (e) { check('27. Simple / Full is back for everyone', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 28. My tasks: board only, columns by status, brand or team, three sorts
  try {
  await setMe('Cat'); await go('mine'); await view('minetab', 'all');
  check('My tasks', 'No List switch and no Simple / Full switch on My tasks', !(await p.$('[data-act=mlayout]')) && !(await p.$('#topbar [data-act=simple]')));
  await p.selectOption('#m-cols','status'); await p.waitForTimeout(150);
  await p.selectOption('#m-sort', 'priority'); await p.waitForTimeout(150);
  var cardInfo = () => p.$$eval('.mineb .kcol', cs => cs.map(c => [...c.querySelectorAll('.kc[data-pri]')].map(k => ({ held: +k.dataset.held, pri: +k.dataset.pri, due: k.dataset.due, brand: k.dataset.brand }))).filter(a => a.length));
  var pord = (await cardInfo()).map(a => a.map(k => k.held * 100 + k.pri));
  check('My tasks', 'Sort by priority: Urgent to Low inside every column (on-hold brands last)', pord.every(a => a.every((x, i) => i === 0 || a[i - 1] <= x)), JSON.stringify(pord.slice(0, 3)));
  await p.selectOption('#m-sort', 'due'); await p.waitForTimeout(150);
  var dord = (await cardInfo()).map(a => a.map(k => k.held + (k.due || '9999')));
  check('My tasks', 'Sort by deadline: soonest first, no date last, inside every column (on-hold brands last)', dord.every(a => a.every((x, i) => i === 0 || a[i - 1] <= x)), JSON.stringify(dord.slice(0, 2)));
  await p.selectOption('#m-sort', 'brand'); await p.waitForTimeout(150);
  var bord = (await cardInfo()).map(a => a.map(k => k.brand));
  check('My tasks', 'Sort by brand A to Z inside every column', bord.every(a => a.every((x, i) => i === 0 || a[i - 1].localeCompare(x) <= 0)));
  await p.selectOption('#m-sort', 'due');
  await p.selectOption('#m-cols','brand'); await p.waitForTimeout(150);
  var bcols = await p.$$eval('.mineb .kcol', cs => cs.map(c => [c.querySelector('header .bname') ? c.querySelector('header .bname').innerText : '', [...c.querySelectorAll('.kc')].map(k => k.dataset.brand)]));
  check('My tasks', 'Brand columns: one column per brand holding only that brand', bcols.length > 1 && bcols.every(([n, a]) => a.every(x => x === n)), bcols.map(x => x[0]).join(', '));
  await p.selectOption('#m-cols','team'); await p.waitForTimeout(150);
  var tcols = await p.$$eval('.mineb .kcol header b', e => e.map(x => x.innerText));
  check('My tasks', 'Team columns: one per team, steps and access in their own', tcols.length > 0, tcols.join(', '));
  check('My tasks', 'Every step and access card says why it is yours', await p.$$eval('.mineb .kc[data-kind=step], .mineb .kc[data-kind=access]', ks => ks.every(k => /Your step|Your access step|You own|You support/.test(k.innerText))));
  check('My tasks', 'Your update shows the four number cards', (await p.$$('.mstat .mst')).length === 4);
  await p.selectOption('#m-cols','status'); await p.waitForTimeout(150);
  var bcol = await p.$$eval('.kcol', cs => cs.map(c => c.querySelector('header b').innerText));
  check('My tasks', 'Board shows a column per status', bcol.includes('In Progress') && bcol.includes('Blocked'), bcol.join(', '));
  var card = await p.$('.kcol:not(.kbad) .kc select[data-kind=task]:not([disabled])');
  if (card) { await card.selectOption('Blocked'); await p.waitForTimeout(150); if (await p.$('#bform:not([hidden]) #b-text')) { await p.fill('#b-text', 'Waiting on assets'); await p.selectOption('#b-person', 'Ben'); await p.click('#bform button[type=submit]'); await p.waitForTimeout(300) } }
  check('My tasks', 'Changing status on a card moves it to that column', !card || await p.$$eval('.kcol.kbad .kc', cs => cs.some(c => c.innerText.includes('Waiting on assets'))));
  } catch (e) { check('28. My tasks: board only, columns by status, brand or team, three sorts', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 29. Best Practices: click a dot, pick a status, it saves and shows everywhere
  try {
  await go('bp'); await p.click('[data-act=bpgroup][data-g="*"]'); await p.waitForTimeout(150); const dotSel = 'button[data-act=bpdot][data-id=sourced-food-co][data-sec="SEO"]';
  await p.$eval(dotSel, e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(150); await p.click(dotSel); await p.waitForTimeout(120);
  check('BP dot', 'Clicking a dot opens a status menu', !!(await p.$('#pop')));
  await p.click('#pop [data-v="Complete"]'); await p.waitForTimeout(250);
  check('BP dot', 'Choosing a status closes the menu and updates the dot', !(await p.$('#pop')) && (await p.$eval(dotSel, e => e.title)) === 'SEO: Complete');
  check('BP dot', 'Progress count goes up', (await p.evaluate(() => [...document.querySelectorAll('main tbody tr')].find(r => r.innerText.startsWith('Sourced Food Co.')).innerText)).includes('1/17'));
  await go('brand-sourced-food-co'); await p.click('.rsub [data-tab=bp]'); await p.waitForTimeout(150);
  check('BP dot', 'Brand Best Practices tab shows the same status', await p.$eval('select[data-act=bpsec][data-sec="SEO"]', e => e.value) === 'Complete');
  await go('bp'); await p.click(dotSel); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  check('BP dot', 'Escape closes the menu without changing anything', !(await p.$('#pop')) && (await p.$eval(dotSel, e => e.title)) === 'SEO: Complete');
  await p.click('[data-act=bpf][data-v=blocked]'); await p.waitForTimeout(150);
  check('BP dot', 'Blocked filter shows only blocked brands', await p.$$eval('main tbody tr', rs => rs.length > 0 && rs.every(r => r.innerText.includes('Blocked'))));
  await p.click('[data-act=bpf][data-v=all]');
  } catch (e) { check('29. Best Practices: click a dot, pick a status, it saves and shows everywhere', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 30. Platform access: steps, next step, chase, logins, thread, founder message, BP lock
  try {
  await setMe('Noopur'); await go('access'); await view('simple', '0'); await p.click('[data-act=accq][data-v=open]'); await p.click('[data-act=accb][data-id=eco-protein]'); await p.waitForTimeout(150);
  var row = 'tr[data-kind=access][data-id="eco-protein-meta-ads-manager"] td:first-child';
  await p.click(row); await p.waitForTimeout(250);
  check('Access', 'Row opens with the 5 steps shown', (await text('.stepper')).includes('Team confirmed'));
  await p.fill('#d-ns_text', 'Noopur to ask Andy for Meta partner access'); await p.selectOption('#d-ns_who', 'Noopur');
  await p.click('[data-act=chase]'); await p.waitForTimeout(250);
  check('Access', 'Logging a chase moves Needed to Asked founder and keeps unsaved edits', await p.$eval('#d-status', e => e.value) === 'Asked founder' && await p.$eval('#d-ns_text', e => e.value).then(v => v.startsWith('Noopur to ask')));
  check('Access', 'Chase shows in the thread', (await text('.thread')).includes('Chased the founder by WhatsApp'));
  await p.fill('#acc-c', '@Ash Ghorab founder says tonight'); await p.click('[data-act=acc-post]'); await p.waitForTimeout(250);
  check('Access', 'Comment shows in the thread', (await text('.thread')).includes('founder says tonight'));
  await p.selectOption('#seat-p', 'Paras'); await p.click('[data-act=seat-add]'); await p.waitForTimeout(250);
  await p.selectOption('[data-act=seat][data-i="0"]', 'Has login'); await p.waitForTimeout(250);
  check('Access', 'Team login added and set to Has login', (await text('.seatedit')).includes('Paras') && (await text('.thread')).includes('Paras: Asked to Has login'));
  await drawerSave();
  check('Access', 'Full view shows the next step and the login', await p.evaluate(() => { const r = document.querySelector('tr[data-id="eco-protein-meta-ads-manager"]'); return r.innerText.includes('Noopur to ask Andy') && r.innerText.includes('Paras') }));
  await go('mine'); await view('minetab', 'all');
  check('Access', 'Next step shows in Noopur\'s My tasks', (await mainText()).includes('Meta Ads Manager: Noopur to ask Andy'));
  await setMe('Ash Ghorab'); await go('mine');
  check('Access', 'Mention reaches Ash', await p.evaluate(() => [...document.querySelectorAll('.item.men')].some(x => x.innerText.includes('Meta Ads Manager'))));
  await setMe('Noopur'); await go('brand-celf'); await p.click('.rsub [data-tab=access]'); await p.waitForTimeout(150);
  await p.click('main [data-act=fm-open]'); await p.waitForTimeout(150);
  var msg = await p.$eval('#fm-text', e => e.value);
  check('Access', 'Founder message lists every missing platform', /Google Ads/.test(msg) && /Meta Ads Manager/.test(msg) && /Amazon Seller Central/.test(msg));
  await p.click('[data-act=fm-asked]'); await p.waitForTimeout(400);
  check('Access', 'Mark as Asked founder updates all of them', await p.$$eval('main select[data-kind=access]', ss => ss.length > 0 && ss.filter(s => s.value === 'Asked founder').length >= 3));
  await go('bp');
  var lockBefore = await p.$eval('button[data-act=bpdot][data-id=eco-protein][data-sec="Paid Meta"]', e => e.className.includes('bp-Locked'));
  await go('access'); await p.selectOption('select[data-kind=access][data-id="eco-protein-meta-ads-manager"]', 'Granted'); await p.waitForTimeout(250);
  await go('bp');
  var readyAfter = await p.$eval('button[data-act=bpdot][data-id=eco-protein][data-sec="Paid Meta"]', e => e.className.includes('bp-Ready'));
  check('Access', 'BP section is locked until access is granted, then ready to start', lockBefore && readyAfter, `${lockBefore} ${readyAfter}`);
  await go('overview');
  await go('overview/attention'); check('Access', 'Needs attention lists founders to chase', await p.evaluate(() => [...document.querySelectorAll('.att tr')].some(r => r.innerText.includes('Chase founder'))));
  } catch (e) { check('30. Platform access: steps, next step, chase, logins, thread, founder message, BP lock', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 31. Campaigns: add one, move tasks in, timeline, dependencies, team cards, section tiles
  try {
  await go('brand-celf'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board');
  check('Campaigns', 'Brand with no campaigns shows its board and offers Add campaign', !!(await p.$('main [data-act=add-camp]')) && !!(await p.$('.kb .kcol')));
  await p.click('[data-act=add-camp]'); await p.fill('#n-cn', 'Spring launch'); await p.fill('#n-cp', 'Launch the spring range with creators and paid'); await p.fill('#n-cs', '2026-10-01'); await p.fill('#n-ce', '2026-11-15');
  await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  check('Campaigns', 'New campaign opens with what it is for', (await text('.cbox')).includes('Launch the spring range'));
  check('Campaigns', 'Brand bar shows the path and counts the campaign', (await text('.vcrumb')).includes('Spring launch') && (await text('.rsub [data-tab=tasks]')).replace(/\s+/g, ' ').trim() === 'Campaigns 1');
  await p.click('[data-act=camp][data-id=""]'); await p.waitForTimeout(150);
  await p.click('[data-act=camp][data-id=_none]'); await p.waitForTimeout(200); await ctab('board');
  await p.click('.kc'); await p.waitForTimeout(250);
  var campOpt = await p.$eval('#d-campaign', e => [...e.options].find(o => o.text === 'Spring launch').value);
  await openMore(); await p.selectOption('#d-campaign', campOpt); await p.fill('#d-start', '2026-10-05'); await p.fill('#d-deadline', '2026-10-20'); await drawerSave();
  await p.click('.crumb [data-act=camp][data-id=""]'); await p.waitForTimeout(150);
  await p.click(`[data-act=camp][data-id="${campOpt}"]`); await p.waitForTimeout(250); await ctab('timeline');
  check('Campaigns', 'Moved task shows on the campaign timeline: a team bar, and its own bar once the team is opened', !!(await p.$('.gantt .gteam2 .gsum')) && await (async () => { await p.click('.gteam2'); await p.waitForTimeout(200); const ok = !!(await p.$('.gantt .gsub .gb')); await p.click('.gteam2'); await p.waitForTimeout(150); return ok })());
  await ctab('board');
  check('Campaigns', 'Campaign board has one list, for the team that owns the moved task, with the card in it', (await p.$$('.kb section.kcol')).length === 1 && (await p.$$('.kb .kc')).length === 1);
  check('Campaigns', 'No dependency box on the campaign page', !(await p.$('.deps')));
  await p.click('.crumb [data-act=camp]'); await p.waitForTimeout(150);
  check('Campaigns', 'Breadcrumb goes back to the campaign list', !!(await p.$('.clist')));
  await go('mine'); await go('brand-celf');
  } catch (e) { check('31. Campaigns: add one, move tasks in, timeline, dependencies, team cards, section tiles', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 32. Board: lists per team, add and rename a list, drag cards between lists, card back
  try {
  await go('brand-celf'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board'); await p.click('[data-act=camp][data-id=_none]'); await p.waitForTimeout(200); await ctab('board');
  var teamNames = await p.evaluate(() => window.__SEED.config.lists.department);
  check('Board', 'One list per team that has cards, named after the team', await p.$$eval('.kname', (e, t) => e.length > 0 && e.every(x => t.includes(x.innerText)), teamNames));
  await p.click('[data-act=kl-add]'); await p.fill('#n-ln', 'Shoot day'); await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  check('Board', '+ Add another list adds a named list', (await p.$$eval('.kname', e => e.map(x => x.innerText))).includes('Shoot day'));
  var kcard = await p.$eval('.kcards .kc', e => e.dataset.id);
  await p.evaluate(() => { const kb = document.querySelector('.kb'); kb.scrollLeft = kb.scrollWidth });
  await p.locator(`.kc[data-id="${kcard}"]`).dragTo(p.locator('.kcol:has(.kname:text-is("Shoot day")) .kcards')); await p.waitForTimeout(400);
  check('Board', 'Dragging a card into the new list moves it there and shows its team label', (await text('.kcol:has(.kname:text-is("Shoot day"))')).includes((await p.evaluate(id => window.__SEED.tasks[id] && window.__SEED.tasks[id].department, kcard)) || ''));
  check('Board', 'Card stays in the list after a redraw', !!(await p.$(`.kcol:has(.kname:text-is("Shoot day")) .kc[data-id="${kcard}"]`)));
  await p.click('.kname:text-is("Shoot day")'); await p.fill('#n-ln', 'Shoot week'); await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  check('Board', 'Clicking a list name renames it', (await p.$$eval('.kname', e => e.map(x => x.innerText))).includes('Shoot week'));
  await p.click(`.kc[data-id="${kcard}"]`); await p.waitForTimeout(250);
  check('Board', 'Card back shows the move as activity', (await text('.thread')).includes('Moved to Shoot day'));
  await p.selectOption('#d-status', 'Blocked'); if (await p.$('[data-act=dsave]')) await p.click('[data-act=dsave]'); await p.waitForTimeout(300);
  if (await p.isVisible('#b-text')) { await p.fill('#b-text', 'Waiting on founder photos'); await p.selectOption('#b-person', 'Cat'); await p.click('#bform button[type=submit]') } else { await p.fill('#d-blk_text', 'Waiting on founder photos'); await p.selectOption('#d-blk_person', 'Cat'); await drawerSave() } await p.waitForTimeout(350);
  check('Board', 'Blocked card shows the reason on its front', (await text(`.kc[data-id="${kcard}"]`)).includes('Waiting on founder photos'));
  await p.click(`.kc[data-id="${kcard}"]`); await p.waitForTimeout(250);
  await p.fill('#ck-new', 'Collect photos'); await p.click('[data-act=ck-add]'); await p.waitForTimeout(300);
  await p.fill('#ck-new', 'Brief the editor'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.click('[data-act=ck][data-i="0"]'); await p.waitForTimeout(300);
  await p.fill('#task-c', '@Ash Ghorab photos come Friday'); await p.click('[data-act=task-post]'); await p.waitForTimeout(300);
  await p.click('#drawer [data-act=close]'); await p.waitForTimeout(200);
  var front = await text(`.kc[data-id="${kcard}"]`);
  check('Board', 'Card front shows checklist 1/2 and 1 comment', front.includes('1/2') && /\b1\b/.test(front.split('1/2')[1] || ''), front.replace(/\n/g, ' '));
  await p.click('.kcol:has(.kname:text-is("Shoot week")) [data-act=kb-add]'); await p.fill('#n-title', 'New board card'); await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  check('Board', '+ Add a card adds it to that list', (await text('.kcol:has(.kname:text-is("Shoot week"))')).includes('New board card'));
  await p.selectOption('[data-act=kbf][data-k=who]', 'Cat'); await p.waitForTimeout(200);
  check('Board', 'Person filter keeps only their cards', await p.$$eval('.kc', cs => cs.length > 0 && cs.every(c => c.querySelector('.av[title^="Cat"]'))));
  await p.click('[data-act=kbf-clear]'); await p.waitForTimeout(150);
  await p.click('[data-act=kl-add]'); await p.fill('#n-ln', 'Spare'); await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  await p.click('.kcol:has(.kname:text-is("Spare")) [data-act=kl-del]'); await p.click('[data-act=mok]'); await p.waitForTimeout(400);
  check('Board', 'An empty list can be deleted', !(await p.$$eval('.kname', e => e.map(x => x.innerText))).includes('Spare'));
  await setMe('Ash Ghorab'); await go('mine');
  check('Board', 'Card comment mention reaches Ash', await p.evaluate(() => [...document.querySelectorAll('.item.men')].some(x => x.innerText.includes('photos come Friday'))));
  await setMe('Noopur');
  } catch (e) { check('32. Board: lists per team, add and rename a list, drag cards between lists, card back', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 33. Leadership room: escalate, decide, sign off and send back gates, launch calendar
  try {
  await setMe('Noopur'); await go('brand-celf'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board');
  await p.click('[data-act=camp][data-id=_none]'); await p.waitForTimeout(200); await ctab('board');
  var escCard = await p.$eval('.kc', e => e.dataset.id); await p.click(`.kc[data-id="${escCard}"]`); await p.waitForTimeout(250);
  await p.click('#drawer [data-act=escalate]'); await p.fill('#n-ask', 'Approve the extra shoot day'); await p.selectOption('#n-pri', 'High'); await p.fill('#n-due', '2026-12-01'); await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  check('Leadership', 'Escalated item says it is with leadership', (await text('#drawer footer')).includes('With leadership'));
  await p.click('#drawer [data-act=close]'); await p.waitForTimeout(200);
  check('Leadership', 'Card front shows With leadership', (await text(`.kc[data-id="${escCard}"]`)).includes('With leadership'));
  await go('leadership/decisions');
  check('Leadership', 'Escalation lands in Decisions', (await text('.decs')).includes('Approve the extra shoot day'));
  check('Leadership', 'Menu counts the waiting decision', +(await text('.nav a[href="#leadership"] .n')) >= 1);
  await p.click('.dec:has-text("Approve the extra shoot day") [data-act=esc-decide][data-v=Agreed]'); await p.fill('#n-note', 'Yes, within budget'); await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  check('Leadership', 'Agreed escalation leaves the inbox and shows in Recently decided', !(await text('.decs')).includes('Approve the extra shoot day') && (await p.$eval('.recent', e => e.textContent).catch(() => '')).includes('Agreed'));
  await go('brand-celf'); await p.click('.rsub [data-tab=updates]'); await p.waitForTimeout(200);
  check('Leadership', 'Decision is posted on the brand Updates', (await mainText()).includes('Leadership agreed') && (await mainText()).includes('Yes, within budget'));
  for (const b of ['bespoke', 'seoul-tonic']) {
    await go('brand-' + b); await p.click('.rsub [data-tab=sow]'); await p.waitForTimeout(150);
    for (const c of ['P4.12', 'P4.16', 'P5.01', 'P5.02']) { await p.click(`.pnode[data-p="${c.split('.')[0]}"]`); await p.waitForTimeout(120); const sel = await p.$(`select[data-code="${c}"]`); if (sel && await sel.inputValue() !== 'Done') { await sel.selectOption('Done'); await p.waitForTimeout(150) } } }
  await go('leadership/decisions');
  check('Leadership', 'A gate with every earlier step done waits for sign-off', (await text('.decs')).includes('Bespoke') && (await text('.decs')).includes('P6.01'));
  await p.click('.dec:has-text("Bespoke · P6.01") [data-act=gate-ok]'); await p.waitForTimeout(400);
  check('Leadership', 'Signed-off gate leaves the inbox', !(await text('.decs')).includes('Bespoke · P6.01'));
  await p.click('.dec:has-text("Seoul Tonic · P6.01") [data-act=gate-back]'); await p.fill('#n-note', 'Pricing page missing'); await p.click('#fbox button[type=submit]'); await p.waitForTimeout(400);
  check('Leadership', 'Sent-back gate leaves the inbox', !(await text('.decs')).includes('Seoul Tonic · P6.01'));
  await go('brand-bespoke'); await p.click('.rsub [data-tab=sow]'); await p.waitForTimeout(150); await p.click('.pnode[data-p="P6"]'); await p.waitForTimeout(150);
  check('Leadership', 'Signed-off gate is Done with the leader named', (await p.$eval('select[data-code="P6.01"]', e => e.value)) === 'Done' && (await mainText()).includes('Signed off by Noopur'));
  await p.click('[data-act=open][data-kind=step][data-code="P6.01"]').catch(() => {}); await go('brand-seoul-tonic'); await p.click('.rsub [data-tab=sow]'); await p.waitForTimeout(150); await p.click('.pnode[data-p="P6"]'); await p.waitForTimeout(150);
  await p.click('[data-act=open][data-kind=step][data-code="P6.01"]'); await p.waitForTimeout(250);
  check('Leadership', 'Step owner sees why it was sent back', (await text('#drawer')).includes('Sent back by Noopur') && (await text('#drawer')).includes('Pricing page missing'));
  await p.click('#drawer [data-act=close]').catch(() => {});
  await go('leadership/launches');
  check('Leadership', 'Launch calendar shows the CELF campaign', (await text('.cal')).includes('Spring launch'));
  await p.click('.lc:has-text("Spring launch")'); await p.waitForTimeout(250);
  check('Leadership', 'Launch card opens the campaign', (await text('.cbox')).includes('Spring launch'));
  } catch (e) { check('33. Leadership room: escalate, decide, sign off and send back gates, launch calendar', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  // 34. Audit fixes: campaign has its own address, Back works, keyboard way to move a card, skip link
  try {
  await go('brand-celf'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board');
  await p.click('.crow:has-text("Spring launch")'); await p.waitForTimeout(300);
  var campUrl = await p.evaluate(() => location.hash);
  check('Audit fixes', 'A campaign has its own address', /^#brand-celf\/c\//.test(campUrl), campUrl);
  await p.goBack(); await p.waitForTimeout(300);
  check('Audit fixes', 'Browser Back returns to the campaign list', (await p.evaluate(() => location.hash)) === '#brand-celf/tasks' && !!(await p.$('.clist')));
  await p.goto(url + campUrl); await p.waitForTimeout(700);
  check('Audit fixes', 'Opening the address goes straight to the campaign', (await text('.vcrumb')).includes('Spring launch'));
  await go('brand-celf'); await p.click('.rsub [data-tab=tasks]'); await p.waitForTimeout(150); await ctab('board'); await p.click('[data-act=camp][data-id=_none]'); await p.waitForTimeout(200); await ctab('board');
  var lcard = await p.$eval('.kcards .kc', e => e.dataset.id); await p.click(`.kc[data-id="${lcard}"]`); await p.waitForTimeout(250);
  var target = await p.$eval('#d-list', e => [...e.options].find(o => !o.selected).value);
  var tname = await p.$eval('#d-list', (e, v) => [...e.options].find(o => o.value === v).text, target);
  await openMore(); await p.selectOption('#d-list', target); await drawerSave();
  check('Audit fixes', 'List picker on the card back moves the card, no drag needed', !!(await p.$(`.kcol:has(.kname:text-is("${tname}")) .kc[data-id="${lcard}"]`)));
  check('Audit fixes', 'Every edit panel label is tied to its field', await p.evaluate(() => { const ls = [...document.querySelectorAll('#drawer label')]; return true }) && (await p.click(`.kc[data-id="${lcard}"]`).then(() => p.waitForTimeout(200)).then(() => p.$$eval('#drawer .f > label', ls => ls.every(l => !l.nextElementSibling || !/INPUT|SELECT|TEXTAREA/.test(l.nextElementSibling.tagName) || l.htmlFor === l.nextElementSibling.id)))));
  await p.click('#drawer [data-act=close]').catch(() => {});
  await p.keyboard.press('Tab'); await p.waitForTimeout(50);
  await go('overview'); await p.evaluate(() => document.body.focus()); await p.focus('.skip'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  check('Audit fixes', 'Skip link moves focus to the page title', await p.evaluate(() => document.activeElement && document.activeElement.tagName === 'H1'));
  check('Page', 'No script errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('34. Audit fixes: campaign has its own address, Back works, keyboard way to move a card, skip link', "block ran to the end", false, String(e.message).split("\n")[0].slice(0,120) + " @" + ((String(e.stack).match(/propagation\.test\.js:(\d+)/) || [])[1] || "?")); await closeAllSafe() }

  const failed = results.filter(r => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.area} | ${r.what}${r.ok ? '' : ' | ' + r.detail}`);
  console.log(`\n${results.length - failed.length} of ${results.length} passed`);
  await b.close(); process.exit(failed.length ? 1 : 0);
})();
