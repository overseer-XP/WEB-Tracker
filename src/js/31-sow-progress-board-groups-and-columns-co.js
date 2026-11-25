/* ---------- SOW progress board. Groups and columns come from config/sow_board ---------- */
function boardCols(){const cfg=S.config.sow_board;
  if(cfg&&Array.isArray(cfg.groups)&&cfg.groups.length)return cfg.groups;
  return phases().map(p=>({name:p.code+" "+p.name,cols:p.steps.map(s=>({label:s.name,steps:[s.code]}))}))}
/* shared table helpers: rows per page (remembered), a brand find box, sort chips */
let pager={},tq={},bpOpenG="";
const pgSize=k=>{const v=ls.get("vt-rows"+(k==="sowl"?"-sowl":""));return v===null||v===undefined||v===""?(k==="sowl"?5:20):+v};
function paged(k,rows){const p=pager[k]||(pager[k]={page:1});const size=pgSize(k);const n=rows.length;const pages=size?Math.max(1,Math.ceil(n/size)):1;if(p.page>pages)p.page=pages;if(p.page<1)p.page=1;const start=size?(p.page-1)*size:0;
  const nums=[];for(let i=1;i<=pages;i++)if(i===1||i===pages||Math.abs(i-p.page)<=1)nums.push(i);else if(nums[nums.length-1]!=="…")nums.push("…");
  const html=`<div class="pager"><span class="faint">${n?`Showing ${start+1} to ${size?Math.min(n,start+size):n} of ${n} brands`:"No brands match"}</span>
   <span class="pg" role="group" aria-label="Brands per page"><span class="faint">Per page</span>${(k==="sowl"?[5,10,20,0]:[10,20,0]).map(z=>`<button data-act="pgsize" data-k="${k}" data-v="${z}" class="${size===z?"on":""}" aria-pressed="${size===z}">${z||"All"}</button>`).join("")}</span>
   ${pages>1?`<span class="pg" role="navigation" aria-label="Pages"><button data-act="pgp" data-k="${k}" data-v="${p.page-1}" ${p.page<=1?"disabled":""}>‹ Prev</button>${nums.map(x=>x==="…"?`<span class="faint">…</span>`:`<button data-act="pgp" data-k="${k}" data-v="${x}" class="${x===p.page?"on":""}" aria-current="${x===p.page?"page":"false"}">${x}</button>`).join("")}<button data-act="pgp" data-k="${k}" data-v="${p.page+1}" ${p.page>=pages?"disabled":""}>Next ›</button></span>`:""}</div>`;
  return{rows:size?rows.slice(start,start+size):rows,html}}
/* click a heading to sort; click again to reverse; a third time goes back to the page's own order */
const tsort={};
function sortTh(tid,k,label,cls){const s=tsort[tid]||{};const on=s.k===k;return`<th class="srt ${on?"on":""} ${cls||""}" aria-sort="${on?(s.dir>0?"ascending":"descending"):"none"}"><button class="srtb" data-act="tsort" data-t="${tid}" data-k="${k}">${label}<span class="sa" aria-hidden="true">${on?(s.dir>0?"↑":"↓"):"↕"}</span></button></th>`}
function tsortRows(tid,rows,get){const s=tsort[tid];if(!s||!get[s.k])return rows;const f=get[s.k];
  return rows.map((r,i)=>[r,f(r),i]).sort((a,b)=>{const x=a[1],y=b[1];const c=typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});return c*s.dir||a[2]-b[2]}).map(x=>x[0])}
