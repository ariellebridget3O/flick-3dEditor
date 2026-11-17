(() => {
  return new Promise(resolve => {
    let n = 0;
    const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 500) requestAnimationFrame(tick); else resolve('rAF ticks in 500ms: ' + n); };
    requestAnimationFrame(tick);
    setTimeout(() => resolve('rAF ticks in 500ms: ' + n + ' (timeout)'), 700);
  });
})()
