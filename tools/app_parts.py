"""VALFLO source parts <-> app/index.html.

The app ships as one file (claude.ai needs a single page; web/build.mjs wraps the same file for the website).
For editing, the file is split into parts under src/:

    src/00-head.html        title, fonts
    src/styles.css          every style rule
    src/10-body.html        page shell between </style> and <script>
    src/js/NN-name.js       the script, one file per section (split at the "/* ---------- name ---------- */" banners)
    src/90-tail.html        everything after </script>
    src/parts.json          the order the parts are joined in

Usage:
    python3 -I tools/app_parts.py split     # app/index.html -> src/   (overwrites src/)
    python3 -I tools/app_parts.py build     # src/ -> app/index.html
    python3 -I tools/app_parts.py check     # exit 1 if app/index.html is not exactly what src/ builds

Joining is plain concatenation, so a build of an unchanged split is byte-for-byte the same file.
"""
import json, os, re, shutil, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
APP = os.path.join(ROOT, "app", "index.html")
SRC = os.path.join(ROOT, "src")


def slug(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:40].rstrip("-") or "part"


def split():
    t = open(APP, encoding="utf-8").read()
    s0 = t.index("<style>") + len("<style>"); s1 = t.index("</style>")
    j0 = t.index("<script>", s1) + len("<script>"); j1 = t.rindex("</script>")
    pieces = [("00-head.html", t[:s0]), ("styles.css", t[s0:s1]), ("10-body.html", t[s1:j0])]
    js = t[j0:j1]
    cuts = [m.start() for m in re.finditer(r"^/\* ---------- ", js, re.M)]
    starts = [0] + cuts
    for n, a in enumerate(starts):
        b = starts[n + 1] if n + 1 < len(starts) else len(js)
        if a == b: continue
        m = re.match(r"/\* ---------- ([^\n*]+?)(?: -+)? ?(?:\*/|$)", js[a:a + 200], re.M)
        name = slug(m.group(1)) if m and a else "start"
        pieces.append((f"js/{n:02d}-{name}.js", js[a:b]))
    pieces.append(("90-tail.html", t[j1:]))
    if os.path.isdir(SRC): shutil.rmtree(SRC)
    os.makedirs(os.path.join(SRC, "js"))
    for name, body in pieces:
        with open(os.path.join(SRC, name), "w", encoding="utf-8", newline="") as f: f.write(body)
    json.dump([n for n, _ in pieces], open(os.path.join(SRC, "parts.json"), "w"), indent=1)
    print(f"split into {len(pieces)} parts ({len(pieces) - 4} script sections)")


def joined():
    order = json.load(open(os.path.join(SRC, "parts.json")))
    return "".join(open(os.path.join(SRC, n), encoding="utf-8", newline="").read() for n in order)


def build():
    with open(APP, "w", encoding="utf-8", newline="") as f: f.write(joined())
    print("built", APP)


def check():
    same = open(APP, encoding="utf-8", newline="").read() == joined()
    print("app/index.html matches src/" if same else "app/index.html differs from src/: run tools/app_parts.py build (or split)")
    sys.exit(0 if same else 1)


if __name__ == "__main__":
    {"split": split, "build": build, "check": check}[sys.argv[1] if len(sys.argv) > 1 else "check"]()
