/* ---------- state ---------- */
const COLL={esc:"escalations",camps:"campaigns",brands:"brands",tasks:"tasks",access:"access",sow:"sow",bps:"bps",steps:"steps",bsteps:"brand_steps",config:"config",comments:"comments",snaps:"snapshots"};
const S={tarch:{},esc:{},camps:{},brands:{},tasks:{},access:{},sow:{},bps:{},steps:{},bsteps:{},config:{},comments:{},snaps:{},log:{}};
const ready={};
let db=null,U=null,uid=null,canEdit=false,canWrite=true,dl=null;
let me="";               // the person shown (an admin may view as someone else)
let selfMe="",realEdit=false,realWrite=true; // who this viewer really is, and their real rights
let simple=null;          // null until we know the role
let route={v:"",id:""};let campSel={bid:"",id:""};
let brandTab="home",drawerCtx=null;
const flt={accBrand:"",accStatus:"",taskStatus:"open",accGap:false};
let accBrand="",sowView="board";
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
// Light by default, whatever the device is set to. Each person can switch to dark.
let theme=ls.get("vt-theme")==="dark"?"dark":"light";
const applyTheme=()=>{document.documentElement.setAttribute("data-theme",theme)};applyTheme();
new MutationObserver(()=>{if(document.documentElement.getAttribute("data-theme")!==theme)applyTheme()}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
try{const sv=ls.get("vt-simple");if(sv!==null)simple=sv==="1";me=ls.get("vt-me")||"";selfMe=me;accBrand=ls.get("vt-accbrand")||"";sowView=ls.get("vt-sowview")||"board"}catch(e){}

