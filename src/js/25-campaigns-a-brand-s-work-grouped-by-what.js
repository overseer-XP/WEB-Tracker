/* ---------- campaigns: a brand's work grouped by what it is for ---------- */

const NOCAMP="_none";
const campsOf=bid=>withId(S.camps).filter(c=>c.brand===bid).sort((a,b)=>String(a.start||"9").localeCompare(String(b.start||"9"))||String(a.name).localeCompare(b.name));
const campOf=t=>t.campaign&&S.camps[t.campaign]&&S.camps[t.campaign].brand===t.brand?t.campaign:NOCAMP;
const campName=id=>id===NOCAMP?"Not in a campaign":(S.camps[id]||{}).name||"Campaign";
const teamColor=d=>"var(--line2)"; // teams are named, not coloured: colour is kept for status
const SECT={home:"Overview",tasks:"Campaigns",access:"Platform access",sow:"Road to SOW",bp:"Best Practices",updates:"Updates"};
const SHORT={tasks:"Campaigns",access:"Access",sow:"Road to SOW",bp:"BP",updates:"Updates"};
function brandBar(id,r){const b=S.brands[id];const [hk,hl]=healthOf(r.health);const sec=brandTab==="tasks"&&!campsOf(id).length?"Tasks":brandTab==="sow"&&isInternal(b)?"Onboarding":SECT[brandTab];
  const all={access:["access","Platform access for every brand"],bp:["bp","Best Practices for every brand"],sow:["sow","SOW tracker for every brand"]}[brandTab];
  return`<div class="bslim"><h1 class="bsh1">${esc(sec)}</h1>${all&&!(brandTab==="sow"&&isInternal(b))?`<a class="allx" href="#${all[0]}">${esc(all[1])} ›</a>`:""}<div class="bsl"><button class="bsname" data-act="tab" data-tab="home">${esc(b.name)}</button>${sig(hk,hl)}</div></div>`}
function campRoll(bid,cid){const ts=withId(S.tasks).filter(t=>t.brand===bid&&t.title&&campOf(t)===cid);const op=ts.filter(t=>t.status!=="Complete");
  return{ts,op,done:ts.length-op.length,blocked:op.filter(t=>t.status==="Blocked").length,late:op.filter(t=>dueFlag(t.deadline,false)==="Overdue").length,
    teams:DEPTS().map(d=>[d,op.filter(t=>depOf(t)===d).length,ts.filter(t=>depOf(t)===d).length]).filter(x=>x[2]),deps:((S.camps[cid]||{}).deps||[]).filter(d=>d.state!=="Cleared").length}}
function whenText(c){const s=parseD(c.start),e=parseD(c.end);if(!s&&!e)return"No dates yet";const span=(s?fmtD(c.start):"?")+" to "+(e?fmtD(c.end):"?");if(!e)return span;
  const d=Math.round((e-today())/DAY);return span+" · "+(d>1?d+" days to go":d===1?"1 day to go":d===0?"ends today":"ended "+(-d)+" day"+(d===-1?"":"s")+" ago")}
function campWarn(r){const parts=[r.blocked?r.blocked+" blocked":"",r.late?r.late+" late":"",r.deps?`${r.deps} open dependenc${r.deps>1?"ies":"y"}`:""].filter(Boolean);
  return parts.length?`<span class="cwarn ${r.blocked||r.late?"bad":"warn"}">${esc(parts.join(" · "))}</span>`:`<span class="cwarn ok">On track</span>`}
