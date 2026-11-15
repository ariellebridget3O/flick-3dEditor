e=5,ere={
animation:{
clip:"idle",playing:!1}
}
,Bst=()=>({
rotation:[0,Math.PI,0]}
),rL=[4,WWt,4],sL=[0,1,0],sMr=gqt;
function aMr(t,e){
const n=new Set(t);
return t.filter(r=>{
const s=e[r]?.parentId;
return!s||!n.has(s)}
)}
function bqt(){
return _._({
id:"4e78ft"}
)}
class iMr{
constructor(e={
}
){
this.a=e}
objects=Ne({
}
);
draggingComponent=Ne(null);
objectsOrderVersion=Ne(0);
selectedIds=Ne([]);
selectedId=Ne(null);
transformMode=Ne("translate");
livePose=Ne(null);
setSelection=e=>{
this.selectedIds.set(e),this.selectedId.set(e.length?e[e.length-1]:null)}
;
deselect=e=>{
const n=this.selectedIds.peek();
n.includes(e)&&this.setSelection(n.filter(r=>r!==e))}
;
spawnIndex=0;
clipboard=null;
setDraggingComponent=e=>this.draggingComponent.set(e);
clearDraggingComponent=()=>this.draggingComponent.set(null);
addCube=()=>this.addObject("cube");
addSphere=()=>this.addObject("sphere");
addCylinder=()=>this.addObject("cylinder");
addHumanoid=()=>this.addObject("humanoid",ere);
addSimpleFigure=()=>this.addObject("simple_figure",Bst());
addTarget=()=>this.addObject("target");
addSpotlight=()=>this.addObject("spotlight");
ensureTargetMarker=(e,n)=>{
const r=this.objects.peek()[e];
if(r?.kind!=="camera")return null;
if(r.targetId&&this.objects.peek()[r.targetId])return r.targetId;
const s=an();
return this.objects[s].set({
kind:"target",position:r.lastAimPosition??n,rotation:[0,0,0],scale:[1,1,1],name:r.lastAimName??this.defaultName("target")}
),this.objects[e].set({
...r,targetId:s}
),s}
;
dropTargetMarker=e=>{
const n=this.objects.peek()[e];
if(n?.kind!=="camera"||!n.targetId)return;
const r=n.targetId,s=this.objects.peek()[r],{
targetId:a,...o}
=n;
this.objects[e].set(s?{
...o,lastAimPosition:[...s.position],...s.name?{
lastAimName:s.name}
:{
}
}
:o),s&&this.remove(r)}
;
addCameraMarker=e=>{
const r=Object.values(this.objects.peek()).filter(c=>c.kind==="camera").length*nL,s=e?[e[0],e[1]]:[rL[0]+r,rL[2]],a=e?[e[0]+(sL[0]-rL[0]),e[1]+(sL[2]-rL[2])]:[sL[0]+r,sL[2]],o=[s[0],rL[1],s[1]],l=an();
return this.objects[l].set({
kind:"camera",position:o,rotation:kv(o,[a[0],sL[1],a[1]]),scale:[1,1,1],name:this.defaultName("camera")}
),this.setSelection([l]),this.a.onObjectAdded?.("camera"),l}
;
defaultName=(e,n)=>{
const r=s=>`${
s}
 ${
Object.values(this.objects.peek()).filter(a=>a.kind===e).length+1}
`;
switch(e){
case"cube":return r(_._({
id:"/DQKHb"}
));
case"sphere":return r(_._({
id:"01Lw5H"}
));
case"cylinder":return r(_._({
id:"eawZbq"}
));
case"humanoid":return r(_._({
id:"DhTbJv"}
));
case"simple_figure":return r(_._({
id:"YUAoyO"}
));
case"camera":return r(_._({
id:"rT2cV+"}
));
case"target":return r(_._({
id:"Yrrg+y"}
));
case"spotlight":return r(_._({
id:"k04a2t"}
));
case"prop":return n&&zh[n]?wU(n,_):void 0;
default:return}
}
;
createObject=(e,n={
}
,r={
}
)=>this.addObject(e,n,void 0,r);
addObject=(e,n={
}
,r,s={
}
)=>{
const a=an();
let o,l;
if(r)[o,l]=r;
else{
const u=this.spawnIndex++%(V2e*rMr);
o=u%V2e*nL-3,l=Math.floor(u/V2e)*nL}
const c=e==="spotlight"?sGt([o,l]):{
position:[o,UWt(e),l],rotation:[0,0,0]}
,d=n.name===void 0?this.defaultName(e,n.propKey):void 0;
return this.objects[a].set({
kind:e,...c,scale:[1,1,1],...d&&{
name:d}
,...n}
),s.select!==!1&&this.setSelection([a]),this.a.onObjectAdded?.(e,n.propKey),a}
;
addComponent=(e,n)=>{
switch(e.kind){
case"cube":case"sphere":case"cylinder":return this.addObject(e.kind,{
}
,n);
case"camera":return this.addCameraMarker(n);
case"target":return this.addObject("target",{
}
,n);
case"spotlight":return this.addObject("spotlight",{
}
,n);
case"humanoid":return this.addObject("humanoid",ere,n);
case"simple_figure":return this.addObject("simple_figure",Bst(),n);
case"prop":return e.propKey in zh?this.addObject("prop",{
propKey:e.propKey}
,n):void 0}
}
;
addProp=e=>{
if(e in zh)return this.addObject("prop",{
propKey:e}
)}
;
selectObject=e=>{
this.setSelection(e===null?[]:[e])}
;
isAimPair=(e,n)=>{
const r=this.objects.peek();
return r[e]?.targetId===n||r[n]?.targetId===e}
;
toggleSelect=e=>{
const n=this.selectedIds.peek();
if(n.includes(e)){
this.setSelection(n.filter(r=>r!==e));
return}
this.setSelection([...n.filter(r=>!this.isAimPair(r,e)),e])}
;
clearSelection=()=>this.setSelection([]);
setSelectedIds=e=>this.setSelection(e);
isGroupable=e=>e!==void 0&&e.kind!=="group"&&e.parentId===void 0;
transformOf=e=>({
position:e.position,rotation:e.rotation,scale:e.scale}
);
groupSelection=()=>{
const e=this.objects.peek(),n=this.selectedIds.peek().filter(c=>e[c]),r=n.filter(c=>this.isGroupable(e[c])),s=n.filter(c=>!this.isGroupable(e[c]));
if(r.length<2)return{
groupId:null,skipped:s}
;
const a=[0,0,0];
for(const c of r){
const d=e[c].position;
a[0]+=d[0]/r.length,a[1]+=d[1]/r.length,a[2]+=d[2]/r.length}
const o={
position:a,rotation:[0,0,0],scale:[1,1,1]}
,l=an();
this.objects[l].set({
kind:"group",...o}
);
for(const c of r){
const d=e[c],u=pie(o,this.transformOf(d));
this.objects[c].set({
...d,...u,parentId:l}
)}
return this.setSelection([l]),{
groupId:l,skipped:s}
}
;
ungroup=e=>{
const n=this.objects.peek(),r=n[e];
if(r?.kind!=="group")return;
const s=this.transformOf(r),a=[];
for(const[o,l]of Object.entries(n)){
if(l.parentId!==e)continue;
const c=VWt(s,this.transformOf(l)),{
parentId:d,...u}
=l;
this.objects[o].set({
...u,...c}
),a.push(o)}
this.objects[e].delete(),this.setSelection(a)}
;
addToGroup=(e,n)=>{
const r=this.objects.peek(),s=r[e];
if(s?.kind!=="group")return;
const a=this.transformOf(s);
for(const o of n){
const l=r[o];
if(!this.isGroupable(l))continue;
const c=pie(a,this.transformOf(l));
this.objects[o].set({
...l,...c,parentId:e}
)}
}
;
expandForClone=e=>{
const n=this.objects.peek(),r={
}
,s=a=>{
const o=n[a];
if(!(!o||r[a])){
if(r[a]=o,o.kind==="group")for(const[l,c]of Object.entries(n))c.parentId===a&&s(l);
o.kind==="camera"&&o.targetId&&s(o.targetId)}
}
;
for(const a of e)s(a);
return r}
;
writeSubgraph=e=>{
const n=new Map;
for(const a of Object.keys(e))n.set(a,an());
const r=this.objects.peek(),s=a=>{
if(a)return n.get(a)??(r[a]?a:void 0)}
;
for(const[a,o]of Object.entries(e)){
const l=structuredClone(o);
l.parentId=s(l.parentId),l.targetId=s(l.targetId),this.objects[n.get(a)].set(l)}
return n}
;
copySelectedObject=()=>{
const e=this.objects.peek(),n=this.selectedIds.peek().filter(r=>e[r]&&!Xu(e,r));
return n.length===0?!1:(this.clipboard={
sub:structuredClone(this.expandForClone(n)),roots:n}
,!0)}
;
duplicateObjectAt=e=>{
const n=this.objects.peek(),r=n[e.id];
if(!r||Xu(n,e.id))return null;
const s=this.expandForClone([e.id]),a=s[e.id],o={
position:e.position,rotation:r.kind==="camera"?a.rotation:e.rotation,scale:r.kind==="camera"?a.scale:e.scale}
;
s[e.id]={
...a,...o}
;
const l=r.kind==="camera"?r.targetId:void 0;
l&&s[l]&&e.targetPosition&&(s[l]={
...s[l],position:e.targetPosition}
);
const c=this.writeSubgraph(s),d=c.get(e.id);
return this.setSelection([d]),{
id:d,idMap:c}
}
;
pasteObject=()=>{
if(!this.clipboard)return null;
const{
sub:e,roots:n}
=this.clipboard,r=o=>[o[0]+nL,o[1],o[2]+nL],s={
}
;
for(const[o,l]of Object.entries(e)){
const c=l.parentId!==void 0&&e[l.parentId]!==void 0;
s[o]=c?l:{
...l,position:r(l.position)}
}
const a=this.writeSubgraph(s);
return this.setSelection(n.map(o=>a.get(o)).filter(o=>!!o)),a}
;
clipboardObjectIds=()=>this.clipboard?Object.keys(this.clipboard.sub):[];
deleteObject=e=>Xu(this.objects.peek(),e)?[]:this.remove(e);
remove=e=>{
const n=this.objects.peek()[e];
if(!n)return[];
const r=n.kind==="group"?Object.entries(this.objects.peek()).filter(([,o])=>o.parentId===e).map(([o])=>o):[];
this.objects[e].delete(),this.deselect(e),n.kind==="target"&&this.unlinkTarget(e);
const s=n.kind==="camera"&&n.targetId?this.remove(n.targetId):[],a=r.flatMap(o=>this.remove(o));
return[e,...s,...a]}
;
unlinkTarget=e=>{
for(const[n,r]of Object.entries(this.objects.peek())){
if(r.kind!=="camera"||r.targetId!==e)continue;
const{
targetId:s,...a}
=r;
this.objects[n].set(a)}
}
;
reorderObject=(e,n)=>{
const r=this.objects.peek();
if(!(e in r)||e===n)return;
const s=Object.keys(r).filter(l=>l!==e),a=n?s.indexOf(n):-1;
a===-1?s.push(e):s.splice(a,0,e);
const o={
}
;
for(const l of s)o[l]=r[l];
this.objects.set(o),this.objectsOrderVersion.set(this.objectsOrderVersion.peek()+1)}
;
updateObjectTransform=(e,n)=>{
const r=this.objects.peek()[e];
r&&this.objects[e].set({
...r,...n}
)}
;
setObjectColor=(e,n)=>{
this.setObjectsColor([e],n)}
;
setObjectsColor=(e,n)=>{
clearTimeout(this.colorCommitTimer);
const r=this.colorPreview.peek();
r&&this.colorPreview.set(null);
const s=this.objects.peek(),a={
...s}
,o=(l,c)=>{
for(const d of this.paintedBy(l)){
const{
color:u,...h}
=s[d];
a[d]=c===void 0?h:{
...h,color:c}
}
}
;
r&&o(r.ids,r.color),o(e,n),this.objects.set(a)}
;
commitColorPreview=()=>{
this.colorPreview.peek()&&this.setObjectsColor([],void 0)}
;
colorPreview=Ne(null);
colorCommitTimer;
previewObjectsColor=(e,n)=>{
const r={
ids:this.paintedBy(e),color:n}
;
this.colorPreview.set(r),clearTimeout(this.colorCommitTimer),this.colorCommitTimer=setTimeout(this.commitColorPreview,sMr)}
;
paintedBy=e=>{
const n=this.objects.peek();
return e.flatMap(r=>n[r]?n[r].kind!=="group"?[r]:Object.keys(n).filter(s=>n[s].parentId===r):[])}
;
setSpotlight=(e,n)=>{
const r=this.objects.peek()[e];
if(r?.kind!=="spotlight")return;
const s={
...BR(r),...n}
;
this.objects[e].set({
...r,spotlight:{
shape:s.shape,intensity:gie(s.intensity),diffusion:gie(s.diffusion)}
}
)}
;
setObjectName=(e,n)=>{
const r=this.objects.peek()[e];
if(!r)return;
const s=n.trim(),{
name:a,...o}
=r;
this.objects[e].set(s===""?o:{
...o,name:s}
)}
;
setObjectAnimation=(e,n)=>{
const r=this.objects.peek()[e];
r&&this.objects[e].set({
...r,animation:{
clip:n,playing:r.animation?.playing??!0}
}
)}
;
setObjectAnimationPlaying=(e,n)=>{
const r=this.objects.peek()[e];
r&&this.objects[e].set({
...r,animation:{
clip:r.animation?.clip??"idle",playing:n}
}
)}
;
setObjectPose=(e,n)=>{
const r=this.objects.peek()[e];
r&&this.objects[e].set({
...r,animation:{
clip:n,playing:!1}
}
)}
;
setPersonKind=(e,n)=>{
const r=this.objects.peek()[e];
if(!r||!el(r.kind)||r.kind===n)return;
const{
animation:s,name:a,...o}
=r,l=r.kind==="humanoid"?_._({
id:"DhTbJv"}
):_._({
id:"YUAoyO"}
),c=a?.startsWith(`${
l}
 `)&&/^\d+$/.test(a.slice(l.length+1));
this.objects[e].set({
...o,kind:n,...n==="humanoid"&&ere,...a!==void 0&&{
name:c?this.defaultName(n):a}
}
)}
;
rotateAvailable=Ne(!0);
setRotateAvailable=e=>{
this.rotateAvailable.set(e)}
;
setTransformMode=e=>{
if(e==="rotate"&&!this.rotateAvailable.peek()){
ot.warning(bqt());
return}
this.transformMode.set(e)}
;
setObjectsOnly=e=>{
this.objects.set(e)}
;
loadObjects=e=>{
this.commitColorPreview(),this.setSelection([]),this.objects.set(e),this.spawnIndex=Object.keys(e).length}
}
const oMr=/\[[^\]]*\]/g,lMr=/[\p{
Extended_Pictographic}
\p{
Emoji_Modifier}
\u{
1F1E6}
-\u{
1F1FF}
]|\u200D|\uFE0E|\uFE0F/gu;
function hje(t){
return t.replace(oMr,"").replace(lMr,"").trim().length>0}
const cMr=/^[A-Za-z0-9]{
20}
$/;
function WDe(t){
return typeof t=="string"&&cMr.test(t)}
const dMr=[{
modelId:"experiment",requiresEarlyAccess:!0}
];
function GDe(t){
return dMr.some(e=>e.modelId===t&&e.requiresEarlyAccess)}
function uMr(t,e,n=!1,r){
return t.filter(s=>s.internalOnly&&!n?!1:s.hiddenFromPicker?s.id===r:!(GDe(s.id)&&!e))}
function bq(t){
return t.type===Ie.PLACEHOLDER&&t.targetMediaType?t.targetMediaType:t.type}
function yqt(t){
const e=[];
return e.push(t.measured?`${
t.what}
 is ${
t.measured}
.`:`${
t.what}
.`),t.limit&&e.push(`${
t.model??"This model"}
 ${
t.limit}
.`),e.push(t.fix),e.join(" ")}
function U2e(t){
return`${
yqt(t)}
 Nothing was created or billed.`}
