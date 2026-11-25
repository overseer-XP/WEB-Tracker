/* ---------- brand home: one tile per area; the biggest tiles carry what matters most ---------- */
// Status uses four meanings only, always with a word and a shape: good (circle, tick), attention (triangle), problem (square), neutral (ring).
const HEALTH={"Live":["good","In good shape"],"On Track":["good","In good shape"],"At Risk":["warn","At risk"],"Has blockers":["warn","Needs attention"],"Blocked":["bad","Blocked"],"On Hold":["off","On hold"]};
const healthOf=h=>HEALTH[h]||["off",h||"Not set"];
const SHAPE={good:`<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path class="in" d="M6 10.4l2.7 2.7L14 7.7"/></svg>`,
  warn:`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.6l9 16.2H1z"/><path class="in" d="M10 7.2v4.6M10 14.6v.4"/></svg>`,
  bad:`<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="1.5" y="1.5" width="17" height="17" rx="3"/><path class="in" d="M6.6 6.6l6.8 6.8M13.4 6.6l-6.8 6.8"/></svg>`,
  info:`<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path class="in" d="M10 5.5V10l3 2"/></svg>`,
  off:`<svg viewBox="0 0 20 20" aria-hidden="true"><circle class="ring" cx="10" cy="10" r="7.8"/></svg>`};
const sig=(k,label,big)=>`<span class="sig sig-${k} ${big?"big":""}">${SHAPE[k]||SHAPE.off}<span>${esc(label)}</span></span>`;
const brandHash=(bid,tab)=>"brand-"+bid+(tab&&tab!=="home"?"/"+tab:"");
function campState(c,r){const late=c.end&&parseD(c.end)<today()&&c.status!=="Done";if(r.blocked)return["bad",r.blocked+" blocked"];if(r.late||late)return["warn",late?"Past its end date":r.late+" late"];
  if(c.status==="Done"||(r.ts.length&&!r.op.length))return["good","Done"];if(!r.ts.length)return["off","No tasks yet"];return["info","On track"]}
