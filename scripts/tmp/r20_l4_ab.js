(() => {
  const a = window.__app;
  // ensure cameras view + t=4
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  const mesh = a.objectManager.meshById.get(camIds[0]);
  const pose = mesh?.userData?.evalPose;
  // A: old-lens style — pose onto this.camera, plain render (no overlays)
  const save = { pos: a.camera.position.clone(), q: a.camera.quaternion.clone(), fov: a.camera.fov };
  a.camera.position.copy(pose.position); a.camera.quaternion.copy(pose.quaternion);
  a.camera.fov = pose.fovDeg; a.camera.updateProjectionMatrix();
  const hid = mesh.visible; mesh.visible = false;
  a.renderer.render(a.scene, a.camera);
  const gl = a.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const bufA = new Uint8Array(W * H * 4);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, bufA);
  mesh.visible = hid;
  a.camera.position.copy(save.pos); a.camera.quaternion.copy(save.q); a.camera.fov = save.fov; a.camera.updateProjectionMatrix();
  // B: wall render (renderFrame with the wall active)
  a.renderFrame();
  const bufB = new Uint8Array(W * H * 4);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, bufB);
  // diff stats + the blob region (rows 100-135 from top = GL y H-135..H-100, cols 295-395)
  let diff = 0, n = 0, blobA = 0, blobB = 0, bn = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const la = 0.299 * bufA[i] + 0.587 * bufA[i + 1] + 0.114 * bufA[i + 2];
    const lb = 0.299 * bufB[i] + 0.587 * bufB[i + 1] + 0.114 * bufB[i + 2];
    const d = Math.abs(la - lb); diff += d; n++;
    const gy = H - 1 - y;   // screen-space row
    if (gy >= 100 && gy <= 135 && x >= 295 && x <= 395) { blobA += la; blobB += lb; bn++; }
  }
  return JSON.stringify({ meanDiff: +(diff / n).toFixed(2), blobA: +(blobA / bn).toFixed(0), blobB: +(blobB / bn).toFixed(0), W, H });
})()
