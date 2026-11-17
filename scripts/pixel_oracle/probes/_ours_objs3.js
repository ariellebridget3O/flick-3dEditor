(() => {
  const a = window.__app;
  const os = a.objects.objects;
  const out = [];
  try {
    for (const o of Object.values(os)) {
      let pos = 'n/a';
      try { pos = (o.position || []).map(v => Math.round(v * 100) / 100).join(','); } catch (e) { pos = 'E:' + e.message; }
      let mesh = '?';
      try { mesh = a.meshById(o.id) ? 'mesh' : 'NOMESH'; } catch (e) { mesh = 'E:' + e.message; }
      out.push([o.kind, o.name, o.propKey || '-', pos, mesh].join('|'));
    }
  } catch (e) { return 'outer E: ' + e.message; }
  return out.join(' ; ');
})()
