(() => {
  const a = window.__app;
  const d = a.env.realisticSky()._debug;
  const log = [];
  a.setLightCustom(10, 45);   // fresh change (session was at 50/20)
  const t0 = performance.now();
  const poll = () => {
    log.push({ dt: Math.round(performance.now() - t0), pp: d.pmremPending, ld: d.lutDirty });
    if (performance.now() - t0 < 700) setTimeout(poll, 40);
    else window.__l2aResult = JSON.stringify(log);
  };
  poll();
  return 'polling started';
})()
