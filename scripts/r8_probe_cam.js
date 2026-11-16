// r8 E2E probe: camera orbit add via palette + aimCameraAtSubject effects
const evaljs = `(() => {
  const app = window.__app;
  const camEntry = Object.entries(app.objects.all()).find(([id,o]) => o.kind==='camera');
  const humanEntry = Object.entries(app.objects.all()).find(([id,o]) => o.kind==='humanoid');
  const humanId = humanEntry[0];
  const camId = camEntry[0];
  let tr = app.show.trackOf(camId);
  if (!tr) { app.show.beginEditGesture(); app.show.addPerformanceTrack(camId); app.show.endEditGesture(); tr = app.show.trackOf(camId); }
  const camRotBefore = JSON.stringify(app.objects.get(camId).rotation);
  const tid = app.objects.get(camId).targetId;
  const tgtPosBefore = tid ? JSON.stringify(app.objects.get(tid).position) : null;
  app.palette.open();
  app.objects.select([camId]);
  app.palette.state.tab = 'camera'; app.palette.render();
  const orbit = [...document.querySelectorAll('.palette .tile')].find(t => t.dataset.payload.includes('orbit'));
  const undoBefore = app.show.undoStack.length;
  orbit.querySelector('.tile-add').click();
  const it = tr.items[tr.items.length - 1];
  const out = {
    item: { kind: it.kind, move: it.move, subjectIsHumanoid: it.subjectId === humanId, dir: it.direction, angle: it.angleDeg, dur: it.durationS },
    oneEntry: app.show.undoStack.length === undoBefore + 1,
    camRotChanged: JSON.stringify(app.objects.get(camId).rotation) !== camRotBefore,
    tgtMoved: tid ? JSON.stringify(app.objects.get(tid).position) !== tgtPosBefore : 'no-target',
    paletteClosed: document.querySelector('.palette').classList.contains('collapsed'),
  };
  app.show.undo();
  out.itemGone = !tr.items.find(i => i.id === it.id);
  return JSON.stringify(out);
})()`;
window.__r8cam = evaljs;
