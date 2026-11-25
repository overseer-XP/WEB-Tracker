/* ---------- Leadership room: weekly brief, decisions, escalations, launch calendar ---------- */
const REVIEW_DAY=()=>{const v=((S.config.leadership||{}).review_day);return Number.isInteger(v)&&v>=0&&v<=6?v:1};
const DAYNAMES=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function lastReview(){const d=today();while(d.getDay()!==REVIEW_DAY())d.setDate(d.getDate()-1);return d}
function reviewBase(){const lr=lastReview();const base=new Date(lr);if(+lr===+today())base.setDate(base.getDate()-7);
  const t=isoToday();const olds=Object.values(S.snaps).filter(s=>s.date&&s.date<t).sort((a,b)=>a.date.localeCompare(b.date));if(!olds.length)return null;
  const before=olds.filter(s=>parseD(s.date)<=base);return before.length?before[before.length-1]:olds[0]}
const openEsc=()=>withId(S.esc).filter(e=>e.state==="Open"&&S.brands[e.brand]);
const escFor=(kind,ref,code)=>openEsc().find(e=>e.kind===kind&&e.ref===ref&&(e.code||"")===(code||""));
function escTitle(kind,ref,code){if(kind==="task")return(S.tasks[ref]||{}).title||"Task";if(kind==="step"){const s=S.steps[code]||{};return(s.code||code)+" "+(s.name||"")}
  if(kind==="access"){const a=S.access[ref]||{};return(a.platform||"Platform")+" access"}if(kind==="sow")return"SOW";if(kind==="camp")return(S.camps[ref]||{}).name||"Campaign";return kind}
const escBrand=(kind,ref)=>kind==="task"?(S.tasks[ref]||{}).brand:kind==="access"?(S.access[ref]||{}).brand:kind==="camp"?(S.camps[ref]||{}).brand:ref;
function escButton(kind,ref,code){if(!canWrite)return"";const e=escFor(kind,ref,code);
  if(e)return`<span class="tag warn" title="${esc(e.ask)}">With leadership since ${esc(fmtD(new Date(e.at).toISOString().slice(0,10)))}</span>`;
  const pr=withId(S.esc).find(x=>x.state==="Proposed"&&x.kind===kind&&x.ref===ref&&(x.code||"")===(code||""));
  if(pr)return`<span class="tag" title="${esc(pr.ask)}">Waiting for ${esc(pr.lead||"a lead")} to escalate</span>`;
  return canEscalate(me)?`<button class="btn" data-act="escalate" data-kind="${kind}" data-id="${esc(ref)}" data-code="${esc(code||"")}">Needs leadership</button>`:`<button class="btn" data-act="escalate" data-kind="${kind}" data-id="${esc(ref)}" data-code="${esc(code||"")}">Ask a lead to escalate</button>`}
/* gates that are ready for a leadership decision: every earlier required step is done */
function readyGates(){const out=[];
  for(const b of brandList()){if(isInternal(b)||onHold(b))continue;
    for(const s of stepsSorted()){if(!s.is_gate)continue;const st=stepState(b.id,s.code);if(["Done","N/A"].includes(st.status))continue;
      if(!gateBlock(b.id,s.code)&&!st.sent_back)out.push({b,s,st});break}}
  return out}
