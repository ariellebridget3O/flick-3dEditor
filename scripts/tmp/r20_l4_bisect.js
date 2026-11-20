(async () => {
  const a = window.__app, d = document;
  await a.page.seek(4.0);
  await new Promise(r => setTimeout(r, 800));
  const camIds = Object.keys(a.objects.all()).filter(k => a.objects.all()[k].kind === 'camera');
  a.objects.select([camIds[0]]);
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  await new Promise(r => setTimeout(r, 2700));
  const gl = a.renderer.getContext();
  const readHot = () => {
    const px = new Uint8Array(4 * 100);
    gl.readPixels(360, 330, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return [px[0], px[1], px[2]];
  };
  const groups = {
    humanoid: [], simple_figure: [], prop: [], camera: [],
  };
  for (const [id, o] of Object.entries(a.objects.all())) {
    const m = a.objectManager.meshById.get(id);
    if (m && groups[o.kind]) groups[o.kind].push(m);
  }
  const out = {};
  a.renderFrame(); out.baseline = readHot();
  for (const kind of Object.keys(groups)) {
    const was = groups[kind].map(m => m.visible);
    groups[kind].forEach(m => m.visible = false);
    a.renderFrame();
    out['hide_' + kind] = readHot();
    groups[kind].forEach((m, i) => m.visible = was[i]);
  }
  a.renderFrame(); out.restored = readHot();
  return JSON.stringify(out);
})()
