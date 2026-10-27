/* One-time copy of the claude.ai tracker into Supabase. Leads only.
   In the claude.ai tracker: Settings > Export > JSON backup. Then open <website>/import.html, sign in, pick that file. */
(function () {
  const sb = window.__sb;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const out = $("#out");
  const say = (html) => { out.innerHTML += `<p>${html}</p>` };
  async function count(c) { const { count: n, error } = await sb.from("docs").select("id", { count: "exact", head: true }).eq("coll", c); if (error) throw error; return n }
  window.claude.use("user").then(async u => {
    if (!(await u.canEdit())) { $("#main").innerHTML = "<h1>Leads only</h1><p>Only a lead can import data.</p>"; return }
    $("#pick").hidden = false;
    $("#file").onchange = async e => {
      const f = e.target.files[0]; if (!f) return; out.innerHTML = "";
      let dump; try { dump = JSON.parse(await f.text()) } catch (x) { say("That file is not a tracker backup (not JSON)."); return }
      const colls = Object.keys(dump).filter(k => k !== "exported_at" && dump[k] && typeof dump[k] === "object");
      if (!colls.length) { say("No collections found in that file."); return }
      const rows = colls.map(c => [c, Object.keys(dump[c]).length]);
      const before = {}; for (const [c] of rows) before[c] = await count(c);
      const filled = rows.filter(([c]) => before[c] > 0);
      out.innerHTML = `<p>Backup from <b>${esc(dump.exported_at || "unknown date")}</b>.</p><table><tr><th>Collection</th><th>In the file</th><th>Already in the website</th></tr>${rows.map(([c, n]) => `<tr><td>${esc(c)}</td><td>${n}</td><td>${before[c]}</td></tr>`).join("")}</table>
        ${filled.length ? `<p class="warn">The website already has data. Importing replaces records with the same id and keeps the rest.</p>` : ""}<button id="go">Copy ${rows.reduce((a, [, n]) => a + n, 0)} records</button>`;
      $("#go").onclick = async () => {
        $("#go").disabled = true; $("#go").textContent = "Copying...";
        const res = [];
        for (const [c, n] of rows) {
          const list = Object.entries(dump[c]).map(([id, data]) => ({ coll: c, id, data, updated_at: new Date().toISOString() }));
          let failed = 0;
          for (let i = 0; i < list.length; i += 200) { const { error } = await sb.from("docs").upsert(list.slice(i, i + 200)); if (error) { failed += Math.min(200, list.length - i); console.error(c, error) } }
          const after = await count(c); res.push([c, n, after, failed])
        }
        const bad = res.filter(([, n, after, failed]) => failed || after < n);
        out.innerHTML = `<table><tr><th>Collection</th><th>In the file</th><th>Now in the website</th><th>Check</th></tr>${res.map(([c, n, after, failed]) => `<tr><td>${esc(c)}</td><td>${n}</td><td>${after}</td><td>${failed || after < n ? `<b class="bad">${failed} not copied</b>` : "OK"}</td></tr>`).join("")}</table>
          <p>${bad.length ? `<b class="bad">${bad.length} collection${bad.length > 1 ? "s" : ""} did not copy fully.</b> Nothing was deleted. Send a screenshot of this page.` : "<b>Every record copied.</b> Open the tracker: <a href='/'>go to the tracker</a>."}</p>`
      }
    }
  })
})();
