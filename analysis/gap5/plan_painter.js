==="focus"?i.jsx(M,{
id:"EJeEqK"}
):i.jsx(M,{
id:"g77QSd"}
)}
)]}
)}
const dit="M232,32a8,8,0,0,0-8-8c-44.08,0-89.31,49.71-114.43,82.63A60,60,0,0,0,32,164c0,30.88-19.54,44.73-20.47,45.37A8,8,0,0,0,16,224H92a60,60,0,0,0,57.37-77.57C182.3,121.31,232,76.08,232,32ZM92,208H34.63C41.38,198.41,48,183.92,48,164a44,44,0,1,1,44,44Zm32.42-94.45q5.14-6.66,10.09-12.55A76.23,76.23,0,0,1,155,121.49q-5.9,4.94-12.55,10.09A60.54,60.54,0,0,0,124.42,113.55Zm42.7-2.68a92.57,92.57,0,0,0-22-22c31.78-34.53,55.75-45,69.9-47.91C212.17,55.12,201.65,79.09,167.12,110.87Z",JDr=(t,e,n)=>`url("data:image/svg+xml,${
encodeURIComponent(t)}
") ${
e}
, ${
n}
`,cye=JDr(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='-16 -16 288 288'><path d='${
dit}
' fill='white' stroke='white' stroke-width='28' stroke-linejoin='round'/><path d='${
dit}
' fill='#1C0F09'/></svg>`,"3 20","crosshair"),eBr="_plan_1sdme_20 _palette_1sdme_3",tBr="_focusTip_1sdme_34 _content_1czgt_6",uit={
plan:eBr,focusTip:tBr}
,nBr=320,hit={
x:18,y:-44}
,pit=(t,e)=>`translate(${
t}
px, ${
e}
px)`;
function dye(t,e){
const n=t.getBoundingClientRect(),r=n.width?t.clientWidth/n.width:1,s=n.height?t.clientHeight/n.height:1;
return{
x:(e.clientX-n.left)*r,y:(e.clientY-n.top)*s}
}
function rBr({
items:t,paths:e,selectedIds:n,aspect:r,locked:s,theme:a,drawing:o=!1,readOnly:l=!1,onFrame:c,besideRef:d,onIntents:u,onComponentDrop:h,frameId:f,centerOn:m,zoomCommand:g,onZoomPercent:b,onEdgePointerClick:y}
){
const v=p.useRef(null),x=p.useRef(null),w=p.useRef(ELr()),k=p.useRef(null),S=p.useRef([]),T=p.useRef(m?.seq??null),A=p.useRef(!1),C=p.useRef({
w:0,h:0}
),E=p.useRef(null),j=p.useRef(null),I=p.useRef(null),N=p.useRef(null),P=p.useRef(g?.seq??null),F=p.useRef(null),B=p.useRef(null),H=p.useRef([]),z=_._({
id:"Fsd1Wl"}
),L=p.useRef({
items:t,paths:e,selectedIds:n,aspect:r,locked:s,drawing:o,readOnly:l,onFrame:c,besideRef:d,focusLabel:z,onIntents:u,frameId:f,centerOn:m,zoomCommand:g,onZoomPercent:b,onEdgePointerClick:y}
);
L.current={
items:t,paths:e,selectedIds:n,aspect:r,locked:s,drawing:o,readOnly:l,onFrame:c,besideRef:d,focusLabel:z,onIntents:u,frameId:f,centerOn:m,zoomCommand:g,onZoomPercent:b,onEdgePointerClick:y}
,p.useEffect(()=>{
v.current&&(k.current=BZt(v.current))}
,[a]),p.useEffect(()=>{
v.current.style.cursor=o?cye:"",!o&&x.current&&(x.current.hidden=!0)}
,[o]),p.useEffect(()=>{
const Z=v.current,se=Z.getContext("2d");
let X=0;
const te=Q=>{
X=requestAnimationFrame(te);
const q=Z.clientWidth,Y=Z.clientHeight;
if(!se||!k.current||q===0||Y===0)return;
const re=window.devicePixelRatio||1,ae=Math.round(q*re),ie=Math.round(Y*re);
(Z.width!==ae||Z.height!==ie)&&(Z.width=ae,Z.height=ie);
const{
items:ge,paths:pe,selectedIds:ce,onFrame:be,besideRef:fe,focusLabel:we}
=L.current,Ee=be?.(Q);
S.current=ge(),w.current=ILr(jLr(w.current,q,Y),S.current);
const xe=I.current===null?0:Q-I.current;
if(I.current=Q,j.current){
const Se=BLr(w.current,O.current(),j.current,xe);
w.current=Se.state,Se.intents.length&&L.current.onIntents(Se.intents)}
const J=L.current.frameId,le=C.current.w!==q||C.current.h!==Y;
if(J&&(J!==E.current||le&&!A.current)){
const Se=MLr(w.current,S.current,J);
Se!==w.current&&(E.current=J,C.current={
w:q,h:Y}
),w.current=Se}
const ue=L.current.centerOn;
if(ue&&ue.seq!==T.current){
const Se=FLr(w.current,S.current,ue.id);
if(Se!==w.current){
T.current=ue.seq,A.current=!0;
const{
centerX:me,centerZ:Te}
=w.current.view;
B.current={
from:{
x:me,z:Te}
,to:{
x:Se.view.centerX,z:Se.view.centerZ}
,startMs:Q}
}
}
if(B.current){
const Se=B.current,me=Math.min(1,(Q-Se.startMs)/nBr),Te=1-(1-me)**3;
w.current={
...w.current,view:{
...w.current.view,centerX:Se.from.x+(Se.to.x-Se.from.x)*Te,centerZ:Se.from.z+(Se.to.z-Se.from.z)*Te}
}
,me>=1&&(B.current=null)}
const{
view:oe,drag:ye}
=w.current,je=L.current.zoomCommand;
je&&je.seq!==P.current&&(P.current=je.seq,A.current=!0,w.current=je.kind==="fit"?OLr(w.current):RLr(w.current,je.kind==="in"?1:-1));
const ve=LLr(w.current);
ve!==F.current&&(F.current=ve,L.current.onZoomPercent?.(ve)),se.setTransform(re,0,0,re,0,0),SDr(se,{
view:oe,items:S.current,selection:new Set(ce),paths:pe,palette:k.current,marquee:ye?.kind==="marquee"?ye.rect:null,dimPathOf:Ee?.dimPathOf,stroke:Ee?.stroke,focus:Ee?.focus&&{
...Ee.focus,label:we}
}
),H.current=$Ir(S.current,oe),FDr(se,H.current,k.current);
const ke=fe?.current,Ae=ce.length===1?S.current.find(Se=>Se.id===ce[0]):void 0;
if(ke&&Ae&&!Ee?.stroke){
const Se=iu(oe,Ae.footprint),me=Se.x>=0&&Se.x<=oe.widthPx&&Se.y>=0&&Se.y<=oe.heightPx;
ke.style.visibility=me?"":"hidden";
const Te=ZIr(Ae,oe,{
widthPx:ke.offsetWidth,heightPx:ke.offsetHeight}
);
ke.style.transform=pit(Te.x,Te.y)}
}
;
X=requestAnimationFrame(te);
const ne=Q=>{
Q.preventDefault(),Q.stopPropagation(),B.current=null,A.current=!0,w.current=NLr(w.current,{
p:dye(Z,Q),dx:Q.deltaX,dy:Q.deltaY,deltaMode:Q.deltaMode,zoom:Q.ctrlKey||Q.metaKey}
)}
;
return Z.addEventListener("wheel",ne,{
passive:!1}
),()=>{
cancelAnimationFrame(X),Z.removeEventListener("wheel",ne);
const{
intents:Q}
=$Lr(w.current);
Q.length&&L.current.onIntents(Q)}
}
,[]);
const $=()=>({
items:S.current,selection:L.current.selectedIds,aspect:L.current.aspect,locked:L.current.locked,drawing:L.current.drawing,readOnly:L.current.readOnly}
),O=p.useRef($);
O.current=$;
const W=(Z,se)=>{
const X=x.current;
if(!L.current.drawing||!X)return;
const te=!!se&&!!OZt(w.current,$(),se);
Z.style.cursor=cye,X.hidden=!te,te&&(X.style.transform=pit(se.x+hit.x,se.y+hit.y))}
,U=Z=>{
w.current=Z.state,Z.intents.length&&L.current.onIntents(Z.intents)}
,V=Z=>({
p:dye(Z.currentTarget,Z),shift:Z.shiftKey,mod:Z.metaKey||Z.ctrlKey}
),G=()=>{
j.current=null,U(HLr(w.current,$()))}
;
return i.jsxs(i.Fragment,{
children:[i.jsx("canvas",{
ref:v,className:uit.plan,"data-testid":"stage-plan",onPointerDown:Z=>{
if(B.current=null,A.cu