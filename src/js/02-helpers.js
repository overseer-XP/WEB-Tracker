/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const key=s=>String(s||"").replace(/[^A-Za-z]/g,"");
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2400)}
const L=n=>(S.config.lists&&S.config.lists[n])||[];
const people=()=>((S.config.people&&S.config.people.people)||[]);
const activePeople=()=>people().filter(p=>p.active!==false).map(p=>p.name).sort((a,b)=>a.localeCompare(b));
function namesFor(person){const p=people().find(x=>x.name===person);return [person].concat(p&&p.aliases||[]).filter(Boolean).map(s=>s.toLowerCase())}
function isPerson(val,person){if(!val||!person)return false;const ns=namesFor(person);return ns.includes(String(val).toLowerCase().trim())}
function today(){const d=new Date();d.setHours(0,0,0,0);return d}
function isoToday(){const d=today();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function parseD(s){if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
const dayDiff=s=>{const d=parseD(s);return d?Math.round((d-today())/864e5):null};
function fmtD(s,long){const d=parseD(s);if(!d)return"";return d.toLocaleDateString("en-GB",long?{weekday:"short",day:"numeric",month:"short"}:{day:"numeric",month:"short"})}
/* Excel rule: blank if done or no date; Overdue if before today; Due Soon if within 3 days; else On Time */
function dueFlag(date,done){if(done)return"";const n=dayDiff(date);if(n===null)return"";if(n<0)return"Overdue";if(n<=3)return"Due Soon";return"On Time"}
function dueText(date,flag){const n=dayDiff(date);if(n===null)return"";if(flag==="Overdue")return"Late by "+(-n)+(n===-1?" day":" days");if(n===0)return"Due today";if(n===1)return"Due tomorrow";return"Due "+fmtD(date,true)}
function dueHtml(date,done){const f=dueFlag(date,done);if(!f)return date&&done?`<span class="due faint">${esc(fmtD(date))}</span>`:"";return`<span class="due ${key(f)}">${esc(dueText(date,f))}</span>`}
function cls(v){
  // Five meanings only: green finished or healthy, blue moving, amber needs a look, red stopped, grey not started or parked.
  if(["Complete","Granted","Team confirmed","Signed","Done","Live","All Granted","On Time","On Track"].includes(v))return"s-ok";
  if(["Blocked","Overdue","Urgent"].includes(v))return"s-bad";
  if(v==="In Review")return"s-em"; // waiting for a review or approval: the one Ember status
  if(["At Risk","Has blockers","Due Soon","High","Asked founder","Founder actioned"].includes(v))return"s-warn";
  if(["In Progress","Briefed","Requested","Drafting","Internal Review","Final Review (Ben)","Founder Check-in","Revisions","Sent for Signature","Foundations","Tactics In","In QA","Template Pending"].includes(v))return"s-info";
  return"s-off";
}
const pill=v=>v?`<span class="pill ${cls(v)}">${v==="Blocked"?"! ":""}${esc(v)}</span>`:"";
const hdot=h=>`<span class="dot h-${key(h)}" aria-hidden="true"></span>`;
const brandList=()=>Object.entries(S.brands).map(([id,b])=>Object.assign({id},b)).sort((a,b)=>(a.order||999)-(b.order||999)||String(a.name).localeCompare(b.name));
const bname=id=>(S.brands[id]&&S.brands[id].name)||"";
const isInternal=b=>(b&&b.stage)==="Internal";
/* on hold = brand stage On Hold or the Paused flag. Every screen uses this one test. */
/* stages that sit outside active work (Settings > Lists > inactive_stage; On Hold when the list is not set) */
const isOutStage=s=>s==="On Hold"||L("inactive_stage").includes(s);
const onHold=b=>!!b&&(isOutStage(b.stage)||!!b.paused);
const holdOf=bid=>onHold(S.brands[bid]);
const stepBlocks=bid=>Object.values((S.bsteps[bid]&&S.bsteps[bid].s)||{}).filter(x=>x&&x.blocker&&x.blocker.text&&!["Done","N/A"].includes(x.status)).length;
const stepsSorted=()=>Object.entries(S.steps).filter(([,s])=>!s.archived).map(([id,s])=>Object.assign({id},s)).sort((a,b)=>a.order-b.order);
const sno=s=>s?(s.no||s.code||""):"";
function phases(){const out=[];for(const s of stepsSorted()){let p=out.find(x=>x.code===s.phase);if(!p){p={code:s.phase,name:s.phase_name,steps:[]};out.push(p)}p.steps.push(s)}return out}
const stepRaw=(bid,code)=>((S.bsteps[bid]&&S.bsteps[bid].s)||{})[code]||{};
const AUTO={access_all:{label:"Platform access: every platform the brand needs is granted",test:bid=>{const r=Object.values(S.access).filter(a=>a.brand===bid&&a.status!=="Not Needed");return r.length>0&&r.every(accGranted)}},
  bp_drafted:{label:"Best Practices: every section is past Not Started",test:bid=>{const d=S.bps[bid];if(!d)return false;const v=L("bp_section").map(x=>(d.sections||{})[x]||"Not Started").filter(x=>x!=="N/A");return v.length>0&&v.every(x=>x!=="Not Started"&&x!=="Blocked")}},
  bp_complete:{label:"Best Practices: every section is Complete",test:bid=>{const r=bpRoll(bid);return!!r&&r.overall==="Complete"}},
  sow_signed:{label:"SOW tracker: SOW stage is Signed",test:bid=>{const x=S.sow[bid];return!!x&&x.stage==="Signed"}}};
function stepState(bid,code){const raw=stepRaw(bid,code);const s=S.steps[code];const a=s&&s.auto&&AUTO[s.auto];
  if(a&&raw.status!=="N/A"&&memo("auto|"+s.auto+"|"+bid,()=>a.test(bid)))return Object.assign({},raw,{status:"Done",auto:true});return raw}
const withId=o=>Object.entries(o).map(([k,v])=>Object.assign({_id:k},v));
const opts=(arr,cur,blank)=>{const list=arr.slice();if(cur&&!list.includes(cur))list.push(cur);return(blank!==false?`<option value=""></option>`:"")+list.map(o=>`<option value="${esc(o)}" ${o===cur?"selected":""}>${esc(o)}</option>`).join("")};