function leaderCount(){return isLeader(me)?openEsc().length+readyGates().length:0}
function vLeadership(){
  const bs=brandList();const R={};bs.forEach(b=>R[b.id]=roll(b.id));const n=portfolioNumbers(bs,R);keepSnapshot(n);const prev=reviewBase();
  const lr=lastReview();const gates=readyGates();const escs=openEsc().sort((a,b)=>priRank(a)-priRank(b)||String(a.due||"9").localeCompare(String(b.due||"9"))||a.at-b.at);
  const launches=launchItems();const soon=launches.filter(x=>x.when!=="late"&&x.days<=14).length;
  let h=`<h1>Leadership</h1><p class="sub">Week of ${esc(lr.toLocaleDateString("en-GB",{day:"numeric",month:"long"}))}${prev?" · compared with "+esc(fmtD(prev.date,true)):""}. Click a tile to open it.</p>
   <div class="row" style="gap:8px;margin:-6px 0 14px"><span class="faint" style="font-size:12.5px">Review day</span>${canEdit&&canWrite?`<select data-act="review-day" aria-label="Review day">${DAYNAMES.map((d,i)=>`<option value="${i}" ${i===REVIEW_DAY()?"selected":""}>${d}</option>`).join("")}</select>`:`<b style="font-size:13px">${DAYNAMES[REVIEW_DAY()]}</b>`}
</div>`;
  const onb=bs.filter(b=>!onHold(b)&&inOnboarding(b)),live=bs.filter(b=>!onHold(b)&&!isInternal(b)&&b.stage==="Live");
  const m0=new Date(today().getFullYear(),today().getMonth(),1),m1=new Date(m0.getFullYear(),m0.getMonth()+1,1);
  const dueMonth=onb.filter(b=>{const d=parseD((S.sow[b.id]||{}).target_sign);return d&&d>=m0&&d<m1});
  const riskCamps=liveCampaigns(bs).filter(x=>x.k==="bad"||x.k==="warn");const dec=gates.length+escs.length;
  const sent=[`${onb.length} brand${onb.length===1?"":"s"} in onboarding, ${live.length} live.`,n.blocked?`${n.blocked} blocked.`:"Nothing blocked.",dec?`${dec} decision${dec>1?"s":""} waiting for you.`:"No decisions waiting.",riskCamps.length?`${riskCamps.length} live campaign${riskCamps.length>1?"s":""} at risk.`:""].filter(Boolean).join(" ");
  const actB=bs.filter(b=>!onHold(b)&&!isInternal(b));const okPct=actB.length?Math.round(actB.filter(b=>!["Blocked","At Risk","Has blockers"].includes(R[b.id].health)).length/actB.length*100):0;
  h+=`<div class="lhead"><span>${esc(sent.split(". ")[0])}.<span class="lhs">${esc(sent.split(". ").slice(1).join(". "))}</span></span><span class="lhn">${okPct}%<small>brands on track</small></span></div>`;
  const att=attention(bs,R).filter(x=>x.kind!=="No update").slice(0,5);
  const ASK={"Blocked":"Help unblock it, or agree a workaround","Past SOW target":"Agree a new sign date, or push the client","Chase founder":"Use the founder relationship to get access shared","Stage mismatch":"Confirm which stage is right"};
  const P={};P.attention=`<p class="hint2">The top problems across active brands, with the cause, the owner, the next step and what is asked of you.</p>`+(att.length?`<div class="excs">${att.map(x=>`<div class="exc"><div class="row" style="gap:8px"><span class="pill ${x.kind==="Blocked"||x.kind==="Past SOW target"?"s-bad":"s-warn"}">${esc(x.kind)}</span><a class="bname" href="#brand-${esc(x.b.id)}">${esc(x.b.name)}</a><span class="grow"></span><button class="btn sm" data-act="att-go" data-id="${esc(x.b.id)}" data-tab="${esc(x.tab)}">Open ${esc((SECT[x.tab]||"brand").toLowerCase())}</button>${canWrite&&x.b.lead?`<button class="btn sm" data-act="ask-lead" data-id="${esc(x.b.id)}">Ask ${esc(x.b.lead)}</button>`:""}</div>
    <dl class="excd"><dt>Cause</dt><dd>${esc(x.text)}</dd><dt>Owner</dt><dd>${esc(x.b.lead||"No brand lead")}</dd><dt>Next step</dt><dd>${x.b.next_step?esc(x.b.next_step):`<span class="faint">Not written</span>`}</dd><dt>Ask</dt><dd><b>${esc(ASK[x.kind]||"Decide the next step")}</b></dd></dl></div>`).join("")}</div>`:`<div class="tw"><div class="empty">No exceptions. Every active brand is on track.</div></div>`);
  P.decisions=`<p class="hint2">Escalations from the team, then gate steps where every earlier step is done. Agreeing a gate marks it Done with your name. Sending something back asks for a reason, which reaches the person by @mention.</p>`;
  P.decisions+=escs.length||gates.length?`<div class="decs">${escs.map(e=>{const late=e.due&&dayDiff(e.due)<0;return`<div class="dec"><div class="dk">${e.priority?`<span class="tag ${priRank(e)===0?"bad":priRank(e)===1?"warn":""}">${esc(e.priority)}</span>`:""}<span class="tag warn">Escalated</span><a class="bname" href="#brand-${esc(e.brand)}">${esc(bname(e.brand))}</a> · ${esc(escTitle(e.kind,e.ref,e.code))}</div>
     <div class="dq">${esc(e.ask)}</div><div class="faint" style="font-size:12.5px">${esc(e.by||"Someone")}, ${esc(agoText(e.at))}${e.due?` · needed by <span class="${late?"hot":""}">${esc(fmtD(e.due,true))}</span>`:""}</div>
     <div class="row da2"><button class="btn sm quiet" data-act="esc-open" data-id="${esc(e._id)}">Open item</button><span class="grow"></span>${canWrite?`<button class="btn sm" data-act="esc-decide" data-id="${esc(e._id)}" data-v="Sent back">Send back</button><button class="btn sm pri" data-act="esc-decide" data-id="${esc(e._id)}" data-v="Agreed">Agree</button>`:""}</div></div>`}).join("")}
   ${gates.map(({b,s,st})=>`<div class="dec"><div class="dk"><span class="tag">Gate</span><a class="bname" href="#brand-${esc(b.id)}">${esc(b.name)}</a> · ${esc(s.code)} ${esc(s.name)}</div><div class="dq">Every earlier step in ${esc(s.phase_name||"this phase")} is done. Ready to sign off.</div><div class="faint" style="font-size:12.5px">${st.owner?"Owner "+esc(st.owner):"No owner"}${st.link?` · <a href="${esc(st.link)}" target="_blank" rel="noopener">Open ${esc(s.doc_label||"document")}</a>`:""}</div>
     <div class="row da2"><button class="btn sm quiet" data-act="open" data-kind="step" data-id="${esc(b.id)}" data-code="${esc(s.code)}">Open step</button><span class="grow"></span>${canWrite?`<button class="btn sm" data-act="gate-back" data-id="${esc(b.id)}" data-code="${esc(s.code)}">Send back</button><button class="btn sm pri" data-act="gate-ok" data-id="${esc(b.id)}" data-code="${esc(s.code)}">Sign off</button>`:""}</div></div>`).join("")}</div>`:`<div class="tw"><div class="empty">Nothing is waiting for a decision.</div></div>`;
  const done=withId(S.esc).filter(e=>e.state!=="Open"&&S.brands[e.brand]).sort((a,b)=>(b.decided_at||0)-(a.decided_at||0)).slice(0,8);
  if(done.length)P.decisions+=`<details class="recent"><summary>Recently decided (${done.length})</summary>${done.map(e=>`<div class="rd"><span class="tag ${e.state==="Agreed"?"ok":"warn"}">${esc(e.state)}</span><b>${esc(bname(e.brand))}</b> · ${esc(e.kind==="gate"?escTitle("step","",e.code):escTitle(e.kind,e.ref,e.code))}<span class="faint"> · ${esc(e.decided_by||"")}, ${esc(agoText(e.decided_at))}${e.decision?": "+esc(e.decision):""}</span></div>`).join("")}</details>`;
  P.onboarding=`<p class="hint2">Where each brand is on the Road to SOW. A brand sits in the first phase that still has open required steps. The number on each phase is how many brands are in it.</p>`+phaseLane(onb,R);
  P.live=liveLane(live,R,bs);
  P.week=weekAhead(bs);
  P.all=leadAll(bs,R);
  P.launches=`<p class="hint2">Campaign launch and end dates for the next six weeks, with anything still holding them up. Late means the date has passed and the campaign is not Done.</p>`+launchCalendar(launches);
  const sub=route.id||"";if(sub&&LEAD_SECTIONS[sub])return`<h1>${esc(LEAD_SECTIONS[sub])}</h1><h2 class="sr">${esc(LEAD_SECTIONS[sub])} details</h2>`+P[sub];
  return h+leadBento({bs,R,n,prev,onb,live,dueMonth,riskCamps,gates,escs,att,launches})}
