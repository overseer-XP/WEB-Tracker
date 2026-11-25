/* ---------- daily snapshot for trends ---------- */
function portfolioNumbers(bs,R){const active=bs.filter(b=>!onHold(b)&&!isInternal(b));
  const ws=weekStart(today()),we=new Date(ws);we.setDate(we.getDate()+7);
  return{active:active.length,blocked:active.filter(b=>R[b.id].health==="Blocked").length,risk:active.filter(b=>R[b.id].health==="At Risk").length,
    late:bs.filter(b=>!onHold(b)).reduce((a,b)=>a+R[b.id].overdue,0),
    signWeek:bs.filter(b=>{const d=parseD((S.sow[b.id]||{}).target_sign);return d&&d>=ws&&d<we&&(S.sow[b.id]||{}).stage!=="Signed"&&!onHold(b)}).length,
    signed:bs.filter(b=>(S.sow[b.id]||{}).stage==="Signed").length,live:bs.filter(b=>b.stage==="Live").length,onb:active.filter(inOnboarding).length}}
let snapTried="";
function keepSnapshot(n){const d=isoToday();if(!db||!canWrite||S.snaps[d]||snapTried===d||!ready.snaps)return;snapTried=d;
  db.doc("snapshots/"+d).set(Object.assign({date:d,at:Date.now()},n)).catch(()=>{})}
function compareSnap(){const target=new Date(today());target.setDate(target.getDate()-7);const t=isoToday();
  const olds=Object.values(S.snaps).filter(s=>s.date&&s.date<t).sort((a,b)=>a.date.localeCompare(b.date));if(!olds.length)return null;
  const before=olds.filter(s=>parseD(s.date)<=target);return before.length?before[before.length-1]:olds[0]}
function trendHtml(key,now,prev,goodDown){if(!prev||prev[key]===undefined)return"";const d=now-prev[key];
  if(!d)return`<em class="tr">same as ${esc(fmtD(prev.date))}</em>`;const good=goodDown?d<0:d>0;
  return`<em class="tr ${good?"up":"down"}">${d>0?"▲ +":"▼ "}${d} since ${esc(fmtD(prev.date))}</em>`}