function g0(t){
return{
isValid:!1,constraintWarning:yqt(t),refusal:t}
}
const F0=t=>`${
Number.isInteger(t)?t:t.toFixed(1)}
 seconds`,hMr=new Set(["wan3.0-extend","seedance-2.5-extend"]);
function pMr(t){
if(typeof t!="string")return null;
const e=t.split(/[?#]/)[0]??"",n=e.substring(e.lastIndexOf("/")+1),r=n.lastIndexOf(".");
if(r<0)return null;
const s=n.substring(r+1).toLowerCase();
return/^[a-z0-9]{
2,5}
$/.test(s)?s:null}
function EY(t){
const e=t?.data??{
}
;
return String(e.user_input_title||e.auto_generated_title||"untitled")}
function Hst(t){
return`${
Math.round(t/(1024*1024))}
MB`}
function z2e(t,e,n,r,s,a){
const o=e.toLowerCase(),l=a.clips.map(h=>h.duration===void 0?`"${
h.title}
"`:`"${
h.title}
" ${
F0(h.duration)}
`).join(", "),c=l?` (${
l}
)`:"",d=s==="total",u=`${
F0(t)}
${
d?" in total":""}
${
c}
`;
return n!==void 0&&t<n?{
code:"duration_min",what:e,measured:u,model:a.modelName,limit:d?`needs at least ${
F0(n)}
 of ${
o}
 in total`:`needs each ${
o}
 to be at least ${
F0(n)}
`,fix:"Use a longer clip."}
:r!==void 0&&t>r?{
code:"duration",what:e,measured:u,model:a.modelName,limit:d?`takes at most ${
F0(r)}
 of ${
o}
 in total`:`takes ${
o}
 of at most ${
F0(r)}
 each`,fix:"Trim it or pick a shorter clip."}
:null}
class fMr{
actions=new Map;
convertOldActionType(e){
return{
TEXT_TO_IMAGE:Wt.TextToImage,IMAGE_TO_IMAGE:Wt.EditImage,IMAGE_STYLE_TRANSFER:Wt.ImageStyleTransfer,IMAGE_REMOVE_BACKGROUND:Wt.ImageRemoveBackground,IMAGE_EDIT:Wt.EditImage,IMAGE_UPSCALE:Wt.ImageUpscale,IMAGE_TO_VI