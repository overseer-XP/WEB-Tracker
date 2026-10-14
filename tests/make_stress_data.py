"""Build a large fake data folder for stress tests: N copies of every real brand.

Usage: python3 -I tests/make_stress_data.py <live_dir> <out_dir> <copies>
Copies get new ids (brand-x2, ...), so the app treats them as separate brands.
"""
import json, os, random, shutil, sys, time
live, out, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
random.seed(7)
shutil.rmtree(out, ignore_errors=True)
L = lambda c: {f[:-5]: json.load(open(os.path.join(live, c, f))) for f in os.listdir(os.path.join(live, c)) if f.endswith(".json")} if os.path.isdir(os.path.join(live, c)) else {}
D = {c: L(c) for c in ["brands", "tasks", "access", "sow", "bps", "brand_steps", "steps", "config"]}
O = {c: {} for c in D}
O["steps"], O["config"] = D["steps"], D["config"]
people = [p["name"] for p in D["config"]["people"]["people"] if p.get("active", True)]
now = int(time.time() * 1000)
for k in range(1, n + 1):
    sfx = "" if k == 1 else "-x%d" % k
    for bid, b in D["brands"].items():
        nb = dict(b); nb["name"] = b["name"] + ("" if k == 1 else " %d" % k); nb["order"] = b.get("order", 0) + 100 * k
        nb["updated_at"] = now - random.randint(0, 20) * 86400000
        O["brands"][bid + sfx] = nb
    for col in ["sow", "bps", "brand_steps"]:
        for bid, d in D[col].items():
            nd = json.loads(json.dumps(d)); nd["brand"] = bid + sfx; O[col][bid + sfx] = nd
    for tid, t in D["tasks"].items():
        nt = dict(t); nt["brand"] = (t["brand"] + sfx) if t.get("brand") else ""
        if not nt.get("deadline") and random.random() < .5:
            nt["deadline"] = time.strftime("%Y-%m-%d", time.localtime(time.time() + random.randint(-20, 30) * 86400))
        if random.random() < .3: nt["owner"] = random.choice(people)
        O["tasks"][tid + sfx] = nt
    for aid, a in D["access"].items():
        na = dict(a); na["brand"] = a["brand"] + sfx; O["access"][aid + sfx] = na
O["comments"] = {"c%d" % i: {"brand": random.choice(list(O["brands"])), "text": "Update %d for @%s" % (i, random.choice(people)), "by": random.choice(people), "at": now - i * 3600000, "mentions": []} for i in range(800)}
for c, docs in O.items():
    os.makedirs(os.path.join(out, c), exist_ok=True)
    for i, d in docs.items(): json.dump(d, open(os.path.join(out, c, i + ".json"), "w"))
print({c: len(v) for c, v in O.items()})
