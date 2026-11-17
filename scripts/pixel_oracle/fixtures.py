#!/usr/bin/env python3
"""fixtures.py — generate the oracle variant fixtures from the r11 base scene.

Variants (written to editor/samples/oracle_r11/):
  light_golden.json  light {azimuthDeg:210, elevationDeg:10}
  light_dusk.json    light {azimuthDeg:250, elevationDeg:-4}
  light_night.json   light {azimuthDeg:300, elevationDeg:-25}
  cam_path.json      the orbit track item replaced by a cam-path item
                     (anchors = buildTangents of the 3 waypoints, via node
                     importing editor/js/curves.js — no drift from the real
                     sqrt-chordal Catmull-Rom port)

The SAME JSON is what gets PATCHed to the live oracle scene row for the
M3/M5 cases (run_matrix --live reads these files), so live and ours load
byte-identical scene content.

After generating, run scripts/sync-editor.sh (parent dir) so the :3000
dev server sees the new samples.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
BASE_FIXTURE = os.path.join(REPO, "editor", "samples", "live_oracle_r11_base.json")
OUT_DIR = os.path.join(REPO, "editor", "samples", "oracle_r11")
CURVES_JS = os.path.join(REPO, "editor", "js", "curves.js")

# the figure the cam-path aims at (Figure 1 in the base scene)
CAM_PATH_SUBJECT_ID = "8ed00268-2709-40c1-865d-c7f5307b5e9f"
CAM_PATH_CAMERA_ID = "ff46ae76-c56a-417b-8f51-7dfe5996803a"  # Camera 1 (lens case)
CAM_PATH_WAYPOINTS = [[-3.5, 1.2, 3.5], [0.5, 1.5, 3.8], [3.5, 1.2, 2.5]]

LIGHT_VARIANTS = {
    "light_golden": {"azimuthDeg": 210, "elevationDeg": 10},
    "light_dusk": {"azimuthDeg": 250, "elevationDeg": -4},
    "light_night": {"azimuthDeg": 300, "elevationDeg": -25},
}


def build_tangents(points):
    """Run the REAL buildTangents (editor/js/curves.js) via node — the
    anchors must match the runtime math exactly (sqrt-chordal Catmull-Rom)."""
    script = (
        "import(" + json.dumps("file://" + CURVES_JS) + ")"
        ".then(m => console.log(JSON.stringify(m.buildTangents(" +
        json.dumps(points) + "))))"
        ".catch(e => { console.error(e.message); process.exit(1); })"
    )
    p = subprocess.run(["node", "-e", script], capture_output=True, text=True, timeout=60)
    if p.returncode != 0:
        raise RuntimeError(f"node buildTangents failed: {p.stderr[:300]}")
    return json.loads(p.stdout.strip().splitlines()[-1])


def load_base():
    with open(BASE_FIXTURE) as f:
        return json.load(f)


def write_fixture(name, scene):
    path = os.path.join(OUT_DIR, name + ".json")
    with open(path, "w") as f:
        json.dump(scene, f, indent=1, sort_keys=True)
        f.write("\n")
    return path


def gen_light_variants():
    """M3: three light stops. Everything else = the base scene."""
    out = {}
    for name, light in LIGHT_VARIANTS.items():
        scene = load_base()
        scene["light"] = dict(light)
        out[name] = write_fixture(name, scene)
    return out


def gen_cam_path():
    """M5: replace the orbit item with a cam-path item (aim=subject on the
    figure). durationS 8, speed 1.5 u/s, startS 0 — seek t=4 mid-path."""
    scene = load_base()
    track = scene["show"]["tracks"][0]
    assert track["characterId"] == CAM_PATH_CAMERA_ID, "base track is not the camera"
    old = track["items"][0]
    assert old["kind"] == "cam-move" and old["move"] == "orbit", "base item is not the orbit"
    track["items"] = [{
        "id": old["id"],  # keep the id — it's just an identifier
        "kind": "cam-path",
        "anchors": build_tangents(CAM_PATH_WAYPOINTS),
        "aim": "subject",
        "subjectId": CAM_PATH_SUBJECT_ID,
        "durationS": 8,
        "speedUnitsPerS": 1.5,
        "startS": 0,
    }]
    return {"cam_path": write_fixture("cam_path", scene)}


def generate_all():
    os.makedirs(OUT_DIR, exist_ok=True)
    made = {}
    made.update(gen_light_variants())
    made.update(gen_cam_path())
    return made


def maybe_sync():
    """Make the :3000 dev server see the new samples (rsync copy)."""
    sync = os.path.abspath(os.path.join(REPO, "..", "scripts", "sync-editor.sh"))
    if os.path.exists(sync):
        subprocess.run(["bash", sync], check=False, timeout=300)


if __name__ == "__main__":
    made = generate_all()
    for name, path in sorted(made.items()):
        print(f"  {name:14s} -> {os.path.relpath(path, REPO)}")
    if "--sync" in sys.argv:
        maybe_sync()
        print("  synced -> :3000")
    else:
        print("(run with --sync to also refresh the :3000 dev-server copy)")
