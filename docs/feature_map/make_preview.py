"""Build a local copy of the app that runs on an exported data folder (no claude.ai needed).

Usage: python3 -I docs/feature_map/make_preview.py <live_dir> <app/index.html> <out.html> [lead|member|view]
Used only to take screenshots for the feature map. Writes are kept in memory.
"""
import json, os, sys
live, app, out = sys.argv[1:4]
role = sys.argv[4] if len(sys.argv) > 4 else "lead"
data = {c: {f[:-5]: json.load(open(os.path.join(live, c, f))) for f in os.listdir(os.path.join(live, c)) if f.endswith(".json")}
        for c in os.listdir(live) if os.path.isdir(os.path.join(live, c))}
stub = """<script>window.__SEED=%s;window.__ROLE="%s";
(function(){const D=JSON.parse(JSON.stringify(window.__SEED));const subs=[];
function snap(c){const o=D[c]||{};return{docs:Object.keys(o).map(id=>({id,exists:true,data:()=>o[id],metadata:{}})),size:0,empty:false,docChanges:()=>[]}}
function fire(c){subs.filter(s=>s.c===c).forEach(s=>s.f(snap(c)))}
const col=c=>({doc:id=>ref(c+"/"+(id||("n"+Math.random().toString(36).slice(2,8)))),onSnapshot:f=>{subs.push({c,f});setTimeout(()=>f(snap(c)),5);return()=>{}},orderBy(){return this},limit(){return this},where(){return this}});
function ref(p){const a=p.split("/"),id=a.pop(),c=a.join("/");return{id,path:p,get:async()=>({id,exists:!!(D[c]&&D[c][id]),data:()=>D[c]&&D[c][id]}),
 set:async b=>{if(window.__ROLE==="view")throw{code:"invalid_argument"};D[c]=D[c]||{};D[c][id]=JSON.parse(JSON.stringify(b));fire(c)},
 update:async b=>{if(window.__ROLE==="view")throw{code:"invalid_argument"};const m=(t,s)=>{for(const k in s){if(s[k]&&typeof s[k]==="object"&&!Array.isArray(s[k])&&t[k]&&typeof t[k]==="object")m(t[k],s[k]);else t[k]=s[k]}};m(D[c][id],JSON.parse(JSON.stringify(b)));fire(c)},
 delete:async()=>{delete D[c][id];fire(c)}}}
const user={id:async()=>"u1",canEdit:async()=>window.__ROLE==="lead",can:async()=>true,me:async()=>({name:"Noopur",id:"u1"}),isOwner:async()=>true};
window.claude={use:async n=>n==="db"?{collection:col,doc:ref}:n==="user"?user:null};})();</script>""" % (json.dumps(data), role)
open(out, "w").write("<!doctype html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'></head><body>"
                     + stub + open(app).read() + "</body></html>")
print("preview", out)
