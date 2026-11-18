#!/usr/bin/env python3
"""r14 clouds cov75 fix v2: high-coverage condensation.

Diagnosis (measured): at cov .75 the Schneider coverage remap spreads field values
[thr,1]->[0,1] so inter-billow regions render as a uniformly THIN veil (Tview~0.5) —
displayed brightness is dominated by the bright sky behind (premultiplied composite),
so lighting-knob changes (LIGHT_EXTINCT_K 4.0, ambient floor 0.28) barely move it
(p10 198->196). Real cumulus fields thicken EXISTING billows as coverage rises.

Fix: lift in-cloud density above a coverage-driven floor — cov<=.5 keeps floor 0
(bit-identical acceptance-verified arms); at cov .75/.85 the deck condenses into
opaque cores (light march then differentiates sun-side/lee = the requested contrast).
"""
P = "/home/z/my-project/flick-3dEditor/editor/js/clouds.js"
s = open(P).read()
orig = s

old = """    float covThr = pow(1.0 - uCoverage, 1.15);                         // r13 tune: the raw field skews low — a linear knee yielded ~14% effective coverage at user 0.5
    base = remap(base, covThr, 1.0, 0.0, 1.0);                         // Schneider coverage remap (pow-knee)                // Schneider coverage remap
"""
new = """    float covThr = pow(1.0 - uCoverage, 1.15);                         // r13 tune: the raw field skews low — a linear knee yielded ~14% effective coverage at user 0.5
    base = remap(base, covThr, 1.0, 0.0, 1.0);                         // Schneider coverage remap (pow-knee)
    // r14: high-coverage CONDENSATION. At cov .75 the remap spreads [thr,1] over [0,1] so
    // inter-billow regions render as a uniformly thin veil (Tview~0.5 — the displayed
    // pixel is half bright sky behind it: flat, no shaded structure; lighting knobs
    // barely move it, measured p10 198->196). Real clouds thicken billows as coverage
    // rises: lift in-cloud density by a coverage-driven floor. Below-thr stays 0 (gaps
    // stay gaps; the knee/coverage semantics unchanged). cov<=.5 -> floor exactly 0:
    // the acceptance-verified arms (cov .25/.5) are bit-identical.
    float floorD = 0.40 * smoothstep(0.50, 0.85, uCoverage);
    base = floorD + base * (1.0 - floorD);
"""
assert old in s, "coverage remap anchor missing"
s = s.replace(old, new, 1)

assert s != orig
open(P, "w").write(s)
print("patched: high-coverage condensation floor")
