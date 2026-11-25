/* ---------- comments and activity per brand ---------- */
function mentionsIn(text){const ps=activePeople().slice().sort((a,b)=>b.length-a.length);const out=[];const low=(text||"").toLowerCase();
  for(const p of ps)if(low.includes("@"+p.toLowerCase())&&!out.includes(p))out.push(p);return out}
function linkMentions(text){let h=esc(text);for(const p of activePeople().slice().sort((a,b)=>b.length-a.length)){const re=new RegExp("@"+p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi");h=h.replace(re,m=>`<b class="mention">${m}</b>`)}return h}
function brandActivity(bid){const ids=new Set([bid]);for(const[id,t]of Object.entries(S.tasks))if(t.brand===bid)ids.add(id);for(const[id,a]of Object.entries(S.access))if(a.brand===bid)ids.add(id);
  const out=[];for(const d of Object.values(S.log))for(const e of d.entries||[])if(ids.has(e.id))out.push(Object.assign({person:d.person},e));return out.sort((a,b)=>b.at-a.at).slice(0,15)}
function updatesTab(bid){
  const cs=withId(S.comments).filter(c=>c.brand===bid&&c.kind!=="system").sort((a,b)=>b.at-a.at);
  let h=`<div class="cols2 upd"><div><h3 class="h3">Comments</h3>${canWrite?`<form id="cform" class="card cform"><label for="c-text" class="sr">Add a comment</label><textarea id="c-text" name="text" placeholder="Write an update. Type @ and a name to mention someone, for example @Noopur" required></textarea>
    <div class="row"><span class="faint" style="font-size:12px">Mentions show in that person's My tasks. Links only, never passwords or contract text.</span><span class="grow"></span><button class="btn pri" type="submit">Post</button></div><input type="hidden" name="brand" value="${esc(bid)}"></form>`:""}`;
  h+=cs.length?cs.map(c=>`<div class="cmt"><div class="row" style="gap:8px"><b>${esc(c.by||"Someone")}</b><span class="faint" style="font-size:12px">${esc(new Date(c.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}))}</span><span class="grow"></span>${canWrite&&(c.by===me||canEdit)?`<button class="btn sm quiet" data-act="del-comment" data-id="${esc(c._id)}">Delete</button>`:""}</div><div class="ctext">${c.access&&S.access[c.access]?`<span class="tag">${esc(S.access[c.access].platform)}</span> `:""}${c.task&&S.tasks[c.task]?`<span class="tag">${esc(S.tasks[c.task].title)}</span> `:""}${linkMentions(c.text)}</div></div>`).join("")
    :`<div class="empty card">No comments yet. Post the first update for ${esc(bname(bid))} above.</div>`;
  const act=brandActivity(bid);
  h+=`</div><div><h3 class="h3">Recent changes</h3>${act.length?`<div class="card actlist">${act.map(e=>`<div class="act"><span class="faint">${esc(new Date(e.at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}))}</span> <b>${esc(e.person||"Someone")}</b> changed ${esc(e.field)} on ${esc(e.label||e.id)}${e.new!==undefined&&e.new!==""&&e.field!=="created"?` to <i>${esc(String(e.new).slice(0,60))}</i>`:""}</div>`).join("")}</div>`:`<div class="empty card">No changes recorded in the last 30 days.</div>`}</div></div>`;
  return h}
function myMentions(person){const since=Date.now()-14*DAY;return withId(S.comments).filter(c=>c.at>since&&(c.mentions||[]).some(m=>isPerson(m,person))).sort((a,b)=>b.at-a.at)}

