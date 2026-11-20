(() => {
  const a = window.__app, d = document;
  a.page.seek(4.0);
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  return new Promise(r => setTimeout(() => {
    const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
    const mesh = a.objectManager.meshById.get(camIds[0]);
    const pose = mesh?.userData?.evalPose;
    const wall = a._wallLayout;
    // read the backbuffer top region after a forced render
    a.renderFrame();
    const gl = a.renderer.getContext();
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const px = new Uint8Array(4 * 100);
    gl.readPixels(Math.floor(W * 0.45), Math.floor(H * 0.75), 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);  // top-center (GL y up)
    const top = [px[0], px[1], px[2]];
    gl.readPixels(Math.floor(W * 0.45), Math.floor(H * 0.1), 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);   // bottom-center
    const bot = [px[0], px[1], px[2]];
    r(JSON.stringify({
      pose: pose ? { pos: pose.position.toArray().map(v => +v.toFixed(1)), fov: +pose.fovDeg.toFixed(1) } : null,
      wallTiles: wall ? wall.tiles.length : 0,
      editorCam: { near: +a.camera.near.toFixed(2), far: Math.round(a.camera.far), aspect: +a.camera.aspect.toFixed(3) },
      wallCam: a._wallCam ? { near: +a._wallCam.near.toFixed(2), far: Math.round(a._wallCam.far), aspect: +a._wallCam.aspect.toFixed(3), fov: +a._wallCam.fov.toFixed(1) } : null,
      topPixel: top, bottomPixel: bot, bufSize: [W, H]
    }));
  }, 800));
})()
