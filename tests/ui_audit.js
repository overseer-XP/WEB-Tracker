// Looks at VALFLO while using it, not just at rest. For every page, screen size and theme it:
//   opens every "Show more" and every "N earlier" list, scrolls the page top to bottom, hovers controls, opens an edit window,
//   and after each step checks what a person would see go wrong:
//   - text or boxes running past their cell, card or window (overrun)
//   - the page scrolling sideways
//   - a floating or sticky bar sitting on top of content it should not cover
//   - something moving when it should stay still (bars jumping while scrolling)
//   - script errors
// Every problem gets a screenshot with the problem outlined in red.
// Usage: node tests/ui_audit.js <preview.html> <outdir>
const path = require('path'), fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['mine', 'leadership', 'overview', 'sow', 'sow:list', 'access', 'bp', 'org', 'settings', 'brand'];
const SIZES = process.env.SIZES ? JSON.parse(process.env.SIZES) : [[1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440], [3840, 2160]];
const THEMES = ['light', 'dark'];
const FILM = process.env.FILM === '1';

const DETECT = () => {
  const out = [];
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const name = e => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.'); return s; };
  const txt = e => (e.innerText || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 70);
  // the box an element has to stay inside: a table cell, a card, a window, or anything that clips
  const boxOf = e => { let p = e.parentElement; while (p && p !== document.body) { const s = getComputedStyle(p); if (/^(TD|TH)$/.test(p.tagName) || p.matches('.card,.drawer,.modal,#fbox,.kcol,.tile,section') || /(hidden|auto|scroll|clip)/.test(s.overflowX)) return p; p = p.parentElement; } return null; };
  const root = document.querySelector('#drawer:not([hidden])') || document.querySelector('#modal:not([hidden])') ? document : document.querySelector('main') || document.body;
  const seen = new Set();
  // 1. overrun: an element with its own text sticking out of its box
  for (const e of root.querySelectorAll('main *, #drawer:not([hidden]) *, #modal:not([hidden]) *')) {
    if (!vis(e) || e.closest('svg') || e.closest('.sr')) continue;
    const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || /^(INPUT|SELECT|TEXTAREA|BUTTON|IMG)$/.test(e.tagName);
    if (!own) continue;
    const b = boxOf(e); if (!b) continue;
    const r = e.getBoundingClientRect(), br = b.getBoundingClientRect();
    const bs = getComputedStyle(b);
    // a box that scrolls sideways on purpose (wide tables) is fine as long as you can scroll to it
    if (/(auto|scroll)/.test(bs.overflowX) && b.scrollWidth > b.clientWidth) continue;
    const over = Math.max(r.right - br.right, br.left - r.left);
    if (over > 2) { const k = name(b) + '>' + name(e); if (seen.has(k)) continue; seen.add(k); out.push({ kind: 'overrun', px: Math.round(over), el: name(e), box: name(b), text: txt(e), rect: [r.left, r.top, r.width, r.height].map(Math.round) }); }
  }
  // 2. text cut off without a "..." or a Show more
  for (const e of document.querySelectorAll('main *, #drawer:not([hidden]) *')) {
    if (!vis(e) || e.closest('.sr')) continue; const s = getComputedStyle(e);
    if (!/(hidden|clip)/.test(s.overflowX)) continue; if (s.textOverflow === 'ellipsis' || s.webkitLineClamp !== 'none' || e.matches('.xp,.clamp2,.clamp3,[class*=clamp]')) continue;
    if (e.scrollWidth > e.clientWidth + 2 && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) { const r = e.getBoundingClientRect(); out.push({ kind: 'cut off', px: e.scrollWidth - e.clientWidth, el: name(e), text: txt(e), rect: [r.left, r.top, r.width, r.height].map(Math.round) }); }
  }
  // 3. page scrolls sideways
  const de = document.documentElement; if (de.scrollWidth > innerWidth + 1) out.push({ kind: 'page scrolls sideways', px: de.scrollWidth - innerWidth, el: 'page', text: '' });
  return out;
};

