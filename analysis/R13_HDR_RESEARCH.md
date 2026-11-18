# R13 — HDR Rendering + Bloom: Research + Integration Design

Research-only doc (no editor code was modified). Purpose: design a toggleable **HDR rendering
mode** — more pronounced light/shadow (higher dynamic range in the light/shadow computation,
no flat highlight clipping) plus **bloom** for genuinely bright HDR surfaces — as a
BEYOND-THE-ORIGINAL setting that leaves the default (HDR off) path **byte-identical**.

User requirement (verbatim intent): *"explore HDR rendering for light/shadow pass, to allow
more pronounced light and shadow and potentially some bloom effect too for the HDR bright
surface (currently contrast is quite bad and harder to provide lighting reference. this can be
toggled as a setting."*

Verification marks: **[V]** = fetched/verified from this research sandbox (raw.githubusercontent,
GitHub HTML/wiki, live blogs, or the local vendored r182 build — the strongest possible source
for engine-behavior claims). **[UV]** = unverified from sandbox (blocked/Cloudflare) — re-verify
from a browser before relying on it. GitHub REST API was rate-limited this session; everything
critical was instead verified via raw-file fetches or the local `editor/js/vendor/` build.

---

## §0.5 SHIPPED DEVIATIONS from this design (r13 implementation — RATIFIED, E2E'd)

The research below stands as research; the shipped implementation (commits 4e933e2 →
677afbe, QA: `scripts/hdr_qa.py` + `scripts/bloom_verify.py` + `scripts/clouds_hdr_check.py`)
deviates from the recommendation in exactly two picks and one mechanism. Everything else
shipped as specced (§4.5 rebalance numbers verbatim, §4.6 classic lift 1.10, §5 schema/UI).

1. **Tone mapper: `ACESFilmicToneMapping` (Stephen Hill RRT+ODT fit) — NOT Neutral.**
   Rationale: the plain-renderer HDR fallback (`renderer.toneMapping = ACESFilmic`) and
   the finish-composite HDR branch must produce the SAME look for a given exposure
   slider value; sharing three's own ACES constants (byte-verified vs the vendored
   r182 `tonemapping_pars_fragment`) in both paths makes that true by construction —
   the fallback's `×exposure/0.6` internal scaling is replicated in the composite via
   a `toneMappingExposure ×0.6` pre-scale (r13 review P2-2: D-vs-B divergence collapsed
   99.97% → 26% = bloom-only residual). Neutral in the composite + ACES in the fallback
   would have split the look between render paths. The research's color-fidelity
   argument for Neutral (§2.3) remains valid for a future "accurate" preset.
2. **Bloom: UnrealBloomPass RECIPE (clean-room) — NOT the CoD-AW dual filter.**
   Structure: separate `LuminosityHighPassShader` knee (`smoothstep(T, T+0.01, v)`,
   NOT folded into the first downsample) → 5 HalfFloat mips ½…1/32 → per-mip separable
   Gaussians (kernels 3/5/7/9/11, σ=k/3 coefficients) → mip-weighted composite
   (factors 1.0/0.8/0.6/0.4/0.2, `mix(f, 1.2−f, radius)`) → add in the composite pass.
   12 draws measured within the auto-measure budget. The CoD-AW tent-upsample chain
   (§4.3) remains the documented perf-optimized alternative (~0.7 vs ~2.0 full-res-pass
   equivalents) if the budget ever tightens.
   SHIPPED CAVEAT (found + fixed r13, see SKILL/FIDELITY): three r182 injects
   `getLuminanceFunction()` UNCONDITIONALLY into every ShaderMaterial fragment prefix —
   any ported bloom shader that declares its own `luminance()` (both UnrealBloomPass
   and CoD-AW would) silently fails to compile. Our high-pass uses `hpLum`; the finish
   composite's ACES fit uses `acesRRTFit` (same collision class with
   `tonemapping_pars_fragment`).
3. **Sky dome HDR mechanism: `uCurve` split — NOT `uToneMap` mode 2.** §4.6 specced a
   third uToneMap mode (linear part of the demo curve); shipped instead as a separate
   AND-gated `uCurve` uniform (0 = linear HDR out) shared by sky.js AND clouds.js —
   the r13 review P1 required the clouds deck to ride the SAME output space as the
   dome it occludes, and a single orthogonal gate served both. PMREM (IBL) stays
   untouched as specced.

## §0 TL;DR recommendation

**Ship an HDR mode owned by a new `editor/js/hdr.js` module: scene → HalfFloat MSAA RT →
5-mip CoD-Advanced-Warfare dual-filter bloom (threshold folded into the first downsample) →
single composite to screen (add bloom in linear HDR → `NeutralToneMapping` (Khronos PBR
Neutral) × exposure → sRGB + triangular dither → `gl_FragDepth`), with a `shadowBoost` light
rebalance (sun ×1.8 / hemi ×0.85 / shadow radius ×1.5 at default) applied inside
`env.applyDaylight` only when `light.hdr.on`.**

