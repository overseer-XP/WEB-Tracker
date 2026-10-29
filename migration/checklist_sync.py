"""Bring the COE tracker's Onboarding Checklist tab into VALFLO.

Usage:
    python3 -I migration/checklist_sync.py <coe_tracker.xlsx> <live_dir> <out_dir>

Takes only: step states, the "Status and Next Steps" row and the SOW links (the cell hyperlinks).
Everything else on the tab (Stage, Owners, meetings, dates, notes rows) is ignored.

Writes <out_dir>/report.md and batch_N.json files (up to 40 writes each) for the artifact database.
Every write to an existing record is pinned to the version in <live_dir>/versions.json.
Rules:
  - blank sheet cells never wipe a tracker value
  - steps the sheet marks Blocked keep their status and get a blocker note (the tracker's step list has no Blocked status)
  - steps on the tab that the tracker does not have are added to the step list (same phase, after the last step)
  - brands on the tab that the tracker does not have are added, with a SOW row and their step states
"""
import datetime
import json
import os
import re
import sys

from openpyxl import load_workbook

XLSX, LIVE, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
TODAY = datetime.date.today().isoformat()
NOW = int(datetime.datetime.now().timestamp() * 1000)


def load(coll):
    p = os.path.join(LIVE, coll)
    return {f[:-5]: json.load(open(os.path.join(p, f))) for f in sorted(os.listdir(p)) if f.endswith(".json")} if os.path.isdir(p) else {}


VERS = json.load(open(os.path.join(LIVE, "versions.json")))
brands, steps, bsteps, sow = load("brands"), load("steps"), load("brand_steps"), load("sow")
norm = lambda s: re.sub(r"[^a-z0-9]+", "", str(s or "").lower())
STATUS = {"done": "Done", "inprogress": "In Progress", "notstarted": "Not Started", "na": "N/A", "blocked": "Blocked"}
BLOCK_NOTE = f"Marked Blocked in the COE tracker (Onboarding Checklist, {TODAY})"

wb = load_workbook(XLSX, data_only=True)  # values as last saved in Excel (brand names on the tab are formulas)
ws = wb["Onboarding Checklist"]
rows = list(ws.iter_rows())
links_wb = load_workbook(XLSX)  # hyperlinks live on the formula copy
links_ws = links_wb["Onboarding Checklist"]
hdr_i = next(i for i, r in enumerate(rows) if r[0].value == "Phase" and r[1].value == "Step")
cols = [(c.column - 1, str(c.value).strip()) for c in rows[hdr_i][2:] if c.value and str(c.value).strip()]

# brands: sheet name -> tracker id (existing) or a new id
by_name = {norm(b["name"]): k for k, b in brands.items()}
brand_of, new_brands = {}, []
for ci, name in cols:
    k = by_name.get(norm(name))
    if not k:
        k = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        while k in brands:
            k += "-2"
        new_brands.append((k, name))
    brand_of[ci] = k

# steps: sheet row -> tracker code; collect rows the tracker lacks
by_step = {norm(s["name"]): k for k, s in steps.items()}
by_src = {norm(s.get("source_name", "")): k for k, s in steps.items()}
phase_of_row, step_rows, new_steps = None, [], []
for r in rows[hdr_i + 1:]:
    a, b = r[0].value, r[1].value
    if a and str(a).startswith("PHASE"):
        m = re.match(r"PHASE\s+(\d+)", str(a))
        phase_of_row = "P" + m.group(1) if m else None
        continue
    if a == "SOW LINKS" or not b or not phase_of_row:
        continue
    label = str(b).strip()
    if label in ("% Complete",) or label.startswith("Executive Summary"):
        continue
    if not any(r[ci].value for ci, _ in cols):
        continue
    if label in ("Date of Action Agreed", "Stage", "Status and Next Steps", "Owners") or label.startswith("Meeting"):
        continue
    code = by_step.get(norm(label)) or by_src.get(norm(label)) or next((k for n, k in by_step.items() if n and (norm(label).startswith(n) or n.startswith(norm(label)))), None)
    if not code:
        ph = [s for s in steps.values() if s["phase"] == phase_of_row] + [s for s in new_steps if s["phase"] == phase_of_row]
        n = max(int(s["code"].split(".")[1]) for s in ph) + 1
        code = f"{phase_of_row}.{n:02d}"
        base = max(s["order"] for s in steps.values() if s["phase"] == phase_of_row) + sum(1 for s in new_steps if s["phase"] == phase_of_row)
        ref = next(s for s in steps.values() if s["phase"] == phase_of_row)
        new_steps.append({"code": code, "default_owner": "", "doc_label": "", "hook": "", "is_gate": False, "is_optional": False, "name": label,
                          "order": base + 1, "phase": phase_of_row, "phase_name": ref["phase_name"], "sheet_note": "", "source_name": label})
    step_rows.append((code, label, r))

