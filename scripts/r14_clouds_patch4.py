#!/usr/bin/env python3
"""r14 clouds v4: density-occluded ambient.

v3 made the deck opaque (cloud-frac 39.6->76.0%) but the interior reads a FLAT ~217:
the ambient term msAmb*5*(0.28+0.72*hn) enters EVERY step unattenuated, so an opaque
deck's interior radiates uniform gray regardless of the light march (measured interior
L_lin ~0.126 ~= msAmb*5*0.64 — the ambient IS the flat deck).

Fix: real cloud interiors attenuate sky light too — occlude the ambient by the LOCAL
density (a 1-term Nubis-style approximation of the ambient march): E_amb *= exp(-K*rho).
Dense cores (rho~0.5) -> x0.33-0.45 (interior -> ~160-170 display = the VLM's shaded-
lobe target); thin veil (rho~0.15) -> x0.85 (the soft veil reading survives); lit tops
(direct term) untouched. This creates density-CORRELATED structure — the billow
variation ask — rather than a uniform dim.
"""
P = "/home/z/my-project/flick-3dEditor/editor/js/clouds.js"
s = open(P).read()
orig = s

old = "const CL_VIEW_EXTINCT_K = 3.0;"
new = """const CL_AMB_OCCLUDE_K = 1.1;    // r14: ambient occlusion by local density (per-unit-rho exponent) — the un-occluded msAmb*5 term painted opaque interiors a uniform ~217 gray (the flat deck); real interiors attenuate sky light by the mass around them. rho~0.5 core -> x0.58, thin veil rho~0.15 -> x0.85.
const CL_VIEW_EXTINCT_K = 3.0;"""
assert old in s, "VIEW_EXTINCT_K anchor missing"
s = s.replace(old, new, 1)

old = "  #define VIEW_EXTINCT_K ${CL_VIEW_EXTINCT_K.toFixed(2)}"
new = """  #define VIEW_EXTINCT_K ${CL_VIEW_EXTINCT_K.toFixed(2)}
  #define AMB_OCCLUDE_K ${CL_AMB_OCCLUDE_K.toFixed(2)}"""
assert old in s, "VIEW define anchor missing"
s = s.replace(old, new, 1)

old = "                   + msAmb * 5.0 * (0.28 + 0.72 * hn);   // r13 fix: MS-LUT values are transfer factors (~0.02) — a deck underside reads ~30/255 without the boost. r14 tune: floor 0.35->0.28 darkens cloud BASES/interior (the cov75 flat-bright shaded lobes) ~-20% linear at hn=0 while hn=1 (lit-top ambient) is preserved (0.28+0.72=1.0)"
new = "                   + msAmb * 5.0 * (0.28 + 0.72 * hn) * exp(-AMB_OCCLUDE_K * rho);   // r13 fix: MS-LUT values are transfer factors (~0.02) — a deck underside reads ~30/255 without the boost. r14: occlude by LOCAL density — v3 proved the un-occluded term IS the flat interior (measured L_lin 0.126 = msAmb*5*0.64 exactly); rho~0.5 cores -> ~160-170 display (the VLM shaded-lobe target), thin veil barely darkened"
assert old in s, "ambient anchor missing"
s = s.replace(old, new, 1)

assert s != orig
open(P, "w").write(s)
print("patched v4: ambient occlusion AMB_OCCLUDE_K=1.1")
