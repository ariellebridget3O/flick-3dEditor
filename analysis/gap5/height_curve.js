zoomIn=()=>this.zoomBy("in");
zoomOut=()=>this.zoomBy("out");
zoomToFit=()=>this.zoomBy("fit");
reportZoom=e=>this.zoomPercent.set(e);
centerRequest=Ne(null);
centerOn=e=>{
this.centerRequest.set({
id:e,seq:(this.centerRequest.peek()?.seq??0)+1}
)}
;
goToCamera=e=>{
this.a.setSelectedIds([e]),this.centerOn(e)}
;
drawnMoveIds=Ne(()=>this.a.show.get().tracks.filter(e=>e.items.some(n=>(n.kind==="path"||n.kind==="cam-path")&&n.anchors.length>1)).map(e=>e.characterId));
paths=Ne(()=>{
const e=this.a.objects.get(),n=[];
for(const r of this.a.show.get().tracks){
const s=e[r.characterId];
if(s)for(const a of r.items)if(a.kind==="transform"&&a.keys.length>1){
const o=l=>hL(Zo({
...l,parentId:s.parentId}
,e).position);
n.push({
id:r.characterId,kind:s.kind,points:rit(a.keys,l=>o(Bzt(a.keys,l))),keys:a.keys.map(o)}
)}
else if((a.kind==="path"||a.kind==="cam-path")&&a.anchors.length>1){
const o=nx(a.anchors).map(hL);
n.push({
id:r.characterId,kind:s.kind,points:o,keys:[o[o.length-1]]}
)}
else a.kind==="cam-transform"&&a.keys.length>1&&n.push({
id:r.characterId,kind:s.kind,points:rit(a.keys,o=>hL(cZt(a.keys,o).position)),keys:a.keys.map(o=>hL(o.position))}
)}
return n}
);
heightMove=Ne(()=>{
const e=this.a.selectedIds.get(),n=e.length===1?e[0]:null;
if(!n||this.a.objects.get()[n]?.kind!=="camera"||this.stroking.get())return null;
const r=this.a.show.get().tracks.find(a=>a.characterId===n),s=r?.items.find(a=>a.kind==="cam-path"&&a.anchors.length>1);
return!r||s?.kind!=="cam-path"?null:{
trackId:r.id,itemId:s.id,startS:s.startS,durationS:yd(s),curve:sLr(s),drawn:!!s.heightCurve,maxM:this.heightMaxM.get()}
}
);
heightCurveShown=Ne(()=>!!this.heightMove.get());
curveDrag=null;
pressCurveLine=e=>{
const n=this.heightMove.peek();
if(this.locked.peek()||!n)return null;
const r=oLr(n.curve,e.u);
return r?(this.holdCurve(r.index,null),this.writeCurve(r.curve),this.curveDrag.changed=!0,this.showCurveMoment(r.curve[r.index].u),r.index):null}
;
pressCurvePoint=(e,n=null)=>{
const r=this.heightMove.peek();
this.locked.peek()||!r?.curve[e]||(this.holdCurve(e,n),this.showCurveMoment(r.curve[e].u))}
;
dragCurve=(e,n=!1)=>{
const r=this.heightMove.peek(),s=this.curveDrag;
if(!r||!s)return;
const a={
u:e.u,heightM:Kat(e.heightM,r.maxM)}
,o=s.side?cLr(r.curve,s.index,s.side,e,{
broken:n,rangeM:r.maxM}
):lLr(r.curve,s.index,a,r.maxM);
this.writeCurve(o),s.changed=!0,this.showCurveMoment(o[s.index].u)}
;
releaseCurve=()=>{
const e=this.curveDrag;
e&&(this.curveDrag=null,this.a.seekPerformance(e.returnS),this.a.endEditGesture(),e.changed&&this.a.onHeightDrawn?.({
updated:e.redrawn}
))}
;
scrubCurve=e=>{
this.locked.peek()||this.showCurveMoment(Math.min(1,Math.max(0,e)))}
;
removeCurvePoint=e=>{
const n=this.heightMove.peek();
if(this.locked.peek()||!n)return;
const r=uLr(n.curve,e);
r!==n.curve&&(this.a.beginEditGesture(),this.writeCurve(r),this.a.endEditGesture())}
;
holdCurve=(e,n)=>{
this.a.beginEditGesture(),this.curveDrag={
index:e,side:n,returnS:this.a.performanceTimeS.peek(),redrawn:!!this.heightMove.peek()?.drawn,changed:!1}
}
;
writeCurve=e=>{
const n=this.heightMove.peek();
n&&this.a.setPathHeightCurve(n.trackId,n.itemId,e)}
;
showCurveMoment=e=>{
const n=this.heightMove.peek();
n&&this.a.seekPerformance(n.startS+e*n.durationS)}
;
aspect=Ne(()=>Am(this.a.recordAspect.get()).aspect);
locked=Ne(()=>this.a.isPerformancePlaying.get()||this.a.isRecording.get());
drawTarget=Ne(()=>{
const e=this.a.selectedIds.get(),n=e.length===1?this.a.objects.get()[e[0]]?.kind:void 0;
return n==="camera"||Q0(n)&&n!=="group"&&n!=="target"?e[0]:null}
);
targetPerson=Ne(()=>{
const e=this.drawTarget.get(),n=e?this.a.objects.get()[e]?.kind:void 0;
return el(n)?n:null}
);
drawingFor=Ne(null);
drawing=Ne(()=>!!this.drawingFor.get());
strokeClock=Ne(null);
stroking=Ne(()=>!!this.strokeClock.get());
matchDrawSpeed=Ne(!0);
toggleMatchDrawSpeed=()=>this.matchDrawSpeed.set(e=>!e);
rehearseTip=Ne(!1);
tipTimer=null;
stroke=null;
pendingWalkerFocus=null;
disposers=[];
setBounds=Ne(()=>{
const e=this.a.objects.get();
return uqt(this.entries.get().filter(({
obj:n}
)=>!fie(n.kind)).map(({
obj:n}
)=>Dst(n,Zo(n,e))))}
);
heightMaxM=Ne(()=>{
const e=this.setBounds.get(),n=!!e&&Math.max(e.maxX-e.minX,e.maxZ-e.