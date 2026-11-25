/* ---------- people and capacity ---------- */
let peopleSel="",peopleVert="",peopleDept="",peopleView="work",orgDrag="";
/* team structure: org teams as columns, people nested under the person they report to (people.reports_to) */
const orgPeople=()=>people().filter(p=>p.active!==false&&p.kind==="team");
function orgTeams(){const ps=orgPeople();const t=L("org_team").slice();if(ps.some(p=>!p.team||!t.includes(p.team)))t.push("");return t}
function orgUnder(name,ps){return ps.filter(p=>p.reports_to===name)}
function isBelow(a,b,ps){let cur=ps.find(p=>p.name===b);const seen=new Set();while(cur&&cur.reports_to&&!seen.has(cur.name)){seen.add(cur.name);if(cur.reports_to===a)return true;cur=ps.find(p=>p.name===cur.reports_to)}return false}
function orgCard(p,ps,team){const kids=orgUnder(p.name,ps).filter(k=>(k.team||"")===team);const ed=canEdit&&canWrite;const boss=p.reports_to&&!ps.some(x=>x.name===p.reports_to&&(x.team||"")===team)?p.reports_to:"";
  return`<li><div class="orgc" ${ed?`draggable="true"`:""} data-org="${esc(p.name)}" data-orgdrop="person" data-act="org-edit" tabindex="0" role="button" aria-label="${esc((p.full_name||p.name)+(p.title?", "+p.title:"")+". "+(ed?"Click to edit or move":"Click for details"))}">
    <span class="av big">${esc(ini(p.full_name||p.name))}</span><span class="orgt"><b>${esc(p.full_name||p.name)}</b><small>${esc(p.title||"No title yet")}</small>${p.location?`<small class="faint">${esc(p.location)}</small>`:""}
    <span class="orgb">${p.leadership?`<span class="pillx px-info">Leadership</span>`:""}${p.escalate?`<span class="pillx px-em">Can escalate</span>`:""}${p.log?`<span class="pillx px-ok">Change log</span>`:""}${boss?`<span class="pillx px-off">Reports to ${esc(boss)}</span>`:""}</span></span></div>
    ${kids.length?`<ul>${kids.map(k=>orgCard(k,ps,team)).join("")}</ul>`:""}</li>`}
function orgChart(){const ps=orgPeople();const ed=canEdit&&canWrite;const teams=orgTeams();
  const col=t=>{const mem=ps.filter(p=>(t?p.team===t:!p.team||!L("org_team").includes(p.team)));const roots=mem.filter(p=>!p.reports_to||!mem.some(x=>x.name===p.reports_to));
    return`<section class="orgcol ${t===teams[0]?"lead":""}" data-orgdrop="team" data-team="${esc(t)}" aria-label="${esc(t||"No team")}"><header><b>${esc(t||"No team yet")}</b><span class="faint">${mem.length}</span></header>${roots.length?`<ul class="orgtree">${roots.map(p=>orgCard(p,ps,t)).join("")}</ul>`:`<p class="faint">${ed?"Drop a person here":"Nobody yet"}</p>`}</section>`};
  return`<p class="hint2">${ed?`<span class="dt">Drag a person onto a team to move them, or onto a person to report to them. Click</span><span class="ph">Tap</span> a person to edit their title, team, manager and roles${matchMedia("(max-width:600px)").matches?", or to move them":""}.`:"Who is in which team and who reports to whom. Leads and admins can change it."}</p>
   <div class="orgwrap">${col(teams[0])}<div class="orgcols">${teams.slice(1).map(col).join("")}</div></div>`}
function orgMove(name,patch,label){const ps=people().map(p=>Object.assign({},p));const p=ps.find(x=>x.name===name);if(!p)return;
  if(patch.reports_to&&(patch.reports_to===name||isBelow(name,patch.reports_to,ps))){toast("That would make a loop: "+patch.reports_to+" already reports to "+name+".");return}
  Object.assign(p,patch);savePeople(ps,label||name)}
