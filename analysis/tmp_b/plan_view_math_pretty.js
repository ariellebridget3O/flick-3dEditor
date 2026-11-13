s<=vLr)return!0;
const a=S1(e,n),o=a.x-t.x,l=a.z-t.z,c=Math.cos(t.yawRad),d=Math.sin(t.yawRad),u=(o*c-l*d)/t.halfWidthM,h=(o*d+l*c)/t.halfDepthM;
return t.shape==="rect"?Math.abs(u)<=1&&Math.abs(h)<=1:u*u+h*h<=1
}function Qhe(t,e,n){
const r=[];
for(let s=t.length-1;
s>=0;
s--){
const a=t[s];
xLr(a.footprint,
  e,
  n)&&r.push(a)
}return r
}function Xat(t,e,n){
const r=Qhe(t,e,n)[0];
return r?r.parentId??r.id:null
}function wLr(t,e,n,r){
const s=Qhe(t,e,n);
if(!s.length)return null;
const a=s.find(c=>c.parentId===r);
if(a)return a.id;
const o=s.findIndex(c=>c.id===r),l=o>=0?(o+1)%s.length:Math.min(1,s.length-1);
return s[l].id
}function _Lr(t,e,n){
const r=Math.min(n.x0,n.x1),s=Math.max(n.x0,n.x1),a=Math.min(n.y0,n.y1),o=Math.max(n.y0,n.y1),l=new Set;
for(const c of t){
const d=Rie(c.footprint,
  e);
d.maxX>=r&&d.minX<=s&&d.maxY>=a&&d.minY<=o&&l.add(c.parentId??c.id)
}return[...l]
}function kLr(t,e,n){
const r=zDe(t.footprint,e,t.wedgeHalfRad),s=a=>Math.hypot(n.x-a.x,n.y-a.y)<=cqt+yLr;
return s(r.rotate)?"rotate":r.lens?.some(s)?"lens":null
}const Vie=.25,Yat=Math.PI/12,Qat=3,Jat=4,SLr=4,TLr=48,ALr=.8,CLr=720;
function ELr(){
return{
view:{
  centerX:0,
  centerZ:0,
  pxPerM:Uhe,
  widthPx:0,
  heightPx:0
},drag:null,fitted:!1
}
}function jLr(t,e,n){
const{
view:r
}=t;
if(r.widthPx===e&&r.heightPx===n)return t;
const s=r.widthPx>0&&r.heightPx>0;
return{
...t,view:{
  ...r,
  centerX:s?r.centerX+(e-r.widthPx)/(2*r.pxPerM):r.centerX,
  centerZ:s?r.centerZ+(n-r.heightPx)/(2*r.pxPerM):r.centerZ,
  widthPx:e,
  heightPx:n
}
}
}function ILr(t,e){
if(t.fitted||t.view.widthPx===0)return t;
const n=uqt(e.map(r=>r.footprint));
return n?{
...t,view:zIr(t.view,
  n,
  TLr),fitted:!0
}:t
}function MLr(t,e,n){
const r=e.find(s=>s.id===n)?.footprint;
return!r||t.view.widthPx===0?t:{
...t,view:{
  ...t.view,
  centerX:r.x,
  centerZ:r.z,
  pxPerM:Uhe
},fitted:!0
}
}function NLr(t,e){
const n=PZt({
  deltaX:e.dx,
  deltaY:e.dy,
  deltaMode:e.deltaMode,
  zoom:e.zoom
}),r=n.kind==="zoom"?fqt(t.view,e.p,FZt(n.delta)):UDe(t.view,-n.dx,-n.dy);
return{
...t,view:r
}
}function PLr(t,e,n){
return{
...t,view:UDe(t.view,
  e,
  n)
}
}function RLr(t,e){
const n={
x:t.view.widthPx/2,y:t.view.heightPx/2
};
return{
...t,view:fqt(t.view,
  n,
  FZt(e*Aje))
}
}function FLr(t,e,n){
const r=e.find(s=>s.id===n)?.footprint;
return!r||t.view.widthPx===0?t:{
...t,view:{
  ...t.view,
  centerX:r.x,
  centerZ:r.z
}
}
}function OLr(t){
return{
...t,fitted:!1
}
}function LLr(t){
return Math.round(t.view.pxPerM/Uhe*100)
}const FZt=t=>Math.max(.1,1+t);
function OZt(t,e,n){
const r=LZt(e);
if(!e.drawing||!r||r.kind!=="camera"&&!el(r.kind))return null;
const s=Qhe(e.items,t.view,n)[0];
return s&&s.id!==r.id&&s.kind!=="camera"&&s.kind!=="target"?s.id:null
}function LZt(t){
return t.selection.length===1?t.items.find(e=>e.id===t.selection[0]):void 0
}function DLr(t,e,n){
if(e.locked)return{
state:t,intents:[]
};
const{
view:r
}=t;
if(e.readOnly){
const d=Xat(e.items,
  r,
  n.p),u=d?[d]:[],h=u.length===e.selection.length&&u[0]===e.selection[0];
return{
  state:t,
  intents:h?[]:[{
      type:"select",
      ids:u
    }]
}
}const s=LZt(e);
if(e.drawing&&s){
const d=OZt(t,
  e,
  n.p);
return d?{
  state:{
    ...t,
    drag:{
      kind:"tap-or-draw",
      downPx:n.p,
      focusId:d
    }
  },
  intents:[]
}:{
  state:{
    ...t,
    drag:{
      kind:"stroke",
      lastPx:n.p
    }
  },
  intents:[{
      type:"stroke-start",
      at:S1(r,
        n.p)
    }]
}
}const a=s?kLr(s,r,n.p):null;
if(s&&a)return{
state:{
  ...t,
  drag:{
    kind:a,
    item:s,
    last:null
  }
},intents:[]
};
const o=(d,u)=>({
  kind:"move",
  ids:d,
  downPx:n.p,
  downWorld:S1(r,
    n.p),
  anchor:u,
  last:null
});
if(n.mod){
const d=wLr(e.items,
  r,
  n.p,
  e.selection.length===1?e.selection[0]:null),u=e.items.find(h=>h.id===d);
if(d&&u)return{
  state:{
    ...t,
    drag:o([d],
      u.footprint)
  },
  intents:[{
      type:"select",
      ids:[d]
    }]
}
}const l=Xat(e.items,r,n.p);
if(l){
const d=Qhe(e.items,
  r,
  n.p)[0];
let u=[...e.selection];
const h=[];
return n.shift?(u=u.includes(l)?u.filter(f=>f!==l):[...u,
    l],
  h.push({
      type:"select",
      ids:u
    })):u.includes(l)||(u=[l],
  h.push({
      type:"select",
      ids:u
    })),{
  state:{
    ...t,
    drag:u.length?o(u,
      d.footprint):null
  },
  intents:h
}
}const c=n.shift?[...e.selection]:[];
return{
state:{
  ...t,
  drag:{
    kind:"marquee",
    rect:{
      x0:n.p.x,
      y0:n.p.y,
      x1:n.p.x,
      y1:n.p.y
    },
    base:c
  }
},intents:!n.shift&&e.selection.length?[{
    type:"select",
    ids:[]
  }]:[]
}
}function BLr(t,e,n,r){
const s=t.drag;
if(!s||s.kind!=="stroke"&&s.kind!=="move")return{
state:t,intents:[]
};
if(s.kind==="move"&&!s.last)return{
state:t,intents:[]
};
const{
widthPx:a,heightPx:o
}=t.view,l=(f,m)=>{
const g=m*ALr/2,b=f-m/2,y=Math.abs(b)-g;
return y<=0?0:Math.sign(b)*Math.min(1,
  y/Math.max(m/2-g,
    1))
},c=CLr*Math.min(r,100)/1e3,d=l(n.x,a)*c,u=l(n.y,o)*c;
if(d===0&&u===0)return{
state:t,intents:[]
};
const h={
...t,view:UDe(t.view,
  -d,
  -u)
};
return s.kind==="stroke"?{
state:h,intents:[{
    type:"stroke-move",
    at:S1(h.view,
      n)
  }]
}:DZt(h,e,{
  p:n,
  shift:!1
})
}function DZt(t,e,n){
const r=t.drag;
if(!r)return{
state:t,intents:[]
};
if(r.kind==="tap-or-draw"){
const{
  downPx:d
}=r;
return Math.hypot(n.p.x-d.x,
  n.p.y-d.y)<Qat?{
  state:t,
  intents:[]
}:{
  state:{
    ...t,
    drag:{
      kind:"stroke",
      lastPx:n.p
    }
  },
  intents:[{
      type:"stroke-start",
      at:S1(t.view,
        d)
    },
    {
      type:"stroke-move",
      at:S1(t.view,
        n.p)
    }]
}
}if(r.kind==="stroke"){
const{
  lastPx:d
}=r;
return Math.hypot(n.p.x-d.x,
  n.p.y-d.y)<SLr?{
  state:t,
  intents:[]
}:{
  state:{
    ...t,
    drag:{
      kind:"stroke",
      lastPx:n.p
    }
  },
  intents:[{
      type:"stroke-move",
      at:S1(t.view,
        n.p)
    }]
}
}if(r.kind==="marquee")return{
state:{
  ...t,
  drag:{
    ...r,
    rect:{
      ...r.rect,
      x1:n.p.x,
      y1:n.p.y
    }
  }
},intents:[]
};
const s=S1(t.view,n.p);
if(r.kind==="move"){
if(!r.last&&Math.hypot(n.p.x-r.downPx.x,
    n.p.y-r.downPx.y)<Qat)return{
  state:t,
  intents:[]
};
const d=m=>n.shift?Math.round(m/Vie)*Vie:m,u=d(r.anchor.x+s.x-r.downWorld.x)-r.anchor.x,h=d(r.anchor.z+s.z-r.downWorld.z)-r.anchor.z,f=r.last?[]:[{
    type:"begin"
  }];
return(!r.last||r.last.dx!==u||r.last.dz!==h)&&f.push({
    type:"move",
    ids:r.ids,
    dx:u,
    dz:h
  }),{
  state:{
    ...t,
    drag:{
      ...r,
      last:{
        dx:u,
        dz:h
      }
    }
  },
  intents:f
}
}const a=r.item.footprint,o=Math.atan2(a.x-s.x,a.z-s.z),l=r.kind==="rotate"?n.shift?Math.round(o/Yat)*Yat:o:UIr(Math.abs(tDe(a.yawRad,
    o)),e.aspect,n.shift);
if(l===r.last)return{
state:t,intents:[]
};
const c=r.last===null?[{
  type:"begin"
}]:[];
return c.push(r.kind==="rotate"?{
  type:"yaw",
  id:r.item.id,
  yawRad:l
}:{
  type:"lens",
  id:r.item.id,
  focalLengthMm:l
}),{
state:{
  ...t,
  drag:{
    ...r,
    last:l
  }
},intents:c
}
}function HLr(t,e){
const n=t.drag,r={
...t,drag:null
};
if(!n)return{
state:t,intents:[]
};
if(n.kind==="stroke")return{
state:r,intents:[{
    type:"stroke-end"
  }]
};
if(n.kind==="tap-or-draw")return{
state:r,intents:[{
    type:"focus",
    id:n.focusId
  }]
};
if(n.kind==="marquee"){
const{
  x0:s,
  y0:a,
  x1:o,
  y1:l
}=n.rect;
if(Math.abs(o-s)<=Jat&&Math.abs(l-a)<=Jat)return{
  state:r,
  intents:[]
};
const c=_Lr(e.items,
  t.view,
  n.rect);
return{
  state:r,
  intents:[{
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
  ...t,
  drag:null
},intents:n?[{
    type:"commit"
  }]:[]
}
}const eit=40,VLr=.05,ULr=4e3,zLr=.05,WLr=20,GLr=12,qLr=4,ZLr=50,KLr=.18,XLr=.12,YLr=1.6,QLr=1.4,JL