# later phases' orders move up to make room for the new steps
order_shift = {}
for ns in new_steps:
    for k, s in steps.items():
        if s["order"] >= ns["order"] and s["phase"] != ns["phase"]:
            order_shift[k] = order_shift.get(k, s["order"]) + 1

status_row = next((r for r in rows if r[1].value == "Status and Next Steps"), None)
links_row = next((r for r in links_ws.iter_rows() if r[0].value == "SOW LINKS"), None)

writes, report, log_entries = [], [], []
def log(what, rid, label, field, old, new):
    f = lambda v: "" if v is None else (json.dumps(v) if isinstance(v, (dict, list)) else str(v))[:140]
    log_entries.append({"at": NOW, "what": what, "id": rid, "label": label, "field": field, "old": f(old), "new": f(new)})

for ns in new_steps:
    writes.append({"op": "set", "collection": "steps", "doc_id": ns["code"], "data": ns})
    log("steps", ns["code"], "New step from the COE tracker", "name", "", ns["name"])
for k, o in order_shift.items():
    writes.append({"op": "update", "collection": "steps", "doc_id": k, "data": {"order": o}, "if_version": VERS.get("steps/" + k, 1)})

PHASE_STAGE = {"P1": "Qualification", "P2": "Setup", "P3": "Setup", "P4": "Founder Workshops", "P5": "Best Practices + Briefs", "P6": "SOW", "P7": "SOW"}
all_steps = sorted(list(steps.values()) + new_steps, key=lambda s: s["order"])
step_changes, blocked_marks, new_brand_rows = {}, {}, []
for ci, name in cols:
    bid = brand_of[ci]
    cur = (bsteps.get(bid) or {}).get("s", {})
    nxt = {k: dict(v) for k, v in cur.items()}
    changed = []
    for code, label, r in step_rows:
        raw = r[ci].value
        if raw is None or str(raw).strip() == "":
            continue
        v = STATUS.get(norm(raw))
        if not v:
            continue
        old = cur.get(code, {})
        if v == "Blocked":
            if (old.get("blocker") or {}).get("text"):
                continue
            e = dict(old); e["blocker"] = {"text": BLOCK_NOTE, "person": ""}; e.setdefault("status", "Not Started")
            nxt[code] = e; changed.append((code, old.get("status", "Not Started"), "Blocked (note added)"))
            blocked_marks[bid] = blocked_marks.get(bid, 0) + 1
            continue
        if old.get("status", "Not Started") != v:
            e = dict(old); e["status"] = v
            if v in ("Done", "N/A") and e.get("blocker"):
                e["blocker"] = None
            nxt[code] = e; changed.append((code, old.get("status", "Not Started"), v))
    is_new = bid in dict(new_brands)
    if is_new:
        first_open = next((s["phase"] for s in all_steps if not s["is_optional"] and nxt.get(s["code"], {}).get("status") not in ("Done", "N/A")), "P7")
        stage = PHASE_STAGE.get(first_open, "Qualification")
        status_txt = (status_row[ci].value or "").strip() if status_row else ""
        link = links_row[ci].hyperlink.target if links_row and links_row[ci].hyperlink else ""
        order = len(brands) + len(new_brand_rows) + 1
        writes.append({"op": "set", "collection": "brands", "doc_id": bid, "data": {"name": name, "founder": "", "website": "", "stage": stage, "stage_since": TODAY, "lead": "", "next_step": status_txt,
                       "sprint_label": "", "order": order, "paused": False, "restricted": False, "created_at": NOW, "updated_at": NOW, "updated_by": "coe-checklist-import"}})
        writes.append({"op": "set", "collection": "brand_steps", "doc_id": bid, "data": {"brand": bid, "s": nxt, "updated_at": NOW}})
        writes.append({"op": "set", "collection": "sow", "doc_id": bid, "data": {"brand": bid, "owner": "", "support": [], "stage": "Not Started", "start_date": "", "draft_due": "", "target_sign": "",
                       "blocker": "", "next_step": "", "sow_link": link or "", "gf_link": "", "gf_updated": False, "gf_status": "", "batch": ""}})
        new_brand_rows.append((bid, name, stage, len(changed), status_txt[:80]))
        log("brands", bid, name, "created", "", "From the COE tracker Onboarding Checklist, stage " + stage)
    elif changed:
        doc = dict(bsteps[bid]); doc["s"] = nxt; doc["updated_at"] = NOW
        writes.append({"op": "set", "collection": "brand_steps", "doc_id": bid, "data": doc, "if_version": VERS["brand_steps/" + bid]})
    if changed and not is_new:
        step_changes[bid] = changed
        for code, o, n in changed:
            log("brand_steps", bid, brands[bid]["name"] + " " + code, "status", o, n)

