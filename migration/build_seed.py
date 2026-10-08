"""Build the app's starting data from the Excel files.

Usage:
    python3 -I migration/build_seed.py <inputs_dir> <out_dir>

<inputs_dir> holds:
    COE_Project_Tracker.xlsx
    Project_Task_Management.xlsx
    decisions.json      (answers from the product owner)
    step_extras.json    (proposed owner role and document label per step)

<out_dir> receives one JSON file per document (<collection>/<id>.json)
and report.md listing counts and every changed, merged or dropped row.

No brand, person, step or list value is written in this file. They all
come from the inputs.
"""
import datetime
import json
import os
import re
import sys

import openpyxl

INP, OUT = sys.argv[1], sys.argv[2]
DEC = json.load(open(os.path.join(INP, "decisions.json")))
EXTRAS = json.load(open(os.path.join(INP, "step_extras.json")))
COE = openpyxl.load_workbook(os.path.join(INP, "COE_Project_Tracker.xlsx"))
PTM = openpyxl.load_workbook(os.path.join(INP, "Project_Task_Management.xlsx"))

docs = {}          # (collection, id) -> body
changes = []       # (sheet, row, what, reason)
counts = []        # (source, rows in Excel, docs written, note)


def put(coll, did, body):
    docs[(coll, did)] = body


def log(sheet, row, what, reason):
    changes.append((sheet, row, what, reason))


def clean(v):
    if v is None:
        return ""
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime("%Y-%m-%d")
    s = str(v).replace("\xa0", " ").strip()
    return "" if s in ("\n",) else s


