(() => {
function ne(){if(e.isDisposed()||V||G)return;const pe=Z.getDelta();a.tick(pe),o.tick(),$.tick(pe),z(),A.tick(pe),T.tick(pe),C()&&Uit(e.camera,n.orbit),n.tick(),C()&&Uit(e.camera,n.orbit),N.tick(pe),w.tick(),l.tick(),d.tick(),u(e.renderer),I.tick(),O.tickPreview(pe),se(),U.tick(pe),O.tickShake(pe),W.tick(pe),j.tick(),t.planShown.peek()||!t.pageLive.peek()?e.scene.updateMatrixWorld():(E.tick(),re(),h.add(pe*1e3),Q(),U.render()),O.restoreShake(),O.tickCapture(pe)}
});
