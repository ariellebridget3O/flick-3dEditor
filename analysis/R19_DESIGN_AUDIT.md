# R19 DESIGN AUDIT — light/sky/HDR calibration (L1–L5)

Auditor: design-audit sub-agent (R19). Subject: `docs/R19_DESIGN.md`.
Evidence base: `editor/js/env.js` (applyDaylight 282-338, sunDirection 112-118, buildSkyParams 127-157,
shadow fit 466-572), `editor/js/sky.js` (moon 521-542, uHdrGain 544/798, bakePMREM 744-758),
`editor/js/clouds.js` (uHdrGain 231/396/460/796), `editor/js/const.js`, `editor/js/bloom.js`
(high-pass luma weights line 40, smoothWidth 0.01, line 45), `editor/js/finish.js` (ACES composite
285-293), `editor/js/main.js` (renderer 89-91, mutators 156-241, renderFrame 1499-1532),
`scripts/r18_sky_e2e.py`, `docs/FIDELITY.md` r18 section, SKILL lessons 91/98/99.

## Verdict summary

| Layer | Verdict | Blocking findings |
|---|---|---|
| L1 indoor window light | **GO-WITH-CHANGES** | none P0; 2×P1 (D7 re-calibration, no-walls semantics) |
| L2 night key = moonlight | **GO-WITH-CHANGES** | none P0; seam verified complete (1 runtime call site); 2×P1 |
| L3 moon visual tune | **GO** | none P0; P2 wording/measurement notes |
| L4 HDR recalibration | **GO-WITH-CHANGES** | **1×P0** (flare lift must be finishOn-gated); 3×P1 |
| L5 PMREM IBL split | **GO-WITH-CHANGES** | **1×P0** (setSkyStyle clobber — r18 P1-1 bug class); 1×P1 |
| L6 parity ledger | n/a (sub-agent; `analysis/R19_PARITY_LEDGER.md` already exists) | — |

Overall: **GO-WITH-CHANGES** — the architecture (single blended directional, shadow-map-as-attenuation,
body-sub-threshold HDR philosophy, IBL via intensity-0) is right. The two P0s are one-line gates, not
redesigns. Both must land before implementation, plus the E2E additions listed in §7.

---

## L1 — indoor window light: GO-WITH-CHANGES

**(a) Full-intensity vs attenuating — full intensity is RIGHT.** A real shaft through a window is
full-sun; the shadow map IS the attenuation. Any multiplicative indoor factor re-creates the user's
complaint ("no time-of-day response") in weaker form — the shaft would stop tracking az/el
convincingly. Removing the kill at env.js:304 (`(indoor ? 0 : 1)`) is a literal no-op when
`!light.indoor` (×1 in IEEE is exact) → zero oracle impact; the memo key already includes `indoor`
(env.js:287). Matrix 7/7 re-run as the design says.

**Fit handles interiors correctly — verified.** `bounds()` comes from `createFogNearFar` →
`computeBounds` over ALL non-excluded meshes (env.js:396-410, consumed at 520) — walls/props are in
the union, so `spread90`/focus grow with the room and the ortho frustum (±w, w ≥ 30, cap 250.6 m =
`SHADOW_TEXEL_K·mapSize/2`) covers them. All non-basic meshes cast (`walk`, env.js:489). The
directional is placed `focus + dir·S` with far covering the ceiling (env.js:535-537).

Findings:

- **L1-P1-1 (D7 interaction — re-calibrate after landing).** The indoor fill stack was sized to
  compensate for a DEAD sun: `hemi ×1.2` (env.js:308) + warm `ambient 0.35` (env.js:310), with the
  comment "window light is the hemi's job" (env.js:309) — now false. With live shafts, lit patches get
  `g.sun(2.15 midday)·sunBoostK` on top of ambient+hemi while shadowed regions keep the old fill →
  interior contrast gets much harder and the warm ambient may double-count with real window bounce.
  Correction: after L1, one combined indoor calibration pass (VLM + floor-rows probes, day/night ×
  classic/realistic × hdr on/off); candidates: indoor hemi ×1.2 → ×1.0, keep `ambientLevel` as the
  user knob; update the stale comment at env.js:309. Do not pre-tune blind (SKILL 91: measure where
  the energy is first).
