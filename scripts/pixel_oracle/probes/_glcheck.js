(() => {
  // does WebGL work in this page?
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (!gl) return 'NO WEBGL CONTEXT';
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  // count live webgl contexts on the page canvases
  let live = 0, dead = 0;
  for (const cv of document.querySelectorAll('canvas')) {
    // can't re-getContext with different type; try webgl2 on each (returns null if already taken by another type)
    const g2 = cv.getContext('webgl2');
    if (g2) live++;
  }
  return JSON.stringify({ renderer: String(renderer).slice(0, 80), canvases: document.querySelectorAll('canvas').length, gotWebgl2: live });
})()
