// ============================================================================
// fn: z_drawPreview   (bundle minified: function z(){const pe=t.drawPreview.peek())
// char range: 5759598..5759834   (byte range: 5767867..5768103)
// purpose: drawPreview ghost tick: pose mesh to preview pose (stroke preview mirrors into 3D)
// params: -> void
// closure/global deps (auto-derived, approximate): ce, t, z, e, Hie, F, B, H, o$, kje
// ============================================================================
function z(){const pe=t.drawPreview.peek(),ce=pe?e.meshById.get(pe.id):void 0;!pe||!ce||(Hie(ce,F.set(...pe.position),B.setFromEuler(H.set(...pe.rotation))),pe.look&&t.objects.peek()[pe.id]?.kind==="simple_figure"&&o$(ce,kje(pe.look)))}
