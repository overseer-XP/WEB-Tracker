/* ---------- platform access: 5 steps, who has a login, next step, chasing, one thread per row ----------
   Teams, leads, chase days, BP section map and founder instructions live in config/access_setup. */
const ACC_DONE=["Granted","Team confirmed"],ACC_FOUNDER=["Needed","Asked founder","Founder actioned"],ACC_STEPS=["Needed","Asked founder","Founder actioned","Granted","Team confirmed"];
const SEAT_STATES=["Has login","Asked","Waiting"];
const accGranted=a=>!!a&&ACC_DONE.includes(a.status);
const accOpen=a=>!!a&&a.status!=="Not Needed"&&!accGranted(a);
const ACCESS_SETUP=()=>S.config.access_setup||{};
const accTeams=()=>(ACCESS_SETUP().teams||[]).map(t=>t.name).concat(["Other"]);
function accTeamOf(a){if(a.team)return a.team;for(const t of(ACCESS_SETUP().teams||[]))if((t.platforms||[]).includes(a.platform))return t.name;return"Other"}
function teamLead(n){const t=(ACCESS_SETUP().teams||[]).find(x=>x.name===n);return t&&t.lead||""}
const chaseDays=()=>+ACCESS_SETUP().chase_days||2;
function workdaysSince(iso){const d=parseD(iso);if(!d)return null;let n=0;const x=new Date(d);const t=today();while(x<t){x.setDate(x.getDate()+1);const w=x.getDay();if(w&&w!==6)n++}return n}
function lastContact(a){const c=(a.chases||[]);return c.length?c[c.length-1].date:(a.requested_date||"")}
function needsChase(a){if(a.status!=="Asked founder")return false;const w=workdaysSince(lastContact(a));return w===null||w>=chaseDays()}
const accThread=id=>withId(S.comments).filter(c=>c.access===id).sort((a,b)=>a.at-b.at);
function accSystemNote(a,id,text){if(!db||!canWrite)return;create("comments",null,{brand:a.brand,access:id,kind:"system",text,by:me||"",at:Date.now(),mentions:[]},"Access note")}
function setAccStatus(id,v){const a=S.access[id];if(!a||a.status===v)return;const p={status:v};if(v==="Asked founder"&&!a.requested_date)p.requested_date=isoToday();
  save("access",id,p,bname(a.brand)+" "+a.platform);accSystemNote(a,id,`Status changed from ${a.status||"Needed"} to ${v}`)}

/* BP sections wait for the platforms they audit */
function bpAccess(bid,sec){const need=(ACCESS_SETUP().bp_map||{})[sec]||[];if(!need.length)return null;
  const rows=Object.values(S.access).filter(a=>a.brand===bid&&need.includes(a.platform)&&a.status!=="Not Needed");
  if(!rows.length)return{state:"untracked",need};const missing=rows.filter(a=>!accGranted(a)).map(a=>a.platform);
  return missing.length?{state:"locked",missing}:{state:"ready"}}
const LOCK=`<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2h.5A1 1 0 0 1 13 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm1.5 0h4V5a2 2 0 0 0-4 0z"/></svg>`;

/* message to the founder: every missing platform for one brand, with set-up steps */
function founderMessage(bid){const b=S.brands[bid]||{};const rows=withId(S.access).filter(a=>a.brand===bid&&ACC_FOUNDER.includes(a.status));const help=ACCESS_SETUP().help||{};
  if(!rows.length)return"";return`Hi ${b.founder||"there"},\n\nTo start our audit for ${b.name||"the brand"} we still need access to ${rows.length===1?"one platform":rows.length+" platforms"}:\n\n`+
  rows.map((a,i)=>`${i+1}. ${a.platform}${a.access_level&&a.access_level!=="TBC"?` (${a.access_level})`:""}\n   ${help[a.platform]||"Please add our team email with admin access."}`).join("\n\n")+`\n\nLet us know once done and we will confirm we can log in. Thank you!`}
