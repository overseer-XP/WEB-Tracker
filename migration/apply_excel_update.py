"""Turn a compare_excel.py proposal into database write batches.

Usage:
  python3 -I migration/apply_excel_update.py <proposal.json> <paid.json> <live_dir> <decisions.json> <out_dir>

Inputs
  proposal.json   output of compare_excel.py (three-way diff)
  paid.json       cell cache of the paid channels access sheet (optional, "-" to skip)
  live_dir        export of the live tracker plus versions.json
  decisions.json  the product owner's answers for this import

Output (out_dir)
  docs/<collection>__<id>.json   one file per write
  batch_N.json                   up to 50 writes each, existing docs pinned with if_version
  report.json                    applied, skipped and questions, for the change report

Nothing is written to the tracker by this script.
"""
import json, os, re, sys, time
from collections import defaultdict

proposal_p, paid_p, live, dec_p, out = sys.argv[1:6]
P = json.load(open(proposal_p))
D = json.load(open(dec_p))
V = json.load(open(os.path.join(live, "versions.json")))
os.makedirs(os.path.join(out, "docs"), exist_ok=True)


def load(coll):
    d = os.path.join(live, coll)
    if not os.path.isdir(d):
        return {}
    return {f[:-5]: json.load(open(os.path.join(d, f))) for f in sorted(os.listdir(d)) if f.endswith(".json")}


L = {c: load(c) for c in ["brands", "tasks", "sow", "access", "bps", "steps", "brand_steps", "config"]}
by_name = {b["name"].lower(): bid for bid, b in L["brands"].items()}

writes = {}     # (coll, id) -> {"op", "data"}
applied, skipped, questions = [], [], []
NOW = int(time.time() * 1000)


def put(coll, did, op, data):
    key = (coll, did)
    if key in writes and op == "update" and writes[key]["op"] in ("update", "set"):
        writes[key]["data"].update(data)
    else:
        writes[key] = {"op": op, "data": data}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def brand_id(name):
    n = name.lower()
    if n in by_name:
        return by_name[n]
    return slug(name)


def is_skipped(area, item):
    for s in D.get("skip", []):
        if s["area"] != area or s["field"] != item["field"]:
            continue
        if "brand" in s and item["what"] != s["brand"]:
            continue
        if "match" in s and not item["what"].startswith(s["match"]):
            continue
        return True
    return False


# ---------- 1. Step list ----------
PHASE_RE = re.compile(r"PHASE\s+(\d+):\s*([^(]+)", re.I)
FIX = {"forcast": "Forecast", "Ben ,": "Ben,", "  ": " "}


def clean_step(name):
    n = name.strip()
    for a, b in FIX.items():
        n = n.replace(a, b)
    n = re.sub(r"\bGrowth Forecast V1\b", "Growth Forecast V1", n, flags=re.I)
    return n[:1].upper() + n[1:]


steps_cfg = P["steps"]
code_of = {}
if D.get("use_new_step_list"):
    gates, optional = set(D.get("gates", [])), set(D.get("optional", []))
    counter = defaultdict(int)
    order = 0
    for s in steps_cfg["list"]:
        m = PHASE_RE.search(s["phase"])
        ph, ph_name = m.group(1), m.group(2).strip().title().replace("Sow", "SOW")
        counter[ph] += 1
        order += 1
        code = "P%s.%02d" % (ph, counter[ph])
        code_of[s["name"]] = code
        put("steps", code, "set", {
            "code": code, "phase": "P" + ph, "phase_name": ph_name, "order": order,
            "name": clean_step(s["name"]), "is_gate": s["name"] in gates,
            "is_optional": s["name"] in optional, "default_owner": "", "doc_label": "",
            "hook": "", "sheet_note": "", "source_name": s["name"],
        })
    missing = (gates | optional) - set(code_of)
    if missing:
        sys.exit("Gate or optional step not in the list: %s" % missing)
    for old in L["steps"]:
        if old not in code_of.values():
            put("steps", old, "delete", None)
    applied.append({"area": "Step list", "what": "Replaced %d old steps with %d steps from the team checklist" % (len(L["steps"]), order)})

    # brand ticks
    for src, archived in (("status", False), ("archive_status", True)):
        for bname, ticks in steps_cfg[src].items():
            bid = brand_id(bname)
            s = {}
            for step, st in ticks.items():
                if st:
                    s[code_of[step]] = {"status": st}
            old = L["brand_steps"].get(bid, {}).get("s", {})
            dropped = [k for k in old if k not in code_of.values()]
            edited = [k for k in dropped if set(old[k]) - {"status"} or old[k].get("status") not in (None, "", "Not Started")]
            if edited:
                skipped.append({"area": "Onboarding steps", "what": bname, "detail": "Old step edits removed with the old list: " + ", ".join(edited)})
            put("brand_steps", bid, "set", {"brand": bid, "s": s, "archived_list": archived, "updated_at": NOW})
            done = sum(1 for v in s.values() if v["status"] == "Done")
            applied.append({"area": "Onboarding steps", "what": bname, "detail": "%d ticks loaded (%d Done)%s" % (len(s), done, ", archive list" if archived else "")})