const findBox=(k,n)=>`<input class="tfind" id="tq-${k}" data-k="${k}" type="search" placeholder="Find a brand (${n})" aria-label="Find a brand" value="${esc(tq[k]||"")}">`;
const tqMatch=(k,b)=>!tq[k]||(b.name||"").toLowerCase().includes(tq[k].trim().toLowerCase());
/* one status scale for step and section marks: filled = done, partly filled = under way, ring = not started; red only for blocked */
const SMARK={done:"Done",doing:"Doing",todo:"To do",blk:"Blocked",na:"N/A"};
const smark=(k,label)=>`<span class="smk smk-${k}" aria-hidden="true"></span><span class="sr">${esc(label||SMARK[k])}</span>`;
const BOARD_WORD={"Done":"Done","In progress":"Doing","Not done":"To do","N/A":"N/A"};
function boardCell(bid,col){
  if(col.sow_stage){const st=(S.sow[bid]||{}).stage||"";if((col.sow_stage.done||[]).includes(st))return"Done";if((col.sow_stage.progress||[]).includes(st))return"In progress";return"Not done"}
  const vals=(col.steps||[]).filter(c=>S.steps[c]).map(c=>stepState(bid,c).status||"Not Started");
  if(!vals.length)return"";
  const live=vals.filter(v=>v!=="N/A");if(!live.length)return"N/A";
  if(live.every(v=>v==="Done"))return"Done";
  if(live.some(v=>v==="Done"||v==="In Progress"))return"In progress";
  return"Not done"}
