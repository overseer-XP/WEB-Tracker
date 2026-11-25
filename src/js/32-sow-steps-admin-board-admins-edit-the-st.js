/* ---------- SOW steps admin board: admins edit the step list as a draft, then publish it to every place steps appear ---------- */
let saSel="",saDrag="",saShowArch=false;
const SA_FIELDS=["name","phase","phase_name","kind","is_gate","is_optional","proof","auto","archived","founder_stage","raci","after"];
const saClone=o=>JSON.parse(JSON.stringify(o||{}));
const saPad=n=>String(n).padStart(2,"0");
function saFounderOf(id){const fv=S.config.founder_view;const st=fv&&Array.isArray(fv.stages)?fv.stages.find(g=>(g.steps||[]).includes(id)):null;return st?st.name:""}
function saFromLive(){const steps={};const ph=[];
  for(const[id,s]of Object.entries(S.steps).sort((a,b)=>(a[1].order||0)-(b[1].order||0))){
    if(s.phase&&!ph.some(p=>p.code===s.phase))ph.push({code:s.phase,name:s.phase_name||s.phase});
    steps[id]={name:s.name||"",phase:s.phase||"",phase_name:s.phase_name||"",order:s.order||0,kind:s.kind||"main",is_gate:!!s.is_gate,is_optional:!!s.is_optional,
      raci:Object.assign({r:s.default_owner||"",a:"",c:"",i:""},s.raci||{}),proof:s.proof||"",after:(s.after||[]).slice(),archived:!!s.archived,auto:s.auto||"",
      founder_stage:s.founder_stage!==undefined?s.founder_stage:saFounderOf(id),short:s.short||""}}
  return{steps,phases:ph}}
function saWork(){const d=S.config.steps_draft;return d&&d.steps&&Object.keys(d.steps).length?saClone(d):saFromLive()}
function saPut(d){if(!canEdit)return;d.by=me||"";d.at=Date.now();S.config.steps_draft=d;render();
  chain("config/steps_draft",()=>db.doc(COLL.config+"/steps_draft").set(d)).catch(()=>toast("Draft not saved. Check your connection."))}
function saPhaseSteps(d,ph,withArch){return Object.entries(d.steps).filter(([,s])=>s.phase===ph&&(withArch||!s.archived)).sort((a,b)=>a[1].order-b[1].order)}
function saNums(d){const out={};d.phases.forEach((p,pi)=>{let main=0,last="",letter=0;
  for(const[id,s]of saPhaseSteps(d,p.code)){if(s.kind==="interim"&&last){letter++;out[id]=last+String.fromCharCode(96+letter)}else{main++;letter=0;last=`${pi+1}.${saPad(main)}`;out[id]=last}}});return out}
