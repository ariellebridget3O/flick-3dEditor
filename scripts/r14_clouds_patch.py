#!/usr/bin/env python3
"""r14 clouds nits patch:
1. cov75 internal contrast — CL_LIGHT_EXTINCT_K 3.0->4.0 (deeper sun-side/lee-side shading)
   + ambient floor (0.35+0.65*hn)->(0.28+0.72*hn) (darker BASES, hn=1 top ambient preserved).
2. layered zenith clip — order-preserving display-space shoulder (knee 0.70 / span 0.15
   pre-OETF, asymptote 0.85 = 237 display) applied to the layered tier only, on the
   demo-curve path (uToneMap && uCurve — skipped for linear HDR out + PMREM).
All changes are clouds-ON-only: the off path is byte-identical by construction.
"""
import re

P = "/home/z/my-project/flick-3dEditor/editor/js/clouds.js"
s = open(P).read()
orig = s

# --- 1a. LIGHT_EXTINCT_K 3.0 -> 4.0 ---
old = "const CL_LIGHT_EXTINCT_K = 3.0;  // r13 tune: EXTRA extinction for the sun march"
new = "const CL_LIGHT_EXTINCT_K = 4.0;  // r14 tune: 3.0 left cov75 shaded lobes at ~198 display (flat bright deck, contrast p95-p10=35); x4 deepens lee-side/interior shading (extra tau ~0.43 on partial-mass paths => Tlight x0.65) while lit tops (nothing sunward, Tlight~1) are unchanged"
assert old in s, "LIGHT_EXTINCT_K anchor missing"
s = s.replace(old, new, 1)

# --- 1b. ambient floor 0.35+0.65*hn -> 0.28+0.72*hn (base darker, top preserved) ---
old = "msAmb * 5.0 * (0.35 + 0.65 * hn);   // r13 fix: MS-LUT values are transfer factors (~0.02) — a deck underside reads ~30/255 without the boost"
new = "msAmb * 5.0 * (0.28 + 0.72 * hn);   // r13 fix: MS-LUT values are transfer factors (~0.02) — a deck underside reads ~30/255 without the boost. r14 tune: floor 0.35->0.28 darkens cloud BASES/interior (the cov75 flat-bright shaded lobes) ~-20% linear at hn=0 while hn=1 (lit-top ambient) is preserved (0.28+0.72=1.0)"
assert old in s, "ambient floor anchor missing"
s = s.replace(old, new, 1)

# --- 2. layered tier flag ---
old = """    vec3 L = vec3(0.0);
    float Tview = 1.0;
    float densSum = 0.0;
    float distMean = 0.0;
"""
new = """    vec3 L = vec3(0.0);
    float Tview = 1.0;
    float densSum = 0.0;
    float distMean = 0.0;
    float layeredTier = 0.0;             // r14: set by the sheet fallback — gates the display-space cap
"""
assert old in s, "main declarations anchor missing"
s = s.replace(old, new, 1)

old = "      // ---- layered fallback: parallax alpha sheets (atlas rows), Lambert + HG-style glint ----\n"
new = "      // ---- layered fallback: parallax alpha sheets (atlas rows), Lambert + HG-style glint ----\n      layeredTier = 1.0;\n"
assert old in s, "layered branch anchor missing"
s = s.replace(old, new, 1)

# --- 2b. the shoulder, right after the demo tone curve, BEFORE the fog band (fog 0.83
#         pre-OETF = 235 display stays ABOVE the 237 asymptote => no horizon seam) ---
old = """    if (uToneMap > 0.5 && uCurve > 0.5) L = vec3(1.0) - exp(-max(L, vec3(0.0)) / uWhitePoint * uExposure);
    // horizon fog band"""
new = """    if (uToneMap > 0.5 && uCurve > 0.5) L = vec3(1.0) - exp(-max(L, vec3(0.0)) / uWhitePoint * uExposure);
    // r14: layered-tier display-space shoulder. The 6-sheet zenith stack accumulates
    // tone-curved radiance to 0.90-0.96 pre-OETF (245-253 display; >50% of a zenith-view
    // deck clipped). Per-sheet dimming CANNOT fix it — the exposure-10 curve saturates
    // (any linear sum >=0.35 curves to >=0.96; proven r13: the 0.68 dim gave identical
    // display). Soft order-preserving shoulder in tone-curved space instead: identity
    // below the 0.70 knee, asymptote 0.85 (237 display — just above the 235 fog band,
    // below the procedural tier's lit cores). Linear-HDR out (uCurve=0) and PMREM
    // (uToneMap=0) are exempt: ACES handles those (clouds_hdr_check.py verified).
    if (layeredTier > 0.5 && uToneMap > 0.5 && uCurve > 0.5) {
      vec3 over = max(L - vec3(0.70), vec3(0.0));
      L = min(L, vec3(0.70)) + vec3(0.15) * over / (over + vec3(0.15));
    }
    // horizon fog band"""
assert old in s, "tone-curve anchor missing"
s = s.replace(old, new, 1)

assert s != orig
open(P, "w").write(s)
print("patched clouds.js: LIGHT_EXTINCT_K=4.0, ambient floor 0.28/0.72, layered shoulder")
