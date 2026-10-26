// Screenshots for the feature map. Each picture gets red tags with feature IDs (F10, F31...)
// placed on the part of the screen they describe.
// Usage: node docs/feature_map/take_screens.js <preview.html> <out_dir>
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const [preview, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const shots = [];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.route('**/fonts.*/**', r => r.abort());
  const url = 'file://' + path.resolve(preview);
  const go = async (h) => { await p.goto(url + '#' + h); await p.waitForTimeout(450); };
  const click = async (sel) => { await p.click(sel); await p.waitForTimeout(250); };
  const scrollTo = async (sel, pad = 20) => p.evaluate(([s, pad]) => { const e = document.querySelector(s); const m = document.querySelector('main'); if (e && m) m.scrollTop = e.getBoundingClientRect().top + m.scrollTop - m.getBoundingClientRect().top - pad; }, [sel, pad]);
  // tags: [[selector, label, index?]]
  const tag = async (tags) => p.evaluate((tags) => {
    document.querySelectorAll('.fm-tag').forEach(e => e.remove());
    for (const [sel, label, i] of tags) {
      const el = document.querySelectorAll(sel)[i || 0]; if (!el) continue;
      const r = el.getBoundingClientRect(); if (r.width === 0) continue;
      const t = document.createElement('div'); t.className = 'fm-tag'; t.textContent = label;
      Object.assign(t.style, { position: 'fixed', left: Math.max(2, r.left - 6) + 'px', top: Math.max(2, r.top - 11) + 'px', background: '#D7263D', color: '#fff',
        font: '700 12px/1 system-ui,sans-serif', padding: '4px 7px', borderRadius: '10px', zIndex: 99, boxShadow: '0 0 0 2px #fff' });
      const box = document.createElement('div'); box.className = 'fm-tag';
      Object.assign(box.style, { position: 'fixed', left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px',
        border: '2px dashed #D7263D', borderRadius: '8px', zIndex: 98, pointerEvents: 'none' });
      document.body.append(box, t);
    }
  }, tags);
  const snap = async (id, title, features, tags) => {
    await tag(tags); await p.waitForTimeout(80);
    const file = `${id}.png`;
    await p.screenshot({ path: path.join(outDir, file) });
    shots.push({ id, title, features, file });
    await p.evaluate(() => document.querySelectorAll('.fm-tag').forEach(e => e.remove()));
  };

  // S01 frame of the app
  await go('overview');
  await snap('S01', 'The tracker: left menu, brand list, top bar', 'F01, F02, F03, F04, F05, F06',
    [['.nav', 'F01'], ['.rail > nav + div', 'F02'], ['.addbtn', 'F03'], ['.topbar .seg', 'F04'], ['.who', 'F05'], ['.topbar .tag', 'F06']]);
  // S02 overview top
  await snap('S02', 'Overview: summary tiles, pipeline and SOW signing plan', 'F20, F23, F21', [['.tiles', 'F20'], ['.pipe', 'F23'], ['.plan', 'F21']]);
  // S03 overview table full
  await scrollTo('main h2:nth-of-type(4)');
  await snap('S03', 'Overview: all brands table (Full view)', 'F22', [['main .tw', 'F22']]);
  // S04 overview table simple
  await click('[data-act=simple][data-v="1"]'); await scrollTo('main h2:nth-of-type(4)');
  await snap('S04', 'Overview: all brands table (Simple view, 5 columns)', 'F04, F22', [['main .tw', 'F22'], ['.topbar .seg', 'F04']]);
  await click('[data-act=simple][data-v="0"]');
  // S05 my tasks
  await go('mine');
  await snap('S05', 'My tasks: blocked first, then late, then due soon', 'F10, F11, F12',
    [['.group', 'F10'], ['.item select.ps', 'F11'], ['.blk', 'F12']]);
  // S06 blocker prompt
  await go('brand-kndz');
  const sel = await p.$('select[data-kind=task]:not([disabled])');
  if (sel) { const cur = await sel.inputValue(); await sel.selectOption(cur === 'Blocked' ? 'In Progress' : 'Blocked'); await p.waitForTimeout(250); }
  await snap('S06', 'Marking a task Blocked asks for one line and a person', 'F81, F11', [['#modal .box', 'F81']]);
  await p.evaluate(() => document.getElementById('modal').hidden = true);
  // S07 brand header + team cards
  await go('brand-bespoke');
  await snap('S07', 'Brand page: header, facts, next step and tabs', 'F30, F42', [['.bhead h1', 'F30'], ['.facts', 'F30'], ['.next', 'F30'], ['.bhead .btn:last-child', 'F42'], ['.missing', 'F42']]);
  await scrollTo('.secs');
  await snap('S08', 'Brand page: board with one list per team', 'F86, F33', [['main .kb', 'F86'], ['[data-act=kl-add]', 'F86'], ['[data-act=add-task]', 'F33']]);
  // S09 team list
  await click('main .kc'); await snap('S09', 'Brand page: card back', 'F87', [['#drawer', 'F87']]); await click('#drawer [data-act=close]');
  // S10 task editor
  await click('main .kc');
  await snap('S10', 'Task editor (side panel)', 'F34', [['#drawer', 'F34']]);
  await p.click('[data-act=close]'); await p.waitForTimeout(200);
  // S11 onboarding steps
  await go('brand-kndz'); await click('button[data-tab=steps]'); await scrollTo('.secs');
  await snap('S11', 'Onboarding steps: current phase, gates, optional steps', 'F35, F36, F37',
    [['.phase summary', 'F35'], ['.step.isgate', 'F36'], ['[data-act=phase-done]', 'F37']]);
  // S12 gate refused
  await p.$$eval('.phase', ds => ds.forEach(d => { if (d.tagName === 'DETAILS') d.open = true }));
  for (const g of await p.$$('.step.isgate select')) { if (await g.isVisible() && (await g.inputValue()) !== 'Done') { await g.scrollIntoViewIfNeeded(); await g.selectOption('Done'); await p.waitForTimeout(250); break; } }
  await snap('S12', 'Gate rule: a gate cannot be Done while earlier steps are open', 'F36', [['#toast', 'F36'], ['.step.isgate', 'F36']]);
  // S13 step editor
  await p.waitForTimeout(2200); await click('.step [data-act=open]');
  await snap('S13', 'Step editor: status, owner, deadline, link, blocker', 'F38', [['#drawer', 'F38']]);
  await p.click('[data-act=close]'); await p.waitForTimeout(200);
  // S14 brand access, S15 brand SOW, S16 brand BP
  await go('brand-ideo'); await click('button[data-tab=access]'); await scrollTo('.secs');
  await snap('S14', 'Brand page: platform access tab', 'F39', [['main table', 'F39']]);
  await go('brand-ponlu'); await click('button[data-tab=sow]'); await scrollTo('.secs');
  await snap('S15', 'Brand page: SOW tab (blocked SOW keeps its date)', 'F40', [['.notice.bad', 'F40'], ['main .facts:last-of-type', 'F40']]);
  await go('brand-ideo'); await click('button[data-tab=bp]'); await scrollTo('.secs');
  await snap('S16', 'Brand page: Best Practices tab', 'F41', [['main table', 'F41']]);
  // S17 SOW tracker, S18 access, S19 BP
  await go('sow');
  await snap('S17', 'SOW tracker: progress board, one square per stage item', 'F54, F50', [['main table', 'F54'], ['.viewseg', 'F50']]);
  await go('access');
  await snap('S18', 'Platform access: brands by platforms grid', 'F55, F51', [['main table', 'F55'], ['.filters', 'F55'], ['.viewseg', 'F51']]);
  await go('bp');
  await snap('S19', 'Best Practices grid: dots with letters', 'F52, F53', [['.legend', 'F52'], ['main table', 'F52'], ['[data-act=bp-add]', 'F53']]);
  // one real edit so the change log has something to show (preview only, nothing is saved)
  await go('brand-kndz'); await click('button[data-tab=steps]');
  for (const s of (await p.$$('select[data-code]')).slice(0, 40)) { if (!['Done', 'N/A'].includes(await s.inputValue())) { await s.selectOption('Done'); await p.waitForTimeout(250); break; } }
  // Settings
  await go('settings');
  await snap('S20', 'Settings: People', 'F60', [['main table', 'F60'], ['[data-act=add-person]', 'F60']]);
  for (const [tab, id, title, f] of [['lists', 'S21', 'Settings: Lists (every dropdown)', 'F61'], ['steps', 'S22', 'Settings: Step list', 'F62'],
                                      ['nobrand', 'S23', 'Settings: Needs a brand', 'F63'], ['log', 'S24', 'Settings: Change log', 'F64'], ['export', 'S25', 'Settings: Excel export and backup', 'F65, F66']]) {
    await click(`[data-act=settab][data-tab=${tab}]`);
    const tg = tab === 'export' ? [['[data-act=export-xlsx]', 'F65'], ['[data-act=export-json]', 'F66']] : [['main .secs + *', f]];
    await snap(id, title, f, tg);
  }
  fs.writeFileSync(path.join(outDir, 'shots.json'), JSON.stringify(shots, null, 1));
  console.log('shots', shots.length);
  await b.close();
})();
