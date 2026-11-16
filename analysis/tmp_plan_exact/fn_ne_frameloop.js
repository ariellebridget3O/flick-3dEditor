// ============================================================================
// fn: ne_frameloop   (bundle minified: function ne(){if(e.isDisposed())
// char range: 5761567..5762032   (byte range: 5769836..5770301)
// purpose: RUNTIME FRAME LOOP: rig/handles/playback/preview/bounds/spotlights/record ticks all run; if planShown||!pageLive -> only scene.updateMatrixWorld() — the WebGL render pauses on the plan view
// params: -> void
// closure/global deps (auto-derived, approximate): e, O, n, C, Uit, U, t, ne, V, G, Z, a, o, $, z, A, T, N, w, l, d, u, I, se, W, j, E, re, h, e3, Q
// ============================================================================
function ne(){if(e.isDisposed()||V||G)return;const pe=Z.getDelta();a.tick(pe),o.tick(),$.tick(pe),z(),A.tick(pe),T.tick(pe),C()&&Uit(e.camera,n.orbit),n.tick(),C()&&Uit(e.camera,n.orbit),N.tick(pe),w.tick(),l.tick(),d.tick(),u(e.renderer),I.tick(),O.tickPreview(pe),se(),U.tick(pe),O.tickShake(pe),W.tick(pe),j.tick(),t.planShown.peek()||!t.pageLive.peek()?e.scene.updateMatrixWorld():(E.tick(),re(),h.add(pe*1e3),Q(),U.render()),O.restoreShake(),O.tickCapture(pe)}
