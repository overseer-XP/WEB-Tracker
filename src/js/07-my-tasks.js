/* ---------- My tasks ---------- */
let mineTab=null,mineVert="",sinceTs=null;
function sinceBanner(all){const k="vt-seen-"+me;if(sinceTs===null||sinceTs.who!==me){sinceTs={who:me,t:+(ls.get(k)||0)};ls.set(k,String(Date.now()))}
  if(!sinceTs.t)return"";const ids=new Set(all.map(it=>it.id));const ch=[];for(const d of Object.values(S.log))for(const e of d.entries||[])if(e.at>sinceTs.t&&ids.has(e.id)&&d.person!==me)ch.push(Object.assign({person:d.person},e));
  const men=myMentions(me).filter(c=>c.at>sinceTs.t);if(!ch.length&&!men.length)return`<div class="since faint">Nothing changed on your work since your last visit ${esc(agoText(sinceTs.t))}.</div>`;
  return`<div class="since"><b>Since your last visit ${esc(agoText(sinceTs.t))}:</b> ${ch.length?`${ch.length} change${ch.length>1?"s":""} to your work by others`:""}${ch.length&&men.length?", ":""}${men.length?`${men.length} new mention${men.length>1?"s":""}`:""}.${ch.slice(0,4).map(e=>`<div class="faint" style="font-size:12.5px">${esc(e.person||"Someone")} changed ${esc(e.field)} on ${esc(e.label)}${e.new?` to ${esc(String(e.new).slice(0,40))}`:""}</div>`).join("")}</div>`}
