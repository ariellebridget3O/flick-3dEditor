#!/usr/bin/env python3
"""run_matrix.py — pixel-oracle case registry + runner.

Modes:
  --live  [cases…]   run the LIVE capture chain per case → out/live/<case>.png
                     (login once, deep-link per case; M3/M5 PATCH the oracle
                     scene row first)
  --ours  [cases…]   run OUR side (fresh browser session per case — the
                     ES-module cache) → out/ours_<case>.png
  --diff  [cases…]   diff golden/live vs ours per case (diff.py), print a
                     table, exit 1 if any case FAILs
  --all              --ours + --diff (live is opt-in: it is slow)

Case naming: out/ours_<case>.png (ours), out/live/<case>.png (fresh live
captures), golden/<case>_live.png (committed live references).

M2 default is GREEN (99.30 %≤8 / mean 0.354, r11 session). Full matrix
r11-3b: 4/7 PASS (m2 0.353/99.30, m3_golden 0.996/98.72, m3_night 0.818/99.30,
m4_finish 0.440/99.16); m3_dusk marginal FAIL (1.630/97.18 — horizon sun-glow
band); m1_lens + m5_cam_path FAIL on the OPEN lens-path divergence (both
%≤8 32.72, whole-frame blob — see README gotchas). All 7 goldens committed.
"""
import argparse
import importlib
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "out")
GOLDEN = os.path.join(HERE, "golden")

BASE_FIXTURE = "samples/live_oracle_r11_base.json"      # relative to editor/
CAM_PATH_CAMERA_ID = "ff46ae76-c56a-417b-8f51-7dfe5996803a"
BASE_SCENE_OBJECTS = 7                                   # r11 Scene 1 = 7 objects

# ------------------------------------------------------------------ registry
# live_scene: the scene_id the deep link opens (BASE = the project's real
#   Scene 1; ORACLE = the dedicated PATCHable row ba11e0ba-…-0ba)
BASE, ORACLE = "base", "oracle"
CASES = {
    "m2_default": dict(
        title="M2 default editor view (GREEN)",
        fixture=BASE_FIXTURE, t=2.51, view="scene", finish=False,
        live_scene=BASE, expected_az=128.66,
        status="GREEN 99.30 %≤8 / mean 0.354 (r11)",
    ),
    "m1_lens": dict(
        title="M1 through-the-lens, end-of-orbit t=5.0",
        fixture=BASE_FIXTURE, t=5.0, view="cameras", finish=False,
        live_scene=BASE, expected_az=128.66, camera_id=CAM_PATH_CAMERA_ID,
        status="READY — R9 lens was 97.81 %≤8 / mean 1.3; re-measure under "
               "the r11 camera-poser (mean≤1.0 may need a case-specific relax)",
    ),
    "m3_light_golden": dict(
        title="M3 light stop: golden hour az210 el10",
        fixture="samples/oracle_r11/light_golden.json", t=2.51, view="scene",
        finish=False, live_scene=ORACLE, expected_az=210,
        status="LIVE-ONLY-READY — fixtures.py generated; needs live PATCH run",
    ),
    "m3_light_dusk": dict(
        title="M3 light stop: dusk az250 el-4",
        fixture="samples/oracle_r11/light_dusk.json", t=2.51, view="scene",
        finish=False, live_scene=ORACLE, expected_az=250,
        status="r11-3b FAIL (marginal) mean 1.630 / 97.18 %≤8 — passes "
               "%≤8, misses mean≤1.0 on the horizon sun-glow band "
               "(top blob 6317px x179-900 y40-52, el=-4 sun on horizon)",
    ),
    "m3_light_night": dict(
        title="M3 light stop: night az300 el-25",
        fixture="samples/oracle_r11/light_night.json", t=2.51, view="scene",
        finish=False, live_scene=ORACLE, expected_az=300,
        status="GREEN r11-3b 99.30 %≤8 / mean 0.818 (dark scene diffs quietly)",
    ),
    "m4_finish": dict(
        title="M4 finish composer (stage-finish manual, both sides)",
        fixture=BASE_FIXTURE, t=2.51, view="scene", finish=True,
        live_scene=BASE, expected_az=128.66,
        status="GREEN r11-3b 99.16 %≤8 / mean 0.440 (finish verified live: "
               "unique 2074→3777, plain-vs-finish delta 0.50 ≈ ours 0.53)",
    ),
    "m5_cam_path": dict(
        title="M5 cam-path (3 waypoints, aim=subject), t=4.0 lens",
        fixture="samples/oracle_r11/cam_path.json", t=4.0, view="cameras",
        finish=False, live_scene=ORACLE, expected_az=128.66,
        camera_id=CAM_PATH_CAMERA_ID,
        status="GOLDEN r11-3b, FAIL 32.72/60.99 — SAME lens-path divergence "
               "as m1 (live flat-bright 213 vs ours 153, lum-ratio bimodal "
               "1.0/1.67); cam-path motion itself works (feed not empty)",
    ),
}
ORDER = ["m2_default", "m1_lens", "m3_light_golden", "m3_light_dusk",
         "m3_light_night", "m4_finish", "m5_cam_path"]


