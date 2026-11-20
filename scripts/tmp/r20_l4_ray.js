(() => {
  const a = window.__app;
  const cam = a._wallCam;
  if (!cam) return 'NO WALL CAM';
  // NDC of the hot pixel (screen 367,117 of 805x452)
  const ndc = { x: (367 / 805) * 2 - 1, y: -(117 / 452) * 2 + 1 };
  const ray = new a.camera.position.constructor();
  // build the ray via the camera's projection inverse
  const V = a.camera.position.constructor;
  const v = new V(ndc.x, ndc.y, 0.5).unproject(cam).sub(cam.position).normalize();
  const raycaster = new (a.manipulator.transform.ray ? a.manipulator.transform.ray.constructor : Object)();
  // use THREE via the module graph: the manipulator has internal raycast — simpler: manual intersect via scene.traverse on meshes
  const origin = cam.position.clone();
  const hits = [];
  a.objectManager.scene.traverse(o => {
    if (!o.isMesh || o.visible === false) return;
    if (o.raycast) {
      try {
        const rc = { ray: { origin, direction: v }, far: 500 };
        const out = [];
        o.raycast(rc, out);
        if (out.length) hits.push({ name: o.name || o.type, dist: +out[0].distance.toFixed(2), parentId: o.userData.objectId || (o.parent && o.parent.userData && o.parent.userData.objectId) || null });
      } catch (e) { /* sprites/lines */ }
    }
  });
  hits.sort((p, q) => p.dist - q.dist);
  return JSON.stringify(hits.slice(0, 5));
})()
