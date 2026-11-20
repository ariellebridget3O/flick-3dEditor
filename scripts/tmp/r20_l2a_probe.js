(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  return new Promise(res => {
    setTimeout(() => {
      const sky = a.env.realisticSky();
      const d = sky._debug;
      const t0 = performance.now();
      const pmAt0 = d.lastPmremAt || 0;
      for (let i = 0; i < 10; i++) { a.setLightCustom(100 + i * 20, 40 - i * 3); }
      setTimeout(() => {
        const mid = { pmremPending: d.pmremPending, lutDirty: d.lutDirty };
        setTimeout(() => {
          const after = { pmremPending: d.pmremPending, lutDirty: d.lutDirty, pmremBakedAfter: (d.lastPmremAt || 0) > pmAt0 };
          res(JSON.stringify({ mid, after, ms: Math.round(performance.now() - t0) }));
        }, 500);
      }, 130);
    }, 800);
  });
})()
