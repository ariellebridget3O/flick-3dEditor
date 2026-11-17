#!/usr/bin/env python3
# r10 step 4: schema v12 — light.skyStyle ('classic' default | 'realistic')
P = '/home/z/my-project/flick-3dEditor/editor/js/schema.js'
s = open(P).read()

def sub(old, new, n=1):
    global s
    assert s.count(old) == n, f"anchor x{s.count(old)} (want {n}): {old[:80]!r}"
    s = s.replace(old, new)

# 1. current-scene fast path (v11 sessions) — normalizeScene handles the new field,
#    but bump it so saves round-trip at v12
sub("    if (t.v === 11) return normalizeScene(deepCopy(t), propCatalog);",
    "    if (t.v === 11 || t.v === 12) return normalizeScene(deepCopy(t), propCatalog);")

# 2. migration chain
sub("    if (n.v === 10) n = v10to11(n);\n"
    "    return n.v === 11 ? normalizeScene(n, propCatalog) : null;",
    "    if (n.v === 10) n = v10to11(n);\n"
    "    if (n.v === 11) n = v11to12(n);\n"
    "    return n.v === 12 ? normalizeScene(n, propCatalog) : null;")

# 3. normLight passthrough (valid values only; absent = classic default)
sub("  if (l.nightLights === false) n.nightLights = false;\n"
    "  // round 6 D — extended fields",
    "  if (l.nightLights === false) n.nightLights = false;\n"
    "  // round 10 (skybox P1): realistic sky style — absent = classic (migrated scenes unchanged)\n"
    "  if (l.skyStyle === 'realistic') n.skyStyle = 'realistic';\n"
    "  // round 6 D — extended fields")

# 4. v11to12 after v10to11
sub("// ---- save: strip undefined + pack items (lje sequential bumping) ----",
    "// round 10 (skybox P1): v11→v12 — light may carry skyStyle (normalizeLight defaults 'classic').\n"
    "function v11to12(n) {\n"
    "  return { ...n, v: 12 };\n"
    "}\n\n"
    "// ---- save: strip undefined + pack items (lje sequential bumping) ----")

open(P, 'w').write(s)
print('schema.js patched OK')

# const.js: SCHEMA_V 11 -> 12
P2 = '/home/z/my-project/flick-3dEditor/editor/js/const.js'
s2 = open(P2).read()
old = "  SCHEMA_V: 11,              // NU — round 6: light geo/weather/indoor/ambient + mode (v10→v11)"
new = "  SCHEMA_V: 12,              // round 10: light.skyStyle (classic|realistic); v11→v12"
assert s2.count(old) == 1
open(P2, 'w').write(s2.replace(old, new))
print('const.js SCHEMA_V -> 12')
