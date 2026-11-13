# HANDOFF — next session (immediate seam)

## State
Round 1 complete through commit (see git log). The editor is LIVE-VERIFIED headless: renderer + exact daylight/time-of-day, all 11 object kinds w/ full asset library, selection footprints, path paint + track evaluation (14 item kinds), timeline, autosave. Both remotes + /home/sync synced. Server may be down (sandbox processes die) — restart: `cd /home/z/flick-3dEditor/editor && nohup python3 -m http.server 8124 &`.

## First 10 minutes
1. `cd /home/z && git clone https://<GH_PAT>@github.com/ariellebridget3O/flick-3dEditor.git` (PAT split-coded in .env: source scripts/env.sh) — or resume /home/z/flick-3dEditor if sandbox survived.
2. Read PLAN.md backlog (that IS the next-session scope, priority-ordered) + docs/FIDELITY.md (what's EXACT/PORT/APPROX/SKIP).
3. Start server (above), verify: `agent-browser open "http://localhost:8124/index.html?scene=samples/synthetic_tracks.json&noAutosave=1"` → no errors, `window.__app` truthy.

## Seam items (only these)
1. **Stroke ring** (hGr): offscreen RT (MSAA 4, mips, scale L=min(1,1080/h) dims to 16px multiples) → override white basic material on selected subtree (layer 2 + Lines) → fullscreen ring shader (8-tap ringMax, width 1.5·dpr·scale, halo .26, navy #171b26→white mix) → render after main, before planning-aids. Raw code: analysis/extracted/ux_raw.js §12.
2. **Keyed-camera capture**: Manipulator._commit camera branch → if camera track has cam-transform item at playhead → write key (position/rotation/focalLengthMm at tS = playhead − item.startS); else if cam-move chain → rebase (_Zt/GOr: recompute item fields so the move starts from the new pose; rotation keep|turn|framing). Raw: tmp_b/drag_commit_SZt.js.
3. **Timeline magnet + reorder** (q5r/G5r/oje/_ie in tracks_raw.js): 12px radius snap to other items' start/end markers, push obstacles, ghost preview.
4. **heightCurve editor**: SVG/canvas overlay in segment inspector when cam-path selected (Yhe auto-tangents ∓Δu/3, Kat round .1 clamp .2..max, scrub = seek startS+u·dur).

## Env gotchas
- ES-module cache: agent-browser RELOAD does not refetch modules — close + open with a new ?v=N query.
- three r182: TransformControls is NOT an Object3D (getHelper()); PCFSoftShadowMap deprecated → PCFShadowMap; custom ShaderMaterials need fog:false.
- eval() gotcha: `ray.intersectObjects` is Raycaster-only (THREE.Ray has intersectPlane/Box/Sphere/Triangle only).
- Daylight colors: use the DECIMAL ints from the bundle (THREE.Color(int) = hex semantics) — hex comments were corrected once; decimals are ground truth.
- Sub-agent dumps sanitize `[`→`【】` (bash pipeline eats the literal `[h` sequence) — desanitize when porting.
- GitLab WAF 403 ~1/3 → retry 2-3×; the mirror remote is ansgareutychisC/flick-3dEditor-mirror (NOT flick-3dEditor).