- **L1-P1-2 (no-walls semantics).** `indoor=true` with no enclosing geometry now yields full sun +
  warm ambient (previously: dim warm box). That is coherent ("the flag is the lighting recipe,
  geometry does the blocking") but it is a behavior change users will notice. Correction: state it in
  the UI copy/help (indoor = fog ×0.5 + ambient + hemi recipe; walls block light), and cover it in
  the L1 E2E (indoor-without-walls render ≠ old indoor render, intentionally).
- **L1-P2-1 (shaft aliasing / SUN_RADIUS).** Renderer is `PCFShadowMap` (main.js:90), so
  `SUN_RADIUS=2` IS active (radius is ignored by PCFSoft, not by PCF). Texel = 2w/3072 ≈ 2-4 cm at
  typical interior extents (w 30-60 m) — mullion-scale shaft edges resolve; at big-box extents
  (w→250 m) texels reach ~16 cm and shaft edges shimmer during az/el drags. Acceptable previz; the
  `normalBias` formula already scales with w (env.js:539-540). No new indoor constant. New indoor
  cost: one 3072² shadow pass per fingerprint change (`sun.visible` was gating it off before) —
  expected, it is the feature.
- **L1-P2-2 (fit box vs wall height).** `SHADOW_CASTER_KINDS` = humanoid/simple_figure only
  (const.js:135) — the fit BOX ignores walls; walls enter only via bounds spread (XZ centers,
  env.js:416). Tall multi-story interiors could clip ceiling shadows at extreme extents. Acceptable;
  note only.

---

## L2 — night key = moonlight, direction-synced: GO-WITH-CHANGES

**(b) Single blended directional vs second moon DirectionalLight — single blend is RIGHT.**
(1) The TOr/kOr/Bat fit/fingerprint/snap pipeline (env.js:466-572) is single-light: a second
shadow-casting directional needs a second fit or shared-extent plumbing, and `tickAOr` bumps
`renderer.shadowMap.needsUpdate` globally (all maps re-render on any change → 2× shadow cost per
change, +~36 MB for a second 3072² map). (2) At deep night the sun's table intensity is 0 — a second
light adds nothing exactly when it would matter. (3) The "both up" dusk window (el ∈ [−3, −8]) is
where table `g.sun` falls 0.63 → 0.00 (DAYLIGHT_STOPS, const.js:52-53): the direction slide happens
mostly inside the intensity trough, so the phantom-direction artifact is largely masked. Two lights
would buy simultaneous sun+moon shadows only in that narrow, dim window — not worth the plumbing for
a previz tool.

**Seam inventory (verified complete — grep across editor/js):**
- `sunDirection()` has exactly ONE runtime consumer: **env.js:532** (`dir.copy(sunDirection(getLight()))`
  inside `fit()`). 
- main.js:8 imports `sunDirection` but **never calls it** — dead import (cleanup or repurpose, P2).
- The classic flareDirection is computed INLINE at env.js:334-335 (el clamped ≥ 0), NOT via
  `sunDirection()` — untouched by the design, correct.
- The realistic dome's true sunDir is inline at env.js:134 — untouched, correct.
- `sun.position/target` are written ONLY by `fit()` (env.js:535-536); `env.sun` is passed only to
  `createShadowFit` (main.js:235). No ui.js/plan.js/camera consumers.

Findings:

- **L2-P1-1 (where keyLightDirection gets skyStyle — prefer the stash).** The design says
  "new `env.keyLightDirection(light)`" but `skyStyle` is closure state inside `createEnvironment`
  (env.js:247), not a function of `light` (light.skyStyle exists and is kept in sync only by
  convention — main.js:172/546). A pure `keyLightDirection(light)` reading `light.skyStyle` creates a
  second source of truth and a desync class. Recommended implementation: compute the blended
  direction **inside applyDaylight** (which already knows skyStyle, nightAmt and both endpoints) and
  stash it (closure var / `sun.userData`); `fit()` already calls `applyDaylight` at env.js:515 before
  consuming dir at 532, and the memo guarantees the stash matches the key. Zero new plumbing, zero
  drift. Alternative (if a function is preferred): export it from `createEnvironment` and pass it
  into `createShadowFit` at main.js:234 (signature change at env.js:466).
- **L2-P1-2 (moonDir formula must be shared, not duplicated).** `buildSkyParams` computes moonDir
  from the TRUE sun dir (anti-solar + 0.25·right, env.js:139-141). The blend needs the IDENTICAL
  vector or the light and the visible disc desync again — the exact bug being fixed. Extract one
  helper (e.g. `moonDirection(light)`) used by both `buildSkyParams` and the blend. E2E: at el=−30
  realistic, assert `sun.position − sun.target.position` ≈ the dome's uMoonDir.
- **L2-P2-1 (dusk continuity relies on the −8 stop's sun=0.00).** The blend's start point inherits
  the EL_REMAP discontinuity at el=−8 (`max(el,5)` vs `25−el` → 5°→33° jump, env.js:114-116). It is
  invisible because the −8 stop has `sun: 0.00` — the jump happens at ~zero intensity. Fragile if
  anyone later raises the night floor. Correction: none needed; add a code comment + a dusk-sweep E2E
  (el −30..90 step 0.5: dir finite, dir.y > 0, far/near finite, no NaN).
- **L2-P2-2 (color constant shared).** The blend target (0.86, 0.88, 0.95) must be the same constant
  as the dome's moon tint (sky.js:541). One shared const, not two literals.
- **L2-P2-3 (nightAmt reuse is a feature).** Reusing `nightAmt = clamp((−el−3)/11)` (env.js:138) means
  the hard light and the visible disc/stars fade in together — keep; do NOT introduce a second ease.
  Gate: `keyLightDirection ≡ sunDirection(light)` when `skyStyle !== 'realistic'` (classic night
  stays live-exact — the stated invariant) and when `nightAmt === 0` (realistic day unchanged). Cover
  both with E2E arms.
- **L2-P2-4 (far-plane safety).** `far = S + w + (focus.y+w)/dir.y` (env.js:537): moonDir.y at night
  ≈ sin(14..30°) > 0 and both blend endpoints are above the horizon → dir.y > 0 throughout. Safe.

---

## L3 — moon visual tune: GO

**(c) Numbers sanity-check.**
- Disc: cos(0.0215)..cos(0.0180) → radius 1.03° (was 0.87°) = +18% radius, ×1.40 area ✓ matches
  "slightly bigger". Smoothstep edge order is valid (e0 < e1 since cos decreases).
- Luminance 3.2 vs sun disc 30 (×transmittance): ratio ≈ 1:9.4. Both saturate ACES to white discs;
  the ratio reads in bloom intensity/halo spread — sun clearly dominant, both "bloom naturally
  (highest-illumination members)" ✓. Post-uHdrGain the moon is 3.2×1.3 ≈ 4.2 (the gain multiplies
  the moon too — sky.js:544 sits after the moon add; the design's 3.2 is pre-gain, say so).
- **Plain-path clip: NOT a problem, and the r18 P0-2 rule does not apply here.** The moon lives only
  in the REALISTIC dome, which always applies its own filmic curve when not linearHDR (uCurve=1,
  sky.js:555): curve(3.2) = 1−exp(−3.2/1.08·10) ≈ 1.0 → pure white disc — the intended full-moon
  look. This was ALREADY true at 0.62 (curve(0.62) ≈ 0.997 → ~255), so the plain look barely moves;
  the visible change is under finish+HDR (linear + bloom). The P0-2 lesson (lifts ≥ 1.25 clip) is
  about the CLASSIC dome (no tone-map chunk — only `colorspace_fragment`, env.js:217); the design doc
  should state this so nobody re-applies the rule out of context. The plain+HDR fallback: uCurve=1 →
  white disc, no bloom (no bloom chain on the fallback) ✓ consistent.
- Halo: pow700×0.10 peak 0.10 (< 1.0, ×1.3 gain = 0.13 — no self-bloom ✓).

Findings:

- **L3-P2-1 ("≈1.5 disc radii" is optimistic).** pow(cosθ,700) has 1/e radius ≈ 3.1° ≈ 3 disc radii
  (old pow140 ≈ 6.9°) — 2.2× tighter, satisfying "much smaller", but the visible tail runs to ~3°+.
  Correct the doc wording so the E2E threshold is written against the right expectation.
- **L3-P2-2 (limb darkening won't read on SDR).** 3.2 vs 3.2×0.82=2.62 both saturate the plain curve
  and nearly saturate ACES — the sphere-shape cue survives only faintly under finish+HDR. Fine; don't
  expect it on SDR.
- **L3-P2-3 (float32 pow(x,700)).** Well-conditioned for θ ≥ 0.001 rad (r18 shipped pow140; the E2E
  arms with realistic ENABLED — r18 T5 — satisfy SKILL 99's compile-the-material rule for the shader
  edit; keep those arms).

---

## L4 — HDR recalibration: GO-WITH-CHANGES

**(d) Math check.**
- Classic body: with the bloom high-pass comparing LUMINANCE (weights 0.2126/0.7152/0.0722,
  bloom.js:39-41), not max-channel: worst stop horizon 0xE8EBF0 → linear (0.807, 0.830, 0.868) →
  luma 0.828 → ×1.06 = **0.878 < 1.0** — comfortable 12 % margin (the doc's "0.93×1.06=0.986"
  arithmetic uses a max-channel/sRGB-ish basis; either way sub-threshold, but pin the measurement
  convention — the E2E gate is the arbiter).
- Fog: `scene.fog.color = g.horizon × lift` (env.js:320-321) → same sub-threshold class ✓; the
  realistic dome's horizon band mixes toward the SAME lifted fogColor (buildSkyParams, env.js:151) ✓
  coherent dome/floor.
- Flare: at the flare peak the total is body (≈0.88 luma) + flare (0.55×1.8 ≈ 0.99) ≈ 1.9 → blooms
  under finish+HDR ✓ — this is what makes "sun surroundings glow" work (the flare term alone sits
  exactly AT threshold; it only blooms as body+flare).
- Weather safety: `(1−darken)·lift` then desat — desat moves channels toward luma (≤ max channel) so
  it can never raise the maximum → all weathers stay sub-threshold ✓.

Findings:

- **L4-P0-1 (gate HDR_CLASSIC_FLARE_LIFT on `hdr && finishOn`).** The body lift is gated
  `light.hdr?.enabled && _finishOn` (env.js:314); the design does NOT state the gate for the NEW
  flare lift. Ungated, the plain+HDR fallback (finish off → `_finishOn=false`; classic dome has NO
  tone map — env.js:217) receives flare×1.8: peak ≈ 0.93+0.55×1.8 ≈ 1.92 → the >1.0 clip cone around
  the sun grows from ~42° (today's live-exact 0.55 flare + 0.93 body) to ~47°+ with a brighter
  clip-adjacent band — an r18-P0-2-class fallback regression and a pose-dependent T8 risk.
  Correction: one line at env.js:322 — use the SAME combined gate for both lifts. (With the gate, the
  fallback keeps its current look and T8 is safe.)
- **L4-P1-1 (clouds: one shared gain; drop the "cloud tops bloom" claim).** The deck + cirrus share
  `C.HDR_REALISTIC_GAIN` via uHdrGain (sky.js:544/798, clouds.js:396/460/796) — dropping 1.7 → 1.3
  rescales the deck ×0.765 automatically. The doc's "cloud sunlit tops (already near 1.0-1.3 —
  subtle bloom stays)" is unsupported: if measured AT gain 1.7 they land 0.76-0.99 → NO bloom; if
  pre-gain they'd bloom harder than the complaint. Recommendation: clouds FOLLOW the body gain (one
  constant — the premultiplied over-composite requires deck/dome output-space coherence, r13 review
  P1), and the "cloud tops bloom" line is removed; sun-through-gaps bloom comes from the 30× sun disc
  itself, which is the natural look. Re-measure deck luminance at the new gain and add it to the
  rewritten T9 family.
- **L4-P1-2 (realistic gain "~1.3" may still cross).** If the realistic body at gain 1.7 was "same
  class" as 1.29-1.38, raw ≈ 0.76-0.81 → at 1.3 → 0.99-1.05 — the upper band can still cross 1.0.
  Ship the GATE, not the number: define acceptance numerically (body luma p95 < 0.98 linear at
  default exposure, day clear, sky-aimed pose), calibrate the constant to it (may land 1.15-1.25).
- **L4-P1-3 (ACES-compensation wording).** 1.06 does NOT make the display continuous — ACES(0.88) ≈
  0.78 displayed vs 0.88 raw → the sky reads ~10 % deeper under HDR. That is FINE (the design sells
  "deeper sky (ACES)" and the user asked HDR to be visible) but reword "displayed brightness stays
  continuous" → "keeps the sky in the same display range while ACES adds depth", so nobody later
  raises the lift chasing continuity and re-creates the whole-sky bloom.
- **L4-P2-1 (const hygiene).** Rename `HDR_SKY_LIFT` → `HDR_SKY_BODY_LIFT` 1.06; the doubly
  superseded `HDR_CLASSIC_SKY_LIFT_LEGACY 1.10` block (const.js:122-123) should be updated/removed;
  consider renaming `HDR_REALISTIC_GAIN` → `HDR_REALISTIC_BODY_GAIN` for symmetry with the deck
  sharing.
- **L4-P2-2 (user threshold < 1.0 re-blooms the body).** Body 0.88-0.99 means a user slider at 0.9
  brings sky bloom back — explicit user choice, no action; at most a tooltip note.

---

## L5 — PMREM IBL indoor/outdoor split: GO-WITH-CHANGES

Intensity-0 is the RIGHT mechanism: `scene.environment = null` indoor would flip the envmap define
and recompile every material on each indoor toggle (program-cache thrash);
`scene.environmentIntensity = 0` scales BOTH diffuse and specular IBL (three r182) → classic↔realistic
indoor delta ≈ 0 ✓ as the design claims.

Findings:

- **L5-P0-1 (setSkyStyle clobber — the r18 P1-1 bug class repeats).** env.js:357
  `scene.environmentIntensity = skyStyle === 'realistic' ? C.SKY_IBL_INTENSITY : 1` runs on EVERY
  style switch without applyDaylight. Indoor + clicking the active style seg (or re-opening the same
  scene) → IBL jumps 0 → 0.30 through walls. Correction: line 357 must be indoor-aware:
  `skyStyle === 'realistic' ? ((light ?? _lastLight)?.indoor ? 0 : C.SKY_IBL_INTENSITY) : 1`.
  E2E: indoor, realistic, re-click the style seg → environmentIntensity stays 0. (The memo-key
  restore at env.js:326 is already indoor-keyed — env.js:287 — so applyDaylight's own site is fine.)
- **L5-P1-1 (indoor still pays the PMREM bake — question (e): YES).** The chain on every light
  change in realistic style: applyDaylight → `realistic.setParams` (paramKey change → lutDirty,
  sky.js:691) → `bake()` (3 LUT passes, ≥80 ms throttle) → `pmremPending` → `bakePMREM()`
  (`PMREMGenerator.fromScene`, ≥250 ms throttle) (sky.js:728-742, 800-803); cloud param changes call
  `markPMREMDirty()` unconditionally (env.js:330-331). The VISIBLE dome needs the LUTs (sky through
  windows) — keep `bake()`. But `bakePMREM` is 100 % wasted indoor (intensity 0). Correction: gate
  the PMREM half — e.g. `realistic.setIBLOn(!indoor)`: skip `bakePMREM` + clear `pmremPending` while
  off; force `pmremPending = true` on indoor→outdoor. Also gate the `markPMREMDirty` call at
  env.js:331 on `!indoor`. Modest but free (one PMREM per ≥250 ms during light drags).
- **L5-P2-1 (r18 T7 goes VACUOUS indoor — SKILL 50).** T7 (realistic+HDR interior delta < 6.0)
  existed to catch uHdrGain leaking into the PMREM (r18 P0-1). With indoor IBL = 0 the leak is
  invisible indoors — the test would pass for the wrong reason. Keep T7 for continuity, ADD an
  outdoor guard (outdoor realistic+HDR floor-rows vs classic+HDR; r18-5 measured 1.17 — bound it).

---

## L6 — skipped (sub-agent; `analysis/R19_PARITY_LEDGER.md` present)

---

## 7. r18 E2E invalidation list (complete — scripts/r18_sky_e2e.py, 16 checks)

| Test | Fate under R19 | Action |
|---|---|---|
| T1a, T1b (procedural removal/migration) | unaffected | keep |
| T2, T2b, T3 (coverage/sheets) | unaffected | keep |
| T4a, T4b, T4b2, T4c (seed) | unaffected | keep |
| **T5** (moon ≥400 px @>245) | **stale/weak, not invalidated** — disc ×1.4 area, 0.62→3.2, halo dimmer (0.10 vs 0.15 → no >245 halo ring) → blob ≈ 950-1050 px | retune to ≥800 px; ADD a halo-tightness probe (luma at ~2.5 disc radii below a bound) |
| T6 (interior delta < 3.0) | still passes; STRONGER with L5 | keep |
| **T7** (realistic+HDR interior < 6.0) | passes but **VACUOUS for its original purpose** (uHdrGain-in-PMREM guard) under L5 | keep + ADD outdoor PMREM-gain guard (L5-P2-1) |
| **T8** (plain+HDR fallback clip < 2 %) | at risk ONLY if the flare lift ships ungated (L4-P0-1); default-pose sliver (sun el 57°) probably still passes | with the P0 gate: keep as-is; if ungated, add a sun-aimed fallback arm |
| **T9** (sky IN at thr 1.0 +8, OUT at 1.5 <2) | **INVALIDATED — criterion inverts** | full rewrite, see below |
| T10 (rain deck < overcast −15) | margin shrinks: decks rescale ×(1.3/1.7) ≈ 0.765 → r18's 48-luma gap → ~37 (approx, post-curve) | still >15; VERIFY after calibration; re-baseline the bound with a measured rationale |
| T11 (console 0 errors) | unaffected | keep (and it is the SKILL-99 compile guard for the moon shader edit — realistic arms must stay enabled) |

**T9 rewrite (all arms AIMED — SKILL 98: the default pose shows a 0-4° sky sliver; the old T9 only
worked because the WHOLE sky bloomed):**
- (a) body NO bloom: sky-aimed pose, classic day + realistic day, thr 1.0 vs bloom-off, Δ < 2;
- (b) sun region blooms: classic day aimed at the sun (flare region, body+flare ≈ 1.9), Δ > bound;
  realistic day aimed at the sun disc (30×T), Δ > bound;
- (c) moon disc blooms: realistic night aimed per the T5 idiom, Δ > bound;
- (d) optional inversion check: body still out at thr 1.5 while (b)/(c) still in.

**NEW arms R19 must add (the design only budgets the T9 rewrite):**
1. L1: indoor day `sun.intensity === outdoor value` (state assert) + shaft direction follows azimuth
   (render A/B); indoor night realistic = moonlight through windows; matrix 7/7 re-run (design says).
2. L2: night realistic key direction ≈ uMoonDir (via the fit's `sun.position − sun.target`, or the
   exposed stash); classic night direction UNCHANGED (gate guard); dusk sweep el −30..90 (finite,
   dir.y > 0, no NaN).
3. L4: deck-luminance re-measure at the new gain (part of the T9 family).
4. L5: indoor `environmentIntensity === 0` + survives a setSkyStyle re-click (the P0); outdoor
   realistic === 0.30 (r18-5 regression guard).

---

## 8. Cross-layer interactions (stated so they aren't discovered in QA)

- **L1×L2**: indoor night gets moonlight through windows automatically (same single directional) ✓.
- **L1×L5 (biggest combined change)**: indoor realistic goes from "IBL 0.30 + dead sun + warm fill"
  to "no IBL + full shafts + warm fill" — the indoor look moves MORE than either layer alone (r18
  indoor HAD the 0.30 IBL; L5 removes it while L1 adds hard light). Run ONE combined indoor VLM pass
  (day/night × classic/realistic × hdr on/off) instead of per-layer QA.
- **L2×L4**: realistic night key goes cool (0.86,0.88,0.95) while classic night stays warm-table —
  intended; the style toggle at night now changes key direction AND color (extension, fine).
- **L3×L4**: moon 3.2 is pre-gain — effective 4.16 under finish+HDR realistic (sky.js:544 multiplies
  after the moon add); doc should say so.
- **L4×L5**: `bakePMREM` forces uHdrGain=1 (sky.js:751) → the gain change does NOT touch the IBL ✓
  no interaction; the outdoor T7 guard still bounds the old leak class.

## 9. Recommended landing order

1. L4-P0-1 + L5-P0-1 (the two gate one-liners) — before any calibration work.
2. L1 (kill removal) + combined indoor calibration (L1-P1-1) — smallest, unblocks L1×L5 QA.
3. L2 with the stash seam + shared moonDirection helper + dusk sweep E2E.
4. L3 (constants) + T5 retune.
5. L4 calibration loop (gate numerically → measure → set constants) + full T9-family rewrite +
   T10 re-baseline.
6. L5-P1-1 (PMREM skip) + outdoor PMREM guard.
7. Matrix 7/7 + all prior oracles; then the L6 ledger feeds the recording-feature decision.
