/* ---------- render ---------- */
let pend=false;
function editing(){const a=document.activeElement;return a&&(a.tagName==="TEXTAREA"||a.tagName==="INPUT"&&!/checkbox|radio|button|submit/.test(a.type))&&($("#main").contains(a)||$("#drawer").contains(a))}
// Numbers per brand are worked out once per draw and reused by every part of the page.
let epoch=0;const memoStore=new Map();function memo(k,fn){const e=memoStore.get(k);if(e&&e.ep===epoch)return e.v;const v=fn();memoStore.set(k,{ep:epoch,v});return v}
let rq=0;function scheduleRender(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render()})}
function render(){me=realEdit&&ls.get("vt-viewas")?ls.get("vt-viewas"):selfMe;epoch++;if(pop&&!document.activeElement?.closest?.("#pop"))closePop();if(editing()){pend=true;return}pend=false;renderRail();renderTop();renderMain();setTimeout(()=>{sowPin();ntFit()},0);if(drawerCtx&&!$("#drawer").hidden)openDrawer(drawerCtx.kind,drawerCtx.id,drawerCtx.extra,true)}
document.addEventListener("focusout",()=>setTimeout(()=>{if(pend&&!editing())render()},0));

const STAGE_ORDER=()=>{const st=L("stage");const out=s=>isOutStage(s)||s==="Internal";const main=st.filter(s=>!out(s)).reverse();return main.concat(st.filter(out))};
function myItems(){return memo("mine:"+me,myItemsNow)}
function myItemsNow(){
  if(!me)return[];const out=[];
  for(const t of withId(S.tasks)){if(!t.title||t.status==="Complete")continue;const own=isPerson(t.owner,me),sup=(t.support||[]).some(x=>isPerson(x,me));if(!own&&!sup)continue;
    const f=dueFlag(t.deadline,false);out.push({kind:"task",id:t._id,brand:t.brand,title:t.title,status:t.status,due:t.deadline,flag:f,blocked:t.status==="Blocked",blocker:t.blocker,priority:t.priority,role:own?"Owner":"Support",notes:t.notes})}
  for(const a of withId(S.access)){const ns=a.next_step;if(!ns||!ns.text||!isPerson(ns.who,me)||!accOpen(a))continue;const f=dueFlag(ns.due,false);
    out.push({kind:"access",id:a._id,brand:a.brand,title:a.platform+": "+ns.text,status:a.status||"Needed",due:ns.due,flag:f,blocked:a.status==="Blocked",blocker:a.blocker?{text:a.blocker}:null,role:"Access next step"})}
  for(const[bid,d]of Object.entries(S.bsteps)){for(const[code,st]of Object.entries(d.s||{})){if(!isPerson(st.owner,me)||st.status==="Done"||st.status==="N/A")continue;const s=S.steps[code];if(!s)continue;
    const f=dueFlag(st.deadline,false);out.push({kind:"step",id:bid,code,brand:bid,title:s.name,status:st.status||"Not Started",due:st.deadline,flag:f,blocked:!!(st.blocker&&st.blocker.text),blocker:st.blocker,role:"Step owner"})}}
  return out}
/* left menu: Valerie navy, VALFLO name, sections, brand stages that open and close, the open brand's sections nested under it */
const LOGO=`<svg class="logo" viewBox="0 0 124 94.3" aria-hidden="true"><path d="M61.63,27.67l12.83,12.83h28.64c-1.12-.5-2.22-1.03-3.31-1.58-15.87-7.98-28.92-20.83-37.14-36.85-.3-.58-.59-1.17-.88-1.76l-.15-.32-.15.32c-.29.59-.58,1.18-.88,1.76-8.21,16.02-21.27,28.87-37.14,36.85-1.09.55-2.19,1.07-3.31,1.58h28.64l12.83-12.83Z"/><path d="M123.26,47.15h-41.1c-8.03,5.16-15.03,11.9-20.53,19.92-5.34-7.77-12.09-14.35-19.81-19.45-.24-.16-.48-.32-.72-.47H0l8.54,2.42c23.18,6.56,42.45,22.72,52.94,44.41l.15.32.15-.32c10.49-21.69,29.76-37.85,52.94-44.41l8.54-2.42h0Z"/></svg>`;
const NI={stepsadmin:'<rect x="2" y="2.5" width="3.5" height="11" rx="1"/><rect x="6.25" y="2.5" width="3.5" height="7" rx="1"/><rect x="10.5" y="2.5" width="3.5" height="9" rx="1"/>',mine:'<path d="M3 4h10M3 8h10M3 12h6"/>',leadership:'<path d="M2 13l3-8 3 5 3-6 3 9z"/>',overview:'<rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
  people:'<circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 14c.6-3 2.4-4.5 4.5-4.5S9.9 11 10.5 14M11 3.2a2.4 2.4 0 010 4.6M12.5 9.8c1.2.6 1.8 2 2 4.2"/>',sow:'<path d="M4 1.8h6l3 3V14H4zM10 1.8V5h3M6 8h5M6 10.5h5"/>',
  access:'<rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/>',bp:'<path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/>',changes:'<path d="M8 3.5V8l3 1.8"/><circle cx="8" cy="8" r="6"/>',settings:'<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>'};
