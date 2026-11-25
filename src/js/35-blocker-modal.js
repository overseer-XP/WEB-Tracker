/* ---------- blocker modal ---------- */
function askBlocker(done){
  const m=$("#modal");m.innerHTML=`<form class="box" id="bform"><h3>What is blocking it?</h3><div class="f"><label for="b-text">One line</label><input id="b-text" required maxlength="200"></div>
   <div class="f"><label for="b-person">Waiting on</label><select id="b-person" required>${opts(activePeople(),"")}</select></div>
   <div class="row"><button class="btn pri" type="submit">Mark blocked</button><button class="btn" type="button" data-act="mclose">Cancel</button></div></form>`;
  m.hidden=false;$("#b-text").focus();
  $("#bform").onsubmit=e=>{e.preventDefault();const text=$("#b-text").value.trim(),person=$("#b-person").value;if(!text||!person){toast("Add one line and a person.");return}m.hidden=true;done({text,person})}}
function confirmBox(msg,label,fn){const m=$("#modal");m.innerHTML=`<div class="box"><h3>${esc(msg)}</h3><div class="row"><button class="btn pri" data-act="mok">${esc(label)}</button><button class="btn" data-act="mclose">Cancel</button></div></div>`;m.hidden=false;m.querySelector("[data-act=mok]").onclick=()=>{m.hidden=true;fn()}}
function formBox(title,fields,label,fn){const m=$("#modal");m.innerHTML=`<form class="box" id="fbox"><h3>${esc(title)}</h3>${fields}<div class="row"><button class="btn pri" type="submit">${esc(label)}</button><button class="btn" type="button" data-act="mclose">Cancel</button></div></form>`;m.hidden=false;const f=m.querySelector("input,select");if(f)f.focus();
  $("#fbox").onsubmit=e=>{e.preventDefault();const v={};for(const el of $("#fbox").elements)if(el.name)v[el.name]=el.value.trim();if(fn(v)!==false)m.hidden=true}}

