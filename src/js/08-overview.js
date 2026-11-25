/* ---------- Overview ---------- */
function weekStart(d){const x=new Date(d);const wd=(x.getDay()+6)%7;x.setDate(x.getDate()-wd);x.setHours(0,0,0,0);return x}
let ovSort={k:"",dir:1};
function vOverview(){
  const bs=brandList();const R={};bs.forEach(b=>R[b.id]=roll(b.id));
  const n=portfolioNumbers(bs,R);keepSnapshot(n);const prev=compareSnap();
  const sub=route.id&&OV_SECTIONS[route.id]?route.id:"";const P={};
  let h=sub?`<h1>${esc(OV_SECTIONS[sub])}</h1>`:`<h1>Overview</h1><p class="sub">Every brand from first call to signed SOW. Click a tile to open it. Brands on hold are left out of the counts.</p>`+guide("overview");
  const att=attention(bs,R);
  P.attention=att.length?`<div class="tw att"><table><tbody>${att.slice(0,30).map(x=>`<tr class="click" data-act="att-go" data-id="${esc(x.b.id)}" data-tab="${esc(x.tab)}"><td style="width:170px"><span class="pill ${x.kind==="Blocked"||x.kind==="Past SOW target"?"s-bad":x.kind==="Chase founder"?"s-warn":x.kind==="No update"?"s-off":"s-warn"}">${esc(x.kind)}</span></td><td style="width:190px"><a class="bname" href="#brand-${esc(x.b.id)}">${esc(x.b.name)}</a></td><td class="muted">${esc(x.text)}</td></tr>`).join("")}</tbody></table></div>${att.length>30?`<p class="hint2">${att.length-30} more.</p>`:""}`:`<div class="tw"><div class="empty">Nothing needs attention. No brand is blocked, past its SOW date, out of step or quiet for a week.</div></div>`;
  const hy=hygiene();if(hy.length&&(canEdit||isLeader(me)))P.attention+=`<div class="hyg"><b>Missing information</b>${hy.map(([l,c,to])=>`<a href="#${to}">${c} ${esc(l.toLowerCase())}</a>`).join("")}</div>`;
  P.pipeline=`<p class="hint2">Where every brand is, from first call to live. Days show how long a brand has been in its stage, once a stage change is recorded.</p>`+pipeline(bs,R);
  P.plan=sowPlan(bs,R);
  const cols=[["name","Brand"],["stage","Stage"],["health","Health"]].concat(simple?[]:[["open","Open",1],["blocked","Blocked",1],["late","Late",1],["acc","Platform access"],["sow","SOW"],["target","Target sign"],["bp","BPs"],["pct","Road to SOW"],["upd","Updated"]]).concat([["next","Next step"],["lead","Owner"]]);
  const hv={"Blocked":0,"At Risk":1,"Has blockers":2,"On Track":3,"Live":4,"On Hold":5};
  const val=(b,k)=>{const r=R[b.id];return k==="name"?b.name:k==="stage"?STAGE_ORDER().indexOf(b.stage):k==="health"?hv[r.health]??9:k==="open"?r.open:k==="blocked"?r.blocked:k==="late"?r.overdue:k==="acc"?r.acc.text:k==="sow"?r.sow:k==="target"?(r.sowRow.target_sign||"9999"):k==="bp"?(r.bp?r.bp.progress:-1):k==="pct"?r.pct:k==="upd"?-(lastUpdated(b.id)||0):k==="next"?(b.next_step||""):k==="lead"?(b.lead||"~"):""};
  const rows=bs.slice();if(ovSort.k)rows.sort((x,y)=>{const a=val(x,ovSort.k),c=val(y,ovSort.k);return(a<c?-1:a>c?1:0)*ovSort.dir});
  let A=`<div class="tw"><table><thead><tr>${cols.map(([k,l,num])=>`<th class="${num?"num":""}"><button class="sortb ${ovSort.k===k?"on":""}" data-act="sort" data-k="${k}" aria-label="Sort by ${esc(l)}">${esc(l)}${ovSort.k===k?(ovSort.dir>0?" ▲":" ▼"):""}</button></th>`).join("")}</tr></thead><tbody>`;
  for(const b of rows){const r=R[b.id];const s=r.sowRow;const lu=lastUpdated(b.id);
    A+=`<tr class="click" data-act="nav" data-to="brand-${esc(b.id)}"><td><a class="bname" href="#brand-${esc(b.id)}">${esc(b.name)}</a>${b.paused&&b.stage!=="On Hold"?` <span class="tag">On hold</span>`:""}${b.restricted?` <span class="tag warn">Restricted</span>`:""}</td><td>${esc(b.stage)}</td><td><span class="row" style="gap:6px;flex-wrap:nowrap" title="${esc(r.why.join("; "))}">${hdot(r.health)}${esc(r.health)}</span></td>
    ${simple?"":`<td class="num">${r.open}</td><td class="num">${r.blocked?`<span class="hot">${r.blocked}</span>`:0}</td><td class="num">${r.overdue?`<span class="hot">${r.overdue}</span>`:0}</td>${accLink(b.id,r)}${sowLink(b.id,r)}<td><a class="cl" href="#${brandHash(b.id,"sow")}">${targetHtml(s)}</a></td>${bpLink(b.id,r)}${roadLink(b.id,r)}<td class="${lu&&Date.now()-lu>7*DAY?"hot":"faint"}" style="white-space:nowrap">${lu?esc(agoText(lu)):"Not yet"}</td>`}
    <td class="clip muted"><span class="clamp" title="${esc(b.next_step||"")}">${esc(b.next_step||"")}</span></td><td>${b.lead?esc(b.lead):`<span class="faint">No lead yet</span>`}</td></tr>`}
  P.all=A+`</tbody></table></div>`;
  if(sub)return h+`<h2 class="sr">${esc(OV_SECTIONS[sub])} details</h2>`+P[sub];
  const act=bs.filter(b=>!onHold(b)&&!isInternal(b));const hc={ok:0,warn:0,bad:0};for(const b of act){const x=R[b.id].health;hc[x==="Blocked"?"bad":x==="At Risk"||x==="Has blockers"?"warn":"ok"]++}
  const seg=(v,k,w)=>v?`<i class="${k}" style="flex:${v}" title="${v} ${w}"></i>`:"";
  const stages=L("stage").filter(x=>x!=="Internal"&&!isOutStage(x));const sc=stages.map(st=>({st,n:act.filter(b=>b.stage===st).length}));const smax=Math.max(1,...sc.map(x=>x.n));
  const ws=weekStart(today());const wk2=new Date(ws);wk2.setDate(wk2.getDate()+14);const plan=bs.filter(b=>{const s=S.sow[b.id]||{};const d=parseD(s.target_sign);return!onHold(b)&&!isInternal(b)&&s.stage!=="Signed"&&d});
  const past=sowLate().length,soon=plan.filter(b=>{const d=parseD(S.sow[b.id].target_sign);return d>=today()&&d<wk2}).length;
  const open=withId(S.tasks).filter(t=>t.title&&t.status!=="Complete"&&!holdOf(t.brand));const lateT=open.filter(t=>dueFlag(t.deadline,false)==="Overdue").length,blkT=open.filter(t=>t.status==="Blocked").length;
  const kc={};for(const x of att)kc[x.kind]=(kc[x.kind]||0)+1;const pct=act.length?Math.round(hc.ok/act.length*100):0;
  const hyAll=hygiene();
  h+=`<div class="lhead"><span>${act.length} active brands, ${hc.bad} blocked.<span class="lhs">${att.length} things need attention · ${soon} SOW${soon===1?"":"s"} to sign in the next 2 weeks · ${lateT} tasks late</span></span><span class="lhn">${pct}%<small>brands on track</small></span></div>`;
  h+=`<div class="ib">`;
  h+=IB.tile("overview/attention","s5 r2 tint-d",IB.head("Needs attention","Brands to act on today",`${att.length} items`)+IB.rows(Object.entries(kc).map(([k,v])=>[k,v,k==="Blocked"||k==="Past SOW target"?"bad":"warn"]))+IB.list(att.slice(0,4).map(x=>[x.b.name,x.text.slice(0,60),x.kind,x.kind==="Blocked"||x.kind==="Past SOW target"?"bad":"warn"]),"Nothing needs attention"),"Needs attention: "+att.length);
  h+=IB.tile("overview/all","s3 tint-a",IB.head("Brand health","Active brands")+IB.gauge([{l:"On track",n:hc.ok,k:"ok"},{l:"Need a look",n:hc.warn,k:"warn"},{l:"Blocked",n:hc.bad,k:"bad"}],pct+"%","on track"),"Brand health: "+pct+"% on track");
  h+=IB.tile("overview/plan","s4 tint-c",IB.head("SOW signing plan","Target sign dates")+IB.hero(soon,"to sign in 2 weeks")+IB.rows([["Past their target date",past,past?"bad":""],["Signed so far",n.signed,"ok"]]),"SOW signing plan");
  h+=IB.tile("overview/pipeline","s7 tint-b",IB.head("Pipeline","Active brands at each stage",`${act.length} brands`)+IB.bars(sc.map(x=>({l:x.st,n:x.n}))),"Pipeline");
  h+=IB.tile("people","s4 tint-a",IB.head("Tasks","Open across every brand")+IB.hero(open.length,"open")+IB.meter(open.length-lateT-blkT,lateT+blkT,"moving","late or blocked")+IB.rows([["Late",lateT,lateT?"bad":""],["Blocked",blkT,blkT?"bad":""]]),"Tasks");
  h+=IB.tile("overview/all","s4 tint-c",IB.head("All brands","Every brand, sortable")+IB.hero(bs.filter(b=>!isInternal(b)).length,"brands")+`<span class="itx">Stage, health, access, SOW, Best Practices and owner in one table.</span>`,"All brands table");
  h+=hyAll.length&&(canEdit||isLeader(me))?IB.tile(hyAll[0][2],"s4 tint-d",IB.head("Missing information","Fill these in so the numbers are right")+IB.rows(hyAll.map(([l,c])=>[l,c,"warn"])),"Missing information"):"";
  h+=`</div>`;
  return h}
