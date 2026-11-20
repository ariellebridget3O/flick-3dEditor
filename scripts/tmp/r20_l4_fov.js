(async () => {
  const a = window.__app, d = document;
  await a.page.seek(4.0);
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  a.objects.select([camIds[0]]);
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  await new Promise(r => setTimeout(r, 900));
  const cam = a._wallCam;
  const readHot = () => {
    const gl = a.renderer.getContext();
    const px = new Uint8Array(4 * 100);
    gl.readPixels(360, 330, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return [px[0], px[1], px[2]];
  };
  a.renderFrame();
  const hotAtPoseFov = readHot();
  // the guide formula (updateFrameGuide): compute the cameras-view guide fov
  const host = d.getElementById('viewport');
  const w = host.clientWidth, h = host.clientHeight;
  const viewportAspect = w / Math.max(1, h);
  const C = await import('/editor/js/const.js').then(m => m.C);
  const [rw, rh] = C.ASPECTS[a.page.recordAspect] ?? C.ASPECTS['16:9'];
  const recordAspect = rw / rh;
  const Mtt = x => C.SENSOR_W * Math.min(x, 1);
  const XCe = x => C.SENSOR_W / Math.max(x, 1);
  const maxHeightFraction = Math.max(0, (h - 2 * C.FRAME_CHROME_PX) / h) || 1;
  const e = Mtt(recordAspect) / Mtt(viewportAspect);
  const n = XCe(recordAspect) / XCe(viewportAspect);
  const r = Math.max(1, e, n / maxHeightFraction);
  const focal = a.focalLengthMm;
  const guideFov = 2 * Math.atan(r * XCe(viewportAspect) / 2 / focal) * 180 / Math.PI;
  // apply the guide fov to the wall cam + re-render
  cam.fov = guideFov; cam.updateProjectionMatrix();
  a.renderFrame();
  const hotAtGuideFov = readHot();
  return JSON.stringify({ poseFov: 31.42, guideFov: +guideFov.toFixed(3), hotAtPoseFov, hotAtGuideFov, viewport: [w, h] });
})()