function openFounderMessage(bid){const txt=founderMessage(bid);if(!txt){toast("Nothing is waiting on the founder for this brand.");return}
  const m=$("#modal");const asked=withId(S.access).filter(a=>a.brand===bid&&a.status==="Needed").length;
  m.innerHTML=`<div class="box wide"><h3>Message for ${esc((S.brands[bid]||{}).founder||"the founder")}</h3><p class="muted" style="margin-top:0">One message for every platform still missing at ${esc(bname(bid))}. Copy it into WhatsApp or email. Edit the steps per platform in Settings > Access setup.</p>
   <label for="fm-text" class="sr">Message</label><textarea id="fm-text" rows="12" readonly>${esc(txt)}</textarea>
   <div class="row"><button class="btn pri" data-act="fm-copy">Copy message</button>${asked&&canWrite?`<button class="btn" data-act="fm-asked" data-id="${esc(bid)}">Copy and mark ${asked} as Asked founder</button>`:""}<span class="grow"></span><button class="btn" data-act="mclose">Close</button></div></div>`;m.hidden=false}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast("Copied")}catch(e){const x=$("#fm-text");if(x){x.focus();x.select()}toast("Press Ctrl+C or Cmd+C to copy")}}

/* views */
const ACC_MARK={"Needed":"✗","Asked founder":"A","Founder actioned":"F","Granted":"✓","Team confirmed":"✓✓","Blocked":"!","Not Needed":"–"};
let accQueue="open";
function accQueues(){const q=[["open","All open"],["founder","Waiting on founder"],["chase","Needs a chase"]];for(const t of accTeams())q.push(["team:"+t,t]);q.push(["logins","Team logins missing"],["done","Done"]);return q}
function inQueue(a,q){if(q==="open")return accOpen(a)||a.status==="Granted";if(q==="founder")return ACC_FOUNDER.includes(a.status);if(q==="chase")return needsChase(a);
  if(q==="logins")return a.status==="Granted";if(q==="done")return a.status==="Team confirmed"||a.status==="Not Needed";if(q.startsWith("team:"))return accTeamOf(a)===q.slice(5)&&a.status!=="Not Needed";return true}
function seatChips(a){const s=a.seats||[];if(!s.length)return`<span class="faint">No one yet</span>`;return s.map(x=>`<span class="seat st-${key(x.s)}" title="${esc(x.p+": "+x.s)}">${esc(x.p)}${x.s==="Has login"?" ✓":x.s==="Asked"?" ·":""}</span>`).join("")}
const outTag=bid=>{const b=S.brands[bid];if(!onHold(b))return"";return`<span class="tag outtag">${esc(isOutStage(b.stage)?b.stage:"Paused")}</span>`};
function accBrands(){const all=withId(S.access);const by={};for(const a of all)if(inQueue(a,accQueue))(by[a.brand]=by[a.brand]||[]).push(a);
  if(accQueue==="open")for(const b of brandList())if(!isInternal(b)&&!all.some(a=>a.brand===b.id))by[b.id]=[];
  return Object.keys(by).filter(b=>S.brands[b]).sort((x,y)=>(holdOf(x)?1:0)-(holdOf(y)?1:0)||(by[y].some(needsChase)?1:0)-(by[x].some(needsChase)?1:0)||bname(x).localeCompare(bname(y))).map(b=>{const mine=all.filter(a=>a.brand===b&&a.status!=="Not Needed");
    return{b,n:by[b].length,ok:mine.filter(accGranted).length,total:mine.length,chase:by[b].filter(needsChase).length,founder:by[b].filter(a=>ACC_FOUNDER.includes(a.status)).length}})}