/* infographic tiles: one grid of 12 columns, tiles span by importance; every number has a word and every colour a label */
const IB={
  tile:(href,cls,inner,label)=>`<a class="it ${cls}" href="#${href}" aria-label="${esc(label)}">${inner}</a>`,
  head:(t,sub,chip)=>`<span class="ith"><span><b class="itt">${esc(t)}</b>${sub?`<span class="its">${esc(sub)}</span>`:""}</span>${chip?`<span class="itc">${chip}</span>`:""}</span>`,
  hero:(n,unit,trend)=>`<span class="ithero"><b>${n}</b>${unit?`<span>${esc(unit)}</span>`:""}${trend||""}</span>`,
  gauge(parts,center,sub){const R=70,C=Math.PI*R,tot=parts.reduce((a,x)=>a+x.n,0)||1;let off=0;const gap=parts.filter(x=>x.n).length>1?3:0;
    const arcs=parts.map(x=>{if(!x.n)return"";const len=x.n/tot*C;const a=`<circle r="${R}" cx="90" cy="88" fill="none" stroke="var(--${x.k})" stroke-width="18" stroke-dasharray="${Math.max(0,len-gap)} ${2*Math.PI*R}" stroke-dashoffset="${-off}" transform="rotate(180 90 88)"><title>${esc(x.l+": "+x.n)}</title></circle>`;off+=len;return a}).join("");
    return`<span class="itg"><svg viewBox="0 0 180 100" role="img" aria-label="${esc(parts.map(x=>x.n+" "+x.l).join(", "))}"><circle r="${R}" cx="90" cy="88" fill="none" stroke="var(--line)" stroke-width="18" stroke-dasharray="${C} ${2*C}" transform="rotate(180 90 88)"/>${arcs}<text x="90" y="80" text-anchor="middle" class="gn">${center}</text><text x="90" y="97" text-anchor="middle" class="gs">${esc(sub)}</text></svg>
      <span class="itleg">${parts.map(x=>`<span><i style="background:var(--${x.k})"></i>${esc(x.l)}<b>${x.n}</b></span>`).join("")}</span></span>`},
  bars(items){const mx=Math.max(1,...items.map(x=>x.n));return`<span class="itb" role="img" aria-label="${esc(items.map(x=>x.l+": "+x.n).join(", "))}">${items.map(x=>`<span class="itbc ${x.k?"":x.n&&x.n===mx?"hi":x.n<mx/2?"lo":""}" title="${esc((x.t||x.l)+": "+x.n)}"><em>${x.n}</em><i style="height:${Math.max(4,Math.round(x.n/mx*100))}%${x.k?";background:var(--"+x.k+")":""}"></i><small>${esc(x.l)}</small></span>`).join("")}</span>`},
  meter(a,b,la,lb){const t=a+b||1;return`<span class="itm"><span class="itmb" role="img" aria-label="${a} ${esc(la)}, ${b} ${esc(lb)}"><i style="width:${Math.round(a/t*100)}%"></i></span><span class="itml"><span><b>${Math.round(a/t*100)}%</b> ${esc(la)}</span><span>${b} ${esc(lb)}</span></span></span>`},
  rows:r=>`<span class="itr">${r.map(([l,v,k])=>`<span><span>${esc(l)}</span><b class="${k?"c-"+k:""}">${v}</b></span>`).join("")}</span>`,
  list:(r,empty)=>r.length?`<span class="itl">${r.map(([t,sub,pill,k])=>`<span title="${esc(t+(sub?": "+sub:""))}"><span><b>${esc(t)}</b>${sub?`<small>${esc(sub)}</small>`:""}</span>${pill?`<span class="pillx px-${k||"info"}">${esc(pill)}</span>`:""}</span>`).join("")}</span>`:`<span class="itx faint">${esc(empty)}</span>`};
