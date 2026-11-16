const __Validate__ = {
shownPose:pe=>{const ce=e.meshById.get(pe);if(!ce)return null;ce.getWorldScale(ge);const be={...Bie(ce),scale:[ge.x,ge.y,ge.z]},fe=t.objects.peek()[pe]?.kind;return fe==="camera"&&(be.fovDeg=O.cameraFovDeg(pe)??void 0),fe==="simple_figure"&&(be.headRotation=nat(ce)),be}
};
