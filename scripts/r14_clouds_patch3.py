#!/usr/bin/env python3
"""r14 clouds cov75 fix v3: view-march opacity (the root cause).

Root cause chain (measured across v1/v2): the VIEW march extinction is SIGMA_K=0.9/km
alone — a 1.2km deck at FULL density reaches tau~1.7 => Tview>=0.19 at cores, and the
sub-threshold inter-billow veil sits at Tview~0.5-0.85. The premultiplied composite
displays L*(1-Tview) + Tview*sky — i.e. 20-85% of every "cloud" pixel is the BRIGHT SKY
behind it. That is the flat bright veil: lighting knobs can't fix it (v1: p10 198->196)
and neither can density floors (v2: no visible change).

Fix (physics): real water clouds are optically thick (tau>>10). Give the view march its
own extinction scale like the light march already has (LIGHT_EXTINCT_K): VIEW_EXTINCT_K
=3.0. The Frostbite integral is self-limiting (Sint per step <= E*ALBEDO), so an opaque
core emits ~E — bounded, no blowout. Compensating change: the r13 diffuse-base hack
0.60 (added to push thin semi-transparent tops toward white) -> 0.45 now that opacity
delivers the energy structurally. Revert v2's condensation floor (uniform thickening
would read as a flat GRAY deck — the opposite of the contrast ask).

Emission/energy notes: sigmaS = ALBEDO*sigmaT scales with sigmaT, so the integral
accumulates to E*ALBEDO*(1-exp(-tau_total)) <= E*0.96 — bounded by in-scatter E.
"""
P = "/home/z/my-project/flick-3dEditor/editor/js/clouds.js"
s = open(P).read()
orig = s

# --- 1. new constant + #define ---
old = "const CL_ALBEDO = 0.96;          // scattering albedo (whiteness)"
new = """const CL_VIEW_EXTINCT_K = 3.0;   // r14: view-march extinction scale — the light march already had LIGHT_EXTINCT_K for sun rays; the VIEW march ran at raw SIGMA_K (0.9/km) so even a full-density 1.2km deck only reached tau~1.7 => Tview>=0.19 at cores, Tview~0.5-0.85 in the inter-billow veil — the composite displayed 20-85% BRIGHT SKY through the "cloud" = the flat bright deck the VLM flagged (lighting knobs moved it -2/255; density floors didn't move it at all). x3 => core tau~5 (Tview~0.007, truly opaque), veil tau~0.8-1.4 (reads as thin cloud, not sky). Real water clouds are tau>>10; the Frostbite integral is self-limiting (per-step <= E*ALBEDO) so cores emit ~E bounded.
const CL_ALBEDO = 0.96;          // cloud scattering albedo (whiteness)"""
assert old in s, "ALBEDO anchor missing"
s = s.replace(old, new, 1)

old = "  #define LIGHT_EXTINCT_K ${CL_LIGHT_EXTINCT_K.toFixed(2)}"
new = """  #define LIGHT_EXTINCT_K ${CL_LIGHT_EXTINCT_K.toFixed(2)}
  #define VIEW_EXTINCT_K ${CL_VIEW_EXTINCT_K.toFixed(2)}"""
assert old in s, "LIGHT_EXTINCT_K define anchor missing"
s = s.replace(old, new, 1)

# --- 2. apply in the march ---
old = "            float sigmaT = SIGMA_K * rho;"
new = "            float sigmaT = SIGMA_K * VIEW_EXTINCT_K * rho;   // r14: view extinction x3 (see CL_VIEW_EXTINCT_K)"
assert old in s, "sigmaT anchor missing"
s = s.replace(old, new, 1)

# --- 3. diffuse base 0.60 -> 0.45 (opacity now supplies the energy) ---
old = "            vec3 E = Lc * Tlight * (0.60 + 0.45 * phase2(mu)) * mix(1.0, powder, sat(mu * 0.5 + 0.5))   // r13 fix: diffuse base like the cirrus/layered tiers (phase-only was ~30x too dark); r13 acceptance: 0.55 left lit tops at 210-225, short of near-white"
new = "            vec3 E = Lc * Tlight * (0.45 + 0.45 * phase2(mu)) * mix(1.0, powder, sat(mu * 0.5 + 0.5))   // r13 fix: diffuse base like the cirrus/layered tiers (phase-only was ~30x too dark). r14: 0.60->0.45 — the r13 0.60 was compensating for the optically-thin deck (tops accumulated only ~66% of E); with VIEW_EXTINCT_K=3 cores are opaque and accumulate ~E — 0.60 would clip every sun-facing top"
assert old in s, "E anchor missing"
s = s.replace(old, new, 1)

# --- 4. revert the v2 condensation floor ---
old = """    // r14: high-coverage CONDENSATION. At cov .75 the remap spreads [thr,1] over [0,1] so
    // inter-billow regions render as a uniformly thin veil (Tview~0.5 — the displayed
    // pixel is half bright sky behind it: flat, no shaded structure; lighting knobs
    // barely move it, measured p10 198->196). Real clouds thicken billows as coverage
    // rises: lift in-cloud density by a coverage-driven floor. Below-thr stays 0 (gaps
    // stay gaps; the knee/coverage semantics unchanged). cov<=.5 -> floor exactly 0:
    // the acceptance-verified arms (cov .25/.5) are bit-identical.
    float floorD = 0.40 * smoothstep(0.50, 0.85, uCoverage);
    base = floorD + base * (1.0 - floorD);
"""
assert old in s, "condensation anchor missing"
s = s.replace(old, "", 1)

assert s != orig
open(P, "w").write(s)
print("patched v3: VIEW_EXTINCT_K=3.0, diffuse base 0.45, condensation reverted")
