/* ---------- writes + change log ---------- */
const wq={};
function chain(k,fn){wq[k]=(wq[k]||Promise.resolve()).then(fn,fn);return wq[k]}
function refused(e){if(e&&e.code==="invalid_argument"){canWrite=false;toast("You can view this tracker but not change it.");render();return true}return false}
async function save(c,id,patch,label){
  if(!db||!canWrite){toast("You can view this tracker but not change it.");return}
  const cur=S[c][id];if(c==="brands"&&patch.stage&&cur&&patch.stage!==cur.stage)patch=Object.assign({},patch,{stage_since:isoToday()});
  const old={};for(const k of Object.keys(patch))old[k]=cur?cur[k]:undefined;
  S[c][id]=Object.assign({},cur||{},patch);render();
  const body=Object.assign({},patch,{updated_at:Date.now(),updated_by:uid||""});
  return chain(c+"/"+id,()=>(cur?db.doc(COLL[c]+"/"+id).update(body):db.doc(COLL[c]+"/"+id).set(Object.assign({},S[c][id],body))))
    .then(()=>{toast("Saved");addLog(c,id,patch,old,label)})
    .catch(e=>{if(!refused(e))toast("Not saved. Check your connection and try again.");if(cur)S[c][id]=cur;render()});
}
async function create(c,id,body,label){
  if(!db||!canWrite){toast("You can view this tracker but not change it.");return null}
  const ref=id?db.doc(COLL[c]+"/"+id):db.collection(COLL[c]).doc();
  const full=Object.assign({},body,{created_at:Date.now(),updated_at:Date.now(),updated_by:uid||""});
  S[c][ref.id]=full;render();
  try{await ref.set(full);addLog(c,ref.id,{created:label||"new"},{}, label);toast("Added");return ref.id}
  catch(e){delete S[c][ref.id];render();if(!refused(e))toast(e&&e.code==="quota_exceeded"?"The tracker is full. Ask an admin to archive old rows.":"Not added. Try again.");return null}
}
async function remove(c,id,label){
  if(!db||!canWrite)return;const cur=S[c][id];delete S[c][id];render();
  try{await db.doc(COLL[c]+"/"+id).delete();addLog(c,id,{deleted:true},{},label);toast("Deleted")}catch(e){S[c][id]=cur;render();if(!refused(e))toast("Not deleted. Try again.")}
}
let logBuf=null;
function addLog(c,id,patch,old,label){
  const day=isoToday();const lid=day+"_"+(uid||"anon");
  const entries=[];for(const k of Object.keys(patch)){if(k==="updated_at"||k==="updated_by")continue;
    const f=v=>v==null?"":typeof v==="object"?JSON.stringify(v).slice(0,140):String(v).slice(0,140);
    entries.push({at:Date.now(),what:COLL[c]||c,id,label:label||"",field:k,old:f(old[k]),new:f(patch[k])})}
  if(!entries.length)return;
  chain("log/"+lid,async()=>{const base=(S.log[lid]&&S.log[lid].entries)||[];const all=base.concat(entries).slice(-400);
    const body={date:day,who:uid||"",person:me||"",entries:all};S.log[lid]=body;try{await db.doc("log/"+lid).set(body)}catch(e){}});
}

