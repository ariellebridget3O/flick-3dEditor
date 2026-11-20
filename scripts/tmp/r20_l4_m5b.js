(() => {
  const a = window.__app;
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  const mesh = a.objectManager.meshById.get(camIds[0]);
  const pose = mesh?.userData?.evalPose;
  // OLD LENS WAY: pose onto THIS.camera, render, read top
  const save = { pos: a.camera.position.clone(), q: a.camera.quaternion.clone(), fov: a.camera.fov };
  a.camera.position.copy(pose.position); a.camera.quaternion.copy(pose.quaternion);
  a.camera.fov = pose.fovDeg; a.camera.updateProjectionMatrix();
  a.renderer.render(a.scene, a.camera);
  const gl = a.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const px = new Uint8Array(4 * 100);
  gl.readPixels(Math.floor(W * 0.45), Math.floor(H * 0.75), 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const oldTop = [px[0], px[1], px[2]];
  // WALL CAM WAY
  a.camera.position.copy(save.pos); a.camera.quaternion.copy(save.q); a.camera.fov = save.fov; a.camera.updateProjectionMatrix();
  a.renderFrame();
  gl.readPixels(Math.floor(W * 0.45), Math.floor(H * 0.75), 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const wallTop = [px[0], px[1], px[2]];
  return JSON.stringify({ oldLensTop: oldTop, wallTop, editorAspect: +a.camera.aspect.toFixed(3), wallAspect: +a._wallCam.aspect.toFixed(3) });
})()
