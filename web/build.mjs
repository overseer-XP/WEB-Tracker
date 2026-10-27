// Builds the website from the same app file used on claude.ai. Vercel runs this on every deploy.
// Needs two environment variables, set in Vercel > Project > Settings > Environment Variables:
//   SUPABASE_URL       for example https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  the public "anon" or "publishable" key (safe in a web page; the database rules do the protecting)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = (process.env.SUPABASE_URL || "").trim(), key = (process.env.SUPABASE_ANON_KEY || "").trim();
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || key.length < 20) {
  console.error("Missing or wrong SUPABASE_URL / SUPABASE_ANON_KEY. Add them in Vercel > Project > Settings > Environment Variables, then redeploy.");
  process.exit(1);
}
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const lib = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js"></script>`;
const cfg = `<script>window.__TRACKER_CFG=${JSON.stringify({ url, key })}</script>`;
const shim = `<script>${read("web/shim.js")}</script>`;
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title>${lib}${cfg}${shim}</head><body>${body}</body></html>`;
const out = path.join(root, "web", "dist");
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), page("Valerie COE Tracker", read("app/index.html")));
fs.writeFileSync(path.join(out, "import.html"), page("Import data · Valerie COE Tracker",
  `<style>body{font-family:system-ui,sans-serif;color:#22292C;max-width:760px;margin:40px auto;padding:0 16px}table{border-collapse:collapse;margin:12px 0}td,th{border:1px solid #DDE3E1;padding:6px 10px;text-align:left}button{font:inherit;font-weight:600;min-height:44px;padding:10px 16px;border-radius:10px;border:0;background:#396C7D;color:#fff;cursor:pointer}.bad{color:#9F4E48}.warn{color:#856325}</style>
  <main id="main"><h1>Copy the claude.ai tracker into the website</h1><p>In the claude.ai tracker open Settings, then Export, then JSON backup. Pick that file here. Records with the same id are replaced; nothing is deleted.</p>
  <p id="pick" hidden><label>Backup file <input type="file" id="file" accept=".json,application/json"></label></p><div id="out"></div></main><script>${read("web/import.js")}</script>`));
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
console.log("Built web/dist for", url);
