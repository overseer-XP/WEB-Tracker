/* ---------- Brand ---------- */
function vBrand(id){
  const b=S.brands[id];if(!b)return`<h1>Brand not found</h1><p class="sub">It may have been removed. <a href="#overview">Back to the overview</a>.</p>`;
  const r=roll(id);const ed=canEdit&&canWrite;
  const note=r.hold?`<div class="notice">${esc(b.name)} is on hold${b.paused&&b.stage!=="On Hold"?" (marked paused)":""}. Its tasks, SOW and late items are left out of the Overview counts and the SOW signing plan.${ed?" Change the stage or untick Paused in Edit details to bring it back.":""}</div>`:"";
  if(!SECT[brandTab]||brandTab==="home")return note+brandHome(id,r);
  let h=note+brandBar(id,r);
  if(brandTab==="updates")h+=updatesTab(id);else if(brandTab==="sow")h+=roadPage(id);else if(brandTab==="access")h+=accessTable(id);else if(brandTab==="bp")h+=bpCard(id);else h+=tasksTab(id);
  return h}
