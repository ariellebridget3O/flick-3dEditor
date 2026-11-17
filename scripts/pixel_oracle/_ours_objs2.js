(() => {
  const a = window.__app;
  const os = a.objects.objects;
  const out = [];
  for (const o of Object.values(os)) {
    const m = a.meshById(o.id);
    const pos = (o.position || []).map(v => Math.round(v * 100) / 100).join(',');
    out.push([o.kind, o.name, o.propKey || '-', pos, m ? 'mesh' : 'NOMESH'].join('|'));
  }
  return out.join(' ; ');
})()
