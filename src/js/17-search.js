/* ---------- search ---------- */
let searchQ="";
function searchResults(q){q=q.trim().toLowerCase();if(q.length<2)return[];const out=[];
  for(const b of brandList())if(b.name.toLowerCase().includes(q))out.push({type:"Brand",label:b.name,sub:b.stage,go:"brand-"+b.id});
  for(const p of activePeople())if(p.toLowerCase().includes(q))out.push({type:"Person",label:p,sub:"Open their work",person:p});
  for(const t of withId(S.tasks))if(t.title&&t.title.toLowerCase().includes(q))out.push({type:"Task",label:t.title,sub:bname(t.brand)+" · "+(t.status||""),task:t._id});
  for(const s of stepsSorted())if(s.name.toLowerCase().includes(q))out.push({type:"Step",label:s.code+" "+s.name,sub:"Onboarding step",step:s.code});
  return out.slice(0,14)}
function renderSearch(){const box=$("#sres");if(!box)return;const rs=searchResults(searchQ);
  box.hidden=!searchQ.trim()||searchQ.trim().length<2;
  box.innerHTML=rs.length?rs.map((r,i)=>`<button class="sr-row" data-act="search-go" data-i="${i}"><span class="sr-type">${esc(r.type)}</span><span class="sr-l">${esc(r.label)}</span><span class="faint sr-s">${esc(r.sub||"")}</span></button>`).join(""):`<div class="sr-none">Nothing matches "${esc(searchQ)}".</div>`}

