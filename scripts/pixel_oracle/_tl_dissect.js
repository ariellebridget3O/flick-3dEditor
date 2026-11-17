(() => {
  // dissect the timeline: find the ruler element (owns seek clicks)
  const wrap = document.querySelector('[class*=_timelineWrap_]');
  if (!wrap) return 'no wrap';
  const out = [];
  const walk = (el, depth) => {
    if (depth > 5) return;
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      if (r.width > 30 && r.height > 8)
        out.push('  '.repeat(depth) + c.tagName + '.' + (c.className || '').toString().slice(0, 46) + ' [' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ']');
      walk(c, depth + 1);
    }
  };
  walk(wrap, 0);
  return out.slice(0, 30).join('\n');
})()