function saReorder(d,ph){saPhaseSteps(d,ph).forEach(([id],i)=>{d.steps[id].order=(d.phases.findIndex(p=>p.code===ph)+1)*1000+i*10})}
function saType(s){return s.kind==="interim"?"Interim":s.is_gate?"Gate":s.is_optional?"Optional":"Main"}
function saChanges(d){const nums=saNums(d);const out=[];const LV=saFromLive().steps;
  const liveIdx=id=>{const s=S.steps[id];return Object.entries(S.steps).filter(([,x])=>x.phase===s.phase&&!x.archived).sort((a,b)=>(a[1].order||0)-(b[1].order||0)).findIndex(([k])=>k===id)};
  for(const[id,s]of Object.entries(d.steps)){const live=S.steps[id];
    if(!live){if(!s.archived)out.push({id,kind:"Added",text:`${nums[id]||""} ${s.name}`});continue}
    if(!!s.archived!==!!live.archived){out.push({id,kind:s.archived?"Archived":"Restored",text:`${s.name}`});continue}
    if(s.archived)continue;
    const ch=[];const ls=LV[id];
    for(const f of ["name","short","kind","is_gate","is_optional","proof","auto","founder_stage"])if(JSON.stringify(s[f]??"")!==JSON.stringify(ls[f]??""))ch.push(f==="kind"||f==="is_gate"||f==="is_optional"?"type":f==="founder_stage"?"founder view stage":f==="short"?"short label":f);
    if(JSON.stringify(s.raci)!==JSON.stringify(ls.raci))ch.push("RACI");if(JSON.stringify(s.after||[])!==JSON.stringify(ls.after||[]))ch.push("starts after");
    if(ch.length)out.push({id,kind:"Edited",text:`${nums[id]} ${s.name}: ${[...new Set(ch)].join(", ")}`});
    const di=saPhaseSteps(d,s.phase).findIndex(([k])=>k===id);
    if((d.moved||[]).includes(id)&&(s.phase!==live.phase||di!==liveIdx(id)))out.push({id,kind:"Moved",text:`${nums[id]} ${s.name}`})}
  const lp={};for(const x of Object.values(S.steps))if(x.phase&&!lp[x.phase])lp[x.phase]=x.phase_name;
  for(const ph of d.phases){if(!lp[ph.code]){if(saPhaseSteps(d,ph.code).length)out.push({id:"",kind:"Added",text:`Phase: ${ph.name}`})}else if(lp[ph.code]!==ph.name)out.push({id:"",kind:"Edited",text:`Phase renamed: ${lp[ph.code]} to ${ph.name}`})}
  return out}
function saUsedIn(d,id){const s=d.steps[id];if(s.archived)return["Hidden everywhere (progress kept)"];const u=["SOW tracker"];if(!s.is_optional)u.push("Road to SOW and progress %");u.push("My tasks (step owner)");
  if(s.founder_stage)u.push("Founder view: "+s.founder_stage);if(s.is_gate)u.push("Gate check and Leadership decisions");if(s.auto&&AUTO[s.auto])u.push("Ticks itself");return u}
