(() => {
  const app = window.__app;
  const out = [];
  const objs = app.store && app.store.objects ? app.store.objects.items() : [];
  for (const o of objs) {
    let pos = null;
    try { pos = [o.position[0].toFixed(2), o.position[1].toFixed(2), o.position[2].toFixed(2)]; } catch {}
    out.push([o.kind, o.name, o.propKey || '-', pos ? pos.join(',') : 'n/a']);
  }
  return JSON.stringify(out);
})()
