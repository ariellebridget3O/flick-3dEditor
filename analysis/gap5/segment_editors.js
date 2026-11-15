&n(r),s(null)}
,onKeyDown:o=>{
o.key==="Enter"&&o.currentTarget.blur()}
}
)]}
)}
function P$r({
kind:t,onPersonKindChange:e}
){
const n=[{
kind:"simple_figure",label:_._({
id:"YUAoyO"}
)}
,{
kind:"humanoid",label:_._({
id:"DhTbJv"}
)}
];
return i.jsxs("div",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,children:i.jsx(M,{
id:"19jdAl"}
)}
),i.jsx("span",{
className:Wr.segmented,role:"group",children:n.map(r=>i.jsx(Hr,{
content:DU(r.kind),children:i.jsx("button",{
type:"button",className:Ze(Wr.segment,t===r.kind&&Wr.active),"aria-pressed":t===r.kind,onClick:()=>e(r.kind),children:r.label}
)}
,r.kind))}
)]}
)}
function R$r({
color:t,fallback:e,onColorPreview:n,onColorChange:r}
){
const[s,a]=p.useState(null);
return p.useEffect(()=>a(null),[t,e]),i.jsxs("div",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,children:i.jsx(M,{
id:"jZlrte"}
)}
),i.jsxs("span",{
className:Bm.colorControls,children:[i.jsx("input",{
type:"color",className:Bm.colorSwatch,title:_._({
id:"UGASY1"}
),value:s??t??e,onChange:o=>{
a(o.target.value),n(o.target.value)}
}
),t!==void 0&&i.jsx("button",{
className:Bm.clearButton,title:_._({
id:"cb+0G0"}
),onClick:()=>r(void 0),children:i.jsx(K,{
name:"close",size:"xs"}
)}
)]}
)]}
)}
function F$r({
label:t,value:e,onCommit:n}
){
return i.jsxs("div",{
className:Bm.vectorRow,children:[i.jsx("span",{
className:Wr.label,children:t}
),i.jsx("span",{
className:Bm.axes,children:i.jsx(tKt,{
axis:"°",value:e,onCommit:n}
)}
)]}
)}
function a2({
label:t,values:e,authoredValues:n,onAxisCommit:r,trailing:s}
){
return i.jsxs("div",{
className:Bm.vectorRow,children:[i.jsx("span",{
className:Wr.label,children:t}
),i.jsxs("span",{
className:Bm.axes,children:[I$r.map((a,o)=>i.jsx(tKt,{
axis:a,value:e[o]??0,authoredValue:n?.[o],onCommit:l=>r(o,l)}
,a)),s]}
)]}
)}
function O$r(t){
return String(Number(t.toFixed(3)))}
function tKt({
axis:t,value:e,authoredValue:n,onCommit:r}
){
const[s,a]=p.useState(null),[o,l]=p.useState(!1),c=n??e,{
scrubHandlers:d}
=fBe({
value:c,step:.1,onChange:r}
);
return i.jsxs("label",{
className:Ze(Wr.numberField,Bm.axisField),children:[i.jsx("span",{
className:Bm.axisLabel,style:pBe,...d,children:t}
),i.jsx("input",{
type:"text",inputMode:"decimal",className:Ze(Wr.numberInput,Bm.axisInput),value:s??O$r(o?c:e),onChange:u=>a(u.target.value),onFocus:()=>l(!0),onBlur:()=>{
if(s!==null&&s!==""){
const u=Number(s);
Number.isNaN(u)||r(u)}
a(null),l(!1)}
,onKeyDown:u=>{
u.key==="Enter"&&u.currentTarget.blur()}
}
)]}
)}
const L$r="_trigger_fcovu_3",D$r="_chevron_fcovu_21",B$r="_menu_fcovu_28",H$r="_search_fcovu_45",$$r="_options_fcovu_76",V$r="_empty_fcovu_82",U$r="_option_fcovu_76",z$r="_active_fcovu_116",W$r="_selected_fcovu_127",G$r="_highlight_fcovu_132",Ty={
trigger:L$r,chevron:D$r,menu:B$r,search:H$r,options:$$r,empty:V$r,option:U$r,active:z$r,selected:W$r,highlight:G$r}
,q$r=200,Z$r=120,JY=4,Iit=8;
function K$r({
value:t,options:e,onChange:n,searchable:r,searchLabel:s,emptyLabel:a,labelledBy:o,disabledValues:l,highlightValue:c,onboardTarget:d}
){
const[u,h]=p.useState(!1),[f,m]=p.useState(""),[g,b]=p.useState(0),[y,v]=p.useState(null),x=p.useRef(null),w=p.useRef(null),k=f.trim().toLowerCase(),S=k?e.filter(j=>j.label.toLowerCase().includes(k)):e;
p.useEffect(()=>{
if(!u)return;
const j=()=>{
const P=x.current?.getBoundingClientRect();
if(!P)return;
const F=window.innerHeight-P.bottom-JY-Iit,B=P.top-JY-Iit,H=F<q$r&&B>F;
v({
left:P.left,top:H?void 0:P.bottom+JY,bottom:H?window.innerHeight-P.top+JY:void 0,maxHeight:Math.max(Z$r,H?B:F),minWidth:P.width}
)}
;
j();
const I=P=>{
const F=P.target;
!x.current?.contains(F)&&!w.current?.contains(F)&&h(!1)}
,N=P=>{
P.key==="Escape"&&(P.preventDefault(),h(!1),x.current?.focus())}
;
return window.addEventListener("pointerdown",I),window.addEventListener("keydown",N),window.addEventListener("scroll",j,!0),window.addEventListener("resize",j),()=>{
window.removeEventListener("pointerdown",I),window.removeEventListener("keydown",N),window.removeEventListener("scroll",j,!0),window.removeEventListener("resize",j)}
}
,[u]),p.useEffect(()=>{
u&&(m(""),b(Math.max(0,e.findIndex(j=>j.value===t))))}
,[u]),p.useEffect(()=>{
w.current?.querySelector('[data-active="true"]')?.scrollIntoView({
block:"nearest"}
)}
,[g,f]);
const T=e.find(j=>j.value===t),A=()=>{
h(!1),x.current?.focus()}
,C=j=>{
l?.includes(j)||(n(j),A())}
,E=j=>{
const I=N=>Math.min(S.length-1,Math.max(0,N));
if(!u){
(j.key==="ArrowDown"||j.key==="ArrowUp")&&(j.preventDefault(),h(!0));
return}
if(j.key==="ArrowDown"||j.key==="ArrowUp")j.preventDefault(),b(N=>I(N+(j.key==="ArrowDown"?1:-1)));
else if(j.key==="Home"||j.key==="End")j.preventDefault(),b(j.key==="Home"?0:I(S.length-1));
else if(j.key==="Enter"){
j.preventDefault();
const N=S[g];
N&&C(N.value)}
}
;
return i.jsxs(i.Fragment,{
children:[i.jsxs("button",{
ref:x,type:"button",className:Ze(Wr.select,Ty.trigger),"aria-labelledby":o,"aria-haspopup":"listbox","aria-expanded":u,"data-onboard-target":d,onClick:()=>h(j=>!j),onKeyDown:E,children:[i.jsx("span",{
children:T?.label??""}
),i.jsx(K,{
name:"chevron-down",size:"sm",className:Ty.chevron}
)]}
),u&&y&&Ds.createPortal(i.jsxs("div",{
ref:w,className:Ty.menu,style:{
left:y.left,top:y.top,bottom:y.bottom,maxHeight:y.maxHeight,minWidth:y.minWidth}
,children:[r&&s&&i.jsxs("div",{
className:Ty.search,children:[i.jsx(K,{
name:"search",size:"sm"}
),i.jsx("input",{
type:"text",autoFocus:!0,value:f,placeholder:s,"aria-label":s,onChange:j=>{
m(j.target.value),b(0)}
,onKeyDown:E}
)]}
),i.jsxs("div",{
className:Ty.options,role:"listbox",children:[S.map((j,I)=>{
const N=l?.includes(j.value)??!1;
return i.jsx("button",{
type:"button",role:"option","aria-selected":j.value===t,"data-active":I===g||void 0,disabled:N,className:Ze(Ty.option,j.value===t&&Ty.selected,I===g&&Ty.active,j.value===c&&Ty.highlight),onClick:()=>C(j.value),children:j.label}
,j.value)}
),S.length===0&&a&&i.jsx("span",{
className:Ty.empty,children:a}
)]}
)]}
),document.body)]}
)}
function Zy({
label:t,...e}
){
const n=p.useId();
return i.jsxs("div",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,id:n,children:t}
),i.jsx(K$r,{
labelledBy:n,...e}
)]}
)}
const X$r="_kindRow_1tfm4_4",Y$r="_kindLabel_1tfm4_11",Q$r="_charName_1tfm4_17",J$r="_numberInput_1tfm4_25",eVr="_playModeBtn_1tfm4_32",tVr="_keySlots_1tfm4_62",nVr="_keySlot_1tfm4_62",rVr="_keySlotDropActive_1tfm4_79",sVr="_keySlotKey_1tfm4_84",aVr="_keySlotClip_1tfm4_98",iVr="_keySlotEmpty_1tfm4_107",oVr="_keySlotClear_1tfm4_122",lVr="_kfCluster_1tfm4_137",cVr="_kfBtn_1tfm4_143",dVr="_kfBtnOn_1tfm4_165",jh={
kindRow:X$r,kindLabel:Y$r,charName:Q$r,numberInput:J$r,playModeBtn:eVr,keySlots:tVr,keySlot:nVr,keySlotDropActive:rVr,keySlotKey:sVr,keySlotClip:aVr,keySlotEmpty:iVr,keySlotClear:oVr,kfCluster:lVr,kfBtn:cVr,kfBtnOn:dVr}
,Mit=.2,uVr=.1,bL=.1,hVr=["x","y","z"];
function Nit({
value:t,onChange:e}
){
return i.jsx(mh,{
label:_._({
id:"hHhnPW"}
),value:t??0,step:.1,min:-15,max:15,onChange:n=>e({
aimOffsetUnits:n}
)}
)}
function pVr({
enabled:t,onKeyframe:e,hasPrev:n,hasNext:r,onPrevClick:s,onToggleClick:a,onNextClick:o}
){
return i.jsxs("div",{
className:jh.kfCluster,children:[i.jsx("button",{
className:jh.kfBtn,disabled:!n,title:_._({
id:"F3tUlb"}
),onClick:s,children:i.jsx(K,{
name:"chevron-left",size:"xs"}
)}
),i.jsx("button",{
className:Ze(jh.kfBtn,e&&jh.kfBtnOn),disabled:!t,title:t?e?_._({
id:"ejT8n5"}
):_._({
id:"aTjqNq"}
):_._({
id:"eOl9xZ"}
),onClick:a,children:i.jsx(K,{
name:"diamond",size:"xs",filled:e}
)}
),i.jsx("button",{
className:jh.kfBtn,disabled:!r,title:_._({
id:"RZTuBT"}
),onClick:o,children:i.jsx(K,{
name:"chevron-right",size:"xs"}
)}
)]}
)}
function fVr({
item:t,characterName:e,centerOptions:n,keyframeButton:r,onSpeedChange:s,walksPath:a,hasGait:o,onGaitChange:l,onAimChange:c,isEditingPath:d,onEditPathClick:u,onClipChange:h,onDurationChange:f,onPlayClick:m,onPlayKeyChange:g,onEmptyActionClick:b,onObjectDurationChange:y,onRotateAxisChange:v,onObjectSpeedChange:x,onRevolveCenterChange:w,onScaleFactorChange:k,subjectOptions:S,targetMarkerLabel:T,cameraFocalLengthMm:A,onCameraFieldsChange:C,onFlyClick:E,poseObject:j,onPoseAxisChange:I,onPoseFocalLengthChange:N,onRemoveClick:P}
){
const{
i18n:F}
=Ia(),B={
walk_formal:_._({
id:"jLH59m"}
),walk:_._({
id:"SUJByP"}
),jog_fwd:_._({
id:"k9/rti"}
),sprint:_._({
id:"VNbzs6"}
)}
,H=S.map(O=>({
value:O.id,label:O.name}
)),z=_._({
id:"A1taO8"}
),L=_._({
id:"4TVVsS"}
),$={
searchable:!0,searchLabel:z,emptyLabel:L}
;
return i.jsxs("div",{
className:Wr.rows,children:[i.jsxs("div",{
className:jh.kindRow,children:[i.jsx("span",{
className:jh.kindLabel,children:t.kind==="path"?i.jsx(M,{
id:"I6gXOa"}
):t.kind==="play"?i.jsx(M,{
id:"T91vKp"}
):t.kind==="rotate"?i.jsx(M,{
id:"BulyBf"}
):t.kind==="revolve"?i.jsx(M,{
id:"NP8KUz"}
):t.kind==="scale"?t.factor>=1?i.jsx(M,{
id:"5DdjZ9"}
):i.jsx(M,{
id:"8Mw+hK"}
):t.kind==="transform"?i.jsx(M,{
id:"OCy3k9"}
):t.kind==="rig-transform"?i.jsx(M,{
id:"f88wXe"}
):Fp(t)?PDe(t):i.jsx(M,{
id:"X44slE"}
)}
),i.jsx("span",{
className:jh.charName,children:e}
)]}
),t.kind==="path"&&i.jsxs(i.Fragment,{
children:[t.anchors.length<2&&i.jsx("div",{
className:Wr.hint,children:i.jsx(M,{
id:"WTCZcf"}
)}
),a&&o&&i.jsx(Zy,{
label:i.jsx(M,{
id:"X44slE"}
),value:t.gait??"walk",options:Gzt.map(O=>({
value:O,label:B[O]}
)),onChange:l}
),i.jsx(Zy,{
label:i.jsx(M,{
id:"Zc4YKz"}
),...$,value:t.aim==="subject"?t.subjectId??"":a?"travel":t.aim??"travel",options:[{
value:"travel",label:_._({
id:"DeTbo5"}
)}
,...a?[]:[{
value:"locked",label:_._({
id:"7dJlqT"}
)}
],...H],onChange:O=>{
O==="travel"||O==="locked"?c(O):c("subject",O||null)}
}
),i.jsx(mh,{
label:_._({
id:"l9wI00"}
),value:t.speedUnitsPerS,step:.1,min:Mit,onChange:s}
),!d&&i.jsx(Ws,{
variant:"quiet",onClick:u,children:i.jsx(M,{
id:"TLO3rY"}
)}
)]}
),t.kind==="clip"&&i.jsxs(i.Fragment,{
children:[i.jsx(Zy,{
label:i.jsx(M,{
id:"X44slE"}
),...$,value:t.clip,options:vGt.map(O=>({
value:O.id,label:F._(PU[O.id])}
)),onChange:h}
),i.jsx(mh,{
label:_._({
id:"gPwZFD"}
),value:t.durationS,step:.1,min:uVr,onChange:f}
)]}
),t.kind==="play"&&i.jsxs(i.Fragment,{
children:[i.jsxs("div",{
className:Wr.fieldRow,children:[i.jsxs("button",{
className:jh.playModeBtn,onClick:m,children:[i.jsx(K,{
name:"gamepad",size:"xs"}
),i.jsx("span",{
children:i.jsx(M,{
id:"T91vKp"}
)}
)]}
),i.jsx("span",{
className:Wr.label,children:t.samples.length>0?`${
t.durationS.toFixed(1)}
s`:i.jsx(M,{
id:"0m1C+q"}
)}
)]}
),i.jsx("div",{
className:jh.keySlots,children:qzt.map(O=>i.jsx(gVr,{
slotKey:O,clip:t.keymap[O],onBind:g,onEmptyClick:b}
,O))}
)]}
),t.kind==="rotate"&&i.jsxs(i.Fragment,{
children:[i.jsxs("label",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,children:i.jsx(M,{
id:"whUN+9"}
)}
),i.jsx("span",{
className:Wr.segmented,role:"group",children:hVr.map(O=>i.jsx("button",{
className:Ze(Wr.segment,t.axis===O&&Wr.active),onClick:()=>v(O),children:O.toUpperCase()}
,O))}
)]}
),i.jsx(mh,{
label:_._({
id:"a8cgA+"}
),value:t.degPerS,step:10,onChange:x}
),i.jsx(mh,{
label:_._({
id:"gPwZFD"}
),value:t.durationS,step:.5,min:bL,onChange:y}
)]}
),t.kind==="revolve"&&i.jsxs(i.Fragment,{
children:[i.jsx(Zy,{
label:i.jsx(M,{
id:"FDRwtd"}
),...$,value:t.centerObjectId??"",options:[{
value:"",label:_._({
id:"4axXHF"}
)}
,...n.map(O=>({
value:O.id,label:O.name}
))],onChange:O=>w(O||null)}
),i.jsx(mh,{
label:_._({
id:"a8cgA+"}
),value:t.degPerS,step:10,onChange:x}
),i.jsx(mh,{
label:_._({
id:"gPwZFD"}
),value:t.durationS,step:.5,min:bL,onChange:y}
)]}
),t.kind==="scale"&&i.jsxs(i.Fragment,{
children:[i.jsx(mh,{
label:_._({
id:"TamI8T"}
),value:t.factor,step:.1,min:.05,onChange:k}
),i.jsx(mh,{
label:_._({
id:"gPwZFD"}
),value:t.durationS,step:.5,min:bL,onChange:y}
)]}
),(t.kind==="transform"||t.kind==="rig-transform")&&i.jsxs(i.Fragment,{
children:[i.jsx(mh,{
label:_._({
id:"gPwZFD"}
),value:t.durationS,step:.5,min:bL,onChange:y}
),t.kind==="transform"&&j&&i.jsxs(i.Fragment,{
children:[i.jsx(a2,{
label:i.jsx(M,{
id:"p/78dY"}
),values:j.position,onAxisCommit:(O,W)=>I("position",O,W)}
),i.jsx(a2,{
label:i.jsx(M,{
id:"exWyD0"}
),values:j.rotation,onAxisCommit:(O,W)=>I("rotation",O,W)}
),i.jsx(a2,{
label:i.jsx(M,{
id:"bifv6N"}
),values:j.scale,onAxisCommit:(O,W)=>I("scale",O,W)}
),j.kind==="simple_figure"&&i.jsx(a2,{
label:i.jsx(M,{
id:"lVN9oC"}
),values:j.headRotation??[0,0,0],onAxisCommit:(O,W)=>I("headRotation",O,W)}
)]}
),r]}
),t.kind==="cam-move"&&i.jsxs(i.Fragment,{
children:[i.jsx(Zy,{
label:i.jsx(M,{
id:"QWdKwH"}
),...$,value:t.move,options:bP.map(O=>({
value:O,label:NDe(O)}
)),onChange:O=>C({
move:O}
)}
),yP.includes(t.move)&&i.jsx(Zy,{
label:i.jsx(M,{
id:"UJmAAK"}
),...$,value:t.subjectId??"",options:[{
value:"",label:T}
,...H],onChange:O=>C({
subjectId:O||null}
)}
),yP.includes(t.move)&&i.jsx(Nit,{
value:t.aimOffsetUnits,onChange:C}
),YLe.includes(t.move)&&i.jsxs(i.Fragment,{
children:[i.jsx(mh,{
label:_._({
id:"QiM6N+"}
),value:t.angleDeg,step:15,min:15,max:360,onChange:O=>C({
angleDeg:O}
)}
),i.jsxs("div",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,children:i.jsx(M,{
id:"MRB7nI"}
)}
),i.jsxs("span",{
className:Wr.segmented,role:"group",children:[i.jsx("button",{
className:Ze(Wr.segment,t.direction==="ccw"&&Wr.active),title:_._({
id:"n9kdXQ"}
),onClick:()=>C({
direction:"ccw"}
),children:i.jsx(K,{
name:"reset",size:"xs"}
)}
),i.jsx("button",{
className:Ze(Wr.segment,t.direction==="cw"&&Wr.active),title:_._({
id:"KZLpTS"}
),onClick:()=>C({
direction:"cw"}
),children:i.jsx(K,{
name:"refresh",size:"xs"}
)}
)]}
)]}
)]}
),QLe.includes(t.move)&&i.jsx(mh,{
label:_._({
id:"N9mcjz"}
),value:t.heightDeltaUnits,step:.5,min:.5,max:20,onChange:O=>C({
heightDeltaUnits:O}
)}
),JLe.includes(t.move)&&i.jsx(mh,{
label:_._({
id:"41WLYu"}
),value:Math.round(t.distanceScale*100),step:10,min:10,max:400,onChange:O=>C({
distanceScale:O/100}
)}
)]}
),t.kind==="cam-follow"&&i.jsx(Zy,{
label:i.jsx(M,{
id:"aaJhcT"}
),...$,value:t.objectId??"",options:[{
value:"",label:_._({
id:"cTjAIm"}
)}
,...H],onChange:O=>C({
objectId:O||null}
)}
),t.kind==="cam-path"&&i.jsxs(i.Fragment,{
children:[t.anchors.length<2&&i.jsx("div",{
className:Wr.hint,children:i.jsx(M,{
id:"MKrRdb"}
)}
),i.jsx(Zy,{
label:i.jsx(M,{
id:"52VY2S"}
),...$,value:t.aim==="subject"?t.subjectId??"":t.aim,options:[{
value:"travel",label:_._({
id:"DeTbo5"}
)}
,{
value:"locked",label:_._({
id:"JBYQjd"}
)}
,{
value:"",label:T}
,...H],onChange:O=>C(O==="travel"||O==="locked"?{
aim:O}
:{
aim:"subject",subjectId:O||null}
)}
),t.aim!=="locked"&&i.jsx(Nit,{
value:t.aimOffsetUnits,onChange:C}
),i.jsx(mh,{
label:_._({
id:"l9wI00"}
),value:t.speedUnitsPerS,step:.1,min:Mit,onChange:O=>C({
speedUnitsPerS:O}
)}
),!d&&i.jsx(Ws,{
variant:"quiet",onClick:u,children:i.jsx(M,{
id:"TLO3rY"}
)}
)]}
),Fp(t)&&i.jsxs(i.Fragment,{
children:[t.kind!=="cam-path"&&i.jsx(mh,{
label:_._({
id:"gPwZFD"}
),value:t.durationS,step:.5,min:bL,onChange:O=>C({
durationS:O}
)}
),t.kind==="cam-move"&&t.move==="dolly_zoom"&&i.jsx(mh,{
label:_._({
id:"9n19Pz"}
),value:t.focalLengthMm??A,step:1,min:q_,max:WA,onChange:O=>C({
focalLengthMm:O}
)}
),t.kind==="cam-transform"&&i.jsxs(i.Fragment,{
children:[j&&i.jsxs(i.Fragment,{
children:[i.jsx(a2,{
label:i.jsx(M,{
id:"p/78dY"}
),values:j.position,onAxisCommit:(O,W)=>I("position",O,W)}
),i.jsx(a2,{
label:i.jsx(M,{
id:"exWyD0"}
),values:j.rotation,onAxisCommit:(O,W)=>I("rotation",O,W)}
),i.jsx(mh,{
label:_._({
id:"9n19Pz"}
),value:j.focalLengthMm??A,step:1,min:q_,max:WA,onChange:N}
)]}
),r]}
),t.kind==="cam-manual"&&i.jsxs(i.Fragment,{
children:[i.jsx("div",{
className:Wr.hint,children:t.samples.length===0?i.jsx(M,{
id:"WCh3o9"}
):i.jsx(M,{
id:"45r0Wt"}
)}
),i.jsxs(Ws,{
variant:"quiet",onClick:E,children:[i.jsx(K,{
name:"phone-camera",size:"xs"}
),i.jsx("span",{
children:t.samples.length===0?i.jsx(M,{
id:"kW8chx"}
):i.jsx(M,{
id:"hkUyVQ"}
)}
)]}
)]}
)]}
),i.jsxs(Ws,{
variant:"quiet",onClick:P,children:[i.jsx(K,{
name:"delete",size:"xs"}
),i.jsx("span",{
children:i.jsx(M,{
id:"t/YqKh"}
)}
)]}
)]}
)}
function mh({
label:t,value:e,step:n,min:r,max:s,onChange:a}
){
const[o,l]=p.useState(null),c=()=>{
if(o===null)return;
const u=Number(o);
o!==""&&!Number.isNaN(u)&&a(u),l(null)}
,{
scrubHandlers:d}
=fBe({
value:e,step:n,min:r,max:s,onChange:a}
);
return i.jsxs("label",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,style:pBe,...d,children:t}
),i.jsx("input",{
type:"text",inputMode:"decimal",className:Ze(Wr.numberBox,jh.numberInput),value:o??String(e),onChange:u=>l(u.target.value),onBlur:c,onKeyDown:u=>{
u.key==="Enter"&&u.currentTarget.blur()}
}
)]}
)}
function mVr(t){
return t==="lmb"?_._({
id:"945seR"}
):t==="rmb"?_._({
id:"Tl2/KQ"}
):t.toUpperCase()}
function gVr({
slotKey:t,clip:e,onBind:n,onEmptyClick:r}
){
const{
i18n:s}
=Ia(),[a,o]=p.useState(!1);
return i.jsxs("span",{
className:Ze(jh.keySlot,a&&jh.keySlotDropActive),onDragOver:l=>{
l.dataTransfer.types.includes($v)&&(l.preventDefault(),l.dataTransfer.dropEffect="copy",o(!0))}
,onDragLeave:()=>o(!1),onDrop:l=>{
o(!1);
const c=MDe(l.dataTransfer.getData($v));
c?.kind==="clip"&&(l.preventDefault(),n(t,c.clip))}
,children:[i.jsx("span",{
className:jh.keySlotKey,title:mVr(t),children:i.jsx(JZt,{
keyName:t}
)}
),e?i.jsxs(i.Fragment,{
children:[i.jsx("span",{
className:jh.keySlotClip,children:ODe(e,s)}
),i.jsx("button",{
className:jh.keySlotClear,title:_._({
id:"4gj0on"}
),onClick:()=>n(t,null),children:i.jsx(K,{
name:"close",size:"xs"}
)}
)]}
):i.jsx("button",{
type:"button",className:jh.keySlotEmpty,onClick:r,children:i.jsx(M,{
id:"F/IjEH"}
)}
)]}
)}
function bVr(t){
const e=new Map,n=[];
for(const[r,s]of Object.entries(t)){
if(s.kind==="camera"||s.kind==="spotlight"||Xu(t,r))continue;
const a=(e.get(s.kind)??0)+1;
e.set(s.kind,a);
const o=s.kind==="cube"?_._({
id:"n056g0",values:{
kindIndex:a}
}
):s.kind==="sphere"?_._({
id:"FMp7Cl",values:{
kindIndex:a}
}
):s.kind==="cylinder"?_._({
id:"uyxqJS",values:{
kindIndex:a}
}
):s.kind==="humanoid"?_._({
id:"CMo67k",values:{
kindIndex:a}
}
):s.kind==="simple_figure"?_._({
id:"Mo+ojX",values:{
kindIndex:a}
}
):s.kind==="target"?_._({
id:"q1oG3Q",values:{
kindIndex:a}
}
):_._({
id:"yIxm6F",values:{
kindIndex:a}
}
);
n.push({
id:r,label:s.name??o}
)}
return n}
const yVr="_mmInput_oz3bw_6",vVr="_filmWithPhone_oz3bw_13",Pit={
mmInput:yVr,filmWithPhone:vVr}
,xVr=()=>[{
value:"off",label:_._({
id:"az8lvo"}
)}
,{
value:"subtle",label:_._({
id:"xjeLYy"}
)}
,{
value:"medium",label:_._({
id:"agPptk"}
)}
,{
value:"heavy",label:_._({
id:"McoVWm"}
)}
];
function wVr({
focalLengthMm:t,recordAspect:e,cameraShake:n,onFocalLengthChange:r,onRecordAspectChange:s,onCameraShakeChange:a,onFilmWithPhoneClick:o}
){
const[l,c]=p.useState(null),{
scrubHandlers:d}
=fBe({
value:t,step:1,min:q_,max:WA,onChange:r}
),u=()=>{
if(l===null)return;
const h=Number(l);
l!==""&&!Number.isNaN(h)&&r(Math.min(WA,Math.max(q_,h))),c(null)}
;
return i.jsxs(i.Fragment,{
children:[i.jsxs("div",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,style:pBe,...d,children:i.jsx(M,{
id:"VjcELh"}
)}
),i.jsxs("label",{
className:Wr.numberField,children:[i.jsx("input",{
type:"text",inputMode:"decimal",className:Ze(Wr.numberInput,Pit.mmInput),value:l??String(t),onChange:h=>c(h.target.value),onBlur:u,onKeyDown:h=>{
h.key==="Enter"&&h.currentTarget.blur()}
}
),i.jsx("span",{
className:Wr.unit,children:"mm"}
)]}
)]}
),i.jsx(Zy,{
label:i.jsx(M,{
id:"iKM2jY"}
),value:e,options:Zae.map(h=>({
value:h.key,label:h.key}
)),onChange:s}
),i.jsx(Zy,{
label:i.jsx(M,{
id:"bSanJc"}
),value:n,options:xVr(),onChange:a}
),i.jsxs("button",{
type:"button",className:Ze(Wr.select,Pit.filmWithPhone),onClick:o,children:[i.jsx(K,{
name:"phone-camera",size:"xs"}
),i.jsx(M,{
id:"kW8chx"}
)]}
)]}
)}
function _Vr({
settings:t,shadowless:e,onSpotlightChange:n,onSlideStart:r,onSlideEnd:s}
){
const a=[{
shape:"round",label:_._({
id:"LeIKtN"}
),title:_._({
id:"fzGT9V"}
)}
,{
shape:"square",label:_._({
id:"1DA6ap"}
),title:_._({
id:"/e0OAo"}
)}
],o=(l,c,d)=>i.jsxs("label",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,children:c}
),i.jsx("input",{
type:"range",className:Bm.slider,min:0,max:100,step:1,"aria-label":d,value:t[l],onPointerDown:u=>{
u.currentTarget.setPointerCapture(u.pointerId),r()}
,onPointerUp:s,onPointerCancel:s,onChange:u=>n({
[l]:Number(u.target.value)}
)}
)]}
);
return i.jsxs("div",{
className:Wr.rows,children:[i.jsxs("div",{
className:Wr.fieldRow,children:[i.jsx("span",{
className:Wr.label,children:i.jsx(M,{
id:"WkbAmY"}
)}
),i.jsx("span",{
className:Wr.segmented,role:"group",children:a.map(l=>i.jsx("button",{
type:"button",title:l.title,className:Ze(Wr.segment,t.shape===l.shape&&Wr.active),"aria-pressed":t.shape===l.shape,onClick:()=>n({
shape:l.shape}
),children:l.label}
,l.shape))}
)]}
),o("intensity",i.jsx(M,{
id:"Rc4Tlx"}
),_._({
id:"wJv3nH"}
)),o("diffusion",i.jsx(M,{
id:"GN9FtP"}
),_._({
id:"ay9uU+"}
)),e&&i.jsx("div",{
className:Wr.hint,children:i.jsx(M,{
id:"jNG72M"}
)}
)]}
)}
const kVr="_sidePanelSections_lpegt_4",SVr="_host_lpegt_15",TVr="_dragDimmed_lpegt_12",AVr="_panelSection_lpegt_26",CVr="_panelSectionTitle_lpegt_35",u$={
sidePanelSections:kVr,host:SVr,dragDimmed:TVr,panelSection:AVr,panelSectionTitle:CVr}
;
function EVr(t){
switch(t){
case void 0:return i.jsx(M,{
id:"l/UFPv"}
);
case"camera":return i.jsx(M,{
id:"m6Sktu"}
);
case"target":return i.jsx(M,{
id:"EENRfL"}
);
case"humanoid":return i.jsx(M,{
id:"KOHEah"}
);
case"simple_figure":return i.jsx(M,{
id:"QhfBRH"}
);
case"group":return i.jsx(M,{
id:"xkW49z"}
);
case"spotlight":return i.jsx(M,{
id:"xktNnJ"}
);
default:return i.jsx(M,{
id:"j2Eh3O"}
)}
}
function jVr({
panelsVisible:t,draggingComponent:e,draggingAction:n,widthPx:r,onWidthChange:s,objects:a,selectedId:o,selectedObject:l,authoredSelectedObject:c,selectionCount:d,selectionColorable:u,selectionColor:h,drivenBy:f,segment:m,segmentKeyframe:g,focalLengthMm:b,recordAspect:y,cameraShake:v,onSegmentSpeedChange:x,onSegmentGaitChange:w,onSegmentAimChange:k,isEditingPath:S,onSegmentEditPathClick:T,onSegmentClipChange:A,onSegmentDurationChange:C,onSegmentPlayClick:E,onSegmentPlayKeyChange:j,onSegmentEmptyActionClick:I,onSegmentObjectDurationChange:N,onSegmentRotateAxisChange:P,onSegmentObjectSpeedChange:F,onSegmentRevolveCenterChange:B,onSegmentScaleFactorChange:H,onSegmentCameraFieldsChange:z,onSegmentFlyClick:L,segmentPoseObject:$,onSegmentPoseAxisChange:O,onSegmentPoseFocalLengthChange:W,onSegmentRemoveClick:U,onSelectedAxisChange:V,cameraAim:G,cameraVerticalAimDeg:Z,onCameraVerticalAimChange:se,onSelectedColorPreview:X,onSelectedColorChange:te,selectedSpotlightShadowless:ne,onSelectedSpotlightChange:Q,onEditGestureStart:q,onEditGestureEnd:Y,onSelectedNameChange:re,onSelectedPersonKindChange:ae,onFocalLengthChange:ie,onRecordAspectChange:ge,onCameraShakeChange:pe,onFilmWithPhoneClick:ce}
){
const be=l?.kind==="camera",fe=t&&(!!l||!!m),we=m?.item.kind==="play",Ee=e||n&&!we;
return i.jsxs(IVr,{
hidden:!fe,dimmed:Ee,title:EVr(d>1?void 0:l?.kind),widthPx:r,onWidthChange:s,children:[t&&m&&i.jsx(Rit,{
icon:i.jsx(K,{
name:"film",size:"sm"}
),title:i.jsx(M,{
id:"RqGEko"}
),children:i.jsx(fVr,{
item:m.item,characterName:m.characterName,walksPath:m.walksPath,hasGait:m.hasGait,centerOptions:m.centerOptions,subjectOptions:m.subjectOptions,targetMarkerLabel:m.targetMarkerLabel,cameraFocalLengthMm:m.cameraFocalLengthMm,keyframeButton:g,onSpeedChange:x,onGaitChange:w,onAimChange:k,isEditingPath:S,onEditPathClick:T,onClipChange:A,onDurationChange:C,onPlayClick:E,onPlayKeyChange:j,onEmptyActionClick:I,onObjectDurationChange:N,onRotateAxisChange:P,onObjectSpeedChange:F,onRevolveCenterChange:B,onScaleFactorChange:H,onCameraFieldsChange:z,onFlyClick:L,poseObject:$,onPoseAxisChange:O,onPoseFocalLengthChange:W,onRemoveClick:U}
,m.item.id)}
),l&&i.jsxs(Rit,{
children:[i.jsx(M$r,{
object:l,authoredObject:c??void 0,selectionCount:d,drivenBy:f,isRigging:o?Xu(a,o):!1,cameraAim:G,verticalAimDeg:Z,color:h,onNameChange:re,onPersonKindChange:ae,onAxisChange:V,onVerticalAimChange:se,onColorPreview:X,onColorChange:u?te:void 0}
,o),l.kind==="spotlight"&&i.jsx(_Vr,{
settings:BR(l),shadowless:ne,onSpotlightChange:Q,onSlideStart:q,onSlideEnd:Y}
),be&&i.jsx(wVr,{
focalLengthMm:b,recordAspect:y,cameraShake:v,onFocalLengthChange:ie,onRecordAspectChange:ge,onCameraShakeChange:pe,onFilmWithPhoneClick:()=>o&&ce(o)}
)]}
)]}
)}
function IVr({
hidden:t,dimmed:e,title:n,widthPx:r,onWidthChange:s,children:a}
){
const{
mounted:o,className:l}
=eZt(!t);
return o?i.jsxs("aside",{
className:Ze(Zr.hudWindow,u$.host,l,e&&u$.dragDimmed),style:{
width:r}
,children:[i.jsx(Dhe,{
edge:"right",sign:1,onSizePx:s}
),i.jsx("div",{
className:Zr.title,children:n}
),i.jsx("div",{
className:Ze(u$.sidePanelSections,Zr.hudScroll),children:a}
)]}
):null}
function Rit({
icon:t,title:e,children:n}
){
return i.jsxs("section",{
className:u$.panelSection,children:[e&&i.jsxs("h3",{
className:u$.panelSectionTitle,children:[t,i.jsx("span",{
children:e}
)]}
),n]}
)}
function MVr(t){
if(Fp(t))return PDe(t);
switch(t.kind){
case"path":return _._({
id:"I6gXOa"}
);
case"play":return _._({
id:"T91vKp"}
);
case"clip":return _._({
id:"X44slE"}
);
case"rotate":return _._({
id:"BulyBf"}
);
case"revolve":return _._({
id:"NP8KUz"}
);
case"scale":return _._({
id:"bifv6N"}
);
default:return _._({
id:"OCy3k9"}
)}
}
function NVr(t){
const e=(U,V,G,Z)=>{
const se=t.objects.peek();
for(const X of t.selectedIds.peek()){
const te=se[X];
!te||!$Hr(te.kind,U)||t.updateObjectTransform(X,VHr(te,U,V,G,Z))}
}
,n=U=>{
const V=t.objects.peek(),G=V[t.selectedId.peek()??""],Z=G?.targetId?V[G.targetId]:void 0;
if(!G||!Z)return;
const se=T8r(G.position,Z.position,U);
t.updateObjectTransform(G.targetId,{
position:[Z.position[0],se,Z.position[2]]}
)}
,r=U=>{
t.setObjectsColor(t.selectedIds.peek(),U)}
,s=U=>{
t.previewObjectsColor(t.selectedIds.peek(),U)}
,a=U=>{
for(const V of t.selectedIds.peek())t.setSpotlight(V,U)}
,o=U=>{
const V=t.selectedId.peek();
V&&t.setObjectName(V,U)}
,l=U=>{
const V=t.selectedId.peek();
V&&t.pickPersonKind(V,U,"panel")}
,c=U=>{
const V=t.selectedSegment.peek();
V&&U(V)}
,d=U=>c(V=>t.updatePathItemSpeed(V.trackId,V.itemId,U)),u=U=>c(V=>t.updatePathItemGait(V.trackId,V.itemId,U)),h=(U,V)=>c(G=>t.updatePathItemAim(G.trackId,G.itemId,U,V)),f=()=>c(U=>t.enterPathEdit(U.trackId,U.itemId)),m=U=>c(V=>t.updateClipItem(V.trackId,V.itemId,{
clip:U}
)),g=U=>c(V=>t.updateClipItem(V.trackId,V.itemId,{
durationS:U}
)),b=()=>c(U=>t.startPlaySession(U.trackId,U.itemId)),y=(U,V)=>c(G=>t.updatePlayItemKey(G.trackId,G.itemId,U,V)),v=U=>c(V=>t.setObjectItemDuration(V.trackId,V.itemId,U)),x=U=>c(V=>t.setRotateAxis(V.trackId,V.itemId,U)),w=U=>c(V=>t.setObjectItemSpeed(V.trackId,V.itemId,U)),k=U=>c(V=>t.setRevolveCenter(V.trackId,V.itemId,U)),S=U=>c(V=>t.setScaleFactor(V.trackId,V.itemId,U)),T=U=>c(V=>t.setCameraItemFields(V.trackId,V.itemId,U)),A=()=>c(U=>t.flyManualSegment(U.trackId,U.itemId)),C=U=>{
const V=B(U);
return V?.kind!=="transform"&&V?.kind!=="cam-transform"?null:t.show.peek().tracks.find(G=>G.id===U.trackId)?.characterId??null}
,E=U=>{
const V=t.livePose.peek();
if(!V||V.id!==U)return{
}
;
const{
position:G,rotation:Z,scale:se,headRotation:X}
=V;
return{
position:G,rotation:Z,scale:se,...X&&{
headRotation:X}
}
}
,j=(U,V)=>{
const G=B(U),Z=t.show.peek().tracks.find(ne=>ne.id===U.trackId);
if(V.kind!=="simple_figure"||G?.kind!=="transform"||!Z)return;
const se=F(U)?.localS;
if(se==null)return;
const X=t.livePose.peek(),te=G.keys.find(ne=>ne.headRotation)?.tS??1/0;
return se<te&&X?.id===C(U)&&X.headRotation?X.headRotation:k2r(Z.items,G,t.performanceTimeS.peek()-G.startS,V.headRotation)}
,I=(U,V)=>{
const G=C(U),Z=t.objects.peek(),se=G?Z[G]:void 0;
if(!G||!se)return;
const X=j(U,se),te={
...se,...E(G),...X&&{
headRotation:X}
}
,ne=V(te),{
headRotation:Q,...q}
=te,Y={
...q,...ne}
;
(B(U)?.kind==="cam-transform"?t.captureFocusedCameraPose({
...Zo(Y,Z),focalLengthMm:Y.focalLengthMm}
):t.captureFocusedTransformPose(Y))||t.updateObjectTransform(G,V(se))}
,N=(U,V,G)=>c(Z=>I(Z,se=>{
const X=[...se[U]??[0,0,0]];
return X[V]=G,{
[U]:X}
}
)),P=U=>c(V=>I(V,()=>({
focalLengthMm:U}
))),F=U=>{
const V=rx(t.show.peek()).tracks.find(se=>se.trackId===U.trackId)?.items.find(se=>se.item.id===U.itemId);
if(!V)return null;
const G=t.performanceTimeS.peek()-V.startS;
return{
localS:G>=0&&G<=V.endS-V.startS?G:null,startS:V.startS}
}
,B=U=>t.show.peek().tracks.find(V=>V.id===U.trackId)?.items.find(V=>V.id===U.itemId),H=U=>{
const V=B(U);
return V&&Zzt(V)?V.keys:[]}
,z=()=>c(U=>{
const V=F(U);
if(!V||V.localS===null)return;
const G=B(U),Z=wbe(H(U),V.localS);
if(Z.currentTS!==null){
G?.kind==="rig-transform"?t.removeRigKeyframe(U.trackId,U.itemId,Z.currentTS):G?.kind==="cam-transform"?t.removeCameraKeyframe(U.trackId,U.itemId,Z.currentTS):t.removeTransformKeyframe(U.trackId,U.itemId,Z.currentTS);
return}
if(G?.kind==="cam-transform"){
t.captureFocusedCameraPose(),t.onKeyframeUse();
return}
if(G?.kind==="rig-transform"){
t.addSampledRigKeyframe(U.trackId,U.itemId,V.localS),t.onKeyframeUse();
return}
const se=t.show.peek().tracks.find(te=>te.id===U.trackId),X=se?t.objects.peek()[se.characterId]:void 0;
X&&(t.addTransformKeyframe(U.trackId,U.itemId,{
tS:V.localS,position:[...X.position],rotation:[...X.rotation],scale:[...X.scale]}
),t.onKeyframeUse())}
),L=U=>c(V=>{
const G=F(V);
if(!G)return;
const Z=G.localS??(U==="prev"?Number.POSITIVE_INFINITY:0),se=wbe(H(V),Z),X=U==="prev"?se.prevTS:se.nextTS;
X!==null&&t.seekPerformance(G.startS+X)}
),$=()=>c(U=>t.removePerformanceItem(U.trackId,U.itemId)),O=Mt(()=>{
const U=he(t.selectedSegment);
he(t.performanceTimeS),he(t.show);
const V=U?F(U):null,G=U?H(U):[],Z=wbe(G,V?.localS??Number.NaN);
return i.jsx(pVr,{
enabled:V?.localS!=null,onKeyframe:Z.currentTS!==null,hasPrev:Z.prevTS!==null,hasNext:Z.nextTS!==null,onPrevClick:()=>L("prev"),onToggleClick:z,onNextClick:()=>L("next")}
)}
);
return{
SidePanel:Mt(()=>{
const U=he(t.objects),V=he(t.selectedId),G=V!==null&&U[V]||null,Z=he(t.livePose),se=(be,fe)=>fe&&Z&&Z.id===be?{
...fe,position:Z.position,rotation:Z.rotation,scale:Z.scale,...Z.headRotation&&{
headRotation:Z.headRotation}
}
:fe,X=se(V,G),te=he(t.selectedIds),ne=be=>be==="cube"||be==="sphere"||be==="cylinder"||be==="prop"||be==="humanoid"||be==="simple_figure"||be==="group",Q=te.some(be=>ne(U[be]?.kind)),q=G?.kind==="group"?Object.values(U).find(be=>be.parentId===V)?.color:G?.color,Y=he(t.show),re=V&&X!==G?(()=>{
const be=Y.tracks.find(Ee=>Ee.characterId===V);
if(!be)return null;
const fe=t.performanceTimeS.peek(),we=be.items.find(Ee=>fe>=Ee.startS&&fe<Ee.startS+yd(Ee));
return we?MVr(we):null}
)():null,ae=be=>Y.tracks.find(fe=>fe.characterId===be)?.items??[];
let ie,ge;
if(X?.kind==="camera"&&V)if(!lq(X,ae(V)))ie="full";
else{
ie="vertical";
const be=X.targetId?U[X.targetId]:void 0;
be&&(ge=S8r(X.position,be.position))}
const pe=he(t.selectedSegment);
let ce=null;
if(pe){
const be=Y.tracks.find(we=>we.id===pe.trackId),fe=be?.items.find(we=>we.id===pe.itemId);
if(be&&fe){
const we=Object.entries(U).filter(([ue,oe])=>ue