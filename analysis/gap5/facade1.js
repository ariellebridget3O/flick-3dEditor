setObjectPose(e,n)}
;
pendingPoses=new Map;
markPosePending=(e,n)=>{
this.pendingPoses.set(e,n)}
;
bakeRigPoseSegment=(e,n)=>{
const r=this.addPerformanceTrack(e);
if(!r)return!1;
const s=this.addRigTransformItem(r,void 0,!1);
return s?(this.addRigKeyframe(r,s,{
tS:0,joints:n}
),!0):!1}
;
bakePendingPose=(e,n)=>{
const r=this.pendingPoses.get(e);
if(!r)return;
const s=n(e,r);
s&&(this.pendingPoses.delete(e),this.bakeRigPoseSegment(e,s)||this.setObjectPose(e,r))}
;
setTransformMode=this.objectsStore.setTransformMode;
rotateAvailable=this.objectsStore.rotateAvailable;
setRotateAvailable=this.objectsStore.setRotateAvailable;
recording=this.cameraStore.recording;
isRecording=this.cameraStore.isRecording;
outputs=this.cameraStore.outputs;
outputCameraLabels=this.cameraStore.outputCameraLabels;
outputCameraIds=this.cameraStore.outputCameraIds;
isPreviewPlaying=this.cameraStore.isPreviewPlaying;
focalLengthMm=this.cameraStore.focalLengthMm;
cameraShake=this.cameraStore.cameraShake;
recordAspect=this.cameraStore.recordAspect;
light=this.cameraStore.light;
filmingCameraId=this.cameraStore.filmingCameraId;
manualReviewCameraId=this.cameraStore.manualReviewCameraId;
isFlyLocked=this.cameraStore.isFlyLocked;
filmingCameraIds=this.cameraStore.filmingCameraIds;
rollingCameraIds=this.cameraStore.rollingCameraIds;
cameraFramesTarget=e=>lq(this.objects.peek()[e],this.cameraItems(e));
cameraFramesASubject=e=>W2r(this.cameraItems(e));
cameraItems=e=>this.show.peek().tracks.find(n=>n.characterId===e)?.items??[];
reconcileTargetMarkers=()=>{
const e=this.objects.peek(),n=this.show.peek().tracks;
for(const[r,s]of Object.entries(e)){
if(s.kind!=="camera")continue;
const a=n.find(l=>l.characterId===r)?.items??[],o=U2r(a);
if(o&&!s.targetId){
const l=Zo(s,e),c=oBe(l.rotation);
this.objectsStore.ensureTargetMarker(r,[l.position[0]+c[0]*Oye,l.position[1]+c[1]*Oye,l.position[2]+c[2]*Oye])}
else!o&&s.targetId&&this.objectsStore.dropTargetMarker(r)}
}
;
startFilming=this.cameraStore.startFilming;
exitCameraMode=this.cameraStore.exitCameraMode;
toggleRecording=this.cameraStore.toggleRecording;
startHubRecording=this.cameraStore.startHubRecording;
stopActiveRecording=this.cameraStore.stopActiveRecording;
discardOutput=()=>{
const e=this.savedVideos.peek().length>0;
this.savedVideos.set([]),this.cameraStore.discardOutput();
const n=this.lastFlight,r=this.filmingCameraId.peek();
!n||!r||this.mode.peek()!=="camera"||(e?this.armPhoneFlight(r):this.performanceStore.startManualFlight(n.trackId,n.itemId))}
;
savedVideoNodeIds=()=>this.savedVideos.peek().map(e=>e.nodeId);
handlePhoneRecord=e=>(e&&!this.recording.peek()&&this.armNodePhoneFlight(),this.cameraStore.handlePhoneRecord(e));
setFocalLengthMm=this.cameraStore.setFocalLengthMm;
togglePreview=()=>{
this.cameraStore.isPreviewPlaying.peek()&&this.performanceStore.isPerformancePlaying.peek()&&this.performanceStore.seekPerformance(this.performanceStore.performanceTimeS.peek()),this.cameraStore.togglePreview()}
;
startRehearsal=()=>{
this.cameraStore.isPreviewPlaying.peek()||this.togglePreview()}
;
stopRehearsal=()=>{
this.cameraStore.isPreviewPlaying.peek()&&this.togglePreview()}
;
toggleNodeRehearsal=()=>{
const e=this.cameraStore.isPreviewPlaying;
if(e.peek()){
e.set(!1);
return}
this.recording.peek()||!this.canPreview.peek()||(this.performanceStore.stopPerformance(),e.set(!0))}
;
recordFromNode=(e,n)=>this.nodePhoneCameraId.peek()?this.handlePhoneRecord(!this.recording.peek()):!e&&this.cameraStore.activeHubCameraIds().length===0?(ot.error(_._({
id:"QFhrni"}
)),Promise.resolve()):this.recordIntoNode(e?[e]:void 0,n);
recordCameras=async e=>this.saveTakes?(await this.recordIntoNode(e),"canvas"):(await this.cameraStore.startHubRecording(e),"review");
recordIntoNode=(e,n)=>this.cameraStore.startHubRecording(e,{
onFilmed:this.saveTakes?r=>this.saveNodeTakes(r,n):void 0}
);
nodeTake=Ne(()=>{
const e=this.recording.get();
return e?{
elapsedS:Math.floor(this.performanceTimeS.get()*10)/10,rendering:e.phase==="stopping"}
:null}
);
saveNodeTakes=(e,n)=>{
const r=this.projectId;
if(!r||!this.saveTakes)return;
const s=this.analytics?.takeContext(),a=performance.now();
this.saveTakes(e.map(o=>this.takeMedia(r,o.output,o.cameraLabel,o.cameraId)),n).then(o=>{
const l=Math.round(performance.now()-a);
o.forEach((c,d)=>this.analytics?.recordVideoSaved({
takeIndex:d,totalTakes:e.length,projectId:r,nodeId:c.nodeId,source:"scene_node",take:s,save:{
ms:l,sizeBytes:c.sizeBytes,...c.timings}
}
))}
)}
;
canPreview=this.cameraStore.canPreview;
setCameraShake=this.cameraStore.setCameraShake;
setRecordAspect=this.cameraStore.setRecordAspect;
setLight=this.cameraStore.setLight;
adjustLight=e=>{
this.cameraStore.setLight(e),this.analytics?.recordLightAdjusted()}
;
setFlyLocked=this.cameraStore.setFlyLocked;
captureViewport=this.cameraStore.captureViewport;
captureCameraImage=this.cameraStore.captureCameraImage;
activeHubCameraIds=this.cameraStore.activeHubCameraIds;
activeSceneId=Ne(null);
show=this.performanceStore.show;
isPerformancePlaying=this.performanceStore.isPerformancePlaying;
performanceSeekS=this.performanceStore.performanceSeekS;
performanceTimeS=this.performanceStore.performanceTimeS;
performancePaint=this.performanceStore.performancePaint;
addPerformanceTrack=this.performanceStore.addPerformanceTrack;
addTrackForObject=this.performanceStore.addTrackForObject;
removePerformanceTrack=this.performanceStore.removePerformanceTrack;
draggingAction=this.performanceStore.draggingAction;
setDraggingAction=this.performanceStore.setDraggingAction;
clearDraggingAction=this.performanceStore.clearDraggingAction;
canDropActionOnObject=this.performanceStore.canDropActionOnObject;
resolveActionForObject=this.performanceStore.resolveActionForObject;
addActionToTrack=this.performanceStore.addActionToTrack;
onActionAdded=null;
appendActionToObject=(e,n)=>{
this.performanceStore.appendActionToObject(e,n),this.onActionAdded?.()}
;
addClipItem=this.performanceStore.addClipItem;
addPathItem=this.performanceStore.addPathItem;
addPlayItem=this.performanceStore.addPlayItem;
addRotateItem=this.performanceStore.addRotateItem;
addRevolveItem=this.performanceStore.addRevolveItem;
addScaleItem=this.performanceStore.addScaleItem;
addTransformItem=this.performanceStore.addTransformItem;
addRigTransformItem=this.performanceStore.addRigTransformItem;
addCameraItem=this.performanceStore.addCameraItem;
setCameraItemDuration=this.performanceStore.setCameraItemDuration;
setCameraItemFields=this.performanceStore.setCameraItemFields;
reaimCamera=this.performanceStore.reaimCamera;
addCameraKeyframe=this.performanceStore.addCameraKeyframe;
removeCameraKeyframe=this.performanceStore.removeCameraKeyframe;
moveCameraKeyframe=this.performanceStore.moveCameraKeyframe;
captureFocusedCameraPose=this.performanceStore.captureFocusedCameraPose;
manualFlight=this.performanceStore.manualFlight;
phoneDraft=null;
lastFlight=null;
finishManualFlight=e=>{
const n=this.phoneDraft;
this.phoneDraft=null;
const r=this.manualFlight.peek();
try{
if(this.performanceStore.finishManualFlight(e),e.length>0&&(this.lastFlight=r),!n||e.length>0||r?.itemId!==n.itemId)return;
n.madeTrack?this.performanceStore.removePerformanceTrack(n.trackId):this.performanceStore.removePerformanceItem(n.trackId,n.itemId),this.performanceStore.selectedSegment.peek()?.itemId===n.itemId&&this.performanceStore.selectedSegment.set(null)}
finally{
n&&this.history.releaseEntry()}
}
;
flyManualSegment=(e,n)=>{
const r=this.performanceStore.startManualFlight(e,n);
r&&this.cameraStore.startFilming(r)}
;
filmWithPhone=e=>{
this.mode.peek()!=="edit"||this.recording.peek()!==null||this.armPhoneFlight(e)&&this.cameraStore.startFilming(e)}
;
armPhoneFlight=e=>{
if(this.objects.peek()[e]?.kind!=="camera")return!1;
const n=this.show.peek().tracks.find(a=>a.characterId===e)?.id;
this.history.holdEntry();
const r=n??this.performanceStore.addPerformanceTrack(e),s=r&&this.performanceStore.addCameraItem(r,"manual",this.performanceTimeS.peek(),null);
return!r||!s?(this.history.releaseEntry(),!1):(this.phoneDraft={
trackId:r,itemId:s,madeTrack:!n}
,this.performanceStore.startManualFlight(r,s)!==null)}
;
nodePhoneCameraId=Ne(null);
nodePhoneQrAsked=Ne(!1);
sceneNodeId;
setOpenSceneNode=e=>{
e&&(this.sceneNodeId=e)}
;
toggleNodePhone=e=>{
if(this.nodePhoneCameraId.peek()===e){
this.endNodePhone();
return}
!this.sceneNodeOpen.peek()||this.mode.peek()!=="edit"||HAe(()=>{
this.filmWithPhone(e),this.filmingCameraId.peek()===e&&(this.selectObject(e),this.nodePhoneCameraId.set(e),this.nodePhoneQrAsked.set(!0),this.saveTakes&&this.cameraStore.sendManualTakesTo(n=>this.saveNodeTakes(n,this.sceneNodeId)))}
)}
;
endNodePhone=async()=>{
this.nodePhoneCameraId.peek()&&(this.nodePhoneCameraId.set(null),this.nodePhoneQrAsked.set(!1),this.recording.peek()&&(await iP(()=>this.recording.get()?.phase!=="starting"),this.recording.peek()?.kind==="manual"&&await this.cameraStore.toggleRecording(),await iP(()=>this.recording.get()===null)),this.cameraStore.sendManualTakesTo(null),this.mode.peek()==="camera"&&this.setMode("edit"))}
;
armNodePhoneFlight=()=>{
const e=this.nodePhoneCameraId.peek();
!e||this.manualFlight.peek()||HAe(()=>{
this.armPhoneFlight(e),this.selectObject(e)}
)}
;
focusedCameraId=Ne(()=>{
const e=this.objects.get(),n=this.selectedId.get();
if(n&&e[n]?.kind==="camera")return n;
const r=this.performanceStore.selectedSegment.get()?.trackId??this.performanceStore.selectedTrack.get()?.trackId;
if(!r)return null;
const a=this.show.get().tracks.find(o=>o.id===r)?.characterId;
return a&&e[a]?.kind==="camera"?a:null}
);
setObjectItemDuration=this.performanceStore.setObjectItemDuration;
setRotateAxis=this.performanceStore.setRotateAxis;
setObjectItemSpeed=this.performanceStore.setObjectItemSpeed;
setRevolveCenter=this.performanceStore.setRevolveCenter;
setScaleFactor=this.performanceStore.setScaleFactor;
addTransformKeyframe=this.performanceStore.addTransformKeyframe;
removeTransformKeyframe=this.performanceStore.removeTransformKeyframe;
moveTransformKeyframe=this.performanceStore.moveTransformKeyframe;
addRigKeyframe=this.performanceStore.addRigKeyframe;
addSampledRigKeyframe=this.performanceStore.addSampledRigKeyframe;
removeRigKeyframe=this.performanceStore.removeRigKeyframe;
moveRigKeyframe=this.performanceStore.moveRigKeyframe;
captureFocusedTransformPose=this.performanceStore.captureFocusedTransformPose;
captureFocusedRigPose=this.performanceStore.captureFocusedRigPose;
selectedSegment=this.performanceStore.selectedSegment;
selectSegment=this.performanceStore.selectSegment;
selectKeyframe=this.performanceStore.selectKeyframe;
selectedTrack=this.performanceStore.selectedTrack;
selectTrack=this.performanceStore.selectTrack;
clearFocus=this.performanceStore.clearFocus;
peekFocus=()=>({
segment:this.selectedSegment.peek(),track:this.selectedTrack.peek()}
);
restoreFocus=({
segment:e,track:n}
)=>{
this.selectedSegment.set(e),this.selectedTrack.set(n)}
;
transformPoseObjectId=Ne(()=>{
if(this.isPerformancePlaying.get())return null;
const e=this.selectedSegment.get();
if(!e)return null;
const n=this.show.get().tracks.find(s=>s.id===e.trackId),r=n?.items.find(s=>s.id===e.itemId);
return r?.kind==="transform"||r?.kind==="cam-transform"?n?.characterId??null:null}
);
rigPoseObjectId=Ne(()=>{
if(this.isPerformancePlaying.get())return null;
const e=this.selectedSegment.get();
if(!e)return null;
const n=this.show.get().tracks.find(s=>s.id===e.trackId);
return n?.items.find(s=>s.id===e.itemId)?.kind==="rig-transform"?n?.characterId??null:null}
);
updatePlayItemKey=this.performanceStore.updatePlayItemKey;
playSession=this.performanceStore.playSession;
playKeymap=this.performanceStore.playKeymap;
playPointerLocked=this.performanceStore.playPointerLocked;
setPlayPointerLocked=this.performanceStore.setPlayPointerLocked;
startPlaySession=this.performanceStore.startPlaySession;
stopPlaySession=this.performanceStore.stopPlaySession;
setPlayRecording=this.performanceStore.setPlayRecording;
finishPlayRecording=this.performanceStore.finishPlayRecording;