IB.box=(cls,inner)=>`<div class="it ${cls}">${inner}</div>`;
const pct100=(a,b)=>b?Math.round(a/b*100):0;
/* a strip of infographic tiles at the top of a page */
function stripTasks(open){const late=open.filter(t=>dueFlag(t.deadline,false)==="Overdue").length,blk=open.filter(t=>t.status==="Blocked").length,wk=open.filter(t=>{const n=dayDiff(t.deadline);return n!==null&&n>=0&&n<=7}).length,nod=open.filter(t=>!t.deadline).length;
  const by={};for(const t of open){const b=bucketOf(t);by[b]=(by[b]||0)+1}
  return[IB.box("s4 tint-a",IB.head("Open tasks","")+IB.hero(open.length,"open")+IB.meter(open.length-late-blk,late+blk,"moving","late or blocked")),
    IB.box("s4 tint-b",IB.head("Needs you","")+IB.rows([["Blocked",blk,blk?"bad":""],["Late",late,late?"bad":""],["Due in 7 days",wk,wk?"warn":""],["No date",nod,""]])),
    IB.box("s4 tint-c",IB.head("By status","")+IB.bars([["To do","d-todo"],["In progress","d-prog"],[REVIEW_LABEL(),"d-rev"],["Blocked","d-blk"]].map(([l,k])=>({l,k,n:by[l]||0}))))]}
