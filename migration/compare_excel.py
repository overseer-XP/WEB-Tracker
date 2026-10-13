"""Compare a newer COE Excel against the older one and the live tracker. Proposes changes, writes nothing.

Usage:
    python3 -I migration/compare_excel.py <old_coe.xlsx> <new_coe.xlsx> <seed_dir> <live_dir> <out_dir>

Three-way rule for every field:
    Excel changed it (old Excel != new Excel) and the tracker did not (seed == live)  -> propose the Excel value
    Both changed it to different values                                                -> conflict, ask
    Excel did not change it                                                            -> keep the tracker
seed_dir is what the tracker was loaded with; live_dir is the tracker now.
Writes <out_dir>/proposal.json and <out_dir>/proposal.md.
"""
import datetime
import difflib
import json
import os
import re
import sys

import openpyxl

OLD, NEW, SEED, LIVE, OUT = sys.argv[1:6]
wo, wn = openpyxl.load_workbook(OLD, data_only=True), openpyxl.load_workbook(NEW, data_only=True)


def load(base, coll):
    p = os.path.join(base, coll)
    return {f[:-5]: json.load(open(os.path.join(p, f))) for f in os.listdir(p) if f.endswith(".json")} if os.path.isdir(p) else {}


seed = {c: load(SEED, c) for c in ("brands", "tasks", "sow", "access", "bps")}
live = {c: load(LIVE, c) for c in ("brands", "tasks", "sow", "access", "bps", "brand_steps")}
by_name = {b["name"].lower(): bid for bid, b in live["brands"].items()}


def t(v):
    if v is None:
        return ""
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime("%Y-%m-%d")
    return str(v).replace("\xa0", " ").strip()


def norm(s):
    s = re.sub(r"\(.*?\)|\[.*?\]", "", s.lower())
    s = s.replace("go to market", "gtm").replace("&", "and").replace("+", "and").replace("founders", "founder")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def link(ws, cell):
    c = ws[cell]
    if c.hyperlink is not None and c.hyperlink.target:
        return c.hyperlink.target.strip()
    m = re.search(r"https?://\S+", t(c.value))
    return m.group(0) if m else ""


P = {"brand_new": [], "brand_fields": [], "task_updates": [], "task_new": [], "task_unmatched": [], "sow": [], "bp": [],
     "access": [], "conflicts": [], "kept_tracker": [], "steps": {}, "info": []}


def three_way(area, label, field, old, new, seed_v, live_v, target):
    """target: (collection, id, field). Values compared as text."""
    if new == old:
        return
    if t(seed_v) != t(live_v) and t(live_v) != new:
        P["conflicts"].append({"area": area, "what": label, "field": field, "old_excel": old, "new_excel": new, "tracker": t(live_v)})
        return
    if t(live_v) == new:
        return
    P[area].append({"what": label, "field": field, "from": t(live_v), "to": new, "target": target})


# ---------------------------------------------------------------- brands
def brand_rows(wb):
    ws, out = wb["Brand Tracker"], {}
    for r in range(4, ws.max_row + 1):
        n = t(ws.cell(r, 1).value)
        if n:
            out[n] = {"founder": t(ws.cell(r, 2).value), "website": t(ws.cell(r, 3).value), "stage": t(ws.cell(r, 4).value),
                      "lead": t(ws.cell(r, 5).value), "next_step": t(ws.cell(r, 18).value)}
    return out


bo, bn = brand_rows(wo), brand_rows(wn)
for name, nv in bn.items():
    bid = by_name.get(name.lower())
    if not bid:
        P["brand_new"].append({"name": name, **nv})
        continue
    ov = bo.get(name, {})
    for f in ("founder", "website", "stage", "lead", "next_step"):
        sv = seed["brands"].get(bid, {}).get(f, "")
        three_way("brand_fields", name, f, ov.get(f, sv), nv[f], sv, live["brands"][bid].get(f, ""), ("brands", bid, f))