// two pieces of text drawn on top of each other
const OVERLAP = () => {
  const out = []; const seen = new Set();
  const own = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  // with a window open, only the window counts (the page behind it is covered on purpose)
  const scope = document.querySelector('#modal:not([hidden])') ? '#modal *' : document.querySelector('#drawer:not([hidden])') ? '#drawer *' : 'main *';
  const els = [...document.querySelectorAll(scope)].filter(e => {
    if (!own(e) || !(e.innerText || '').trim() || e.closest('.sr,svg,option,select')) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && s.visibility !== 'hidden' && s.opacity !== '0';
  }).slice(0, 700);
  const R = els.map(e => e.getBoundingClientRect());
  const clip = e => { let p = e.parentElement; while (p && p !== document.body) { if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(p).overflow)) return p.getBoundingClientRect(); p = p.parentElement; } return null; };
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = R[i], b = R[j]; const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ix < 4 || iy < 4) continue; if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
    const x = Math.max(a.left, b.left) + ix / 2, y = Math.max(a.top, b.top) + iy / 2; if (y > innerHeight - 2 || x > innerWidth - 2) continue; const top = document.elementFromPoint(x, y);
    if (!top || !(els[i].contains(top) || els[j].contains(top) || top.contains(els[i]) || top.contains(els[j]))) continue;
    const ca = clip(els[i]), cb = clip(els[j]); if (ca && (y < ca.top || y > ca.bottom)) continue; if (cb && (y < cb.top || y > cb.bottom)) continue;
    if (ix * iy < 0.2 * Math.min(a.width * a.height, b.width * b.height)) continue;
    const nm = e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '');
    const k = nm(els[i]) + '+' + nm(els[j]); if (seen.has(k)) continue; seen.add(k);
    out.push({ kind: 'text on top of text', el: nm(els[i]) + ' / ' + nm(els[j]), text: (els[i].innerText || '').slice(0, 30) + ' | ' + (els[j].innerText || '').slice(0, 30), rect: [Math.min(a.left, b.left), Math.min(a.top, b.top), Math.max(a.right, b.right) - Math.min(a.left, b.left), Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)].map(Math.round) });
  }
  return out;
};

// fixed and sticky things, and what they sit on top of
const COVER = () => {
  const out = [];
  const fl = [...document.querySelectorAll('main *, body > *')].filter(e => { const s = getComputedStyle(e); return (s.position === 'fixed' || s.position === 'sticky') && e.offsetParent !== null; });
  for (const f of fl) {
    const r = f.getBoundingClientRect(); if (r.width < 5 || r.height < 5) continue;
    if (getComputedStyle(f).position === 'sticky' && f.closest('main') && /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(f).backgroundColor) && document.getElementById('main').scrollTop > 0) {
      let p = f, solid = false; while (p && p !== document.body) { if (!/rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(p).backgroundColor)) { solid = p === f || getComputedStyle(p).position === 'sticky'; break; } p = p.parentElement; }
      const cellsSolid = [...f.querySelectorAll('th')].every(c => !/rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(c).backgroundColor));
      if (!solid && !cellsSolid && /^(TH|THEAD|TR)$/.test(f.tagName)) out.push({ kind: 'see-through sticky bar (rows show through it while scrolling)', el: f.tagName + '.' + f.className, bar: '', rect: [r.left, r.top, r.width, r.height].map(Math.round) });
    }
    // sample points along the bar; if the top element there is not the bar (or inside it), something is drawn over it, or it covers clickable content oddly
    for (const fx of [0.1, 0.5, 0.9]) { const x = r.left + r.width * fx, y = r.top + r.height / 2; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue; let sc = f.parentElement; while (sc && !/(auto|scroll|hidden)/.test(getComputedStyle(sc).overflowY + getComputedStyle(sc).overflowX)) sc = sc.parentElement; if (sc) { const q = sc.getBoundingClientRect(); if (y < q.top || y > q.bottom || x < q.left || x > q.right) continue; } const t = document.elementFromPoint(x, y); if (t && !f.contains(t) && !t.contains(f) && t.closest('main') && getComputedStyle(f).position === 'sticky') { const tr = t.getBoundingClientRect(); out.push({ kind: 'drawn over a sticky bar', el: (t.className || t.tagName) + '', bar: (f.className || f.tagName) + '', text: (t.innerText || '').trim().slice(0, 50), rect: [r.left, r.top, r.width, r.height].map(Math.round) }); break; } }
  }
  return out;
};