const strip=tiles=>`<div class="ib strip">${tiles.join("")}</div>`;
const bentoTile=(href,k,label,big,unit,body,foot)=>`<a class="lbt lbt-${k}" href="#${href}"><span class="lbl">${label}</span><span class="lbn"><b>${big}</b><span>${unit}</span></span>${body||""}<span class="lbf">${foot||""}<span class="lgo">Open ›</span></span></a>`;
const OV_SECTIONS={attention:"Needs attention",pipeline:"Pipeline",plan:"SOW signing plan",all:"All brands"};
const LEAD_SECTIONS={attention:"Needs attention",decisions:"Decisions",onboarding:"Onboarding by SOW phase",live:"Live brands",launches:"Launch calendar",week:"Next 7 days",all:"All brands"};
function leadBento(d){const{bs,R,n,prev,onb,live,dueMonth,riskCamps,gates,escs,att,launches}=d;
  const act=bs.filter(b=>!onHold(b)&&!isInternal(b));const hc={ok:0,warn:0,bad:0};for(const b of act){const h=R[b.id].health;hc[h==="Blocked"?"bad":h==="At Risk"||h==="Has blockers"?"warn":"ok"]++}
  const ps=phases();const pc=ps.map(p=>({l:p.code,t:p.code+" "+(p.name||""),n:onb.filter(b=>{const c=curPhase(b.id);return c&&c.code===p.code}).length}));const busy=pc.reduce((a,x)=>x.n>a.n?x:a,{n:0});
  const soon=launches.filter(x=>x.when!=="late"&&x.days<=14);const late=launches.filter(x=>x.when==="late");
  const accAll=withId(S.access).filter(a=>a.status!=="Not Needed"&&!holdOf(a.brand)&&S.brands[a.brand]);const accG=accAll.filter(accGranted).length;const accF=accAll.filter(a=>ACC_FOUNDER.includes(a.status)).length;const accC=accAll.filter(needsChase).length;
  const bpb=bs.filter(b=>S.bps[b.id]&&!onHold(b)&&(bpRoll(b.id)||{}).overall!=="Complete");const bpw=bpb.map(b=>({b,g:bpReady(b.id)})).filter(x=>x.g.locked.length||x.g.unchecked.length);
  const past=sowLate().length;
  const nextSign=onb.map(b=>({b,d:parseD((S.sow[b.id]||{}).target_sign)})).filter(x=>x.d&&x.d>=today()).sort((a,c)=>a.d-c.d)[0];
  const dec=gates.length+escs.length;const pct=act.length?Math.round(hc.ok/act.length*100):0;
  const lc=liveCampaigns(bs);const wk=weekAheadItems(bs);
  let h=`<div class="ib">`;
  h+=IB.tile("leadership/attention","s5 r2 tint-a",IB.head("Brand health","Active brands, by health",`${act.length} brands`)+IB.gauge([{l:"On track",n:hc.ok,k:"ok"},{l:"Need a look",n:hc.warn,k:"warn"},{l:"Blocked",n:hc.bad,k:"bad"}],pct+"%","on track")
    +`<span class="itsub">Needs attention</span>`+IB.list(att.slice(0,3).map(x=>[x.b.name,x.text.slice(0,60),x.kind,x.kind==="Blocked"||x.kind==="Past SOW target"?"bad":"warn"]),"Nothing needs attention"),"Brand health: "+pct+"% on track. Open Needs attention");
  h+=IB.tile("leadership/decisions","s3 tint-b",IB.head("Decisions","Waiting for you")+IB.hero(dec,dec===1?"decision":"decisions")+IB.rows([["Escalated",escs.length,escs.length?"warn":""],["Gates to sign off",gates.length,""]]),"Decisions: "+dec+" waiting");
  h+=IB.tile("sow","s4 tint-c",IB.head("SOWs at a glance","Signing this month")+IB.rows([["Due to sign this month",dueMonth.length,dueMonth.length?"warn":""],["Past their target date",past,past?"bad":""],["Signed so far",n.signed,"ok"],["Next to sign",nextSign?esc(nextSign.b.name)+", "+esc(fmtD(nextSign.d.toISOString().slice(0,10))):"None",""]]),"SOWs: "+dueMonth.length+" due this month");
  h+=IB.tile("leadership/onboarding","s7 tint-d",IB.head("Onboarding by SOW phase","Brands in each phase of the Road to SOW",`${onb.length} brands`)+IB.bars(pc)+`<span class="itx">${busy.n?`Most brands are waiting in <b>${esc(busy.t)}</b> (${busy.n})`:"No brands in onboarding"}</span>`,"Onboarding by SOW phase");
  h+=IB.tile("leadership/live","s4 tint-a",IB.head("Live brands",`${lc.length} active campaigns`)+IB.hero(live.length,"live")+IB.list(live.slice(0,3).map(b=>{const m=lc.filter(x=>x.b.id===b.id);const bad=m.filter(x=>x.k==="bad"||x.k==="warn").length;return[b.name,m.length+" campaigns",bad?bad+" need a look":"On track",bad?"warn":"ok"]}),"No live brands"),"Live brands");
  h+=IB.tile("leadership/launches","s4 tint-b",IB.head("Launches","Campaign end dates",late.length?`<span class="pillx px-bad">${late.length} late</span>`:"")+IB.list(soon.slice(0,3).map(x=>[x.c.name,x.b.name,fmtD(x.c.end),x.r.blocked?"bad":"info"]),"Nothing in the next 2 weeks"),"Launches");
  h+=IB.tile("access","s4 tint-c",IB.head("Platform access","All brands")+IB.meter(accG,accAll.length-accG,"granted","still open")+IB.rows([["Waiting on founders",accF,accF?"warn":""],["To chase now",accC,accC?"bad":""]]),"Platform access");
  h+=IB.tile("bp","s6 tint-d",IB.head("Best Practices readiness","Can the team start each section?")+IB.meter(bpb.length-bpw.length,bpw.length,"brands ready","waiting on access")+IB.list(bpw.slice(0,3).map(x=>[x.b.name,(x.g.locked.length?x.g.locked.map(y=>y.sec).slice(0,2).join(", "):"Access not listed yet"),(x.g.locked.length+x.g.unchecked.length)+" sections","warn"]),"Every brand is ready"),"Best Practices readiness");
  h+=IB.tile("leadership/week","s6 tint-a",IB.head("Next 7 days","Signatures, drafts, launches",`${wk.length} items`)+IB.list(wk.slice(0,4).map(x=>[x.what,x.b.name,x.d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}),"info"]),"Nothing due in the next 7 days"),"Next 7 days");
  h+=`</div><div class="lmore"><a href="#leadership/all">All brands table ›</a></div>`;
  return h}
