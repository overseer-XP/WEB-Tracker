/* ---------- view switch ---------- */
const VIEW_ICON={board:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2.5" width="5" height="5" rx="1.2"/><rect x="9" y="2.5" width="5" height="5" rx="1.2"/><rect x="2" y="9.5" width="5" height="4" rx="1.2"/><rect x="9" y="9.5" width="5" height="4" rx="1.2"/></svg>',list:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>'};
function viewSeg(k,cur,items){return`<div class="viewseg2" role="tablist" aria-label="View">${items.map(([v,l])=>`<button role="tab" aria-selected="${cur===v}" data-act="${k}" data-v="${v}" class="${cur===v?"on":""}">${VIEW_ICON[v]||""}<span>${esc(l)}</span></button>`).join("")}</div>`}

