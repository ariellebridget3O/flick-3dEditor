(async () => {
  const a = window.__app, d = document;
  await a.page.seek(4.0);
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  a.objects.select([camIds[0]]);
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  await new Promise(r => setTimeout(r, 900));
  const cam = a._wallCam;
  if (!cam) return 'NO WALL CAM';
  const V = cam.position.constructor;
  const v = new V((367 / 805) * 2 - 1, -(117 / 452) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize();
  const origin = cam.position.clone();
  const hits = [];
  a.objectManager.scene.traverse(o => {
    if (!o.isMesh || o.visible === false) return;
    try {
      const rc = { ray: { origin, direction: v }, far: 500 };
      const out = [];
      o.raycast(rc, out);
      if (out.length) hits.push({ name: o.name || o.type, dist: +out[0].distance.toFixed(2) });
    } catch (e) { }
  });
  hits.sort((p, q) => p.dist - q.dist);
  const pose = a.objectManager.meshById.get(camIds[0]).userData.evalPose;
  return JSON.stringify({ wallPos: cam.position.toArray().map(x => +x.toFixed(2)), fov: +cam.fov.toFixed(2), posePos: pose.position.toArray().map(x => +x.toFixed(2)), hits: hits.slice(0, 5) });
})()
