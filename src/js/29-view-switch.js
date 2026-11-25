/* ---------- view switch ---------- */
function viewSeg(k,cur,items){return`<div class="seg viewseg" role="group" aria-label="View">${items.map(([v,l])=>`<button data-act="${k}" data-v="${v}" class="${cur===v?"on":""}">${esc(l)}</button>`).join("")}</div>`}

