/* ---------- freshness, stage age ---------- */
const DAY=864e5;
function lastUpdated(bid){return memo("lu",()=>{const idx={};const take=(b,d)=>{if(!d||!b)return;const v=+d.updated_at||+d.created_at||0;if(v>(idx[b]||0))idx[b]=v};
  for(const[id,d]of Object.entries(S.brands))take(id,d);for(const[id,d]of Object.entries(S.sow))take(id,d);for(const[id,d]of Object.entries(S.bps))take(id,d);for(const[id,d]of Object.entries(S.bsteps))take(id,d);
  for(const t of Object.values(S.tasks))take(t.brand,t);for(const a of Object.values(S.access))take(a.brand,a);for(const c of Object.values(S.comments))take(c.brand,c);return idx})[bid]||0}
function lastUpdatedSlow(bid){let m=0;const take=d=>{if(!d)return;const v=+d.updated_at||+d.created_at||0;if(v>m)m=v};
  take(S.brands[bid]);take(S.sow[bid]);take(S.bps[bid]);take(S.bsteps[bid]);
  for(const t of Object.values(S.tasks))if(t.brand===bid)take(t);for(const a of Object.values(S.access))if(a.brand===bid)take(a);
  for(const c of Object.values(S.comments))if(c.brand===bid)take(c);return m}
function agoText(ts){if(!ts)return"";const d=Math.floor((Date.now()-ts)/DAY);return d<=0?"today":d===1?"yesterday":d+" days ago"}
function stageDays(b){const d=parseD(b&&b.stage_since);return d?Math.max(0,Math.round((today()-d)/DAY)):null}

