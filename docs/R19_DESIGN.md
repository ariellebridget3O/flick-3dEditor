# R19 design — light/sky/HDR calibration + parity audit

User feedback (r19, verbatim intents):
1. Sky must not ALWAYS bloom / read blindly bright. HDR philosophy is delegated to us. Toggling HDR should be visible.
2. PMREM IBL: keep outdoor realism, drop indoor (the problem is mainly indoor).
3. Sun/moon hard light must SYNC with the time-of-day setup. Indoor: walls block sunlight/moonlight but it shows through windows — currently indoor kills the directional entirely (no window light, no time response).
4. Moon: halo much smaller, disc slightly bigger; sun AND moon must bloom naturally (highest-illumination members).
5. Full functionality-parity audit → ledger → deep compare → re-rank before the recording feature.

## Measured current state (probes r19_probe1/2 + r18 E2E)
- indoor day: sun i=0 invisible — the ONLY hard light is the flat warm ambient → "same shadow regardless of time of day".
- night: dim key 0.552 from remapDir [0.45,0.82,0.36] (55° up, sun AZ) while the visible moon is anti-solar+0.25right — hard light contradicts the visible disk (both styles; realistic has the disk).
- luminance vs bloom threshold (linear, pre-tonemap, thr=1.0):
  - classic sky body 0.87-0.93 raw ×1.48 lift → 1.29-1.38 → whole-sky bloom (the complaint)
  - realistic sky body ×1.7 uHdrGain → same class
  - sun disc 30×T (blooms ✓), moon disc 0.62×limb + halo 0.15 (never blooms ✗)
  - classic flare (sun glow) ≈0.55×lift — at/below threshold → the sun's surroundings barely glow
- PMREM: envIntensity 0.30 both indoor and outdoor in realistic style.

## The HDR decision (delegated)
HDR = range + bloom on TRUE highlights + ACES flatten. NOT a blanket sky lift.
- Sky BODY sits just BELOW the bloom threshold (displayed brightness stays continuous HDR on/off via a small ACES-compensation lift ~1.06 classic / ~1.3 realistic, calibrated so horizon < 1.0 linear).
- TRUE highlights cross the threshold and bloom naturally: sun disc (30×T ✓ already), MOON disc (0.62 → 3.2 core), classic sun FLARE region (×1.8 under HDR — the glow around the sun), cloud sunlit tops (already near 1.0-1.3 — subtle bloom stays).
- Night lamps (HDR_EMISSIVE_BOOST) unchanged.
- Toggling HDR shows: deeper sky (ACES), sun/moon halos, contrast — not a white wash.
- Rationale vs "flatten": ACES flattening IS the tonemap's job; bloom then marks the genuinely-bright. A sky body above threshold everywhere reads "blindly bright" (user complaint) because bloom's spatial spread whitens the whole dome.

## Layers

### L1 — indoor window light (feedback 3/clarified)
- Remove the `(indoor ? 0 : 1)` sun kill. The shadow-casting directional STAYS indoors: walls block it via the shadow map; windows pass real shafts that follow az/el (time-of-day response the user asks for).
- Intensity: full table value (a real shaft through a window is full-sun); the warm ambient (D7) stays as the indirect base. No extra indoor attenuation — shadowing does the work.
- indoor is OUR extension (bundle has no indoor lighting concept — verified: only 2 content-string hits) → zero oracle impact. Pixel matrix scenes are outdoor → unaffected; re-run to confirm.

### L2 — night key = moonlight, direction-synced (feedback 3)
- REALISTIC style only (classic has no visible moon; its table-driven dim warm night key from the remapped direction is live-exact — untouched).
- Blend the single shadow-casting directional: as nightAmt 0→1, direction slides sunDir→moonDir (the EXACT uMoonDir the dome renders: anti-solar + 0.25 right), color slides sunColor→moon tone (0.86,0.88,0.95-cool), intensity stays table g.sun (0.55 at -30° — already moon-dim). One shadow map, continuous at dusk.
- The shadow fit (AOr) must use the SAME effective direction → new env.keyLightDirection(light) consumed by the fit; classic flareDirection keeps sunDirection (dome visual unchanged).
- Indoor: same directional → moonlight comes through windows at night ✓.

### L3 — moon visual tune (feedback 4)
- Halo: pow 140 × 0.15 → pow 700 × 0.10 (tight glow ≈1.5 disc radii — "no need to be this big").
- Disc: cos(0.0182)..cos(0.0152) → cos(0.0215)..cos(0.0180) (0.87° → 1.03° radius, ~+18% "slightly bigger").
- Disc luminance 0.62 → 3.2 (core crosses the bloom threshold → natural halo via bloom, matching the sun's treatment; limb darkening keeps sphere shape; SDR clip to white is correct full-moon look).

### L4 — HDR recalibration (feedback 1)
- const: HDR_SKY_LIFT 1.48 → HDR_SKY_BODY_LIFT 1.06 (classic zenith/horizon/fog — body stays sub-threshold: 0.93×1.06=0.986); HDR_CLASSIC_FLARE_LIFT 1.8 (NEW — flare term only; sun surroundings glow).
- realistic: HDR_REALISTIC_GAIN 1.7 → ~1.3 (calibrate: body sub-threshold; sun disc 30× and moon 3.2 unaffected in character).
- Gates rewritten: sky body NO bloom at thr 1.0 (Δ<2 vs bloom-off) and YES bloom from the sun region (day) / moon disc (night); r18 E2E T9 updated to the inverted criterion.

### L5 — PMREM IBL indoor/outdoor split (feedback 2)
- realistic: scene.environmentIntensity = indoor ? 0 : SKY_IBL_INTENSITY(0.30). Indoor indirect = ambient + hemi only (no through-walls fake bounce); outdoor keeps the IBL realism.
- Interior continuity classic↔realistic indoor → ~0 delta (both no IBL).

### L6 — parity audit ledger (feedback 5) — sub-agent, parallel
- Full bundle scan + our editor modules → analysis/R19_PARITY_LEDGER.md: per-subsystem rows (exact | ported | approx | missing | dormant | our-extension), gap list with severity, backlog re-rank. Feeds the recording-feature decision (is it the last feature or just camera-mode's last leg?).

## Invariants
- Classic outdoor default path byte-identical (matrix 7/7 gate; all changes gated on indoor|realistic|hdr|night).
- Classic night = live table behavior unchanged (the L2 blend is realistic-only).
- All prior oracles/E2E green; r18 T9 rewritten to the new criterion.
