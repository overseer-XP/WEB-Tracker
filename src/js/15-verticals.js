/* ---------- verticals ---------- */
const VERTS=()=>L("vertical").length?L("vertical"):L("bp_section");
const VERT_RULES=[["UGC",["ugc"]],["Influencer",["influencer","talent","creator"]],["Affiliates",["affiliate"]],["Ambassadors",["ambassador"]],["Brand Partnerships",["partnership","collab"]],
  ["Paid Media",["paid","meta ","google ads","ads ","ad campaign","ad copy","media plan","tiktok ads"]],["Amazon",["amazon"]],["Email / CRM",["email","klaviyo","crm"]],["Website / CRO",["website","seo","shopify","landing","cro"]]];
function vertOf(t){if(t.vertical)return t.vertical;const s=" "+((t.title||"")+" "+(t.notes||"")).toLowerCase()+" ";
  for(const[v,ws]of VERT_RULES)if(VERTS().includes(v)&&ws.some(w=>s.includes(w)))return v;return""}

