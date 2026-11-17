(() => {
  const a = window.__app;
  const trs = a.show ? (a.show.tracks ? a.show.tracks() : a.stores.show.tracks) : null;
  const out = { tracks: [] };
  const tracks = a.stores && a.stores.show ? a.stores.show.tracks : (a.show ? a.show.tracks : null);
  const list = typeof tracks === 'function' ? tracks() : tracks;
  for (const t of (list || [])) {
    out.tracks.push({ id: t.id, characterId: t.characterId, items: (t.items || []).map(i => i.kind + '@' + i.startS) });
  }
  out.t = a.page ? (a.page.t !== undefined ? a.page.t : (a.page.timeS !== undefined ? a.page.timeS : '?')) : '?';
  return JSON.stringify(out);
})()
