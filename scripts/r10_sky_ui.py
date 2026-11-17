#!/usr/bin/env python3
# r10 step 6: ui.js — Sky section in the light panel (style toggle after Weather)
P = '/home/z/my-project/flick-3dEditor/editor/js/ui.js'
s = open(P).read()

def sub(old, new, n=1):
    global s
    assert s.count(old) == n, f"anchor x{s.count(old)} (want {n}): {old[:80]!r}"
    s = s.replace(old, new)

# 1. markup: Sky section after the Weather section (before the night-lamps row)
sub("      <label class=\"lp-row\" id=\"lpAmbRow\" style=\"display:none\">Ambient<input id=\"lpAmb\" type=\"range\" min=\"0\" max=\"1\" step=\"0.05\"><span id=\"lpAmbVal\"></span></label>\n"
    "    </div>\n"
    "    <label class=\"lp-row lp-night\"><input id=\"lpNight\" type=\"checkbox\" checked> Night lamps</label>`;",
    "      <label class=\"lp-row\" id=\"lpAmbRow\" style=\"display:none\">Ambient<input id=\"lpAmb\" type=\"range\" min=\"0\" max=\"1\" step=\"0.05\"><span id=\"lpAmbVal\"></span></label>\n"
    "    </div>\n"
    "    <div class=\"lp-sec\">\n"
    "      <div class=\"lp-cat\">Sky</div>\n"
    "      <div class=\"seg sky\" id=\"lpSky\">${C.SKY_STYLES.map(t => `<button data-s=\"${t}\">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>\n"
    "      <div class=\"lp-hint\" id=\"lpSkyHint\"></div>\n"
    "    </div>\n"
    "    <label class=\"lp-row lp-night\"><input id=\"lpNight\" type=\"checkbox\" checked> Night lamps</label>`;")

# 2. render: highlight the active style + hint
sub("    $id('lpNight').checked = l.nightLights !== false;\n"
    "    // presets: elevation-only",
    "    $id('lpNight').checked = l.nightLights !== false;\n"
    "    // round 10 (skybox P1): sky style\n"
    "    el.querySelectorAll('#lpSky button').forEach(b => b.classList.toggle('on', b.dataset.s === (l.skyStyle === 'realistic' ? 'realistic' : 'classic')));\n"
    "    $id('lpSkyHint').textContent = l.skyStyle === 'realistic'\n"
    "      ? 'Physically based atmosphere (Hillaire 2020) with stars and moon at night.'\n"
    "      : 'flick daylight gradient (default).';\n"
    "    // presets: elevation-only")

# 3. wiring: same gesture pattern as weather
sub("  el.querySelectorAll('#lpWeather button').forEach(b => b.onclick = () => { commit(() => app.setWeather(b.dataset.w)); render(); });",
    "  el.querySelectorAll('#lpWeather button').forEach(b => b.onclick = () => { commit(() => app.setWeather(b.dataset.w)); render(); });\n"
    "  // round 10 (skybox P1): sky style toggle\n"
    "  el.querySelectorAll('#lpSky button').forEach(b => b.onclick = () => { commit(() => app.setSkyStyle(b.dataset.s)); render(); });")

open(P, 'w').write(s)
print('ui.js patched OK')
