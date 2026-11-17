(() => {
  const a = window.__app;
  let fr = null;
  a.scene.traverse(o => { if (!fr && o.userData && o.userData.__frustum) fr = o; });
  if (!fr) return 'no frustum';
  let g = fr.parent;
  g.updateWorldMatrix(true, false);
  const e = g.matrixWorld.elements;
  const fwd = [e[8], e[9], e[10]];
  const pos = [e[12], e[13], e[14]];
  // subject (Figure 1)
  const fig = Object.values(a.objects.objects).find(o => o.kind === 'simple_figure');
  const to = fig ? [fig.position[0] - pos[0], fig.position[1] - pos[1], fig.position[2] - pos[2]] : null;
  let dot = null;
  if (to) { const n = Math.hypot(...to); dot = (fwd[0]*to[0] + fwd[1]*to[1] + fwd[2]*to[2]) / n; }
  return JSON.stringify({
    camPos: pos.map(v => +v.toFixed(2)),
    fwd: fwd.map(v => +v.toFixed(2)),
    figPos: fig ? fig.position.map(v => +v.toFixed(2)) : null,
    fwdDotToFig: dot === null ? null : +dot.toFixed(3)
  });
})()
