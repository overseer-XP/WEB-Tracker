/* ---------- boot ---------- */
parseHash();
(async()=>{
  if(typeof window.claude==="undefined"||!window.claude.use){$("#main").innerHTML=`<h1>Open this tracker from its claude.ai link</h1><p class="sub">The live team data is stored with the claude.ai page. Ask the owner for the link.</p>`;return}
  db=await claude.use("db");
  if(!db){$("#main").innerHTML=`<h1>Tracker unavailable here</h1><p class="sub">Open the page from claude.ai while signed in to your Valerie account.</p>`;return}
  U=await claude.use("user");dl=await claude.use("downloads");try{memApi=await claude.use("members");if(memApi)MEM=await memApi.list()}catch(e){memApi=null;MEM=null}
  if(U){try{uid=await U.id()}catch(e){}try{canEdit=!!(await U.canEdit())}catch(e){}try{const w=await U.can("data.write");if(w===false)canWrite=false}catch(e){}}
  if(simple===null)simple=!canEdit;
  realEdit=canEdit;realWrite=canWrite;applyRolePreview();
  if(uid){try{const p=await db.doc("data/users/"+uid+"/profile").get();if(p.exists&&p.data().person){me=p.data().person;selfMe=me}}catch(e){}}
  const sub=(k,c)=>db.collection(c).onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{if(d.exists)o[d.id]=Object.assign({},d.data())});
    if(k==="tasks"){const a={};for(const[i,t]of Object.entries(o))if(t.archived){a[i]=t;delete o[i]}S.tarch=a}S[k]=o;ready[k]=true;epoch++;
    if(k==="config"&&!me&&U){U.me().then(v=>{if(!me&&v&&v.name){const first=v.name.split(" ")[0].toLowerCase();const hit=activePeople().find(p=>p.toLowerCase()===first);if(hit){me=hit;selfMe=hit;render()}}}).catch(()=>{})}
    scheduleRender()},err=>{if(err&&err.code!=="revoked")toast("Live updates paused. Reload the page.")});
  for(const[k,c]of Object.entries(COLL))sub(k,c);
  db.collection("log").orderBy("date","desc").limit(30).onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});S.log=o;if(route.v==="changes")render()},()=>{});
})();
})();

/* popups: name them, keep Tab inside, give focus back when they close; long names that are cut off get a hover tip */
(function(){const back={};let lastOut=null;document.addEventListener("focusin",e=>{const x=e.target;if(!x.closest||x.closest("#modal,#drawer"))return;lastOut=x},true);
 document.addEventListener("pointerdown",e=>{const x=e.target.closest&&e.target.closest("[data-act],button,a[href]");if(x&&!x.closest("#modal,#drawer"))lastOut=x},true);const top=()=>{const m=document.getElementById("modal"),d=document.getElementById("drawer");return m&&!m.hidden?m:d&&!d.hidden?d:null};
 const watch=el=>new MutationObserver(()=>{const id=el.id;if(!el.hidden){if(back[id]===undefined)back[id]=lastOut;
   const h=el.querySelector("h1,h2,h3,.cbtitle");const n=h?(h.value||h.textContent||"").trim():"";if(n)el.setAttribute("aria-label",n.slice(0,80))}
  else if(back[id]!==undefined){const a=back[id];back[id]=undefined;if(!a)return;const k=a.dataset&&a.dataset.id,ac=a.dataset&&a.dataset.act;
   setTimeout(()=>{if(top())return;let f=a.isConnected?a:null;if(!f&&k)f=[...document.querySelectorAll("[data-id]")].find(x=>x.dataset.id===k&&(!ac||x.dataset.act===ac));try{if(f)f.focus()}catch(e){}},60)}}).observe(el,{attributes:true,attributeFilter:["hidden"],childList:true});
 ["modal","drawer"].forEach(id=>{const el=document.getElementById(id);if(el)watch(el)});
 document.addEventListener("keydown",e=>{if(e.key!=="Tab")return;const el=top();if(!el)return;
  const f=[...el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(x=>x.getClientRects().length);if(!f.length)return;
  const a=f[0],z=f[f.length-1];if(!el.contains(document.activeElement)){e.preventDefault();a.focus()}else if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});
 let q=0;const tip=()=>{q=0;document.querySelectorAll(".bname,.kt,.kname").forEach(x=>{if(x.scrollWidth>x.clientWidth+1){if(!x.title)x.title=x.textContent.trim()}})};
 const mn=document.getElementById("main");if(mn)new MutationObserver(()=>{if(!q)q=requestAnimationFrame(tip)}).observe(mn,{childList:true,subtree:true});addEventListener("resize",()=>{if(!q)q=requestAnimationFrame(tip)});
})();

/* long next steps and blockers: show "Show more" only when the text is cut; clicking the text or the link opens it in full */
(function(){const fit=()=>document.querySelectorAll(".xp").forEach(x=>{const m=x.closest(".nsc")&&x.closest(".nsc").querySelector(".xpm");if(!m||x.classList.contains("open"))return;m.hidden=x.scrollHeight<=x.clientHeight+2});
 const mn=document.getElementById("main");let q=0;if(mn)new MutationObserver(()=>{if(!q)q=requestAnimationFrame(()=>{q=0;fit()})}).observe(mn,{childList:true,subtree:true});addEventListener("resize",fit);
 const tog=el=>{const x=el.classList.contains("xp")?el:el.closest(".nsc").querySelector(".xp");const m=x.closest(".nsc").querySelector(".xpm");const o=!x.classList.contains("open");x.classList.toggle("open",o);x.setAttribute("aria-expanded",o);if(m){m.hidden=false;m.textContent=o?"Show less":"Show more"}};
 document.addEventListener("click",e=>{const el=e.target.closest("[data-act=xp]");if(el){e.preventDefault();e.stopPropagation();tog(el)}},true);
 document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches(".xp")){e.preventDefault();tog(e.target)}});})();

/* timeline: a month name that would run under the Today marker is hidden */
(function(){const fix=()=>document.querySelectorAll(".rmt").forEach(r=>{const td=r.querySelector(".rmtl");r.querySelectorAll(".rmm").forEach(m=>{m.style.visibility="";if(!td||!td.offsetParent)return;const a=td.getBoundingClientRect(),b=m.getBoundingClientRect();if(b.right>a.left-4&&b.left<a.right+4)m.style.visibility="hidden"})});
 const mn=document.getElementById("main");let q=0;if(mn)new MutationObserver(()=>{if(!q)q=requestAnimationFrame(()=>{q=0;fix()})}).observe(mn,{childList:true,subtree:true});addEventListener("resize",fix)})();