function saProgress(id){let n=0;for(const d of Object.values(S.bsteps)){const x=(d.s||{})[id];if(x&&x.status&&x.status!=="Not Started")n++}return n}
function vStepsAdmin(){
  if(!canEdit)return`<h1>SOW steps</h1><p class="sub">Only admins can open this page.</p>`;
  const d=saWork();const nums=saNums(d);const changes=S.config.steps_draft&&S.config.steps_draft.steps?saChanges(d):[];
  if(saSel&&!d.steps[saSel])saSel="";
  const card=([id,s])=>`<div class="sacard ${s.kind==="interim"?"int":""} ${s.is_gate?"gate":""} ${s.is_optional?"opt":""} ${s.archived?"arch":""} ${saSel===id?"sel":""}" draggable="${s.archived?"false":"true"}" data-said="${esc(id)}" data-act="sa-sel" data-id="${esc(id)}" tabindex="0" role="button" aria-label="${esc((nums[id]||"")+" "+s.name)}">
    <span class="sano">${esc(s.archived?"Archived":nums[id]||"")}</span> ${esc(s.name)}
    <div class="sawho">${["r","a"].map(k=>s.raci&&s.raci[k]?`${k.toUpperCase()} ${esc(s.raci[k])}`:"").filter(Boolean).join(" · ")||`<span class="faint">No owner yet</span>`}</div>
    ${s.is_gate?`<span class="sachip g">Gate</span>`:""}${s.is_optional?`<span class="sachip o">Optional</span>`:""}${s.auto?`<span class="sachip a">Ticks itself</span>`:""}${changes.some(c=>c.id===id&&c.kind==="Added")?`<span class="sachip n">New</span>`:changes.some(c=>c.id===id)?`<span class="sachip e">Changed</span>`:""}</div>`;
  let h=`<div class="row" style="gap:10px;align-items:center;margin-bottom:4px"><h1 style="margin:0">SOW steps</h1><span class="tag sadm">Admins only</span>${changes.length?`<span class="tag sadraft">Draft · ${changes.length} change${changes.length>1?"s":""} not published</span>`:`<span class="tag">Matches what the team sees</span>`}<span class="grow"></span>
    ${S.config.steps_draft&&S.config.steps_draft.steps?`<button class="btn" data-act="sa-discard">Discard draft</button>`:""}<button class="btn" data-act="sa-arch-tog" aria-pressed="${saShowArch}">${saShowArch?"Hide archived":"Show archived"}</button><button class="btn pri" data-act="sa-pub" ${changes.length?"":"disabled"}>Review and publish</button></div>
    <p class="sub">Drag a card to reorder it or move it to another phase, or use Move up and Move down. Numbers update themselves. Nothing changes for the team until you publish.</p>`;
  h+=`<div class="sawrap ${S.steps[saSel]||saSel?"":"sanone"}"><div class="saboard">${d.phases.map((p,pi)=>{const list=saPhaseSteps(d,p.code,saShowArch);return`<section class="sacol" data-saph="${esc(p.code)}" aria-label="${esc(p.name)}"><div class="sach"><b>${pi+1} ${esc(p.name)}</b><span class="cnt">${list.filter(([,s])=>!s.archived).length}</span></div>
    <div class="sabody">${list.map(card).join("")}</div><button class="saadd" data-act="sa-add" data-ph="${esc(p.code)}">+ Add step</button></section>`}).join("")}
    <section class="sacol saphadd"><button class="saadd" data-act="sa-addph">+ Add phase</button></section></div>`;
  const s=saSel&&d.steps[saSel];
  if(s){const others=Object.entries(d.steps).filter(([k,x])=>k!==saSel&&!x.archived).sort((a,b)=>(nums[a[0]]||"").localeCompare(nums[b[0]]||"",undefined,{numeric:true}));
    const fst=(S.config.founder_view&&S.config.founder_view.stages||[]).map(g=>g.name);const ppl=activePeople();
    h+=`<aside class="saedit" aria-label="Edit step"><h3>${esc(nums[saSel]||"")} ${esc(s.name)}</h3><p class="faint" style="margin:2px 0 8px">Phase ${d.phases.findIndex(p=>p.code===s.phase)+1} · ${esc(s.phase_name)} · its ID never changes, so brand progress is kept</p>
      <label class="salab" for="sa-name">Step name</label><input id="sa-name" data-act="sa-f" data-f="name" value="${esc(s.name)}">
      <div class="salab">Type</div><div class="seg" role="group" aria-label="Type">${["Main","Interim","Gate","Optional"].map(t=>`<button data-act="sa-type" data-v="${t}" class="${saType(s)===t?"on":""}" aria-pressed="${saType(s)===t}">${t}</button>`).join("")}</div>
      <div class="salab">RACI</div><div class="saraci">${[["r","Responsible"],["a","Accountable"],["c","Consulted"],["i","Informed"]].map(([k,l])=>`<b title="${l}">${k.toUpperCase()}</b><input data-act="sa-f" data-f="raci.${k}" value="${esc((s.raci||{})[k]||"")}" list="sa-ppl" aria-label="${l}">`).join("")}</div><datalist id="sa-ppl">${ppl.map(p=>`<option value="${esc(p)}">`).join("")}</datalist>
      <label class="salab" for="sa-short">Short label on the SOW tracker</label><input id="sa-short" data-act="sa-f" data-f="short" maxlength="40" value="${esc(s.short||"")}" placeholder="${esc(s.name)}">
      <label class="salab" for="sa-proof">Proof to tick it done</label><input id="sa-proof" data-act="sa-f" data-f="proof" value="${esc(s.proof||"")}" placeholder="For example: notes + recording link">
      <div class="salab">Starts after</div><div class="saafter">${(s.after||[]).filter(k=>d.steps[k]).map(k=>`<span>${esc(nums[k]||"")} ${esc(d.steps[k].name)} <button class="linkb" data-act="sa-after-rm" data-v="${esc(k)}" aria-label="Remove">×</button></span>`).join("")}
        <select data-act="sa-after-add" aria-label="Add a step this waits for"><option value="">+ Add</option>${others.map(([k,x])=>`<option value="${esc(k)}">${esc((nums[k]||"")+" "+x.name)}</option>`).join("")}</select></div>
      <div class="salab">Phase</div><select data-act="sa-ph" aria-label="Phase">${d.phases.map((p,pi)=>`<option value="${esc(p.code)}" ${p.code===s.phase?"selected":""}>${pi+1} ${esc(p.name)}</option>`).join("")}</select>
        <div class="salab">Founder view stage</div><select data-act="sa-f" data-f="founder_stage" aria-label="Founder view stage"><option value="">Not shown</option>${fst.map(n=>`<option ${n===s.founder_stage?"selected":""}>${esc(n)}</option>`).join("")}</select>
        <div class="salab">Ticks itself when</div><select data-act="sa-f" data-f="auto" aria-label="Ticks itself when"><option value="">No</option>${Object.entries(AUTO).map(([k,a])=>`<option value="${k}" ${s.auto===k?"selected":""}>${esc(a.label)}</option>`).join("")}</select>
      <div class="row" style="gap:6px;margin-top:10px"><button class="btn sm" data-act="sa-move" data-v="-1">Move up</button><button class="btn sm" data-act="sa-move" data-v="1">Move down</button><span class="grow"></span><button class="btn sm ${s.archived?"":"quiet"}" data-act="sa-arch">${s.archived?"Restore":"Archive"}</button></div>
      <div class="salab">Shows up in</div><div class="saused">${saUsedIn(d,saSel).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
      ${S.steps[saSel]?`<p class="sawarn"><b>${saProgress(saSel)} brand${saProgress(saSel)===1?"":"s"}</b> have progress on this step. Moving, renaming or renumbering keeps it. Archiving hides the step but never deletes ticks.</p>`:`<p class="sawarn">New step. Brands start it as Not Started once you publish.</p>`}
      ${d.phases.some(p=>p.code===s.phase)?`<label class="salab" for="sa-phname">Phase name (applies to the whole phase)</label><input id="sa-phname" data-act="sa-phname" data-ph="${esc(s.phase)}" value="${esc(s.phase_name)}">`:""}</aside>`}
  else h+=`<aside class="saedit"><h3>Pick a step</h3><p class="faint">Click a card to edit its name, type, RACI, what it waits for and the proof needed to tick it.</p>
    <div class="salab">Published versions</div>${saHistory()}</aside>`;
  return h+`</div>`}
