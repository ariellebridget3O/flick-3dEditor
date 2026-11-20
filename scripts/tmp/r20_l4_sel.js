(() => {
  const a = window.__app;
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  const mesh = a.objectManager.meshById.get(camIds[0]);
  const kids = mesh.children.map(c => ({ name: c.name || c.type, sel: !!(c.userData && c.userData.__sel), amber: (c.material && c.material.color && c.material.color.getHexString()) || null }));
  // any scene objects whose name/color suggests selection + near the camera position
  const near = [];
  a.objectManager.scene.traverse(o => {
    if (!o.isMesh && !o.isLine && !o.isSprite) return;
    if (o.visible === false) return;
    const p = o.getWorldPosition(new a.camera.position.constructor());
    if (p.distanceTo(mesh.getWorldPosition(new a.camera.position.constructor())) < 1.5 && o !== mesh && !mesh.children.includes(o)) {
      near.push({ type: o.type, name: o.name || '', hex: o.material && o.material.color ? o.material.color.getHexString() : null });
    }
  });
  return JSON.stringify({ kids, near: near.slice(0, 8), selIds: a.objects.selectedIds });
})()
