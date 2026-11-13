# Porting notes (kb)

Detailed gotchas beyond SKILL.md top-level items.

## Bundle → port specifics
- `ZA` heightCurve eval: segment search `while (r < len-2 && n > curve[r+1].u) r++`, control u's CLAMPED to the segment (`c1u=min(s.u+s.out[0], a.u)`, `c2u=max(a.u+a.in[0], s.u)`), 30-iteration binary search on the 1D bezier for the time fraction, then height bezier at that u, clamped ≥0.
- `khe` pace: input is `speed·elapsed/arc` (normalized expected-time progress) × (pace.length−1) as the pace-array index; distance = lerp(pace)·arc; `held` (consecutive equal pace values) → clip switches to idle@0.
- cam-move orientation correction: `qStart⁻¹ · qPrev` slerped to IDENTITY by smoothstep(p), applied as `qEnd · correction`. Port exactly — this is what makes preset moves not snap.
- `dZt` camera eval iterates items and RE-APPLIES earlier items clamped (elapsed = min(t−start, dur)); breaks at the containing item.
- `o2r` framing: `e = Mtt(record)/Mtt(viewport)`, `n = XCe(record)/XCe(viewport)` where Mtt(a)=35·min(a,1), XCe(a)=35/max(a,1); `r = max(1, e, n/maxHeightFraction)`; camera-mode fov = `2·atan(r·XCe(viewportAspect)/2/focal)`.
- `eEe` play-item chaining: `off = prevEnd − samples[0].p` (relative recordings stacked after previous motion item).
- Ground snap `zzt(y,g,0.5)` = `g−y > 0.5 ? y : g` (clamp step-UP only; falls free).
- simple_figure visor SphereGeometry args: `(Nie+.002, 32, 4, 3π/2−Pie, 2·Pie, π/2−f, f−h)` with h/f = −6°/+14° (elevation range), phi centred on −Z (φ=3π/2). Band is on the BODY (not head): PlaneGeometry(W, c−l) rotY(π) at y=(l+c)/2, z=−(D/2+.002).
- `aqt` contrast: luma > .72 → DARK #1c0f09, else white (inverted vs naive assumption; orange → white mark).
- Shadow casters for the FIT box: humanoid + simple_figure ONLY (props/primitives excluded) — but every Mesh gets castShadow=receiveShadow=!MeshBasicMaterial.
- Night glow consumer: meshes with `userData.glows` get `emissive.setHex(0xFFC98A); emissiveIntensity = glow` (glow from applyDaylight, 0 when nightLights===false). Detector `eKt`: kind in a set + name regexes (window/lamp/lantern/candle/moon-ish).

## Browser/eval patterns
- Multi-statement evals with `const` redeclare across calls fail — wrap in IIFE `(()=>{...})()`; statements separated by `;` on one line.
- `new THREE.*` is not reachable from eval (module scope) — use `window.__app` hooks or dynamic `import('./js/x.js')` from the page origin.
- Screenshots: verify non-blank via PIL unique-color sampling before spending a VLM call.

## Asset library quirks
- humanoid GLB: 55 nodes, Rig root has 180° baked (facing −Z = app forward; main stage adds NO yaw), M_Joints visual spheres stay purple, idle@t=0 default pose height 1.7829m raw.
- camera GLB = assets/camera-DV-hMEYk.glb, spotlight = assets/spotlight-Cs6bAwrT.glb (both fetched from flick.art CDN while it was reachable; vendored).
- prop catalog scale: `Uh[key].scale ?? 1` (984/1439 have none); yawDeg on a wrapper group, never baked into scene rotation.