const inOnboarding=b=>!!b&&!isInternal(b)&&b.stage!=="Live"&&(S.sow[b.id]||{}).stage!=="Signed";
/* the phase a brand is in now: the furthest phase with any step done or in progress (earlier open steps are catch-ups) */
const phaseStarted=(bid,p)=>p.steps.some(s=>["Done","In Progress"].includes(stepState(bid,s.code).status));
function curPhase(bid){const ps=phases();let far=-1;ps.forEach((p,i)=>{if(phaseStarted(bid,p))far=i});
  if(far<0)return ps.find(p=>phaseOpen(bid,p))||null;if(phaseOpen(bid,ps[far]))return ps[far];return ps.slice(far+1).find(p=>phaseOpen(bid,p))||ps.find(p=>phaseOpen(bid,p))||null}
function phaseDays(bid,p){let last="";for(const s of p.steps){const v=stepState(bid,s.code).since;if(v&&v>last)last=v}const d=parseD(last);return d?Math.max(0,Math.round((today()-d)/DAY)):null}
function phaseLane(list,R){const ps=phases();if(!ps.length)return`<div class="tw"><div class="empty">No SOW steps set up yet.</div></div>`;
  const by=new Map(ps.map(p=>[p.code,[]]));const done=[];for(const b of list){const p=curPhase(b.id);if(p)by.get(p.code).push(b);else done.push(b)}
  const most=Math.max(0,...[...by.values()].map(x=>x.length));
  return`<div class="pipe lane">${ps.map(p=>{const xs=by.get(p.code);const ds=xs.map(b=>phaseDays(b.id,p)).filter(d=>d!==null);const avg=ds.length?Math.round(ds.reduce((a,c)=>a+c,0)/ds.length):null;
    return`<div class="pcol ${xs.length&&xs.length===most&&most>=3?"neck":""}"><div class="ph"><b>${xs.length}</b><span title="${esc(p.code+" "+(p.name||""))}">${esc(p.code)} ${esc(p.name||"")}</span></div>${xs.length&&xs.length===most&&most>=3?`<span class="tag warn">Most brands waiting here</span>`:""}${avg!==null?`<span class="faint" style="font-size:12px">${avg} days on average</span>`:""}
    ${xs.map(b=>{const d=phaseDays(b.id,p);return`<a class="pb" href="#${brandHash(b.id,"sow")}" title="${esc(R[b.id].health+", Road to SOW "+Math.round(onboarding(b.id)*100)+"%")}">${hdot(R[b.id].health)}<span>${esc(b.name)}</span><i class="days">${Math.round(onboarding(b.id)*100)}%${d!==null?" · "+d+"d":""}</i></a>`}).join("")||`<span class="faint" style="font-size:12px">None</span>`}</div>`}).join("")}</div>${done.length?`<p class="hint2">Every phase done, waiting on the SOW signature: ${done.map(b=>`<a href="#${brandHash(b.id,"sow")}">${esc(b.name)}</a>`).join(", ")}</p>`:""}`}
function liveCampaigns(bs){const out=[];for(const b of bs){if(isInternal(b)||onHold(b)||b.stage!=="Live")continue;for(const c of campsOf(b.id)){if(c.status==="Done")continue;const r=campRoll(b.id,c._id);const[k,t]=campState(c,r);out.push({b,c,r,k,t})}}return out}
function liveLane(live,R,bs){if(!live.length)return`<div class="tw"><div class="empty">No live brands yet.</div></div>`;const cs=liveCampaigns(bs);
  return`<div class="tw"><table><thead><tr><th>Brand</th><th>Health</th><th>Campaigns</th><th>Needs a look</th><th>Next end date</th><th>Platform access</th><th>Best Practices</th><th>Owner</th></tr></thead><tbody>${live.map(b=>{const r=R[b.id];const mine=cs.filter(x=>x.b.id===b.id);const bad=mine.filter(x=>x.k==="bad"||x.k==="warn");
    const nx=mine.filter(x=>parseD(x.c.end)&&parseD(x.c.end)>=today()).sort((x,y)=>parseD(x.c.end)-parseD(y.c.end))[0];
    return`<tr><td><a class="bname" href="#brand-${esc(b.id)}">${esc(b.name)}</a></td><td><span class="row" style="gap:6px;flex-wrap:nowrap">${hdot(r.health)}${esc(r.health)}</span></td><td><a href="#${brandHash(b.id,"tasks")}">${mine.length} active</a></td>
     <td>${bad.length?bad.map(x=>`<button class="linkb" data-act="go-camp" data-id="${esc(x.c._id)}"><span class="cwarn ${x.k==="bad"?"bad":"warn"}">${esc(x.c.name)}: ${esc(x.t)}</span></button>`).join(" "):`<span class="cwarn ok">On track</span>`}</td>
     <td>${nx?`<button class="linkb" data-act="go-camp" data-id="${esc(nx.c._id)}">${esc(nx.c.name)}, ${esc(fmtD(nx.c.end,true))}</button>`:`<span class="faint">None</span>`}</td>${accLink(b.id,r)}${bpLink(b.id,r)}<td>${b.lead?esc(b.lead):`<span class="faint">No lead</span>`}</td></tr>`}).join("")}</tbody></table></div>`}