/* Org structure: team members and their access, and the team chart (admins only) */
let orgTab="people",orgF="team",orgSel="",MEM=null,memApi=null;
/* VALFLO access per person: live from the website sign-in list; on claude.ai from the last copy saved in config/signin */
const ACC_ROLES=[["lead","Admin"],["member","Member"],["view","View only"],["none","No sign-in"]];
function memRow(n){if(!MEM)return null;const p=personOf(n)||{name:n};return MEM.find(m=>m.active!==false&&isPerson(m.person,p.name))||null}
function roleOf(n){if(MEM){const r=memRow(n);return r?r.role:"none"}const m=(S.config.signin||{}).roles||{};return m[n]||"none"}
const roleLabel=r=>(ACC_ROLES.find(x=>x[0]===r)||[0,"No sign-in yet"])[1].replace(/^No sign-in$/,"No sign-in yet");
const roleCls=r=>r==="lead"?"ad":r==="member"?"me":r==="view"?"vi":"no";
async function syncSigninCopy(){if(!MEM)return;const roles={};for(const m of MEM)if(m.active!==false&&m.person)roles[m.person]=m.role;
  if(S.config.signin)await save("config","signin",{roles},"Sign-in list copy");else await create("config","signin",{roles},"Sign-in list copy")}
async function setRole(name,role){if(!memApi){toast("Change access on the website. On claude.ai, access comes from the page's Share menu.");return}
  const row=memRow(name);
  if(role==="none"){if(!row)return;await memApi.update(row.email,{active:false})}
  else if(row)await memApi.update(row.email,{role,active:true});
  else{formBox("Give "+name+" a sign-in",`<div class="f"><label for="n-em">Work email</label><input id="n-em" name="email" type="email" required placeholder="name@valeriegroup.com"></div><p class="faint" style="margin:0 0 10px;font-size:13px">They sign in with a code sent to this email. Access: ${esc(roleLabel(role))}.</p>`,"Give access",v=>{const em=(v.email||"").trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em)){toast("Type a full email.");return false}
      memApi.add({email:em,person:name,role,active:true}).then(async()=>{MEM=await memApi.list();await syncSigninCopy();toast(name+" can now sign in");render()}).catch(()=>toast("Could not save. Only website admins can change access."))});return}
  MEM=await memApi.list();await syncSigninCopy();toast(name+": "+roleLabel(role));render()}