function accFull(bid){
  if(!bid){const list=accBrands();const chips=`<div class="toolbar accbar"><label class="tl">Show <select data-act="accqsel" aria-label="Which platforms">${accQueues().map(([k,l])=>{const n=withId(S.access).filter(a=>S.brands[a.brand]&&!holdOf(a.brand)&&inQueue(a,k)).length;return`<option value="${esc(k)}" ${accQueue===k?"selected":""}>${esc(l)} (${n})</option>`}).join("")}</select></label></div>`;
    if(!list.length)return chips+`<div class="tw"><div class="empty">Nothing in this list.</div></div>`;
    const cur=list.some(x=>x.b===accBrand)?accBrand:list[0].b;
    const side=`<div class="acclist" role="list" aria-label="Brands"><input id="acc-find" type="search" placeholder="Find a brand (${list.length})" aria-label="Find a brand"><div class="accbs">${list.map(x=>`<button role="listitem" class="accb ${x.b===cur?"on":""}" data-act="accb" data-id="${esc(x.b)}" data-n="${esc(bname(x.b).toLowerCase())}" aria-current="${x.b===cur}"><span class="an">${esc(bname(x.b))}</span><span class="am">${x.total?`${x.ok} of ${x.total} granted`:"No platforms yet"}</span><span class="aw ${x.chase?"bad":x.founder?"warn":x.ok===x.total&&x.total?"ok":"off"}">${x.total===0?"":x.chase?`${smark("blk","")} ${x.chase} to chase`:x.founder?`${x.founder} with founder`:x.ok===x.total&&x.total?`${smark("done","")} All granted`:"Open"}</span>${outTag(x.b)}</button>`).join("")}</div></div>`;
    const br=S.brands[cur]||{};const waiting=withId(S.access).filter(a=>a.brand===cur&&ACC_FOUNDER.includes(a.status)).length;const total=withId(S.access).filter(a=>a.brand===cur).length;const shown=list.find(x=>x.b===cur).n;
    const top=`<div class="row accbh"><h2><a class="bname" href="#brand-${esc(cur)}">${esc(bname(cur))}</a></h2>${outTag(cur)}<span class="faint">${esc(br.founder?"Founder: "+br.founder:"")}</span><span class="grow"></span>${waiting?`<button class="btn sm" data-act="fm-open" data-id="${esc(cur)}">Message for founder (${waiting})</button>`:""}${canWrite?`<button class="btn sm" data-act="add-access" data-id="${esc(cur)}">Add platform</button>`:""}</div>${shown<total?`<p class="faint" style="margin:0 0 8px">Showing ${shown} of ${total} platforms in this list.</p>`:""}`;
    return chips+`<div class="accmd">${side}<div class="accdet">${top}${accRows(withId(S.access).filter(a=>a.brand===cur&&inQueue(a,accQueue)),cur)}</div></div>`}
  return accRows(withId(S.access).filter(a=>a.brand===bid),bid)}
function accRows(rows,bid){
  const ord=a=>ACC_STEPS.indexOf(a.status)<0?(a.status==="Blocked"?-1:9):ACC_STEPS.indexOf(a.status);
  let h="";
  if(!rows.length)return`<div class="tw"><div class="empty">No platforms tracked for ${esc(bname(bid))} yet.${holdOf(bid)?` ${esc(bname(bid))} is ${esc(((S.brands[bid]||{}).stage||"paused").toLowerCase())}, so none may be needed.`:" Add the ones the team needs."}</div></div>`;
  h+=`<div class="tw"><table class="accfull"><thead><tr><th>Platform</th><th>Status and type</th><th>Team logins</th><th>Next step</th><th class="num"><span class="sr">Comments</span></th></tr></thead><tbody>`;
  {const list=rows.sort((x,y)=>ord(x)-ord(y)||String(x.platform).localeCompare(y.platform));
    for(const a of list){const lc=lastContact(a);const wd=workdaysSince(lc);const th=accThread(a._id).filter(c=>c.kind!=="system").length;const ns=a.next_step||{};
      h+=`<tr class="click" data-act="open" data-kind="access" data-id="${esc(a._id)}"><td class="ap"><b>${esc(a.platform)}</b><div class="sub2">${esc(accTeamOf(a))}${a.needed_for&&a.needed_for.toLowerCase()!==accTeamOf(a).toLowerCase()?" · "+esc(a.needed_for):""}</div></td>
       <td class="as">${statusSel("access",a._id,a.status||"Needed",L("access_status"),canWrite)}<div class="sub2">${esc(a.access_level&&a.access_level!=="TBC"?a.access_level:"Type TBC")}${a.access_via?" · "+esc(a.access_via):""}</div>${a.status==="Blocked"&&a.blocker?`<div class="blk">${esc(a.blocker)}</div>`:""}</td>
       <td><div class="seats">${seatChips(a)}</div></td>
       <td class="an2">${ns.text?`${esc(ns.text)}<div class="sub2">${esc(ns.who||"No one")}${ns.due?" · by "+esc(fmtD(ns.due)):""}</div>`:accOpen(a)?`<span class="tag warn">No next step</span>`:""}${lc&&ACC_FOUNDER.includes(a.status)?`<div class="sub2 ${needsChase(a)?"hot":""}">Last asked ${esc(fmtD(lc))}${wd!==null?` · ${wd} working day${wd===1?"":"s"}`:""}</div>`:""}</td>
       <td class="num">${th?`<span class="cnt" title="${th} comment${th===1?"":"s"}">${th}</span>`:""}</td></tr>`}}
  return h+`</tbody></table></div>`}
