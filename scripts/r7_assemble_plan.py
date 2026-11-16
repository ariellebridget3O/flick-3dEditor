#!/usr/bin/env python3
"""R7-1: assemble the exact-port plan.js from parts + apply fixups."""
import re

P = '/home/z/my-project/scripts/parts'
out = []
for f in ['plan_part_a.js', 'plan_part_b.js', 'plan_part_c.js', 'plan_part_d.js']:
    out.append(open(f'{P}/{f}').read())
src = '\n'.join(out)

# fix 1: import camTransformKeysAt (cZt) + transformKeysAt from tracks.js
src = src.replace(
    "import { polylineOf, buildTangents, arcLength } from './curves.js';   // nx / mT / MR (round-2 exact)",
    "import { polylineOf, buildTangents, arcLength } from './curves.js';   // nx / mT / MR (round-2 exact)\nimport { camTransformKeysAt } from './tracks.js';                      // cZt (round-2 exact)")
# fix 2: store paths() uses the imported cZt
src = src.replace('const o = l => hL(cZt(a.keys, l).position);', 'const o = l => hL(camTransformKeysAt(a.keys, l).position);')

# fix 3: PlanCanvas host + bar placement + focus tip element
src = src.replace(
    "  constructor(app, host, store) {\n    this.app = app; this.store = store;",
    "  constructor(app, host, store) {\n    this.app = app; this.store = store; this.host = host;")
src = src.replace(
    "    this.app.host?.querySelector?.('.stage-header')?.appendChild(bar) || document.querySelector('.workspace')?.prepend(bar);\n    this._bar = bar;",
    "    this.host.appendChild(bar);\n    this._bar = bar;")
src = src.replace(
    "    this._camChip = bar.querySelector('#pbCamChip');\n    this._tip = bar.querySelector('#pbCamChip');   // reuse chip as tooltip host? no — separate:\n    this._tip = null;",
    "    this._camChip = bar.querySelector('#pbCamChip');\n    // focus tip (uit.focusTip): its own element on the canvas host, like the live\n    this._tip = document.createElement('div');\n    this._tip.className = 'pb-focus-tip';\n    this._tip.hidden = true;\n    this._tip.textContent = 'Focus on this?';\n    this.host.appendChild(this._tip);")
# fix 4: bar default display none until shown (visibility synced by _syncShown)
src = src.replace("bar.className = 'plan-bar2';", "bar.className = 'plan-bar2';\n    bar.style.display = 'none';")

open('/home/z/my-project/flick-3dEditor/editor/js/plan.js', 'w').write(src)
print(f"assembled plan.js: {len(src)} chars, {src.count(chr(10))} lines")