function weekAheadItems(bs){const t0=today(),t7=new Date(t0);t7.setDate(t7.getDate()+7);const out=[];const inW=d=>d&&d>=t0&&d<=t7;
  for(const b of bs){if(isInternal(b)||onHold(b))continue;const s=S.sow[b.id]||{};const d=parseD(s.target_sign);if(inW(d)&&s.stage!=="Signed")out.push({d,what:"SOW to sign",b});const dd=parseD(s.draft_due);if(inW(dd)&&s.stage!=="Signed")out.push({d:dd,what:"SOW draft due",b});
    for(const c of campsOf(b.id)){if(c.status==="Done")continue;for(const[k,l]of[["start","Campaign starts"],["end","Campaign ends"]]){const x=parseD(c[k]);if(inW(x))out.push({d:x,what:l,b})}}}
  return out.sort((x,y)=>x.d-y.d)}
function weekAhead(bs){const t0=today(),t7=new Date(t0);t7.setDate(t7.getDate()+7);const out=[];const inW=d=>d&&d>=t0&&d<=t7;
  for(const b of bs){if(isInternal(b)||onHold(b))continue;const s=S.sow[b.id]||{};const d=parseD(s.target_sign);if(inW(d)&&s.stage!=="Signed")out.push({d,what:"SOW to sign",b,link:`<a href="#${brandHash(b.id,"sow")}">SOW ${esc(s.stage||"Not Started")}</a>`});
    const dd=parseD(s.draft_due);if(inW(dd)&&s.stage!=="Signed")out.push({d:dd,what:"SOW draft due",b,link:`<a href="#${brandHash(b.id,"sow")}">Open Road to SOW</a>`});
    const bp=S.bps[b.id];const bd=bp&&parseD(bp.due_date);if(inW(bd)&&bpRoll(b.id).progress<1)out.push({d:bd,what:"Best Practices due",b,link:`<a href="#${brandHash(b.id,"bp")}">${bpRoll(b.id).done} of ${bpRoll(b.id).total} done</a>`});
    for(const c of campsOf(b.id)){if(c.status==="Done")continue;for(const[k,l]of[["start","Campaign starts"],["end","Campaign ends"]]){const x=parseD(c[k]);if(inW(x))out.push({d:x,what:l,b,link:`<button class="linkb" data-act="go-camp" data-id="${esc(c._id)}">${esc(c.name)}</button>`})}}}
  out.sort((x,y)=>x.d-y.d);
  return out.length?`<div class="tw"><table><thead><tr><th>Date</th><th>What</th><th>Brand</th><th>Detail</th></tr></thead><tbody>${out.map(x=>`<tr><td class="nowrap">${esc(x.d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}))}</td><td>${esc(x.what)}</td><td><a class="bname" href="#brand-${esc(x.b.id)}">${esc(x.b.name)}</a></td><td>${x.link}</td></tr>`).join("")}</tbody></table></div>`:`<div class="tw"><div class="empty">Nothing is due in the next 7 days.</div></div>`}
/* links from any screen to the brand's own access, Best Practices and SOW sections */
const accLink=(bid,r)=>`<td class="nowrap"><a class="cl" href="#${brandHash(bid,"access")}" title="Open platform access">${pill(r.acc.summary)} <span class="faint">${esc(r.acc.text)}</span></a></td>`;
const bpLink=(bid,r)=>`<td class="nowrap">${r.bp?`<a class="cl" href="#${brandHash(bid,"bp")}" title="Open Best Practices">${pill(r.bp.overall)} <span class="faint">${Math.round(r.bp.progress*100)}%</span></a>`:`<a class="cl faint" href="#${brandHash(bid,"bp")}">None</a>`}</td>`;
const sowLink=(bid,r)=>`<td class="nowrap"><a class="cl" href="#${brandHash(bid,"sow")}" title="Open Road to SOW">${pill(r.sow)}</a></td>`;
const roadLink=(bid,r)=>`<td class="nowrap"><a class="cl" href="#${brandHash(bid,"sow")}" title="Open Road to SOW"><span class="bar"><i style="width:${Math.round(r.pct*100)}%"></i></span> <span class="faint">${Math.round(r.pct*100)}%</span></a></td>`;
function leadAll(bs,R){const rows=bs.filter(b=>!isInternal(b)).sort((x,y)=>(onHold(x)?1:0)-(onHold(y)?1:0)||onboarding(y.id)-onboarding(x.id));
  return`<div class="tw"><table><thead><tr><th>Brand</th><th>Stage</th><th>Health</th><th>SOW phase now</th><th>Road to SOW</th><th>SOW</th><th>Target sign</th><th>Platform access</th><th>Best Practices</th><th>Owner</th></tr></thead><tbody>${rows.map(b=>{const r=R[b.id];const p=curPhase(b.id);
   return`<tr class="${onHold(b)?"held":""}"><td><a class="bname" href="#brand-${esc(b.id)}">${esc(b.name)}</a></td><td>${esc(b.stage)}</td><td><span class="row" style="gap:6px;flex-wrap:nowrap">${hdot(r.health)}${esc(r.health)}</span></td><td class="muted">${p?esc(p.code+" "+(p.name||"")):"All done"}</td>${roadLink(b.id,r)}${sowLink(b.id,r)}<td>${targetHtml(r.sowRow)}</td>${accLink(b.id,r)}${bpLink(b.id,r)}<td>${b.lead?esc(b.lead):`<span class="faint">No lead</span>`}</td></tr>`}).join("")}</tbody></table></div>`}