# Status and Next Steps -> the brand's Next step; SOW links -> the SOW row (existing brands)
note_changes, link_changes = [], []
for ci, name in cols:
    bid = brand_of[ci]
    if bid in dict(new_brands):
        continue
    if status_row:
        txt = (status_row[ci].value or "").strip()
        if txt and norm(txt) not in ("na", "") and txt != (brands[bid].get("next_step") or ""):
            writes.append({"op": "update", "collection": "brands", "doc_id": bid, "data": {"next_step": txt, "updated_at": NOW, "updated_by": "coe-checklist-import"}, "if_version": VERS["brands/" + bid]})
            note_changes.append((bid, brands[bid].get("next_step") or "", txt))
            log("brands", bid, brands[bid]["name"], "next_step", brands[bid].get("next_step") or "", txt)
    if links_row and links_row[ci].hyperlink and links_row[ci].hyperlink.target and bid in sow:
        url = links_row[ci].hyperlink.target
        if url != (sow[bid].get("sow_link") or ""):
            writes.append({"op": "update", "collection": "sow", "doc_id": bid, "data": {"sow_link": url}, "if_version": VERS["sow/" + bid]})
            link_changes.append((bid, sow[bid].get("sow_link") or "", url, str(links_row[ci].value)))
            log("sow", bid, brands[bid]["name"], "sow_link", sow[bid].get("sow_link") or "", url)

writes.append({"op": "set", "collection": "log", "doc_id": TODAY + "_coe-checklist-import", "data": {"date": TODAY, "who": "coe-checklist-import", "person": "COE tracker import", "entries": log_entries[-400:]}})

batches = [writes[i:i + 40] for i in range(0, len(writes), 40)]
for i, b in enumerate(batches, 1):
    json.dump(b, open(os.path.join(OUT, f"batch_{i}.json"), "w"), indent=0)

name = lambda b: (brands.get(b) or {}).get("name") or dict(new_brands).get(b, b)
R = [f"# Onboarding Checklist import, {TODAY}", "", f"Writes: {len(writes)} in {len(batches)} batches.", "",
     "## New steps", "", "| Code | Phase | Step |", "|---|---|---|"] + [f"| {s['code']} | {s['phase']} | {s['name']} |" for s in new_steps]
R += ["", "## New brands", "", "| Id | Name | Stage (from first open phase) | Steps set | Status and Next Steps |", "|---|---|---|---|---|"] + [f"| {a} | {b} | {c} | {d} | {e} |" for a, b, c, d, e in new_brand_rows]
R += ["", "## Step changes on existing brands", "", "| Brand | Changes | Detail |", "|---|---|---|"] + [f"| {name(b)} | {len(c)} | " + "; ".join(f"{x[0]} {x[1]} → {x[2]}" for x in c[:12]) + (" …" if len(c) > 12 else "") + " |" for b, c in step_changes.items()]
R += ["", f"Steps marked Blocked (note added, status kept): {sum(blocked_marks.values())} across {len(blocked_marks)} brands", "",
      "## Next step replaced by Status and Next Steps", "", "| Brand | Was | Now |", "|---|---|---|"] + [f"| {name(b)} | {o[:70]} | {n[:70].replace(chr(10), ' ')} |" for b, o, n in note_changes]
R += ["", "## SOW links", "", "| Brand | Was | Now (file name on the sheet) |", "|---|---|---|"] + [f"| {name(b)} | {'set' if o else 'empty'} | {f} |" for b, o, u, f in link_changes]
open(os.path.join(OUT, "report.md"), "w").write("\n".join(R) + "\n")
print("\n".join(R))