const ring=(p,size)=>{const s=size||40,rr=s/2-4,c=2*Math.PI*rr;return`<svg class="pring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true"><circle cx="${s/2}" cy="${s/2}" r="${rr}" class="rb"/><circle cx="${s/2}" cy="${s/2}" r="${rr}" class="rf" stroke-dasharray="${(c*p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${s/2} ${s/2})"/></svg>`};
/* campaigns on a shared calendar: the base timeline only, one row each with its dates, how much is done and how it is going */
function campRoadmap(bid,big){const cs=campsOf(bid);if(!cs.length)return"";const t0=+today();
  const rows=cs.map(c=>{const r=campRoll(bid,c._id);return{c,r,st:campState(c,r),s:parseD(c.start),e:parseD(c.end)}});
  const ds=rows.flatMap(x=>[x.s,x.e]).filter(Boolean).map(Number);
  let lo=Math.min(...ds,t0),hi=Math.max(...ds,t0+21*DAY);lo-=4*DAY;hi+=7*DAY;
  const pos=d=>Math.max(0,Math.min(100,(d-lo)/(hi-lo)*100));const day=d=>new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
  const months=[],weeks=[];const m=new Date(lo);m.setDate(1);m.setMonth(m.getMonth()+1);for(let d=new Date(m);+d<hi;d.setMonth(d.getMonth()+1))months.push(+d);
  const w=new Date(lo);w.setDate(w.getDate()+((8-w.getDay())%7));for(let d=+w;d<hi;d+=7*DAY)weeks.push(d);
  const meta=(x)=>{const tot=x.r.ts.length;const left=x.e?Math.round((x.e-t0)/DAY):null;
    return`<span class="rmeta">${sig(x.st[0],x.st[1])}<span class="faint">${left===null?"No end date":left>1?left+" days left":left===1?"1 day left":left===0?"Ends today":"Ended "+(-left)+"d ago"} · ${x.r.done}/${tot} done</span></span>`};
  return`<div class="rmap ${big?"big":""}">
   <div class="rmh"><span></span><span class="rmt">${months.filter(d=>Math.abs(pos(d)-pos(t0))>7).map(d=>`<span class="rmm" style="left:${pos(d)}%"><span class="mL">${esc(new Date(d).toLocaleDateString("en-GB",{month:"long"}))}</span><span class="mS">${esc(new Date(d).toLocaleDateString("en-GB",{month:"short"}))}</span></span>`).join("")}<span class="rmtl" style="left:${pos(t0)}%">Today</span></span><span></span></div>
   <div class="rmbody"><div class="rmgrid" aria-hidden="true">${weeks.map(d=>`<span class="rmw" style="left:${pos(d)}%"></span>`).join("")}${months.map(d=>`<span class="rmw mo" style="left:${pos(d)}%"></span>`).join("")}<span class="rmtoday" style="left:${pos(t0)}%"></span></div>
   ${rows.map(x=>{const {c,r}=x;const tot=r.ts.length;const pc=tot?r.done/tot:0;const left=pos(+(x.s||lo)),right=x.e?pos(+x.e+DAY):100;
     const tip=`${c.name}: ${x.s?day(x.s):"no start"} to ${x.e?day(x.e):"no end date"}. ${r.done} of ${tot} tasks done${r.blocked?", "+r.blocked+" blocked":""}${r.late?", "+r.late+" late":""}.`;
     return`<button class="rmr" data-act="go-camp" data-id="${esc(c._id)}" title="${esc(tip)}"><span class="rmn"><b>${esc(c.name)}</b><span class="faint">${x.s?esc(day(x.s)):"?"} → ${x.e?esc(day(x.e)):"no end date"}</span></span>
      <span class="rmt"><span class="rmb rmb-${x.st[0]} ${x.e?"":"open"}" style="left:${left}%;width:${Math.max(2,right-left)}%"><i style="width:${Math.round(pc*100)}%"></i></span></span>${meta(x)}</button>`}).join("")}</div>
   <div class="rmkey"><span><i class="k1"></i>Campaign dates</span><span><i class="k2"></i>Share of tasks done</span><span>Click a campaign for its full timeline</span><span><i class="k5"></i>Today</span></div></div>`}
