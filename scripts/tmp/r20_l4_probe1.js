(() => {
  const a = window.__app, d = document;
  if (!a) return 'NO APP';
  // enter the cameras view via the real switch
  const btn = d.querySelector('#viewSwitch button[data-v=cameras]');
  btn.click();
  return new Promise(res => setTimeout(() => {
    const wall = d.getElementById('camWall');
    const r1 = {
      wallExists: !!wall,
      wallVisible: wall && wall.style.display !== 'none',
      tiles: wall ? wall.querySelectorAll('.cam-tile').length : 0,
      count: wall && wall.querySelector('.cam-wall-count')?.textContent,
      camFov: a.camera.fov,
      orbitEnabled: a.orbit.enabled,
      stageView: a.page.stageView,
      editorCamMoved: false
    };
    // single camera -> the tile should fill the canvas; the frame renders via renderFrame
    // verify the wall camera is NOT the editor camera
    const pos0 = a.camera.position.toArray().map(v => +v.toFixed(1));
    a.camera.position.set(99, 99, 99);   // move the EDITOR camera — the wall must not care
    setTimeout(() => {
      const posAfter = a.camera.position.toArray().map(v => +v.toFixed(1));
      r1.editorCamMoved = JSON.stringify(pos0) !== JSON.stringify(posAfter);
      // restore
      a.camera.position.set(...pos0);
      res(JSON.stringify(r1));
    }, 400);
  }, 900));
})()
