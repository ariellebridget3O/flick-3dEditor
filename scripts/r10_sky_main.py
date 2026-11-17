#!/usr/bin/env python3
# r10 step 5: main.js wiring — setSkyStyle + per-frame realistic update + load/apply
P = '/home/z/my-project/flick-3dEditor/editor/js/main.js'
s = open(P).read()

def sub(old, new, n=1):
    global s
    assert s.count(old) == n, f"anchor x{s.count(old)} (want {n}): {old[:80]!r}"
    s = s.replace(old, new)

# 1. setter next to setWeather (one gesture at the UI layer, like the other light mutators)
sub("    this.setWeather = weather => { if (!C.WEATHER[weather]) return; this.light = { ...this.light, weather }; this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.(); };",
    "    this.setWeather = weather => { if (!C.WEATHER[weather]) return; this.light = { ...this.light, weather }; this.shadowFit.force(); this.env.applyDaylight(this.light); this.markAutosave?.(); };\n"
    "    // round 10 (skybox P1): sky style — classic (byte-identical flick dome) | realistic (Hillaire atmosphere)\n"
    "    this.setSkyStyle = style => {\n"
    "      const v = style === 'realistic' ? 'realistic' : 'classic';\n"
    "      this.light = { ...this.light, skyStyle: v };\n"
    "      this.env.setSkyStyle(v, this.light);\n"
    "      this.markAutosave?.();\n"
    "    };")

# 2. load: apply the persisted style AFTER the light is normalized
sub("    this.light = normalizeLight(scene.light ?? null);\n"
    "    this.page.recordAspect = scene.recordAspect ?? '16:9';",
    "    this.light = normalizeLight(scene.light ?? null);\n"
    "    this.env.setSkyStyle(this.light.skyStyle === 'realistic' ? 'realistic' : 'classic', this.light);\n"
    "    this.page.recordAspect = scene.recordAspect ?? '16:9';")

# 3. renderFrame: update the realistic sky BEFORE either render path (bakes + IBL + output mode)
sub("    const finishOn = this.finishOn();\n"
    "    if (!finishOn) this.finish.release();\n"
    "    if (finishOn) this.finish.render(this.scene, this.camera);",
    "    const finishOn = this.finishOn();\n"
    "    this.env.updateRealisticSky(this.camera, !finishOn);   // round 10: bakes + IBL + sRGB mode\n"
    "    if (!finishOn) this.finish.release();\n"
    "    if (finishOn) this.finish.render(this.scene, this.camera);")

open(P, 'w').write(s)
print('main.js patched OK')
