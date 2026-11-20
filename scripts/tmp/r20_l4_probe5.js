(() => {
  const a = window.__app, d = document;
  const vis = () => d.getElementById('camWall').style.display !== 'none';
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  return new Promise(r => setTimeout(() => {
    const w1 = vis();
    a.setMode('camera');
    setTimeout(() => {
      const w2 = vis();
      a.exitCameraMode();
      setTimeout(() => {
        const w3 = vis();
        d.querySelector('#viewSwitch button[data-v=editor]').click();
        setTimeout(() => {
          const w4 = vis();
          r(JSON.stringify({ wallInCamerasView: w1, wallInCameraMode: w2, wallAfterExit: w3, wallInEditorView: w4 }));
        }, 300);
      }, 300);
    }, 300);
  }, 300));
})()