function saHistory(){const rows=[];for(const d of Object.values(S.log))for(const e of d.entries||[])if(e.id==="steps_publish")rows.push(Object.assign({person:d.person},e));
  rows.sort((a,b)=>b.at-a.at);return rows.length?`<ul class="sahist">${rows.slice(0,8).map(r=>`<li><b>${esc(r.person||"Someone")}</b> · ${esc(fmtD(new Date(r.at).toISOString().slice(0,10)))}<div class="faint">${esc(r.new)}</div></li>`).join("")}</ul>`:`<p class="faint">No step changes published yet.</p>`}
function saEdit(fn){const d=saWork();fn(d);saPut(d)}
function saOpenPublish(){const d=saWork();const ch=saChanges(d);if(!ch.length)return;const nums=saNums(d);
  const by=k=>ch.filter(c=>c.kind===k);const m=$("#modal");
  const groups=d.phases.map((p,pi)=>`<li><b>${pi+1} ${esc(p.name)}</b>: ${saPhaseSteps(d,p.code).filter(([,s])=>s.kind!=="interim").length} columns</li>`).join("");
  m.innerHTML=`<div class="box wide"><h3>Publish ${ch.length} change${ch.length>1?"s":""} to the SOW steps</h3><p class="muted" style="margin-top:0">Publishing updates the SOW tracker, every brand's Road to SOW, My tasks, gates, the Founder view and Overview at once. Brand progress is kept.</p>
   ${["Added","Edited","Moved","Archived","Restored"].map(k=>by(k).length?`<div class="salab">${k} (${by(k).length})</div><ul class="sachg">${by(k).map(c=>`<li>${esc(c.text)}</li>`).join("")}</ul>`:"").join("")}
   <div class="salab">SOW tracker after publishing</div><ul class="sachg">${groups}</ul>
   <div class="row" style="gap:8px;margin-top:14px"><button class="btn pri" data-act="sa-pubgo">Publish ${ch.length} change${ch.length>1?"s":""}</button><button class="btn" data-act="mcancel">Cancel</button></div></div>`;
  m.hidden=false}
