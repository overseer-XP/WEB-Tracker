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
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  const url = 'file://' + preview;
  await p.goto(url + '#overview'); await p.waitForTimeout(500);
  const go = async h => { await p.evaluate(h => { location.hash = h }, h); await p.waitForTimeout(250); };
  const text = sel => p.$eval(sel, e => e.innerText).catch(() => '');
  const mainText = () => text('main');
  const railGroup = name => p.evaluate(name => { let g = ''; const out = {}; for (const el of document.querySelectorAll('.rail h3, .rail .blink')) { if (el.tagName === 'H3') g = el.innerText.trim(); else out[[...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()] = g } return out[name] }, name);
  const tile = label => p.evaluate(l => { for (const t of document.querySelectorAll('.tile')) if (t.innerText.includes(l)) return +t.querySelector('b').innerText; return null }, label);
  const planColumn = name => p.evaluate(n => { for (const w of document.querySelectorAll('.week')) for (const c of w.querySelectorAll('.chip .nm')) if (c.innerText === n) return w.querySelector('h4').innerText; return null }, name);
  const overviewRow = name => p.evaluate(n => { const tbs = document.querySelectorAll('main table'); const last = tbs[tbs.length - 1]; if (!last) return ''; for (const r of last.querySelectorAll('tbody tr')) if (r.querySelector('.bname') && r.querySelector('.bname').innerText === n) return r.innerText.replace(/\s+/g, ' '); return '' }, name);
  const openBrandEditor = async id => { await go('brand-' + id); await p.click('.bhead [data-act=open][data-kind=brand]'); await p.waitForTimeout(200) };
  const drawerSave = async () => { await p.click('[data-act=dsave]'); await p.waitForTimeout(350) };
  const view = async (k, v) => { const b = await p.$(`[data-act=${k}][data-v=${v}]`); if (b) { await b.click(); await p.waitForTimeout(200) } };
  const setMe = async name => { await p.selectOption('#whoSel', name); await p.waitForTimeout(250) };

  // 1. Brand stage to On Hold (MUMUK)
  await go('overview');
  const active0 = await tile('active brands');
  await openBrandEditor('mumuk'); await p.selectOption('#d-stage', 'On Hold'); await drawerSave();
  await go('overview');
  check('Brand stage On Hold', 'Left menu moves it under On Hold', (await railGroup('MUMUK')) === 'ON HOLD', await railGroup('MUMUK'));
  check('Brand stage On Hold', 'Overview health says On Hold', (await overviewRow('MUMUK')).includes('On Hold'));
  check('Brand stage On Hold', 'Active brands tile drops by 1', (await tile('active brands')) === active0 - 1, `${active0} to ${await tile('active brands')}`);
  check('Brand stage On Hold', 'SOW signing plan shows it under On hold, not a week', (await planColumn('MUMUK')) === 'On hold', await planColumn('MUMUK'));
  await go('sow'); await view('sowview', 'list');
  check('Brand stage On Hold', 'SOW tracker tags it Brand on hold', (await mainText()).includes('MUMUKBrand on hold') || (await mainText()).includes('MUMUK Brand on hold'));
  await go('brand-mumuk');
  check('Brand stage On Hold', 'Brand page shows the on hold notice', (await mainText()).includes('is on hold'));
  check('Brand stage On Hold', 'Brand page target date says On hold', (await text('.facts')).includes('On hold'));
  await setMe('Cyrus'); await go('mine');
  await view('minetab', 'onboarding');
  check('Brand stage On Hold', 'My tasks: its brand card is greyed as On hold and sorted last', await p.evaluate(() => { const cs = [...document.querySelectorAll('.bcard')]; const c = cs.find(x => x.querySelector('.bname').innerText === 'MUMUK'); return !!c && c.classList.contains('held') && cs.indexOf(c) >= cs.filter(x => !x.classList.contains('held')).length }));

  // 2. Paused flag (Sourced Food Co.) counts as on hold too
  await openBrandEditor('sourced-food-co'); await p.selectOption('#d-paused', 'Yes'); await drawerSave();
  await go('overview');
  check('Paused flag', 'Overview health says On Hold', (await overviewRow('Sourced Food Co.')).includes('On Hold'));
  check('Paused flag', 'SOW plan shows it under On hold', (await planColumn('Sourced Food Co.')) === 'On hold', await planColumn('Sourced Food Co.'));

  // 3. SOW stage changed on the SOW tracker (IDEO to Blocked, needs a reason)
  await go('sow'); await view('sowview', 'list');
  await p.selectOption('select[data-kind=sow][data-id=ideo]', 'Blocked'); await p.waitForTimeout(200);
  // the blocker box only opens when the SOW has no blocker written yet
  let ideoBlocker = 'Waiting on founder';
  if (await p.isVisible('#b-text')) { await p.fill('#b-text', ideoBlocker); await p.selectOption('#b-person', 'Ben'); await p.click('#bform button[type=submit]'); await p.waitForTimeout(350) }
  else ideoBlocker = JSON.parse(require('fs').readFileSync(path.join(process.env.LIVE || '.live', 'sow', 'ideo.json'))).blocker;
  await go('overview');
  check('SOW stage', 'Overview SOW column shows Blocked', (await overviewRow('IDEO')).includes('Blocked'));
  check('SOW stage', 'Signing plan chip shows Blocked tag', await p.evaluate(() => [...document.querySelectorAll('.week .chip')].some(c => c.innerText.includes('IDEO') && c.querySelector('.tag.bad'))));
  check('SOW stage', 'Brand health turns Blocked', (await overviewRow('IDEO')).includes('IDEO Best Practices + Briefs Blocked'));
  await go('brand-ideo'); await p.click('button[data-tab=sow]'); await p.waitForTimeout(150);
  check('SOW stage', 'Brand SOW tab shows the blocker', !!ideoBlocker && (await mainText()).includes(ideoBlocker.slice(0, 30)), ideoBlocker);

  // 4. SOW target date moves the signing plan week (Setosa to next week)
  const nd = new Date(); nd.setDate(nd.getDate() + 7); const iso = nd.toISOString().slice(0, 10);
  await go('sow'); await view('sowview', 'list'); await p.click('tr[data-kind=sow][data-id=setosa-skincare] td:nth-child(3)'); await p.waitForTimeout(200);
  await p.fill('#d-target_sign', iso); await drawerSave();
  await go('overview');
  check('SOW target date', 'Signing plan moves it to Next week', (await planColumn('Setosa Skincare')) === 'Next week', await planColumn('Setosa Skincare'));

  // 5. Task status to Blocked, with reason, on a brand that was On Track (CELF)
  await go('overview'); const celf0 = await overviewRow('CELF');
  await go('brand-celf'); await p.click('button[data-tab=tasks]'); await p.waitForTimeout(150); await p.click('button.team:not(.empty-team)'); await p.waitForTimeout(200);
  await p.selectOption('main select[data-kind=task]', 'Blocked'); await p.waitForTimeout(200);
  await p.fill('#b-text', 'Need founder files'); await p.selectOption('#b-person', 'Cat'); await p.click('#bform button[type=submit]'); await p.waitForTimeout(350);
  await go('overview');
  check('Task blocked', 'Brand health turns Has blockers (or Blocked if the task is High or Urgent)', !celf0.includes('Blocked') && !celf0.includes('Has blockers') && /Has blockers|Blocked/.test(await overviewRow('CELF')), (await overviewRow('CELF')).slice(0, 60));
  check('Task blocked', 'Left menu dot turns red', await p.evaluate(() => [...document.querySelectorAll('.rail .blink')].some(a => [...a.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() === 'CELF' && a.querySelector('.dot.h-Blocked, .dot.h-Hasblockers'))));
  await go('brand-celf'); await p.click('button[data-tab=tasks]'); await p.waitForTimeout(150); await p.click('[data-act=dept][data-dep=""]').catch(() => {}); await p.waitForTimeout(150);
  check('Task blocked', 'Team card shows 1 blocked', (await text('.teams')).includes('1 blocked'));

  // 6. Task deadline in the past makes it late (Tiny Wins)
  await go('brand-tiny-wins'); await p.click('button[data-tab=tasks]'); await p.waitForTimeout(150); await p.click('button.team:not(.empty-team)'); await p.waitForTimeout(200);
  await p.click('main tbody tr'); await p.waitForTimeout(200);
  const past = new Date(); past.setDate(past.getDate() - 2); await p.fill('#d-deadline', past.toISOString().slice(0, 10)); await drawerSave();
  await go('overview');
  check('Task deadline', 'Brand health turns At Risk', (await overviewRow('Tiny Wins')).includes('At Risk'), (await overviewRow('Tiny Wins')).slice(0, 60));
  await go('brand-tiny-wins'); await p.click('[data-act=dept][data-dep=""]').catch(() => {}); await p.waitForTimeout(150);
  check('Task deadline', 'Team card shows late', (await text('.teams')).includes('late'));

  // 7. Step Done updates onboarding % (ORA, first open step)
  await go('brand-ora'); await p.click('button[data-tab=steps]'); await p.waitForTimeout(200);
  const pct = async () => +(((await text('.bhead')).match(/Onboarding (\d+)%/) || [])[1] || -1);
  const open = await p.$$eval('select[data-code]', els => els.filter(e => !['Done', 'N/A'].includes(e.value)).map(e => e.dataset.code));
  const pct0 = await pct();
  await p.selectOption(`select[data-code="${open[0]}"]`, 'Done'); await p.waitForTimeout(300);
  const pct1 = await pct();
  check('Step done', 'Brand header onboarding % goes up', pct1 > pct0, `${open[0]}: ${pct0}% to ${pct1}%`);
  await go('overview');
  check('Step done', 'Overview onboarding column goes up', (await overviewRow('ORA')).includes(pct1 + '%'));

  // 8. Step owner + blocker reach My tasks and the brand header (ORA, next open step)
  await go('brand-ora'); await p.click('button[data-tab=steps]'); await p.waitForTimeout(150);
  const stepName = await p.$eval(`select[data-code="${open[1]}"]`, e => e.closest('tr, .step, li, div').innerText.split('\n')[0].trim()).catch(() => '');
  const blocked0 = +(((await text('.bhead')).match(/(\d+) steps? blocked/) || [])[1] || 0);
  await p.click(`[data-act=open][data-kind=step][data-code="${open[1]}"]`); await p.waitForTimeout(200);
  await p.selectOption('#d-owner', 'Noopur'); await p.fill('#d-blk_text', 'Founder not replying'); await p.selectOption('#d-blk_person', 'Ben'); await drawerSave();
  check('Step blocker', 'Brand header counts the blocked step', (await text('.bhead')).includes((blocked0 + 1) + ' step' + (blocked0 ? 's' : '') + ' blocked'), await text('.bhead'));
  await setMe('Noopur'); await go('mine');
  await view('minetab', 'onboarding');
  check('Step owner', 'My tasks shows the step as blocked on the ORA card', await p.evaluate(code => { const c = [...document.querySelectorAll('.bcard')].find(x => x.querySelector('.bname').innerText === 'ORA'); return !!c && [...c.querySelectorAll('.item.blocked')].some(i => i.innerText.includes(code)) && c.innerText.includes('1 blocked') }, open[1]));

  // 9. Platform access Blocked turns brand Blocked (Bespoke row)
  await go('access'); await view('accview', 'list'); await p.selectOption('select[data-kind=access]', 'Blocked'); await p.waitForTimeout(250);
  if (await p.$('#bform')) { await p.fill('#b-text', 'Login not shared'); await p.selectOption('#b-person', 'Ash Ghorab'); await p.click('#bform button[type=submit]'); await p.waitForTimeout(300) }
  await go('overview');
  check('Platform access', 'Access column says Blocked', /Blocked/.test((await overviewRow('Bespoke')).split('Live')[1] || ''));

  // 10. BP section Blocked (KNDZ)
  await go('brand-kndz'); await p.click('button[data-tab=bp]'); await p.waitForTimeout(150);
  await p.selectOption('select[data-act=bpsec][data-sec="Amazon"]', 'Blocked'); await p.waitForTimeout(300);
  await go('bp');
  check('BP section', 'BP grid shows KNDZ overall Blocked', await p.evaluate(() => [...document.querySelectorAll('main tbody tr')].some(r => r.innerText.startsWith('KNDZ') && r.innerText.includes('Blocked'))));
  await go('overview');
  check('BP section', 'Brand health turns Blocked', (await overviewRow('KNDZ')).includes('KNDZ Founder Workshops Blocked'));

  // 11. Task team change moves it between cards (Eco Protein)
  await go('brand-eco-protein'); await p.click('button[data-tab=tasks]'); await p.waitForTimeout(150); const before = await text('.teams');
  await p.click('button[data-tab=tasks]'); await p.waitForTimeout(150); await p.click('button.team:not(.empty-team)'); await p.waitForTimeout(200);
  await p.click('main tbody tr'); await p.waitForTimeout(200); await p.selectOption('#d-department', 'Finance'); await drawerSave();
  await p.click('[data-act=dept][data-dep=""]'); await p.waitForTimeout(200);
  check('Task team', 'Team cards change', (await text('.teams')) !== before);

  // 12. Brand lead and next step reach the Overview
  await openBrandEditor('daisyface-skincare'); await p.selectOption('#d-lead', 'Cat'); await p.fill('#d-next_step', 'Book kickoff call'); await drawerSave();
  await go('overview');
  check('Brand lead / next step', 'Overview shows new lead', (await overviewRow('Daisyface Skincare')).endsWith('Cat'));
  check('Brand lead / next step', 'Overview shows new next step', (await overviewRow('Daisyface Skincare')).includes('Book kickoff call'));

  // 13. Taking a brand off hold brings it back everywhere (MUMUK)
  await openBrandEditor('mumuk'); await p.selectOption('#d-stage', 'Best Practices + Briefs'); await drawerSave();
  await go('overview');
  check('Off hold again', 'Back in the signing plan weeks', !['On hold', null].includes(await planColumn('MUMUK')), await planColumn('MUMUK'));
  check('Off hold again', 'Health no longer On Hold', !(await overviewRow('MUMUK')).includes('On Hold'));


  // 14. SOW progress board: a square opens its steps, changing them recolours the square and moves onboarding % (CELF, W1)
  await go('overview'); const celfPct0 = +((await overviewRow('CELF')).match(/(\d+)%/) || [])[1];
  await go('sow'); await view('sowview', 'board');
  const sq = 'button.bd[data-b=celf][data-c="1.0"]';
  const sqBefore = await p.$eval(sq, e => e.className);
  await p.click(sq); await p.waitForTimeout(250);
  for (const s of await p.$$('#drawer select[data-code]')) { await s.selectOption('Done'); await p.waitForTimeout(250) }
  await p.click('[data-act=close]'); await p.waitForTimeout(200);
  check('SOW board', 'Square turns Done after its steps are Done', !sqBefore.includes('bd-done') && (await p.$eval(sq, e => e.className)).includes('bd-done'), sqBefore);
  await go('overview');
  check('SOW board', 'Overview onboarding % goes up', +((await overviewRow('CELF')).match(/(\d+)%/) || [])[1] > celfPct0);

  // 15. Platform access grid: + adds a platform for a brand, editing it updates the grid (CELF TikTok Ads)
  await go('access'); await view('accview', 'grid');
  const plus = 'button.acd-empty[data-b=celf][data-p="TikTok Ads"]';
  check('Access grid', 'Untracked platform shows a +', !!(await p.$(plus)));
  await p.click(plus); await p.waitForTimeout(350);
  await p.selectOption('#d-status', 'Granted'); await drawerSave(); await p.click('[data-act=close]').catch(() => {}); await p.waitForTimeout(200);
  await go('access');
  check('Access grid', 'New square shows Granted', await p.evaluate(() => [...document.querySelectorAll('main tbody tr')].some(r => r.innerText.startsWith('CELF') && r.querySelector('button.acd.s-ok'))));
  await go('brand-celf'); await p.click('button[data-tab=access]'); await p.waitForTimeout(150);
  check('Access grid', 'Brand access tab lists the new row', (await mainText()).includes('TikTok Ads'));


  // 16. Search finds a brand and a task and takes you there
  await go('overview'); await p.click('#q'); await p.keyboard.type('Seoul'); await p.waitForTimeout(150);
  check('Search', 'Brand result shows', (await text('#sres')).includes('Seoul Tonic'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  check('Search', 'Enter opens the first result', await p.evaluate(() => location.hash) === '#brand-seoul-tonic');
  const anyTask = await p.evaluate(() => { const t = Object.values(window.__SEED.tasks).find(t => t.title && t.brand && t.status !== 'Complete' && t.title.length > 12); return t.title });
  await p.click('#q'); await p.keyboard.type(anyTask.slice(0, 12)); await p.waitForTimeout(150);
  const taskRow = await p.$$eval('#sres .sr-row', rs => rs.findIndex(r => r.innerText.toLowerCase().startsWith('task')));
  await (await p.$$('#sres .sr-row'))[taskRow].click(); await p.waitForTimeout(400);
  check('Search', 'Task result opens its brand page with the task highlighted', !!(await p.$('tr.flash')));

  // 17. Sort the brands table
  await go('overview'); await p.click('[data-act=sort][data-k=health]'); await p.waitForTimeout(150);
  const firstH = await p.evaluate(() => { const tbs = document.querySelectorAll('main table'); return tbs[tbs.length - 1].querySelector('tbody tr td:nth-child(3)').innerText.trim() }).catch(() => '');
  check('Sort', 'Sorting by health puts Blocked first', firstH === 'Blocked', firstH);
  await p.click('[data-act=sort][data-k=health]'); await p.waitForTimeout(150);
  const firstH2 = await p.evaluate(() => { const tbs = document.querySelectorAll('main table'); return tbs[tbs.length - 1].querySelector('tbody tr td:nth-child(3)').innerText.trim() }).catch(() => '');
  check('Sort', 'Clicking again reverses it', firstH2 !== 'Blocked', firstH2);

  // 18. A past SOW target shows in Needs attention
  await go('sow'); await view('sowview', 'list'); await p.click('tr[data-kind=sow][data-id=tiny-wins] td:nth-child(3)'); await p.waitForTimeout(200);
  const pastD = new Date(); pastD.setDate(pastD.getDate() - 3); await p.fill('#d-target_sign', pastD.toISOString().slice(0, 10)); await drawerSave();
  await go('overview');
  check('Needs attention', 'Past SOW target appears for Tiny Wins', await p.evaluate(() => [...document.querySelectorAll('.att tr')].some(r => r.innerText.includes('Past SOW target') && r.innerText.includes('Tiny Wins'))));

  // 19. Stage change starts the days-in-stage clock
  await openBrandEditor('celf'); await p.selectOption('#d-stage', 'Founder Workshops'); await drawerSave();
  check('Stage age', 'Brand facts show days in stage', (await text('.facts')).includes('for 0 days'));

  // 20. Gate sign-off is recorded with the person and date
  await setMe('Noopur'); await go('brand-bespoke'); await p.click('button[data-tab=steps]'); await p.click('[data-act=allphases]').catch(() => {}); await p.waitForTimeout(200);
  const gate = await p.$$eval('.step.isgate select[data-code]', els => { const e = els.find(x => x.offsetHeight); return e && e.dataset.code });
  await p.selectOption(`select[data-code="${gate}"]`, 'In Progress'); await p.waitForTimeout(200);
  await p.selectOption(`select[data-code="${gate}"]`, 'Done'); await p.waitForTimeout(300);
  check('Gate sign-off', 'Done gate shows Signed off by Noopur', await p.evaluate(c => { const s = document.querySelector(`select[data-code="${c}"]`).closest('.step'); return s.innerText.includes('Signed off by Noopur') }, gate));

  // 21. Comment with a mention reaches that person's My tasks
  await go('brand-kndz'); await p.click('button[data-tab=updates]'); await p.waitForTimeout(150);
  await p.fill('#c-text', 'Founder sent the GF numbers, @Cat please check'); await p.click('#cform button[type=submit]'); await p.waitForTimeout(300);
  check('Comments', 'Comment shows on the brand Updates tab', (await mainText()).includes('Founder sent the GF numbers'));
  check('Comments', 'Updates tab counts it', (await text('.tabs')).includes('Updates (1)'));
  await setMe('Cat'); await go('mine');
  check('Comments', 'Mention shows in Cat\'s My tasks', await p.evaluate(() => [...document.querySelectorAll('.item.men')].some(x => x.innerText.includes('KNDZ'))));

  // 22. Task template: create in Settings, use on a brand
  await go('settings'); await p.click('[data-act=settab][data-tab=templates]'); await p.waitForTimeout(150);
  await p.fill('#t-name', 'UGC kickoff'); await p.selectOption('#t-vert', 'UGC'); await p.fill('#t-lines', 'Shortlist creators | Creator Partnerships | 5\nSend brief to creators | Creator Partnerships | 7');
  await p.click('#tform button[type=submit]'); await p.waitForTimeout(300);
  check('Templates', 'Template is listed', (await mainText()).includes('UGC kickoff'));
  await go('brand-ora'); await p.click('button[data-tab=tasks]'); await p.click('[data-act=dept][data-dep=""]').catch(() => {}); await p.waitForTimeout(150);
  const before22 = +(await text('.tabs')).match(/Tasks \((\d+)/)[1];
  await p.selectOption('select[data-act=use-tpl]', '0'); await p.waitForTimeout(150); await p.click('[data-act=mok]'); await p.waitForTimeout(500);
  check('Templates', 'Using it adds 2 tasks to the brand', +(await text('.tabs')).match(/Tasks \((\d+)/)[1] === before22 + 2);

  // 23. People view: pick a person, filter by vertical
  await go('people'); const rows23 = (await p.$$('main tbody tr')).length;
  await p.click('main tbody tr.click'); await p.waitForTimeout(200);
  check('People', 'Clicking a person lists their tasks', (await p.$$('main .item')).length > 0);
  await p.selectOption('select[data-k=vert]', 'UGC'); await p.waitForTimeout(150);
  check('People', 'Vertical filter narrows the table', (await p.$$('main tbody tr')).length < rows23);
  await p.selectOption('select[data-k=vert]', '');

  // 24. My tasks vertical filter
  await setMe('Cat'); await go('mine'); const n24 = (await p.$$('main .item:not(.men)')).length;
  await p.click('[data-act=mvert][data-v="UGC"]'); await p.waitForTimeout(150);
  check('My tasks', 'Vertical chip narrows the list', (await p.$$('main .item:not(.men)')).length < n24);
  await p.click('[data-act=mvert][data-v=""]');

  // 25. Client view shows no internal data
  await go('client-bespoke');
  const internal = await p.evaluate(() => Object.values(window.__SEED.tasks).filter(t => t.brand === 'bespoke').map(t => t.title).filter(Boolean));
  const ct = await mainText();
  check('Client view', 'No task names appear on the client page', !internal.some(t => t.length > 8 && ct.includes(t)));
  check('Client view', 'Download button is there', !!(await p.$('[data-act=client-dl]')));

  // 26. Leadership view hides the dense table until asked
  await go('overview'); await view('lens', 'leadership');
  check('Leadership view', 'Full table is folded away', !!(await p.$('[data-act=allbrands]')));
  await p.click('[data-act=allbrands]'); await p.waitForTimeout(150);
  check('Leadership view', 'Show button opens it', !(await p.$('[data-act=allbrands]')));
  await view('lens', 'lead');

  check('Page', 'No script errors', errors.length === 0, errors.join(' | '));
  const failed = results.filter(r => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.area} | ${r.what}${r.ok ? '' : ' | ' + r.detail}`);
  console.log(`\n${results.length - failed.length} of ${results.length} passed`);
  await b.close(); process.exit(failed.length ? 1 : 0);
})();