function targetHtml(s){const hold=s&&holdOf(s.brand);
  if(!s||!s.target_sign)return hold?`<span class="tag">On hold</span>`:s&&s.stage!=="Signed"?`<span class="faint">No date</span>`:"";const blocked=s.stage==="Blocked";
  return`<span class="row" style="gap:6px;flex-wrap:nowrap;white-space:nowrap"><span${hold?` class="faint"`:""}>${esc(fmtD(s.target_sign,true))}</span>${hold?`<span class="tag">On hold</span>`:blocked?`<span class="tag bad">Blocked</span>`:dueHtml(s.target_sign,s.stage==="Signed")?`<span class="pill ${cls(sowDue(s))}">${esc(sowDue(s))}</span>`:""}</span>`}
function pipeline(bs,R){
  const stages=L("stage").filter(x=>x!=="Internal"&&(x==="On Hold"||!isOutStage(x)));const col=st=>bs.filter(b=>!isInternal(b)&&(st==="On Hold"?onHold(b):!onHold(b)&&b.stage===st));
  return`<div class="pipe">${stages.map(st=>{const list=col(st);return`<div class="pcol ${st==="On Hold"?"held":""}"><div class="ph"><b>${list.length}</b><span>${esc(st)}</span></div>${list.map(b=>{const d=stageDays(b);return`<a class="pb" href="#brand-${esc(b.id)}" title="${esc(R[b.id].health)}">${hdot(R[b.id].health)}<span>${esc(b.name)}</span>${d!==null?`<i class="days">${d}d</i>`:""}</a>`}).join("")||`<span class="faint" style="font-size:12px">None</span>`}</div>`}).join("")}</div>`}