async function saPublish(){const d=saWork();const ch=saChanges(d);if(!ch.length||!canEdit)return;const nums=saNums(d);
  let order=0;const writes=[];
  for(const p of d.phases)for(const[id,s]of saPhaseSteps(d,p.code,true).sort((a,b)=>(a[1].archived?1:0)-(b[1].archived?1:0)||a[1].order-b[1].order)){order++;
    const full=Object.assign({},S.steps[id]||{},{code:id,name:s.name,phase:p.code,phase_name:p.name,order,kind:s.kind||"main",is_gate:!!s.is_gate,is_optional:!!s.is_optional,raci:s.raci||{},proof:s.proof||"",after:s.after||[],
      archived:!!s.archived,auto:s.auto||"",founder_stage:s.founder_stage||"",short:s.short||"",no:s.archived?"":(nums[id]||""),default_owner:(s.raci&&s.raci.r)||"",updated_at:Date.now(),updated_by:uid||""});
    if(!s.auto)delete full.auto;if(JSON.stringify(full)!==JSON.stringify(Object.assign({},S.steps[id]||{},{updated_at:full.updated_at,updated_by:full.updated_by})))writes.push([id,full])}
  const groups=d.phases.map((p,pi)=>{const cols=[];for(const[id,s]of saPhaseSteps(d,p.code)){if(s.kind==="interim"&&cols.length)cols[cols.length-1].steps.push(id);else cols.push({label:s.short||s.name,steps:[id]})}return{name:`${pi+1} ${p.name}`,cols}}).filter(g=>g.cols.length);
  const fv=S.config.founder_view;const fv2=fv&&Array.isArray(fv.stages)?Object.assign({},fv,{stages:fv.stages.map(g=>Object.assign({},g,{steps:d.phases.flatMap(p=>saPhaseSteps(d,p.code).filter(([,s])=>s.founder_stage===g.name).map(([id])=>id))}))}):null;
  $("#modal").hidden=true;toast("Publishing…");
  try{for(const[id,full]of writes){S.steps[id]=full;await db.doc(COLL.steps+"/"+id).set(full)}
    const sb={groups,updated_at:Date.now(),updated_by:uid||""};S.config.sow_board=sb;await db.doc(COLL.config+"/sow_board").set(sb);
    if(fv2){S.config.founder_view=fv2;await db.doc(COLL.config+"/founder_view").set(fv2)}
    const sum=["Added","Edited","Moved","Archived","Restored"].map(k=>[k,ch.filter(c=>c.kind===k).length]).filter(x=>x[1]).map(([k,n])=>`${n} ${k.toLowerCase()}`).join(", ");
    addLog("config","steps_publish",{published:sum},{published:""},"SOW steps published");
    delete S.config.steps_draft;await db.doc(COLL.config+"/steps_draft").delete();saSel="";toast("Published. Every page now uses the new steps.")}
  catch(e){if(!refused(e))toast("Publishing stopped part way. Open SOW steps again and publish to finish.")}
  render()}

