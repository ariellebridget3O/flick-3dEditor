# R21 design — user feedback round 21

## Forensic verdict (read first)
The user's review was against a **stale browser tab**: every r20 layer (disc/rail control,
Daylight track, feed wall, cursor fix, height strip, Look-at combobox, sky bloom, HDR
blackout fix) verifies LIVE in a fresh session. Real live issues confirmed:
1. Clouds are the r18-L3 "few-big-blobs" approach (user wants the r13 look FULLY back).
2. Draw-start leap: pressing >1m from the character snaps the stroke (tDr=1 easing
   exhausted on the first move) — the drawn path's first segment leaps ~7.5m.
3. Cameras have NO paired targets (ensureTargetMarker/dropTargetMarker/reconcileTargetMarkers
   never ported) → drawn cam-paths default aim='locked' → "camera fixed at whatever angle,
   not auto-adjusting". In the live, cameras with cam-move items get target markers and
   drawn cam-paths inherit focus → aim='subject' (auto-tracking).
4. Curve adjust exists (segment inspector Edit button, r5+) but is undiscoverable.

User demands regardless of staleness (their words override byte-fidelity where noted):
- FULL redesign of the day/night control: TWO gizmos, REAL-TIME drag. (r20's disc/rail
  matches the structure but the user never saw it — ship the definitive visible version.)
- Build freshness must be VERIFIABLE by the user (badge).

## L1 — clouds COMPLETE revert (user: "completely, fully!")
Restore the r13 layered approach: `git show 0606d2d:editor/js/clouds.js` (pre-r18-L3,
layered-only, planar XZ projection, pow-knee coverage, soft edges, ±30% weather coupling).
- Drop: the r18-L3 low-pass blob field, near-binary masks, bisection scale solve, dome
  direction-based UV, morphological open.
- Keep: layered-only modes (r18 L1 user ask), the Off/Layered UI, the seed input IF the
  old field family accepts an offset trivially — else hide the Seed row (ledger it).
- Re-integrate: sky.js hooks (setCloudTwin/PMREM), env.js buildCloudParams, const.js
  tables. r19/r20 sky.js changes (PMREM split, body gains) must survive untouched.
- Gate: r13 cloud captures re-look (VLM: soft cumulus, no blobs) + r18 cloud E2E re-run
  where still applicable + pixel matrix 7/7 (classic byte-identity).

## L2 — sun control v2 (direction gizmo + height gizmo, real-time, visible)
On top of the r20 disc/rail ids (keep #sunDir/#sunRail contract for the Daylight mirror):
- DIRECTION DISC: bigger; add a light-wedge overlay from the rim knob toward the disc
  center (shows WHERE the light hits the scene); keep N/E/S/W + view-yaw rotation.
- HEIGHT: replace the linear rail with a SUNPATH ARC — a quarter/semi arc from horizon
  to zenith, sun glyph rides the arc; below the horizon line the arc shades into a moon
  zone (crescent glyph + tiny stars); preset ticks on the arc.
- REAL-TIME contract: pointermove → store write + knob reposition in the SAME handler
  (synchronous); sky/sun uniforms apply per frame (r20 L2a pipeline unchanged). E2E
  asserts same-eval update (no rAF wait) + no CSS transition during drag.
- BUILD BADGE: constant BUILD='r21' in const.js; a small badge in the stage header
  ("r21"); on boot, if localStorage.buildStamp !== BUILD → toast "Updated to r21 —
  hard-reload if the UI looks old" + stamp. Kills the stale-review ambiguity.
- Daylight track keeps driving the gizmo (effLight mirror — verify in E2E).

## L3 — draw-path
- 3a first-step leap: on toggleDrawing ON, centerOn(drawTarget) (the 320ms ease, existing
  plan store API) so the character sits mid-view and presses start near it; extend the
  grab-easing radius tDr 1→3 (divergence ledgered — user demand beats the verbatim const).
- 3b curve adjust: double-click a path curve on the plan canvas → enterPathEdit for that
  item (paths already hit-testable via the paths cache); keep the inspector Edit button.
- 3c target markers (the auto-adjust look): port ensureTargetMarker / dropTargetMarker /
  reconcileTargetMarkers (bundle @5258833/@5258988/@5794929: U2r(items)=some(YN) —
  cam-move non-pan_sweep with subjectId null ⇒ needs target; spawn 5m ahead along the
  camera forward (Oye=5, oBe rotation→fwd); drop when no item needs it) + camera
  lastAimPosition/lastAimName persistence + unlink on delete (we have the unlink arm).
  Result: drawn cam-paths on cameras with moves inherit the target focus → aim='subject'
  → the camera auto-tracks during flight; the L7 combobox still overrides per segment.

## L4 — sky verification battery (bloom + HDR)
Capture battery: {classic, realistic} × {day, golden, night} × {HDR off/on} + clouds on.
Assert: no black sky (mean > 60), bloom present near the sun in HDR arms, attach the
captures to the wrap-up so the user can SEE the current state without a stale tab.

## Gates (all must pass before review)
Pixel matrix 7/7 (or 6/7 with the known m5), r20 suites (walklook 27, lighttrack 10,
height 14), r19 light 14, r18 sky (re-run; cloud arms will change — regenerate r18 cloud
goldens ONLY if the change is the sanctioned revert, ledger it), r17 camera 31, plan
oracle 485/485, r17 oracle 2501/2501. New: r21_sun_e2e (real-time + arc + badge),
r21_cloud_revert_e2e (r13 look metrics), r21_draw_e2e (center-on-draw, tDr=3 glide,
dblclick-edit, target-marker lifecycle, cam-path auto-track).

## Order
L2 (headline, main session) → L1 (delegate with this doc as spec, poll git) → L3 → L4 →
review → wrap-up.