- **Tone mapper: `NeutralToneMapping` (Khronos PBR Neutral)** — the only one of the three
  candidates *designed for PBR color accuracy under well-exposed lighting* ("product
  photography" use case per the Khronos repo [V]); near-identity through midtones, compresses
  only the top ~24%, cheapest ALU of the three. AgX/ACES would desaturate/hue-shift the
  surface colors a *lighting reference* tool must keep truthful.
- **Bloom: dual filter** (Jimenez, SIGGRAPH 2014) — 13-tap downsample / 9-tap upsample
  progressive mip chain, ~0.7 full-res-pass equivalents vs ~2.0 for `UnrealBloomPass`
  (r182: 5 separable Gaussians 6–22 taps ×2 directions + composite + additive blend [V]) —
  the difference between fitting and not fitting the 11 ms SwiftShader budget.
- **Two seams, zero default-path damage:**
  1. `finish.js` composite gains an `#ifdef HDR` variant block + an optional 3rd `render()`
     arg (a bloom hook called between the scene render and the composite blit). When the
     define is absent the compiled GLSL and JS path are **exactly today's** — the classic
     pixel gate (4/4) stays green by construction.
  2. Plain path (finish off): `hdr.js` owns its own scene RT (same recipe as finish's:
     HalfFloat + MSAA 4 + depth texture) and a final composite that writes `gl_FragDepth`,
     so planning aids keep their depth-occlusion contract. `renderer.toneMapping` is
     **never** set (it only applies to materials rendering direct-to-canvas in r155+ [V]).
- **Schema v13** (coordinated with the clouds research — see §5): `light.hdr = { on,
  exposure, shadowBoost, bloomStrength, bloomThreshold }`, absent in all migrated scenes =
  off. UI: an "HDR light" section in the light popover (toggle + 4 sliders), **schema-carried
  per-scene** (like `skyStyle`), not localStorage.
- **Gating**: the finish auto-measure pattern, reused verbatim — HDR frame cost − plain frame
  cost ≤ 11 ms (scaled to 1080p) or the toggle auto-reverts with a hint. `?hdr=0|1` URL
  override for QA, mirroring `?finish`.

---

## §1 Why the current SDR path has poor contrast (mechanics, with numbers)

Current pipeline (verified in `main.js` + vendored r182):

- `WebGLRenderer` is created with defaults: `toneMapping = NoToneMapping`,
  `outputColorSpace = SRGBColorSpace` (`main.js:51`, no `toneMapping` assignment anywhere).
- Plain path: materials render direct-to-canvas → each material applies
  **no tone curve**, only linear→sRGB (`colorspace_fragment`), then the UNORM8 framebuffer
  **clamps** anything > 1.0.
- Finish path: scene renders into the HalfFloat MSAA RT **linear** (r155+ semantics: RT
  targets get `NoToneMapping` + `LinearSRGBColorSpace`, see §2.1), then the composite does
  `toSrgb(clamp(color, 0.0, 1.0))` (`finish.js:258`) — the same clamp, one pass later.

Three r182 lighting (physical mode, `useLegacyLights` removed): Lambert diffuse =
`albedo × lightColor × intensity × dotNL / π` (`BRDF_Lambert = RECIPROCAL_PI × diffuseColor`).
With the DAYLIGHT_STOPS table:

| stop | sun intensity | hemi fill | lit white (albedo .9, dotNL 1) | shadow (hemi×~.8 mix, /π) | what SDR shows |
|---|---|---|---|---|---|
| midday (el 32°) | 2.15 | 1.70 | 0.62 linear → display 0.79 | 0.43 → 0.69 | ratio **1.23:1**, flat |
| golden (el 5°) | 3.60 | 1.45 | **1.03 linear → CLIPS to display 1.0** | 0.37 → 0.64 | ratio 1.56:1, **sunlit detail destroyed** |

Numbers computed with the exact sRGB OETF; "display" = post-sRGB 0–1. The two failure modes:

1. **Flat clipping**: any sunlit surface with `albedo × sun / π > 1` renders as identical
   flat white — no gradient, no texture — exactly at the elevations (5–16°) a previz tool
   cares about most.
2. **Narrow ratio**: sun:fill ≈ 2.1:1 in *linear light* → ≈1.2–1.5:1 in display terms.

HDR mode targets both: sunlit values 1.2–2.1 stay un-clipped and roll off through Neutral
(visible gradient), the fill drops with `shadowBoost`, and bloom separates the >threshold
surfaces. Expected at defaults (computed, §4.5): golden lit 2.06 linear → Neutral 0.962
display vs shadow 0.60 → **1.65:1 with no flat region**; at `shadowBoost = 1` ≈ 1.67:1 plus
bloom halos. The perceptual win is mostly the restored highlight gradient + darker shadow
side + bloom separation, not the raw display ratio (sRGB gamma compresses ratios by design —
that's why the exposure slider exists).

---

## §2 Survey

### §2.1 three.js r182 HDR/tone-mapping semantics — verified in the vendored build [V]

From `editor/js/vendor/three.module.js` (the exact r182 build the editor ships):

- **Tone mapping + output color-space conversion apply only when rendering to screen.**
  `WebGLPrograms.getParameters` (~line 7343):
  ```js
  let toneMapping = NoToneMapping;
  if ( material.toneMapped ) {
      if ( currentRenderTarget === null || currentRenderTarget.isXRRenderTarget === true ) {
          toneMapping = renderer.toneMapping;
      }
  }
  ...
  outputColorSpace: ( currentRenderTarget === null ) ? renderer.outputColorSpace
      : ( currentRenderTarget.isXRRenderTarget === true ? currentRenderTarget.texture.colorSpace
      : LinearSRGBColorSpace ),
  ```
  → **Rendering into any (non-XR) render target yields raw linear, un-tonemapped color.**
  This is exactly what an HDR chain needs, and it's why the finish RT already holds linear
  HDR (and why its composite had to do its own sRGB). Officially stated in the r154→155
  migration guide [V]: *"The inline tone mapping controlled via `WebGLRenderer.toneMapping`
  only works when rendering to screen now (similar to `outputColorSpace`). In context of
  post processing, use `OutputPass` to apply tone mapping and color space conversion."*
  <https://github.com/mrdoob/three.js/wiki/Migration-Guide#154--155>
- **Built-in tone mappers** (all in `tonemapping_pars_fragment`, vendored line ~496 [V]):
  `Linear, Reinhard, Cineon, ACESFilmic (Stephen Hill RRT+ODT fit), AgX (REC2020 log-space
  polynomial), Neutral (Khronos PBR Neutral)`, all × `toneMappingExposure`.
  `OutputPass` (r182, fetched [V]) is the canonical end-of-chain placement:
  <https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/postprocessing/OutputPass.js>
- **Lights**: `useLegacyLights` — 0 occurrences in our r182 build [V] (deprecated default-off
  in r155, removed by r165 per the r155 announcement [V]): *"The intensities for ambient,
  hemisphere, directional lights and light maps can be restored by multiplying PI with the
  existing light intensity values. The intensity of point and spot lights is measured in
  candela (cd) now… Ambient and hemisphere lights … as well as directional lights do not use
  SI units."* <https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733>
  → Directional/hemisphere intensity is a free scalar — **any value > 1 is safe and
  HalfFloat RTs (max 65504) hold the results**; nothing in r182 renormalizes it.
- **KHR_lights_punctual** (spec fetched [V]): `point/spot` intensity = luminous intensity in
  **candela (lm/sr)**, inverse-square; `directional` = illuminance in **lux (lm/m²)**, not
  attenuated; *"The `intensity` represents the luminous intensity … if it were colored pure
  white … `color` acts as a wavelength-specific multiplier"*; **no upper bound** on
  intensity. Our `GLTFLoader` (vendored, line 724) maps `lightDef.intensity →
  lightNode.intensity` 1:1 — so prop-borne punctual lights are already in the same
  physical mode and bloom-consistent under HDR.
  <https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md>
- **PCFShadowMap + shadow.radius** (vendored `shadowmap_pars_fragment` [V]): directional PCF
  is a 5-tap Vogel disk × `interleavedGradientNoise` rotation, **scaled by
  `shadowRadius × texelSize`** — i.e. `sun.shadow.radius` (ours: `C.SUN_RADIUS = 2`) does
  control PCF penumbra width in r182. `PCFSoftShadowMap` still exists but we keep
  `PCFShadowMap` (the live's exact choice) and only widen the radius in HDR mode.
- **MSAA RT resolve**: sampling `rt.texture` after rendering into a `samples > 0` RT gives
  the resolved image (three blits on target switch) — the finish composite already relies
  on this for `tColor`; the bloom chain can rely on it identically.

### §2.2 Bloom implementations

| Option | What it is (verified this session) | License | Cost @1080p (full-res-pass equiv.) | Verdict for us |
|---|---|---|---|---|
| **three `UnrealBloomPass` r182** [V] | high-pass (smoothstep knee, `smoothWidth 0.01`) → 5 mips ½…1/32 HalfFloat → per-mip **separable Gaussian** (kernel radii 6,10,14,18,22 taps, ×2 directions each) → mip-weighted composite (factors 1.0…0.2) → **additive blend pass** back onto the input. Doc note: "When using this pass, tone mapping must be enabled in the renderer settings." <https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/postprocessing/UnrealBloomPass.js> | three.js = **MIT** [V: r182 LICENSE fetched] | ≈ **2.0** (0.25 threshold + ~0.67 blur + 0.25 composite + 1.0 blend) | Quality reference; too slow for SwiftShader at our budget; additive blend pass to screen would break the `gl_FragDepth` overlay contract |
| **pmndrs/postprocessing `BloomEffect`** [V] | luminance threshold + either `KawaseBlurPass` or `MipmapBlurPass` (progressive down/up-sample, radius-lerped upsample combine); integrates with its own EffectComposer | **zlib** [V: LICENSE.md fetched] | ≈ 0.7–1.0 with mipmap blur | Architecture doesn't fit (own composer, renderer assumptions); zlib attribution if code copied; **we borrow the idea, not the code** <https://github.com/pmndrs/postprocessing> |
*(SHIPPED: the UnrealBloomPass recipe was picked instead — see §0.5.)*
| **CoD: Advanced Warfare dual filter** (Jimenez, SIGGRAPH 2014) [V: talk listing + full kernel transcription via Froyok's UE4 port] | threshold folded into first **13-tap downsample**; progressive downsample ½→1/32; **9-tap tent upsample** with `lerp(current, upsampled, radius)` combine at each level; final add in the tonemap pass | talk technique (no code license needed — we write our own GLSL) | ≈ **0.7** (13+13+13+13+13 taps at ¼+1/16+… then 9×5 up ≈ 0.33+0.33) | ✅ **Chosen**: cheapest wide blur, soft continuous falloff (the CoD talk's whole point), matches the finish composer's own downsample-blur philosophy |
| Simple 2-pass Gaussian @ ¼ res (LearnOpenGL-style) [V] | threshold → H+V Gaussian → add | free | ≈ 0.35 | Fallback if dual filter measures over budget; narrower falloff, visible "bloom box" edge on big highlights |

Sources: talk index <https://advances.realtimerendering.com/s2014/> (fetched; slides link
`sledgehammer/Next-Generation-Post-Processing-in-Call-of-Duty-Advanced-Warfare-v17.pptx` —
437 MB, not re-downloaded this session; kernel verified via the transcription in
**Fabrice Piquet, "Custom bloom in Unreal Engine 4"** <https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/>
[V — full shader code fetched], which is also the implementation pmndrs `MipmapBlurPass`
cites). General background: LearnOpenGL Bloom [V] <https://learnopengl.com/Advanced-Lighting/Bloom>;
Godot glow docs [V] (engine example of threshold-less HDR bloom + exposure pipeline)
<https://docs.godotengine.org/en/stable/tutorials/3d/environment_and_post_processing.html>.

### §2.3 Tone mapper candidates (exact r182 GLSL is in the vendored build [V])

| Mapper | Formula summary | Behavior | For a previz/lighting-reference tool |
|---|---|---|---|
| `ACESFilmicToneMapping` | Stephen Hill's RRT+ODT fit: 2× mat3 + rational fit, `×exposure/0.6` | Punchy, filmic; **hue shifts** saturated colors (orange-drift), heavy mid desaturation | Distorts albedo truthfulness |
| `AgXToneMapping` | REC2020 → log2 EV −12.47…+4.03 → 15th-deg-ish polynomial contrast → outset → pow 2.2 | Extremely robust highlights, no inversion; **strong pastel desaturation by design** (film emulation) | Beautiful for "cinematic stills", wrong when the tool must read surface colors |
*(SHIPPED: ACESFilmic was picked instead — see §0.5.)*
| **`NeutralToneMapping`** ✅ | Khronos PBR Neutral (below, §4.2) — peak compression from 0.76, offset-toe, 15% desat **only inside the compressed range** | Near-identity ≤0.8; smooth asymptote to 1.0; colors stay faithful | **Recommended** — the Khronos repo's own stated goal [V]: *"designed specifically for PBR color accuracy, to get sRGB colors in the output render that match as faithfully as possible the input sRGB baseColor under gray-scale lighting… aimed toward product photography use cases, where the scene is well-exposed and HDR color values are mostly restricted to small specular highlights"* — that is precisely "pronounced highlights without lying about the surfaces". Also the cheapest (≈15 ALU, no mat3/pow) — best on SwiftShader. |

PBR Neutral reference (fetched [V], matches the vendored three GLSL constant-for-constant):
<https://github.com/KhronosGroup/ToneMapping> (Apache-2.0 repo; three's port is MIT so we
inline three's version — no license question).

### §2.4 "More pronounced light/shadow" — how real engines get punch without breaking a table-driven look

Surveyed practice (Unreal/Unity docs + the above talks; consistent across all of them):

1. **Light ratio, not curves, creates shadow depth.** Outdoor key:fill in production
   references runs ~3:1–8:1 (sun vs sky ambient). Ours is ~2.1:1 from the table. Raising the
   sun and/or lowering the fill — *then* tone-mapping to hold the lit side — is the
   standard recipe (UE "Directional Light Intensity" 8–10 lux-scale vs "Sky Light" ~1 is the
   same shape).
2. **Ambient occlusion contribution scales with the fill**, not the key: darker fill makes
   the existing finish SSAO/occlusion tint read stronger for free; an explicit tint-strength
   scale is a cheap extra (§4.5).
3. **Contact/penumbra shaping**: we already have PCF (5-tap Vogel × radius, §2.1). Widening
   `sun.shadow.radius` softens penumbrae (sun-feel) without touching the map or the type.
   Normal-offset/bias stay as the live set them (the shadow fit `TOr` owns those numbers —
   do not perturb; the fingerprint logic is byte-exactness surface).
4. **Punctual/emissive HDR**: night-lamp glows (`GLOW_EMISSIVE` × `glow ≤ 1`) and spot beams
   are LDR today; a scalar emissive boost in HDR mode makes them cross the bloom threshold.

None of these touch the DAYLIGHT_STOPS values themselves — HDR mode applies **multipliers on
top of the table outputs inside `applyDaylight`**, gated by `light.hdr.on`, so the classic
path computes the identical floats it always did.

---

## §3 Recommended architecture

### §3.1 The four-mode matrix

| | HDR off (default) | HDR on |
|---|---|---|
| **finish off** | today's plain path, untouched: `renderer.render(scene, camera)` → canvas (AA from canvas MSAA) | **`hdr.render(scene, camera)`**: scene → `rtHdr` (HalfFloat, MSAA 4, depth tex) → bloom mips from `rtHdr.texture` → composite (+bloom → Neutral×exposure → sRGB + dither → `gl_FragDepth`) → canvas |
| **finish on** | today's finish, untouched (define absent) | `finish.render(scene, camera, hdrHook)`: scene+SSAO as today → **hook** computes bloom mips from `rtScene.texture` → composite `#ifdef HDR` block (+bloom → Neutral×exposure → sRGB + dither → `gl_FragDepth` as today) |

Both HDR composites write `gl_FragDepth` from the scene depth texture so
`drawOverlays()` (stroke ring → planning aids → navBall `copyFramebufferToTexture`) keeps
working unmodified. **`renderer.toneMapping` stays `NoToneMapping` forever** — in r155+
it would only affect materials rendering direct-to-canvas, i.e. the overlays, which we
explicitly want LDR-vivid UI.

### §3.2 Pass graph (HDR on)

```
plain path                          finish path
──────────                          ───────────
scene ──▶ rtHdr (HF16, MSAA4,        scene ──▶ rtScene (HF16, MSAA4, depth)   [finish, unchanged]
          depth)   (resolve)                    │ SSAO half-res ping-pong      [unchanged]
   │                                           │
   ├─ D0: threshold+down13 ─▶ mip0 (½)         ├─ hdrHook(rtScene.texture):
   ├─ D1: down13 ─▶ mip1 (¼)                   │    D0..D4 = same chain (shared code)
   ├─ D2: down13 ─▶ mip2 (⅛)                   │    U3..U0 = up9+lerp combine
   ├─ D3: down13 ─▶ mip3 (1/16)                │    └─▶ bloomTex (½ res)
   ├─ D4: down13 ─▶ mip4 (1/32)                │
   ├─ U3: up9+combine(mip4→mip3)               ▼
   ├─ U2: up9+combine(mip3→mip2)          finish composite (#ifdef HDR):
   ├─ U1: up9+combine(mip2→mip1)            occlusion tint + crease (unchanged)
   ├─ U0: up9+combine(mip1→mip0)            + bloomTex × strength   (linear HDR add)
   ▼                                       Neutral( × exposure )  → sRGB → dither
composite:                                  → gl_FragDepth          [same depth recipe]
  (scene + bloom×strength) × exposure
  → Neutral → sRGB → dither → gl_FragDepth
   ▼
canvas (LDR8)  ──▶ drawOverlays() (unmodified)
```

Notes:
- Threshold is folded into D0 (the CoD/UE `DownsampleThreshold` trick) — no separate pass.
- Bloom chain starts at **½ res**; total ≈ 0.7 full-res-pass equivalents (§2.2).
- The bloom mips are owned by `hdr.js` and **shared by both paths** (they only need a source
  texture + size). `hdr.js` caches by (source texture identity, params, size) so a
  `finish.repaint()` re-composite reuses the cached bloom texture (the scene RT is unchanged
  by definition of repaint) — no stale-disposed-texture hazard, no wasted recompute.

### §3.3 `hdr.js` module (new, ~260 lines)

```
createHdrChain(renderer)
  ├─ capability: reuse finishCapable(renderer) (same HalfFloat+MSAA+depth requirements)
  ├─ alloc/release: rtHdr (HalfFloat, samples=min(4,maxSamples), DepthTexture UnsignedInt)
  │                + mip0..mip4 (RGBAFormat HalfFloat, depthBuffer:false, LinearFilter)
  │                + own 150 ms size-latch (same pattern as finish's makeSizeLatch)
  ├─ setParams({ exposure, bloomStrength, bloomThreshold })
  ├─ render(scene, camera)            // plain path: full chain to screen
  ├─ bloom(srcTexture) → bloomTexture // finish hook: chain only, cached
  ├─ release(), dispose()
  └─ shaders: VERT (finish's clip-space quad), DOWNSAMPLE_FRAG (threshold + 13-tap),
              UPSAMPLE_FRAG (9-tap tent + lerp combine), COMPOSITE_FRAG (Neutral + sRGB
              + dither + gl_FragDepth; depthTest:true, AlwaysDepth, depthWrite:true —
              the finish composite recipe)
```

### §3.4 The `finish.js` seam (additive, ~40 lines, clearly marked block)

1. `COMPOSITE_FRAG` gains a variant tail (full GLSL in §4.6): the current
   `gl_FragColor = vec4(toSrgb(clamp(color,0.,1.)) + dither(), 1.0)` line moves into
   `#else`; the `#ifdef HDR` branch adds `tBloom`/`uBloomStrength`/`uExposure`, a verbatim
   inline copy of three's `NeutralToneMapping` (no chunk include — avoids define coupling),
   adds bloom **pre-tonemap**, tonemaps, then the same `toSrgb` + `dither`.
   **When the define is absent the preprocessed GLSL is character-identical to today's** —
   no new uniforms are referenced, no code path changes. (Uniform *objects* existing in the
   JS uniforms map without being referenced by the shader is a no-op in three.)
2. `render(mainScene, mainCamera, hdrHook)` — the new 3rd param, default `undefined`:
   after `blit(blur, S)` and before the composite uniform block, call
   `const hdr = hdrHook?.(k.texture)` and set `cu.tBloom.value = hdr?.bloom ?? null` +
   `composite.defines` management (`hdr ? { ...defines, HDR: '' } : defines` —
   `needsUpdate` only fires when the define set actually changes, so the per-scene toggle
   costs one program rebuild).
3. `repaint(mainCamera, hdrHook)` — pass the hook through so a future caller (the live uses
   repaint for cheap re-composites; our port keeps the API symmetric) re-binds the cached
   bloom instead of a possibly-reallocated texture.

Why this seam (vs. alternatives, §9): finish's composite is the only place that owns (a) the
fog-aware occlusion/crease math and (b) the `gl_FragDepth` contract. Rerouting finish's
output through an external HDR chain would need a linear-HDR composite variant anyway (same
shader edit) **plus** an extra screen blit (+~1 full-res pass on SwiftShader) **and** would
move the depth write off-screen (breaking overlays). One `#ifdef` is strictly cheaper and
provably byte-identical when off.

---

## §4 Exact formulas

### §4.1 Threshold (soft knee, folded into D0)

```glsl
// luma = Rec.709 (three's luminance()); T = bloomThreshold, knee = max(0.1, 0.25*T)
float l = luminance(c.rgb);
float knee = max(0.1, 0.25 * uThreshold);
float soft = clamp(l - uThreshold + knee, 0.0, 2.0 * knee);
float contrib = max(soft * soft / (4.0 * knee + 1e-4), l - uThreshold) / max(l, 1e-4);
c.rgb *= clamp(contrib, 0.0, 1.0);
```
UE-style quadratic knee (smoother than `UnrealBloomPass`'s `smoothstep(T, T+0.01, v)` [V]);
threshold applies to **pre-exposure scene HDR** (same as the three composer flow, where the
`OutputPass` exposure runs after bloom-add — document this in the UI hint).

### §4.2 Tone map — Neutral (Khronos PBR Neutral; verbatim three r182 GLSL)

```glsl
vec3 neutralToneMapping(vec3 color) {
  const float StartCompression = 0.8 - 0.04;
  const float Desaturation = 0.15;
  color *= uExposure;                       // toneMappingExposure analogue
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < StartCompression) return color;
  float d = 1. - StartCompression;
  float newPeak = 1. - d * d / (peak + d - StartCompression);
  color *= newPeak / peak;
  float g = 1. - 1. / (Desaturation * (peak - newPeak) + 1.);
  return mix(color, vec3(newPeak), g);
}
```
Then the existing finish `toSrgb` (+ the finish triangular dither) — one sRGB encode total.

### §4.3 Dual filter — downsample (13 taps) and upsample (9 taps)

CoD AW kernels as transcribed in the Froyok UE4 port [V] (pixel units relative to the
**source** texture; `halfTexel` = 1/sourceSize):

```glsl
// DOWNSAMPLE (also mips 1..4; D0 prepends the §4.1 threshold)
const vec2 C[13] = vec2[13](
  vec2(-1., 1.), vec2( 1., 1.), vec2(-1.,-1.), vec2( 1.,-1.),      // ±1 src px diag
  vec2(-2., 2.), vec2( 0., 2.), vec2( 2., 2.),                    // 3×3 at ±2 src px
  vec2(-2., 0.), vec2( 0., 0.), vec2( 2., 0.),
  vec2(-2.,-2.), vec2( 0.,-2.), vec2( 2.,-2.));
const float W[13] = float[13](0.125,0.125,0.125,0.125,            // 4×(¼·½)
  0.0555556,0.0555556,0.0555556,0.0555556,0.0555556,               // 9×(1/9·½)
  0.0555556,0.0555556,0.0555556);
vec3 down(vec2 uv, vec2 srcTexel) {
  vec3 s = vec3(0.);
  for (int i = 0; i < 13; i++) s += W[i] * texture2D(tSrc, uv + C[i] * srcTexel).rgb;
  return s;
}
// UPSAMPLE (coarser mip → finer mip) + progressive combine
// 3×3 tent in units of the COARSER mip's texels:
const vec2 U[9]  = vec2[9](vec2(-1., 1.),vec2(0., 1.),vec2( 1., 1.),
                           vec2(-1., 0.),vec2(0., 0.),vec2( 1., 0.),
                           vec2(-1.,-1.),vec2(0.,-1.),vec2( 1.,-1.));
const float V[9] = float[9](0.0625,0.125,0.0625, 0.125,0.25,0.125, 0.0625,0.125,0.0625);
vec3 up = Σ V[i]·texture(tCoarser, uv + U[i]·coarserTexel);
outColor = mix(currentMipDownsample.rgb, up, uRadius);   // uRadius ≈ 0.85 (bloom radius)
```
Chain: mip0 ½ res … mip4 1/32 res; upsample-combine U3→U0; `mip0` after U0 is the bloom
texture. 5 mips = max highlight radius ≈ 32 px @1080p scale — enough for lamps/sun;
a 6th mip is a QA-tunable.

### §4.4 Composite (both paths)

```glsl
vec3 hdr = sceneColor;                       // linear HDR (fog/occlusion/crease already
hdr += bloomTex.rgb * uBloomStrength;        //  applied by the finish composite in that path)
vec3 outColor = neutralToneMapping(hdr);     // §4.2 (exposure inside)
gl_FragColor = vec4(toSrgb(clamp(outColor, 0., 1.)) + dither(), 1.0);   // finish's helpers
gl_FragDepth = sceneDepth;                   // overlay depth contract
```
Plain-path composite additionally reads `tDepth` and copies `gl_FragDepth` (it has no
fog/occlusion work — fog is already in the materials, exactly like today's plain path).

### §4.5 Light/shadow rebalance (HDR-only multipliers, applied in `env.applyDaylight`)

```
sunBoostK   = 1 + 1.6 · shadowBoost          // shadowBoost ∈ [0,1], default 0.5 → ×1.8
fillK       = 1 − 0.30 · shadowBoost         // default ×0.85  (hemi + ambient)
sun.intensity  = table × weather × altK × indoor? × sunBoostK
hemi.intensity = table × weather × indoor?   × fillK
sun.shadow.radius = C.SUN_RADIUS × (1 + 0.75 · shadowBoost)   // 2 → 3.5 at default, 4 at max
glow emissiveIntensity = glow × C.HDR_EMISSIVE_BOOST (≈4)     // night lamps cross threshold
finish occlusion tint (optional, QA-gated): mix source `sum` scaled by (1 + 0.4·shadowBoost)
```
Never touches the DAYLIGHT_STOPS floats; the `applyDaylight` cache key
(`az|el|weather|indoor|ambient|alt`) gains an HDR signature suffix so toggles re-apply.
Computed outcome at defaults (§1 table, golden stop): lit 2.06 → display 0.983 un-clipped,
shadow 0.60 → **1.65:1 with full highlight gradient + bloom**; at `shadowBoost 1`: sun ×2.6,
fill ×0.70.

### §4.6 Sky domes under HDR

- **Realistic dome (`sky.js`)**: today the visible dome applies the demo curve
  `L' = 1 − exp(−L/uWhitePoint · uExposure)` (`uToneMap=1`); PMREM bakes raw linear
  (`uToneMap=0`). **HDR adds mode 2**: `L' = max(L,0)/uWhitePoint · uExposure` (the *linear*
  part of the same curve — the sky keeps today's brightness scale) with **no sRGB**
  (`uOutputSRGB=0`) since the chain tonemaps; the horizon fog band mixes toward
  `uFogColor · uExposure` so the seam keeps its scale; disc/moon/stars stay (they're the
  bloom stars — sun disc L=30 → ×10/wp ≈ 278 → white + big soft bloom). PMREM stays mode 0:
  **IBL is untouched** — shadow sides stay sky-lit while the sun side boosts, which is
  exactly the contrast mechanism (§4.5). Implement as `uToneMap: 0|1|2` (float) + no other
  shader change.
- **Classic dome (`env.js`)**: colors are sRGB-hex → linear working-space values ≤ 1
  (`THREE.Color` + ColorManagement). **Zero shader change** — in HDR mode the uniform values
  are multiplied by `C.HDR_CLASSIC_SKY_LIFT` (JS-side, gated) so the sky survives Neutral:
  computed (§1 method): lift 1.10 → zenith display 0.911 vs today 0.898; **default 1.10**
  (`C.HDR_CLASSIC_SKY_LIFT = 1.10`, QA-tunable). `scene.fog.color` and the realistic-dome
  `fogColor` param get the same lift so the horizon/fog seam stays matched. The flare term
  (≤0.6 + lift) can cross the threshold near the sun → tasteful bloom. `#include
  <colorspace_fragment>` already emits linear when the material renders into the HDR RT
  (r155+ target-color-space semantics, §2.1) — no change needed.

### §4.7 Exposure semantics

`light.hdr.exposure` multiplies inside Neutral (§4.2) — identical to
`renderer.toneMappingExposure` semantics [V: OutputPass applies it inside the mapper].
Range 0.25–4.0, default **1.0**. Threshold is pre-exposure (§4.1) — hint text in the UI.

---

## §5 Schema v13 + UI spec

### §5.1 Schema (coordinate with R13 clouds)

`R13_CLOUDS_RESEARCH.md` (§4/§5 there) also targets v13 with `light.clouds`; **clouds has
NOT landed (repo is `SCHEMA_V: 12`)**. Both fields are additive, disjoint keys
(`light.clouds` vs `light.hdr`) with identity migrations — **whichever lands first takes
v13, the other lands in the same v13 if the same round, else v14 with the same one-line
additive bump**. This doc specs the HDR side; the migration body is identical in shape to
`v11to12`:

```js
function v12to13(n) { return { ...n, v: 13 }; }   // additive no-op (light.hdr absent = off)
```

```jsonc
"light": {
  // …existing fields unchanged…
  "hdr": {                       // ABSENT in every pre-HDR scene → off → byte-identical
    "on": true,                  // default false when the key is absent
    "exposure": 1.0,             // 0.25–4    (Neutral pre-multiplier, §4.7)
    "shadowBoost": 0.5,          // 0–1       (§4.5 rebalance amount)
    "bloomStrength": 0.35,       // 0–1       (linear add scale, §4.4)
    "bloomThreshold": 1.25       // 0.25–4    (soft-knee threshold, pre-exposure, §4.1)
  }
}
```

`normalizeLight` (env.js + schema.js `normLight`): `on` boolean (default false);
numerics clamped to the ranges above; unknown keys dropped; object absent → no `hdr` key
emitted (saveScene strips undefined — migrated scenes byte-identical). `env.normalizeLight`
passes `l.hdr` through only if valid. **No localStorage** — per-scene, like `skyStyle`
(requirement: "schema-carried (per-scene)"). QA/debug: `?hdr=0|1` URL override mirroring
`?finish` (session-only, not persisted).

### §5.2 UI — light popover (env panel), after the "Sky" section

```
┌ HDR light ────────────────────────────────────┐
│ [ Off ] [ On ]                                │  // seg buttons, style = lpSky
│ Exposure        ────●────  1.00               │  // range 0.25–4 step .05
│ Shadow depth    ──●──────  0.50               │  // shadowBoost 0–1 step .05
│ Bloom           ─●───────  0.35               │  // 0–1 step .05
│ Bloom threshold ───●─────  1.25               │  // 0.25–4 step .05
│ hint: "Wider light↔shadow range with filmic    │
│ highlight roll-off and bloom on bright         │
│ surfaces. Per-scene setting."                  │
└───────────────────────────────────────────────┘
```
- Sliders disabled/dimmed when off. `commit()` wrapper (beginEditGesture) so a whole slider
  drag = one undo entry — same as the ambient slider.
- `app.setHdr(patch)` mutator (mirrors `setSkyStyle`): merges `this.light.hdr`, clamps,
  `this.env.applyDaylight(this.light)` (+ `setSkyStyle` re-run for the dome lift/mode),
  `this.shadowFit.force()` (radius change), `markAutosave()`.
- Scene restore: `loadSceneData` line ~331 — apply `light.hdr` next to `setSkyStyle`.

---

## §6 Implementation plan (one round)

| # | File | Change (all additive; HDR-off = byte-identical) | Est. |
|---|---|---|---|
| 1 | `editor/js/const.js` | `C.SCHEMA_V = 13`; `C.HDR_*`: `SUN_BOOST_K=1.6, FILL_K=0.30, RADIUS_K=0.75, EMISSIVE_BOOST=4, CLASSIC_SKY_LIFT=1.10, BLOOM_MIPS=5, BLOOM_RADIUS=0.85, BUDGET_MS=11`; ranges object for the UI/normalize | ~15 L |
| 2 | `editor/js/schema.js` | `v12to13` (or `v13to14` per §5.1) + load branch; `normLight` hdr validation/clamp | ~20 L |
| 3 | `editor/js/hdr.js` (NEW) | Module per §3.3: RT mgmt + size latch, `finishCapable` reuse, DOWNSAMPLE/UPSAMPLE/COMPOSITE shaders (§4.1–§4.4), `render()` plain chain, cached `bloom(src)`, `setParams`, release/dispose | ~260 L |
| 4 | `editor/js/finish.js` | §3.4: `#ifdef HDR` composite tail + `NeutralToneMapping` inline (§4.2); `render(scene, cam, hdrHook)`; `repaint(mainCamera, hdrHook)`; uniforms `tBloom/uBloomStrength/uExposure` (dead when define absent) | ~45 L |
| 5 | `editor/js/env.js` | `applyDaylight`: HDR multipliers (§4.5) + cache-key suffix; classic dome + fog color lift; `buildSkyParams` passes `outputHdr` for dome mode 2; `updateRealisticSky(camera, outputSRGB, hdrOn)` signature (additive 3rd arg); `normalizeLight` hdr passthrough | ~35 L |
| 6 | `editor/js/sky.js` | `uToneMap` 0/1/2 enum (mode 2 = linear ×e/wp + fog band ×e, §4.6); `setParams`/`update` plumb the mode; PMREM path pins mode 0 (existing code path) | ~20 L |
| 7 | `editor/js/main.js` | `this.hdr = createHdrChain(renderer)`; `renderFrame` 4-mode branch (§3.1) + `updateRealisticSky(this.camera, !finishOn && !hdrOn)`; `setHdr` mutator; `?hdr=` override; HDR release discipline (mirror `finish.release()` when off); `_autoMeasure` HDR variant (§7); loadSceneData apply | ~60 L |
| 8 | `editor/js/ui.js` | Light popover HDR section (§5.2) + render() sync | ~50 L |
| 9 | QA | Classic gate 4/4 (HDR off); 4-mode matrix E2E; VLM check (pronounced shadows, bloom on lamps/sun, no double-tonemap look); auto-measure numbers; pixel-oracle m2/m3/m4 re-run (all HDR-off) | — |

≈ 505 lines. Sizing matches one round with QA.

---

## §7 Performance + gating + SwiftShader QA

- **Cost model**: dual-filter bloom ≈ 0.7 full-res-pass equivalents (13 taps at ¼, 1/16,
  1/64, 1/256, 1/1024 + 5×9 taps up ≈ 0.33 + 0.33); plain path adds the RT round-trip
  (scene into MSAA RT + resolve + composite ≈ +1 pass vs direct-to-canvas). Finish path
  adds only bloom + the tonemap ALU inside the existing composite. Estimated **+3–7 ms @
  1080p-equivalent under SwiftShader** (calibrate: finish's own SSAO+blur+composite fits
  inside the same 11 ms budget with the scene render).
- **Gate** — reuse the finish auto-measure pattern verbatim (`measureFinish` is
  parametric): `drawPlain` = full frame with hdr off, `drawFinished` = full frame with hdr
  on (both with the *actual* current finish state), `costWithinBudget` against
  `C.HDR_BUDGET_MS = 11` (same `REFERENCE_PIXELS` 1080p scaling). First check frame 30,
  retries 300×2 — then **auto-revert `light.hdr.on = false`** (schema write, per-scene) +
  popover hint "HDR disabled on this device (frame budget)". Manual re-enable allowed but
  re-measures (same "manual" source discipline as finish).
- **SwiftShader QA path**: the pixel-oracle/`bb.py` backbuffer capture is unaffected
  (canvas is LDR8 after the composite; `readPixels` UNSIGNED_BYTE). Add one oracle case
  `m6_hdr` (golden scene + `?hdr=1` + night-lamp object) with VLM assertions: sunlit
  gradient visible (no flat white), lamp bloom halo, shadow-side darkening vs the HDR-off
  capture. HalfFloat RT support is already probed by `finishCapable` (reused).
- **Memory** (only while HDR on): rtHdr = same recipe as finish's rtScene — @1080p HF16
  RGBA ≈ 16.6 MB resolved + ≈ 66 MB MSAA-4× color + ≈ 8.3 MB D32 ≈ **~91 MB**, plus bloom
  mips ½+¼+⅛+1/16+1/32 ≈ **5.5 MB**. Identical order to what the finish composer already
  allocates on capable GPUs.

---

## §8 Risks + mitigations

| Risk | Analysis | Mitigation |
|---|---|---|
| **Byte-exactness regression (HDR off)** | All changes are `#ifdef`/uniform-value/env-multiplier gated | Classic gate 4/4 pixel-identical is the ship criterion; the `#ifdef`-absent GLSL is character-identical; env multipliers are inside `if (light.hdr?.on)` with the cache key extended so no float ever differs |
| **sRGB double-conversion / double-tonemap trap** | The classic bug: material-level tonemap (renderer.toneMapping) + composite tonemap, or two sRGB encodes | `renderer.toneMapping` is **never set** (r155+ makes it a non-issue for RT paths anyway, §2.1); exactly one encode, in the final composite; QA: no "washed-out gray blacks" on the m6 oracle case |
| **MSAA resolve ordering** | Bloom reads `rtScene.texture` while the MSAA RT is still bound | Resolve happens on `setRenderTarget` switch (existing three behavior the finish composite already depends on); hook always runs after the first bloom-mip target bind |
| **PMREM/IBL mismatch** | IBL stays physical-scale while the sun boosts 1.8–2.6× | Intended (§4.6): shadow side = sky light, lit side boosted — that *is* the contrast; document; future knob `envMapIntensity` if QA disagrees |
| **SSAO/occlusion interplay** | Bloom added after occlusion tint could re-brighten creases | Physically correct (lens scatter post-occlusion); optional QA-gated occlusion scale-up `×(1+0.4·shadowBoost)` (§4.5) deepens creases to compensate |
| **finish.repaint stale bloom texture** | Realloc between full renders | Hook cache keyed on source-texture identity + params (§3.2); repaint re-binds through the hook (§3.4.3) |
| **Overlay depth contract** | Planning aids depth-test the default framebuffer | Both HDR composites write `gl_FragDepth` (finish recipe); navball `copyFramebufferToTexture` runs after the composite — unaffected |
| **Sky brightness scale (realistic, mode 2)** | Linear ×10/wp vs today's saturating exp curve — twilight skies differ subtly | Same pre-exponential scale keeps day-sky parity; twilight delta accepted (it's a new look mode); QA screenshot set at el −4/−16 |
| **Classic sky lift mis-tune** | lift too high → sky blooms everywhere; too low → gray sky | 1.10 computed for zenith parity (§4.6); bloomThreshold default 1.25 keeps the 1.10-lifted sky (<1.15) below the knee; QA matrix over stops |
| **Clouds round collision (schema v13)** | Both R13 docs propose v13 | §5.1: first-landed takes v13; disjoint keys make the migrations order-independent |
| **SwiftShader over budget** | +3–7 ms estimate has error bars | §7 auto-measure gate auto-reverts; fallback design (simple ¼-res Gaussian, §2.2) documented if dual filter measures over |

---

## §9 Alternatives considered (and rejected)

1. **Adopt `EffectComposer` + `UnrealBloomPass` + `OutputPass` wholesale** — MIT and proven,
   but: ~2.0 full-res passes (over budget on SwiftShader), the composer's final quad is
   `depthTest:false` (breaks the planning-aids depth contract), pulls the whole
   `examples/jsm` postprocessing dependency into the offline bundle, and its additive-blend
   back onto the input would double-buffer a path that today is single-pass. We keep its
   *threshold semantics* (soft knee on HDR luma, pre-tonemap) [V].
2. **`renderer.toneMapping = ACESFilmic/AgX` + render direct-to-canvas** — only affects the
   plain path (RTs ignore it, §2.1), can't bloom (no HDR buffer), and both curves lie about
   surface colors (§2.3). Dead end for a reference tool.
3. **HDR only in the finish composer** — leaves the default-quality path (finish off) with
   the flat-clip look; the requirement is a mode, not a finish upgrade.
4. **Shadow-side shader patch (multiply shadowed diffuse)** — a second
   `lights_physical_pars_fragment` patch (we already carry SOFT_TERMINATOR) adds
   program-variant risk across every lit material for an effect the fill-ratio already
   delivers (§4.5). Revisit only if QA wants per-material shadow tinting.
5. **Exposure-only "fake HDR"** (no light changes, just a curve) — keeps the 1.2:1 ratio
   (§1); the ratio is the problem, the curve is only the enabler.

---

## §10 Citations

Verified this session (**[V]**) unless noted:

1. three.js r182 vendored build (authoritative for our port):
   `editor/js/vendor/three.module.js`, `three.core.js` — RT tone-mapping/output-space
   gating (WebGLPrograms ~L7343–7379, L17795), `tonemapping_pars_fragment` (ACES/AgX/Neutral
   GLSL, ~L496), PCF Vogel-disk `shadowRadius` (shadowmap_pars_fragment), `useLegacyLights`
   absent. Mirror: <https://github.com/mrdoob/three.js/tree/r182> [V: raw files]
2. three.js Migration Guide r154→155 (tone mapping screen-only; OutputPass):
   <https://github.com/mrdoob/three.js/wiki/Migration-Guide#154--155> [V]
3. three.js forum, "Updates to lighting in three.js r155" (physical lights, π rescale,
   candela, removal r165): <https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733> [V]
4. KHR_lights_punctual spec (intensity semantics, no upper bound):
   <https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md> [V]
5. three r182 `UnrealBloomPass` (chain, kernels post-PR#31528, HalfFloat mips, "tone mapping
   must be enabled" note) + `EffectComposer` (HalfFloat default RT) + `OutputPass` +
   `LuminosityHighPassShader`:
   <https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/postprocessing/UnrealBloomPass.js> [V]
   <https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/postprocessing/OutputPass.js> [V]
   <https://raw.githubusercontent.com/mrdoob/three.js/r182/examples/jsm/shaders/LuminosityHighPassShader.js> [V]
6. three.js r182 LICENSE (MIT): <https://raw.githubusercontent.com/mrdoob/three.js/r182/LICENSE> [V]
7. Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare", SIGGRAPH
   2014 (dual-filter progressive up/downsample): talk index + slides link [V]:
   <https://advances.realtimerendering.com/s2014/> →
   `sledgehammer/Next-Generation-Post-Processing-in-Call-of-Duty-Advanced-Warfare-v17.pptx` (437 MB, not fetched [UV])
8. Fabrice Piquet, "Custom bloom in UE4" (full dual-filter kernel transcription + progressive
   mip graph + threshold-in-downsample; the implementation pmndrs cites):
   <https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/> [V]
9. pmndrs/postprocessing `BloomEffect` / `MipmapBlurPass` (mipmap-bloom alternative; zlib
   license): <https://github.com/pmndrs/postprocessing> [V: sources + LICENSE.md]
10. KhronosGroup/ToneMapping — PBR Neutral (design goal quote + reference GLSL matching
    three's `NeutralToneMapping`): <https://github.com/KhronosGroup/ToneMapping> [V]
11. LearnOpenGL, "Bloom" (threshold→blur→add background): <https://learnopengl.com/Advanced-Lighting/Bloom> [V]
12. Godot docs, Environment & post-processing (glow/HDR exposure pipeline reference):
    <https://docs.godotengine.org/en/stable/tutorials/3d/environment_and_post_processing.html> [V]
13. Local: `docs/FIDELITY.md` (round-2 exactness constraint; round-10 sky/finish E2E),
    `analysis/FINISH_RENDERER.md`, `analysis/R13_CLOUDS_RESEARCH.md` (schema v13
    coordination), `analysis/ENVIRONMENT.md`, `editor/js/{finish,main,env,sky,const,ui,schema,stroke,navball}.js`.
```
