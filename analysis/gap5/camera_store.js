startFilming=e=>{
const n=e??this.activeCameraId();
!n||this.a.objects.peek()[n]?.kind!=="camera"||(this.filmingCameraId.set(n),this.a.setMode("camera"))}
;
clearFilmingCamera=()=>{
this.filmingCameraId.set(null)}
;
exitCameraMode=()=>{
if(this.a.mode.peek()==="camera"){
if(this.recording.peek()){
this.toggleRecording();
return}
this.a.setMode("edit")}
}
;
captureViewport=()=>this.scene?.captureViewport()??null;
captureCameraImage=(e,n=!1)=>this.scene?.captureCamera(e,n)??null;
beginRecording=async(e,n)=>{
if(!(!this.scene||this.recording.peek())){
this.recording.set({
kind:e,phase:"starting"}
);
try{
if(await n(),this.disposed)return;
this.recording.set({
kind:e,phase:"active"}
)}
catch{
this.recording.set(null),this.onFilmed=null,this.filmingCameraIds.set([]),this.rollingCameraIds.set([]),this.disposed||ot.error(_._({
id:"d8nNlc"}
))}
}
}
;
finishRecording=async(e,n)=>{
const r=this.recording.peek();
!this.scene||r?.kind!==e||r.phase!=="active"||(this.recording.set({
kind:e,phase:"stopping"}
),await this.settleRecording(n))}
;
captureRecording=async(e,n)=>{
!this.scene||this.recording.peek()||(this.recording.set({
kind:e,phase:"active"}
),await this.settleRecording(n))}
;
settleRecording=async e=>{
const n=this.recording.peek()?.kind??"unknown";
this.lastFailure=void 0;
let r;
try{
r=await e()}
catch(d){
if(this.recording.set(null),this.onFilmed=null,!this.disposed&&!(d instanceof kY)&&ot.error(_._({
id:"d8nNlc"}
)),!this.disposed){
const u=this.lastFailure;
this.a.onTakeFailed?.({
kind:n,aspect:this.recordAspect.peek(),reason:u?.reason??"capture_error",cameraCount:u?.cameraCount,failedCount:u?.failedCount,bestFailedFps:u?.bestFailedFps,finalizeMs:this.lastFinalizeMs}
)}
this.lastFailure=void 0,this.lastFinalizeMs=void 0;
return}
this.recording.set(null);
const s=this.onFilmed;
if(this.onFilmed=null,this.disposed)return;
const a=this.filmingCameraId.peek(),o=n==="hub"?[...this.takeCameraIds]:n==="manual"&&a?[a]:[],l=CGt(this.a.objects.peek(),o);
s?s(r.map((d,u)=>({
output:d,cameraId:o[u],cameraLabel:l[u]??""}
))):(this.outputs.set(r),this.outputCameraLabels.set(l),this.outputCameraIds.set(o));
const c=Math.max(0,...r.map(d=>d?.durationS??0));
c>0&&c<Sie&&ot.warning(_._({
id:"B3Gy2q",values:{
0:c.toFixed(1)}
}
)),s||(this.manualReviewCameraId.set(n==="manual"?this.filmingCameraId.peek():null),this.a.setMode("review")),this.a.onTakeRecorded?.({
kind:n,aspect:this.recordAspect.peek(),takeCount:r.length,takePath:n==="hub"&&this.offlineTake?"offline":"realtime",minClipFps:Vrt(r)[0],minEncodedFps:tTr(r)[0],finalizeMs:this.lastFinalizeMs,source:s?"scene_node":void 0}
),this.lastFinalizeMs=void 0}
;
toggleRecording=async()=>{
if(!this.scene||this.a.mode.peek()!=="camera")return;
const e=this.recording.peek();
e===null?(this.onFilmed=this.manualOnFilmed,await this.beginRecording("manual",()=>this.scene.startRecording())):e.kind==="manual"&&e.phase==="active"&&await this.finishRecording("manual",()=>this.scene.stopRecording().then(n=>[n]))}
;
startHubRecording=async(e,n)=>{
if(!this.scene||this.recording.peek()||this.hubStarting)return;
const r=e??this.activeHubCameraIds();
if(r.length===0)return;
this.hubStarting=!0;
try{
this.hubCameraIds=r;
const a=r.slice(0,Jw);
this.isPreviewPlaying.set(!1),this.filmingCameraId