let focusItem=null; // set when My tasks sends someone to an item on a brand page
const isLiveBrand=bid=>{const b=S.brands[bid];return !b||b.stage==="Live"||isInternal(b)};
function vMine(){
  let h=`<h1>My tasks</h1>`;
  if(!me)return h+`<p class="sub">Your open tasks and onboarding steps across every brand.</p>`+iamCard();
  const all=myItems();const items=mineVert?all.filter(it=>it.kind==="task"&&vertOf(S.tasks[it.id]||{})===mineVert):all;
  const onb=items.filter(it=>!isLiveBrand(it.brand)),live=items.filter(it=>isLiveBrand(it.brand));
  h+=mineUpdate(all);
  const reqs=withId(S.esc).filter(e=>e.state==="Proposed"&&e.lead&&isPerson(e.lead,me));
  if(reqs.length)h+=`<section class="group"><h2>Escalation requests <span class="count">${reqs.length}</span></h2>${reqs.map(e=>`<div class="item"><div><div class="t">${e.priority?`<span class="tag">${esc(e.priority)}</span> `:""}<a class="bname" href="#brand-${esc(e.brand)}">${esc(bname(e.brand))}</a> · ${esc(e.title)}</div><div class="meta">${esc(e.by||"Someone")}: ${esc(e.ask)}${e.due?` · needed by ${esc(fmtD(e.due,true))}`:""}</div></div><div class="row" style="gap:6px"><button class="btn sm" data-act="esc-decline" data-id="${esc(e._id)}">Decline</button><button class="btn sm pri" data-act="esc-raise" data-id="${esc(e._id)}">Send to leadership</button></div><div></div></div>`).join("")}</section>`;
  const men=myMentions(me);if(men.length)h+=`<section class="group"><h2>Mentions <span class="count">${men.length}</span></h2>${men.slice(0,5).map(c=>`<a class="item men" href="#brand-${esc(c.brand)}" data-act="men-go" data-id="${esc(c.brand)}" data-acc="${esc(c.access||"")}" data-task="${esc(c.task||"")}"><div><div class="t">${esc(c.by||"Someone")} on ${esc(bname(c.brand))}${c.access&&S.access[c.access]?" · "+esc(S.access[c.access].platform):""}${c.task&&S.tasks[c.task]?" · "+esc(S.tasks[c.task].title):""}</div><div class="meta">${linkMentions(c.text).slice(0,400)}</div></div><div class="faint" style="font-size:12px">${esc(agoText(c.at))}</div><div></div></a>`).join("")}</section>`;
  if(mineTab===null)mineTab=ls.get("vt-minetab")||(onb.length?"onboarding":"live");
  const live1=a=>a.filter(it=>!holdOf(it.brand)),nBlk=a=>live1(a).filter(it=>it.blocked).length,nLate=a=>live1(a).filter(it=>!it.blocked&&it.flag==="Overdue").length;
  const urgTxt=a=>{const n=nBlk(a)+nLate(a);return n?`${n} late or blocked`:""};
  const tabTip=a=>`${a.length} open${nBlk(a)?`, ${nBlk(a)} blocked`:""}${nLate(a)?`, ${nLate(a)} past the due date`:""}`;
  const tabBtn=(k,l,a)=>`<button data-act="minetab" data-v="${k}" class="${mineTab===k?"on":""}" title="${esc(tabTip(a))}">${l}</button>`;
  h+=`<div class="seg viewseg" role="group" aria-label="Which work">${tabBtn("onboarding","Brand onboarding",onb)}${tabBtn("live","Onboarded brands",live)}${tabBtn("all","All my work",items)}</div>`;
  const MSTF={"Blocked":i=>i.blocked,"Late":i=>!i.blocked&&i.flag==="Overdue","Due this week":i=>{const n=dayDiff(i.due);return n!==null&&n>=0&&n<=7},"No date":i=>!i.due};
  const list0=mineTab==="onboarding"?onb:mineTab==="live"?live:items;const mf=MSTF[window.__mst];const list=mf?list0.filter(i=>!holdOf(i.brand)&&mf(i)):list0;
  h+=`<div class="toolbar">
    <label class="tl">Lists <select data-act="mcolsel" id="m-cols">${MINE_COLS.map(([k,l])=>`<option value="${k}" ${mineCols===k?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="tl">Sort by <select data-act="msort" id="m-sort">${MINE_SORTS.map(([k,l])=>`<option value="${k}" ${mineSort===k?"selected":""}>${l}</option>`).join("")}</select></label>
    ${mf?`<button class="lchip on" data-act="mst" data-v="${esc(window.__mst)}" title="Show all cards">Showing: ${esc(window.__mst)} ×</button>`:""}<label class="tl">Vertical <select data-act="mvertsel" id="m-vert"><option value="">All</option>${VERTS().map(v=>`<option ${mineVert===v?"selected":""}>${esc(v)}</option>`).join("")}</select></label></div>`;
  if(!list.length)return h+`<div class="tw"><div class="empty">${mineVert?`Nothing open for ${esc(me)} in ${esc(mineVert)} here.`:mineTab==="onboarding"?`No onboarding work for ${esc(me)} right now.`:mineTab==="live"?`No work on onboarded brands for ${esc(me)} right now.`:`Nothing open for ${esc(me)}. When a task or step is assigned to you it shows here.`}</div></div>`;
  return h+mineBoard(list.slice().sort(mineCmp(mineSort)),mineCols)}
/* My tasks is a board only. Columns by status, brand or team; cards inside a column follow the sort. */
const MINE_COLS=[["status","By status"],["brand","By brand"],["team","By team"]];
const MINE_SORTS=[["due","Deadline, soonest first"],["priority","Priority, Urgent to Low"],["brand","Brand A to Z"]];
let mineSort="due",mineCols="status";
try{mineSort=ls.get("vt-msort")||"due";if(!MINE_SORTS.some(x=>x[0]===mineSort))mineSort="due";mineCols=ls.get("vt-mcols")||"status";if(!MINE_COLS.some(x=>x[0]===mineCols))mineCols="status"}catch(e){}
const PRI=["Urgent","High","Medium","Low"];
const itemRank=it=>it.blocked?0:it.flag==="Overdue"?1:it.flag==="Due Soon"?2:3;
const itemCls=it=>it.blocked?"blocked":it.flag==="Overdue"?"late":it.flag==="Due Soon"?"soon":"";
const priIdx=it=>{const i=PRI.indexOf(it.priority||"");return i<0?9:i};
const ROLE_SHORT={"Owner":"You own","Support":"You support","Step owner":"Your step","Access next step":"Your access step"};
function mineCmp(k){const due=(a,b)=>String(a.due||"9999").localeCompare(String(b.due||"9999"));const hold=(a,b)=>(holdOf(a.brand)?1:0)-(holdOf(b.brand)?1:0);
  if(k==="priority")return(a,b)=>hold(a,b)||priIdx(a)-priIdx(b)||due(a,b)||itemRank(a)-itemRank(b);
  if(k==="brand")return(a,b)=>bname(a.brand).localeCompare(bname(b.brand))||due(a,b)||priIdx(a)-priIdx(b);
  return(a,b)=>hold(a,b)||due(a,b)||priIdx(a)-priIdx(b)} // deadline first, then priority
const teamOf=it=>it.kind==="step"?"Onboarding steps":it.kind==="access"?"Platform access":depOf(S.tasks[it.id]||{});
function ctlOf(it){return it.kind==="access"?statusSel("access",it.id,it.status,L("access_status"),canWrite):it.kind==="task"?statusSel("task",it.id,it.status,L("task_status"),canChangeTask(S.tasks[it.id]||{}))
  :statusSel("step",it.id,it.status,L("checklist"),canWrite,`data-code="${esc(it.code)}"`)}
/* sort keys on each My tasks card, so the order can be checked */
const cardData=(it,h)=>h.replace(/<div class="kc/,`<div data-brand="${esc(bname(it.brand))}" data-due="${esc(it.due||"")}" data-pri="${priIdx(it)}" data-held="${holdOf(it.brand)?1:0}" class="kc`);
function mineBoard(items,by){let cols;
  const urg=c=>c.items.filter(i=>i.blocked||i.flag==="Overdue").length;
  if(by==="brand"){const m=new Map();items.forEach(i=>{if(!m.has(i.brand))m.set(i.brand,[]);m.get(i.brand).push(i)});
    cols=[...m].map(([k,a])=>({k,label:bname(k),items:a})).sort((x,y)=>(holdOf(x.k)?1:0)-(holdOf(y.k)?1:0)||urg(y)-urg(x)||y.items.length-x.items.length||x.label.localeCompare(y.label))}
  else if(by==="team"){const order=DEPTS().concat(["Onboarding steps","Platform access"]);const m=new Map();items.forEach(i=>{const t=teamOf(i);if(!m.has(t))m.set(t,[]);m.get(t).push(i)});
    cols=[...m].map(([k,a])=>({k,label:k,items:a})).sort((x,y)=>order.indexOf(x.k)-order.indexOf(y.k))}
  else{const st=[...new Set(["Blocked"].concat(L("task_status").filter(s=>s!=="Complete"),items.map(i=>i.status||"Not Started")))];
    cols=st.map(s=>({k:s,label:s,items:items.filter(i=>(i.status||"Not Started")===s)})).filter(c=>c.items.length||["Not Started","In Progress","Blocked"].includes(c.k))}
  const hint=by==="brand"?"One column per brand, the brands that need you most first. Cards follow the sort, so you can see which to do first for each brand.":by==="team"?"One column per team, plus your onboarding steps and platform access steps. Cards follow the sort.":"One column per status, Blocked first. Change a card's status to move it.";
  const head=c=>{const name=by==="brand"?`<a class="bname" href="#brand-${esc(c.k)}">${esc(c.label)}</a>`:`<b>${esc(c.label)}</b>`;
    const sub=by==="brand"&&holdOf(c.k)?`<span class="pill s-off">On hold</span>`:"";
    const tint=by==="status"?({"Blocked":"var(--bad)","In Progress":"var(--blue)","Complete":"var(--ok)"})[c.k]||"var(--line2)":by==="team"?teamColor(c.k):"var(--blue)";
    const plus=canWrite&&by!=="team"?`<button class="khadd" data-act="mine-add" data-st="${esc(by==="status"?c.k:"")}" data-b="${esc(by==="brand"?c.k:"")}" aria-label="Add a card to ${esc(c.label)}" title="Add a card">+</button>`:"";
    return`<header>${name}<span class="kn">${c.items.length}</span>${sub}${plus}</header>`};
  const card=it=>cardData(it,card0(it));
  const card0=it=>it.kind==="task"&&S.tasks[it.id]?kbCard(Object.assign({_id:it.id},S.tasks[it.id]),true,by==="team",by==="brand"):itemCard(it,by);
  const drop=c=>by==="status"&&canWrite?`data-mst="${esc(c.k)}"`:"";
  const add=c=>canWrite&&by!=="team"?`<button class="kadd" data-act="mine-add" data-st="${esc(by==="status"?c.k:"")}" data-b="${esc(by==="brand"?c.k:"")}">+ Add a card</button>`:"";
  return`<div class="kb mineb tb">${cols.map(c=>`<section class="kcol ${by==="brand"&&holdOf(c.k)?"held":""}" aria-label="${esc(c.label)}" style="--ct:${by==="status"?({"Blocked":"var(--bad)","In Progress":"var(--blue)","Complete":"var(--ok)"})[c.k]||"var(--line2)":by==="team"?teamColor(c.k):"var(--accent)"}">${head(c)}<div class="kcards" ${drop(c)}>${c.items.map(card).join("")||`<span class="kempty">No cards</span>`}</div>${add(c)}</section>`).join("")}</div>`}
/* onboarding steps and access steps on My tasks: same card look, they open their own panel */
function itemCard(it,by){const role=ROLE_SHORT[it.role]||it.role;
  return`<div class="kc tc" data-act="open" data-kind="${it.kind==="access"?"access":"step"}" data-id="${esc(it.id)}" data-code="${esc(it.code||"")}" tabindex="0" role="button" aria-label="${esc(it.title)}">
   <span class="kbars"><i style="background:var(--${it.kind==="access"?"g1":"g3"})" title="${it.kind==="access"?"Platform access":"Onboarding step"}"></i></span>
   <span class="kt">${esc(it.title)}</span>${it.blocked&&it.blocker?`<span class="blk">${esc(it.blocker.text||"")}${it.blocker.person?" (waiting on "+esc(it.blocker.person)+")":""}</span>`:""}
   <span class="kb2">${dueBadge({deadline:it.due,status:it.status})}${by==="brand"?"":`<span class="kbg">${esc(bname(it.brand))}</span>`}<span class="kbg">${it.kind==="access"?"Access":"Step "+esc(it.code||"")}</span><span class="kbg faint">${esc(role)}</span><span class="grow"></span><span class="avs"><span class="av" title="${esc(me)}">${esc(ini(me))}</span></span></span></div>`}
/* the update card at the top of My tasks: what changed, today's numbers, and the five to do first */
function mineUpdate(all){const k="vt-seen-"+me;if(sinceTs===null||sinceTs.who!==me){sinceTs={who:me,t:+(ls.get(k)||0)};ls.set(k,String(Date.now()))}
  const live=all.filter(it=>!holdOf(it.brand));const ids=new Set(all.map(it=>it.id));let ch=[];
  if(sinceTs.t)for(const d of Object.values(S.log))for(const e of d.entries||[])if(e.at>sinceTs.t&&ids.has(e.id)&&d.person!==me)ch.push(e);
  const men=sinceTs.t?myMentions(me).filter(c=>c.at>sinceTs.t):[];
  const blk=live.filter(i=>i.blocked).length,late=live.filter(i=>!i.blocked&&i.flag==="Overdue").length,wk=live.filter(i=>{const n=dayDiff(i.due);return n!==null&&n>=0&&n<=7}).length,nod=live.filter(i=>!i.due).length;
  const rank=it=>it.blocked?0:it.flag==="Overdue"?1:it.flag==="Due Soon"?2:it.due?3:4;
  const top=live.slice().sort((a,b)=>rank(a)-rank(b)||String(a.due||"9999").localeCompare(String(b.due||"9999"))||priIdx(a)-priIdx(b)).slice(0,5);
  const z=tzNow();const when=new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
  const tag=it=>{if(it.blocked)return`<span class="tgx r">Blocked</span>`;const n=dayDiff(it.due);if(n!==null&&n<0)return`<span class="tgx r">${-n} day${n===-1?"":"s"} late</span>`;if(n!==null)return`<span class="tgx ${n<=7?"a":"b"}">${n===0?"Today":n===1?"Tomorrow":esc(fmtD(it.due,true))}</span>`;return`<span class="tgx a">No date</span>`};
  const since=sinceTs.t?(ch.length||men.length?`Since ${esc(agoText(sinceTs.t))}: ${ch.length?`<b>${ch.length} change${ch.length>1?"s":""}</b> to your work by others`:""}${ch.length&&men.length?", ":""}${men.length?`<b>${men.length} new mention${men.length>1?"s":""}</b>`:""}. `:`Nothing changed since ${esc(agoText(sinceTs.t))}. `):"";
  return`<div class="mupd"><div class="mupdh"><b>Your update</b><span>Refreshed ${esc(when)}, ${esc(z.tl)} ${esc(z.tz)}</span></div>
   ${since?`<p class="mupdl">${since}</p>`:""}
   <div class="mstat">${[["Blocked",blk,"bad","Waiting on someone"],["Late",late,"bad","Past the due date"],["Due this week",wk,"warn","Next 7 days"],["No date",nod,"","Needs a due date"]].map(([l,n,k,s])=>`<button class="mst ${n&&k?"m-"+k:""} ${window.__mst===l?"on":""}" data-act="mst" data-v="${esc(l)}" aria-pressed="${window.__mst===l}"><span class="mstl">${l}</span><b>${n}</b><small>${s}</small></button>`).join("")}</div>
   ${top.length?"":`<p class="faint" style="margin:0">Nothing open for you. New work shows here first.</p>`}</div>`}

function itemHtml(it,cl,noBrand){
  const brand=`<a href="#brand-${esc(it.brand)}" class="muted">${esc(bname(it.brand))}</a>`;
  const ctl=it.kind==="access"?statusSel("access",it.id,it.status,L("access_status"),canWrite):it.kind==="task"?statusSel("task",it.id,it.status,L("task_status"),canChangeTask(S.tasks[it.id]||{}))
    :statusSel("step",it.id,it.status,L("checklist"),canWrite,`data-code="${esc(it.code)}"`);
  const open=it.kind==="task"?`data-act="open" data-kind="task" data-id="${esc(it.id)}"`:`data-act="open" data-kind="step" data-id="${esc(it.id)}" data-code="${esc(it.code)}"`;
  return`<div class="item ${cl}"><div><div class="t"><a href="#brand-${esc(it.brand)}" data-act="goto-item" data-kind="${it.kind}" data-id="${esc(it.id)}" data-code="${esc(it.code||"")}" class="bname" title="Open on the ${esc(bname(it.brand))} page">${esc(it.title)}</a></div>
   <div class="meta">${noBrand?"":brand}${it.kind==="access"?`<span>Platform access</span>`:""}${it.kind==="step"?`<span class="code">${esc(it.code)}</span><span>Onboarding step</span>`:""}${simple?"":`<span>${esc(it.role)}</span>${it.priority?`<span>${esc(it.priority)}</span>`:""}`}</div>
   ${it.blocked&&it.blocker?`<div class="blk">Blocked: ${esc(it.blocker.text||"")}${it.blocker.person?` (waiting on ${esc(it.blocker.person)})`:""}</div>`:""}</div>
   <div>${dueHtml(it.due,false)}</div><div>${ctl}</div></div>`}

