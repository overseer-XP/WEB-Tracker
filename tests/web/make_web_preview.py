"""Build the website version against the in-memory Supabase stand-in, so the normal test suites can run on it.

Usage: python3 -I tests/web/make_web_preview.py <live_dir> <out.html> [lead|member|view|signedout]
"""
import json, os, sys
live, out = sys.argv[1:3]
role = sys.argv[3] if len(sys.argv) > 3 else "lead"
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
read = lambda p: open(os.path.join(root, p)).read()
docs = {c: {f[:-5]: json.load(open(os.path.join(live, c, f))) for f in os.listdir(os.path.join(live, c)) if f.endswith(".json")}
        for c in os.listdir(live) if os.path.isdir(os.path.join(live, c))}
members = [{"email": "lead@test.local", "person": "Noopur", "role": "lead", "active": True},
           {"email": "member@test.local", "person": "Cat", "role": "member", "active": True},
           {"email": "view@test.local", "person": "Ben", "role": "view", "active": True}]
session = {"lead": "lead@test.local", "member": "member@test.local", "view": "view@test.local"}.get(role)
fake = {"docs": docs, "members": members, "session": session, "code": "123456"}
head = ("<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
        "<script>window.__FAKE=%s;window.__SEED=JSON.parse(JSON.stringify(window.__FAKE.docs))</script><script>%s</script>"
        "<script>window.__TRACKER_CFG={url:'https://test.supabase.co',key:'test-key-not-real-000000'}</script><script>%s</script></head><body>"
        % (json.dumps(fake), read("tests/web/fake_supabase.js"), read("web/shim.js")))
open(out, "w").write(head + read("app/index.html") + "</body></html>")
print("web preview", out, role)
