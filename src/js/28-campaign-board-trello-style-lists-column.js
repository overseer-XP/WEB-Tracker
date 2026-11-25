/* ---------- campaign board, Trello style: lists (columns) the team names; by default one list per team ---------- */
// Lists live on the campaign (or on the brand for work not in a campaign). A list linked to a team moves a card into that team.
const boardOwner=(bid,cid)=>cid&&cid!==NOCAMP?{c:"camps",id:cid,doc:S.camps[cid]||{}}:{c:"brands",id:bid,doc:S.brands[bid]||{}};
function boardLists(bid,cid,ts){const own=boardOwner(bid,cid);const lists=(own.doc.lists||[]).map(x=>Object.assign({},x));
  for(const d of DEPTS())if(!lists.some(l=>l.team===d)&&ts.some(t=>!lists.some(l=>l.id===t.list)&&depOf(t)===d))lists.push({id:"team:"+d,name:d,team:d});
  return lists}
const listOf=(t,lists)=>lists.find(l=>l.id===t.list)||lists.find(l=>l.team===depOf(t))||lists[0];
function saveLists(bid,cid,lists,label){const own=boardOwner(bid,cid);return save(own.c,own.id,{lists:lists.map(l=>l.team?{id:l.id,name:l.name,team:l.team}:{id:l.id,name:l.name})},label)}
function moveCard(id,listId,bid,cid){const t=S.tasks[id];if(!t)return;const lists=boardLists(bid,cid,withId(S.tasks).filter(x=>x.brand===bid&&x.title&&campOf(x)===(cid||NOCAMP)));const l=lists.find(x=>x.id===listId);if(!l)return;
  if(listOf(Object.assign({_id:id},t),lists)===l)return;
  if(!canChangeTask(t)){toast("Only the owner, the support team or a lead can move this card.");render();return}
  const p={list:l.id};if(l.team&&l.team!==depOf(t))p.department=l.team;save("tasks",id,p,t.title);taskNote(t,id,`Moved to ${l.name}`)}
function listBoard(bid,cid,ts){
  const lists=boardLists(bid,cid,ts);const f=kbFilter;let rows=ts;
  if(f.q){const q=f.q.toLowerCase();rows=rows.filter(t=>(t.title||"").toLowerCase().includes(q))}
  if(f.st){rows=rows.filter(t=>bucketOf(t)===f.st);if(f.st==="Done")f.done=true}
  if(f.who)rows=rows.filter(t=>isPerson(t.owner,f.who)||(t.support||[]).some(x=>isPerson(x,f.who)));
  if(f.due==="week")rows=rows.filter(t=>{const d=parseD(t.deadline);return d&&t.status!=="Complete"&&(d-today())/DAY<=7});
  if(f.due==="none")rows=rows.filter(t=>!t.deadline&&t.status!=="Complete");
  const nDone=rows.filter(t=>t.status==="Complete").length;if(!f.done)rows=rows.filter(t=>t.status!=="Complete");
  const ppl=[...new Set(ts.flatMap(t=>[t.owner].concat(t.support||[])).filter(Boolean))].sort();const camp=cid&&cid!==NOCAMP?cid:"";
  let h=`<div class="kbbar"><input class="kbq" id="kb-q" type="search" placeholder="Find a card" value="${esc(f.q||"")}" aria-label="Find a card">${f.st?`<button class="lchip on" data-act="kbst-clear" title="Clear">${esc(f.st)} ×</button>`:""}<label class="tl">Person <select data-act="kbf" data-k="who"><option value="">Everyone</option>${ppl.map(p=>`<option ${f.who===p?"selected":""}>${esc(p)}</option>`).join("")}</select></label>
   <label class="tl">Due <select data-act="kbf" data-k="due"><option value="">Any time</option><option value="week" ${f.due==="week"?"selected":""}>Late or due this week</option><option value="none" ${f.due==="none"?"selected":""}>No due date</option></select></label>
   <label class="tl"><input type="checkbox" data-act="kbdone" ${f.done?"checked":""}> Show done cards (${nDone})</label>
   ${f.who||f.due||f.q||f.st?`<button class="btn sm quiet" data-act="kbf-clear">Clear filters</button>`:""}<span class="grow"></span><span class="faint" style="font-size:12.5px">${canWrite?"Drag cards between lists. Click a list name to rename it. Click a card to open it.":"Click a card to open it."}</span></div><div class="kb" role="list">`;
  for(const l of lists){const col=rows.filter(t=>listOf(t,lists)===l).sort(byUrgency);const open=col.filter(t=>t.status!=="Complete").length;const all=ts.filter(t=>listOf(t,lists)===l).length;
    h+=`<section class="kcol" role="listitem" aria-label="${esc(l.name)}, ${col.length} cards" style="--tc:${l.team?teamColor(l.team):"var(--accent)"}"><header>${canWrite?`<button class="kname" data-act="kl-rename" data-l="${esc(l.id)}" data-id="${esc(bid)}" data-camp="${esc(cid||"")}" title="${esc(l.name)}: click to rename">${esc(l.name)}</button>`:`<b class="kname">${esc(l.name)}</b>`}<span class="kn">${open}</span>
     ${canWrite&&!all?`<button class="btn sm quiet" data-act="kl-del" data-l="${esc(l.id)}" data-id="${esc(bid)}" data-camp="${esc(cid||"")}" aria-label="Delete empty list ${esc(l.name)}">Delete</button>`:""}</header>
     <div class="kcards" data-list="${esc(l.id)}" data-id="${esc(bid)}" data-camp="${esc(cid||"")}">${col.map(t=>kbCard(t,false,l.team===depOf(t))).join("")||`<span class="kempty">No cards</span>`}</div>
     ${canWrite?`<button class="kadd" data-act="kb-add" data-l="${esc(l.id)}" data-id="${esc(bid)}" data-camp="${esc(camp)}" data-dep="${esc(l.team||"")}">+ Add a card</button>`:""}</section>`}
  if(canWrite)h+=`<button class="kcol knew" data-act="kl-add" data-id="${esc(bid)}" data-camp="${esc(cid||"")}">+ Add another list</button>`;
  else if(!lists.length)h+=`<div class="empty">No cards yet.</div>`;
  return h+`</div>`}

