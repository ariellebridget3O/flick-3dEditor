(() => {
  const a = window.__app;
  const d = document;
  if (!a) return 'NO APP';
  d.querySelector('#viewSwitch button[data-v=cameras]')?.click();
  return new Promise(r => setTimeout(() => {
    const cam = a._wallCam;
    if (!cam) { r('NO WALL CAM'); return; }
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
    r(JSON.stringify({ wallPos: cam.position.toArray().map(x => +x.toFixed(1)), fov: +cam.fov.toFixed(2), hits: hits.slice(0, 5) }));
  }, 600));
})()