/* timeline: one bar per task from start to due, grouped by team, with today and the campaign end marked */
let tlOpen=new Set(),tlWin="all";
function campTimeline(c,ts){
  const dated=ts.filter(t=>parseD(t.start)||parseD(t.deadline)),undated=ts.filter(t=>!parseD(t.start)&&!parseD(t.deadline));const t0=+today();
  let lo,hi;if(tlWin==="2w"){lo=t0-3*DAY;hi=t0+14*DAY}else if(tlWin==="month"){lo=t0-7*DAY;hi=t0+35*DAY}else{const ds=[c.start,c.end].concat(ts.flatMap(t=>[t.start,t.deadline])).map(parseD).filter(Boolean);
    if(!ds.length)return`<div class="tw"><div class="empty">No dates yet. Add a start and end to the campaign, and start and due dates to its tasks, to see the timeline.</div></div>`+undatedList(undated);
    lo=Math.min(...ds);hi=Math.max(...ds);if(t0<lo&&lo-t0<21*DAY)lo=t0;if(t0>hi&&t0-hi<21*DAY)hi=t0;lo-=2*DAY;hi+=3*DAY}
  const pos=d=>Math.max(0,Math.min(100,(d-lo)/(hi-lo)*100));const span=(hi-lo)/DAY;const step=span>150?28:span>70?14:span>25?7:2;
  const ticks=[];const first=new Date(lo);if(step>=7)first.setDate(first.getDate()+((8-first.getDay())%7));for(let d=+first;d<hi;d+=step*DAY)ticks.push(d);
  const mark=(d,cl,l)=>d>=lo&&d<=hi?`<span class="gm ${cl}" style="--x:${pos(d)}%"><span>${esc(l)}</span></span>`:"";
  const ends=t=>{let s=parseD(t.start),e=parseD(t.deadline);if(s&&e&&e<s)[s,e]=[e,s];return[s||e,e||s]};
  const inWin=t=>{const[s,e]=ends(t);return tlWin==="all"||(+e>=lo&&+s<=hi)};
  const stCls=t=>{const done=t.status==="Complete";return done?"g-done":t.status==="Blocked"?"g-bad":dueFlag(t.deadline,done)==="Overdue"?"g-late":t.status==="In Progress"?"g-prog":"g-plan"};
  const key=c._id+"|";
  let h=`<div class="tlbar"><div class="seg" role="group" aria-label="Show"><button data-act="tlwin" data-v="all" class="${tlWin==="all"?"on":""}">Whole campaign</button><button data-act="tlwin" data-v="month" class="${tlWin==="month"?"on":""}">Next 5 weeks</button><button data-act="tlwin" data-v="2w" class="${tlWin==="2w"?"on":""}">Next 2 weeks</button></div>
    <button class="btn sm" data-act="tlall" data-k="${esc(key)}">${DEPTS().some(d=>tlOpen.has(key+d))?"Fold all teams":"Open all teams"}</button><span class="muted">One bar per team. Open a team to see its tasks.</span></div>
   <div class="gantt"><div class="grow2 ghead"><span class="gl">Team</span><span class="gt">${ticks.filter(d=>Math.abs(pos(d)-pos(t0))>7&&(!parseD(c.end)||Math.abs(pos(d)-pos(+parseD(c.end)))>7)).map(d=>`<span class="gk" style="left:${pos(d)}%">${esc(new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"}))}</span>`).join("")}</span></div>`;
  let any=false;
  for(const d of DEPTS()){const all=dated.filter(t=>depOf(t)===d);const rows=all.filter(inWin).sort((a,b)=>String(a.start||a.deadline).localeCompare(String(b.start||b.deadline)));if(!rows.length)continue;any=true;
    const sp=rows.map(ends);const s0=Math.min(...sp.map(x=>+x[0])),e0=Math.max(...sp.map(x=>+x[1]));const op=rows.filter(t=>t.status!=="Complete");
    const late=op.filter(t=>dueFlag(t.deadline,false)==="Overdue").length,blk=op.filter(t=>t.status==="Blocked").length,dn=rows.length-op.length;const open=tlOpen.has(key+d);
    const k=blk?"bad":late?"warn":op.length?"info":"good";
    h+=`<button class="grow2 gr gteam2" data-act="tlteam" data-k="${esc(key+d)}" aria-expanded="${open}"><span class="gl"><b>${CHEV}${esc(d)}</b><span class="faint">${rows.length} task${rows.length>1?"s":""} · ${dn} done${late?` · <b class="lt">${late} late</b>`:""}${blk?` · <b class="bk">${blk} blocked</b>`:""}</span></span>
      <span class="gt"><span class="gsum rmb-${k}" style="left:${pos(s0)}%;width:${Math.max(1.2,pos(e0+DAY)-pos(s0))}%"><i style="width:${Math.round(dn/rows.length*100)}%"></i></span></span></button>`;
    if(open)for(const t of rows){const[s,e]=ends(t);const st=stCls(t);
      const bar=parseD(t.start)&&parseD(t.deadline)?`<span class="gb ${st}" style="left:${pos(+s)}%;width:${Math.max(1.2,pos(+e+DAY)-pos(+s))}%"></span>`:`<span class="gd ${st}" style="left:${pos(+(e||s))}%" title="${t.deadline?"Due":"Starts"} ${esc(fmtD(t.deadline||t.start))}"></span>`;
      h+=`<button class="grow2 gr gsub" data-act="open" data-kind="task" data-id="${esc(t._id)}" title="${esc(t.title)}"><span class="gl"><b>${t.status===DONE?"✓ ":t.status==="Blocked"?"⛔ ":""}${esc(t.title)}</b><span class="faint">${esc(t.owner||"No owner")} · ${esc(t.status)}${t.deadline?" · due "+esc(fmtD(t.deadline)):""}</span></span><span class="gt">${bar}</span></button>`}}
  if(!any)h+=`<div class="empty" style="padding:18px">Nothing is scheduled in this window.</div>`;
  h+=`<div class="gover">${mark(+parseD(c.end),"gend",c._id===NOCAMP?"":"End")}${mark(t0,"gtoday","Today")}</div></div>`;
  return`<div class="glegend"><span><i class="g-plan"></i>Planned</span><span><i class="g-prog"></i>In progress</span><span><i class="g-late"></i>Late</span><span><i class="g-bad"></i>Blocked</span><span><i class="g-done"></i>Done</span><span>Team bar: from its first task to its last, filled by share done</span></div>`+h+undatedList(undated)}
function undatedList(ts){if(!ts.length)return"";return`<details class="undated"><summary>${ts.length} task${ts.length>1?"s have":" has"} no dates yet, so ${ts.length>1?"they are":"it is"} not on the timeline</summary>${ts.map(t=>`<button class="gr2" data-act="open" data-kind="task" data-id="${esc(t._id)}"><b>${esc(t.title)}</b><span class="faint">${esc(depOf(t))} · ${esc(t.owner||"No owner")} · ${esc(t.status)}</span></button>`).join("")}</details>`}
function brandBlockers(bid){const out=[];
  for(const a of withId(S.access).filter(a=>a.brand===bid&&(ACC_FOUNDER.includes(a.status)||a.status==="Blocked")))out.push(`<button class="bbk" data-act="open" data-kind="access" data-id="${esc(a._id)}">${a.status==="Blocked"?SHAPE.bad:SHAPE.warn}<span class="tag">Platform access</span>${esc(a.platform)}: ${esc(a.status)}</button>`);
  const s=S.sow[bid];if(s&&!isInternal(S.brands[bid]||{})&&s.stage!=="Signed")out.push(`<button class="bbk" data-act="tab" data-tab="sow">${SHAPE.warn}<span class="tag">SOW</span>Not signed (${esc(s.stage||"Not Started")}${s.target_sign?", target "+esc(fmtD(s.target_sign)):""})</button>`);
  return out.length?`<div class="bblock"><b>Holding up the whole brand</b>${out.join("")}</div>`:""}
let campView="overview",campViewFor="";
const BUCKETS=[["Done","d-done"],[REVIEW_LABEL(),"d-rev"],["To do","d-todo"],["Blocked","d-blk"],["In progress","d-prog"]]; // ring order keeps red and green apart (colour-blind check)
function REVIEW_LABEL(){return"In review"}
function bucketOf(t){const v=t.status||"";return v===DONE?"Done":v==="Blocked"?"Blocked":v===REVIEW?REVIEW_LABEL():v==="In Progress"?"In progress":"To do"}
function campDetail(bid,cid,all){
  const c=cid===NOCAMP?{_id:NOCAMP,name:"Not in a campaign",purpose:"Brand-wide and day-to-day work that is not part of a campaign. Move a task into a campaign from its edit panel."}:Object.assign({_id:cid},S.camps[cid]);
  const r=campRoll(bid,cid);const tot=r.ts.length;
  let h=`<div class="cbox"><div class="ctop"><h2>${esc(c.name)}</h2>${c.status?pill(c.status):""}<span class="muted">${esc(whenText(c))}${c.owner?" · Owner "+esc(c.owner):""}</span><span class="grow"></span>
   ${canWrite&&cid!==NOCAMP?`<button class="btn" data-act="open" data-kind="camp" data-id="${esc(cid)}">Edit campaign</button>`:""}${canWrite?`<button class="btn pri" data-act="add-task" data-id="${esc(bid)}" data-camp="${esc(cid===NOCAMP?"":cid)}">Add task</button>`:""}</div>
   <p class="cpur">${c.purpose?esc(c.purpose):`<span class="faint">What it is for is not written yet.</span>${canWrite&&cid!==NOCAMP?` <button class="missing" data-act="open" data-kind="camp" data-id="${esc(cid)}">Add it</button>`:""}`}${c.goal?` <span class="faint">Success: ${esc(c.goal)}</span>`:""}</p></div>
`+campTabs(bid,cid,c,r);return h}
function campTabs(bid,cid,c,r){const tot=r.ts.length;
  if(campViewFor!==bid+"|"+cid){campView="overview";campViewFor=bid+"|"+cid}
  if(focusItem&&String(focusItem.sel||"").startsWith(".kc"))campView="board";
  let h=`<div class="ctabs" role="tablist" aria-label="Campaign view">${[["overview","Overview"],["board","Board"],["timeline","Timeline"]].map(([v,l])=>`<button role="tab" aria-selected="${campView===v}" class="${campView===v?"on":""}" data-act="campview" data-v="${v}">${l}${v==="board"?` <span class="cnt">${tot-r.done}</span>`:""}</button>`).join("")}</div>`;
  if(campView==="board")h+=listBoard(bid,cid,r.ts)+archivedList(bid,cid);
  else if(campView==="timeline")h+=campTimeline(c,r.ts);
  else h+=campOverview(c,r,bid,cid);
  return h}
function campHealth(c,r){const tot=r.ts.length;const s=parseD(c.start),e=parseD(c.end);const done=tot?r.done/tot:0;
  const timeGone=s&&e&&e>s?Math.max(0,Math.min(1,(today()-s)/(e-s))):null;const late=e&&e<today()&&c.status!=="Done"&&r.op.length;
  const why=[timeGone!==null?`${Math.round(timeGone*100)}% of the time gone, ${Math.round(done*100)}% of tasks done`:`${Math.round(done*100)}% of tasks done`].concat(r.blocked?[r.blocked+" blocked"]:[],r.late?[r.late+" late"]:[],late?["past its end date"]:[]);
  const k=r.blocked||late?"bad":r.late||(timeGone!==null&&done+0.15<timeGone)?"warn":tot&&!r.op.length?"ok":"ok";
  return{k,word:k==="bad"?"Off track":k==="warn"?"At risk":tot&&!r.op.length?"Done":"On track",why:why.join(" · ")}}
function donut(counts,total){const R=54,C=2*Math.PI*R,gap=total>1?2:0;let off=0;
  const segs=BUCKETS.map(([b,k])=>{const n=counts[b]||0;if(!n)return"";const len=n/total*C;const seg=`<circle class="dseg" data-act="campslice" data-v="${esc(b)}" r="${R}" cx="70" cy="70" fill="none" stroke="var(--${k})" stroke-width="20" stroke-dasharray="${Math.max(0,len-gap)} ${C}" stroke-dashoffset="${-off}" tabindex="0" role="button" aria-label="${esc(b)}: ${n} task${n>1?"s":""}. Show on the board"><title>${esc(b)}: ${n} of ${total}</title></circle>`;off+=len;return seg}).join("");
  return`<svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Tasks by status"><circle r="${R}" cx="70" cy="70" fill="none" stroke="var(--line)" stroke-width="20"/><g transform="rotate(-90 70 70)">${segs}</g><text x="70" y="68" text-anchor="middle" class="dn">${total}</text><text x="70" y="86" text-anchor="middle" class="dl">tasks</text></svg>`}
function campOverview(c,r,bid,cid){const ts=r.ts,tot=ts.length;if(!tot)return`<div class="tw"><div class="empty">No tasks in this campaign yet. ${canWrite?`<button class="btn sm" data-act="add-task" data-id="${esc(bid)}" data-camp="${esc(cid===NOCAMP?"":cid)}">Add the first task</button>`:""}</div></div>`;
  const counts={};for(const t of ts){const b=bucketOf(t);counts[b]=(counts[b]||0)+1}const hl=campHealth(c,r);
  const blk=r.op.filter(t=>t.status==="Blocked");const wk=r.op.filter(t=>{const n=dayDiff(t.deadline);return n!==null&&n>=0&&n<=7});const appr=r.op.filter(t=>needsOk(t)&&t.status===REVIEW);
  const e=parseD(c.end);const left=e?Math.round((e-today())/DAY):null;
  const sum=[`<b>${esc(whenText(c))}</b>`,
    blk.length?`Blocked: ${blk.slice(0,3).map(t=>`<button class="linkb" data-act="open" data-kind="task" data-id="${esc(t._id)}">${esc(t.title)}</button>${t.blocker&&t.blocker.person?` <span class="faint">waiting on ${esc(t.blocker.person)}</span>`:""}`).join(", ")}${blk.length>3?` and ${blk.length-3} more`:""}`:"Nothing is blocked.",
    `${wk.length} due in the next 7 days${r.late?`, <span class="hot">${r.late} late</span>`:""}${appr.length?`, ${appr.length} waiting for approval`:""}.`];
  let h=`<div class="cov"><div class="covl"><div class="chealth h-${hl.k}">${sig(hl.k==="ok"?"good":hl.k,hl.word,true)}<span>${esc(hl.why)}</span></div>
    <div class="cdon">${donut(counts,tot)}<ul class="dleg">${BUCKETS.map(([b,k])=>`<li><button class="linkb" data-act="campslice" data-v="${esc(b)}" ${counts[b]?"":"disabled"}><i style="background:var(--${k})"></i>${esc(b)}<b>${counts[b]||0}</b></button></li>`).join("")}</ul></div></div>
    <div class="covr"><h2 class="sech">Summary</h2><ul class="csum">${sum.map(x=>`<li>${x}</li>`).join("")}</ul>
    <h2 class="sech">By team</h2><div class="tw"><table><thead><tr><th>Team</th><th>Done</th><th class="num">Open</th><th class="num">Late</th><th class="num">Blocked</th></tr></thead><tbody>${DEPTS().map(d=>{const xs=ts.filter(t=>depOf(t)===d);if(!xs.length)return"";const op=xs.filter(t=>t.status!==DONE);const late=op.filter(t=>dueFlag(t.deadline,false)==="Overdue").length,bl=op.filter(t=>t.status==="Blocked").length;
      return`<tr class="click" data-act="campteam" data-k="${esc(c._id+"|"+d)}"><td><b>${esc(d)}</b></td><td class="nowrap"><span class="bar"><i style="width:${Math.round((xs.length-op.length)/xs.length*100)}%"></i></span> <span class="faint">${xs.length-op.length}/${xs.length}</span></td><td class="num">${op.length}</td><td class="num">${late?`<span class="hot">${late}</span>`:0}</td><td class="num">${bl?`<span class="hot">${bl}</span>`:0}</td></tr>`}).join("")}</tbody></table></div></div></div>`;
  const rows=r.op.slice().sort(byUrgency);const cell=v=>v?esc(v):`<span class="faint">-</span>`;
  h+=`<h2 class="sech">Who is doing what <span class="count">${rows.length} open</span></h3><div class="tw"><table class="whot"><thead><tr><th>Task</th><th>Team</th><th>Owner</th><th>Lead</th><th>QA</th><th>Approver</th><th>Due</th><th>Status</th></tr></thead><tbody>${rows.map((t,i)=>`<tr class="click ${i>=12?"more":""}" data-act="open" data-kind="task" data-id="${esc(t._id)}"><td><b>${esc(t.title)}</b>${t.status==="Blocked"&&t.blocker&&t.blocker.text?`<div class="hot" style="font-size:12px">${esc(t.blocker.text)}</div>`:""}</td><td class="muted">${esc(depOf(t))}</td><td>${cell(t.owner)}</td><td>${cell(t.lead)}</td><td>${cell(t.qa)}</td><td>${t.approver?esc(t.approver)+(needsOk(t)?` <span class="tag warn">Waiting</span>`:""):`<span class="faint">-</span>`}</td><td class="nowrap">${dueBadge(t)||`<span class="faint">No date</span>`}</td><td>${pill(t.status||"Not Started")}</td></tr>`).join("")}</tbody></table>${rows.length>12?`<button class="btn sm quiet showmore" data-act="whomore">Show all ${rows.length}</button>`:""}</div>`;
  return h}
function toSection(){const m=$("#main"),n=$(".secs");if(!m)return;if(!n){m.scrollTop=0;return}if(m.scrollTop>n.offsetTop)m.scrollTop=n.offsetTop-10}

