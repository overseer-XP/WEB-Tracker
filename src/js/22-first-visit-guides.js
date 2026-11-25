/* ---------- first-visit guides ---------- */
const GUIDES={
  overview:["Start with Needs attention: these are the brands to act on today.","Tiles compare with last week once the tracker has a week of history.","Pipeline shows where every brand is. Click a name to open it."],
  mine:["Everything with your name on it: tasks you own or support, onboarding steps you own, platform access steps on you.","Columns: Status, Brand or Team. Sort by deadline, priority or brand. Click a card title to jump to it on its brand page; change status right on the card.","Late or blocked counts are the cards that need you first. Mentions from comments show at the top for 14 days."],
  people:["Owns is the number of open tasks a person owns. The bar compares people.","Click a row to see their tasks. No owner lists work nobody has picked up.","Filter by team or vertical to see one part of the business."],
  sow:["Each square rolls up a few onboarding steps and says where they are: Done, Doing, To do or N/A.","Click a square to tick its steps. Signed comes from the SOW stage."]};
function guide(k){if(!GUIDES[k]||ls.get("vt-guide-"+k))return"";return`<details class="guide gfold"><summary>How to use this page</summary><div class="row" style="align-items:flex-start"><ul>${GUIDES[k].map(x=>`<li>${esc(x)}</li>`).join("")}</ul><button class="btn sm quiet" data-act="guide-off" data-k="${k}">Hide for good</button></div></details>`}


