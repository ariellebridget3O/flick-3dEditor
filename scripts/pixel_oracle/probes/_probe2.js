(() => {
  const out = { buttons: [], els: [] };
  // all buttons with geometry
  for (const b of document.querySelectorAll('button')) {
    const r = b.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.y < 200)
      out.buttons.push(`${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} "${b.textContent.trim().slice(0, 30)}" aria=${b.getAttribute('aria-label')?.slice(0, 40) ?? '-'}`);
  }
  // prominent layout elements
  for (const sel of ['header', 'main', 'aside', 'footer', '[class*=stage]', '[class*=viewport]', '[class*=timeline]', '[class*=canvas]']) {
    for (const el of [...document.querySelectorAll(sel)].slice(0, 3)) {
      const r = el.getBoundingClientRect();
      if (r.width > 100)
        out.els.push(`${sel} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} cls=${(el.className || '').toString().slice(0, 60)}`);
    }
  }
  return JSON.stringify(out, null, 1);
})()
