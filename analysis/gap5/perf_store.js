selectedSegment.set(null);
return}
const c="keys"in l&&l.keys.some(d=>Math.abs(d.tS-o.tS)<=ym);
o.tS!=null&&!c&&this.selectedSegment.set({
trackId:o.trackId,itemId:o.itemId}
)}
)),this.disposers.push(qt(()=>{
const o=this.selectedTrack.get();
if(!o)return;
this.show.get().tracks.some(c=>c.id===o.trackId)||this.selectedTrack.set(null)}
)),this.disposers.push(qt(()=>{
const o=this.playSession.get();
o&&this.selectedSegment.get()?.itemId!==o.itemId&&this.stopPlaySession()}
)),s&&this.disposers.push(qt(()=>{
s.get()?this.playPerformance():this.isPerformancePlaying.peek()&&this.stopPerformance()}
))}
show=Ne({
name:"Show",tracks:[]}
);
isPerformancePlaying=Ne(!1);
performanceSeekS=Ne(null);
performanceTimeS=Ne(0);
performancePaint=Ne(null);
selectedSegment=Ne(null);
selectedTrack=Ne(null);
playPointerLocked=Ne(!1);
playSession=Ne(null);
playKeymap=Ne(()=>{
const e=this.playSession.get();
if(!e)return[];
const n=this.findPlayItem(e);
return n?qzt.flatMap(r=>{
const s=n.keymap[r];
return s?[{
key:r,clip:s}
]:[]}
):[]}
);
manualFlight=Ne(null);
draggingAction=Ne(null);
disposers=[];
updateShow=e=>{
this.show.set(e(this.show.peek()))}
;
updateTrackItems=(e,n)=>{
this.updateShow(r=>({
...r,tracks:r.tracks.map(s=>s.id===e?{
...s,items:lje(n(s.items))}
:s)}
))}
;
removeCharacterTracks=e=>{
const n=this.show.peek();
n.tracks.some(r=>r.characterId===e)&&this.show.set({
...n,tracks:n.tracks.filter(r=>r.characterId!==e)}
)}
;
tracksFor=e=>{
const n=new Set(e);
return structuredClone(this.show.peek().tracks.filter(r=>n.has(r.characterId)))}
;
insertClonedTracks=(e,n)=>{
const r=o=>o==null?o:n.get(o)??o,s=[];
for(const o of e){
const l=n.get(o.characterId);
l&&s.push({
id:an(),characterId:l,items:o.items.map(c=>{
const d={
...c,id:an()}
;
return d.kind==="path"&&(d.subjectId=r(d.subjectId)),d.kind==="revolve"&&(d.centerObjectId=r(d.centerObjectId)),d.kind==="cam-move"&&(d.subjectId=r(d.subjectId)),d.kind==="cam-path"&&(d.subjectId=r(d.subjectId)),d.kind==="cam-still"&&(d.subjectId=r(d.subjectId)),d.kind==="cam-follow"&&(d.objectId=r(d.objectId)),d}
)}
)}
if(s.length===0)return;
const a=this.show.peek();
this.show.set({
...a,tracks:[...a.tracks,...s]}
)}
;
addPerformanceTrack=e=>{
const n=this.show.peek(),r=this.objects.peek();
if(!Xzt(r[e]?.kind)||Xu(r,e)||n.tracks.some(a=>a.characterId===e))return null;
const s=an();
return this.show.set({
...n,tracks:[...n.tracks,{
id:s,characterId:e,items:[]}
]}
),s}
;
addTrackForObject=e=>{
this.addPerformanceTrack(e)}
;
addDefaultCameraTrack=e=>{
const n=this.addPerformanceTrack(e);
n&&this.appendCameraItem(n,"still")}
;
setDraggingAction=e=>this.draggingAction.set(e);
clearDraggingAction=()=>this.draggingAction.set(null);
resolveActionForObject=(e,n)=>a$(n,this.objects.peek()[e]?.kind);
canDropActionOnObject=(e,n)=>this.canOwnTrack(e)&&this.resolveActionForObject(e,n)!==null;
canOwnTrack=e=>!Xu(this.objects.peek(),e);
addActionToTrack=(e,n,r)=>{
const s=this.show.peek().tracks.find(o=>o.id===e);
if(!s)return;
const a=this.resolveActionForObject(s.characterId,n);
if(a)switch(a.kind){
case"path":this.addPathItem(e,r);
break;
case"play":this.addPlayItem(e,r);
break;
case"clip":this.addClipItem(e,a.clip,r);
break;
case"camera":this.addCameraItem(e,a.action,r);
break;
case"object":switch(a.action){
case"rotate":this.addRotateItem(e,r);
break;
case"revolve":this.addRevolveItem(e,r);
break;
case"scale-up":this.addScaleItem(e,AHr,r);
break;
case"scale-down":this.addScaleItem(e,CHr,r);
break;
case"transform":this.addTransformItem(e,r);
break;
case"rig-transform":this.addRigTransformItem(e,r);
break}
break}
}
;
appendActionToObject=(e,n)=>{
if(!this.canDropActionOnObject(e,n))return;
const s=this.show.peek().tracks.find(a=>a.characterId===e)?.id??this.addPerformanceTrack(e);
s&&this.addActionToTrack(s,n)}
;
removePerformanceTrack=e=>{
this.updateShow(n=>({
...n,tracks:n.tracks.filter(r=>r.id!==e)}
))}
;
placeItemS=(e,n,r)=>r===void 0?MP(e):W5r(e,n,r);
isHumanoidTrack=e=>this.trackObjectKind(e)==="humanoid";
isAnimatableTrack=e=>Q0(this.trackObjectKind(e));
trackObjectKind=e=>{
const n=this.show.peek().tracks.find(r=>r.id===e);
return n?this.objects.peek()[n.characterId]?.kind:void 0}
;
addClipItem=(e,n,r)=>{
if(!this.isHumanoidTrack(e))return null;
const s=an(),a=N8;
return this.updateTrackItems(e,o=>[...o,{
id:s,kind:"clip",clip:n,durationS:a,startS:this.placeItemS(o,a,r)}
]),this.selectedSegment.set({
trackId:e,itemId:s}
),s}
;
addPlayItem=(e,n)=>{
if(!this.isHumanoidTrack(e))return null;
const r=an();
return this.updateTrackItems(e,s=>[...s,{
id:r,kind:"play",durationS:0,samples:[],keymap:{
}
,startS:this.placeItemS(s,0,n)}
]),this.selectedSegment.set({
trackId:e,itemId:r}
),r}
;
updatePlayItemKey=(e,n,r,s)=>{
this.updateTrackItems(e,a=>a.map(o=>{
if(o.id!==n||o.kind!=="play")return o;
const l={
...o.keymap}
;
return s?l[r]=s:delete l[r],{
...o,keymap:l}
}
))}
;
addObjectItem=(e,n,r,s,a=!0)=>{
if(!this.show.peek().tracks.find(c=>c.id===e)||!this.isAnimatableTrack(e))return null;
const l=an();
return this.updateTrackItems(e,c=>[...c,r(l,this.placeItemS(c,n,s),n)]),a&&this.selectedSegment.set({
trackId:e,itemId:l}
),l}
;
addRotateItem=(e,n)=>this.addObjectItem(e,N8,(r,s,a)=>({
id:r,kind:"rotate",axis:"y",degPerS:SHr,durationS:a,startS:s}
),n);
addRevolveItem=(e,n)=>this.addObjectItem(e,N8,(r,s,a)=>({
id:r,kind:"revolve",centerObjectId:this.firstOtherObjectId(e),degPerS:THr,durationS:a,startS:s}
),n);
addScaleItem=(e,n,r)=>this.addObjectItem(e,N8,(s,a,o)=>({
id:s,kind:"scale",factor:n,durationS:o,startS:a}
),r);
addTransformItem=(e,n)=>this.addObjectItem(e,Jae,(r,s,a)=>({
id:r,kind:"transform",durationS:a,keys:[],startS:s}
),n);
addRigTransformItem=(e,n,r=!0)=>{
const s=this.show.peek().tracks.find(a=>a.id===e);
return!s||this.objects.peek()[s.characterId]?.kind!=="humanoid"?null:this.addObjectItem(e,Jae,(a,o,l)=>({
id:a,kind:"rig-transform",durationS:l,keys:[],startS:o}
),n,r)}
;
startManualFlight=(e,n)=>{
if(this.recording.peek()!==null)return null;
const r=this.show.peek().tracks.find(a=>a.id===e),s=r?.items.find(a=>a.id===n);
return!r||s?.kind!=="cam-manual"||this.objects.peek()[r.characterId]?.kind!=="camera"?null:(this.isPerformancePlaying.set(!1),this.manualFlight.set({
trackId:e,itemId:n}
),r.characterId)}
;
finishManualFlight=e=>{
const n=this.manualFlight.peek();
this.manualFlight.set(null),!(!n||e.length===0)&&this.updateTrackItems(n.trackId,r=>r.map(s=>s.id===n.itemId&&s.kind==="cam-manual"?{
...s,samples:e,durationS:e.length/qA,shakeBaked:!0}
:s))}
;
addCameraItem=(e,n,r,s,a)=>{
const o=this.appendCameraItem(e,n,r,s,a);
return o&&this.selectedSegment.set({
trackId:e,itemId:o}
),o}
;
appendCameraItem=(e,n,r,s,a)=>{
const o=this.show.peek().tracks.find(f=>f.id===e);
if(!o)return null;
const l=o.characterId;
if(this.objects.peek()[l]?.kind!=="camera")return null;
const c=an(),d=sje(n),u=this.placeItemS(o.items,d,r),h=s===void 0?this.firstSubjectId():s;
return this.updateTrackItems(e,f=>[...f,LHr(n,c,u,d,h)]),n==="path"?(this.enterPathEdit(e,c),a?.seedStart!==!1&&this.seedPathStart(l)):n!=="still"&&h&&this.aimCameraAtSubject(l,o.items,c,u,h),c}
;
aimCameraAtSubject=(e,n,r,s,a,o=0)=>{
if(!this.updateObjectTransform||n.some(g=>g.startS<s&&Fp(g)&&g.kind!=="cam-still"))return;
const c=this.objects.peek(),d=c[e],u=this.subjectAimPoint(a,o);
if(!d||!u)return;
const h=d.targetId,f=h?c[h]:void 0,m=n.some(g=>g.id!==r&&YN(g));
h&&f&&h!==a&&!m&&this.updateObjectTransform(h,{
position:s$(f,c,u)}
),this.turnCameraToward(e,u)}
;
subjectAimPoint=(e,n=0)=>{
const r=this.objects.peek(),s=r[e];
if(!s)return null;
const a=Zo(s,r).position;
return[a[0],a[1]+NP(e,r)+n,a[2]]}
;
turnCameraToward=(e,n)=>{
const r=this.objects.peek(),s=r[e];
if(!s||!this.updateObjectTransform)return;
const a=Zo(s,r);
this.updateObjectTransform(e,{
rotation:cN(s,r,{
...a,rotation:kv(a.position,n)}
).rotation}
)}
;
firstSubjectId=()=>{
const e=this.objects.peek();
for(const[n,r]of Object.entries(e))if(el(r.kind))return n;
for(const[n,r]of Object.entries(e))if(Q0(r.kind)&&r.kind!=="spotlight")return n;
return null}
;
firstOtherObjectId=e=>{
const r=this.show.peek().tracks.find(s=>s.id===e)?.characterId;
for(const[s,a]of Object.entries(this.objects.peek()))if(s!==r&&Q0(a.kind)&&a.kind!=="spotlight")return s;
return null}
;
updateObjectItem=(e,n,r)=>{
this.updateTrackItems(e,s=>s.map(a=>a.id===n&&aN(a)?r(a):a))}
;
clampObjectDuration=e=>Math.min(QZt,Math.max(Ije,e));
setObjectItemDuration=(e,n,r)=>{
if(Number.isNaN(r))return;
const s=this.clampObjectDuration(r);
this.updateObjectItem(e,n,a=>({
...a,durationS:s}
))}
;
setCameraItemDuration=(e,n,r)=>{
if(Number.isNaN(r))return;
const s=this.clampObjectDuration(r);
this.updateTrackItems(e,a=>a.map(o=>o.id===n&&Fp(o)?{
...o,durationS:s}
:o))}
;
addCameraKeyframe=(e,n,r)=>{
this.updateTrackItems(e,s=>s.map(a=>{
if(a.id!==n||a.kind!=="cam-transform")return a;
const o=a.keys.filter(l=>Math.abs(l.tS-r.tS)>ym).concat(r).sort((l,c)=>l.tS-c.tS);
return{
...a,keys:o,durationS:Math.max(a.durationS,o[o.length-1].tS)}
}
))}
;
removeCameraKeyframe=(e,n,r)=>{
this.updateTrackItems(e,s=>s.map(a=>a.id===n&&a.kind==="cam-transform"?{
...a,keys:a.keys.filter(o=>Math.abs(o.tS-r)>ym)}
:a))}
;
moveCameraKeyframe=(e,n,r,s)=>{
this.updateTrackItems(e,a=>a.map(o=>o.id===n&&o.kind==="cam-transform"?{
...o,keys:xbe(o.keys,r,s)}
:o))}
;
captureFocusedCameraPose=e=>{
const n=this.selectedSegment.peek();
if(!n)return!1;
const r=this.findItem(n),s=this.show.peek().tracks.find(d=>d.id===n.trackId);
if(r?.kind!=="cam-transform"||!s)return!1;
const a=this.performanceTimeS.peek()-r.startS;
if(a<0||a>r.durationS)return!1;
const o=this.objects.peek(),l=o[s.characterId];
if(!l)return!1;
const c=e??Zo(l,o);
return this.addCameraKeyframe(n.trackId,n.itemId,{
tS:a,position:[...c.position],rotation:[...c.rotation],focalLengthMm:e?.focalLengthMm??l.focalLengthMm??Hv}
),!0}
;
setCameraItemFields=(e,n,r)=>{
this.updateTrackItems(e,s=>s.map(a=>a.id===n&&Fp(a)?OHr(a,r):a)),(r.subjectId!==void 0||r.aimOffsetUnits!==void 0)&&this.reaimCameraItem(e,n)}
;
reaimCamera=e=>{
const n=this.show.peek().tracks.find(s=>s.characterId===e),r=n?.items.find(s=>s.kind==="cam-move");
n&&r&&this.reaimCameraItem(n.id,r.id)}
;
reaimCameraItem=(e,n)=>{
const r=this.show.peek().tracks.find(o=>o.id===e),s=r?.items.find(o=>o.id===n);
if(!r||s?.kind!=="cam-move"||!yP.includes(s.move))return;
const a=s.subjectId??(YN(s)?this.objects.peek()[r.characterId]?.targetId:void 0);
a&&this.aimCameraAtSubject(r.characterId,r.items,n,s.startS,a,$6(s))}
;
setRotateAxis=(e,n,r)=>{
this.updateObjectItem(e,n,s=>s.kind==="rotate"?{
...s,axis:r}
:s)}
;
setObjectItemSpeed=(e,n,r)=>{
Number.isNaN(r)||this.updateObjectItem(e,n,s=>s.kind==="rotate"||s.kind==="revolve"?{
...s,degPerS:r}
:s)}
;
setRevolveCenter=(e,n,r)=>{
this.updateObjectItem(e,n,s=>s.kind==="revolve"?{
...s,centerObjectId:r}
:s)}
;
setScaleFactor=(e,n,r)=>{
Number.isNaN(r)||r<=0||this.updateObjectItem(e,n,s=>s.kind==="scale"?{
...s,factor:r}
:s)}
;
addTransformKeyframe=(e,n,r)=>{
this.updateObjectItem(e,n,s=>{
if(s.kind!=="transform")return s;
const a=d=>Math.abs(d.tS-r.tS)<=ym,o=r.headRotation??s.keys.find(a)?.headRotation,l=s.keys.filter(d=>!a(d)).concat(o?{
...r,headRotation:o}
:r).sort((d,u)=>d.tS-u.tS),c=Math.max(s.durationS,l[l.length-1].tS);
return{
...s,keys:l,durationS:c}
}
)}
;
removeTransformKeyframe=(e,n,r)=>{
this.updateObjectItem(e,n,s=>s.kind==="transform"?{
...s,keys:s.keys.filter(a=>Math.abs(a.tS-r)>ym)}
:s)}
;
moveTransformKeyframe=(e,n,r,s)=>{
this.updateObjectItem(e,n,a=>a.kind==="transform"?{
...a,keys:xbe(a.keys,r,s)}
:a)}
;
addRigKeyframe=(e,n,r)=>{
this.updateObjectItem(e,n,s=>{
if(s.kind!=="rig-transform")return s;
const a=s.keys.find(d=>Math.abs(d.tS-r.tS)<=ym),o={
tS:a?.tS??r.tS,joints:{
...a?.joints,...r.joints}
}
,l=s.keys.filter(d=>d!==a).concat(o).sort((d,u)=>d.tS-u.tS),c=Math.max(s.durationS,l[l.length-1].tS);
return{
...s,keys:l,durationS:c}
}
)}
;
addSampledRigKeyframe=(e,n,r,s={
}
)=>{
const a=this.show.peek().tracks.find(c=>c.id===e),o=a?.items.find(c=>c.id===n);
if(o?.kind!=="rig-transform")return;
const l=T2r(a.items,o.startS+r);
this.addRigKeyframe(e,n,{
tS:r,joints:{
...l?$zt(l):{
}
,...s}
}
)}
;
removeRigKeyframe=(e,n,r)=>{
this.updateObjectItem(e,n,s=>s.kind==="rig-transform"?{
...s,keys:s.keys.filter(a=>Math.abs(a.tS-r)>ym)}
:s)}
;
moveRigKeyframe=(e,n,r,s)=>{
this.updateObjectItem(e,n,a=>a.kind==="rig-transform"?{
...a,keys:xbe(a.keys,r,s)}
:a)}
;
captureFocusedRigPose=e=>{
const n=this.selectedSegment.peek();
if(!n)return;
const r=this.findItem(n);
if(!r||r.kind!=="rig-transform")return;
const s=this.performanceTimeS.peek()-r.startS;
s<0||s>r.durationS||this.addSampledRigKeyframe(n.trackId,n.itemId,s,e)}
;
captureFocusedTransformPose=e=>{
const n=this.selectedSegment.peek();
if(!n)return!1;
const r=this.findItem(n),s=this.show.peek().tracks.find(l=>l.id===n.trackId);
if(!r||r.kind!=="transform"||!s)return!1;
const a=this.performanceTimeS.peek()-r.startS;
if(a<0||a>r.durationS)return!1;
const o=e??this.objects.peek()[s.characterId];
return o?(this.addTransformKeyframe(n.trackId,n.itemId,{
tS:a,position:[...o.position],rotation:[...o.rotation],scale:[...o.scale],...e?.headRotation&&{
headRotation:[...e.headRotation]}
}
),!0):!1}
;
findItem=e=>this.show.peek().tracks.find(n=>n.id===e.trackId)?.items.find(n=>n.id===e.itemId);
findPlayItem=e=>{
const n=this.findItem(e);
return n?.kind==="play"?n:void 0}
;
clearFocus=()=>{
this.selectedSegment.set(null),this.selectedTrack.set(null)}
;
selectSegment=(e,n)=>{
this.selectedTrack.set(null),this.selectedSegment.set({
trackId:e,itemId:n}
)}
;
selectKeyframe=(e,n,r)=>{
this.selectedTrack.set(null),this.selectedSegment.set({
trackId:e,itemId:n,tS:r}
)}
;
deleteSelectedKeyframe=()=>{
const e=this.selectedSegment.peek();
if(e?.tS==null)return;
const n=this.findItem(e);
n?.kind==="rig-transform"?this.removeRigKeyframe(e.trackId,e.itemId,e.tS):n?.kind==="transform"?this.removeTransformKeyframe(e.trackId,e.itemId,e.tS):n?.kind==="cam-transform"&&this.removeCameraKeyframe(e.trackId,e.itemId,e.tS)}
;
selectTrack=e=>{
this.selectedSegment.set(null),this.selectedTrack.set({
trackId:e}
)}
;
startPlaySession=(e,n)=>{
if(this.recording.peek()!==null)return;
const r=this.show.peek().tracks.find(a=>a.id===e),s=r?.items.find(a=>a.id===n);
!r||s?.kind!=="play"||this.objects.peek()[r.characterId]?.kind==="humanoid"&&(this.isPerformancePlaying.set(!1),this.performanceSeekS.set(null),this.editInteraction.set("idle"),this.selectedSegment.set({
trackId:e,itemId:n}
),this.playSession.set({
trackId:e,itemId:n,characterId:r.characterId,recording:!1}
))}
;
stopPlaySession=()=>{
const e=this.playSession.peek();
e&&(e.recording&&this.playSession.set({
...e,recording:!1}
),this.playSession.set(null))}
;
setPlayPointerLocked=e=>{
this.playPointerLocked.set(e)}
;
setPlayRecording=e=>{
const n=this.playSession.peek();
!n||n.recording===e||this.playSession.set({
...n,recording:e}
)}
;
finishPlayRecording=e=>{
const n=this.playSession.peek();
!n||!this.findPlayItem(n)||this.updateTrackItems(n.trackId,r=>r.map(s=>s.id===n.itemId&&s.kind==="play"?{
...s,samples:e,durationS:e.length/qA}
:s))}
;
addPathItem=(e,n,r)=>{
if(!this.isAnimatableTrack(e))return null;
const s=this.show.peek().tracks.find(l=>l.id===e).characterId,a=an(),o=this.isHumanoidTrack(e);
return this.updateTrackItems(e,l=>[...l,{
id:a,kind:"path",anchors:[],speedUnitsPerS:Htt,...o?{
gait:JCe}
:{
}
,startS:this.placeItemS(l,0,n)}
]),this.enterPathEdit(e,a),r?.seedStart!==!1&&this.seedPathStart(s),a}
;
seedPathStart=e=>{
const n=this.objects.peek(),r=n[e];
r&&this.appendPathAnchor([...Zo(r,n).position])}
;
enterPathEdit=(e,n)=>{
this.selectedSegment.set({
trackId:e,itemId:n}
),this.performancePaint.set({
trackId:e,itemId:n,selectedAnchor:null}
),this.editInteraction.set("editingPath")}
;
currentEditPathItem=()=>{
const e=this.performancePaint.peek();
if(!e)return null;
const n=this.show.peek().tracks.find(r=>r.id===e.trackId)?.items.find(r=>r.id===e.itemId);
return n&&g2(n)?n:null}
;
patchPathAnchors=e=>{
const n=this.performancePaint.peek();
n&&this.updateTrackItems(n.trackId,r=>r.map(s=>{
if(s.id!==n.itemId||!g2(s))return s;
const a=e(s.anchors);
if(s.kind==="cam-path"&&s.heightCurve&&!HHr(s.anchors,a)){
const{
heightCurve:o,...l}
=s;
return{
...l,anchors:a}
}
return{
...s,anchors:a}
}
))}
;
setPathHeightCurve=(e,n,r)=>this.show.peek().tracks.find(a=>a.id===e)?.items.find(a=>a.id===n)?.kind!=="cam-path"||!Kzt(r)?!1:(this.updateTrackItems(e,a=>a.map(o=>o.id===n?{
...o,heightCurve:r}
:o)),!0);
currentEditPathOwner=()=>{
const e=this.performancePaint.peek(),n=e?this.show.peek().tracks.find(r=>r.id===e.trackId):void 0;
return n?this.objects.peek()[n.characterId]??null:null}
;
editingFlownPath=()=>{
const e=this.currentEditPathOwner();
return!!e&&!el(e.kind)}
;
anchorPosFor=(e,n)=>{
if(!this.editingFlownPath())return e;
const r=this.currentEditPathItem()?.anchors??[],s=r[Math.min(Math.max(n,0),r.length-1)],a=this.currentEditPathOwner(),o=s?s.pos[1]:a?Zo(a,this.objects.peek()).position[1]:e[1];
return[e[0],o,e[2]]}
;
selectPathAnchor=e=>{
const n=this.performancePaint.peek();
n&&this.performancePaint.set({
...n,selectedAnchor:e}
)}
;
appendPathAnchor=(e,n)=>{
const r=n?.exactHeight?e:this.anchorPosFor(e,(this.currentEditPathItem()?.anchors.length??1)-1);
this.patchPathAnchors(a=>mT([...a.map(o=>o.pos),r]));
const s=this.currentEditPathItem();
s&&this.selectPathAnchor(s.anchors.length-1)}
;
insertPathAnchor=(e,n)=>{
const r=this.anchorPosFor(n,e);
this.patchPathAnchors(s=>{
const a=s.map(o=>o.pos);
return a.splice(e+1,0,r),mT(a)}
),this.selectPathAnchor(e+1)}
;
movePathAnchor=(e,n)=>{
const r=this.anchorPosFor(n,e);
this.patchPathAnchors(s=>s.map((a,o)=>o===e?{
...a,pos:r}
:a))}
;
setPathAnchorHeight=(e,n)=>{
this.editingFlownPath()&&this.patchPathAnchors(r=>r.map((s,a)=>a===e?{
...s,pos:[s.pos[0],n,s.pos[2]]}
:s))}
;
movePathHandle=(e,n,r,s)=>{
const a=n==="out"?"in":"out",o=c=>c===0?0:-c,l=[o(r[0]),o(r[1]),o(r[2])];
this.patchPathAnchors(c=>c.map((d,u)=>u===e?{
...d,[n]:r,...s?.break?{
}
:{
[a]:l}
}
:d))}
;
deletePathAnchor=e=>{
this.patchPathAnchors(n=>mT(n.filter((r,s)=>s!==e).map(r=>r.pos))),this.selectPathAnchor(null)}
;
finishPerformancePaint=()=>{
const e=this.performancePaint.peek();
if(!e)return;
this.performancePaint.set(null),this.editInteraction.peek()==="editingPath"&&this.editInteraction.set("idle");
const n=this.show.peek().tracks.find(r=>r.id===e.trackId)?.items.find(r=>r.id===e.itemId);
n&&g2(n)&&n.anchors.length<2&&this.removePerformanceItem(e.trackId,e.itemId)}
;
updatePathItemSpeed=(e,n,r)=>{
if(Number.isNaN(r))return;
const s=Math.max(Qae,r);
this.updateTrackItems(e,a=>a.map(o=>o.id===n&&g2(o)?{
...o,speedUnitsPerS:s}
:o))}
;
updatePathItemGait=(e,n,r)=>{
this.isHumanoidTrack(e)&&this.updateTrackItems(e,s=>s.map(a=>a.id===n&&a.kind==="path"?{
...a,gait:r}
:a))}
;
updatePathItemAim=(e,n,r,s)=>{
this.updateTrackItems(e,a=>a.map(o=>o.id===n&&o.kind==="path"?{
...o,aim:r,...r==="subject"?{
subjectId:s}
:{
}
}
:o))}
;
replaceMoveFromSamples=(e,n,r,s)=>{
const a=this.objects.peek(),o=a[e],l=o?.kind==="camera";
if(!o||!(l||Q0(o.kind)))return!1;
const c=vHr(r);
if(!c)return!1;
const d=this.trackIdOf(e)??this.addPerformanceTrack(e);
if(!d)return!1;
const u=Zo(o,a).position[1],h=mT(c.points.map(([v,x])=>[v,u,x])),f=s?.steady?l?YZt:Htt:Math.max(Qae,MR(nx(h))/c.durationS),m=this.moveSegmentOf(d,n),g=s?.focusId&&s.focusId!==e&&a[s.focusId]?s.focusId:null,b={
id:an(),startS:Math.max(0,n),anchors:h,speedUnitsPerS:f,...s?.steady?{
}
:{
pace:c.pace}
}
,y=l?{
...b,kind:"cam-path",aim:g?"subject":"locked",subjectId:g,...m&&"focalLengthMm"in m&&m.focalLengthMm!==void 0?{
focalLengthMm:m.focalLengthMm}
:{
}
}
:{
...b,kind:"path",...o.kind==="humanoid"?{
gait:JCe}
:{
}
,...el(o.kind)?g?{
aim:"subject",subjectId:g}
:{
}
:{
aim:"locked"}
}
;
return this.updateTrackItems(d,v=>[y,...v.filter(x=>x.id!==m?.id)]),!0}
;
shiftPaths=(e,n,r)=>{
const s=this.trackIdOf(e);
return(s?this.show.peek().tracks.find(o=>o.id===s).items:[]).some(Eit)?(n===0&&r===0||this.updateTrackItems(s,o=>o.map(l=>Eit(l)?{
...l,anchors:l.anchors.map(c=>({
...c,pos:[c.pos[0]+n,c.pos[1],c.pos[2]+r]}
))}
:l)),!0):!1}
;
setCameraFocus=(e,n,r)=>{
const s=this.objects.peek();
if(s[e]?.kind!=="camera"||n!==null&&(n===e||!s[n]))return!1;
const o=this.trackIdOf(e)??this.addPerformanceTrack(e);
if(!o)return!1;
const l=this.show.peek().tracks.find(y=>y.id===o).items,c=this.moveSegmentOf(o,this.performanceTimeS.peek()),d=c?.kind==="cam-path"||c?.kind==="cam-move"&&yP.includes(c.move);
if(c&&!d&&c.kind!=="cam-still")return!1;
const u=c?Cit(c):null;
if(n===null){
if(!c||!u)return!1;
const y=r?.lookingAt??this.subjectAimPoint(u,$6(c));
y&&this.keepLookOnClear(e,c,l,y)}
if(c&&d)return this.setCameraItemFields(o,c.id,{
...c.kind==="cam-path"?{
aim:"subject"}
:{
}
,subjectId:n}
),!0;
if(c?.kind==="cam-still"&&n===null)return this.setCameraItemFields(o,c.id,{
subjectId:null}
),!0;
const h=c?.startS??0,f=rx({
...this.show.peek(),tracks:this.show.peek().tracks.filter(y=>y.id!==o)}
).durationS,m=l.find(y=>y.startS>h)?.startS??1/0,g=Math.min(m,Math.max(f,h+(c?yd(c):sje("still")))),b={
id:c?.id??an(),kind:"cam-still",startS:h,durationS:Math.max(Ije,g-h),...c&&"focalLengthMm"in c&&c.focalLengthMm!==void 0?{
focalLengthMm:c.focalLengthMm}
:{
}
,subjectId:n}
;
return this.updateTrackItems(o,y=>[b,...y.filter(v=>v.id!==c?.id)]),!0}
;
keepLookOnClear=(e,n,r,s)=>{
if(!this.updateObjectTransform)return;
n.kind==="cam-still"&&this.turnCameraToward(e,s);
const a=this.objects.peek(),o=a[e]?.targetId,l=o?a[o]:void 0;
if(!o||!l){
this.updateObjectTransform(e,{
lastAimPosition:s}
);
return}
r.some(d=>d.id!==n.id&&YN(d))||this.updateObjectTransform(o,{
position:s$(l,a,s)}
)}
;
cameraFocusId=e=>{
const n=this.trackIdOf(e),r=n?this.moveSegmentOf(n,this.performanceTimeS.peek()):void 0;
return r?Cit(r):null}
;
walkerFocusId=e=>{
const n=this.trackIdOf(e),r=n?this.moveSegmentOf(n,this.performanceTimeS.peek()):void 0;
return r?.kind==="path"&&r.aim==="subject"?r.subjectId??null:null}
;
setWalkerFocus=(e,n)=>{
const r=this.objects.peek();
if(!el(r[e]?.kind)||n!==null&&(n===e||!r[n]))return!1;
const s=this.trackIdOf(e),a=s?this.moveSegmentOf(s,this.performanceTimeS.peek()):void 0;
return!s||a?.kind!=="path"?!1:(this.updatePathItemAim(s,a.id,n?"subject":"travel",n),!0)}
;
trackIdOf=e=>this.show.peek().tracks.find(n=>n.characterId===e)?.id??null;
moveSegmentOf=(e,n)=>{
const r=this.show.peek().tracks.find(o=>o.id===e),s=this.objects.peek()[r?.characterId??""]?.kind==="camera",a=(r?.items??[]).filter(o=>s?Fp(o):o.kind==="path"||o.kind==="play");
return a.find(o=>n>=o.startS&&n<o.startS+yd(o))??a[0]}
;
updateClipItem=(e,n,r)=>{
this.updateTrackItems(e,s=>s.map(a=>{
if(a.id!==n||a.kind!=="clip")return a;
const o=r.clip??a.clip,l=r.durationS!==void 0&&!Number.isNaN(r.durationS)?Math.min(kHr,Math.max(_Hr,r.durationS)):r.clip?IDe(o):a.durationS;
return{
...a,clip:o,durationS:l}
}
))}
;
removePerformanceItem=(e,n)=>{
this.updateTrackItems(e,s=>s.filter(a=>a.id!==n)),this.performancePaint.peek()?.itemId===n&&this.finishPerformancePaint()}
;
moveItem=(e,n,r)=>{
if(Number.isNaN(r))return;
const s=Math.max(0,r);
this.updateTrackItems(e,a=>a.map(o=>o.id===n?{
...o,startS:s}
:o))}
;
draggingSegment=Ne(null);
beginSegmentDrag=e=>{
this.segmentDropTaken=!1,this.draggingSegment.set(e)}
;
endSegmentDrag=()=>this.draggingSegment.set(null);
segmentDropTaken=!1;
markSegmentDropTaken=()=>{
this.segmentDropTaken=!0}
;
wasSegmentDropTaken=()=>this.segmentDropTaken;
draggedSegment=()=>{
const e=this.draggingSegment.peek();
return e?this.show.peek().tracks.find(n=>n.id===e.trackId)?.items.find(n=>n.id===e.itemId)??null:null}
;
canDropSegmentOnObject=e=>{
const n=this.draggedSegment();
return!n||!this.canOwnTrack(e)?!1:Art(n,this.objects.peek()[e]?.kind)}
;
dropSegmentOnObject=e=>{
const n=this.draggingSegment.peek();
if(!n||!this.canDropSegmentOnObject(e))return null;
const s=this.show.peek().tracks.find(l=>l.characterId===e)?.id??this.addPerformanceTrack(e);
if(!s)return null;
const a=this.show.peek().tracks.find(l=>l.id===s)?.items??[],o=this.duplicateItem(n.trackId,n.itemId,s,MP(a));
return o&&(this.segmentDropTaken=!0),o}
;
duplicateItem=(e,n,r,s)=>{
const a=this.show.peek(),o=a.tracks.find(u=>u.id===e)?.items.find(u=>u.id===n);
if(!o)return null;
const l=a.tracks.find(u=>u.id===r);
if(!l||!Art(o,this.objects.peek()[l.characterId]?.kind))return null;
const c=an(),d=DHr({
...structuredClone(o),id:c,startS:Math.max(0,s)}
,l.characterId);
return this.updateTrackItems(r,u=>[...u,d]),c}
;
reorderItem=(e,n,r)=>{
this.updateTrackItems(e,s=>kGt(s,n,r))}
;
playPerformance=()=>{
this.recording.peek()===null&&this.playSession.peek()===null&&(this.finishPerformancePaint(),this.isPerformancePlaying.set(!0))}
;
stopPerformance=()=>{
this.isPerformancePlaying.set(!1),this.performanceSeekS.set(null)}
;
setTakeRange=e=>{
if(this.recording.peek()!==null)return!1;
if(!e)return this.show.range.delete(),!0;
const n=a=>Math.round(a*100)/100,r=n(Math.max(0,Math.min(e.startS,e.endS))),s=n(Math.max(e.startS,e.endS));
return tie(r,s)?(this.show.range.set({
startS:r,endS:s}
),!0):!1}
;
seekPerformance=e=>{
this.recording.peek()===null&&(this.isPerformancePlaying.set(!1),this.performanceSeekS.set(Math.max(0,e)))}
;
loadShow=(e,n)=>{
if(this.isPerformancePlaying.set(!1),this.playSession.set(null),n?.keepGesture||(this.performanceSeekS.set(nul