def sel_cases(names):
    if not names:
        return ORDER
    bad = [n for n in names if n not in CASES]
    if bad:
        sys.exit(f"unknown case(s) {bad}; known: {ORDER}")
    return names


def live_scene_id(kind):
    import live
    return live.BASE_SCENE_ID if kind == BASE else live.ORACLE_SCENE_ID


def _png_stats(path):
    """Capture sanity: size, unique colors, pixel std (a gray never-rendered
    canvas has ~0 std; the finish composer shows up as a unique-color jump)."""
    import numpy as np
    from PIL import Image
    im = Image.open(path).convert("RGB")
    colors = im.getcolors(maxcolors=500000)
    a = np.asarray(im)
    return (f"{im.size[0]}x{im.size[1]} unique={len(colors) if colors else '>500k'} "
            f"std={a.std():.1f}")


# ------------------------------------------------------------------- runners
def run_live(names, session="po-live"):
    import live as L
    os.makedirs(os.path.join(OUT, "live"), exist_ok=True)
    s = L.LiveSession(session=session)
    try:
        s.login()
        s.inject_flags()  # flags persist in localStorage across the deep links
        for name in names:
            c = CASES[name]
            print(f"=== LIVE {name}: {c['title']}")
            tab = "Scene 1"  # base Scene 1 tab (the r11-verified flow)
            if c["live_scene"] == ORACLE:
                fx = os.path.join(REPO, "editor", c["fixture"])
                with open(fx) as f:
                    scene = json.load(f)
                # PATCH the oracle row + READ-BACK VERIFY before deep-linking
                # (a 2xx PATCH can silently affect 0 rows — the quirk)
                print("  " + s.patch_oracle_verified(scene))
                # the tab strip lists one tab per scene row — click by NAME
                tab = L.ORACLE_SCENE_NAME
            sid = live_scene_id(c["live_scene"])
            loaded = s.deep_link(sid, finish=c["finish"],
                                 expect_objects=BASE_SCENE_OBJECTS,
                                 tab_name=tab)
            print(f"  scene: {loaded}")
            rect = s.collapse_panels()
            print(f"  panels: canvas {rect}")
            sk = s.seek_kick(c["t"])
            print(f"  seek: {sk}")
            conv = s.converge()
            print(f"  converge: {conv}")
            if not conv["converged"]:
                print(f"  WARN: live render did not fully converge (diff={conv['diff']})")
            out = os.path.join(OUT, "live", name + ".png")
            if c["view"] == "cameras":
                s.cameras_capture(out)
            else:
                s.capture(out)
            print(f"  → {out}  [{_png_stats(out)}]")
    finally:
        s.close()
    return 0


def run_ours(names, bump=None):
    import ours as O
    fixtures = importlib.import_module("fixtures")
    made = fixtures.generate_all()          # ensure variant fixtures exist
    print(f"fixtures: {len(made)} generated/refreshed")
    fixtures.maybe_sync()                   # :3000 serves the rsync copy
    bump = bump or int(time.time())
    for name in names:
        c = CASES[name]
        print(f"=== OURS {name}: {c['title']}")
        sess = f"po-ours-{name}-{bump}"     # FRESH session: ES-module cache
        s = O.OursSession(sess)
        try:
            out = os.path.join(OUT, f"ours_{name}.png")
            s.capture(c["fixture"], c["t"], out, finish=c["finish"],
                      cameras=(c["view"] == "cameras"),
                      camera_id=c.get("camera_id"),
                      expected_az=c["expected_az"], bump=bump)
            print(f"  → {out}")
        finally:
            s.close()
    return 0