function vOrg(){const tabs=[["people","Team members and access"],["chart","Team chart"]];
  let h=`<h1>Org structure</h1>`;
  if(orgTab==="chart")return h+`<p class="sub">Who works at Valerie, which team they sit in and who they report to. Drag a person onto a team or onto the person they report to.</p><div class="tabs">${tabs.map(([k,l])=>`<button class="${orgTab===k?"on":""}" data-act="orgtab" data-tab="${k}">${esc(l)}</button>`).join("")}</div>`+orgChart();
  const ps=people();const grp=p=>p.active===false?"inactive":p.kind==="unconfirmed"?"unconfirmed":p.kind==="external"||p.kind==="group"?"external":"team";
  const team=ps.filter(p=>grp(p)==="team");const signin=team.filter(p=>roleOf(p.name)!=="none").length;
  const order=L("org_team");const rows=ps.map((p,i)=>({p,i})).filter(x=>grp(x.p)===orgF).sort((a,b)=>{const x=order.indexOf(a.p.team),y=order.indexOf(b.p.team);return(x<0?99:x)-(y<0?99:y)||a.p.name.localeCompare(b.p.name)});
  const cnt=k=>ps.filter(p=>grp(p)===k).length;const M=s=>`<span class="faint">${s}</span>`;
  h+=`<p class="sub">Who works at Valerie, which team they sit in, who they report to, and what each person can do in VALFLO. Click a person to change any of it. ${team.length} team members; ${signin} of them can sign in${MEM?" to the website":""}.</p>
   <div class="tabs">${tabs.map(([k,l])=>`<button class="${orgTab===k?"on":""}" data-act="orgtab" data-tab="${k}">${esc(l)}</button>`).join("")}</div>
   <div class="orgkey"><b>Access in VALFLO:</b><span><span class="oac ad">Admin</span> changes settings, steps and people</span><span><span class="oac me">Member</span> edits work</span><span><span class="oac vi">View only</span> reads</span><span><span class="oac no">No sign-in yet</span> not on the website sign-in list</span>${MEM?"":`<span class="faint">On claude.ai this shows the website list as last copied; claude.ai access itself comes from the page's Share menu.</span>`}</div>
   <div class="orgbar">${[["team","Team members"],["external","External and groups"],["unconfirmed","Names to sort"],["inactive","Inactive"]].map(([k,l])=>`<button class="ochip ${orgF===k?"on":""}" data-act="orgf" data-v="${k}">${l} ${cnt(k)}</button>`).join("")}<span class="grow"></span>${canWrite?`<button class="btn pri" data-act="add-person">Add person</button>`:""}</div>
   <div class="orgwrap"><div class="tw"><table class="orgtable"><thead><tr>${sortTh("org","name","Name")}<th>Title</th>${sortTh("org","team","Team")}${sortTh("org","rep","Reports to")}${sortTh("org","loc","Location")}${sortTh("org","acc","Access in VALFLO")}<th>Extra rights</th></tr></thead><tbody>`;
  for(const{p,i}of tsortRows("org",rows,{name:x=>x.p.name,team:x=>x.p.team||"~",rep:x=>x.p.reports_to||"~",loc:x=>x.p.location||"~",acc:x=>String(roleOf(x.p.name))})){const r=roleOf(p.name);const ex=[["leadership","Leadership page"],["log","Change log"],["escalate","Can escalate"]].filter(([k])=>p[k]).map(x=>x[1]);
    h+=`<tr class="click ${orgSel===p.name?"sel":""}" data-act="org-pick" data-name="${esc(p.name)}"><td><b>${esc(p.name)}</b>${p.full_name?`<small>${esc(p.full_name)}</small>`:""}</td><td>${p.title?esc(p.title):M("Not set")}</td><td>${p.team?esc(p.team):M("Not set")}</td><td>${p.reports_to?esc(p.reports_to):M("Nobody")}</td><td>${p.location?esc(p.location):M("Not set")}</td><td><span class="oac ${roleCls(r)}">${esc(roleLabel(r))}</span></td><td>${ex.length?esc(ex.join(" · ")):M("None")}</td></tr>`}
  if(!rows.length)h+=`<tr><td colspan="7"><div class="empty">Nobody here.</div></td></tr>`;
  h+=`</tbody></table></div>`;
  const sp=ps.findIndex(p=>p.name===orgSel);
  if(sp>=0){const p=ps[sp];const r=roleOf(p.name);const ed=canEdit&&canWrite;const dis=ed?"":"disabled";const F=(l,inner)=>`<div class="of"><label>${l}</label>${inner}</div>`;
    const ti=(f,ph)=>`<input data-act="person" data-i="${sp}" data-f="${f}" value="${esc(p[f]||"")}" placeholder="${esc(ph||"")}" ${dis} aria-label="${esc(f)}">`;
    const ck=(f,l)=>`<label class="ock"><input type="checkbox" data-act="person" data-i="${sp}" data-f="${f}" ${p[f]?"checked":""} ${dis}> ${l}</label>`;
    h+=`<aside class="orgside"><div class="row" style="justify-content:space-between"><h3>${esc(p.name)}</h3><button class="btn sm quiet" data-act="org-pick" data-name="" aria-label="Close">✕</button></div>${p.full_name?`<div class="faint">${esc(p.full_name)}</div>`:""}
      ${F("Full name",ti("full_name",""))}${F("Title",ti("title",""))}${F("Team",`<select data-act="person" data-i="${sp}" data-f="team" ${dis} aria-label="Team">${opts(L("org_team"),p.team||"")}</select>`)}
      ${F("Reports to",`<select data-act="person" data-i="${sp}" data-f="reports_to" ${dis} aria-label="Reports to">${opts(activePeople().filter(n=>n!==p.name),p.reports_to||"")}</select>`)}${F("Location",ti("location","For example: India (Delhi)"))}
      ${F("Access in VALFLO",`<div class="oseg">${ACC_ROLES.map(([k,l])=>`<button type="button" class="${r===k?"on":""}" data-act="org-role" data-name="${esc(p.name)}" data-v="${k}" ${ed&&memApi?"":"disabled"}>${l}</button>`).join("")}</div><div class="faint" style="font-size:12px;margin-top:4px">${memApi?"Changes the website sign-in list straight away.":"Change this on the website. claude.ai access comes from the page's Share menu."}</div>`)}
      ${F("Extra rights",ck("leadership","Opens the Leadership page")+ck("log","Sees the change log")+ck("escalate","Can send items straight to leadership"))}
      ${F("Other spellings",`<input data-act="person" data-i="${sp}" data-f="aliases" value="${esc((p.aliases||[]).join(", "))}" placeholder="Separated by commas" ${dis} aria-label="Other spellings">`)}
      ${F("Type",`<select data-act="person" data-i="${sp}" data-f="kind" ${dis} aria-label="Type">${opts(["team","external","group","unconfirmed"],p.kind||"team",false)}</select>`)}
      ${F("Status",ck("active","Active (shows in name lists)"))}</aside>`}
  return h+`</div>`}