const nicon=k=>`<svg class="ni" viewBox="0 0 16 16" aria-hidden="true">${NI[k==="org"?"people":k]||""}</svg>`;
const CHEV=`<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>`;
let railOff=ls.get("vt-railoff")==="1";let railBrand=null,railSeen="";
let railShut=new Set();try{railShut=new Set(JSON.parse(ls.get("vt-railshut")||"[]"))}catch(e){}
function renderRail(){
  if(route.v==="brand"&&route.id!==railSeen){railBrand=route.id;railSeen=route.id}if(route.v!=="brand")railSeen="";
  const mine=myItems().length;
  const work=[["mine","My tasks",mine||""]];if(pageOn("menu","leadership")&&(isLeader(me)||canEdit))work.push(["leadership","Leadership",leaderCount()||""]);
  const across=[["overview","Overview",""],["sow","SOW tracker",""],["access","Platform access",""],["bp","Best Practices",""]].filter(([k])=>pageOn("menu",k));
  const item=([k,l,n])=>`<a href="#${k}" class="${route.v===k?"on":""}" ${route.v===k?`aria-current="page"`:""}>${nicon(k)}<span class="nl">${esc(l)}</span>${PAGE_MENU.some(x=>x[0]===k)?pageOffTag("menu",k):""}<span class="n">${n}</span></a>`;
  let h=`<a class="mark" href="#overview" aria-label="VALFLO home">${LOGO}<span class="mk">VALFLO</span></a>
   <nav class="nav" aria-label="Main"><div class="rsec">My work</div>${work.map(item).join("")}<div class="rsec">Across brands</div>${across.map(item).join("")}${canEdit||canSeeLog()?`<div class="rsec">Admin</div>`:""}${canEdit?item(["org","Org structure",""]):""}${canEdit||canSeeLog()?item(["settings","Settings",""]):""}</nav><div class="rbrands"><div class="rsec">Brands</div>`;
  const groups={};for(const b of brandList())(groups[b.stage||"Qualification"]=groups[b.stage||"Qualification"]||[]).push(b);
  for(const st of STAGE_ORDER()){if(!groups[st])continue;const cur=route.v==="brand"&&groups[st].some(b=>b.id===route.id);const open=!railShut.has(st);
    h+=`<h3 class="rgh"><button data-act="rgrp" data-k="${esc(st)}" aria-expanded="${open}"><span class="rgl">${esc(st)}</span><span class="n">${groups[st].length}</span>${CHEV}</button></h3>`;
    if(!open)continue;
    for(const b of groups[st]){const r=roll(b.id);const on=route.v==="brand"&&route.id===b.id;const ex=railBrand===b.id;
      h+=`<a class="blink ${on?"on":""} ${ex?"ex":""}" href="#brand-${esc(b.id)}" data-act="blink" data-id="${esc(b.id)}" aria-expanded="${ex}" title="${esc(r.health)}">${hdot(r.health)}<span class="sr">${esc(r.health)}</span>${esc(b.name)}${b.paused?` <span class="tag">Paused</span>`:""}<span class="n">${r.open||""}</span>${CHEV}</a>`;
      if(ex){const t=on?brandTab:"";const tiles=Object.fromEntries(brandTiles(b.id,r).map(x=>[x[0],x]));
        const sub=[["home","Overview",""]].concat(["tasks","sow","access","bp","updates"].filter(k=>pageOn("brand",k)).map(k=>{const x=tiles[k]||[k,SECT[k],"","","off"];const l=k==="tasks"?(campsOf(b.id).length?"Campaigns":"Tasks"):k==="sow"&&isInternal(b)?"Onboarding":SECT[k];
          const v=k==="tasks"?String(campsOf(b.id).length||r.open):x[2]==="None"||x[2]==="None yet"||x[2]==="N/A"?"":x[2];return[k,l,v,x[4],x[3]]}));
        h+=`<div class="rsub">${sub.map(([k,l,v,st,why])=>`<a href="#${brandHash(b.id,k)}" data-tab="${k}" class="${t===k?"on":""}" ${t===k?`aria-current="page"`:""} ${why?`title="${esc(l+": "+v+(why?", "+why:""))}"`:""}>${st==="bad"||st==="warn"?`<span class="sig sm sig-${st}">${SHAPE[st]}</span>`:""}<span class="nl">${esc(l)}</span>${v?`<span class="n">${esc(v)}</span>`:""}</a>`).join("")}</div>`}}}
  h+=`</div>`;
  if(canEdit&&canWrite)h+=`<button class="addbtn" data-act="add-brand"><span aria-hidden="true">+</span> Add brand</button>`;
  $("#rail").innerHTML=h;
}
// Leadership view is a role: leads tick Leadership for a person in Settings > People.
const isLeader=name=>!!name&&people().some(p=>p.name===name&&p.leadership);
const TOPNAME={org:"Org structure",changes:"Change log",mine:"My tasks",leadership:"Leadership",overview:"Overview",people:"People",sow:"SOW tracker",access:"Platform access",bp:"Best Practices",settings:"Settings",stepsadmin:"SOW steps"};
function crumbsOf(){
  if(route.v==="brand"&&S.brands[route.id]){const b=S.brands[route.id];const id=route.id;const out=[{l:b.name,href:"#"+brandHash(id,"home")}];
    if(brandTab!=="home"){const cid=campSel.bid===id?campSel.id:"";const deep=brandTab==="tasks"&&cid&&(cid===NOCAMP||S.camps[cid]);
      const sec=brandTab==="tasks"&&!campsOf(id).length?"Tasks":brandTab==="sow"&&isInternal(b)?"Onboarding":SECT[brandTab]||"";
      out.push(deep?{l:sec,act:`data-act="camp" data-id=""`}:{l:sec,href:"#"+brandHash(id,brandTab)});if(deep)out.push({l:campName(cid)})}
    return out}
  if(route.v==="overview"&&route.id&&OV_SECTIONS[route.id])return[{l:"Overview",href:"#overview"},{l:OV_SECTIONS[route.id]}];
  if(route.v==="leadership"&&route.id&&LEAD_SECTIONS[route.id])return[{l:"Leadership",href:"#leadership"},{l:LEAD_SECTIONS[route.id]}];
  if(route.v==="client"&&S.brands[route.id])return[{l:S.brands[route.id].name,href:"#brand-"+route.id},{l:"Founder view"}];
  return[{l:TOPNAME[route.v]||"Overview",href:"#"+(route.v||"overview")}]}