# ---------------------------------------------------------------- tasks
def tab_rows(wb, name):
    if name not in wb.sheetnames:
        return []
    ws, out = wb[name], []
    for r in range(5, ws.max_row + 1):
        title = t(ws.cell(r, 1).value)
        if title:
            out.append({"title": title, "owner": t(ws.cell(r, 2).value), "support": t(ws.cell(r, 3).value), "status": t(ws.cell(r, 4).value),
                        "priority": t(ws.cell(r, 5).value), "start": t(ws.cell(r, 6).value), "deadline": t(ws.cell(r, 7).value),
                        "notes": t(ws.cell(r, 9).value), "brief_link": link(ws, f"J{r}"), "creative_link": link(ws, f"K{r}"), "row": r})
    return out


def best_match(title, cands):
    n = norm(title)
    scored = sorted(((difflib.SequenceMatcher(None, n, norm(c["title"])).ratio(), c) for c in cands), key=lambda x: -x[0])
    return scored[0] if scored and scored[0][0] >= 0.82 else (scored[0][0] if scored else 0, None)


for name in bn:
    bid = by_name.get(name.lower())
    old_rows = {norm(x["title"]): x for x in tab_rows(wo, name)}
    new_rows = tab_rows(wn, name)
    tracker = [dict(v, _id=k) for k, v in live["tasks"].items() if v.get("brand") == bid] if bid else []
    for x in new_rows:
        o = old_rows.get(norm(x["title"]))
        if o is None:                                   # fuzzy find the old Excel row too (renamed slightly)
            sc, o2 = best_match(x["title"], list(old_rows.values()))
            o = o2
        if o and all(o[k] == x[k] for k in ("owner", "support", "status", "priority", "start", "deadline", "notes")):
            continue                                    # unchanged in Excel since 8 Oct
        m = best_match(x["title"], tracker)
        sc, hit = m if isinstance(m, tuple) else (0, None)
        if hit is None:
            if o is None:
                P["task_new"].append({"brand": name, "brand_id": bid, **{k: x[k] for k in x if k != "row"}})
            else:
                P["task_unmatched"].append({"brand": name, "title": x["title"], "note": "Changed in Excel but no matching task in the tracker"})
            continue
        sid = hit["_id"]
        for f in ("owner", "status", "priority", "start", "deadline", "notes"):
            old_v = (o or {}).get(f, None)
            if old_v is None:
                old_v = "\u0000"                        # new row in Excel: any value counts as a change
            if f == "notes" and x[f] and hit.get("notes") and norm(x[f]) == norm(hit.get("notes", "")):
                continue
            three_way("task_updates", f"{name}: {hit['title']}", f, old_v, x[f], seed["tasks"].get(sid, {}).get(f, ""), hit.get(f, ""), ("tasks", sid, f))

# ---------------------------------------------------------------- SOW
def sow_rows(wb):
    ws, out = wb["SOW Tracker"], {}
    head = [t(c.value) for c in ws[3]]
    col = {h: i + 1 for i, h in enumerate(head)}
    for r in range(4, ws.max_row + 1):
        n = t(ws.cell(r, 1).value)
        if not n:
            continue
        g = lambda h: t(ws.cell(r, col[h]).value) if h in col else ""
        out[n] = {"owner": g("SOW Owner"), "stage": g("SOW Stage"), "start_date": g("Start Date"), "draft_due": g("Draft Due"),
                  "target_sign": g("Target Sign Date"), "blocker": g("Blocker / Dependency"), "next_step": g("Next Step"),
                  "sow_link": link(ws, f"{openpyxl.utils.get_column_letter(col['SOW Link'])}{r}") if "SOW Link" in col else "",
                  "batch": g("Batch"), "gf_status": g("GF Status"),
                  "gf_link": link(ws, f"{openpyxl.utils.get_column_letter(col['GF Link'])}{r}") if "GF Link" in col else ""}
    return out


so, sn = sow_rows(wo), sow_rows(wn)
for name, nv in sn.items():
    bid = by_name.get(name.lower())
    if not bid or bid not in live["sow"]:
        continue
    ov = so.get(name, {})
    for f in ("owner", "stage", "start_date", "draft_due", "target_sign", "blocker", "next_step", "sow_link", "gf_link", "gf_status"):
        new = nv[f]
        if f in ("sow_link", "gf_link") and not new:
            continue                                     # never wipe a link
        if f == "batch":
            continue
        three_way("sow", name, f, ov.get(f, ""), new, seed["sow"].get(bid, {}).get(f, ""), live["sow"][bid].get(f, ""), ("sow", bid, f))

