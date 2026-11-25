/* ---------- drawer ---------- */
function field(l,inner,wide,hint){const m=/\bid="([^"]+)"/.exec(inner);return`<div class="f ${wide?"w":""}"><label${m?` for="${m[1]}"`:""}>${esc(l)}</label>${inner}${hint?`<span class="hint">${esc(hint)}</span>`:""}</div>`}
const inp=(n,v,t)=>`<input name="${n}" id="d-${n}" type="${t||"text"}" value="${esc(v||"")}">`;
const area=(n,v)=>`<textarea name="${n}" id="d-${n}">${esc(v||"")}</textarea>`;
const sel=(n,list,v,blank)=>`<select name="${n}" id="d-${n}">${opts(list,v||"",blank)}</select>`;
function openDrawer(kind,id,extra,refresh){
  if(!refresh||!drawerCtx||drawerCtx.kind!==kind||drawerCtx.id!==id)drawerDirty={};
  drawerCtx={kind,id,extra};let title="",body="",foot="",ro=!canWrite;
  if(kind==="task"){const t=S.tasks[id];if(!t){closeDrawer();return}ro=!canChangeTask(t);title=t.title||"New task";
    const cid=campOf(t)===NOCAMP?"":campOf(t);const bl=boardLists(t.brand,cid,withId(S.tasks).filter(x=>x.brand===t.brand&&x.title&&campOf(x)===campOf(t)));const cur=listOf(Object.assign({_id:id},t),bl);
    const main=`<input class="cbtitle" name="title" id="d-title" value="${esc(t.title||"")}" aria-label="Card title">
     <p class="cbin">in list <b>${esc(cur?cur.name:t.status||"")}</b> · <a href="#brand-${esc(t.brand)}">${esc(bname(t.brand))}</a>${cid?" · "+esc(campName(cid)):""} · ${esc(t.status||"Not Started")}</p>
     <div class="cbtop">${field("Owner",sel("owner",activePeople(),t.owner))+field("Status",sel("status",L("task_status"),t.status,false))+field("Priority",sel("priority",L("priority"),t.priority))+field("Start",inp("start",t.start,"date"))+field("Due",inp("deadline",t.deadline,"date"))}</div>
     <div class="cbsec" id="cb-members"><h4>Members</h4>${memEditor(t)}</div>
     <div class="cbsec" id="cb-labels"><h4>Labels</h4>${labelEditor(id,t)}</div>
     ${t.status==="Blocked"?`<div class="cbsec cbblk"><h4>Blocked</h4><div class="cbtop">${field("Because",inp("blk_text",t.blocker&&t.blocker.text),1)+field("Waiting on",sel("blk_person",activePeople(),t.blocker&&t.blocker.person))}</div></div>`:""}
     <div class="cbsec" id="cb-desc"><h4>☰ Description</h4>${area("notes",t.notes)}</div>
     <div class="cbsec" id="cb-check">${taskBack(id,t).split('<h4 class="dh">Comments and activity</h4>')[0]}</div>
     <div class="cbsec" id="cb-links"><h4>${ICON.link} Links</h4><div class="cbtop">${field("Brief link",inp("brief_link",t.brief_link,"url"))+field("Creative link",inp("creative_link",t.creative_link,"url"))}</div><p class="hint">Links only. Never paste contract text.</p></div>
     <details class="cbsec cbmore" id="cb-more" ${t.lead||t.qa||t.needs_approval?"open":""}><summary>More details: brand, team, list, campaign, roles and approval</summary><div class="cbtop">${field("Brand",`<select name="brand" id="d-brand">${brandList().map(b=>`<option value="${esc(b.id)}" ${b.id===t.brand?"selected":""}>${esc(b.name)}</option>`).join("")}</select>`)+field("Team",sel("department",DEPTS(),depOf(t),false))
       +(bl.length?field("List",`<select name="list" id="d-list">${bl.map(l=>`<option value="${esc(l.id)}" ${cur&&l.id===cur.id?"selected":""}>${esc(l.name)}</option>`).join("")}</select>`):"")
       +(campsOf(t.brand).length||t.campaign?field("Campaign",`<select name="campaign" id="d-campaign"><option value="">Not in a campaign</option>${campsOf(t.brand).map(c=>`<option value="${esc(c._id)}" ${c._id===t.campaign?"selected":""}>${esc(c.name)}</option>`).join("")}</select>`):"")
       +field("Vertical",sel("vertical",VERTS(),t.vertical||""))+field("Lead",sel("lead",activePeople(),t.lead||""),0,"Accountable for the result")+field("QA by",sel("qa",activePeople(),t.qa||""))+field("Approval",`<select name="needs_approval" id="d-needs_approval"><option value="No" ${t.needs_approval?"":"selected"}>Not needed</option><option value="Yes" ${t.needs_approval?"selected":""}>Needed</option></select>`,0,"Needed: Done waits for the approver")+field("Approver",sel("approver",activePeople(),t.approver||""))}</div>
       ${t.approved_at?`<p class="okline">Approved by ${esc(t.approved_by||"")} on ${esc(fmtD(t.approved_at,true))}</p>`:needsOk(t)&&canApprove(t)&&t.status!==DONE?`<button type="button" class="btn pri sm" data-act="approve" data-id="${esc(id)}">Approve and mark done</button>`:""}${t.source?`<p class="faint" style="font-size:12px">${esc(t.source)}</p>`:""}</details>
     <div class="cbsec" id="cb-act"><h4>💬 Activity</h4>${taskBack(id,t).split('<h4 class="dh">Comments and activity</h4>')[1]||""}</div>`;
    const sb=(a,l,extra)=>`<button type="button" class="cbb" data-act="${a}" ${extra||""}>${l}</button>`;
    const side=`<div class="cbl">Add to card</div>${sb("cb-jump","👤 Members",'data-v="cb-members"')}${sb("cb-jump","🏷 Labels",'data-v="cb-labels"')}${sb("cb-jump","☑ Checklist",'data-v="ck-new"')}${sb("cb-jump","🕘 Dates",'data-v="d-deadline"')}${sb("cb-jump","🔗 Link",'data-v="d-brief_link"')}
     <div class="cbcov">${COVERS.map(c=>`<button type="button" class="${t.cover===c?"on":""}" data-act="cb-cover" data-v="${c}" style="background:var(--${c})" aria-label="Cover colour"></button>`).join("")}<button type="button" class="${t.cover?"":"on"}" data-act="cb-cover" data-v="" aria-label="No cover">✕</button></div>
     <div class="cbl">Actions</div>${sb("cb-jump","➜ Move",'data-v="d-status"')}${sb("cb-copy","⧉ Copy",`data-id="${esc(id)}"`)}${t.brand&&S.brands[t.brand]?escButton("task",id).replace('class="btn"','class="cbb"'):""}${canChangeTask(t)?sb("archive","🗄 Archive",`data-id="${esc(id)}"`):""}${canEdit&&canWrite?sb("del","Delete",`data-kind="task" data-id="${esc(id)}"`):""}`;
    body=`<div class="cbmain">${main}</div><aside class="cbside">${ro?"":side}</aside>`;foot="cardback"}
  else if(kind==="brand"){const b=S.brands[id];if(!b){closeDrawer();return}ro=!(canEdit&&canWrite);title=b.name;
    body=field("Name",inp("name",b.name))+field("Stage",sel("stage",L("stage"),b.stage,false))+field("Brand lead",sel("lead",activePeople(),b.lead))+field("Founder",inp("founder",b.founder))+field("Founder country",inp("founder_country",b.founder_country||""))+field("Founder time zone",sel("founder_zone",tzList(),b.founder_zone||""),0,"Shows the founder's local time on the SOW tracker")+field("Website",inp("website",b.website,"url"),1)
     +field("Brand colours on this page",`<select name="theme_on" id="d-theme_on">${opts(["No","Yes"],b.theme_on?"Yes":"No",false)}</select>`,0,"A soft background in the brand's colour")+field("Brand colour",inp("color",b.color||"#2A3337","color"),0,"Used for the brand name")+field("Background colour",inp("tint",b.tint||"#DCE6EE","color"),0,"Shown behind the top of the page")
     +field("Sprint",inp("sprint_label",b.sprint_label),1)+field("Next step",area("next_step",b.next_step),1)
     +field("On hold (paused)",`<select name="paused" id="d-paused">${opts(["No","Yes"],b.paused?"Yes":"No",false)}</select>`)+field("Restricted",`<select name="restricted" id="d-restricted">${opts(["No","Yes"],b.restricted?"Yes":"No",false)}</select>`,0,"Marks the brand as sensitive. Access limits come with the full build")}
  else if(kind==="step"){const s=S.steps[extra];const st=stepState(id,extra);if(!s){closeDrawer();return}title=s.code+" "+s.name;
    body=(st.sent_back?`<div class="notice bad w" style="grid-column:1/-1;margin:0">Sent back by ${esc(st.sent_back.by||"leadership")} on ${esc(fmtD(st.sent_back.at,true))}: ${esc(st.sent_back.note||"")}. Change the step to send it again.</div>`:"")+`<p class="muted w" style="grid-column:1/-1;margin:0">${esc(bname(id))}${s.is_gate?" · Gate step":""}${s.auto&&AUTO[s.auto]?" · Ticks itself when "+esc(AUTO[s.auto].label.toLowerCase())+(st.auto?" (it is now)":""):""}${s.is_optional?" · Optional":""}${s.default_owner?" · Usually "+esc(s.default_owner):""}</p>`
     +field("Status",sel("status",L("checklist"),st.status||"Not Started",false))+field("Owner",sel("owner",activePeople(),st.owner))+field("Deadline",inp("deadline",st.deadline,"date"))
     +field(s.doc_label?"Link to "+s.doc_label:"Document link",inp("link",st.link,"url"))+field("Blocked because",inp("blk_text",st.blocker&&st.blocker.text),1,"Leave empty when nothing blocks it")+field("Waiting on",sel("blk_person",activePeople(),st.blocker&&st.blocker.person))
     +field("Notes",area("notes",st.notes),1)}
  else if(kind==="access"){const a=S.access[id];if(!a){closeDrawer();return}title=bname(a.brand)+" · "+(a.platform||"Platform");
    body=accDrawer(id).replace("<!--platform-->",field("Platform",sel("platform",L("platform"),a.platform)));
    if(canEdit&&canWrite)foot=`<button class="btn danger" data-act="del" data-kind="access" data-id="${esc(id)}">Delete row</button>`}
  else if(kind==="sow"){const s=S.sow[id]||{};title="SOW · "+bname(id);ro=!canWrite;
    const lg=nsLog(s);
    const left=`<h4 class="dh">Status</h4><div class="sg3">${field("Stage",sel("stage",L("sow_stage"),s.stage||"Not Started",false))+field("Owner",sel("owner",activePeople(),s.owner))+field("Priority",`<input name="priority" id="d-priority" type="number" min="1" max="9" value="${esc(s.priority||"")}" placeholder="1 is highest">`)}</div>
     <h4 class="dh">Dates</h4><div class="sg3">${field("Target sign",inp("target_sign",s.target_sign,"date"))+field("Draft due",inp("draft_due",s.draft_due,"date"))+field("Start date",inp("start_date",s.start_date,"date"))}</div>
     <h4 class="dh">Team</h4><div class="sg3">${field("Batch",inp("batch",s.batch))}<div class="sgspan2">${field("Support team",inp("support",(s.support||[]).join(", ")),1,"Names separated by commas")}</div></div>
     <h4 class="dh">Growth forecast</h4><div class="sg3">${field("GF status",inp("gf_status",s.gf_status),0,"V1 completed, WIP, Pending")+field("GF updated",`<select name="gf_updated" id="d-gf_updated">${opts(["No","Yes"],s.gf_updated?"Yes":"No",false)}</select>`)}</div>
     <h4 class="dh">Blocker</h4>${field("Blocker or dependency",area("blocker",s.blocker),1)}`;
    const right=`<h4 class="dh">Documents</h4><div class="sg2">${SOW_DOCS().map((k,i)=>field(k,`<input name="doc_${i}" id="d-doc_${i}" type="url" value="${esc(sowDocs(id)[k]||"")}" placeholder="https://...">`)).join("")}</div>
     ${field("Other documents",area("docs_extra",(s.docs_extra||[]).map(x=>x.label+" | "+x.url).join("\n")),1,"One per line: name | link. Links only.")}
     <h4 class="dh">Next steps</h4><div class="nslog">${lg.map((e,i)=>({e,i})).reverse().map(({e,i})=>`<div class="nse"><span class="nss">${esc(nsStamp(e))}${e.edited?` · edited by ${esc(e.edited.by||"")}`:""}${e.done?` · done by ${esc(e.done.by||"")}`:""}</span><span>${e.done?"✓ ":""}${esc(e.t)}</span>${ro?"":`<span class="nsacts"><button type="button" class="linkb" data-act="ns-edit" data-id="${esc(id)}" data-i="${i}">Edit</button><button type="button" class="linkb" data-act="${e.done?"ns-reopen":"ns-done"}" data-id="${esc(id)}" data-i="${i}">${e.done?"Reopen":"✓ Done"}</button><button type="button" class="linkb nsrm" data-act="ns-del" data-id="${esc(id)}" data-i="${i}">Remove</button></span>`}</div>`).join("")||`<span class="faint">None yet</span>`}</div>
     ${ro?"":field("Add an update",area("ns_new",""),1,"Your name, the date, time and time zone are added for you. Use Edit on an entry to correct it.")}`;
    body=`<p class="sowto"><a href="#${brandHash(id,"sow")}" data-act="close-go">Open the ${esc(bname(id))} brand page →</a></p><div class="sowgrid"><div>${left}</div><div>${right}</div></div>`}
  else if(kind==="camp"){const c=S.camps[id];if(!c){closeDrawer();return}title=c.name;
    body=field("Campaign name",inp("name",c.name),1)+field("Status",sel("status",L("campaign_status"),c.status))+field("Owner",sel("owner",activePeople(),c.owner))+field("Start",inp("start",c.start,"date"))+field("Launch or end",inp("end",c.end,"date"))
     +field("What it is for",area("purpose",c.purpose),1,"One or two lines: the product, the goal, the audience")+field("Success looks like",inp("goal",c.goal),1,"For example: 40 creator posts and 2x ROAS in launch month")+field("Brief or plan link",inp("link",c.link,"url"),1);
    if(canEdit&&canWrite)foot=`<button class="btn danger" data-act="del" data-kind="camp" data-id="${esc(id)}">Delete campaign</button>`}
  else if(kind==="board"){const r=boardDrawerBody(id,extra);if(!r){closeDrawer();return}title=r.title;body=r.body;ro=false;foot="board"}
  else if(kind==="bp"){const d=S.bps[id];if(!d){closeDrawer();return}title="Best Practices · "+bname(id);
    body=BPGROUPS().map(g=>(g.name?`<h4 class="dh">${esc(g.name)}</h4>`:"")+g.sections.map(x=>field(x,`<select name="sec:${esc(x)}" id="d-sec-${key(x)}">${opts(L("bp_status"),(d.sections||{})[x]||"Not Started",false)}</select>`)).join("")).join("")+`<h4 class="dh">Details</h4>`
     +field("BP owner",sel("owner",activePeople(),d.owner))+field("Due date",inp("due_date",d.due_date,"date"))+field("Blocker",inp("blocker",d.blocker),1)+field("BP document link",inp("doc_link",d.doc_link,"url"),1)+field("Notes",area("notes",d.notes),1)}
  if(["step","access","sow"].includes(kind)&&S.brands[kind==="task"?(S.tasks[id]||{}).brand:kind==="access"?(S.access[id]||{}).brand:id])foot=(kind==="step"?escButton("step",id,extra):escButton(kind,id))+(foot||"");
  const dr=$("#drawer");
  // While someone types in the panel, wait. Otherwise redraw it and put back anything changed but not saved yet.
  const ae=document.activeElement;if(refresh&&dr.contains(ae)&&(ae.tagName==="TEXTAREA"||ae.tagName==="INPUT"&&!/checkbox|radio|button|submit/.test(ae.type)))return;
  const keepFocus=refresh&&dr.contains(ae)?(ae.id||(ae.dataset&&ae.dataset.act?`[data-act="${ae.dataset.act}"]${ae.dataset.i!==undefined?`[data-i="${ae.dataset.i}"]`:""}`:"")):"";
  const sc=refresh?(dr.querySelector(".body")||{}).scrollTop||0:0;
  dr.classList.toggle("cardback",foot==="cardback");dr.classList.toggle("sowd",kind==="sow");
  dr.innerHTML=foot==="cardback"?`<header><h3 class="sr">${esc(title)}</h3><span class="grow"></span><button class="btn sm quiet" data-act="close" aria-label="Close">✕</button></header><form class="body" id="dform">${body}</form><footer><span class="muted">${ro?"You can view this card but not change it.":"Changes save as you go."}</span></footer>`:`<header><h3>${esc(title)}</h3><button class="btn sm quiet" data-act="close">Close</button></header><form class="body" id="dform">${body}</form>
   <footer>${foot==="board"?`<span class="muted">Changes save straight away.</span><span class="grow"></span><button class="btn" data-act="nav-steps" data-id="${esc(id)}">All steps for this brand</button>`:(ro?`<span class="muted">You can view this but not change it.</span>`:`<button class="btn pri" data-act="dsave">Save</button><button class="btn" data-act="close">Cancel</button>`)+`<span class="grow"></span>${foot}`}</footer>`;
  if(foot==="cardback")dr.querySelector("form").addEventListener("submit",e=>e.preventDefault());
  if(refresh){const f=$("#dform");if(f)for(const[n,v]of Object.entries(drawerDirty)){const el=f.elements[n];if(el&&"value"in el)el.value=v}const b=dr.querySelector(".body");if(b)b.scrollTop=sc;
    if(keepFocus){const el=keepFocus.startsWith("[")?dr.querySelector(keepFocus):document.getElementById(keepFocus);if(el)el.focus()}}
  if(ro)dr.querySelectorAll("input,select,textarea").forEach(e=>e.disabled=true);
  if(ro&&canWrite&&kind==="task"){const c=dr.querySelector("#task-c");if(c)c.disabled=false}
  dr.hidden=false;$("#scrim").hidden=false;if(!refresh){const f=foot==="cardback"?dr.querySelector("[data-act=close]"):dr.querySelector("input,select");if(f)f.focus()}
}
let drawerDirty={};
function closeDrawer(){drawerCtx=null;drawerDirty={};$("#drawer").hidden=true;$("#drawer").classList.remove("cardback","sowd");$("#scrim").hidden=true}
/* members: tag or untag people on a card; saves straight away */
function memEditor(t){const sup=t.support||[];const ed=canChangeTask(t);
  return`<div class="mems">${sup.map((p,i)=>`<span class="mem"><span class="av sup" aria-hidden="true">${esc(ini(p))}</span>${esc(p)}${ed?`<button type="button" class="memx" data-act="mem-del" data-i="${i}" aria-label="Remove ${esc(p)}">×</button>`:""}</span>`).join("")||`<span class="faint">No one tagged yet</span>`}</div>`
   +(ed?`<select id="mem-add" data-act="mem-add"><option value="">Tag a member...</option>${activePeople().filter(p=>p!==t.owner&&!sup.includes(p)).map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join("")}</select>`:"")}
