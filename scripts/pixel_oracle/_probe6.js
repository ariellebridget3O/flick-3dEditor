(() => {
  const host = document.querySelector('[class*=_canvasHost_]');
  if (!host) return 'no canvasHost';
  const out = { hostClass: host.className.toString().slice(0, 50), children: [] };
  for (const el of host.querySelectorAll('*').length ? [...host.querySelectorAll('*')].slice(0, 12) : []) {
    const r = el.getBoundingClientRect();
    out.children.push(el.tagName + '.' + (el.className || '').toString().slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  // the stage route element
  const route = document.querySelector('.stage-route');
  out.routeChildren = route ? [...route.children].slice(0, 6).map(c => c.tagName + '.' + (c.className || '').toString().slice(0, 44)) : null;
  // any element with "empty"/"pick"/"open" text in the viewport area
  const empties = [...document.querySelectorAll('div,p,span,h1,h2,h3')].filter(e => {
    const r = e.getBoundingClientRect();
    return r.y > 75 && r.y < 450 && r.x < 640 && r.width > 50 && /open a scene|pick|choose|empty|select a scene|get started/i.test(e.textContent || '') && e.children.length === 0;
  }).slice(0, 5).map(e => e.textContent.trim().slice(0, 80));
  out.hints = empties;
  return JSON.stringify(out, null, 1);
})()
