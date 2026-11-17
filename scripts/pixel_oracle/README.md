# pixel-oracle — durable re-runnable live-vs-ours pixel comparison harness

Purpose: certify that our offline editor (`editor/index.html`) renders
**pixel-equivalent** to the live flick.art stage editor, case by case, with a
masked diff and hard PASS thresholds. The M2 default case is GREEN:
**masked 99.30 % of pixels ≤8 diff, mean 0.354/255** (r11 session; the two
residual ~200px blobs = label-chip text anti-aliasing + a soft wall
luminance drift — accepted divergences, see `docs/FIDELITY.md`).

```
scripts/pixel_oracle/
  ab.py          agent-browser thin wrapper (sessions, eval-via-file, mouse)
  live.py        LiveSession — the live capture chain (steps 1–13 below)
  ours.py        our-side capture (fixture, seek, cameras lens)
  diff.py        masked diff + buckets + blobs, PASS/FAIL exit code
  stack.py       diagnostic 3-panel stack (live | ours | amplified diff)
  fixtures.py    generates the M3/M5 variant fixtures (node → curves.js)
  run_matrix.py  case registry + CLI (--live / --ours / --diff / --all)
  golden/        committed live references (m2_default_live.png)
  out/           captures (ours_<case>.png, live/<case>.png, tmp/)
  probes/        the r11 live-discovery probe scripts (reference only)
```

## Prerequisites

- **agent-browser** (`/usr/local/bin/agent-browser`) — headless Chrome over
  CDP; `--session <name>` isolates parallel work.