function accDrawer(id){const a=S.access[id];const th=accThread(id);const team=accTeamOf(a);const ns=a.next_step||{};const st=a.status||"Needed";
  const steps=`<div class="stepper w">${ACC_STEPS.map((x,i)=>`<span class="sp ${x===st?"cur":ACC_STEPS.indexOf(st)>i?"past":""}">${i+1}. ${esc(x)}</span>`).join("")}${["Blocked","Not Needed"].includes(st)?`<span class="sp cur">${esc(st)}</span>`:""}</div>`;
  const teamPeople=activePeople();
  return steps+"<!--platform-->"+field("Status",sel("status",L("access_status"),st,false))+field("Team",sel("team",accTeams(),team,false),0,team==="Other"?"":"Lead: "+(teamLead(team)||"not set"))
   +field("Access type",sel("access_level",L("access_level"),a.access_level))+field("How it is given",sel("access_via",L("access_via"),a.access_via),0,"Never store passwords here")
   +field("Needed for",inp("needed_for",a.needed_for),1)+field("Valerie owner",sel("owner",activePeople(),a.owner))+field("Brand contact",inp("brand_contact",a.brand_contact))
   +field("Asked founder on",inp("requested_date",a.requested_date,"date"))+field("Deadline",inp("deadline",a.deadline,"date"))
   +`<h4 class="dh">Next step</h4>`+field("What happens next",inp("ns_text",ns.text),1,"One line, for example: Noopur to ask Zach to add our email in GA4")+field("Who",sel("ns_who",activePeople(),ns.who))+field("By",inp("ns_due",ns.due,"date"))
   +field("Blocker",inp("blocker",a.blocker),1)+field("Notes",area("notes",a.notes),1,"Status only. No passwords or login details.")
   +`<h4 class="dh">Team logins</h4><div class="w seatedit">${(a.seats||[]).map((x,i)=>`<div class="seatrow"><b>${esc(x.p)}</b><select data-act="seat" data-i="${i}" aria-label="${esc(x.p)} login">${opts(SEAT_STATES,x.s,false)}</select><button type="button" class="btn sm quiet" data-act="seat-del" data-i="${i}" aria-label="Remove ${esc(x.p)}">Remove</button></div>`).join("")||`<p class="faint" style="margin:0">No one added yet.</p>`}
     ${canWrite?`<div class="row" style="gap:6px;margin-top:6px"><select id="seat-p" aria-label="Person">${opts(teamPeople.filter(p=>!(a.seats||[]).some(x=>x.p===p)),"")}</select><button type="button" class="btn sm" data-act="seat-add">Add person</button></div>`:""}</div>`
   +(ACC_FOUNDER.includes(st)?`<h4 class="dh">Chasing the founder</h4><div class="w">${(a.chases||[]).slice(-5).map(c=>`<div class="faint" style="font-size:12.5px">${esc(fmtD(c.date,true))} · ${esc(c.by||"")} · ${esc(c.how||"")}${c.note?": "+esc(c.note):""}</div>`).join("")||`<p class="faint" style="margin:0">Not chased yet.</p>`}
     ${canWrite?`<div class="row" style="gap:6px;margin-top:6px"><select id="ch-how" aria-label="How">${opts(["WhatsApp","Email","Call","Slack","In a meeting"],"WhatsApp",false)}</select><input id="ch-note" placeholder="Optional note" aria-label="Chase note" style="flex:1;min-width:120px"><button type="button" class="btn sm" data-act="chase">Log a chase</button></div>`:""}
     <button type="button" class="btn sm" style="margin-top:8px" data-act="fm-open" data-id="${esc(a.brand)}">Message for founder</button></div>`:"")
   +`<h4 class="dh">Notes and comments</h4><div class="w thread">${th.map(c=>c.kind==="system"?`<div class="sysn">${esc(new Date(c.at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}))} · ${esc(c.by||"")} · ${esc(c.text)}</div>`:`<div class="cmt"><div class="row" style="gap:8px"><b>${esc(c.by||"Someone")}</b><span class="faint" style="font-size:12px" title="${esc(agoText(c.at))}">${esc(fmtD(new Date(c.at).toISOString().slice(0,10)))}, ${esc(new Date(c.at).toLocaleTimeString("en-GB",{hour:"numeric",minute:"2-digit",hour12:true}).replace(" ","").toLowerCase())}${c.tz?" "+esc(c.tz):""}</span></div><div class="ctext">${linkMentions(c.text)}</div></div>`).join("")||`<p class="faint" style="margin:0">No comments yet.</p>`}
     ${canWrite?`<label for="acc-c" class="sr">Comment</label><textarea id="acc-c" placeholder="Update or question. @name to tag someone" rows="2"></textarea><button type="button" class="btn sm pri" data-act="acc-post" style="align-self:flex-start">Post</button>`:""}</div>`}