# ---------- 2. New brands ----------
max_order = max(b.get("order", 0) for b in L["brands"].values())
for nb in P["brand_new"]:
    bid = slug(nb["name"])
    by_name[nb["name"].lower()] = bid
    max_order += 1
    put("brands", bid, "set", {
        "name": nb["name"], "founder": nb.get("founder", ""), "website": nb.get("website", ""),
        "stage": nb.get("stage") or "Qualification", "lead": nb.get("lead", ""), "next_step": nb.get("next_step", ""),
        "order": max_order, "paused": False, "restricted": False, "sprint_label": "Pipeline",
    })
    put("sow", bid, "set", {"brand": bid, "batch": "", "blocker": "", "draft_due": "", "gf_link": "", "gf_updated": False,
                            "gf_status": "", "next_step": "", "owner": "", "sow_link": "", "stage": "Not Started",
                            "start_date": "", "support": [], "target_sign": ""})
    if (("brand_steps", bid) not in writes):
        put("brand_steps", bid, "set", {"brand": bid, "s": {}, "updated_at": NOW})
    applied.append({"area": "Brands", "what": nb["name"], "detail": "New brand, SOW record and step checklist"})


# ---------- 3. Field updates ----------
def field_update(area, item, label):
    coll, did, field = item["target"]
    to = item["to"]
    if is_skipped(area, item):
        skipped.append({"area": label, "what": item["what"], "detail": "%s: kept %r (your call)" % (field, item["from"])})
        return
    if to in ("", None) and item["from"] not in ("", None):
        skipped.append({"area": label, "what": item["what"], "detail": "%s: Excel cell is blank, tracker value kept" % field})
        return
    if field == "owner" and to in D.get("owner_to_notes", []):
        skipped.append({"area": label, "what": item["what"], "detail": "owner %r is not a person, left blank" % to})
        return
    if field.startswith("sections."):
        sec = field.split(".", 1)[1]
        cur = writes.get((coll, did), {}).get("data", {}).get("sections") or dict(L[coll][did].get("sections", {}))
        cur[sec] = to
        put(coll, did, "update", {"sections": cur})
    else:
        put(coll, did, "update", {field: to})
    applied.append({"area": label, "what": item["what"], "detail": "%s: %s -> %s" % (field, (item["from"] or "(blank)")[:60], str(to)[:80])})


for it in P["brand_fields"]:
    field_update("brand_fields", it, "Brands")
for it in P["task_updates"]:
    # the owner note that came with a TBC owner is the tracker's own wording, keep it
    if it["field"] == "notes" and any(o in (it["from"] or "") for o in D.get("owner_to_notes", [])):
        skipped.append({"area": "Tasks", "what": it["what"], "detail": "notes: tracker wording kept"})
        continue
    field_update("task_updates", it, "Tasks")
for it in P["sow"]:
    if it["field"] in ("sow_link", "gf_link") and not it["to"]:
        continue
    field_update("sow", it, "SOW")
for it in P["bp"]:
    field_update("bp", it, "Best Practices")
for it in P["access"]:
    field_update("access", it, "Platform access")

# ---------- 4. New tasks ----------
rules = json.load(open(os.path.join(os.path.dirname(dec_p), "decisions.json")))["department_rules"]


