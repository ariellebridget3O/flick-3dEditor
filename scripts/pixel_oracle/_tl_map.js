(() => {
  // map the timeline: ruler labels + lane geometry + playhead
  const out = {};
  // ruler time labels "0s".."14s"
  const labels = [...document.querySelectorAll('span,div,p')].filter(e => /^\d+(\.\d+)?s$/.test(e.textContent.trim()) && e.children.length === 0);
  out.labels = labels.map(e => { const r = e.getBoundingClientRect(); return [e.textContent.trim(), Math.round(r.x + r.width / 2), Math.round(r.y)]; });
  // the time readout "0.00"
  const tlabel = [...document.querySelectorAll('span,div,p')].filter(e => /^\d+\.\d\d$/.test(e.textContent.trim()) && e.children.length === 0);
  out.timeLabels = tlabel.map(e => { const r = e.getBoundingClientRect(); return [e.textContent.trim(), Math.round(r.x), Math.round(r.y)]; });
  // timeline lanes
  const lane = document.querySelector('[class*=_timelineMain_]');
  if (lane) { const r = lane.getBoundingClientRect(); out.lane = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }
  // the playhead element (absolute positioned in timeline)
  const tl = document.querySelector('[class*=_timelineWrap_], [class*=_timeline_]');
  if (tl) { const r = tl.getBoundingClientRect(); out.tlWrap = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }
  return JSON.stringify(out);
})()
