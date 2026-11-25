/* ---------- brand sections: one tile per area, each shows its own state ---------- */
function brandTiles(id,r){
  const b=S.brands[id]||{};const cs=campsOf(id);const ps=phases();const cur=curPhase(id);
  const ar=withId(S.access).filter(a=>a.brand===id&&a.status!=="Not Needed");const g=ar.filter(accGranted).length;const wf=ar.filter(a=>ACC_FOUNDER.includes(a.status)).length;const ch=ar.filter(needsChase).length;
  const s=r.sowRow;const due=sowDue(s);const bp=r.bp;const locked=bp?L("bp_section").filter(x=>((S.bps[id].sections||{})[x]||"Not Started")==="Not Started"&&(bpAccess(id,x)||{}).state==="locked").length:0;
  const nc=Object.values(S.comments).filter(c=>c.brand===id&&c.kind!=="system").length;
  const tiles=[
    ["tasks",cs.length?"Campaigns":"Tasks",cs.length?`${cs.length} campaign${cs.length>1?"s":""}`:`${r.open} open`,(cs.length?[`${r.open} open`]:[]).concat(r.blocked?[r.blocked+" blocked"]:[],r.overdue?[r.overdue+" late"]:[]).join(" · ")||(cs.length?"":"Nothing blocked or late"),r.blocked?"bad":r.overdue?"warn":"ok"],
    ["sow",isInternal(b)?"Onboarding":"Road to SOW",Math.round(r.pct*100)+"%",isInternal(b)?(cur?`Now: ${cur.code} ${cur.name}`:"Every phase done"):r.hold?"On hold, target kept":`SOW ${r.sow}${r.sow!=="Signed"&&s.target_sign?`, target ${fmtD(s.target_sign)}${due==="Overdue"?" passed":""}`:""}`,r.stepBlocked||(!isInternal(b)&&!r.hold&&(r.sow==="Blocked"||due==="Overdue"))?"bad":isInternal(b)||r.hold?(cur?"info":"ok"):r.sow==="Signed"?"ok":due==="Due Soon"?"warn":"info"],
    ["bp","Best Practices",bp?`${bp.done} of ${bp.total}`:"Not started",bp?(locked?`${locked} waiting on access`:bp.overall):"Not tracked yet",bp?(bp.overall==="Blocked"?"bad":bp.overall==="Complete"?"ok":locked?"warn":"info"):"off"],
    ["updates","Updates",nc?String(nc):"None",lastUpdated(id)?"Last change "+agoText(lastUpdated(id)):"No activity yet","off"]];
  return tiles}
