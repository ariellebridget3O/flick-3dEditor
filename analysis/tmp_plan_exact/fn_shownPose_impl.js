// ============================================================================
// fn: shownPose_impl   (bundle minified: shownPose:pe=>{)
// char range: 5763256..5763526   (byte range: 5771525..5771795)
// purpose: runtime facade shownPose(id): mesh world TRS via Bie + getWorldScale; +fovDeg for cameras; used by rDr items() to mirror playback
// params: id -> pose|null
// closure/global deps (auto-derived, approximate): ge, fe, shownPose, e, scale, t, O, nat
// ============================================================================
shownPose:pe=>{const ce=e.meshById.get(pe);if(!ce)return null;ce.getWorldScale(ge);const be={...Bie(ce),scale:[ge.x,ge.y,ge.z]},fe=t.objects.peek()[pe]?.kind;return fe==="camera"&&(be.fovDeg=O.cameraFovDeg(pe)??void 0),fe==="simple_figure"&&(be.headRotation=nat(ce)),be}
