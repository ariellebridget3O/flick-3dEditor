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
  const bb = new (a.camera.position.constructor)();
  const box = new (function(){});  // placeholder
  // bounding box via Box3
  const B3 = a.camera.position.constructor; // no — use THREE via a THREE-bearing object
  // simpler: sample the rig's root position + scale
  const wp = mesh.getWorldPosition(new B3());
  const sc = mesh.scale.toArray();
  const pose = a.objectManager.meshById.get(camIds[0]).userData.evalPose;
  const wall = a._wallLayout;
  return JSON.stringify({
    humPos: wp.toArray().map(v => +v.toFixed(3)), humScale: sc.map(v => +v.toFixed(3)),
    evalPos: pose.position.toArray().map(v => +v.toFixed(3)),
    evalFov: +pose.fovDeg.toFixed(2),
    wallTiles: wall ? wall.tiles.length : 0,
    playhead: a.page.playheadS
  });
})()
