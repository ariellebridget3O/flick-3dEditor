(() => {
  // find the scene tab strip: buttons near y=49
  const tabs = [...document.querySelectorAll('button')].filter(b => {
    const r = b.getBoundingClientRect();
    return Math.round(r.y) === 49 && r.width > 0;
  }).map(b => ({
    text: b.textContent.trim().slice(0, 30),
    x: Math.round(b.getBoundingClientRect().x),
    attrs: ['aria-selected', 'data-active', 'data-state', 'class'].map(a => b.getAttribute(a)).map(v => v ? v.slice(0, 50) : null),
  }));
  return JSON.stringify(tabs, null, 1);
})()
