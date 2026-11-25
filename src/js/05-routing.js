/* ---------- routing ---------- */
function parseHash(){const h=location.hash.replace(/^#/,"");
  if(h.startsWith("brand-")){const[head,cid]=h.slice(6).split("/c/");const[bid,tab]=head.split("/");route={v:"brand",id:bid,camp:cid?decodeURIComponent(cid):""};campSel={bid,id:route.camp};brandTab=route.camp?"tasks":tab==="steps"?"sow":(tab||"home")}
  else if(h.startsWith("client-"))route={v:"client",id:h.slice(7)};
  else if(h.startsWith("leadership/"))route={v:"leadership",id:h.slice(11)};
  else if(h.startsWith("overview/"))route={v:"overview",id:h.slice(9)};
  else if(h==="stepsadmin"||h==="changes"){setTab=h==="stepsadmin"?"steps":"changes";route={v:"settings",id:""}}
  else if(h==="people")route={v:"org",id:""};
  else if(["mine","leadership","overview","access","sow","bp","settings","org"].includes(h))route={v:h,id:""};
  else route={v:"",id:""};
  $("#rail").classList.remove("open");closeDrawer();render();$("#main").scrollTop=0}
window.addEventListener("hashchange",()=>{parseHash();const h=$("#main h1");if(h&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest("#drawer,#modal"))){h.tabIndex=-1;h.focus({preventScroll:true})}});
const go=h=>{if(location.hash==="#"+h)parseHash();else location.hash=h};
const campHash=(bid,cid)=>"brand-"+bid+(cid?"/c/"+encodeURIComponent(cid):"/tasks");