function brandHome(id,r){
  const b=S.brands[id];const ed=canEdit&&canWrite;const [hk,hl]=healthOf(r.health);
  const ar=withId(S.access).filter(a=>a.brand===id&&a.status!=="Not Needed");const g=ar.filter(accGranted).length;const ch=ar.filter(needsChase).length;
  const s=r.sowRow;const due=sowDue(s);const bp=r.bp;
  const locked=bp?L("bp_section").filter(x=>((S.bps[id].sections||{})[x]||"Not Started")==="Not Started"&&(bpAccess(id,x)||{}).state==="locked").length:0;
  const reasons=[];if(r.blocked)reasons.push(`${r.blocked} task${r.blocked>1?"s":""} blocked`);if(r.overdue)reasons.push(`${r.overdue} task${r.overdue>1?"s":""} late`);
  if(r.stepBlocked)reasons.push(`${r.stepBlocked} onboarding step${r.stepBlocked>1?"s":""} blocked`);if(!isInternal(b)&&due==="Overdue"&&r.sow!=="Signed")reasons.push("SOW past its target date");if(ch)reasons.push(`${ch} platform${ch>1?"s":""} to chase with the founder`);
  const person=(role,name)=>`<div class="who2"><span class="av big">${esc(ini(name)||"?")}</span><span><span class="faint">${esc(role)}</span><b>${name?esc(name):`<span class="faint">Not set</span>`}</b></span></div>`;
  const ps=phases();const cur=curPhase(id);
  const cs=campsOf(id);const nc=Object.values(S.comments).filter(c=>c.brand===id&&c.kind!=="system").sort((a,b2)=>b2.at-a.at);
  let h=`<div class="bento">
  <section class="bt hero" aria-label="About ${esc(b.name)}"><div class="row" style="gap:8px">${pill(b.stage)}${stageDays(b)!==null?`<span class="faint">for ${stageDays(b)} days</span>`:""}${b.restricted?`<span class="tag warn">Restricted</span>`:""}</div>
   <h1 class="bh1">${esc(b.name)}</h1>
   <p class="intro">${b.intro?esc(b.intro):ed?`<button class="missing" data-act="open" data-kind="brand" data-id="${esc(id)}">Add a one-line intro: what the brand sells, and to whom</button>`:`<span class="faint">No intro yet.</span>`}</p>
   <div class="people">${person("Founder",b.founder)}${person("Brand lead",b.lead)}</div>
   <div class="row hact">${b.website?`<a class="btn sm" href="${esc(b.website)}" target="_blank" rel="noopener">Website</a>`:""}${pageOn("brand","founder")&&(canEdit||pageRule("brand","founder")==="everyone")?`<a class="btn sm" href="#client-${esc(id)}">Founder view</a>`:""}${ed?`<button class="btn sm" data-act="open" data-kind="brand" data-id="${esc(id)}">Edit details</button>`:""}</div></section>
  <section class="bt health" aria-label="Health"><span class="btl">Health</span>${sig(hk,hl,true)}
   ${reasons.length?`<ul class="why">${reasons.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p class="faint" style="margin:6px 0 0">Nothing blocked or late.</p>`}
   ${b.next_step?`<p class="nxt"><span class="btl">Next step</span><span class="clamp3" title="${esc(b.next_step)}">${esc(b.next_step)}</span></p>`:""}</section>
  <section class="bt tc" aria-label="Campaigns"><div class="bth"><span class="btl">Campaigns</span><span class="btv">${cs.length?cs.length:r.open+" open tasks"}</span><span class="grow"></span><button class="btn sm" data-act="tab" data-tab="tasks">${cs.length?"All campaigns ›":"Open the board ›"}</button></div>
   ${cs.length?campRoadmap(id,false):`<p class="faint" style="margin:0">No campaigns yet. A campaign groups the work for one launch across teams.</p>`}</section>
  <section class="bt troad" aria-label="${isInternal(b)?"Onboarding":"Road to a signed SOW"}"><div class="bth"><span class="btl">${isInternal(b)?"Onboarding":"Road to a signed SOW"}</span><span class="btv">${Math.round(r.pct*100)}%</span>
   ${isInternal(b)?"":`<span class="faint">SOW document</span>${pill(r.sow)}${r.hold?sig("off","On hold, target kept"):s.target_sign&&r.sow!=="Signed"?(due==="Overdue"?sig("bad","Target "+fmtD(s.target_sign)+" passed"):`<span class="faint">Target ${esc(fmtD(s.target_sign))}</span>`):""}`}
   <span class="grow"></span><button class="btn sm" data-act="tab" data-tab="sow">Open ›</button></div>
   <p class="faint" style="margin:0">${cur?`Now in <b style="color:var(--ink)">${esc(cur.code+" "+cur.name)}</b>. `:"Every phase done. "}${isInternal(b)?"":"Each phase below is a step towards the signed SOW."}</p>
   ${journey(id,ps,cur)}</section>
  <button class="bt ts" data-act="tab" data-tab="access"><span class="btl">Platform access</span><span class="btbig">${ar.length?`${g} of ${ar.length}`:"None"}</span>
   <span class="plist">${ar.slice(0,4).map(a=>`<span>${accGranted(a)?sig("good",a.platform):needsChase(a)?sig("bad",a.platform):ACC_FOUNDER.includes(a.status)?sig("warn",a.platform):sig("off",a.platform)}<span class="faint">${esc(a.status)}</span></span>`).join("")||`<span class="faint">No platforms tracked</span>`}</span><span class="go">Open ›</span></button>
  <button class="bt ts" data-act="tab" data-tab="bp"><span class="btl">Best Practices</span><span class="btbig">${bp?`${bp.done} of ${bp.total}`:"Not started"}</span>${bp?`<span class="bar wide"><i style="width:${Math.round(bp.progress*100)}%"></i></span>`:""}
   <span class="faint">${bp?(locked?`${locked} section${locked>1?"s":""} waiting on access`:esc(bp.overall)):"Not tracked yet"}</span><span class="go">Open ›</span></button>
  <button class="bt ts" data-act="tab" data-tab="updates"><span class="btl">Updates</span><span class="btbig">${nc.length||"None"}</span>
   ${nc[0]?`<span class="clamp2"><b>${esc(nc[0].by||"Someone")}:</b> ${esc(nc[0].text)}</span>`:`<span class="faint">${lastUpdated(id)?"Last change "+esc(agoText(lastUpdated(id))):"No activity yet"}</span>`}<span class="go">Open ›</span></button>
  </div>`;
  return h}
/* one bar for the whole journey: a segment per phase, sized by its step count */
function journey(bid,ps,cur){return`<div class="jbar">${ps.map(p=>{const req=p.steps.filter(s=>!s.is_optional);const d=req.filter(s=>["Done","N/A"].includes(stepState(bid,s.code).status)).length;const pct=req.length?d/req.length:1;const done=!phaseOpen(bid,p);
  return`<button class="jseg ${done?"done":p===cur?"now":""}" style="flex:${Math.max(1,req.length)}" data-act="phase-go" data-id="${esc(bid)}" data-p="${esc(p.code)}" title="${esc(p.code+" "+p.name+": "+d+" of "+req.length+" done")}"><span class="jtrack"><i style="width:${Math.round(pct*100)}%"></i></span><span class="jl"><b>${esc(p.code)}</b> ${esc(p.name)}</span><span class="faint jc">${done?"Done":d+" of "+req.length}</span></button>`}).join("")}</div>`}
/* Road to SOW: onboarding steps are the work, the SOW document is the outcome. One page for both. */
function roadPage(bid){const b=S.brands[bid];const r=roll(bid);const sw=S.sow[bid]||{};const due=sowDue(sw);const ps=phases();const cur=curPhase(bid);
  const jc=journeyCount(bid);const p=Math.round(r.pct*100);
  const top=`<section class="road"><div class="rdl"><span class="btl">${isInternal(b)?"Onboarding":"Road to a signed SOW"}</span><span class="btbig">${p}%</span><span class="faint">${jc.done} of ${jc.total} required steps done</span></div>
   <div class="rdm"><span class="bar wide sowbar"><i style="width:${p}%"></i></span>
    <div class="rdf"><span><span class="btl">Now</span><b>${cur?esc(cur.code+" "+cur.name):"Every phase done"}</b></span>
    ${isInternal(b)?"":`<span><span class="btl">SOW document</span>${pill(r.sow)}</span><span><span class="btl">Target sign</span>${r.hold?sig("off","On hold, target kept"):sw.target_sign?(due==="Overdue"&&r.sow!=="Signed"?sig("bad",fmtD(sw.target_sign)+" passed"):`<b>${esc(fmtD(sw.target_sign))}</b>`):`<span class="faint">Not set</span>`}</span><span><span class="btl">SOW owner</span><b>${sw.owner?esc(sw.owner):`<span class="faint">Not set</span>`}</b></span>`}
    ${r.stepBlocked?`<span><span class="btl">Blocked</span>${sig("bad",r.stepBlocked+" step"+(r.stepBlocked>1?"s":""))}</span>`:""}</div></div></section>`;
  return top+`<h2 class="sech">1. The steps, phase by phase</h2>`+stepsTrack(bid)+(isInternal(b)?"":`<h2 class="sech">2. The SOW document</h2><div class="panel">${sowCard(bid)}</div>`)}
/* campaign list: shared calendar on top, then one quiet row per campaign */
function campRows(bid,all){
  const cs=campsOf(bid);const none=all.filter(t=>campOf(t)===NOCAMP);
  const row=(id,name,sub,when,r,st)=>{const tot=r.ts.length;const p=tot?r.done/tot:0;
    return`<button class="crow" data-act="camp" data-id="${esc(id)}" title="${esc(name)}: ${sub.replace(/<[^>]*>/g,"")}">${sig(st[0],st[1])}<span class="cmain"><b>${esc(name)}</b><span class="faint clamp1">${sub}</span></span><span class="cwhen faint">${esc(when)}</span><span class="cprog">${ring(p,36)}<span><b>${Math.round(p*100)}%</b><span class="faint">${r.done} of ${tot}</span></span></span><span class="chev" aria-hidden="true">›</span></button>`};
  let h=cs.length?`<section class="panel"><div class="bth"><span class="btl">Campaign calendar</span></div>${campRoadmap(bid,true)}</section>`:"";
  h+=`<div class="clist">${cs.map(c=>{const r=campRoll(bid,c._id);return row(c._id,c.name,c.purpose?esc(c.purpose):"What it is for is not written yet",whenText(c),r,campState(c,r))}).join("")}
   ${none.length?row(NOCAMP,"Not in a campaign","Brand-wide and day-to-day work",none.filter(t=>t.status!=="Complete").length+" open",campRoll(bid,NOCAMP),campState({},campRoll(bid,NOCAMP))):""}</div>`;
  if(!cs.length)h+=`<div class="panel empty">No campaigns yet. ${canWrite?`<button class="btn pri" data-act="add-camp" data-id="${esc(bid)}">Add the first campaign</button>`:""}</div>`;
  return h}
/* onboarding steps: a horizontal phase track, then the steps of the chosen phase */
let phaseSel={bid:"",p:""};
function stepsTrack(bid){
  const ps=phases();if(!ps.length)return`<div class="tw"><div class="empty">No step list loaded. An admin can add steps in Settings.</div></div>`;
  const cur=curPhase(bid)||ps[ps.length-1];const sel=(phaseSel.bid===bid&&ps.find(p=>p.code===phaseSel.p))||cur;
  let h=`<div class="ptrack" role="tablist" aria-label="Onboarding phases">${ps.map((p,i)=>{const req=p.steps.filter(s=>!s.is_optional);const d=req.filter(s=>["Done","N/A"].includes(stepState(bid,s.code).status)).length;const done=!phaseOpen(bid,p);
    return`<button role="tab" aria-selected="${p===sel}" class="pnode ${done?"done":p===cur?"now":""} ${p===sel?"on":""}" data-act="phase-go" data-id="${esc(bid)}" data-p="${esc(p.code)}"><span class="pdot">${done?ICON.check:esc(String(i+1))}</span><span class="pname">${esc(p.name)}</span><span class="faint pcount">${done?"Done":d+" of "+req.length}</span></button>`}).join("")}</div>`;
  const req=sel.steps.filter(s=>!s.is_optional);const d=req.filter(s=>["Done","N/A"].includes(stepState(bid,s.code).status)).length;const complete=!phaseOpen(bid,sel);
  h+=`<section class="panel phasep"><div class="bth"><span class="btl">${esc(sel.code)}</span><b style="font-size:17px">${esc(sel.name)}</b>${complete?sig("good","Done"):sel===cur?sig("info","Current phase"):""}<span class="faint">${d} of ${req.length} required done</span><span class="grow"></span>${canEdit&&canWrite&&!complete?`<button class="btn sm" data-act="phase-done" data-id="${esc(bid)}" data-phase="${esc(sel.code)}">Mark every step in ${esc(sel.code)} done</button>`:""}</div>
   <p class="faint" style="margin:0 0 8px;font-size:13px">A gate step cannot be Done while earlier required steps are open. Optional steps never hold a phase back.</p>`;
  for(const s of sel.steps){const st=stepState(bid,s.code);const v=st.status||"Not Started";
    h+=`<div class="step ${s.is_gate?"isgate":""} ${v==="Done"?"done":""}"><span class="code">${esc(sno(s))}</span>
     <div class="nm"><span>${esc(s.name)}</span><span class="tags">${s.is_gate?`<span class="tag gate">Gate</span>`:""}${st.approved_by&&v==="Done"?`<span class="tag ok">Signed off by ${esc(st.approved_by)}, ${esc(fmtD(st.approved_at))}</span>`:""}${s.is_optional?`<span class="tag opt">Optional</span>`:""}${s.doc_label?`<span class="tag doc">Doc: ${esc(s.doc_label)}</span>`:""}</span>
     ${st.blocker&&st.blocker.text?`<span class="blk">Blocked: ${esc(st.blocker.text)}${st.blocker.person?` (waiting on ${esc(st.blocker.person)})`:""}</span>`:""}${st.link?`<a href="${esc(st.link)}" target="_blank" rel="noopener" style="font-size:12.5px">Open ${esc(s.doc_label||"document")}</a>`:""}</div>
     <div class="ctl">${st.owner?esc(st.owner):`<span class="faint">No owner</span>`}</div><div class="ctl">${dueHtml(st.deadline,v==="Done"||v==="N/A")||`<span class="faint">No date</span>`}</div>
     <div class="ctl row" style="gap:6px;flex-wrap:nowrap">${statusSel("step",bid,v,L("checklist"),canWrite,`data-code="${esc(s.code)}"`)}<button class="btn sm quiet" data-act="open" data-kind="step" data-id="${esc(bid)}" data-code="${esc(s.code)}" aria-label="Edit ${esc(s.code)}">Edit</button></div></div>`}
  return h+`</section>`}

/* tasks grouped by team: overview cards first, one click opens a team */
const DEPTS=()=>{const l=L("department");return l.length?l:["Other"]};
const depOf=t=>t.department&&DEPTS().includes(t.department)?t.department:(DEPTS().includes("Other")?"Other":DEPTS()[DEPTS().length-1]);
const urgency=t=>t.status==="Blocked"?0:dueFlag(t.deadline,t.status==="Complete")==="Overdue"?1:dueFlag(t.deadline,t.status==="Complete")==="Due Soon"?2:t.status==="In Progress"?3:4;
const byUrgency=(a,b)=>urgency(a)-urgency(b)||String(a.deadline||"9").localeCompare(String(b.deadline||"9"));
function tasksTab(bid){
  const all=withId(S.tasks).filter(t=>t.brand===bid&&t.title);
  const cs=campsOf(bid);const cid=campSel.bid===bid?campSel.id:"";
  if(cid&&(cid===NOCAMP||S.camps[cid]))return campDetail(bid,cid,all);
  const open=all.filter(t=>t.status!=="Complete");
  let h=`<div class="row" style="margin-bottom:12px"><span class="muted">${cs.length?`${cs.length} campaign${cs.length>1?"s":""}, ${open.length} open tasks. Open a campaign to see its board.`:`${open.length} open tasks. No campaigns yet, so every card is on one board.`}</span><span class="grow"></span>
   ${canWrite&&TEMPLATES().length?`<select data-act="use-tpl" data-id="${esc(bid)}" aria-label="Add tasks from a template" class="btn"><option value="">Add from template...</option>${TEMPLATES().map((t,i)=>`<option value="${i}">${esc(t.name)} (${t.tasks.length})</option>`).join("")}</select>`:""}
   ${canWrite?`<button class="btn" data-act="add-camp" data-id="${esc(bid)}">Add campaign</button><button class="btn pri" data-act="add-task" data-id="${esc(bid)}">Add task</button>`:""}</div>`;
  return h+brandBlockers(bid)+(cs.length?campRows(bid,all):campTabs(bid,NOCAMP,{_id:NOCAMP,name:"All work"},campRoll(bid,NOCAMP)))}

function phaseOpen(bid,p){return p.steps.filter(s=>!s.is_optional).some(s=>!["Done","N/A"].includes(stepState(bid,s.code).status))}
let accImport=null;
const normH=v=>String(v||"").toLowerCase().replace(/\s+/g," ").trim();
async function readAccessSheet(bid,file){const cfg=ACCESS_SETUP().sheet_import;if(!cfg||!cfg.map){toast("The sheet import is not set up yet (Settings, Access setup).");return}
  let X;try{X=await loadXlsx()}catch(e){toast("Could not load the spreadsheet reader. Check your connection.");return}
  const wb=X.read(await file.arrayBuffer(),{type:"array"});const rows=X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:""});
  const hi=rows.findIndex(r=>r.some(c=>normH(c)===normH(cfg.platform_col)));if(hi<0){toast(`No "${cfg.platform_col}" column found in the first sheet.`);return}
  const pc=rows[hi].findIndex(c=>normH(c)===normH(cfg.platform_col)),nc=rows[hi].findIndex(c=>normH(c)===normH(cfg.notes_col));if(nc<0){toast(`No "${cfg.notes_col}" column found.`);return}
  const rank=v=>ACC_STEPS.indexOf(v);const plan=[];const seen=new Set();
  for(const r of rows.slice(hi+1)){const name=String(r[pc]||"").replace(/\s+/g," ").trim();if(!name)continue;const note=String(r[nc]||"").trim(); // only these two cells are read
    const low=name.toLowerCase();const key=Object.keys(cfg.map).map(k=>[k,low.indexOf(k.toLowerCase())]).filter(([k,i])=>i>=0&&i<20).sort((a,b)=>a[1]-b[1]||b[0].length-a[0].length).map(x=>x[0])[0];const platform=key?cfg.map[key]:"";
    let st="",word="Left blank by the founder";if(note){const hit=(cfg.rules||[]).find(x=>new RegExp(x.match,"i").test(note));st=hit?hit.status:cfg.default_status||"Founder actioned";word=hit?hit.word:"Founder filled it in"}
    const cur=platform?withId(S.access).find(a=>a.brand===bid&&a.platform===platform):null;let act="skip",why="",on=false;
    if(!platform)why="Not tracked in VALFLO";else if(seen.has(platform))why="Already in this sheet";else if(!st)why=word;
    else if(!cur){if(st==="Not Needed")why="Not used, nothing to add";else{act="add";on=true}}
    else if(cur.status===st)why="Already "+st;
    else if(["Not Needed","Blocked"].includes(cur.status)||st==="Not Needed"){act="update";why="Check: VALFLO says "+cur.status}
    else if(rank(st)>rank(cur.status)){act="update";on=true}else why="VALFLO is further along ("+cur.status+")";
    if(platform)seen.add(platform);plan.push({name:name.slice(0,60),note:note.replace(/\S*\d\S*|\S+\.(com|io|co|net|au)\S*/gi,"•••").slice(0,90),platform,st,word,cur:cur?cur._id:"",now:cur?cur.status:"",act,why,on})}
  accImport={bid,plan,file:file.name};showAccessImport()}