function sowPlan(bs,R){
  const buckets={};const nodate=[];const held=[];
  for(const b of bs){if(isInternal(b))continue;const s=S.sow[b.id]||{};if(s.stage==="Signed")continue;if(onHold(b)){held.push(b);continue}const d=parseD(s.target_sign);if(!d){nodate.push(b);continue}const k=weekStart(d).getTime();(buckets[k]=buckets[k]||[]).push(b)}
  const ws=weekStart(today()).getTime();const keys=Object.keys(buckets).map(Number).sort((a,b)=>a-b);
  const label=k=>{const diff=Math.round((k-ws)/(7*864e5));if(diff<0)return"<b>Past target</b>";if(diff===0)return"<b>This week</b>";if(diff===1)return"<b>Next week</b>";return"Week of <b>"+esc(new Date(k).toLocaleDateString("en-GB",{day:"numeric",month:"short"}))+"</b>"};
  const chip=b=>{const s=S.sow[b.id]||{};return`<a class="chip" href="#${brandHash(b.id,"sow")}">${hdot(R[b.id].health)}<span class="nm">${esc(b.name)}</span>${s.stage==="Blocked"?`<span class="tag bad">Blocked</span>`:`<span class="faint" style="font-size:12px">${esc(s.stage||"Not Started")}</span>`}</a>`};
  let h=`<div class="plan">`;for(const k of keys)h+=`<div class="week"><h3>${label(k)}</h3>${buckets[k].map(chip).join("")}</div>`;
  if(nodate.length)h+=`<div class="week"><h3><b>No date yet</b></h3>${nodate.map(chip).join("")}</div>`;
  if(held.length)h+=`<div class="week"><h3><b>On hold</b></h3>${held.map(b=>`<a class="chip" href="#brand-${esc(b.id)}">${hdot("On Hold")}<span class="nm">${esc(b.name)}</span><span class="faint" style="font-size:12px">SOW ${esc((S.sow[b.id]||{}).stage||"Not Started")}</span></a>`).join("")}</div>`;
  return h+`</div>`}

