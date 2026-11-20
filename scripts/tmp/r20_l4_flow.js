(async () => {
  const a = window.__app, d = document;
  await a.page.seek(4.0);
  await new Promise(r => setTimeout(r, 800));
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  a.objects.select([camIds[0]]);
  const b = d.querySelector('#viewSwitch button[data-v=cameras]');
  b.click();
  await new Promise(r => setTimeout(r, 1500));
  await new Promise(r => setTimeout(r, 1200));
  // now A/B exactly as the capture moment
  const readBuf = () => {
    const gl = a.renderer.getContext();
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const buf = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return { buf, W, H };
  };
  const mesh = a.objectManager.meshById.get(camIds[0]);
  const pose = mesh.userData.evalPose;
  // A: OLD LENS
  d.querySelector('#viewSwitch button[data-v=editor]').click();
  await new Promise(r => setTimeout(r, 300));
  const save = { pos: a.camera.position.clone(), q: a.camera.quaternion.clone(), fov: a.camera.fov };
  a.camera.position.copy(pose.position); a.camera.quaternion.copy(pose.quaternion);
  a.camera.fov = pose.fovDeg; a.camera.updateProjectionMatrix();
  mesh.visible = false;
  a.renderFrame();
  const A = readBuf();
  mesh.visible = true;
  a.camera.position.copy(save.pos); a.camera.quaternion.copy(save.q); a.camera.fov = save.fov; a.camera.updateProjectionMatrix();
  // B: WALL
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  await new Promise(r => setTimeout(r, 700));
  a.renderFrame();
  const B = readBuf();
  let diff = 0, n = 0, big = 0, hot = 0, hn = 0;
  const { W, H } = A;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const la = 0.299 * A.buf[i] + 0.587 * A.buf[i+1] + 0.114 * A.buf[i+2];
    const lb = 0.299 * B.buf[i] + 0.587 * B.buf[i+1] + 0.114 * B.buf[i+2];
    const dd = Math.abs(la - lb); diff += dd; n++;
    if (dd > 8) big++;
    if (y >= H - 168 && y <= H - 56 && x >= 300 && x <= 500) { hot += dd; hn++; }
  }
  return JSON.stringify({ meanDiff: +(diff / n).toFixed(3), pctGt8: +(100 * big / n).toFixed(2), hotRegion: +(hot / hn).toFixed(1), sel: a.objects.selectedId === camIds[0] });
})()