function showAccessImport(){const{bid,plan,file}=accImport;const m=$("#modal");const n=plan.filter(x=>x.on).length;
  m.innerHTML=`<div class="box wide" role="dialog" aria-label="Founder access sheet"><h3>Founder access sheet: ${esc(bname(bid))}</h3><p class="muted">${esc(file)}. Only the platform and the founder's notes were read. Logins, passwords and IDs in the sheet are never read or saved. Tick what to apply.</p>
   <div class="tw"><table><thead><tr><th></th><th>In the sheet</th><th>Founder says</th><th>VALFLO platform</th><th>Now</th><th>Becomes</th></tr></thead><tbody>${plan.map((x,i)=>`<tr class="${x.act==="skip"?"faintrow":""}"><td>${x.act!=="skip"?`<input type="checkbox" data-act="ai-tick" data-i="${i}" ${x.on?"checked":""} aria-label="Apply ${esc(x.name)}">`:""}</td><td><b>${esc(x.name)}</b><div class="faint" style="font-size:12px">${esc(x.note)}</div></td><td>${esc(x.word)}</td><td>${esc(x.platform||"-")}</td><td>${esc(x.now||(x.platform?"Not tracked":""))}</td><td>${x.act==="skip"?`<span class="faint">${esc(x.why)}</span>`:`${pill(x.st)}${x.why?`<div class="hot" style="font-size:12px">${esc(x.why)}</div>`:""}`}</td></tr>`).join("")}</tbody></table></div>
   <div class="row"><button class="btn pri" data-act="ai-apply">Apply ${n} change${n===1?"":"s"}</button><button class="btn" data-act="mclose">Cancel</button></div></div>`;m.hidden=false}
