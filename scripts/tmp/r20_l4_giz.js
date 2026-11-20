(() => {
  const a = window.__app;
  // find the TransformControls root (the gizmo) and hide it
  let gizmo = null;
  a.objectManager.scene.traverse(o => { if (!gizmo && o.name === 'X' && o.parent && o.parent.type === 'TransformControls') gizmo = o.parent; });
  // fallback: the transform's root via the manipulator
  if (!gizmo && a.manipulator && a.manipulator.transform) gizmo = a.manipulator.transform;
  const had = gizmo ? gizmo.visible : null;
  if (gizmo) gizmo.visible = false;
  a.renderFrame();
  const gl = a.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const px = new Uint8Array(4 * 100);
  // the hot region center in GL coords: screen y~117 of 452 → GL y = 452-117 = 335; x 367
  gl.readPixels(360, 330, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const after = [px[0], px[1], px[2]];
  if (gizmo) gizmo.visible = had;
  return JSON.stringify({ gizmoFound: !!gizmo, pixelAfterHide: after });
})()
