/* ---------- platform access grid: brands down, platforms across ---------- */
function accessGrid(){
  const rows=withId(S.access);const order=L("platform");
  const used=[...new Set(rows.filter(a=>a.status!=="Not Needed").map(a=>a.platform).filter(Boolean))]
    .sort((a,b)=>(order.indexOf(a)<0?999:order.indexOf(a))-(order.indexOf(b)<0?999:order.indexOf(b))||a.localeCompare(b));
  const cell={};for(const a of rows){const k=a.brand+"|"+a.platform;(cell[k]=cell[k]||[]).push(a)}
  const allB=brandList().filter(b=>!isInternal(b));let bs=allB.filter(b=>tqMatch("acc",b));
  const missing=bid=>rows.filter(a=>a.brand===bid&&accOpen(a)).length;
  if(flt.accGap)bs=bs.filter(b=>missing(b.id)>0);
  bs.sort((x,y)=>(onHold(x)?1:0)-(onHold(y)?1:0));
  let h=`<p class="sub">Each row is a brand, each column a platform. Click a square to update it, or a + to add a platform the brand needs. Status only, never passwords.</p>
  <div class="legend">${L("access_status").map(v=>`<span><span class="acd ${cls(v)}">${esc(ACC_MARK[v]??"")}</span>${esc(v)}</span>`).join("")}<span><span class="acd acd-empty">+</span>Not tracked</span><span><i class="nsdot inl"></i>Has a next step</span><span><i class="chdot inl"></i>Needs a chase</span></div>
  <div class="filters">${findBox("acc",allB.length)}<div class="seg" role="group" aria-label="Show"><button data-act="accgap" data-v="0" class="${flt.accGap?"":"on"}">All brands</button><button data-act="accgap" data-v="1" class="${flt.accGap?"on":""}">Missing access only</button></div>
  ${canWrite?`<button class="btn" data-act="add-access" data-id="">Add another platform</button>`:""}</div>`;
  if(!used.length)return h+`<div class="tw"><div class="empty">No platforms tracked yet.</div></div>`;
  const pg=paged("acc",bs);bs=pg.rows;
  h+=`<div class="tw tpin"><table class="grid acc"><thead><tr><th class="stick">Brand</th>${used.map(p=>`<th class="pc"><span>${esc(p)}</span></th>`).join("")}<th>Access</th></tr></thead><tbody>`;
  for(const b of bs){const mine=rows.filter(a=>a.brand===b.id&&a.status!=="Not Needed");const g=mine.filter(accGranted).length;const bl=mine.some(a=>a.status==="Blocked");
    h+=`<tr class="${onHold(b)?"held":""}"><td class="stick"><a class="bname" href="#${brandHash(b.id,"access")}" title="Open ${esc(b.name)} platform access">${esc(b.name)}</a>${onHold(b)?` <span class="tag">On hold</span>`:""}</td>`;
    for(const p of used){const list=cell[b.id+"|"+p]||[];const a=list[0];
      if(a)h+=`<td class="gc"><button class="acd ${cls(a.status)}" data-act="open" data-kind="access" data-id="${esc(a._id)}" title="${esc(p+": "+(a.status||"Needed")+(a.next_step&&a.next_step.text?"\nNext: "+a.next_step.text:"")+((a.seats||[]).length?"\nLogins: "+a.seats.map(x=>x.p+" ("+x.s+")").join(", "):""))}">${esc(ACC_MARK[a.status]??"?")}${a.next_step&&a.next_step.text&&accOpen(a)?`<i class="nsdot" aria-hidden="true"></i>`:""}${needsChase(a)?`<i class="chdot" aria-hidden="true"></i>`:""}<span class="sr">${esc(p+" "+a.status)}</span></button>${list.length>1?`<span class="faint" style="font-size:12px">+${list.length-1}</span>`:""}</td>`;
      else h+=`<td class="gc">${canWrite?`<button class="acd acd-empty" data-act="acc-new" data-b="${esc(b.id)}" data-p="${esc(p)}" title="Add ${esc(p)} for ${esc(b.name)}">+<span class="sr">Add ${esc(p)}</span></button>`:`<span class="faint">·</span>`}</td>`}
    h+=`<td style="white-space:nowrap">${mine.length?(bl?pill("Blocked"):g===mine.length?pill("All Granted"):`<span class="pill s-warn">${mine.length-g} missing</span>`)+` <span class="faint">${g}/${mine.length}</span>`:`<span class="faint">None tracked</span>`}</td></tr>`}
  return h+`</tbody></table></div>`+pg.html}