const splitNames=v=>String(v||"").split(",").map(s=>s.trim()).filter(Boolean);
async function drawerSave(keep){
  const{kind,id,extra}=drawerCtx;const fd={};for(const el of $("#dform").elements)if(el.name)fd[el.name]=el.value.trim();
  const diff=(cur,next)=>{const p={};for(const k of Object.keys(next)){if(JSON.stringify(cur[k]??"")!==JSON.stringify(next[k]??""))p[k]=next[k]}return p};
  if(kind==="task"){const t=S.tasks[id];const next={title:fd.title,brand:fd.brand,department:fd.department,campaign:fd.brand===t.brand?(fd.campaign??t.campaign??""):"",vertical:fd.vertical||"",owner:fd.owner,status:fd.status,priority:fd.priority,deadline:fd.deadline,notes:fd.notes,
      lead:fd.lead||"",qa:fd.qa||"",approver:fd.approver||"",needs_approval:fd.needs_approval==="Yes"};
    next.status=approvalGate(Object.assign({},t,{needs_approval:next.needs_approval}),next.status);if(t.approved_at&&next.status!==DONE)Object.assign(next,{approved_by:"",approved_at:""});
    if(!simple)Object.assign(next,{start:fd.start,brief_link:fd.brief_link,creative_link:fd.creative_link});
    if(!next.title){toast("Give the task a name.");return}
    if(next.status==="Blocked"){const text=fd.blk_text!==undefined?fd.blk_text:(t.blocker&&t.blocker.text);const person=fd.blk_person!==undefined?fd.blk_person:(t.blocker&&t.blocker.person);
      if(!text||!person){if(t.status!=="Blocked"){closeDrawer();askBlocker(r=>save("tasks",id,Object.assign(diff(t,next),{status:"Blocked",blocker:r}),t.title));return}toast("A blocker needs one line and a person.");return}
      next.blocker={text,person}}else next.blocker=null;
    let movedTo="";
    if((next.campaign||"")!==(t.campaign||""))next.list="";
    else if(fd.list){const cid=campOf(t)===NOCAMP?"":campOf(t);const bl=boardLists(t.brand,cid,withId(S.tasks).filter(x=>x.brand===t.brand&&x.title&&campOf(x)===campOf(t)));const cur=listOf(Object.assign({_id:id},t),bl);const l=bl.find(x=>x.id===fd.list);
      if(l&&cur&&l.id!==cur.id){next.list=l.id;if(l.team)next.department=l.team;movedTo=l.name}}
    const p=diff(t,next);if(Object.keys(p).length){await save("tasks",id,p,t.title);if(p.status)taskNote(t,id,`Moved from ${t.status||"Not Started"} to ${p.status}`);if(movedTo)taskNote(t,id,`Moved to ${movedTo}`)}}
  else if(kind==="brand"){const b=S.brands[id];const next={name:fd.name,stage:fd.stage,lead:fd.lead,founder:fd.founder,website:fd.website,theme_on:fd.theme_on==="Yes",color:fd.color||"",tint:fd.tint||"",sprint_label:fd.sprint_label,next_step:fd.next_step,founder_country:fd.founder_country||"",founder_zone:fd.founder_zone||"",paused:fd.paused==="Yes",restricted:fd.restricted==="Yes"};
    if(!next.name){toast("A brand needs a name.");return}const p=diff(b,next);if(Object.keys(p).length)await save("brands",id,p,b.name)}
  else if(kind==="step"){const st=stepState(id,extra);
    if(fd.status==="Done"&&st.status!=="Done"){const why=gateBlock(id,extra);if(why){toast(why);return}}
    if(fd.blk_text&&!fd.blk_person){toast("A blocker needs a person too.");return}
    const next={status:fd.status,owner:fd.owner,deadline:fd.deadline,link:fd.link,notes:fd.notes,blocker:fd.blk_text?{text:fd.blk_text,person:fd.blk_person}:null};
    await saveStep(id,extra,next)}
  else if(kind==="access"){const a=S.access[id];const next={platform:fd.platform,status:fd.status,team:fd.team===accTeamOf(Object.assign({},a,{team:""}))?"":fd.team,access_level:fd.access_level,access_via:fd.access_via||"",needed_for:fd.needed_for,owner:fd.owner,brand_contact:fd.brand_contact,requested_date:fd.requested_date,deadline:fd.deadline,blocker:fd.blocker,notes:fd.notes,
      next_step:fd.ns_text?{text:fd.ns_text,who:fd.ns_who||"",due:fd.ns_due||""}:null};
    if(next.status==="Blocked"&&(!next.blocker||!next.owner)){toast("A blocked row needs a blocker and a Valerie owner.");return}
    if(next.status==="Asked founder"&&!next.requested_date)next.requested_date=isoToday();
    const p=diff(a,next);if(Object.keys(p).length){await save("access",id,p,bname(a.brand)+" "+a.platform);if(p.status)accSystemNote(a,id,`Status changed from ${a.status||"Needed"} to ${p.status}`);if(p.next_step&&p.next_step.text)accSystemNote(a,id,`Next step: ${p.next_step.text}${p.next_step.who?" ("+p.next_step.who+(p.next_step.due?", by "+fmtD(p.next_step.due):"")+")":""}`)}}
  else if(kind==="sow"){const s=S.sow[id]||{};const next={stage:fd.stage,owner:fd.owner,target_sign:fd.target_sign,draft_due:fd.draft_due,start_date:fd.start_date,batch:fd.batch,support:splitNames(fd.support),gf_updated:fd.gf_updated==="Yes",gf_status:fd.gf_status||"",blocker:fd.blocker};
    const dk=SOW_DOCS();const docs=Object.assign({},s.docs||{});dk.forEach((k,i)=>{const v=(fd["doc_"+i]||"").trim();if(v)docs[k]=v;else delete docs[k]});
    const ex=String(fd.docs_extra||"").split("\n").map(l=>l.split("|").map(x=>x.trim())).filter(x=>x[0]&&x[1]).map(([label,url])=>({label,url}));
    const bad=Object.values(docs).concat(ex.map(x=>x.url)).find(u=>!/^https?:\/\/\S+$/i.test(u));if(bad){toast("Links must start with https://");return}
    next.docs=docs;next.docs_extra=ex;
    if((fd.ns_new||"").trim()){if(!me){toast("Pick your name at the top first, so the update shows who wrote it.");return}next.ns_log=nsLog(s).filter(e=>!e.legacy||!(s.ns_log||[]).length).concat([nsEntry(fd.ns_new.trim())])}
    if(next.stage==="Blocked"&&!next.blocker){toast("Say what blocks the SOW.");return}
    if(!S.sow[id]){await create("sow",id,Object.assign({brand:id},next),"SOW "+bname(id))}else{const p=diff(s,next);if(Object.keys(p).length)await save("sow",id,p,"SOW "+bname(id))}}
  else if(kind==="camp"){const c=S.camps[id];const next={name:fd.name,status:fd.status,owner:fd.owner,start:fd.start,end:fd.end,purpose:fd.purpose,goal:fd.goal,link:fd.link};
    if(!next.name){toast("A campaign needs a name.");return}const p=diff(c,next);if(Object.keys(p).length)await save("camps",id,p,c.name)}
  else if(kind==="bp"){const d=S.bps[id];const sections=Object.assign({},d.sections||{});for(const x of L("bp_section"))if(fd["sec:"+x])sections[x]=fd["sec:"+x];
    const next={sections,owner:fd.owner,due_date:fd.due_date,blocker:fd.blocker,doc_link:fd.doc_link,notes:fd.notes};const p=diff(d,next);if(Object.keys(p).length)await save("bps",id,p,"BPs "+bname(id))}
  if(keep&&drawerCtx){drawerDirty={};openDrawer(drawerCtx.kind,drawerCtx.id,drawerCtx.extra,true)}else closeDrawer()}
