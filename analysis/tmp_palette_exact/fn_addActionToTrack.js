// ============================================================================
// fn: addActionToTrack   (bundle minified: addActionToTrack=)
// char range: 5527391..5528059   (byte range: 5543480..5544148)
// size: 668 chars / 668 bytes
// purpose: dispatch resolved action to track: path→addPathItem, play→addPlayItem, clip→addClipItem, camera→addCameraItem, object: rotate/revolve/scale-up(AHr=2)/scale-down(CHr=.5)/transform/rig-transform
// params: trackId, payload, ?atS -> void
// closure/global deps (auto-derived, approximate): e, r, n, addActionToTrack, AHr, CHr
// ============================================================================
addActionToTrack=(e,n,r)=>{const s=this.show.peek().tracks.find(o=>o.id===e);if(!s)return;const a=this.resolveActionForObject(s.characterId,n);if(a)switch(a.kind){case"path":this.addPathItem(e,r);break;case"play":this.addPlayItem(e,r);break;case"clip":this.addClipItem(e,a.clip,r);break;case"camera":this.addCameraItem(e,a.action,r);break;case"object":switch(a.action){case"rotate":this.addRotateItem(e,r);break;case"revolve":this.addRevolveItem(e,r);break;case"scale-up":this.addScaleItem(e,AHr,r);break;case"scale-down":this.addScaleItem(e,CHr,r);break;case"transform":this.addTransformItem(e,r);break;case"rig-transform":this.addRigTransformItem(e,r);break}break}};