function renderTop(){
  if(document.activeElement&&document.activeElement.id==="q")return; // keep the search box while someone types
  const ppl=activePeople();
  document.querySelector(".app").classList.toggle("railoff",railOff);
  const cr=crumbsOf();const up=cr.length>1?cr[cr.length-2]:route.v==="brand"?{l:"Overview",href:"#overview"}:null;
  const tog=c=>`<button class="rtog ${c}" data-act="menu" aria-label="${railOff?"Show menu":"Hide menu"}" title="${railOff?"Show menu":"Hide menu"}"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5"/><path d="M7.5 3.5v13"/></svg></button>`;
  $("#topbar").innerHTML=`${tog("")}<nav class="crumb vcrumb" aria-label="You are here" title="${esc(cr.map(c=>c.l).join(" › "))}">${up?`<a class="vx" href="${up.href||"#"}" ${up.act||""} aria-label="Back to ${esc(up.l)}">×</a>`:""}${cr.map((c,i)=>i===cr.length-1?`<b>${esc(c.l)}</b>`:c.act?`<button class="linkb" ${c.act}>${esc(c.l)}</button>`:`<a href="${c.href}">${esc(c.l)}</a>`).join(`<span class="sep" aria-hidden="true">›</span>`)}</nav><div class="search"><label for="q" class="sr">Search brands, tasks, people and steps</label><input id="q" type="search" placeholder="Search brands, tasks, people" autocomplete="off" value="${esc(searchQ)}"><div id="sres" class="sres" hidden></div></div>
   <button class="tclk" data-act="clock" aria-expanded="false" title="World clock"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 5.5V10l3 2"/></svg><span id="clkme">${esc(tzNow().tl+" "+tzNow().tz)}</span></button>
   <button class="tmore" data-act="tmore" aria-expanded="false" aria-controls="tctl" aria-label="View settings: detail, your name, colours"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="10" r="1.8"/><circle cx="10" cy="10" r="1.8"/><circle cx="16" cy="10" r="1.8"/></svg></button>
   <div class="tctl" id="tctl">${["mine","sow"].includes(viewNow())?"":`<div class="seg" role="group" aria-label="Detail"><button data-act="simple" data-v="1" class="${simple?"on":""}" title="Fewer columns and fields">Simple</button><button data-act="simple" data-v="0" class="${simple?"":"on"}" title="Every column and field">Full</button></div>`}
   ${!selfMe&&ready.config?`<label class="who iamtop">Which one is you? <select data-act="iam"><option value="">Pick your name</option>${ppl.map(p=>`<option>${esc(p)}</option>`).join("")}</select></label>`:""}
   ${realEdit?`<span class="admbox" role="group" aria-label="Admin preview"><b>Admin</b><label>View as <select data-act="viewas" aria-label="View as"><option value="">Myself${selfMe?" ("+esc(selfMe)+")":""}</option>${ppl.map(p=>`<option ${p===ls.get("vt-viewas")?"selected":""}>${esc(p)}</option>`).join("")}</select></label><label>Role <select data-act="roleprev" aria-label="Role preview">${[["","Admin"],["member","Member"],["view","View only"]].map(([v,l])=>`<option value="${v}" ${(ls.get("vt-roleprev")||"")===v?"selected":""}>${l}</option>`).join("")}</select></label></span>`:""}
   <div class="seg" role="group" aria-label="Colours"><button data-act="theme" data-v="light" class="${theme==="light"?"on":""}">Light</button><button data-act="theme" data-v="dark" class="${theme==="dark"?"on":""}">Dark</button></div>
</div>${window.__signOut?`<button class="btn sm" data-act="signout">Sign out</button>`:""}`;
}
function applyRolePreview(){const r=realEdit?ls.get("vt-roleprev")||"":"";canEdit=realEdit&&!r;canWrite=realWrite&&r!=="view"}
/* Pages admins can switch per audience (Settings > Pages): saved in config/pages; anything not set is on for everyone (Leadership: leadership tick) */
const PAGE_MENU=[["leadership","Leadership","Bird's-eye view for leadership",true],["overview","Overview","Every brand: what needs action, where they are, what is next"],["sow","SOW tracker","Signing order and the progress board"],["access","Platform access","Logins and access per brand"],["bp","Best Practices","Best Practices progress per brand"]];
const PAGE_BRAND=[["sow","Road to SOW","Steps phase by phase"],["tasks","Tasks","Board, campaigns and timeline"],["access","Platform access","This brand's logins"],["bp","Best Practices","This brand's sections"],["updates","Updates","Comments and history"],["founder","Founder view","What the founder sees",false,"admins"]];
const pageRule=(grp,k)=>{const c=(S.config.pages||{})[grp]||{};const d=grp==="menu"&&k==="leadership"?"leaders":(PAGE_BRAND.find(x=>x[0]===k)||[])[4]||"everyone";return c[k]||d};
function pageOn(grp,k){const r=pageRule(grp,k);if(canEdit)return true;if(r==="everyone")return true;if(r==="leaders")return isLeader(me);return false}
const pageOffTag=(grp,k)=>{const r=pageRule(grp,k);return canEdit&&r!=="everyone"&&!(grp==="menu"&&k==="leadership"&&r==="leaders")?`<span class="pgoff">${r==="off"?"Off":r==="admins"?"Admins":"Leaders"}</span>`:""};
const viewNow=()=>{let v=route.v;if(!v)v=isLeader(me)?"leadership":canEdit?"overview":"mine";return v};
function iamCard(){return`<div class="iam"><b>Which one is you?</b><span>Pick your name once. VALFLO remembers it for this account.</span><select data-act="iam" aria-label="Your name"><option value="">Pick your name</option>${activePeople().map(p=>`<option>${esc(p)}</option>`).join("")}</select></div>`}
function renderMain(){
  const m=$("#main");
  // a brand page can carry the brand's own colours (set in Edit details)
  const tb=route.v==="brand"&&S.brands[route.id];const hex=v=>/^#[0-9a-f]{6}$/i.test(v||"");const th=null&&tb&&tb.theme_on&&hex(tb.tint)?tb:null; // brand colours paused: every page uses the Valerie palette until the team picks how brands stay distinct (the saved colours are kept)
  m.classList.toggle("themed",!!th);if(th){m.style.setProperty("--btint",th.tint);m.style.setProperty("--bink",hex(th.color)?th.color:"var(--ink)")}else{m.style.removeProperty("--btint");m.style.removeProperty("--bink")}
  if(!db){return}
  if(!ready.brands||!ready.config){m.innerHTML=`<h1>VALFLO</h1><p class="sub">Loading brands, tasks and steps.</p>`;return}
  if(!Object.keys(S.brands).length){m.innerHTML=`<h1>No brands yet</h1><p class="sub">${canEdit?"Use Add brand in the left menu to add the first one.":"Ask a lead to add brands."}</p>`;return}
  let v=route.v;if(!v)v=isLeader(me)&&pageOn("menu","leadership")?"leadership":canEdit?"overview":"mine";if(v==="leadership"&&(!isLeader(me)&&!canEdit||!pageOn("menu","leadership")))v=pageOn("menu","overview")?"overview":"mine";
  if(PAGE_MENU.some(x=>x[0]===v)&&!pageOn("menu",v))v="mine";
  if(v==="brand"&&brandTab&&brandTab!=="home"&&!pageOn("brand",brandTab))brandTab="home";
  if(v==="org"&&!canEdit)v="overview";if(v==="settings"&&!canEdit&&!canSeeLog())v="overview";
  const ro=canWrite?"":`<div class="notice info">You can view this tracker but not change it. Ask a lead for edit access.</div>`;
  if(focusItem&&v==="brand")setTimeout(()=>{const f=focusItem;focusItem=null;let el=document.querySelector("#main "+f.sel);if(!el)return;if(f.up)el=el.closest(f.up)||el;const mm=$("#main"),r=el.getBoundingClientRect(),mr=mm.getBoundingClientRect();mm.scrollTop+=r.top-mr.top-mm.clientHeight/2+r.height/2;el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),2600)},40);
  setTimeout(()=>{if(v!=="brand")return;for(const[k]of PAGE_BRAND)if(!pageOn("brand",k))m.querySelectorAll(`.bt [data-tab="${k}"],.bt[data-tab="${k}"]`).forEach(e=>(e.closest(".bt")||e).remove())},0);
  m.innerHTML=ro+(v==="leadership"?vLeadership():v==="brand"?vBrand(route.id):v==="mine"?vMine():v==="sow"?vSow():v==="access"?vAccess():v==="bp"?vBp():v==="settings"?vSettings():v==="org"?vOrg():v==="client"?(pageOn("brand","founder")&&(canEdit||pageRule("brand","founder")==="everyone")?vClient(route.id):vMine()):vOverview());if(window.__afterMain)window.__afterMain.forEach(f=>{try{f()}catch(e){}});
}
function canChangeTask(t){if(!canWrite)return false;if(canEdit)return true;return isPerson(t.owner,me)||(t.support||[]).some(x=>isPerson(x,me))}
function statusSel(kind,id,val,list,enabled,extra){return`<select class="ps ${cls(val)}" data-act="status" data-kind="${kind}" data-id="${esc(id)}" ${extra||""} ${enabled?"":"disabled"} aria-label="Status">${opts(list,val,false)}</select>`}

