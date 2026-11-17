(() => {
  const cs = [...document.querySelectorAll('canvas')].map(c => {
    const r = c.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cls: (c.className||'').slice(0,40) };
  });
  const url = location.href;
  const sceneBtn = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Scene|Camera/i.test(t)).slice(0, 10);
  return JSON.stringify({ url, canvases: cs, btns: sceneBtn });
})()
