(() => {
  const row = window.__sceneRow;
  if (!row) return 'no row';
  const s = typeof row.scene === 'string' ? JSON.parse(row.scene) : row.scene;
  return JSON.stringify({
    name: row.name,
    v: s.v, keys: Object.keys(s),
    objects: Object.entries(s.objects || {}).map(([id, o]) => [o.kind, o.name]),
    light: s.light, aspect: s.recordAspect,
    items: (s.show?.tracks || []).map(t => (t.items || []).map(i => i.kind + ':' + (i.move || '')).join('+')),
  });
})()
