(() => {
  const a = window.__app;
  const s = a.show.show;  // the show state
  const out = { name: s && s.name, tracks: [] };
  for (const t of ((s && s.tracks) || [])) {
    out.tracks.push({ id: t.id, cid: t.characterId, items: (t.items || []).map(i => i.kind + '@' + i.startS + 'd' + (i.durationS || '?')) });
  }
  const pg = a.page; const ps = pg && pg.state ? pg.state() : pg;
  out.pageKeys = pg ? Object.keys(pg).slice(0, 20) : null;
  return JSON.stringify(out);
})()
