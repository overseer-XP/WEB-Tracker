// Checks that only apply to the website build: sign-in, no access, live updates from someone else, the build script and the import page.
// Usage: node tests/web/web_test.js <live_dir>
const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const root = path.join(__dirname, '..', '..'); const live = path.resolve(process.argv[2] || '.live');
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'webtest-'));
const res = []; const check = (what, ok, d = '') => res.push([ok ? 'OK  ' : 'FAIL', what, d]);
const build = (role, out) => execFileSync('python3', ['-I', path.join(root, 'tests/web/make_web_preview.py'), live, out, role]);
(async () => {
  const b = await chromium.launch();
  // 1. Sign-in with a code
  const so = path.join(tmp, 'signedout.html'); build('signedout', so);
  let p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + so + '#overview'); await p.waitForTimeout(400);
  check('Signed out: sign-in screen shows, tracker hidden', !!(await p.$('#gate #g-e')) && !(await p.$('main h1:has-text("Overview")')));
  await p.fill('#g-e', 'Lead@Test.local'); await p.click('#gate button[type=submit]'); await p.waitForTimeout(200);
  check('Email step asks for the code and lower-cases the email', (await p.evaluate(() => window.__FAKE.sent)).includes('lead@test.local') && !!(await p.$('#g-c')));
  await p.fill('#g-c', '000000'); await p.click('#gate button[type=submit]'); await p.waitForTimeout(200);
  check('A wrong code is refused with a message', (await p.$eval('#g-err', e => e.textContent)).includes('did not work'));
  await p.fill('#g-c', '123 456'); await p.click('#gate button[type=submit]'); await p.waitForTimeout(900);
  check('The right code signs in and the tracker loads', !(await p.$('#gate')) && (await p.$eval('main', e => e.innerText)).length > 50);
  check('Lead gets Lead / admin rights', (await p.$eval('body', e => e.innerText)).includes('Lead / admin'));
  check('Sign out button is there', !!(await p.$('#signout')));
  // 2. Live update from someone else
  await p.evaluate(() => { location.hash = 'brand-bespoke' }); await p.waitForTimeout(400);
  await p.evaluate(() => window.__sb.rpc('doc_merge', { p_coll: 'brands', p_id: 'bespoke', p_patch: { next_step: 'Changed by someone else just now' } }));
  await p.waitForTimeout(400);
  check('A change made elsewhere appears without reloading', (await p.$eval('main', e => e.innerText)).includes('Changed by someone else just now'));
  await p.evaluate(() => window.__sb.from('docs').delete().eq('coll', 'comments').eq('id', Object.keys(window.__FAKE.docs.comments || { x: 1 })[0]));
  check('No script errors while signing in and syncing', errs.length === 0, errs.join(' | '));
  await p.close();
  // 3. Signed in but not on the team list
  p = await b.newPage(); await p.goto('file://' + so + '#overview'); await p.waitForTimeout(300);
  await p.fill('#g-e', 'stranger@else.com'); await p.click('#gate button[type=submit]'); await p.waitForTimeout(150); await p.fill('#g-c', '123456'); await p.click('#gate button[type=submit]'); await p.waitForTimeout(500);
  check('Someone not on the team list sees No access and no data', (await p.$eval('#gate', e => e.innerText)).includes('No access') && !(await p.$('main .blink')));
  await p.close();
  // 4. Build script: refuses without settings, builds with them
  let refused = false; try { execFileSync('node', [path.join(root, 'web/build.mjs')], { env: { PATH: process.env.PATH }, stdio: 'pipe' }) } catch (e) { refused = /Missing or wrong SUPABASE_URL/.test(String(e.stderr)) }
  check('Build stops with a clear message when the Vercel settings are missing', refused);
  execFileSync('node', [path.join(root, 'web/build.mjs')], { env: { PATH: process.env.PATH, SUPABASE_URL: 'https://abcdefgh.supabase.co', SUPABASE_ANON_KEY: 'public-test-key-0123456789' }, stdio: 'pipe' });
  const dist = path.join(root, 'web/dist'); const idx = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  check('Build writes the tracker, the import page and robots.txt', fs.existsSync(path.join(dist, 'import.html')) && fs.existsSync(path.join(dist, 'robots.txt')) && idx.includes('abcdefgh.supabase.co') && idx.includes(fs.readFileSync(path.join(root, 'app/index.html'), 'utf8').slice(0, 200)));
  check('Build pins the Supabase library version', /supabase-js@\d+\.\d+\.\d+\//.test(idx));
  // 5. Import page copies a backup and checks the counts
  const docs = {}; for (const c of fs.readdirSync(live)) { const d = path.join(live, c); if (!fs.statSync(d).isDirectory()) continue; docs[c] = {}; for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) docs[c][f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(d, f))) }
  const backup = Object.assign({ exported_at: '2026-10-27T10:00:00Z' }, docs); const bf = path.join(tmp, 'backup.json'); fs.writeFileSync(bf, JSON.stringify(backup));
  const total = Object.values(docs).reduce((a, o) => a + Object.keys(o).length, 0);
  const fake = { docs: {}, members: [{ email: 'lead@test.local', person: 'Noopur', role: 'lead', active: true }], session: 'lead@test.local' };
  const imp = fs.readFileSync(path.join(dist, 'import.html'), 'utf8').replace(/<script src="https:\/\/cdn\.jsdelivr[^>]*><\/script>/, `<script>window.__FAKE=${JSON.stringify(fake)}</script><script>${fs.readFileSync(path.join(root, 'tests/web/fake_supabase.js'), 'utf8')}</script>`);
  const ip = path.join(tmp, 'import.html'); fs.writeFileSync(ip, imp);
  p = await b.newPage(); const ierr = []; p.on('pageerror', e => ierr.push(e.message)); await p.goto('file://' + ip); await p.waitForTimeout(400);
  await p.setInputFiles('#file', bf); await p.waitForTimeout(400);
  check('Import page lists every collection before copying', (await p.$$('#out tr')).length === Object.keys(docs).length + 1);
  await p.click('#go'); await p.waitForTimeout(1500);
  const copied = await p.evaluate(() => Object.values(window.__FAKE.docs).reduce((a, o) => a + Object.keys(o).length, 0));
  check('Import copies every record and says so', copied === total && (await p.$eval('#out', e => e.innerText)).includes('Every record copied'), copied + ' of ' + total);
  check('Import page has no script errors', ierr.length === 0, ierr.join(' | '));
  await p.close();
  // 6. Import page refuses a non-lead
  fake.members[0].role = 'member'; fs.writeFileSync(ip, imp.replace(/"role":"lead"/, '"role":"member"'));
  p = await b.newPage(); await p.goto('file://' + ip); await p.waitForTimeout(400);
  check('Import page is for leads only', (await p.$eval('#main', e => e.innerText)).includes('Leads only'));
  await b.close();
  fs.rmSync(dist, { recursive: true, force: true });
  for (const r of res) console.log(r[0], r[1], r[2] ? '(' + r[2] + ')' : '');
  console.log(`\n${res.filter(r => r[0] === 'OK  ').length} of ${res.length} website checks pass`);
})();