def run_diff(names):
    rows = []
    any_fail = False
    for name in names:
        c = CASES[name]
        # live reference = committed golden first, fresh live capture second
        gold = os.path.join(GOLDEN, f"{name}_live.png")
        fresh = os.path.join(OUT, "live", f"{name}.png")
        live_png = gold if os.path.exists(gold) else (fresh if os.path.exists(fresh) else None)
        ours_png = os.path.join(OUT, f"ours_{name}.png")
        if not live_png:
            rows.append((name, "SKIP", "no live reference (run --live or add golden)"))
            continue
        if not os.path.exists(ours_png):
            rows.append((name, "SKIP", "no ours capture (run --ours)"))
            continue
        cmd = [sys.executable, os.path.join(HERE, "diff.py"), live_png, ours_png, "--json"]
        if c["view"] == "cameras":
            cmd.insert(-1, "--cameras")
        p = subprocess.run(cmd, capture_output=True, text=True)
        try:
            stats = json.loads(p.stdout)
        except json.JSONDecodeError:
            rows.append((name, "ERR", (p.stdout + p.stderr).strip()[:120]))
            any_fail = True
            continue
        verdict = "PASS" if stats["pass"] else "FAIL"
        any_fail |= not stats["pass"]
        rows.append((name, verdict,
                     f"mean {stats['mean']:.3f}  %≤8 {stats['p_le8']:.2f}  "
                     f"blobs {len(stats['blobs'])}  [{os.path.relpath(live_png, HERE)}]"))
    print(f"{'case':16s} {'verdict':6s} detail")
    for name, verdict, detail in rows:
        print(f"{name:16s} {verdict:6s} {detail}")
    print("(thresholds: masked mean ≤1.0 AND %≤8 ≥97.0; M2 r11 = 0.354/99.30)")
    return 1 if any_fail else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--live", nargs="*", metavar="CASE", help="run live captures (all cases if none given)")
    ap.add_argument("--ours", nargs="*", metavar="CASE", help="run our-side captures")
    ap.add_argument("--diff", nargs="*", metavar="CASE", help="diff live/goldens vs ours")
    ap.add_argument("--all", action="store_true", help="--ours + --diff")
    ap.add_argument("--list", action="store_true", help="list the case registry")
    ap.add_argument("--bump", type=int, default=None, help="cache-bust ?v= for ours")
    ap.add_argument("--case", action="append", metavar="CASE",
                    help="select case(s) by name for the mode flags (repeatable; "
                         "`--live --case X` == `--live X`) — appends to the "
                         "positional case list of whichever mode was given")
    ap.add_argument("--session", default="po-live",
                    help="agent-browser session name for --live (use a fresh "
                         "name per run — a crashed run can leave its browser)")
    args = ap.parse_args()
    if args.case:  # bare `--live --case X` parses as live=[] + case=[X]
        for mode in ("live", "ours", "diff"):
            v = getattr(args, mode)
            if v is not None:
                setattr(args, mode, v + args.case)

    if args.list:
        for name in ORDER:
            c = CASES[name]
            print(f"{name:16s} {c['title']}\n                 fixture={c['fixture']} "
                  f"t={c['t']} view={c['view']} finish={c['finish']} live={c['live_scene']}\n"
                  f"                 status: {c['status']}")
        return 0
    if not (args.live is not None or args.ours is not None or args.diff is not None or args.all):
        ap.print_help()
        return 0

    rc = 0
    if args.live is not None:
        rc |= run_live(sel_cases(args.live), session=args.session)
    if args.ours is not None:
        rc |= run_ours(sel_cases(args.ours), bump=args.bump)
    elif args.all:
        rc |= run_ours(ORDER, bump=args.bump)
    if args.diff is not None:
        rc |= run_diff(sel_cases(args.diff))
    elif args.all:
        rc |= run_diff(ORDER)
    return rc


if __name__ == "__main__":
    sys.exit(main())