(async () => {
  const file = path.resolve(process.argv[2]), outdir = process.argv[3] || '.shots/ui';
  fs.mkdirSync(outdir, { recursive: true });
  const b = await chromium.launch(); const all = []; let shot = 0;
  for (const [w, h] of SIZES) for (const theme of THEMES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: theme });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file + '#overview'); await p.waitForTimeout(400);
    await p.evaluate(t => { const x = document.querySelector(`[data-act=theme][data-v=${t}]`) || [...document.querySelectorAll('button')].find(b => b.innerText.trim().toLowerCase() === t); if (x) x.click(); }, theme);
    const brand = await p.evaluate(() => { const a = document.querySelector('a[href^="#brand-"]'); return a ? a.getAttribute('href').slice(1) : ''; });
    for (const pg of PAGES) {
      const hash = pg === 'brand' ? brand : pg.split(':')[0];
      await p.evaluate(h => { location.hash = h }, hash); await p.waitForTimeout(300);
      if (pg === 'sow:list') { await p.click('[data-act=sowview][data-v=list]').catch(() => { }); await p.waitForTimeout(250); }
      if (pg === 'sow') { await p.click('[data-act=sowview][data-v=board]').catch(() => { }); await p.waitForTimeout(250); }
      const log = async (step, list) => {
        for (const f of list) {
          const key = [pg, step, f.kind, f.el, f.box || f.bar || ''].join('|');
          if (all.find(x => x.key === key)) { all.find(x => x.key === key).where.push(`${w}x${h} ${theme}`); continue; }
          let img = '';
          if (f.rect && shot < 150) {
            img = `${outdir}/${String(++shot).padStart(2, '0')}-${pg.replace(':', '-')}-${f.kind.replace(/\W+/g, '-')}.png`;
            await p.evaluate(r => { const d = document.createElement('div'); d.id = '__mark'; d.style.cssText = `position:fixed;left:${r[0] - 3}px;top:${r[1] - 3}px;width:${r[2] + 6}px;height:${r[3] + 6}px;border:3px solid red;z-index:99999;pointer-events:none`; document.body.appendChild(d); }, f.rect);
            await p.screenshot({ path: img }); await p.evaluate(() => document.getElementById('__mark')?.remove());
          }
          all.push(Object.assign({ key, page: pg, step, where: [`${w}x${h} ${theme}`], img }, f));
        }
      };
      await log('at rest', await p.evaluate(DETECT)); await log('at rest', await p.evaluate(OVERLAP));
      // a redraw (what happens on every live data update) must not flash: the first painted frame has to match the settled page
      const fl = await p.evaluate(async h => {
        const m = document.getElementById('main'); const snap = () => [m.scrollHeight, [...m.querySelectorAll('.xpm')].filter(x => !x.hidden).length, m.querySelectorAll('*').length > 0];
        location.hash = h + '-x'; await new Promise(r => setTimeout(r, 60)); location.hash = h;
        const first = await new Promise(r => { const o = new MutationObserver(() => { o.disconnect(); requestAnimationFrame(() => r(snap())); }); o.observe(m, { childList: true }); });
        await new Promise(r => setTimeout(r, 400)); const settled = snap();
        return { first, settled };
      }, hash);
      if (pg !== 'sow:list' && pg !== 'sow' && (Math.abs(fl.first[0] - fl.settled[0]) > 4 || fl.first[1] !== fl.settled[1])) await log('redraw', [{ kind: 'flashes on redraw (first frame differs from settled page)', el: pg, text: `height ${fl.first[0]}->${fl.settled[0]}, Show more ${fl.first[1]}->${fl.settled[1]}` }]);
      if (pg === 'sow:list' || pg === 'sow') {
        // SOW list/board: redraw through a stage tab (the view switch survives it)
        const fl2 = await p.evaluate(async () => { const m = document.getElementById('main'); const snap = () => [m.scrollHeight, [...m.querySelectorAll('.xpm')].filter(x => !x.hidden).length]; const b = m.querySelector('.stabs button,.stabs [role=tab]'); if (!b) return null; const before = snap(); b.click(); const first = await new Promise(r => requestAnimationFrame(() => r(snap()))); await new Promise(r => setTimeout(r, 400)); return { before, first, settled: snap() }; });
        if (fl2 && (Math.abs(fl2.first[0] - fl2.settled[0]) > 4 || fl2.first[1] !== fl2.settled[1])) await log('redraw', [{ kind: 'flashes on redraw (first frame differs from settled page)', el: pg, text: `height ${fl2.first[0]}->${fl2.settled[0]}, Show more ${fl2.first[1]}->${fl2.settled[1]}` }]);
      }
      if (pg === 'sow:list') { await p.click('[data-act=sowview][data-v=list]').catch(() => { }); await p.waitForTimeout(250); }
      // every tab and view switch on the page
      const TABS = 'main [role=tab], main .rsub [data-tab], main [data-act=settab], main [data-act=sowview], main [data-act=campview], main .stabs button, main .seg button, #topbar [data-act=simple]';
      const nt = await p.$$eval(TABS, es => es.filter(e => e.offsetParent).length);
      for (let i = 0; i < Math.min(nt, 14); i++) {
        const el = (await p.$$(TABS))[i]; if (!el) continue;
        const label = ((await el.innerText().catch(() => '')) || '').trim().split('\n')[0].slice(0, 24);
        await el.click().catch(() => { }); await p.waitForTimeout(200);
        await log('tab ' + label, await p.evaluate(DETECT)); await log('tab ' + label, await p.evaluate(OVERLAP));
        await p.evaluate(() => { document.querySelectorAll('main details:not([open])').forEach(d => d.open = true); document.querySelectorAll('main [data-act=xp]').forEach(x => { if (x.getAttribute('aria-expanded') !== 'true') x.click(); }); });
        await p.waitForTimeout(120); await log('tab ' + label + ' expanded', await p.evaluate(DETECT));
      }
      await p.evaluate(h => { location.hash = 'x'; location.hash = h }, hash); await p.waitForTimeout(300);
      if (pg === 'sow:list') { await p.click('[data-act=sowview][data-v=list]').catch(() => { }); await p.waitForTimeout(250); }
      if (pg === 'sow') { await p.click('[data-act=sowview][data-v=board]').catch(() => { }); await p.waitForTimeout(250); }
      // open every Show more and every "earlier" list
      await p.evaluate(() => { document.querySelectorAll('main details:not([open])').forEach(d => d.open = true); document.querySelectorAll('main [data-act=xp]').forEach(x => { if (x.getAttribute('aria-expanded') !== 'true') x.click(); }); });
      await p.waitForTimeout(250);
      await log('everything expanded', await p.evaluate(DETECT));
      // scroll top to bottom; watch the bars
      const H = await p.evaluate(() => (document.getElementById('main') || document.scrollingElement).scrollHeight); let prev = null, lay0 = null;
      for (let y = 0; y < H; y += Math.round(h * 0.6)) {
        await p.evaluate(y => { (document.getElementById('main') || document.scrollingElement).scrollTop = y }, y); await p.waitForTimeout(120);
        await log('scrolled', await p.evaluate(DETECT)); await log('scrolled', await p.evaluate(COVER)); await log('scrolled', await p.evaluate(OVERLAP));
        // a fixed bar that changes size or jumps while scrolling
        const bars = await p.evaluate(() => [...document.querySelectorAll('#topbar, .sumbar, .sowpin, [class*=sticky]')].map(e => { const r = e.getBoundingClientRect(); return [e.id || e.className, Math.round(r.top), Math.round(r.height)]; }));
        if (prev) for (const bb of bars) { const o = prev.find(x => x[0] === bb[0]); if (o && o[2] !== bb[2] && Math.abs(o[2] - bb[2]) > 4) await log('scrolled', [{ kind: 'bar changes size while scrolling', el: bb[0], px: bb[2] - o[2] }]); }
        prev = bars;
        // the page itself should not reflow while you scroll (things jumping)
        const lay = await p.evaluate(() => [...document.querySelectorAll('main > *, main > * > *')].filter(e => e.getBoundingClientRect().height > 0 && getComputedStyle(e).position !== 'sticky').slice(0, 60).map(e => [e.tagName.toLowerCase() + '.' + (typeof e.className === 'string' ? e.className.split(' ')[0] : ''), Math.round(e.getBoundingClientRect().top + document.getElementById('main').scrollTop * (parseFloat(getComputedStyle(document.documentElement).zoom) || 1)), Math.round(e.getBoundingClientRect().height)]));
        if (lay0) { const d = lay.find((x, i) => lay0[i] && lay0[i][0] === x[0] && (Math.abs(lay0[i][1] - x[1]) > 1 || Math.abs(lay0[i][2] - x[2]) > 1)); if (d) { const o = lay0[lay.indexOf(d)]; await log('scrolled', [{ kind: 'layout jumps while scrolling', el: d[0], px: (d[1] - o[1]) + '/' + (d[2] - o[2]), text: `top ${o[1]}->${d[1]}, height ${o[2]}->${d[2]}` }]); } }
        lay0 = lay;
        if (w === 1440 && theme === 'light' && FILM) await p.screenshot({ path: `${outdir}/film-${pg.replace(':', '-')}-${String(y).padStart(5, '0')}.png` });
      }
      await p.evaluate(() => { (document.getElementById('main') || document.scrollingElement).scrollTop = 0 });
      // hover each kind of control once: a hover should never move the layout
      const moved = await p.evaluate(async () => {
        const out = []; const kinds = new Set();
        for (const e of document.querySelectorAll('main button, main a, main tr.click, main .kc')) {
          const k = e.tagName + '.' + e.className; if (kinds.has(k) || !e.offsetParent) continue; kinds.add(k); if (kinds.size > 25) break;
          const m = document.querySelector('main'); const before = m.scrollHeight + ':' + m.scrollWidth;
          e.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); e.classList.add('__hov');
          await new Promise(r => setTimeout(r, 30)); const after = m.scrollHeight + ':' + m.scrollWidth;
          e.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })); e.classList.remove('__hov');
          if (before !== after) out.push({ kind: 'hover moves the page', el: k.slice(0, 60), text: (e.innerText || '').slice(0, 40) });
        }
        return out;
      });
      await log('hover', moved);
      // real hover with the mouse on the first rows, then check overrun under hover styles
      for (const sel of ['main tbody tr', 'main .kc', 'main .tile']) { const e = await p.$(sel); if (e) { await e.hover().catch(() => { }); await p.waitForTimeout(150); await log('hover', await p.evaluate(DETECT)); } }
      // open the first edit window on the page and check it while open, then after closing
      const opener = await p.$('main [data-act=open]');
      if (opener) {
        await opener.click().catch(() => { }); await p.waitForTimeout(80);
        // mid-animation frame
        await log('edit window opening', await p.evaluate(DETECT)); await p.waitForTimeout(350);
        await p.evaluate(() => document.querySelectorAll('#drawer details').forEach(d => d.open = true));
        await log('edit window open', await p.evaluate(DETECT)); await log('edit window open', await p.evaluate(OVERLAP));
        const c = await p.$('#drawer:not([hidden]) [data-act=close]'); if (c) await c.click(); await p.waitForTimeout(200);
        const left = await p.evaluate(() => { const d = document.getElementById('drawer'); return d.hidden ? '' : 'drawer still open'; });
        if (left) await log('edit window closed', [{ kind: left, el: '#drawer' }]);
      }
    }
    for (const e of errs) all.push({ key: 'err' + e, kind: 'script error', page: '', step: '', where: [`${w}x${h} ${theme}`], text: e });
    await p.close();
  }
  await b.close();
  fs.writeFileSync(outdir + '/report.json', JSON.stringify(all, null, 1));
  const by = {}; for (const f of all) by[f.kind] = (by[f.kind] || 0) + 1;
  console.log('problems found:', all.length, JSON.stringify(by));
  for (const f of all) console.log(`- [${f.kind}] ${f.page} / ${f.step}: ${f.el}${f.box ? ' in ' + f.box : ''}${f.bar ? ' over ' + f.bar : ''} ${f.px ? '(' + f.px + 'px)' : ''} "${f.text || ''}" @ ${f.where.length} views ${f.img ? '-> ' + f.img : ''}`);
})();