# ---------------------------------------------------------------- BP
def bp_rows(wb):
    ws, out = wb["BP Tracker"], {}
    secs = [t(ws.cell(3, c).value) for c in range(5, 14)]
    for r in range(4, ws.max_row + 1):
        n = t(ws.cell(r, 1).value)
        if n:
            out[n] = {"owner": t(ws.cell(r, 2).value), "due_date": t(ws.cell(r, 3).value), "blocker": t(ws.cell(r, 16).value),
                      "notes": t(ws.cell(r, 18).value), **{"sec:" + s: t(ws.cell(r, 5 + i).value) or "Not Started" for i, s in enumerate(secs)}}
    return out


po, pn = bp_rows(wo), bp_rows(wn)
for name, nv in pn.items():
    bid = by_name.get(name.lower())
    if not bid or bid not in live["bps"]:
        continue
    ov = po.get(name, {})
    for f, new in nv.items():
        if f.startswith("sec:"):
            s = f[4:]
            three_way("bp", name, s, ov.get(f, "Not Started"), new, (seed["bps"][bid].get("sections") or {}).get(s, "Not Started"),
                      (live["bps"][bid].get("sections") or {}).get(s, "Not Started"), ("bps", bid, "sections." + s))
        else:
            three_way("bp", name, f, ov.get(f, ""), new, seed["bps"][bid].get(f, ""), live["bps"][bid].get(f, ""), ("bps", bid, f))

# ---------------------------------------------------------------- platform access
def pa_rows(wb):
    ws, out = wb["Platform Access"], {}
    for r in range(4, ws.max_row + 1):
        n, p = t(ws.cell(r, 1).value), t(ws.cell(r, 2).value)
        if n:
            out[(n, p)] = {"owner": t(ws.cell(r, 5).value), "status": t(ws.cell(r, 9).value), "blocker": t(ws.cell(r, 12).value), "notes": t(ws.cell(r, 13).value)}
    return out


ao, an = pa_rows(wo), pa_rows(wn)
for (name, plat), nv in an.items():
    bid = by_name.get(name.lower())
    hit = next((k for k, v in live["access"].items() if v.get("brand") == bid and v.get("platform") == plat), None)
    if not hit:
        P["info"].append(f"Platform row {name} / {plat} not in tracker")
        continue
    for f, new in nv.items():
        three_way("access", f"{name} {plat}", f, ao.get((name, plat), {}).get(f, ""), new, seed["access"].get(hit, {}).get(f, ""), live["access"][hit].get(f, ""), ("access", hit, f))

# ---------------------------------------------------------------- onboarding checklist (new step list)
def checklist(ws):
    steps, ph, cols = [], None, {}
    for c in range(3, ws.max_column + 1):
        n = t(ws.cell(3, c).value)
        if n:
            cols[c] = n
    for r in range(6, ws.max_row + 1):
        a, b = t(ws.cell(r, 1).value), t(ws.cell(r, 2).value)
        if a.upper().startswith("PHASE"):
            ph = a
            continue
        if b:
            steps.append({"row": r, "phase": ph, "name": b, "status": {cols[c]: t(ws.cell(r, c).value) for c in cols}})
    return steps, list(cols.values())


main_steps, main_brands = checklist(wn["Onboarding Checklist"])
arch_steps, arch_brands = checklist(wn["Onboarding ARCHIVE"])
P["steps"] = {"list": [{"phase": s["phase"], "name": s["name"]} for s in main_steps],
              "status": {b: {s["name"]: s["status"].get(b, "") for s in main_steps} for b in main_brands},
              "archive_status": {b: {s["name"]: s["status"].get(b, "") for s in arch_steps} for b in arch_brands if b not in main_brands and b.lower() in by_name},
              "brands_main": main_brands, "brands_archive": [b for b in arch_brands if b not in main_brands]}

os.makedirs(OUT, exist_ok=True)
json.dump(P, open(os.path.join(OUT, "proposal.json"), "w"), indent=1, ensure_ascii=False)
print({k: len(v) for k, v in P.items() if isinstance(v, list)}, "steps:", len(main_steps), "brands with ticks:", len(main_brands), "archive:", P["steps"]["brands_archive"])
