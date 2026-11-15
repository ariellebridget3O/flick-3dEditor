enterPathEdit=this.performanceStore.enterPathEdit;
appendPathAnchor=this.performanceStore.appendPathAnchor;
insertPathAnchor=this.performanceStore.insertPathAnchor;
movePathAnchor=this.performanceStore.movePathAnchor;
setPathAnchorHeight=this.performanceStore.setPathAnchorHeight;
movePathHandle=this.performanceStore.movePathHandle;
deletePathAnchor=this.performanceStore.deletePathAnchor;
selectPathAnchor=this.performanceStore.selectPathAnchor;
finishPerformancePaint=this.performanceStore.finishPerformancePaint;
updatePathItemSpeed=this.performanceStore.updatePathItemSpeed;
updatePathItemGait=this.performanceStore.updatePathItemGait;
updatePathItemAim=this.performanceStore.updatePathItemAim;
replaceMoveFromSamples=this.performanceStore.replaceMoveFromSamples;
setCameraFocus=this.performanceStore.setCameraFocus;
cameraFocusId=this.performanceStore.cameraFocusId;
walkerFocusId=this.performanceStore.walkerFocusId;
setWalkerFocus=this.performanceStore.setWalkerFocus;
shiftPaths=this.performanceStore.shiftPaths;
setPathHeightCurve=this.performanceStore.setPathHeightCurve;
updateClipItem=this.performanceStore.updateClipItem;
removePerformanceItem=this.performanceStore.removePerformanceItem;
moveItem=this.performanceStore.moveItem;
duplicateItem=this.performanceStore.duplicateItem;
draggingSegment=this.performanceStore.draggingSegment;
beginSegmentDrag=this.performanceStore.beginSegmentDrag;
endSegmentDrag=this.performanceStore.endSegmentDrag;
canDropSegmentOnObject=this.performanceStore.canDropSegmentOnObject;
wasSegmentDropTaken=this.performanceStore.wasSegmentDropTaken;
dropSegmentOnObject=this.performanceStore.dropSegmentOnObject;
reorderItem=this.performanceStore.reorderItem;
playPerformance=this.performanceStore.playPerformance;
stopPerformance=this.performanceStore.stopPerformance;
seekPerformance=this.performanceStore.seekPerformance;
setTakeRange=this.performanceStore.setTakeRange;
filmedARange=()=>{
const e=this.show.peek(),n=rx(e).durationS,{
fromS:r,toS:s}
=She(e,n);
return r>0||s<n}
;
loadShow=this.performanceStore.loadShow;
savedVideos=Ne([]);
savingTake=Ne(null);
projectId;
analytics;
videoSaver;
saveTakes;
onOpenCanvasNodes;
screenshotEpoch=Ne(0);
onboardHighlightId=Ne(null);
onboardHighlightScreenPos=Ne(null);
selectionScreenBounds=Ne(null);
screenshotInFlight=!1;
history;
disposers=[];
constructor(e){
this.projectId=e?.projectId,this.videoSaver=e?.videoSaver??new nKr,this.saveTakes=e?.saveTakes,this.onOpenCanvasNodes=e?.onOpenCanvasNodes,this.analytics=e?.analytics,this.disposers.push(qt(()=>{
this.show.get(),this.reconcileTargetMarkers()}
));
let n=!1;
this.disposers.push(qt(()=>{
const o=this.playSession.get()!==null;
o&&!n&&this.analytics?.recordPlayStarted(),n=o}
));
let r=!1;
this.disposers.push(qt(()=>{
const o=this.cameraStore.recording.get()!==null;
o&&!r&&this.analytics?.recordTakeStarted(),r=o}
)),this.history=new nMr({
track:this.trackSceneJson,snapshot:this.snapshotSceneState,restore:this.restoreSceneState}
),this.disposers.push(qt(()=>{
try{
window.localStorage.setItem(AKt,this.inputDevice.get())}
catch{
}
}
));
const s=o=>{
this.dropHoverValid.set(o.defaultPrevented&&o.dataTransfer?.dropEffect!=="none"),this.draggingObject.set(Array.from(o.dataTransfer?.types??[]).includes(s9))}
,a=()=>{
this.dropHoverValid.set(!1),this.draggingObject.set(!1),this.clearDraggingComponent(),this.clearDraggingAction()}
;
document.addEventListener("dragover",s),document.addEventListener("drop",a),document.addEventListener("dragend",a),this.disposers.push(()=>{
document.removeEventListener("dragover",s),document.removeEventListener("drop",a),document.removeEventListener("dragend",a)}
),this.disposers.push(qt(()=>{
if(this.performanceStore.selectedSegment.get()!==null){
this.objectsStore.clearSelection();
return}
const o=this.performanceStore.selectedTrack.get();
if(!o)return;
const l=this.performanceStore.show.peek().tracks.find(c=>c.id===o.trackId);
l&&this.objectsStore.selectObject(l.characterId)}
),qt(()=>{
const o=this.nodePhoneCameraId.get();
if(!o)return;
const l=this.selectedIds.get();
(l.length!==1||l[0]!==o||this.mode.get()!=="camera")&&this.endNodePhone()}
))}
setScene=e=>{
this.stageScene=e,this.cameraStore.setScene(e)}
;
stageScene=null;
projectPoint=(e,n,r)=>this.stageScene?.project(e,n,r)??null;
viewYawDeg=()=>this.stageScene?.viewYawDeg()??0;
spotlightShadowBudget=()=>this.stageScene?.spotlightShadowBudget()??Number.POSITIVE_INFINITY;
viewportFrameStats=()=>this.stageScene?.frameStats()??null;
canSaveVideo=()=>!!this.projectId;
selectObject=e=>{
this.objectsStore.selectObject(e),this.clearFocus()}
;
clearSelectionForWindow=()=>this.selectObject(null);
toggleSelect=e=>{
this.objectsStore.toggleSelect(e),this.clearFocus()}
;
setSelectedIds=e=>{
this.objectsStore.setSelectedIds(e),e.length&&this.clearFocus()}
;
setMode=e=>{
if(this.recording.peek())return;
e!=="edit"&&(this.editInteraction.set("idle"),this.performanceStore.stopPlaySession());
const n=this.mode.peek()==="camera"&&e==="edit";
e==="camera"?this.objectsStore.clearSelection():this.cameraStore.clearFilmingCamera(),this.mode.set(e),n&&this.manualFlight.peek()&&this.finishManualFlight([]),e==="edit"&&(this.lastFlight=null)}
;
hubTakeLocked=()=>this.recording.peek()?.kind!=="hub"?!1:(ot.error(_._({
id:"hN0wfY"}
)),!0);
deleteObject=e=>{
const n=this.objects.peek()[e]?.kind;
if(!((n==="camera"||n==="target")&&this.hubTakeLocked()))for(const r of this.objectsStore.deleteObject(e))this.performanceStore.removeCharacterTracks(r)}
;
deleteSelected=()=>{
for(const e of[...this.selectedIds.peek()])this.deleteObject(e)}
;
switchPersonKind=(e,n,r)=>{
const s=this.objects.peek()[e];
if(!s||!el(s.kind)||s.kind===n)return null;
const a=n==="simple_figure"?UNr(e,s,this.show.peek().tracks):null,o=a?Yqt(a):0;
if(o>0&&!r.removeHumanOnly)return a;
for(const l of a?.items??[])this.removePerformanceItem(l.trackId,l.itemId);
return this.pendingPoses.delete(e),this.objectsStore.setPersonKind(e,n),this.analytics?.recordPersonSwitched({
toKind:n,source:r.source,removedActionCount:o}
),null}
;
pickPersonKind=(e,n,r)=>{
const s=o=>{
this.beginEditGesture();
try{
return this.switchPersonKind(e,n,{
source:r,removeHumanOnly:o}
)}
finally{
this.endEditGesture()}
}
,a=s(!1);
a&&ot.error(zNr(this.objects.peek()[e]?.name,a),{
action:{
label:_._({
id:"avAkAt"}
),onClick:()=>s(!0)}
}
)}
;
deleteFocused=()=>{
const e=this.performanceStore.selectedSegment.peek();
if(e?.tS!=null){
this.performanceStore.deleteSelectedKeyframe();
return}
if(e){
this.removePerformanceItem(e.trackId,e.itemId);
return}
const n=this.performanceStore.selectedTrack.peek();
if(n){
this.removePerformanceTrack(n.trackId);
return}
this.deleteSelected()}
;
screenshotCamera=async e=>{
this.screenshotEpoch.set(c=>c+1);
const n=this.projectId;
if(!n||this.screenshotInFlight)return;
const r=this.captureCameraImage(e,!0);
if(!r){
ot.error(_._({
id:"cUzfvc"}
));
return}
const s=this.recordAspect.peek();
this.analytics?.recordScreenshotCaptured({
aspect:s,projectId:n}
);
const{
width:a,height:o}
=Am(s);
this.screenshotInFlight=!0;
const l=ot.loading(_._({
id:"Xa6uWn"}
));
try{
const c=await this.videoSaver.save({
projectId:n,kind:"image",blob:gGt(r),mimeType:"image/png",width:a,height:o,title:CGt(this.objects.peek(),[e])[0]||void 0,stage:this.stageStamp(e)}
);
this.analytics?.recordScreenshotSaved({
projectId:n,nodeId:c}
);
const d=this.onOpenCanvasNodes;
ot.success(_._({
id:"m28zfU"}
),{
id:l,action:d?{
label:_._({
id:"K7GaO4"}
),onClick:()=>d([c])}
:void 0}
)}
catch(c){
console.error("[Stage] screenshot save failed",c),ot.error(_._({
id:"GycVC9"}
),{
id:l}
)}
finally{
this.screenshotInFlight=!1}
}
;
stageStamp=e=>{
const n=this.activeSceneId.peek();
if(!n||!e)return;
const{
azimuthDeg:r,elevationDeg:s}
=this.light.peek();
return{
sceneId:n,cameraId:e,light:{
azimuthDeg:r,elevationDeg:s}
}
}
;
takeMedia=(e,n,r,s)=>({
projectId:e,kind:"video",blob:n.videoBlob,mimeType:n.videoMimeType,width:n.width??rKr,height:n.height??sKr,durationS:n.durationS,title:r||void 0,stage:this.stageStamp(s),normalize:!n.canonical}
);
saveVideo=async e=>{
const n=this.projectId,r=this.outputs.peek(),s=r?.[e];
if(!n||!s||this.savingTake.peek()!=null||this.isTakeSaved(e))return!1;
this.savingTake.set(e);
try{
const a=await this.videoSaver.save(this.takeMedia(n,s,this.outputCameraLabels.peek()[e],this.outputCameraIds.peek()[e]));
return ot.success(_._({
id:"vMN35D"}
)),this.savedVideos.set([...this.savedVideos.peek(),{
takeIndex:e,nodeId:a}
]),this.analytics?.recordVideoSaved({
takeIndex:e,totalTakes:r.length,projectId:n,nodeId:a}
),!0}
catch(a){
return console.error("[Stage] video save failed",a),ot.error(_._({
id:"6sI9KK"}
)),!1}
finally{
this.savingTake.set(null)}
}
;
saveAllVideos=async()=>{
const e=this.outputs.peek();
if(e){
for(let n=0;
n<e.length;
n++)if(!this.isTakeSaved(n)&&!await this.saveVideo(n))return}
}
;
isTakeSaved=e=>this.savedVideos.peek().some(n=>n.takeIndex===e);
snapshotSceneState=()=>({
objects:this.objects.peek(),show:this.show.peek(),recordAspect:this.recordAspect.peek(),light:this.light.peek()}
);
restoreSceneState=e=>{
const n=this.selectedIds.peek().filter(r=>r in e.objects);
this.performanceStore.loadShow(e.show,{
keepGesture:!0}
),this.objectsStore.loadObjects(e.objects),this.cameraStore.loadCameraSettings(e),n.length&&this.objectsStore.setSelectedIds(n)}
;
canRestoreHistory=()=>this.mode.peek()!=="review"&&!this.recording.peek()&&!this.manualFlight.peek()&&(this.editInteraction.peek()==="idle"||this.editInteraction.peek()==="editingPath");
undo=()=>{
this.canRestoreHistory()&&(this.objectsStore.commitColorPreview(),this.history.undo())}
;
redo=()=>{
this.canRestoreHistory()&&(this.objectsStore.commitColorPreview(),this.history.redo())}
;
beginEditGesture=()=>this.history.beginGesture();
endEditGesture=()=>this.history.endGesture();
pushHistoryCommand=e=>this.history.push(e);
toSceneJson=()=>s6r(this.snapshotSceneState());
copySceneJson=async()=>{
const e=JSON.stringify(this.toSceneJson(),null,2);
try{
await navigator.clipboard.writeText(e),ot.success(`Scene JSON copied (${
e.length}
 chars)`)}
catch(n){
console.warn("[stage] clipboard refused the scene JSON",n,e),ot.error("Clipboard refused it. The JSON is in the console.")}
}
;
trackSceneJson=()=>{
this.objects.get(),this.show.get(),this.recordAspect.get(),this.light.get()}
;
loadSceneJson=e=>{
const n=iGt(e);
return n?(this.lastFlight=null,this.history.reset(()=>{
this.performanceStore.loadShow(n.show),this.objectsStore.loadObjects(n.objects),this.cameraStore.loadCameraSettings({
recordAspect:n.recordAspect??"16:9",light:n.light??kDe}
)}
),!0):(console.warn("Stage: scene could not be read, keeping an empty scene"),ot.error(_._({
id:"4mzmxk"}
),{
duration:1/0}
),!1)}
;
dispose=()=>{
this.stopFirstCameraWait?.();
for(const e of this.disposers)e();
this.history.dispose(),this.performanceStore.dispose(),this.cameraStore.dispose()}
}
const Yot="stage-panel-layout",ore={
leftWidthPx:{
min:280,max:480,fallback:280}
,rightWidthPx:{
min:200,max:520,fallback:260}
,chatWidthPx:{
min:280,max:560,fallback:340}
,bottomHeightPx:{
min:180,max:560}
}
,Qot=["leftWidthPx","rightWidthPx","chatWidthPx"],Jot=["chatCollapsed","magnetEnabled","componentsHidden"];
function Xj(t,e){
const{
min:n,max:r}
=ore[t];
return Math.min(r,Math.max(n,Math.round(e)))}
function lKr(){
try{
return window.localStorage}
catch{
return null}
}
class cKr{
construct