(() => {
  const out = [];
  // find popover/dialog/menu overlays
  for (const sel of ['[role=dialog]', '[role=menu]', '[data-state=open]', '[class*=popover]', '[class*=Popover]', '[class*=overlay]']) {
    for (const el of [...document.querySelectorAll(sel)].slice(0, 5)) {
      const r = el.getBoundingClientRect();
      if (r.width > 50 && r.height > 50)
        out.push(`${sel} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} cls=${(el.className || '').toString().slice(0, 70)} text="${el.textContent.trim().slice(0, 60)}"`);
    }
  }
  // the scene tab parents
  const tab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Scene 1' && Math.round(b.getBoundingClientRect().y) === 49);
  if (tab) {
    let p = tab.parentElement, chain = [];
    for (let i = 0; i < 4 && p; i++) { chain.push(`${p.tagName}.${(p.className || '').toString().slice(0, 50)} state=${p.getAttribute('data-state')}`); p = p.parentElement; }
    out.push('TAB PARENTS: ' + chain.join(' < '));
  }
  return JSON.stringify(out, null, 1);
})()
