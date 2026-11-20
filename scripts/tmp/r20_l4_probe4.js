(() => {
  const a = window.__app, d = document;
  const out = {};
  // 1. tile click = select + focus + back to editor
  const tile = d.querySelector('.cam-tile');
  const camId = tile.dataset.cam;
  tile.click();
  out.afterClick = { stageView: a.page.stageView, selected: a.objects.selectedId === camId, wallHidden: d.getElementById('camWall').style.display === 'none' };
  // 2. back to cameras, enter camera mode -> wall hides, stageView preserved; exit -> wall returns
  d.querySelector('#viewSwitch button[data-v=cameras]').click();
  out.inWall = { stageView: a.page.stageView };
  a.setMode('camera');
  out.inCamMode = { mode: a.page.mode, stageView: a.page.stageView, wallHidden: d.getElementById('camWall').style.display === 'none' };
  a.exitCameraMode();
  out.afterExit = { mode: a.page.mode, stageView: a.page.stageView, wallBack: d.getElementById('camWall').style.display !== 'none' };
  // 3. focusedCameraId: select a camera SEGMENT's track -> activeCameraId picks its camera
  const tracks = a.show.show.tracks;
  const camTrack = tracks.find(t => { const o = a.objects.get(t.characterId); return o && o.kind === 'camera'; });
  if (camTrack) {
    a.page.selectedTrack = { trackId: camTrack.id };
    a.objects.select([]);
    out.focused = { activeCam: a.activeCameraId(), trackCam: camTrack.characterId, match: a.activeCameraId() === camTrack.characterId };
  }
  // back to editor view for cleanliness
  d.querySelector('#viewSwitch button[data-v=editor]').click();
  return JSON.stringify(out);
})()