def department(title, notes):
    for text in (title, notes):
        t = " " + (text or "").lower() + " "
        for dept, words in rules:
            for w in words:
                if (w.startswith("\\b") and re.search(w, t)) or (not w.startswith("\\b") and w in t):
                    return dept
    return "Other"


nums = defaultdict(int)
for tid in L["tasks"]:
    m = re.match(r"(.+)-(\d+)$", tid)
    if m:
        nums[m.group(1)] = max(nums[m.group(1)], int(m.group(2)))
for t in P["task_new"]:
    bid = t.get("brand_id") or brand_id(t["brand"])
    nums[bid] += 1
    tid = "%s-%03d" % (bid, nums[bid])
    put("tasks", tid, "set", {
        "brand": bid, "title": t["title"], "owner": t.get("owner", ""), "support": [s for s in [t.get("support")] if s],
        "status": t.get("status") or "Not Started", "priority": t.get("priority", ""), "start": t.get("start", ""),
        "deadline": t.get("deadline", ""), "notes": t.get("notes", ""), "brief_link": t.get("brief_link", ""),
        "creative_link": t.get("creative_link", ""), "blocker": None, "department": department(t["title"], t.get("notes")),
        "department_auto": True, "source": "COE tracker 13 Oct",
    })
    applied.append({"area": "Tasks", "what": "%s: %s" % (t["brand"], t["title"]), "detail": "New task %s" % tid})

# ---------- 5. Ash ----------
ash = D.get("ash_rule")
if ash:
    for tid, t in L["tasks"].items():
        sup = (writes.get(("tasks", tid), {}).get("data", {}).get("support")) or t.get("support") or []
        if "Ash" not in sup and t.get("owner") != "Ash":
            continue
        who = ash["paid"] if t.get("department") in ash["paid_departments"] else ash["other"]
        new = []
        for s in sup:
            s = who if s == "Ash" else s
            if s not in new:
                new.append(s)
        upd = {}
        if t.get("owner") == "Ash":
            upd["owner"] = who
        owner = upd.get("owner") or writes.get(("tasks", tid), {}).get("data", {}).get("owner") or t.get("owner")
        upd["support"] = [s for s in new if s != owner]
        put("tasks", tid, "update", upd)
        applied.append({"area": "People", "what": "%s (%s)" % (t["title"][:50], tid), "detail": "Ash -> %s" % who})
    ppl = json.loads(json.dumps(L["config"]["people"]))
    for p in ppl["people"]:
        if p["name"] == ash["paid"]:
            p["kind"] = "team"
        if p["name"] == "Ash":
            p["active"] = False
    put("config", "people", "update", {"people": ppl["people"]})
    applied.append({"area": "People", "what": "Ash Ghorab", "detail": "Marked as team. Plain 'Ash' retired (it meant Ashna or Ash Ghorab)"})

