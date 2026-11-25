/* ---------- roll-ups (from the Excel formulas) ---------- */
function bpRoll(bid){const d=S.bps[bid];if(!d)return null;const secs=L("bp_section");const vals=secs.map(x=>(d.sections||{})[x]||"Not Started");
  const live=vals.filter(v=>v!=="N/A");const done=live.filter(v=>v==="Complete").length;const progress=live.length?done/live.length:0;
  let overall="In Progress";
  if(vals.includes("Blocked"))overall="Blocked";else if(done===live.length)overall="Complete";else if(vals.every(v=>v==="Not Started"||!v))overall="Not Started";else if(vals.includes("In QA"))overall="In QA";
  return{overall,progress,done,total:live.length,due:dueFlag(d.due_date,progress===1)}}
function accessRoll(bid){const rows=Object.values(S.access).filter(a=>a.brand===bid&&a.status!=="Not Needed");const g=rows.filter(accGranted).length;
  let s="Not Set Up";if(rows.length)s=rows.some(a=>a.status==="Blocked")?"Blocked":g===rows.length?"All Granted":"In Progress";return{summary:s,text:rows.length?g+" / "+rows.length:""}}
const sowDue=s=>!s||s.stage==="Signed"?"":dueFlag(s.target_sign||s.draft_due,false);
/* Road to SOW: the one progress number for a brand, used on every screen and in the export.
   Required steps only (optional steps never hold a brand back); Done or N/A counts as done, so 100% means every phase is done. */
/* one rule for a late SOW, used by every page: active brand, SOW not signed, target date passed */
const sowIsLate=b=>{const s=S.sow[b.id]||{};const d=parseD(s.target_sign);return!!b&&!onHold(b)&&!isInternal(b)&&s.stage!=="Signed"&&!!d&&d<today()};
const sowLate=()=>brandList().filter(sowIsLate);
function journeyCount(bid){let total=0,done=0;for(const s of stepsSorted()){if(s.is_optional)continue;total++;if(["Done","N/A"].includes(stepState(bid,s.code).status))done++}return{done,total}}
function onboarding(bid){const c=journeyCount(bid);return c.total?c.done/c.total:0}
function roll(bid){return memo("roll:"+bid,()=>rollNow(bid))}
function tasksOf(bid){return memo("tasksBy",()=>{const m={};for(const t of Object.values(S.tasks))if(t.title)(m[t.brand]=m[t.brand]||[]).push(t);return m})[bid]||[]}
function rollNow(bid){
  const b=S.brands[bid]||{};
  const ts=tasksOf(bid);
  const open=ts.filter(t=>t.status!=="Complete").length;
  const blocked=ts.filter(t=>t.status==="Blocked").length;
  const overdue=ts.filter(t=>dueFlag(t.deadline,t.status==="Complete")==="Overdue").length;
  const acc=accessRoll(bid);const s=S.sow[bid];const sow=isInternal(b)?"N/A":(s?(s.stage||"Not Started"):"Not Set");
  const bp=bpRoll(bid);const pct=onboarding(bid);
  const why=[];let whyTab="";const reason=(t,tab)=>{why.push(t);if(!whyTab)whyTab=tab};
  if(sow==="Blocked")reason("SOW blocked"+(s&&s.blocker?": "+s.blocker:""),"sow");
  if(acc.summary==="Blocked")reason("Platform access blocked","access");
  if(bp&&bp.overall==="Blocked")reason("Best Practices blocked","bp");
  for(const st of stepsSorted())if(st.is_gate){const x=stepState(bid,st.code);if(x.blocker&&x.blocker.text&&!["Done","N/A"].includes(x.status))reason("Gate step blocked: "+st.name,"steps")}
  for(const t of ts)if(t.status==="Blocked"&&["High","Urgent"].includes(t.priority))reason(t.title+(t.blocker&&t.blocker.text?": "+t.blocker.text:""),"tasks");
  const sowLateNow=sowIsLate(Object.assign({id:bid},b));
  let health="On Track";
  if(onHold(b))health="On Hold";
  else if(why.length)health="Blocked";
  else if(overdue>0||sowLateNow)health="At Risk";else if(blocked>0)health="Has blockers";else if(sow==="Signed")health="Live";
  return{open,blocked,overdue,acc,sow,sowRow:s||{},bp,pct,health,why,whyTab,hold:onHold(b),stepBlocked:stepBlocks(bid)}}