const BOARD_MARK={"Done":"✓","In progress":"•","N/A":"–"};
const BOARD_CLS={"Done":"bd-done","In progress":"bd-prog","Not done":"bd-not","N/A":"bd-na","":"bd-na"};
let sowFold=(()=>{try{return JSON.parse(ls.get("vt-sowfold")||"{}")||{}}catch(e){return{}}})();
const colLabel=c=>{const s=S.steps[(c.steps||[])[0]];return(s&&s.short)||c.label};
function sowBoard(){
  const groups=boardCols();const all=brandList().filter(b=>!isInternal(b));const bs=all.filter(b=>tqMatch("sow",b));
  const rows=bs.map(b=>({b,pct:Math.round(onboarding(b.id)*100)})).sort((x,y)=>(onHold(x.b)?1:0)-(onHold(y.b)?1:0)||y.pct-x.pct||String(x.b.name).localeCompare(y.b.name));
  const pg=paged("sow",rows);
  /* a phase folds itself once every brand on the page has finished it; a person's own open or close wins */
  const live=pg.rows.filter(r=>!onHold(r.b));
  const doneAll=g=>live.length&&live.every(r=>g.cols.every(c=>{const v=boardCell(r.b.id,c);return v==="Done"||v==="N/A"||v===""}));
  const G=groups.map((g,i)=>{const auto=doneAll(g);const f=sowFold[g.name];return{g,i,auto,closed:f==="closed"||(f!=="open"&&auto)}});
  const ncol=G.reduce((n,x)=>n+(x.closed?1:x.g.cols.length),0);
  let h=`<div class="tbar tcard">${findBox("sow",all.length)}<div class="legend" role="note" aria-label="Key"><b>Key</b>${["Done","In progress","Not done","N/A"].map(v=>`<span><span class="bdl ${BOARD_CLS[v]}">${BOARD_MARK[v]||""}</span>${esc(v)}</span>`).join("")}</div><span class="grow"></span><button class="btn sm" data-act="sow-foldall" data-v="open"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5h12M2 8h12M2 11h12" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>Show every step</button><button class="btn sm" data-act="sow-foldall" data-v="closed"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>Phases only</button></div>
  <div class="tw tpin"><table class="grid board"><thead><tr><th class="stick" rowspan="2">Brand</th><th rowspan="2">SOW stage</th><th rowspan="2" class="num" title="Road to SOW: share of required steps done">Road to SOW</th>${G.map(x=>`<th colspan="${x.closed?1:x.g.cols.length}" class="gh g${x.i%7} ${x.closed?"gfold":""}"><button class="ghf" data-act="sow-fold" data-v="${esc(x.g.name)}" data-c="${x.closed?"open":"closed"}" aria-expanded="${!x.closed}" title="${x.closed?"Open":"Fold"} ${esc(x.g.name)}"><svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5 7.5 6 4 9.5"/></svg>${esc(x.g.name)}${x.auto?` <span class="gdone">done</span>`:""}</button></th>`).join("")}</tr>
  <tr>${G.map(x=>x.closed?`<th class="pc g${x.i%7} gs"><span>${x.g.cols.length} steps</span></th>`:x.g.cols.map((c,ci)=>`<th class="pc g${x.i%7} ${ci===0?"gs":""}" title="${esc(c.label)}"><span>${esc(colLabel(c))}</span></th>`).join("")).join("")}</tr></thead><tbody>`;
  for(const{b,pct}of pg.rows){const s=S.sow[b.id]||{};const hold=onHold(b);
    h+=`<tr class="${hold?"held":""}"><td class="stick"><a class="bname" href="#${brandHash(b.id,"sow")}" title="Open ${esc(b.name)} Road to SOW">${esc(b.name)}</a></td><td>${hold?`<span class="pill s-off">On hold</span>`:pill(s.stage||"Not Started")}</td><td class="num"><b>${pct}%</b></td>`;
    for(const x of G){const gi=groups.indexOf(x.g);
      if(x.closed){const vs=x.g.cols.map(c=>boardCell(b.id,c)).filter(v=>v&&v!=="N/A");const dn=vs.filter(v=>v==="Done").length;const v=!vs.length?"N/A":dn===vs.length?"Done":vs.some(v=>v!=="Not done")?"In progress":"Not done";
        h+=`<td class="gc gs g${x.i%7}"><button class="bd ${BOARD_CLS[v]}" data-act="sow-fold" data-v="${esc(x.g.name)}" data-c="open" title="${esc(x.g.name+": "+dn+" of "+vs.length+" done. Click to open")}">${dn}/${vs.length}</button></td>`;continue}
      x.g.cols.forEach((c,ci)=>{const v=boardCell(b.id,c);
      h+=`<td class="gc ${ci===0?"gs g"+(x.i%7):""}"><button class="bd ${BOARD_CLS[v]}" data-act="board" data-b="${esc(b.id)}" data-c="${gi}.${ci}" title="${esc(colLabel(c)+": "+(v||"No steps linked"))}">${esc(BOARD_WORD[v]||"")}<span class="sr">${esc(colLabel(c)+" "+v)}</span></button></td>`})}
    h+=`</tr>`}
  if(!rows.length)h+=`<tr><td colspan="${ncol+3}"><div class="empty">${tq.sow?"No brand matches that name.":"No brands yet."}</div></td></tr>`;
  return h+`</tbody></table></div>`+pg.html}
/* SOW documents: the kinds come from Settings > Lists (SOW documents); each brand keeps a link per kind, plus any others */
const SOW_DOCS=()=>L("sow_docs");
/* the Best Practices slot (the sow_docs entry that names Best Practices or BP) shows the brand's Best Practices sheet link */
const bpSlot=()=>SOW_DOCS().find(k=>/best\s*practice|^bps?$/i.test(k));
function sowDocs(bid){const s=S.sow[bid]||{};const d=Object.assign({},s.docs||{});const k=bpSlot();const l=(S.bps[bid]||{}).doc_link;if(k&&l)d[k]=l;return d}
function sowDocChips(bid,add){const d=sowDocs(bid);const ex=(S.sow[bid]||{}).docs_extra||[];const w=add&&canWrite&&S.sow[bid];
  const ks=SOW_DOCS().filter(k=>d[k]);const miss=SOW_DOCS().filter(k=>!d[k]);
  return`<span class="dchips">${ks.map(k=>`<a class="dchip" href="${esc(d[k])}" target="_blank" rel="noopener">${esc(k)}</a>`).join("")}${ex.map(x=>`<a class="dchip" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join("")}${w?`<button class="dchip add" data-act="sow-doc" data-id="${esc(bid)}" title="${esc(miss.length?"Missing: "+miss.join(", "):"Add another document")}">+ Add${miss.length?` <span class="dmiss">${miss.length} missing</span>`:""}</button>`:""}${!ks.length&&!ex.length&&!w?`<span class="faint">None</span>`:""}</span>`}
/* next steps: a running log; each entry is stamped with who wrote it, when, and their time zone */
function nsLog(s){const lg=(s.ns_log||[]).slice();if(s.next_step&&!lg.length)lg.push({t:s.next_step,legacy:true});return lg}
const nsStamp=e=>e.legacy?"Imported note":`${fmtD(new Date(e.at).toISOString().slice(0,10))} · ${e.tl||""} ${e.tz||""} · ${e.by||""}`.replace(/\s+/g," ");
/* a typed note keeps its shape: headings, bullets, line breaks */
const nsImp=e=>!!e&&(!!e.legacy||!e.by||/import/i.test(e.by||""));
function nsFmt(s,imp){s=String(s||"");if(imp)s=s.replace(/\s+\/(?=\s|$)/g,"\n");const lines=s.split(/\r?\n/).map(x=>x.trim());const ne=lines.filter(Boolean);if(ne.length<2)return esc(s.trim());
  const isHead=(x,i)=>x&&x.length<=40&&!/[.!?:;,]$/.test(x)&&!/^[-•*]\s/.test(x)&&lines.slice(i+1).some(Boolean);
  let out="",inList=false;const close=()=>{if(inList){out+="</ul>";inList=false}};
  lines.forEach((x,i)=>{if(!x)return;if(isHead(x,i)){close();out+=`<b class="nfh">${esc(x)}</b>`;return}
    if(!inList){out+=`<ul class="nfl">`;inList=true}out+=`<li>${esc(x.replace(/^[-•*]\s+/,""))}</li>`});close();return`<span class="nf">${out}</span>`}
function nsCell(bid){const s=S.sow[bid]||{};const lg=nsLog(s);const w=canWrite&&S.sow[bid];
  const all=lg.map((e,i)=>({e,i}));const lastE=all[all.length-1];const cur=lastE&&!lastE.e.done?lastE:null;/* the newest entry is the live one; older entries are history */const rest=all.filter(x=>!cur||x.i!==cur.i).reverse();
  const doneStamp=e=>e.done?`Done${e.done.by?" by "+e.done.by:""} · ${fmtD(new Date(e.done.at).toISOString().slice(0,10))}`:"";
  const xk=`data-act="xp" data-xk="ns:${esc(bid)}" role="button" aria-expanded="false"`;
  const head=cur?`<div class="nse"><span class="nss">${esc(nsStamp(cur.e))}</span><span class="clamp2 xp" ${xk}>${nsFmt(cur.e.t,nsImp(cur.e))}</span></div>`
    :lg.length?`<span class="nsall xp" ${xk}>✓ All next steps done</span>`:`<span class="faint">None yet</span>`;
  const hist=rest.length?`<button class="linkb nsmorec" data-act="xp" data-t="+${rest.length} earlier note${rest.length>1?"s":""}">+${rest.length} earlier note${rest.length>1?"s":""}</button><div class="nshist" hidden>${rest.map(({e})=>`<div class="nse${e.done?" isdone":""}"><span class="nss">${esc(nsStamp(e))}${e.done?` · ${esc(doneStamp(e))}`:""}</span><span>${e.done?"✓ ":""}${nsFmt(e.t,nsImp(e))}</span></div>`).join("")}</div>`:"";
  return`<div class="nsc">${head}${hist}
   <div class="row nsact">${w?`<button class="linkb" data-act="sow-ns" data-id="${esc(bid)}">+ Add</button>`:""}${w&&cur?`<button class="linkb nsdn" data-act="ns-done" data-id="${esc(bid)}" data-i="${cur.i}" title="Mark this next step done">✓ Done</button>`:""}</div></div>`}
const tzList=()=>[...new Set(clockZones().map(c=>c.zone).concat(Intl.supportedValuesOf?Intl.supportedValuesOf("timeZone"):[]))];
function nsEntry(text){const z=tzNow();return{t:text,by:me,at:Date.now(),tz:z.tz,tl:z.tl,zone:z.zone}}
async function addNs(bid,text){const s=S.sow[bid];if(!s)return;if(!me){toast("Pick your name at the top first, so the update shows who wrote it.");return}
  await save("sow",bid,{ns_log:nsLog(s).concat([nsEntry(text)])},"SOW next steps "+bname(bid))}
function tzNow(){const z=Intl.DateTimeFormat().resolvedOptions().timeZone||"";const cz=clockZones().find(c=>c.zone===z);
  const ab=cz&&cz.abbr?cz.abbr:tzAbbr(z);const tl=new Date().toLocaleTimeString("en-GB",{hour:"numeric",minute:"2-digit",hour12:true}).replace(" ","").toLowerCase();return{tz:ab,tl,zone:z}}
function tzAbbr(z){for(const loc of ["en-US","en-GB","en-IN","en-AU"]){try{const n=new Intl.DateTimeFormat(loc,{timeZone:z,timeZoneName:"short"}).formatToParts(new Date()).find(p=>p.type==="timeZoneName");if(n&&!/^(GMT|UTC)[+-]/.test(n.value))return n.value;if(loc==="en-AU"&&n)return n.value}catch(e){}}return""}
/* world clock: zones come from Settings > Lists (World clock), one per line: label | time zone | short name */
function clockZones(){return L("clock_zones").map(x=>{const[l,z,a]=String(x).split("|").map(y=>(y||"").trim());return{label:l,zone:z,abbr:a||""}}).filter(x=>x.label&&x.zone)}
function clockTime(z){try{return new Date().toLocaleTimeString("en-GB",{timeZone:z,hour:"numeric",minute:"2-digit",hour12:true}).replace(" ","").toLowerCase()}catch(e){return"?"}}
function clockHour(z){try{return+new Intl.DateTimeFormat("en-GB",{timeZone:z,hour:"numeric",hour12:false}).format(new Date())%24}catch(e){return 12}}
function clockDay(z){try{return new Date().toLocaleDateString("en-GB",{timeZone:z,weekday:"short"})}catch(e){return""}}
function clockHtml(){const zs=clockZones();const me0=tzNow();return`<div class="pt">World clock<b>Your time: ${esc(me0.tl)} ${esc(me0.tz)}</b></div>${zs.map(c=>{const h=clockHour(c.zone);const work=h>=9&&h<18;return`<div class="clk ${work?"on":""}"><span class="clkd" aria-hidden="true"></span><span>${esc(c.label)}</span><b data-clk="${esc(c.zone)}">${esc(clockTime(c.zone))}</b><small>${esc(clockDay(c.zone))} ${esc(c.abbr||tzAbbr(c.zone))}</small></div>`}).join("")||`<p class="faint" style="margin:6px 0">Add time zones in Settings, Lists, World clock.</p>`}<p class="faint clkk"><span class="clkd on"></span> working hours (9am to 6pm)</p>`}
function boardDrawerBody(bid,path){
  const [gi,ci]=String(path).split(".").map(Number);const g=boardCols()[gi];const c=g&&g.cols[ci];if(!c)return null;
  let body=`<p class="muted w" style="grid-column:1/-1;margin:0">${esc(bname(bid))} · ${esc(g.name)}</p>`;
  if(c.sow_stage){const s=S.sow[bid]||{};body+=`<div class="w" style="grid-column:1/-1"><p>Shown as Done when the SOW stage is ${esc((c.sow_stage.done||[]).join(" or "))}.</p>${statusSel("sow",bid,s.stage||"Not Started",L("sow_stage"),canEdit&&canWrite)}</div>`;return{title:c.label,body}}
  const st=(c.steps||[]).map(code=>S.steps[code]).filter(Boolean);
  if(!st.length)return{title:c.label,body:body+`<p class="w" style="grid-column:1/-1">No onboarding steps are linked to this column yet.</p>`};
  body+=`<div class="w" style="grid-column:1/-1">${st.map(s=>{const v=stepState(bid,s.code).status||"Not Started";
    return`<div class="bstep"><div><span class="code">${esc(sno(s))}</span> ${esc(s.name)}${s.is_gate?` <span class="tag gate">Gate</span>`:""}${s.is_optional?` <span class="tag opt">Optional</span>`:""}</div>
    <div class="row" style="gap:6px;flex-wrap:nowrap">${statusSel("step",bid,v,L("checklist"),canWrite,`data-code="${esc(s.code)}"`)}<button class="btn sm quiet" type="button" data-act="open" data-kind="step" data-id="${esc(bid)}" data-code="${esc(s.code)}">Edit</button></div></div>`}).join("")}</div>`;
  return{title:c.label,body}}
const BPMARK={"Not Started":"","Foundations":"","Tactics In":"","In QA":"","Complete":"✓","Blocked":"!","N/A":"–"}; // the fill shows how far a section is

