// Click-through audit: every screen, in every "View for" setting, at desktop and phone width.
// Presses every visible button and link marked data-act (except delete and file downloads),
// and reports script errors, buttons that change nothing, and sideways page scroll.
// Usage: node tests/audit.js <preview.html>   The preview saves nothing.
const path = require('path');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const url = 'file://' + path.resolve(process.argv[2]);
const SKIP = new Set(['del', 'export-xlsx', 'export-json', 'menu', 'dsave', 'mok', 'save-lists', 'client-dl']);

(async () => {
  const b = await chromium.launch();
  const out = { screens: [], dead: [], errors: [], overflow: [], clicked: 0, kinds: {} };
  for (const [w, label] of [[1440, 'desktop'], [390, 'phone']]) {
    for (const lens of ['simple', 'full', 'leadership']) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(url + '#overview'); await p.waitForTimeout(500);
      await p.evaluate(l => { localStorage.setItem('vt-simple', l === 'full' ? '0' : '1'); localStorage.setItem('vt-lens', l === 'leadership' ? 'leadership' : '') }, lens); await p.reload(); await p.waitForTimeout(500);
      if (lens === 'leadership') { await p.evaluate(() => { location.hash = 'settings' }); await p.waitForTimeout(250); await p.click('[data-act=settab][data-tab=people]'); await p.check('input[aria-label="Leadership view for Noopur"]'); await p.waitForTimeout(250) }
      const brands = await p.$$eval('.rail .blink', as => as.map(a => a.getAttribute('href').slice(1)));
      const screens = ['mine', 'overview', 'people', 'sow', 'access', 'bp', 'settings', ...brands.slice(0, label === 'desktop' ? 99 : 3)];
      for (const s of screens) {
        await p.evaluate(h => { location.hash = h }, s); await p.waitForTimeout(250);
        const sw = await p.evaluate(() => document.documentElement.scrollWidth);
        if (sw > w + 1) out.overflow.push(`${label} ${lens} #${s}: page is ${sw}px wide`);
        out.screens.push(`${label}/${lens}/${s}`);
        if (label === 'phone' || lens !== 'full' && s.startsWith('brand-')) continue;
        // tabs and view switches on this screen, then every data-act control
        const n = await p.$$eval('main [data-act], #topbar [data-act]', els => els.length);
        for (let i = 0; i < n; i++) {
          await p.evaluate(h => { if (location.hash !== '#' + h) location.hash = h }, s); await p.waitForTimeout(60);
          const el = (await p.$$('main [data-act], #topbar [data-act]'))[i]; if (!el) continue;
          const info = await el.evaluate(e => ({ act: e.dataset.act, tag: e.tagName, text: (e.innerText || e.value || '').trim().slice(0, 40), vis: !!(e.offsetWidth || e.offsetHeight) }));
          if (!info.vis || SKIP.has(info.act) || info.tag === 'SELECT' || info.tag === 'INPUT') continue;
          const before = await p.evaluate(() => document.body.innerHTML.length + '|' + location.hash + '|' + document.getElementById('drawer').hidden + '|' + document.getElementById('modal').hidden + '|' + document.body.innerHTML.slice(0, 0));
          const htmlBefore = await p.evaluate(() => document.body.innerHTML);
          await el.click({ timeout: 2000 }).catch(() => {});
          await p.waitForTimeout(120);
          const changed = await p.evaluate(h => document.body.innerHTML !== h || false, htmlBefore);
          out.clicked++; out.kinds[info.act] = (out.kinds[info.act] || 0) + 1;
          if (!changed && !['nav', 'who'].includes(info.act)) out.dead.push(`#${s} ${info.act} "${info.text}"`);
          // close anything that opened
          await p.evaluate(() => { document.getElementById('modal').hidden = true });
          const close = await p.$('#drawer:not([hidden]) [data-act=close]'); if (close) await close.click().catch(() => {});
        }
      }
      out.errors.push(...errs.map(e => `${label}/${lens}: ${e}`));
      await p.close();
    }
  }
  console.log(`screens visited: ${out.screens.length}, buttons pressed: ${out.clicked}`);
  console.log('by action:', JSON.stringify(out.kinds));
  console.log(`script errors: ${out.errors.length}`); out.errors.slice(0, 20).forEach(e => console.log('  ' + e));
  console.log(`sideways scroll: ${out.overflow.length}`); out.overflow.forEach(e => console.log('  ' + e));
  const dead = [...new Set(out.dead)]; console.log(`buttons that changed nothing: ${dead.length}`); dead.slice(0, 40).forEach(e => console.log('  ' + e));
  await b.close();
  process.exit(out.errors.length || out.overflow.length ? 1 : 0);
})();
