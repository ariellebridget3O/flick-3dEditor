(async () => {
  const a = window.__app, d = document;
  await a.page.seek(4.0);
  await new Promise(r => setTimeout(r, 800));
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  a.objects.select([camIds[0]]);
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  await new Promise(r => setTimeout(r, 2700));
  const hum = Object.entries(a.objects.all()).find(([k, o]) => o.kind === 'humanoid');
  const mesh = a.objectManager.meshById.get(hum[0]);
  mesh.updateWorldMatrix(true, true);
  const B3 = a.camera.position.constructor;
  const wp = mesh.getWorldPosition(new B3());
  const pose = a.objectManager.meshById.get(camIds[0]).userData.evalPose;
  return JSON.stringify({
    humPos: wp.toArray().map(v => +v.toFixed(3)),
    evalPos: pose.position.toArray().map(v => +v.toFixed(3)),
    evalFov: +pose.fovDeg.toFixed(2),
    playhead: a.page.playheadS,
    stageView: a.page.stageView,
    camFov: +a.camera.fov.toFixed(2)
  });
})()
