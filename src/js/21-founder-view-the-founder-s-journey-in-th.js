/* ---------- Founder view: the founder's journey in the founder-facing stages (config/founder_view), nothing internal ---------- */
function founderStages(){const c=S.config.founder_view;if(c&&Array.isArray(c.stages)&&c.stages.length)return c.stages;
  return phases().map(p=>({name:p.name,desc:"",steps:p.steps.map(x=>x.code)}))}
function founderModel(bid){const b=S.brands[bid]||{};const s=S.sow[bid]||{};
  const st=founderStages().map(g=>{const codes=(g.steps||[]).filter(c=>S.steps[c]&&!S.steps[c].is_optional);const v=codes.map(c=>stepState(bid,c).status||"Not Started");const live=v.filter(x=>x!=="N/A");
    const done=live.filter(x=>x==="Done").length;const state=!live.length?(codes.length?"Done":"Not started"):done===live.length?"Done":live.some(x=>x==="Done"||x==="In Progress")?"In progress":"Not started";
    return{name:g.name,desc:g.desc||"",state,done,total:live.length}});
  let far=-1;st.forEach((x,i)=>{if(x.state!=="Not started")far=i});let cur=far<0?0:st[far].state!=="Done"?far:st.findIndex((x,i)=>i>far&&x.state!=="Done");if(cur<0)cur=st.findIndex(x=>x.state!=="Done");if(cur<0)cur=st.length-1;
  const need=withId(S.access).filter(a=>a.brand===bid&&ACC_FOUNDER.includes(a.status)).map(a=>a.platform).filter(Boolean);
  return{name:b.name,hold:onHold(b),stages:st,cur,doneCount:st.filter(x=>x.state==="Done").length,target:s.target_sign||"",signed:s.stage==="Signed",need:[...new Set(need)],date:isoToday()}}
const fvLogo=()=>LOGO.replace('class="logo"','class="fvlogo"');
const FV_CSS=`.fv{--fvink:#141414;--fvmuted:#5B5B5B;--fvtan:#DCC28F;--fvtan2:#F1E5C9;--fvcream:#FAF8F4;--fvnavy:#0A0A70;background:var(--fvcream);color:var(--fvink);border-radius:20px;padding:32px 32px 28px;max-width:1120px;font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif}
.fv .fvtop{display:flex;align-items:center;gap:14px;margin-bottom:6px}.fv .fvlogo{width:30px;height:auto;fill:#EA9F44}.fv .fvey{font-size:12.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--fvmuted)}
.fv h1{font-size:34px;line-height:1.1;margin:6px 0 4px;font-weight:700;letter-spacing:-.01em;color:var(--fvink)}.fv .fvdate{color:var(--fvmuted);font-size:14px;margin:0 0 22px}
.fv .fvnow{background:#fff;border-radius:16px;padding:20px 22px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:18px;align-items:center;margin-bottom:22px}
.fv .fvnum{width:64px;height:64px;border-radius:50%;background:var(--fvnavy);color:#fff;display:grid;place-items:center;font-size:26px;font-weight:700}
.fv .fvnow b{display:block;font-size:20px}.fv .fvnow div>span{color:var(--fvmuted)}.fv .fvpct{text-align:right}.fv .fvpct b{font-size:26px}
.fv .fvbar{height:8px;border-radius:4px;background:var(--fvtan2);margin-top:8px;overflow:hidden}.fv .fvbar i{display:block;height:100%;background:var(--fvnavy)}
.fv .fvtrack{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:10px;list-style:none;margin:0 0 22px;padding:0}
.fv .fvst{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px}
.fv .fvst .fvtag{font-size:12px;font-weight:700;padding:4px 10px;border-radius:7px;background:var(--fvtan);border:1px solid #B89A5E;color:var(--fvink)}
.fv .fvst .circ{width:100%;aspect-ratio:1;max-width:150px;border-radius:50%;border:1.5px solid var(--fvink);display:grid;place-items:center;padding:12px;font-size:13.5px;font-weight:500;line-height:1.25;background:#fff;overflow-wrap:anywhere}
.fv .fvst .fvcard{width:100%;min-height:118px;border-radius:14px;background:var(--fvtan2);border:1px solid #CDB27A;padding:12px 10px;font-size:13px;line-height:1.4;display:flex;flex-direction:column;justify-content:center;gap:8px}
.fv .fvnm{display:none}.fv .fvst .state{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.fv .fvst.fvdone .circ{background:var(--fvtan);border-color:#9C7F45}.fv .fvst.fvdone .state{color:#2F6B43}
.fv .fvst.fvcur .circ{background:var(--fvnavy);color:#fff;border-color:var(--fvnavy);box-shadow:0 0 0 5px rgb(10 10 112/.15)}.fv .fvst.fvcur .fvcard{background:#fff;border-color:var(--fvnavy)}.fv .fvst.fvcur .state{color:var(--fvnavy)}
.fv .fvst.fvnext .state{color:var(--fvmuted)}
.fv .fvgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.fv .fvbox{background:#fff;border-radius:16px;padding:18px 20px}.fv .fvbox h2{font-size:15px;margin:0 0 8px;letter-spacing:.02em}
.fv .fvbox ul{margin:0;padding-left:18px}.fv .fvbox p{margin:0;color:var(--fvmuted)}.fv .fvbig{font-size:22px;font-weight:700;color:var(--fvink)!important}
@media (max-width:900px){.fv{padding:22px 16px}.fv .fvtrack{grid-template-columns:1fr}.fv .fvst{display:grid;grid-template-columns:76px minmax(0,1fr);text-align:left;align-items:center;column-gap:12px;row-gap:6px}
 .fv .fvst .fvtag{grid-column:1;justify-self:start}.fv .fvst .circ{grid-column:1;grid-row:2;width:72px;font-size:0;padding:0}.fv .fvst .circ::after{content:attr(data-n);font-size:20px;font-weight:700}
 .fv .fvst .fvcard{grid-column:2;grid-row:1/3;min-height:0}.fv .fvst .fvnm{display:block;font-size:14.5px}.fv .fvnow{grid-template-columns:auto 1fr}.fv .fvpct{grid-column:1/-1;text-align:left}}`;