function launchItems(){const t0=today();const out=[];
  for(const c of withId(S.camps)){const b=S.brands[c.brand];if(!b||onHold(b))continue;const e=parseD(c.end);if(!e||c.status==="Done")continue;
    const days=Math.round((e-t0)/DAY);if(days>42)continue;const r=campRoll(c.brand,c._id);out.push({c,b,e,days,when:days<0?"late":"soon",r})}
  return out.sort((x,y)=>x.e-y.e)}
function launchCalendar(items){
  const nod=withId(S.camps).filter(c=>S.brands[c.brand]&&!onHold(S.brands[c.brand])&&!c.end&&c.status!=="Done");
  const ws=weekStart(today());const weeks=[];for(let i=0;i<6;i++){const d=new Date(ws);d.setDate(d.getDate()+7*i);weeks.push(d)}
  const card=x=>`<button class="lc ${x.r.blocked||x.r.deps?"lc-risk":""}" data-act="go-camp" data-id="${esc(x.c._id)}" style="--bt:${/^#[0-9a-f]{6}$/i.test(x.b.tint||"")?x.b.tint:"var(--line2)"}"><span class="lb">${esc(x.b.name)}</span><b>${esc(x.c.name)}</b><span class="faint">${esc(fmtD(x.c.end,true))}${x.days<0?`, ${-x.days} days late`:""}</span><span class="row" style="gap:4px">${x.r.blocked?`<span class="tag bad">${x.r.blocked} blocked</span>`:""}${x.r.deps?`<span class="tag warn">${x.r.deps} open dependenc${x.r.deps>1?"ies":"y"}</span>`:""}${!x.r.blocked&&!x.r.deps?`<span class="tag ok">Clear</span>`:""}<span class="faint">${x.r.op.length} open</span></span></button>`;
  const late=items.filter(x=>x.when==="late");
  let h=`<div class="cal">${late.length?`<div class="cw late"><h3>Late</h3>${late.map(card).join("")}</div>`:""}`;
  for(const w of weeks){const we=new Date(w);we.setDate(we.getDate()+7);const xs=items.filter(x=>x.when!=="late"&&x.e>=w&&x.e<we);
    h+=`<div class="cw"><h3>Week of ${esc(w.toLocaleDateString("en-GB",{day:"numeric",month:"short"}))}</h3>${xs.map(card).join("")||`<span class="faint" style="font-size:12.5px">Nothing</span>`}</div>`}
  h+=`</div>`;
  if(nod.length)h+=`<p class="hint2">${nod.length} campaign${nod.length>1?"s have":" has"} no launch or end date, so ${nod.length>1?"they are":"it is"} not on the calendar: ${nod.map(c=>`<button class="linkb" data-act="go-camp" data-id="${esc(c._id)}">${esc(bname(c.brand))} · ${esc(c.name)}</button>`).join(", ")}</p>`;
  return h}
async function decideEsc(id,state,note){const e=S.esc[id];if(!e)return;
  await save("esc",id,{state,decision:note||"",decided_by:me||"",decided_at:Date.now()},"Decision on "+escTitle(e.kind,e.ref,e.code));
  const who=e.by&&activePeople().includes(e.by)?"@"+e.by+" ":"";
  const c={brand:e.brand,text:`${who}Leadership ${state==="Agreed"?"agreed":"sent back"} "${escTitle(e.kind,e.ref,e.code)}"${note?": "+note:""}`,by:me||"",at:Date.now(),mentions:e.by?[e.by]:[]};if(e.kind==="task")c.task=e.ref;create("comments",null,c,"Leadership decision")}