async function applyAccessImport(){const{bid,plan}=accImport;const day=isoToday();let n=0;
  for(const x of plan.filter(y=>y.on&&y.act!=="skip")){const tag=`Founder access sheet ${day}: ${x.word}.`;
    if(x.act==="add"){await create("access",null,{brand:bid,platform:x.platform,access_level:"TBC",needed_for:"",owner:"",brand_contact:(S.brands[bid]||{}).founder||"",requested_date:day,deadline:"",status:x.st,blocker:"",notes:tag},bname(bid)+" "+x.platform);n++}
    else{const a=S.access[x.cur];if(!a)continue;await save("access",x.cur,{status:x.st,notes:((a.notes||"")+(a.notes?" ":"")+tag).trim()},bname(bid)+" "+x.platform);n++}}
  $("#modal").hidden=true;accImport=null;toast(n+" platform"+(n===1?"":"s")+" updated from the founder sheet")}
function accessTable(bid){
  const waiting=withId(S.access).filter(a=>a.brand===bid&&ACC_FOUNDER.includes(a.status)).length;
  return`<div class="row" style="margin-bottom:10px">${canWrite?`<button class="btn pri" data-act="add-access" data-id="${esc(bid)}">Add platform</button><label class="btn">Import founder sheet<input type="file" id="ai-file" data-b="${esc(bid)}" accept=".xlsx,.xls,.csv" hidden></label>`:""}${waiting?`<button class="btn" data-act="fm-open" data-id="${esc(bid)}">Message for founder (${waiting} missing)</button>`:""}<span class="muted">Any Blocked row turns the brand Blocked. Use Not Needed to leave a platform out.</span></div>`+accFull(bid)}