- **dev server on :3000** — serves `/home/z/my-project/public/editor`
  (an rsync copy of `editor/`). After generating fixtures (or any editor
  edit) run `/home/z/my-project/scripts/sync-editor.sh`. The three.js shim
  is NOT needed for this harness (that's only `scripts/oracle/run_oracle.mjs`).
- Python: `numpy`, `Pillow`. Node ≥ 18 for `fixtures.py` (imports
  `editor/js/curves.js`).
- Credentials: flick.art login is in the repo `CONTEXT.md` §Account/access
  (also defaulted in `live.py`); the Supabase **anon key** hardcoded in
  `live.py` is a public bundle literal (zDn) — not a secret. The JWT is
  only ever read inside the page (see REST below).

## Two modes

- **`--live`** — script the live flick.art chain and capture fresh references
  into `out/live/<case>.png` (slow: SwiftShader + login; ~3–5 min/case).
- **default (ours + diff)** — capture our side into `out/ours_<case>.png`
  and diff against the committed `golden/<case>_live.png` (or a fresh
  `out/live/<case>.png` if no golden). This is the fast regression gate:

```bash
python3 scripts/pixel_oracle/run_matrix.py --list            # case registry
python3 scripts/pixel_oracle/run_matrix.py --ours m2_default # our capture
python3 scripts/pixel_oracle/diff.py golden/m2_default_live.png out/ours_m2_default.png
python3 scripts/pixel_oracle/run_matrix.py --all             # ours + diff, all cases
python3 scripts/pixel_oracle/run_matrix.py --live m3_light_golden --session oracle-r11   # live PATCH+capture
python3 scripts/pixel_oracle/stack.py out/live/m1_lens.png out/ours_m1_lens.png out/m1_stack.png   # diagnostic
python3 scripts/pixel_oracle/fixtures.py --sync              # regenerate variants
```

## Case matrix

| case | fixture | t | view | live scene | status |
|---|---|---|---|---|---|
| m2_default | `samples/live_oracle_r11_base.json` | 2.51 | scene | base Scene 1 | **GREEN 99.30 / 0.354** |
| m1_lens | base | 5.0 (end-of-orbit) | cameras (lens) | base | **GOLDEN r11-3a, FAIL 56.27/32.72** — lens-view divergence (see gotchas) |
| m3_light_golden | `oracle_r11/light_golden.json` | 2.51 | scene | oracle row PATCHed | **GREEN r11-3a 98.72 %≤8 / mean 0.996** (marginal vs 1.0) |
| m3_light_dusk | `oracle_r11/light_dusk.json` | 2.51 | scene | oracle row PATCHed | **r11-3b FAIL (marginal) 97.18 %≤8 / mean 1.630** — horizon-band sun-glow drift |
| m3_light_night | `oracle_r11/light_night.json` | 2.51 | scene | oracle row PATCHed | **GREEN r11-3b 99.30 %≤8 / mean 0.818** |
| m4_finish | base | 2.51 | scene, finish ON | base | **GREEN r11-3b 99.16 %≤8 / mean 0.440** |
| m5_cam_path | `oracle_r11/cam_path.json` | 4.0 | cameras (lens) | oracle row PATCHed | **GOLDEN r11-3b, FAIL 32.72/60.99** — same lens-path divergence as m1 |

Full matrix r11-3b: 4/7 PASS (m2, m3_golden, m3_night, m4_finish); m1_lens +
m5_cam_path share the OPEN lens-path divergence; m3_light_dusk is a marginal
FAIL (mean 1.63, %≤8 97.18 — passes %≤8, misses mean≤1.0 on the horizon
sun-glow band). All 7 cases now have committed goldens.

### Lens-case geometry (M1/M5)

Live: after the scene view converged, click the **Cameras** radio → wait
4000 → the feed canvas is ~**805x452** (second-largest canvas in the
viewport area; geometry may shift — read at runtime). It renders WITHOUT a
seek-kick. Ours: the lens needs the camera **selected**
(`a.objects.select([id])`) AND `stageView='cameras'` — set by clicking the
real `#viewSwitch button[data-v=cameras]` radio so `updateFrameGuide`
adopts the lens fov (a bare store write skips it). Our canvas is made
805x452 by viewport **1069x716** (W = 805+264, H = 88+452+176 — verified
r11; asserted at runtime). `--cameras` diff mode applies **no UI masks**
(the feed is clean).

## The live chain (live.py, steps 1–13)

1. `open https://flick.art` → snapshot → click **GET STARTED** (first
   button with that text, ref from snapshot) → wait 3000.
2. Fill email + password → click **Sign in** → wait 5000 (turnstile passes
   headless).
3. Inject stage flags into the **ph_\*** posthog persistence blob —
   `$override_feature_flags['stage-3d']=true, ['stage-scene-node']=true` —
   then a **TRUE reload** is required for fresh state.
4. `open about:blank` → wait 1000 → open the deep link
   `https://flick.art/canvas/30f2a9fa-70ac-4fab-b488-1eef74d6217a?view=stage&scene=<SCENE_ID>`.
   **SPA soft-nav does NOT reset editor state** — always bounce via
   about:blank. The r11 base Scene 1 id =
   `27b98b6b-8a4d-4b3a-a810-7d542342ce41` (**8a4d** — an older index file
   said 7a4d, which is WRONG).
5. Wait 10000 → click the scene tab (the tab whose TEXT = the scene-row
   NAME — 'Scene 1' for the base scene, 'Oracle R11' for oracle cases;
   button at y≈49, synthetic pointerdown/pointerup/click on
   `closest('[class*=_tab_]')`) → poll the components column until
   'Scene is empty' is gone (5s poll, 40s cap).
6. Collapse panels → the canvas must land in the canonical basis
   ~1000x375 at (0,75), VERIFIED by geometry (collapse_panels runs a
   probe-verified state machine — see the gotchas ledger).
7. **Seek-kick (REQUIRED)**: the live 3D viewport is render-on-demand and
   stays gray without a real interaction; a native ruler click poses the
   scene AND triggers a render without changing the camera.
   - **Calibrate the ruler every load** (timeline zoom varies!): read the
     `Ns` labels → px/sec; t0 tick x = playheadBadgeCenter − t·pxPerSec.
   - Native mouse move/down/up at (t0x + t·pxPerSec, y=487).
   - Verify the time readout (±0.01) — **seeks CLAMP to show duration**.
8. Converge: screenshot twice 3s apart, diff ~0 (SwiftShader converges
   ~6s post-seek), max 6 iterations.
9. Capture: full screenshot → crop `canvas.ph-viewport-capture`'s
   runtime-read rect.
10. Cameras view: see the lens-case geometry above.
11. REST scene CRUD — **page-context fetch only** (JWT never printed;
    works from any flick.art page). Base:
    `https://auth.flick.art/rest/v1/stage_scenes`.
    - **READ**: filter by `project_id` (NOT `scene_id=eq.<uuid>` — those
      filters mysteriously return empty), `select=scene_id,name,scene`,
      pick the row client-side.
    - **POST** (create): `{scene_id, name, project_id, scene}` with
      `Prefer: return=representation` → 201.
    - **PATCH** (update scene): `?scene_id=eq.<id>` + body `{scene}` — the
      eq-filter works for PATCH even though GET returns empty; **CAVEAT: a
      2xx PATCH can silently affect 0 rows** — always verify by read-back
      (`patch_oracle_verified` → `rest_scene_matches`, an IN-PAGE deep-equal
      of the row's scene vs the fixture; jsonb reorders keys so string
      compare would lie). Fallback: POST upsert
      (`Prefer: resolution=merge-duplicates`, = `rest_upsert`), re-verify.
    - **DELETE**: `?scene_id=eq.<id>` → 204.
    - M3/M5 use a dedicated oracle row ('Oracle R11',
      `ba11e0ba-0000-4000-8000-0000000000ba`), created once, PATCHed per
      case — never touch the real Scene 1.
12. **Finish-pref case (M4)**: set localStorage
    `stage-finish = {"enabled":true,"source":"manual"}` on the flick.art
    origin BEFORE the deep-link navigation (right after flag injection) →
    the finish composer renders. Ours: URL `?finish=1`.
13. M2 comparison result: masked 99.3 %≤8, mean 0.354/255.

## Our-side flow (ours.py)

1. **Fresh agent-browser session per case** — reload does NOT bust the
   ES-module cache; a new session gets a new JS context.
2. URL: `?scene=samples/<FIXTURE>.json&noAutosave=1&finish=0|1&v=<bump>`
   (`?finish=1` = the M4 manual finish case).
3. Viewport 1264x639 → canvas exactly **(0,88,1000,375)** (asserted at
   runtime; the canvas is `document.querySelector('canvas')`).
4. Scene-load marker: `window.__app.light.azimuthDeg` reaches the
   fixture's azimuth (128.66 for the base) + ~2s for rigs/GLBs.
5. Seek: `await a.page.seek(t)` (+800ms) — readback `a.page.playheadS`.
6. Wait 1200 → screenshot → crop the canvas rect.
7. Cameras lens: see the lens-case geometry above.

## Diff model (diff.py)

- Inputs may be full screenshots (cropped at the known canvas offsets —
  live (0,75), ours (0,88)) or ready-made canvas crops (1000x375 scene /
  805x452 cameras); overrides via `--live-rect/--ours-rect`.
- Per-pixel diff = **mean absolute channel difference** (RGB averaged —
  the metric that reproduces 99.30/0.354; max-channel gives 0.774 mean on
  the same M2 pair).
- UI masks (scene mode, canvas-relative px): live left toolbar `x<41`;
  ours bottom-left `x<160 ∧ y>300`, right edge `x>950`, nav ball
  `900<x<990 ∧ 15<y<60`. Excluded from every bucket.
- Buckets: masked **mean**, **%≤8**, **%≤24**; blobs = 4-connected
  components of diff>8 with area>25px (M2 residuals: the label-chip AA +
  wall luminance drift blobs).
- **PASS: masked mean ≤ 1.0 AND %≤8 ≥ 97.0** (exit 0; FAIL exit 1).
  `--cameras` mode = no masks. Thresholds overridable (`--mean-max`,
  `--p8-min`) for case-specific relaxes (the R9 lens measured mean 1.3 —
  if that persists under the r11 poser, give m1_lens a documented relax).

## Gotchas ledger (all live-verified r11)

- **Layout drift (2026-11, r11-3a)** — the live layout varies PER LOAD and the
  r11 click-list no longer implies the r11 geometry: clicking BOTH r11
  collapse buttons on a wide viewHost (1280) yields a 1280x375 canvas
  (= different aspect — poisons the diff). Probe-verified canonical path:
  a chat sidePanel (360px, auto-opens) must be closed via ITS OWN 'Collapse
  panel' button; then 'Collapse panel' alone lands exactly 1000x375 on a
  wide viewHost (components column stays in-flow, eating its 280px).
  'Hide the components column' is only a narrow-layout fallback. The band
  is asserted (970–1030 x 368–382) — a capture outside it raises.
- **Lens feed convergence** — the cameras feed is its own render target; it
  needs the same screenshot-pair convergence as the scene view (added to
  cameras_capture; the feed is stably 805x452 across layout variants).
- **m1 lens divergence (OPEN)** — the r11-3a live lens at t=5.0 is a flat-
  bright image (no px < 30 lum, min ~170, 0.18% saturated, mean 190) while
  ours renders full contrast (mean 134, deep darks + clipped spots); pair
  diff mean 56.27, %≤8 32.72, one whole-frame blob. NOT a geometry
  mismatch: mid-frame structure aligns and the live/ours per-pixel ratio is
  bimodal 1.0/1.67 (a tonemap/exposure-style divergence in the through-
  the-lens path — R9 measured 97.81/1.3, so one side changed since; both
  captures are deterministic, live reproducible byte-stable). Editor-side
  fix needed; harness captures are correct.
- **m5 cam-path = the SAME lens divergence (OPEN, r11-3b)** — the cam-path
  case (t=4.0 through-the-lens) reproduces the m1 signature exactly: %≤8
  32.72 (identical), one whole-frame blob, live flat-bright (mean 213,
  min 58) vs ours full contrast (mean 153, min 32), live/ours lum-ratio
  bimodal 1.0/1.67 (233k px at ~1.67, 121k at ~1.0). The cam-path MOTION
  works (feed not empty: 2476 unique, std 32) — the divergence is the lens
  path, not the path eval. Same editor-side fix as m1.
- **m3 dusk horizon band (r11-3b)** — dusk (az250 el-4) is a marginal FAIL:
  %≤8 97.18 passes but masked mean 1.63 misses ≤1.0; top blob 6317px
  bbox x179-900 y40-52 = the horizon/sun-glow strip (the el=-4 sun sits on
  the horizon; the low-sun glow band renders slightly brighter/differently
  on one side). The other 4 blobs are the known label-chip/wall family.
- **m4 finish-pref verification (r11-3b)** — the live m4 capture WAS checked
  for the pref taking: live plain 2074 unique vs live finish 3777 (the
  ours-side jump 2571→4391), and the plain-vs-finish mean-abs-delta is
  0.50 live vs 0.53 ours (same magnitude) — the finish composer rendered
  on both sides; final diff GREEN 0.440/99.16.
- **Night case noise** — feared the dark scene would make the diff noisy;
  measured GREEN 0.818/99.30 (the metric is absolute-channel, so a dark
  scene actually diffs quietly).
- **SPA soft-nav** — deep-linking from inside the SPA does not reset
  editor state; bounce `about:blank` → wait 1000 → deep link.
- **Render-on-demand / seek-kick** — the live viewport stays gray without
  a native-input interaction; the ruler click is the pose+render trigger
  that does not move the camera. Synthetic element clicks do NOT work.
- **Ruler calibration + clamp** — timeline zoom varies between loads
  (calibrate px/sec every time); seeks clamp to show duration (verify the
  readout, don't assume).
- **REST eq-filter quirk** — GET `scene_id=eq.<uuid>` returns empty;
  filter by `project_id` and pick client-side. PATCH `scene_id=eq.` is
  reported to work; upsert fallback coded; EVERY oracle PATCH is
  read-back-verified in-page before the deep link (patch_oracle_verified).
- **1.5KB eval limit** — long JS (REST bodies with scene JSON ~2.6KB)
  must go through `ab.eval_file()` (the code is passed as a single argv
  element — never through a shell, so JS backticks/`$()` are safe).
- **ES-module cache** — our side needs a fresh agent-browser session per
  case; `?v=<bump>` additionally busts HTTP caches.
- **Finish pref** — live reads `stage-finish` from localStorage at boot;
  it must be set on the flick.art origin before the deep-link navigation.
  Ours reads the same key but the URL `?finish=1` forces it (manual
  source).
- **Scene id typo** — the r11 base scene is `27b98b6b-`**`8a4d`**`-…`;
  the older `7a4d` index was wrong.
- **WAF** — n/a; the anon key is a public bundle literal and the JWT is
  only used in-page.
- SwiftShader is slow: the live render converges ~6s post-seek; converge()
  loops screenshots 3s apart (max 6) before capture.

## Probes

`probes/` keeps the r11 live-discovery scripts (`_probe*.js`,
`_inject_flags.js`, `_read_*.js`, `_post_scene.js`, `r11_poser_patch.py`,
the `find_*.py` bundle greps) as reference — they document how every
mechanic above was verified. Don't delete; don't run (the harness
supersedes them).