# ---------- 6. Paid channels sheet ----------
if paid_p != "-":
    ps = D["paid_sheet"]
    cells = json.load(open(paid_p))["Sheet1"]["cells"]
    rows = defaultdict(dict)
    for c in cells.values():
        rows[c[2]][c[3]] = str(c[0]).strip()
    head = rows.pop(1)
    people_cols = [c for c in "BCDE"]
    plat_words = {k: re.compile(r"\b%s\b" % k, re.I) for k in ps["platforms"]}
    existing = defaultdict(dict)
    for aid, a in L["access"].items():
        existing[a["brand"]][a["platform"]] = aid
    for r in sorted(rows):
        row = rows[r]
        bname = ps["brand_alias"].get(row.get("A", "").lower())
        if not bname:
            skipped.append({"area": "Platform access", "what": row.get("A", ""), "detail": "Brand not found in tracker"})
            continue
        bid = brand_id(bname)
        holders = defaultdict(list)
        partial = set()
        for c in people_cols:
            v = row.get(c, "")
            for k, rx in plat_words.items():
                if rx.search(v):
                    holders[k].append(head[c].strip())
                    if "partial" in v.lower():
                        partial.add(k)
        missing = {k for k, rx in plat_words.items() if rx.search(row.get("F", "")) and "missing" in row.get("F", "").lower()}
        ash_note, noop = row.get("F", ""), row.get("G", "")
        followed = {k for k, rx in plat_words.items() if "followed up" in noop.lower() and rx.search(noop)}
        b = L["brands"].get(bid, {})
        for k, plat in ps["platforms"].items():
            if k not in holders and k not in missing:
                continue
            if k in partial:
                status = "In Progress"
            elif k in holders and k not in missing:
                status = "Granted"
            elif k in followed:
                status = "Requested"
            else:
                status = "Not Requested"
            note = "Paid channels sheet 13 Oct."
            if holders.get(k):
                note += " Access held by: %s." % ", ".join(holders[k])
            if k in partial:
                note += " Partial access only."
            note += " Ash's notes: %s." % ash_note if ash_note else ""
            if noop:
                note += " Noopur's notes: %s." % noop
            if k == "amazon" and status == "Not Requested" and row.get("D", "").upper() == "N/A":
                note += " Pradnya's N/A means no access yet, so Amazon access is missing."
            aid = existing[bid].get(plat)
            if aid:
                a = L["access"][aid]
                if bid == "mugwipes":
                    skipped.append({"area": "Platform access", "what": "%s %s" % (bname, plat), "detail": "Brand on hold, row kept as is"})
                    continue
                if a["status"] != status:
                    put("access", aid, "update", {"status": status, "owner": a.get("owner") or ps["owner"], "notes": (a.get("notes", "") + " " + note).strip()})
                    applied.append({"area": "Platform access", "what": "%s %s" % (bname, plat), "detail": "%s -> %s" % (a["status"], status)})
                continue
            if bid == "mugwipes":
                skipped.append({"area": "Platform access", "what": "%s %s" % (bname, plat), "detail": "Tracker says only Amazon is needed and the brand is on hold. Row not added"})
                continue
            aid = "%s-%s" % (bid, slug(plat))
            put("access", aid, "set", {
                "brand": bid, "platform": plat, "status": status, "owner": ps["owner"], "access_level": "TBC",
                "brand_contact": b.get("founder", ""), "needed_for": "Paid media", "requested_date": "", "deadline": "",
                "blocker": "", "notes": note,
            })
            applied.append({"area": "Platform access", "what": "%s %s" % (bname, plat), "detail": "New row: %s" % status})
    for aid, a in L["access"].items():
        if a["platform"] in ps["placeholders_to_retire"]:
            put("access", aid, "update", {"status": "Not Needed", "notes": (a.get("notes", "") + " Replaced by one row per platform from the paid channels sheet, 13 Oct.").strip()})
            applied.append({"area": "Platform access", "what": "%s %s" % (L["brands"].get(a["brand"], {}).get("name", a["brand"]), a["platform"]), "detail": "Placeholder retired: Not Needed"})

# ---------- 7. Write files and batches ----------
ops = []
for (coll, did), w in writes.items():
    vkey = "%s/%s" % (coll, did)
    entry = {"op": w["op"], "collection": coll, "doc_id": did}
    exists = did in L.get(coll, {})
    if w["op"] != "delete":
        fp = os.path.abspath(os.path.join(out, "docs", "%s__%s.json" % (coll, did)))
        json.dump(w["data"], open(fp, "w"), indent=1, ensure_ascii=False)
        entry["file_path"] = fp
    if exists:
        entry["if_version"] = V.get(vkey, 1)
        if w["op"] == "set" and coll != "brand_steps" and coll != "steps":
            entry["op"] = "update"
    ops.append(entry)

# new steps first, then brands and the rest, old steps deleted last
rank = {"steps": 0, "brands": 1, "sow": 2, "brand_steps": 3}
ops.sort(key=lambda e: (e["op"] == "delete", rank.get(e["collection"], 4), e["collection"], e["doc_id"]))
for f in os.listdir(out):
    if f.startswith("batch_"):
        os.remove(os.path.join(out, f))
for i in range(0, len(ops), 50):
    json.dump(ops[i:i + 50], open(os.path.join(out, "batch_%d.json" % (i // 50)), "w"), indent=0)
json.dump({"applied": applied, "skipped": skipped, "questions": questions, "writes": len(ops),
           "batches": (len(ops) + 49) // 50, "step_codes": code_of}, open(os.path.join(out, "report.json"), "w"), indent=1, ensure_ascii=False)
print("writes", len(ops), "batches", (len(ops) + 49) // 50, "applied", len(applied), "skipped", len(skipped))
