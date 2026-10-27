/* A stand-in for supabase-js, kept in memory, so the website build can be tested without a real project.
   Seed: window.__FAKE = { docs: {coll: {id: data}}, members: [{email, person, role, active}], session: email|null, code: "123456" }.
   It applies the same write rules as supabase/schema.sql (lead / member / view, config and steps for leads only). */
(function () {
  const F = window.__FAKE; const docs = F.docs; const members = F.members || [];
  const channels = [];
  let session = null;
  const mk = email => ({ access_token: "t", user: { id: "u-" + email.replace(/[^a-z0-9]/g, ""), email } });
  if (F.session) session = mk(F.session);
  const role = () => { const m = session && members.find(x => x.email === session.user.email && x.active !== false); return m ? m.role : null };
  const mayWrite = c => { const r = role(); if (!r) return false; if (c.startsWith("data/users/")) return c === "data/users/" + session.user.id; if (c === "config" || c === "steps") return r === "lead"; return r === "lead" || r === "member" };
  const mayRead = c => !!role() && (!c.startsWith("data/users/") || c === "data/users/" + session.user.id);
  const rls = () => ({ code: "42501", message: "new row violates row-level security policy" });
  const merge = (a, b) => { if (!a || typeof a !== "object" || Array.isArray(a) || !b || typeof b !== "object" || Array.isArray(b)) return b; const r = Object.assign({}, a); for (const k in b) r[k] = (r[k] && typeof r[k] === "object" && !Array.isArray(r[k]) && b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) ? merge(r[k], b[k]) : b[k]; return r };
  const fire = (eventType, coll, id, data) => setTimeout(() => channels.forEach(h => h({ eventType, new: eventType === "DELETE" ? {} : { coll, id, data }, old: { coll, id } })), 5);
  const copy = v => JSON.parse(JSON.stringify(v));
  function from(table) {
    const q = { table, filters: {}, op: "select" };
    const run = async () => {
      if (q.table === "members") {
        if (q.op !== "select") return role() === "lead" ? { data: null, error: null } : { data: null, error: rls() };
        let rows = role() ? members.filter(m => Object.entries(q.filters).every(([k, v]) => m[k] === v)) : [];
        return q.single ? { data: rows[0] || null, error: null } : { data: rows, error: null }
      }
      const c = q.filters.coll;
      if (q.op === "select") {
        if (!mayRead(c)) return q.single ? { data: null, error: null } : { data: [], error: null, count: 0 };
        let rows = Object.entries(docs[c] || {}).map(([id, data]) => ({ id, data: copy(data) }));
        if (q.filters.id !== undefined) rows = rows.filter(r => r.id === q.filters.id);
        rows.sort((a, b) => a.id < b.id ? -1 : 1);
        const count = rows.length;
        if (q.range) rows = rows.slice(q.range[0], q.range[1] + 1);
        if (q.head) return { data: null, count, error: null };
        return q.single ? { data: rows[0] || null, error: null } : { data: rows, error: null, count }
      }
      if (q.op === "upsert") {
        const list = Array.isArray(q.body) ? q.body : [q.body];
        if (!list.every(r => mayWrite(r.coll))) return { data: null, error: rls() };
        for (const r of list) { docs[r.coll] = docs[r.coll] || {}; const had = !!docs[r.coll][r.id]; docs[r.coll][r.id] = copy(r.data); fire(had ? "UPDATE" : "INSERT", r.coll, r.id, copy(r.data)) }
        return { data: null, error: null }
      }
      if (q.op === "delete") {
        if (!mayWrite(c)) return { data: null, error: rls() };
        if (docs[c] && docs[c][q.filters.id]) { delete docs[c][q.filters.id]; fire("DELETE", c, q.filters.id) }
        return { data: null, error: null }
      }
    };
    const b = {
      select(cols, opt) { if (opt && opt.head) q.head = true; return b },
      eq(k, v) { q.filters[k] = v; return b },
      order() { return b },
      range(a, z) { q.range = [a, z]; return b },
      maybeSingle() { q.single = true; return b },
      upsert(body) { q.op = "upsert"; q.body = body; return b },
      delete() { q.op = "delete"; return b },
      then(res, rej) { return run().then(res, rej) }
    };
    return b
  }
  const client = {
    auth: {
      async getSession() { return { data: { session } } },
      async signInWithOtp({ email }) { F.sent = (F.sent || []).concat(email); return { error: null } },
      async verifyOtp({ email, token }) { if (token !== (F.code || "123456")) return { data: {}, error: { message: "Token has expired or is invalid" } }; session = mk(email); return { data: { session }, error: null } },
      async signOut() { session = null; return { error: null } },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } }
    },
    from,
    async rpc(name, { p_coll, p_id, p_patch }) {
      if (name !== "doc_merge") return { error: { message: "unknown" } };
      if (!mayWrite(p_coll)) return { error: rls() };
      docs[p_coll] = docs[p_coll] || {}; const had = !!docs[p_coll][p_id];
      docs[p_coll][p_id] = merge(docs[p_coll][p_id] || {}, copy(p_patch)); fire(had ? "UPDATE" : "INSERT", p_coll, p_id, copy(docs[p_coll][p_id]));
      return { error: null }
    },
    channel() { const ch = { on(_t, _f, h) { channels.push(p => { if (p.eventType === "DELETE" || mayRead(p.new.coll)) h(p) }); return ch }, subscribe(cb) { setTimeout(() => cb && cb("SUBSCRIBED"), 0); return ch } }; return ch }
  };
  window.supabase = { createClient: () => client };
})();
