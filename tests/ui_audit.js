// UI/UX rule check (rules from the UI UX Pro Max skill that a browser can measure).
// Visits every page in light and dark, at desktop (1440) and phone (375) width, and counts rule breaks.
// Usage: node tests/ui_audit.js <preview.html> [out.json]
const path = require('path'); const fs = require('fs');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const url = 'file://' + path.resolve(process.argv[2]);

const measure = () => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden]') && !e.closest('.sr') && !(e.closest('details:not([open])') && !e.closest('summary')) };
  const rgb = c => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0] };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) };
  const blend = (top, bot) => { const a = top[3] === undefined ? 1 : top[3]; return [0, 1, 2].map(i => top[i] * a + bot[i] * (1 - a)).concat([1]) };
  const bgOf = e => { const layers = []; let n = e; while (n && n.nodeType === 1) { const s = getComputedStyle(n); const c = rgb(s.backgroundColor); if ((c[3] === undefined || c[3] > 0) && s.backgroundColor !== 'rgba(0, 0, 0, 0)') layers.push(c); if (s.backgroundImage && s.backgroundImage.includes('gradient') && !layers.length) return null; if (layers.length && (layers[layers.length - 1][3] === undefined || layers[layers.length - 1][3] === 1)) break; n = n.parentElement }
    let out = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) out = blend(layers[i], out); return out };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
  const label = e => (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase());
  const out = { contrast: [], small: [], tiny: [], target24: [], target44: [], noName: [], noLabel: [], headings: [], emoji: [], truncNoTitle: [] };
  // text contrast and size
  for (const e of document.querySelectorAll('main *, #topbar *, #rail *, #drawer *')) {
    if (!vis(e)) continue; const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!own) continue;
    const s = getComputedStyle(e); const fs = parseFloat(s.fontSize); const fw = +s.fontWeight || 400; const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 40);
    const bg = bgOf(e); if (bg) { const r = ratio(blend(rgb(s.color), bg), bg); const large = fs >= 24 || (fs >= 18.66 && fw >= 700); if (r < (large ? 3 : 4.5)) out.contrast.push({ el: label(e), text: t, ratio: Math.round(r * 100) / 100, size: fs }) }
    if (fs < 12) out.tiny.push({ el: label(e), text: t, size: fs }); else if (fs < 13) out.small.push({ el: label(e), text: t, size: fs });
    if (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1 && !e.title && !(e.closest('[title]'))) out.truncNoTitle.push({ el: label(e), text: t });
    if (/\p{Extended_Pictographic}/u.test(t)) out.emoji.push({ el: label(e), text: t });
  }
  // controls: size, name, labels
  for (const e of document.querySelectorAll('button, a[href], select, input:not([type=hidden]), textarea, [role=button], [data-act]')) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect(); const name = (e.getAttribute('aria-label') || e.innerText || e.value || e.title || '').trim();
    const inline = getComputedStyle(e).display === 'inline' && e.tagName === 'A';
    if (!inline && (r.width < 24 || r.height < 24)) out.target24.push({ el: label(e), name: name.slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    if (!inline && (r.width < 44 || r.height < 44)) out.target44.push({ el: label(e), name: name.slice(0, 30), h: Math.round(r.height) });
    if (/^(BUTTON|A)$/.test(e.tagName) && !name && !e.getAttribute('aria-labelledby')) out.noName.push({ el: label(e) });
    if (/INPUT|SELECT|TEXTAREA/.test(e.tagName) && !['checkbox', 'radio'].includes(e.type)) { const has = e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) || e.closest('label'); if (!has) out.noLabel.push({ el: label(e), name: e.name || e.id || e.placeholder || '' }) }
  }
  // heading order
  let last = 0; for (const h of document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')) { if (!vis(h)) continue; const l = +h.tagName[1]; if (last && l > last + 1) out.headings.push(`${h.tagName} after H${last}: ${h.innerText.slice(0, 30)}`); last = l }
  return out;
};

(async () => {
  const b = await chromium.launch(); const all = {}; const errs = [];
  const pages = [['overview'], ['mine'], ['leadership'], ['people'], ['sow'], ['access'], ['bp'], ['settings'], ['brand-bespoke', 'campaigns'], ['brand-bespoke', 'campaign'], ['brand-bespoke', 'card'], ['brand-bespoke', 'steps'], ['brand-celf', 'board']];
  for (const [w, wl] of [[1440, 'desktop'], [375, 'phone']]) for (const theme of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(url + '#overview'); await p.waitForTimeout(600);
    await p.evaluate(t => { localStorage.setItem('vt-theme', t); localStorage.setItem('vt-simple', '0') }, theme); await p.reload(); await p.waitForTimeout(600);
    if (await p.$('#whoSel')) await p.selectOption('#whoSel', 'Sairaj').catch(() => {});
    for (const [h, sub] of pages) {
      await p.evaluate(h => { location.hash = h }, h); await p.waitForTimeout(250);
      if (sub) { await p.click('button[data-tab=tasks]').catch(() => {}); await p.waitForTimeout(150) }
      if (sub === 'campaign' || sub === 'card') { await p.click('[data-act=camp][data-id=bespoke-plumpicity-launch]').catch(() => {}); await p.waitForTimeout(250) }
      if (sub === 'card') { await p.click('.kc').catch(() => {}); await p.waitForTimeout(250) }
      if (sub === 'steps') { await p.click('[data-act=camp][data-id=""]').catch(() => {}); await p.click('button[data-tab=steps]').catch(() => {}); await p.waitForTimeout(200) }
      const key = `${wl}/${theme}/${h}${sub ? '/' + sub : ''}`; all[key] = await p.evaluate(measure);
      await p.evaluate(() => { document.getElementById('modal').hidden = true }); const c = await p.$('#drawer:not([hidden]) [data-act=close]'); if (c) await c.click();
      if (sub) { await p.click('[data-act=camp][data-id=""]').catch(() => {}); await p.click('button[data-tab=tasks]').catch(() => {}) }
    }
    await p.close();
  }
  await b.close();
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ all, errs }, null, 1));
  const sum = {}; for (const [k, v] of Object.entries(all)) for (const [r, xs] of Object.entries(v)) { sum[r] = sum[r] || {}; sum[r][k] = xs.length }
  for (const [r, by] of Object.entries(sum)) console.log(r.padEnd(13), Object.entries(by).filter(([, n]) => n).map(([k, n]) => `${k}:${n}`).join('  ') || 'none');
  console.log('script errors', errs.length);
})();
