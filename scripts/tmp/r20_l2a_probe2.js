(() => {
  const a = window.__app;
  a.setSkyStyle('realistic');
  return new Promise(res => {
    setTimeout(() => {
      const d = a.env.realisticSky()._debug;
      const samples = [];
      const sun0 = a.env.sun.position.clone();
      for (let i = 0; i < 10; i++) { a.setLightCustom(100 + i * 20, 40 - i * 3); }
      const poll = (n) => {
        samples.push({ t: n * 100, pp: d.pmremPending, sunMoved: a.env.sun.position.distanceTo(sun0) > 0.001 });
        if (n < 7) setTimeout(() => poll(n + 1), 100);
        else res(JSON.stringify({ samples, finalAz: Math.round(a.light.azimuthDeg), finalEl: Math.round(a.light.elevationDeg) }));
      };
      poll(0);
    }, 900);
  });
})()
