/* ---------- needs attention: the exceptions leadership should act on ---------- */
function attention(bs,R){const out=[];
  for(const b of bs){if(isInternal(b)||onHold(b))continue;const r=R[b.id];const s=S.sow[b.id]||{};const add=(kind,text,tab)=>out.push({b,kind,text,tab});
    if(r.health==="Blocked")add("Blocked",r.why[0]||"Blocked",r.whyTab||"tasks");
    if(s.target_sign&&s.stage!=="Signed"&&dayDiff(s.target_sign)<0)add("Past SOW target",`Target ${fmtD(s.target_sign,true)}, SOW ${s.stage||"Not Started"}`,"sow");
    if(b.stage==="Live"&&s.stage&&s.stage!=="Signed")add("Stage mismatch",`Brand is Live but the SOW is ${s.stage}`,"sow");
    if(s.stage==="Signed"&&b.stage!=="Live")add("Stage mismatch",`SOW is Signed but the brand is at ${b.stage}`,"sow");
    const ch=withId(S.access).filter(a=>a.brand===b.id&&needsChase(a));if(ch.length)add("Chase founder",`${ch.map(a=>a.platform).join(", ")}: asked ${chaseDays()}+ working days ago`,"access");
    const lu=lastUpdated(b.id);if(lu&&Date.now()-lu>7*DAY)add("No update",`Nothing changed for ${Math.floor((Date.now()-lu)/DAY)} days`,"updates")}
  const order={"Blocked":0,"Past SOW target":1,"Chase founder":2,"Stage mismatch":3,"No update":4};
  return out.sort((x,y)=>order[x.kind]-order[y.kind])}
function hygiene(){const open=withId(S.tasks).filter(t=>t.title&&t.status!=="Complete"&&!holdOf(t.brand));
  return[["High or Urgent tasks with no deadline",open.filter(t=>["High","Urgent"].includes(t.priority)&&!t.deadline).length,"people"],
    ["Open tasks with no owner",open.filter(t=>!t.owner).length,"people"],
    ["Brands with no brand lead",brandList().filter(b=>!isInternal(b)&&!b.lead).length,"overview"],
    ["SOWs with no owner",Object.entries(S.sow).filter(([id,s])=>S.brands[id]&&!onHold(S.brands[id])&&!s.owner).length,"sow"]].filter(x=>x[1])}