function gateBlock(bid,code){const s=S.steps[code];if(!s||!s.is_gate)return"";const open=stepsSorted().filter(x=>x.order<s.order&&!x.is_optional&&!["Done","N/A"].includes(stepState(bid,x.code).status));
  return open.length?`${s.code} is a gate. Finish ${open.length} earlier step${open.length>1?"s":""} first: ${open.slice(0,4).map(x=>x.code).join(", ")}${open.length>4?"...":""}`:""}
async function saveStep(bid,code,next){
  if(!db||!canWrite){toast("You can view this tracker but not change it.");return}
  const had=!!S.bsteps[bid];const doc=S.bsteps[bid]||{brand:bid,s:{}};const cur=(doc.s||{})[code]||{};
  if(S.steps[code]&&S.steps[code].is_gate&&next.status==="Done"&&cur.status!=="Done")next=Object.assign({},next,{approved_by:me||"",approved_at:isoToday()});
  if(next.status&&next.status!=="Done"&&cur.approved_by)next=Object.assign({},next,{approved_by:"",approved_at:""});
  if(cur.sent_back&&!("sent_back" in next))next=Object.assign({},next,{sent_back:null});
  if(next.status&&next.status!==(cur.status||""))next=Object.assign({},next,{since:isoToday()});
  const merged=Object.assign({},cur,next);
  const p={};for(const k of Object.keys(next))if(JSON.stringify(cur[k]??"")!==JSON.stringify(next[k]??""))p[k]=next[k];if(!Object.keys(p).length)return;
  const old={};for(const k of Object.keys(p))old[k]=cur[k];
  S.bsteps[bid]=Object.assign({},doc,{s:Object.assign({},doc.s||{},{[code]:merged})});render();
  return chain("bs/"+bid,()=>had?db.doc("brand_steps/"+bid).update({s:{[code]:merged},updated_at:Date.now()}):db.doc("brand_steps/"+bid).set({brand:bid,s:{[code]:merged},updated_at:Date.now()}))
   .then(()=>{toast("Saved");addLog("bsteps",bid,p,old,bname(bid)+" "+code)}).catch(e=>{if(!refused(e))toast("Not saved. Try again.");S.bsteps[bid]=doc;render()})}