function founderHtml(m){const n=m.stages.length;const cur=m.stages[m.cur]||{};const pct=n?Math.round(m.doneCount/n*100):0;
  return`<div class="fv"><div class="fvtop">${fvLogo()}<span class="fvey">Valerie onboarding process</span></div><h1>${esc(m.name)}</h1><p class="fvdate">Updated ${esc(fmtD(m.date,true))}</p>
   <div class="fvnow"><span class="fvnum">${m.cur+1}</span><div><b>${m.hold?"Paused for now":esc(cur.name||"")}</b><span>${m.hold?"Your onboarding is paused. We will be in touch about next steps.":esc(cur.desc||"")}</span></div>
    <div class="fvpct"><b>${m.doneCount} of ${n}</b><span> stages complete</span><div class="fvbar" aria-hidden="true"><i style="width:${pct}%"></i></div></div></div>
   <ol class="fvtrack" style="--n:${n}" aria-label="Onboarding stages">${m.stages.map((x,i)=>{const cl=x.state==="Done"?"fvdone":i===m.cur?"fvcur":"fvnext";const word=x.state==="Done"?"Complete":i===m.cur?"In progress":"Up next";
     return`<li class="fvst ${cl}" aria-current="${i===m.cur?"step":"false"}"><span class="fvtag">Stage ${i+1}</span><span class="circ" data-n="${i+1}">${esc(x.name)}</span><span class="fvcard"><b class="fvnm">${esc(x.name)}</b><span>${esc(x.desc)}</span><span class="state">${word}</span></span></li>`}).join("")}</ol>
   <div class="fvgrid"><div class="fvbox"><h2>What we need from you</h2>${m.need.length?`<ul>${m.need.map(p=>`<li>Access to ${esc(p)}</li>`).join("")}</ul>`:`<p>Nothing right now. Thank you.</p>`}</div>
    <div class="fvbox"><h2>${m.signed?"Scope of work":"Target SOW signing"}</h2><p class="fvbig">${m.signed?"Signed":m.target?esc(fmtD(m.target,true)):"To be agreed"}</p></div>
    <div class="fvbox"><h2>Coming up next</h2><p>${m.cur+1<n?esc(m.stages[m.cur+1].name):"Growth delivery with your pod"}</p></div></div></div>`}
function founderDoc(m){return`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.name)} · Valerie onboarding</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap"><style>body{margin:0;background:var(--c-faf8f4);padding:24px}${FV_CSS}.fv{margin:0 auto}</style></head><body>${founderHtml(m)}<p style="text-align:center;color:#8A8A8A;font:12px system-ui,sans-serif;padding:16px 0 24px">Prepared by Valerie on ${esc(fmtD(m.date,true))}</p></body></html>`}
function vClient(bid){const b=S.brands[bid];if(!b)return`<h1 class="sr">Founder view</h1><p>Brand not found</p>`;
  return`<h1 class="sr">Founder view: ${esc(b.name)}</h1><div class="row" style="margin-bottom:14px"><a class="btn" href="#brand-${esc(bid)}">‹ Back to ${esc(b.name)}</a><span class="grow"></span><button class="btn pri" data-act="client-dl" data-id="${esc(bid)}">Download for the founder</button></div>
   <div class="notice info">This is what the founder sees: their stage in Valerie's 8-stage onboarding, what we need from them and the SOW date. No tasks, notes, people or other brands. Download it and send the file; never send the tracker link, which shows every brand.</div><style>${FV_CSS}</style>`+founderHtml(founderModel(bid))}

