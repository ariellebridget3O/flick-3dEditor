(() => {
  const a = window.__app;
  const cam = Object.values(a.objects.objects).find(o => o.kind === 'camera');
  if (!cam) return 'no camera';
  const m = a.scene.getObjectByName('mesh-' + cam.id) || [...a.scene.children].find(c => c.userData && c.userData.id === cam.id);
  let info = { id: cam.id, storePos: cam.position };
  // find the mesh via traverse: look for userData.objectId or similar
  let mesh = null;
  a.scene.traverse(o => { if (!mesh && o.userData && (o.userData.id === cam.id || o.userData.objectId === cam.id)) mesh = o; });
  if (mesh) {
    mesh.updateWorldMatrix(true, false);
    const e = mesh.matrixWorld.elements;
    info.meshPos = [e[12].toFixed(2), e[13].toFixed(2), e[14].toFixed(2)];
    info.forward = [e[8].toFixed(2), e[9].toFixed(2), e[10].toFixed(2)];
    info.children = mesh.children.map(c => c.type + (c.userData && c.userData.__frustum !== undefined ? '(frustum)' : '')).slice(0, 6);
  } else info.mesh = 'NOT FOUND';
  return JSON.stringify(info);
})()