def as_date(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime("%Y-%m-%d")
    return ""


def link_of(ws, cell):
    c = ws[cell]
    if c.hyperlink is not None and c.hyperlink.target:
        return c.hyperlink.target.strip()
    m = re.search(r"https?://\S+", clean(c.value))
    return m.group(0) if m else ""


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def norm(s):
    s = clean(s).lower().replace("*", "")
    s = re.sub(r"\(.*?\)", "", s)
    s = s.split(" - ")[0]
    return re.sub(r"\s+", " ", s).strip()


ALIASES = {k.lower(): v for k, v in DEC["brand_aliases"].items()}


def brand_name(raw):
    return ALIASES.get(norm(raw))


def split_people(s):
    s = clean(s)
    if not s:
        return []
    return [p.strip() for p in re.split(r",|\+|&| and ", s) if p.strip()]


# ---------------------------------------------------------------- lists
ws = COE["Lists"]
lists = {}
for col in ws.iter_cols(min_row=1, max_row=50):
    head = clean(col[0].value)
    if not head:
        continue
    vals = [clean(c.value) for c in col[1:] if clean(c.value)]
    lists[head] = [v for v in vals if not v.startswith("Team, Platform")]
team = lists.pop("Team")
TEAM_CI = {t.lower(): t for t in team}   # "CAT" in the data is "Cat" in the list
put("config", "lists", {
    "task_status": lists["Task Status"], "priority": lists["Priority"], "stage": lists["Stage"],
    "platform": lists["Platform"], "access_level": lists["Access Level"],
    "access_status": lists["Access Status"], "sow_stage": lists["SOW Stage"],
    "checklist": lists["Checklist"], "bp_section": lists["BP Section"], "bp_status": lists["BP Status"],
})
counts.append(("Lists", sum(len(v) for v in lists.values()) + len(team), 1, "All dropdowns in one config document"))
STATUS = set(lists["Task Status"])
PRIORITY = {p.lower(): p for p in lists["Priority"]}

# ---------------------------------------------------------------- brands (COE Brand Tracker, typed columns only)
ws = COE["Brand Tracker"]
brands = {}
order = 0
for r in range(4, ws.max_row + 1):
    name = clean(ws.cell(r, 1).value)
    if not name:
        continue
    order += 1
    bid = slug(name)
    brands[name] = bid
    put("brands", bid, {
        "name": name, "founder": clean(ws.cell(r, 2).value), "website": clean(ws.cell(r, 3).value),
        "stage": clean(ws.cell(r, 4).value), "lead": clean(ws.cell(r, 5).value),
        "next_step": clean(ws.cell(r, 18).value), "sprint_label": "", "order": order,
        "paused": False, "restricted": False,
    })
coe_brand_rows = order
for nb in DEC["new_brands"]:
    order += 1
    bid = slug(nb["name"])
    brands[nb["name"]] = bid
    put("brands", bid, {"name": nb["name"], "founder": "", "website": "", "stage": nb["stage"], "lead": "",
                        "next_step": "", "sprint_label": nb.get("sprint_label", ""), "order": order,
                        "paused": False, "restricted": False})
    log("decisions.json", "-", f"Added brand {nb['name']}", "Has a target sign date in the 8 Oct SOW update. Other fields left blank to fill later")
for name, flags in DEC["brand_flags"].items():
    docs[("brands", brands[name])].update(flags)
    log("decisions.json", "-", f"{name}: set {flags}", "Product owner decision")
counts.append(("Brand Tracker", coe_brand_rows, len(brands), f"{len(DEC['new_brands'])} new brands added"))

# ---------------------------------------------------------------- tasks (Master Project Flow is the source)
ws = PTM["Master Project Flow"]
tasks = []
cur = None
unassigned = []
headers = {c.column_letter: clean(c.value) for c in ws[3]}
for r in range(4, ws.max_row + 1):
    b_raw = clean(ws[f"B{r}"].value)
    if b_raw:
        bn = brand_name(b_raw)
        if bn is None:
            log("Master Project Flow", r, f"Brand '{b_raw}' not matched", "Name not in alias table. Rows below kept without a brand")
        elif norm(b_raw) != norm(bn) or b_raw != bn:
            log("Master Project Flow", r, f"Brand '{b_raw}' matched to '{bn}'", "Alias table")
        cur = bn
        if bn:
            sl = clean(ws[f"A{r}"].value)
            if sl:
                docs[("brands", brands[bn])]["sprint_label"] = sl
            if norm(b_raw).endswith("on pause") or "ON PAUSE" in b_raw:
                pass
    title = clean(ws[f"E{r}"].value)
    if not title:
        if any(clean(ws[f"{c}{r}"].value) for c in "FGHIJKLMNOPQRS"):
            log("Master Project Flow", r, "Row has data but no task name", "Skipped. Details: " + clean(ws[f"J{r}"].value)[:80])
        continue
    notes = clean(ws[f"J{r}"].value)
    extra = clean(ws[f"S{r}"].value)
    if extra:
        notes = (notes + " " if notes else "") + extra
        log("Master Project Flow", r, f"'{title}': unlabelled column S added to notes", "No header on column S")
    status = clean(ws[f"G{r}"].value)
    if status not in STATUS:
        if status:
            log("Master Project Flow", r, f"'{title}': status '{status}' not in list, set Not Started", "Invalid value")
        else:
            log("Master Project Flow", r, f"'{title}': no status, set Not Started", "Blank")
        status = "Not Started"
    pr_raw = clean(ws[f"H{r}"].value)
    priority = PRIORITY.get(pr_raw.lower(), "")
    if pr_raw and not priority:
        log("Master Project Flow", r, f"'{title}': priority '{pr_raw}' cleared", "Not a priority value")
    start = as_date(ws[f"I{r}"].value)
    if clean(ws[f"I{r}"].value) and not start:
        log("Master Project Flow", r, f"'{title}': start '{clean(ws[f'I{r}'].value)}' cleared", "Not a date")
    deadline = as_date(ws[f"M{r}"].value)
    if clean(ws[f"M{r}"].value) and not deadline:
        log("Master Project Flow", r, f"'{title}': deadline '{clean(ws[f'M{r}'].value)}' cleared", "Not a date")
    owner_raw = clean(ws[f"F{r}"].value)
    owner = TEAM_CI.get(owner_raw.lower(), owner_raw)
    if owner.startswith("TBC"):
        notes = (notes + " " if notes else "") + f"Owner: {owner}."
        log("Master Project Flow", r, f"'{title}': owner '{owner}' moved to notes", "Not a person")
        owner = ""
    support = []
    for c in "NOPQR":
        for p in split_people(ws[f"{c}{r}"].value):
            p = TEAM_CI.get(p.lower(), p)
            if p not in support and p != owner:
                support.append(p)
    creative = link_of(ws, f"K{r}")
    brief = link_of(ws, f"L{r}")
    for c in "KL":
        txt = clean(ws[f"{c}{r}"].value)
        if txt and not link_of(ws, f"{c}{r}"):
            notes = (notes + " " if notes else "") + f"{headers.get(c, c)}: {txt}."
            log("Master Project Flow", r, f"'{title}': text '{txt}' in a link column moved to notes", "Not a link")
    tasks.append({"brand": cur, "title": title, "owner": owner, "support": support, "status": status,
                  "priority": priority, "start": start, "deadline": deadline, "notes": notes,
                  "brief_link": brief, "creative_link": creative, "blocker": None,
                  "source": f"Master Project Flow row {r}"})
mpf_rows = len(tasks)

# Valerie (Internal) tasks come from the "Valerie" sheet of the same file
ws = PTM["Valerie"]
val_count = 0
for r in range(3, ws.max_row + 1):
    title = clean(ws[f"F{r}"].value)
    if not title:
        continue
    val_count += 1
    support = []
    for c in "OPQRS":
        support += split_people(ws[f"{c}{r}"].value)
    tasks.append({"brand": "Valerie (Internal)", "title": title, "owner": clean(ws[f"G{r}"].value), "support": support,
                  "status": clean(ws[f"H{r}"].value) if clean(ws[f"H{r}"].value) in STATUS else "Not Started",
                  "priority": PRIORITY.get(clean(ws[f"I{r}"].value).lower(), ""), "start": as_date(ws[f"J{r}"].value),
                  "deadline": as_date(ws[f"N{r}"].value), "notes": "", "brief_link": "", "creative_link": "",
                  "blocker": None, "source": f"Valerie row {r}"})

for ov in DEC["note_overrides"]:
    for t in tasks:
        if t["brand"] == ov["brand"] and t["title"] == ov["title"]:
            t["notes"] = ov["notes"]
            log(t["source"].rsplit(" row ", 1)[0], t["source"].rsplit(" ", 1)[1], f"{ov['brand']} '{ov['title']}': note replaced",
                "Sensitive detail. Replaced with the wording already used in the COE tracker")

# Blocked tasks: the note becomes the blocker text, person is the owner
for t in tasks:
    if t["status"] == "Blocked":
        t["blocker"] = {"text": t["notes"][:200] or "Reason not recorded", "person": t["owner"]}

# Completed archive (no brand) from "Completed tasks"
ws = PTM["Completed tasks"]
arch = 0
for r in range(4, ws.max_row + 1):
    title = clean(ws[f"B{r}"].value)
    if not title:
        continue
    arch += 1
    support = []
    for c in "IJKLM":
        for p in split_people(ws[f"{c}{r}"].value):
            if p not in support:
                support.append(p)
    tasks.append({"brand": None, "title": title, "owner": clean(ws[f"C{r}"].value), "support": support,
                  "status": "Complete", "priority": "", "start": as_date(ws[f"F{r}"].value),
                  "deadline": as_date(ws[f"H{r}"].value), "notes": clean(ws[f"N{r}"].value), "brief_link": "",
                  "creative_link": "", "blocker": None, "source": f"Completed tasks row {r}"})
    if clean(ws[f"H{r}"].value) and not as_date(ws[f"H{r}"].value):
        log("Completed tasks", r, f"'{title}': deadline '{clean(ws[f'H{r}'].value)}' cleared", "Not a date")
    log("Completed tasks", r, f"'{title}': no brand", "Shown under Settings > Needs a brand")

n = {}
for t in tasks:
    key = brands[t["brand"]] if t["brand"] else "archive"
    n[key] = n.get(key, 0) + 1
    tid = f"{key}-{n[key]:03d}"
    t["brand"] = brands[t["brand"]] if t["brand"] else ""
    put("tasks", tid, t)
untagged = [t for t in tasks if not t["brand"]]
counts.append(("Master Project Flow (tasks)", mpf_rows, mpf_rows, "Rows with a task name"))
counts.append(("Valerie sheet (tasks)", val_count, val_count, "Valerie (Internal)"))
counts.append(("Completed tasks", arch, arch, "No brand yet"))

# ---------------------------------------------------------------- platform access (COE)
ws = COE["Platform Access"]
pa = 0
for r in range(4, ws.max_row + 1):
    b = clean(ws[f"A{r}"].value)
    if not b:
        continue
    pa += 1
    if b not in brands:
        log("Platform Access", r, f"Brand '{b}' not matched", "Dropped")
        continue
    put("access", f"{brands[b]}-{pa:03d}", {
        "brand": brands[b], "platform": clean(ws[f"B{r}"].value), "access_level": clean(ws[f"C{r}"].value),
        "needed_for": clean(ws[f"D{r}"].value), "owner": clean(ws[f"E{r}"].value), "brand_contact": clean(ws[f"F{r}"].value),
        "requested_date": as_date(ws[f"G{r}"].value), "deadline": as_date(ws[f"H{r}"].value),
        "status": clean(ws[f"I{r}"].value), "blocker": clean(ws[f"L{r}"].value), "notes": clean(ws[f"M{r}"].value)})
    if not clean(ws[f"E{r}"].value):
        log("Platform Access", r, f"{b} {clean(ws[f'B{r}'].value)}: no Valerie owner", "Kept. Owner to be added")
counts.append(("Platform Access", pa, pa, ""))

# ---------------------------------------------------------------- SOW (COE + SOW + GF Tracker + 8 Oct update)
ws = COE["SOW Tracker"]
sowc = 0
for r in range(4, ws.max_row + 1):
    b = clean(ws[f"A{r}"].value)
    if not b:
        continue
    sowc += 1
    put("sow", brands[b], {
        "brand": brands[b], "owner": clean(ws[f"B{r}"].value), "support": split_people(ws[f"C{r}"].value),
        "stage": clean(ws[f"D{r}"].value) or "Not Started", "start_date": as_date(ws[f"E{r}"].value),
        "draft_due": as_date(ws[f"F{r}"].value), "target_sign": as_date(ws[f"G{r}"].value),
        "blocker": clean(ws[f"I{r}"].value), "next_step": clean(ws[f"J{r}"].value), "sow_link": link_of(ws, f"K{r}"),
        "gf_link": "", "gf_updated": False, "batch": ""})
for name, bid in brands.items():
    if ("sow", bid) not in docs and docs[("brands", bid)]["stage"] != "Internal":
        put("sow", bid, {"brand": bid, "owner": "", "support": [], "stage": "Not Started", "start_date": "",
                         "draft_due": "", "target_sign": "", "blocker": "", "next_step": "", "sow_link": "",
                         "gf_link": "", "gf_updated": False, "batch": ""})
        log("SOW Tracker", "-", f"{name}: SOW row created", "Brand had no SOW row")
ws = PTM["SOW + GF Tracker"]
batch = ""
gf = 0
for r in range(4, ws.max_row + 1):
    a = clean(ws[f"A{r}"].value)
    if a:
        m = re.match(r"(Batch \d+)", a)
        batch = m.group(1) if m else a
    raw = clean(ws[f"B{r}"].value)
    if not raw:
        continue
    gf += 1
    bn = brand_name(raw)
    if bn is None:
        log("SOW + GF Tracker", r, f"Brand '{raw}' not matched", "Dropped")
        continue
    if raw != bn:
        log("SOW + GF Tracker", r, f"Brand '{raw}' matched to '{bn}'", "Alias table")
    s = docs[("sow", brands[bn])]
    sl = link_of(ws, f"C{r}")
    if sl:
        s["sow_link"] = sl
    s["gf_link"] = link_of(ws, f"D{r}")
    s["gf_updated"] = clean(ws[f"E{r}"].value).lower() == "yes"
    s["batch"] = batch
    note = clean(ws[f"J{r}"].value)
    if note:
        s["gf_note"] = note
counts.append(("SOW Tracker", sowc, sum(1 for k in docs if k[0] == "sow"), "Plus rows for brands that had none"))
counts.append(("SOW + GF Tracker", gf, gf, "Merged into SOW rows"))
for name, u in DEC["sow_update"].items():
    s = docs[("sow", brands[name])]
    before = {k: s.get(k) for k in u}
    for k, v in u.items():
        if k == "clear_sow_link":
            if s["sow_link"]:
                log("8 Oct SOW update", "-", f"{name}: old SOW link removed", "Restarting with a new document. Old link pointed to another brand's site")
            s["sow_link"] = ""
        else:
            s[k] = v
    log("8 Oct SOW update", "-", f"{name}: {', '.join(f'{k} {before[k]!r} to {v!r}' for k, v in u.items() if k != 'clear_sow_link' and before[k] != v)}", "Newest SOW status from the product owner")
    if u.get("next_step"):
        docs[("brands", brands[name])]["next_step"] = u["next_step"]

# ---------------------------------------------------------------- best practices (COE)
ws = COE["BP Tracker"]
secs = [clean(ws.cell(3, c).value) for c in range(5, 14)]
bpc = 0
for r in range(4, ws.max_row + 1):
    b = clean(ws[f"A{r}"].value)
    if not b:
        continue
    bpc += 1
    st = {}
    for i, sec in enumerate(secs):
        v = clean(ws.cell(r, 5 + i).value)
        st[sec] = v or "Not Started"
    put("bps", brands[b], {"brand": brands[b], "owner": clean(ws[f"B{r}"].value), "due_date": as_date(ws[f"C{r}"].value),
                           "sections": st, "blocker": clean(ws[f"P{r}"].value), "doc_link": link_of(ws, f"Q{r}"),
                           "notes": clean(ws[f"R{r}"].value)})
counts.append(("BP Tracker", bpc, bpc, "Blank sections stored as Not Started (same result in every formula)"))

# ---------------------------------------------------------------- steps (WIP Alt master)
ws = PTM["WIP Alt Master status tracker "]
phase = None
steps = []
for r in range(5, ws.max_row + 1):
    t = clean(ws[f"C{r}"].value)
    if not t:
        continue
    m = re.match(r"PHASE (\w+): (.+)", t)
    if m:
        phase = (m.group(1), m.group(2).title().replace("Sow", "SOW"))
        k = 0
        continue
    k += 1
    code = f"{phase[0]}.{k:02d}"
    name = re.sub(r"\s+", " ", t).strip()
    name = name.replace("forcast", "Forecast").replace("refering", "referring").replace("FOunder", "Founder")
    name = name[0].upper() + name[1:]
    ex = EXTRAS.get(code, {})
    steps.append(code)
    put("steps", code, {"code": code, "phase": phase[0], "phase_name": phase[1], "order": len(steps), "name": name,
                        "default_owner": ex.get("default_owner", ""), "doc_label": ex.get("doc_label", ""),
                        "hook": ex.get("hook", ""), "is_gate": code in DEC["proposed_gates"],
                        "is_optional": code in DEC["optional_steps"] or "(optional)" in name.lower(),
                        "sheet_note": clean(ws[f"E{r}"].value)})
counts.append(("WIP Alt Master status tracker", len(steps), len(steps), "Gates and optional steps are proposals"))
for name, bid in brands.items():
    put("brand_steps", bid, {"brand": bid, "s": {}})
log("Onboarding Checklist", "-", "No progress to carry", "Excel checklist and the claude.ai board checklist are both empty. Every brand starts at 0%")

# ---------------------------------------------------------------- people
used = set()
for t in tasks:
    if t["owner"]:
        used.add(t["owner"])
    used.update(t["support"])
for (c, _), d in docs.items():
    if c in ("access", "sow", "bps") and d.get("owner"):
        used.add(d["owner"])
people = [{"name": p, "kind": "team", "aliases": [], "active": True} for p in team]
for p in sorted(used - set(team)):
    people.append({"name": p, "kind": "unconfirmed", "aliases": [], "active": True})
    log("People", "-", f"'{p}' added as unconfirmed", "Used in the data but not in the Lists sheet")
put("config", "people", {"people": people})
counts.append(("Lists > Team", len(team), len(people), f"{len(people) - len(team)} more names found in the data"))

# ---------------------------------------------------------------- write
for (c, i), d in docs.items():
    os.makedirs(os.path.join(OUT, c), exist_ok=True)
    json.dump(d, open(os.path.join(OUT, c, i + ".json"), "w"), indent=1, ensure_ascii=False)

with open(os.path.join(OUT, "report.md"), "w") as f:
    f.write("# Migration report\n\n## Counts\n\n| Source | Rows in Excel | Documents | Note |\n| --- | --- | --- | --- |\n")
    for c in counts:
        f.write("| " + " | ".join(str(x) for x in c) + " |\n")
    f.write("\n| Collection | Documents |\n| --- | --- |\n")
    for coll in sorted({c for c, _ in docs}):
        f.write(f"| {coll} | {sum(1 for c, _ in docs if c == coll)} |\n")
    f.write("\n## Changed, merged or dropped\n\n| Sheet | Row | What | Why |\n| --- | --- | --- | --- |\n")
    for ch in changes:
        f.write("| " + " | ".join(str(x).replace("|", "/") for x in ch) + " |\n")
print(f"docs={len(docs)} changes={len(changes)}")
for c in counts:
    print(c)
