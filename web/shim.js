/* Website layer for the Valerie COE Tracker.
   The app (app/index.html) talks to a small database interface: collection(), doc(), get, set, update, delete, onSnapshot.
   On claude.ai that interface comes from the page. Here it is answered by Supabase, so the same app file runs in both places.
   Sign-in: the person types their work email, gets a 6-digit code by email, and types it in. */
(function () {
  const CFG = window.__TRACKER_CFG || {};
  const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  window.__sb = sb;
  let session = null, member = null, markReady;
  const ready = new Promise(r => { markReady = r });

  /* ---------- sign-in screen ---------- */
  const css = `#gate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#F3F5F4;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#22292C;padding:16px}
  #gate .box{background:#fff;border:1px solid #DDE3E1;border-radius:16px;box-shadow:0 4px 24px rgb(0 0 0/.06);padding:28px;max-width:400px;width:100%}
  #gate h1{font-size:22px;margin:0 0 4px}#gate p{margin:0 0 16px;color:#59646A;font-size:15px;line-height:1.5}
  #gate label{display:block;font-size:13px;font-weight:600;margin:0 0 6px}
  #gate input{box-sizing:border-box;width:100%;font:inherit;font-size:16px;padding:11px 12px;border:1px solid #B9C3C0;border-radius:10px;margin-bottom:14px;background:#fff;color:#22292C}
  #gate input.code{letter-spacing:.3em;font-size:22px;text-align:center}
  #gate button{font:inherit;font-weight:600;font-size:15px;min-height:44px;padding:10px 16px;border-radius:10px;border:0;background:#396C7D;color:#fff;cursor:pointer;width:100%}
  #gate button.link{background:none;color:#396C7D;width:auto;padding:8px 0;margin-top:8px}
  #gate .err{color:#9F4E48;font-size:14px;margin:-6px 0 12px;min-height:1em}
  #signout{position:fixed;left:12px;bottom:12px;z-index:50;font:600 12px system-ui,sans-serif;background:#fff;border:1px solid #DDE3E1;border-radius:8px;padding:6px 10px;min-height:32px;cursor:pointer;color:#59646A}
  @media (max-width:900px){#signout{display:none}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function gate(html) { let g = document.getElementById("gate"); if (!g) { g = document.createElement("div"); g.id = "gate"; document.body.appendChild(g) } g.innerHTML = `<div class="box">${html}</div>`; return g }
  function hideGate() { const g = document.getElementById("gate"); if (g) g.remove() }
  function askEmail(msg) {
    const g = gate(`<h1>Valerie COE Tracker</h1><p>Sign in with your work email. We will email you a 6-digit code.</p>
      <form id="g-f"><label for="g-e">Work email</label><input id="g-e" type="email" autocomplete="email" required><div class="err" id="g-err">${esc(msg || "")}</div><button type="submit">Email me a code</button></form>`);
    const f = g.querySelector("#g-f"); g.querySelector("#g-e").focus();
    f.onsubmit = async e => {
      e.preventDefault(); const email = g.querySelector("#g-e").value.trim().toLowerCase(); const b = f.querySelector("button"); b.disabled = true; b.textContent = "Sending...";
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) { b.disabled = false; b.textContent = "Email me a code"; g.querySelector("#g-err").textContent = /rate|seconds/i.test(error.message) ? "Too many codes asked for. Wait a minute and try again." : "Could not send the code. Check the address and try again."; return }
      askCode(email)
    }
  }
  function askCode(email) {
    const g = gate(`<h1>Check your inbox</h1><p>We sent a 6-digit code to <b>${esc(email)}</b>. It can take a minute. Check Junk if it does not arrive.</p>
      <form id="g-f"><label for="g-c">Code</label><input id="g-c" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required><div class="err" id="g-err"></div><button type="submit">Sign in</button></form><button class="link" id="g-back">Use a different email</button>`);
    g.querySelector("#g-c").focus(); g.querySelector("#g-back").onclick = () => askEmail();
    const f = g.querySelector("#g-f");
    f.onsubmit = async e => {
      e.preventDefault(); const token = g.querySelector("#g-c").value.replace(/\s/g, ""); const b = f.querySelector("button"); b.disabled = true; b.textContent = "Checking...";
      const { data, error } = await sb.auth.verifyOtp({ email, token, type: "email" });
      if (error) { b.disabled = false; b.textContent = "Sign in"; g.querySelector("#g-err").textContent = "That code did not work. Check it, or go back and ask for a new one."; return }
      signedIn(data.session)
    }
  }
  async function signedIn(s) {
    session = s;
    const { data, error } = await sb.from("members").select("email,person,role,active").eq("email", s.user.email.toLowerCase()).maybeSingle();
    if (error || !data || !data.active) {
      const g = gate(`<h1>No access yet</h1><p>You are signed in as <b>${esc(s.user.email)}</b>, but this email is not on the tracker's team list. Ask a lead to add you.</p><button id="g-out">Sign out</button>`);
      g.querySelector("#g-out").onclick = async () => { await sb.auth.signOut(); askEmail() }; return
    }
    member = data; hideGate();
    const so = document.createElement("button"); so.id = "signout"; so.textContent = "Sign out"; so.title = "Signed in as " + s.user.email;
    so.onclick = async () => { await sb.auth.signOut(); location.reload() }; document.body.appendChild(so);
    markReady()
  }
  async function start() {
    const { data } = await sb.auth.getSession();
    if (data && data.session) signedIn(data.session); else askEmail()
  }
  sb.auth.onAuthStateChange((ev, s) => { if (ev === "SIGNED_OUT" && member) location.reload(); if (s) session = s });

  /* ---------- the database interface the app expects ---------- */
  const split = p => { const a = p.split("/"); const id = a.pop(); return [a.join("/"), id] };
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "").slice(0, 20);
  const clean = v => JSON.parse(JSON.stringify(v === undefined ? null : v));
  // Supabase refuses with a row-level-security error when someone may not write; the app reads that as "view only".
  const norm = e => { const m = (e && (e.message || "")) + ""; if (e && (e.code === "42501" || /row-level security|permission denied/i.test(m))) return { code: "invalid_argument", message: m }; return { code: "unavailable", message: m } };
  const stores = {}, listeners = {};
  const snapOf = (c, q) => {
    let rows = Object.entries(stores[c] || {}).map(([id, data]) => ({ id, data }));
    if (q && q.order) { const [f, dir] = q.order; rows.sort((a, b) => String(a.data[f] ?? "").localeCompare(String(b.data[f] ?? "")) * (dir === "desc" ? -1 : 1)) }
    if (q && q.limit) rows = rows.slice(0, q.limit);
    return { docs: rows.map(r => ({ id: r.id, exists: true, data: () => r.data, metadata: {} })), size: rows.length, empty: !rows.length, docChanges: () => [] }
  };
  const pending = new Set(); let flushT = 0;
  function emit(c) { pending.add(c); if (flushT) return; flushT = setTimeout(() => { flushT = 0; for (const k of pending) (listeners[k] || []).forEach(l => { try { l.f(snapOf(k, l.q)) } catch (e) { console.error(e) } }); pending.clear() }, 30) }
  async function loadAll(c) {
    const out = {}; const step = 1000;
    for (let from = 0; ; from += step) {
      const { data, error } = await sb.from("docs").select("id,data").eq("coll", c).order("id").range(from, from + step - 1);
      if (error) throw norm(error);
      for (const r of data) out[r.id] = r.data;
      if (data.length < step) break
    }
    stores[c] = out; emit(c)
  }
  function local(c, id, data) { stores[c] = stores[c] || {}; if (data === null) delete stores[c][id]; else stores[c][id] = data; emit(c) }
  let channel = null, everSubscribed = false;
  function live() {
    if (channel) return;
    channel = sb.channel("docs-all").on("postgres_changes", { event: "*", schema: "public", table: "docs" }, p => {
      if (p.eventType === "DELETE") { const o = p.old || {}; if (o.coll && stores[o.coll]) local(o.coll, o.id, null) }
      else { const n = p.new || {}; if (n.coll && listeners[n.coll]) local(n.coll, n.id, n.data) }
    }).subscribe(status => {
      if (status === "SUBSCRIBED") { if (everSubscribed) Object.keys(listeners).forEach(c => loadAll(c).catch(() => {})); everSubscribed = true }
    })
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && member) Object.keys(listeners).forEach(c => loadAll(c).catch(() => {})) });
  function ref(path) {
    const [c, id] = split(path);
    return {
      id, path,
      async get() { const { data, error } = await sb.from("docs").select("data").eq("coll", c).eq("id", id).maybeSingle(); if (error) throw norm(error); return { id, exists: !!data, data: () => data ? data.data : undefined } },
      async set(b) { const body = clean(b); const { error } = await sb.from("docs").upsert({ coll: c, id, data: body, updated_at: new Date().toISOString() }); if (error) throw norm(error); if (listeners[c]) local(c, id, body) },
      async update(b) { const { error } = await sb.rpc("doc_merge", { p_coll: c, p_id: id, p_patch: clean(b) }); if (error) throw norm(error) },
      async delete() { const { error } = await sb.from("docs").delete().eq("coll", c).eq("id", id); if (error) throw norm(error); if (stores[c]) local(c, id, null) }
    }
  }
  function collection(c) {
    const q = {};
    const api = {
      doc: id => ref(c + "/" + (id || newId())),
      orderBy(f, dir) { q.order = [f, dir || "asc"]; return api },
      limit(n) { q.limit = n; return api },
      where() { return api },
      onSnapshot(f, onErr) {
        const l = { f, q: Object.assign({}, q) }; (listeners[c] = listeners[c] || []).push(l); live();
        if (stores[c]) setTimeout(() => f(snapOf(c, l.q)), 0); else loadAll(c).catch(e => onErr && onErr(e));
        return () => { listeners[c] = (listeners[c] || []).filter(x => x !== l) }
      }
    };
    return api
  }
  const db = { collection, doc: ref };
  const user = {
    id: async () => session.user.id,
    canEdit: async () => member.role === "lead",
    can: async perm => perm === "data.write" ? member.role !== "view" : true,
    me: async () => ({ name: member.person || session.user.email, id: session.user.id }),
    isOwner: async () => member.role === "lead"
  };
  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data]); const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
    }
  };
  window.claude = { use: async name => { await ready; return name === "db" ? db : name === "user" ? user : name === "downloads" ? downloads : null } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
