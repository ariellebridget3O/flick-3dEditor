(() => {
  const tiles = [...document.querySelectorAll('canvas')].filter(c => (c.className || '').includes('tileThumb'));
  const out = { tiles: [] };
  for (const t of tiles) {
    let el = t, chain = [];
    for (let i = 0; i < 4 && el; i++) { chain.push(el.tagName + '.' + (el.className || '').toString().slice(0, 40) + (el.getAttribute('aria-label') ? '[' + el.getAttribute('aria-label') + ']' : '') + (el.getAttribute('data-scene-id') ? '#' + el.getAttribute('data-scene-id') : '')); el = el.parentElement; }
    out.tiles.push(chain.join(' < '));
  }
  // what is the parent container of the tiles?
  const host = tiles[0]?.closest('div');
  if (host) {
    let p = host, i = 0;
    while (p && i < 6) { const r = p.getBoundingClientRect(); if (r.width > 200) { out.host = (p.className || '').toString().slice(0, 60) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' text=' + p.textContent.trim().slice(0, 80); break; } p = p.parentElement; i++; }
  }
  return JSON.stringify(out, null, 1);
})()