function sowCard(bid){
  const b=S.brands[bid];if(isInternal(b))return`<div class="tw"><div class="empty">Internal work has no SOW.</div></div>`;
  const s=S.sow[bid];if(!s)return`<div class="tw"><div class="empty">No SOW row yet. ${canWrite?`<button class="btn sm" data-act="add-sow" data-id="${esc(bid)}">Start one</button>`:""}</div></div>`;
  const f=(l,v)=>`<div class="fact"><label>${esc(l)}</label><div class="v">${v||`<span class="faint">Not set</span>`}</div></div>`;
  const flow=L("sow_stage").filter(x=>!["Not Started","On Hold","Blocked"].includes(x));
  return`<div class="row" style="margin-bottom:10px;gap:6px">${flow.map(x=>`<span class="pill ${x===s.stage?"s-warn":"s-off"}" style="${x===s.stage?"outline:2px solid var(--warn)":""}">${esc(x)}</span>`).join(`<span class="faint">›</span>`)}</div>
   ${s.stage==="Blocked"?`<div class="notice bad">SOW blocked. Target date kept at ${esc(fmtD(s.target_sign,true)||"none")}. ${esc(s.blocker||"")}</div>`:""}
   <div class="row" style="margin-bottom:8px">${statusSel("sow",bid,s.stage||"Not Started",L("sow_stage"),canEdit&&canWrite)}${canWrite?`<button class="btn" data-act="open" data-kind="sow" data-id="${esc(bid)}">Edit SOW</button>`:""}</div>
   <div class="facts" style="grid-template-columns:repeat(4,minmax(0,1fr))">${f("Owner",esc(s.owner))}${f("Target sign",targetHtml(s))}${f("Draft due",esc(fmtD(s.draft_due,true)))}${f("Batch",esc(s.batch))}
   ${simple?"":f("Support",esc((s.support||[]).join(", ")))+f("Start",esc(fmtD(s.start_date,true)))}${f("SOW document",s.sow_link?`<a href="${esc(s.sow_link)}" target="_blank" rel="noopener">Open SOW</a>`:"")}${f("Growth Forecast",s.gf_link?`<a href="${esc(s.gf_link)}" target="_blank" rel="noopener">Open GF</a> ${s.gf_updated?`<span class="tag">Updated</span>`:""}`:"")}${f("GF status",esc(s.gf_status||""))}</div>
   <div class="next"><label>Blocker</label><div>${esc(s.blocker)||`<span class="faint">None</span>`}</div></div><div class="next"><label>Next step</label><div>${esc(s.next_step)||`<span class="faint">None</span>`}</div></div>`}
