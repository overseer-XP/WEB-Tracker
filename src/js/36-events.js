/* ---------- events ---------- */
document.addEventListener("click",e=>{
  if(pop&&!e.target.closest("#pop")&&!e.target.closest("[data-act=bpdot]"))closePop();
  const a=e.target.closest("[data-act]");if(!a)return;const act=a.dataset.act;
  if(a.tagName==="SELECT"||a.tagName==="INPUT")return;
  if(act==="nav"){if(e.target.closest("a,select,button"))return;go(a.dataset.to);return}
  if(act==="open"){if(e.target.closest("select")||(e.target.closest("a")&&e.target.closest("a")!==a&&e.target.closest("a").getAttribute("href")!=="#"))return;e.preventDefault();openDrawer(a.dataset.kind,a.dataset.id,a.dataset.code);return}
  // A brand in the left menu: open it, or on its own page open and close its sections.
  if(act==="blink"){const id=a.dataset.id;if(route.v==="brand"&&route.id===id){e.preventDefault();railBrand=railBrand===id?"":id;renderRail();const n=$(`#rail [data-act=blink][data-id="${CSS.escape(id)}"]`);if(n)n.focus()}else railBrand=id;return}
  e.preventDefault();
  if(act==="menu"){if(matchMedia("(max-width:900px)").matches)$("#rail").classList.toggle("open");else{railOff=!railOff;ls.set("vt-railoff",railOff?"1":"0");renderTop()}}
  else if(act==="simple"){simple=a.dataset.v==="1";ls.set("vt-simple",simple?"1":"0");render()}
  else if(act==="theme"){theme=a.dataset.v==="dark"?"dark":"light";ls.set("vt-theme",theme);applyTheme();renderTop()}
  else if(act==="tab"){go(brandHash(route.id,a.dataset.tab))}
  else if(act==="phase-go"){phaseSel={bid:a.dataset.id,p:a.dataset.p};if(route.v==="brand"&&brandTab==="sow")render();else go(brandHash(a.dataset.id,"sow"))}
  else if(act==="rgrp"){const k=a.dataset.k;if(railShut.has(k))railShut.delete(k);else railShut.add(k);ls.set("vt-railshut",JSON.stringify([...railShut]));renderRail();const n=$(`#rail [data-act=rgrp][data-k="${CSS.escape(k)}"]`);if(n)n.focus()}
  else if(act==="bp-link"){const id=a.dataset.id;const d=S.bps[id];if(!d)return;
    formBox("Best Practices link · "+bname(id),`<div class="f"><label for="n-bl">Paste the link to this brand's Best Practices document</label><input id="n-bl" name="link" type="url" placeholder="https://..." value="${esc(d.doc_link||"")}"></div><p class="faint" style="margin:0 0 10px;font-size:13px">Links only. Leave it empty to remove the link.</p>`,"Save link",v=>{
      if(v.link&&!/^https?:\/\/\S+$/i.test(v.link)){toast("Paste a full link that starts with https://");return false}save("bps",id,{doc_link:v.link},"Best Practices link")})}
  else if(act==="signout"){if(window.__signOut)window.__signOut()}
  else if(act==="tlteam"){const k=a.dataset.k;if(tlOpen.has(k))tlOpen.delete(k);else tlOpen.add(k);render()}
  else if(act==="tlall"){const k=a.dataset.k;const ks=DEPTS().map(d=>k+d);if(ks.some(x=>tlOpen.has(x)))ks.forEach(x=>tlOpen.delete(x));else ks.forEach(x=>tlOpen.add(x));render()}
  else if(act==="tlwin"){tlWin=["2w","month"].includes(a.dataset.v)?a.dataset.v:"all";render()}
  else if(act==="skip"){const h=$("#main h1")||$("#main");h.tabIndex=-1;h.focus()}
  else if(act==="goto-item"){const{kind,id,code}=a.dataset;
    if(kind==="task"){const t=S.tasks[id];if(!t)return;brandTab="tasks";if(t.status==="Complete")kbFilter.done=true;focusItem={sel:`.kc[data-id="${CSS.escape(id)}"]`};go(campHash(t.brand,campsOf(t.brand).length?campOf(t):""))}
    else if(kind==="access"){accBrand=(S.access[id]||{}).brand||accBrand;go("access");setTimeout(()=>openDrawer("access",id),60);return}
    else{phaseSel={bid:id,p:(S.steps[code]||{}).phase||""};focusItem={sel:`select[data-code="${CSS.escape(code)}"]`,up:".step"};go(brandHash(id,"steps"))}}
  else if(act==="sort"){const k=a.dataset.k;ovSort=ovSort.k===k?{k,dir:-ovSort.dir}:{k,dir:1};render()}
  else if(act==="att-go"){go(brandHash(a.dataset.id,a.dataset.tab||"tasks"))}
  else if(act==="mvert"){mineVert=a.dataset.v;render()}
  else if(act==="men-go"&&a.dataset.task&&S.tasks[a.dataset.task]){const tk=S.tasks[a.dataset.task];brandTab="tasks";go(campHash(tk.brand,campsOf(tk.brand).length?campOf(tk):""));setTimeout(()=>openDrawer("task",a.dataset.task),60)}
  else if(act==="men-go"&&a.dataset.acc){accBrand=(S.access[a.dataset.acc]||{}).brand||accBrand;go("access");setTimeout(()=>openDrawer("access",a.dataset.acc),60)}
  else if(act==="men-go"){go(brandHash(a.dataset.id,"updates"))}
  else if(act==="guide-off"){ls.set("vt-guide-"+a.dataset.k,"1");render()}
  else if(act==="client-dl"){const m=founderModel(a.dataset.id);offer((m.name||"brand").replace(/[^A-Za-z0-9]+/g,"_")+"_founder_view_"+isoToday()+".html",founderDoc(m))}
  else if(act==="del-comment"){const id=a.dataset.id;confirmBox("Delete this comment?","Delete",()=>remove("comments",id,"Comment"))}
  else if(act==="tpl-del"){const i=+a.dataset.i;confirmBox("Delete this template?","Delete",()=>{const list=TEMPLATES().filter((_,j)=>j!==i);saveTemplates(list)})}
  else if(act==="search-go"){const r=searchResults(searchQ)[+a.dataset.i];searchQ="";$("#q").value="";renderSearch();if(!r)return;
    if(r.go)go(r.go);else if(r.person){if(canEdit){orgTab="people";orgF="team";orgSel=r.person;go("org")}else go("mine")}else if(r.task){const t=S.tasks[r.task];if(t){brandTab="tasks";if(t.status==="Complete")kbFilter.done=true;focusItem={sel:`.kc[data-id="${CSS.escape(r.task)}"]`};go(campHash(t.brand,campsOf(t.brand).length?campOf(t):""))}else{setTab="nobrand";go("settings")}}
    else if(r.step){setTab="steps";go("settings")}}
  else if(act==="bpdot"){if(pop&&pop.btn===a.getAttribute("aria-label")){closePop();return}openPop(a)}
  else if(act==="bpset"){if(!pop)return;const{id,sec}=pop;const d=S.bps[id];closePop();if(!d)return;const v=a.dataset.v;if(((d.sections||{})[sec]||"Not Started")!==v)save("bps",id,{sections:Object.assign({},d.sections||{},{[sec]:v})},"BPs "+bname(id)+" "+sec);
    setTimeout(()=>{const b=document.querySelector(`[data-act=bpdot][data-id="${CSS.escape(id)}"][data-sec="${CSS.escape(sec)}"]`);if(b)b.focus()},30)}
  else if(act==="bpf"){bpFilter=a.dataset.v;render()}
  else if(act==="tsort"){const id=a.dataset.t,k=a.dataset.k;const s=tsort[id];tsort[id]=!s||s.k!==k?{k,dir:1}:s.dir>0?{k,dir:-1}:null;if(pager[id])pager[id].page=1;render()}
   else if(act==="bpq"){const id=a.dataset.id,sec=a.dataset.sec;const d=S.bps[id];if(!d)return;const v=(d.sections||{})[sec]||"Not Started";
     const nx=v==="Complete"?"Blocked":v==="Blocked"||v==="N/A"?"Not Started":"Complete";const secs=Object.assign({},d.sections||{},{[sec]:nx});
     if(nx==="Blocked"){formBox("Why is "+sec+" blocked? · "+bname(id),`<div class="f"><label for="n-bpn">Note</label><textarea id="n-bpn" name="note" rows="3" placeholder="For example: waiting on Amazon access">${esc(d.blocker||"")}</textarea></div>`,"Mark blocked",f=>{save("bps",id,{sections:secs,blocker:f.note},"BPs "+bname(id)+" "+sec)});return}
     const still=Object.values(secs).includes("Blocked");save("bps",id,Object.assign({sections:secs},still?{}:{blocker:""}),"BPs "+bname(id)+" "+sec)}
  else if(act==="accq"){accQueue=a.dataset.v;render()}
  else if(act==="fm-open"){e.stopPropagation();openFounderMessage(a.dataset.id)}
  else if(act==="fm-copy")copyText($("#fm-text").value);
  else if(act==="fm-asked"){const bid=a.dataset.id;copyText($("#fm-text").value);for(const r of withId(S.access).filter(x=>x.brand===bid&&x.status==="Needed")){setAccStatus(r._id,"Asked founder")}$("#modal").hidden=true}
  else if(act==="seat-add"){const id=drawerCtx&&drawerCtx.id;const a=S.access[id];const p=$("#seat-p").value;if(!a||!p){toast("Pick a person.");return}save("access",id,{seats:(a.seats||[]).concat([{p,s:"Asked"}])},bname(a.brand)+" "+a.platform+" logins");accSystemNote(a,id,p+" asked for a login")}
  else if(act==="seat-del"){const id=drawerCtx&&drawerCtx.id;const a=S.access[id];const i=+a.dataset.i;const x=(a.seats||[])[i];save("access",id,{seats:(a.seats||[]).filter((_,j)=>j!==i)},bname(a.brand)+" "+a.platform+" logins");if(x)accSystemNote(a,id,x.p+" removed from logins")}
  else if(act==="chase"){const id=drawerCtx&&drawerCtx.id;const a=S.access[id];if(!a)return;const c={date:isoToday(),by:me||"",how:$("#ch-how").value,note:$("#ch-note").value.trim()};
    const p={chases:(a.chases||[]).concat([c])};if(a.status==="Needed")p.status="Asked founder";if(!a.requested_date)p.requested_date=isoToday();save("access",id,p,bname(a.brand)+" "+a.platform+" chase");accSystemNote(a,id,`Chased the founder by ${c.how}${c.note?": "+c.note:""}`)}
  else if(act==="acc-post"){const id=drawerCtx&&drawerCtx.id;const a=S.access[id];const t=$("#acc-c");const text=t.value.trim();if(!a||!text)return;if(!me){toast("Pick your name first (Which one is you?).");return}
    create("comments",null,{brand:a.brand,access:id,text,by:me,at:Date.now(),mentions:mentionsIn(text)},"Comment on "+bname(a.brand)+" "+a.platform).then(r=>{if(r)t.value=""})}
  else if(act==="mcols"){mineCols=a.dataset.v;ls.set("vt-mcols",mineCols);render()}
  else if(act==="minetab"){mineTab=a.dataset.v;ls.set("vt-minetab",mineTab);render()}
  else if(act==="accb"){accBrand=a.dataset.id;ls.set("vt-accbrand",accBrand);render()}
  else if(act==="sowview"){sowView=a.dataset.v;ls.set("vt-sowview",sowView);render()}
  else if(act==="accgap"){flt.accGap=a.dataset.v==="1";render()}
  else if(act==="board")openDrawer("board",a.dataset.b,a.dataset.c);
  else if(act==="nav-steps"){closeDrawer();go(brandHash(a.dataset.id,"steps"))}
  else if(act==="acc-new"){const bid=a.dataset.b,pl=a.dataset.p;create("access",null,{brand:bid,platform:pl,access_level:"TBC",needed_for:"",owner:"",brand_contact:(S.brands[bid]||{}).founder||"",requested_date:"",deadline:"",status:"Needed",blocker:"",notes:""},bname(bid)+" "+pl).then(id=>{if(id)openDrawer("access",id)})}
  else if(act==="camp"){go(campHash(route.id,a.dataset.id));setTimeout(toSection,30)}
  else if(act==="lead-jump"){const el=document.getElementById(a.dataset.to);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}
  else if(act==="escalate"){const kind=a.dataset.kind,ref=a.dataset.id,code=a.dataset.code||"";if(!me){toast("Pick your name first (Which one is you?).");return}
    const direct=canEscalate(me);const leads=escLeads();if(!direct&&!leads.length){toast("No lead can escalate yet. Ask an admin to tick Can escalate in Settings, People.");return}
    formBox((direct?"Needs leadership: ":"Ask a lead to escalate: ")+escTitle(kind,ref,code),`<div class="f"><label for="n-ask">What do you need from leadership?</label><textarea id="n-ask" name="ask" required placeholder="For example: approve extra budget, call the founder, agree a new date"></textarea></div>
      ${ESC_PRI().length?`<div class="f"><label for="n-pri">Priority</label><select id="n-pri" name="priority" required>${opts(ESC_PRI(),"",true)}</select></div>`:""}<div class="f"><label for="n-due">Needed by</label><input id="n-due" name="due" type="date" required></div>
      ${direct?"":`<div class="f"><label for="n-lead">Which lead should send it?</label><select id="n-lead" name="lead" required>${opts(leads,"",true)}</select></div>`}`,direct?"Send to leadership":"Send to the lead",
      v=>{if(!v.ask){toast("Say what you need.");return false}if(ESC_PRI().length&&!v.priority){toast("Pick a priority.");return false}if(!v.due){toast("Say when it is needed by.");return false}if(!direct&&!v.lead){toast("Pick a lead.");return false}
        const rec={brand:escBrand(kind,ref),kind,ref,code,title:escTitle(kind,ref,code),ask:v.ask,priority:v.priority||"",due:v.due,by:me,at:Date.now(),state:direct?"Open":"Proposed"};if(!direct)rec.lead=v.lead;else rec.raised_by=me;
        create("esc",null,rec,(direct?"Escalated ":"Asked to escalate ")+escTitle(kind,ref,code)).then(()=>{if(!direct&&rec.brand)create("comments",null,{brand:rec.brand,text:`@${v.lead} please review an escalation request: ${rec.title}`,by:me||"",at:Date.now(),mentions:[v.lead]},"Escalation request");if(drawerCtx)openDrawer(drawerCtx.kind,drawerCtx.id,drawerCtx.extra,true)})})}
  else if(act==="esc-raise"){const e=S.esc[a.dataset.id];if(!e)return;save("esc",a.dataset.id,{state:"Open",raised_by:me||"",raised_at:Date.now()},"Escalated "+e.title)}
  else if(act==="esc-decline"){const id=a.dataset.id;const e=S.esc[id];if(!e)return;formBox("Decline: "+e.title,`<div class="f"><label for="n-why">Why (goes to ${esc(e.by||"the person")})</label><textarea id="n-why" name="why" required></textarea></div>`,"Decline",v=>{if(!v.why)return false;save("esc",id,{state:"Declined",decision:v.why,decided_by:me||"",decided_at:Date.now()},"Declined "+e.title);if(e.brand)create("comments",null,{brand:e.brand,text:`@${e.by} ${me||"Your lead"} did not escalate "${e.title}": ${v.why}`,by:me||"",at:Date.now(),mentions:[e.by]},"Escalation declined")})}
  else if(act==="esc-decide"){const id=a.dataset.id,st=a.dataset.v;const e=S.esc[id];if(!e)return;if(!me){toast("Pick your name first (Which one is you?).");return}
    formBox((st==="Agreed"?"Agree: ":"Send back: ")+escTitle(e.kind,e.ref,e.code),`<p class="muted" style="margin:0">${esc(e.ask)}</p><div class="f"><label for="n-note">${st==="Agreed"?"Note (optional)":"Why, and what is needed instead"}</label><textarea id="n-note" name="note" ${st==="Agreed"?"":"required"}></textarea></div>`,st==="Agreed"?"Agree":"Send back",
      v=>{if(st!=="Agreed"&&!v.note){toast("Say why it is going back.");return false}decideEsc(id,st,v.note)})}
  else if(act==="esc-open"){const e=S.esc[a.dataset.id];if(!e)return;if(e.kind==="task")openDrawer("task",e.ref);else if(e.kind==="step")openDrawer("step",e.ref,e.code);else if(e.kind==="access")openDrawer("access",e.ref);else if(e.kind==="sow")openDrawer("sow",e.ref);else go("brand-"+e.brand)}
  else if(act==="gate-ok"){const bid=a.dataset.id,code=a.dataset.code;const why=stepBlock(bid,code);if(why){toast(why);return}if(!me){toast("Pick your name first (Which one is you?).");return}
    saveStep(bid,code,{status:"Done"});const s=S.steps[code]||{};const owner=stepState(bid,code).owner||(S.brands[bid]||{}).lead||"";
    create("esc",null,{brand:bid,kind:"gate",ref:bid,code,title:code+" "+(s.name||""),ask:"Gate sign-off",by:me,at:Date.now(),state:"Agreed",decision:"",decided_by:me,decided_at:Date.now()},"Signed off "+code);
    create("comments",null,{brand:bid,text:`${owner?"@"+owner+" ":""}Leadership signed off ${code} ${s.name||""}`,by:me,at:Date.now(),mentions:owner?[owner]:[]},"Gate signed off")}
  else if(act==="gate-back"){const bid=a.dataset.id,code=a.dataset.code;const s=S.steps[code]||{};if(!me){toast("Pick your name first (Which one is you?).");return}
    formBox("Send back: "+code+" "+(s.name||""),`<div class="f"><label for="n-note">Why, and what is needed first</label><textarea id="n-note" name="note" required></textarea></div>`,"Send back",
      v=>{if(!v.note){toast("Say why it is going back.");return false}const owner=stepState(bid,code).owner||(S.brands[bid]||{}).lead||"";
        saveStep(bid,code,{sent_back:{by:me,at:isoToday(),note:v.note}});
        create("esc",null,{brand:bid,kind:"gate",ref:bid,code,title:code+" "+(s.name||""),ask:"Gate sign-off",by:me,at:Date.now(),state:"Sent back",decision:v.note,decided_by:me,decided_at:Date.now()},"Sent back "+code);
        create("comments",null,{brand:bid,text:`${owner?"@"+owner+" ":""}Leadership sent back ${code} ${s.name||""}: ${v.note}`,by:me,at:Date.now(),mentions:owner?[owner]:[]},"Gate sent back")})}
  else if(act==="ask-lead"){const b=S.brands[a.dataset.id];if(!b||!b.lead)return;if(!me){toast("Pick your name first (Which one is you?).");return}
    formBox("Ask "+b.lead+" about "+b.name,`<div class="f"><label for="n-q">Question</label><textarea id="n-q" name="q" required></textarea><span class="hint">Posts on the brand's Updates and reaches ${esc(b.lead)} in My tasks</span></div>`,"Send",
      v=>{if(!v.q){toast("Write the question.");return false}create("comments",null,{brand:b.id,text:"@"+b.lead+" "+v.q,by:me,at:Date.now(),mentions:[b.lead]},"Question to "+b.lead)})}
  else if(act==="go-camp"){const c=S.camps[a.dataset.id];if(!c)return;brandTab="tasks";go(campHash(c.brand,a.dataset.id))}
  else if(act==="kbf-clear"){kbFilter=Object.assign(kbFilter,{who:"",due:"",q:"",st:""});render()}
  else if(act==="kbst-clear"){kbFilter.st="";render()}
  else if(act==="sow-fold"){sowFold[a.dataset.v]=a.dataset.c;ls.set("vt-sowfold",JSON.stringify(sowFold));render()}
  else if(act==="sow-foldall"){for(const g of boardCols())sowFold[g.name]=a.dataset.v;ls.set("vt-sowfold",JSON.stringify(sowFold));render()}
  else if(act==="sow-doc"){const id=a.dataset.id;const s=S.sow[id];if(!s)return;const d0=sowDocs(id);const kinds=SOW_DOCS();const first=a.dataset.v||kinds.find(x=>!d0[x])||"";
    formBox("Add a document · "+bname(id),`<div class="f"><label for="n-dk">Document</label><select id="n-dk" name="kind">${kinds.map(x=>`<option value="${esc(x)}" ${x===first?"selected":""}>${esc(x)}${d0[x]?" (replace link)":""}</option>`).join("")}<option value="" ${first?"":"selected"}>Other</option></select></div><div class="f"><label for="n-dl">Name, for Other</label><input id="n-dl" name="label" placeholder="For example: Investor deck"></div><div class="f"><label for="n-du">Paste the link</label><input id="n-du" name="url" type="url" placeholder="https://..."></div><p class="faint" style="margin:0 0 10px;font-size:13px">Links only. Never paste contract text.</p>`,"Save link",v=>{const k=v.kind;
      if(!/^https?:\/\/\S+$/i.test(v.url||"")){toast("Paste a full link that starts with https://");return false}
      if(k)save("sow",id,{docs:Object.assign({},s.docs||{},{[k]:v.url})},k+" link "+bname(id));else{if(!v.label){toast("Give the document a name.");return false}save("sow",id,{docs_extra:(s.docs_extra||[]).concat([{label:v.label,url:v.url}])},"Document link "+bname(id))}})}
  else if(act==="ns-done"||act==="ns-reopen"||act==="ns-del"){const id=a.dataset.id,i=+a.dataset.i;const s=S.sow[id];if(!s||!canWrite)return;if(!me){toast("Pick your name at the top first.");return}const lg=nsLog(s).slice();const e=lg[i];if(!e)return;
    const after=()=>{if(drawerCtx&&drawerCtx.kind==="sow"&&drawerCtx.id===id)openDrawer("sow",id,null,true)};
    if(act==="ns-del"){confirmBox(`Remove this next step? "${e.t.slice(0,140)}${e.t.length>140?"...":""}" The change log keeps a record that it was removed.`,"Remove",()=>{lg.splice(i,1);save("sow",id,{ns_log:lg,next_step:lg.length?lg[lg.length-1].t:""},"SOW next step removed "+bname(id)+": "+e.t.slice(0,80)).then(after)});return}
    lg[i]=Object.assign({},e);delete lg[i].legacy;if(act==="ns-done")lg[i].done={by:me,at:Date.now()};else delete lg[i].done;
    save("sow",id,{ns_log:lg},(act==="ns-done"?"SOW next step done ":"SOW next step reopened ")+bname(id)).then(after)}
  else if(act==="close-go"){e.preventDefault();closeDrawer();go(a.getAttribute("href").slice(1))}
  else if(act==="ask-pre"){const bid=a.dataset.id,code=a.dataset.code,pre=S.steps[a.dataset.pre],s=S.steps[code];if(!pre||!s)return;if(!me){toast("Pick your name first (Which one is you?).");return}const o=stepOwner(bid,pre);
    const ats=o.split(",").map(x=>x.trim()).filter(Boolean);const text=`${ats.map(x=>"@"+x).join(" ")} ${sno(s)} ${s.name} for ${bname(bid)} is waiting on ${sno(pre)} ${pre.name}. Can you finish it, or say when it will be ready?`;
    formBox("Ask "+o,`<div class="f"><label for="n-ask">Message to ${esc(o)}</label><textarea id="n-ask" name="text" rows="4">${esc(text)}</textarea></div><p class="faint" style="margin:0 0 10px;font-size:13px">It reaches ${esc(o)} as a mention in VALFLO and stays on ${esc(bname(bid))}'s comments.</p>`,"Send",v=>{const tx=(v.text||"").trim();if(!tx)return false;
      create("comments",null,{brand:bid,step:code,text:tx,by:me,at:Date.now(),tz:tzNow().tz,mentions:mentionsIn(tx)},"Asked "+o+" about "+pre.name).then(()=>toast("Sent to "+o+"."))})}
  else if(act==="ns-edit"){const id=a.dataset.id,i=+a.dataset.i;const s=S.sow[id];if(!s||!canWrite)return;if(!me){toast("Pick your name at the top first.");return}const lg=nsLog(s).slice();const e=lg[i];if(!e)return;
    formBox("Edit next step · "+bname(id),`<div class="f"><label for="n-nse">${esc(nsStamp(e))}</label><textarea id="n-nse" name="text" rows="5">${esc(e.t)}</textarea></div><p class="faint" style="margin:0 0 10px;font-size:13px">The entry keeps its original date and author and is marked edited by ${esc(me)}.</p>`,"Save",v=>{const tx=(v.text||"").trim();if(!tx){toast("The entry can't be empty.");return false}
      lg[i]=Object.assign({},e,{t:tx,edited:{by:me,at:Date.now()}});delete lg[i].legacy;save("sow",id,{ns_log:lg},"SOW next steps edited "+bname(id)).then(()=>{if(drawerCtx&&drawerCtx.kind==="sow")openDrawer("sow",id,null,true)})})}
  else if(act==="sow-ns"){const id=a.dataset.id;if(!me){toast("Pick your name at the top first, so the update shows who wrote it.");return}const z=tzNow();
    formBox("Next steps · "+bname(id),`<div class="f"><label for="n-ns">What happens next</label><textarea id="n-ns" name="text" rows="4"></textarea></div><p class="faint" style="margin:0 0 10px;font-size:13px">Saved as: ${esc(fmtD(isoToday()))} · ${esc(z.tl)} ${esc(z.tz)} · ${esc(me)}. Earlier entries stay as they are.</p>`,"Add",v=>{if(!(v.text||"").trim()){toast("Write the next step.");return false}addNs(id,v.text.trim())})}
  else if(act==="clock"){const ex=$("#clkpop");if(ex){ex.remove();a.setAttribute("aria-expanded","false");return}const el=document.createElement("div");el.id="clkpop";el.className="pop clkpop";el.innerHTML=clockHtml();document.body.appendChild(el);a.setAttribute("aria-expanded","true");
    const r=a.getBoundingClientRect();el.style.top=(r.bottom+6)+"px";el.style.left=Math.max(8,Math.min(innerWidth-el.offsetWidth-8,r.right-el.offsetWidth))+"px"}
  else if(act==="cb-jump"){const el=document.getElementById(a.dataset.v);if(el){el.scrollIntoView({block:"center",behavior:"smooth"});const f=el.matches("input,select,textarea")?el:el.querySelector("input,select,button");if(f)setTimeout(()=>f.focus(),250)}}
  else if(act==="cb-cover"){const id=drawerCtx&&drawerCtx.id;const tk=S.tasks[id];if(!tk||!canChangeTask(tk))return;save("tasks",id,{cover:a.dataset.v||""},tk.title)}
  else if(act==="cb-copy"){const id=a.dataset.id;const tk=S.tasks[id];if(!tk)return;formBox("Copy card",`<div class="f"><label for="n-ct">Title</label><input id="n-ct" name="title" value="${esc(tk.title)}"></div><p class="faint" style="margin:0 0 10px;font-size:13px">Copies the members, labels, dates, description, checklist (unticked) and links. Comments are not copied.</p>`,"Create card",v=>{if(!v.title){toast("Give the card a name.");return false}
    const c=Object.assign({},tk);delete c._id;delete c.updated_at;delete c.updated_by;delete c.approved_at;delete c.approved_by;Object.assign(c,{title:v.title,status:L("task_status")[0]||"Not Started",blocker:null,checklist:(tk.checklist||[]).map(x=>Object.assign({},x,{done:false})),source:"Copied from "+tk.title});create("tasks",null,c,v.title)})}
  else if(act==="kc-qe"){const id=a.dataset.id;const tk=S.tasks[id];if(!tk)return;formBox("Quick edit",`<div class="f"><label for="q-t">Title</label><input id="q-t" name="title" value="${esc(tk.title)}"></div><div class="f"><label for="q-o">Owner</label><select id="q-o" name="owner">${opts(activePeople(),tk.owner)}</select></div><div class="f"><label for="q-d">Due</label><input id="q-d" name="deadline" type="date" value="${esc(tk.deadline||"")}"></div>`,"Save",v=>{if(!v.title){toast("Give the card a name.");return false}const p={};for(const k of ["title","owner","deadline"])if((v[k]||"")!==(tk[k]||""))p[k]=v[k];if(Object.keys(p).length)save("tasks",id,p,tk.title)})}
  else if(act==="mine-add"){const st=a.dataset.st,b0=a.dataset.b;const bs=brandList();formBox("New card",`<div class="f"><label for="n-title">Title</label><input id="n-title" name="title" required></div><div class="f"><label for="n-br">Brand</label><select id="n-br" name="brand">${bs.map(b=>`<option value="${esc(b.id)}" ${b.id===b0?"selected":""}>${esc(b.name)}</option>`).join("")}</select></div><div class="f"><label for="n-dep">Team</label><select id="n-dep" name="department">${opts(DEPTS(),DEPTS()[0],false)}</select></div><div class="f"><label for="n-dl">Due</label><input id="n-dl" name="deadline" type="date"></div>`,"Add card",
    v=>{if(!v.title){toast("Give the card a name.");return false}if(!me){toast("Pick your name first (Which one is you?).");return false}const status=st&&L("task_status").includes(st)&&st!=="Blocked"?st:(L("task_status")[0]||"Not Started");
      create("tasks",null,{brand:v.brand,department:v.department,title:v.title,owner:me,support:[],status,priority:"Medium",start:"",deadline:v.deadline,notes:"",brief_link:"",creative_link:"",blocker:null,campaign:"",list:"",checklist:[],source:"Added in tracker"},v.title)})}
  else if(act==="pgset"){if(!canEdit)return;const cur=S.config.pages||{};const g=a.dataset.g;const next=Object.assign({},cur,{[g]:Object.assign({},cur[g]||{},{[a.dataset.k]:a.dataset.v})});
    const label="Pages: "+((g==="menu"?PAGE_MENU:PAGE_BRAND).find(x=>x[0]===a.dataset.k)||[0,a.dataset.k])[1]+" "+a.dataset.v;if(S.config.pages)save("config","pages",{[g]:next[g]},label);else create("config","pages",next,label)}
  else if(act==="sowtop"){ls.set("vt-sowtop",a.dataset.v);const m=$("#main");if(!a.dataset.v&&m&&$(".sgfold.pin"))m.scrollTop=0;render()}
  else if(act==="sgpg"){window.__sgp=+a.dataset.v;render()}
  else if(act==="founder-geo"){const id=a.dataset.id;const b=S.brands[id];if(!b)return;
    formBox("Founder location · "+b.name,`<div class="f"><label for="n-fc">Country</label><input id="n-fc" name="country" value="${esc(b.founder_country||"")}" placeholder="For example: United Kingdom"></div><div class="f"><label for="n-fz">Time zone</label><select id="n-fz" name="zone"><option value="">Pick a time zone</option>${tzList().map(z=>`<option ${z===b.founder_zone?"selected":""}>${esc(z)}</option>`).join("")}</select></div>`,"Save",v=>{save("brands",id,{founder_country:(v.country||"").trim(),founder_zone:v.zone||""},b.name+" founder location")})}
  else if(act==="nt-more"){const n=a.previousElementSibling;if(n){n.classList.toggle("open");a.textContent=n.classList.contains("open")?"Less":"More"}}
  else if(act==="mst"){window.__mst=window.__mst===a.dataset.v?"":a.dataset.v;render()}
  else if(act==="stg"){window.__stg=a.dataset.v;for(const k in pager)pager[k].page=1;render()}
  else if(act==="pgsize"){ls.set("vt-rows"+(a.dataset.k==="sowl"?"-sowl":""),a.dataset.v);for(const k in pager)pager[k].page=1;render()}
  else if(act==="pgp"){const k=a.dataset.k;(pager[k]||(pager[k]={})).page=+a.dataset.v;render();const m=$("#main");if(m)m.scrollTop=0}
  else if(act==="bpgroup"){const g=a.dataset.g;bpOpenG=g==="*"||g===""?g:(bpOpenG===g?"":g);render()}
  else if(act==="tmore"){const tb=a.closest(".topbar");const o=!tb.classList.contains("open");tb.classList.toggle("open",o);a.setAttribute("aria-expanded",String(o))}
  else if(act==="orgtab"){orgTab=a.dataset.tab==="chart"?"chart":"people";render()}
  else if(act==="orgf"){orgF=a.dataset.v;orgSel="";render()}
  else if(act==="org-pick"){orgSel=orgSel===a.dataset.name?"":a.dataset.name;render()}
  else if(act==="org-role"){setRole(a.dataset.name,a.dataset.v)}
  else if(act==="org-edit"){const n=a.dataset.org;const p=people().find(x=>x.name===n);if(!p)return;const ed=canEdit&&canWrite;const dis=ed?"":"disabled";const yn=(k,l)=>`<div class="f"><label for="o-${k}">${l}</label><select id="o-${k}" name="${k}" ${dis}><option value="No">No</option><option value="Yes" ${p[k]?"selected":""}>Yes</option></select></div>`;
    const others=orgPeople().map(x=>x.name).filter(x=>x!==n&&!isBelow(n,x,people()));
    formBox(p.full_name||p.name,`<div class="f"><label for="o-full_name">Full name</label><input id="o-full_name" name="full_name" value="${esc(p.full_name||"")}" ${dis}></div><div class="f"><label for="o-title">Title</label><input id="o-title" name="title" value="${esc(p.title||"")}" ${dis}></div>
      <div class="f"><label for="o-team">Team</label><select id="o-team" name="team" ${dis}>${opts(L("org_team"),p.team||"")}</select></div><div class="f"><label for="o-rep">Reports to</label><select id="o-rep" name="reports_to" ${dis}>${opts(others,p.reports_to||"")}</select></div>
      <div class="f"><label for="o-location">Location</label><input id="o-location" name="location" value="${esc(p.location||"")}" ${dis}></div>${yn("leadership","Leadership page")}${yn("escalate","Can escalate")}${yn("log","Change log")}`,ed?"Save":"Close",
      v=>{if(!ed)return;orgMove(n,{full_name:v.full_name,title:v.title,team:v.team,reports_to:v.reports_to,location:v.location,leadership:v.leadership==="Yes",escalate:v.escalate==="Yes",log:v.log==="Yes"},n+": details")})}
  else if(act==="ai-apply"){if(accImport)applyAccessImport()}
  else if(act==="bp-na"){const id=a.dataset.id,sec=a.dataset.sec;const d=S.bps[id];if(!d)return;confirmBox(`Leave ${sec} out of Best Practices for ${bname(id)}? It will show as N/A until someone changes it.`,"Leave out",()=>save("bps",id,{sections:Object.assign({},d.sections,{[sec]:"N/A"})},bname(id)+" BP "+sec))}
  else if(act==="whomore"){const tb=a.closest(".tw");tb.classList.add("all");a.remove()}
  else if(act==="campview"){campView=a.dataset.v;render()}
  else if(act==="campslice"){kbFilter.st=a.dataset.v;campView="board";render()}
  else if(act==="campteam"){tlOpen.add(a.dataset.k);campView="timeline";render()}
  else if(act==="kc-done"){setTaskStatus(a.dataset.id,DONE)}
  else if(act==="approve"){approveTask(a.dataset.id)}
  else if(act==="archive"){const id=a.dataset.id;const t=S.tasks[id];if(!t)return;closeDrawer();save("tasks",id,{archived:true},t.title).then(()=>{if(S.tasks[id]&&S.tasks[id].archived){S.tarch[id]=S.tasks[id];delete S.tasks[id];render()}});taskNote(t,id,"Archived")}
  else if(act==="unarchive"){const id=a.dataset.id;const t=S.tarch[id];if(!t)return;S.tasks[id]=t;delete S.tarch[id];save("tasks",id,{archived:false},t.title)}
  else if(act==="lbl"){const t=S.tasks[a.dataset.id];if(!t)return;const v=a.dataset.v;const cur=t.labels||[];save("tasks",a.dataset.id,{labels:cur.includes(v)?cur.filter(x=>x!==v):cur.concat([v])},t.title)}
  else if(act==="lbl-new"){const id=a.dataset.id;formBox("New label",`<div class="f"><label for="n-lb">Label name</label><input id="n-lb" name="name" required maxlength="30"></div>`,"Add",v=>{const n=(v.name||"").trim();if(!n)return;const t=S.tasks[id];const all=L("task_label");
      if(!all.includes(n))save("config","lists",{task_label:all.concat([n])},"Card labels");if(t&&!(t.labels||[]).includes(n))save("tasks",id,{labels:(t.labels||[]).concat([n])},t.title)})}
  else if(act==="kb-add"){const bid=a.dataset.id,camp=a.dataset.camp||"",lid=a.dataset.l,dep0=a.dataset.dep||"";formBox("New card",`<div class="f"><label for="n-title">Task</label><input id="n-title" name="title" required></div><div class="f"><label for="n-dep">Team</label><select id="n-dep" name="department">${opts(DEPTS(),dep0||DEPTS()[0],false)}</select></div><div class="f"><label for="n-owner">Owner</label><select id="n-owner" name="owner">${opts(activePeople(),me)}</select></div><div class="f"><label for="n-dl">Due</label><input id="n-dl" name="deadline" type="date"></div>`,"Add card",
    v=>{if(!v.title){toast("Give the card a name.");return false}create("tasks",null,{brand:bid,department:v.department,title:v.title,owner:v.owner,support:[],status:L("task_status")[0]||"Not Started",priority:"Medium",start:"",deadline:v.deadline,notes:"",brief_link:"",creative_link:"",blocker:null,campaign:camp,list:lid,checklist:[],source:"Added in tracker"},v.title)})}
  else if(act==="kl-add"){const bid=a.dataset.id,cid=a.dataset.camp||"";formBox("New list",`<div class="f"><label for="n-ln">List name</label><input id="n-ln" name="name" required placeholder="For example: Shoot day, Client review, Influencers"></div><div class="f"><label for="n-lt">Linked team</label><select id="n-lt" name="team"><option value="">No team</option>${opts(DEPTS(),"",false)}</select><span class="hint">Cards moved into a list linked to a team move to that team</span></div>`,"Add list",
    v=>{if(!v.name){toast("Give the list a name.");return false}const ts=withId(S.tasks).filter(t=>t.brand===bid&&t.title&&campOf(t)===(cid||NOCAMP));const ls0=boardLists(bid,cid,ts);if(v.team&&ls0.some(l=>l.team===v.team)){toast(v.team+" already has a list.");return false}
      saveLists(bid,cid,ls0.concat([v.team?{id:"team:"+v.team,name:v.name,team:v.team}:{id:"l"+Date.now().toString(36),name:v.name}]),"Lists")})}
  else if(act==="kl-rename"){const bid=a.dataset.id,cid=a.dataset.camp||"",lid=a.dataset.l;const ts=withId(S.tasks).filter(t=>t.brand===bid&&t.title&&campOf(t)===(cid||NOCAMP));const ls0=boardLists(bid,cid,ts);const l=ls0.find(x=>x.id===lid);if(!l)return;
    formBox("Rename list",`<div class="f"><label for="n-ln">List name</label><input id="n-ln" name="name" required value="${esc(l.name)}"></div>${l.team?`<p class="hint" style="margin:0">Linked to the ${esc(l.team)} team.</p>`:""}`,"Save",
      v=>{if(!v.name){toast("Give the list a name.");return false}l.name=v.name;saveLists(bid,cid,ls0,"Lists")})}
  else if(act==="kl-del"){const bid=a.dataset.id,cid=a.dataset.camp||"",lid=a.dataset.l;const ts=withId(S.tasks).filter(t=>t.brand===bid&&t.title&&campOf(t)===(cid||NOCAMP));const ls0=boardLists(bid,cid,ts);
    confirmBox("Delete this empty list?","Delete",()=>saveLists(bid,cid,ls0.filter(x=>x.id!==lid),"Lists"))}
  else if(act==="ck-add"){const id=drawerCtx&&drawerCtx.id;const tk=S.tasks[id];const text=($("#ck-new")||{}).value;if(!tk||!text||!text.trim()){toast("Write the checklist item first.");return}
    save("tasks",id,{checklist:(tk.checklist||[]).concat([{text:text.trim(),who:$("#ck-who").value,due:$("#ck-due").value,done:false}])},tk.title+" checklist")}
  else if(act==="ck-del"){const id=drawerCtx&&drawerCtx.id;const tk=S.tasks[id];if(!tk)return;save("tasks",id,{checklist:(tk.checklist||[]).filter((x,i)=>i!==+a.dataset.i)},tk.title+" checklist")}
  else if(act==="task-post"){const id=drawerCtx&&drawerCtx.id;const tk=S.tasks[id];const t=$("#task-c");const text=t&&t.value.trim();if(!tk||!text)return;if(!me){toast("Pick your name first (Which one is you?).");return}
    create("comments",null,{brand:tk.brand,task:id,text,by:me,at:Date.now(),tz:tzNow().tz,mentions:mentionsIn(text)},"Comment on "+tk.title).then(r=>{if(r&&$("#task-c"))$("#task-c").value=""})}
  else if(act==="add-camp"){const bid=a.dataset.id;formBox("New campaign",`<div class="f"><label for="n-cn">Campaign name</label><input id="n-cn" name="name" required placeholder="For example: Spring launch"></div><div class="f"><label for="n-cp">What it is for</label><textarea id="n-cp" name="purpose" placeholder="One or two lines: the product, the goal, the audience"></textarea></div><div class="row" style="gap:10px"><div class="f" style="flex:1"><label for="n-cs">Start</label><input id="n-cs" name="start" type="date"></div><div class="f" style="flex:1"><label for="n-ce">Launch or end</label><input id="n-ce" name="end" type="date"></div></div><div class="f"><label for="n-co">Owner</label><select id="n-co" name="owner">${opts(activePeople(),me)}</select></div>`,"Add campaign",
    v=>{if(!v.name){toast("Give the campaign a name.");return false}create("camps",null,{brand:bid,name:v.name,purpose:v.purpose,goal:"",start:v.start,end:v.end,owner:v.owner,status:L("campaign_status")[0]||"",deps:[]},v.name).then(id=>{if(id){go(campHash(bid,id));render()}})})}
  else if(act==="settab"){setTab=a.dataset.tab;render()}
  else if(act==="close")closeDrawer();
  else if(act==="mclose")$("#modal").hidden=true;
  else if(act==="sa-sel"){saSel=a.dataset.id;render()}
  else if(act==="sa-arch-tog"){saShowArch=!saShowArch;render()}
  else if(act==="sa-add"){const ph=a.dataset.ph;saEdit(d=>{const p=d.phases.find(x=>x.code===ph);const id="S"+Date.now().toString(36);d.steps[id]={name:"New step",phase:p.code,phase_name:p.name,order:1e9,kind:"main",is_gate:false,is_optional:false,raci:{r:"",a:"",c:"",i:""},proof:"",after:[],archived:false,auto:"",founder_stage:""};saReorder(d,p.code);saSel=id})}
  else if(act==="sa-addph"){saEdit(d=>{let n=d.phases.length+1;while(d.phases.some(p=>p.code==="P"+n))n++;const code="P"+n;d.phases.push({code,name:"New phase"});const id="S"+Date.now().toString(36);d.steps[id]={name:"New step",phase:code,phase_name:"New phase",order:1e9,kind:"main",is_gate:false,is_optional:false,raci:{r:"",a:"",c:"",i:""},proof:"",after:[],archived:false,auto:"",founder_stage:""};saReorder(d,code);saSel=id})}
  else if(act==="sa-type"){const v=a.dataset.v;saEdit(d=>{const x=d.steps[saSel];if(!x)return;x.kind=v==="Interim"?"interim":"main";x.is_gate=v==="Gate";x.is_optional=v==="Optional"})}
  else if(act==="sa-move"){const dv=+a.dataset.v;saEdit(d=>{const x=d.steps[saSel];if(!x)return;const ids=saPhaseSteps(d,x.phase).map(([k])=>k);const i=ids.indexOf(saSel),j=i+dv;if(i<0||j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];ids.forEach((k,n)=>d.steps[k].order=n);saReorder(d,x.phase);d.moved=[...new Set((d.moved||[]).concat([saSel]))]})}
  else if(act==="sa-arch"){saEdit(d=>{const x=d.steps[saSel];if(x){x.archived=!x.archived;saReorder(d,x.phase)}});if(!saShowArch&&saWork().steps[saSel]&&saWork().steps[saSel].archived)saShowArch=true}
  else if(act==="sa-after-rm"){const k=a.dataset.v;saEdit(d=>{const x=d.steps[saSel];if(x)x.after=(x.after||[]).filter(y=>y!==k)})}
  else if(act==="sa-discard")confirmBox("Discard every unpublished change to the SOW steps?","Discard draft",()=>{delete S.config.steps_draft;saSel="";render();chain("config/steps_draft",()=>db.doc(COLL.config+"/steps_draft").delete()).then(()=>toast("Draft discarded"))})
  else if(act==="sa-pub")saOpenPublish();
  else if(act==="sa-pubgo")saPublish();
  else if(act==="dsave")drawerSave();
  else if(act==="del"){const{kind,id}=a.dataset;confirmBox("Delete this row? This cannot be undone.","Delete",()=>{closeDrawer();remove(kind==="task"?"tasks":kind==="camp"?"camps":"access",id,kind);if(kind==="camp")go(campHash(route.id,""))})}
  else if(act==="add-task"){const bid=a.dataset.id,dep0=a.dataset.dep||"";formBox("New task",`<div class="f"><label for="n-title">Task</label><input id="n-title" name="title" required></div><div class="f"><label for="n-dep">Team</label><select id="n-dep" name="department">${opts(DEPTS(),dep0||DEPTS()[0],false)}</select></div><div class="f"><label for="n-owner">Owner</label><select id="n-owner" name="owner">${opts(activePeople(),me)}</select></div><div class="f"><label for="n-dl">Deadline</label><input id="n-dl" name="deadline" type="date"></div><div class="f"><label for="n-pr">Priority</label><select id="n-pr" name="priority">${opts(L("priority"),"Medium")}</select></div>${campsOf(bid).length?`<div class="f"><label for="n-cmp">Campaign</label><select id="n-cmp" name="campaign"><option value="">Not in a campaign</option>${campsOf(bid).map(c=>`<option value="${esc(c._id)}" ${c._id===a.dataset.camp?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>`:""}`,"Add task",
    v=>{if(!v.title){toast("Give the task a name.");return false}create("tasks",null,{brand:bid,department:v.department,title:v.title,owner:v.owner,support:[],status:"Not Started",priority:v.priority,start:"",deadline:v.deadline,notes:"",brief_link:"",creative_link:"",blocker:null,campaign:v.campaign||"",source:"Added in tracker"},v.title)})}
  else if(act==="add-access"){const bid=a.dataset.id;formBox("New platform access row",`<div class="f"><label for="n-b">Brand</label><select id="n-b" name="brand">${brandList().map(b=>`<option value="${esc(b.id)}" ${b.id===bid?"selected":""}>${esc(b.name)}</option>`).join("")}</select></div><div class="f"><label for="n-p">Platform</label><select id="n-p" name="platform">${opts(L("platform"),"")}</select></div><div class="f"><label for="n-o">Valerie owner</label><select id="n-o" name="owner">${opts(activePeople(),"")}</select></div>`,"Add row",
    v=>{if(!v.platform){toast("Pick a platform.");return false}create("access",null,{brand:v.brand,platform:v.platform,access_level:"TBC",needed_for:"",owner:v.owner,brand_contact:(S.brands[v.brand]||{}).founder||"",requested_date:"",deadline:"",status:"Needed",blocker:"",notes:""},bname(v.brand)+" "+v.platform)})}
  else if(act==="add-sow"){const bid=a.dataset.id;create("sow",bid,{brand:bid,owner:"",support:[],stage:"Not Started",start_date:"",draft_due:"",target_sign:"",blocker:"",next_step:"",sow_link:"",gf_link:"",gf_updated:false,gf_status:"",batch:""},"SOW "+bname(bid))}
  else if(act==="add-bp"){const bid=a.dataset.id;create("bps",bid,{brand:bid,owner:"",due_date:"",sections:{},blocker:"",doc_link:"",notes:""},"BPs "+bname(bid))}
  else if(act==="add-brand"){formBox("Add brand",`<div class="f"><label for="n-name">Brand name</label><input id="n-name" name="name" required></div><div class="f"><label for="n-st">Stage</label><select id="n-st" name="stage">${opts(L("stage"),"Qualification",false)}</select></div>`,"Add brand",
    v=>{if(!v.name){toast("Type the brand name.");return false}let id=v.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"brand";while(S.brands[id])id+="-2";
      create("brands",id,{name:v.name,founder:"",website:"",stage:v.stage,lead:"",next_step:"",sprint_label:"",order:brandList().length+1,paused:false,restricted:false},v.name);if(!S.bps[id])create("bps",id,{brand:id,owner:"",due_date:"",sections:{},blocker:"",doc_link:"",notes:""},"BPs "+v.name);
      db.doc("brand_steps/"+id).set({brand:id,s:{}}).catch(()=>{});if(v.stage!=="Internal")db.doc("sow/"+id).set({brand:id,owner:"",support:[],stage:"Not Started",start_date:"",draft_due:"",target_sign:"",blocker:"",next_step:"",sow_link:"",gf_link:"",gf_updated:false,gf_status:"",batch:""}).catch(()=>{});
      go("brand-"+id)})}
  else if(act==="mem-del"){const id=drawerCtx&&drawerCtx.id;const tk=S.tasks[id];if(!tk)return;const sup=(tk.support||[]).slice();const[p]=sup.splice(+a.dataset.i,1);if(!p)return;save("tasks",id,{support:sup},tk.title+" members");taskNote(tk,id,"Removed "+p)}
  else if(act==="phase-done"){const bid=a.dataset.id,pc=a.dataset.phase;const p=phases().find(x=>x.code===pc);const first=p.steps[0];
    const earlier=stepsSorted().filter(x=>x.order<first.order&&!x.is_optional&&!["Done","N/A"].includes(stepState(bid,x.code).status));
    if(earlier.length){toast(`Finish the ${earlier.length} open step${earlier.length>1?"s":""} in earlier phases first.`);return}
    confirmBox(`Mark every step in ${pc} done for ${bname(bid)}?`,"Mark done",async()=>{for(const s of p.steps){const st=stepState(bid,s.code).status;if(st!=="Done"&&st!=="N/A")await saveStep(bid,s.code,{status:"Done"})}})}
  else if(act==="add-person"){formBox("Add person",`<div class="f"><label for="n-pn">Name as people write it</label><input id="n-pn" name="name" required></div><div class="f"><label for="n-pk">Type</label><select id="n-pk" name="kind">${opts(["team","external","group"],"team",false)}</select></div>`,"Add",
    v=>{if(!v.name){toast("Type a name.");return false}if(people().some(p=>p.name.toLowerCase()===v.name.toLowerCase())){toast("That name is already in the list.");return false}savePeople(people().concat([{name:v.name,kind:v.kind,aliases:[],active:true}]),"Added "+v.name)})}
  else if(act==="save-lists"){const next=Object.assign({},S.config.lists);document.querySelectorAll("[data-list]").forEach(t=>{next[t.dataset.list]=t.value.split("\n").map(s=>s.trim()).filter(Boolean)});
    save("config","lists",next,"Lists")}
  else if(act==="export-xlsx")exportXlsx();
  else if(act==="export-json")exportJson();
});
document.addEventListener("change",e=>{
  if(e.target.id==="ai-file"&&e.target.files&&e.target.files[0]){readAccessSheet(e.target.dataset.b,e.target.files[0]);e.target.value="";return}
  if(e.target.dataset&&e.target.dataset.act==="ai-tick"&&accImport){accImport.plan[+e.target.dataset.i].on=e.target.checked;showAccessImport();return}
  if(e.target.form&&e.target.form.id==="dform"&&e.target.name)drawerDirty[e.target.name]=e.target.value;
  const t=e.target;const act=t.dataset&&t.dataset.act;
  if(t.form&&t.form.id==="dform"&&t.name&&$("#drawer").classList.contains("cardback")&&drawerCtx&&drawerCtx.kind==="task"){drawerDirty[t.name]=t.value;drawerSave(true);return}
  if(!act)return;
  if(act==="sa-f"){const f=t.dataset.f,v=t.value.trim();if(f==="name"&&!v){toast("A step needs a name.");render();return}saEdit(d=>{const x=d.steps[saSel];if(!x)return;if(f.startsWith("raci.")){x.raci=Object.assign({r:"",a:"",c:"",i:""},x.raci||{});x.raci[f.slice(5)]=v}else x[f]=v});return}
  if(act==="sa-ph"){const np=t.value;saEdit(d=>{const x=d.steps[saSel];if(!x)return;const old=x.phase;const p=d.phases.find(y=>y.code===np);x.phase=np;x.phase_name=p.name;x.order=1e9;saReorder(d,old);saReorder(d,np);d.moved=[...new Set((d.moved||[]).concat([saSel]))]});return}
  if(act==="sa-after-add"&&t.value){const k=t.value;saEdit(d=>{const x=d.steps[saSel];if(x&&!(x.after||[]).includes(k))x.after=(x.after||[]).concat([k])});return}
  if(act==="sa-phname"){const v=t.value.trim(),ph=t.dataset.ph;if(!v)return;saEdit(d=>{const p=d.phases.find(y=>y.code===ph);if(p)p.name=v;for(const x of Object.values(d.steps))if(x.phase===ph)x.phase_name=v});return}
  if(act==="kbf"){kbFilter[t.dataset.k]=t.value;render();return}
  if(act==="mem-add"&&t.value){const id=drawerCtx&&drawerCtx.id;const tk=S.tasks[id];const p=t.value;t.value="";if(!tk||(tk.support||[]).includes(p))return;save("tasks",id,{support:(tk.support||[]).concat([p])},tk.title+" members");taskNote(tk,id,"Added "+p);return}
  if(act==="kbdone"){kbFilter.done=t.checked;render();return}
  if(act==="review-day"){const v=+t.value;if(S.config.leadership)save("config","leadership",{review_day:v},"Review day");else create("config","leadership",{review_day:v},"Review day");return}
  if(act==="ck"){const id=drawerCtx&&drawerCtx.id;const tk=S.tasks[id];if(!tk)return;const cl=(tk.checklist||[]).map(x=>Object.assign({},x));const x=cl[+t.dataset.i];if(!x)return;x.done=t.checked;save("tasks",id,{checklist:cl},tk.title+" checklist");return}
  if(act==="who"||act==="iam"){selfMe=t.value;me=selfMe;ls.set("vt-me",selfMe);if(db&&uid)db.doc("data/users/"+uid+"/profile").set({person:selfMe}).catch(()=>{});render();return}
  if(act==="viewas"){if(!realEdit)return;ls.set("vt-viewas",t.value);render();return}
  if(act==="roleprev"){if(!realEdit)return;ls.set("vt-roleprev",t.value);applyRolePreview();closeDrawer();render();toast(t.value?"Showing VALFLO as a "+(t.value==="view"?"view-only":"member")+" sees it":"Back to admin");return}
  if(act==="status"){const kind=t.dataset.kind,id=t.dataset.id,v=t.value;
    if(kind==="task"){const cur=S.tasks[id];t.value=cur.status;setTaskStatus(id,v)}
    else if(kind==="step"){const code=t.dataset.code;if(v==="Done"){const why=stepBlock(id,code);if(why){t.value=stepState(id,code).status||"Not Started";
        if(isLeader(me))confirmBox(why+" As Leadership you can mark it done anyway. The override is recorded on the step.","Mark done anyway",()=>saveStep(id,code,{status:"Done",override:{by:me,at:Date.now(),why}}));else toast(why);return}}saveStep(id,code,{status:v})}
    else if(kind==="access"){const cur=S.access[id];if(v==="Blocked"&&!cur.blocker){t.value=cur.status;askBlocker(r=>{save("access",id,{status:"Blocked",blocker:r.text,owner:cur.owner||r.person},bname(cur.brand)+" "+cur.platform);accSystemNote(cur,id,"Blocked: "+r.text+" (waiting on "+r.person+")")});return}setAccStatus(id,v)}
    else if(kind==="sow"){const cur=S.sow[id]||{};if(v==="Blocked"&&!cur.blocker){t.value=cur.stage||"Not Started";askBlocker(r=>save("sow",id,{stage:"Blocked",blocker:r.text+" (waiting on "+r.person+")"},"SOW "+bname(id)));return}
      if(!S.sow[id])create("sow",id,{brand:id,stage:v},"SOW "+bname(id));else save("sow",id,{stage:v},"SOW "+bname(id))}
    return}
  if(act==="bpsec"){const id=t.dataset.id;const d=S.bps[id];save("bps",id,{sections:Object.assign({},d.sections||{},{[t.dataset.sec]:t.value})},"BPs "+bname(id));return}
  if(act==="fa"){flt[t.dataset.k]=t.value;render();return}
  if(act==="seat"){const id=drawerCtx&&drawerCtx.id;const a=S.access[id];if(!a)return;const seats=(a.seats||[]).map(x=>Object.assign({},x));const x=seats[+t.dataset.i];const old=x.s;x.s=t.value;save("access",id,{seats},bname(a.brand)+" "+a.platform+" logins");accSystemNote(a,id,`${x.p}: ${old} to ${x.s}`);return}
  if(act==="bps"){bpSort=t.value;render();return}
  if(act==="accqsel"){accQueue=t.value||"open";render();return}
  if(act==="mcolsel"){mineCols=t.value;ls.set("vt-mcols",mineCols);render();return}
  if(act==="msort"){mineSort=t.value;ls.set("vt-msort",mineSort);render();return}
  if(act==="mvertsel"){mineVert=t.value;render();return}
  if(act==="pf"){if(t.dataset.k==="vert")peopleVert=t.value;else peopleDept=t.value;render();return}
  if(act==="use-tpl"&&t.value!==""){const tp=TEMPLATES()[+t.value];const bid=t.dataset.id;t.value="";if(!tp)return;
    confirmBox(`Add ${tp.tasks.length} tasks from "${tp.name}" to ${bname(bid)}?`,"Add tasks",async()=>{for(const x of tp.tasks){const d=new Date(today());d.setDate(d.getDate()+(x.days||0));
      await create("tasks",null,{brand:bid,title:x.title,owner:"",support:[],status:"Not Started",priority:"",start:isoToday(),deadline:x.days?d.toISOString().slice(0,10):"",notes:"From template: "+tp.name,brief_link:"",creative_link:"",blocker:null,department:x.department||"",department_auto:!x.department,vertical:tp.vertical||"",source:"Template: "+tp.name},bname(bid)+" "+x.title)}toast("Added "+tp.tasks.length+" tasks")});return}
  if(act==="bp-add"&&t.value){const id=t.value;create("bps",id,{brand:id,owner:"",due_date:"",sections:{},blocker:"",doc_link:"",notes:""},"BPs "+bname(id));return}
  if(act==="setbrand"&&t.value){save("tasks",t.dataset.id,{brand:t.value},S.tasks[t.dataset.id].title);return}
  if(act==="person"){const ps=people().map(p=>Object.assign({},p));const p=ps[+t.dataset.i];const f=t.dataset.f;
    if(f==="active")p.active=t.checked;else if(f==="leadership")p.leadership=t.checked;else if(f==="log")p.log=t.checked;else if(f==="escalate")p.escalate=t.checked;else if(f==="aliases")p.aliases=splitNames(t.value);else p[f]=t.value;savePeople(ps,p.name);return}
  if(act==="stepdef"){const id=t.dataset.id,f=t.dataset.f;const v=t.type==="checkbox"?t.checked:t.value.trim();if(f==="name"&&!v){toast("A step needs a name.");return}save("steps",id,{[f]:v},"Step "+id);return}
});
function savePeople(ps,label){save("config","people",{people:ps},"People: "+label)}
function saveTemplates(list){if(S.config.templates)save("config","templates",{list},"Task templates");else create("config","templates",{list},"Task templates")}
let dragId="";
document.addEventListener("dragstart",e=>{const o=e.target.closest&&e.target.closest(".orgc[draggable=true]");if(o){orgDrag=o.dataset.org;o.classList.add("dragging");try{e.dataTransfer.setData("text/plain",orgDrag);e.dataTransfer.effectAllowed="move"}catch(x){}return}});
document.addEventListener("dragover",e=>{if(!orgDrag)return;const z=e.target.closest&&e.target.closest("[data-orgdrop]");if(!z)return;e.preventDefault();document.querySelectorAll(".orgover").forEach(x=>x!==z&&x.classList.remove("orgover"));z.classList.add("orgover")});
document.addEventListener("drop",e=>{if(!orgDrag)return;const z=e.target.closest&&e.target.closest("[data-orgdrop]");const n=orgDrag;orgDrag="";document.querySelectorAll(".orgover,.orgc.dragging").forEach(x=>x.classList.remove("orgover","dragging"));if(!z)return;e.preventDefault();
  if(z.dataset.orgdrop==="person"){const m=z.dataset.org;if(m===n)return;const mp=people().find(x=>x.name===m)||{};const me2=people().find(x=>x.name===n)||{};orgMove(n,(me2.team?{reports_to:m}:{reports_to:m,team:mp.team||""}),n+" reports to "+m)}
  else{const t=z.dataset.team||"";orgMove(n,{team:t,reports_to:""},n+" moved to "+(t||"no team"))}});
document.addEventListener("dragstart",e=>{const c=e.target.closest&&e.target.closest(".sacard[draggable=true]");if(!c)return;saDrag=c.dataset.said;c.classList.add("dragging");try{e.dataTransfer.setData("text/plain",saDrag);e.dataTransfer.effectAllowed="move"}catch(x){}});
const saDropAt=(col,y)=>{const cards=[...col.querySelectorAll(".sacard:not(.dragging):not(.arch)")];return cards.find(c=>{const r=c.getBoundingClientRect();return y<r.top+r.height/2})||null};
document.addEventListener("dragover",e=>{if(!saDrag)return;const col=e.target.closest&&e.target.closest(".sacol[data-saph]");if(!col)return;e.preventDefault();document.querySelectorAll(".sadrop,.sadropend").forEach(x=>x.classList.remove("sadrop","sadropend"));const b=saDropAt(col,e.clientY);if(b)b.classList.add("sadrop");else col.classList.add("sadropend")});
document.addEventListener("drop",e=>{if(!saDrag)return;const col=e.target.closest&&e.target.closest(".sacol[data-saph]");const id=saDrag;saDrag="";document.querySelectorAll(".sadrop,.sadropend,.sacard.dragging").forEach(x=>x.classList.remove("sadrop","sadropend","dragging"));if(!col)return;e.preventDefault();
  const b=saDropAt(col,e.clientY);const before=b?b.dataset.said:"";const ph=col.dataset.saph;
  saEdit(d=>{const x=d.steps[id];if(!x)return;const old=x.phase;const p=d.phases.find(y=>y.code===ph);const ids=saPhaseSteps(d,ph).map(([k])=>k).filter(k=>k!==id);const at=before?ids.indexOf(before):ids.length;ids.splice(at<0?ids.length:at,0,id);x.phase=ph;x.phase_name=p.name;ids.forEach((k,n)=>d.steps[k].order=n);saReorder(d,ph);if(old!==ph)saReorder(d,old);d.moved=[...new Set((d.moved||[]).concat([id]))]});saSel=id});
document.addEventListener("dragend",()=>{if(saDrag){saDrag="";document.querySelectorAll(".sadrop,.sadropend,.sacard.dragging").forEach(x=>x.classList.remove("sadrop","sadropend","dragging"))}});
document.addEventListener("dragend",()=>{if(orgDrag){orgDrag="";document.querySelectorAll(".orgover,.orgc.dragging").forEach(x=>x.classList.remove("orgover","dragging"))}});
document.addEventListener("dragstart",e=>{const c=e.target.closest&&e.target.closest(".kc");if(!c)return;dragId=c.dataset.id;c.classList.add("dragging");try{e.dataTransfer.setData("text/plain",dragId);e.dataTransfer.effectAllowed="move"}catch(x){}});
document.addEventListener("dragend",e=>{dragId="";document.querySelectorAll(".kc.dragging,.kcards.over").forEach(x=>x.classList.remove("dragging","over"))});
document.addEventListener("dragover",e=>{const z=e.target.closest&&e.target.closest(".kcards");if(!z||!dragId)return;e.preventDefault();document.querySelectorAll(".kcards.over").forEach(x=>x!==z&&x.classList.remove("over"));z.classList.add("over")});
document.addEventListener("drop",e=>{const z=e.target.closest&&e.target.closest(".kcards");if(!z||!dragId)return;e.preventDefault();const id=dragId;dragId="";z.classList.remove("over");
  if(z.dataset.mst!==undefined){const tk=S.tasks[id];if(!tk||tk.status===z.dataset.mst)return;if(!canChangeTask(tk)){toast("Only the owner, members or a lead can move this card.");return}if(!L("task_status").includes(z.dataset.mst)&&z.dataset.mst!=="Blocked"){toast("Cards can't move to this list.");return}setTaskStatus(id,z.dataset.mst);return}
  if(z.dataset.list===undefined)return;moveCard(id,z.dataset.list,z.dataset.id,z.dataset.camp)});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="ck-new"){e.preventDefault();const b=document.querySelector("[data-act=ck-add]");if(b)b.click();return}
  if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("kc")){e.preventDefault();e.target.click()}});
document.addEventListener("submit",e=>{const f=e.target;
  if(f.id==="cform"){e.preventDefault();const text=f.elements.text.value.trim(),bid=f.elements.brand.value;if(!text)return;
    if(!me){toast("Pick your name in the top bar first, so people know who wrote it.");return}
    create("comments",null,{brand:bid,text,by:me,at:Date.now(),mentions:mentionsIn(text)},"Comment on "+bname(bid)).then(id=>{if(id)f.reset()})}
  if(f.id==="aform"){e.preventDefault();const el=f.elements;const teams=[];for(let i=0;el["tn"+i];i++){const n=el["tn"+i].value.trim();if(!n)continue;teams.push({name:n,lead:el["tl"+i].value,platforms:el["tp"+i].value.split(",").map(x=>x.trim()).filter(Boolean)})}
    const bp_map={};L("bp_section").forEach((x,i)=>{const v=el["bm"+i].value.split(",").map(y=>y.trim()).filter(Boolean);if(v.length)bp_map[x]=v});
    const help={};L("platform").forEach((x,i)=>{const v=el["hp"+i].value.trim();if(v)help[x]=v});
    const body={teams,bp_map,help,chase_days:Math.max(1,+el.chase_days.value||2)};if(S.config.access_setup)save("config","access_setup",body,"Access setup");else create("config","access_setup",body,"Access setup")}
  if(f.id==="tform"){e.preventDefault();const name=f.elements.name.value.trim(),tasks=parseTemplateLines(f.elements.lines.value);
    if(!name||!tasks.length){toast("Give the template a name and at least one task.");return}saveTemplates(TEMPLATES().concat([{name,vertical:f.elements.vertical.value,tasks}]))}});
let logT=0;
let tqT=0;
document.addEventListener("input",e=>{if(e.target.classList&&e.target.classList.contains("tfind")){const k=e.target.dataset.k;tq[k]=e.target.value;if(pager[k])pager[k].page=1;clearTimeout(tqT);tqT=setTimeout(()=>{const m=$("#main");if(!m)return;renderMain();const n=document.getElementById("tq-"+k);if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},200);return}
  if(e.target.id==="log-q"){logQ=e.target.value;clearTimeout(logT);logT=setTimeout(()=>{const m=$("#main");if(route.v!=="settings"||setTab!=="changes"||!m)return;m.innerHTML=vSettings();const n=$("#log-q");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},200);return}
if(e.target.form&&e.target.form.id==="dform"&&e.target.name)drawerDirty[e.target.name]=e.target.value;if(e.target.id==="q"){searchQ=e.target.value;renderSearch()}if(e.target.id==="kb-q"){kbFilter.q=e.target.value;const q=kbFilter.q.trim().toLowerCase();document.querySelectorAll("main .kc").forEach(c=>c.hidden=!!q&&!(c.querySelector(".kt")||c).innerText.toLowerCase().includes(q))}if(e.target.id==="acc-find"){const q=e.target.value.trim().toLowerCase();document.querySelectorAll(".accb").forEach(b=>b.hidden=!!q&&!b.dataset.n.includes(q))}});
document.addEventListener("focusout",e=>{if(e.target.id==="q")setTimeout(()=>{if(!$(".search")||!$(".search").contains(document.activeElement)){const b=$("#sres");if(b)b.hidden=true;renderTop()}},150)});
document.addEventListener("keydown",e=>{if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||"")){const q=$("#q");if(q){e.preventDefault();q.focus()}}
  if(e.target.id==="q"&&e.key==="Enter"){const first=$("#sres .sr-row");if(first)first.click()}
  if(e.target.id==="q"&&e.key==="Escape"){searchQ="";e.target.value="";renderSearch();e.target.blur()}});
$("#scrim").onclick=closeDrawer;
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(pop){const l=pop.btn;closePop();const b=document.querySelector(`[aria-label="${CSS.escape(l)}"]`);if(b)b.focus();return}if(!$("#modal").hidden)$("#modal").hidden=true;else closeDrawer()}
  if(pop&&(e.key==="ArrowDown"||e.key==="ArrowUp")){const items=[...document.querySelectorAll("#pop .pi")];const i=items.indexOf(document.activeElement);const n=items[(i+(e.key==="ArrowDown"?1:-1)+items.length)%items.length];if(n){e.preventDefault();n.focus()}}});
document.addEventListener("scroll",()=>{if(pop)closePop()},true);
function ntFit(){document.querySelectorAll("table.board .nt").forEach(n=>{const m=n.nextElementSibling;if(m&&m.classList.contains("ntmore")&&!n.classList.contains("open"))m.hidden=n.scrollHeight<=n.clientHeight+2&&n.scrollWidth<=n.clientWidth+1})}
function sowPin(){} /* the folded summary no longer floats over the table while scrolling */
document.addEventListener("scroll",e=>{if(e.target===$("#main"))sowPin()},true);
setInterval(()=>{const m=$("#clkme");if(m){const z=tzNow();m.textContent=z.tl+" "+z.tz}document.querySelectorAll("[data-clk]").forEach(e=>e.textContent=clockTime(e.dataset.clk))},30000);
document.addEventListener("click",e=>{const p=$("#clkpop");if(p&&!p.contains(e.target)&&!e.target.closest("[data-act=clock]"))p.remove()});

