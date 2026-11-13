e:r,intents:[{
    type:"select",
    ids:[...new Set([...n.base,
          ...c])]
  }]
}
}return{
state:r,intents:n.last===null?[]:[{
  type:"commit"
}]
}
}function $Lr(t){
const e=t.drag,n=!!e&&e.kind!=="marquee"&&e.kind!=="stroke"&&e.kind!=="tap-or-draw"&&e.last!==null;
return{
state:{
...t,drag:null
},intents:n?[{
  type:"commit"
}]:[]
}
}const eit=40,VLr=.05,ULr=4e3,zLr=.05,WLr=20,GLr=12,qLr=4,ZLr=50,KLr=.18,XLr=.12,YLr=1.6,QLr=1.4,JLr={
minX:-3,minZ:-3,maxX:3,maxZ:3
},tit={
prop:0,cube:0,sphere:0,cylinder:0,group:0,humanoid:1,simple_figure:1,target:2,spotlight:3,camera:3
},eDr=.4,tDr=1,nit=lZt(),uL=new qn,qY=new qn,xb=new va,nDr=new Ge(0,1,0);
class rDr{
constructor(e){
this.a=e,this.disposers.push(qt(()=>{
    this.drawTarget.get(),
    this.drawingFor.set(null)
  }),qt(()=>{
    this.locked.get()&&(this.stroke&&(this.stroke=null,
        this.strokeClock.set(null),
        this.a.drawPreview.set(null)),
      this.drawingFor.set(null),
      this.hideRehearseTip())
  }))
}labels=Ne(()=>{
const e=new Map,n={
  
};
for(const[r,
    s]of Object.entries(this.a.objects.get())){
  const a=(e.get(s.kind)??0)+1;
  e.set(s.kind,
    a),
  n[r]=DDe(s,
    a,
    _)
}return n
});
entries=Ne(()=>{
const e=this.labels.get();
return Object.entries(this.a.objects.get()).filter(([,
      n])=>n.kind!=="group").map(([n,
      r])=>({
      id:n,
      obj:r,
      label:e[n]
    })).sort((n,
    r)=>tit[n.obj.kind]-tit[r.obj.kind])
});
cameraPills=Ne(()=>this.entries.get().filter(({
    obj:e
  })=>e.kind==="camera").map(({
    id:e,
    label:n
  })=>({
    id:e,
    label:n
  })));
zoomPercent=Ne(100);
zoomCommand=Ne(null);
zoomBy=e=>{
this.zoomCommand.set({
  kind:e,
  seq:(this.zoomCommand.peek()?.seq??0)+1
})
};
zoomIn=()=>this.zoomBy("in");
zoomOut=()=>this.zoomBy("out");
zoomToFit=()=>this.zoomBy("fit");
reportZoom=e=>this.zoomPercent.set(e);
centerRequest=Ne(null);
centerOn=e=>{
this.centerRequest.set({
  id:e,
  seq:(this.centerRequest.peek()?.seq??0)+1
})
};
goToCamera=e=>{
this.a.setSelectedIds([e]),this.centerOn(e)
};
drawnMoveIds=Ne(()=>this.a.show.get().tracks.filter(e=>e.items.some(n=>(n.kind==="path"||n.kind==="cam-path")&&n.anchors.length>1)).map(e=>e.characterId));
paths=Ne(()=>{
const e=this.a.objects.get(),n=[];
for(const r of this.a.show.get().tracks){
  const s=e[r.characterId];
  if(s)for(const a of r.items)if(a.kind==="transform"&&a.keys.length>1){
    const o=l=>hL(Zo({
          ...l,
          parentId:s.parentId
        },
        e).position);
    n.push({
        id:r.characterId,
        kind:s.kind,
        points:rit(a.keys,
          l=>o(Bzt(a.keys,
              l))),
        keys:a.keys.map(o)
      })
  }else if((a.kind==="path"||a.kind==="cam-path")&&a.anchors.length>1){
    const o=nx(a.anchors).map(hL);
    n.push({
        id:r.characterId,
        kind:s.kind,
        points:o,
        keys:[o[o.length-1]]
      })
  }else a.kind==="cam-transform"&&a.keys.length>1&&n.push({
      id:r.characterId,
      kind:s.kind,
      points:rit(a.keys,
        o=>hL(cZt(a.keys,
            o).position)),
      keys:a.keys.map(o=>hL(o.position))
    })
}return n
});
heightMove=Ne(()=>{
const e=this.a.selectedIds.get(),n=e.length===1?e[0]:null;
if(!n||this.a.objects.get()[n]?.kind!=="camera"||this.stroking.get())return null;
const r=this.a.show.get().tracks.find(a=>a.characterId===n),s=r?.items.find(a=>a.kind==="cam-path"&&a.anchors.length>1);
return!r||s?.kind!=="cam-path"?null:{
  trackId:r.id,
  itemId:s.id,
  startS:s.startS,
  durationS:yd(s),
  curve:sLr(s),
  drawn:!!s.heightCurve,
  maxM:this.heightMaxM.get()
}
});
heightCurveShown=Ne(()=>!!this.heightMove.get());
curveDrag=null;
pressCurveLine=e=>{
const n=this.heightMove.peek();
if(this.locked.peek()||!n)return null;
const r=oLr(n.curve,e.u);
return r?(this.holdCurve(r.index,
  null),this.writeCurve(r.curve),this.curveDrag.changed=!0,this.showCurveMoment(r.curve[r.index].u),r.index):null
};
pressCurvePoint=(e,n=null)=>{
const r=this.heightMove.peek();
this.locked.peek()||!r?.curve[e]||(this.holdCurve(e,
  n),this.showCurveMoment(r.curve[e].u))
};
dragCurve=(e,n=!1)=>{
const r=this.heightMove.peek(),s=this.curveDrag;
if(!r||!s)return;
const a={
u:e.u,heightM:Kat(e.heightM,
  r.maxM)
},o=s.side?cLr(r.curve,s.index,s.side,e,{
  broken:n,
  rangeM:r.maxM
}):lLr(r.curve,s.index,a,r.maxM);
this.writeCurve(o),s.changed=!0,this.showCurveMoment(o[s.index].u)
};
releaseCurve=()=>{
const e=this.curveDrag;
e&&(this.curveDrag=null,this.a.seekPerformance(e.returnS),this.a.endEditGesture(),e.changed&&this.a.onHeightDrawn?.({
    updated:e.redrawn
  }))
};
scrubCurve=e=>{
this.locked.peek()||this.showCurveMoment(Math.min(1,
  Math.max(0,
    e)))
};
removeCurvePoint=e=>{
const n=this.heightMove.peek();
if(this.locked.peek()||!n)return;
const r=uLr(n.curve,e);
r!==n.curve&&(this.a.beginEditGesture(),this.writeCurve(r),this.a.endEditGesture())
};
holdCurve=(e,n)=>{
this.a.beginEditGesture(),this.curveDrag={
index:e,side:n,returnS:this.a.performanceTimeS.peek(),redrawn:!!this.heightMove.peek()?.drawn,changed:!1
}
};
writeCurve=e=>{
const n=this.heightMove.peek();
n&&this.a.setPathHeightCurve(n.trackId,n.itemId,e)
};
showCurveMoment=e=>{
const n=this.heightMove.peek();
n&&this.a.seekPerformance(n.startS+e*n.durationS)
};
aspect=Ne(()=>Am(this.a.recordAspect.get()).aspect);
locked=Ne(()=>this.a.isPerformancePlaying.get()||this.a.isRecording.get());
drawTarget=Ne(()=>{
const e=this.a.selectedIds.get(),n=e.length===1?this.a.objects.get()[e[0]]?.kind:void 0;
return n==="camera"||Q0(n)&&n!=="group"&&n!=="target"?e[0]:null
});
targetPerson=Ne(()=>{
const e=this.drawTarget.get(),n=e?this.a.objects.get()[e]?.kind:void 0;
return el(n)?n:null
});
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
        obj:n
      })=>!fie(n.kind)).map(({
        obj:n
      })=>Dst(n,
      Zo(n,
        e))))
});
heightMaxM=Ne(()=>{
const e=this.setBounds.get(),n=!!e&&Math.max(e.maxX-e.minX,
  e.maxZ-e.minZ)>WLr,r=this.a.objects.get();
let s=0;
for(const{
    id:o,
    obj:l
  }of this.entries.get())fie(l.kind)||(s=Math.max(s,
    VDe(o,
      l,
      r).maxY));
const a=n?GLr:MZt;
return s<=a?a:Math.min(ZLr,
  Math.ceil(s+qLr))
});
selectedCamera=Ne(()=>{
const e=this.a.selectedIds.get(),n=e.length===1?e[0]:null,r=this.a.objects.get(),s=n?r[n]:void 0;
return!n||s?.kind!=="camera"?null:{
  id:n,
  name:this.labels.get()[n]??"",
  heightM:this.flownHeightM(n,
    s,
    r),
  heightRangeM:[lBe,
    this.heightMaxM.get()],
  lensMm:s.focalLengthMm??Hv,
  lensRangeMm:[yT[0],
    yT[yT.length-1]]
}
});
flownHeightM=(e,n,r)=>{
const s=Zo(n,r),a=this.a.performanceTimeS.get();
this.a.show.get();
const o=this.a.foldResolvers(e,a);
return o?(dZt({
    items:U6(this.a,
      e),
    timeS:a,
    base:{
      position:s.position,
      rotation:s.rotation,
      focalLengthMm:n.focalLengthMm??Hv
    },
    aspect:this.aspect.get(),
    resolvers:o,
    out:nit
  }),Sje(nit.position.y)):Sje(s.position[1])
};
drag=null;
items=()=>{
const e=this.a.objects.peek(),n=this.aspect.peek(),r=this.labels.peek();
return this.entries.peek().map(({
    id:s,
    obj:a,
    label:o
  })=>{
  const l=this.drag?.riding.get(s)??this.a.shownPose(s)??Zo(a,
    e),
  c={
    id:s,
    kind:a.kind,
    parentId:a.parentId,
    footprint:Dst(a,
      l),
    label:o
  };
  if(a.parentId&&(c.groupLabel=r[a.parentId]),
    a.kind==="simple_figure"&&(c.headYawRad=i9(l.headRotation??a.headRotation??[0,
          0,
          0])),
    a.kind==="spotlight"){
    const d=TDe(l);
    d&&(c.pool={
        ...d,
        square:BR(a).shape==="square"
      })
  }if(a.kind==="camera"){
    const d=l.fovDeg??Z_(a.focalLengthMm??Hv,
      n);
    c.wedgeHalfRad=hqt(d,
      n);
    const u=l.position[1].toFixed(1);
    c.label=_._({
        id:"aRvSeS",
        values:{
          label:o,
          heightM:u
        }
      }),
    c.tag=o.split(" ").pop()
  }return c
})
};
apply=e=>{
for(const n of e)switch(n.type){
case"select":n.ids.length?this.a.setSelectedIds(n.ids):this.a.selectObject(null);
break;
case"begin":this.drag={
  start:new Map,
  aimDistance:new Map,
  carried:new Map,
  riding:new Map,
  warned:!1
},this.a.beginEditGesture();
break;
case"move":HAe(()=>this.move(n.ids,
    n.dx,
    n.dz));
break;
case"yaw":this.turn(n.id,
  n.yawRad);
break;
case"lens":this.a.updateObjectTransform(n.id,
  {
    focalLengthMm:n.focalLengthMm
  });
break;
case"commit":this.drag=null,this.a.endEditGesture();
break;
case"stroke-start":this.startStroke(n.at);
break;
case"stroke-move":if(this.stroke){
  const{
    grab:r,
    pressAt:s
  }=this.stroke,
  a=Math.hypot(n.at.x-s.x,
    n.at.z-s.z),
  o=Math.max(0,
    1-a/tDr);
  this.stroke.at={
    x:n.at.x+r.x*o,
    z:n.at.z+r.z*o
  }
}break;
case"stroke-end":this.endStroke();
break;
case"focus":this.toggleFocus(n.id);
break
}
};
deleteMove=()=>{
const e=this.drawTarget.peek(),n=e?this.a.show.peek().tracks.find(a=>a.characterId===e):void 0,r=(n?.items??[]).filter(a=>(a.kind==="path"||a.kind==="cam-path")&&a.anchors.length>1).sort((a,
  o)=>a.startS-o.startS)[0];
if(!e||!n||!r)return;
const s=r.kind==="cam-path"&&r.aim==="subject"?r.subjectId:null;
this.drawingFor.set(null),this.a.beginEditGesture(),this.a.removePerformanceItem(n.id,r.id),s&&this.a.setCameraFocus(e,s),this.a.endEditGesture()
};
toggleDrawing=()=>{
this.pendingWalkerFocus=null,this.drawingFor.set(this.drawing.peek()?null:this.drawTarget.peek())
};
stopDrawing=()=>{
this.endStroke(),this.pendingWalkerFocus=null,this.drawingFor.set(null),this.hideRehearseTip()
};
stepBack=()=>this.stroke?!0:this.drawing.peek()?(this.drawingFor.set(null),!0):this.a.selectedIds.peek().length?(this.a.selectObject(null),!0):!1;
drawFrame=e=>{
const n=this.stroke;
n&&this.tickStroke(n,e);
const r=this.drawTarget.peek(),s=r?this.focusOf(r):null;
return{
stroke:n?n.samples:null,dimPathOf:this.drawing.peek()?r:null,focus:r&&s?{
  fromId:r,
  subjectId:s
}:null
}
};
startStroke=e=>{
const n=this.drawTarget.peek(),r=n?this.a.objects.peek()[n]:void 0,s=n?this.shownOrStored(n):null;
if(!n||!r||!s||!this.drawing.peek())return;
const a=hL(s.position);
this.hideRehearseTip(),this.stroke={
id:n,kind:r.kind,at:a,grab:{
  x:a.x-e.x,
  z:a.z-e.z
},pressAt:e,startMs:null,samples:[{
    ...a,
    t:0
  }],heightM:s.position[1],rotation:s.rotation,startRotation:s.rotation,facedFrom:a,focusId:this.focusOf(n)
};
const o=this.a.show.peek();
this.strokeClock.set({
  nowS:0,
  ofS:rx({
      ...o,
      tracks:o.tracks.filter(l=>l.characterId!==n)
    }).durationS
}),this.a.seekPerformance(0)
};
tickStroke=(e,n)=>{
e.startMs??=n;
const r=(n-e.startMs)/1e3,s=e.samples[e.samples.length-1];
(r-s.t>=VLr||e.at.x!==s.x||e.at.z!==s.z)&&e.samples.push({
  ...e.at,
  t:Math.max(r,
    s.t)
}),this.a.seekPerformance(r),this.a.drawPreview.set(this.previewPose(e,
  r));
const a=this.strokeClock.peek(),o=Math.floor(r*10)/10;
a&&a.nowS!==o&&this.strokeClock.set({
  ...a,
  nowS:o
})
};
previewPose=(e,n)=>{
const r=[e.at.x,e.heightM,e.at.z];
if(e.kind==="camera"&&e.focusId){
const s=this.a.foldResolvers(e.id,
  n)?.resolveAim(e.focusId,
  n);
if(s){
  const a=kv(r,
    s),
  o=Math.min(1,
    n/eDr);
  o>=1?e.rotation=a:(uL.setFromEuler(xb.set(...e.startRotation,
        "XYZ")),
    qY.setFromEuler(xb.set(...a,
        "XYZ")),
    uL.slerp(qY,
      o*o*(3-2*o)),
    xb.setFromQuaternion(uL,
      "XYZ"),
    e.rotation=[xb.x,
      xb.y,
      xb.z])
}
}else if(el(e.kind)){
const s=e.at.x-e.facedFrom.x,a=e.at.z-e.facedFrom.z;
Math.hypot(s,
  a)>=zLr&&(e.rotation=[0,
    Math.atan2(-s,
      -a),
    0],
  e.facedFrom=e.at);
const o=e.focusId?this.shownOrStored(e.focusId):null;
if(e.focusId&&o){
  const l=NP(e.focusId,
    this.a.objects.peek()),
  c=xM(i9(e.rotation),
    [e.at.x,
      e.heightM+CZt,
      e.at.z],
    [o.position[0],
      o.position[1]+l,
      o.position[2]]);
  return{
    id:e.id,
    position:r,
    rotation:[0,
      c.bodyYawRad,
      0],
    look:c
  }
}
}return{
id:e.id,position:r,rotation:e.rotation
}
};
endStroke=()=>{
const e=this.stroke;
if(!e)return;
this.stroke=null,this.strokeClock.set(null),this.a.drawPreview.set(null),this.a.stopPerformance();
const n=this.drawnMoveIds.peek().includes(e.id);
this.a.beginEditGesture();
const r=this.matchDrawSpeed.peek(),s=this.a.replaceMoveFromSamples(e.id,0,e.samples,{
  focusId:e.focusId,
  steady:!r
});
this.a.endEditGesture(),this.drawingFor.set(null),s&&(this.showRehearseTip(),this.a.onMoveDrawn?.({
    itemKind:e.kind==="camera"?"camera":e.kind==="humanoid"?"human":e.kind==="simple_figure"?"figure":"prop",
    focus:!!e.focusId,
    durationS:e.samples[e.samples.length-1].t,
    updated:n,
    matchDrawSpeed:r
  }))
};
showRehearseTip=()=>{
this.hideRehearseTip(),this.rehearseTip.set(!0),this.tipTimer=setTimeout(this.hideRehearseTip,ULr)
};
hideRehearseTip=()=>{
this.tipTimer&&clearTimeout(this.tipTimer),this.tipTimer=null,this.rehearseTip.set(!1)
};
focusOf=e=>{
const n=this.a.objects.peek()[e]?.kind;
if(n==="camera")return this.a.cameraFocusId(e);
if(!el(n))return null;
const r=this.pendingWalkerFocus;
return this.a.walkerFocusId(e)??(r?.id===e&&this.drawing.peek()?r.subjectId:null)
};
toggleFocus=e=>{
const n=this.drawTarget.peek();
if(n&&el(this.a.objects.peek()[n]?.kind)){
const o=this.focusOf(n)===e;
this.a.beginEditGesture();
const l=this.a.setWalkerFocus(n,
  o?null:e);
this.a.endEditGesture(),this.pendingWalkerFocus=l||o?null:{
  id:n,
  subjectId:e
};
return
}const r=n;
if(!r||this.a.objects.peek()[r]?.kind!=="camera")return;
this.a.beginEditGesture();
const s=this.a.cameraFocusId(r)===e,a=s?this.clearFocus(r):this.a.setCameraFocus(r,e);
this.a.endEditGesture(),!a&&!s&&ot.warning(sDr())
};
clearFocus=e=>{
const n=this.a.cameraFocusId(e);
if(!n)return!1;
const r=this.a.performanceTimeS.peek(),s=this.a.foldResolvers(e,r)?.resolveAim(n,r)??void 0;
return this.a.setCameraFocus(e,null,{
  lookingAt:s
})
};
dispose=()=>{
this.stopDrawing();
for(const e of this.disposers)e()
};
setLens=(e,n)=>this.apply([{
  type:"lens",
  id:e,
  focalLengthMm:n
}]);
beginEdit=()=>this.apply([{
  type:"begin"
}]);
endEdit=()=>this.apply([{
  type:"commit"
}]);
canAim=e=>{
const n=this.shownOrStored(e);
if(this.a.objects.peek()[e]?.kind!=="camera"||!n)return!1;
const r=U6(this.a,e);
if(_je(r,
  this.a.performanceTimeS.peek(),
  "rotate"))return!1;
if(this.a.cameraFocusId(e))return!0;
const s=this.resolveAim(e);
return!s||wje(this.a,e,n,s)
};
aimCamera=(e,n,r)=>{
const s=this.startPose(e);
this.a.objects.peek()[e]?.kind!=="camera"||!s||(this.clearFocus(e),this.commitOne(e,
  {
    ...s,
    rotation:nLr(s.rotation,
      n,
      r)
  },
  "rotate"))
};
setCameraHeight=(e,n)=>{
const r=this.startPose(e);
if(this.a.objects.peek()[e]?.kind!=="camera"||!r)return;
const[s,,a]=r.position,o=Kat(n,this.heightMaxM.peek());
this.commitOne(e,{
  ...r,
  position:[s,
    o,
    a]
},"translate")
};
addCamera=()=>{
const e=this.setBounds.peek()??JLr,r=this.entries.peek().filter(({
    obj:d
  })=>d.kind==="camera").length%2?1:-1,s=d=>Math.round(d/Vie)*Vie,a=(e.minX+e.maxX)/2,o=(e.minZ+e.maxZ)/2,l=[s(a+r*(e.maxX-e.minX)*XLr),YLr,s(e.maxZ-(e.maxZ-e.minZ)*KLr)],c=this.a.addCameraAt(l,[a,
  QLr,
  o]);
return this.centerOn(c),c
};
move=(e,n,r)=>{
const s=c=>{
const d=this.startPose(c);
return d?{
  ...d,
  position:[d.position[0]+n,
    d.position[1],
    d.position[2]+r]
}:null
},a=this.a.objects.peek(),o=e.filter(c=>this.carryPaths(c,
  n,
  