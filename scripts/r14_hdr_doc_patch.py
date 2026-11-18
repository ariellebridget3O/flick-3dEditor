#!/usr/bin/env python3
"""r14: reconcile R13_HDR_RESEARCH.md with the SHIPPED implementation.

The research doc specs Neutral + CoD-AW; the ship is ACES + UnrealBloomPass-recipe
(ratified r13 with E2E, deviations noted only in commit messages). This adds a single
clearly-delimited SHIPPED-DEVIATIONS block right after the doc header so the doc and
the code can no longer disagree, and marks the two pick-sections with pointers.
"""
P = "/home/z/my-project/flick-3dEditor/analysis/R13_HDR_RESEARCH.md"
s = open(P).read()
orig = s

anchor = "## §0 TL;DR recommendation"
block = """## §0.5 SHIPPED DEVIATIONS from this design (r13 implementation — RATIFIED, E2E'd)

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

"""
assert anchor in s
s = s.replace(anchor, block + anchor, 1)

# pointers at the two pick sections
o1 = "| **CoD: Advanced Warfare dual filter**"
i1 = s.find(o1)
assert i1 > 0
s = s[:i1] + "*(SHIPPED: the UnrealBloomPass recipe was picked instead — see §0.5.)*\n" + s[i1:]

o2 = "| **`NeutralToneMapping`** ✅"
i2 = s.find(o2)
assert i2 > 0
s = s[:i2] + "*(SHIPPED: ACESFilmic was picked instead — see §0.5.)*\n" + s[i2:]

assert s != orig
open(P, "w").write(s)
print("reconciled: §0.5 deviations block + two pick-section pointers")
