/* ---------- task templates ---------- */
const TEMPLATES=()=>((S.config.templates&&S.config.templates.list)||[]);
function parseTemplateLines(text){return text.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const[title,dep,days]=l.split("|").map(x=>(x||"").trim());return{title,department:DEPTS().includes(dep)?dep:"",days:+days||0}}).filter(x=>x.title)}

