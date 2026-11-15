/*
 * ============================================================================
 * flick.art 3D Stage editor — RAW DE-MINIFIED EXCERPTS (UX runtime logic)
 * Bundle: index-DBE17t4T.js (13,457,064 bytes, one line, minified)
 * Extracted by static analysis; sections listed below. Minified identifiers
 * preserved. See EDITOR_UX.md for the annotated semantics.
 * ============================================================================
 */


/*==============================================================================
 * 1. VIEWPORT RUNTIME uZr — top-level editor loop (wires every subsystem)
 * source file: tmp_b/viewport_ctor.js
 ==============================================================================*/
d,u),e.clearDepth(),e.render(s,a),e.setScissorTest(!1),e.setViewport(0,0,v.x,v.y),e.autoClear=C}return{tick:k,render:S,dispose:()=>{Kd(s),Kd(d),l?.dispose()}}}const cZr=new Ge,hQ=(t,e)=>t[0]===e[0]&&t[1]===e[1]&&t[2]===e[2],dZr=500;function uZr(t){const e=COr(t),n=Dqr(e);n.orbit.addEventListener("start",t.markOrbited);const r={detachIfAttached:()=>{},reseat:()=>{}},s={isMeshDragged:()=>!1,isViewportFilming:()=>!1,foldResolvers:null},a=AWr(e,r),o=xqr(e,{majorJointsOf:a.majorJointsOf,boneOf:a.boneOf}),l=pZt({camera:e.camera,meshById:e.meshById,scene:e.scene}),c=TOr({sun:n.sun,applyDaylight:n.applyDaylight,light:()=>t.light.peek(),bounds:()=>l.bounds(),roots:()=>e.meshById.values()}),d=oOr({scene:e.scene,gpu:e.renderer.capabilities,roots:function*(){for(const pe in t.objects.peek()){const ce=e.meshById.get(pe);ce&&(yield ce)}},settingsOf:pe=>BR(t.objects.peek()[pe]??{}),drawBeams:!0});e.planningAids.push(()=>[d.beams]),e.disposers.push(d.dispose),e.renderer.shadowMap.autoUpdate=!1;const u=AOr(c),h=Jqr(),f=hKt(e.renderer);e.disposers.push(f.dispose);const m=()=>Dje(e.renderer)&&t.finishEnabled.peek(),g=Xqr();let b=!1;const y=pe=>{b=pe.type==="pointerdown"};let v=-1/0;const x=()=>{v=performance.now()};for(const pe of["pointerdown","pointerup","dragend"])window.addEventListener(pe,y,!0),e.disposers.push(()=>window.removeEventListener(pe,y,!0));window.addEventListener("wheel",x,{capture:!0,passive:!0}),e.disposers.push(()=>window.removeEventListener("wheel",x,!0));const w=UGr(e,{isMeshDragged:pe=>s.isMeshDragged(pe),repaintViewport:()=>{l.tick(),m()&&f.repaint(e.camera)?O.isViewportFilming()||ae():re(),U.render()}}),k=new Xo,S=FUr(e,k),T=YUr(e,n.orbit),A=pWr(e,{orbit:n.orbit,walkableSurfaces:n.walkableSurfaces,applyCameraModeFov:w.applyCameraModeFov,updateFrameGuide:w.updateFrameGuide,pilot:k,applyPhoneAim:S.applyAim,captureSpawnPose:S.captureSpawnPose,gizmoLink:r,rigHandles:o,boneOf:a.boneOf,clipLocalOf:a.clipLocalOf,setLiveRigDrag:a.setLiveRigDrag,foldResolvers:(pe,ce)=>s.foldResolvers?.(pe,ce)??null,sceneBounds:()=>l.bounds(),addNavProgress:t.addNavProgress,centerViewOn:pe=>{T.centerOn(pe.point),E.rippleAt(pe)},focusObject:T.focusObject}),C=()=>t.mode.peek()==="edit"&&t.playSession.peek()===null&&!O.isViewportFilming(),E=CGr(e,{floor:n.floor,isEditView:C,gizmoHot:A.gizmoHot}),j=pGr(e,{isEditView:C,strokeEnabled:m,hoveredId:E.hoveredId});BUr(e);const I=CWr(e);VUr(e);const N=aqr(e,{orbit:n.orbit,walkableSurfaces:n.walkableSurfaces}),P=pe=>{const ce=t.drawPreview.peek();return A.isDraggingMesh(pe)||!!ce&&e.meshById.get(ce.id)===pe},F=new Ge,B=new qn,H=new va;function z(){const pe=t.drawPreview.peek(),ce=pe?e.meshById.get(pe.id):void 0;!pe||!ce||(Hie(ce,F.set(...pe.position),B.setFromEuler(H.set(...pe.rotation))),pe.look&&t.objects.peek()[pe.id]?.kind==="simple_figure"&&o$(ce,kje(pe.look)))}const L=pe=>{const ce=t.drawPreview.peek();ce?.look&&t.objects.peek()[ce.id]?.kind==="humanoid"&&pe.set(ce.id,IZt(pe.get(ce.id)??{},jZt(ce.look))),a.setRigOffsets(pe)},$=jGr(e,{walkableSurfaces:n.walkableSurfaces,isMeshDragged:P,setPlaybackClips:a.setPlaybackClips,setRigOffsets:L,livePlay:N.current,rigPoseObjectId:()=>t.rigPoseObjectId.peek()||null});s.isMeshDragged=P;const O=mqr(e,{showSelectionRings:j.showSelectionRings,strokeSelection:j.strokeSelection,forgetStroke:j.forgetStroke,orbit:n.orbit,detachGizmo:A.detachGizmo,applyMode:A.applyMode,updateCameraMarkerVisual:w.updateCameraMarkerVisual,isMeshDragged:P,playback:$,redrawShadows:u,finishEnabled:()=>m()&&!t.finishNeedsMeasuring()}),W=JUr(e,{isTakeRolling:O.isTakeRolling});s.foldResolvers=O.foldResolvers;const U=lZr(e);s.isViewportFilming=O.isViewportFilming;let V=!1,G=!1;const Z=new fxr;function se(){const ce=t.isPreviewPlaying.peek()||t.isPerformancePlaying.peek()||t.performanceSeekS.peek()!==null?J2r({selectedSegment:t.selectedSegment.peek(),selectedId:t.selectedId.peek(),tracks:t.show.peek().tracks}):null,be=ce?e.meshById.get(ce):null;if(!be){t.livePose.peek()!==null&&t.livePose.set(null);return}const fe=[be.position.x,be.position.y,be.position.z],we=[be.rotation.x,be.rotation.y,be.rotation.z],Ee=[be.scale.x,be.scale.y,be.scale.z],xe=be.userData.kind==="simple_figure"?nat(be):void 0,J=t.livePose.peek();J&&J.id===ce&&hQ(J.position,fe)&&hQ(J.rotation,we)&&hQ(J.scale,Ee)&&(!xe||J.headRotation&&hQ(J.headRotation,xe))||t.livePose.set({id:ce,position:fe,rotation:we,scale:Ee,headRotation:xe})}let X=0;const te=3;e.renderer.setAnimationLoop(()=>{try{ne()}catch(pe){X++<te&&console.error(`[stage] a frame failed and was skipped (${X}/${te} reported)`,pe)}});function ne(){if(e.isDisposed()||V||G)return;const pe=Z.getDelta();a.tick(pe),o.tick(),$.tick(pe),z(),A.tick(pe),T.tick(pe),C()&&Uit(e.camera,n.orbit),n.tick(),C()&&Uit(e.camera,n.orbit),N.tick(pe),w.tick(),l.tick(),d.tick(),u(e.renderer),I.tick(),O.tickPreview(pe),se(),U.tick(pe),O.tickShake(pe),W.tick(pe),j.tick(),t.planShown.peek()||!t.pageLive.peek()?e.scene.updateMatrixWorld():(E.tick(),re(),h.add(pe*1e3),Q(),U.render()),O.restoreShake(),O.tickCapture(pe)}function Q(){if(!g.frame()||!t.finishNeedsMeasuring()||e.renderer.getContext().isContextLost())return;if(!Dje(e.renderer)){t.onFinishMeasured(!1,{costMs:0,plainMs:0,pixels:0});return}if(O.isViewportFilming()||O.isCapturing())return;const pe=performance.now()-v<dZr;if(b||pe||t.isPreviewPlaying.peek()||t.isPerformancePlaying.peek())return;const{renderer:ce,scene:be,camera:fe}=e,we=ce.getContext(),Ee=ce.domElement.width*ce.domElement.height;if(!Uqr(Ee))return;const xe=new Uint8Array(4),J=Ew(e);let le;try{le=qqr({drawPlain:()=>{ce.setRenderTarget(null),ce.render(be,fe)},drawFinished:()=>f.render(be,fe),finishGpu:()=>we.readPixels(0,0,1,1,we.RGBA,we.UNSIGNED_BYTE,xe),pixels:Ee})}finally{J()}const ue=g.report(le);ue!==null&&t.onFinishMeasured(ue,le),re()}function q(){$.poseNow()&&a.finishFades(),a.tick(0),d.tick(),O.tickPreview(0)}const Y=new On;function re(){if(e.renderer.getDrawingBufferSize(Y),Y.x===0||Y.y===0)return;const pe=m();pe||f.release();const ce=Ew(e);try{pe?f.render(e.scene,e.camera):e.renderer.render(e.scene,e.camera)}finally{ce()}O.isViewportFilming()||ae()}function ae(){j.drawStroke(),EOr(e)}const ie=new Ge,ge=new Ge;return{setPaused:pe=>{V&&!pe&&Z.getDelta(),V=pe},foldResolvers:O.foldResolvers,shownPose:pe=>{const ce=e.meshById.get(pe);if(!ce)return null;ce.getWorldScale(ge);const be={...Bie(ce),scale:[ge.x,ge.y,ge.z]},fe=t.objects.peek()[pe]?.kind;return fe==="camera"&&(be.fovDeg=O.cameraFovDeg(pe)??void 0),fe==="simple_figure"&&(be.headRotation=nat(ce)),be},project:(pe,ce,be)=>{if(ie.set(pe,ce,be).applyMatrix4(e.camera.matrixWorldInverse),ie.z>=-1e-4)return null;ie.applyMatrix4(e.camera.projectionMatrix);const fe=e.renderer.domElement;return[(ie.x+1)/2*fe.clientWidth,(1-ie.y)/2*fe.clientHeight]},startRecording:O.startRecording,stopRecording:()=>{const pe=O.stopRecording();return W.settle(),pe},startHubRecording:O.startHubRecording,stopHubRecording:O.stopHubRecording,recordHubBatch:O.recordHubBatch,canRenderOffline:O.canRenderOffline,renderHubTake:async(pe,ce)=>{G=!0;try{return await gqr({beginOfflineHub:O.beginOfflineHub,cameraIds:pe,step:be=>{a.tick(be),$.tick(be),d.tick(),O.tickShake(be),O.restoreShake()},onProgress:ce})}finally{G=!1,Z.getDelta()}},focusObject:T.focusObject,captureViewport:O.captureViewport,captureCamera:(pe,ce)=>(q(),O.captureCamera(pe,ce)),attachFeed:O.attachFeed,detachFeed:O.detachFeed,redrawFeed:O.redrawFeed,aimHubCamera:O.aimHubCamera,sceneBounds:()=>vje(e.meshById.values()),objectBounds:pe=>vje(pe.flatMap(ce=>e.meshById.get(ce)??[])),viewPose:()=>{const pe=e.camera.quaternion;return{heightM:e.camera.position.y,rollDeg:LCr([pe.x,pe.y,pe.z,pe.w])*180/Math.PI}},viewYawDeg:()=>P8r(e.camera.getWorldDirection(cZr)),frameStats:h.summary,spotlightShadowBudget:()=>d.budget,attachPreview:O.attachPreview,detachPreview:O.detachPreview,sampleClipRigOffsets:a.sampleClipRigOffsets,destroy:()=>{e.markDisposed(),e.renderer.setAnimationLoop(null),W.settle(),O.dispose(),U.dispose();for(const pe of e.disposers.reverse())pe();A.disposeControls(),n.dispose(),a.disposeAll(),Oje(e.scene),Kd(e.scene),e.meshById.clear(),e.renderer.forceContextLoss(),e.renderer.dispose(),e.renderer.domElement.remove()}}}class hZr{permits;waiting=[];constructor(e){this.permits=e}async acquire(){if(this.permits>0){this.permits--;return}return new Promise(e=>{this.waiting.push(e)})}release(){this.waiting.length>0?this.waiting.shift()():this.permits++}getAvailablePermits(){return this.permits}getWaitingCount(){return this.waiting.length}}const yBe=150;let Nye=null;function pZr(){return Nye||(Nye=new AudioContext),Nye}function vKt(t,e){const n=t.getChannelData(0),r=Math.floor(n.length/e),s=[];for(let o=0;o<e;o++){const l=o*r,c=l+r;let d=0;for(let u=l;u<c;u++){const h=n[u]??0,f=Math.abs(h);f>d&&(d=f)}s.push(d)}const a=Math.max(...s,.01);return s.map(o=>o/a)}async function fZr(t){const e=pZr(),n=await t.arrayBuffer();return e.decodeAudioData(n)}async function vBe(t,e=yBe){const n=await fZr(t);return{waveformData:vKt(n,e),duration:n.duration}}const mZr={mov:"video/quicktime",mp4:"video/mp4",m4v:"video/mp4",webm:"video/webm",mkv:"video/x-matroska",avi:"video/x-msvideo",mp3:"audio/mpeg",m4a:"audio/mp4",wav:"audio/wav",aac:"audio/aac",flac:"audio/flac",ogg:"audio/ogg",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp",heic:"image/heic",heif:"image/heif"},xBe=t=>{if(t.type)return t;const e=t.name.toLowerCase().split(".").pop(),n=e?mZr[e]:void 0;return n?new File([t],t.name,{type:n,lastModified:t.lastModified}):t},Wie=t=>{if(t.type.startsWith("image/"))return"image";if(t.type.startsWith("video/"))return"video";if(t.type.startsWith("audio/"))return"audio";const e=t.name.toLowerCase().split(".").pop();if(e){const n=["jpg","jpeg","png","gif","webp","heic","heif"],r=["mp4","mov","avi","webm"],s=["mp3","wav","ogg","m4a","aac","flac","webm"];if(n.includes(e))return"image";if(r.includes(e))return"video";if(s.includes(e))return"audio"}throw new Error(`Unsupported file type: ${t.type} (${t.name})`)};let Pye=null;function gZr(){return Pye||(Pye=new AudioContext),Pye}const bZr=3e3,epe=t=>Number.isFinite(t.duration)?Promise.resolve(t.duration):new Promise(e=>{const n=s=>{t.ondurationchange=null,t.currentTime=0,e(s)},r=window.setTimeout(()=>n(void 0),bZr);t.ondurationchange=()=>{Number.isFinite(t.duration)&&(clearTimeout(r),n(t.duration))},t.currentTime=Number.MAX_SAFE_INTEGER}),zot=t=>new Promise((e,n)=>{const r=URL.createObjectURL(t),s=t.type.startsWith("video/")?document.createElement("video"):new Audio;s.onloadedmetadata=()=>{const a=s.duration;s.src="",URL.revokeObjectURL(r),e(a)},s.onerror=()=>{URL.revokeObjectURL(r),n(new Error("Failed to load media"))},s.src=r}),xKt=async t=>{const e=t.type.startsWith("video/"),n=t.type.startsWith("audio/");if(!e&&!n)return{file:t,usable:!0};let r;try{r=await zot(t)}catch{return{file:t,usable:!0}}if(Number.isFinite(r))return{file:t,usable:r>0};try{const{ALL_FORMATS:s,BlobSource:a,BufferTarget:o,Conversion:l,Input:c,Mp4OutputFormat:d,Output:u,WebMOutputFormat:h}=await Tr(async()=>{const{ALL_FORMATS:w,BlobSource:k,BufferTarget:S,Conversion:T,Input:A,Mp4OutputFormat:C,Output:E,WebMOutputFormat:j}=await import("./index-CJPCiUUN.js");return{ALL_FORMATS:w,BlobSource:k,BufferTarget:S,Conversion:T,Input:A,Mp4OutputFormat:C,Output:E,WebMOutputFormat:j}},[]),f=t.type.includes("webm")?new h:t.type.includes("mp4")?new d:null;if(!f)return{file:t,usable:!1};const m=new c({source:new a(t),formats:s}),g=new u({format:f,target:new o}),b=await l.init({input:m,output:g,showWarnings:!1});if(!b.isValid||b.discardedTracks.length>0)return{file:t,usable:!1};await b.execute();const y=g.target.buffer;if(!y)return{file:t,usable:!1};const v=new File([y],t.name,{type:t.type}),x=await zot(v).catch(()=>NaN);return!Number.isFinite(x)||x<=0?{file:t,usable:!1}:(console.log(`[repairMediaFile] Remuxed ${t.name} (no duration/seek index in container)`),{file:v,usable:!0})}catch(s){return console.warn(`[repairMediaFile] Failed to remux ${t.name}:`,s),{file:t,usable:!1}}},yZr=async t=>{const e=await Promise.all(t.map(xKt));return{accepted:e.filter(n=>n.usable).map(n=>n.file),rejected:e.filter(n=>!n.usable).map(n=>n.file)}},wBe=t=>new Promise((e,n)=>{const r=URL.createObjectURL(t);if(t.type.startsWith("image/")){const s=new Image;s.onload=()=>{URL.revokeObjectURL(r),e({width:s.width,height:s.height})},s.onerror=()=>{URL.revokeObjectURL(r),n(new Error("Failed to load image"))},s.src=r}else if(t.type.startsWith("video/")){const s=document.createElement("video");s.onloadedmetadata=()=>{URL.revokeObjectURL(r),e({width:s.videoWidth,height:s.videoHeight,duration:Number.isFinite(s.duration)?s.duration:void 0})},s.onerror=()=>{URL.revokeObjectURL(r),n(new Error("Failed to load video"))},s.src=r}else if(t.type.startsWith("audio/")){const s=new Audio;s.onloadedmetadata=async()=>{const a=Number.isFinite(s.duration)?s.duration:void 0;URL.revokeObjectURL(r);let o;try{const l=await t.arrayBuffer(),d=await gZr().decodeAudioData(l);o=vKt(d,yBe)}catch(l){console.warn("Failed to generate waveform:",l)}e({duration:a,waveformData:o})},s.onerror=()=>{URL.revokeObjectURL(r),n(new Error("Failed to load audio"))},s.src=r}else URL.revokeObjectURL(r),n(new Error("Unsupported file type"))}),Rye=Object.freeze(Object.defineProperty({__proto__:null,detectFileType:Wie,getFileDimensions:wBe,repairMediaFileIfNeeded:xKt,repairMediaFiles:yZr,resolveMediaDuration:epe,withInferredMimeType:xBe},Symbol.toStringTag,{value:"Module"})),qC=Ne({}),OP=Ne({});function tpe(t){return qC.peek()[t]!==void 0}let wKt=0;function Wot(){return wKt}function vZr(){wKt++,qC.set({}),OP.set({}),_Be()}function Got(t){t.preventDefault(),t.returnValue=""}function _Be(){if(typeof window>"u")return;const t=Object.keys(qC.peek()).length>0;window.removeEventListener("beforeunload",Got),t&&window.addEventListener("beforeunload",Got)}function _Kt(t){qC[t.id].set({...t,startedAtMs:Date.now()}),OP[t.id].set({phase:"uploading",progress:0}),_Be()}function xZr(t,e){OP[t].peek()!==void 0&&OP[t].set(e)}function kBe(t){qC[t].delete(),OP[t].delete(),_Be()}function Bje(t){switch(t){case"unreadable":return _._({id:"RIaQR7"});case"zero_duration":return _._({id:"UbxuyA"});case"no_streams":return _._({id:"eVyn3w"});case"too_large":return _._({id:"ZRxQ0c"});case"ffmpeg_error":case"audio_reclassify_error":case"output_truncated":return _._({id:"YrKKsX"});case"upload_failed":case"no_upload_url":case"confirm_failed":return _._({id:"l+n0RX"});case"timeout":return _._({id:"z1lwNc"});case"cancelled":return _._({id:"GuWXId"});default:return _._({id:"BhkxTk"})}}function qot(t,e){const n=e.length;if(n===1){const r=e[0]?.name??"";return _._({id:"TtzI5E",values:{name:r}})}return _._({id:"v7th/6",values:{done:t,total:n}})}function wZr(t,e){if(e.length===1){const n=e[0]?.name??"";return _._({id:"PdKlwo",values:{name:n}})}return _._({id:"4bIDVx",values:{done:t}})}function _Zr(t,e){return _._({id:"betUkD",values:{done:t,failed:e}})}function kZr(){const t=Object.keys(qC.peek()).length;return t===0?!0:window.confirm(t===1?_._({id:"zAyFwN"}):_._({id:"KTYmZb",values:{count:t}}))}function SZr(t){const e=t.fileName;switch(t.code){case"file_too_large":{const n=t.limitGb??2;return e?t.kind==="video"?_._({id:"wmEDoo",values:{name:e,limit:n}}):t.kind==="audio"?_._({id:"tHCT4j",values:{name:e,limit:n}}):_._({id:"D8wGL7",values:{name:e,limit:n}}):_._({id:"kqXywf",values:{limit:n}})}case"unsupported_type":return e?_._({id:"ueg8ia",values:{name:e}}):_._({id:"FO6cgT"});case"unreadable_file":return e?_._({id:"44gFh2",values:{name:e}}):_._({id:"cGvrU9"});case"too_many_files":{const n=t.max??250;return _._({id:"P1jJK8",values:{max:n}})}case"no_files":return _._({id:"UKd1yE"});case"server_config":return _._({id:"nsjB/I"});default:return _._({id:"BhkxTk"})}}const SBe=500*1024*1024,TZr=4,AZr=10,CZr=1e3,EZr=30*1e3,jZr=900*1e3;class Fye extends Error{}async function IZr(t){try{const e=await t.context?.json();return typeof e?.error=="string"?e.error:void 0}catch{return}}function MZr(){return typeof navigator<"u"&&navigator.onLine===!1}function NZr(){return new Promise(t=>window.addEventListener("online",()=>t(),{once:!0}))}function PZr(t){return t.normalize===!1&&t.file.size>SBe}class kKt{concurrencyLimit;constructor(e=8){this.concurrencyLimit=e}async uploadFiles(e,n,r,s){const a=await this.generatePresignedUrls(e),o=new Set,l=await this.uploadToR2WithConcurrency(e,a.uploads,o,n,r,s);if(l.filter(d=>d.success).length>0){const d=await this.confirmUploads(e,a.uploads,l,o);this.attachAssetIds(l,d.assetIds);for(const u of o)d.failure&&(l[u]={nodeId:e[u].nodeId,success:!1,error:`Failed to complete upload: ${d.failure}`}),r?.(e[u].nodeId,l[u])}return l}async generatePresignedUrls(e){const{data:n,error:r}=await Ce.functions.invoke("generate-user-media-upload-urls",{body:{files:e.map(s=>({fileName:s.file.name,fileSize:s.file.size,fileType:s.file.type,...s.normalize===!1?{normalize:!1}:{},...PZr(s)?{multipart:!0}:{}}))}});if(r){let s={},a;try{const l=await r.context?.json();l&&(s=l,a=l.error)}catch{}ot.error(SZr(s));const o=new Error(`Failed to generate upload URLs: ${a??r.message}`);throw o.userNotified=!0,o}return n}async validateAndGenerateUrls(e){return this.generatePresignedUrls(e)}async uploadToUrl(e,n,r){return this.uploadSingleFile(e,n,r)}async uploadToR2WithConcurrency(e,n,r,s,a,o){const l=[];let c=0;const d=e.length;let u=0;const h=[],f=()=>u<this.concurrencyLimit?(u++,Promise.resolve()):new Promise(g=>h.push(g)),m=()=>{const g=h.shift();g?g():u--};return await Promise.all(e.map(async(g,b)=>{await f();try{const y=n[b].multipart,v=w=>o?.(g.nodeId,w);y?(await this.uploadMultipart(g.file,y,v),r.add(b)):await this.uploadSingleFile(g.file,n[b].uploadUrl,v);const x={nodeId:g.nodeId,success:!0,publicUrl:n[b].publicUrl,r2Key:n[b].mediaKey};l[b]=x,y||a?.(g.nodeId,x)}catch(y){const v={nodeId:g.nodeId,success:!1,error:y instanceof Error?y.message:"Upload failed"};l[b]=v,a?.(g.nodeId,v)}finally{c++,s?.(c,d),m()}})),l}uploadSingleFile(e,n,r){return new Promise((s,a)=>{const o=new XMLHttpRequest;o.upload.onprogress=l=>{if(l.lengthComputable&&r){const c=Math.round(l.loaded/l.total*100);r(c)}},o.onload=()=>{o.status>=200&&o.status<300?s():a(new Error(`Upload failed with status ${o.status}`))},o.onerror=()=>a(new Error("Network error during upload")),o.ontimeout=()=>a(new Error("Upload timeout")),o.timeout=18e5,o.open("PUT",n),o.setRequestHeader("Content-Type",e.type),o.send(e)})}async uploadMultipart(e,n,r){const{partSizeBytes:s,partUrls:a}=n,o=new Array(a.length).fill(0),l=new Set;let c=0,d=!1;const u=()=>{const f=o.reduce((m,g)=>m+g,0);r?.(Math.min(100,Math.round(f/e.size*100)))},h=async()=>{for(;!d&&c<a.length;){const f=c++,m=f*s,g=e.slice(m,Math.min(m+s,e.size));await this.uploadPartWithRetry(g,a[f],l,()=>d,b=>{o[f]=b,u()})}};try{await Promise.all(Array.from({length:Math.min(TZr,a.length)},h))}catch(f){d=!0;for(const m of l)m.abort();throw f}}async uploadPartWithRetry(e,n,r,s,a){let o=0;for(;;){if(s())throw new Fye("Upload cancelled");try{return await this.uploadPart(e,n,r,a)}catch(l){if(a(0),l instanceof Fye)throw l;if(MZr()){await NZr();continue}if(o++,o>=AZr)throw l;const c=Math.min(CZr*2**(o-1),EZr);await new Promise(d=>setTimeout(d,c))}}}uploadPart(e,n,r,s){return new Promise((a,o)=>{const l=new XMLHttpRequest;r.add(l);const c=()=>r.delete(l);l.upload.onprogress=d=>s(d.loaded),l.onload=()=>{if(c(),l.status<200||l.status>=300){o(new Error(`Part upload failed with status ${l.status}`));return}s(e.size),a()},l.onerror=()=>{c(),o(new Error("Network error during part upload"))},l.ontimeout=()=>{c(),o(new Error("Part upload timeout"))},l.onabort=()=>{c(),o(new Fye("Part upload aborted"))},l.timeout=jZr,l.open("PUT",n),l.send(e)})}async confirmUploads(e,n,r,s){const a=crypto.randomUUID(),o=r.map((u,h)=>({result:u,index:h})).filter(({result:u})=>u.success).map(({result:u,index:h})=>({r2Key:n[h].mediaKey,publicUrl:u.publicUrl,fileName:e[h].file.name,fileType:e[h].file.type,fileSize:e[h].file.size,nodeId:e[h].nodeId,projectId:e[h].projectId,...e[h]?.normalize===!1?{normalize:!1}:{},...s.has(h)?{multipart:{r2UploadId:n[h].multipart.r2UploadId}}:{},...e[h].metadata?{metadata:e[h].metadata}:{}})),l=new Map;if(o.length===0)return{assetIds:l};const{data:c,error:d}=await Ce.functions.invoke("confirm-user-media-uploads",{body:{batchId:a,uploads:o}});if(d){const u=await IZr(d)??d.message;return console.error("[PresignedUploadService] Failed to confirm uploads:",u),{assetIds:l,failure:u}}for(const u of c?.media??[])u?.id&&u?.url&&l.set(u.url,u.id);return{assetIds:l}}attachAssetIds(e,n){if(n.size!==0)for(const r of e)r.success&&r.publicUrl&&(r.assetId=n.get(r.publicUrl))}}const T4=new kKt,RZr=Object.freeze(Object.defineProperty({__proto__:null,MULTIPART_THRESHOLD_BYTES:SBe,PresignedUploadService:kKt,presignedUploadService:T4},Symbol.toStringTag,{value:"Module"})),FZr=8e3,OZr=.17,LZr=.35,DZr=2500,BZr=800,Zot=8e3;function HZr(t){return t.probeFailed?"unknown":t.fileType.startsWith("audio/")?"canonical":!(t.fileType==="video/mp4"||t.fileName.toLowerCase().endsWith(".mp4"))||t.videoCodec!=="avc"||t.hasNonAacAudio?"transcode":"canonical"}function Kot(t){const e=t.sizeBytes/FZr;let n,r;switch(t.tier){case"canonical":n=BZr,r=85;break;case"transcode":{const s=(t.height??0)>1080?LZr:OZr;n=t.durationSeconds?t.durationSeconds*s*1e3:Zot,r=40;break}default:n=Zot,r=65;break}return{tier:t.tier,etaMs:Math.round(DZr+e+n),uploadShare:r}}function $Zr(t){const e=99-t.uploadShare,n=1-Math.exp(-t.elapsedMs/Math.max(t.etaMs,1));return t.uploadShare+e*n}function VZr(t){return Math.min(Math.max(9e4,t*6),20*6e4)}const SKt=t=>t.normalize===!1&&t.file.size<=SBe,Xot=[700,1e3,1500,2500,4e3,6e3,1e4],UZr=250,zZr=8,ire=t=>Math.round(performance.now()-t);async function WZr(t){try{const{data:e,error:n}=await Ce.functions.invoke("ensure-normalized",{body:{mediaIds:[t]}});return n||!e?.statuses?void 0:e.statuses[t]}catch(e){console.error("[upload] status poll failed:",e);return}}async function GZr(t){if(!t.type.startsWith("video/"))return{videoCodec:null,hasNonAacAudio:!1,probeFailed:!1};try{const{ALL_FORMATS:e,BlobSource:n,Input:r}=await Tr(async()=>{const{ALL_FORMATS:l,BlobSource:c,Input:d}=await import("./index-CJPCiUUN.js");return{ALL_FORMATS:l,BlobSource:c,Input:d}},[]),s=new r({source:new n(t),formats:e}),[a,o]=await Promise.all([s.getPrimaryVideoTrack(),s.getPrimaryAudioTrack()]);return{videoCodec:a?.codec??null,hasNonAacAudio:o!=null&&o.codec!=="aac",probeFailed:!1}}catch{return{videoCodec:null,hasNonAacAudio:!1,probeFailed:!0}}}async function qZr(t){const{data:e,error:n}=await Ce.functions.invoke("confirm-user-media-uploads",{body:{batchId:crypto.randomUUID(),uploads:[{r2Key:t.r2Key,publicUrl:t.publicUrl,fileName:t.file.name,fileType:t.file.type,fileSize:t.file.size,nodeId:t.id,projectId:t.projectId,...t.skipNormalize?{normalize:!1}:{},...t.dimensions?{metadata:{width:t.dimensions.width,height:t.dimensions.height,duration:t.dimensions.duration}}:{}}]}});if(n){console.error("[upload] confirm failed:",n);return}return(e?.media??[])[0]?.id}async function ZZr(t){const e=performance.now(),n=VZr(t.estimate.etaMs),r=setInterval(()=>{t.isCancelled()||t.onProgress({phase:"processing",progress:$Zr({elapsedMs:performance.now()-e,etaMs:t.estimate.etaMs,uploadShare:t.estimate.uploadShare})})},UZr);try{for(let s=0;;s++){if(t.isCancelled())return{ok:!1,reason:"cancelled"};if(performance.now()-e>n)return{ok:!1,reason:"timeout"};const a=await WZr(t.assetId);if(a?.status==="ready")return{ok:!0,info:a};if(a?.status==="failed")return{ok:!1,reason:a.error??"failed"};const o=Xot[Math.min(s,Xot.length-1)]??1e4;await new Promise(l=>setTimeout(l,o))}}finally{clearInterval(r)}}async function KZr(t){const{entry:e}=t,n=e.id;try{let r=0;const s=v=>{v.progress<r&&(v={...v,progress:r}),r=v.progress,xZr(n,{phase:v.phase,progress:v.progress}),t.onProgress?.(n,v)};_Kt({id:n,title:e.file.name,mediaType:Wie(e.file),folderId:e.folderId??null});let a=Kot({tier:"unknown",sizeBytes:e.file.size,durationSeconds:e.dimensions?.duration,height:e.dimensions?.height});const o=GZr(e.file).then(v=>{a=Kot({tier:HZr({fileType:e.file.type,fileName:e.file.name,videoCodec:v.videoCodec,hasNonAacAudio:v.hasNonAacAudio,probeFailed:v.probeFailed}),sizeBytes:e.file.size,durationSeconds:e.dimensions?.duration,height:e.dimensions?.height})});s({phase:"uploading",progress:0});const l=performance.now();try{await T4.uploadToUrl(e.file,t.upload.uploadUrl,v=>{s({phase:"uploading",progress:v/100*a.uploadShare})})}catch(v){return console.error("[upload] PUT failed:",v),{id:n,ok:!1,reason:"upload_failed"}}const c=ire(l);if(t.isCancelled())return{id:n,ok:!1,reason:"cancelled"};const d=performance.now();await o,s({phase:"processing",progress:a.uploadShare});const u=SKt(e),h=await qZr({file:e.file,id:n,projectId:t.projectId,r2Key:t.upload.mediaKey,publicUrl:t.upload.publicUrl,dimensions:e.dimensions,skipNormalize:u});if(!h)return{id:n,ok:!1,reason:"confirm_failed"};const f={presignMs:t.presignMs,putMs:c,confirmMs:ire(d)},m=Wie(e.file);if(m!=="video"&&m!=="audio"||u)return s({phase:"processing",progress:100}),{id:n,ok:!0,asset:{assetId:h,url:t.upload.publicUrl,mediaType:m,width:e.dimensions?.width,height:e.dimensions?.height,duration:e.dimensions?.duration,waveformData:e.dimensions?.waveformData},timings:f};const g=performance.now(),b=await ZZr({assetId:h,estimate:a,onProgress:s,isCancelled:t.isCancelled});if(!b.ok)return{id:n,ok:!1,reason:b.reason};const y=b.info;return s({phase:"processing",progress:100}),{id:n,ok:!0,asset:{assetId:h,url:y.url,mediaType:y.mediaType??m,width:y.width??e.dimensions?.width,height:y.height??e.dimensions?.height,duration:y.duration??e.dimensions?.duration,waveformData:e.dimensions?.waveformData},timings:{...f,readyMs:ire(g)}}}finally{kBe(n)}}async function wq(t){const e=Wot(),n=t.isCancelled??(()=>!1),r=()=>Wot()!==e||n();if(t.files.length===0)return[];const s=performance.now(),a=t.presignedUrls??await T4.validateAndGenerateUrls(t.files.map(c=>({file:c.file,nodeId:c.id,projectId:t.projectId,...SKt(c)?{normalize:!1}:{}}))),o=t.presignedUrls?void 0:ire(s),l=new hZr(zZr);return Promise.all(t.files.map(async(c,d)=>{await l.acquire();try{const u=a.uploads[d],h=u?await KZr({entry:c,upload:u,projectId:t.projectId,presignMs:o,onProgress:t.onProgress,isCancelled:r}):{id:c.id,ok:!1,reason:"no_upload_url"};return t.onOutcome?.(h),h}finally{l.release()}}))}async function TKt(t){const[e]=await wq({files:[{id:t.nodeId,file:t.file,dimensions:t.dimensions,normalize:t.normalize}],projectId:t.projectId});if(!e)throw new Error("stage media upload produced no outcome");if(!e.ok)throw new Error(`stage media upload failed: ${e.reason??"unknown"}`);return{asset:e.asset,timings:e.timings}}const XZr=400,YZr=40;function QZr(t){const e=Object.values(t).map(n=>n.position);return e.length===0?{x:0,y:0}:{x:Math.max(...e.map(n=>n.x))+XZr+YZr,y:Math.min(...e.map(n=>n.y))}}function JZr(t){return t.kind==="image"?{extension:t.mimeType.includes("jpeg")?"jpg":"png",type:Ie.IMAGE,label:"Image"}:{extension:t.mimeType.includes("webm")?"webm":"mp4",type:Ie.VIDEO,label:"Video"}}async function eKr(t){const e=JZr(t),{asset:n}=await TKt({projectId:t.projectId,nodeId:t.nodeId,file:new File([t.blob],`stage_${t.kind}.${e.extension}`,{type:t.mimeType}),dimensions:{width:t.width,height:t.height,duration:t.durationS},normalize:t.normalize}),s=(await Ks.getProject(t.projectId)).canvas_state;if(!s)throw new Error(`project ${t.projectId} has no canvas state`);const a={id:t.nodeId,type:e.type,label:e.label,position:QZr(s.nodes),data:{url:n.url,assetId:n.assetId,width:n.width??t.width,height:n.height??t.height,duration:n.duration??t.durationS,status:"completed",childrenIds:[],sourceActionId:ehe,...t.title?{user_input_title:t.title}:{},...t.stage?{stage:{...t.stage,renderedAt:new Date().toISOString()}}:{},titleStatus:"none"}};await Ks.updateCanvasState(t.projectId,{...s,nodes:{...s.nodes,[t.nodeId]:a},lastSaved:new Date().toISOString()})}const tKr=2e3;class nKr{constructor(e={}){this.a=e}save=async e=>{const n=an(),r={...e,nodeId:n};return await this.post(r)||await(this.a.writeToCanvas??eKr)(r),n};post=async e=>{if(!this.a.createChannel&&typeof BroadcastChannel>"u")return!1;const n=this.a.createChannel??(o=>new BroadcastChannel(o)),r=an(),s=n(UVt);let a;try{return await new Promise(o=>{s.onmessage=c=>{c.data?.type==="stage-video-ack"&&c.data.requestId===r&&o(!0)},a=setTimeout(()=>o(!1),tKr);const l={type:"stage-video",requestId:r,nodeId:e.nodeId,projectId:e.projectId,kind:e.kind,blob:e.blob,mimeType:e.mimeType,width:e.width,height:e.height,durationS:e.durationS,title:e.title,stage:e.stage,normalize:e.normalize};s.postMessage(l)})}finally{clearTimeout(a),s.close()}}}const rKr=1920,sKr=1080,Oye=5,AKt="stage-input-device",CKt="stage-control-mode";function aKr(){try{const t=window.localStorage.getItem(CKt);if(t==="default"||t==="unreal")return t}catch{}return"default"}function iKr(){try{const t=window.localStorage.getItem(AKt);if(t==="mouse"||t==="trackpad")return t}catch{}ret

/*==============================================================================
 * 2. COr — viewport constructor (canvas/renderer/scene/camera/meshById/planningAids)
 * source file: tmp_b/viewport_ctor_COr.js
 ==============================================================================*/
COr(t){const e=document.createElement("canvas");e.classList.add("ph-viewport-capture");const n=new t0({canvas:e,antialias:!0});fZt(n),n.setPixelRatio(Math.min(window.devicePixelRatio,2)),n.setSize(t.container.clientWidth,t.container.clientHeight,!1),t.container.appendChild(n.domElement);const r=new Kh,s=new Xo(FP,t.container.clientWidth/t.container.clientHeight||1,Khe,RP);s.position.set(6,5,8),s.lookAt(0,0,0);let a=!1;return{a:t,renderer:n,scene:r,camera:s,meshById:new Map,disposers:[],planningAids:[],pathEditPickables:[],rigJointPickables:[],isDisposed:()=>a,markDisposed:()=>{a=!0}}}const aye=1;function EOr(t){const{scene:e,camera:n,renderer:r}=t;for(const a of t.planningAids)for(const o of a())o.traverse(l=>l.layers.enable(aye));e.traverse(a=>{a instanceof yS&&a.layers.enable(aye)});const{autoClear:s}=r;r.autoClear=!1,n.layers.set(aye);try{r.render(e,n)}finally{n.layers.set(0),r.autoClear=s}}function Ew(t){const e=[];for(const n of t.planningAids)for(const r of n())r.visible&&(r.visible=!1,e.push(r));return()=>{for(const n of e)n.visible=!0}}function jOr(t){const e=[];for(const n of t.meshById.values())n.userData.kind==="camera"&&!n.visible&&(n.visible=!0,e.push(n));return()=>{for(const n of e)n.visible=!1}}function BU(t){return Z_(t.focalLengthMm.peek(),Am(t.recordAspect.peek()).aspect)}function mZt(t){return t?.userData.kind==="camera"||t?.userData.kind==="target"}function iBe(t){const e=t.a.filmingCameraId.peek()??t.a.focusedCameraId.peek()??F8(t.a.objects.peek(),t.a.selectedId.peek());return e?t.meshById.get(e)??null:null}function Die(t,e){const n=e.userData.objectId,r=n?t.a.objects.peek()[n]?.targetId:void 0;return r?t.meshById.get(r)??null:null}const gZt=.55,bZt=.3;function IOr(t){return bZt+t*gZt}function MOr(t){return Math.max(0,(t-bZt)/gZt)}const VY=new Ge,Hat=new qn,UY=new va(0,0,0,"XYZ");function Bie(t){return t.getWorldPosition(VY),t.getWorldQuaternion(Hat),UY.setFromQuaternion(Hat,"XYZ"),{position:[VY.x,VY.y,VY.z],rotation:[UY.x,UY.y,UY.z]}}const yZt=new Ge,$at=new qn;function NOr(t,e){if(!e)return!1;for(let n=t;n;n=n.parent)if(n===e)return!0;return!1}function Hie(t,e,n){const r=t.parent;if(!r){t.position.copy(e),t.quaternion.copy(n);return}r.updateWorldMatrix(!0,!1),t.position.copy(r.worldToLocal(yZt.copy(e))),r.getWorldQuaternion($at),t.quaternion.copy($at.invert().multiply(n))}function POr(t,e){const n=t.parent;if(!n){t.position.copy(e);return}n.updateWorldMatrix(!0,!1),t.position.copy(n.worldToLocal(yZt.copy(e)))}function vZt(t,e,n){const r=iBe(t);return r?(r.getWorldPosition(n.position),r.getWorldQuaternion(n.quaternion),!0):!1}function ROr(t,e){const n=t.meshById.get(e);if(!n)return null;const r=n.getWorldPosition(xje);return[r.x,r.y+NP(e,t.a.objects.peek()),r.z]}function xZt(t,e){const n=e?t.meshById.get(e)??null:iBe(t);if(!n)return null;const r=n.getWorldPosition(xje),s=[r.x,r.y,r.z],a=Die(t,n);if(a){const o=a.getWorldPosition(xje);return{start:s,target:[o.x,o.y,o.z]}}return null}const FOr=new Ge,xje=new Ge;function OOr(t,e,n){const r=e?t.meshById.get(e):void 0;if(!r)return null;const s=r.getWorldPosition(FOr);return[s.x,n,s.z]}function LOr(t,e){const n=xZt(t,e);if(!n)return null;const r=gFr(t.a,e);return OOr(t,r,n.target[1])??n.target}const Vat=new va(0,0,0,"XYZ"),Uat=new qn,zY=new Ge;function oBe(t){return Vat.set(t[0],t[1],t[2]),Uat.setFromEuler(Vat),zY.set(0,0,-1).applyQuaternion(Uat),[zY.x,zY.y,zY.z]}const DOr=new Ge,BOr=new va,HOr=new qn;function cL(t,e){const[n,r,s]=e.positionOffset,[a,o,l]=e.rotationOffsetDeg;n===0&&r===0&&s===0&&a===0&&o===0&&l===0||(t.position.add(DOr.set(n,r,s).applyQuaternion(t.quaternion)),t.quaternion.multiply(HOr.setFromEuler(BOr.set(m_.degToRad(a),m_.degToRad(o),m_.degToRad(l)))))}function $Or(t,e){if(t.outcome!=="rebased")return!1;const n=t.rotation;return n==="free"?!1:n==="keep"?!0:n.from==="turn"?!1:!(e&&t.looksDownAim)}function wje(t,e,n,r){return!$Or(_Zt(t,e,n,r),xq(t,e))}function VOr(t,e){return t.outcome!=="rebased"||t.rotation==="free"?e:t.rotation!=="keep"}function _je(t,e,n){const r=wZt(t,e);return r?r.kind==="cam-manual"?"manual":n!=="rotate"?"path-position":r.aim!=="locked"?"path-look":t.every(a=>!Fp(a)||a.startS>=r.startS||a.kind==="cam-still")?null:"path-anchored":null}function UOr(t,e){return wZt(t,e)!==null}function wZt(t,e){const n=_he(t,e);return!n||e>n.startS+yd(n)?null:n.kind==="cam-manual"&&n.samples.length>0||n.kind==="cam-path"&&n.anchors.length>=2?n:null}function zOr(t,e){return t.find(n=>n.kind==="cam-move"&&e>=n.startS&&e<=n.startS+n.durationS)??null}function WOr(t){return t.kind==="cam-move"||t.kind==="cam-still"}function zat(t,e,n,r){return t.move==="pan_sweep"||!r?e:y2r({kind:t.move,position:e,target:r,direction:t.direction,t:n,angleDeg:t.angleDeg,heightDeltaUnits:t.heightDeltaUnits,distanceScale:t.distanceScale})}function WY(t,e){return t.kind!=="cam-move"||t.move==="pan_sweep"?null:XN(t,e,t.startS+yd(t))}function GOr(t){const e=zOr(t.items,t.timeS);if(!e||e.kind!=="cam-move")return{outcome:"refused",reason:"no-move"};const n=t.items.filter(d=>Fp(d)&&d.startS<e.startS);if(!n.every(WOr))return{outcome:"refused",reason:"anchored"};const r=t.timeS-e.startS;let s=zat(e,t.worldPosition,e.durationS>0?r/e.durationS:0,XN(e,t.resolveAim,t.timeS));for(let d=n.length-1;d>=0&&s;d--){const u=n[d];u.kind==="cam-move"&&(s=zat(u,s,1,WY(u,t.resolveAim)))}if(!s)return{outcome:"refused",reason:"not-invertible"};const a=n.every(d=>d.kind!=="cam-move"||d.move!=="pan_sweep"&&d.subjectId===e.subjectId&&$6(d)===$6(e)),o=n.every(d=>d.kind!=="cam-move");if(e.move==="pan_sweep"){if(!o)return{outcome:"rebased",position:s,rotation:"keep",looksDownAim:a};const d=b2r({direction:oBe(t.worldRotation),sweep:e.direction,t:e.durationS>0?r/e.durationS:0,angleDeg:e.angleDeg});return{outcome:"rebased",position:s,rotation:{from:"turn",aimAt:[s[0]+d[0],s[1]+d[1],s[2]+d[2]]},looksDownAim:a}}if(!o&&(!WY(e,t.resolveAim)||n.some(d=>d.kind==="cam-move"&&d.move==="pan_sweep")))return{outcome:"rebased",position:s,rotation:"keep",looksDownAim:a};const l=[...n,e].find(d=>WY(d,t.resolveAim)!==null),c=l?l===e?XN(e,t.resolveAim,t.timeS):WY(l,t.resolveAim):null;return{outcome:"rebased",position:s,rotation:c?{from:"framing",aimAt:c}:"free",looksDownAim:a}}function _Zt(t,e,n,r){return GOr({items:U6(t,e),timeS:t.performanceTimeS.peek(),worldPosition:n.position,worldRotation:n.rotation,resolveAim:r})}const qOr=new Ge,ZOr=new qn,KOr=new va;function kZt(t,e,n){t.captureFocusedTransformPose(n)||t.updateObjectTransform(e,n)}function SZt(t,e){const n=t.performanceTimeS.peek(),r=U6(t,e.id),s=_je(r,

/*==============================================================================
 * 3. Drag-commit resolver SZt + kZt + head-look helpers (gizmo release semantics)
 * source file: tmp_b/drag_commit_SZt.js
 ==============================================================================*/
,n){t.captureFocusedTransformPose(n)||t.updateObjectTransform(e,n)}function SZt(t,e){const n=t.performanceTimeS.peek(),r=U6(t,e.id),s=_je(r,n,e.mode);if(s)return{outcome:"refused",reason:s};if(t.captureFocusedCameraPose(e.world))return{outcome:"keyed"};if(t.objects.peek()[e.id]?.kind==="target"&&t.captureFocusedTransformPose(e.toLocal(e.id,e.world)))return{outcome:"keyed"};const a=bFr(t,e.id),o=a?.item.objectId?e.worldPoseOf(a.item.objectId):null,l=o?V8r({position:qOr.set(...e.world.position),quaternion:ZOr.setFromEuler(KOr.set(...e.world.rotation))},o):void 0,c=e.resolveAim?_Zt(t,e.id,e.world,e.resolveAim):{outcome:"refused",reason:"no-move"};if(c.outcome==="refused"&&c.reason!=="no-move")return{outcome:"unbased",reason:c.reason};let d=e.world;c.outcome==="rebased"&&(d={position:c.position,rotation:typeof c.rotation=="object"?kv(c.position,c.rotation.aimAt):e.world.rotation});const u=e.toLocal(e.id,d),h=VOr(c,!xq(t,e.id)),f=!UOr(r,n);return t.updateObjectTransform(e.id,{...f?{position:u.position}:{},...h?{rotation:GA(u.rotation,e.windFrom)}:{}}),l&&a&&t.setCameraItemFields(a.trackId,a.item.id,{offset:l}),c.outcome==="refused"&&c.reason==="no-move"&&e.mode==="translate"&&t.reaimCamera(e.id),e.target&&t.updateObjectTransform(e.target.id,{position:e.target.position}),{outcome:"committed"}}function TZt(t){return t==="manual"?_._({id:"KZlC+a"}):t==="path-position"?_._({id:"OFFVJO"}):t==="path-look"?_._({id:"uUVmom"}):_._({id:"FpnVEp"})}function AZt(t){return t==="anchored"?_._({id:"1gJooS"}):_._({id:"LvEoJv"})}const XOr=70*Math.PI/180,YOr=35*Math.PI/180,CZt=1.6,Wat=.4,QOr=(t,e)=>Math.max(-e,Math.min(e,t)),Gat=t=>Math.atan2(Math.sin(t),Math.cos(t));function xM(t,e,n){const r=n[0]-e[0],s=n[1]-e[1],a=n[2]-e[2],o=Math.hypot(r,a);if(o<1e-6)return{bodyYawRad:t,headPitchRad:0,headYawRad:0};const l=Math.atan2(-r,-a),c=Gat(l-t),d=Math.sign(c)*Math.min(Math.abs(c),XOr,Math.PI-Math.abs(c));return{bodyYawRad:Gat(t+c-d),headPitchRad:QOr(Math.atan2(s,o),YOr),headYawRad:d}}const dL=new va,qat=new qn;function EZt(t,e){return qat.setFromEuler(dL.set(e,t,0,"YXZ")),dL.setFromQuaternion(qat,"XYZ"),[dL.x,dL.y,dL.z]}function kje(t){return EZt(t.headYawRad,t.headPitchRad)}function jZt(t){const e=n=>({position:[0,0,0],rotation:EZt(t.headYawRad*n,-t.headPitchRad*n),scale:[1,1,1]});return{"DEF-neck":e(Wat),"DEF-head":e(1-Wat)}}function IZt(t,e){const n={...t};for(const[r,s]of Object.entries(e)){const a=n[r];n[r]=a?{...a,rotation:[a.rotation[0]+s.rotation[0],a.rotation[1]+s.rotation[1],a.rotation[2]+s.rotation[2]]}:s}return n}const JOr=60,lBe=.2,MZt=4,eLr=.1,Zat=1/eLr,tLr=Math.PI/180,Dg=new va,GY=new qn;function nLr(t,e,n){Dg.set(...t,"XYZ"),GY.setFromEuler(Dg),Dg.setFromQuaternion(GY,"YXZ");const r=rLr(Dg.x,n),s=Dg.y-e;return Dg.set(r,s,Dg.z,"YXZ"),GY.setFromEuler(Dg),Dg.setFromQuaternion(GY,"XYZ"),[Dg.x,Dg.y,Dg.z]}function rLr(t,e){const n=JOr*tLr,r=t+e;return Math.max(Math.min(-n,t),Math.min(r,Math.max(n,t)))}function Sje(t){return Math.round(t*Zat)/Zat}function Kat(t,e=MZt){return Sje(Math.max(lBe,Math.min(t,e)))}const $ie=.02,rre=(t,e)=>({u:t,heightM:e,in:[0,0],out:[0,0],auto:!0});function Yhe(t){return t.map((e,n)=>{if(!e.auto)return e;const r=t[n-1],s=t[n+1];return{...e,in:[r?-(e.u-r.u)/3:0,0],out:[s?(s.u-e.u)/3:0,0]}})}function sLr(t){if(t.heightCurve)return t.heightCurve;const e=nx(t.anchors),n=MR(e),r=l=>Math.max(0,oq(e,iLr(t.pace,l)*n)[1]),s=Array.from({length:iye},(l,c)=>r(c/(iye-1))),o=s.every(l

/*==============================================================================
 * 4. ENVIRONMENT wOr/xOr — sky shader, floor, sun, applyDaylight + HY daylight table
 * source file: tmp_b/env_wOr.js
 ==============================================================================*/
xOr(){const t=new Vt(new Ku(1,32,16),new rl({side:$p,depthTest:!1,depthWrite:!1,fog:!1,vertexShader:yOr,fragmentShader:vOr,uniforms:{zenith:{value:new hr},horizon:{value:new hr},flare:{value:new hr},flareDirection:{value:new Ge}}}));return t.frustumCulled=!1,t.renderOrder=-1,t.raycast=()=>{},t}function wOr(t,e){const n=xOr();t.add(n);const r=new cq(16777215,0);t.fog=r;const s=new VC;t.add(s);const a=new ax;a.castShadow=!0,a.shadow.mapSize.set(e.shadowMapPx,e.shadowMapPx),a.shadow.radius=2,t.add(a,a.target);const o=new Vt(new Mi($Y,$Y,Fat,Fat),new Io({color:lOr,roughness:.9,polygonOffset:!0,polygonOffsetFactor:4,polygonOffsetUnits:4}));o.rotation.x=-Math.PI/2,o.receiveShadow=!0;const l=new Vt(new Mi($Y,$Y));o.raycast=(f,m)=>{l.matrixWorld.copy(o.matrixWorld);const g=m.length;l.raycast(f,m);for(let b=g;b<m.length;b++)m[b].object=o},t.add(o);let c=NaN,d=NaN,u=0;return{floor:o,sun:a,applyDaylight:f=>{const m=()=>f.nightLights===!1?0:u;if(f.azimuthDeg===c&&f.elevationDeg===d)return m();c=f.azimuthDeg,d=f.elevationDeg;const g=$Fr(f.elevationDeg);s.color.copy(g.fillSky),s.groundColor.copy(g.fillGround),s.intensity=g.fill,a.color.copy(g.sunColor),a.intensity=g.sun,r.color.copy(g.horizon);const{uniforms:b}=n.material;b.zenith.value.copy(g.zenith),b.horizon.value.copy(g.horizon),b.flare.value.copy(g.sunColor).multiplyScalar(g.flare);const y=f.azimuthDeg*Math.PI/180,v=Math.max(f.elevationDeg,0)*Math.PI/180;return b.flareDirection.value.set(Math.sin(y)*Math.cos(v),Math.sin(v),-Math.cos(y)*Math.cos(v)),u=g.glow,m()}}}function fZt(t){t.shadowMap.enabled=!0,t.shadowMap.type=t$}const _Or=new Ge(0,1,0),Uj=new Ge,Dat=new Ge;function kOr(t,e,n){Uj.crossVectors(_Or,e),Uj.lengthSq()<1e-8&&Uj.set(1,0,0),Uj.normalize(),Dat.crossVectors(e,Uj).normalize(),Bat(t,Uj,n),Bat(t,Dat,n)}function Bat(t,e,n){const r=t.dot(e);t.addScaledVector(e,Math.round(r/n)*n-r)}const SOr=new Set(["camera","target"]);function TOr(t){const{sun:e}=t,n=new Ge,r=new Ge,s=new go,a=new go,o=new Of;let l=new Float64Array(4096),c=0,d=-1,u=!0;const h=y=>{if(c===l.length){const v=new Float64Array(l.length*2);v.set(l),l=v}l[c]!==y&&(l[c]=y,u=!0),c++},f=y=>{const{position:v,quaternion:x,scale:w}=y;h(y.id),h(y.visible?1:0),m(v),m(x),h(x.w),m(w)},m=y=>{h(y.x),h(y.y),h(y.z)};let g=0;const b=y=>{if(SOr.has(y.userData.kind)||y instanceof lie)return;const v=eOr(y);if(v){f(y),h(v.castShadow?1:0),h(v.angle);return}if(f(y),y instanceof Vt){const x=!y.material.isMeshBasicMaterial;if(y.castShadow=x,y.receiveShadow=x,y.userData.glows){const w=y.material;w.userData.glowAt!==g&&(w.userData.glowAt=g,w.emissive.setHex(cOr),w.emissiveIntensity=g)}}for(const x of y.children)b(x)};return()=>{c=0,s.makeEmpty(),g=t.applyDaylight(t.light());for(const j of t.roots())b(j),fOr.has(j.userData.kind)&&j.parent&&s.union(a.setFromObject(j));const y=t.bounds();y?r.copy(y.focus):r.set(0,0,0);let v=(y?.spread90??0)*hOr;const x=uOr*e.shadow.mapSize.x/2;if(!s.isEmpty()){s.expandByScalar(pOr).getBoundingSphere(o);const j=r.distanceTo(o.center)+o.radius;j<=x?v=Math.max(v,j):(r.copy(o.center),v=o.radius)}const w=Math.min(x,Math.max(dOr,Math.ceil(v/Oat)*Oat)),k=t.light();n.fromArray(M8r(k)),kOr(r,n,2*w/e.shadow.mapSize.x);const S=w*2;e.target.position.copy(r),e.position.copy(r).addScaledVector(n,S),e.target.updateMatrixWorld();const T=S+w+Math.max(0,r.y+w)/n.y,A=e.shadow.camera,C=Math.min(bOr,mOr*2*w/e.shadow.mapSize.x*Math.min(gOr,1/n.y));(A.right!==w||A.far!==T||e.shadow.normalBias!==C)&&(A.left=A.bottom=-w,A.right=A.top=w,A.near=Lat,A.far=T,A.updateProjectionMatrix(),e.shadow.bias=-.005/(T-Lat),e.shadow.normalBias=C),m(e.position),h(w),h(T);const E=u||c!==d;return u=!1,d=c,E}}function AOr(t){let e=0;const n=new WeakMap;return r=>{t()&&e++,n.get(r)!==e&&(n.has(r)||r.domElement.addEventListener("webglcontextrestored",()=>n.delete(r)),n.set(r,e),r.shadowMap.needsUpdate=!0)}}const FP=50;function 

/*==============================================================================
 * 5. Daylight stops HY + fog near/far pZt + spotlight system (sOr/oOr/iOr cookies)
 * source file: tmp_b/env_daylight.js
 ==============================================================================*/
ap(l=>l.getCenter(new Ge)),r=l=>n.map(c=>c[l]).sort((c,d)=>c-d),s=new Ge(sye(r("x")),sye(r("y")),sye(r("z"))),a=n.map(l=>Math.hypot(l.x-s.x,l.z-s.z)).sort((l,c)=>l-c),o=l=>a[Math.min(a.length-1,Math.floor(a.length*l))];return{focus:s,spread90:o(.9),spread95:o(.95)}}function LFr(t,e){let n=1/0;for(const r of t)n=Math.min(n,r.distanceToPoint(e));return n}function pZt(t){const e=t.now??(()=>performance.now());let n=null,r=-1/0;const s=()=>{const o=e();o-r>=_Fr&&(r=o,n=vje(t.meshById.values()));const l=t.camera.position,c=FFr(n,l);t.scene?.fog instanceof cq&&(t.scene.fog.density=c);const d=Math.min(hZt,Math.max(n?SFr(n.radius,l.distanceTo(n.centre)):RP,IFr/c)),u=CFr(d,n?LFr(n.boxes,l):1/0),h=(f,m)=>f>m*Sat||f<m/Sat;(h(d,t.camera.far)||h(u,t.camera.near))&&(t.camera.far=d,t.camera.near=u,t.camera.updateProjectionMatrix())};return{tick:s,fitNow:()=>{r=-1/0,s()},bounds:()=>n}}const DFr={zenith:14673392,horizon:15264752,fillSky:15133691,fillGround:13685210,fill:1.7,sunColor:16775150,sun:2.15,glow:0,flare:0},Aat=16747092,HY=[{elevationDeg:-30,zenith:329487,horizon:725280,fillSky:4149120,fillGround:1185311,fill:.5,sunColor:11847925,sun:.55,glow:1,flare:0},{elevationDeg:-16,zenith:857648,horizon:2635358,fillSky:5335213,fillGround:1909299,fill:.8,sunColor:11124204,sun:.3,glow:1,flare:0},{elevationDeg:GWt,zenith:1845064,horizon:9072524,fillSky:7568564,fillGround:3485759,fill:.95,sunColor:Aat,sun:0,glow:.8,flare:.3},{elevationDeg:-2,zenith:3820152,horizon:14719100,fillSky:9409220,fillGround:6245460,fill:1.15,sunColor:Aat,sun:.75,glow:.35,flare:.55},{elevationDeg:5,zenith:9677260,horizon:16240038,fillSky:13616862,fillGround:12098180,fill:1.45,sunColor:16755044,sun:3.6,glow:0,flare:.6},{elevationDeg:16,zenith:14082028,horizon:15918550,fillSky:14541038,fillGround:13287346,fill:1.55,sunColor:16768180,sun:2.7,glow:0,flare:.12},{elevationDeg:32,...DFr}],BFr=new hr,HFr=(t,e,n)=>new hr(t).lerp(BFr.set(e),n);function $Fr(t){const e=HY.length-1;let n=0;for(;n<e-1&&t>HY[n+1].elevationDeg;)n++;const r=HY[n],s=HY[n+1],a=m_.clamp((t-r.elevationDeg)/(s.elevationDeg-r.elevationDeg),0,1),o=c=>r[c]+(s[c]-r[c])*a,l=c=>HFr(r[c],s[c],a);return{zenith:l("zenith"),horizon:l("horizon"),fillSky:l("fillSky"),fillGround:l("fillGround"),fill:o("fill"),sunColor:l("sunColor"),sun:o("sun"),glow:o("glow"),flare:o("flare")}}const Cat=1024,VFr=.2,UFr=60,zFr=-4e-4,WFr=.02,GFr=1,qFr=6,ZFr=.05,KFr=.9,nre=1/(Math.SQRT2*1.06),Yx=128,Eat=10,XFr=.45,YFr=16769955,jat=7,QFr=.02,JFr=.07,Xhe=t=>t.userData.spotlight;function eOr(t){return Xhe(t)?.light}function tOr(t){return Xhe(t)?.lamp}const nOr=2895152;function rOr(){const t=new Al(.14,.16,.36,20);return t.rotateX(Math.PI/2),new Vt(t,new Io({color:nOr,roughness:.5}))}function sOr(t=new Ci){const e=new Ci,n=new OWt(16777215,0,0,Rhe(e.scale),0,2);return n.position.set(0,0,0),n.target.position.set(0,0,-1),n.shadow.mapSize.set(Cat,Cat),n.shadow.camera.near=VFr,n.shadow.camera.far=UFr,n.shadow.bias=zFr,n.shadow.normalBias=WFr,e.add(n,n.target,t),e.userData.spotlight={light:n,lamp:t},e}function aOr(t,e){const n=Xhe(t);n&&(t.remove(n.lamp),Kd(n.lamp),t.add(e),n.lamp=e)}const Iat=new Map;function iOr(t,e){const n=Math.round(e/100*Eat),r=`${t}:${n}`,s=Iat.get(r);if(s)return s;const a=new Uint8Array(Yx*Yx*4),o=n/Eat*XFr*nre,l=nre-o/2,c=nre+o/2;for(let u=0;u<Yx;u++)for(let h=0;h<Yx;h++){const f=(h+.5)/Yx*2-1,m=(u+.5)/Yx*2-1,g=t==="square"?Math.max(Math.abs(f),Math.abs(m)):Math.hypot(f,m),b=c>l?(g-l)/(c-l):g<l?0:1,y=Math.min(1,Math.max(0,b)),v=Math.round(255*(1-y*y*(3-2*y))),x=(u*Yx+h)*4;a[x]=a[x+1]=a[x+2]=v,a[x+3]=255}const d=new dq(a,Yx,Yx);return d.magFilter=$i,d.minFilter=$i,d.needsUpdate=!0,Iat.set(r,d),d}const Mat={round:Nat(40,0),square:Nat(4,Math.PI/4)};function Nat(t,e){const n=new uq(1,1,t,1,!0);return n.rotateY(e),n.translate(0,-.5,0),n.rotateX(Math.PI/2),n}const lL=new Ge,Pat=new Ge,Rat=new qn;function oOr(t){const e=e6r(t.gpu),n=new Ci;t.drawBeams&&t.scene.add(n);const r=new Map,s=new Set,a=c=>{let d=r.get(c);return d||(d=new Vt(Mat.round,new tl({color:YFr,transparent:!0,depthWrite:!1,side:Fc,blending:tEe})),d.raycast=()=>{},r.set(c,d),n.add(d)),d};return{tick:()=>{s.clear();let c=0;for(const d of t.roots()){if(d.userData.kind!=="spotlight")continue;const u=Xhe(d);if(!u)continue;s.add(d);const h=t.settingsOf(d.userData.objectId),f=h.diffusion/100;d.updateWorldMatrix(!0,!1),d.matrixWorld.decompose(Pat,Rat,lL);const m=Rhe(lL),g=c++<e,{light:b}=u;if(b.intensity=h.intensity*W8r,b.castShadow=g,g?(b.map=iOr(h.shape,h.diffusion),b.angle=Math.atan(Math.tan(m)/nre),b.penumbra=0,b.shadow.radius=GFr+f*qFr):(b.map=null,b.angle=m,b.penumbra=ZFr+f*KFr),u.lamp.scale.set(1/(lL.x||1),1/(lL.y||1),1/(lL.z||1)),!t.drawBeams)continue;const y=a(d);y.geometry=Mat[g?h.shape:"round"],y.position.copy(Pat),y.quaternion.copy(Rat);const v=jat*Math.tan(m)*(g&&h.shape==="square"?Math.SQRT2:1);y.scale.set(v,v,jat),y.visible=d.visible&&h.intensity>0,y.material.opacity=QFr+JFr*(h.intensity/100)*(1-f/2)}for(const[d,u]of r)s.has(d)||(n.remove(u),u.material.dispose(),r.delete(d))},beams:n,budget:e,dispose:()=>{for(const c of r.values())c.material.dispose();r.clear(),n.removeFromParent()}}}const lOr=13948377,cOr=16763274,$Y=8e4,Fat=128,dOr=30,uOr=.163,Oat=16,hOr=1.15,pOr=4,fOr=new Set(["humanoid","simple_figure"]),mOr=1.5,gOr=1/.15,bOr=.3,Lat=.1,yOr=`
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    // Rotated with the view, never moved: the sky is at infinity. xyww puts it on
    // the far plane whatever the clip range is.
    vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = clip.xyww;
  }
`,vOr=`
  varying vec3 vDirection;
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 flare;
  uniform vec3 flareDirection;
  void main() {
    vec3 direction = normalize(vDirection);
    float height = max(direction.y, 0.0);
    vec3 color = mix(horizon, zenith, pow(height, 0.55));
    // Kept off the horizon itself, where the sky has to match the haze exactly.
    color += flare * pow(max(dot(direction, flareDirection), 0.0), 7.0) * smoothstep(0.0, 0.06, height);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;function xOr(){const t

/*==============================================================================
 * 6. TOr shadow fingerprint + kOr/Bat shadow-camera grid snap + AOr shadow redraw
 * source file: tmp_b/env_wOr.js
 ==============================================================================*/
xOr(){const t=new Vt(new Ku(1,32,16),new rl({side:$p,depthTest:!1,depthWrite:!1,fog:!1,vertexShader:yOr,fragmentShader:vOr,uniforms:{zenith:{value:new hr},horizon:{value:new hr},flare:{value:new hr},flareDirection:{value:new Ge}}}));return t.frustumCulled=!1,t.renderOrder=-1,t.raycast=()=>{},t}function wOr(t,e){const n=xOr();t.add(n);const r=new cq(16777215,0);t.fog=r;const s=new VC;t.add(s);const a=new ax;a.castShadow=!0,a.shadow.mapSize.set(e.shadowMapPx,e.shadowMapPx),a.shadow.radius=2,t.add(a,a.target);const o=new Vt(new Mi($Y,$Y,Fat,Fat),new Io({color:lOr,roughness:.9,polygonOffset:!0,polygonOffsetFactor:4,polygonOffsetUnits:4}));o.rotation.x=-Math.PI/2,o.receiveShadow=!0;const l=new Vt(new Mi($Y,$Y));o.raycast=(f,m)=>{l.matrixWorld.copy(o.matrixWorld);const g=m.length;l.raycast(f,m);for(let b=g;b<m.length;b++)m[b].object=o},t.add(o);let c=NaN,d=NaN,u=0;return{floor:o,sun:a,applyDaylight:f=>{const m=()=>f.nightLights===!1?0:u;if(f.azimuthDeg===c&&f.elevationDeg===d)return m();c=f.azimuthDeg,d=f.elevationDeg;const g=$Fr(f.elevationDeg);s.color.copy(g.fillSky),s.groundColor.copy(g.fillGround),s.intensity=g.fill,a.color.copy(g.sunColor),a.intensity=g.sun,r.color.copy(g.horizon);const{uniforms:b}=n.material;b.zenith.value.copy(g.zenith),b.horizon.value.copy(g.horizon),b.flare.value.copy(g.sunColor).multiplyScalar(g.flare);const y=f.azimuthDeg*Math.PI/180,v=Math.max(f.elevationDeg,0)*Math.PI/180;return b.flareDirection.value.set(Math.sin(y)*Math.cos(v),Math.sin(v),-Math.cos(y)*Math.cos(v)),u=g.glow,m()}}}function fZt(t){t.shadowMap.enabled=!0,t.shadowMap.type=t$}const _Or=new Ge(0,1,0),Uj=new Ge,Dat=new Ge;function kOr(t,e,n){Uj.crossVectors(_Or,e),Uj.lengthSq()<1e-8&&Uj.set(1,0,0),Uj.normalize(),Dat.crossVectors(e,Uj).normalize(),Bat(t,Uj,n),Bat(t,Dat,n)}function Bat(t,e,n){const r=t.dot(e);t.addScaledVector(e,Math.round(r/n)*n-r)}const SOr=new Set(["camera","target"]);function TOr(t){const{sun:e}=t,n=new Ge,r=new Ge,s=new go,a=new go,o=new Of;let l=new Float64Array(4096),c=0,d=-1,u=!0;const h=y=>{if(c===l.length){const v=new Float64Array(l.length*2);v.set(l),l=v}l[c]!==y&&(l[c]=y,u=!0),c++},f=y=>{const{position:v,quaternion:x,scale:w}=y;h(y.id),h(y.visible?1:0),m(v),m(x),h(x.w),m(w)},m=y=>{h(y.x),h(y.y),h(y.z)};let g=0;const b=y=>{if(SOr.has(y.userData.kind)||y instanceof lie)return;const v=eOr(y);if(v){f(y),h(v.castShadow?1:0),h(v.angle);return}if(f(y),y instanceof Vt){const x=!y.material.isMeshBasicMaterial;if(y.castShadow=x,y.receiveShadow=x,y.userData.glows){const w=y.material;w.userData.glowAt!==g&&(w.userData.glowAt=g,w.emissive.setHex(cOr),w.emissiveIntensity=g)}}for(const x of y.children)b(x)};return()=>{c=0,s.makeEmpty(),g=t.applyDaylight(t.light());for(const j of t.roots())b(j),fOr.has(j.userData.kind)&&j.parent&&s.union(a.setFromObject(j));const y=t.bounds();y?r.copy(y.focus):r.set(0,0,0);let v=(y?.spread90??0)*hOr;const x=uOr*e.shadow.mapSize.x/2;if(!s.isEmpty()){s.expandByScalar(pOr).getBoundingSphere(o);const j=r.distanceTo(o.center)+o.radius;j<=x?v=Math.max(v,j):(r.copy(o.center),v=o.radius)}const w=Math.min(x,Math.max(dOr,Math.ceil(v/Oat)*Oat)),k=t.light();n.fromArray(M8r(k)),kOr(r,n,2*w/e.shadow.mapSize.x);const S=w*2;e.target.position.copy(r),e.position.copy(r).addScaledVector(n,S),e.target.updateMatrixWorld();const T=S+w+Math.max(0,r.y+w)/n.y,A=e.shadow.camera,C=Math.min(bOr,mOr*2*w/e.shadow.mapSize.x*Math.min(gOr,1/n.y));(A.right!==w||A.far!==T||e.shadow.normalBias!==C)&&(A.left=A.bottom=-w,A.right=A.top=w,A.near=Lat,A.far=T,A.updateProjectionMatrix(),e.shadow.bias=-.005/(T-Lat),e.shadow.normalBias=C),m(e.position),h(w),h(T);const E=u||c!==d;return u=!1,d=c,E}}function AOr(t){let e=0;const n=new WeakMap;return r=>{t()&&e++,n.get(r)!==e&&(n.has(r)||r.domElement.addEventListener("webglcontextrestored",()=>n.delete(r)),n.set(r,e),r.shadowMap.needsUpdate=!0)}}const FP=50;function 

/*==============================================================================
 * 7. Dqr orbit env (OrbitControls config) + nav-ball minimap lZr (U)
 * source file: tmp_b/env_Dqr.js
 ==============================================================================*/
Dqr(t){const{scene:e,camera:n,renderer:r,meshById:s}=t,{floor:a,sun:o,applyDaylight:l}=wOr(e,{shadowMapPx:Math.min(Fqr,r.capabilities.maxTextureSize)}),c=new _qr(n,r.domElement);c.target.set(0,1,0),c.enableDamping=!0,c.rotateSpeed=Lqr,c.mouseButtons={LEFT:wm.ROTATE,MIDDLE:wm.PAN,RIGHT:null},c.enableZoom=!1;function d(){const g=[a];for(const b of s.values()){const y=b.userData.kind;y==="camera"||y==="target"||y==="spotlight"||y==="humanoid"||y==="simple_figure"||y==="group"||g.push(b)}return g}const u=new Ge,h=new On;let f=!1;c.addEventListener("start",()=>{f=!0}),c.addEventListener("end",()=>{f=!1});const m=()=>{r.getDrawingBufferSize(h);const g=h.y/2*n.projectionMatrix.elements[5]/Math.max(1e-6,n.position.distanceTo(c.target)),b=n.position.distanceTo(u)*g;if(u.copy(n.position),f||b===0||b>=Oqr)return;const y=n.position.clone(),v=c.target.clone();c.enableDamping=!1,c.update(),c.enableDamping=!0,n.position.copy(y),c.target.copy(v),c.update()};return{orbit:c,sun:o,applyDaylight:l,floor:a,walkableSurfaces:d,tick:()=>{c.enabled&&(c.update(),m())},dispose:()=>c.dispose()}}const yKt="stage-finish",Bqr=11;function $ot(t){try{const e=t?.getItem(yKt);if(!e)return null;const{enabled:n,source:r}=JSON.parse(e);return typeof n!="boolean"||r!=="auto"&&r!=="manual"?null:{enabled:n,source:r}}catch{return null}}function Hqr(t,e){try{t?.setItem(yKt,JSON.stringify(e))}catch{}}const $qr=1920*1080,Vqr=320*200,Uqr=t=>t>=Vqr,zqr=t=>t.costMs*Math.max(1,$qr/t.pixels)<=Bqr,Wqr=5,Gqr=2;function qqr(t){const e=t.now??(()=>performance.now()),n=l=>{const c=e();return l(),t.finishGpu(),e()-c};for(let l=0;l<Gqr;l++)n(t.drawPlain),n(t.drawFinished);const r=[],s=[];for(let l=0;l<Wqr;l++)r.push(n(t.drawPlain)),s.push(n(t.drawFinished));const a=l=>l.sort((c,d)=>c-d)[l.length>>1],o=a(r);return{costMs:Math.max(0,a(s)-o),plainMs:o,pixels:t.pixels}}const Zqr=30,Kqr=300;function Xqr(){let t=0,e=Zqr,n=0;return{frame:()=>++t>=e,report:r=>zqr(r)?!0:++n>=2?!1:(e=t+Kqr,null)}}const Yqr=1e3,Iye=250,Qqr=50;function Jqr(){const t=new Uint32Array(Iye+1);let e=0,n=0;const r=s=>{const a=Math.ceil(s*e);let o=0;for(let l=0;l<t.length;l++)if(o+=t[l],o>=a)return l;return Iye};return{add:s=>{!(s>0)||s>Yqr||(t[Math.min(Iye,Math.round(s))]++,e++,s>Qqr&&n++)},summary:()=>e===0?null:{frames:e,p50Ms:r(.5),p95Ms:r(.95),slowShare:Math.round(n/e*1e3)/1e3}}}const eZr=16777215,tZr=1,nZr=30,Mye={x:0,y:.42,z:5.1},Vot=.17,rZr=.085,Uot=12,sZr=.68,aZr=1,iZr=.82,oZr=12;function lZr(t){const{renderer:e,camera:n,a:r}=t,s=new Kh,a=new Xo(nZr,1,.1,20);a.position.set(Mye.x,Mye.y,Mye.z),a.lookAt(0,0,0),s.add(new VC(16777215,4473924,2));const o=new ax(16777215,4);o.position.set(5,10,4),s.add(o);let l=null,c=0;const d=new Kh,u=new J1(-1,1,1,-1,0,1),h=new rl({transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uMap:{value:null},uRadius:{value:rZr},uDim:{value:iZr},uFadeFrom:{value:sZr},uFadeTo:{value:aZr}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,fragmentShader:`
      uniform sampler2D uMap;
      uniform float uRadius;
      uniform float uDim;
      uniform float uFadeFrom;
      uniform float uFadeTo;
      varying vec2 vUv;

      void main() {
        // Taps on a golden-angle spiral: an even disc of samples for the cost
        // of a loop, with none of the cross-shaped artefacts a box of taps
        // leaves on a hard edge.
        vec3 sum = texture2D(uMap, vUv).rgb;
        float count = 1.0;
        for (int i = 0; i < ${Uot}; i++) {
          float a = float(i) * 2.399963;
          float r = sqrt((float(i) + 0.5) / float(${Uot}));
          vec2 off = vec2(cos(a), sin(a)) * r * uRadius;
          sum += texture2D(uMap, vUv + off).rgb;
          count += 1.0;
        }
        float d = length(vUv - 0.5) * 2.0;
        float mask = 1.0 - smoothstep(uFadeFrom, uFadeTo, d);
        gl_FragColor = vec4(sum / count * uDim, mask);
      }
    `});d.add(new Vt(new Mi(2,2),h));const f=new Vt(new jhe(fot,tZr),new Io({color:eZr,roughness:.52,metalness:0,flatShading:!0}));s.add(f);const m=n.position.clone();let g=vot(n.quaternion);const b=new Ge,y=new qn,v=new On,x=new On,w=()=>iKt(r.mode.peek(),r.playSession.peek()!==null);function k(T){b.subVectors(n.position,m),m.copy(n.position);const A=vot(n.quaternion);let C=A-g;if(C>Math.PI&&(C-=Math.PI*2),C<-Math.PI&&(C+=Math.PI*2),g=A,!w())return;b.lengthSq()>0&&(Kzr(b,n.quaternion,fot,y),f.quaternion.premultiply(y)),C!==0&&f.quaternion.premultiply(Xzr(C,y));const E=r.navBallVector.peek(),j=Math.min(1,T*oZr),I=E?E.strafe*Vot:0,N=E?E.forward*Vot:0;f.position.x+=(I-f.position.x)*j,f.position.y+=(N-f.position.y)*j}function S(){if(!w())return;e.getSize(v);const T=v.x-jw-zie,A=v.y-jw-zie,C=e.autoClear;e.autoClear=!1,e.setScissorTest(!0),e.setScissor(T,A,jw,jw),e.setViewport(T,A,jw,jw);const E=e.getPixelRatio(),j=Math.round(jw*E);(!l||c!==j)&&(l?.dispose(),l=new Wvr(j,j),l.minFilter=$i,l.magFilter=$i,c=j,h.uniforms.uMap.value=l),x.set(Math.round(T*E),Math.round(A*E)),e.copyFramebufferToTexture(l,x)

/*==============================================================================
 * 8. pWr — object manipulation controller (gizmo, picking, lasso, path drag, WASD, fly)
 * source file: tmp_b/manip_pWr_pretty.js
 ==============================================================================*/
pWr(t,
  e){
  const{
    a:n,
    camera:r,
    renderer:s,
    meshById:a
  }=t,
  {
    orbit:o,
    pilot:l
  }=e,
  c=new ozr(r,
    s.domElement);
  Pzr(c);
  const d=c.getHelper();
  t.scene.add(d),
  t.planningAids.push(()=>[d]),
  e.gizmoLink.detachIfAttached=Ve=>{
    c.object===Ve&&c.detach()
  },
  e.gizmoLink.reseat=()=>B();
  let u={
    x:0,
    y:0,
    atMs:-1/0,
    selectionBefore:[],
    focusBefore:n.peekFocus()
  };
  const h=Ve=>{
    const st=Ve.timeStamp-u.atMs<uWr&&Math.hypot(Ve.clientX-u.x,
      Ve.clientY-u.y)<hWr;
    return u={
      x:Ve.clientX,
      y:Ve.clientY,
      atMs:st?-1/0:Ve.timeStamp,
      selectionBefore:n.selectedIds.peek(),
      focusBefore:n.peekFocus()
    },
    st
  };
  let f=null,
  m=null;
  const g=new di;
  t.scene.add(g);
  let b=null,
  y=null;
  c.addEventListener("objectChange",
    ()=>{
      const Ve=c.object;
      !y||!Ve||Ve instanceof bT||(y=GA([Ve.rotation.x,
            Ve.rotation.y,
            Ve.rotation.z],
          y),
        Ve.rotation.set(...y))
    });
  let v=null;
  const x=new di;
  t.scene.add(x);
  let w=null;
  const k=(Ve,
    st)=>Rzr(st,
    Re=>{
      const it=e.boneOf(Ve,
        Re)?.parent;
      return it instanceof bT?it.name:null
    }).map(Re=>({
        joint:Re,
        bone:e.boneOf(Ve,
          Re)
      })).filter(Re=>!!Re.bone),
  S=Ve=>{
    const st=new Ge,
    Me=new Ge;
    for(const Re of Ve)st.add(Re.getWorldPosition(Me));
    st.divideScalar(Ve.length),
    x.position.copy(st),
    x.quaternion.identity(),
    x.scale.set(1,
      1,
      1),
    x.updateMatrixWorld(!0)
  },
  T=(Ve,
    st,
    Me)=>{
    const Re=e.clipLocalOf(Ve,
      st)??v?.clipLocal;
    return Re?mBe(Me,
      Re):Hzt(QCe)
  },
  A=()=>{
    if(!w)return null;
    const Ve={
      position:x.position.clone().sub(w.start.position),
      quaternion:x.quaternion.clone(),
      scale:x.scale.clone()
    },
    st={
      
    };
    for(const{
        joint:Me,
        clipLocal:Re,
        startOffset:it
      }of w.joints){
      const ct=e.boneOf(w.objectId,
        Me);
      ct&&(st[Me]=Dzr(ct,
          Re,
          it,
          Ve))
    }return Object.keys(st).length>0?st:null
  },
  C=()=>{
    const Ve=n.selectedIds.peek();
    if(Ve.length<2)return null;
    const st=Ve.map(Me=>a.get(Me)).filter(Me=>!!Me);
    return st.length>=2?st:null
  },
  E=Ve=>{
    const st=new Ge,
    Me=new Ge;
    for(const Re of Ve)st.add(Re.getWorldPosition(Me));
    st.divideScalar(Ve.length),
    g.position.copy(st),
    g.quaternion.identity(),
    g.scale.set(1,
      1,
      1),
    g.updateMatrixWorld(!0)
  };
  let j=!1;
  const I=Ve=>{
    j=Ve.altKey,
    o.mouseButtons=iat(n.controlMode.peek(),
      Ve.altKey)
  };
  t.disposers.push(qt(()=>{
        const Ve=n.controlMode.get();
        o.mouseButtons=iat(Ve,
          !1),
        o.screenSpacePanning=Ve!=="default",
        o.touches.ONE=Ve==="default"?P8.PAN:P8.ROTATE
      })),
  s.domElement.addEventListener("pointerdown",
    I,
    {
      capture:!0
    }),
  t.disposers.push(()=>s.domElement.removeEventListener("pointerdown",
      I,
      {
        capture:!0
      }));
  let N=!1;
  c.addEventListener("dragging-changed",
    Ve=>{
      Ve.value?N=!0:y=null,
      o.enabled=!Ve.value&&n.mode.peek()==="edit";
      const st=c.object;
      if(Ve.value===!0&&c.object===x){
        const Ht=n.rigPoseObjectId.peek(),
        Yt=Ht?k(Ht,
          e.rigHandles.selectedJoints()):[];
        if(!Ht||Yt.length===0){
          c.detach();
          return
        }w={
          objectId:Ht,
          start:{
            position:x.position.clone()
          },
          joints:Yt.map(({
                joint:mn,
                bone:Nt
              })=>({
                joint:mn,
                clipLocal:e.clipLocalOf(Ht,
                  mn)??Uie(Nt),
                startOffset:T(Ht,
                  mn,
                  Nt)
              }))
        },
        e.setLiveRigDrag({
            objectId:Ht,
            offsets:Object.fromEntries(w.joints.map(mn=>[mn.joint,
                  mn.startOffset]))
          });
        return
      }if(Ve.value===!0&&st instanceof bT){
        const Ht=n.rigPoseObjectId.peek(),
        Yt=(Ht?k(Ht,
            e.rigHandles.selectedJoints()):[]).find(mn=>mn.bone===st)?.joint??null;
        if(!Ht||!Yt){
          c.detach();
          return
        }v={
          objectId:Ht,
          joint:Yt,
          clipLocal:e.clipLocalOf(Ht,
            Yt)??Uie(st)
        },
        e.setLiveRigDrag({
            objectId:Ht,
            offsets:{
              [Yt]:T(Ht,
                Yt,
                st)
            }
          });
        return
      }if(Ve.value===!1&&w){
        const Ht=A();
        w=null,
        e.setLiveRigDrag(null),
        Ht&&n.captureFocusedRigPose(Ht),
        B();
        return
      }if(Ve.value===!1&&v){
        const Ht=e.boneOf(v.objectId,
          v.joint),
        Yt=Ht?T(v.objectId,
          v.joint,
          Ht):null,
        mn=v.joint;
        v=null,
        e.setLiveRigDrag(null),
        Yt&&n.captureFocusedRigPose({
            [mn]:Yt
          });
        return
      }if(Ve.value===!0){
        if(m=null,
          y=c.object?[c.object.rotation.x,
            c.object.rotation.y,
            c.object.rotation.z]:null,
          c.object===g){
          let It=C()??[];
          if(j&&It.length){
            const pn=aMr(It.map(on=>on.userData.objectId),
              n.objects.peek()),
            fn=It.filter(on=>pn.includes(on.userData.objectId)).map(on=>n.duplicateObjectAt({
                  id:on.userData.objectId,
                  position:[on.position.x,
                    on.position.y,
                    on.position.z],
                  rotation:[on.rotation.x,
                    on.rotation.y,
                    on.rotation.z],
                  scale:[on.scale.x,
                    on.scale.y,
                    on.scale.z]
                })).filter(on=>!!on);
            n.setSelectedIds(fn),
            It=fn.map(on=>a.get(on)).filter(on=>!!on)
          }b=It.map(pn=>({
                mesh:pn,
                parent:pn.parent??t.scene,
                rotation:[pn.rotation.x,
                  pn.rotation.y,
                  pn.rotation.z]
              }));
          for(const{
              mesh:pn
            }of b)g.attach(pn);
          return
        }const Ht=c.object;
        if(j&&Ht&&!Xu(n.objects.peek(),
            Ht.userData.objectId)){
          const It=Ht.userData.kind==="camera"?Die(t,
            Ht):null,
          pn=n.duplicateObjectAt({
              id:Ht.userData.objectId,
              position:[Ht.position.x,
                Ht.position.y,
                Ht.position.z],
              rotation:[Ht.rotation.x,
                Ht.rotation.y,
                Ht.rotation.z],
              scale:[Ht.scale.x,
                Ht.scale.y,
                Ht.scale.z],
              targetPosition:It?[It.position.x,
                It.position.y,
                It.position.z]:void 0
            });
          m=pn;
          const Tt=pn?a.get(pn):void 0;
          Tt&&c.attach(Tt)
        }const Yt=c.object,
        mn=Yt?.userData.objectId,
        Nt=Yt?.userData.kind==="camera"&&xq(n,
          mn??null)?Die(t,
          Yt):null;
        f=Yt&&Nt?{
          camera:Yt.getWorldPosition(new Ge),
          quaternion:Yt.getWorldQuaternion(new qn),
          target:Nt.getWorldPosition(new Ge),
          targetMesh:Nt
        }:null;
        return
      }if(b){
        const Ht=b.map(({
              mesh:mn,
              parent:Nt,
              rotation:It
            })=>(Nt.attach(mn),
            {
              id:mn.userData.objectId,
              position:[mn.position.x,
                mn.position.y,
                mn.position.z],
              rotation:GA([mn.rotation.x,
                  mn.rotation.y,
                  mn.rotation.z],
                It),
              scale:[mn.scale.x,
                mn.scale.y,
                mn.scale.z]
            }));
        b=null;
        for(const mn of Ht)n.updateObjectTransform(mn.id,
          {
            position:[...mn.position],
            rotation:[...mn.rotation],
            scale:[...mn.scale]
          });
        const Yt=C();
        Yt&&E(Yt);
        return
      }const Me=c.object,
      Re=Me?.userData.objectId,
      it=f?f.targetMesh:null,
      ct=it?.userData.objectId,
      At=it?.position.clone();
      f=null;
      const Dt=m;
      if(m=null,
        !Me||!Re)return;
      if(!mZt(Me)){
        kZt(n,
          Re,
          {
            position:[Me.position.x,
              Me.position.y,
              Me.position.z],
            rotation:[Me.rotation.x,
              Me.rotation.y,
              Me.rotation.z],
            scale:[Me.scale.x,
              Me.scale.y,
              Me.scale.z]
          });
        return
      }const zt=()=>{
        const Ht=n.objects.peek();
        for(const Yt of[Re,
            ct]){
          const mn=Yt?Ht[Yt]:void 0,
          Nt=Yt?t.meshById.get(Yt):void 0;
          !mn||!Nt||(Nt.position.set(...mn.position),
            Nt.rotation.set(...mn.rotation))
        }
      },
      Zt=SZt(n,
        {
          id:Re,
          world:Bie(Me),
          windFrom:[Me.rotation.x,
            Me.rotation.y,
            Me.rotation.z],
          mode:n.transformMode.peek(),
          resolveAim:e.foldResolvers(Re,
            n.performanceTimeS.peek())?.resolveAim??null,
          toLocal:(Ht,
            Yt)=>(Hie(Me,
              lWr.set(...Yt.position),
              cWr.setFromEuler(dWr.set(...Yt.rotation))),
            {
              position:[Me.position.x,
                Me.position.y,
                Me.position.z],
              rotation:[Me.rotation.x,
                Me.rotation.y,
                Me.rotation.z],
              scale:[Me.scale.x,
                Me.scale.y,
                Me.scale.z]
            }),
          worldPoseOf:Ht=>{
            const Yt=t.meshById.get(Ht);
            return Yt?{
              position:Yt.getWorldPosition(new Ge),
              quaternion:Yt.getWorldQuaternion(new qn)
            }:null
          },
          target:ct&&At?{
            id:ct,
            position:[At.x,
              At.y,
              At.z]
          }:null
        });
      if(Zt.outcome==="refused")Dt?n.deleteObject(Dt):zt(),
      ot.warning(TZt(Zt.reason));
      else if(Zt.outcome==="keyed"){
        const Ht=ct?n.objects.peek()[ct]:void 0;
        it&&Ht&&it.position.set(...Ht.position)
      }else if(Zt.outcome==="unbased"){
        if(Dt){
          n.deleteObject(Dt),
          ot.warning(Zt.reason==="anchored"?_._({
                id:"euVfNP"
              }):_._({
                id:"UWeJnj"
              }));
          return
        }zt(),
        ot.warning(AZt(Zt.reason))
      }
    }),
  c.addEventListener("objectChange",
    ()=>{
      const Ve=c.object;
      !v||!(Ve instanceof bT)||e.setLiveRigDrag({
          objectId:v.objectId,
          offsets:{
            [v.joint]:T(v.objectId,
              v.joint,
              Ve)
          }
        })
    }),
  c.addEventListener("objectChange",
    ()=>{
      if(!w||c.object!==x)return;
      const Ve=A();
      Ve&&e.setLiveRigDrag({
          objectId:w.objectId,
          offsets:Ve
        })
    }),
  c.addEventListener("objectChange",
    ()=>{
      if(!f||!c.object)return;
      const Ve=f.targetMesh;
      POr(Ve,
        XWt(f,
          {
            position:c.object.getWorldPosition(aWr),
            quaternion:c.object.getWorldQuaternion(oWr)
          },
          iWr))
    });
  function P(Ve,
    st){
    const Me=e.foldResolvers(Ve,
      n.performanceTimeS.peek());
    return Me?wje(n,
      Ve,
      st,
      Me.resolveAim):!0
  }function F(){
    const Ve=c.object?.userData.objectId,
    st=c.object?.userData.kind,
    Me=n.transformMode.peek(),
    Re=Ve?Xu(n.objects.peek(),
      Ve):!1,
    it=()=>st==="camera"&&!!Ve&&!!c.object&&!P(Ve,
      Bie(c.object)),
    ct=Me==="rotate"&&it();
    c.setMode(Re||ct||st==="camera"&&Me==="scale"?"translate":Me),
    n.setRotateAvailable(!Re&&!it())
  }function B(){
    if(b||w)return;
    const Ve=n.mode.peek()==="edit"&&n.editInteraction.peek()==="idle"&&n.playSession.peek()===null,
    st=Ve?C():null;
    if(st){
      E(st),
      c.attach(g),
      F();
      return
    }const Me=Ve?n.rigPoseObjectId.peek():null,
    Re=e.rigHandles.selectedJoints();
    if(Me&&Re.length>0){
      const zt=k(Me,
        Re);
      if(zt.length>1){
        S(zt.map(Zt=>Zt.bone)),
        c.attach(x),
        F();
        return
      }if(zt.length===1){
        c.attach(zt[0].bone),
        F();
        return
      }
    }const ct=n.transformPoseObjectId.peek()??n.selectedId.peek(),
    At=ct?a.get(ct):void 0,
    Dt=!!ct&&At?.userData.kind==="target"&&!uZt(n,
      n.objects.peek(),
      n.focusedCameraId.peek(),
      ct,
      ct);
    At&&!Dt&&n.mode.peek()==="edit"&&n.editInteraction.peek()==="idle"&&n.playSession.peek()===null?(c.attach(At),
      F()):c.detach()
  }B(),
  t.disposers.push(qt(()=>{
        n.selectedId.get(),
        n.selectedIds.get(),
        n.transformPoseObjectId.get(),
        n.rigPoseObjectId.get(),
        n.editInteraction.get(),
        n.playSession.get(),
        n.show.get(),
        B()
      })),
  c.setMode(n.transformMode.peek()),
  t.disposers.push(qt(()=>{
        n.transformMode.get(),
        n.performanceTimeS.get(),
        n.show.get(),
        F()
      }));
  const H=new Xo,
  z=new rzr(H,
    s.domElement);
  z.pointerSpeed=tWr;
  let L=Zrt,
  $=Krt,
  O={
    value:0,
    rate:0
  },
  W={
    value:0,
    rate:0
  },
  U={
    value:0,
    rate:0
  };
  const V=new va(0,
    0,
    0,
    "YXZ");
  function G(){
    V.setFromQuaternion(l.quaternion),
    V.z=0,
    H.quaternion.setFromEuler(V),
    O={
      value:V.y,
      rate:0
    },
    W={
      value:V.x,
      rate:0
    },
    U={
      value:0,
      rate:0
    },
    L=Zrt,
    $=Krt
  }const Z=new Set;
  let se=null;
  const X=new va(0,
    0,
    0,
    "YXZ");
  let te=!1;
  const ne=()=>n.controlMode.peek()==="default"&&n.mode.peek()==="edit"&&n.playSession.peek()===null&&!n.planShown.peek()&&!n.sceneNodeOpen.peek(),
  Q=new Map,
  q=Ve=>{
    if(!ix()||Ve.repeat)return;
    const st=n.mode.peek();
    if(Ve.key==="Shift"&&Z.add("shift"),
      NGt(Ve)||st!=="camera"&&!te&&!ne()||st==="camera"&&!n.pageLive.peek())return;
    const Me=Ve.key.toLowerCase();
    if(Z.add(Me),
      Q.set(Ve.code,
        Me),
      st==="camera"){
      if(Me==="r"){
        n.toggleRecording();
        return
      }Me==="escape"&&sWr({
          pointerLocked:z.isLocked,
          consumed:Ve.defaultPrevented
        })&&(Ve.preventDefault(),
        n.exitCameraMode())
    }
  },
  Y=Ve=>{
    Z.delete(Ve.key.toLowerCase());
    const st=Q.get(Ve.code);
    st&&Z.delete(st),
    Ve.key==="Meta"&&Z.clear()
  },
  re=()=>{
    Z.clear(),
    le()
  };
  document.addEventListener("keydown",
    q),
  document.addEventListener("keyup",
    Y),
  window.addEventListener("blur",
    re),
  t.disposers.push(()=>{
      document.removeEventListener("keydown",
        q),
      document.removeEventListener("keyup",
        Y),
      window.removeEventListener("blur",
        re)
    });
  const ae=new va(0,
    0,
    0,
    "YXZ"),
  ie=new Ge,
  ge=new Ge,
  pe=new Ge,
  ce=new Ge,
  be=new XEe;
  function fe(Ve){
    const st=r.position.clone().sub(o.target);
    st.lengthSq()<1e-12&&r.getWorldDirection(st).multiplyScalar(-_ot);
    const Me=Math.exp(Ve*wot),
    Re=m_.clamp(st.length()*Me,
      _ot,
      AFr(e.sceneBounds()?.radius)),
    it=st.length();
    st.setLength(Re),
    r.position.copy(o.target).add(st),
    it>0&&e.addNavProgress("zoom",
      Math.abs(Math.log(Re/it)))
  }function we(Ve,
    st){
    const Me=2*Math.PI*o.rotateSpeed/Math.max(1,
      s.domElement.clientHeight);
    ce.copy(r.position).sub(o.target),
    be.setFromVector3(ce),
    be.theta+=Ve*Me,
    be.phi=m_.clamp(be.phi+st*Me,
      kot,
      Math.min(Math.PI-kot,
        o.maxPolarAngle)),
    r.position.copy(o.target).add(ce.setFromSpherical(be)),
    r.lookAt(o.target),
    e.addNavProgress("orbit",
      Math.hypot(Ve,
        st)*Me)
  }function Ee(Ve,
    st){
    const Me=r.position.distanceTo(o.target),
    Re=Me*rWr;
    r.getWorldDirection(ie),
    ge.crossVectors(ie,
      r.up).normalize(),
    pe.crossVectors(ge,
      ie).normalize();
    const it=ge.multiplyScalar(-Ve*Re).add(pe.multiplyScalar(st*Re));
    r.position.add(it),
    o.target.add(it),
    Me>0&&e.addNavProgress("pan",
      it.length()/Me)
  }const xe=Ve=>{
    if(n.mode.peek()==="camera"){
      Ve.preventDefault(),
      n.zoomCameraByWheel(Ve.deltaY,
        Ve.deltaMode);
      return
    }if(n.mode.peek()!=="edit"||n.playSession.peek()!==null)return;
    if(Vzr(Ve,
        n.inputDevice.peek())==="zoom"){
      Ve.preventDefault(),
      fe(Ve.deltaY);
      return
    }if(n.controlMode.peek()==="default"){
      Ve.preventDefault(),
      we(Ve.deltaX,
        Ve.deltaY);
      return
    }Ve.preventDefault(),
    Ee(Ve.deltaX,
      Ve.deltaY)
  };
  function J(){
    const Ve=o.target.distanceTo(r.position);
    r.getWorldDirection(ie),
    o.target.copy(r.position).addScaledVector(ie,
      Ve),
    o.enabled=n.mode.peek()==="edit"
  }function le(){
    te&&(te=!1,
      J())
  }const ue=Ve=>{
    Ve.button===2&&n.controlMode.peek()!=="default"&&(n.mode.peek()!=="edit"||c.dragging||n.playSession.peek()===null&&(te=!0,
        o.enabled=!1,
        s.domElement.setPointerCapture(Ve.pointerId)))
  },
  oe=Ve=>{
    if(!te)return;
    ae.setFromQuaternion(r.quaternion),
    ae.y-=Ve.movementX*xot,
    ae.x-=Ve.movementY*xot;
    const st=Math.PI/2-.01;
    ae.x=Math.max(-st,
      Math.min(st,
        ae.x)),
    r.quaternion.setFromEuler(ae)
  },
  ye=Ve=>{
    Ve.button===2&&le()
  },
  je=()=>le(),
  ve=()=>{
    if(n.phoneStreaming.peek()){
      z.unlock();
      return
    }n.setFlyLocked(!0)
  },
  ke=()=>{
    n.setFlyLocked(!1);
    const Ve=n.mode.peek();
    (Ve==="edit"||Ve==="camera")&&J()
  };
  z.addEventListener("lock",
    ve),
  z.addEventListener("unlock",
    ke),
  t.disposers.push(()=>{
      z.removeEventListener("lock",
        ve),
      z.removeEventListener("unlock",
        ke)
    });
  const Ae={
    offset:new Ge,
    target:new Ge
  };
  let Se=!1;
  const me=()=>{
    Ae.offset.copy(r.position).sub(o.target),
    Ae.target.copy(o.target)
  },
  Te=()=>{
    Se=!0,
    me()
  },
  Le=()=>{
    Se=!1
  },
  Fe=()=>{
    if(!Se)return;
    const Ve=r.position.clone().sub(o.target),
    st=Ae.offset.length(),
    Me=Ve.length();
    e.addNavProgress("pan",
      Ae.target.distanceTo(o.target)/(Me||1)),
    st>0&&Me>0&&(e.addNavProgress("orbit",
        Ae.offset.angleTo(Ve)),
      e.addNavProgress("zoom",
        Math.abs(Math.log(Me/st)))),
    me()
  };
  o.addEventListener("start",
    Te),
  o.addEventListener("change",
    Fe),
  o.addEventListener("end",
    Le),
  t.disposers.push(()=>{
      o.removeEventListener("start",
        Te),
      o.removeEventListener("change",
        Fe),
      o.removeEventListener("end",
        Le)
    });
  const tt=Ve=>Ve.preventDefault(),
  Oe=Ve=>{
    Ve.button===1&&Ve.preventDefault()
  };
  s.domElement.addEventListener("pointerdown",
    ue),
  s.domElement.addEventListener("pointermove",
    oe),
  s.domElement.addEventListener("pointerup",
    ye),
  s.domElement.addEventListener("pointercancel",
    je),
  s.domElement.addEventListener("contextmenu",
    tt),
  s.domElement.addEventListener("mousedown",
    Oe),
  s.domElement.addEventListener("wheel",
    xe,
    {
      passive:!1
    }),
  t.disposers.push(()=>{
      s.domElement.removeEventListener("pointerdown",
        ue),
      s.domElement.removeEventListener("pointermove",
        oe),
      s.domElement.removeEventListener("pointerup",
        ye),
      s.domElement.removeEventListener("pointercancel",
        je),
      s.domElement.removeEventListener("contextmenu",
        tt),
      s.domElement.removeEventListener("mousedown",
        Oe),
      s.domElement.removeEventListener("wheel",
        xe)
    });
  {
    let Ve=null,
    st=!0;
    const Me=Yt=>{
      const mn=Yt[0],
      Nt=Yt[1];
      return Math.hypot(Nt.clientX-mn.clientX,
        Nt.clientY-mn.clientY)
    },
    Re=Yt=>({
        x:(Yt[0].clientX+Yt[1].clientX)/2,
        y:(Yt[0].clientY+Yt[1].clientY)/2
      });
    let it={
      x:0,
      y:0
    },
    ct=!1;
    const At=()=>n.mode.peek()==="edit"&&n.playSession.peek()===null,
    Dt=Yt=>{
      Yt.touches.length<2||!At()||(Yt.cancelable&&Yt.preventDefault(),
        Ve=Me(Yt.touches),
        it=Re(Yt.touches),
        ct||(st=o.enabled),
        ct=!0,
        o.enabled=!1)
    },
    zt=Yt=>{
      if(Ve===null||Yt.touches.length<2||!At())return;
      Yt.cancelable&&Yt.preventDefault();
      const mn=Me(Yt.touches);
      if(Ve>0&&mn>0){
        const It=mn/Ve;
        fe(-Math.log(It)/wot)
      }Ve=mn;
      const Nt=Re(Yt.touches);
      n.controlMode.peek()==="default"&&we(it.x-Nt.x,
        it.y-Nt.y),
      it=Nt
    },
    Zt=Yt=>{
      Yt.touches.length>=2||(Ve=null,
        Yt.touches.length===0&&ct&&(ct=!1,
          o.enabled=st))
    },
    Ht=s.domElement;
    Ht.addEventListener("touchstart",
      Dt,
      {
        passive:!1
      }),
    Ht.addEventListener("touchmove",
      zt,
      {
        passive:!1
      }),
    Ht.addEventListener("touchend",
      Zt),
    Ht.addEventListener("touchcancel",
      Zt),
    t.disposers.push(()=>{
        Ht.removeEventListener("touchstart",
          Dt),
        Ht.removeEventListener("touchmove",
          zt),
        Ht.removeEventListener("touchend",
          Zt),
        Ht.removeEventListener("touchcancel",
          Zt)
      })
  }const Je=()=>{
    n.mode.peek()==="camera"&&!n.phoneStreaming.peek()&&!z.isLocked&&z.lock()
  };
  s.domElement.addEventListener("click",
    Je),
  t.disposers.push(()=>s.domElement.removeEventListener("click",
      Je)),
  t.disposers.push(qt(()=>{
        !n.phoneStreaming.get()||!z.isLocked||z.unlock()
      }));
  function $e(){
    const Ve=n.mode.peek();
    Ve==="edit"?(z.isLocked&&z.unlock(),
      se&&(r.position.copy(se.position),
        r.quaternion.copy(se.quaternion),
        o.target.copy(se.target),
        se=null),
      o.enabled=!0,
      r.fov=FP,
      r.updateProjectionMatrix(),
      B()):(le(),
      c.detach(),
      o.enabled=!1,
      Ve==="camera"&&(se||(se={
            position:r.position.clone(),
            quaternion:r.quaternion.clone(),
            target:o.target.clone()
          }),
        vZt(t,
          null,
          r)||(r.position.y=Math.max(r.position.y,
            Yzr)),
        e.applyCameraModeFov(),
        l.position.copy(r.position),
        l.quaternion.copy(r.quaternion),
        G(),
        e.captureSpawnPose(r.quaternion,
          r.position)),
      Ve==="review"&&(z.isLocked&&z.unlock(),
        r.fov=FP,
        r.updateProjectionMatrix())),
    e.updateFrameGuide()
  }$e(),
  t.disposers.push(qt(()=>{
        n.mode.get(),
        $e()
      }));
  const Ue=new Bv;
  let et=null,
  He=0,
  qe=null,
  ze=!1,
  We=!1;
  t.disposers.push(qt(()=>{
        const Ve=n.editInteraction.get()==="lasso";
        Ve&&!We?(ze=o.enabled,
          o.enabled=!1,
          s.domElement.style.cursor=nWr):!Ve&&We&&(o.enabled=ze,
          s.domElement.style.cursor="",
          qe=null,
          n.lassoRect.set(null)),
        We=Ve
      }));
  const dt=(Ve,
    st)=>{
    if(!qe)return;
    const Me=s.domElement.getBoundingClientRect(),
    Re=qe.x-Me.left,
    it=qe.y-Me.top,
    ct=Ve-Me.left,
    At=st-Me.top;
    n.lassoRect.set({
        x:Math.min(Re,
          ct),
        y:Math.min(it,
          At),
        w:Math.abs(ct-Re),
        h:Math.abs(At-it)
      })
  },
  mt=new Ge,
  jt=(Ve,
    st)=>{
    const Me=s.domElement.getBoundingClientRect(),
    Re=Math.min(Ve.x,
      st.x)-Me.left,
    it=Math.max(Ve.x,
      st.x)-Me.left,
    ct=Math.min(Ve.y,
      st.y)-Me.top,
    At=Math.max(Ve.y,
      st.y)-Me.top,
    Dt=n.objects.peek(),
    zt=[];
    for(const[Zt,
        Ht]of a){
      if(!Dt[Zt]?.kind||Xu(Dt,
          Zt)||(Ht.getWorldPosition(mt).project(r),
          mt.z>1))continue;
      const mn=(mt.x*.5+.5)*Me.width,
      Nt=(-mt.y*.5+.5)*Me.height;
      mn>=Re&&mn<=it&&Nt>=ct&&Nt<=At&&zt.push(Zt)
    }n.setSelectedIds(zt)
  };
  let bt=null,
  gt=!1;
  const rt=new r2,
  Ct=new Ge,
  Kt=new r2,
  Pn=new Ge,
  pr=new Ge,
  _t=(Ve,
    st)=>{
    const Me=s.domElement.getBoundingClientRect();
    return new On((Ve-Me.left)/Me.width*2-1,
      -((st-Me.top)/Me.height)*2+1)
  },
  sn=()=>{
    const Ve=n.performancePaint.peek();
    if(!Ve)return[];
    const st=n.show.peek().tracks.flatMap(Me=>Me.items).find(Me=>Me.id===Ve.itemId);
    return st&&g2(st)?st.anchors:[]
  },
  En=(Ve,
    st)=>{
    if(n.editInteraction.peek()!=="editingPath"||t.pathEditPickables.length===0)return null;
    Ue.setFromCamera(_t(Ve,
        st),
      r);
    const Me=Ue.intersectObjects(t.pathEditPickables,
      !1)[0];
    if(!Me)return null;
    const Re=Me.object.userData;
    return Re.pathHandle==="in"||Re.pathHandle==="out"?{
      kind:"handle",
      index:Re.pathHandleAnchor,
      handle:Re.pathHandle
    }:typeof Re.pathHeightAnchor=="number"?{
      kind:"height",
      index:Re.pathHeightAnchor
    }:typeof Re.pathAnchorIndex=="number"?{
      kind:"anchor",
      index:Re.pathAnchorIndex
    }:null
  },
  Hn=Ve=>{
    if(Ve.button!==0)return;
    const st=En(Ve.clientX,
      Ve.clientY);
    st&&(bt=st.kind==="anchor"?{
        kind:"anchor",
        index:st.index,
        moved:!1
      }:st.kind==="height"?{
        kind:"height",
        index:st.index
      }:{
        kind:"handle",
        index:st.index,
        handle:st.handle
      },
      gt=o.enabled,
      o.enabled=!1,
      s.domElement.setPointerCapture(Ve.pointerId))
  },
  Gr=Ve=>{
    if(!bt)return;
    if(Ue.setFromCamera(_t(Ve.clientX,
          Ve.clientY),
        r),
      bt.kind==="anchor"){
      const Me=Ue.intersectObjects(e.walkableSurfaces(),
        !0)[0];
      if(!Me)return;
      bt.moved=!0,
      n.movePathAnchor(bt.index,
        [Me.point.x,
          Me.point.y,
          Me.point.z]);
      return
    }const st=sn()[bt.index];
    if(st){
      if(bt.kind==="height"){
        if(Pn.subVectors(r.position,
            pr.set(st.pos[0],
              st.pos[1],
              st.pos[2])).setY(0),
          Pn.lengthSq()<1e-8||(Pn.normalize(),
            Kt.setFromNormalAndCoplanarPoint(Pn,
              pr),
            !Ue.ray.intersectPlane(Kt,
              Ct)))return;
        n.setPathAnchorHeight(bt.index,
          MOr(Ct.y));
        return
      }rt.set(new Ge(0,
          1,
          0),
        -st.pos[1]),
      Ue.ray.intersectPlane(rt,
        Ct)&&n.movePathHandle(bt.index,
        bt.handle,
        [Ct.x-st.pos[0],
          0,
          Ct.z-st.pos[2]],
        {
          break:Ve.altKey
        })
    }
  },
  zn=Ve=>{
    if(!bt)return;
    const st=bt;
    bt=null,
    o.enabled=gt,
    s.domElement.hasPointerCapture(Ve.pointerId)&&s.domElement.releasePointerCapture(Ve.pointerId),
    st.kind==="anchor"&&!st.moved&&n.selectPathAnchor(st.index),
    st.kind==="height"&&n.selectPathAnchor(st.index)
  },
  br=Ve=>{
    et=Ve.button===0?{
      x:Ve.clientX,
      y:Ve.clientY
    }:null,
    He=0,
    Ve.button===0&&n.editInteraction.peek()==="lasso"&&(qe={
        x:Ve.clientX,
        y:Ve.clientY
      },
      dt(Ve.clientX,
        Ve.clientY),
      s.domElement.setPointerCapture(Ve.pointerId))
  },
  Nr=Ve=>{
    qe&&dt(Ve.clientX,
      Ve.clientY),
    et&&(He=Math.max(He,
        Math.hypot(Ve.clientX-et.x,
          Ve.clientY-et.y)))
  },
  ua=Ve=>{
    if(Ve.button!==0)return;
    if(N){
      N=!1;
      const It=et&&Math.hypot(Ve.clientX-et.x,
        Ve.clientY-et.y)<=Sye;
      if(et=null,
        It&&h(Ve)){
        const pn=n.selectedId.peek();
        pn&&e.focusObject(pn)
      }return
    }if(bt){
      et=null;
      return
    }if(qe){
      const It=qe;
      qe=null,
      n.lassoRect.set(null),
      s.domElement.hasPointerCapture(Ve.pointerId)&&s.domElement.releasePointerCapture(Ve.pointerId),
      et=null,
      Math.hypot(Ve.clientX-It.x,
        Ve.clientY-It.y)>Sye&&(jt(It,
          {
            x:Ve.clientX,
            y:Ve.clientY
          }),
        n.editInteraction.set("idle"));
      return
    }if(!et||n.mode.peek()!=="edit"||c.dragging||n.playSession.peek()!==null){
      et=null;
      return
    }const st=He;
    if(et=null,
      st>Sye)return;
    const Me=s.domElement.getBoundingClientRect(),
    Re=new On((Ve.clientX-Me.left)/Me.width*2-1,
      -((Ve.clientY-Me.top)/Me.height)*2+1);
    if(Ue.setFromCamera(Re,
        r),
      n.editInteraction.peek()!=="idle"){
      const It=Ue.intersectObjects(e.walkableSurfaces(),
        !0)[0];
      if(!It)return;
      {
        const pn=[It.point.x,
          It.point.y,
          It.point.z],
        Tt=n.performancePaint.peek(),
        fn=Tt?n.show.peek().tracks.flatMap(Ns=>Ns.items).find(Ns=>Ns.id===Tt.itemId):void 0,
        on=fn&&g2(fn)?fn.anchors:[],
        Es=j2r(on,
          pn);
        Es&&Es.distance<Qzr?n.insertPathAnchor(Es.segmentIndex,
          pn):n.appendPathAnchor(pn)
      }return
    }if(t.rigJointPickables.length>0){
      const It=Ue.intersectObjects(t.rigJointPickables,
        !1)[0];
      if(It){
        const pn=It.object.userData.rigJoint,
        Tt=Ve.metaKey||Ve.ctrlKey||Ve.shiftKey,
        fn=e.rigHandles.selectedJoints();
        e.rigHandles.setSelectedJoints(Fzr(fn,
            pn,
            Tt)),
        B();
        return
      }
    }const At=Ue.intersectObjects([...a.values()],
      !0)[0],
    {
      selectionBefore:Dt,
      focusBefore:zt
    }=u;
    if(h(Ve)){
      const It=n.selectedId.peek();
      if(At&&It)e.focusObject(It);
      else{
        n.setSelectedIds(Dt),
        n.restoreFocus(zt);
        const pn=At??Ue.intersectObjects(e.walkableSurfaces(),
          !0)[0];
        pn&&e.centerViewOn(pn)
      }return
    }if(!At){
      n.selectObject(null);
      return
    }let Zt=At.object;
    for(;
      Zt&&Zt.userData.objectId===void 0;
      )Zt=Zt.parent;
    const Ht=Zt?.userData.objectId??null;
    if(!Ht){
      n.selectObject(null);
      return
    }const Yt=n.objects.peek(),
    mn=n.selectedId.peek(),
    Nt=JEe(Yt,
      Ht,
      mn);
    if(Ve.metaKey||Ve.ctrlKey){
      const It=mn&&Yt[mn]?.parentId?Nt:JEe(Yt,
        Ht,
        null);
      n.toggleSelect(Ve.altKey?Ht:It)
    }else Ve.altKey?n.selectObject(Ht):n.selectObject(Nt)
  },
  Qs=()=>{
    N=!1,
    et=null
  };
  s.domElement.addEventListener("pointerdown",
    br),
  s.domElement.addEventListener("pointermove",
    Nr),
  s.domElement.addEventListener("pointerup",
    ua),
  s.domElement.addEventListener("pointercancel",
    Qs),
  s.domElement.addEventListener("pointerdown",
    Hn,
    {
      capture:!0
    }),
  s.domElement.addEventListener("pointermove",
    Gr),
  s.domElement.addEventListener("pointerup",
    zn),
  t.disposers.push(()=>{
      s.domElement.removeEventListener("pointerdown",
        br),
      s.domElement.removeEventListener("pointermove",
        Nr),
      s.domElement.removeEventListener("pointerup",
        ua),
      s.domElement.removeEventListener("pointercancel",
        Qs),
      s.domElement.removeEventListener("pointerdown",
        Hn,
        {
          capture:!0
        }),
      s.domElement.removeEventListener("pointermove",
        Gr),
      s.domElement.removeEventListener("pointerup",
        zn)
    });
  const Sa=Hzr(n,
    ()=>te);
  document.addEventListener("keydown",
    Sa),
  t.disposers.push(()=>document.removeEventListener("keydown",
      Sa));
  function Ma(Ve){
    if(n.mode.peek()==="camera")if(n.peekPhoneDelta()){
      e.applyPhoneAim(),
      G();
      const st=1-Math.exp(-Ve/Jzr);
      r.position.lerp(l.position,
        st),
      r.quaternion.slerp(l.quaternion,
        st)
    }else en(Ve),
    r.position.copy(l.position),
    r.quaternion.copy(l.quaternion);
    else if(te){
      const st=Z.has("shift")?Aye:1,
      Me=Tye*st*Ve;
      r.getWorldDirection(ie),
      ge.crossVectors(ie,
        r.up).normalize(),
      Z.has("w")&&r.position.addScaledVector(ie,
        Me),
      Z.has("s")&&r.position.addScaledVector(ie,
        -Me),
      Z.has("d")&&r.position.addScaledVector(ge,
        Me),
      Z.has("a")&&r.position.addScaledVector(ge,
        -Me),
      Z.has("q")&&(r.position.y-=Me),
      Z.has("e")&&(r.position.y+=Me)
    }else ha(Ve),
    Ye(Ve)
  }function ha(Ve){
    if(!ne()||c.dragging)return;
    const st=Number(Z.has("w"))-Number(Z.has("s")),
    Me=Number(Z.has("d"))-Number(Z.has("a")),
    Re=Number(Z.has("e"))-Number(Z.has("q"));
    if(st===0&&Me===0&&Re===0)return;
    const it=Z.has("shift")?Aye:1,
    ct=Tye*it*Ve;
    bot({
        forward:st,
        strafe:Me
      },
      ct,
      r.position,
      r.quaternion,
      o.target),
    r.position.y+=Re*ct,
    o.target.y+=Re*ct;
    const At=r.position.distanceTo(o.target);
    At>0&&e.addNavProgress("pan",
      ct/At)
  }function en(Ve){
    const st=Ht=>Z.has(Ht)?1:0,
    Me=WCr(gq[n.cameraRig.peek()],
      n.cameraWeight.peek());
    let Re=st("d")-st("a"),
    it=st("w")-st("s");
    const ct=Math.hypot(Re,
      it),
    At=Z.has("shift")?eWr:1;
    ct>0&&(Re*=At/Math.max(1,
        ct),
      it*=At/Math.max(1,
        ct));
    const Dt=O.value;
    if(V.setFromQuaternion(H.quaternion),
      $=JCr($,
        {
          stickX:Re,
          stickY:it,
          rig:Me,
          panDegPerS:n.cameraPanDegPerS.peek(),
          dtS:Ve
        }),
      !QCr($)){
      const[Ht,
        Yt]=$,
      mn=Ht.value*Ve,
      Nt=qCr(V.x,
        Yt.value*Ve);
      V.y+=mn,
      V.x+=Nt,
      H.quaternion.setFromEuler(V),
      O={
        ...O,
        value:O.value+mn
      },
      W={
        ...W,
        value:W.value+Nt
      }
    }O=RU(O,
      O.value+Yrt(O.value,
        V.y,
        1),
      Me.lookEaseS,
      Ve),
    W=RU(W,
      V.x,
      Me.lookEaseS,
      Ve),
    X.set(W.value,
      O.value,
      0),
    l.quaternion.setFromEuler(X);
    const zt=l.quaternion;
    L=YCr(L,
      {
        stickX:Re,
        stickY:it,
        vertical:st("e")-st("q"),
        aim:[zt.x,
          zt.y,
          zt.z,
          zt.w],
        rig:Me,
        speedMps:n.cameraSpeedMps.peek(),
        dtS:Ve
      });
    const Zt=XCr(L);
    l.position.x+=Zt[0]*Ve,
    l.position.y+=Zt[1]*Ve,
    l.position.z+=Zt[2]*Ve,
    U=nEr(U,
      {
        rig:Me,
        turnRadPerS:Yrt(Dt,
          O.value,
          Ve),
        sidewaysMps:tEr(Zt,
          O.value),
        topMps:n.cameraSpeedMps.peek(),
        dtS:Ve
      }),
    U.value&&(X.z=U.value,
      l.quaternion.setFromEuler(X))
  }function Ye(Ve){
    const st=n.navBallVector.peek();
    if(!st||n.mode.peek()!=="edit"||n.playSession.peek()!==null||st.forward===0&&st.strafe===0)return;
    const Me=Z.has("shift")?Aye:1,
    Re=Tye*Me*Ve;
    bot(st,
      Re,
      r.position,
      r.quaternion,
      o.target)
  }return{
    applyMode:$e,
    detachGizmo:()=>c.detach(),
    gizmoHot:()=>c.dragging||c.axis!==null,
    isDraggingMesh:Ve=>c.dragging&&NOr(Ve,
      c.object??null),
    tick:Ma,
    disposeControls:()=>{
      c.dispose(),
      z.dispose()
    }
  }
}const oQ=new di;
function fWr(t,
  e){
  const n={
    
  };
  for(const[r,
      s]of Object.entries(e)){
    const a=t[r];
    a&&(oQ.position.copy(s.position),
      oQ.quaternion.copy(s.quaternion),
      oQ.scale.copy(s.scale),
      n[r]=mBe(oQ,
        a))
  }return n
}const Fje="float dotNL = saturate( dot( geometryNormal, directLight.direction ) );";
na.lights_physical_pars_fragment.includes(Fje);
na.lights_physical_pars_fragment=na.lights_physical_pars_fragment.replace(Fje,
  `${Fje}
    #ifdef SOFT_TERMINATOR
      dotNL = ( dotNL < 0.3 ? dotNL * dotNL / 0.6 : dotNL - 0.15 ) / 0.85;
    #endif`);
function oKt(t){
  t.defines={
    ...t.defines,
    SOFT_TERMINATOR:""
  }
}const mWr=.5,gWr=24,bWr=24,yWr=[64,
  32],vWr=96;
function xWr(t){
  return t==="sphere"||t==="cylinder"?t:"cube"
}function wWr(t,
  e){
  const n=new Io({
      color:e??pq,
      roughness:X_
    }),
  r=t!=="cube";
  r&&oKt(n);
  const s=new Vt(lKt(t,
      !1),
    n);
  return s.userData.softTerminator=r,
  s.userData.primitiveKind=t,
  s
}function lKt(t,
  e){
  const n=t==="sphere"?e?new Ku(.5,
    ...yWr):new Ku(.5,
    32,
    16):t==="cylinder"?new Al(.5,
    .5,
    1,
    e?vWr:gWr):new mi(1,
    1,
    1);
  return n.translate(0,
    mWr,
    0),
  n
}function _Wr(t,
  e){
  const n=t.userData.primitiveKind;
  if(!(t instanceof Vt)||!n||n==="cube")return;
  const r=Math.max(...e.map(Math.abs))>=bWr;
  r!==!!t.userData.bigPrimitive&&(t.userData.bigPrimitive=r,
    t.geometry.dispose(),
    t.geometry=lKt(n,
      r))
}const Sot=.25,kWr=.25,Tot=.22;
function SWr(t,
  e){
  for(const[n,
      r]of t)r.stopFading(),
  r.enabled=n===e
}function Oje(t){
  t.traverse(e=>{
      e instanceof RR&&e.skeleton.dispose()
    })
}function TWr(t,
  e,
  n){
  for(const r of[...t.children]){
    const s=r.userData.objectId;
    s&&n(s)&&e.add(r)
  }t.removeFromParent()
}function Cye(t,
  e,
  n,
  r){
  const s=`${e}.${n}`,
  a=t.tracks.find(l=>l.name===s);
  return a?a.createInterpolant().evaluate(r):null
}function Aot(t,
  e,
  n,
  r){
  const s=Uie(n),
  a=Cye(t,
    e,
    "position",
    r),
  o=Cye(t,
    e,
    "quaternion",
    r),
  l=Cye(t,
    e,
    "scale",
    r);
  return{
    position:a?new Ge(a[0],
      a[1],
      a[2]):s.position,
    quaternion:o?new qn(o[0],
      o[1],
      o[2],
      o[3]):s.quaternion,
    scale:l?new Ge(l[0],
      l[1],
      l[2]):s.scale
  }
}function 

/*==============================================================================
 * 9. Custom gizmo meshes Mzr (arrows/rings/planes) + Pzr + iat mouse-button map
 * source file: tmp_b/gizmo_custom_Mzr.js
 ==============================================================================*/
2,yzr=.03,tot=.115,gye=.056,vzr=.55,not=.036,bye=.006,xzr=.045,Kj=.17,wzr=.6,yye=.0075,rot=.5,_zr=.75,kzr=.35,Szr=1000010,Tzr=1e6,sKt=["X","Y","Z"],sot=["XY","YZ","XZ"],Azr=["translate","rotate","scale"],Rje={X:new $r().makeRotationZ(-Math.PI/2),Y:new $r,Z:new $r().makeRotationX(Math.PI/2)},Czr={X:new $r,Y:new $r().makeRotationZ(-Math.PI/2),Z:new $r().makeRotationY(Math.PI/2)},aot=new $r().makeRotationY(Math.PI/2),Ezr={XY:new $r,YZ:new $r().makeRotationY(Math.PI/2),XZ:new $r().makeRotationX(-Math.PI/2)},jzr={XY:[Kj,Kj,0],YZ:[0,Kj,Kj],XZ:[Kj,0,Kj]},Izr={XY:"Z",YZ:"X",XZ:"Y"},Hw=(t,e=1,n=sx)=>new tl({color:t,opacity:e,side:n,transparent:!0,depthTest:!1,depthWrite:!1,fog:!1,toneMapped:!1});function f8(t,e,n){const r=new hr(bzr);n.color.setHex=()=>n.color.copy(r);const s=new Vt(e,n);return s.name=t,s.renderOrder=Szr,s}function iot(t,e){const n=f8(t,e,Hw(Nje)),r=e.clone(),s=r.attributes.position,a=r.attributes.normal;for(let l=0;l<s.count;l++)s.setXYZ(l,s.getX(l)+a.getX(l)*bye,s.getY(l)+a.getY(l)*bye,s.getZ(l)+a.getZ(l)*bye);const o=new Vt(r,Hw(gzr,1,$p));return o.renderOrder=Tzr,n.add(o),n}const oot=t=>f8(t,new Al(Jit,Jit,Pje-eot,16).translate(0,(eot+Pje)/2,0).applyMatrix4(Rje[t]),Hw(h$[t])),lot=t=>f8(t,new Che(xzr,28).applyMatrix4(Ezr[t]).translate(...jzr[t]),Hw(h$[Izr[t]],wzr,Fc));function vye(t,e,n,r){return new cv(t,e,8,72,n*Math.PI*2).rotateY(Math.PI/2).rotateX(Math.PI/2).applyMatrix4(r)}function Mzr(){const t=[],e=[],n=[];for(const s of sKt)t.push(oot(s),f8(s,new uq(yzr,tot,24).translate(0,Pje+tot/2,0).applyMatrix4(Rje[s]),Hw(h$[s]))),n.push(oot(s),f8(s,new mi(gye,gye,gye).translate(0,vzr,0).applyMatrix4(Rje[s]),Hw(h$[s]))),e.push(f8(s,vye(rot,yye,.5,Czr[s]),Hw(h$[s])));for(const s of sot)t.push(lot(s));for(const s of sot)n.push(lot(s));t.push(iot("XYZ",new Ku(not,20,14)));const r=not*1.7;return n.push(iot("XYZ",new mi(r,r,r))),e.push(f8("E",vye(_zr,yye*.8,1,aot),Hw(Nje)),f8("XYZE",vye(rot,yye*.45,1,aot),Hw(Nje,kzr))),{translate:t,rotate:e,scale:n}}function Nzr({name:t,geometry:e}){return sKt.includes(t)?(e.computeBoundingBox(),e.boundingBox.getCenter(new Ge)[t.toLowerCase()]<-.01):!1}function Pzr(t){const{gizmo:e,picker:n}=t._giz

/*==============================================================================
 * 10. TransformControls subclass ozr (stock three, bundled)
 * source file: tmp_b/gizmo_ozr.js
 ==============================================================================*/
ozr=class extends xDe{constructor(e,n=null){super(void 0,n);const r=new pzr(this);this._root=r;const s=new fzr;this._gizmo=s,r.add(s);const a=new mzr;this._plane=a,r.add(a);const o=this;function l(w,k){let S=k;Object.defineProperty(o,w,{get:function(){return S!==void 0?S:k},set:function(T){S!==T&&(S=T,a[w]=T,s[w]=T,o.dispatchEvent({type:w+"-changed",value:T}),o.dispatchEvent(fye))}}),o[w]=k,a[w]=k,s[w]=k}l("camera",e),l("object",void 0),l("enabled",!0),l("axis",null),l("mode","translate"),l("translationSnap",null),l("rotationSnap",null),l("scaleSnap",null),l("space","world"),l("size",1),l("dragging",!1),l("showX",!0),l("showY",!0),l("showZ",!0),l("minX",-1/0),l("maxX",1/0),l("minY",-1/0),l("maxY",1/0),l("minZ",-1/0),l("maxZ",1/0);const c=new Ge,d=new Ge,u=new qn,h=new qn,f=new Ge,m=new qn,g=new Ge,b=new Ge,y=new Ge,v=0,x=new Ge;l("worldPosition",c),l("worldPositionStart",d),l("worldQuaternion",u),l("worldQuaternionStart",h),l("cameraPosition",f),l("cameraQuaternion",m),l("pointStart",g),l("pointEnd",b),l("rotationAxis",y),l("rotationAngle",v),l("eye",x),this._offset=new Ge,this._startNorm=new Ge,this._endNorm=new Ge,this._cameraScale=new Ge,this._parentPosition=new Ge,this._parentQuaternion=new qn,this._parentQuaternionInv=new qn,this._parentScale=new Ge,this._worldScaleStart=new Ge,this._worldQuaternionInv=new qn,this._worldScale=new Ge,this._positionStart=new Ge,this._quaternionStart=new qn,this._scaleStart=new Ge,this._getPointer=lzr.bind(this),this._onPointerDown=dzr.bind(this),this._onPointerHover=czr.bind(this),this._onPointerMove=uzr.bind(this),this._onPointerUp=hzr.bind(this),n!==null&&this.connect(n)}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointermove",this._onPointerHover),this.domElement.addEventListener("pointerup",this._onPointerUp),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerHover),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.style.touchAction="auto"}getHelper(){return this._root}pointerHover(e){if(this.object===void 0||this.dragging===!0)return;e!==null&&N3.setFromCamera(e,this.camera);const n=mye(this._gizmo.picker[this.mode],N3);n?this.axis=n.object.name:this.axis=null}pointerDown(e){if(!(this.object===void 0||this.dragging===!0||e!=null&&e.button!==0)&&this.axis!==null){e!==null&&N3.setFromCamera(e,this.camera);const n=mye(this._plane,N3,!0);n&&(this.object.updateMatrixWorld(),this.object.parent.updateMatrixWorld(),this._positionStart.copy(this.object.position),this._quaternionStart.copy(this.object.quaternion),this._scaleStart.copy(this.object.scale),this.object.matrixWorld.decompose(this.worldPositionStart,this.worldQuaternionStart,this._worldScaleStart),this.pointStart.copy(n.point).sub(this.worldPositionStart)),this.dragging=!0,qit.mode=this.mode,this.dispatchEvent(qit)}}pointerMove(e){const n=this.axis,r=this.mode,s=this.object;let a=this.space;if(r==="scale"?a="local":(n==="E"||n==="XYZE"||n==="XYZ")&&(a="world"),s===void 0||n===null||this.dragging===!1||e!==null&&e.button!==-1)return;e!==null&&N3.setFromCamera(e,this.camera);const o=mye(this._plane,N3,!0);if(o){if(this.pointEnd.copy(o.point).sub(this.worldPositionStart),r==="translate")this._offset.copy(this.pointEnd).sub(this.pointStart),a==="local"&&n!=="XYZ"&&this._offset.applyQuaternion(this._worldQuaternionInv),n.indexOf("X")===-1&&(this._offset.x=0),n.indexOf("Y")===-1&&(this._offset.y=0),n.indexOf("Z")===-1&&(this._offset.z=0),a==="local"&&n!=="XYZ"?this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale):this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale),s.position.copy(this._offset).add(this._positionStart),this.translationSnap&&(a==="local"&&(s.position.applyQuaternion(Sl.copy(this._quaternionStart).invert()),n.search("X")!==-1&&(s.position.x=Math.round(s.position.x/this.translationSnap)*this.translationSnap),n.search("Y")!==-1&&(s.position.y=Math.round(s.position.y/this.translationSnap)*this.translationSnap),n.search("Z")!==-1&&(s.position.z=Math.round(s.position.z/this.translationSnap)*this.translationSnap),s.position.applyQuaternion(this._quaternionStart)),a==="world"&&(s.parent&&s.position.add(bp.setFromMatrixPosition(s.parent.matrixWorld)),n.search("X")!==-1&&(s.position.x=Math.round(s.position.x/this.translationSnap)*this.translationSnap),n.search("Y")!==-1&&(s.position.y=Math.round(s.position.y/this.translationSnap)*this.translationSnap),n.search("Z")!==-1&&(s

/*==============================================================================
 * 11. Keyboard Hzr (undo/redo/copy/paste/group/Esc/Enter/Z X C/Space/Delete) + Bzr/S9r/Jqt + wheel-classify Vzr
 * source file: tmp_b/keyboard_Hzr.js
 ==============================================================================*/
do":"undo"}function Hzr(t,e){return n=>{if(!ix())return;const r=n.target;if(r&&(["INPUT","TEXTAREA"].includes(r.tagName)||r.isContentEditable)||t.playSession.peek()!==null)return;const s=Bzr(n);if(s){n.preventDefault(),s==="undo"?t.undo():t.redo();return}if(!(t.mode.peek()!=="edit"||e())){if((n.metaKey||n.ctrlKey)&&!n.shiftKey&&!n.altKey){const a=n.key.toLowerCase();if(a==="c"&&t.copySelectedObject()){n.preventDefault();return}if(a==="v"&&t.pasteObject()){n.preventDefault();return}if(a==="g"){n.preventDefault(),t.groupOrUngroup();return}}if(n.key==="Escape"){const a=t.editInteraction.peek();if(t.finishPerformancePaint(),a!=="editingPath"&&a!=="lasso")return;n.preventDefault(),a==="lasso"&&t.editInteraction.set("idle");return}if(n.key==="Enter"&&t.editInteraction.peek()==="editingPath"){t.finishPerformancePaint();return}if(!n.metaKey&&!n.ctrlKey&&!n.altKey){const a=S9r(t.controlMode.peek(),n.key);if(a){t.setTransformMode(a);return}}switch(n.key.toLowerCase()){case" ":n.preventDefault(),t.togglePreview();break;case"delete":case"backspace":{const a=t.performancePaint.peek();t.editInteraction.peek()==="editingPath"&&a?.selectedAnchor!=null?t.deletePathAnchor(a.selectedAnchor):t.deleteFocused();break}}}}}function $zr(t){if(t.deltaX)return!1;const e=t.wheelDeltaY;return e?e%120===0:!1}function Vzr(t,e){return t.ctrlKey||t.deltaMode!==0||$zr(t)||e==="mouse"?"zoom":"nav"}const jw=67,zie=12,wye=.12,fot=1,Uzr=.6;function iKt(t,e){return t==="edit"&&!e}const mot={forward:0,strafe:0};function zzr(t,e,n){if(n<=0)return mot;const r=t/n,s=-e/n,a=Math.hypot(r,s);if(a<=wye)return mot;const c=(Math.min(a,1)-wye)/(1-wye)/a;return{forward:s*c,strafe:r*c}}const _ye=new Ge,got=new Ge,kye=new Ge,Wzr=new Ge(0,1,0);function bot(t,e,n,r,s){_ye.set(0,0,-1).applyQuaternion(r),got.crossVectors(_ye,Wzr).normalize(),kye.set(0,0,0).addScaledVector(_ye,t.forward*e).addScaledVector(got,t.strafe*e),n.add(kye),s.add(kye)}const o9=new Ge,yot=new qn,Gzr=new Ge(1,0,0),qzr=new Ge(0,1,0),Zzr=new Ge(0,0,1),iQ=new qn;function Kzr(t,e,n,r){r.identity(),yot.copy(e).invert(),o9.copy(t).applyQuaternion(yot);const s=-o9.z,a=o9.x;return s!==0&&(iQ.setFromAxisAngle(Gzr,-s/n),r.premultiply(iQ)),a!==0&&(iQ.setFromAxisAngle(Zzr,-a/n),r.premultiply(iQ)),r}function Xzr(t,e){return e.setFromAxisAngle(qzr,t*Uzr)}function vot(t){return o9.set(0,0,-1).applyQuaternion(t),Math.atan2(-o9.x,-o9.z)}const Yzr=1.6,Qzr=.4,Sye=8,Tye=4,Aye=3,Jzr=.12,eWr=.4,tWr=.35,xot=.0022,nWr=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><ellipse cx="13" cy="9" rx="8" ry="5.5"/><path d="M13 14.5 C12 19 9 21 6 24"/></g><g fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round"><ellipse cx="13" cy="9" rx="8" ry="5.5"/><path d="M13 14.5 C12 19 9 21 6 24"/></g></svg>')}") 6 24, crosshair`,rWr=.0016,wot=.0036,_ot=.5;function sWr(t){return!t.pointerLocked&&!t.consumed}const aWr=new Ge,iWr=new Ge,oWr=new qn,lWr=new Ge,cWr=new qn,dWr=new va(0,0,0,"XYZ"),kot=.01,uWr=350,hWr=14;function pWr(t,e){const{a:n,camera:r,renderer:s,meshById:a}=t,{orbit:o,pilot:l}=e,c=new ozr(r,s.domElement);Pzr(c);c

/*==============================================================================
 * 12. SELECTION SYSTEM pGr — ground footprint rounded-box shader cGr/dGr + screen-bbox + stroke mask hGr
 * source file: tmp_b/sel_pGr_full.js
 ==============================================================================*/
);
    if (a <= 0.001) discard;
    gl_FragColor = vec4(mix(uFill, uLine, clamp(white + wash, 0.0, 1.0)), a);
    #include <colorspace_fragment>
  }`,uGr=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`,hGr=`
  varying vec2 vUv;
  uniform sampler2D tMask;
  uniform vec2 uTexel;
  uniform float uWidth;
  float ringMax(float r) {
    float m = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) / 8.0 * 6.2831853;
      m = max(m, textureLod(tMask, vUv + vec2(cos(a), sin(a)) * r * uTexel, 0.0).r);
    }
    return m;
  }
  void main() {
    // Most of the frame is nowhere near the mask, and a coarse mip says so in one read.
    if (textureLod(tMask, vUv, 4.0).r == 0.0) discard;
    float inside = textureLod(tMask, vUv, 0.0).r;
    if (inside >= 0.999) discard;
    float s = max(ringMax(uWidth), ringMax(uWidth * 0.5)) * (1.0 - inside);
    float h = 0.26 * ringMax(uWidth + 2.0) * (1.0 - inside) * (1.0 - s);
    float a = s + h;
    if (a <= 0.002) discard;
    gl_FragColor = vec4(mix(vec3(0.09, 0.11, 0.18), vec3(1.0), s / max(a, 1e-3)), a);
  }`,cQ=2;function pGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t,l=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,c=new Mi(2,2),d=new Map,u=()=>{const P=new Vt(c,new rl({uniforms:{uHalf:{value:new On},uExtent:{value:new On},uRadius:{value:1},uPx:{value:.01},uT:{value:2},uReach:{value:1},uFade:{value:1},uFill:{value:rGr},uLine:{value:sGr}},vertexShader:cGr,fragmentShader:dGr,transparent:!0,depthWrite:!1,fog:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));P.rotation.order="YXZ",P.frustumCulled=!1,r.add(P);const F=performance.now();return{mesh:P,foot:null,selectedAtMs:F,lastSelectedMs:F}},h=(P,F)=>{r.remove(F.mesh),F.mesh.material.dispose(),d.delete(P)};t.planningAids.push(function*(){for(const P of d.values())yield P.mesh});const f=(P,F,B,H,z)=>{const L=P.mesh.material.uniforms;ec.set(F.x,F.y,F.z);const $=ec.distanceTo(H.position)*2*Math.tan(H.fov*Math.PI/360)/Math.max(1,z),O=Math.min(F.halfX,F.halfZ),W=Math.max(O*YWr,XWr*$),U=F.halfX+W,V=F.halfZ+W,G=Math.max(O*tGr,eGr*$),Z=G+nGr*$;L.uHalf.value.set(U,V),L.uExtent.value.set(U+Z,V+Z),L.uRadius.value=Math.min(Math.min(U,V)*JWr,Math.max(W*1.6,QWr*$)),L.uPx.value=$,L.uReach.value=G;const se=B-P.selectedAtMs;L.uT.value=l?2:se/qWr,L.uFade.value=l?1:Math.min(1,se/KWr),P.mesh.position.set(F.x,F.y+$*.6,F.z),P.mesh.rotation.set(-Math.PI/2,F.yaw,0),P.mesh.scale.set(U+Z,V+Z,1)},m=(P,F)=>{const B=a.domElement;let H=1/0,z=-1/0,L=1/0,$=-1/0;const O=()=>{if(ec.project(s),ec.z>1)return;const U=(ec.x*.5+.5)*B.clientWidth,V=(-ec.y*.5+.5)*B.clientHeight;H=Math.min(H,U),z=Math.max(z,U),L=Math.min(L,V),$=Math.max($,V)};if(P.forEach((U,V)=>{const G=F[V];if(!G){const X=o.get(U);X&&(X.getWorldPosition(ec),O());return}const Z=Math.cos(G.yaw),se=Math.sin(G.yaw);for(let X=0;X<8;X++){const te=(X&1?1:-1)*G.halfX,ne=(X&2?1:-1)*G.halfZ;ec.set(G.x+Z*te+se*ne,X&4?G.top:G.y,G.z-se*te+Z*ne),O()}}),H===1/0)return null;let W=0;ec.set(0,0,0);for(const U of P){const V=o.get(U);V&&(ec.add(V.getWorldPosition(iGr)),W++)}if(ec.divideScalar(Math.max(1,W)).project(s),W>0&&ec.z<=1){const U=(ec.x*.5+.5)*B.clientWidth,V=(-ec.y*.5+.5)*B.clientHeight,G=B.clientHeight*GWr;H=Math.min(H,U-G),z=Math.max(z,U+G),L=Math.min(L,V-G),$=Math.max($,V+G)}return{left:Math.round(H),right:Math.round(z),top:Math.round(L),bottom:Math.round($)}},g=P=>{const F=n.selectionScreenBounds.peek();P===F||P&&F&&P.left===F.left&&P.right===F.right&&P.top===F.top&&P.bottom===F.bottom||n.selectionScreenBounds.set(P)},b=()=>{const P=e.isEditView()?n.selectedIds.peek().slice(0,WWr):[],F=performance.now();for(const[H,z]of d)P.includes(H)?z.lastSelectedMs=F:F-z.lastSelectedMs>ZWr?h(H,z):(z.foot=null,z.mesh.visible=!1);const B=[];for(const H of P){const z=o.get(H),L=z?lGr(z):null;B.push(L);let $=d.get(H);if(!L){$&&($.foot=null,$.mesh.visible=!1);continue}$||($=u(),d.set(H,$)),$.foot=L,$.mesh.visible=!0,f($,L,F,s,a.domElement.clientHeight)}g(m(P,B))},y=new tl({color:16777215,fog:!1,side:Fc}),v=new Map,x=new rl({uniforms:{tMask:{value:null},uTexel:{value:new On},uWidth:{value:1}},vertexShader:uGr,fragmentShader:hGr,transparent:!0,depthTest:!1,depthWrite:!1}),w=new Kh,k=new Vt(c,x);k.frustumCulled=!1,w.add(k);const S=new Ahe,T=new On,A=new hr,C=(P,F,B)=>{let H=v.get(P);if(!e.strokeEnabled()){H?.target?.dispose(),v.delete(P);return}const z=[];for(const X of B){const te=o.get(X);te&&aGr(te,ne=>z.push(ne))}if(z.length===0)return;P.getDrawingBufferSize(T);const L=Math.min(1,VWr/T.y),$=Math.ceil(T.x*L/lQ)*lQ,O=Math.ceil(T.y*L/lQ)*lQ;H||(H={target:null,shouldRealloc:dKt(zWr,()=>performance.now())},v.set(P,H));const W=H.shouldRealloc($,O,H.target!==null);(!H.target||W&&(H.target.width!==$||H.target.height!==O))&&(H.target?.dispose(),H.target=new Wh($,O,{samples:UWr,depthBuffer:!1,generateMipmaps:!0,minFilter:wv}));const U=H.target;for(const X of z)X.layers.enable(cQ);r.traverse(X=>{X instanceof yS&&X.layers.enable(cQ)});const{fog:V}=r,{autoClear:G}=P,Z=P.getClearAlpha(),se=F.layers.mask;P.getClearColor(A),r.fog=null,r.overrideMaterial=y,F.layers.set(cQ);try{P.setRenderTarget(U),P.setClearColor(0,0),P.autoClear=!0,P.render(r,F);const X=x.uniforms;X.tMask.value=U.texture,X.uTexel.value.set(1/U.width,1/U.height),X.uWidth.value=$Wr*P.getPixelRatio()*(U.height/T.y),P.setRenderTarget(null),P.setClearColor(A,Z),P.autoClear=!1,P.render(w,S)}finally{F.layers.mask=se,r.overrideMaterial=null,r.fog=V,P.setRenderTarget(null),P.setClearColor(A,Z),P.autoClear=G;for(const X of z)X.layers.disable(cQ)}},E=()=>{if(!e.isEditView())return;const P=[...n.selectedIds.peek()],F=e.hoveredId();F&&!P.includes(F)&&P.push(F),C(a,s,P)},j=(P,F)=>{e.isEditView()&&C(P,F,n.selectedIds.peek())},I=P=>{v.get(P)?.target?.dispose(),v.delete(P)},N=(P,F)=>{const B=performance.now(),H=[];for(const z of d.values())z.foot&&(f(z,z.foot,B,P,F),z.mesh.visible=!0,H.push(z.mesh));return()=>{for(const z of H)z.visible=!1}};return t.disposers.push(()=>{for(const[P,F]of d)h(P,F);c.dispose(),y.dispose(),x.dispose();for(const{target:P}of v.values())P?.dispose()}),{tick:b,drawStroke:E,strokeSelection:j,forgetStroke:I,showSelectionRings:N}}const fGr="<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='9' cy='9' r='5' fill='white' stroke='%23141824' stroke-opacity='.6'/></svg>",mGr=`url("data:image/svg+xml,${fGr}") 9 9, default`,gGr="none",bGr=20,yGr=.78,vGr=90,xGr=5,wGr=70,jot=900,_Gr=2,kGr=33,SGr=`
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,TGr=`
  varying vec2 vP;
  uniform float uBig;
  void main() {
    float r = length(vP), aa = fwidth(r);
    float R = mix(0.62, 0.86, uBig);
    float ring = 1.0 - smoothstep(0.045 - aa, 0.045 + aa, abs(r - R));
    float halo = 1.0 - smoothstep(0.10 - aa, 0.10 + aa, abs(r - R));
    float dot_ = 1.0 - smoothstep(0.13 - aa, 0.13 + aa, r);
    float dotHalo = 1.0 - smoothstep(0.2 - aa, 0.2 + aa, r);
    float w = max(ring, dot_);
    float s = 0.3 * max(halo, dotHalo) * (1.0 - w);
    float a = w + s + 0.1 * (1.0 - smoothstep(R - aa, R + aa, r)) * (1.0 - w - s);
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(vec3(0.09, 0.11, 0.18), vec3(1.0), w + 0.1 * (1.0 - s)), a);
  }`,AGr=`
  varying vec2 vP;
  uniform float uT;
  void main() {
    float e = 1.0 - pow(1.0 - uT, 3.0), r = length(vP), aa = fwidth(r);
    float a = (1.0 - smoothstep(0.02 - aa, 0.02 + aa, abs(r - e * 0.94))) * pow(1.0 - uT, 1.5);
    if (a < 0.003) discard;
    gl_FragColor = vec4(vec3(1.0), a);
  }`,Iot=new Ge(0,0,1);function Mot(t,e){const n=new Vt(new Mi(2,2),new rl({uniforms:e,vertexShader:SGr,fragmentShader:t,transparent:!0,depthTest:!1,depthWrite:!1,side:Fc}));return n.visible=!1,n.frustumCulled=!1,n}function CGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t,l=a.domElement,c=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,d=Mot(TGr,{uBig:{value:0}}),u=Mot(AGr,{uT:{value:2}});r.add(d,u),t.planningAids.push(()=>[d,u]);const h=new Bv,f=new On,m=new Ge,g=new Ge;let b=!1,y=null;const v={x:0,y:0,inside:!1,stale:!1,touch:!1};let x=null,w=!1,k=0,S=-1/0,T="",A=performance.now();const C=new $r;let E=-1/0,j=0;const I=W=>W.distanceTo(s.position)*2*Math.tan(s.fov*Math.PI/360)/Math.max(1,l.clientHeight),N=(W,U)=>(W.face?U.copy(W.face.normal).transformDirection(W.object.matrixWorld):s.getWorldDirection(U).negate(),U),P=()=>{const W=l.getBoundingClientRect();f.set((v.x-W.left)/W.width*2-1,-((v.y-W.top)/W.height)*2+1),h.setFromCamera(f,s);const U=h.intersectObjects([...o.values()],!0)[0],V=h.intersectObject(e.floor,!1)[0],G=U&&(!V||U.distance<=V.distance)?U:V;if(b=!!G,G&&(m.copy(G.point),N(G,g)),y=null,G===U&&U){let Z=U.object;for(;Z&&Z.userData.objectId===void 0;)Z=Z.parent;const se=Z?.userData.objectId;se&&(y=JEe(n.objects.peek(),se,n.selectedId.peek()))}},F=()=>{const W=performance.now(),U=W-A;A=W;const V=e.isEditView()&&n.editInteraction.peek()==="idle"&&!n.draggingAction.peek()&&!n.draggingComponent.peek(),G=V&&v.inside&&!v.touch,Z=e.gizmoHot();(!C.equals(s.matrixWorld)||n.isPreviewPlaying.peek()||n.isPerformancePlaying.peek())&&(C.copy(s.matrixWorld),v.stale=!0),!G||Z||w?(b=!1,y=null):v.stale&&(j<_Gr||W-E>=kGr)&&(v.stale=!1,P(),E=W,j=performance.now()-W),k+=((y?1:0)-k)*Math.min(1,U/vGr),d.visible=G&&b,d.visible&&(d.position.copy(m),d.quaternion.setFromUnitVectors(Iot,g),d.scale.setScalar(bGr*I(m)*(x?yGr:1)),d.material.uniforms.uBig.value=k);const se=!V||v.touch?"":d.visible?gGr:mGr;l.style.cursor!==se&&(l.style.cursor===T||l.style.cursor==="")&&(l.style.cursor=se,T=se),u.visible=!c&&W-S<jot,u.visible&&(u.material.uniforms.uT.value=(W-S)/jot)},B=W=>{u.position.copy(W.point),u.quaternion.setFromUnitVectors(Iot,N(W,new Ge)),u.scale.setScalar(wGr*I(W.point)),S=performance.now()},H=W=>{v.x=W.clientX,v.y=W.clientY,v.inside=!0,v.touch=W.pointerType==="touch",v.stale=!0,x&&Math.hypot(W.clientX-x.x,W.clientY-x.y)>xGr&&(w=!0)},z=W=>{v.touch=W.pointerType==="touch",x={x:W.clientX,y:W.clientY}},L=()=>{x=null,w=!1,v.stale=!0},$=()=>{v.inside=!1},O=()=>{v.stale=!0};return l.addEventListener("pointermove",H),l.addEventListener("pointerdown",z),l.addEventListener("pointerleave",$),l.addEventListener("wheel",O,{passive:!0}),window.addEventListener("pointerup",L),window.addEventListener("pointercancel",L),t.disposers.push(n.objects.onChange(()=>{v.stale=!0})),t.disposers.push(()=>{l.removeEventListener("pointermove",H),l.removeEventListener("pointerdown",z),l.removeEventListener("pointerleave",$),l.removeEventListener("wheel",O),window.removeEventListener("pointerup",L),window.removeEventListener("pointercancel",L);for(const W of[d,u])r.remove(W),W.geometry.dispose(),W.material.dispose()}),{tick:F,rippleAt:B,hoveredId:()=>y}}const EGr=Math.PI/180;function jGr(t,e){const{a:n,meshById:r}=t;let s={tracks:[],durationS:0},a=!0;function o(){s=rx(n.show.peek())}o(),t.disposers.push(qt(()=>{n.show.get(),o(),a=!0}));let l=null,c=null,d=null,u=0,h=null,f=0,m=null,g=!1;function b(ve){for(const ke of s.tracks){const Ae=ke.items.find(Se=>Se.item.id===ve.itemId);if(Ae)return Ae.startS}return 0}t.disposers.push(qt(()=>{const ve=n.playSession.get()?.recording??!1;ve&&h===null?(h=0,f=b(n.playSession.peek()),m=null):ve||(h=null)})),t.disposers.push(qt(()=>{const ve=n.isPerformancePlaying.get();d=ve?n.performanceSeekS.peek()??0:null,ve&&(u=s.durationS)}));function y(){return h!==null?f+h:l!==null?l:d!==null?d:n.performanceSeekS.peek()??0}const v=new Bv;v.camera=t.camera;const x=new Ge(0,-1,0),w=new Ge;function k(ve,ke,Ae){v.set(w.set(ve,ke,Ae),x);const Se=v.intersectObjects(e.walkableSurfaces(),!0)[0];return Se?Se.point.y:null}const S={x:new Ge(1,0,0),y:new Ge(0,1,0),z:new Ge(0,0,1)},T=new Ge,A=new qn,C=new Ge,E=new va,j=new va,I=new qn,N=new Ge,P=new Ge,F=new Ge,B=new qn,H=new va;function z(ve){const ke=n.objects.peek(),Ae=ve?ke[ve]:void 0;if(Ae){const me=Zo(Ae,ke).position;P.set(me[0],me[1],me[2])}else P.set(0,0,0);const Se=ve?r.get(ve):void 0;Se?Se.getWorldPosition(N):N.copy(P)}function L(ve){const ke=n.objects.peek(),Ae=new Map;for(const Se of s.tracks){const me=ke[Se.characterId];if(!me||!Q0(me.kind))continue;const Te=q(Se,ve);Te&&Ae.set(Se.characterId,Te);const Le=r.get(Se.characterId);if(!Le||e.isMeshDragged(Le))continue;me.kind==="simple_figure"&&o$(Le,Kae(Se.items.map(tt=>tt.item),ve,me.headRotation,tt=>J(me,Se,tt))),T.set(me.position[0],me.position[1],me.position[2]),E.set(me.rotation[0],me.rotation[1],me.rotation[2]),A.setFromEuler(E),C.set(me.scale[0],me.scale[1],me.scale[2]);const Fe=Q(Se,ve,!el(me.kind));Fe!=="base"&&(Le.scale.copy(C),Fe!=="walk"&&(j.setFromQuaternion(A),Le.position.copy(T),Le.rotation.set(...GA([j.x,j.y,j.z],[E.x,E.y,E.z]))))}for(const[Se,{target:me,sinceS:Te}]of ce){const Le=ke[Se],Fe=r.get(Se);if(!Le||!Fe||e.isMeshDragged(Fe))continue;Fe.updateWorldMatrix(!0,!1),Fe.getWorldPosition(be),fe.set(0,0,-1).applyQuaternion(Fe.getWorldQuaternion(we));const tt=xM(Math.atan2(-fe.x,-fe.z),xe(Le,be.x,be.y,be.z),me);if(Le.kind==="humanoid"){Se!==e.rigPoseObjectId()&&Ae.set(Se,IZt(Ae.get(Se)??{},jZt(tt)));continue}const Oe=s.tracks.find($e=>$e.characterId===Se);if(!Oe)continue;const Je={sinceS:Te,headRotation:kje(tt)};o$(Fe,Kae(Oe.items.map($e=>$e.item),ve,Le.headRotation,$e=>$e===ve?Je:J(Le,Oe,$e)))}e.setRigOffsets(Ae)}const $=new Ge,O=new Ge,W=new va,U=new qn;let V=!1;const G=new Ge,Z=new qn,se=new va,X=new Ge;function te(ve,ke){if(!ve)return null;if(!V){V=!0,G.copy(T),Z.copy(A),se.copy(E),X.copy(C);try{const me=le(ve,ke);if(me)return me.position}finally{T.copy(G),A.copy(Z),E.copy(se),C.copy(X),V=!1}}const Ae=r.get(ve);if(Ae)return Ae.getWorldPosition(O),[O.x,O.y,O.z];const Se=n.objects.peek()[ve];return Se?[...Se.position]:null}function ne(ve,ke,Ae,Se){const me=n.objects.peek()[Se],Te=!!me&&el(me.kind)&&ve.aim==="subject"&&!!ve.subjectId,Le=me?.kind==="spotlight";let Fe=Te?null:te(ve.subjectId,Ae);if(Le&&Fe){const He=NP(ve.subjectId,n.objects.peek(),NIr);Fe=[Fe[0],Fe[1]+He,Fe[2]]}const tt=q2r(Te?{...ve,aim:"travel"}:ve,ke,Fe);if(Te&&tt.yawRad!==null){const He=Ee({subjectId:ve.subjectId,atS:Ae});He&&(tt.yawRad=xM(tt.yawRad,xe(me,...tt.position),He).bodyYawRad)}const Oe=r.get(Se),Je=Oe?.parent&&Oe.parent!==t.scene?Oe.parent:null;$.set(...tt.position),Je&&Je.worldToLocal($),T.copy($);let $e=0;Je&&(Je.getWorldQuaternion(U),W.setFromQuaternion(U,"YXZ"),$e=W.y);const Ue=Le?W.setFromQuaternion(A,"YXZ"):null,et=Z2r(tt,$e,Ue&&[Ue.x,Ue.y,Ue.z]);et&&(W.set(...et,"YXZ"),A.setFromEuler(W))}function Q(ve,ke,Ae){let Se="base";for(const me of ve.items){const{item:Te}=me;if(Te.kind==="play"&&!Ae){if(Te.samples.length===0)continue;if(ke<me.startS||(Se="walk",ke<me.endS))break;continue}if(Te.kind==="path"){if(Te.anchors.length<2)continue;if(ke<me.startS||(Se=Ae?"fold":"walk",ne(Te,Math.min(ke-me.startS,me.endS-me.startS),Math.min(ke,me.endS),ve.characterId),ke<me.endS))break;continue}if(!aN(Te)||Te.kind==="rig-transform")continue;if(ke<me.startS)break;Se="fold";const Le=Math.min(ke-me.startS,Te.durationS);if(Te.kind==="rotate")I.setFromAxisAngle(S[Te.axis],Te.degPerS*Le*EGr),A.multiply(I);else if(Te.kind==="scale")C.multiplyScalar(v2r(Te.factor,Le,Te.durationS));else if(Te.kind==="revolve"){z(Te.centerObjectId);const Fe=x2r([T.x-P.x,T.y-P.y,T.z-P.z],Te.degPerS*Le);T.set(N.x+Fe[0],N.y+Fe[1],N.z+Fe[2])}else if(Te.kind==="transform"){const Fe=Bzt(Te.keys,Le);Fe&&(T.set(Fe.position[0],Fe.position[1],Fe.position[2]),E.set(Fe.rotation[0],Fe.rotation[1],Fe.rotation[2]),A.setFromEuler(E),C.set(Fe.scale[0],Fe.scale[1],Fe.scale[2]))}if(ke<me.endS)break}return Se}function q(ve,ke){let Ae=null;for(const Se of ve.items){const{item:me}=Se;if(ke<Se.startS)break;if(me.kind==="rig-transform"){const Te=Math.min(ke-Se.startS,me.durationS);Ae=Vzt(me.keys,Te)??Ae}if(ke<Se.endS)break}return Ae}const Y=ve=>[ve.x,ve.y,ve.z,ve.w],re=new Ge,ae=new qn,ie=new Ge,ge=new va,pe=new $r,ce=new Map,be=new Ge,fe=new Ge,we=new qn;function Ee(ve){const ke=te(ve.subjectId,ve.atS);if(!ke)return null;const Ae=NP(ve.subjectId,n.objects.peek());return[ke[0],ke[1]+Ae,ke[2]]}const xe=(ve,ke,Ae,Se)=>[ke,Ae+CZt*ve.scale[1],Se];function J(ve,ke,Ae){const Se=eEe(ke,Ae).lookAt,me=Se&&Ee(Se),Te=me&&le(ke.characterId,Ae);if(!Te)return null;fe.set(0,0,-1).applyQuaternion(we.fromArray(Te.quaternion));const Le=xM(Math.atan2(-fe.x,-fe.z),xe(ve,...Te.position),me);return{sinceS:Se.sinceS,headRotation:kje(Le)}}function le(ve,ke){const Ae=n.objects.peek()[ve];if(!Ae)return null;T.set(Ae.position[0],Ae.position[1],Ae.position[2]),E.set(Ae.rotation[0],Ae.rotation[1],Ae.rotation[2]),A.setFromEuler(E),C.set(Ae.scale[0],Ae.scale[1],Ae.scale[2]);const Se=s.tracks.find(tt=>tt.characterId===ve),me=Se?Q(Se,ke,!el(Ae.kind)):"base";re.copy(T),ae.copy(A);const Te=Se?eEe(Se,ke):null,Le=el(Ae.kind)&&me!=="fold"?Te?.position:null;if(Le){const tt=Te.exactY?Le[1]:k(Le[0],Le[1]+Bne,Le[2])??Le[1],Oe=ztt(Te),Je=Oe&&!Oe.exact&&Te.lookAt?Ee(Te.lookAt):null,$e=Oe&&Je?xM(Oe.yawRad,xe(Ae,Le[0],tt,Le[2]),Je).bodyYawRad:Oe?.yawRad;return $e!==void 0&&ae.setFromEuler(ge.set(0,$e,0)),{position:[Le[0],tt,Le[2]],quaternion:Y(ae)}}const Fe=r.get(ve);return Fe?.parent&&Fe.parent!==t.scene&&(pe.compose(re,ae,ie.copy(C)),pe.premultiply(Fe.parent.matrixWorld),pe.decompose(re,ae,ie)),{position:[re.x,re.y,re.z],quaternion:Y(ae)}}function ue(ve,ke){const Ae=n.objects.peek();ce.clear();const Se=m===null||ve<m;m=ve;const me=e.livePlay(),Te=new Map;for(const Le of tyr(s,ve)){if(me?.characterId===Le.characterId)continue;const Fe=r.get(Le.characterId),tt=Ae[Le.characterId];if(!Fe||!tt||!el(tt.kind)||(tt.kind==="humanoid"&&Te.set(Le.characterId,{clip:Le.clip,timeS:Le.clipTimeS}),e.isMeshDragged(Fe)))continue;const Oe=Le.position;if(!Oe)continue;const Je=Fe.getWorldPosition(F).y;let $e;if(Le.exactY)$e=Oe[1];else if(Se)$e=k(Oe[0],Oe[1]+Bne,Oe[2])??Oe[1];else{const He=k(Oe[0],Je+Bne,Oe[2]);if(He===null)$e=Je;else{const qe=zzt(Je,He,Xae);$e=Je+(qe-Je)*(1-Math.exp(-ke/Uzt))}}let Ue=0;Fe.parent&&Fe.parent!==t.scene?(F.set(Oe[0],$e,Oe[2]),Fe.parent.worldToLocal(F),Fe.position.copy(F),Fe.parent.getWorldQuaternion(B),H.setFromQuaternion(B,"YXZ"),Ue=H.y):Fe.position.set(Oe[0],$e,Oe[2]);const et=ztt(Le);if(et?.exact)Fe.rotation.set(0,et.yawRad-Ue,0);else if(et){const He=Le.lookAt?Ee(Le.lookAt):null,qe=xe(tt,Oe[0],$e,Oe[2]),We=(He?xM(et.yawRad,qe,He).bodyYawRad:et.yawRad)-Ue;F.set(0,0,-1).applyQuaternion(Fe.quaternion);const dt=Math.atan2(-F.x,-F.z),mt=Wzt(dt,We,g?Math.PI:A2r*ke);Fe.rotation.set(0,mt,0),He&&ce.set(Le.characterId,{target:He,sinceS:Le.lookAt.sinceS})}else Se&&Fe.rotation.set(tt.rotation[0],tt.rotation[1],tt.rotation[2])}me&&Te.set(me.characterId,{clip:me.clip,timeS:null}),e.setPlaybackClips(Te),L(ve)}let oe=!1;function ye(){const ve=n.objects.peek(),ke=e.livePlay(),Ae=new Map;for(const[Se,me]of r){const Te=ve[Se];if(!(!Te||!Q0(Te.kind))){if(ke?.characterId===Se){Ae.set(Se,{clip:ke.clip,timeS:null});continue}e.isMeshDragged(me)||(me.position.set(Te.position[0],Te.position[1],Te.position[2]),me.rotation.set(Te.rotation[0],Te.rotation[1],Te.rotation[2]),me.scale.set(Te.scale[0],Te.scale[1],Te.scale[2]),Te.kind==="simple_figure"&&o$(me,Te.headRotation))}}m=null,e.setPlaybackClips(Ae)}const je={objectPoseAt:le,resetPerformersToStart:()=>{m=null,ue(0,0),oe=!0},startManualClock:ve=>{const ke=s.durationS,Ae=She(n.show.peek(),ke),Se=ve?.fromS??(ve?.bounded?Ae.fromS:0);return l=Se,n.performanceTimeS.set(Se),m=null,c=ve?.bounded&&ke>.05?Ae.toS:null,Se},stopManualClock:()=>{l=null,c=null},tick:ve=>{let ke=!1;if(l!==null&&(l+=ve,c!==null&&l>=c&&(l=c,c=null,ke=!0)),h!==null&&(h+=ve),d!==null&&(d+=ve,d>=u&&(n.stopPerformance(),n.isPreviewPlaying.set(!1))),l!==null||h!==null||d!==null||n.performanceSeekS.peek()!==null){const Se=y();n.performanceTimeS.set(Se),ue(Se,ve),oe=!0}else{n.performanceTimeS.set(0);const Se=new Map;for(const Te of s.tracks){const Le=q(Te,0);Le&&Se.set(Te.characterId,Le)}e.setRigOffsets(Se);const me=e.livePlay();(oe||me)&&(ye(),oe=me!==null)}a=!1,ke&&n.autoStopRecording()},poseNow:()=>{const ve=a||y()!==m;ve&&(m=null),g=ve;try{je.tick(0)}finally{g=!1}return ve}};return je}const IGr={position:"absolute",display:"none",pointerEvents:"none",zIndex:"1",border:"1px solid rgba(255,255,255,0.4)",boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)"};function MGr(t){const e=document.createElement("div");return Object.assign(e.style,IGr),t.appendChild(e),{show:n=>{e.style.display="block",e.style.left=`${n.left*100}%`,e.style.top=`${n.top*100}%`,e.style.width=`${n.width*100}%`,e.style.height=`${n.height*100}%`},hide:()=>{e.style.display="none"},dispose:()=>e.remove()}}const Not=11163135,NGr=16777215,Pot=6741503,PGr=.06,Rot=16763989,RGr=.075,FGr=.25,Fot=.09,xL=.02,OGr=.35,LGr=.6,DGr=3,BGr=new Ge,HGr=new Ge,$Gr=new Ge,VGr=new Ge;function 

/*==============================================================================
 * 13. Finish composer hKt — SSAO (DWr/BWr) + crease edges + fog (HWr fragment) [NEW HWr]
 * source file: tmp_b/sel_composer_consts.js
 ==============================================================================*/
.y*.5+.5)*u.height)}:null,f=e.onboardHighlightScreenPos.peek();(f===null!=(h===null)||f&&h&&(f.x!==h.x||f.y!==h.y))&&e.onboardHighlightScreenPos.set(h)};return t.disposers.push(()=>e.onboardHighlightScreenPos.set(null)),{tick:o}}const EWr=540,jWr=.5,Lje=.05,IWr=12,MWr=new hr(6449804),NWr=new hr(.1,.11,.16),PWr=.15,cKt=4,RWr=150,FWr=.05;function dKt(t,e){let n=0,r=0,s=-1/0;return(a,o,l)=>((a!==n||o!==r)&&(n=a,r=o,s=e()),!l||e()-s>=t)}function OWr(t,e){const n=Math.min(jWr,EWr/e);return[Math.max(1,Math.round(t*n)),Math.max(1,Math.round(e*n))]}const LWr=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,uKt=`
  uniform sampler2D tDepth;
  uniform mat4 invProjection;
  vec3 viewPosition(vec2 uv) {
    float depth = texture2D(tDepth, uv).r;
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = invProjection * clip;
    return view.xyz / view.w;
  }
`,DWr=`
  varying vec2 vUv;
  ${uKt}
  uniform vec2 texel;
  uniform vec2 radiusUv;
  const float RADIUS = ${Lje.toFixed(3)};
  const int SAMPLES = ${IWr};
  const float GOLDEN_ANGLE = 2.39996323;
  // Below this, a sample is the surface's own curve, not something occluding it.
  const float SELF_BIAS = 0.2;

  float interleavedNoise(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }

  void main() {
    if (texture2D(tDepth, vUv).r >= 1.0) {
      gl_FragColor = vec4(1.0);
      return;
    }
    vec3 p = viewPosition(vUv);
    // Of the two neighbours on each axis, the nearer: the far one may be across an edge.
    vec3 left = p - viewPosition(vUv - vec2(texel.x, 0.0));
    vec3 right = viewPosition(vUv + vec2(texel.x, 0.0)) - p;
    vec3 down = p - viewPosition(vUv - vec2(0.0, texel.y));
    vec3 up = viewPosition(vUv + vec2(0.0, texel.y)) - p;
    vec3 normal = normalize(cross(
      dot(left, left) < dot(right, right) ? left : right,
      dot(down, down) < dot(up, up) ? down : up
    ));
    float reach = RADIUS * -p.z;
    float reachSquared = reach * reach;
    float angle = interleavedNoise(gl_FragCoord.xy) * 6.2831853;
    float occlusion = 0.0;
    for (int i = 0; i < SAMPLES; i++) {
      float along = (float(i) + 0.5) / float(SAMPLES);
      float a = float(i) * GOLDEN_ANGLE + angle;
      vec3 toSample = viewPosition(vUv + vec2(cos(a), sin(a)) * sqrt(along) * radiusUv) - p;
      float distanceSquared = dot(toSample, toSample);
      float falloff = clamp(1.0 - distanceSquared / reachSquared, 0.0, 1.0);
      occlusion += falloff * max(0.0, dot(toSample, normal) / sqrt(distanceSquared + 1e-6) - SELF_BIAS);
    }
    gl_FragColor = vec4(vec3(clamp(1.0 - 2.0 * occlusion / float(SAMPLES), 0.0, 1.0)), 1.0);
  }
`,BWr=`
  varying vec2 vUv;
  ${uKt}
  uniform sampler2D tOcclusion;
  uniform vec2 direction;
  void main() {
    float depth0 = -viewPosition(vUv).z;
    float sum = texture2D(tOcclusion, vUv).r;
    float weight = 1.0;
    for (int i = 1; i <= 3; i++) {
      float gaussian = exp(-float(i * i) / 5.0);
      for (int side = -1; side <= 1; side += 2) {
        vec2 uv = vUv + direction * float(i * side);
        // Never across a depth edge, or occlusion bleeds onto what is behind.
        float w = gaussian * max(0.0, 1.0 - abs(-viewPosition(uv).z - depth0) / (depth0 * 0.03));
        sum += texture2D(tOcclusion, uv).r * w;
        weight += w;
      }
    }
    gl_FragColor = vec4(vec3(sum / weight), 1.0);
  }
`,HWr=`
  varying vec2 vUv;
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform sampler2D tOcclusion;
  uniform vec2 texel;
  uniform vec2 occlusionTexel;
  uniform float fogDensity;
  uniform float near;
  uniform float far;
  uniform vec3 occlusionTint;
  uniform vec3 edgeTint;

  // 1/z runs straight across any flat face in screen space, so its second difference
  // is zero on a face and non-zero only on a crease or a silhouette.
  float inverseZ(float depth) {
    return (far + depth * (near - far)) / (near * far);
  }

  vec3 toSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }

  // One 8-bit level of triangular noise, per channel. Pale gradients change by less
  // than a level across many pixels and would show as coloured stripes; anything less
  // than this lets a step's edge show through as a change of texture.
  vec3 hash32(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
  }
  vec3 dither() {
    return (hash32(gl_FragCoord.xy) + hash32(gl_FragCoord.xy + 17.17) - 1.0) / 255.0;
  }

  void main() {
    vec3 color = texture2D(tColor, vUv).rgb;
    float depth = texture2D(tDepth, vUv).r;
    if (depth < 1.0) {
      float i0 = inverseZ(depth);
      float optical = fogDensity / i0;
      // Haze is in front of whatever is darkened, so the finish fades with it.
      float clearAir = exp(-optical * optical);

      float sum = 0.0;
      float weight = 0.0;
      for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++) {
        vec2 uv = vUv + (vec2(float(x), float(y)) - 0.5) * occlusionTexel;
        // Upsampled along surfaces, not across a depth edge.
        float w = 1.0 / (1e-3 + abs(inverseZ(texture2D(tDepth, uv).r) - i0) / i0);
        sum += texture2D(tOcclusion, uv).r * w;
        weight += w;
      }
      color *= mix(vec3(1.0), mix(occlusionTint, vec3(1.0), sum / weight), clearAir);

      float left = inverseZ(texture2D(tDepth, vUv - vec2(texel.x, 0.0)).r);
      float right = inverseZ(texture2D(tDepth, vUv + vec2(texel.x, 0.0)).r);
      float down = inverseZ(texture2D(tDepth, vUv - vec2(0.0, texel.y)).r);
      float up = inverseZ(texture2D(tDepth, vUv + vec2(0.0, texel.y)).r);
      float crease = max(abs(left + right - 2.0 * i0), abs(down + up - 2.0 * i0)) / i0;
      float line = smoothstep(0.004, 0.03, crease) * ${PWr.toFixed(3)};
      color *= mix(vec3(1.0), edgeTint, line * clearAir);
    }
    gl_FragColor = vec4(toSrgb(clamp(color, 0.0, 1.0)) + dither(), 1.0);
    // Kept for whatever draws after this, depth tested against the set.
    gl_FragDepth = depth;
  }
`;function hKt(t){const e=new Kh,n=new Ahe,r=new Vt(new Mi(2,2));r.frustumCulled=!1,e

/*==============================================================================
 * 14. HOVER PICKER CGr — throttled raycast, hover disc shaders SGr/TGr/AGr, ripple, cursor svg
 * source file: tmp_b/sel_shader_raw2.js
 ==============================================================================*/
ec4(vec3(1.0), a);
  }`,Iot=new Ge(0,0,1);function Mot(t,e){const n=new Vt(new Mi(2,2),new rl({uniforms:e,vertexShader:SGr,fragmentShader:t,transparent:!0,depthTest:!1,depthWrite:!1,side:Fc}));return n.visible=!1,n.frustumCulled=!1,n}function CGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t,l=a.domElement,c=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,d=Mot(TGr,{uBig:{value:0}}),u=Mot(AGr,{uT:{value:2}});r.add(d,u),t.planningAids.push(()=>[d,u]);const h=new Bv,f=new On,m=new Ge,g=new Ge;let b=!1,y=null;const v={x:0,y:0,inside:!1,stale:!1,touch:!1};let x=null,w=!1,k=0,S=-1/0,T="",A=performance.now();const C=new $r;let E=-1/0,j=0;const I=W=>W.distanceTo(s.position)*2*Math.tan(s.fov*Math.PI/360)/Math.max(1,l.clientHeight),N=(W,U)=>(W.face?U.copy(W.face.normal).transformDirection(W.object.matrixWorld):s.getWorldDirection(U).negate(),U),P=()=>{const W=l.getBoundingClientRect();f.set((v.x-W.left)/W.width*2-1,-((v.y-W.top)/W.height)*2+1),h.setFromCamera(f,s);const U=h.intersectObjects([...o.values()],!0)[0],V=h.intersectObject(e.floor,!1)[0],G=U&&(!V||U.distance<=V.distance)?U:V;if(b=!!G,G&&(m.copy(G.point),N(G,g)),y=null,G===U&&U){let Z=U.object;for(;Z&&Z.userData.objectId===void 0;)Z=Z.parent;const se=Z?.userData.objectId;se&&(y=JEe(n.objects.peek(),se,n.selectedId.peek()))}},F=()=>{const W=performance.now(),U=W-A;A=W;const V=e.isEditView()&&n.editInteraction.peek()==="idle"&&!n.draggingAction.peek()&&!n.draggingComponent.peek(),G=V&&v.inside&&!v.touch,Z=e.gizmoHot();(!C.equals(s.matrixWorld)||n.isPreviewPlaying.peek()||n.isPerformancePlaying.peek())&&(C.copy(s.matrixWorld),v.stale=!0),!G||Z||w?(b=!1,y=null):v.stale&&(j<_Gr||W-E>=kGr)&&(v.stale=!1,P(),E=W,j=performance.now()-W),k+=((y?1:0)-k)*Math.min(1,U/vGr),d.visible=G&&b,d.visible&&(d.position.copy(m),d.quaternion.setFromUnitVectors(Iot,g),d.scale.setScalar(bGr*I(m)*(x?yGr:1)),d.material.uniforms.uBig.value=k);const se=!V||v.touch?"":d.visible?gGr:mGr;l.style.cursor!==se&&(l.style.cursor===T||l.style.cursor==="")&&(l.style.cursor=se,T=se),u.visible=!c&&W-S<jot,u.visible&&(u.material.uniforms.uT.value=(W-S)/jot)},B=W=>{u.position.copy(W.point),u.quaternion.setFromUnitVectors(Iot,N(W,new Ge)),u.scale.setScalar(wGr*I(W.point)),S=performance.now()},H=W=>{v.x=W.clientX,v.y=W.clientY,v.inside=!0,v.touch=W.pointerType==="touch",v.stale=!0,x&&Math.hypot(W.clientX-x.x,W.clientY-x.y)>xGr&&(w=!0)},z=W=>{v.touch=W.pointerType==="touch",x={x:W.clientX,y:W.clientY}},L=()=>{x=null,w=!1,v.stale=!0},$=()=>{v.inside=!1},O=()=>{v.stale=!0};return l.addEventListener("pointermove",H),l.addEventListener("pointerdown",z),l.addEventListener("pointerleave",$),l.addEventListener("wheel",O,{passive:!0}),window.addEventListener("pointerup",L),window.addEventListener("pointercancel",L),t.disposers.push(n.objects.onChange(()=>{v.stale=!0})),t.disposers.push(()=>{l.removeEventListener("pointermove",H),l.removeEventListener("pointerdown",z),l.removeEventListener("pointerleave",$),l.removeEventListener("wheel",O),window.removeEventListener("pointerup",L),window.removeEventListener("pointercancel",L);for(const W of[d,u])r.remove(W),W.geometry.dispose(),W.material.dispose()}),{tick:F,rippleAt:B,hoveredId:()=>y}}const EGr=Math.PI/180;function jGr(t,e){const{a:n,meshById:r}=t;let s={tracks:[],durationS:0},a=!0;function o(){s=rx(n.show.peek())}o(),t.disposers.push(qt(()=>{n.show.get(),o(),a=!0}));let l=null,c=null,d=null,u=0,h=null,f=0,m=null,g=!1;function b(ve){for(const ke of s.tracks){const Ae=ke.items.find(Se=>Se.item.id===ve.itemId);if(Ae)return Ae.startS}return 0}t.disposers.push(qt(()=>{const ve=n.playSession.get()?.recording??!1;ve&&h===null?(h=0,f=b(n.playSession.peek()),m=null):ve||(h=null)})),t.disposers.push(qt(()=>{const ve=n.isPerformancePlaying.get();d=ve?n.performanceSeekS.peek()??0:null,ve&&(u=s.durationS)}));function y(){return h!==null?f+h:l!==null?l:d!==null?d:n.performanceSeekS.peek()??0}const v=new Bv;v.camera=t.camera;const x=new Ge(0,-1,0),w=new Ge;function k(ve,ke,Ae){v.set(w.set(ve,ke,Ae),x);const Se=v.intersectObjects(e.walkableSurfaces(),!0)[0];return Se?Se.point.y:null}const S={x:new Ge(1,0,0),y:new Ge(0,1,0),z:new Ge(0,0,1)},T=new Ge,A=new qn,C=new Ge,E=new va,j=new va,I=new qn,N=new Ge,P=new Ge,F=new Ge,B=new qn,H=new va;function z(ve){const ke=n.objects.peek(),Ae=ve?ke[ve]:void 0;if(Ae){const me=Zo(Ae,ke).position;P.set(me[0],me[1],me[2])}else P.set(0,0,0);const Se=ve?r.get(ve):void 0;Se?Se.getWorldPosition(N):N.copy(P)}function L(ve){const ke=n.objects.peek(),Ae=new Map;for(const Se of s.tracks){const me=ke[Se.characterId];if(!me||!Q0(me.kind))continue;const Te=q(Se,ve);Te&&Ae.set(Se.characterId,Te);const Le=r.get(Se.characterId);if(!Le||e.isMeshDragged(Le))continue;me.kind==="simple_figure"&&o$(Le,Kae(Se.items.map(tt=>tt.item),ve,me.headRotation,tt=>J(me,Se,tt))),T.set(me.position[0],me.position[1],me.position[2]),E.set(me.rotation[0],me.rotation[1],me.rotation[2]),A.setFromEuler(E),C.set(me.scale[0],me.scale[1],me.scale[2]);const Fe=Q(Se,ve,!el(me.kind));Fe!=="base"&&(Le.scale.copy(C),Fe!=="walk"&&(j.setFromQuaternion(A),Le.position.copy(T),Le.rotation.set(...GA([j.x,j.y,j.z],[E.x,E.y,E.z]))))}for(const[Se,{target:me,sinceS:Te}]of ce){const Le=ke[Se],Fe=r.get(Se);if(!Le||!Fe||e.isMeshDragged(Fe))continue;Fe.updateWorldMatrix(!0,!1),Fe.getWorldPosition(be),fe.set(0,0,-1).applyQuaternion(Fe.getWorldQuaternion(we));const tt=xM(Math.atan2(-fe.x,-fe.z),xe(Le,be.x,be.y,be.z),me);if(Le.kind==="humanoid"){Se!==e.rigPoseObjectId()&&Ae.set(Se,IZt(Ae.get(Se)??{},jZt(tt)));continue}const Oe=s.tracks.find($e=>$e.characterId===Se);if(!Oe)continue;const Je={sinceS:Te,headRotation:kje(tt)};o$(Fe,Kae(Oe.items.map($e=>$e.item),ve,Le.headRotation,$e=>$e===ve?Je:J(Le,Oe,$e)))}e.setRigOffsets(Ae)}const $=new Ge,O=new Ge,W=new va,U=new qn;let V=!1;const G=new Ge,Z=new qn,se=new va,X=new Ge;function te(ve,ke){if(!ve)return null;if(!V){V=!0,G.copy(T),Z.copy(A),se.copy(E),X.copy(C);try{const me=le(ve,ke);if(me)return me.position}finally{T.copy(G),A.copy(Z),E.copy(se),C.copy(X),V=!1}}const Ae=r.get(ve);if(Ae)return Ae.getWorldPosition(O),[O.x,O.y,O.z];const Se=n.objects.peek()[ve];return Se?[...Se.position]:null}function ne(ve,ke,Ae,Se){const me=n.objects.peek()[Se],Te=!!me&&el(me.kind)&&ve.aim==="subject"&&!!ve.subjectId,Le=me?.kind==="spotlight";let Fe=Te?null:te(ve.subjectId,Ae);if(Le&&Fe){const He=NP(ve.subjectId,n.objects.peek(),NIr);Fe=[Fe[0],Fe[1]+He,Fe[2]]}const tt=q2r(Te?{...ve,aim:"travel"}:ve,ke,Fe);if(Te&&tt.yawRad!==null){const He=Ee({subjectId:ve.subjectId,atS:Ae});He&&(tt.yawRad=xM(tt.yawRad,xe(me,...tt.position),He).bodyYawRad)}const Oe=r.get(Se),Je=Oe?.parent&&Oe.parent!==t.scene?Oe.parent:null;$.set(...tt.position),Je&&Je.worldToLocal($),T.copy($);let $e=0;Je&&(Je.getWorldQuaternion(U),W.setFromQuaternion(U,"YXZ"),$e=W.y);const Ue=Le?W.setFromQuaternion(A,"YXZ"):null,et=Z2r(tt,$e,Ue&&[Ue.x,Ue.y,Ue.z]);et&&(W.set(...et,"YXZ"),A.setFromEuler(W))}function Q(ve,ke,Ae){let Se="base";for(const me of ve.items){const{item:Te}=me;if(Te.kind==="play"&&!Ae){if(Te.samples.length===0)continue;if(ke<me.startS||(Se="walk",ke<me.endS))break;continue}if(Te.kind==="path"){if(Te.anchors.length<2)continue;if(ke<me.startS||(Se=Ae?"fold":"walk",ne(Te,Math.min(ke-me.startS,me.endS-me.startS),Math.min(ke,me.endS),ve.characterId),ke<me.endS))break;continue}if(!aN(Te)||Te.kind==="rig-transform")continue;if(ke<me.startS)break;Se="fold";const Le=Math.min(ke-me.startS,Te.durationS);if(Te.kind==="rotate")I.setFromAxisAngle(S[Te.axis],Te.degPerS*Le*EGr),A.multiply(I);else if(Te.kind==="scale")C.multiplyScalar(v2r(Te.factor,Le,Te.durationS));else if(Te.kind==="revolve"){z(Te.centerObjectId);const Fe=x2r([T.x-P.x,T.y-P.y,T.z-P.z],Te.degPerS*Le);T.set(N.x+Fe[0],N.y+Fe[1],N.z+Fe[2])}else if(Te.kind==="transform"){const Fe=Bzt(Te.keys,Le);Fe&&(T.set(Fe.position[0],Fe.position[1],Fe.position[2]),E.set(Fe.rotation[0],Fe.rotation[1],Fe.rotation[2]),A.setFromEuler(E),C.set(Fe.scale[0],Fe.scale[1],Fe.scale[2]))}if(ke<me.endS)break}return Se}function q(ve,ke){let Ae=null;for(const Se of ve.items){const{item:me}=Se;if(ke<Se.startS)break;if(me.kind==="rig-transform"){const Te=Math.min(ke-Se.startS,me.durationS);Ae=Vzt(me.keys,Te)??Ae}if(ke<Se.endS)break}return Ae}const Y=ve=>[ve.x,ve.y,ve.z,ve.w],re=new Ge,ae=new qn,ie=new Ge,ge=new va,pe=new $r,ce=new Map,be=new Ge,fe=new Ge,we=new qn;function Ee(ve){const ke=te(ve.subjectId,ve.atS);if(!ke)return null;const Ae=NP(ve.subjectId,n.objects.peek());return[ke[0],ke[1]+Ae,ke[2]]}const xe=(ve,ke,Ae,Se)=>[ke,Ae+CZt*ve.scale[1],Se];function J(ve,ke,Ae){const Se=eEe(ke,Ae).lookAt,me=Se&&Ee(Se),Te=me&&le(ke.characterId,Ae);if(!Te)return null;fe.set(0,0,-1).applyQuaternion(we.fromArray(Te.quaternion));const Le=xM(Math.atan2(-fe.x,-fe.z),xe(ve,...Te.position),me);return{sinceS:Se.sinceS,headRotation:kje(Le)}}function le(ve,ke){const Ae=n.objects.peek()[ve];if(!Ae)return null;T.set(Ae.position[0],Ae.position[1],Ae.position[2]),E.set(Ae.rotation[0],Ae.rotation[1],Ae.rotation[2]),A.setFromEuler(E),C.set(Ae.scale[0],Ae.scale[1],Ae.scale[2]);const Se=s.tracks.find(tt=>tt.characterId===ve),me=Se?Q(Se,ke,!el(Ae.kind)):"base";re.copy(T),ae.copy(A);const Te=Se?eEe(Se,ke):null,Le=el(Ae.kind)&&me!=="fold"?Te?.position:null;if(Le){const tt=Te.exactY?Le[1]:k(Le[0],Le[1]+Bne,Le[2])??Le[1],Oe=ztt(Te),Je=Oe&&!Oe.exact&&Te.lookAt?Ee(Te.lookAt):null,$e=Oe&&Je?xM(Oe.yawRad,xe(Ae,Le[0],tt,Le[2]),Je).bodyYawRad:Oe?.yawRad;return $e!==void 0&&ae.setFromEuler(ge.set(0,$e,0)),{position:[Le[0],tt,Le[2]],quaternion:Y(ae)}}const Fe=r.get(ve);return Fe?.parent&&Fe.parent!==t.scene&&(pe.compose(re,ae,ie.copy(C)),pe.premultiply(Fe.parent.matrixWorld),pe.decompose(re,ae,ie)),{position:[re.x,re.y,re.z],quaternion:Y(ae)}}function ue(ve,ke){const Ae=n.objects.peek();ce.clear();const Se=m===null||ve<m;m=ve;const me=e.livePlay(),Te=new Map;for(const Le of tyr(s,ve)){if(me?.characterId===Le.characterId)continue;const Fe=r.get(Le.characterId),tt=Ae[Le.characterId];if(!Fe||!tt||!el(tt.kind)||(tt.kind==="humanoid"&&Te.set(Le.characterId,{clip:Le.clip,timeS:Le.clipTimeS}),e.isMeshDragged(Fe)))continue;const Oe=Le.position;if(!Oe)continue;const Je=Fe.getWorldPosition(F).y;let $e;if(Le.exactY)$e=Oe[1];else if(Se)$e=k(Oe[0],Oe[1]+Bne,Oe[2])??Oe[1];else{const He=k(Oe[0],Je+Bne,Oe[2]);if(He===null)$e=Je;else{const qe=zzt(Je,He,Xae);$e=Je+(qe-Je)*(1-Math.exp(-ke/Uzt))}}let Ue=0;Fe.parent&&Fe.parent!==t.scene?(F.set(Oe[0],$e,Oe[2]),Fe.parent.worldToLocal(F),Fe.position.copy(F),Fe.parent.getWorldQuaternion(B),H.setFromQuaternion(B,"YXZ"),Ue=H.y):Fe.position.set(Oe[0],$e,Oe[2]);const et=ztt(Le);if(et?.exact)Fe.rotation.set(0,et.yawRad-Ue,0);else if(et){const He=Le.lookAt?Ee(Le.lookAt):null,qe=xe(tt,Oe[0],$e,Oe[2]),We=(He?xM(et.yawRad,qe,He).bodyYawRad:et.yawRad)-Ue;F.set(0,0,-1).applyQuaternion(Fe.quaternion);const dt=Math.atan2(-F.x,-F.z),mt=Wzt(dt,We,g?Math.PI:A2r*ke);Fe.rotation.set(0,mt,0),He&&ce.set(Le.characterId,{target:He,sinceS:Le.lookAt.sinceS})}else Se&&Fe.rotation.set(tt.rotation[0],tt.rotation[1],tt.rotation[2])}me&&Te.set(me.characterId,{clip:me.clip,timeS:null}),e.setPlaybackClips(Te),L(ve)}let oe=!1;function ye(){const ve=n.objects.peek(),ke=e.livePlay(),Ae=new Map;for(const[Se,me]of r){const Te=ve[Se];if(!(!Te||!Q0(Te.kind))){if(ke?.characterId===Se){Ae.set(Se,{clip:ke.clip,timeS:null});continue}e.isMeshDragged(me)||(me.position.set(Te.position[0],Te.position[1],Te.position[2]),me.rotation.set(Te.rotation[0],Te.rotation[1],Te.rotation[2]),me.scale.set(Te.scale[0],Te.scale[1],Te.scale[2]),Te.kind==="simple_figure"&&o$(me,Te.headRotation))}}m=null,e.setPlaybackClips(Ae)}const je={objectPoseAt:le,resetPerformersToStart:()=>{m=null,ue(0,0),oe=!0},startManualClock:ve=>{const ke=s.durationS,Ae=She(n.show.peek(),ke),Se=ve?.fromS??(ve?.bounded?Ae.fromS:0);return l=Se,n.performanceTimeS.set(Se),m=null,c=ve?.bounded&&ke>.05?Ae.toS:null,Se},stopManualClock:()=>{l=null,c=null},tick:ve=>{let ke=!1;if(l!==null&&(l+=ve,c!==null&&l>=c&&(l=c,c=null,ke=!0)),h!==null&&(h+=ve),d!==null&&(d+=ve,d>=u&&(n.stopPerformance(),n.isPreviewPlaying.set(!1))),l!==null||h!==null||d!==null||n.performanceSeekS.peek()!==null){const Se=y();n.performanceTimeS.set(Se),ue(Se,ve),oe=!0}else{n.performanceTimeS.set(0);const Se=new Map;for(const Te of s.tracks){const Le=q(Te,0);Le&&Se.set(Te.characterId,Le)}e.setRigOffsets(Se);const me=e.livePlay();(oe||me)&&(ye(),oe=me!==null)}a=!1,ke&&n.autoStopRecording()},poseNow:()=>{const ve=a||y()!==m;ve&&(m=null),g=ve;try{je.tick(0)}finally{g=!1}return ve}};return je}const IGr={position:"absolute",display:"none",pointerEvents:"none",zIndex:"1",border:"1px solid rgba(255,255,255,0.4)",boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)"};function MGr(t){const e=document.createElement("div");return Object.assign(e.style,IGr),t.appendChild(e),{show:n=>{e.style.display="block",e.style.left=`${n.left*100}%`,e.style.top=`${n.top*100}%`,e.style.width=`${n.width*100}%`,e.style.height=`${n.height*100}%`},hide:()=>{e.style.display="none"},dispose:()=>e.remove()}}const Not=11163135,NGr=16777215,Pot=6741503,PGr=.06,Rot=16763989,RGr=.075,FGr=.25,Fot=.09,xL=.02,OGr=.35,LGr=.6,DGr=3,BGr=new Ge,HGr=new Ge,$Gr=new Ge,VGr=new Ge;function UGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t;function l(){return XGt({viewportAspect:s.aspect,viewportHeightPx:n.container.clientHeight,recordAspect:Am(n.recordAspect.peek()).aspect})}function c(){const A=l(),C=35/Math.max(s.aspect,1);s.fov=2*Math.atan(A.fovScale*C/2/n.focalLengthMm.peek())*180/Math.PI,s.updateProjectionMatrix()}const d=MGr(n.container);t.disposers.push(d.dispose);function u(){if(n.mode.peek()!=="camera"){d.hide();return}const A=l();d.show({left:(1-A.widthFraction)/2,top:(1-A.heightFraction)/2,width:A.widthFraction,height:A.heightFraction})}t.disposers.push(qt(()=>{n.focalLengthMm.get(),n.recordAspect.get(),n.mode.peek()==="camera"&&c(),u()}));function h(A){const E=document.createElement("canvas");E.width=64,E.height=64;const j=E.getContext("2d");j.fillStyle="#ffffff",j.font="bold 40px sans-serif",j.textAlign="center",j.textBaseline="middle",j.fillText(A,64/2,64/2);const I=new lie(new mDe({map:new k4(E),depthTest:!1}));return I.scale.setScalar(.35),I}function f(A){for(const C of[...A.children])A.remove(C),C.traverse(E=>{E instanceof lie&&(E.material.map?.dispose(),E.material.dispose())}),Kd(C)}const m=new Ci;r.add(m);function g(){f(m)}function b(){const A=n.objects.peek();return n.show.peek().tracks.flatMap(C=>C.items.filter(g2).map(E=>({itemId:E.id,anchors:E.anchors,curve:Q2r(E),isFlown:!el(A[C.characterId]?.kind)})))}function y(){g(),t.pathEditPickables=[];const A=n.performancePaint.peek(),C=n.selectedSegment.peek()?.itemId;for(const E of b()){const j=A?.itemId===E.itemId;if(!j&&C!==E.itemId)continue;const I=new Ci,N=new tl({color:Not}),P=new tl({color:NGr});if(E.anchors.forEach((F,B)=>{const H=F.pos,z=j&&A?.selectedAnchor===B,L=new Vt(new Ku(z?Fot*1.4:Fot,12,8),z?P:N);if(L.position.set(H[0],H[1]+xL,H[2]),j&&(L.userData.pathAnchorIndex=B,t.pathEditPickables.push(L)),I.add(L),j&&E.isFlown&&(z||H[1]>FGr)){const O=H[1]+xL;I.add(new Lu(new Ii().setFromPoints([new Ge(H[0],0,H[2]),new Ge(H[0],O,H[2])]),new Dv({color:Rot})));const W=new Vt(new Ku(RGr,10,6),new tl({color:Rot}));W.position.set(H[0],IOr(H[1]),H[2]),W.userData.pathHeightAnchor=B,t.pathEditPickables.push(W),I.add(W)}const $=h(String(B+1));if($.position.set(H[0],H[1]+OGr,H[2]),I.add($),z){const O=new Ge(H[0],H[1]+xL,H[2]);["in","out"].forEach(W=>{const U=F[W],V=new Ge(H[0]+U[0],H[1]+U[1]+xL,H[2]+U[2]);I.add(new Lu(new Ii().setFromPoints([O,V]),new Dv({color:Pot})));const G=new Vt(new Ku(PGr,10,6),new tl({color:Pot}));G.position.copy(V),G.userData.pathHandle=W,G.userData.pathHandleAnchor=B,t.pathEditPickables.push(G),I.add(G)})}}),E.anchors.length>=2){const F=new Ii().setFromPoints(E.curve.map(B=>new Ge(B[0],B[1]+xL,B[2])));I.add(new Lu(F,new Dv({color:Not})))}m.add(I)}}y(),t.disposers.push(qt(()=>{n.show.get(),n.performancePaint.get(),n.selectedSegment.get(),y()})),t.disposers.push(()=>{g(),t.pathEditPickables=[]}),t.planningAids.push(()=>[m,...[...o.values()].filter(mZt)]);function v(){for(const A of o.values()){if(A.userData.kind!=="camera")continue;const C=A.userData.objectId,E=xq(n,C),j=yFr({framesMarkerNow:E,meshDragged:e.isMeshDragged(A)});if(!E){urt(A,{fovDeg:BU(n),aspect:Am(n.recordAspect.peek()).aspect,distance:DGr});continue}const I=LOr(t,C);if(!I)continue;const N=BGr.set(I[0],I[1],I[2]),P=A.getWorldPosition(HGr).distanceTo(N);P<1e-4||(j&&(A.lookAt(N),A.rotateY(Math.PI)),urt(A,{fovDeg:BU(n),aspect:Am(n.recordAspect.peek()).aspect,distance:Math.max(P,LGr)}))}}const x=new Set;function w(){const A=n.objects.peek();for(const[C,E]of Object.entries(A)){if(E.kind!=="camera")continue;if(!mFr(n,C)){x.delete(C);continue}if(x.has(C))continue;if(!E.rotation.every(P=>P===0)){x.add(C);continue}const j=o.get(C),I=j?Die(t,j):null;if(!j||!I)continue;const N=I.getWorldPosition($Gr);j.getWorldPosition(VGr).distanceTo(N)<1e-4||(x.add(C),j.lookAt(N),j.rotateY(Math.PI),n.updateObjectTransform(C,{rotation:[j.rotation.x,j.rotation.y,j.rotation.z]}))}}function k(){if(n.mode.peek()!=="edit")return;const A=n.objects.peek(),C=n.selectedId.peek(),E=n.focusedCameraId.peek();for(const j of o.values())j.userData.kind==="target"&&(j.visible=uZt(n,A,E,C,j.userData.objectId))}function S(){const A=n.container.clientWidth,C=n.container.clientHeight;A===0||C===0||(s.aspect=A/C,n.mode.peek()==="camera"?c():s.updateProjectionMatrix(),a.setSize(A,C,!1),u(),e.repaintViewport())}const T=new ResizeObserver(()=>S());return T.observe(n.container),t.disposers.push(()=>T.disconnect()),{applyCameraModeFov:c,updateFrameGuide:u,updateCameraMarkerVisual:v,tick:()=>{w(),v(),k()}}}const zGr=1.6,WGr=4.2,GGr=.7,qGr=18,ZGr=6,Oot=.0025,KGr=-.35,XGr=1.25,Lot=3.4,YGr=1.4,QGr=.2,JGr=.6,eqr=12,Dot=.3,tqr=[Xae+.1,1.3],nqr=2,rqr=120,sqr={0:"lmb",2:"rmb"};function aqr(t,e){const{a:n,camera:r,renderer:s,meshById:a}=t;let o=null,l=null,c=null,d=0,u=.3,h=0,f=!0,m=!1,g="idle",b=null,y=0;const v=new Set;let x=!1,w=[],k=0,S=!1;const T=new Bv,A=new Ge(0,-1,0),C=new Ge;function E(Y,re,ae){T.set(C.set(Y,re,ae),A);const ie=T.intersectObjects(e.walkableSurfaces(),!0)[0];return ie?ie.point.y:null}const j=new Bv,I=new Ge,N=new Ge,P=new Ge;function F(Y,re){if(!l)return null;const ae=Math.hypot(Y,re);N.set(Y/ae,0,re/ae);let ie=null;for(const ge of tqr){I.set(l.position.x,l.position.y+ge,l.position.z),j.set(I,N),j.far=ae+Dot;const pe=j.intersectObjects(e.walkableSurfaces(),!0)[0];pe?.fa

/*==============================================================================
 * 15. MESH SYNC AWr — per-kind mesh creation (humanoid GLB/camera GLB/props/primitives), parenting, labels
 * source file: tmp_b/rig_sync_AWr.js
 ==============================================================================*/
AWr(t,e){const{a:n,scene:r,meshById:s}=t,a=new Bhe,o=new Map;function l(P,F,B){const H=new Ihe(F),z=new Map;for(const O of B)z.set(O.name,H.clipAction(O));const L=new Map;F.traverse(O=>{O instanceof bT&&L.set(O.name,O)});const $={mixer:H,actions:z,currentClip:null,bones:L,clipLocal:new Map};return o.set(P,$),n.onSkeletonReady?.(P),$}function c(P){const F=o.get(P);F&&(F.mixer.stopAllAction(),F.mixer.uncacheRoot(F.mixer.getRoot()),o.delete(P))}let d=new Map,u=new Map,h=null;function f(P){const F=u.get(P)??null;return h?.objectId!==P?F:{...F,...h.offsets}}function m(){for(const P of o.values())for(const[F,B]of P.clipLocal){const H=P.bones.get(F);H&&(H.position.copy(B.position),H.quaternion.copy(B.quaternion),H.scale.copy(B.scale))}}function g(){for(const[P,F]of o){const B=f(P);if(F.clipLocal.clear(),!!B)for(const[H,z]of Object.entries(B)){const L=F.bones.get(H);L&&(F.clipLocal.set(H,Uie(L)),aKt(L,z))}}}function b(){const P=n.objects.peek();for(const[F,B]of o){const H=d.get(F),z=P[F]?.animation,L=H?.clip??z?.clip;if(L===void 0)continue;if(B.currentClip!==L){const O=B.actions.get(L);if(!O)continue;const W=B.currentClip?B.actions.get(B.currentClip):void 0;W&&W.fadeOut(Sot),O.reset().fadeIn(W?Sot:0).play(),B.currentClip=L}const $=B.actions.get(L);if($)if(H&&H.timeS!==null){const O=$.getClip().duration;$.paused=!0,$.time=O>0?(H.timeS%O+O)%O:0}else H?$.paused=!1:($.paused=!z?.playing,z?.playing||($.time=0))}}function y(P){const F=new Ci,B=u5r();return F.add(B),a.loadAsync(Hhe).then(H=>{if(s.get(P)!==F){Oje(H.scene),Kd(H.scene);return}const z=H.scene,$=new go().setFromObject(z).getSize(new Ge);$.y>0&&z.scale.multiplyScalar(jP/$.y);const O=new go().setFromObject(z),W=O.getCenter(new Ge);z.position.x-=W.x,z.position.z-=W.z,z.position.y-=O.min.y,F.remove(B),Kd(B),$he(z),F.add(z),T(F,n.objects.peek()[P]?.color),l(P,z,H.animations),b()}).catch(H=>{console.error("Failed to load bundled humanoid model",H)}),F}function v(P,F){const B=F.propKey,H=B?zh[B]:void 0;if(H?.url){const L=new Ci,$=eat(H.dims);return L.add($),qqt(a,H.url,H.scale,H.yawDeg).then(O=>{if(s.get(P)!==L){Kd(O);return}L.remove($),Kd($),L.add(O);const W=n.objects.peek()[P];T(L,W&&S(W))}).catch(O=>{console.error("Failed to load remote prop",B,O)}),L}if(B){const L=Wqt(B);if(L)return L}const z=new Ci;return z.add(eat()),z}function x(P){const F=$8r();return a.loadAsync(qWt).then(B=>{if(s.get(P)!==F){Kd(B.scene);return}const H=B.scene;mie(H),F.add(H)}).catch(B=>{console.error("Failed to load bundled camera model",B)}),F}function w(P){const F=sOr(rOr());return a.loadAsync(ZWt).then(B=>{if(s.get(P)!==F){Kd(B.scene);return}mie(B.scene),aOr(F,B.scene)}).catch(B=>{console.error("Failed to load bundled spotlight model",B)}),F}function k(P,F){return F.kind==="humanoid"?y(P):F.kind==="simple_figure"?Zqt():F.kind==="camera"?x(P):F.kind==="target"?YWt():F.kind==="spotlight"?w(P):F.kind==="prop"?v(P,F):F.kind==="group"?new Ci:wWr(xWr(F.kind),void 0)}const S=P=>P.color??Mje(P);function T(P,F){const B=P.userData.colorOverride;if(F===void 0){if(!B)return;P.traverse(z=>{z instanceof Vt&&z.userData.originalMaterial&&(z.material=z.userData.originalMaterial,delete z.userData.originalMaterial)}),B.dispose(),delete P.userData.colorOverride;return}const H=B??new Io({roughness:X_});!B&&P.userData.softTerminator&&oKt(H),H.color.set(F),P.userData.colorOverride=H,P.traverse(z=>{z instanceof Vt&&(z.userData.originalMaterial||(z.userData.originalMaterial=z.material),z.material=H)})}function A(P,F,B=F.color){F.kind==="simple_figure"?Kqt(P,B):F.kind!=="group"&&F.kind!=="spotlight"&&T(P,B??Mje(F))}const C=new Map;function E(P){const H="bold 32px sans-serif",z=document.createElement("canvas"),L=z.getContext("2d");L.font=H,z.width=Math.ceil(L.measureText(P).width)+48,z.height=64,L.fillStyle="rgba(0, 0, 0, 0.55)",L.beginPath(),L.roundRect(0,0,z.width,64,64/2),L.fill(),L.font=H,L.fillStyle="#ffffff",L.textAlign="center",L.textBaseline="middle",L.fillText(P,z.width/2,64/2);const $=new lie(new mDe({map:new k4(z),depthTest:!1}));return $.scale.set(z.width/64*Tot,Tot,1),$.position.y=jP+kWr,$}function j(P,F){const B=C.get(P);B&&(F.remove(B),B.material.map?.dispose(),B.material.dispose(),C.delete(P))}function I(P,F,B){if(F.userData.nameLabelText===B||(F.userData.nameLabelText=B,j(P,F),!B))return;const H=E(B);C.set(P,H),F.add(H)}function N(){const P=n.objects.peek(),F=n.playSession.peek()?.characterId;let B=!1;for(const[H,z]of s){const L=H in P&&P[H].kind!==z.userData.kind;(!(H in P)||L)&&(B||=L,TWr(z,r,$=>$ in P),s.delete(H),e.detachIfAttached(z),c(H),Oje(z),j(H,z),T(z,void 0),Kd(z))}for(const[H,z]of Object.entries(P))if(!s.get(H)){const L=k(H,z);L.userData.objectId=H,L.userData.kind=z.kind,s.set(H,L)}for(const[H,z]of Object.entries(P)){const L=s.get(H),$=z.parentId?s.get(z.parentId)??r:r;L.parent!==$&&$.add(L),H!==F&&(L.position.set(...z.position),L.rotation.set(...z.rotation),L.scale.set(...z.scale)),_Wr(L,z.scale);const O=eKt(z);if(L.userData.glows&&!O&&L instanceof Vt)for(const W of[L.material,L.userData.originalMaterial]){const U=W;U?.emissive.setHex(0),U&&delete U.userData.glowAt}L.userData.glows=O,A(L,z),z.kind==="simple_figure"&&o$(L,z.headRotation),el(z.kind)&&I(H,L,z.name)}B&&e.reseat()}return N(),t.disposers.push(qt(()=>{n.objects.get(),N()}),qt(()=>{const P=n.colorPreview.get();if(!P)return;const F=n.objects.peek();for(const B of P.ids){const H=s.get(B),z=F[B];H&&z&&A(H,z,P.color)}})),t.disposers.push(qt(()=>{n.objects.get(),b()})),t.planningAids.push(function*(){yield*C.values();for(const[P,F]of s){const B=n.objects.peek()[P]?.kind;if((B==="camera"||B==="target")&&(yield F),B==="spotlight"){const H=tOr(F);H&&(yield H)}}}),{setPlaybackClips:P=>{d=P,b()},setRigOffsets:P=>{u=P},setLiveRigDrag:P=>{h=P},boneOf:(P,F)=>o.get(P)?.bones.get(F)??null,majorJointsOf:P=>{const F=o.get(P);return F?[...F.bones.entries()].filter(([B])=>cot(B)).map(([,B])=>B):[]},sampleClipRigOffsets:(P,F)=>{const B=o.get(P);if(!B)return null;const H=B.actions.get(F)?.getClip(),z=B.actions.get("idle")?.getClip();if(!H||!z)return null;const L={},$={};for(const[W,U]of B.bones)cot(W)&&(L[W]=Aot(z,W,U,0),$[W]=Aot(H,W,U,0));const O=fWr(L,$);return Object.keys(O).length>0?O:null},clipLocalOf:(P,F)=>o.get(P)?.clipLocal.get(F)??null,tick:P=>{m();for(const F of o.values())F.mixer.update(P);g()},finishFades:()=>{for(const P of o.values())SWr(P.actions,P.currentClip)},disposeAll:()=>{for(const P of[...o.keys()])c(P);for(const[P,F]of s)j(P,F)}}}function CWr(t){const{a:e,renderer:n,camera:r,meshB

/*==============================================================================
 * 16. CAMERA MARKERS + FRAME GUIDE UGr — fov model, record framing XGt/o2r, path-edit visuals builder y()
 * source file: tmp_b/path_edit.js
 ==============================================================================*/
Gr=.25,Fot=.09,xL=.02,OGr=.35,LGr=.6,DGr=3,BGr=new Ge,HGr=new Ge,$Gr=new Ge,VGr=new Ge;function UGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t;function l(){return XGt({viewportAspect:s.aspect,viewportHeightPx:n.container.clientHeight,recordAspect:Am(n.recordAspect.peek()).aspect})}function c(){const A=l(),C=35/Math.max(s.aspect,1);s.fov=2*Math.atan(A.fovScale*C/2/n.focalLengthMm.peek())*180/Math.PI,s.updateProjectionMatrix()}const d=MGr(n.container);t.disposers.push(d.dispose);function u(){if(n.mode.peek()!=="camera"){d.hide();return}const A=l();d.show({left:(1-A.widthFraction)/2,top:(1-A.heightFraction)/2,width:A.widthFraction,height:A.heightFraction})}t.disposers.push(qt(()=>{n.focalLengthMm.get(),n.recordAspect.get(),n.mode.peek()==="camera"&&c(),u()}));function h(A){const E=document.createElement("canvas");E.width=64,E.height=64;const j=E.getContext("2d");j.fillStyle="#ffffff",j.font="bold 40px sans-serif",j.textAlign="center",j.textBaseline="middle",j.fillText(A,64/2,64/2);const I=new lie(new mDe({map:new k4(E),depthTest:!1}));return I.scale.setScalar(.35),I}function f(A){for(const C of[...A.children])A.remove(C),C.traverse(E=>{E instanceof lie&&(E.material.map?.dispose(),E.material.dispose())}),Kd(C)}const m=new Ci;r.add(m);function g(){f(m)}function b(){const A=n.objects.peek();return n.show.peek().tracks.flatMap(C=>C.items.filter(g2).map(E=>({itemId:E.id,anchors:E.anchors,curve:Q2r(E),isFlown:!el(A[C.characterId]?.kind)})))}function y(){g(),t.pathEditPickables=[];const A=n.performancePaint.peek(),C=n.selectedSegment.peek()?.itemId;for(const E of b()){const j=A?.itemId===E.itemId;if(!j&&C!==E.itemId)continue;const I=new Ci,N=new tl({color:Not}),P=new tl({color:NGr});if(E.anchors.forEach((F,B)=>{const H=F.pos,z=j&&A?.selectedAnchor===B,L=new Vt(new Ku(z?Fot*1.4:Fot,12,8),z?P:N);if(L.position.set(H[0],H[1]+xL,H[2]),j&&(L.userData.pathAnchorIndex=B,t.pathEditPickables.push(L)),I.add(L),j&&E.isFlown&&(z||H[1]>FGr)){const O=H[1]+xL;I.add(new Lu(new Ii().setFromPoints([new Ge(H[0],0,H[2]),new Ge(H[0],O,H[2])]),new Dv({color:Rot})));const W=new Vt(new Ku(RGr,10,6),new tl({color:Rot}));W.position.set(H[0],IOr(H[1]),H[2]),W.userData.pathHeightAnchor=B,t.pathEditPickables.push(W),I.add(W)}const $=h(String(B+1));if($.position.set(H[0],H[1]+OGr,H[2]),I.add($),z){const O=new Ge(H[0],H[1]+xL,H[2]);["in","out"].forEach(W=>{const U=F[W],V=new Ge(H[0]+U[0],H[1]+U[1]+xL,H[2]+U[2]);I.add(new Lu(new Ii().setFromPoints([O,V]),new Dv({color:Pot})));const G=new Vt(new Ku(PGr,10,6),new tl({color:Pot}));G.position.copy(V),G.userData.pathHandle=W,G.userData.pathHandleAnchor=B,t.pathEditPickables.push(G),I.add(G)})}}),E.anchors.length>=2){const F=new Ii().setFromPoints(E.curve.map(B=>new Ge(B[0],B[1]+xL,B[2])));I.add(new Lu(F,new Dv({color:Not})))}m.add(I)}}y(),t.disposers.push(qt(()=>{n.show.get(),n.performancePaint.get(),n.selectedSegment.get(),y()})),t.disposers.push(()=>{g(),t.pathEditPickables=[]}),t.planningAids.push(()=>[m,...[...o.values()].filter(mZt)]);function v(){for(const A of o.values()){if(A.userData.kind!=="camera")continue;const C=A.userData.objectId,E=xq(n,C),j=yFr({framesMarkerNow:E,meshDragged:e.isMeshDragged(A)});if(!E){urt(A,{fovDeg:BU(n),aspect:Am(n.recordAspect.peek()).aspect,distance:DGr});continue}const I=LOr(t,C);if(!I)continue;const N=BGr.set(I[0],I[1],I[2]),P=A.getWorldPosition(HGr).distanceTo(N);P<1e-4||(j&&(A.lookAt(N),A.rotateY(Math.PI)),urt(A,{fovDeg:BU(n),aspect:Am(n.recordAspect.peek()).aspect,distance:Math.max(P,LGr)}))}}const x=new Set;function w(){const A=n.objects.peek();for(const[C,E]of Object.entries(A)){if(E.kind!=="camera")continue;if(!mFr(n,C)){x.delete(C);continue}if(x.has(C))continue;if(!E.rotation.every(P=>P===0)){x.add(C);continue}const j=o.get(C),I=j?Die(t,j):null;if(!j||!I)continue;const N=I.getWorldPosition($Gr);j.getWorldPosition(VGr).distanceTo(N)<1e-4||(x.add(C),j.lookAt(N),j.rotateY(Math.PI),n.updateObjectTransform(C,{rotation:[j.rotation.x,j.rotation.y,j.rotation.z]}))}}function k(){if(n.mode.peek()!=="edit")return;const A=n.objects.peek(),C=n.selectedId.peek(),E=n.focusedCameraId.peek();for(const j of o.values())j.userData.kind==="target"&&(j.visible=uZt(n,A,E,C,j.userData.objectId))}function S(){const A=n.container.clientWidth,C=n.container.clientHeight;A===0||C===0||(s.aspect=A/C,n.mode.peek()==="camera"?c():s.updateProjectionMatrix(),a.setSize(A,C,!1),u(),e.repaintViewport())}const T=new ResizeObserver(()=>S());return T.observe(n.container),t.disposers.push(()=>T.disconnect()),{applyCameraModeFov:c,updateFrameGuide:u,updateCameraMarkerVisual:v,tick:()=>{w(),v(),k()}}}const zGr=1.6,WGr=4.2,GGr=.7,qGr=18,ZGr=6,Oot=.0025,KGr=-.35,XGr=1.25,Lot=3.4,YGr=1.4,QGr=.2,JGr=.6,eqr=12,Dot=.3,tqr=[Xae+.1,1.3],nqr=2,rqr=120,sqr={0:"lmb",2:"rmb"};function aqr(t,e){const{a:n

/*==============================================================================
 * 17. Frame-guide DOM overlay MGr + IGr styles; Z_ fov fn; Am/Zae aspect table region
 * source file: tmp_b/sel_pGr_full.js
 ==============================================================================*/
);
    if (a <= 0.001) discard;
    gl_FragColor = vec4(mix(uFill, uLine, clamp(white + wash, 0.0, 1.0)), a);
    #include <colorspace_fragment>
  }`,uGr=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`,hGr=`
  varying vec2 vUv;
  uniform sampler2D tMask;
  uniform vec2 uTexel;
  uniform float uWidth;
  float ringMax(float r) {
    float m = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) / 8.0 * 6.2831853;
      m = max(m, textureLod(tMask, vUv + vec2(cos(a), sin(a)) * r * uTexel, 0.0).r);
    }
    return m;
  }
  void main() {
    // Most of the frame is nowhere near the mask, and a coarse mip says so in one read.
    if (textureLod(tMask, vUv, 4.0).r == 0.0) discard;
    float inside = textureLod(tMask, vUv, 0.0).r;
    if (inside >= 0.999) discard;
    float s = max(ringMax(uWidth), ringMax(uWidth * 0.5)) * (1.0 - inside);
    float h = 0.26 * ringMax(uWidth + 2.0) * (1.0 - inside) * (1.0 - s);
    float a = s + h;
    if (a <= 0.002) discard;
    gl_FragColor = vec4(mix(vec3(0.09, 0.11, 0.18), vec3(1.0), s / max(a, 1e-3)), a);
  }`,cQ=2;function pGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t,l=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,c=new Mi(2,2),d=new Map,u=()=>{const P=new Vt(c,new rl({uniforms:{uHalf:{value:new On},uExtent:{value:new On},uRadius:{value:1},uPx:{value:.01},uT:{value:2},uReach:{value:1},uFade:{value:1},uFill:{value:rGr},uLine:{value:sGr}},vertexShader:cGr,fragmentShader:dGr,transparent:!0,depthWrite:!1,fog:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));P.rotation.order="YXZ",P.frustumCulled=!1,r.add(P);const F=performance.now();return{mesh:P,foot:null,selectedAtMs:F,lastSelectedMs:F}},h=(P,F)=>{r.remove(F.mesh),F.mesh.material.dispose(),d.delete(P)};t.planningAids.push(function*(){for(const P of d.values())yield P.mesh});const f=(P,F,B,H,z)=>{const L=P.mesh.material.uniforms;ec.set(F.x,F.y,F.z);const $=ec.distanceTo(H.position)*2*Math.tan(H.fov*Math.PI/360)/Math.max(1,z),O=Math.min(F.halfX,F.halfZ),W=Math.max(O*YWr,XWr*$),U=F.halfX+W,V=F.halfZ+W,G=Math.max(O*tGr,eGr*$),Z=G+nGr*$;L.uHalf.value.set(U,V),L.uExtent.value.set(U+Z,V+Z),L.uRadius.value=Math.min(Math.min(U,V)*JWr,Math.max(W*1.6,QWr*$)),L.uPx.value=$,L.uReach.value=G;const se=B-P.selectedAtMs;L.uT.value=l?2:se/qWr,L.uFade.value=l?1:Math.min(1,se/KWr),P.mesh.position.set(F.x,F.y+$*.6,F.z),P.mesh.rotation.set(-Math.PI/2,F.yaw,0),P.mesh.scale.set(U+Z,V+Z,1)},m=(P,F)=>{const B=a.domElement;let H=1/0,z=-1/0,L=1/0,$=-1/0;const O=()=>{if(ec.project(s),ec.z>1)return;const U=(ec.x*.5+.5)*B.clientWidth,V=(-ec.y*.5+.5)*B.clientHeight;H=Math.min(H,U),z=Math.max(z,U),L=Math.min(L,V),$=Math.max($,V)};if(P.forEach((U,V)=>{const G=F[V];if(!G){const X=o.get(U);X&&(X.getWorldPosition(ec),O());return}const Z=Math.cos(G.yaw),se=Math.sin(G.yaw);for(let X=0;X<8;X++){const te=(X&1?1:-1)*G.halfX,ne=(X&2?1:-1)*G.halfZ;ec.set(G.x+Z*te+se*ne,X&4?G.top:G.y,G.z-se*te+Z*ne),O()}}),H===1/0)return null;let W=0;ec.set(0,0,0);for(const U of P){const V=o.get(U);V&&(ec.add(V.getWorldPosition(iGr)),W++)}if(ec.divideScalar(Math.max(1,W)).project(s),W>0&&ec.z<=1){const U=(ec.x*.5+.5)*B.clientWidth,V=(-ec.y*.5+.5)*B.clientHeight,G=B.clientHeight*GWr;H=Math.min(H,U-G),z=Math.max(z,U+G),L=Math.min(L,V-G),$=Math.max($,V+G)}return{left:Math.round(H),right:Math.round(z),top:Math.round(L),bottom:Math.round($)}},g=P=>{const F=n.selectionScreenBounds.peek();P===F||P&&F&&P.left===F.left&&P.right===F.right&&P.top===F.top&&P.bottom===F.bottom||n.selectionScreenBounds.set(P)},b=()=>{const P=e.isEditView()?n.selectedIds.peek().slice(0,WWr):[],F=performance.now();for(const[H,z]of d)P.includes(H)?z.lastSelectedMs=F:F-z.lastSelectedMs>ZWr?h(H,z):(z.foot=null,z.mesh.visible=!1);const B=[];for(const H of P){const z=o.get(H),L=z?lGr(z):null;B.push(L);let $=d.get(H);if(!L){$&&($.foot=null,$.mesh.visible=!1);continue}$||($=u(),d.set(H,$)),$.foot=L,$.mesh.visible=!0,f($,L,F,s,a.domElement.clientHeight)}g(m(P,B))},y=new tl({color:16777215,fog:!1,side:Fc}),v=new Map,x=new rl({uniforms:{tMask:{value:null},uTexel:{value:new On},uWidth:{value:1}},vertexShader:uGr,fragmentShader:hGr,transparent:!0,depthTest:!1,depthWrite:!1}),w=new Kh,k=new Vt(c,x);k.frustumCulled=!1,w.add(k);const S=new Ahe,T=new On,A=new hr,C=(P,F,B)=>{let H=v.get(P);if(!e.strokeEnabled()){H?.target?.dispose(),v.delete(P);return}const z=[];for(const X of B){const te=o.get(X);te&&aGr(te,ne=>z.push(ne))}if(z.length===0)return;P.getDrawingBufferSize(T);const L=Math.min(1,VWr/T.y),$=Math.ceil(T.x*L/lQ)*lQ,O=Math.ceil(T.y*L/lQ)*lQ;H||(H={target:null,shouldRealloc:dKt(zWr,()=>performance.now())},v.set(P,H));const W=H.shouldRealloc($,O,H.target!==null);(!H.target||W&&(H.target.width!==$||H.target.height!==O))&&(H.target?.dispose(),H.target=new Wh($,O,{samples:UWr,depthBuffer:!1,generateMipmaps:!0,minFilter:wv}));const U=H.target;for(const X of z)X.layers.enable(cQ);r.traverse(X=>{X instanceof yS&&X.layers.enable(cQ)});const{fog:V}=r,{autoClear:G}=P,Z=P.getClearAlpha(),se=F.layers.mask;P.getClearColor(A),r.fog=null,r.overrideMaterial=y,F.layers.set(cQ);try{P.setRenderTarget(U),P.setClearColor(0,0),P.autoClear=!0,P.render(r,F);const X=x.uniforms;X.tMask.value=U.texture,X.uTexel.value.set(1/U.width,1/U.height),X.uWidth.value=$Wr*P.getPixelRatio()*(U.height/T.y),P.setRenderTarget(null),P.setClearColor(A,Z),P.autoClear=!1,P.render(w,S)}finally{F.layers.mask=se,r.overrideMaterial=null,r.fog=V,P.setRenderTarget(null),P.setClearColor(A,Z),P.autoClear=G;for(const X of z)X.layers.disable(cQ)}},E=()=>{if(!e.isEditView())return;const P=[...n.selectedIds.peek()],F=e.hoveredId();F&&!P.includes(F)&&P.push(F),C(a,s,P)},j=(P,F)=>{e.isEditView()&&C(P,F,n.selectedIds.peek())},I=P=>{v.get(P)?.target?.dispose(),v.delete(P)},N=(P,F)=>{const B=performance.now(),H=[];for(const z of d.values())z.foot&&(f(z,z.foot,B,P,F),z.mesh.visible=!0,H.push(z.mesh));return()=>{for(const z of H)z.visible=!1}};return t.disposers.push(()=>{for(const[P,F]of d)h(P,F);c.dispose(),y.dispose(),x.dispose();for(const{target:P}of v.values())P?.dispose()}),{tick:b,drawStroke:E,strokeSelection:j,forgetStroke:I,showSelectionRings:N}}const fGr="<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='9' cy='9' r='5' fill='white' stroke='%23141824' stroke-opacity='.6'/></svg>",mGr=`url("data:image/svg+xml,${fGr}") 9 9, default`,gGr="none",bGr=20,yGr=.78,vGr=90,xGr=5,wGr=70,jot=900,_Gr=2,kGr=33,SGr=`
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,TGr=`
  varying vec2 vP;
  uniform float uBig;
  void main() {
    float r = length(vP), aa = fwidth(r);
    float R = mix(0.62, 0.86, uBig);
    float ring = 1.0 - smoothstep(0.045 - aa, 0.045 + aa, abs(r - R));
    float halo = 1.0 - smoothstep(0.10 - aa, 0.10 + aa, abs(r - R));
    float dot_ = 1.0 - smoothstep(0.13 - aa, 0.13 + aa, r);
    float dotHalo = 1.0 - smoothstep(0.2 - aa, 0.2 + aa, r);
    float w = max(ring, dot_);
    float s = 0.3 * max(halo, dotHalo) * (1.0 - w);
    float a = w + s + 0.1 * (1.0 - smoothstep(R - aa, R + aa, r)) * (1.0 - w - s);
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(vec3(0.09, 0.11, 0.18), vec3(1.0), w + 0.1 * (1.0 - s)), a);
  }`,AGr=`
  varying vec2 vP;
  uniform float uT;
  void main() {
    float e = 1.0 - pow(1.0 - uT, 3.0), r = length(vP), aa = fwidth(r);
    float a = (1.0 - smoothstep(0.02 - aa, 0.02 + aa, abs(r - e * 0.94))) * pow(1.0 - uT, 1.5);
    if (a < 0.003) discard;
    gl_FragColor = vec4(vec3(1.0), a);
  }`,Iot=new Ge(0,0,1);function Mot(t,e){const n=new Vt(new Mi(2,2),new rl({uniforms:e,vertexShader:SGr,fragmentShader:t,transparent:!0,depthTest:!1,depthWrite:!1,side:Fc}));return n.visible=!1,n.frustumCulled=!1,n}function CGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t,l=a.domElement,c=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,d=Mot(TGr,{uBig:{value:0}}),u=Mot(AGr,{uT:{value:2}});r.add(d,u),t.planningAids.push(()=>[d,u]);const h=new Bv,f=new On,m=new Ge,g=new Ge;let b=!1,y=null;const v={x:0,y:0,inside:!1,stale:!1,touch:!1};let x=null,w=!1,k=0,S=-1/0,T="",A=performance.now();const C=new $r;let E=-1/0,j=0;const I=W=>W.distanceTo(s.position)*2*Math.tan(s.fov*Math.PI/360)/Math.max(1,l.clientHeight),N=(W,U)=>(W.face?U.copy(W.face.normal).transformDirection(W.object.matrixWorld):s.getWorldDirection(U).negate(),U),P=()=>{const W=l.getBoundingClientRect();f.set((v.x-W.left)/W.width*2-1,-((v.y-W.top)/W.height)*2+1),h.setFromCamera(f,s);const U=h.intersectObjects([...o.values()],!0)[0],V=h.intersectObject(e.floor,!1)[0],G=U&&(!V||U.distance<=V.distance)?U:V;if(b=!!G,G&&(m.copy(G.point),N(G,g)),y=null,G===U&&U){let Z=U.object;for(;Z&&Z.userData.objectId===void 0;)Z=Z.parent;const se=Z?.userData.objectId;se&&(y=JEe(n.objects.peek(),se,n.selectedId.peek()))}},F=()=>{const W=performance.now(),U=W-A;A=W;const V=e.isEditView()&&n.editInteraction.peek()==="idle"&&!n.draggingAction.peek()&&!n.draggingComponent.peek(),G=V&&v.inside&&!v.touch,Z=e.gizmoHot();(!C.equals(s.matrixWorld)||n.isPreviewPlaying.peek()||n.isPerformancePlaying.peek())&&(C.copy(s.matrixWorld),v.stale=!0),!G||Z||w?(b=!1,y=null):v.stale&&(j<_Gr||W-E>=kGr)&&(v.stale=!1,P(),E=W,j=performance.now()-W),k+=((y?1:0)-k)*Math.min(1,U/vGr),d.visible=G&&b,d.visible&&(d.position.copy(m),d.quaternion.setFromUnitVectors(Iot,g),d.scale.setScalar(bGr*I(m)*(x?yGr:1)),d.material.uniforms.uBig.value=k);const se=!V||v.touch?"":d.visible?gGr:mGr;l.style.cursor!==se&&(l.style.cursor===T||l.style.cursor==="")&&(l.style.cursor=se,T=se),u.visible=!c&&W-S<jot,u.visible&&(u.material.uniforms.uT.value=(W-S)/jot)},B=W=>{u.position.copy(W.point),u.quaternion.setFromUnitVectors(Iot,N(W,new Ge)),u.scale.setScalar(wGr*I(W.point)),S=performance.now()},H=W=>{v.x=W.clientX,v.y=W.clientY,v.inside=!0,v.touch=W.pointerType==="touch",v.stale=!0,x&&Math.hypot(W.clientX-x.x,W.clientY-x.y)>xGr&&(w=!0)},z=W=>{v.touch=W.pointerType==="touch",x={x:W.clientX,y:W.clientY}},L=()=>{x=null,w=!1,v.stale=!0},$=()=>{v.inside=!1},O=()=>{v.stale=!0};return l.addEventListener("pointermove",H),l.addEventListener("pointerdown",z),l.addEventListener("pointerleave",$),l.addEventListener("wheel",O,{passive:!0}),window.addEventListener("pointerup",L),window.addEventListener("pointercancel",L),t.disposers.push(n.objects.onChange(()=>{v.stale=!0})),t.disposers.push(()=>{l.removeEventListener("pointermove",H),l.removeEventListener("pointerdown",z),l.removeEventListener("pointerleave",$),l.removeEventListener("wheel",O),window.removeEventListener("pointerup",L),window.removeEventListener("pointercancel",L);for(const W of[d,u])r.remove(W),W.geometry.dispose(),W.material.dispose()}),{tick:F,rippleAt:B,hoveredId:()=>y}}const EGr=Math.PI/180;function jGr(t,e){const{a:n,meshById:r}=t;let s={tracks:[],durationS:0},a=!0;function o(){s=rx(n.show.peek())}o(),t.disposers.push(qt(()=>{n.show.get(),o(),a=!0}));let l=null,c=null,d=null,u=0,h=null,f=0,m=null,g=!1;function b(ve){for(const ke of s.tracks){const Ae=ke.items.find(Se=>Se.item.id===ve.itemId);if(Ae)return Ae.startS}return 0}t.disposers.push(qt(()=>{const ve=n.playSession.get()?.recording??!1;ve&&h===null?(h=0,f=b(n.playSession.peek()),m=null):ve||(h=null)})),t.disposers.push(qt(()=>{const ve=n.isPerformancePlaying.get();d=ve?n.performanceSeekS.peek()??0:null,ve&&(u=s.durationS)}));function y(){return h!==null?f+h:l!==null?l:d!==null?d:n.performanceSeekS.peek()??0}const v=new Bv;v.camera=t.camera;const x=new Ge(0,-1,0),w=new Ge;function k(ve,ke,Ae){v.set(w.set(ve,ke,Ae),x);const Se=v.intersectObjects(e.walkableSurfaces(),!0)[0];return Se?Se.point.y:null}const S={x:new Ge(1,0,0),y:new Ge(0,1,0),z:new Ge(0,0,1)},T=new Ge,A=new qn,C=new Ge,E=new va,j=new va,I=new qn,N=new Ge,P=new Ge,F=new Ge,B=new qn,H=new va;function z(ve){const ke=n.objects.peek(),Ae=ve?ke[ve]:void 0;if(Ae){const me=Zo(Ae,ke).position;P.set(me[0],me[1],me[2])}else P.set(0,0,0);const Se=ve?r.get(ve):void 0;Se?Se.getWorldPosition(N):N.copy(P)}function L(ve){const ke=n.objects.peek(),Ae=new Map;for(const Se of s.tracks){const me=ke[Se.characterId];if(!me||!Q0(me.kind))continue;const Te=q(Se,ve);Te&&Ae.set(Se.characterId,Te);const Le=r.get(Se.characterId);if(!Le||e.isMeshDragged(Le))continue;me.kind==="simple_figure"&&o$(Le,Kae(Se.items.map(tt=>tt.item),ve,me.headRotation,tt=>J(me,Se,tt))),T.set(me.position[0],me.position[1],me.position[2]),E.set(me.rotation[0],me.rotation[1],me.rotation[2]),A.setFromEuler(E),C.set(me.scale[0],me.scale[1],me.scale[2]);const Fe=Q(Se,ve,!el(me.kind));Fe!=="base"&&(Le.scale.copy(C),Fe!=="walk"&&(j.setFromQuaternion(A),Le.position.copy(T),Le.rotation.set(...GA([j.x,j.y,j.z],[E.x,E.y,E.z]))))}for(const[Se,{target:me,sinceS:Te}]of ce){const Le=ke[Se],Fe=r.get(Se);if(!Le||!Fe||e.isMeshDragged(Fe))continue;Fe.updateWorldMatrix(!0,!1),Fe.getWorldPosition(be),fe.set(0,0,-1).applyQuaternion(Fe.getWorldQuaternion(we));const tt=xM(Math.atan2(-fe.x,-fe.z),xe(Le,be.x,be.y,be.z),me);if(Le.kind==="humanoid"){Se!==e.rigPoseObjectId()&&Ae.set(Se,IZt(Ae.get(Se)??{},jZt(tt)));continue}const Oe=s.tracks.find($e=>$e.characterId===Se);if(!Oe)continue;const Je={sinceS:Te,headRotation:kje(tt)};o$(Fe,Kae(Oe.items.map($e=>$e.item),ve,Le.headRotation,$e=>$e===ve?Je:J(Le,Oe,$e)))}e.setRigOffsets(Ae)}const $=new Ge,O=new Ge,W=new va,U=new qn;let V=!1;const G=new Ge,Z=new qn,se=new va,X=new Ge;function te(ve,ke){if(!ve)return null;if(!V){V=!0,G.copy(T),Z.copy(A),se.copy(E),X.copy(C);try{const me=le(ve,ke);if(me)return me.position}finally{T.copy(G),A.copy(Z),E.copy(se),C.copy(X),V=!1}}const Ae=r.get(ve);if(Ae)return Ae.getWorldPosition(O),[O.x,O.y,O.z];const Se=n.objects.peek()[ve];return Se?[...Se.position]:null}function ne(ve,ke,Ae,Se){const me=n.objects.peek()[Se],Te=!!me&&el(me.kind)&&ve.aim==="subject"&&!!ve.subjectId,Le=me?.kind==="spotlight";let Fe=Te?null:te(ve.subjectId,Ae);if(Le&&Fe){const He=NP(ve.subjectId,n.objects.peek(),NIr);Fe=[Fe[0],Fe[1]+He,Fe[2]]}const tt=q2r(Te?{...ve,aim:"travel"}:ve,ke,Fe);if(Te&&tt.yawRad!==null){const He=Ee({subjectId:ve.subjectId,atS:Ae});He&&(tt.yawRad=xM(tt.yawRad,xe(me,...tt.position),He).bodyYawRad)}const Oe=r.get(Se),Je=Oe?.parent&&Oe.parent!==t.scene?Oe.parent:null;$.set(...tt.position),Je&&Je.worldToLocal($),T.copy($);let $e=0;Je&&(Je.getWorldQuaternion(U),W.setFromQuaternion(U,"YXZ"),$e=W.y);const Ue=Le?W.setFromQuaternion(A,"YXZ"):null,et=Z2r(tt,$e,Ue&&[Ue.x,Ue.y,Ue.z]);et&&(W.set(...et,"YXZ"),A.setFromEuler(W))}function Q(ve,ke,Ae){let Se="base";for(const me of ve.items){const{item:Te}=me;if(Te.kind==="play"&&!Ae){if(Te.samples.length===0)continue;if(ke<me.startS||(Se="walk",ke<me.endS))break;continue}if(Te.kind==="path"){if(Te.anchors.length<2)continue;if(ke<me.startS||(Se=Ae?"fold":"walk",ne(Te,Math.min(ke-me.startS,me.endS-me.startS),Math.min(ke,me.endS),ve.characterId),ke<me.endS))break;continue}if(!aN(Te)||Te.kind==="rig-transform")continue;if(ke<me.startS)break;Se="fold";const Le=Math.min(ke-me.startS,Te.durationS);if(Te.kind==="rotate")I.setFromAxisAngle(S[Te.axis],Te.degPerS*Le*EGr),A.multiply(I);else if(Te.kind==="scale")C.multiplyScalar(v2r(Te.factor,Le,Te.durationS));else if(Te.kind==="revolve"){z(Te.centerObjectId);const Fe=x2r([T.x-P.x,T.y-P.y,T.z-P.z],Te.degPerS*Le);T.set(N.x+Fe[0],N.y+Fe[1],N.z+Fe[2])}else if(Te.kind==="transform"){const Fe=Bzt(Te.keys,Le);Fe&&(T.set(Fe.position[0],Fe.position[1],Fe.position[2]),E.set(Fe.rotation[0],Fe.rotation[1],Fe.rotation[2]),A.setFromEuler(E),C.set(Fe.scale[0],Fe.scale[1],Fe.scale[2]))}if(ke<me.endS)break}return Se}function q(ve,ke){let Ae=null;for(const Se of ve.items){const{item:me}=Se;if(ke<Se.startS)break;if(me.kind==="rig-transform"){const Te=Math.min(ke-Se.startS,me.durationS);Ae=Vzt(me.keys,Te)??Ae}if(ke<Se.endS)break}return Ae}const Y=ve=>[ve.x,ve.y,ve.z,ve.w],re=new Ge,ae=new qn,ie=new Ge,ge=new va,pe=new $r,ce=new Map,be=new Ge,fe=new Ge,we=new qn;function Ee(ve){const ke=te(ve.subjectId,ve.atS);if(!ke)return null;const Ae=NP(ve.subjectId,n.objects.peek());return[ke[0],ke[1]+Ae,ke[2]]}const xe=(ve,ke,Ae,Se)=>[ke,Ae+CZt*ve.scale[1],Se];function J(ve,ke,Ae){const Se=eEe(ke,Ae).lookAt,me=Se&&Ee(Se),Te=me&&le(ke.characterId,Ae);if(!Te)return null;fe.set(0,0,-1).applyQuaternion(we.fromArray(Te.quaternion));const Le=xM(Math.atan2(-fe.x,-fe.z),xe(ve,...Te.position),me);return{sinceS:Se.sinceS,headRotation:kje(Le)}}function le(ve,ke){const Ae=n.objects.peek()[ve];if(!Ae)return null;T.set(Ae.position[0],Ae.position[1],Ae.position[2]),E.set(Ae.rotation[0],Ae.rotation[1],Ae.rotation[2]),A.setFromEuler(E),C.set(Ae.scale[0],Ae.scale[1],Ae.scale[2]);const Se=s.tracks.find(tt=>tt.characterId===ve),me=Se?Q(Se,ke,!el(Ae.kind)):"base";re.copy(T),ae.copy(A);const Te=Se?eEe(Se,ke):null,Le=el(Ae.kind)&&me!=="fold"?Te?.position:null;if(Le){const tt=Te.exactY?Le[1]:k(Le[0],Le[1]+Bne,Le[2])??Le[1],Oe=ztt(Te),Je=Oe&&!Oe.exact&&Te.lookAt?Ee(Te.lookAt):null,$e=Oe&&Je?xM(Oe.yawRad,xe(Ae,Le[0],tt,Le[2]),Je).bodyYawRad:Oe?.yawRad;return $e!==void 0&&ae.setFromEuler(ge.set(0,$e,0)),{position:[Le[0],tt,Le[2]],quaternion:Y(ae)}}const Fe=r.get(ve);return Fe?.parent&&Fe.parent!==t.scene&&(pe.compose(re,ae,ie.copy(C)),pe.premultiply(Fe.parent.matrixWorld),pe.decompose(re,ae,ie)),{position:[re.x,re.y,re.z],quaternion:Y(ae)}}function ue(ve,ke){const Ae=n.objects.peek();ce.clear();const Se=m===null||ve<m;m=ve;const me=e.livePlay(),Te=new Map;for(const Le of tyr(s,ve)){if(me?.characterId===Le.characterId)continue;const Fe=r.get(Le.characterId),tt=Ae[Le.characterId];if(!Fe||!tt||!el(tt.kind)||(tt.kind==="humanoid"&&Te.set(Le.characterId,{clip:Le.clip,timeS:Le.clipTimeS}),e.isMeshDragged(Fe)))continue;const Oe=Le.position;if(!Oe)continue;const Je=Fe.getWorldPosition(F).y;let $e;if(Le.exactY)$e=Oe[1];else if(Se)$e=k(Oe[0],Oe[1]+Bne,Oe[2])??Oe[1];else{const He=k(Oe[0],Je+Bne,Oe[2]);if(He===null)$e=Je;else{const qe=zzt(Je,He,Xae);$e=Je+(qe-Je)*(1-Math.exp(-ke/Uzt))}}let Ue=0;Fe.parent&&Fe.parent!==t.scene?(F.set(Oe[0],$e,Oe[2]),Fe.parent.worldToLocal(F),Fe.position.copy(F),Fe.parent.getWorldQuaternion(B),H.setFromQuaternion(B,"YXZ"),Ue=H.y):Fe.position.set(Oe[0],$e,Oe[2]);const et=ztt(Le);if(et?.exact)Fe.rotation.set(0,et.yawRad-Ue,0);else if(et){const He=Le.lookAt?Ee(Le.lookAt):null,qe=xe(tt,Oe[0],$e,Oe[2]),We=(He?xM(et.yawRad,qe,He).bodyYawRad:et.yawRad)-Ue;F.set(0,0,-1).applyQuaternion(Fe.quaternion);const dt=Math.atan2(-F.x,-F.z),mt=Wzt(dt,We,g?Math.PI:A2r*ke);Fe.rotation.set(0,mt,0),He&&ce.set(Le.characterId,{target:He,sinceS:Le.lookAt.sinceS})}else Se&&Fe.rotation.set(tt.rotation[0],tt.rotation[1],tt.rotation[2])}me&&Te.set(me.characterId,{clip:me.clip,timeS:null}),e.setPlaybackClips(Te),L(ve)}let oe=!1;function ye(){const ve=n.objects.peek(),ke=e.livePlay(),Ae=new Map;for(const[Se,me]of r){const Te=ve[Se];if(!(!Te||!Q0(Te.kind))){if(ke?.characterId===Se){Ae.set(Se,{clip:ke.clip,timeS:null});continue}e.isMeshDragged(me)||(me.position.set(Te.position[0],Te.position[1],Te.position[2]),me.rotation.set(Te.rotation[0],Te.rotation[1],Te.rotation[2]),me.scale.set(Te.scale[0],Te.scale[1],Te.scale[2]),Te.kind==="simple_figure"&&o$(me,Te.headRotation))}}m=null,e.setPlaybackClips(Ae)}const je={objectPoseAt:le,resetPerformersToStart:()=>{m=null,ue(0,0),oe=!0},startManualClock:ve=>{const ke=s.durationS,Ae=She(n.show.peek(),ke),Se=ve?.fromS??(ve?.bounded?Ae.fromS:0);return l=Se,n.performanceTimeS.set(Se),m=null,c=ve?.bounded&&ke>.05?Ae.toS:null,Se},stopManualClock:()=>{l=null,c=null},tick:ve=>{let ke=!1;if(l!==null&&(l+=ve,c!==null&&l>=c&&(l=c,c=null,ke=!0)),h!==null&&(h+=ve),d!==null&&(d+=ve,d>=u&&(n.stopPerformance(),n.isPreviewPlaying.set(!1))),l!==null||h!==null||d!==null||n.performanceSeekS.peek()!==null){const Se=y();n.performanceTimeS.set(Se),ue(Se,ve),oe=!0}else{n.performanceTimeS.set(0);const Se=new Map;for(const Te of s.tracks){const Le=q(Te,0);Le&&Se.set(Te.characterId,Le)}e.setRigOffsets(Se);const me=e.livePlay();(oe||me)&&(ye(),oe=me!==null)}a=!1,ke&&n.autoStopRecording()},poseNow:()=>{const ve=a||y()!==m;ve&&(m=null),g=ve;try{je.tick(0)}finally{g=!1}return ve}};return je}const IGr={position:"absolute",display:"none",pointerEvents:"none",zIndex:"1",border:"1px solid rgba(255,255,255,0.4)",boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)"};function MGr(t){const e=document.createElement("div");return Object.assign(e.style,IGr),t.appendChild(e),{show:n=>{e.style.display="block",e.style.left=`${n.left*100}%`,e.style.top=`${n.top*100}%`,e.style.width=`${n.width*100}%`,e.style.height=`${n.height*100}%`},hide:()=>{e.style.display="none"},dispose:()=>e.remove()}}const Not=11163135,NGr=16777215,Pot=6741503,PGr=.06,Rot=16763989,RGr=.075,FGr=.25,Fot=.09,xL=.02,OGr=.35,LGr=.6,DGr=3,BGr=new Ge,HGr=new Ge,$Gr=new Ge,VGr=new Ge;function 

/*==============================================================================
 * 18. Playback evaluator jGr — per-frame track item evaluation (poses, walk/fold, rig offsets)
 * source file: tmp_b/sel_shader_raw2.js
 ==============================================================================*/
ec4(vec3(1.0), a);
  }`,Iot=new Ge(0,0,1);function Mot(t,e){const n=new Vt(new Mi(2,2),new rl({uniforms:e,vertexShader:SGr,fragmentShader:t,transparent:!0,depthTest:!1,depthWrite:!1,side:Fc}));return n.visible=!1,n.frustumCulled=!1,n}function CGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t,l=a.domElement,c=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,d=Mot(TGr,{uBig:{value:0}}),u=Mot(AGr,{uT:{value:2}});r.add(d,u),t.planningAids.push(()=>[d,u]);const h=new Bv,f=new On,m=new Ge,g=new Ge;let b=!1,y=null;const v={x:0,y:0,inside:!1,stale:!1,touch:!1};let x=null,w=!1,k=0,S=-1/0,T="",A=performance.now();const C=new $r;let E=-1/0,j=0;const I=W=>W.distanceTo(s.position)*2*Math.tan(s.fov*Math.PI/360)/Math.max(1,l.clientHeight),N=(W,U)=>(W.face?U.copy(W.face.normal).transformDirection(W.object.matrixWorld):s.getWorldDirection(U).negate(),U),P=()=>{const W=l.getBoundingClientRect();f.set((v.x-W.left)/W.width*2-1,-((v.y-W.top)/W.height)*2+1),h.setFromCamera(f,s);const U=h.intersectObjects([...o.values()],!0)[0],V=h.intersectObject(e.floor,!1)[0],G=U&&(!V||U.distance<=V.distance)?U:V;if(b=!!G,G&&(m.copy(G.point),N(G,g)),y=null,G===U&&U){let Z=U.object;for(;Z&&Z.userData.objectId===void 0;)Z=Z.parent;const se=Z?.userData.objectId;se&&(y=JEe(n.objects.peek(),se,n.selectedId.peek()))}},F=()=>{const W=performance.now(),U=W-A;A=W;const V=e.isEditView()&&n.editInteraction.peek()==="idle"&&!n.draggingAction.peek()&&!n.draggingComponent.peek(),G=V&&v.inside&&!v.touch,Z=e.gizmoHot();(!C.equals(s.matrixWorld)||n.isPreviewPlaying.peek()||n.isPerformancePlaying.peek())&&(C.copy(s.matrixWorld),v.stale=!0),!G||Z||w?(b=!1,y=null):v.stale&&(j<_Gr||W-E>=kGr)&&(v.stale=!1,P(),E=W,j=performance.now()-W),k+=((y?1:0)-k)*Math.min(1,U/vGr),d.visible=G&&b,d.visible&&(d.position.copy(m),d.quaternion.setFromUnitVectors(Iot,g),d.scale.setScalar(bGr*I(m)*(x?yGr:1)),d.material.uniforms.uBig.value=k);const se=!V||v.touch?"":d.visible?gGr:mGr;l.style.cursor!==se&&(l.style.cursor===T||l.style.cursor==="")&&(l.style.cursor=se,T=se),u.visible=!c&&W-S<jot,u.visible&&(u.material.uniforms.uT.value=(W-S)/jot)},B=W=>{u.position.copy(W.point),u.quaternion.setFromUnitVectors(Iot,N(W,new Ge)),u.scale.setScalar(wGr*I(W.point)),S=performance.now()},H=W=>{v.x=W.clientX,v.y=W.clientY,v.inside=!0,v.touch=W.pointerType==="touch",v.stale=!0,x&&Math.hypot(W.clientX-x.x,W.clientY-x.y)>xGr&&(w=!0)},z=W=>{v.touch=W.pointerType==="touch",x={x:W.clientX,y:W.clientY}},L=()=>{x=null,w=!1,v.stale=!0},$=()=>{v.inside=!1},O=()=>{v.stale=!0};return l.addEventListener("pointermove",H),l.addEventListener("pointerdown",z),l.addEventListener("pointerleave",$),l.addEventListener("wheel",O,{passive:!0}),window.addEventListener("pointerup",L),window.addEventListener("pointercancel",L),t.disposers.push(n.objects.onChange(()=>{v.stale=!0})),t.disposers.push(()=>{l.removeEventListener("pointermove",H),l.removeEventListener("pointerdown",z),l.removeEventListener("pointerleave",$),l.removeEventListener("wheel",O),window.removeEventListener("pointerup",L),window.removeEventListener("pointercancel",L);for(const W of[d,u])r.remove(W),W.geometry.dispose(),W.material.dispose()}),{tick:F,rippleAt:B,hoveredId:()=>y}}const EGr=Math.PI/180;function jGr(t,e){const{a:n,meshById:r}=t;let s={tracks:[],durationS:0},a=!0;function o(){s=rx(n.show.peek())}o(),t.disposers.push(qt(()=>{n.show.get(),o(),a=!0}));let l=null,c=null,d=null,u=0,h=null,f=0,m=null,g=!1;function b(ve){for(const ke of s.tracks){const Ae=ke.items.find(Se=>Se.item.id===ve.itemId);if(Ae)return Ae.startS}return 0}t.disposers.push(qt(()=>{const ve=n.playSession.get()?.recording??!1;ve&&h===null?(h=0,f=b(n.playSession.peek()),m=null):ve||(h=null)})),t.disposers.push(qt(()=>{const ve=n.isPerformancePlaying.get();d=ve?n.performanceSeekS.peek()??0:null,ve&&(u=s.durationS)}));function y(){return h!==null?f+h:l!==null?l:d!==null?d:n.performanceSeekS.peek()??0}const v=new Bv;v.camera=t.camera;const x=new Ge(0,-1,0),w=new Ge;function k(ve,ke,Ae){v.set(w.set(ve,ke,Ae),x);const Se=v.intersectObjects(e.walkableSurfaces(),!0)[0];return Se?Se.point.y:null}const S={x:new Ge(1,0,0),y:new Ge(0,1,0),z:new Ge(0,0,1)},T=new Ge,A=new qn,C=new Ge,E=new va,j=new va,I=new qn,N=new Ge,P=new Ge,F=new Ge,B=new qn,H=new va;function z(ve){const ke=n.objects.peek(),Ae=ve?ke[ve]:void 0;if(Ae){const me=Zo(Ae,ke).position;P.set(me[0],me[1],me[2])}else P.set(0,0,0);const Se=ve?r.get(ve):void 0;Se?Se.getWorldPosition(N):N.copy(P)}function L(ve){const ke=n.objects.peek(),Ae=new Map;for(const Se of s.tracks){const me=ke[Se.characterId];if(!me||!Q0(me.kind))continue;const Te=q(Se,ve);Te&&Ae.set(Se.characterId,Te);const Le=r.get(Se.characterId);if(!Le||e.isMeshDragged(Le))continue;me.kind==="simple_figure"&&o$(Le,Kae(Se.items.map(tt=>tt.item),ve,me.headRotation,tt=>J(me,Se,tt))),T.set(me.position[0],me.position[1],me.position[2]),E.set(me.rotation[0],me.rotation[1],me.rotation[2]),A.setFromEuler(E),C.set(me.scale[0],me.scale[1],me.scale[2]);const Fe=Q(Se,ve,!el(me.kind));Fe!=="base"&&(Le.scale.copy(C),Fe!=="walk"&&(j.setFromQuaternion(A),Le.position.copy(T),Le.rotation.set(...GA([j.x,j.y,j.z],[E.x,E.y,E.z]))))}for(const[Se,{target:me,sinceS:Te}]of ce){const Le=ke[Se],Fe=r.get(Se);if(!Le||!Fe||e.isMeshDragged(Fe))continue;Fe.updateWorldMatrix(!0,!1),Fe.getWorldPosition(be),fe.set(0,0,-1).applyQuaternion(Fe.getWorldQuaternion(we));const tt=xM(Math.atan2(-fe.x,-fe.z),xe(Le,be.x,be.y,be.z),me);if(Le.kind==="humanoid"){Se!==e.rigPoseObjectId()&&Ae.set(Se,IZt(Ae.get(Se)??{},jZt(tt)));continue}const Oe=s.tracks.find($e=>$e.characterId===Se);if(!Oe)continue;const Je={sinceS:Te,headRotation:kje(tt)};o$(Fe,Kae(Oe.items.map($e=>$e.item),ve,Le.headRotation,$e=>$e===ve?Je:J(Le,Oe,$e)))}e.setRigOffsets(Ae)}const $=new Ge,O=new Ge,W=new va,U=new qn;let V=!1;const G=new Ge,Z=new qn,se=new va,X=new Ge;function te(ve,ke){if(!ve)return null;if(!V){V=!0,G.copy(T),Z.copy(A),se.copy(E),X.copy(C);try{const me=le(ve,ke);if(me)return me.position}finally{T.copy(G),A.copy(Z),E.copy(se),C.copy(X),V=!1}}const Ae=r.get(ve);if(Ae)return Ae.getWorldPosition(O),[O.x,O.y,O.z];const Se=n.objects.peek()[ve];return Se?[...Se.position]:null}function ne(ve,ke,Ae,Se){const me=n.objects.peek()[Se],Te=!!me&&el(me.kind)&&ve.aim==="subject"&&!!ve.subjectId,Le=me?.kind==="spotlight";let Fe=Te?null:te(ve.subjectId,Ae);if(Le&&Fe){const He=NP(ve.subjectId,n.objects.peek(),NIr);Fe=[Fe[0],Fe[1]+He,Fe[2]]}const tt=q2r(Te?{...ve,aim:"travel"}:ve,ke,Fe);if(Te&&tt.yawRad!==null){const He=Ee({subjectId:ve.subjectId,atS:Ae});He&&(tt.yawRad=xM(tt.yawRad,xe(me,...tt.position),He).bodyYawRad)}const Oe=r.get(Se),Je=Oe?.parent&&Oe.parent!==t.scene?Oe.parent:null;$.set(...tt.position),Je&&Je.worldToLocal($),T.copy($);let $e=0;Je&&(Je.getWorldQuaternion(U),W.setFromQuaternion(U,"YXZ"),$e=W.y);const Ue=Le?W.setFromQuaternion(A,"YXZ"):null,et=Z2r(tt,$e,Ue&&[Ue.x,Ue.y,Ue.z]);et&&(W.set(...et,"YXZ"),A.setFromEuler(W))}function Q(ve,ke,Ae){let Se="base";for(const me of ve.items){const{item:Te}=me;if(Te.kind==="play"&&!Ae){if(Te.samples.length===0)continue;if(ke<me.startS||(Se="walk",ke<me.endS))break;continue}if(Te.kind==="path"){if(Te.anchors.length<2)continue;if(ke<me.startS||(Se=Ae?"fold":"walk",ne(Te,Math.min(ke-me.startS,me.endS-me.startS),Math.min(ke,me.endS),ve.characterId),ke<me.endS))break;continue}if(!aN(Te)||Te.kind==="rig-transform")continue;if(ke<me.startS)break;Se="fold";const Le=Math.min(ke-me.startS,Te.durationS);if(Te.kind==="rotate")I.setFromAxisAngle(S[Te.axis],Te.degPerS*Le*EGr),A.multiply(I);else if(Te.kind==="scale")C.multiplyScalar(v2r(Te.factor,Le,Te.durationS));else if(Te.kind==="revolve"){z(Te.centerObjectId);const Fe=x2r([T.x-P.x,T.y-P.y,T.z-P.z],Te.degPerS*Le);T.set(N.x+Fe[0],N.y+Fe[1],N.z+Fe[2])}else if(Te.kind==="transform"){const Fe=Bzt(Te.keys,Le);Fe&&(T.set(Fe.position[0],Fe.position[1],Fe.position[2]),E.set(Fe.rotation[0],Fe.rotation[1],Fe.rotation[2]),A.setFromEuler(E),C.set(Fe.scale[0],Fe.scale[1],Fe.scale[2]))}if(ke<me.endS)break}return Se}function q(ve,ke){let Ae=null;for(const Se of ve.items){const{item:me}=Se;if(ke<Se.startS)break;if(me.kind==="rig-transform"){const Te=Math.min(ke-Se.startS,me.durationS);Ae=Vzt(me.keys,Te)??Ae}if(ke<Se.endS)break}return Ae}const Y=ve=>[ve.x,ve.y,ve.z,ve.w],re=new Ge,ae=new qn,ie=new Ge,ge=new va,pe=new $r,ce=new Map,be=new Ge,fe=new Ge,we=new qn;function Ee(ve){const ke=te(ve.subjectId,ve.atS);if(!ke)return null;const Ae=NP(ve.subjectId,n.objects.peek());return[ke[0],ke[1]+Ae,ke[2]]}const xe=(ve,ke,Ae,Se)=>[ke,Ae+CZt*ve.scale[1],Se];function J(ve,ke,Ae){const Se=eEe(ke,Ae).lookAt,me=Se&&Ee(Se),Te=me&&le(ke.characterId,Ae);if(!Te)return null;fe.set(0,0,-1).applyQuaternion(we.fromArray(Te.quaternion));const Le=xM(Math.atan2(-fe.x,-fe.z),xe(ve,...Te.position),me);return{sinceS:Se.sinceS,headRotation:kje(Le)}}function le(ve,ke){const Ae=n.objects.peek()[ve];if(!Ae)return null;T.set(Ae.position[0],Ae.position[1],Ae.position[2]),E.set(Ae.rotation[0],Ae.rotation[1],Ae.rotation[2]),A.setFromEuler(E),C.set(Ae.scale[0],Ae.scale[1],Ae.scale[2]);const Se=s.tracks.find(tt=>tt.characterId===ve),me=Se?Q(Se,ke,!el(Ae.kind)):"base";re.copy(T),ae.copy(A);const Te=Se?eEe(Se,ke):null,Le=el(Ae.kind)&&me!=="fold"?Te?.position:null;if(Le){const tt=Te.exactY?Le[1]:k(Le[0],Le[1]+Bne,Le[2])??Le[1],Oe=ztt(Te),Je=Oe&&!Oe.exact&&Te.lookAt?Ee(Te.lookAt):null,$e=Oe&&Je?xM(Oe.yawRad,xe(Ae,Le[0],tt,Le[2]),Je).bodyYawRad:Oe?.yawRad;return $e!==void 0&&ae.setFromEuler(ge.set(0,$e,0)),{position:[Le[0],tt,Le[2]],quaternion:Y(ae)}}const Fe=r.get(ve);return Fe?.parent&&Fe.parent!==t.scene&&(pe.compose(re,ae,ie.copy(C)),pe.premultiply(Fe.parent.matrixWorld),pe.decompose(re,ae,ie)),{position:[re.x,re.y,re.z],quaternion:Y(ae)}}function ue(ve,ke){const Ae=n.objects.peek();ce.clear();const Se=m===null||ve<m;m=ve;const me=e.livePlay(),Te=new Map;for(const Le of tyr(s,ve)){if(me?.characterId===Le.characterId)continue;const Fe=r.get(Le.characterId),tt=Ae[Le.characterId];if(!Fe||!tt||!el(tt.kind)||(tt.kind==="humanoid"&&Te.set(Le.characterId,{clip:Le.clip,timeS:Le.clipTimeS}),e.isMeshDragged(Fe)))continue;const Oe=Le.position;if(!Oe)continue;const Je=Fe.getWorldPosition(F).y;let $e;if(Le.exactY)$e=Oe[1];else if(Se)$e=k(Oe[0],Oe[1]+Bne,Oe[2])??Oe[1];else{const He=k(Oe[0],Je+Bne,Oe[2]);if(He===null)$e=Je;else{const qe=zzt(Je,He,Xae);$e=Je+(qe-Je)*(1-Math.exp(-ke/Uzt))}}let Ue=0;Fe.parent&&Fe.parent!==t.scene?(F.set(Oe[0],$e,Oe[2]),Fe.parent.worldToLocal(F),Fe.position.copy(F),Fe.parent.getWorldQuaternion(B),H.setFromQuaternion(B,"YXZ"),Ue=H.y):Fe.position.set(Oe[0],$e,Oe[2]);const et=ztt(Le);if(et?.exact)Fe.rotation.set(0,et.yawRad-Ue,0);else if(et){const He=Le.lookAt?Ee(Le.lookAt):null,qe=xe(tt,Oe[0],$e,Oe[2]),We=(He?xM(et.yawRad,qe,He).bodyYawRad:et.yawRad)-Ue;F.set(0,0,-1).applyQuaternion(Fe.quaternion);const dt=Math.atan2(-F.x,-F.z),mt=Wzt(dt,We,g?Math.PI:A2r*ke);Fe.rotation.set(0,mt,0),He&&ce.set(Le.characterId,{target:He,sinceS:Le.lookAt.sinceS})}else Se&&Fe.rotation.set(tt.rotation[0],tt.rotation[1],tt.rotation[2])}me&&Te.set(me.characterId,{clip:me.clip,timeS:null}),e.setPlaybackClips(Te),L(ve)}let oe=!1;function ye(){const ve=n.objects.peek(),ke=e.livePlay(),Ae=new Map;for(const[Se,me]of r){const Te=ve[Se];if(!(!Te||!Q0(Te.kind))){if(ke?.characterId===Se){Ae.set(Se,{clip:ke.clip,timeS:null});continue}e.isMeshDragged(me)||(me.position.set(Te.position[0],Te.position[1],Te.position[2]),me.rotation.set(Te.rotation[0],Te.rotation[1],Te.rotation[2]),me.scale.set(Te.scale[0],Te.scale[1],Te.scale[2]),Te.kind==="simple_figure"&&o$(me,Te.headRotation))}}m=null,e.setPlaybackClips(Ae)}const je={objectPoseAt:le,resetPerformersToStart:()=>{m=null,ue(0,0),oe=!0},startManualClock:ve=>{const ke=s.durationS,Ae=She(n.show.peek(),ke),Se=ve?.fromS??(ve?.bounded?Ae.fromS:0);return l=Se,n.performanceTimeS.set(Se),m=null,c=ve?.bounded&&ke>.05?Ae.toS:null,Se},stopManualClock:()=>{l=null,c=null},tick:ve=>{let ke=!1;if(l!==null&&(l+=ve,c!==null&&l>=c&&(l=c,c=null,ke=!0)),h!==null&&(h+=ve),d!==null&&(d+=ve,d>=u&&(n.stopPerformance(),n.isPreviewPlaying.set(!1))),l!==null||h!==null||d!==null||n.performanceSeekS.peek()!==null){const Se=y();n.performanceTimeS.set(Se),ue(Se,ve),oe=!0}else{n.performanceTimeS.set(0);const Se=new Map;for(const Te of s.tracks){const Le=q(Te,0);Le&&Se.set(Te.characterId,Le)}e.setRigOffsets(Se);const me=e.livePlay();(oe||me)&&(ye(),oe=me!==null)}a=!1,ke&&n.autoStopRecording()},poseNow:()=>{const ve=a||y()!==m;ve&&(m=null),g=ve;try{je.tick(0)}finally{g=!1}return ve}};return je}const IGr={position:"absolute",display:"none",pointerEvents:"none",zIndex:"1",border:"1px solid rgba(255,255,255,0.4)",boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)"};function MGr(t){const e=document.createElement("div");return Object.assign(e.style,IGr),t.appendChild(e),{show:n=>{e.style.display="block",e.style.left=`${n.left*100}%`,e.style.top=`${n.top*100}%`,e.style.width=`${n.width*100}%`,e.style.height=`${n.height*100}%`},hide:()=>{e.style.display="none"},dispose:()=>e.remove()}}const Not=11163135,NGr=16777215,Pot=6741503,PGr=.06,Rot=16763989,RGr=.075,FGr=.25,Fot=.09,xL=.02,OGr=.35,LGr=.6,DGr=3,BGr=new Ge,HGr=new Ge,$Gr=new Ge,VGr=new Ge;function UGr(t,e){const{a:n,scene:r,camera:s,renderer:a,meshById:o}=t;function l(){return XGt({viewportAspect:s.aspect,viewportHeightPx:n.container.clientHeight,recordAspect:Am(n.recordAspect.peek()).aspect})}function c(){const A=l(),C=35/Math.max(s.aspect,1);s.fov=2*Math.atan(A.fovScale*C/2/n.focalLengthMm.peek())*180/Math.PI,s.updateProjectionMatrix()}const d=MGr(n.container);t.disposers.push(d.dispose);function u(){if(n.mode.peek()!=="camera"){d.hide();return}const A=l();d.show({left:(1-A.widthFraction)/2,top:(1-A.heightFraction)/2,width:A.widthFraction,height:A.heightFraction})}t.disposers.push(qt(()=>{n.focalLengthMm.get(),n.recordAspect.get(),n.mode.peek()==="camera"&&c(),u()}));function h(A){const E=document.createElement("canvas");E.width=64,E.height=64;const j=E.getContext("2d");j.fillStyle="#ffffff",j.font="bold 40px sans-serif",j.textAlign="center",j.textBaseline="middle",j.fillText(A,64/2,64/2);const I=new lie(new mDe({map:new k4(E),depthTest:!1}));return I.scale.setScalar(.35),I}function f(A){for(const C of[...A.children])A.remove(C),C.traverse(E=>{E instanceof lie&&(E.material.map?.dispose(),E.material.dispose())}),Kd(C)}const m=new Ci;r.add(m);function g(){f(m)}function b(){const A=n.objects.peek();return n.show.peek().tracks.flatMap(C=>C.items.filter(g2).map(E=>({itemId:E.id,anchors:E.anchors,curve:Q2r(E),isFlown:!el(A[C.characterId]?.kind)})))}function y(){g(),t.pathEditPickables=[];const A=n.performancePaint.peek(),C=n.selectedSegment.peek()?.itemId;for(const E of b()){const j=A?.itemId===E.itemId;if(!j&&C!==E.itemId)continue;const I=new Ci,N=new tl({color:Not}),P=new tl({color:NGr});if(E.anchors.forEach((F,B)=>{const H=F.pos,z=j&&A?.selectedAnchor===B,L=new Vt(new Ku(z?Fot*1.4:Fot,12,8),z?P:N);if(L.position.set(H[0],H[1]+xL,H[2]),j&&(L.userData.pathAnchorIndex=B,t.pathEditPickables.push(L)),I.add(L),j&&E.isFlown&&(z||H[1]>FGr)){const O=H[1]+xL;I.add(new Lu(new Ii().setFromPoints([new Ge(H[0],0,H[2]),new Ge(H[0],O,H[2])]),new Dv({color:Rot})));const W=new Vt(new Ku(RGr,10,6),new tl({color:Rot}));W.position.set(H[0],IOr(H[1]),H[2]),W.userData.pathHeightAnchor=B,t.pathEditPickables.push(W),I.add(W)}const $=h(String(B+1));if($.position.set(H[0],H[1]+OGr,H[2]),I.add($),z){const O=new Ge(H[0],H[1]+xL,H[2]);["in","out"].forEach(W=>{const U=F[W],V=new Ge(H[0]+U[0],H[1]+U[1]+xL,H[2]+U[2]);I.add(new Lu(new Ii().setFromPoints([O,V]),new Dv({color:Pot})));const G=new Vt(new Ku(PGr,10,6),new tl({color:Pot}));G.position.copy(V),G.userData.pathHandle=W,G.userData.pathHandleAnchor=B,t.pathEditPickables.push(G),I.add(G)})}}),E.anchors.length>=2){const F=new Ii().setFromPoints(E.curve.map(B=>new Ge(B[0],B[1]+xL,B[2])));I.add(new Lu(F,new Dv({color:Not})))}m.add(I)}}y(),t.disposers.push(qt(()=>{n.show.get(),n.performancePaint.get(),n.selectedSegment.get(),y()})),t.disposers.push(()=>{g(),t.pathEditPickables=[]}),t.planningAids.push(()=>[m,...[...o.values()].filter(mZt)]);function v(){for(const A of o.values()){if(A.userData.kind!=="camera")continue;const C=A.userData.objectId,E=xq(n,C),j=yFr({framesMarkerNow:E,meshDragged:e.isMeshDragged(A)});if(!E){urt(A,{fovDeg:BU(n),aspect:Am(n.recordAspect.peek()).aspect,distance:DGr});continue}const I=LOr(t,C);if(!I)continue;const N=BGr.set(I[0],I[1],I[2]),P=A.getWorldPosition(HGr).distanceTo(N);P<1e-4||(j&&(A.lookAt(N),A.rotateY(Math.PI)),urt(A,{fovDeg:BU(n),aspect:Am(n.recordAspect.peek()).aspect,distance:Math.max(P,LGr)}))}}const x=new Set;function w(){const A=n.objects.peek();for(const[C,E]of Object.entries(A)){if(E.kind!=="camera")continue;if(!mFr(n,C)){x.delete(C);continue}if(x.has(C))continue;if(!E.rotation.every(P=>P===0)){x.add(C);continue}const j=o.get(C),I=j?Die(t,j):null;if(!j||!I)continue;const N=I.getWorldPosition($Gr);j.getWorldPosition(VGr).distanceTo(N)<1e-4||(x.add(C),j.lookAt(N),j.rotateY(Math.PI),n.updateObjectTransform(C,{rotation:[j.rotation.x,j.rotation.y,j.rotation.z]}))}}function k(){if(n.mode.peek()!=="edit")return;const A=n.objects.peek(),C=n.selectedId.peek(),E=n.focusedCameraId.peek();for(const j of o.values())j.userData.kind==="target"&&(j.visible=uZt(n,A,E,C,j.userData.objectId))}function S(){const A=n.container.clientWidth,C=n.container.clientHeight;A===0||C===0||(s.aspect=A/C,n.mode.peek()==="camera"?c():s.updateProjectionMatrix(),a.setSize(A,C,!1),u(),e.repaintViewport())}const T=new ResizeObserver(()=>S());return T.observe(n.container),t.disposers.push(()=>T.disconnect()),{applyCameraModeFov:c,updateFrameGuide:u,updateCameraMarkerVisual:v,tick:()=>{w(),v(),k()}}}const zGr=1.6,WGr=4.2,GGr=.7,qGr=18,ZGr=6,Oot=.0025,KGr=-.35,XGr=1.25,Lot=3.4,YGr=1.4,QGr=.2,JGr=.6,eqr=12,Dot=.3,tqr=[Xae+.1,1.3],nqr=2,rqr=120,sqr={0:"lmb",2:"rmb"};function aqr(t,e){const{a:n,camera:r,renderer:s,meshById:a}=t;let o=null,l=null,c=null,d=0,u=.3,h=0,f=!0,m=!1,g="idle",b=null,y=0;const v=new Set;let x=!1,w=[],k=0,S=!1;const T=new Bv,A=new Ge(0,-1,0),C=new Ge;function E(Y,re,ae){T.set(C.set(Y,re,ae),A);const ie=T.intersectObjects(e.walkableSurfaces(),!0)[0];return ie?ie.point.y:null}const j=new Bv,I=new Ge,N=new Ge,P=new Ge;function F(Y,re){if(!l)return null;const ae=Math.hypot(Y,re);N.set(Y/ae,0,re/ae);let ie=null;for(const ge of tqr){I.set(l.position.x,l.position.y+ge,l.position.z),j.set(I,N),j.far=ae+Dot;const pe=j.intersectObjects(e.walkableSurfaces(),!0)[0];pe?.fa

/*==============================================================================
 * 19. PATH STORE — addPathItem/enterPathEdit/appendPathAnchor/insertPathAnchor/movePathAnchor/setPathAnchorHeight/movePathHandle/deletePathAnchor
 * source file: tmp_b/path_store_impl.js
 ==============================================================================*/
aySession.set({...n,recording:e})};finishPlayRecording=e=>{const n=this.playSession.peek();!n||!this.findPlayItem(n)||this.updateTrackItems(n.trackId,r=>r.map(s=>s.id===n.itemId&&s.kind==="play"?{...s,samples:e,durationS:e.length/qA}:s))};addPathItem=(e,n,r)=>{if(!this.isAnimatableTrack(e))return null;const s=this.show.peek().tracks.find(l=>l.id===e).characterId,a=an(),o=this.isHumanoidTrack(e);return this.updateTrackItems(e,l=>[...l,{id:a,kind:"path",anchors:[],speedUnitsPerS:Htt,...o?{gait:JCe}:{},startS:this.placeItemS(l,0,n)}]),this.enterPathEdit(e,a),r?.seedStart!==!1&&this.seedPathStart(s),a};seedPathStart=e=>{const n=this.objects.peek(),r=n[e];r&&this.appendPathAnchor([...Zo(r,n).position])};enterPathEdit=(e,n)=>{this.selectedSegment.set({trackId:e,itemId:n}),this.performancePaint.set({trackId:e,itemId:n,selectedAnchor:null}),this.editInteraction.set("editingPath")};currentEditPathItem=()=>{const e=this.performancePaint.peek();if(!e)return null;const n=this.show.peek().tracks.find(r=>r.id===e.trackId)?.items.find(r=>r.id===e.itemId);return n&&g2(n)?n:null};patchPathAnchors=e=>{const n=this.performancePaint.peek();n&&this.updateTrackItems(n.trackId,r=>r.map(s=>{if(s.id!==n.itemId||!g2(s))return s;const a=e(s.anchors);if(s.kind==="cam-path"&&s.heightCurve&&!HHr(s.anchors,a)){const{heightCurve:o,...l}=s;return{...l,anchors:a}}return{...s,anchors:a}}))};setPathHeightCurve=(e,n,r)=>this.show.peek().tracks.find(a=>a.id===e)?.items.find(a=>a.id===n)?.kind!=="cam-path"||!Kzt(r)?!1:(this.updateTrackItems(e,a=>a.map(o=>o.id===n?{...o,heightCurve:r}:o)),!0);currentEditPathOwner=()=>{const e=this.performancePaint.peek(),n=e?this.show.peek().tracks.find(r=>r.id===e.trackId):void 0;return n?this.objects.peek()[n.characterId]??null:null};editingFlownPath=()=>{const e=this.currentEditPathOwner();return!!e&&!el(e.kind)};anchorPosFor=(e,n)=>{if(!this.editingFlownPath())return e;const r=this.currentEditPathItem()?.anchors??[],s=r[Math.min(Math.max(n,0),r.length-1)],a=this.currentEditPathOwner(),o=s?s.pos[1]:a?Zo(a,this.objects.peek()).position[1]:e[1];return[e[0],o,e[2]]};selectPathAnchor=e=>{const n=this.performancePaint.peek();n&&this.performancePaint.set({...n,selectedAnchor:e})};appendPathAnchor=(e,n)=>{const r=n?.exactHeight?e:this.anchorPosFor(e,(this.currentEditPathItem()?.anchors.length??1)-1);this.patchPathAnchors(a=>mT([...a.map(o=>o.pos),r]));const s=this.currentEditPathItem();s&&this.selectPathAnchor(s.anchors.length-1)};insertPathAnchor=(e,n)=>{const r=this.anchorPosFor(n,e);this.patchPathAnchors(s=>{const a=s.map(o=>o.pos);return a.splice(e+1,0,r),mT(a)}),this.selectPathAnchor(e+1)};movePathAnchor=(e,n)=>{const r=this.anchorPosFor(n,e);this.patchPathAnchors(s=>s.map((a,o)=>o===e?{...a,pos:r}:a))};setPathAnchorHeight=(e,n)=>{this.editingFlownPath()&&this.patchPathAnchors(r=>r.map((s,a)=>a===e?{...s,pos:[s.pos[0],n,s.pos[2]]}:s))};movePathHandle=(e,n,r,s)=>{const a=n==="out"?"in":"out",o=c=>c===0?0:-c,l=[o(r[0]),o(r[1]),o(r[2])];this.patchPathAnchors(c=>c.map((d,u)=>u===e?{...d,[n]:r,...s?.break?{}:{[a]:l}}:d))};deletePathAnchor=e=>{this.patchPathAnchors(n=>mT(n.filter((r,s)=>s!==e).map(r=>r.pos))),this.selectPathAnchor(null)};finishPerformancePaint=()=>{const e=this.performancePaint.peek();if(!e)return;this.performancePaint.set(null),this.editInteraction.peek()==="editingPath"&&this.editInteraction.set("idle");const n=this.show.peek().tracks.find(r=>r.id===e.trackId)?.items.find(r=>r.id===e.itemId);n&&g2(n)&&n.anchors.length<2&&this.removePerformanceItem(e.trackId,e.itemId)};updatePathItemSpeed=(e,n,r)=>{if(Number.isNaN(r))return;const s=Math.max(Qae,r);this.updateTrackItems(e,a=>a.map(o=>o.id===n&&g2(o)?{...o,speedUnitsPerS:s}:o))};updatePathItemGait=(e,n,r)=>{this.isHumanoidTrack(e)&&this.updateTrackItems(e,s=>s.map(a=>a.id===n&&a.kind==="path"?{...a,gait:r}:a))};updatePathItemAim=(e,n,r,s)=>{this.updateTrackItems(e,a=>a.map(o=>o.id===n&&o.kind==="path"?{...o,aim:r,...r==="subject"?{subjectId:s}:{}}:o))};replaceMoveFromSamples=(e,n,r,s)=>{const a=this.objects.peek(),o=a[e],l=o?.kind==="camera";if(!o||!(l||Q0(o.kind)))return!1;const c=vHr(r);if(!c)return!1;const d=this.trackIdOf(e)??this.addPerformanceTrack(e);if(!d)return!1;const u=Zo(o,a).position[1],h=mT(c.points.map(([v,x])=>[v,u,x])),f=s?.steady?l?YZt:Htt:Math.max(Qae,MR(nx(h))/c.durationS),m=this.moveSegmentOf(d,n),g=s?.focusId&&s.focusId!==e&&a[s.focusId]?s.focusId:null,b={id:an(),startS:Math.max(0,n),anchors:h,speedUnitsPerS:f,...s?.steady?{}:{pace:c.pace}},y=l?{...b,kind:"cam-path",aim:g?"subject":"locked",subjectId:g,...m&&"focalLengthMm"in m&&m.focalLengthMm!==void 0?{focalLengthMm:m.focalLengthMm}:{}}:{...b,kind:"path",...o.kind==="humanoid"?{gait:JCe}:{},...el(o.kind)?g?{aim:"subject",subjectId:g}:{}:{aim:"locked"}};return this.updateTrackItems(d,v=>[y,...v.filter(x=>x.id!==m?.id)]),!0};shiftPaths=(e,n,r)=>{const s=this.trackIdOf(e);return(s?this.show.peek().tracks.find(o=>o.id===s).items:[]).some(Eit)?(n===0&&r===0||this.updateTrackItems(s,o=>o.map(l=>Eit(l)?{...l,anchors:l.anchors.map(c=>({...c,pos:[c.pos[0]+n,c.pos[1],c.pos[2]+r]}))}:l)),!0):!1};setCameraFocus=(e,n,r)=>{const s=this.objects.peek();if(s[e]?.kind!=="camera"||n!==null&&(n===e||!s[n]))return!1;const o=this.trackIdOf(e)??this.addPerformanceTrack(e);if(!o)return!1;const l=this.show.peek().tracks.find(y=>y.id===o).items,c=this.moveSegmentOf(o,this.performanceTimeS.peek()),d=c?.kind==="cam-path"||c?.kind==="cam-move"&&yP.includes(c.move);if(c&&!d&&c.kind!=="cam-still")return!1;const u=c?Cit(c):null;if(n===null){if(!c||!u)return!1;const y=r?.lookingAt??this.subjectAimPoint(u,$6(c));y&&this.keepLookOnClear(e,c,l,y)}if(c&&d)return this.setCameraItemFields(o,c.id,{...c.kind==="cam-path"?{aim:"subject"}:{},subjectId:n}),!0;if(c?.kind==="cam-still"&&n===null)return this.setCameraItemFields(o,c.id,{subjectId:null}),!0;const h=c?.startS??0,f=rx({...this.show.peek(),tracks:this.show.peek().tracks.filter(y=>y.id!==o)}).durationS,m=l.find(y=>y.startS>h)?.startS??1/0,g=Math.min(m,Math.max(f,h+(c?yd(c):sje("still")))),b={id:c?.id??an(),kind:"cam-still",startS:h,durationS:Math.max(Ije,g-h),...c&&"focalLengthMm"in c&&c.focalLengthMm!==void 0?{focalLengthMm:c.focalLengthMm}:{},subjectId:n};return this.updateTrackItems(o,y=>[b,...y.filter(v=>v.id!==c?.id)]),!0};keepLookOnClear=(e,n,r,s)=>{if(!this.updateObjectTransform)return;n.kind==="cam-still"&&this.turnCameraToward(e,s);const a=this.objects.peek(),o=a[e]?.targetId,l=o?a[o]:void 0;if(!o||!l){this.updateObjectTransform(e,{lastAimPosition:s});return}r.some(d=>d.id!==n.id&&YN(d))||this.updateObjectTransform(o,{position:s$(l,a,s)})};cameraFocusId=e=>{const n=this.trackIdOf(e),r=n?this.moveSegmentOf(n,this.performanceTimeS.peek()):void 0;return r?Cit(r):null};walkerFocusId=e=>{const n=this.trackIdOf(e),r=n?this.moveSegmentOf(n,this.performanceTimeS.peek()):void 0;return r?.kind==="path"&&r.aim==="subject"?r.subjectId??null:null};setWalkerFocus=(e,n)=>{const r=this.objects.peek();if(!el(r[e]?.kind)||n!==null&&(n===e||!r[n]))return!1;const s=this.trackIdOf(e),a=s?this.moveSegmentOf(s,this.performanceTimeS.peek()):void 0;return!s||a?.kind!=="path"?!1:(this.updatePathItemAim(s,a.id,n?"subject":"travel",n),!0)};trackIdOf=e=>this.show.peek().tracks.find(n=>n.characterId===e)?.id??null;moveSegmentOf=(e,n)=>{const r=this.show.peek().tracks.find(o=>o.id===e),s=this.objects.peek()[r?.characterId??""]?.kind==="camera",a=(r?.items??[]).filter(o=>s?Fp(o):o.kind==="path"||o.kind==="play");return a.find(o=>n>=o.startS&&n<o.startS+yd(o))??a[0]};updateClipItem=(e,n,r)=>{this.updateTrackItems(e,s=>s.map(a=>{if(a.id!==n||a.kind!=="clip")return a;const o=r.clip??a.clip,l=r.durationS!==void 0&&!Number.isNaN(r.durationS)?Math.min(kHr,Math.max(_Hr,r.durationS)):r.clip?IDe(o):a.durationS;return{...a,clip:o,durationS:l}}))};removePerformanceItem=(e,n)=>{this.updateTrackItems(e,s=>s.filter(a=>a.id!==n)),this.performancePaint.peek()?.itemId===n&&this.finishPerformancePaint()};moveItem=(e,n,r)=>{if(Number.isNaN(r))ret

/*==============================================================================
 * 20. PATH DRAG INTERACTION (from pWr): En/Hn/Gr/zn pointer handlers + j2r nearest-segment
 * source file: tmp_b/path_store.js
 ==============================================================================*/
e=>Me.id===Ve.itemId);return st&&g2(st)?st.anchors:[]},En=(Ve,st)=>{if(n.editInteraction.peek()!=="editingPath"||t.pathEditPickables.length===0)return null;Ue.setFromCamera(_t(Ve,st),r);const Me=Ue.intersectObjects(t.pathEditPickables,!1)[0];if(!Me)return null;const Re=Me.object.userData;return Re.pathHandle==="in"||Re.pathHandle==="out"?{kind:"handle",index:Re.pathHandleAnchor,handle:Re.pathHandle}:typeof Re.pathHeightAnchor=="number"?{kind:"height",index:Re.pathHeightAnchor}:typeof Re.pathAnchorIndex=="number"?{kind:"anchor",index:Re.pathAnchorIndex}:null},Hn=Ve=>{if(Ve.button!==0)return;const st=En(Ve.clientX,Ve.clientY);st&&(bt=st.kind==="anchor"?{kind:"anchor",index:st.index,moved:!1}:st.kind==="height"?{kind:"height",index:st.index}:{kind:"handle",index:st.index,handle:st.handle},gt=o.enabled,o.enabled=!1,s.domElement.setPointerCapture(Ve.pointerId))},Gr=Ve=>{if(!bt)return;if(Ue.setFromCamera(_t(Ve.clientX,Ve.clientY),r),bt.kind==="anchor"){const Me=Ue.intersectObjects(e.walkableSurfaces(),!0)[0];if(!Me)return;bt.moved=!0,n.movePathAnchor(bt.index,[Me.point.x,Me.point.y,Me.point.z]);return}const st=sn()[bt.index];if(st){if(bt.kind==="height"){if(Pn.subVectors(r.position,pr.set(st.pos[0],st.pos[1],st.pos[2])).setY(0),Pn.lengthSq()<1e-8||(Pn.normalize(),Kt.setFromNormalAndCoplanarPoint(Pn,pr),!Ue.ray.intersectPlane(Kt,Ct)))return;n.setPathAnchorHeight(bt.index,MOr(Ct.y));return}rt.set(new Ge(0,1,0),-st.pos[1]),Ue.ray.intersectPlane(rt,Ct)&&n.movePathHandle(bt.index,bt.handle,[Ct.x-st.pos[0],0,Ct.z-st.pos[2]],{break:Ve.altKey})}},zn=Ve=>{if(!bt)return;const st=bt;bt=null,o.enabled=gt,s.domElement.hasPointerCapture(Ve.pointerId)&&s.domElement.releasePointerCapture(Ve.pointerId),st.kind==="anchor"&&!st.moved&&n.selectPathAnchor(st.index),st.kind==="height"&&n.selectPathAnchor(st.index)},br=Ve=>{et=Ve.button===0?{x:Ve.clientX,y:Ve.clientY}:null,He=0,Ve.button===0&&n.editInteraction.peek()==="lasso"&&(qe={x:Ve.clientX,y:Ve.clientY},dt(Ve.clientX,Ve.clientY),s.domElement.setPointerCapture(Ve.pointerId))},Nr=Ve=>{qe&&dt(Ve.clientX,Ve.clientY),et&&(He=Math.max(He,Math.hypot(Ve.clientX-et.x,Ve.clientY-et.y)))},ua=Ve=>{if(Ve.button!==0)return;if(N){N=!1;const It=et&&Math.hypot(Ve.clientX-et.x,Ve.clientY-et.y)<=Sye;if(et=null,It&&h(Ve)){const pn=n.selectedId.peek();pn&&e.focusObject(pn)}return}if(bt){et=null;return}if(qe){const It=qe;qe=null,n.lassoRect.set(null),s.domElement.hasPointerCapture(Ve.pointerId)&&s.domElement.releasePointerCapture(Ve.pointerId),et=null,Math.hypot(Ve.clientX-It.x,Ve.clientY-It.y)>Sye&&(jt(It,{x:Ve.clientX,y:Ve.clientY}),n.editInteraction.set("idle"));return}if(!et||n.mode.peek()!=="edit"||c.dragging||n.playSession.peek()!==null){et=null;return}const st=He;if(et=null,st>Sye)return;const Me=s.domElement.getBoundingClientRect(),Re=new On((Ve.clientX-Me.left)/Me.width*2-1,-((Ve.clientY-Me.top)/Me.height)*2+1);if(Ue.setFromCamera(Re,r),n.editInteraction.peek()!=="idle"){const It=Ue.intersectObjects(e.walkableSurfaces(),!0)[0];if(!It)return;{const pn=[It.point.x,It.point.y,It.point.z],Tt=n.performancePaint.peek(),fn=Tt?n.show.peek().tracks.flatMap(Ns=>Ns.items).find(Ns=>Ns.id===Tt.itemId):void 0,on=fn&&g2(fn)?fn.anchors:[],Es=j2r(on,pn);Es&&Es.distance<Qzr?n.insertPathAnchor(Es.segmentIndex,pn):n.appendPathAnchor(pn)}return}if(t.rigJointPickables.length>0){const It=Ue.intersectObjects(t.rigJointPickables,!1)[0];if(It){const pn=It.object.userData.rigJoint,Tt=Ve.metaKey||Ve.ctrlKey||Ve.shiftKey,fn=e.rigHandles.selectedJoints();e.rigHandles.setSelectedJoints(Fzr(fn,pn,Tt)),B();return}}const At=Ue.intersectObjects([...a.values()],!0)[0],{selectionBefore:Dt,focusBefore:zt}=u;if(h(Ve)){const It=n.selectedId.peek();if(At&&It)e.focusObject(It);else{n.setSelectedIds(Dt),n.restoreFocus(zt);const pn=At??Ue.intersectObjects(e.walkableSurfaces(),!0)[0];pn&&e.centerViewOn(pn)}return}if(!At){n.selectObject(null);return}let Zt=At.object;for(;Zt&&Zt.userData.objectId===void 0;)Zt=Zt.parent;const Ht=Zt?.userData.objectId??null;if(!Ht){n.selectObject(null);return}const Yt=n.objects.peek(),mn=n.selectedId.peek(),Nt=JEe(Yt,Ht,mn);if(Ve.metaKey||Ve.ctrlKey){const It=mn&&Yt[mn]?.parentId?Nt:JEe(Yt,Ht,null);n.toggleSelect(Ve.altKey?Ht:It)}else Ve.altKey?n.selectObject(Ht):n.selectObject(Nt)},Qs=()=>{N=!1,et=null};s.domElement.addEventListener("pointerdown",br),s.domElement.addEventListener("pointermove",Nr),s.domElement.addEventListener("pointerup",ua),s.domElement.addEventListener("pointercancel",Qs),s.domElement.addEventListener("pointerdown",Hn,{capture:!0}),s.domElement.addEventListener("pointermove",Gr),s.domElement.addEventListener("pointerup",zn),t.disposers.push(()=>{s.domElement.removeEventListener("pointerdown",br),s.domElement.removeEventListener("pointermove",Nr),s.domElement.removeEventListener("pointerup",ua),s.domElement.removeEventListener("pointercancel",Qs),s.domElement.removeEventListener("pointerdown",Hn,{capture:!0}),s.domElement.removeEventListener("pointermove",Gr),s.domElement.removeEventListener("pointerup",zn)});const Sa=Hzr(n,()=>te);document.addEventListener("keydown",Sa),t.disposers.push(()=>document.removeEventListener("keydown",Sa));function Ma(Ve){if(n.mode.peek()==="camera")if(n.peekPhoneDelta()){e.applyPhoneAim(),G();const st=1-Math.exp(-Ve/Jzr);r.position.lerp(l.position,st),r.quaternion.slerp(l.quaternion,st)}else en(Ve),r.position.copy(l.position),r.quaternion.copy(l.quaternion);else if(te){const st=Z.has("shift")?Aye:1,Me=Tye*st*Ve;r.getWorldDirection(ie),ge.crossVectors(ie,r.up).normalize(),Z.has("w")&&r.position.addScaledVector(ie,Me),Z.has("s")&&r.position.addScaledVector(ie,-Me),Z.has("d")&&r.position.addScaledVector(ge,Me),Z.has("a")&&r.position.addScaledVector(ge,-Me),Z.has("q")&&(r.position.y-=Me),Z.has("e")&&(r.position.y+=Me)}else ha(Ve),Ye(Ve)}function ha(Ve){if(!ne()||c.dragging)return;const st=Number(Z.has("w"))-Number(Z.has("s")),Me=Number(Z.has("d"))-Number(Z.has("a")),Re=Number(Z.has("e"))-Number(Z.has("q"));if(st===0&&Me===0&&Re===0)return;const it=Z.has("shift")?Aye:1,ct=Tye*it*Ve;bot({forward:st,strafe:Me},ct,r.position,r.quaternion,o.target),r.position.y+=Re*ct,o.target.y+=Re*ct;const At=r.position.distanceTo(o.target);At>0&&e.addNavProgress("pan",ct/At)}function en(Ve){const st=Ht=>Z.has(Ht)?1:0,Me=WCr(gq[n.cameraRig.peek()],n.cameraWeight.peek());let Re=st("d")-st("a"),it=st("w")-st("s");const ct=Math.hypot(Re,it),At=Z.has("shift")?eWr:1;ct>0&&(Re*=At/Math.max(1,ct),it*=At/Math.max(1,ct));const Dt=O.value;if(V.setFromQuaternion(H.quaternion),$=JCr($,{stickX:Re,stickY:it,rig:Me,panDegPerS:n.cameraPanDegPerS.peek(),dtS:Ve}),!QCr($)){const[Ht,Yt]=$,mn=Ht.value*Ve,Nt=qCr(V.x,Yt.value*Ve);V.y+=mn,V.x+=Nt,H.quaternion.setFromEuler(V),O={...O,value:O.value+mn},W={...W,value:W.value+Nt}}O=RU(O,O.value+Yrt(O.value,V.y,1),Me.lookEaseS,Ve),W=RU(W,V.x,Me.lookEaseS,Ve),X.set(W.value,O.value,0),l.quaternion.setFromEuler(X);const zt=l.quaternion;L=YCr(L,{stickX:Re,stickY:it,vertical:st("e")-st("q"),aim:[zt.x,zt.y,zt.z,zt.w],rig:Me,speedMps:n.cameraSpeedMps.peek(),dtS:Ve});const Zt=XCr(L);l.position.x+=Zt[0]*Ve,l.position.y+=Zt[1]*Ve,l.position.z+=Zt[2]*Ve,U=nEr(U,{rig:Me,turnRadPerS:Yrt(Dt,O.value,Ve),sidewaysMps:tEr(Zt,O.value),topMps:n.cameraSpeedMps.peek(),dtS:Ve}),U.value&&(X.z=U.value,l.quaternion.setFromEuler(X))}function Ye(Ve){const st=n.navBallVector.peek();if(!st||n.mode.peek()!=="edit"||n.playSession.peek()!==null||st.forward===0&&st.strafe===0)return;const Me=Z.has("shift")?Aye:1,Re=Tye*Me*Ve;bot(st,Re,r.position,r.quaternion,o.target)}return{applyMode:$e,detachGizmo:()=>c.detach(),gizmoHot:()=>c.dragging||c.axis!==null,isDraggingMesh:Ve=>c.dragging&&NOr(Ve,c.object??null),tick:Ma,disposeControls:()=>{c.dispose(),z.dispose()}}}const oQ=new di;function fWr(t,e){const n={};for(const[r,s]of Object.entries(e)){const a=t[r];a&&(oQ.position.copy(s.position),oQ.quaternion.copy(s.quaternion),oQ.scale.copy(s.scale),n[r]=mBe(oQ,a))}return n}const Fje="float dotNL = saturate( dot( geometryNormal, directLight.direction ) );";na.lights_physical_pars_fragment.includes(Fje);na.lights_physical_pars_fragment=na.lights_physical_pars_fragment.replace(Fje,`${Fje}
    #ifdef SOFT_TERMINATOR
      dotNL = ( dotNL < 0.3 ? dotNL * dotNL / 0.6 : dotNL - 0.15 ) / 0.85;
    #endif`);function oKt(t){t.defines={...t.defines,SOFT_TERMINATOR:""}}const mWr=.5,gWr=24,bWr=24,yWr=[64,32],vWr=96;function xWr(t){return t==="sphere"||t==="cylinder"?t:"cube"}function wWr(t,e){const n=new Io({color:e??pq,roughness:X_}),r=t!=="cube";r&&oKt(n);const s=new Vt(lKt(t,!1),n);return s.userData.softTerminator=r,s.userData.primitiveKind=t,s}function lKt(t,e){const n=t==="sphere"?e?new Ku(.5,...yWr):new Ku(.5,32,16):t==="cylinder"?new Al(.5,.5,1,e?vWr:gWr):new mi(1,1,1);return n.translate(0,mWr,0),n}function _Wr(t,e){const n=t.userData.primitiveKind;if(!(t instanceof Vt)||!n||n==="cube")return;const r=Math.max(...e.map(Math.abs))>=bWr;r!==!!t.userData.bigPrimitive&&(t.userData.bigPrimitive=r,t.geometry.dispose(),t.geometry=lKt(n,r))}const Sot=.25,kWr=.25,Tot=.22;function SWr(t,e){for(const[n,r]of t)r.stopFading(),r.enabled=n===e}function Oje(t){t.traverse(e=>{e instanceof RR&&e.skeleton.dispose()})}function TWr(t,e,n){for(const r of[...t.children]){const s=r.userData.objectId;s&&n(s)&&e.add(r)}t.removeFromParent()}function Cye(t,e,n,r){const s=`${e}.${n}`,a=t.tracks.find(l=>l.name===s);return a?a.createInterpolant().evaluate(r):null}function Aot(t,e,n,r){const s=Uie(n),a=Cye(t,e,"position",r),o=Cye(t,e,"quaternion",r),l=Cye(t,e,"scale",r);return{position:a?new Ge(a[0],a[1],a[2]):s.position,quaternion:o?new qn(o[0],o[1],o[2],o[3]):s.quaternion,scale:l?new Ge(l[0],l[1],l[2]):s.scale}}function 

/*==============================================================================
 * 21. Stage base store iMr — add*/spawn slots/default names/ensureTargetMarker/addCameraMarker
 * source file: tmp_b/palette.js
 ==============================================================================*/
||!n.has(s)})}function bqt(){return _._({id:"4e78ft"})}class iMr{constructor(e={}){this.a=e}objects=Ne({});draggingComponent=Ne(null);objectsOrderVersion=Ne(0);selectedIds=Ne([]);selectedId=Ne(null);transformMode=Ne("translate");livePose=Ne(null);setSelection=e=>{this.selectedIds.set(e),this.selectedId.set(e.length?e[e.length-1]:null)};deselect=e=>{const n=this.selectedIds.peek();n.includes(e)&&this.setSelection(n.filter(r=>r!==e))};spawnIndex=0;clipboard=null;setDraggingComponent=e=>this.draggingComponent.set(e);clearDraggingComponent=()=>this.draggingComponent.set(null);addCube=()=>this.addObject("cube");addSphere=()=>this.addObject("sphere");addCylinder=()=>this.addObject("cylinder");addHumanoid=()=>this.addObject("humanoid",ere);addSimpleFigure=()=>this.addObject("simple_figure",Bst());addTarget=()=>this.addObject("target");addSpotlight=()=>this.addObject("spotlight");ensureTargetMarker=(e,n)=>{const r=this.objects.peek()[e];if(r?.kind!=="camera")return null;if(r.targetId&&this.objects.peek()[r.targetId])return r.targetId;const s=an();return this.objects[s].set({kind:"target",position:r.lastAimPosition??n,rotation:[0,0,0],scale:[1,1,1],name:r.lastAimName??this.defaultName("target")}),this.objects[e].set({...r,targetId:s}),s};dropTargetMarker=e=>{const n=this.objects.peek()[e];if(n?.kind!=="camera"||!n.targetId)return;const r=n.targetId,s=this.objects.peek()[r],{targetId:a,...o}=n;this.objects[e].set(s?{...o,lastAimPosition:[...s.position],...s.name?{lastAimName:s.name}:{}}:o),s&&this.remove(r)};addCameraMarker=e=>{const r=Object.values(this.objects.peek()).filter(c=>c.kind==="camera").length*nL,s=e?[e[0],e[1]]:[rL[0]+r,rL[2]],a=e?[e[0]+(sL[0]-rL[0]),e[1]+(sL[2]-rL[2])]:[sL[0]+r,sL[2]],o=[s[0],rL[1],s[1]],l=an();return this.objects[l].set({kind:"camera",position:o,rotation:kv(o,[a[0],sL[1],a[1]]),scale:[1,1,1],name:this.defaultName("camera")}),this.setSelection([l]),this.a.onObjectAdded?.("camera"),l};defaultName=(e,n)=>{const r=s=>`${s} ${Object.values(this.objects.peek()).filter(a=>a.kind===e).length+1}`;switch(e){case"cube":return r(_._({id:"/DQKHb"}));case"sphere":return r(_._({id:"01Lw5H"}));case"cylinder":return r(_._({id:"eawZbq"}));case"humanoid":return r(_._({id:"DhTbJv"}));case"simple_figure":return r(_._({id:"YUAoyO"}));case"camera":return r(_._({id:"rT2cV+"}));case"target":return r(_._({id:"Yrrg+y"}));case"spotlight":return r(_._({id:"k04a2t"}));case"prop":return n&&zh[n]?wU(n,_):void 0;default:return}};createObject=(e,n={},r={})=>this.addObject(e,n,void 0,r);addObject=(e,n={},r,s={})=>{const a=an();let o,l;if(r)[o,l]=r;else{const u=this.spawnIndex++%(V2e*rMr);o=u%V2e*nL-3,l=Math.floor(u/V2e)*nL}const c=e==="spotlight"?sGt([o,l]):{position:[o,UWt(e),l],rotation:[0,0,0]},d=n.name===void 0?this.defaultName(e,n.propKey):void 0;return this.objects[a].set({kind:e,...c,scale:[1,1,1],...d&&{name:d},...n}),s.select!==!1&&this.setSelection([a]),this.a.onObjectAdded?.(e,n.propKey),a};addComponent=(e,n)=>{switch(e.kind){case"cube":case"sphere

/*==============================================================================
 * 22. Scene-node/plan store rDr — selectedCamera (footer sliders), heightCurve editor, setLens/setCameraHeight, addCamera, items()/footprints
 * source file: tmp_b/stage_page_store_pretty.js
 ==============================================================================*/
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
  

/*==============================================================================
 * 23. Footer camera sliders hOa (Height/Lens log interp WFa/GFa) + scene editor panel uOa
 * source file: tmp_b/camera_sliders_ui.js
 ==============================================================================*/
rim():"",b=e||g;b&&n.renameScene?.(b);const y=s.idsByRef[EFa],v=!!y&&!r.aborted;return v&&n.lookThroughCamera?.(y),a.length>0&&!r.aborted&&(console.warn("[image-to-stage] steps that failed",a),n.onError?.(_._({id:"pEYD4D",values:{0:a.length,applied:o,total:l}}))),d||await h(),{built:d?o:0,framed:v,failed:a.length,failed_mid_run:!1,truncated:m}}function d4t(t,e){const n=t.map(r=>e.idsByRef[r]).filter(r=>!!r);return n.length===0?[]:[{tool:"stage_object",op:"delete",object_ids:n}]}const i0n=1040,DFa=126,BFa=420,o0n=240,u4t=8,l0n=30,j7=16,h4t=56,HFa=.8,$Fa=[.48,.96],VFa=.4,c0n=(t,e,n)=>Math.min(n,Math.max(e,t));function d0n(t,e){const[n,r]=$Fa;return Math.min(c0n(HFa*t,n,r),e/i0n)}function p4t(t,e,n){const r=d0n(t,e.widthPx),s=c0n(Math.floor((e.heightPx/r-n)/u4t)*u4t,o0n,BFa),a=e.heightPx/(n+s);return{scale:Math.min(r,Math.max(VFa,a)),planPx:s}}function UFa(t,e){return{widthPx:e.width-2*j7,heightPx:e.height-t-l0n-j7}}function zFa(t,e,n){const r=e.width-2*j7,s=c=>{const d=h4t+t.height*c,u=(n+o0n)*d0n(c,r);return d+l0n+u+j7<=e.height&&t.width*c<=r};let a=.1,o=1;if(s(o))a=o;else for(let c=0;c<24;c++){const d=(a+o)/2;s(d)?a=d:o=d}const l=a;return{x:e.width/2-(t.x+t.width/2)*l,y:h4t-t.y*l,zoom:l}}const Gze=1e3;function WFa(t,[e,n]){const r=Math.log(e)+Math.log(n/e)*t/Gze;return Math.round(Math.exp(r))}function GFa(t,[e,n]){return Math.round(Math.log(t/e)/Math.log(n/e)*Gze)}const qFa="_dock_188rr_5",ZFa="_panel_188rr_13",KFa="_header_188rr_24",XFa="_footer_188rr_25",YFa="_spacer_188rr_46",QFa="_cameraSliders_188rr_50",JFa="_slider_188rr_64",eOa="_sliderRow_188rr_120",tOa="_sliderValue_188rr_127",nOa="_plan_188rr_133",rOa="_tutorial_188rr_142",sOa="_addCamera_188rr_156",aOa="_rehearse_188rr_157",iOa="_record_188rr_158",oOa="_rehearseSlot_188rr_177",lOa="_tip_188rr_181",cOa="_quiet_188rr_216",dOa="_recordDot_188rr_252",Ll={dock:qFa,panel:ZFa,header:KFa,footer:XFa,spacer:YFa,cameraSliders:QFa,slider:JFa,sliderRow:eOa,sliderValue:tOa,plan:nOa,tutorial:rOa,addCamera:sOa,rehearse:aOa,record:iOa,rehearseSlot:oOa,tip:lOa,quiet:cOa,recordDot:dOa};function uOa({busy:t,rehearseTip:e,rehearsing:n,take:r,phone:s,phoneQr:a,onAddCameraClick:o,zoom:l,helpOpen:c,onHelpClick:d,tutorial:u,tutorialAtCurve:h,onOutsideTutorialPress:f,onOpenInStageClick:m,camera:g,onSliderDragStart:b,onSliderDragEnd:y,onHeightChange:v,onLensChange:x,onRehearseClick:w,onRecordClick:k,children:S,curve:T}){const A=n||r!==null,C=r?.elapsedS.toFixed(1),E=!!s&&r!==null&&!r.rendering,j=g?.name,I=p.useRef(null),N=p.useRef(null),P=p.useRef(null);return i.jsxs("section",{className:Ll.panel,"aria-label":_._({id:"JY7I6/"}),"data-scene-editor":!0,"data-scene-panel":!0,onPointerDownCapture:F=>{const B=F.target;u&&!N.current?.contains(B)&&!I.current?.contains(B)&&!(h&&P.current?.contains(B))&&f()},children:[i.jsxs("header",{className:Ll.header,children:[i.jsx("button",{type:"button",className:Ll.addCamera,disabled:t||A,onClick:o,children:i.jsx(M,{id:"tMxnfm"})}),i.jsx("span",{className:Ll.spacer}),l,i.jsx("button",{ref:I,type:"button",className:Ll.quiet,"aria-label":_._({id:"8AULTO"}),"aria-expanded":c,onClick:d,children:i.jsx(K,{name:"help",size:"sm"})}),i.jsxs("button",{type:"button",className:Ll.quiet,onClick:m,children:[i.jsx(M,{id:"jg7Bz/"}),i.jsx(K,{name:"arrow-up-right",size:"sm"})]})]}),i.jsxs("div",{className:Ll.plan,"data-scene-plan":!0,children:[S,u&&i.jsx("div",{ref:N,className:Ll.tutorial,"data-at-curve":h?"":void 0,children:u})]}),i.jsx("div",{ref:P,children:T}),i.jsxs("footer",{className:Ll.footer,children:[i.jsx(hOa,{camera:g,disabled:t||A||!!s,onDragStart:b,onDragEnd:y,onHeightChange:v,onLensChange:x}),i.jsx("span",{className:Ll.spacer}),i.jsxs("span",{className:Ll.rehearseSlot,children:[e&&i.jsx("span",{className:Ll.tip,role:"status",children:i.jsx(M,{id:"nJ6URF"})}),i.jsxs("button",{type:"button",className:Ll.rehearse,disabled:t||r!==null,onClick:w,children:[i.jsx(K,{name:n?"stop":"play",size:"sm"}),n?i.jsx(M,{id:"ygCKqB"}):i.jsx(M,{id:"oVNEk3"})]})]}),i.jsxs("button",{type:"button",className:Ll.record,"data-rolling":r&&!r.rendering?"":void 0,disabled:t||n||!!s&&s!=="linked"&&r===null||r!==null&&!E,onClick:k,children:[E?i.jsx(K,{name:"stop",size:"sm"}):i.jsx("i",{className:Ll.recordDot}),E?i.jsx(M,{id:"ygCKqB"}):r?r.rendering?i.jsx(M,{id:"mm0/Z0"}):i.jsx(M,{id:"GLwyHJ",values:{elapsed:C}}):j?i.jsx(M,{id:"VZt5a4",values:{cameraName:j}}):i.jsx(M,{id:"245JJx"})]})]}),a]})}function hOa({camera:t,disabled:e,onDragStart:n,onDragEnd:r,onHeightChange:s,onLensChange:a}){const o=p.useRef(t);t&&(o.current=t);const l=o.current,c=()=>{n();const h=()=>{window.removeEventListener("pointerup",h),window.removeEventListener("pointercancel",h),r()};window.addEventListener("pointerup",h),window.addEventListener("pointercancel",h)},d=l?.heightM.toFixed(1),u=l?.lensMm;return i.jsx("div",{className:Ll.cameraSliders,"data-hidden":t?void 0:"","aria-hidden":!t,children:l&&i.jsxs(i.Fragment,{children:[i.jsxs("label",{className:Ll.slider,children:[i.jsxs("span",{className:Ll.sliderRow,children:[i.jsx("span",{children:i.jsx(M,{id:"PFFhCT"})}),i.jsx("span",{className:Ll.sliderValue,children:i.jsx(M,{id:"yT0rs7",values:{height:d}})})]}),i.jsx("input",{type:"range",min:l.heightRangeM[0],max:l.heightRangeM[1],step:.1,value:l.heightM,disabled:e,onPointerDown:c,onChange:h=>s(Number(h.currentTarget.value))})]}),i.jsxs("label",{className:Ll.slider,children:[i.jsxs("span",{className:Ll.sliderRow,children:[i.jsx("span",{children:i.jsx(M,{id:"RxlKnY"})}),i.jsx("span",{className:Ll.sliderValue,children:i.jsx(M,{id:"oQGKgn",values:{lens:u}})})]}),i.jsx("input",{type:"range",min:0,max:Gze,value:GFa(l.lensMm,l.lensRangeMm),disabled:e,onPointerDown:c,onChange:h=>a(WFa(Number(h.currentTarget.value),l.lensRangeMm))})]})]})})}const f4t={help:"stage_node_help",focus:"stage_node_focus",height:"stage_node_height"};class pOa{constructor(e){this.a=e,this.seen=new Set(["help","focus","height"].filter(n=>e.seenTipIds.includes(f4t[n]))),this.disposers.push(qt(()=>this.a.setChatStageActive(this.stageLive.get())),qt(()=>{const n=this.openNodeId.get();n&&(this.a.activeViewId.get()!=="canvas"||!this.a.nodes[n].id.get())&&this.close()})),window.addEventListener("keydown",this.handleKeyDown),this.disposers.push(()=>window.removeEventListener("keydown",this.handleKeyDown))}openNodeId=Ne(null);openSceneId=Ne(()=>{const e=this.openNodeId.get();return e?this.a.nodes[e].data.sceneId.get()??null:null});stageLive=Ne(()=>this.a.activeViewId.get()==="stage"||this.openNodeId.get()!==null);tutorial=Ne(null);seen;replayFocus=!1;replayHeight=!1;disposers=[];open=e=>{if(this.openNodeId.peek()===e)return;const n=this.a.nodes[e]?.peek();n?.type===Ie.STAGE_SCENE&&this.a.openScene(n.data.sceneId)&&(this.keepStill(),this.a.mountStage(),this.openNodeId.set(e),this.a.frameNode(e),this.tutorial.set(null),!this.seen.has("help")&&!this.a.isBuilding(n.data.sceneId)&&this.showTutorial("help"),this.a.setKeyboardOwner?.("stage"),this.followFocus(!0),pt.capture("stage_node_action",{action:"open_panel",

/*==============================================================================
 * 24. Light control TQr/AQr — sun puck (irt/R8r), presets, nightLights toggle
 * source file: tmp_b/light_ui.js
 ==============================================================================*/
,disabled:t.disabled,className:Ze(l9.track,t.checked&&l9.trackOn),onClick:()=>t.onCheckedChange(!t.checked),children:i.jsx("span",{className:l9.thumb})})}function oQr(t){return i.jsx("span",{"aria-hidden":!0,className:Ze(l9.track,t.checked&&l9.trackOn),children:i.jsx("span",{className:l9.thumb})})}const lQr="_lightControl_1da1r_3",cQr="_window_1da1r_9",dQr="_body_1da1r_24",uQr="_hint_1da1r_32",hQr="_puck_1da1r_44",pQr="_horizon_1da1r_66",fQr="_hub_1da1r_74",mQr="_knob_1da1r_85",gQr="_knobGliding_1da1r_96",bQr="_nightLights_1da1r_106",yQr="_times_1da1r_116",vQr="_time_1da1r_116",l1={lightControl:lQr,window:cQr,body:dQr,hint:uQr,puck:hQr,horizon:pQr,hub:fQr,knob:mQr,knobGliding:gQr,nightLights:bQr,times:yQr,time:vQr},xQr=.5,olt=10,llt=5,wQr={ArrowLeft:[-olt,0],ArrowRight:[olt,0],ArrowUp:[0,llt],ArrowDown:[0,-llt]},$ye=8,_Qr=()=>[{label:_._({id:"ZkzXH7"}),elevationDeg:kDe.elevationDeg},{label:_._({id:"zq5FXT"}),elevationDeg:E8r},{label:_._({id:"us39LV"}),elevationDeg:j8r},{label:_._({id:"jnd7HN"}),elevationDeg:I8r}];function kQr(t){return t>=32?_._({id:"ZkzXH7"}):t>=12?_._({id:"JMSAW/"}):t>=0?_._({id:"iXm126"}):t>=-8?_._({id:"us39LV"}):t>=-20?_._({id:"/rXxL4"}):_._({id:"jnd7HN"})}const SQr=.5;function TQr({light:t,hasNightLights:e,peekViewYawDeg:n,onLightChange:r,onDragStart:s,onDragEnd:a}){const[o,l]=p.useState(!1),[c,d]=p.useState(!1),u=p.useRef(null);p.useEffect(()=>{if(!o)return;const f=g=>{u.current?.contains(g.target)||l(!1)},m=g=>{g.key==="Escape"&&l(!1)};return document.addEventListener("pointerdown",f),document.addEventListener("keydown",m),()=>{document.removeEventListener("pointerdown",f),document.removeEventListener("keydown",m)}},[o]);const h=_._({id:"iMaAjz"});return i.jsxs("div",{ref:u,className:l1.lightControl,children:[i.jsxs(Ws,{variant:"secondary","aria-expanded":o,onClick:()=>l(f=>!f),children:[i.jsx(K,{name:"sun",size:"xs"}),h]}),o&&i.jsxs("div",{className:Ze(Zr.hudWindow,l1.window),role:"dialog","aria-label":h,children:[i.jsx("div",{className:Zr.title,children:h}),i.jsxs("div",{className:l1.body,children:[i.jsx(AQr,{light:t,knobGliding:c,onKnobGlideEnd:()=>d(!1),peekViewYawDeg:n,onLightChange:r,onDragStart:s,onDragEnd:a}),i.jsx("div",{className:l1.times,children:_Qr().map(({label:f,elevationDeg:m})=>i.jsx("button",{className:l1.time,"aria-pressed":Math.abs(t.elevationDeg-m)<SQr,onClick:()=>{d(m!==t.elevationDeg),s(),r({...t,elevationDeg:m}),a()},children:f},m))}),e&&i.jsxs("div",{className:l1.nightLights,children:[i.jsx(M,{id:"dcBj6U"}),i.jsx(iQr,{checked:t.nightLights!==!1,label:_._({id:"dcBj6U"}),onCheckedChange:f=>{s(),r({...t,nightLights:f}),a()}})]}),i.jsx("p",{className:l1.hint,children:i.jsx(M,{id:"0YeIbL"})})]})]})]})}function AQr({light:t,knobGliding:e,onKnobGlideEnd:n,peekViewYawDeg:r,onLightChange:s,onDragStart:a,onDragEnd:o}){const[l,c]=p.useState(r),d=p.useRef(!1),u=()=>{d.current&&(d.current=!1,o())};p.useEffect(()=>()=>{d.current&&o()},[o]),p.useEffect(()=>{let m=0;const g=()=>{const b=r();c(y=>Math.abs(b-y)<xQr?y:b),m=requestAnimationFrame(g)};return m=requestAnimationFrame(g),()=>cancelAnimationFrame(m)},[r]);const h=m=>{const g=m.currentTarget.getBoundingClientRect(),b=g.width/2,y=b-$ye;return{x:(m.clientX-g.left-b)/y,y:(m.clientY-g.top-b)/y}},f=R8r(t,l);return i.jsxs("div",{className:l1.puck,role:"slider",tabIndex:0,"aria-label":_._({id:"niqoQr"}),"aria-valuemin":fq,"aria-valuemax":QA,"aria-valuenow":Math.round(t.elevationDeg),"aria-valuetext":kQr(t.elevationDeg),onPointerDown:m=>{m.currentTarget.setPointerCapture(m.pointerId),d.current=!0,n(),a(),s(irt(h(m),l))},onPointerMove:m=>{m.currentTarget.hasPointerCapture(m.pointerId)&&s(irt(h(m),l))},onPointerUp:u,onPointerCancel:u,onKeyDown:m=>{const g=wQr[m.key];g&&(m.preventDefault(),s({azimuthDeg:t.azimuthDeg+g[0],elevationDeg:t.elevationDeg+g[1]}))},children:[i.jsx("span",{className:l1.horizon}),i.jsx("span",{className:l1.hub}),i.jsx("span",{className:Ze(l1.knob,e&&l1.knobGliding),onTransitionEnd:n,style:{left:`calc(50% + (50% - ${$ye}px) * ${f.x})`,top:`calc(50% + (50% - ${$ye}px) * ${f.y})`}})]})}function CQr(t){const e=Ne(()=>Object.values(t.objects.get()).some(eKt));return{LightControl:Mt(()=>{const r=he(t.light),s=he(e),a=he(t.mode),o=he(t.recording),l=he(t.playSession);return a!=="edit"||o||l?null:i.jsx(TQr,{light:r,hasNightLights:s,peekViewYawDeg:t.viewYawDeg,onLightChange:t.adjustLight,onDragStart:t.beginEditGesture,onDragEnd:t.endEditGesture})})}}function EQr(t){const e=new z5r({surface:()=>A?"scene_node":"stage_page",actor:()=>t?.isAgentActingOnStage?.()?"agent":"user"}),n=new oKr({projectId:t?.projectId,saveTakes:t?.saveSceneTakes,onOpenCanvasNodes:t?.onOpenCanvasNodes,analytics:e});let r=null,s=!0;const a=Ne(!0),o=Ne(()=>a.get()&&!n.sceneNodeOpen.get()),l=rt=>{s=rt,a.set(rt),r?.setPaused(!rt),rt&&(y?.sceneTabsStore.refresh(),queueMicrotask(()=>j()))},c=new kIr({client:Ce,mode:n.mode,isRecording:n.isRecording,recordAspect:n.recordAspect,focalLengthMm:n.focalLengthMm,getSceneJson:n.toSceneJson,setRecording:n.han

/*==============================================================================
 * 25. Overlay JYr — edit toolbar (selection tools), add menu, PIP window, play HUD, hints
 * source file: tmp_b/overlay_body_pretty.js
 ==============================================================================*/
onPipCameraClick:B,onScreenshotClick:H,onRecordCameraClick:z,onFilmWithPhoneClick:L,onStopRecordingClick:$,onOpenCheatsheetClick:O,onOpenPreferencesClick:W,toolKeys:U,onAssetsClick:V,onAddComponentClick:G,onAddActionClick:Z
}){
const{
i18n:se
}=Ia(),X=s!==null,te=e==="cameras"&&t==="edit",[ne,Q]=p.useState(null),q=p.useRef(null),[Y,re]=p.useState(null),ae=p.useRef(null),ie=g!==null,ge=p.useRef(m);
m!==null&&(ge.current=m);
const pe=g??ge.current,ce=pe!==null&&S.includes(pe),fe=eZt(!te&&!x&&(ce||r&&(ie||m!==null))),we=p.useRef(null);
p.useEffect(()=>{
  const le=we.current,
  ue=le?.parentElement;
  if(!le||!ue)return;
  const oe=()=>{
    if(!d&&!f)return;
    const{
      x:ve,
      y:ke
    }=QXr({
        bounds:u.peek(),
        width:le.offsetWidth,
        height:le.offsetHeight,
        frameWidth:ue.clientWidth,
        frameHeight:ue.clientHeight
      });
    le.style.transform=`translate(${ve}px, ${ke}px)`
  },
  ye=qt(()=>{
      u.get(),
      oe()
    }),
  je=new ResizeObserver(oe);
  return je.observe(ue),
  ()=>{
    ye(),
    je.disconnect()
  }
},[u,
  r,
  te,
  x,
  d,
  f]),p.useEffect(()=>{
  const le=we.current;
  return le?JXr(le):void 0
},[r,
  te,
  x]);
const Ee=S.length===1&&k.length>1?k.find(le=>le.id===S[0])?.label??null:null,xe=Am(w).aspect,J=Y??HYr;
return i.jsxs(i.Fragment,{
  children:[l&&c&&i.jsx("div",
      {
        className:_s.lassoBox,
        style:{
          left:c.x,
          top:c.y,
          width:c.w,
          height:c.h
        }
      }),
    te&&i.jsx("div",
      {
        className:_s.camerasView,
        children:i.jsx(XXr,
          {
            large:!0,
            cameras:k,
            tileAspect:Am(w).aspect,
            filmingCameraIds:S,
            rollingCameraIds:T,
            onCameraClick:N,
            onFeedHost:P
          })
      }),
    r&&!te&&!x&&i.jsxs(i.Fragment,
      {
        children:[i.jsx("div",
            {
              ref:we,
              className:_s.editToolbarAnchor,
              children:i.jsx("div",
                {
                  className:Ze(_s.editToolbar,
                    (!d&&!f||n)&&_s.editToolbarHidden),
                  children:i.jsx(ZYr,
                    {
                      transformMode:a,
                      onTransformModeChange:E,
                      rotateAvailable:o,
                      onDeleteClick:j,
                      showDelete:d,
                      toolKeys:U
                    })
                })
            }),
          i.jsxs("div",
            {
              className:_s.rightToolbar,
              children:[i.jsx(YYr,
                  {
                    onAddComponentClick:G,
                    onAddActionClick:Z
                  }),
                !n&&i.jsx($n,
                  {
                    icon:i.jsx(K,
                      {
                        name:"lasso",
                        animated:!0
                      }),
                    label:_._({
                        id:"woaDbA"
                      }),
                    shape:"round",
                    variant:"secondary",
                    mutedIcon:!0,
                    size:"large",
                    tooltipPosition:"right",
                    active:l,
                    onClick:A
                  }),
                i.jsx($n,
                  {
                    icon:i.jsx(K,
                      {
                        name:"images",
                        animated:!0
                      }),
                    label:_._({
                        id:"GX8GKD"
                      }),
                    shape:"round",
                    variant:"secondary",
                    mutedIcon:!0,
                    size:"large",
                    tooltipPosition:"right",
                    active:h,
                    onClick:V
                  }),
                i.jsx($n,
                  {
                    icon:i.jsx(K,
                      {
                        name:"settings",
                        animated:!0
                      }),
                    label:_._({
                        id:"Q6hhn8"
                      }),
                    shape:"round",
                    variant:"secondary",
                    mutedIcon:!0,
                    size:"large",
                    tooltipPosition:"right",
                    onClick:W
                  }),
                i.jsx($n,
                  {
                    icon:i.jsx(K,
                      {
                        name:"help",
                        animated:!0
                      }),
                    label:_._({
                        id:"fypwpe"
                      }),
                    shape:"round",
                    variant:"secondary",
                    mutedIcon:!0,
                    size:"large",
                    tooltipPosition:"right",
                    onClick:O
                  })]
            })]
      }),
    r&&b&&i.jsxs("div",
      {
        className:_s.hintBanner,
        children:[i.jsx("div",
            {
              className:_s.hudHint,
              children:i.jsx(M,
                {
                  id:"OY1R3D"
                })
            }),
          i.jsx("button",
            {
              className:_s.doneButton,
              onClick:y,
              children:i.jsx(M,
                {
                  id:"DPfwMq"
                })
            })]
      }),
    r&&l&&i.jsx("div",
      {
        className:_s.hintBanner,
        children:i.jsx("div",
          {
            className:_s.hudHint,
            children:i.jsx(M,
              {
                id:"KkP4Vr"
              })
          })
      }),
    r&&v&&!b&&i.jsx("div",
      {
        className:_s.hintBanner,
        children:i.jsx("div",
          {
            className:_s.hudHint,
            children:v
          })
      }),
    x&&!x.pointerLocked&&i.jsx("div",
      {
        className:_s.tapToFocus,
        children:i.jsx(M,
          {
            id:"flzBey",
            values:{
              0:x.characterName
            }
          })
      }),
    x&&i.jsxs("div",
      {
        className:_s.playHud,
        children:[i.jsx(E5,
            {
              keyCap:"WASD",
              label:i.jsx(M,
                {
                  id:"QWdKwH"
                })
            }),
          i.jsx(E5,
            {
              keyCap:"Shift",
              label:i.jsx(M,
                {
                  id:"3JjdaA"
                })
            }),
          i.jsx(E5,
            {
              keyCap:"C",
              label:i.jsx(M,
                {
                  id:"6JYtsv"
                })
            }),
          i.jsx(E5,
            {
              keyCap:"Space",
              label:i.jsx(M,
                {
                  id:"FYHBjm"
                })
            }),
          x.keymap.map(({
                key:le,
                clip:ue
              })=>i.jsx(E5,
              {
                keyCap:i.jsx(JZt,
                  {
                    keyName:le
                  }),
                label:ODe(ue,
                  se)
              },
              le)),
          i.jsx(E5,
            {
              keyCap:"Enter",
              record:!0,
              label:x.recording?i.jsx(M,
                {
                  id:"ygCKqB"
                }):i.jsx(M,
                {
                  id:"w80YWM"
                })
            }),
          i.jsx(WYr,
            {
              pointerLocked:x.pointerLocked,
              onDoneClick:I
            })]
      }),
    iKt(t,
      x!==null)&&!n&&i.jsx(RXr,
      {
        onDrive:C
      }),
    fe.mounted&&pe!==null&&i.jsxs("div",
      {
        className:Ze(_s.previewWindow,
          ce&&_s.previewWindowRecording,
          fe.className),
        "data-onboard-target":"pip-window",
        style:{
          ...zYr(xe,
            J),
          ...ne&&{
            left:ne.x,
            top:ne.y,
            right:"auto",
            bottom:"auto"
          }
        },
        onPointerDown:le=>{
          if(le.target.closest("button"))return;
          const ue=le.currentTarget,
          oe=ue.parentElement;
          if(!oe)return;
          const ye=ue.getBoundingClientRect(),
          je=oe.getBoundingClientRect();
          ue.setPointerCapture(le.pointerId),
          q.current={
            startXPx:le.clientX,
            startYPx:le.clientY,
            origXPx:ye.left-je.left,
            origYPx:ye.top-je.top,
            maxXPx:je.width-ye.width,
            maxYPx:je.height-ye.height
          }
        },
        onPointerMove:le=>{
          const ue=q.current;
          ue&&Q({
              x:Math.min(Math.max(ue.origXPx+le.clientX-ue.startXPx,
                  0),
                Math.max(ue.maxXPx,
                  0)),
              y:Math.min(Math.max(ue.origYPx+le.clientY-ue.startYPx,
                  0),
                Math.max(ue.maxYPx,
                  0))
            })
        },
        onPointerUp:le=>{
          const ue=q.current;
          if(q.current=null,
            !ue||!ie)return;
          Math.hypot(le.clientX-ue.startXPx,
            le.clientY-ue.startYPx)<UYr&&B(pe)
        },
        onPointerCancel:()=>q.current=null,
        children:[i.jsx(QYr,
            {
              cameraId:pe,
              onFeedHost:P,
              className:_s.previewCanvasHost
            }),
          i.jsx("div",
            {
              className:_s.pipResize,
              onPointerDown:le=>{
                le.stopPropagation(),
                le.currentTarget.setPointerCapture(le.pointerId);
                const ue=xe>=1?J:Math.round(J*xe);
                ae.current={
                  startXPx:le.clientX,
                  startYPx:le.clientY,
                  startEdgePx:J,
                  oldWidthPx:ue,
                  oldHeightPx:Math.round(ue/xe),
                  origPos:ne
                }
              },
              onPointerMove:le=>{
                const ue=ae.current;
                if(!ue)return;
                const oe=xe>=1?ue.startXPx-le.clientX:ue.startYPx-le.clientY,
                ye=Math.min(Math.max(ue.startEdgePx+oe,
                    $Yr),
                  VYr);
                if(re(ye),
                  ue.origPos){
                  const je=xe>=1?ye:Math.round(ye*xe),
                  ve=Math.round(je/xe);
                  Q({
                      x:Math.max(ue.origPos.x-(je-ue.oldWidthPx),
                        0),
                      y:Math.max(ue.origPos.y-(ve-ue.oldHeightPx),
                        0)
                    })
                }
              },
              onPointerUp:()=>ae.current=null,
              onPointerCancel:()=>ae.current=null
            }),
          i.jsx(Hr,
            {
              content:ie?_._({
                  id:"SjBLOA"
                }):_._({
                  id:"ALSAC8"
                }),
              children:i.jsx("button",
                {
                  className:Ze(_s.pipLock,
                    ie&&_s.pipLockActive),
                  "aria-pressed":ie,
                  "aria-label":ie?_._({
                      id:"SjBLOA"
                    }):_._({
                      id:"ALSAC8"
                    }),
                  onClick:()=>F(pe),
                  children:i.jsx(K,
                    {
                      name:"pin",
                      size:"xs"
                    })
                })
            }),
          i.jsx(Hr,
            {
              content:_._({
                  id:"l/htdy"
                }),
              children:i.jsx("button",
                {
                  className:_s.pipScreenshot,
                  "aria-label":_._({
                      id:"l/htdy"
                    }),
                  "data-onboard-target":"pip-screenshot",
                  onClick:()=>H(pe),
                  children:i.jsx(K,
                    {
                      name:"camera",
                      size:"xs",
                      animated:!0
                    })
                })
            }),
          (!X||ce)&&i.jsx(Hr,
            {
              content:ce?_._({
                  id:"pJ/IRc"
                }):_._({
                  id:"0eRi/g"
                }),
              children:i.jsx("button",
                {
                  className:Ze(_s.pipRecord,
                    ce&&_s.pipRecordActive),
                  "aria-label":ce?_._({
                      id:"pJ/IRc"
                    }):_._({
                      id:"0eRi/g"
                    }),
                  onClick:()=>ce?$():z(pe),
                  children:ce?i.jsx(K,
                    {
                      name:"stop",
                      size:"xs"
                    }):i.jsx(K,
                    {
                      name:"video",
                      size:"xs",
                      animated:!0
                    })
                })
            }),
          t==="edit"&&!X&&i.jsx(Hr,
            {
              content:_._({
                  id:"kW8chx"
                }),
              children:i.jsx("button",
                {
                  className:_s.pipPhone,
                  "aria-label":_._({
                      id:"kW8chx"
                    }),
                  onClick:()=>L(pe),
                  children:i.jsx(K,
                    {
                      name:"phone-camera",
                      size:"xs",
                      animated:!0
                    })
                })
            })]
      }),
    (X&&t!=="camera"||x?.recording)&&(s?.phase==="stopping"?i.jsxs("div",
        {
          className:_s.recIndicator,
          children:[i.jsx(K,
              {
                name:"loading",
                size:"xs",
                className:_s.finalizingSpinner
              }),
            i.jsx("span",
              {
                children:i.jsx(M,
                  {
                    id:"ZH5Cyo"
                  })
              })]
        }):i.jsxs("div",
        {
          className:_s.recIndicator,
          children:[i.jsx("span",
              {
                className:_s.recDot
              }),
            i.jsx("span",
              {
                children:"REC"
              }),
            i.jsx(eQr,
              {
                
              })]
        })),
    t==="edit"&&s&&s.kind!=="manual"&&i.jsx("div",
      {
        className:_s.hintBanner,
        children:i.jsx("div",
          {
            className:_s.hudHint,
            children:GYr(s.kind,
              Ee)
          })
      }),
    s?.kind==="hub"&&s.phase==="stopping"&&s.finalizing&&i.jsx("div",
      {
        className:_s.finalizingScrim,
        children:i.jsxs("div",
          {
            className:_s.finalizingCard,
            children:[i.jsx(K,
                {
                  name:"loading",
                  className:_s.finalizingSpinner
                }),
              i.jsx("span",
                {
                  children:i.jsx(M,
                    {
                      id:"KG1DpJ",
                      values:{
                        0:s.finalizing.done,
                        1:s.finalizing.total
                      }
                    })
                })]
          })
      })]
})
}function eQr(){
const[t,e]=p.useState(0);
p.useEffect(()=>{
  const s=window.setInterval(()=>e(a=>a+1),
    1e3);
  return()=>window.clearInterval(s)
},[]);
const n=String(Math.floor(t/60)).padStart(2,"0"),r=String(t%60).padStart(2,"0");
return i.jsxs("span",{
  className:_s.timer,
  children:[n,
    ":",
    r]
})
}function tQr(t){
const e=r3r(t),n=e.includes("camera");
return e.includes("object")?n?_._({
  id:"iaLe4d"
}):_._({
  id:"hCuZ0m"
}):e.includes("human")?n?_._({
  id:"Uw/dA6"
}):_._({
  id:"VYaas+"
}):n?_._({
  id:"5o+8Sc"
}):null
}function nQr(t){
const e=Ne(null),n=o=>{
const l=e.peek(),c=l!==null&&t.objects.peek()[l]?.kind==="camera";
e.set(c?null:o)
},r=Mt(({
    stageView:o,
    onStageViewChange:l
  })=>{
  const c=he(t.objects),
  d=he(t.selectedId),
  u=he(t.playSession),
  h=he(t.playKeymap),
  f=he(t.playPointerLocked);
  d!==null&&c[d];
  const m=he(e),
  g=m!==null&&c[m]?.kind==="camera"?m:null,
  b=AGt(c),
  y=he(t.draggingComponent),
  v=he(t.draggingAction),
  x=he(t.draggingObject),
  k=he(t.dropHoverValid)?null:y?_._({
      id:"1zPEc2"
    }):v?tQr(v):x?_._({
      id:"GwFDe6"
    }):null;
  return i.jsxs(i.Fragment,
    {
      children:[i.jsx(JYr,
          {
            mode:he(t.mode),
            stageView:o,
            planShown:he(t.planShown),
            panelsVisible:he(t.panelsVisible),
            recording:he(t.recording),
            transformMode:he(t.transformMode),
            lassoActive:he(t.editInteraction)==="lasso",
            lassoRect:he(t.lassoRect),
            hasSelection:d!==null,
            selectionScreenBounds:t.selectionScreenBounds,
            assetsOpen:he(t.assetsOpen),
            rigPosing:!!he(t.rigPoseObjectId),
            selectedCameraId:he(t.focusedCameraId)??null,
            lockedCameraId:g,
            isEditingPath:he(t.editInteraction)==="editingPath",
            onFinishPathClick:t.finishPerformancePaint,
            dragHint:k,
            playHud:u&&{
              characterName:c[u.characterId]?.name||_._({
                  id:"DhTbJv"
                }),
              recording:u.recording,
              pointerLocked:f,
              keymap:h
            },
            recordAspect:he(t.recordAspect),
            filmingCamera

/*==============================================================================
 * 26. RECORD CONTROLLER mqr — offscreen rigs, captureCamera/captureViewport, hub sessions, feeds
 * source file: tmp_b/record_mqr_pretty.js
 ==============================================================================*/
mqr(t,
  e){
  const{
    a:n,
    camera:r
  }=t;
  let s=null,
  a=null,
  o=!1,
  l=0,
  c={
    fromS:0,
    runS:0
  },
  d=!1;
  const u=new Map;
  let h=null,
  f=null,
  m=0,
  g=null,
  b=!1,
  y=!1,
  v=new Set;
  const x=lZt(),
  w=new Xo,
  k=new Xo,
  S=new Set;
  let T=0,
  A=null;
  const C=me=>me==="off"?null:Dzt({
      t:T,
      intensity:me
    });
  let E=0,
  j=null,
  I=!1;
  const N=new Ge,
  P=new qn;
  let F=!1;
  function B(me){
    const Te=new t0({
        antialias:!0,
        preserveDrawingBuffer:me.preserveDrawingBuffer
      });
    fZt(Te),
    Te.shadowMap.autoUpdate=!1,
    Te.setPixelRatio(1),
    Te.setSize(me.width,
      me.height,
      me.updateStyle);
    const Le=new Xo(FP,
      me.aspect,
      Khe,
      RP);
    let Fe=0;
    const tt=pZt({
        camera:Le,
        meshById:t.meshById,
        scene:t.scene,
        now:me.deterministic?()=>Fe*fqr:void 0
      });
    let Oe=null;
    const Je={
      renderer:Te,
      camera:Le,
      render:($e=!1)=>{
        e.redrawShadows(Te),
        $e&&Dje(Te)?(Oe??=hKt(Te),
          Oe.render(t.scene,
            Le)):Te.render(t.scene,
          Le)
      },
      fitPlanes:()=>{
        Fe++,
        tt.tick()
      },
      dispose:()=>{
        S.delete(Je),
        Oe?.dispose(),
        Te.forceContextLoss(),
        Te.dispose()
      }
    };
    return S.add(Je),
    Je
  }const H=()=>n.mode.peek()==="camera";
  function z(me){
    return L(me)[0]?.startS??0
  }function L(me){
    return n.show.peek().tracks.find(Te=>Te.characterId===me)?.items??[]
  }function $(me){
    return me.focalLengthMm??Hv
  }function O(me){
    const Te=L(me)[0];
    return Te?.kind==="cam-follow"&&Te.offset&&Te.objectId&&Te.startS<=0?Te:null
  }function W(me,
    Te){
    const Le=Fe=>Fe<Te-1e-6;
    return{
      resolveAim:(Fe,
        tt)=>{
        if(Fe){
          if(Le(tt)){
            const Oe=e.playback.objectPoseAt(Fe,
              tt);
            if(Oe)return[Oe.position[0],
              Oe.position[1]+NP(Fe,
                n.objects.peek()),
              Oe.position[2]]
          }return ROr(t,
            Fe)
        }return xZt(t,
          me)?.target??null
      },
      resolveFollowObject:(Fe,
        tt)=>{
        if(Le(tt))return e.playback.objectPoseAt(Fe,
          tt);
        const Oe=t.meshById.get(Fe);
        return Oe?(Oe.getWorldPosition(dQ),
          Oe.getWorldQuaternion(wL),
          {
            position:[dQ.x,
              dQ.y,
              dQ.z],
            quaternion:[wL.x,
              wL.y,
              wL.z,
              wL.w]
          }):null
      }
    }
  }const U=()=>n.isPreviewPlaying.peek()||d,
  V=()=>!U()&&n.performanceSeekS.peek()!==null,
  G=()=>U()||V(),
  Z=()=>n.performanceTimeS.peek(),
  se=me=>{
    const Te=t.meshById.get(me);
    return!!Te&&e.isMeshDragged(Te)
  },
  X=me=>{
    const Te=t.meshById.get(me);
    return vFr({
        recording:s!==null,
        editMode:n.mode.peek()==="edit",
        meshDragged:!!Te&&e.isMeshDragged(Te),
        previewActive:G(),
        isSelected:me===n.selectedId.peek()
      })
  };
  function te(){
    e.updateCameraMarkerVisual()
  }function ne(me){
    const Te=n.isPreviewPlaying.peek(),
    Le=V();
    (Te&&!b||Le&&!y)&&te(),
    b=Te,
    y=Le,
    Q()
  }function Q(){
    const me=new Set;
    if(G()&&n.mode.peek()==="edit")for(const[Te,
        Le]of Object.entries(n.objects.peek())){
      if(Le.kind!=="camera"||X(Te))continue;
      const Fe=t.meshById.get(Te);
      Fe&&ce(Te,
        w)&&(Hie(Fe,
          w.position,
          w.quaternion),
        me.add(Te))
    }else if(n.mode.peek()==="edit")for(const[Te,
        Le]of Object.entries(n.objects.peek())){
      if(Le.kind!=="camera")continue;
      const Fe=O(Te);
      if(!Fe)continue;
      const tt=t.meshById.get(Te),
      Oe=t.meshById.get(Fe.objectId);
      if(!(!tt||!Oe)){
        if(X(Te)){
          v.has(Te)&&n.updateObjectTransform(Te,
            {
              position:[tt.position.x,
                tt.position.y,
                tt.position.z],
              rotation:[tt.rotation.x,
                tt.rotation.y,
                tt.rotation.z]
            });
          continue
        }U8r(Eye,
          Oe,
          Fe.offset),
        Hie(tt,
          Eye.position,
          Eye.quaternion),
        me.add(Te)
      }
    }for(const Te of v){
      if(!xFr({
            animatedNow:me.has(Te),
            dragging:se(Te)
          }))continue;
      const Le=t.meshById.get(Te),
      Fe=n.objects.peek()[Te];
      Le&&Fe&&(Le.position.set(...Fe.position),
        Le.rotation.set(...Fe.rotation))
    }v=new Set([...me,
        ...[...v].filter(Te=>se(Te))])
  }function q(me){
    let Te=0;
    if(j&&me>0){
      const Fe=r.position.x-j.x,
      tt=r.position.z-j.z;
      Te=Math.hypot(Fe,
        tt)/me
    }(j??=new Ge).copy(r.position);
    const Le=oEr({
        rig:gq[n.cameraRig.peek()],
        t:T,
        stridePhase:E,
        groundSpeedMps:Te,
        dtS:me
      });
    return E=Le.stridePhase,
    Le.pose
  }function Y(me){
    T+=me,
    n.mode.peek()==="camera"?A=q(me):(j=null,
      A=C(n.cameraShake.peek())),
    A&&H()&&(N.copy(r.position),
      P.copy(r.quaternion),
      I=!0,
      cL(r,
        A))
  }function re(){
    I&&(r.position.copy(N),
      r.quaternion.copy(P),
      I=!1)
  }function ae(me){
    return me.position.copy(r.position),
    me.quaternion.copy(r.quaternion),
    me.fov=BU(n),
    me.updateProjectionMatrix(),
    A&&cL(me,
      A),
    !0
  }function ie(me){
    return z2r(L(me),
      ge())
  }function ge(){
    return G()?Z():0
  }function pe(me,
    Te){
    if(ie(me))return;
    const Le=C(n.objects.peek()[me]?.shake??"off");
    Le&&cL(Te,
      Le)
  }function ce(me,
    Te){
    const Le=n.objects.peek()[me];
    if(!Le)return!1;
    const Fe=G(),
    tt=Am(n.recordAspect.peek()).aspect,
    Oe=t.meshById.get(me);
    if(X(me))return Oe?(Oe.getWorldPosition(Te.position),
      Oe.getWorldQuaternion(Te.quaternion),
      Te.fov=Z_($(Le),
        tt),
      Te.updateProjectionMatrix(),
      !0):!1;
    const Je=Zo(Le,
      n.objects.peek()),
    $e=Fe||!Oe?{
      position:Je.position,
      rotation:Je.rotation,
      focalLengthMm:$(Le)
    }:{
      ...Bie(Oe),
      focalLengthMm:$(Le)
    },
    Ue=ge();
    return dZt({
        items:L(me),
        timeS:Ue,
        base:$e,
        aspect:tt,
        resolvers:W(me,
          Ue),
        out:x
      }),
    Te.position.copy(x.position),
    Te.quaternion.copy(x.quaternion),
    Te.fov=x.fovDeg,
    !0
  }function be(me,
    Te){
    return H()&&n.filmingCameraId.peek()===me?ae(Te):ce(me,
      Te)?(Te.updateProjectionMatrix(),
      pe(me,
        Te),
      !0):!1
  }async function fe(me){
    const Te=me.aim??ae,
    Le=me.takeOver?{
      position:r.position.clone(),
      quaternion:r.quaternion.clone(),
      fov:r.fov
    }:null;
    me.takeOver&&(e.detachGizmo(),
      e.orbit.enabled=!1);
    const{
      width:Fe,
      height:tt
    }=Am(n.recordAspect.peek()),
    Oe=we(me.record===!1),
    Je=e.finishEnabled(),
    $e=document.createElement("canvas");
    $e.width=Fe,
    $e.height=tt;
    const Ue=$e.getContext("2d");
    let et=!1;
    const He=()=>{
      et||(et=!0,
        Ee())
    },
    qe=ze=>{
      !Le||t.isDisposed()||(ze&&(r.position.copy(Le.position),
          r.quaternion.copy(Le.quaternion),
          r.fov=Le.fov,
          r.updateProjectionMatrix()),
        e.applyMode())
    };
    try{
      if(!Ue)throw new Error("2d context unavailable for capture");
      const ze=()=>{
        Oe.fitPlanes(),
        Oe.render(pqr({
              offlineFrame:F,
              recorded:me.record!==!1,
              enabled:Je
            })),
        Ue.drawImage(Oe.renderer.domElement,
          0,
          0)
      };
      e.playback.resetPerformersToStart(),
      me.takeOver?.poseFirstFrame();
      const We=Ew(t);
      Te(Oe.camera),
      ze(),
      We();
      const dt=me.record===!1?null:uqr($e);
      let mt=1,
      jt=!1;
      const bt=()=>{
        jt||(jt=!0,
          mt=0,
          dt?.start())
      };
      return me.deferStart||bt(),
      {
        canvas:$e,
        startRecording:bt,
        renderFrame:()=>{
          !et&&Te(Oe.camera)&&(ze(),
            jt&&mt++)
        },
        stop:async()=>(bt(),
          dt?{
            ...await dt.stop(),
            framesRendered:mt
          }:{
            videoBlob:new Blob,
            videoMimeType:"",
            width:Fe,
            height:tt,
            durationS:0,
            framesRendered:mt
          }),
        dispose:()=>{
          He(),
          qe(!0)
        }
      }
    }catch(ze){
      throw He(),
      qe(me.takeOver?.restorePoseOnFailure!==!1),
      ze
    }
  }function we(me){
    if(!f){
      const{
        aspect:Te,
        width:Le,
        height:Fe
      }=Am(n.recordAspect.peek());
      f=B({
          width:Le,
          height:Fe,
          aspect:Te,
          preserveDrawingBuffer:!0,
          updateStyle:!1,
          deterministic:me
        })
    }return m++,
    f
  }function Ee(){
    m=Math.max(0,
      m-1),
    m===0&&f&&(f.dispose(),
      f=null)
  }function xe(){
    return h||(h=B({
          width:1,
          height:1,
          aspect:1,
          preserveDrawingBuffer:!0,
          updateStyle:!1
        })),
    h
  }function J(){
    u.size===0&&h&&(e.forgetStroke(h.renderer),
      h.dispose(),
      h=null)
  }function le(me,
    Te,
    Le){
    const Fe=document.createElement("canvas"),
    tt=Fe.getContext("2d");
    tt&&(Te.appendChild(Fe),
      u.set(me,
        {
          host:Te,
          canvas:Fe,
          ctx:tt,
          aim:Le
        }))
  }function ue(me){
    const Te=u.get(me);
    Te&&(Te.canvas.remove(),
      u.delete(me))
  }async function oe(me,
    Te=!0){
    const Le=[];
    d=!0,
    te();
    try{
      for(const Fe of me)Le.push({
          cameraId:Fe,
          startsAtS:z(Fe),
          rolling:!1,
          session:await fe({
              deferStart:!0,
              record:Te,
              aim:tt=>be(Fe,
                tt)
            })
        });
      return Le
    }catch(Fe){
      d=!1;
      for(const tt of Le)tt.session.dispose();
      throw Fe
    }
  }async function ye(me){
    a=null,
    d=!1,
    e.playback.stopManualClock();
    try{
      const Te={
        
      };
      return await Promise.all(me.map(async Le=>{
            const Fe=await Le.session.stop();
            Te[Le.cameraId]=Le.rolling?Fe:null
          })),
      Te
    }finally{
      for(const Te of me)Te.session.dispose()
    }
  }function je(me,
    Te){
    const Le=Te.host.clientWidth,
    Fe=Te.host.clientHeight;
    if(Le<=0||Fe<=0)return!1;
    const tt=xe(),
    Oe=tt.renderer.domElement;
    (Oe.width!==Le||Oe.height!==Fe)&&(tt.renderer.setSize(Le,
        Fe,
        !1),
      tt.camera.aspect=Le/Fe);
    const Je=Te.aim?Te.aim(tt.camera):be(me,
      tt.camera);
    if(!Je)return!1;
    tt.fitPlanes();
    const $e=Je==="plan"||Je==="selection"?jOr(t):null,
    Ue=Je==="selection"?e.showSelectionRings(tt.camera,
      Fe):null;
    try{
      tt.render(),
      Je==="selection"&&e.strokeSelection(tt.renderer,
        tt.camera)
    }finally{
      Ue?.(),
      $e?.()
    }return(Te.canvas.width!==Le||Te.canvas.height!==Fe)&&(Te.canvas.width=Le,
      Te.canvas.height=Fe),
    Te.ctx.drawImage(Oe,
      0,
      0),
    !0
  }function ve(me){
    if(s){
      const Te=Ew(t);
      s.renderFrame(),
      Te()
    }if(u.size>0||a){
      const Te=Ew(t),
      Le=new Map(a?.map(({
              cameraId:Fe,
              session:tt
            })=>[Fe,
            tt])??[]);
      for(const[Fe,
          tt]of u)Le.has(Fe)||je(Fe,
        tt);
      if(a){
        const Fe=n.performanceTimeS.peek();
        let tt=!1;
        for(const Oe of a){
          const{
            cameraId:Je,
            session:$e
          }=Oe;
          !Oe.rolling&&Fe>=Oe.startsAtS&&($e.startRecording(),
            Oe.rolling=!0,
            tt=!0);
          const Ue=u.get(Je),
          et=Ue?.host.clientWidth??0,
          He=Ue?.host.clientHeight??0,
          qe=!!Ue&&et>0&&He>0;
          (qe||!o)&&$e.renderFrame(),
          qe&&((Ue.canvas.width!==et||Ue.canvas.height!==He)&&(Ue.canvas.width=et,
              Ue.canvas.height=He),
            Ue.ctx.drawImage($e.canvas,
              0,
              0,
              et,
              He))
        }tt&&n.rollingCameraIds.set(a.filter(Oe=>Oe.rolling).map(Oe=>Oe.cameraId))
      }Te()
    }if(g){
      const Te=g.host.clientWidth,
      Le=g.host.clientHeight,
      Fe=g.rig.renderer.domElement;
      Te>0&&Le>0&&(Fe.width!==Te||Fe.height!==Le)&&(g.rig.renderer.setSize(Te,
          Le),
        g.rig.camera.aspect=Te/Le);
      const tt=g.rig.camera;
      if(ke(tt)){
        tt.updateProjectionMatrix(),
        g.rig.fitPlanes();
        const Oe=Ew(t);
        g.rig.render(),
        Oe()
      }
    }
  }function ke(me){
    if(H())return ae(me);
    const Te=iBe(t)?.userData.objectId;
    return Te&&ce(Te,
      me)?(A&&!ie(Te)&&cL(me,
        A),
      !0):vZt(t,
      null,
      me)?(me.fov=BU(n),
      A&&cL(me,
        A),
      !0):!1
  }function Ae(){
    const me=t.renderer.domElement,
    Te=Math.min(1,
      768/Math.max(1,
        me.width)),
    Le=Math.max(1,
      Math.round(me.width*Te)),
    Fe=Math.max(1,
      Math.round(me.height*Te)),
    tt=document.createElement("canvas");
    tt.width=Le,
    tt.height=Fe;
    const Oe=tt.getContext("2d");
    return Oe?(Oe.drawImage(me,
        0,
        0,
        Le,
        Fe),
      tt.toDataURL("image/png")):me.toDataURL("image/png")
  }function Se(me,
    Te=!1){
    const Le=Am(n.recordAspect.peek()),
    Fe=Le.aspect,
    tt=Te?Le.width:768,
    Oe=Te?Le.height:Math.round(tt/Fe),
    Je=B({
        width:tt,
        height:Oe,
        aspect:Fe,
        preserveDrawingBuffer:!0,
        updateStyle:!1
      });
    if(!ce(me,
        Je.camera))return Je.dispose(),
    null;
    Je.camera.updateProjectionMatrix(),
    Je.fitPlanes();
    const $e=Ew(t);
    Je.render(!0);
    const Ue=Je.renderer.domElement.toDataURL("image/png");
    return $e(),
    Je.dispose(),
    Ue
  }return{
    isViewportFilming:H,
    isTakeRolling:()=>s!==null,
    isCapturing:()=>s!==null||a!==null,
    foldResolvers:W,
    cameraFovDeg:me=>ce(me,
      k)?k.fov:null,
    captureViewport:Ae,
    captureCamera:Se,
    aimHubCamera:be,
    tickPreview:ne,
    tickShake:Y,
    restoreShake:re,
    tickCapture:ve,
    startRecording:async()=>{
      s=await fe({
          
        }),
      e.playback.startManualClock()
    },
    stopRecording:async()=>{
      const me=s;
      if(!me)throw new Error("not recording");
      s=null,
      e.playback.stopManualClock();
      try{
        return await me.stop()
      }finally{
        me.dispose()
      }
    },
    startHubRecording:async(me,
      Te)=>{
      if(s||a)throw new Error("already recording");
      o=Te?.monitorOnly===!0,
      a=await oe(me,
        !o),
      l=e.playback.startManualClock({
          bounded:!0
        })
    },
    stopHubRecording:async()=>{
      if(!a)throw new Error("not recording");
      c={
        fromS:l,
        runS:n.performanceTimeS.peek()-l
      };
      const me=await ye(a);
      return o?{
        
      }:me
    },
    canRenderOffline:()=>{
      const{
        width:me,
        height:Te
      }=Am(n.recordAspect.peek());
      return mKt(me,
        Te)
    },
    beginOfflineHub:async me=>{
      if(s||a)throw new Error("already recording");
      const Te=await oe(me,
        !1),
      {
        fromS:Le
      }=c;
      return e.playback.startManualClock({
          fromS:Le
        }),
      {
        fromS:Le,
        runS:Math.max(.1,
          c.runS),
        cameras:Te.map(({
              cameraId:Fe,
              startsAtS:tt,
              session:Oe
            })=>({
              cameraId:Fe,
              startsAtS:tt,
              canvas:Oe.canvas,
              renderFrame:()=>{
                const Je=Ew(t);
                F=!0;
                try{
                  Oe.renderFrame()
                }finally{
                  F=!1,
                  Je()
                }
              }
            })),
        settle:()=>{
          d=!1,
          e.playback.stopManualClock();
          for(const Fe of Te)Fe.session.dispose()
        }
      }
    },
    recordHubBatch:async me=>{
      const Te=Math.max(.1,
        c.runS);
      if(s||a)throw new Error("already recording");
      const Le=await oe(me);
      a=Le;
      try{
        e.playback.startManualClock({
            fromS:c.fromS
          }),
        await new Promise(Fe=>setTimeout(Fe,
            Te*1e3))
      }catch(Fe){
        throw await ye(Le),
        Fe
      }return await ye(Le)
    },
    redrawFeed:me=>{
      const Te=u.get(me);
      if(!Te||a)return!1;
      const Le=Ew(t);
      try{
        return je(me,
          Te)
      }finally{
        Le()
      }
    },
    attachFeed:(me,
      Te,
      Le)=>{
      for(const[tt,
          Oe]of u)tt!==me&&Oe.host===Te&&ue(tt);
      const Fe=u.get(me);
      if(Fe){
        Fe.host!==Te&&Te.appendChild(Fe.canvas),
        u.set(me,
          {
            ...Fe,
            host:Te,
            aim:Le
          });
        return
      }le(me,
        Te,
        Le)
    },
    detachFeed:me=>{
      queueMicrotask(()=>{
          if(t.isDisposed())return;
          const Te=u.get(me);
          !Te||Te.host.isConnected||(ue(me),
            J())
        })
    },
    attachPreview:me=>{
      if(g)return;
      const Te=B({
          width:me.clientWidth,
          height:me.clientHeight,
          aspect:me.clientWidth/Math.max(1,
            me.clientHeight),
          preserveDrawingBuffer:!1,
          updateStyle:!0
        });
      g={
        rig:Te,
        host:me
      },
      me.appendChild(Te.renderer.domElement)
    },
    detachPreview:()=>{
      g&&(g.rig.renderer.domElement.remove(),
        g.rig.dispose(),
        g=null)
    },
    dispose:()=>{
      if(s){
        const me=s;
        s=null,
        me.stop().catch(()=>{
            
          }),
        me.dispose()
      }for(const me of u.values())me.canvas.remove();
      if(u.clear(),
        h?.dispose(),
        h=null,
        f?.dispose(),
        f=null,
        m=0,
        a){
        for(const{
            session:me
          }of a)me.stop().catch(()=>{
            
          }),
        me.dispose();
        a=null
      }d=!1,
      g&&(g.rig.renderer.domElement.remove(),
        g.rig.dispose(),
        g=null);
      for(const me of[...S])me.dispose()
    }
  }
}async function gqr(t){
  const e=await t.beginOfflineHub(t.cameraIds);
  try{
    return await dEr({
        cameras:e.cameras,
        fromS:e.fromS,
        runS:e.runS,
        fps:Qne,
        step:t.step,
        encoderFor:gKt,
        onProgress:t.onProgress
      })
  }finally{
    e.settle()
  }
}const bqr=.028,yqr=4500223,vqr=16763972;
function xqr(t,
  e){
  const{
    a:n
  }=t,
  r=new Ci;
  r.renderOrder=1,
  t.scene.add(r),
  t.planningAids.push(()=>[r]);
  const s=new Ku(bqr,
    12,
    8),
  a=new tl({
      color:yqr,
      depthTest:!1
    }),
  o=new tl({
      color:vqr,
      depthTest:!1
    });
  let l=[];
  const c=new Map;
  let d=null;
  function u(){
    for(const m of c.values())r.remove(m);
    c.clear(),
    t.rigJointPickables.length=0,
    d=null
  }function h(m){
    u();
    for(const g of e.majorJointsOf(m)){
      const b=new Vt(s,
        a);
      b.userData.rigJoint=g.name,
      b.userData.rigObjectId=m,
      r.add(b),
      c.set(g.name,
        b),
      t.rigJointPickables.push(b)
    }d=c.size>0?m:null
  }function f(){
    const m=n.selectedSegment.peek();
    if(!m)return!1;
    const g=n.show.peek().tracks.find(y=>y.id===m.trackId)?.items.find(y=>y.id===m.itemId);
    if(g?.kind!=="rig-transform")return!1;
    const b=n.performanceTimeS.peek()-g.startS;
    return b>=0&&b<=g.durationS
  }return{
    selectedJoints:()=>l,
    setSelectedJoints:m=>{
      l=m
    },
    tick:()=>{
      const m=n.rigPoseObjectId.peek();
      if(!m||!f()){
        r.visible=!1,
        (d!==null||c.size>0)&&u(),
        l=[];
        return
      }r.visible=!0,
      d!==m&&h(m);
      for(const[g,
          b]of c){
        const y=e.boneOf(m,
          g);
        y&&(y.getWorldPosition(b.position),
          b.material=l.includes(g)?o:a)
      }
    }
  }
}const Bot={
  type:"change"
},bBe={
  type:"start"
},bKt={
  type:"end"
},uQ=new PR,Hot=new r2,wqr=Math.cos(70*m_.DEG2RAD),Ed=new Ge,rm=2*Math.PI,po={
  NONE:-1,
  ROTATE:0,
  DOLLY:1,
  PAN:2,
  TOUCH_ROTATE:3,
  TOUCH_PAN:4,
  TOUCH_DOLLY_PAN:5,
  TOUCH_DOLLY_ROTATE:6
},jye=1e-6;
class _qr extends xDe{
  constructor(e,
    n=null){
    super(e,
      n),
    this.state=po.NONE,
    this.target=new Ge,
    this.cursor=new Ge,
    this.minDistance=0,
    this.maxDistance=1/0,
    this.minZoom=0,
    this.maxZoom=1/0,
    this.minTargetRadius=0,
    this.maxTargetRadius=1/0,
    this.minPolarAngle=0,
    this.maxPolarAngle=Math.PI,
    this.minAzimuthAngle=-1/0,
    this.maxAzimuthAngle=1/0,
    this.enableDamping=!1,
    this.dampingFactor=.05,
    this.enableZoom=!0,
    this.zoomSpeed=1,
    this.enableRotate=!0,
    this.rotateSpeed=1,
    this.keyRotateSpeed=1,
    this.enablePan=!0,
    this.panSpeed=1,
    this.screenSpacePanning=!0,
    this.keyPanSpeed=7,
    this.zoomToCursor=!1,
    this.autoRotate=!1,
    this.autoRotateSpeed=2,
    this.keys={
      LEFT:"ArrowLeft",
      UP:"ArrowUp",
      RIGHT:"ArrowRight",
      BOTTOM:"ArrowDown"
    },
    this.mouseButtons={
      LEFT:wm.ROTATE,
      MIDDLE:wm.DOLLY,
      RIGHT:wm.PAN
    },
    this.touches={
      ONE:P8.ROTATE,
      TWO:P8.DOLLY_PAN
    },
    this.target0=this.target.clone(),
    this.position0=this.object.position.clone(),
    this.zoom0=this.object.zoom,
    this._domElementKeyEvents=null,
    this._lastPosition=new Ge,
    this._lastQuaternion=new qn,
    this._lastTargetPosition=new Ge,
    this._quat=new qn().setFromUnitVectors(e.up,
      new Ge(0,
        1,
        0)),
    this._quatInverse=this._quat.clone().invert(),
    this._spherical=new XEe,
    this._sphericalDelta=new XEe,
    this._scale=1,
    this._panOffset=new Ge,
    this._rotateStart=new On,
    this._rotateEnd=new On,
    this._rotateDelta=new On,
    this._panStart=new On,
    this._panEnd=new On,
    this._panDelta=new On,
    this._dollyStart=new On,
    this._dollyEnd=new On,
    this._dollyDelta=new On,
    this._dollyDirection=new Ge,
    this._mouse=new On,
    this._performCursorZoom=!1,
    this._pointers=[],
    this._pointerPositions={
      
    },
    this._controlActive=!1,
    this._onPointerMove=Sqr.bind(this),
    this._onPointerDown=kqr.bind(this),
    this._onPointerUp=Tqr.bind(this),
    this._onContextMenu=Nqr.bind(this),
    this._onMouseWheel=Eqr.bind(this),
    this._onKeyDown=jqr.bind(this),
    this._onTouchStart=Iqr.bind(this),
    this._onTouchMove=Mqr.bind(this),
    this._onMouseDown=Aqr.bind(this),
    this._onMouseMove=Cqr.bind(this),
    this._interceptControlDown=Pqr.bind(this),
    this._interceptControlUp=Rqr.bind(this),
    this.domElement!==null&&this.connect(this.domElement),
    this.update()
  }connect(e){
    super.connect(e),
    this.domElement.addEventListener("pointerdown",
      this._onPointerDown),
    this.domElement.addEventListener("pointercancel",
      this._onPointerUp),
    this.domElement.addEventListener("contextmenu",
      this._onContextMenu),
    this.domElement.addEventListener("wheel",
      this._onMouseWheel,
      {
        passive:!1
      }),
    this.domElement.getRootNode().addEventListener("keydown",
      this._interceptControlDown,
      {
        passive:!0,
        capture:!0
      }),
    this.domElement.style.touchAction="none"
  }disconnect(){
    this.domElement.removeEventListener("pointerdown",
      this._onPointerDown),
    this.domElement.ownerDocument.removeEventListener("pointermove",
      this._onPointerMove),
    this.domElement.ownerDocument.removeEventListener("pointerup",
      this._onPointerUp),
    this.domElement.removeEventListener("pointercancel",
      this._onPointerUp),
    this.domElement.removeEventListener("wheel",
      this._onMouseWheel),
    this.domElement.removeEventListener("contextmenu",
      this._onContextMenu),
    this.stopListenToKeyEvents(),
    this.domElement.getRootNode().removeEventListener("keydown",
      this._interceptControlDown,
      {
        capture:!0
      }),
    this.domElement.style.touchAction="auto"
  }dispose(){
    this.disconnect()
  }getPolarAngle(){
    return this._spherical.phi
  }getAzimuthalAngle(){
    return this._spherical.theta
  }getDistance(){
    return this.object.position.distanceTo(this.target)
  }listenToKeyEvents(e){
    e.addEventListener("keydown",
      this._onKeyDown),
    this._domElementKeyEvents=e
  }stopListenToKeyEvents(){
    this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",
        this._onKeyDown),
      this._domElementKeyEvents=null)
  }saveState(){
    this.target0.copy(this.target),
    this.position0.copy(this.object.position),
    this.zoom0=this.object.zoom
  }reset(){
    this.target.copy(this.target0),
    this.object.position.copy(this.position0),
    this.object.zoom=this.zoom0,
    this.object.updateProjectionMatrix(),
    this.dispatchEvent(Bot),
    this.update(),
    this.state=po.NONE
  }update(e=null){
    const n=this.object.position;
    Ed.copy(n).sub(this.target),
    Ed.applyQuaternion(this._quat),
    this._spherical.setFromVector3(Ed),
    this.autoRotate&&this.state===po.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),
    this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,
      this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,
      this._spherical.phi+=this._sphericalDelta.phi);
    let r=this.minAzimuthAngle,
    s=this.maxAzimuthAngle;
    isFinite(r)&&isFinite(s)&&(r<-Math.PI?r+=rm:r>Math.PI&&(r-=rm),
      s<-Math.PI?s+=rm:s>Math.PI&&(s-=rm),
      r<=s?this._spherical.theta=Math.max(r,
        Math.min(s,
          this._spherical.theta)):this._spherical.theta=this._spherical.theta>(r+s)/2?Math.max(r,
        this._spherical.theta):Math.min(s,
        this._spherical.theta)),
    this._spherical.phi=Math.max(this.minPolarAngle,
      Math.min(this.maxPolarAngle,
        this._spherical.phi)),
    this._spherical.makeSafe(),
    this.enableDamping===!0?this.target.addScaledVector(this._panOffset,
      this.dampingFactor):this.target.add(this._panOffset),
    this.target.sub(this.cursor),
    this.target.clampLength(this.minTargetRadius,
      this.maxTargetRadius),
    this.target.add(this.cursor);
    let a=!1;
    if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);
    else{
      const o=this._spherical.radius;
      this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),
      a=o!=this._spherical.radius
    }if(Ed.setFromSpherical(this._spherical),
      Ed.applyQuaternion(this._quatInverse),
      n.copy(this.target).add(Ed),
      this.object.lookAt(this.target),
      this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,
        this._sphericalDelta.phi*=1-this.dampingFactor,
        this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,
          0,
          0),
        this._panOffset.set(0,
          0,
          0)),
      this.zoomToCursor&&this._performCursorZoom){
      let o=null;
      if(this.object.isPerspectiveCamera){
        const l=Ed.length();
        o=this._clampDistance(l*this._scale);
        const c=l-o;
        this.object.position.addScaledVector(this._dollyDirection,
          c),
        this.object.updateMatrixWorld(),
        a=!!c
      }else if(this.object.isOrthographicCamera){
        const l=new Ge(this._mouse.x,
          this._mouse.y,
          0);
        l.unproject(this.object);
        const c=this.object.zoom;
        this.object.zoom=Math.max(this.minZoom,
          Math.min(this.maxZoom,
            this.object.zoom/this._scale)),
        this.object.updateProjectionMatrix(),
        a=c!==this.object.zoom;
        const d=new Ge(this._mouse.x,
          this._mouse.y,
          0);
        d.unproject(this.object),
        this.object.position.sub(d).add(l),
        this.object.updateMatrixWorld(),
        o=Ed.length()
      }else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),
      this.zoomToCursor=!1;
      o!==null&&(this.screenSpacePanning?this.target.set(0,
          0,
          -1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(uQ.origin.copy(this.object.position),
          uQ.direction.set(0,
            0,
            -1).transformDirection(this.object.matrix),
          Math.abs(this.object.up.dot(uQ.direction))<wqr?this.object.lookAt(this.target):(Hot.setFromNormalAndCoplanarPoint(this.object.up,
              this.target),
            uQ.intersectPlane(Hot,
              this.target))))
    }else if(this.object.isOrthographicCamera){
      const o=this.object.zoom;
      this.object.zoom=Math.max(this.minZoom,
        Math.min(this.maxZoom,
          this.object.zoom/this._scale)),
      o!==this.object.zoom&&(this.object.updateProjectionMatrix(),
        a=!0)
    }return this._scale=1,
    this._performCursorZoom=!1,
    a||this._lastPosition.distanceToSquared(this.object.position)>jye||8*(1-this._lastQuaternion.dot(this.object.quaternion))>jye||this._lastTargetPosition.distanceToSquared(this.target)>jye?(this.dispatchEvent(Bot),
      this._lastPosition.copy(this.object.position),
      this._lastQuaternion.copy(this.object.quaternion),
      this._lastTargetPosition.copy(this.target),
      !0):!1
  }_getAutoRotationAngle(e){
    return e!==null?rm/60*this.autoRotateSpeed*e:rm/60/60*this.autoRotateSpeed
  }_getZoomScale(e){
    const n=Math.abs(e*.01);
    return Math.pow(.95,
      this.zoomSpeed*n)
  }_rotateLeft(e){
    this._sphericalDelta.theta-=e
  }_rotateUp(e){
    this._sphericalDelta.phi-=e
  }_panLeft(e,
    n){
    Ed.setFromMatrixColumn(n,
      0),
    Ed.multiplyScalar(-e),
    this._panOffset.add(Ed)
  }_panUp(e,
    n){
    this.screenSpacePanning===!0?Ed.setFromMatrixColumn(n,
      1):(Ed.setFromMatrixColumn(n,
        0),
      Ed.crossVectors(this.object.up,
        Ed)),
    Ed.multiplyScalar(e),
    this._panOffset.add(Ed)
  }_pan(e,
    n){
    const r=this.domElement;
    if(this.object.isPerspectiveCamera){
      const s=this.object.position;
      Ed.copy(s).sub(this.target);
      let a=Ed.length();
      a*=Math.tan(this.object.fov/2*Math.PI/180),
      this._panLeft(2*e*a/r.clientHeight,
        this.object.matrix),
      this._panUp(2*n*a/r.clientHeight,
        this.object.matrix)
    }else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/r.clientWidth,
        this.object.matrix),
      this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/r.clientHeight,
        this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),
      this.enablePan=!1)
  }_dollyOut(e){
    this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),
      this.enableZoom=!1)
  }_dollyIn(e){
    this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),
      this.enableZoom=!1)
  }_updateZoomParameters(e,
    n){
    if(!this.zoomToCursor)return;
    this._performCursorZoom=!0;
    const r=this.domElement.getBoundingClientRect(),
    s=e-r.left,
    a=n-r.top,
    o=r.width,
    l=r.height;
    this._mouse.x=s/o*2-1,
    this._mouse.y=-(a/l)*2+1,
    this._dollyDirection.set(this._mouse.x,
      this._mouse.y,
      1).unproject(this.object).sub(this.object.position).normalize()
  }_clampDistance(e){
    return Math.max(this.minDistance,
      Math.min(this.maxDistance,
        e))
  }_handleMouseDownRotate(e){
    this._rotateStart.set(e.clientX,
      e.clientY)
  }_handleMouseDownDolly(e){
    this._updateZoomParameters(e.clientX,
      e.clientX),
    this._dollyStart.set(e.clientX,
      e.clientY)
  }_handleMouseDownPan(e){
    this._panStart.set(e.clientX,
      e.clientY)
  }_handleMouseMoveRotate(e){
    this._rotateEnd.set(e.clientX,
      e.clientY),
    this._rotateDelta.subVectors(this._rotateEnd,
      this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n=this.domElement;
    this._rotateLeft(rm*this._rotateDelta.x/n.clientHeight),
    this._rotateUp(rm*this._rotateDelta.y/n.clientHeight),
    this._rotateStart.copy(this._rotateEnd),
    this.update()
  }_handleMouseMoveDolly(e){
    this._dollyEnd.set(e.clientX,
      e.clientY),
    this._dollyDelta.subVectors(this._dollyEnd,
      this._dollyStart),
    this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),
    this._dollyStart.copy(this._dollyEnd),
    this.update()
  }_handleMouseMovePan(e){
    this._panEnd.set(e.clientX,
      e.clientY),
    this._panDelta.subVectors(this._panEnd,
      this._panStart).multiplyScalar(this.panSpeed),
    this._pan(this._panDelta.x,
      this._panDelta.y),
    this._panStart.copy(this._panEnd),
    this.update()
  }_handleMouseWheel(e){
    this._updateZoomParameters(e.clientX,
      e.clientY),
    e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),
    this.update()
  }_handleKeyDown(e){
    let n=!1;
    switch(e.code){
      case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,
        this.keyPanSpeed),
      n=!0;
      break;
      case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,
        -this.keyPanSpeed),
      n=!0;
      break;
      case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,
        0),
      n=!0;
      break;
      case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,
        0),
      n=!0;
      break
    }n&&(e.preventDefault(),
      this.update())
  }_handleTouchStartRotate(e){
    if(this._pointers.length===1)this._rotateStart.set(e.pageX,
      e.pageY);
    else{
      const n=this._getSecondPointerPosition(e),
      r=.5*(e.pageX+n.x),
      s=.5*(e.pageY+n.y);
      this._rotateStart.set(r,
        s)
    }
  }_handleTouchStartPan(e){
    if(this._pointers.length===1)this._panStart.set(e.pageX,
      e.pageY);
    else{
      const n=this._getSecondPointerPosition(e),
      r=.5*(e.pageX+n.x),
      s=.5*(e.pageY+n.y);
      this._panStart.set(r,
        s)
    }
  }_handleTouchStartDolly(e){
    const n=this._getSecondPointerPosition(e),
    r=e.pageX-n.x,
    s=e.pageY-n.y,
    a=Math.sqrt(r*r+s*s);
    this._dollyStart.set(0,
      a)
  }_handleTouchStartDollyPan(e){
    this.enableZoom&&this._handleTouchStartDolly(e),
    this.enablePan&&this._handleTouchStartPan(e)
  }_handleTouchStartDollyRotate(e){
    this.enableZoom&&this._handleTouchStartDolly(e),
    this.enableRotate&&this._handleTouchStartRotate(e)
  }_handleTouchMoveRotate(e){
    if(this._pointers.length==1)this._rotateEnd.set(e.pageX,
      e.pageY);
    else{
      const r=this._getSecondPointerPosition(e),
      s=.5*(e.pageX+r.x),
      a=.5*(e.pageY+r.y);
      this._rotateEnd.set(s,
        a)
    }this._rotateDelta.subVectors(this._rotateEnd,
      this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n=this.domElement;
    this._rotateLeft(rm*this._rotateDelta.x/n.clientHeight),
    this._rotateUp(rm*this._rotateDelta.y/n.clientHeight),
    this._rotateStart.copy(this._rotateEnd)
  }_handleTouchMovePan(e){
    if(this._pointers.length===1)this._panEnd.set(e.pageX,
      e.pageY);
    else{
      const n=this._getSecondPointerPosition(e),
      r=.5*(e.pageX+n.x),
      s=.5*(e.pageY+n.y);
      this._panEnd.set(r,
        s)
    }this._panDelta.subVectors(this._panEnd,
      this._panStart).multiplyScalar(this.panSpeed),
    this._pan(this._panDelta.x,
      this._panDelta.y),
    this._panStart.copy(this._panEnd)
  }_handleTouchMoveDolly(e){
    const n=this._getSecondPointerPosition(e),
    r=e.pageX-n.x,
    s=e.pageY-n.y,
    a=Math.sqrt(r*r+s*s);
    this._dollyEnd.set(0,
      a),
    this._dollyDelta.set(0,
      Math.pow(this._dollyEnd.y/this._dollyStart.y,
        this.zoomSpeed)),
    this._dollyOut(this._dollyDelta.y),
    this._dollyStart.copy(this._dollyEnd);
    const o=(e.pageX+n.x)*.5,
    l=(e.pageY+n.y)*.5;
    this._updateZoomParameters(o,
      l)
  }_handleTouchMoveDollyPan(e){
    this.enableZoom&&this._handleTouchMoveDolly(e),
    this.enablePan&&this._handleTouchMovePan(e)
  }_handleTouchMoveDollyRotate(e){
    this.enableZoom&&this._handleTouchMoveDolly(e),
    this.enableRotate&&this._handleTouchMoveRotate(e)
  }_addPointer(e){
    this._pointers.push(e.pointerId)
  }_removePointer(e){
    delete this._pointerPositions[e.pointerId];
    for(let n=0;
      n<this._pointers.length;
      n++)if(this._pointers[n]==e.pointerId){
      this._pointers.splice(n,
        1);
      return
    }
  }_isTrackingPointer(e){
    for(let n=0;
      n<this._pointers.length;
      n++)if(this._pointers[n]==e.pointerId)return!0;
    return!1
  }_trackPointer(e){
    let n=this._pointerPositions[e.pointerId];
    n===void 0&&(n=new On,
      this._pointerPositions[e.pointerId]=n),
    n.set(e.pageX,
      e.pageY)
  }_getSecondPointerPosition(e){
    const n=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];
    return this._pointerPositions[n]
  }_customWheelEvent(e){
    const n=e.deltaMode,
    r={
      clientX:e.clientX,
      clientY:e.clientY,
      deltaY:e.deltaY
    };
    switch(n){
      case 1:r.deltaY*=16;
      break;
      case 2:r.deltaY*=100;
      break
    }return e.ctrlKey&&!this._controlActive&&(r.deltaY*=10),
    r
  }
}function kqr(t){
  this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(t.pointerId),
      this.domElement.ownerDocument.addEventListener("pointermove",
        this._onPointerMove),
      this.domElement.ownerDocument.addEventListener("pointerup",
        this._onPointerUp)),
    !this._isTrackingPointer(t)&&(this._addPointer(t),
      t.pointerType==="touch"?this._onTouchStart(t):this._onMouseDown(t)))
}function Sqr(t){
  this.enabled!==!1&&(t.pointerType==="touch"?this._onTouchMove(t):this._onMouseMove(t))
}function Tqr(t){
  switch(this._removePointer(t),
    this._pointers.length){
    case 0:this.domElement.releasePointerCapture(t.pointerId),
    this.domElement.ownerDocument.removeEventListener("pointermove",
      this._onPointerMove),
    this.domElement.ownerDocument.removeEventListener("pointerup",
      this._onPointerUp),
    this.dispatchEvent(bKt),
    this.state=po.NONE;
    break;
    case 1:const e=this._pointers[0],
    n=this._pointerPositions[e];
    this._onTouchStart({
        pointerId:e,
        pageX:n.x,
        pageY:n.y
      });
    break
  }
}function Aqr(t){
  let e;
  switch(t.button){
    case 0:e=this.mouseButtons.LEFT;
    break;
    case 1:e=this.mouseButtons.MIDDLE;
    break;
    case 2:e=this.mouseButtons.RIGHT;
    break;
    default:e=-1
  }switch(e){
    case wm.DOLLY:if(this.enableZoom===!1)return;
    this._handleMouseDownDolly(t),
    this.state=po.DOLLY;
    break;
    case wm.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){
      if(this.enablePan===!1)return;
      this._handleMouseDownPan(t),
      this.state=po.PAN
    }else{
      if(this.enableRotate===!1)return;
      this._handleMouseDownRotate(t),
      this.state=po.ROTATE
    }break;
    case wm.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){
      if(this.enableRotate===!1)return;
      this._handleMouseDownRotate(t),
      this.state=po.ROTATE
    }else{
      if(this.enablePan===!1)return;
      this._handleMouseDownPan(t),
      this.state=po.PAN
    }break;
    default:this.state=po.NONE
  }this.state!==po.NONE&&this.dispatchEvent(bBe)
}function Cqr(t){
  switch(this.state){
    case po.ROTATE:if(this.enableRotate===!1)return;
    this._handleMouseMoveRotate(t);
    break;
    case po.DOLLY:if(this.enableZoom===!1)return;
    this._handleMouseMoveDolly(t);
    break;
    case po.PAN:if(this.enablePan===!1)return;
    this._handleMouseMovePan(t);
    break
  }
}function Eqr(t){
  this.enabled===!1||this.enableZoom===!1||this.state!==po.NONE||(t.preventDefault(),
    this.dispatchEvent(bBe),
    this._handleMouseWheel(this._customWheelEvent(t)),
    this.dispatchEvent(bKt))
}function jqr(t){
  this.enabled!==!1&&this._handleKeyDown(t)
}function Iqr(t){
  switch(this._trackPointer(t),
    this._pointers.length){
    case 1:switch(this.touches.ONE){
      case P8.ROTATE:if(this.enableRotate===!1)return;
      this._handleTouchStartRotate(t),
      this.state=po.TOUCH_ROTATE;
      break;
      case P8.PAN:if(this.enablePan===!1)return;
      this._handleTouchStartPan(t),
      this.state=po.TOUCH_PAN;
      break;
      default:this.state=po.NONE
    }break;
    case 2:switch(this.touches.TWO){
      case P8.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;
      this._handleTouchStartDollyPan(t),
      this.state=po.TOUCH_DOLLY_PAN;
      break;
      case P8.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;
      this._handleTouchStartDollyRotate(t),
      this.state=po.TOUCH_DOLLY_ROTATE;
      break;
      default:this.state=po.NONE
    }break;
    default:this.state=po.NONE
  }this.state!==po.NONE&&this.dispatchEvent(bBe)
}function Mqr(t){
  switch(this._trackPointer(t),
    this.state){
    case po.TOUCH_ROTATE:if(this.enableRotate===!1)return;
    this._handleTouchMoveRotate(t),
    this.update();
    break;
    case po.TOUCH_PAN:if(this.enablePan===!1)return;
    this._handleTouchMovePan(t),
    this.update();
    break;
    case po.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;
    this._handleTouchMoveDollyPan(t),
    this.update();
    break;
    case po.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;
    this._handleTouchMoveDollyRotate(t),
    this.update();
    break;
    default:this.state=po.NONE
  }
}function Nqr(t){
  this.enabled!==!1&&t.preventDefault()
}function Pqr(t){
  t.key==="Control"&&(this._controlActive=!0,
    this.domElement.getRootNode().addEventListener("keyup",
      this._interceptControlUp,
      {
        passive:!0,
        capture:!0
      }))
}function Rqr(t){
  t.key==="Control"&&(this._controlActive=!1,
    this.domElement.getRootNode().removeEventListener("keyup",
      this._interceptControlUp,
      {
        passive:!0,
        capture:!0
      }))
}const Fqr=3072,Oqr=.05,Lqr=.75;
function Dqr(t){
  const{
    scene:e,
    camera:n,
    renderer:r,
    meshById:s
  }=t,
  {
    floor:a,
    sun:o,
    applyDaylight:l
  }=wOr(e,
    {
      shadowMapPx:Math.min(Fqr,
        r.capabilities.maxTextureSize)
    }),
  c=new _qr(n,
    r.domElement);
  c.target.set(0,
    1,
    0),
  c.enableDamping=!0,
  c.rotateSpeed=Lqr,
  c.mouseButtons={
    LEFT:wm.ROTATE,
    MIDDLE:wm.PAN,
    RIGHT:null
  },
  c.enableZoom=!1;
  function d(){
    const g=[a];
    for(const b of s.values()){
      const y=b.userData.kind;
      y==="camera"||y==="target"||y==="spotlight"||y==="humanoid"||y==="simple_figure"||y==="group"||g.push(b)
    }return g
  }const u=new Ge,
  h=new On;
  let f=!1;
  c.addEventListener("start",
    ()=>{
      f=!0
    }),
  c.addEventListener("end",
    ()=>{
      f=!1
    });
  const m=()=>{
    r.getDrawingBufferSize(h);
    const g=h.y/2*n.projectionMatrix.elements[5]/Math.max(1e-6,
      n.position.distanceTo(c.target)),
    b=n.position.distanceTo(u)*g;
    if(u.copy(n.position),
      f||b===0||b>=Oqr)return;
    const y=n.position.clone(),
    v=c.target.clone();
    c.enableDamping=!1,
    c.update(),
    c.enableDamping=!0,
    n.position.copy(y),
    c.target.copy(v),
    c.update()
  };
  return{
    orbit:c,
    sun:o,
    applyDaylight:l,
    floor:a,
    walkableSurfaces:d,
    tick:()=>{
      c.enabled&&(c.update(),
        m())
    },
    dispose:()=>c.dispose()
  }
}const yKt="stage-finish",Bqr=11;
function $ot(t){
  try{
    const e=t?.getItem(yKt);
    if(!e)return null;
    const{
      enabled:n,
      source:r
    }=JSON.parse(e);
    return typeof n!="boolean"||r!=="auto"&&r!=="manual"?null:{
      enabled:n,
      source:r
    }
  }catch{
    return null
  }
}function Hqr(t,
  e){
  try{
    t?.setItem(yKt,
      JSON.stringify(e))
  }catch{
    
  }
}const $qr=1920*1080,Vqr=320*200,Uqr=t=>t>=Vqr,zqr=t=>t.costMs*Math.max(1,
  $qr/t.pixels)<=Bqr,Wqr=5,Gqr=2;
function qqr(t){
  const e=t.now??(()=>performance.now()),
  n=l=>{
    const c=e();
    return l(),
    t.finishGpu(),
    e()-c
  };
  for(let l=0;
    l<Gqr;
    l++)n(t.drawPlain),
  n(t.drawFinished);
  const r=[],
  s=[];
  for(let l=0;
    l<Wqr;
    l++)r.push(n(t.drawPlain)),
  s.push(n(t.drawFinished));
  const a=l=>l.sort((c,
      d)=>c-d)[l.length>>1],
  o=a(r);
  return{
    costMs:Math.max(0,
      a(s)-o),
    plainMs:o,
    pixels:t.pixels
  }
}const Zqr=30,Kqr=300;
function Xqr(){
  let t=0,
  e=Zqr,
  n=0;
  return{
    frame:()=>++t>=e,
    report:r=>zqr(r)?!0:++n>=2?!1:(e=t+Kqr,
      null)
  }
}const Yqr=1e3,Iye=250,Qqr=50;
function Jqr(){
  const t=new Uint32Array(Iye+1);
  let e=0,
  n=0;
  const r=s=>{
    const a=Math.ceil(s*e);
    let o=0;
    for(let l=0;
      l<t.length;
      l++)if(o+=t[l],
      o>=a)return l;
    return Iye
  };
  return{
    add:s=>{
      !(s>0)||s>Yqr||(t[Math.min(Iye,
            Math.round(s))]++,
        e++,
        s>Qqr&&n++)
    },
    summary:()=>e===0?null:{
      frames:e,
      p50Ms:r(.5),
      p95Ms:r(.95),
      slowShare:Math.round(n/e*1e3)/1e3
    }
  }
}const eZr=16777215,tZr=1,nZr=30,Mye={
  x:0,
  y:.42,
  z:5.1
},Vot=.17,rZr=.085,Uot=12,sZr=.68,aZr=1,iZr=.82,oZr=12;
function lZr(t){
  const

/*==============================================================================
 * 27. RIG HANDLES xqr — joint spheres, selection colors
 * source file: tmp_b/record_mqr_pretty.js
 ==============================================================================*/
mqr(t,
  e){
  const{
    a:n,
    camera:r
  }=t;
  let s=null,
  a=null,
  o=!1,
  l=0,
  c={
    fromS:0,
    runS:0
  },
  d=!1;
  const u=new Map;
  let h=null,
  f=null,
  m=0,
  g=null,
  b=!1,
  y=!1,
  v=new Set;
  const x=lZt(),
  w=new Xo,
  k=new Xo,
  S=new Set;
  let T=0,
  A=null;
  const C=me=>me==="off"?null:Dzt({
      t:T,
      intensity:me
    });
  let E=0,
  j=null,
  I=!1;
  const N=new Ge,
  P=new qn;
  let F=!1;
  function B(me){
    const Te=new t0({
        antialias:!0,
        preserveDrawingBuffer:me.preserveDrawingBuffer
      });
    fZt(Te),
    Te.shadowMap.autoUpdate=!1,
    Te.setPixelRatio(1),
    Te.setSize(me.width,
      me.height,
      me.updateStyle);
    const Le=new Xo(FP,
      me.aspect,
      Khe,
      RP);
    let Fe=0;
    const tt=pZt({
        camera:Le,
        meshById:t.meshById,
        scene:t.scene,
        now:me.deterministic?()=>Fe*fqr:void 0
      });
    let Oe=null;
    const Je={
      renderer:Te,
      camera:Le,
      render:($e=!1)=>{
        e.redrawShadows(Te),
        $e&&Dje(Te)?(Oe??=hKt(Te),
          Oe.render(t.scene,
            Le)):Te.render(t.scene,
          Le)
      },
      fitPlanes:()=>{
        Fe++,
        tt.tick()
      },
      dispose:()=>{
        S.delete(Je),
        Oe?.dispose(),
        Te.forceContextLoss(),
        Te.dispose()
      }
    };
    return S.add(Je),
    Je
  }const H=()=>n.mode.peek()==="camera";
  function z(me){
    return L(me)[0]?.startS??0
  }function L(me){
    return n.show.peek().tracks.find(Te=>Te.characterId===me)?.items??[]
  }function $(me){
    return me.focalLengthMm??Hv
  }function O(me){
    const Te=L(me)[0];
    return Te?.kind==="cam-follow"&&Te.offset&&Te.objectId&&Te.startS<=0?Te:null
  }function W(me,
    Te){
    const Le=Fe=>Fe<Te-1e-6;
    return{
      resolveAim:(Fe,
        tt)=>{
        if(Fe){
          if(Le(tt)){
            const Oe=e.playback.objectPoseAt(Fe,
              tt);
            if(Oe)return[Oe.position[0],
              Oe.position[1]+NP(Fe,
                n.objects.peek()),
              Oe.position[2]]
          }return ROr(t,
            Fe)
        }return xZt(t,
          me)?.target??null
      },
      resolveFollowObject:(Fe,
        tt)=>{
        if(Le(tt))return e.playback.objectPoseAt(Fe,
          tt);
        const Oe=t.meshById.get(Fe);
        return Oe?(Oe.getWorldPosition(dQ),
          Oe.getWorldQuaternion(wL),
          {
            position:[dQ.x,
              dQ.y,
              dQ.z],
            quaternion:[wL.x,
              wL.y,
              wL.z,
              wL.w]
          }):null
      }
    }
  }const U=()=>n.isPreviewPlaying.peek()||d,
  V=()=>!U()&&n.performanceSeekS.peek()!==null,
  G=()=>U()||V(),
  Z=()=>n.performanceTimeS.peek(),
  se=me=>{
    const Te=t.meshById.get(me);
    return!!Te&&e.isMeshDragged(Te)
  },
  X=me=>{
    const Te=t.meshById.get(me);
    return vFr({
        recording:s!==null,
        editMode:n.mode.peek()==="edit",
        meshDragged:!!Te&&e.isMeshDragged(Te),
        previewActive:G(),
        isSelected:me===n.selectedId.peek()
      })
  };
  function te(){
    e.updateCameraMarkerVisual()
  }function ne(me){
    const Te=n.isPreviewPlaying.peek(),
    Le=V();
    (Te&&!b||Le&&!y)&&te(),
    b=Te,
    y=Le,
    Q()
  }function Q(){
    const me=new Set;
    if(G()&&n.mode.peek()==="edit")for(const[Te,
        Le]of Object.entries(n.objects.peek())){
      if(Le.kind!=="camera"||X(Te))continue;
      const Fe=t.meshById.get(Te);
      Fe&&ce(Te,
        w)&&(Hie(Fe,
          w.position,
          w.quaternion),
        me.add(Te))
    }else if(n.mode.peek()==="edit")for(const[Te,
        Le]of Object.entries(n.objects.peek())){
      if(Le.kind!=="camera")continue;
      const Fe=O(Te);
      if(!Fe)continue;
      const tt=t.meshById.get(Te),
      Oe=t.meshById.get(Fe.objectId);
      if(!(!tt||!Oe)){
        if(X(Te)){
          v.has(Te)&&n.updateObjectTransform(Te,
            {
              position:[tt.position.x,
                tt.position.y,
                tt.position.z],
              rotation:[tt.rotation.x,
                tt.rotation.y,
                tt.rotation.z]
            });
          continue
        }U8r(Eye,
          Oe,
          Fe.offset),
        Hie(tt,
          Eye.position,
          Eye.quaternion),
        me.add(Te)
      }
    }for(const Te of v){
      if(!xFr({
            animatedNow:me.has(Te),
            dragging:se(Te)
          }))continue;
      const Le=t.meshById.get(Te),
      Fe=n.objects.peek()[Te];
      Le&&Fe&&(Le.position.set(...Fe.position),
        Le.rotation.set(...Fe.rotation))
    }v=new Set([...me,
        ...[...v].filter(Te=>se(Te))])
  }function q(me){
    let Te=0;
    if(j&&me>0){
      const Fe=r.position.x-j.x,
      tt=r.position.z-j.z;
      Te=Math.hypot(Fe,
        tt)/me
    }(j??=new Ge).copy(r.position);
    const Le=oEr({
        rig:gq[n.cameraRig.peek()],
        t:T,
        stridePhase:E,
        groundSpeedMps:Te,
        dtS:me
      });
    return E=Le.stridePhase,
    Le.pose
  }function Y(me){
    T+=me,
    n.mode.peek()==="camera"?A=q(me):(j=null,
      A=C(n.cameraShake.peek())),
    A&&H()&&(N.copy(r.position),
      P.copy(r.quaternion),
      I=!0,
      cL(r,
        A))
  }function re(){
    I&&(r.position.copy(N),
      r.quaternion.copy(P),
      I=!1)
  }function ae(me){
    return me.position.copy(r.position),
    me.quaternion.copy(r.quaternion),
    me.fov=BU(n),
    me.updateProjectionMatrix(),
    A&&cL(me,
      A),
    !0
  }function ie(me){
    return z2r(L(me),
      ge())
  }function ge(){
    return G()?Z():0
  }function pe(me,
    Te){
    if(ie(me))return;
    const Le=C(n.objects.peek()[me]?.shake??"off");
    Le&&cL(Te,
      Le)
  }function ce(me,
    Te){
    const Le=n.objects.peek()[me];
    if(!Le)return!1;
    const Fe=G(),
    tt=Am(n.recordAspect.peek()).aspect,
    Oe=t.meshById.get(me);
    if(X(me))return Oe?(Oe.getWorldPosition(Te.position),
      Oe.getWorldQuaternion(Te.quaternion),
      Te.fov=Z_($(Le),
        tt),
      Te.updateProjectionMatrix(),
      !0):!1;
    const Je=Zo(Le,
      n.objects.peek()),
    $e=Fe||!Oe?{
      position:Je.position,
      rotation:Je.rotation,
      focalLengthMm:$(Le)
    }:{
      ...Bie(Oe),
      focalLengthMm:$(Le)
    },
    Ue=ge();
    return dZt({
        items:L(me),
        timeS:Ue,
        base:$e,
        aspect:tt,
        resolvers:W(me,
          Ue),
        out:x
      }),
    Te.position.copy(x.position),
    Te.quaternion.copy(x.quaternion),
    Te.fov=x.fovDeg,
    !0
  }function be(me,
    Te){
    return H()&&n.filmingCameraId.peek()===me?ae(Te):ce(me,
      Te)?(Te.updateProjectionMatrix(),
      pe(me,
        Te),
      !0):!1
  }async function fe(me){
    const Te=me.aim??ae,
    Le=me.takeOver?{
      position:r.position.clone(),
      quaternion:r.quaternion.clone(),
      fov:r.fov
    }:null;
    me.takeOver&&(e.detachGizmo(),
      e.orbit.enabled=!1);
    const{
      width:Fe,
      height:tt
    }=Am(n.recordAspect.peek()),
    Oe=we(me.record===!1),
    Je=e.finishEnabled(),
    $e=document.createElement("canvas");
    $e.width=Fe,
    $e.height=tt;
    const Ue=$e.getContext("2d");
    let et=!1;
    const He=()=>{
      et||(et=!0,
        Ee())
    },
    qe=ze=>{
      !Le||t.isDisposed()||(ze&&(r.position.copy(Le.position),
          r.quaternion.copy(Le.quaternion),
          r.fov=Le.fov,
          r.updateProjectionMatrix()),
        e.applyMode())
    };
    try{
      if(!Ue)throw new Error("2d context unavailable for capture");
      const ze=()=>{
        Oe.fitPlanes(),
        Oe.render(pqr({
              offlineFrame:F,
              recorded:me.record!==!1,
              enabled:Je
            })),
        Ue.drawImage(Oe.renderer.domElement,
          0,
          0)
      };
      e.playback.resetPerformersToStart(),
      me.takeOver?.poseFirstFrame();
      const We=Ew(t);
      Te(Oe.camera),
      ze(),
      We();
      const dt=me.record===!1?null:uqr($e);
      let mt=1,
      jt=!1;
      const bt=()=>{
        jt||(jt=!0,
          mt=0,
          dt?.start())
      };
      return me.deferStart||bt(),
      {
        canvas:$e,
        startRecording:bt,
        renderFrame:()=>{
          !et&&Te(Oe.camera)&&(ze(),
            jt&&mt++)
        },
        stop:async()=>(bt(),
          dt?{
            ...await dt.stop(),
            framesRendered:mt
          }:{
            videoBlob:new Blob,
            videoMimeType:"",
            width:Fe,
            height:tt,
            durationS:0,
            framesRendered:mt
          }),
        dispose:()=>{
          He(),
          qe(!0)
        }
      }
    }catch(ze){
      throw He(),
      qe(me.takeOver?.restorePoseOnFailure!==!1),
      ze
    }
  }function we(me){
    if(!f){
      const{
        aspect:Te,
        width:Le,
        height:Fe
      }=Am(n.recordAspect.peek());
      f=B({
          width:Le,
          height:Fe,
          aspect:Te,
          preserveDrawingBuffer:!0,
          updateStyle:!1,
          deterministic:me
        })
    }return m++,
    f
  }function Ee(){
    m=Math.max(0,
      m-1),
    m===0&&f&&(f.dispose(),
      f=null)
  }function xe(){
    return h||(h=B({
          width:1,
          height:1,
          aspect:1,
          preserveDrawingBuffer:!0,
          updateStyle:!1
        })),
    h
  }function J(){
    u.size===0&&h&&(e.forgetStroke(h.renderer),
      h.dispose(),
      h=null)
  }function le(me,
    Te,
    Le){
    const Fe=document.createElement("canvas"),
    tt=Fe.getContext("2d");
    tt&&(Te.appendChild(Fe),
      u.set(me,
        {
          host:Te,
          canvas:Fe,
          ctx:tt,
          aim:Le
        }))
  }function ue(me){
    const Te=u.get(me);
    Te&&(Te.canvas.remove(),
      u.delete(me))
  }async function oe(me,
    Te=!0){
    const Le=[];
    d=!0,
    te();
    try{
      for(const Fe of me)Le.push({
          cameraId:Fe,
          startsAtS:z(Fe),
          rolling:!1,
          session:await fe({
              deferStart:!0,
              record:Te,
              aim:tt=>be(Fe,
                tt)
            })
        });
      return Le
    }catch(Fe){
      d=!1;
      for(const tt of Le)tt.session.dispose();
      throw Fe
    }
  }async function ye(me){
    a=null,
    d=!1,
    e.playback.stopManualClock();
    try{
      const Te={
        
      };
      return await Promise.all(me.map(async Le=>{
            const Fe=await Le.session.stop();
            Te[Le.cameraId]=Le.rolling?Fe:null
          })),
      Te
    }finally{
      for(const Te of me)Te.session.dispose()
    }
  }function je(me,
    Te){
    const Le=Te.host.clientWidth,
    Fe=Te.host.clientHeight;
    if(Le<=0||Fe<=0)return!1;
    const tt=xe(),
    Oe=tt.renderer.domElement;
    (Oe.width!==Le||Oe.height!==Fe)&&(tt.renderer.setSize(Le,
        Fe,
        !1),
      tt.camera.aspect=Le/Fe);
    const Je=Te.aim?Te.aim(tt.camera):be(me,
      tt.camera);
    if(!Je)return!1;
    tt.fitPlanes();
    const $e=Je==="plan"||Je==="selection"?jOr(t):null,
    Ue=Je==="selection"?e.showSelectionRings(tt.camera,
      Fe):null;
    try{
      tt.render(),
      Je==="selection"&&e.strokeSelection(tt.renderer,
        tt.camera)
    }finally{
      Ue?.(),
      $e?.()
    }return(Te.canvas.width!==Le||Te.canvas.height!==Fe)&&(Te.canvas.width=Le,
      Te.canvas.height=Fe),
    Te.ctx.drawImage(Oe,
      0,
      0),
    !0
  }function ve(me){
    if(s){
      const Te=Ew(t);
      s.renderFrame(),
      Te()
    }if(u.size>0||a){
      const Te=Ew(t),
      Le=new Map(a?.map(({
              cameraId:Fe,
              session:tt
            })=>[Fe,
            tt])??[]);
      for(const[Fe,
          tt]of u)Le.has(Fe)||je(Fe,
        tt);
      if(a){
        const Fe=n.performanceTimeS.peek();
        let tt=!1;
        for(const Oe of a){
          const{
            cameraId:Je,
            session:$e
          }=Oe;
          !Oe.rolling&&Fe>=Oe.startsAtS&&($e.startRecording(),
            Oe.rolling=!0,
            tt=!0);
          const Ue=u.get(Je),
          et=Ue?.host.clientWidth??0,
          He=Ue?.host.clientHeight??0,
          qe=!!Ue&&et>0&&He>0;
          (qe||!o)&&$e.renderFrame(),
          qe&&((Ue.canvas.width!==et||Ue.canvas.height!==He)&&(Ue.canvas.width=et,
              Ue.canvas.height=He),
            Ue.ctx.drawImage($e.canvas,
              0,
              0,
              et,
              He))
        }tt&&n.rollingCameraIds.set(a.filter(Oe=>Oe.rolling).map(Oe=>Oe.cameraId))
      }Te()
    }if(g){
      const Te=g.host.clientWidth,
      Le=g.host.clientHeight,
      Fe=g.rig.renderer.domElement;
      Te>0&&Le>0&&(Fe.width!==Te||Fe.height!==Le)&&(g.rig.renderer.setSize(Te,
          Le),
        g.rig.camera.aspect=Te/Le);
      const tt=g.rig.camera;
      if(ke(tt)){
        tt.updateProjectionMatrix(),
        g.rig.fitPlanes();
        const Oe=Ew(t);
        g.rig.render(),
        Oe()
      }
    }
  }function ke(me){
    if(H())return ae(me);
    const Te=iBe(t)?.userData.objectId;
    return Te&&ce(Te,
      me)?(A&&!ie(Te)&&cL(me,
        A),
      !0):vZt(t,
      null,
      me)?(me.fov=BU(n),
      A&&cL(me,
        A),
      !0):!1
  }function Ae(){
    const me=t.renderer.domElement,
    Te=Math.min(1,
      768/Math.max(1,
        me.width)),
    Le=Math.max(1,
      Math.round(me.width*Te)),
    Fe=Math.max(1,
      Math.round(me.height*Te)),
    tt=document.createElement("canvas");
    tt.width=Le,
    tt.height=Fe;
    const Oe=tt.getContext("2d");
    return Oe?(Oe.drawImage(me,
        0,
        0,
        Le,
        Fe),
      tt.toDataURL("image/png")):me.toDataURL("image/png")
  }function Se(me,
    Te=!1){
    const Le=Am(n.recordAspect.peek()),
    Fe=Le.aspect,
    tt=Te?Le.width:768,
    Oe=Te?Le.height:Math.round(tt/Fe),
    Je=B({
        width:tt,
        height:Oe,
        aspect:Fe,
        preserveDrawingBuffer:!0,
        updateStyle:!1
      });
    if(!ce(me,
        Je.camera))return Je.dispose(),
    null;
    Je.camera.updateProjectionMatrix(),
    Je.fitPlanes();
    const $e=Ew(t);
    Je.render(!0);
    const Ue=Je.renderer.domElement.toDataURL("image/png");
    return $e(),
    Je.dispose(),
    Ue
  }return{
    isViewportFilming:H,
    isTakeRolling:()=>s!==null,
    isCapturing:()=>s!==null||a!==null,
    foldResolvers:W,
    cameraFovDeg:me=>ce(me,
      k)?k.fov:null,
    captureViewport:Ae,
    captureCamera:Se,
    aimHubCamera:be,
    tickPreview:ne,
    tickShake:Y,
    restoreShake:re,
    tickCapture:ve,
    startRecording:async()=>{
      s=await fe({
          
        }),
      e.playback.startManualClock()
    },
    stopRecording:async()=>{
      const me=s;
      if(!me)throw new Error("not recording");
      s=null,
      e.playback.stopManualClock();
      try{
        return await me.stop()
      }finally{
        me.dispose()
      }
    },
    startHubRecording:async(me,
      Te)=>{
      if(s||a)throw new Error("already recording");
      o=Te?.monitorOnly===!0,
      a=await oe(me,
        !o),
      l=e.playback.startManualClock({
          bounded:!0
        })
    },
    stopHubRecording:async()=>{
      if(!a)throw new Error("not recording");
      c={
        fromS:l,
        runS:n.performanceTimeS.peek()-l
      };
      const me=await ye(a);
      return o?{
        
      }:me
    },
    canRenderOffline:()=>{
      const{
        width:me,
        height:Te
      }=Am(n.recordAspect.peek());
      return mKt(me,
        Te)
    },
    beginOfflineHub:async me=>{
      if(s||a)throw new Error("already recording");
      const Te=await oe(me,
        !1),
      {
        fromS:Le
      }=c;
      return e.playback.startManualClock({
          fromS:Le
        }),
      {
        fromS:Le,
        runS:Math.max(.1,
          c.runS),
        cameras:Te.map(({
              cameraId:Fe,
              startsAtS:tt,
              session:Oe
            })=>({
              cameraId:Fe,
              startsAtS:tt,
              canvas:Oe.canvas,
              renderFrame:()=>{
                const Je=Ew(t);
                F=!0;
                try{
                  Oe.renderFrame()
                }finally{
                  F=!1,
                  Je()
                }
              }
            })),
        settle:()=>{
          d=!1,
          e.playback.stopManualClock();
          for(const Fe of Te)Fe.session.dispose()
        }
      }
    },
    recordHubBatch:async me=>{
      const Te=Math.max(.1,
        c.runS);
      if(s||a)throw new Error("already recording");
      const Le=await oe(me);
      a=Le;
      try{
        e.playback.startManualClock({
            fromS:c.fromS
          }),
        await new Promise(Fe=>setTimeout(Fe,
            Te*1e3))
      }catch(Fe){
        throw await ye(Le),
        Fe
      }return await ye(Le)
    },
    redrawFeed:me=>{
      const Te=u.get(me);
      if(!Te||a)return!1;
      const Le=Ew(t);
      try{
        return je(me,
          Te)
      }finally{
        Le()
      }
    },
    attachFeed:(me,
      Te,
      Le)=>{
      for(const[tt,
          Oe]of u)tt!==me&&Oe.host===Te&&ue(tt);
      const Fe=u.get(me);
      if(Fe){
        Fe.host!==Te&&Te.appendChild(Fe.canvas),
        u.set(me,
          {
            ...Fe,
            host:Te,
            aim:Le
          });
        return
      }le(me,
        Te,
        Le)
    },
    detachFeed:me=>{
      queueMicrotask(()=>{
          if(t.isDisposed())return;
          const Te=u.get(me);
          !Te||Te.host.isConnected||(ue(me),
            J())
        })
    },
    attachPreview:me=>{
      if(g)return;
      const Te=B({
          width:me.clientWidth,
          height:me.clientHeight,
          aspect:me.clientWidth/Math.max(1,
            me.clientHeight),
          preserveDrawingBuffer:!1,
          updateStyle:!0
        });
      g={
        rig:Te,
        host:me
      },
      me.appendChild(Te.renderer.domElement)
    },
    detachPreview:()=>{
      g&&(g.rig.renderer.domElement.remove(),
        g.rig.dispose(),
        g=null)
    },
    dispose:()=>{
      if(s){
        const me=s;
        s=null,
        me.stop().catch(()=>{
            
          }),
        me.dispose()
      }for(const me of u.values())me.canvas.remove();
      if(u.clear(),
        h?.dispose(),
        h=null,
        f?.dispose(),
        f=null,
        m=0,
        a){
        for(const{
            session:me
          }of a)me.stop().catch(()=>{
            
          }),
        me.dispose();
        a=null
      }d=!1,
      g&&(g.rig.renderer.domElement.remove(),
        g.rig.dispose(),
        g=null);
      for(const me of[...S])me.dispose()
    }
  }
}async function gqr(t){
  const e=await t.beginOfflineHub(t.cameraIds);
  try{
    return await dEr({
        cameras:e.cameras,
        fromS:e.fromS,
        runS:e.runS,
        fps:Qne,
        step:t.step,
        encoderFor:gKt,
        onProgress:t.onProgress
      })
  }finally{
    e.settle()
  }
}const bqr=.028,yqr=4500223,vqr=16763972;
function xqr(t,
  e){
  const{
    a:n
  }=t,
  r=new Ci;
  r.renderOrder=1,
  t.scene.add(r),
  t.planningAids.push(()=>[r]);
  const s=new Ku(bqr,
    12,
    8),
  a=new tl({
      color:yqr,
      depthTest:!1
    }),
  o=new tl({
      color:vqr,
      depthTest:!1
    });
  let l=[];
  const c=new Map;
  let d=null;
  function u(){
    for(const m of c.values())r.remove(m);
    c.clear(),
    t.rigJointPickables.length=0,
    d=null
  }function h(m){
    u();
    for(const g of e.majorJointsOf(m)){
      const b=new Vt(s,
        a);
      b.userData.rigJoint=g.name,
      b.userData.rigObjectId=m,
      r.add(b),
      c.set(g.name,
        b),
      t.rigJointPickables.push(b)
    }d=c.size>0?m:null
  }function f(){
    const m=n.selectedSegment.peek();
    if(!m)return!1;
    const g=n.show.peek().tracks.find(y=>y.id===m.trackId)?.items.find(y=>y.id===m.itemId);
    if(g?.kind!=="rig-transform")return!1;
    const b=n.performanceTimeS.peek()-g.startS;
    return b>=0&&b<=g.durationS
  }return{
    selectedJoints:()=>l,
    setSelectedJoints:m=>{
      l=m
    },
    tick:()=>{
      const m=n.rigPoseObjectId.peek();
      if(!m||!f()){
        r.visible=!1,
        (d!==null||c.size>0)&&u(),
        l=[];
        return
      }r.visible=!0,
      d!==m&&h(m);
      for(const[g,
          b]of c){
        const y=e.boneOf(m,
          g);
        y&&(y.getWorldPosition(b.position),
          b.material=l.includes(g)?o:a)
      }
    }
  }
}const Bot={
  type:"change"
},bBe={
  type:"start"
},bKt={
  type:"end"
},uQ=new PR,Hot=new r2,wqr=Math.cos(70*m_.DEG2RAD),Ed=new Ge,rm=2*Math.PI,po={
  NONE:-1,
  ROTATE:0,
  DOLLY:1,
  PAN:2,
  TOUCH_ROTATE:3,
  TOUCH_PAN:4,
  TOUCH_DOLLY_PAN:5,
  TOUCH_DOLLY_ROTATE:6
},jye=1e-6;
class _qr extends xDe{
  constructor(e,
    n=null){
    super(e,
      n),
    this.state=po.NONE,
    this.target=new Ge,
    this.cursor=new Ge,
    this.minDistance=0,
    this.maxDistance=1/0,
    this.minZoom=0,
    this.maxZoom=1/0,
    this.minTargetRadius=0,
    this.maxTargetRadius=1/0,
    this.minPolarAngle=0,
    this.maxPolarAngle=Math.PI,
    this.minAzimuthAngle=-1/0,
    this.maxAzimuthAngle=1/0,
    this.enableDamping=!1,
    this.dampingFactor=.05,
    this.enableZoom=!0,
    this.zoomSpeed=1,
    this.enableRotate=!0,
    this.rotateSpeed=1,
    this.keyRotateSpeed=1,
    this.enablePan=!0,
    this.panSpeed=1,
    this.screenSpacePanning=!0,
    this.keyPanSpeed=7,
    this.zoomToCursor=!1,
    this.autoRotate=!1,
    this.autoRotateSpeed=2,
    this.keys={
      LEFT:"ArrowLeft",
      UP:"ArrowUp",
      RIGHT:"ArrowRight",
      BOTTOM:"ArrowDown"
    },
    this.mouseButtons={
      LEFT:wm.ROTATE,
      MIDDLE:wm.DOLLY,
      RIGHT:wm.PAN
    },
    this.touches={
      ONE:P8.ROTATE,
      TWO:P8.DOLLY_PAN
    },
    this.target0=this.target.clone(),
    this.position0=this.object.position.clone(),
    this.zoom0=this.object.zoom,
    this._domElementKeyEvents=null,
    this._lastPosition=new Ge,
    this._lastQuaternion=new qn,
    this._lastTargetPosition=new Ge,
    this._quat=new qn().setFromUnitVectors(e.up,
      new Ge(0,
        1,
        0)),
    this._quatInverse=this._quat.clone().invert(),
    this._spherical=new XEe,
    this._sphericalDelta=new XEe,
    this._scale=1,
    this._panOffset=new Ge,
    this._rotateStart=new On,
    this._rotateEnd=new On,
    this._rotateDelta=new On,
    this._panStart=new On,
    this._panEnd=new On,
    this._panDelta=new On,
    this._dollyStart=new On,
    this._dollyEnd=new On,
    this._dollyDelta=new On,
    this._dollyDirection=new Ge,
    this._mouse=new On,
    this._performCursorZoom=!1,
    this._pointers=[],
    this._pointerPositions={
      
    },
    this._controlActive=!1,
    this._onPointerMove=Sqr.bind(this),
    this._onPointerDown=kqr.bind(this),
    this._onPointerUp=Tqr.bind(this),
    this._onContextMenu=Nqr.bind(this),
    this._onMouseWheel=Eqr.bind(this),
    this._onKeyDown=jqr.bind(this),
    this._onTouchStart=Iqr.bind(this),
    this._onTouchMove=Mqr.bind(this),
    this._onMouseDown=Aqr.bind(this),
    this._onMouseMove=Cqr.bind(this),
    this._interceptControlDown=Pqr.bind(this),
    this._interceptControlUp=Rqr.bind(this),
    this.domElement!==null&&this.connect(this.domElement),
    this.update()
  }connect(e){
    super.connect(e),
    this.domElement.addEventListener("pointerdown",
      this._onPointerDown),
    this.domElement.addEventListener("pointercancel",
      this._onPointerUp),
    this.domElement.addEventListener("contextmenu",
      this._onContextMenu),
    this.domElement.addEventListener("wheel",
      this._onMouseWheel,
      {
        passive:!1
      }),
    this.domElement.getRootNode().addEventListener("keydown",
      this._interceptControlDown,
      {
        passive:!0,
        capture:!0
      }),
    this.domElement.style.touchAction="none"
  }disconnect(){
    this.domElement.removeEventListener("pointerdown",
      this._onPointerDown),
    this.domElement.ownerDocument.removeEventListener("pointermove",
      this._onPointerMove),
    this.domElement.ownerDocument.removeEventListener("pointerup",
      this._onPointerUp),
    this.domElement.removeEventListener("pointercancel",
      this._onPointerUp),
    this.domElement.removeEventListener("wheel",
      this._onMouseWheel),
    this.domElement.removeEventListener("contextmenu",
      this._onContextMenu),
    this.stopListenToKeyEvents(),
    this.domElement.getRootNode().removeEventListener("keydown",
      this._interceptControlDown,
      {
        capture:!0
      }),
    this.domElement.style.touchAction="auto"
  }dispose(){
    this.disconnect()
  }getPolarAngle(){
    return this._spherical.phi
  }getAzimuthalAngle(){
    return this._spherical.theta
  }getDistance(){
    return this.object.position.distanceTo(this.target)
  }listenToKeyEvents(e){
    e.addEventListener("keydown",
      this._onKeyDown),
    this._domElementKeyEvents=e
  }stopListenToKeyEvents(){
    this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",
        this._onKeyDown),
      this._domElementKeyEvents=null)
  }saveState(){
    this.target0.copy(this.target),
    this.position0.copy(this.object.position),
    this.zoom0=this.object.zoom
  }reset(){
    this.target.copy(this.target0),
    this.object.position.copy(this.position0),
    this.object.zoom=this.zoom0,
    this.object.updateProjectionMatrix(),
    this.dispatchEvent(Bot),
    this.update(),
    this.state=po.NONE
  }update(e=null){
    const n=this.object.position;
    Ed.copy(n).sub(this.target),
    Ed.applyQuaternion(this._quat),
    this._spherical.setFromVector3(Ed),
    this.autoRotate&&this.state===po.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),
    this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,
      this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,
      this._spherical.phi+=this._sphericalDelta.phi);
    let r=this.minAzimuthAngle,
    s=this.maxAzimuthAngle;
    isFinite(r)&&isFinite(s)&&(r<-Math.PI?r+=rm:r>Math.PI&&(r-=rm),
      s<-Math.PI?s+=rm:s>Math.PI&&(s-=rm),
      r<=s?this._spherical.theta=Math.max(r,
        Math.min(s,
          this._spherical.theta)):this._spherical.theta=this._spherical.theta>(r+s)/2?Math.max(r,
        this._spherical.theta):Math.min(s,
        this._spherical.theta)),
    this._spherical.phi=Math.max(this.minPolarAngle,
      Math.min(this.maxPolarAngle,
        this._spherical.phi)),
    this._spherical.makeSafe(),
    this.enableDamping===!0?this.target.addScaledVector(this._panOffset,
      this.dampingFactor):this.target.add(this._panOffset),
    this.target.sub(this.cursor),
    this.target.clampLength(this.minTargetRadius,
      this.maxTargetRadius),
    this.target.add(this.cursor);
    let a=!1;
    if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);
    else{
      const o=this._spherical.radius;
      this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),
      a=o!=this._spherical.radius
    }if(Ed.setFromSpherical(this._spherical),
      Ed.applyQuaternion(this._quatInverse),
      n.copy(this.target).add(Ed),
      this.object.lookAt(this.target),
      this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,
        this._sphericalDelta.phi*=1-this.dampingFactor,
        this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,
          0,
          0),
        this._panOffset.set(0,
          0,
          0)),
      this.zoomToCursor&&this._performCursorZoom){
      let o=null;
      if(this.object.isPerspectiveCamera){
        const l=Ed.length();
        o=this._clampDistance(l*this._scale);
        const c=l-o;
        this.object.position.addScaledVector(this._dollyDirection,
          c),
        this.object.updateMatrixWorld(),
        a=!!c
      }else if(this.object.isOrthographicCamera){
        const l=new Ge(this._mouse.x,
          this._mouse.y,
          0);
        l.unproject(this.object);
        const c=this.object.zoom;
        this.object.zoom=Math.max(this.minZoom,
          Math.min(this.maxZoom,
            this.object.zoom/this._scale)),
        this.object.updateProjectionMatrix(),
        a=c!==this.object.zoom;
        const d=new Ge(this._mouse.x,
          this._mouse.y,
          0);
        d.unproject(this.object),
        this.object.position.sub(d).add(l),
        this.object.updateMatrixWorld(),
        o=Ed.length()
      }else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),
      this.zoomToCursor=!1;
      o!==null&&(this.screenSpacePanning?this.target.set(0,
          0,
          -1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(uQ.origin.copy(this.object.position),
          uQ.direction.set(0,
            0,
            -1).transformDirection(this.object.matrix),
          Math.abs(this.object.up.dot(uQ.direction))<wqr?this.object.lookAt(this.target):(Hot.setFromNormalAndCoplanarPoint(this.object.up,
              this.target),
            uQ.intersectPlane(Hot,
              this.target))))
    }else if(this.object.isOrthographicCamera){
      const o=this.object.zoom;
      this.object.zoom=Math.max(this.minZoom,
        Math.min(this.maxZoom,
          this.object.zoom/this._scale)),
      o!==this.object.zoom&&(this.object.updateProjectionMatrix(),
        a=!0)
    }return this._scale=1,
    this._performCursorZoom=!1,
    a||this._lastPosition.distanceToSquared(this.object.position)>jye||8*(1-this._lastQuaternion.dot(this.object.quaternion))>jye||this._lastTargetPosition.distanceToSquared(this.target)>jye?(this.dispatchEvent(Bot),
      this._lastPosition.copy(this.object.position),
      this._lastQuaternion.copy(this.object.quaternion),
      this._lastTargetPosition.copy(this.target),
      !0):!1
  }_getAutoRotationAngle(e){
    return e!==null?rm/60*this.autoRotateSpeed*e:rm/60/60*this.autoRotateSpeed
  }_getZoomScale(e){
    const n=Math.abs(e*.01);
    return Math.pow(.95,
      this.zoomSpeed*n)
  }_rotateLeft(e){
    this._sphericalDelta.theta-=e
  }_rotateUp(e){
    this._sphericalDelta.phi-=e
  }_panLeft(e,
    n){
    Ed.setFromMatrixColumn(n,
      0),
    Ed.multiplyScalar(-e),
    this._panOffset.add(Ed)
  }_panUp(e,
    n){
    this.screenSpacePanning===!0?Ed.setFromMatrixColumn(n,
      1):(Ed.setFromMatrixColumn(n,
        0),
      Ed.crossVectors(this.object.up,
        Ed)),
    Ed.multiplyScalar(e),
    this._panOffset.add(Ed)
  }_pan(e,
    n){
    const r=this.domElement;
    if(this.object.isPerspectiveCamera){
      const s=this.object.position;
      Ed.copy(s).sub(this.target);
      let a=Ed.length();
      a*=Math.tan(this.object.fov/2*Math.PI/180),
      this._panLeft(2*e*a/r.clientHeight,
        this.object.matrix),
      this._panUp(2*n*a/r.clientHeight,
        this.object.matrix)
    }else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/r.clientWidth,
        this.object.matrix),
      this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/r.clientHeight,
        this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),
      this.enablePan=!1)
  }_dollyOut(e){
    this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),
      this.enableZoom=!1)
  }_dollyIn(e){
    this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),
      this.enableZoom=!1)
  }_updateZoomParameters(e,
    n){
    if(!this.zoomToCursor)return;
    this._performCursorZoom=!0;
    const r=this.domElement.getBoundingClientRect(),
    s=e-r.left,
    a=n-r.top,
    o=r.width,
    l=r.height;
    this._mouse.x=s/o*2-1,
    this._mouse.y=-(a/l)*2+1,
    this._dollyDirection.set(this._mouse.x,
      this._mouse.y,
      1).unproject(this.object).sub(this.object.position).normalize()
  }_clampDistance(e){
    return Math.max(this.minDistance,
      Math.min(this.maxDistance,
        e))
  }_handleMouseDownRotate(e){
    this._rotateStart.set(e.clientX,
      e.clientY)
  }_handleMouseDownDolly(e){
    this._updateZoomParameters(e.clientX,
      e.clientX),
    this._dollyStart.set(e.clientX,
      e.clientY)
  }_handleMouseDownPan(e){
    this._panStart.set(e.clientX,
      e.clientY)
  }_handleMouseMoveRotate(e){
    this._rotateEnd.set(e.clientX,
      e.clientY),
    this._rotateDelta.subVectors(this._rotateEnd,
      this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n=this.domElement;
    this._rotateLeft(rm*this._rotateDelta.x/n.clientHeight),
    this._rotateUp(rm*this._rotateDelta.y/n.clientHeight),
    this._rotateStart.copy(this._rotateEnd),
    this.update()
  }_handleMouseMoveDolly(e){
    this._dollyEnd.set(e.clientX,
      e.clientY),
    this._dollyDelta.subVectors(this._dollyEnd,
      this._dollyStart),
    this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),
    this._dollyStart.copy(this._dollyEnd),
    this.update()
  }_handleMouseMovePan(e){
    this._panEnd.set(e.clientX,
      e.clientY),
    this._panDelta.subVectors(this._panEnd,
      this._panStart).multiplyScalar(this.panSpeed),
    this._pan(this._panDelta.x,
      this._panDelta.y),
    this._panStart.copy(this._panEnd),
    this.update()
  }_handleMouseWheel(e){
    this._updateZoomParameters(e.clientX,
      e.clientY),
    e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),
    this.update()
  }_handleKeyDown(e){
    let n=!1;
    switch(e.code){
      case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,
        this.keyPanSpeed),
      n=!0;
      break;
      case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,
        -this.keyPanSpeed),
      n=!0;
      break;
      case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,
        0),
      n=!0;
      break;
      case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-rm*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,
        0),
      n=!0;
      break
    }n&&(e.preventDefault(),
      this.update())
  }_handleTouchStartRotate(e){
    if(this._pointers.length===1)this._rotateStart.set(e.pageX,
      e.pageY);
    else{
      const n=this._getSecondPointerPosition(e),
      r=.5*(e.pageX+n.x),
      s=.5*(e.pageY+n.y);
      this._rotateStart.set(r,
        s)
    }
  }_handleTouchStartPan(e){
    if(this._pointers.length===1)this._panStart.set(e.pageX,
      e.pageY);
    else{
      const n=this._getSecondPointerPosition(e),
      r=.5*(e.pageX+n.x),
      s=.5*(e.pageY+n.y);
      this._panStart.set(r,
        s)
    }
  }_handleTouchStartDolly(e){
    const n=this._getSecondPointerPosition(e),
    r=e.pageX-n.x,
    s=e.pageY-n.y,
    a=Math.sqrt(r*r+s*s);
    this._dollyStart.set(0,
      a)
  }_handleTouchStartDollyPan(e){
    this.enableZoom&&this._handleTouchStartDolly(e),
    this.enablePan&&this._handleTouchStartPan(e)
  }_handleTouchStartDollyRotate(e){
    this.enableZoom&&this._handleTouchStartDolly(e),
    this.enableRotate&&this._handleTouchStartRotate(e)
  }_handleTouchMoveRotate(e){
    if(this._pointers.length==1)this._rotateEnd.set(e.pageX,
      e.pageY);
    else{
      const r=this._getSecondPointerPosition(e),
      s=.5*(e.pageX+r.x),
      a=.5*(e.pageY+r.y);
      this._rotateEnd.set(s,
        a)
    }this._rotateDelta.subVectors(this._rotateEnd,
      this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n=this.domElement;
    this._rotateLeft(rm*this._rotateDelta.x/n.clientHeight),
    this._rotateUp(rm*this._rotateDelta.y/n.clientHeight),
    this._rotateStart.copy(this._rotateEnd)
  }_handleTouchMovePan(e){
    if(this._pointers.length===1)this._panEnd.set(e.pageX,
      e.pageY);
    else{
      const n=this._getSecondPointerPosition(e),
      r=.5*(e.pageX+n.x),
      s=.5*(e.pageY+n.y);
      this._panEnd.set(r,
        s)
    }this._panDelta.subVectors(this._panEnd,
      this._panStart).multiplyScalar(this.panSpeed),
    this._pan(this._panDelta.x,
      this._panDelta.y),
    this._panStart.copy(this._panEnd)
  }_handleTouchMoveDolly(e){
    const n=this._getSecondPointerPosition(e),
    r=e.pageX-n.x,
    s=e.pageY-n.y,
    a=Math.sqrt(r*r+s*s);
    this._dollyEnd.set(0,
      a),
    this._dollyDelta.set(0,
      Math.pow(this._dollyEnd.y/this._dollyStart.y,
        this.zoomSpeed)),
    this._dollyOut(this._dollyDelta.y),
    this._dollyStart.copy(this._dollyEnd);
    const o=(e.pageX+n.x)*.5,
    l=(e.pageY+n.y)*.5;
    this._updateZoomParameters(o,
      l)
  }_handleTouchMoveDollyPan(e){
    this.enableZoom&&this._handleTouchMoveDolly(e),
    this.enablePan&&this._handleTouchMovePan(e)
  }_handleTouchMoveDollyRotate(e){
    this.enableZoom&&this._handleTouchMoveDolly(e),
    this.enableRotate&&this._handleTouchMoveRotate(e)
  }_addPointer(e){
    this._pointers.push(e.pointerId)
  }_removePointer(e){
    delete this._pointerPositions[e.pointerId];
    for(let n=0;
      n<this._pointers.length;
      n++)if(this._pointers[n]==e.pointerId){
      this._pointers.splice(n,
        1);
      return
    }
  }_isTrackingPointer(e){
    for(let n=0;
      n<this._pointers.length;
      n++)if(this._pointers[n]==e.pointerId)return!0;
    return!1
  }_trackPointer(e){
    let n=this._pointerPositions[e.pointerId];
    n===void 0&&(n=new On,
      this._pointerPositions[e.pointerId]=n),
    n.set(e.pageX,
      e.pageY)
  }_getSecondPointerPosition(e){
    const n=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];
    return this._pointerPositions[n]
  }_customWheelEvent(e){
    const n=e.deltaMode,
    r={
      clientX:e.clientX,
      clientY:e.clientY,
      deltaY:e.deltaY
    };
    switch(n){
      case 1:r.deltaY*=16;
      break;
      case 2:r.deltaY*=100;
      break
    }return e.ctrlKey&&!this._controlActive&&(r.deltaY*=10),
    r
  }
}function kqr(t){
  this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(t.pointerId),
      this.domElement.ownerDocument.addEventListener("pointermove",
        this._onPointerMove),
      this.domElement.ownerDocument.addEventListener("pointerup",
        this._onPointerUp)),
    !this._isTrackingPointer(t)&&(this._addPointer(t),
      t.pointerType==="touch"?this._onTouchStart(t):this._onMouseDown(t)))
}function Sqr(t){
  this.enabled!==!1&&(t.pointerType==="touch"?this._onTouchMove(t):this._onMouseMove(t))
}function Tqr(t){
  switch(this._removePointer(t),
    this._pointers.length){
    case 0:this.domElement.releasePointerCapture(t.pointerId),
    this.domElement.ownerDocument.removeEventListener("pointermove",
      this._onPointerMove),
    this.domElement.ownerDocument.removeEventListener("pointerup",
      this._onPointerUp),
    this.dispatchEvent(bKt),
    this.state=po.NONE;
    break;
    case 1:const e=this._pointers[0],
    n=this._pointerPositions[e];
    this._onTouchStart({
        pointerId:e,
        pageX:n.x,
        pageY:n.y
      });
    break
  }
}function Aqr(t){
  let e;
  switch(t.button){
    case 0:e=this.mouseButtons.LEFT;
    break;
    case 1:e=this.mouseButtons.MIDDLE;
    break;
    case 2:e=this.mouseButtons.RIGHT;
    break;
    default:e=-1
  }switch(e){
    case wm.DOLLY:if(this.enableZoom===!1)return;
    this._handleMouseDownDolly(t),
    this.state=po.DOLLY;
    break;
    case wm.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){
      if(this.enablePan===!1)return;
      this._handleMouseDownPan(t),
      this.state=po.PAN
    }else{
      if(this.enableRotate===!1)return;
      this._handleMouseDownRotate(t),
      this.state=po.ROTATE
    }break;
    case wm.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){
      if(this.enableRotate===!1)return;
      this._handleMouseDownRotate(t),
      this.state=po.ROTATE
    }else{
      if(this.enablePan===!1)return;
      this._handleMouseDownPan(t),
      this.state=po.PAN
    }break;
    default:this.state=po.NONE
  }this.state!==po.NONE&&this.dispatchEvent(bBe)
}function Cqr(t){
  switch(this.state){
    case po.ROTATE:if(this.enableRotate===!1)return;
    this._handleMouseMoveRotate(t);
    break;
    case po.DOLLY:if(this.enableZoom===!1)return;
    this._handleMouseMoveDolly(t);
    break;
    case po.PAN:if(this.enablePan===!1)return;
    this._handleMouseMovePan(t);
    break
  }
}function Eqr(t){
  this.enabled===!1||this.enableZoom===!1||this.state!==po.NONE||(t.preventDefault(),
    this.dispatchEvent(bBe),
    this._handleMouseWheel(this._customWheelEvent(t)),
    this.dispatchEvent(bKt))
}function jqr(t){
  this.enabled!==!1&&this._handleKeyDown(t)
}function Iqr(t){
  switch(this._trackPointer(t),
    this._pointers.length){
    case 1:switch(this.touches.ONE){
      case P8.ROTATE:if(this.enableRotate===!1)return;
      this._handleTouchStartRotate(t),
      this.state=po.TOUCH_ROTATE;
      break;
      case P8.PAN:if(this.enablePan===!1)return;
      this._handleTouchStartPan(t),
      this.state=po.TOUCH_PAN;
      break;
      default:this.state=po.NONE
    }break;
    case 2:switch(this.touches.TWO){
      case P8.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;
      this._handleTouchStartDollyPan(t),
      this.state=po.TOUCH_DOLLY_PAN;
      break;
      case P8.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;
      this._handleTouchStartDollyRotate(t),
      this.state=po.TOUCH_DOLLY_ROTATE;
      break;
      default:this.state=po.NONE
    }break;
    default:this.state=po.NONE
  }this.state!==po.NONE&&this.dispatchEvent(bBe)
}function Mqr(t){
  switch(this._trackPointer(t),
    this.state){
    case po.TOUCH_ROTATE:if(this.enableRotate===!1)return;
    this._handleTouchMoveRotate(t),
    this.update();
    break;
    case po.TOUCH_PAN:if(this.enablePan===!1)return;
    this._handleTouchMovePan(t),
    this.update();
    break;
    case po.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;
    this._handleTouchMoveDollyPan(t),
    this.update();
    break;
    case po.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;
    this._handleTouchMoveDollyRotate(t),
    this.update();
    break;
    default:this.state=po.NONE
  }
}function Nqr(t){
  this.enabled!==!1&&t.preventDefault()
}function Pqr(t){
  t.key==="Control"&&(this._controlActive=!0,
    this.domElement.getRootNode().addEventListener("keyup",
      this._interceptControlUp,
      {
        passive:!0,
        capture:!0
      }))
}function Rqr(t){
  t.key==="Control"&&(this._controlActive=!1,
    this.domElement.getRootNode().removeEventListener("keyup",
      this._interceptControlUp,
      {
        passive:!0,
        capture:!0
      }))
}const Fqr=3072,Oqr=.05,Lqr=.75;
function Dqr(t){
  const{
    scene:e,
    camera:n,
    renderer:r,
    meshById:s
  }=t,
  {
    floor:a,
    sun:o,
    applyDaylight:l
  }=wOr(e,
    {
      shadowMapPx:Math.min(Fqr,
        r.capabilities.maxTextureSize)
    }),
  c=new _qr(n,
    r.domElement);
  c.target.set(0,
    1,
    0),
  c.enableDamping=!0,
  c.rotateSpeed=Lqr,
  c.mouseButtons={
    LEFT:wm.ROTATE,
    MIDDLE:wm.PAN,
    RIGHT:null
  },
  c.enableZoom=!1;
  function d(){
    const g=[a];
    for(const b of s.values()){
      const y=b.userData.kind;
      y==="camera"||y==="target"||y==="spotlight"||y==="humanoid"||y==="simple_figure"||y==="group"||g.push(b)
    }return g
  }const u=new Ge,
  h=new On;
  let f=!1;
  c.addEventListener("start",
    ()=>{
      f=!0
    }),
  c.addEventListener("end",
    ()=>{
      f=!1
    });
  const m=()=>{
    r.getDrawingBufferSize(h);
    const g=h.y/2*n.projectionMatrix.elements[5]/Math.max(1e-6,
      n.position.distanceTo(c.target)),
    b=n.position.distanceTo(u)*g;
    if(u.copy(n.position),
      f||b===0||b>=Oqr)return;
    const y=n.position.clone(),
    v=c.target.clone();
    c.enableDamping=!1,
    c.update(),
    c.enableDamping=!0,
    n.position.copy(y),
    c.target.copy(v),
    c.update()
  };
  return{
    orbit:c,
    sun:o,
    applyDaylight:l,
    floor:a,
    walkableSurfaces:d,
    tick:()=>{
      c.enabled&&(c.update(),
        m())
    },
    dispose:()=>c.dispose()
  }
}const yKt="stage-finish",Bqr=11;
function $ot(t){
  try{
    const e=t?.getItem(yKt);
    if(!e)return null;
    const{
      enabled:n,
      source:r
    }=JSON.parse(e);
    return typeof n!="boolean"||r!=="auto"&&r!=="manual"?null:{
      enabled:n,
      source:r
    }
  }catch{
    return null
  }
}function Hqr(t,
  e){
  try{
    t?.setItem(yKt,
      JSON.stringify(e))
  }catch{
    
  }
}const $qr=1920*1080,Vqr=320*200,Uqr=t=>t>=Vqr,zqr=t=>t.costMs*Math.max(1,
  $qr/t.pixels)<=Bqr,Wqr=5,Gqr=2;
function qqr(t){
  const e=t.now??(()=>performance.now()),
  n=l=>{
    const c=e();
    return l(),
    t.finishGpu(),
    e()-c
  };
  for(let l=0;
    l<Gqr;
    l++)n(t.drawPlain),
  n(t.drawFinished);
  const r=[],
  s=[];
  for(let l=0;
    l<Wqr;
    l++)r.push(n(t.drawPlain)),
  s.push(n(t.drawFinished));
  const a=l=>l.sort((c,
      d)=>c-d)[l.length>>1],
  o=a(r);
  return{
    costMs:Math.max(0,
      a(s)-o),
    plainMs:o,
    pixels:t.pixels
  }
}const Zqr=30,Kqr=300;
function Xqr(){
  let t=0,
  e=Zqr,
  n=0;
  return{
    frame:()=>++t>=e,
    report:r=>zqr(r)?!0:++n>=2?!1:(e=t+Kqr,
      null)
  }
}const Yqr=1e3,Iye=250,Qqr=50;
function Jqr(){
  const t=new Uint32Array(Iye+1);
  let e=0,
  n=0;
  const r=s=>{
    const a=Math.ceil(s*e);
    let o=0;
    for(let l=0;
      l<t.length;
      l++)if(o+=t[l],
      o>=a)return l;
    return Iye
  };
  return{
    add:s=>{
      !(s>0)||s>Yqr||(t[Math.min(Iye,
            Math.round(s))]++,
        e++,
        s>Qqr&&n++)
    },
    summary:()=>e===0?null:{
      frames:e,
      p50Ms:r(.5),
      p95Ms:r(.95),
      slowShare:Math.round(n/e*1e3)/1e3
    }
  }
}const eZr=16777215,tZr=1,nZr=30,Mye={
  x:0,
  y:.42,
  z:5.1
},Vot=.17,rZr=.085,Uot=12,sZr=.68,aZr=1,iZr=.82,oZr=12;
function lZr(t){
  const

/*==============================================================================
 * 28. TIMELINE scaffold VAr (zoom/navTrack) + KAr (tracks/lanes/blocks/snap)
 * source file: tmp_b/timeline_ui_pretty.js
 ==============================================================================*/
o,scrollLeftPx:Math.max(0,
  r*o)
}
}const ETr="_panel_109if_1",jTr="_objectDropTarget_109if_37",ITr="_objectDropHint_109if_41",MTr="_stickyTop_109if_70",NTr="_header_109if_87",PTr="_rulerRow_109if_111",RTr="_rulerViewport_109if_117",FTr="_headerLeft_109if_124",OTr="_headerRight_109if_131",LTr="_iconBtn_109if_147",DTr="_iconBtnActive_109if_179",BTr="_empty_109if_188",HTr="_timelineWrap_109if_201",$Tr="_timeline_109if_65",VTr="_sidebar_109if_193",UTr="_corner_109if_248",zTr="_cornerLabel_109if_266",WTr="_addTrack_109if_278",GTr="_addTrackButton_109if_283",qTr="_addTrackDropdown_109if_314",ZTr="_addTrackSearch_109if_328",KTr="_addTrackList_109if_351",XTr="_addTrackOption_109if_356",YTr="_addTrackEmpty_109if_381",QTr="_trackHeader_109if_234",JTr="_headerSelected_109if_419",eAr="_trackHeaderTop_109if_423",tAr="_charName_109if_430",nAr="_timelineMain_109if_436",rAr="_scroller_109if_17",sAr="_scrollContent_109if_456",aAr="_navTrack_109if_461",iAr="_navThumb_109if_473",oAr="_navEdgeLeft_109if_488",lAr="_navEdgeRight_109if_489",cAr="_ruler_109if_111",dAr="_rulerTick_109if_536",uAr="_rulerLabel_109if_542",hAr="_playheadBadge_109if_568",pAr="_playhead_109if_568",fAr="_playheadLine_109if_599",mAr="_lane_109if_608",gAr="_laneDropActive_109if_614",bAr="_laneDuplicateTarget_109if_623",yAr="_ghostBlock_109if_662",vAr="_ghostCaret_109if_677",xAr="_snapGuide_109if_686",wAr="_block_109if_698",_Ar="_trimHandle_109if_752",kAr="_blockDragging_109if_757",SAr="_blockHuman_109if_767",TAr="_blockObject_109if_771",AAr="_blockCamera_109if_778",CAr="_blockPainting_109if_786",EAr="_blockSelected_109if_802",jAr="_blockLabel_109if_807",IAr="_trackRemove_109if_850",MAr="_editRow_109if_884",NAr="_editLabel_109if_894",PAr="_finishBtn_109if_900",RAr="_kfLayer_109if_904",FAr="_kfDiamond_109if_829",OAr="_kfDiamondActive_109if_932",LAr="_kfDiamondSelected_109if_939",DAr="_laneAdd_109if_948",mr={
panel:ETr,objectDropTarget:jTr,objectDropHint:ITr,stickyTop:MTr,header:NTr,rulerRow:PTr,rulerViewport:RTr,headerLeft:FTr,headerRight:OTr,iconBtn:LTr,iconBtnActive:DTr,empty:BTr,timelineWrap:HTr,timeline:$Tr,sidebar:VTr,corner:UTr,cornerLabel:zTr,addTrack:WTr,addTrackButton:GTr,addTrackDropdown:qTr,addTrackSearch:ZTr,addTrackList:KTr,addTrackOption:XTr,addTrackEmpty:YTr,trackHeader:QTr,headerSelected:JTr,trackHeaderTop:eAr,charName:tAr,timelineMain:nAr,scroller:rAr,scrollContent:sAr,navTrack:aAr,navThumb:iAr,navEdgeLeft:oAr,navEdgeRight:lAr,ruler:cAr,rulerTick:dAr,rulerLabel:uAr,playheadBadge:hAr,playhead:pAr,playheadLine:fAr,lane:mAr,laneDropActive:gAr,laneDuplicateTarget:bAr,ghostBlock:yAr,ghostCaret:vAr,snapGuide:xAr,block:wAr,trimHandle:_Ar,blockDragging:kAr,blockHuman:SAr,blockObject:TAr,blockCamera:AAr,blockPainting:CAr,blockSelected:EAr,blockLabel:jAr,trackRemove:IAr,editRow:MAr,editLabel:NAr,finishBtn:PAr,kfLayer:RAr,kfDiamond:FAr,kfDiamondActive:OAr,kfDiamondSelected:LAr,laneAdd:DAr
},BAr=.005,HAr=.02,$Ar=60;
function VAr({
spanS:t,header:e,sidebar:n,ruler:r,children:s
}){
const a=p.useRef(null),o=p.useRef(null),l=p.useRef(null),c=p.useRef(null),[d,u]=p.useState(0),[h,f]=p.useState(null),[m,g]=p.useState(0),b=p.useRef(null),y=p.useRef(null),v=d>0?zrt(d,t):$Ar,x=h===null||d===0?v:Aie(h,d,t),w=Math.max(t*x,d),k=p.useRef({
  pps:x,
  spanS:t,
  viewportWPx:d
});
k.current={
pps:x,spanS:t,viewportWPx:d
};
const S=j=>{
f(j.pps),b.current=j.scrollLeftPx
};
p.useLayoutEffect(()=>{
  const j=a.current;
  j&&b.current!==null&&(j.scrollLeft=b.current,
    b.current=null,
    g(j.scrollLeft))
},[h]),p.useEffect(()=>{
  const j=a.current;
  if(!j)return;
  const I=new ResizeObserver(([N])=>{
      u(N.contentRect.width)
    });
  return I.observe(j),
  ()=>I.disconnect()
},[]),p.useEffect(()=>{
  const j=c.current,
  I=l.current;
  if(!j||!I)return;
  const N=new ResizeObserver(([P])=>{
      I.style.setProperty("--sticky-top-h",
        `${P.contentRect.height}px`)
    });
  return N.observe(j),
  ()=>N.disconnect()
},[]),p.useEffect(()=>{
  d>0&&h===null&&f(zrt(d,
      t))
},[d,
  h,
  t]),p.useEffect(()=>{
  const j=a.current;
  if(!j)return;
  const I=N=>{
    if(!N.ctrlKey&&!N.metaKey)return;
    N.preventDefault();
    const P=k.current,
    F=Math.abs(N.deltaY)<10?HAr:BAr;
    S(ATr({
          ppsNow:P.pps,
          factor:Math.exp(-N.deltaY*F),
          anchorXPx:N.clientX-j.getBoundingClientRect().left,
          scrollLeftPx:j.scrollLeft,
          viewportWPx:P.viewportWPx,
          spanS:P.spanS
        }))
  };
  return j.addEventListener("wheel",
    I,
    {
      passive:!1
    }),
  ()=>j.removeEventListener("wheel",
    I)
},[]);
const T=(j,I)=>{
const N=o.current,P=a.current;
if(!N||!P)return;
const F=k.current;
S(CTr({
      edge:I,
      trackXPx:j.clientX-N.getBoundingClientRect().left,
      trackWPx:N.clientWidth,
      ppsNow:F.pps,
      scrollLeftPx:P.scrollLeft,
      viewportWPx:F.viewportWPx,
      spanS:F.spanS
    }))
},A=w>0?m/w:0,C=w>0?d/w:1,E=d>0;
return i.jsxs("div",{
  ref:l,
  className:mr.timelineWrap,
  children:[i.jsxs("div",
      {
        ref:c,
        className:mr.stickyTop,
        children:[e,
          i.jsxs("div",
            {
              className:mr.rulerRow,
              children:[i.jsx("div",
                  {
                    className:mr.corner,
                    children:i.jsx("span",
                      {
                        className:mr.cornerLabel,
                        children:i.jsx(M,
                          {
                            id:"FT9wIE"
                          })
                      })
                  }),
                i.jsx("div",
                  {
                    className:mr.rulerViewport,
                    children:i.jsx("div",
                      {
                        style:{
                          width:w,
                          transform:`translateX(${-m}px)`
                        },
                        children:r(x,
                          w/x)
                      })
                  })]
            })]
      }),
    i.jsxs("div",
      {
        className:mr.timeline,
        children:[n,
          i.jsx("div",
            {
              className:mr.timelineMain,
              children:i.jsx("div",
                {
                  ref:a,
                  className:mr.scroller,
                  onScroll:j=>g(j.currentTarget.scrollLeft),
                  children:i.jsx("div",
                    {
                      className:mr.scrollContent,
                      style:{
                        width:w
                      },
                      children:s(x)
                    })
                })
            })]
      }),
    E&&i.jsx("div",
      {
        ref:o,
        className:mr.navTrack,
        onPointerDown:j=>{
          const I=a.current;
          if(!I)return;
          const N=j.currentTarget.getBoundingClientRect(),
          P=(j.clientX-N.left)/N.width;
          I.scrollLeft=P*w-d/2,
          j.currentTarget.setPointerCapture(j.pointerId),
          y.current={
            startXPx:j.clientX,
            scrollLeftPx:I.scrollLeft
          }
        },
        onPointerMove:j=>{
          const I=y.current,
          N=a.current,
          P=o.current;
          if(!I||!N||!P)return;
          const F=j.clientX-I.startXPx;
          N.scrollLeft=I.scrollLeftPx+F/P.clientWidth*w
        },
        onPointerUp:()=>y.current=null,
        onPointerCancel:()=>y.current=null,
        children:i.jsxs("div",
          {
            className:mr.navThumb,
            style:{
              left:`${A*100}%`,
              width:`${Math.max(C*100,2)}%`
            },
            onPointerDown:j=>{
              j.stopPropagation();
              const I=a.current;
              I&&(j.currentTarget.setPointerCapture(j.pointerId),
                y.current={
                  startXPx:j.clientX,
                  scrollLeftPx:I.scrollLeft
                })
            },
            onPointerMove:j=>{
              const I=y.current,
              N=a.current,
              P=o.current;
              if(!I||!N||!P)return;
              const F=j.clientX-I.startXPx;
              N.scrollLeft=I.scrollLeftPx+F/P.clientWidth*w
            },
            onPointerUp:()=>y.current=null,
            onPointerCancel:()=>y.current=null,
            children:[i.jsx("span",
                {
                  className:mr.navEdgeLeft,
                  onPointerDown:j=>{
                    j.stopPropagation(),
                    j.currentTarget.setPointerCapture(j.pointerId)
                  },
                  onPointerMove:j=>{
                    j.buttons&1&&T(j,
                      "left")
                  }
                }),
              i.jsx("span",
                {
                  className:mr.navEdgeRight,
                  onPointerDown:j=>{
                    j.stopPropagation(),
                    j.currentTarget.setPointerCapture(j.pointerId)
                  },
                  onPointerMove:j=>{
                    j.buttons&1&&T(j,
                      "right")
                  }
                })]
          })
      })]
})
}const UAr=5,zAr=4,WAr=.05,p2e=3,GAr=[.5,1,2,5,10,15,30,60],qAr=80;
function ZAr(t){
switch(t.kind){
case"rotate":return i.jsx(M,
  {
    id:"BulyBf"
  });
case"revolve":return i.jsx(M,
  {
    id:"NP8KUz"
  });
case"scale":return t.factor>=1?i.jsx(M,
  {
    id:"5DdjZ9"
  }):i.jsx(M,
  {
    id:"8Mw+hK"
  });
case"transform":return i.jsx(M,
  {
    id:"OCy3k9"
  });
case"rig-transform":return i.jsx(M,
  {
    id:"f88wXe"
  })
}
}function KAr({
show:t,paintingItemId:e,selectedSegmentItemId:n,selectedTrackId:r,selectedObjectId:s,characters:a,magnetEnabled:o,takeLocked:l,draggingAction:c,Playhead:d,PlayheadTime:u,peekPlayheadS:h,SegmentKeyframes:f,onSeek:m,onAddTrack:g,onRemoveTrack:b,onSelectTrack:y,onFocusObject:v,tutorialButton:x,onToggleMagnet:w,onSetTakeRange:k,onFinishPaintClick:S,onAddAction:T,onSelectSegment:A,onClearFocus:C,onAddActionClick:E,onPathSpeedChange:j,onClipDurationChange:I,onObjectDurationChange:N,onCameraDurationChange:P,onMoveItem:F,onDuplicateItem:B,onReorderItem:H,onSegmentDragChange:z,wasSegmentDropTaken:L,onDropObject:$,resolveAction:O
}){
const[W,U]=p.useState(!1),[V,G]=p.useState(null),Z=V?t.tracks.find(re=>re.id===V.fromTrackId)?.items.find(re=>re.id===V.itemId):void 0,se=re=>{
if(!Z)return!1;
const ae=bGt(Z),ie=O(re,
  ae);
return ie!==null&&yGt(ae,
  ie)
},X=xTr({
  show:t,
  magnetEnabled:o,
  locked:l,
  peekPlayheadS:h,
  onSetTakeRange:k,
  onSelect:C
}),te=t.tracks.flatMap(Wrt),ne=Math.max(UAr,...te.map(re=>re.endS)),Q=re=>a.find(ae=>ae.id===re)?.name||"",q=new Set(t.tracks.map(re=>re.characterId)),Y=a.filter(re=>!q.has(re.id));
return i.jsxs("div",{
  className:Ze(mr.panel,
    W&&mr.objectDropTarget),
  "data-onboard-target":"timeline",
  onDragOver:re=>{
    re.dataTransfer.types.includes(s9)&&(re.preventDefault(),
      re.dataTransfer.dropEffect="copy",
      U(!0))
  },
  onDragLeave:re=>{
    re.currentTarget.contains(re.relatedTarget)||U(!1)
  },
  onDrop:re=>{
    if(!re.dataTransfer.types.includes(s9))return;
    re.preventDefault(),
    U(!1);
    const ae=re.dataTransfer.getData(s9);
    ae&&$(ae)
  },
  children:[W&&i.jsx("div",
      {
        className:mr.objectDropHint,
        children:i.jsx(M,
          {
            id:"dFIktj"
          })
      }),
    i.jsx(VAr,
      {
        spanS:ne,
        header:i.jsxs("div",
          {
            className:mr.header,
            children:[i.jsxs("div",
                {
                  className:mr.headerLeft,
                  children:[i.jsx(Hr,
                      {
                        content:_._({
                            id:"+RuZ3G",
                            values:{
                              0:kie()
                            }
                          }),
                        side:"bottom",
                        children:i.jsx("button",
                          {
                            className:Ze(mr.iconBtn,
                              o&&mr.iconBtnActive),
                            "aria-label":_._({
                                id:"+RuZ3G",
                                values:{
                                  0:kie()
                                }
                              }),
                            "aria-pressed":o,
                            onClick:w,
                            children:i.jsx(K,
                              {
                                name:"magnet"
                              })
                          })
                      }),
                    i.jsx(Hr,
                      {
                        content:_._({
                            id:"5P6uwg"
                          }),
                        side:"bottom",
                        children:i.jsx("button",
                          {
                            className:Ze(mr.iconBtn,
                              X.toolOn&&mr.iconBtnActive),
                            "aria-label":_._({
                                id:"5P6uwg"
                              }),
                            "aria-pressed":X.toolOn,
                            disabled:l,
                            onClick:X.toggleTool,
                            children:i.jsx(K,
                              {
                                name:"range"
                              })
                          })
                      })]
                }),
              i.jsx("div",
                {
                  className:mr.headerRight,
                  children:x
                })]
          }),
        sidebar:i.jsxs("div",
          {
            className:mr.sidebar,
            children:[t.tracks.length===0&&i.jsx("div",
                {
                  className:mr.empty,
                  children:i.jsx(M,
                    {
                      id:"4g5Hvs"
                    })
                }),
              t.tracks.map(re=>i.jsx(tCr,
                  {
                    track:re,
                    name:Q(re.characterId),
                    selected:r===re.id,
                    selectedObject:s===re.characterId,
                    onClick:()=>y(re.id),
                    onDoubleClick:()=>v(re.characterId),
                    onRemoveTrack:b
                  },
                  re.id)),
              i.jsx(rCr,
                {
                  characters:Y,
                  onAdd:g
                })]
          }),
        ruler:(re,
          ae)=>i.jsx(eCr,
          {
            spanS:ne,
            contentS:ae,
            ppsPx:re,
            onSeek:m,
            PlayheadTime:u,
            children:i.jsx(_Tr,
              {
                c:X,
                ppsPx:re,
                contentS:ae
              })
          }),
        children:re=>i.jsxs(i.Fragment,
          {
            children:[t.tracks.map(ae=>i.jsx(nCr,
                  {
                    track:ae,
                    isWalker:a.find(ie=>ie.id===ae.characterId)?.isWalker??!1,
                    blocks:Wrt(ae),
                    allBlocks:te,
                    magnetEnabled:o,
                    draggingAction:c,
                    ppsPx:re,
                    SegmentKeyframes:f,
                    resolveAction:O,
                    paintingItemId:e,
                    selectedItemId:n,
                    onSelectItem:ie=>A(ae.id,
                      ie),
                    onClearFocus:C,
                    onAddActionClick:E,
                    onAddAction:T,
                    onPathSpeedChange:j,
                    onClipDurationChange:I,
                    onObjectDurationChange:N,
                    onCameraDurationChange:P,
                    onMoveItem:F,
                    onReorderItem:H,
                    tracks:t.tracks,
                    duplicatingFromTrackId:V?.fromTrackId??null,
                    duplicateGhost:V?.toTrackId===ae.id&&se(ae.characterId)?{
                      startS:V.startS,
                      durationS:V.durationS
                    }:null,
                    takesDuplicate:se(ae.characterId),
                    onDuplicateDragChange:G,
                    onDuplicateItem:B,
                    onSegmentDragChange:z,
                    wasSegmentDropTaken:L
                  },
                  ae.id)),
              i.jsx(wTr,
                {
                  c:X,
                  ppsPx:re
                }),
              i.jsx(d,
                {
                  spanS:ne,
                  ppsPx:re
                })]
          })
      }),
    e!==null&&i.jsxs("div",
      {
        className:mr.editRow,
        children:[i.jsx("span",
            {
              className:mr.editLabel,
              children:i.jsx(M,
                {
                  id:"PLOmvu"
                })
            }),
          i.jsxs(Ws,
            {
              variant:"quiet",
              className:mr.finishBtn,
              onClick:S,
              children:[i.jsx(K,
                  {
                    name:"check",
                    size:"xs"
                  }),
                i.jsx("span",
                  {
                    children:i.jsx(M,
                      {
                        id:"JmZ/+d"
                      })
                  })]
            })]
      })]
})
}function XAr({
leftPx:t
}){
return i.jsx("div",{
  className:mr.playhead,
  style:{
    left:t
  },
  children:i.jsx("div",
    {
      className:mr.playheadLine
    })
})
}function YAr(t){
const e=Math.round(t*100),n=Math.floor(e/6e3),r=e%6e3/100;
return n===0?r.toFixed(2):`${n}:${r.toFixed(2).padStart(5,"0")}`
}function QAr({
leftPx:t,timeS:e
}){
return i.jsx("div",{
  className:mr.playheadBadge,
  style:{
    left:t,
    "--playhead-x":`${t}px`
  },
  children:YAr(e)
})
}function JAr(t){
if(t>=60){
const e=Math.floor(t/60),n=Math.floor(t%60);
return`${e}:${n.toString().padStart(2,"0")}`
}return`${t}s`
}function eCr({
spanS:t,contentS:e,ppsPx:n,onSeek:r,PlayheadTime:s,children:a
}){
const o=GAr.find(d=>d*n>=qAr)??60,l=Math.floor(e/o),c=d=>{
const u=d.currentTarget.getBoundingClientRect(),h=(d.clientX-u.left)/n;
r(Math.min(Math.max(h,
      0),
    t))
};
return i.jsxs("div",{
  className:mr.ruler,
  onPointerDown:d=>{
    d.currentTarget.setPointerCapture(d.pointerId),
    c(d)
  },
  onPointerMove:d=>{
    d.buttons&1&&c(d)
  },
  children:[Array.from({
        length:l+1
      },
      (d,
        u)=>{
        const h=u*o;
        return i.jsx("span",
          {
            className:mr.rulerTick,
            style:{
              left:h*n
            },
            children:i.jsx("span",
              {
                className:mr.rulerLabel,
                children:JAr(h)
              })
          },
          u)
      }),
    a,
    i.jsx(s,
      {
        spanS:t,
        ppsPx:n
      })]
})
}function Wrt(t){
return t.items.map(e=>({
    item:e,
    startS:e.startS,
    endS:e.startS+yd(e)
  }))
}function tCr({
track:t,name:e,selected:n,selectedObject:r,onClick:s,onDoubleClick:a,onRemoveTrack:o
}){
const l=p.useRef(null);
return p.useEffect(()=>{
  r&&l.current?.scrollIntoView({
      block:"nearest",
      inline:"nearest"
    })
},[r]),i.jsx("div",{
  ref:l,
  className:Ze(mr.trackHeader,
    (n||r)&&mr.headerSelected),
  onClick:s,
  onDoubleClick:a,
  children:i.jsxs("div",
    {
      className:mr.trackHeaderTop,
      children:[i.jsx("span",
          {
            className:mr.charName,
            children:e||i.jsx(M,
              {
                id:"DhTbJv"
              })
          }),
        i.jsx("button",
          {
            className:mr.trackRemove,
            title:_._({
                id:"10BaWm"
              }),
            onClick:c=>{
              c.stopPropagation(),
              o(t.id)
            },
            children:i.jsx(K,
              {
                name:"close",
                size:"xs"
              })
          })]
    })
})
}function nCr({
track:t,isWalker:e,blocks:n,allBlocks:r,magnetEnabled:s,draggingAction:a,ppsPx:o,SegmentKeyframes:l,resolveAction:c,paintingItemId:d,selectedItemId:u,onSelectItem:h,onClearFocus:f,onAddActionClick:m,onAddAction:g,onPathSpeedChange:b,onClipDurationChange:y,onObjectDurationChange:v,onCameraDurationChange:x,onMoveItem:w,onReorderItem:k,tracks:S,duplicatingFromTrackId:T,duplicateGhost:A,takesDuplicate:C,onDuplicateDragChange:E,onDuplicateItem:j,onSegmentDragChange:I,wasSegmentDropTaken:N
}){
const{
i18n:P
}=Ia(),[F,B]=p.useState(null),[H,z]=p.useState(null),L=p.useRef(!1),[$,O]=p.useState(null),W=a?$:null,U=re=>{
const ae=new Set;
for(const ie of r)ie.item.id!==re&&(ae.add(ie.startS),
  ae.add(ie.endS));
return[...ae]
},V=re=>n.filter(ae=>ae.item.id!==re).map(ae=>({
    startS:ae.startS,
    endS:ae.endS
  })),G=re=>c(t.characterId,re),Z=(re,ae,ie,ge)=>{
const pe=n3r(ge),ce=n.reduce((Ee,
    xe)=>Math.max(Ee,
    xe.endS),
  0),be=s&&!ie,{
  startS:fe,
  guidesS:we
}=_ie({
    desiredStartS:(ae-re.getBoundingClientRect().left)/o,
    durationS:pe,
    obstacles:V(null),
    markersS:U(null),
    radiusS:be?Kne/o:0,
    fallbackStartS:ce
  });
return{
  startS:fe,
  durationS:pe,
  guidesS:we
}
},se=(re,ae)=>{
if(d!==null)return;
re.currentTarget.setPointerCapture(re.pointerId);
const ie=re.altKey;
ie&&E({
    fromTrackId:t.id,
    itemId:ae.item.id,
    toTrackId:t.id,
    startS:ae.startS,
    durationS:ae.endS-ae.startS
  }),B({
    itemId:ae.item.id,
    startXPx:re.clientX,
    startYPx:re.clientY,
    startS0:ae.startS,
    durationS:ae.endS-ae.startS,
    dragging:!1,
    startS:ae.startS,
    guidesS:[],
    plan:{
      kind:"move",
      startS:ae.startS,
      guidesS:[]
    },
    previewStarts:new Map,
    duplicating:ie,
    toTrackId:t.id
  })
},X=(re,ae)=>{
const ie=document.elementFromPoint(re,
  ae)?.closest("[data-track-id]");
return ie instanceof HTMLElement?ie.dataset.trackId??null:null
},te=re=>{
if(!F)return;
const ae=re.clientX-F.startXPx,ie=F.duplicating?Math.hypot(ae,
  re.clientY-F.startYPx):Math.abs(ae);
if(!F.dragging&&ie<zAr)return;
F.dragging||I({
    trackId:t.id,
    itemId:F.itemId
  });
const ge=s&&!(re.metaKey||re.ctrlKey),pe=F.startS0+ae/o,be=(F.duplicating?X(re.clientX,
    re.clientY):null)??(F.duplicating?F.toTrackId:t.id),fe=be===t.id?t.items:S.find(ue=>ue.id===be)?.items??[],we=F.duplicating?null:q5r({
    desiredStartS:pe,
    durationS:F.durationS,
    draggedId:F.itemId,
    items:fe,
    markersS:U(F.itemId),
    radiusS:ge?Kne/o:0,
    fallbackStartS:F.startS
  }),Ee=F.duplicating?_ie({
    desiredStartS:pe,
    durationS:F.durationS,
    obstacles:fe.map(ue=>({
          startS:ue.startS,
          endS:ue.startS+yd(ue)
        })),
    markersS:U(null),
    radiusS:ge?Kne/o:0,
    fallbackStartS:MP(fe)
  }):null,xe=Ee?Ee.startS:we.kind==="move"?we.startS:Math.max(0,
  pe),J=Ee?Ee.guidesS:we.kind==="move"?we.guidesS:[],le=we?.kind==="reorder"?new Map(lje(kGt(t.items,
      F.itemId,
      we.toIndex)).map(ue=>[ue.id,
      ue.startS])):new Map;
B({
    ...F,
    dragging:!0,
    plan:we??F.plan,
    startS:xe,
    guidesS:J,
    previewStarts:le,
    toTrackId:be
  }),F.duplicating&&E({
    fromTrackId:t.id,
    itemId:F.itemId,
    toTrackId:be,
    startS:xe,
    durationS:F.durationS
  })
},ne=re=>{
I(null),F&&(F.dragging&&!N()&&(F.duplicating?j(t.id,
      F.itemId,
      F.toTrackId,
      F.startS):F.plan.kind==="reorder"?k(t.id,
      F.itemId,
      F.plan.toIndex):w(t.id,
      F.itemId,
      F.plan.startS)),
  F.dragging&&(L.current=!0),
  F.duplicating&&E(null),
  B(null))
},Q=(re,ae)=>{
re.stopPropagation(),re.currentTarget.setPointerCapture(re.pointerId),z({
    itemId:ae.item.id,
    startXPx:re.clientX,
    startS:ae.startS,
    endS0:ae.endS
  })
},q=(re,ae)=>{
if(!H||H.itemId!==ae.id)return;
const ie=(re.clientX-H.startXPx)/o,ge=Math.max(WAr,
  H.endS0+ie-H.startS);
ae.kind==="clip"?y(t.id,
  ae.id,
  ge):g2(ae)?b(t.id,
  ae.id,
  MR(nx(ae.anchors))/ge):aN(ae)?v(t.id,
  ae.id,
  ge):Fp(ae)&&x(t.id,
  ae.id,
  ge)
},Y=()=>z(null);
return i.jsxs("div",{
  "data-track-id":t.id,
  className:Ze(mr.lane,
    W&&mr.laneDropActive,
    T!==null&&T!==t.id&&C&&mr.laneDuplicateTarget),
  onDragOver:re=>{
    if(!re.dataTransfer.types.includes($v))return;
    const ae=a&&G(a);
    if(!ae){
      re.dataTransfer.dropEffect="none";
      return
    }re.preventDefault(),
    re.dataTransfer.dropEffect="copy";
    const ie=Z(re.currentTarget,
      re.clientX,
      re.altKey,
      ae);
    O(ge=>ge&&ge.startS===ie.startS&&ge.durationS===ie.durationS?ge:ie)
  },
  onDragLeave:re=>{
    re.currentTarget.contains(re.relatedTarget)||O(null)
  },
  onDrop:re=>{
    O(null);
    const ae=MDe(re.dataTransfer.getData($v)),
    ie=ae&&G(ae);
    if(!ie)return;
    re.preventDefault();
    const ge=Z(re.currentTarget,
      re.clientX,
      re.altKey,
      ie).startS;
    g(t.id,
      ie,
      ge)
  },
  onClick:re=>{
    re.target===re.currentTarget&&f()
  },
  children:[i.jsxs("button",
      {
        className:mr.laneAdd,
        style:{
          left:`${MP(t.items)*o}px`
        },
        title:_._({
            id:"s2DINh"
          }),
        onClick:re=>{
          re.stopPropagation(),
          m(t.characterId)
        },
        children:[i.jsx("span",
            {
              children:i.jsx(M,
                {
                  id:"lMKAwl"
                })
            }),
          i.jsx(K,
            {
              name:"add",
              size:"xs"
            })]
      }),
    n.map(re=>{
        const{
          item:ae,
          startS:ie,
          endS:ge
        }=re,
        pe=ae.id===d,
        ce=F?.dragging===!0&&ae.id===F.itemId,
        be=!pe&&(ae.kind==="clip"||ae.kind==="path"||aN(ae)||Fp(ae)&&ae.kind!=="cam-manual")&&yd(ae)>0;
        return i.jsxs("button",
          {
            className:Ze(mr.block,
              Fp(ae)?mr.blockCamera:aN(ae)||ae.kind==="path"&&!e?mr.blockObject:mr.blockHuman,
              ae.id===u&&mr.blockSelected,
              pe&&mr.blockPainting,
              ce&&mr.blockDragging),
            style:{
              left:ie*o,
              width:Math.max((ge-ie)*o,
                p2e),
              transform:ce?F&&!F.duplicating?`translateX(${(F.startS-ie)*o}px)`:void 0:F&&F.previewStarts.has(ae.id)?`translateX(${(F.previewStarts.get(ae.id)-ie)*o}px)`:void 0
            },
            onPointerDown:fe=>se(fe,
              re),
            onPointerMove:te,
            onPointerUp:ne,
            onPointerCancel:()=>{
              I(null),
              F?.duplicating&&E(null),
              B(null)
            },
            onClick:()=>{
              if(L.current){
                L.current=!1;
                return
              }h(ae.id)
            },
            children:[pe?i.jsx("span",
                {
                  className:mr.blockLabel,
                  children:i.jsx(M,
                    {
                      id:"PLOmvu"
                    })
                }):i.jsx("span",
                {
                  className:mr.blockLabel,
                  children:ae.kind==="path"?i.jsx(M,
                    {
                      id:"I6gXOa"
                    }):ae.kind==="play"?i.jsx(M,
                    {
                      id:"T91vKp"
                    }):aN(ae)?ZAr(ae):Fp(ae)?PDe(ae):ODe(ae.clip,
                    P)
                }),
              Zzt(ae)&&i.jsx(l,
                {
                  trackId:t.id,
                  item:ae,
                  startS:ie,
                  ppsPx:o
                }),
              be&&i.jsx("span",
                {
                  className:mr.trimHandle,
                  onPointerDown:fe=>Q(fe,
                    re),
                  onPointerMove:fe=>q(fe,
                    ae),
                  onPointerUp:Y,
                  onPointerCancel:()=>z(null),
                  onClick:fe=>fe.stopPropagation()
                })]
          },
          ae.id)
      }),
    A&&i.jsx("span",
      {
        className:mr.ghostBlock,
        style:{
          left:A.startS*o,
          width:Math.max(A.durationS*o,
            p2e)
        }
      }),
    W&&(W.durationS>0?i.jsx("span",
        {
          className:mr.ghostBlock,
          style:{
            left:W.startS*o,
            width:Math.max(W.durationS*o,
              p2e)
          }
        }):i.jsx("span",
        {
          className:mr.ghostCaret,
          style:{
            left:W.startS*o
          }
        })),
    (F?.dragging?F.guidesS:W?.guidesS??[]).map(re=>i.jsx("span",
        {
          className:mr.snapGuide,
          style:{
            left:re*o
          }
        },
        re))]
})
}function rCr({
characters:t,onAdd:e
}){
const[n,r]=p.useState(!1),[s,a]=p.useState(null),[o,l]=p.useState(""),c=p.useRef(null),d=p.useRef(null);
p.useEffect(()=>{
  if(!n)return;
  const g=b=>{
    const y=b.target;
    c.current?.contains(y)||d.current?.contains(y)||r(!1)
  };
  return document.addEventListener("pointerdown",
    g),
  ()=>document.removeEventListener("pointerdown",
    g)
},[n]);
const u=()=>{
if(n){
  r(!1);
  return
}a(c.current?.getBoundingClientRect()??null),l(""),r(!0)
},h=g=>g.name||(g.isWalker?_._({
    id:"zYe33Z"
  }):_._({
    id:"W0i24j"
  })),f=o.trim().toLowerCase(),m=t.filter(g=>h(g).toLowerCase().includes(f));
return i.jsxs("div",{
  className:mr.addTrack,
  children:[i.jsx(Hr,
      {
        content:_._({
            id:"S2Smir"
          }),
        side:"right",
        children:i.jsx("button",
          {
            ref:c,
            className:mr.addTrackButton,
            "aria-label":_._({
                id:"S2Smir"
              }),
            disabled:t.length===0,
            onClick:u,
            children:i.jsx(K,
              {
                name:"add",
                size:"xs"
              })
          })
      }),
    n&&s&&Ds.createPortal(i.jsxs("div",
        {
          ref:d,
          className:mr.addTrackDropdown,
          style:{
            position:"fixed",
            left:s.left,
            bottom:window.innerHeight-s.top+4,
            width:Math.max(s.width,
              180)
          },
          children:[i.jsxs("d

/*==============================================================================
 * 29. SEGMENT INSPECTOR — per-kind fields (path/clip/play/rotate/cam-*)
 * source file: tmp_b/segment_inspector_pretty.js
 ==============================================================================*/
"_kindRow_1tfm4_4",Y$r="_kindLabel_1tfm4_11",Q$r="_charName_1tfm4_17",J$r="_numberInput_1tfm4_25",eVr="_playModeBtn_1tfm4_32",tVr="_keySlots_1tfm4_62",nVr="_keySlot_1tfm4_62",rVr="_keySlotDropActive_1tfm4_79",sVr="_keySlotKey_1tfm4_84",aVr="_keySlotClip_1tfm4_98",iVr="_keySlotEmpty_1tfm4_107",oVr="_keySlotClear_1tfm4_122",lVr="_kfCluster_1tfm4_137",cVr="_kfBtn_1tfm4_143",dVr="_kfBtnOn_1tfm4_165",jh={
  kindRow:X$r,
  kindLabel:Y$r,
  charName:Q$r,
  numberInput:J$r,
  playModeBtn:eVr,
  keySlots:tVr,
  keySlot:nVr,
  keySlotDropActive:rVr,
  keySlotKey:sVr,
  keySlotClip:aVr,
  keySlotEmpty:iVr,
  keySlotClear:oVr,
  kfCluster:lVr,
  kfBtn:cVr,
  kfBtnOn:dVr
},Mit=.2,uVr=.1,bL=.1,hVr=["x",
  "y",
  "z"];
function Nit({
    value:t,
    onChange:e
  }){
  return i.jsx(mh,
    {
      label:_._({
          id:"hHhnPW"
        }),
      value:t??0,
      step:.1,
      min:-15,
      max:15,
      onChange:n=>e({
          aimOffsetUnits:n
        })
    })
}function pVr({
    enabled:t,
    onKeyframe:e,
    hasPrev:n,
    hasNext:r,
    onPrevClick:s,
    onToggleClick:a,
    onNextClick:o
  }){
  return i.jsxs("div",
    {
      className:jh.kfCluster,
      children:[i.jsx("button",
          {
            className:jh.kfBtn,
            disabled:!n,
            title:_._({
                id:"F3tUlb"
              }),
            onClick:s,
            children:i.jsx(K,
              {
                name:"chevron-left",
                size:"xs"
              })
          }),
        i.jsx("button",
          {
            className:Ze(jh.kfBtn,
              e&&jh.kfBtnOn),
            disabled:!t,
            title:t?e?_._({
                id:"ejT8n5"
              }):_._({
                id:"aTjqNq"
              }):_._({
                id:"eOl9xZ"
              }),
            onClick:a,
            children:i.jsx(K,
              {
                name:"diamond",
                size:"xs",
                filled:e
              })
          }),
        i.jsx("button",
          {
            className:jh.kfBtn,
            disabled:!r,
            title:_._({
                id:"RZTuBT"
              }),
            onClick:o,
            children:i.jsx(K,
              {
                name:"chevron-right",
                size:"xs"
              })
          })]
    })
}function fVr({
    item:t,
    characterName:e,
    centerOptions:n,
    keyframeButton:r,
    onSpeedChange:s,
    walksPath:a,
    hasGait:o,
    onGaitChange:l,
    onAimChange:c,
    isEditingPath:d,
    onEditPathClick:u,
    onClipChange:h,
    onDurationChange:f,
    onPlayClick:m,
    onPlayKeyChange:g,
    onEmptyActionClick:b,
    onObjectDurationChange:y,
    onRotateAxisChange:v,
    onObjectSpeedChange:x,
    onRevolveCenterChange:w,
    onScaleFactorChange:k,
    subjectOptions:S,
    targetMarkerLabel:T,
    cameraFocalLengthMm:A,
    onCameraFieldsChange:C,
    onFlyClick:E,
    poseObject:j,
    onPoseAxisChange:I,
    onPoseFocalLengthChange:N,
    onRemoveClick:P
  }){
  const{
    i18n:F
  }=Ia(),
  B={
    walk_formal:_._({
        id:"jLH59m"
      }),
    walk:_._({
        id:"SUJByP"
      }),
    jog_fwd:_._({
        id:"k9/rti"
      }),
    sprint:_._({
        id:"VNbzs6"
      })
  },
  H=S.map(O=>({
        value:O.id,
        label:O.name
      })),
  z=_._({
      id:"A1taO8"
    }),
  L=_._({
      id:"4TVVsS"
    }),
  $={
    searchable:!0,
    searchLabel:z,
    emptyLabel:L
  };
  return i.jsxs("div",
    {
      className:Wr.rows,
      children:[i.jsxs("div",
          {
            className:jh.kindRow,
            children:[i.jsx("span",
                {
                  className:jh.kindLabel,
                  children:t.kind==="path"?i.jsx(M,
                    {
                      id:"I6gXOa"
                    }):t.kind==="play"?i.jsx(M,
                    {
                      id:"T91vKp"
                    }):t.kind==="rotate"?i.jsx(M,
                    {
                      id:"BulyBf"
                    }):t.kind==="revolve"?i.jsx(M,
                    {
                      id:"NP8KUz"
                    }):t.kind==="scale"?t.factor>=1?i.jsx(M,
                    {
                      id:"5DdjZ9"
                    }):i.jsx(M,
                    {
                      id:"8Mw+hK"
                    }):t.kind==="transform"?i.jsx(M,
                    {
                      id:"OCy3k9"
                    }):t.kind==="rig-transform"?i.jsx(M,
                    {
                      id:"f88wXe"
                    }):Fp(t)?PDe(t):i.jsx(M,
                    {
                      id:"X44slE"
                    })
                }),
              i.jsx("span",
                {
                  className:jh.charName,
                  children:e
                })]
          }),
        t.kind==="path"&&i.jsxs(i.Fragment,
          {
            children:[t.anchors.length<2&&i.jsx("div",
                {
                  className:Wr.hint,
                  children:i.jsx(M,
                    {
                      id:"WTCZcf"
                    })
                }),
              a&&o&&i.jsx(Zy,
                {
                  label:i.jsx(M,
                    {
                      id:"X44slE"
                    }),
                  value:t.gait??"walk",
                  options:Gzt.map(O=>({
                        value:O,
                        label:B[O]
                      })),
                  onChange:l
                }),
              i.jsx(Zy,
                {
                  label:i.jsx(M,
                    {
                      id:"Zc4YKz"
                    }),
                  ...$,
                  value:t.aim==="subject"?t.subjectId??"":a?"travel":t.aim??"travel",
                  options:[{
                      value:"travel",
                      label:_._({
                          id:"DeTbo5"
                        })
                    },
                    ...a?[]:[{
                        value:"locked",
                        label:_._({
                            id:"7dJlqT"
                          })
                      }],
                    ...H],
                  onChange:O=>{
                    O==="travel"||O==="locked"?c(O):c("subject",
                      O||null)
                  }
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"l9wI00"
                    }),
                  value:t.speedUnitsPerS,
                  step:.1,
                  min:Mit,
                  onChange:s
                }),
              !d&&i.jsx(Ws,
                {
                  variant:"quiet",
                  onClick:u,
                  children:i.jsx(M,
                    {
                      id:"TLO3rY"
                    })
                })]
          }),
        t.kind==="clip"&&i.jsxs(i.Fragment,
          {
            children:[i.jsx(Zy,
                {
                  label:i.jsx(M,
                    {
                      id:"X44slE"
                    }),
                  ...$,
                  value:t.clip,
                  options:vGt.map(O=>({
                        value:O.id,
                        label:F._(PU[O.id])
                      })),
                  onChange:h
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"gPwZFD"
                    }),
                  value:t.durationS,
                  step:.1,
                  min:uVr,
                  onChange:f
                })]
          }),
        t.kind==="play"&&i.jsxs(i.Fragment,
          {
            children:[i.jsxs("div",
                {
                  className:Wr.fieldRow,
                  children:[i.jsxs("button",
                      {
                        className:jh.playModeBtn,
                        onClick:m,
                        children:[i.jsx(K,
                            {
                              name:"gamepad",
                              size:"xs"
                            }),
                          i.jsx("span",
                            {
                              children:i.jsx(M,
                                {
                                  id:"T91vKp"
                                })
                            })]
                      }),
                    i.jsx("span",
                      {
                        className:Wr.label,
                        children:t.samples.length>0?`${t.durationS.toFixed(1)}s`:i.jsx(M,
                          {
                            id:"0m1C+q"
                          })
                      })]
                }),
              i.jsx("div",
                {
                  className:jh.keySlots,
                  children:qzt.map(O=>i.jsx(gVr,
                      {
                        slotKey:O,
                        clip:t.keymap[O],
                        onBind:g,
                        onEmptyClick:b
                      },
                      O))
                })]
          }),
        t.kind==="rotate"&&i.jsxs(i.Fragment,
          {
            children:[i.jsxs("label",
                {
                  className:Wr.fieldRow,
                  children:[i.jsx("span",
                      {
                        className:Wr.label,
                        children:i.jsx(M,
                          {
                            id:"whUN+9"
                          })
                      }),
                    i.jsx("span",
                      {
                        className:Wr.segmented,
                        role:"group",
                        children:hVr.map(O=>i.jsx("button",
                            {
                              className:Ze(Wr.segment,
                                t.axis===O&&Wr.active),
                              onClick:()=>v(O),
                              children:O.toUpperCase()
                            },
                            O))
                      })]
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"a8cgA+"
                    }),
                  value:t.degPerS,
                  step:10,
                  onChange:x
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"gPwZFD"
                    }),
                  value:t.durationS,
                  step:.5,
                  min:bL,
                  onChange:y
                })]
          }),
        t.kind==="revolve"&&i.jsxs(i.Fragment,
          {
            children:[i.jsx(Zy,
                {
                  label:i.jsx(M,
                    {
                      id:"FDRwtd"
                    }),
                  ...$,
                  value:t.centerObjectId??"",
                  options:[{
                      value:"",
                      label:_._({
                          id:"4axXHF"
                        })
                    },
                    ...n.map(O=>({
                          value:O.id,
                          label:O.name
                        }))],
                  onChange:O=>w(O||null)
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"a8cgA+"
                    }),
                  value:t.degPerS,
                  step:10,
                  onChange:x
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"gPwZFD"
                    }),
                  value:t.durationS,
                  step:.5,
                  min:bL,
                  onChange:y
                })]
          }),
        t.kind==="scale"&&i.jsxs(i.Fragment,
          {
            children:[i.jsx(mh,
                {
                  label:_._({
                      id:"TamI8T"
                    }),
                  value:t.factor,
                  step:.1,
                  min:.05,
                  onChange:k
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"gPwZFD"
                    }),
                  value:t.durationS,
                  step:.5,
                  min:bL,
                  onChange:y
                })]
          }),
        (t.kind==="transform"||t.kind==="rig-transform")&&i.jsxs(i.Fragment,
          {
            children:[i.jsx(mh,
                {
                  label:_._({
                      id:"gPwZFD"
                    }),
                  value:t.durationS,
                  step:.5,
                  min:bL,
                  onChange:y
                }),
              t.kind==="transform"&&j&&i.jsxs(i.Fragment,
                {
                  children:[i.jsx(a2,
                      {
                        label:i.jsx(M,
                          {
                            id:"p/78dY"
                          }),
                        values:j.position,
                        onAxisCommit:(O,
                          W)=>I("position",
                          O,
                          W)
                      }),
                    i.jsx(a2,
                      {
                        label:i.jsx(M,
                          {
                            id:"exWyD0"
                          }),
                        values:j.rotation,
                        onAxisCommit:(O,
                          W)=>I("rotation",
                          O,
                          W)
                      }),
                    i.jsx(a2,
                      {
                        label:i.jsx(M,
                          {
                            id:"bifv6N"
                          }),
                        values:j.scale,
                        onAxisCommit:(O,
                          W)=>I("scale",
                          O,
                          W)
                      }),
                    j.kind==="simple_figure"&&i.jsx(a2,
                      {
                        label:i.jsx(M,
                          {
                            id:"lVN9oC"
                          }),
                        values:j.headRotation??[0,
                          0,
                          0],
                        onAxisCommit:(O,
                          W)=>I("headRotation",
                          O,
                          W)
                      })]
                }),
              r]
          }),
        t.kind==="cam-move"&&i.jsxs(i.Fragment,
          {
            children:[i.jsx(Zy,
                {
                  label:i.jsx(M,
                    {
                      id:"QWdKwH"
                    }),
                  ...$,
                  value:t.move,
                  options:bP.map(O=>({
                        value:O,
                        label:NDe(O)
                      })),
                  onChange:O=>C({
                      move:O
                    })
                }),
              yP.includes(t.move)&&i.jsx(Zy,
                {
                  label:i.jsx(M,
                    {
                      id:"UJmAAK"
                    }),
                  ...$,
                  value:t.subjectId??"",
                  options:[{
                      value:"",
                      label:T
                    },
                    ...H],
                  onChange:O=>C({
                      subjectId:O||null
                    })
                }),
              yP.includes(t.move)&&i.jsx(Nit,
                {
                  value:t.aimOffsetUnits,
                  onChange:C
                }),
              YLe.includes(t.move)&&i.jsxs(i.Fragment,
                {
                  children:[i.jsx(mh,
                      {
                        label:_._({
                            id:"QiM6N+"
                          }),
                        value:t.angleDeg,
                        step:15,
                        min:15,
                        max:360,
                        onChange:O=>C({
                            angleDeg:O
                          })
                      }),
                    i.jsxs("div",
                      {
                        className:Wr.fieldRow,
                        children:[i.jsx("span",
                            {
                              className:Wr.label,
                              children:i.jsx(M,
                                {
                                  id:"MRB7nI"
                                })
                            }),
                          i.jsxs("span",
                            {
                              className:Wr.segmented,
                              role:"group",
                              children:[i.jsx("button",
                                  {
                                    className:Ze(Wr.segment,
                                      t.direction==="ccw"&&Wr.active),
                                    title:_._({
                                        id:"n9kdXQ"
                                      }),
                                    onClick:()=>C({
                                        direction:"ccw"
                                      }),
                                    children:i.jsx(K,
                                      {
                                        name:"reset",
                                        size:"xs"
                                      })
                                  }),
                                i.jsx("button",
                                  {
                                    className:Ze(Wr.segment,
                                      t.direction==="cw"&&Wr.active),
                                    title:_._({
                                        id:"KZLpTS"
                                      }),
                                    onClick:()=>C({
                                        direction:"cw"
                                      }),
                                    children:i.jsx(K,
                                      {
                                        name:"refresh",
                                        size:"xs"
                                      })
                                  })]
                            })]
                      })]
                }),
              QLe.includes(t.move)&&i.jsx(mh,
                {
                  label:_._({
                      id:"N9mcjz"
                    }),
                  value:t.heightDeltaUnits,
                  step:.5,
                  min:.5,
                  max:20,
                  onChange:O=>C({
                      heightDeltaUnits:O
                    })
                }),
              JLe.includes(t.move)&&i.jsx(mh,
                {
                  label:_._({
                      id:"41WLYu"
                    }),
                  value:Math.round(t.distanceScale*100),
                  step:10,
                  min:10,
                  max:400,
                  onChange:O=>C({
                      distanceScale:O/100
                    })
                })]
          }),
        t.kind==="cam-follow"&&i.jsx(Zy,
          {
            label:i.jsx(M,
              {
                id:"aaJhcT"
              }),
            ...$,
            value:t.objectId??"",
            options:[{
                value:"",
                label:_._({
                    id:"cTjAIm"
                  })
              },
              ...H],
            onChange:O=>C({
                objectId:O||null
              })
          }),
        t.kind==="cam-path"&&i.jsxs(i.Fragment,
          {
            children:[t.anchors.length<2&&i.jsx("div",
                {
                  className:Wr.hint,
                  children:i.jsx(M,
                    {
                      id:"MKrRdb"
                    })
                }),
              i.jsx(Zy,
                {
                  label:i.jsx(M,
                    {
                      id:"52VY2S"
                    }),
                  ...$,
                  value:t.aim==="subject"?t.subjectId??"":t.aim,
                  options:[{
                      value:"travel",
                      label:_._({
                          id:"DeTbo5"
                        })
                    },
                    {
                      value:"locked",
                      label:_._({
                          id:"JBYQjd"
                        })
                    },
                    {
                      value:"",
                      label:T
                    },
                    ...H],
                  onChange:O=>C(O==="travel"||O==="locked"?{
                      aim:O
                    }:{
                      aim:"subject",
                      subjectId:O||null
                    })
                }),
              t.aim!=="locked"&&i.jsx(Nit,
                {
                  value:t.aimOffsetUnits,
                  onChange:C
                }),
              i.jsx(mh,
                {
                  label:_._({
                      id:"l9wI00"
                    }),
                  value:t.speedUnitsPerS,
                  step:.1,
                  min:Mit,
                  onChange:O=>C({
                      speedUnitsPerS:O
                    })
                }),
              !d&&i.jsx(Ws,
                {
                  variant:"quiet",
                  onClick:u,
                  children:i.jsx(M,
                    {
                      id:"TLO3rY"
                    })
                })]
          }),
        Fp(t)&&i.jsxs(i.Fragment,
          {
            children:[t.kind!=="cam-path"&&i.jsx(mh,
                {
                  label:_._({
                      id:"gPwZFD"
                    }),
                  value:t.durationS,
                  step:.5,
                  min:bL,
                  onChange:O=>C({
                      durationS:O
                    })
                }),
              t.kind==="cam-move"&&t.move==="dolly_zoom"&&i.jsx(mh,
                {
                  label:_._({
                      id:"9n19Pz"
                    }),
                  value:t.focalLengthMm??A,
                  step:1,
                  min:q_,
                  max:WA,
                  onChange:O=>C({
                      focalLengthMm:O
                    })
                }),
              t.kind==="cam-transform"&&i.jsxs(i.Fragment,
                {
                  children:[j&&i.jsxs(i.Fragment,
                      {
                        children:[i.jsx(a2,
                            {
                              label:i.jsx(M,
                                {
                                  id:"p/78dY"
                                }),
                              values:j.position,
                              onAxisCommit:(O,
                                W)=>I("position",
                                O,
                                W)
                            }),
                          i.jsx(a2,
                            {
                              label:i.jsx(M,
                                {
                                  id:"exWyD0"
                                }),
                              values:j.rotation,
                              onAxisCommit:(O,
                                W)=>I("rotation",
                                O,
                                W)
                            }),
                          i.jsx(mh,
                            {
                              label:_._({
                                  id:"9n19Pz"
                                }),
                              value:j.focalLengthMm??A,
                              step:1,
                              min:q_,
                              max:WA,
                              onChange:N
                            })]
                      }),
                    r]
                }),
              t.kind==="cam-manual"&&i.jsxs(i.Fragment,
                {
                  children:[i.jsx("div",
                      {
                        className:Wr.hint,
                        children:t.samples.length===0?i.jsx(M,
                          {
                            id:"WCh3o9"
                          }):i.jsx(M,
                          {
                            id:"45r0Wt"
                          })
                      }),
                    i.jsxs(Ws,
                      {
                        variant:"quiet",
                        onClick:E,
                        children:[i.jsx(K,
                            {
                              name:"phone-camera",
                              size:"xs"
                            }),
                          i.jsx("span",
                            {
                              children:t.samples.length===0?i.jsx(M,
                                {
                                  id:"kW8chx"
                                }):i.jsx(M,
                                {
                                  id:"hkUyVQ"
                                })
                            })]
                      })]
                })]
          }),
        i.jsxs(Ws,
          {
            variant:"quiet",
            onClick:P,
            children:[i.jsx(K,
                {
                  name:"delete",
                  size:"xs"
                }),
              i.jsx("span",
                {
                  children:i.jsx(M,
                    {
                      id:"t/YqKh"
                    })
                })]
          })]
    })
}function mh({
    label:t,
    value:e,
    step:n,
    min:r,
    max:s,
    onChange:a
  }){
  const[o,
    l]=p.useState(null),
  c=()=>{
    if(o===null)return;
    const u=Number(o);
    o!==""&&!Number.isNaN(u)&&a(u),
    l(null)
  },
  {
    scrubHandlers:d
  }=fBe({
      value:e,
      step:n,
      min:r,
      max:s,
      onChange:a
    });
  return i.jsxs("label",
    {
      className:Wr.fieldRow,
      children:[i.jsx("span",
          {
            className:Wr.label,
            style:pBe,
            ...d,
            children:t
          }),
        i.jsx("input",
          {
            type:"text",
            inputMode:"decimal",
            className:Ze(Wr.numberBox,
              jh.numberInput),
            value:o??String(e),
            onChange:u=>l(u.target.value),
            onBlur:c,
            onKeyDown:u=>{
              u.key==="Enter"&&u.currentTarget.blur()
            }
          })]
    })
}function mVr(t){
  return t==="lmb"?_._({
      id:"945seR"
    }):t==="rmb"?_._({
      id:"Tl2/KQ"
    }):t.toUpperCase()
}function gVr({
    slotKey:t,
    clip:e,
    onBind:n,
    onEmptyClick:r
  }){
  const{
    i18n:s
  }=Ia(),
  [a,
    o]=p.useState(!1);
  return i.jsxs("span",
    {
      className:Ze(jh.keySlot,
        a&&jh.keySlotDropActive),
      onDragOver:l=>{
        l.dataTransfer.types.includes($v)&&(l.preventDefault(),
          l.dataTransfer.dropEffect="copy",
          o(!0))
      },
      onDragLeave:()=>o(!1),
      onDrop:l=>{
        o(!1);
        const c=MDe(l.dataTransfer.getData($v));
        c?.kind==="clip"&&(l.preventDefault(),
          n(t,
            c.clip))
      },
      children:[i.jsx("span",
          {
            className:jh.keySlotKey,
            title:mVr(t),
            children:i.jsx(JZt,
              {
                keyName:t
              })
          }),
        e?i.jsxs(i.Fragment,
          {
            children:[i.jsx("span",
                {
                  className:jh.keySlotClip,
                  children:ODe(e,
                    s)
                }),
              i.jsx("button",
                {
                  className:jh.keySlotClear,
                  title:_._({
                      id:"4gj0on"
                    }),
                  onClick:()=>n(t,
                    null),
                  children:i.jsx(K,
                    {
                      name:"close",
                      size:"xs"
                    })
                })]
          }):i.jsx("button",
          {
            type:"button",
            className:jh.keySlotEmpty,
            onClick:r,
            children:i.jsx(M,
              {
                id:"F/IjEH"
              })
          })]
    })
}function bVr(t){
  const e=new Map,
  n=[];
  for(const[r,
      s]of Object.entries(t)){
    if(s.kind==="camera"||s.kind==="spotlight"||Xu(t,
        r))continue;
    const a=(e.get(s.kind)??0)+1;
    e.set(s.kind,
      a);
    const o=s.kind==="cube"?_._({
        id:"n056g0",
        values:{
          kindIndex:a
        }
      }):s.kind==="sphere"?_._({
        id:"FMp7Cl",
        values:{
          kindIndex:a
        }
      }):s.kind==="cylinder"?_._({
        id:"uyxqJS",
        values:{
          kindIndex:a
        }
      }):s.kind==="humanoid"?_._({
        id:"CMo67k",
        values:{
          kindIndex:a
        }
      }):s.kind==="simple_figure"?_._({
        id:"Mo+ojX",
        values:{
          kindIndex:a
        }
      }):s.kind==="target"?_._({
        id:"q1oG3Q",
        values:{
          kindIndex:a
        }
      }):_._({
        id:"yIxm6F",
        values:{
          kindIndex:a
        }
      });
    n.push({
        id:r,
        label:s.name??o
      })
  }return n
}const yVr="_mmInput_oz3bw_6",vVr="_filmWithPhone_oz3bw_13",Pit={
  mmInput:yVr,
  filmWithPhone:vVr
},xVr=()=>[{
    value:"off",
    label:_._({
        id:"az8lvo"
      })
  },
  {
    value:"subtle",
    label:_._({
        id:"xjeLYy"
      })
  },
  {
    value:"medium",
    label:_._({
        id:"agPptk"
      })
  },
  {
    value:"heavy",
    label:_._({
        id:"McoVWm"
      })
  }];
function wVr({
    focalLengthMm:t,
    recordAspect:e,
    cameraShake:n,
    onFocalLengthChange:r,
    onRecordAspectChange:s,
    onCameraShakeChange:a,
    onFilmWithPhoneClick:o
  }){
  const[l,
    c]=p.useState(null),
  {
    scrubHandlers:d
  }=fBe({
      value:t,
      step:1,
      min:q_,
      max:WA,
      onChange:r
    }),
  u=()=>{
    if(l===null)return;
    const h=Number(l);
    l!==""&&!Number.isNaN(h)&&r(Math.min(WA,
        Math.max(q_,
          h))),
    c(null)
  };
  return i.jsxs(i.Fragment,
    {
      children:[i.jsxs("div",
          {
            className:Wr.fieldRow,
            children:[i.jsx("span",
                {
                  className:Wr.label,
                  style:pBe,
                  ...d,
                  children:i.jsx(M,
                    {
                      id:"VjcELh"
                    })
                }),
              i.jsxs("label",
                {
                  className:Wr.numberField,
                  children:[i.jsx("input",
                      {
                        type:"text",
                        inputMode:"decimal",
                        className:Ze(Wr.numberInput,
                          Pit.mmInput),
                        value:l??String(t),
                        onChange:h=>c(h.target.value),
                        onBlur:u,
                        onKeyDown:h=>{
                          h.key==="Enter"&&h.currentTarget.blur()
                        }
                      }),
                    i.jsx("span",
                      {
                        className:Wr.unit,
                        children:"mm"
                      })]
                })]
          }),
        i.jsx(Zy,
          {
            label:i.jsx(M,
              {
                id:"iKM2jY"
              }),
            value:e,
            options:Zae.map(h=>({
                  value:h.key,
                  label:h.key
                })),
            onChange:s
          }),
        i.jsx(Zy,
          {
            label:i.jsx(M,
              {
                id:"bSanJc"
              }),
            value:n,
            options:xVr(),
            onChange:a
          }),
        i.jsxs("button",
          {
            type:"button",
            className:Ze(Wr.select,
              Pit.filmWithPhone),
            onClick:o,
            children:[i.jsx(K,
                {
                  name:"phone-camera",
                  size:"xs"
                }),
              i.jsx(M,
                {
                  id:"kW8chx"
                })]
          })]
    })
}function _Vr({
    settings:t,
    shadowless:e,
    onSpotlightChange:n,
    onSlideStart:r,
    onSlideEnd:s
  }){
  const a=[{
      shape:"round",
      label:_._({
          id:"LeIKtN"
        }),
      title:_._({
          id:"fzGT9V"
        })
    },
    {
      shape:"square",
      label:_._({
          id:"1DA6ap"
        }),
      title:_._({
          id:"/e0OAo"
        })
    }],
  o=(l,
    c,
    d)=>i.jsxs("label",
    {
      className:Wr.fieldRow,
      children:[i.jsx("span",
          {
            className:Wr.label,
            children:c
          }),
        i.jsx("input",
          {
            type:"range",
            className:Bm.slider,
            min:0,
            max:100,
            step:1,
            "aria-label":d,
            value:t[l],
            onPointerDown:u=>{
              u.currentTarget.setPointerCapture(u.pointerId),
              r()
            },
            onPointerUp:s,
            onPointerCancel:s,
            onChange:u=>n({
                [l]:Number(u.target.value)
              })
          })]
    });
  return i.jsxs("div",
    {
      className:Wr.rows,
      children:[i.jsxs("div",
          {
            className:Wr.fieldRow,
            children:[i.jsx("span",
                {
                  className:Wr.label,
                  children:i.jsx(M,
                    {
                      id:"WkbAmY"
                    })
                }),
              i.jsx("span",
                {
                  className:Wr.segmented,
                  role:"group",
                  children:a.map(l=>i.jsx("button",
                      {
                        type:"button",
                        title:l.title,
                        className:Ze(Wr.segment,
                          t.shape===l.shape&&Wr.active),
                        "aria-pressed":t.shape===l.shape,
                        onClick:()=>n({
                            shape:l.shape
                          }),
                        children:l.label
                      },
                      l.shape))
                })]
          }),
        o("intensity",
          i.jsx(M,
            {
              id:"Rc4Tlx"
            }),
          _._({
              id:"wJv3nH"
            })),
        o("diffusion",
          i.jsx(M,
            {
              id:"GN9FtP"
            }),
          _._({
              id:"ay9uU+"
            })),
        e&&i.jsx("div",
          {
            className:Wr.hint,
            children:i.jsx(M,
              {
                id:"jNG72M"
              })
          })]
    })
}const kVr="_sidePanelSections_lpegt_4",SVr="_host_lpegt_15",TVr="_dragDimmed_lpegt_12",AVr="_panelSection_lpegt_26",CVr="_panelSectionTitle_lpegt_35",u$={
  sidePanelSections:kVr,
  host:SVr,
  dragDimmed:TVr,
  panelSection:AVr,
  panelSectionTitle:CVr
};
function EVr(t){
  switch(t){
    case void 0:return i.jsx(M,
      {
        id:"l/UFPv"
      });
    case"camera":return i.jsx(M,
      {
        id:"m6Sktu"
      });
    case"target":return i.jsx(M,
      {
        id:"EENRfL"
      });
    case"humanoid":return i.jsx(M,
      {
        id:"KOHEah"
      });
    case"simple_figure":return i.jsx(M,
      {
        id:"QhfBRH"
      });
    case"group":return i.jsx(M,
      {
        id:"xkW49z"
      });
    case"spotlight":return i.jsx(M,
      {
        id:"xktNnJ"
      });
    default:return i.jsx(M,
      {
        id:"j2Eh3O"
      })
  }
}function jVr({
    panelsVisible:t,
    draggingComponent:e,
    draggingAction:n,
    widthPx:r,
    onWidthChange:s,
    objects:a,
    selectedId:o,
    selectedObject:l,
    authoredSelectedObject:c,
    selectionCount:d,
    selectionColorable:u,
    selectionColor:h,
    drivenBy:f,
    segment:m,
    segmentKeyframe:g,
    focalLengthMm:b,
    recordAspect:y,
    cameraShake:v,
    onSegmentSpeedChange:x,
    onSegmentGaitChange:w,
    onSegmentAimChange:k,
    isEditingPath:S,
    onSegmentEditPathClick:T,
    onSegmentClipChange:A,
    onSegmentDurationChange:C,
    onSegmentPlayClick:E,
    onSegmentPlayKeyChange:j,
    onSegmentEmptyActionClick:I,
    onSegmentObjectDurationChange:N,
    onSegmentRotateAxisChange:P,
    onSegmentObjectSpeedChange:F,
    onSegmentRevolveCenterChange:B,
    onSegmentScaleFactorChange:H,
    onSegmentCameraFieldsChange:z,
    onSegmentFlyClick:L,
    segmentPoseObject:$,
    onSegmentPoseAxisChange:O,
    onSegmentPoseFocalLengthChange:W,
    onSegmentRemoveClick:U,
    onSelectedAxisChange:V,
    cameraAim:G,
    cameraVerticalAimDeg:Z,
    onCameraVerticalAimChange:se,
    onSelectedColorPreview:X,
    onSelectedColorChange:te,
    selectedSpotlightShadowless:ne,
    onSelectedSpotlightChange:Q,
    onEditGestureStart:q,
    onEditGestureEnd:Y,
    onSelectedNameChange:re,
    onSelectedPersonKindChange:ae,
    onFocalLengthChange:ie,
    onRecordAspectChange:ge,
    onCameraShakeChange:pe,
    onFilmWithPhoneClick:ce
  }){
  const be=l?.kind==="camera",
  fe=t&&(!!l||!!m),
  we=m?.item.kind==="play",
  Ee=e||n&&!we;
  return i.jsxs(IVr,
    {
      hidden:!fe,
      dimmed:Ee,
      title:EVr(d>1?void 0:l?.kind),
      widthPx:r,
      onWidthChange:s,
      children:[t&&m&&i.jsx(Rit,
          {
            icon:i.jsx(K,
              {
                name:"film",
                size:"sm"
              }),
            title:i.jsx(M,
              {
                id:"RqGEko"
              }),
            children:i.jsx(fVr,
              {
                item:m.item,
                characterName:m.characterName,
                walksPath:m.walksPath,
                hasGait:m.hasGait,
                centerOptions:m.centerOptions,
                subjectOptions:m.subjectOptions,
                targetMarkerLabel:m.targetMarkerLabel,
                cameraFocalLengthMm:m.cameraFocalLengthMm,
                keyframeButton:g,
                onSpeedChange:x,
                onGaitChange:w,
                onAimChange:k,
                isEditingPath:S,
                onEditPathClick:T,
                onClipChange:A,
                onDurationChange:C,
                onPlayClick:E,
                onPlayKeyChange:j,
                onEmptyActionClick:I,
                onObjectDurationChange:N,
                onRotateAxisChange:P,
                onObjectSpeedChange:F,
                onRevolveCenterChange:B,
                onScaleFactorChange:H,
                onCameraFieldsChange:z,
                onFlyClick:L,
                poseObject:$,
                onPoseAxisChange:O,
                onPoseFocalLengthChange:W,
                onRemoveClick:U
              },
              m.item.id)
          }),
        l&&i.jsxs(Rit,
          {
            children:[i.jsx(M$r,
                {
                  object:l,
                  authoredObject:c??void 0,
                  selectionCount:d,
                  drivenBy:f,
                  isRigging:o?Xu(a,
                    o):!1,
                  cameraAim:G,
                  verticalAimDeg:Z,
                  color:h,
                  onNameChange:re,
                  onPersonKindChange:ae,
                  onAxisChange:V,
                  onVerticalAimChange:se,
                  onColorPreview:X,
                  onColorChange:u?te:void 0
                },
                o),
              l.kind==="spotlight"&&i.jsx(_Vr,
                {
                  settings:BR(l),
                  shadowless:ne,
                  onSpotlightChange:Q,
                  onSlideStart:q,
                  onSlideEnd:Y
                }),
              be&&i.jsx(wVr,
                {
                  focalLengthMm:b,
                  recordAspect:y,
                  cameraShake:v,
                  onFocalLengthChange:ie,
                  onRecordAspectChange:ge,
                  onCameraShakeChange:pe,
                  onFilmWithPhoneClick:()=>o&&ce(o)
                })]
          })]
    })
}function IVr({
    hidden:t,
    dimmed:e,
    title:n,
    widthPx:r,
    onWidthChange:s,
    children:a
  }){
  const{
    mounted:o,
    className:l
  }=eZt(!t);
  return o?i.jsxs("aside",
    {
      className:Ze(Zr.hudWindow,
        u$.host,
        l,
        e&&u$.dragDimmed),
      style:{
        width:r
      },
      children:[i.jsx(Dhe,
          {
            edge:"right",
            sign:1,
            onSizePx:s
          }),
        i.jsx("div",
          {
            className:Zr.title,
            children:n
          }),
        i.jsx("div",
          {
            className:Ze(u$.sidePanelSections,
              Zr.hudScroll),
            children:a
          })]
    }):null
}function Rit({
    icon:t,
    title:e,
    children:n
  }){
  return i.jsxs("section",
    {
      className:u$.panelSection,
      children:[e&&i.jsxs("h3",
          {
            className:u$.panelSectionTitle,
            children:[t,
              i.jsx("span",
                {
                  children:e
                })]
          }),
        n]
    })
}function MVr(t){
  if(Fp(t))return PDe(t);
  switch(t.kind){
    case"path":return _._({
        id:"I6gXOa"
      });
    case"play":return _._({
        id:"T91vKp"
      });
    case"clip":return _._({
        id:"X44slE"
      });
    case"rotate":return _._({
        id:"BulyBf"
      });
    case"revolve":return _._({
        id:"NP8KUz"
      });
    case"scale":return _._({
        id:"bifv6N"
      });
    default:return _._({
        id:"OCy3k9"
      })
  }
}function NVr(t){
  const e=(U,
    V,
    G,
    Z)=>{
    const se=t.objects.peek();
    for(const X of t.selectedIds.peek()){
      const te=se[X];
      !te||!$Hr(te.kind,
        U)||t.updateObjectTransform(X,
        VHr(te,
          U,
          V,
          G,
          Z))
    }
  },
  n=U=>{
    const V=t.objects.peek(),
    G=V[t.selectedId.peek()??""],
    Z=G?.targetId?V[G.targetId]:void 0;
    if(!G||!Z)return;
    const se=T8r(G.position,
      Z.position,
      U);
    t.updateObjectTransform(G.targetId,
      {
        position:[Z.position[0],
          se,
          Z.position[2]]
      })
  },
  r=U=>{
    t.setObjectsColor(t.selectedIds.peek(),
      U)
  },
  s=U=>{
    t.previewObjectsColor(t.selectedIds.peek(),
      U)
  },
  a=U=>{
    for(const V of t.selectedIds.peek())t.setSpotlight(V,
      U)
  },
  o=U=>{
    const V=t.selectedId.peek();
    V&&t.setObjectName(V,
      U)
  },
  l=U=>{
    const V=t.selectedId.peek();
    V&&t.pickPersonKind(V,
      U,
      "panel")
  },
  c=U=>{
    const V=t.selectedSegment.peek();
    V&&U(V)
  },
  d=U=>c(V=>t.updatePathItemSpeed(V.trackId,
      V.itemId,
      U)),
  u=U=>c(V=>t.updatePathItemGait(V.trackId,
      V.itemId,
      U)),
  h=(U,
    V)=>c(G=>t.updatePathItemAim(G.trackId,
      G.itemId,
      U,
      V)),
  f=()=>c(U=>t.enterPathEdit(U.trackId,
      U.itemId)),
  m=U=>c(V=>t.updateClipItem(V.trackId,
      V.itemId,
      {
        clip:U
      })),
  g=U=>c(V=>t.updateClipItem(V.trackId,
      V.itemId,
      {
        durationS:U
      })),
  b=()=>c(U=>t.startPlaySession(U.trackId,
      U.itemId)),
  y=(U,
    V)=>c(G=>t.updatePlayItemKey(G.trackId,
      G.itemId,
      U,
      V)),
  v=U=>c(V=>t.setObjectItemDuration(V.trackId,
      V.itemId,
      U)),
  x=U=>c(V=>t.setRotateAxis(V.trackId,
      V.itemId,
      U)),
  w=U=>c(V=>t.setObjectItemSpeed(V.trackId,
      V.itemId,
      U)),
  k=U=>c(V=>t.setRevolveCenter(V.trackId,
      V.itemId,
      U)),
  S=U=>c(V=>t.setScaleFactor(V.trackId,
      V.itemId,
      U)),
  T=U=>c(V=>t.setCameraItemFields(V.trackId,
      V.itemId,
      U)),
  A=()=>c(U=>t.flyManualSegment(U.trackId,
      U.itemId)),
  C=U=>{
    const V=B(U);
    retur

/*==============================================================================
 * 30. PLAN CANVAS rBr — view model, pointer intents (DLr/DZt/HLr/BLr), wheel/pan/zoom
 * source file: tmp_b/plan_canvas_pretty.js
 ==============================================================================*/
:t.moveTo(l(x),
  c(ZA(m,
      x)))
}t.stroke();
const g={
x:l(.5),y:c(h)
},b={
x:l(.5+f[0]),y:c(h+f[1])
};
if(s>1){
if(s>2.8){
  t.lineWidth=1;
  for(const v of[b,
      {
        x:l(.5-f[0]),
        y:c(h-f[1])
      }])z6(t,
    g.x,
    g.y,
    v.x,
    v.y),
  t.fillStyle=e.panel,
  t.beginPath(),
  t.arc(v.x,
    v.y,
    4,
    0,
    y_),
  t.fill(),
  t.stroke()
}t.fillStyle=e.camera,t.beginPath(),t.arc(g.x,
  g.y,
  5,
  0,
  y_),t.fill()
}s>1.2&&s<2.8&&(t.fillStyle=e.camera,t.font=`${uBe}px ${e.fontFamily}`,t.fillText(n.metres(1+h*3),
  g.x+9,
  g.y-8));
let y;
if(s<1){
const v=_m(s);
y={
  x:$u(60,
    g.x,
    v),
  y:$u(o-10,
    c(.2),
    v)
}
}else if(s<2.6)y=g;
else if(s<3.4){
const v=_m((s-2.6)/.8);
y={
  x:$u(g.x,
    l(.5+1/6),
    v),
  y:$u(g.y,
    c(h),
    v)
}
}else s<5.2?y=b:y={
x:b.x+12,y:b.y+10
};
for(const v of[.9,
  3.3])s<=v||s>=v+.25||(t.save(),t.globalAlpha=1-(s-v)/.25,t.strokeStyle=e.camera,t.beginPath(),t.arc(y.x,
  y.y,
  6+(s-v)*60,
  0,
  y_),t.stroke(),t.restore());
XB(t,e,y)
}const qDr="_popover_14wvr_3",ZDr="_close_14wvr_29",KDr="_demo_14wvr_49 _palette_1sdme_3",XDr="_sentence_14wvr_56",XY={
popover:qDr,close:ZDr,demo:KDr,sentence:XDr
},YDr={
help:{
draw:UDr,stillS:BDr
},focus:{
draw:WDr,stillS:HDr
},height:{
draw:GDr,stillS:$Dr
}
};
function QDr({
tutorial:t,onClose:e
}){
const n=p.useRef(null);
return p.useEffect(()=>{
  const r=n.current,
  s=r?.getContext("2d");
  if(!r||!s)return;
  const a=window.devicePixelRatio||1;
  r.width=c$*a,
  r.height=d$*a,
  s.setTransform(a,
    0,
    0,
    a,
    0,
    0);
  const o=BZt(r),
  l={
    draw:_._({
        id:"5TURvb"
      }),
    drawing:_._({
        id:"fI7ZNS"
      }),
    focus:_._({
        id:"Fsd1Wl"
      }),
    metres:g=>{
      const b=g.toFixed(1);
      return _._({
          id:"yT0rs7",
          values:{
            height:b
          }
        })
    }
  },
  {
    draw:c,
    stillS:d
  }=YDr[t];
  if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1){
    c(s,
      o,
      l,
      d);
    return
  }let h=null,
  f=0;
  const m=g=>{
    h??=g,
    c(s,
      o,
      l,
      (g-h)/1e3),
    f=requestAnimationFrame(m)
  };
  return f=requestAnimationFrame(m),
  ()=>cancelAnimationFrame(f)
},[t]),p.useEffect(()=>{
  const r=s=>{
    s.key!=="Escape"||s.defaultPrevented||!ix()||(s.preventDefault(),
      e())
  };
  return document.addEventListener("keydown",
    r,
    !0),
  ()=>document.removeEventListener("keydown",
    r,
    !0)
},[e]),i.jsxs("div",{
  className:XY.popover,
  role:"dialog",
  "aria-label":t==="help"?_._({
      id:"8AULTO"
    }):t==="focus"?_._({
      id:"VoR4LJ"
    }):_._({
      id:"Iwe4j1"
    }),
  children:[i.jsx("button",
      {
        type:"button",
        className:XY.close,
        "aria-label":_._({
            id:"1QfxQT"
          }),
        onClick:e,
        children:i.jsx(K,
          {
            name:"close",
            size:"sm"
          })
      }),
    i.jsx("canvas",
      {
        ref:n,
        className:XY.demo
      }),
    i.jsx("p",
      {
        className:XY.sentence,
        children:t==="help"?i.jsx(M,
          {
            id:"i1p4b3"
          }):t==="focus"?i.jsx(M,
          {
            id:"EJeEqK"
          }):i.jsx(M,
          {
            id:"g77QSd"
          })
      })]
})
}const dit="M232,32a8,8,0,0,0-8-8c-44.08,0-89.31,49.71-114.43,82.63A60,60,0,0,0,32,164c0,30.88-19.54,44.73-20.47,45.37A8,8,0,0,0,16,224H92a60,60,0,0,0,57.37-77.57C182.3,121.31,232,76.08,232,32ZM92,208H34.63C41.38,198.41,48,183.92,48,164a44,44,0,1,1,44,44Zm32.42-94.45q5.14-6.66,10.09-12.55A76.23,76.23,0,0,1,155,121.49q-5.9,4.94-12.55,10.09A60.54,60.54,0,0,0,124.42,113.55Zm42.7-2.68a92.57,92.57,0,0,0-22-22c31.78-34.53,55.75-45,69.9-47.91C212.17,55.12,201.65,79.09,167.12,110.87Z",JDr=(t,e,n)=>`url("data:image/svg+xml,${encodeURIComponent(t)}") ${e}, ${n}`,cye=JDr(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='-16 -16 288 288'><path d='${dit}' fill='white' stroke='white' stroke-width='28' stroke-linejoin='round'/><path d='${dit}' fill='#1C0F09'/></svg>`,"3 20","crosshair"),eBr="_plan_1sdme_20 _palette_1sdme_3",tBr="_focusTip_1sdme_34 _content_1czgt_6",uit={
plan:eBr,focusTip:tBr
},nBr=320,hit={
x:18,y:-44
},pit=(t,e)=>`translate(${t}px, ${e}px)`;
function dye(t,e){
const n=t.getBoundingClientRect(),r=n.width?t.clientWidth/n.width:1,s=n.height?t.clientHeight/n.height:1;
return{
x:(e.clientX-n.left)*r,y:(e.clientY-n.top)*s
}
}function rBr({
items:t,paths:e,selectedIds:n,aspect:r,locked:s,theme:a,drawing:o=!1,readOnly:l=!1,onFrame:c,besideRef:d,onIntents:u,onComponentDrop:h,frameId:f,centerOn:m,zoomCommand:g,onZoomPercent:b,onEdgePointerClick:y
}){
const v=p.useRef(null),x=p.useRef(null),w=p.useRef(ELr()),k=p.useRef(null),S=p.useRef([]),T=p.useRef(m?.seq??null),A=p.useRef(!1),C=p.useRef({
  w:0,
  h:0
}),E=p.useRef(null),j=p.useRef(null),I=p.useRef(null),N=p.useRef(null),P=p.useRef(g?.seq??null),F=p.useRef(null),B=p.useRef(null),H=p.useRef([]),z=_._({
  id:"Fsd1Wl"
}),L=p.useRef({
  items:t,
  paths:e,
  selectedIds:n,
  aspect:r,
  locked:s,
  drawing:o,
  readOnly:l,
  onFrame:c,
  besideRef:d,
  focusLabel:z,
  onIntents:u,
  frameId:f,
  centerOn:m,
  zoomCommand:g,
  onZoomPercent:b,
  onEdgePointerClick:y
});
L.current={
items:t,paths:e,selectedIds:n,aspect:r,locked:s,drawing:o,readOnly:l,onFrame:c,besideRef:d,focusLabel:z,onIntents:u,frameId:f,centerOn:m,zoomCommand:g,onZoomPercent:b,onEdgePointerClick:y
},p.useEffect(()=>{
  v.current&&(k.current=BZt(v.current))
},[a]),p.useEffect(()=>{
  v.current.style.cursor=o?cye:"",
  !o&&x.current&&(x.current.hidden=!0)
},[o]),p.useEffect(()=>{
  const Z=v.current,
  se=Z.getContext("2d");
  let X=0;
  const te=Q=>{
    X=requestAnimationFrame(te);
    const q=Z.clientWidth,
    Y=Z.clientHeight;
    if(!se||!k.current||q===0||Y===0)return;
    const re=window.devicePixelRatio||1,
    ae=Math.round(q*re),
    ie=Math.round(Y*re);
    (Z.width!==ae||Z.height!==ie)&&(Z.width=ae,
      Z.height=ie);
    const{
      items:ge,
      paths:pe,
      selectedIds:ce,
      onFrame:be,
      besideRef:fe,
      focusLabel:we
    }=L.current,
    Ee=be?.(Q);
    S.current=ge(),
    w.current=ILr(jLr(w.current,
        q,
        Y),
      S.current);
    const xe=I.current===null?0:Q-I.current;
    if(I.current=Q,
      j.current){
      const Se=BLr(w.current,
        O.current(),
        j.current,
        xe);
      w.current=Se.state,
      Se.intents.length&&L.current.onIntents(Se.intents)
    }const J=L.current.frameId,
    le=C.current.w!==q||C.current.h!==Y;
    if(J&&(J!==E.current||le&&!A.current)){
      const Se=MLr(w.current,
        S.current,
        J);
      Se!==w.current&&(E.current=J,
        C.current={
          w:q,
          h:Y
        }),
      w.current=Se
    }const ue=L.current.centerOn;
    if(ue&&ue.seq!==T.current){
      const Se=FLr(w.current,
        S.current,
        ue.id);
      if(Se!==w.current){
        T.current=ue.seq,
        A.current=!0;
        const{
          centerX:me,
          centerZ:Te
        }=w.current.view;
        B.current={
          from:{
            x:me,
            z:Te
          },
          to:{
            x:Se.view.centerX,
            z:Se.view.centerZ
          },
          startMs:Q
        }
      }
    }if(B.current){
      const Se=B.current,
      me=Math.min(1,
        (Q-Se.startMs)/nBr),
      Te=1-(1-me)**3;
      w.current={
        ...w.current,
        view:{
          ...w.current.view,
          centerX:Se.from.x+(Se.to.x-Se.from.x)*Te,
          centerZ:Se.from.z+(Se.to.z-Se.from.z)*Te
        }
      },
      me>=1&&(B.current=null)
    }const{
      view:oe,
      drag:ye
    }=w.current,
    je=L.current.zoomCommand;
    je&&je.seq!==P.current&&(P.current=je.seq,
      A.current=!0,
      w.current=je.kind==="fit"?OLr(w.current):RLr(w.current,
        je.kind==="in"?1:-1));
    const ve=LLr(w.current);
    ve!==F.current&&(F.current=ve,
      L.current.onZoomPercent?.(ve)),
    se.setTransform(re,
      0,
      0,
      re,
      0,
      0),
    SDr(se,
      {
        view:oe,
        items:S.current,
        selection:new Set(ce),
        paths:pe,
        palette:k.current,
        marquee:ye?.kind==="marquee"?ye.rect:null,
        dimPathOf:Ee?.dimPathOf,
        stroke:Ee?.stroke,
        focus:Ee?.focus&&{
          ...Ee.focus,
          label:we
        }
      }),
    H.current=$Ir(S.current,
      oe),
    FDr(se,
      H.current,
      k.current);
    const ke=fe?.current,
    Ae=ce.length===1?S.current.find(Se=>Se.id===ce[0]):void 0;
    if(ke&&Ae&&!Ee?.stroke){
      const Se=iu(oe,
        Ae.footprint),
      me=Se.x>=0&&Se.x<=oe.widthPx&&Se.y>=0&&Se.y<=oe.heightPx;
      ke.style.visibility=me?"":"hidden";
      const Te=ZIr(Ae,
        oe,
        {
          widthPx:ke.offsetWidth,
          heightPx:ke.offsetHeight
        });
      ke.style.transform=pit(Te.x,
        Te.y)
    }
  };
  X=requestAnimationFrame(te);
  const ne=Q=>{
    Q.preventDefault(),
    Q.stopPropagation(),
    B.current=null,
    A.current=!0,
    w.current=NLr(w.current,
      {
        p:dye(Z,
          Q),
        dx:Q.deltaX,
        dy:Q.deltaY,
        deltaMode:Q.deltaMode,
        zoom:Q.ctrlKey||Q.metaKey
      })
  };
  return Z.addEventListener("wheel",
    ne,
    {
      passive:!1
    }),
  ()=>{
    cancelAnimationFrame(X),
    Z.removeEventListener("wheel",
      ne);
    const{
      intents:Q
    }=$Lr(w.current);
    Q.length&&L.current.onIntents(Q)
  }
},[]);
const $=()=>({
  items:S.current,
  selection:L.current.selectedIds,
  aspect:L.current.aspect,
  locked:L.current.locked,
  drawing:L.current.drawing,
  readOnly:L.current.readOnly
}),O=p.useRef($);
O.current=$;
const W=(Z,se)=>{
const X=x.current;
if(!L.current.drawing||!X)return;
const te=!!se&&!!OZt(w.current,
  $(),
  se);
Z.style.cursor=cye,X.hidden=!te,te&&(X.style.transform=pit(se.x+hit.x,
    se.y+hit.y))
},U=Z=>{
w.current=Z.state,Z.intents.length&&L.current.onIntents(Z.intents)
},V=Z=>({
  p:dye(Z.currentTarget,
    Z),
  shift:Z.shiftKey,
  mod:Z.metaKey||Z.ctrlKey
}),G=()=>{
j.current=null,U(HLr(w.current,
    $()))
};
return i.jsxs(i.Fragment,{
  children:[i.jsx("canvas",
      {
        ref:v,
        className:uit.plan,
        "data-testid":"stage-plan",
        onPointerDown:Z=>{
          if(B.current=null,
            A.current=!0,
            Z.button===1||Z.button===2){
            Z.preventDefault(),
            Z.currentTarget.setPointerCapture(Z.pointerId),
            N.current=V(Z).p;
            return
          }if(Z.button!==0)return;
          const se=V(Z).p,
          X=H.current.find(te=>Math.hypot(se.x-te.x,
              se.y-te.y)<=uN+3);
          if(X){
            L.current.onEdgePointerClick?.(X.id);
            return
          }Z.currentTarget.setPointerCapture(Z.pointerId),
          W(Z.currentTarget,
            null),
          j.current=V(Z).p,
          U(DLr(w.current,
              $(),
              V(Z)))
        },
        onPointerMove:Z=>{
          if(!w.current.drag&&!N.current){
            const se=V(Z).p;
            if(H.current.some(te=>Math.hypot(se.x-te.x,
                  se.y-te.y)<=uN+3)){
              Z.currentTarget.style.cursor="pointer";
              return
            }Z.currentTarget.style.cursor==="pointer"&&(Z.currentTarget.style.cursor=L.current.drawing?cye:"")
          }if(N.current){
            const se=V(Z).p;
            w.current=PLr(w.current,
              se.x-N.current.x,
              se.y-N.current.y),
            N.current=se;
            return
          }w.current.drag||W(Z.currentTarget,
            V(Z).p),
          j.current&&(j.current=V(Z).p),
          U(DZt(w.current,
              $(),
              V(Z)))
        },
        onPointerLeave:Z=>W(Z.currentTarget,
          null),
        onPointerUp:Z=>{
          N.current?N.current=null:Z.button===0&&G()
        },
        onPointerCancel:()=>{
          N.current=null,
          G()
        },
        onContextMenu:Z=>Z.preventDefault(),
        onDragOver:Z=>{
          !h||s||Z.dataTransfer.types.includes(V6)&&(Z.preventDefault(),
            Z.dataTransfer.dropEffect="copy")
        },
        onDrop:Z=>{
          !h||s||Z.dataTransfer.types.includes(V6)&&(Z.preventDefault(),
            h(S1(w.current.view,
                dye(Z.currentTarget,
                  Z))))
        }
      }),
    i.jsx("div",
      {
        ref:x,
        className:uit.focusTip,
        role:"tooltip",
        hidden:!0,
        children:_._({
            id:"T2tcdy"
          })
      })]
})
}function sBr(t){
const e=new rDr(t),n=Mt(({
    onComponentDrop:c,
    frameId:d,
    standalone:u,
    phonePill:h,
    readOnly:f=!1
  })=>{
  const m=p.useRef(null),
  g=he(e.drawnMoveIds),
  b=he(e.drawTarget),
  y=he(e.targetPerson),
  v=he(e.locked),
  x=he(t.compiling),
  w=he(e.drawing),
  k=he(e.strokeClock),
  S=he(e.matchDrawSpeed),
  T=he(t.selectedIds);
  return p.useEffect(()=>{
      const A=C=>{
        C.key!=="Escape"||C.defaultPrevented||lGt(C.target)||ix()&&e.stepBack()&&C.preventDefault()
      };
      return document.addEventListener("keydown",
        A),
      ()=>document.removeEventListener("keydown",
        A)
    },
    []),
  i.jsxs(i.Fragment,
    {
      children:[i.jsx(rBr,
          {
            items:e.items,
            paths:he(e.paths),
            selectedIds:T,
            aspect:he(e.aspect),
            locked:v,
            theme:he(t.theme),
            drawing:w&&!f,
            readOnly:f,
            onFrame:e.drawFrame,
            besideRef:m,
            onIntents:e.apply,
            onComponentDrop:c,
            frameId:d,
            centerOn:he(e.centerRequest),
            zoomCommand:he(e.zoomCommand),
            onZoomPercent:e.reportZoom,
            onEdgePointerClick:e.goToCamera
          }),
        u&&!k&&i.jsx(r,
          {
            className:KB.corner
          }),
        u&&i.jsx(a,
          {
            className:hm.docked
          }),
        i.jsx(yRr,
          {
            cameras:he(e.cameraPills),
            selectedIds:T,
            onCameraClick:e.goToCamera
          }),
        b&&!v&&!x&&i.jsx(RRr,
          {
            state:w?"drawing":g.includes(b)?"update":"draw",
            groupRef:m,
            matchDrawSpeed:S,
            person:y,
            onClick:e.toggleDrawing,
            onDeleteClick:e.deleteMove,
            onMatchDrawSpeedChange:e.toggleMatchDrawSpeed,
            onPersonClick:A=>t.pickPersonKind(b,
              A,
              "plan"),
            editsHidden:f,
            children:h?.(b)
          }),
        k&&i.jsx(LRr,
          {
            nowS:k.nowS,
            ofS:k.ofS
          })]
    })
}),r=Mt(({
    className:c
  })=>i.jsx(iFr,
  {
    percent:he(e.zoomPercent),
    className:c,
    onZoomOutClick:e.zoomOut,
    onZoomToFitClick:e.zoomToFit,
    onZoomInClick:e.zoomIn
  })),s=Mt(c=>{
  const d=(he(t.performanceTimeS)-c.startS)/c.durationS;
  return d>=0&&d<=1?i.jsx(tFr,
    {
      xPx:c.xOfU(d)
    }):null
}),a=Mt(({
    className:c,
    readOnly:d=!1
  })=>{
  const u=he(e.heightMove),
  h=he(e.locked),
  f=he(t.compiling),
  m=!!u&&!f,
  g=p.useRef(u);
  m&&(g.current=u);
  const b=g.current;
  return i.jsx("div",
    {
      className:Ze(hm.reveal,
        c),
      "data-shown":m?"":void 0,
      "aria-hidden":!m,
      children:i.jsx("div",
        {
          className:hm.revealInner,
          children:b&&i.jsx(eFr,
            {
              curve:b.curve,
              maxM:b.maxM,
              playhead:y=>i.jsx(s,
                {
                  startS:b.startS,
                  durationS:b.durationS,
                  xOfU:y
                }),
              disabled:h||d||!m,
              onLinePress:e.pressCurveLine,
              onPointPress:e.pressCurvePoint,
              onDrag:e.dragCurve,
              onRelease:e.releaseCurve,
              onPointRemove:e.removeCurvePoint,
              onScrub:e.scrubCurve
            },
            b.itemId)
        })
    })
});
return{
PlanView:({
    frameId:c
  })=>i.jsx(n,
  {
    onComponentDrop:t.dropComponentAt,
    frameId:c,
    standalone:!0
  }),NodePlanView:c=>i.jsx(n,
  {
    ...c
  }),PlanZoom:r,HeightCurve:a,heightCurveShown:e.heightCurveShown,Tutorial:QDr,labels:e.labels,locked:e.locked,drawing:e.drawing,stroking:e.stroking,rehearseTip:e.rehearseTip,stopDrawing:e.stopDrawing,selectedCamera:e.selectedCamera,addCamera:e.addCamera,setLens:e.setLens,setCameraHeight:e.setCameraHeight,beginEdit:e.beginEdit,endEdit:e.endEdit,canAim:e.canAim,aimCamera:e.aimCamera,dispose:e.dispose
}
}const fit=14,mL=[{
id:"reading",share:.13
},{
id:"building",share:.39
},{
id:"checking",share:.48
}],mit=.22,aBr=.94,git=24;
function iBr(t){
return!!t&&typeof t=="object"&&typeof t.objects=="object"&&t.objects!==null
}function oBr(t){
const e=[],n=new Set,r=(s,a,o)=>{
if(n.has(s)||o.has(s))return;
o.add(s);
const l=a.parentId,c=l?t[l]:void 0;
l&&c&&r(l,
  c,
  o),!n.has(s)&&(n.add(s),
  e.push([s,
      a]))
};
for(const[s,
  a]of Object.entries(t))r(s,a,new Set);
return e
}function lBr(t){
for(const[e,
  n]of Object.entries(t))if(n.kind==="camera")return e;
return null
}async function cBr(t,e){
let n=!1;
t.startCompiling(()=>{
  n=!0
},fit);
try{
const r=await t.fetchScene(e);
if(n)return t.stopCompiling(),{
  built:!1
};
if(!iBr(r))return t.stopCompiling(),{
  built:!1
};
const s=oBr(r.objects),a=fit*1e3,o=a/git,l={
  
};
let c=-1,d=0;
for(let f=0;
  f<git&&(await t.wait(o),
    !n);
  f++){
  d+=o;
  const m=d/a;
  let g=0;
  for(let x=0;
    x<mL.length;
    x++)if(g+=mL[x].share,
    m<=g||x===mL.length-1){
    x!==c&&(c=x,
      t.setCompileReport({
          phase:mL[x].id
        }));
    break
  }const b=(m-mit)/(aBr-mit),
  y=Math.round(Math.min(1,
      Math.max(0,
        b))*s.length);
  let v=!1;
  for(let x=Object.keys(l).length;
    x<y;
    x++){
    const w=s[x];
    if(!w)break;
    l[w[0]]=w[1],
    v=!0
  }if(v){
    t.setSceneObjects({
        ...l
      });
    const x=s[Object.keys(l).length-1];
    x&&t.setCompileReport({
        phase:mL[c].id,
        latest:x[1].name??null
      })
  }
}const u=n?!1:t.loadSceneJson(r);
if(t.stopCompiling(),
  n||!u)return{
  built:!1
};
const h=lBr(r.objects);
return h&&t.lookThroughCamera(h),{
  built:!0
}
}catch{
return t.stopCompiling(),{
  built:!1
}
}
}const dBr=[[249,99,78],[247,144,9],[253,176,34],[116,164,45],[51,170,170],[95,151,176],[59,130,246]],uye=[[.5,.3,.17,0,0],[.38,.4,.21,1,1.7],[.63,.36,.19,2,3.1],[.28,.26,.18,3,.6],[.72,.48,.23,4,2.2],[.46,.58,.24,5,4.4],[.16,.52,.22,6,1.1],[.84,.28,.2,1,5],[.58,.74,.25,3,2.8],[.3,.72,.23,4,.3],[.88,.66,.24,0,3.7],[.08,.3,.2,2,4.9],[.7,.12,.18,5,1.4],[.22,.1,.19,6,2.6],[.94,.46,.22,3,.9],[.44,.92,.24,1,3.4]],bit=.09,yit=10,uBr=92,hBr=t=>Math.max(0,Math.min(1,(t-yit)/(uBr-yit))),GZt=t=>t*t*(3-2*t);
function pBr(t,e){
return t[2]*(1+.22*Math.sin(e*3+t[4])+.12*Math.sin(e*5-t[4]*2))
}function fBr(t,e,n){
let r=null;
for(let s=0;
s<uye.length;
s++){
const a=uye[s],o=s/uye.length*(1-bit),l=(n-o)/bit;
if(l<=0)continue;
const c=t-a[0],d=(e-a[1])*1.55,u=Math.hypot(c,
  d),h=pBr(a,
  Math.atan2(d,
    c))*GZt(Math.min(1,
    l));
if(u>h)continue;
const f=1-Math.min(1,
  u/Math.max(h,
    1e-4));
r={
  colour:dBr[a[3]],
  wet:Math.max(0,
    1-l)*.9+f*.25
}
}return r
}const YY=[[.19,.63,.14,.22],[.3,.44,.2,.34],[.49,.27,.3,.16],[.66,.38,.22,.4],[.78,.66,.17,.24]],vit=11,xit=.58;
function mBr(t,e,n){
const r=Math.max(0,t)%vit/vit,s=.08,a=.94;
if(r<s)return null;
const o=(a-s)/YY.length,l=(r-s)/o,c=Math.min(YY.length-1,Math.floor(l)),d=l-c,u=YY[Math.max(0,
  c-1)],h=YY[c],f=c===0?1:GZt(Math.min(1,
  d/xit)),m=S=>u[S]+(h[S]-u[S])*f,g=m(0),b=m(1),y=m(2),v=m(3),x=.55+.45*f,w=Math.min(1,(r-s)/(o*xit)),k=r>a?Math.max(0,1-(r-a)/(1-a)):1;
return{
x:(g-y/2)*e,y:(b-v/2)*n,w:y*e,h:v*n,alpha:x*w*k
}
}const gL=26,QY=[[.3,.62],[.62,.4],[.44,.74],[.76,.56],[.2,.44]],hBe=3.4,wit=.34,_it=.19,gBr=1.7,hye=1.1,bBr=.34,yBr=.035,vBr=t=>t*t*(3-2*t);
function qZt(t){
const e=Math.max(0,t)/hBe,n=QY[Math.floor(e)%QY.length],r=QY[(Math.floor(e)+1)%QY.length],s=e%1,a=1-wit,o=s<a?0:vBr((s-a)/wit);
return[n[0]+(r[0]-n[0])*o,n[1]+(r[1]-n[1])*o]
}function xBr(t,e,n){
const[r,s]=qZt(n),a=Math.hypot(t-r,(e-s)*gBr),o=.82+.18*Math.sin(n*2.4),l=Math.exp(-(a*a)/(_it*_it))*o,c=Math.max(0,n)%hBe;
if(c>=hye)return Math.min(1,l);
const d=c/hye*bBr,u=Math.exp(-Math.pow((a-d)/yBr,
  2))*(1-c/hye);
return Math.min(1,Math.max(l,
  u))
}function wBr(t,e,n){
const r=[[0,
  0],[0,
  14.5],[3.8,
  11.1],[6.4,
  16.6],[9,
  15.4],[6.4,
  10],[11.2,
  9.4]];
t.save(),t.translate(e,n),t.beginPath(),t.moveTo(r[0][0],r[0][1]);
for(const[s,
  a]of r.slice(1))t.lineTo(s,a);
t.closePath(),t.shadowColor="rgba(0, 0, 0, 0.55)",t.shadowBlur=5,t.shadowOffsetY=1.5,t.fillStyle="#fff",t.fill(),t.restore()
}const _Br=.2,kBr="96, 104, 130",SBr=.62;
function TBr(t,e,n,r,s={
painted:0,reading:!1
}){
t.clearRect(0,0,e,n);
const a=Math.ceil(e/gL),o=Math.ceil(n/gL);
for(let h=0;
h<=o;
h++)for(let f=0;
f<=a;
f++){
const m=f/a,g=h/o,b=Math.min(1,
  Math.max(0,
    xBr(m,
      g,
      r))),y=s.painted>0?fBr(m,
  g,
  s.painted):null;
let v,x,w=0;
if(y){
  const[k,
    S,
    T]=y.colour,
  A=1+y.wet*.9;
  v=Math.min(1,
    .42+b*.4+y.wet*.35),
  x=`rgba(${Math.min(255,k*A)|0}, ${Math.min(255,S*A)|0}, ${Math.min(255,T*A)|0}, ${v})`,
  w=.05+y.wet*.09
}else v=_Br+b*SBr,x=b>.02?`rgba(${143+b*90|0}, ${182+b*55|0}, ${240+b*15|0}, ${v})`:`rgba(${kBr}, ${v})`;
t.beginPath(),t.arc(f*gL,
  h*gL,
  gL*(.055+b*.105+w),
  0,
  Math.PI*2),t.fillStyle=x,t.fill()
}s.reading&&ABr(t,e,n,r);
const[l,c]=qZt(r),d=l*e,u=c*n;
return wBr(t,d,u),{
x:d,y:u
}
}function ABr(t,e,n,r){
const s=mBr(r,e,n);
if(s&&s.alpha>.01){
const a=Math.min(s.w,
  s.h)*.28;
t.save(),t.strokeStyle=`rgba(102, 153, 221, ${s.alpha*.95})`,t.lineWidth=1.5;
for(const[o,
    l,
    c,
    d]of[[s.x,
      s.y,
      1,
      1],
    [s.x+s.w,
      s.y,
      -1,
      1],
    [s.x,
      s.y+s.h,
      1,
      -1],
    [s.x+s.w,
      s.y+s.h,
      -1,
      -1]])t.beginPath(),t.moveTo(o+c*a,
  l),t.lineTo(o,
  l),t.lineTo(o,
  l+d*a),t.stroke();
t.restore()
}
}const Jhe=[{
id:"reading",seconds:24
},{
id:"building",seconds:72
},{
id:"checking",seconds:88
}],sre=Jhe.reduce((t,e)=>t+e.seconds,0),ZZt=.9;
function CBr(t){
let e=0;
for(const n of Jhe){
if(n.id===t)break;
e+=n.seconds
}return e/sre*ZZt
}function KZt(t,e,n=sre){
const r=n>0?sre/n:1;
t=t*r;
let s=t,a="reading";
for(const l of Jhe){
if(a=l.id,
  s<l.seconds)break;
s-=l.seconds
}const o=Math.min(t/sre,1)*ZZt;
return{
phase:e??a,fraction:e?Math.max(o,
  CBr(e)):o
}
}function EBr(t,e){
const n=Jhe.find(s=>s.id===t.reported?.phase)?.id??null,r=Math.max(0,(e-t.startedAt)/1e3);
return KZt(r,n,t.estimateS).fraction
}function jBr(t){
switch(t){
case"reading":return _._({
    id:"+cTzmx"
  });
case"building":return _._({
    id:"SBeLNz"
  });
case"checking":return _._({
    id:"FdS4qe"
  })
}
}function IBr(t){
switch(t){
case"reading":return[_._({
      id:"yAFyMm"
    }),
  _._({
      id:"MAvAhJ"
    }),
  _._({
      id:"YUDY8h"
    })];
case"building":return[_._({
      id:"4jseFg"
    })];
case"checking":return[_._({
      id:"Sac/U8"
    })]
}
}const MBr="_overlay_t7ctx_13",NBr="_field_t7ctx_28",PBr="_note_t7ctx_37",RBr="_slate_t7ctx_53",FBr="_phase_t7ctx_63",OBr="_fading_t7ctx_77",LBr="_gauge_t7ctx_85",DBr="_stopMark_t7ctx_103",BBr="_ring_t7ctx_118",HBr="_ringTrack_t7ctx_145",$Br="_ringFill_t7ctx_153",O0={
overlay:MBr,field:NBr,note:PBr,slate:RBr,phase:FBr,fading:OBr,gauge:LBr,stopMark:DBr,ring:BBr,ringTrack:HBr,ringFill:$Br
},VBr=1e3/30,UBr=1e3,XZt=190,zBr=XZt*2,WBr=["reading","building","checking"];
function kit(t){
const[e,n]=p.useState(t),[r,s]=p.useState(!1),a=p.useRef(null);
return p.useEffect(()=>{
  if(t===e){
    s(!1),
    a.current=null;
    return
  }a.current===null&&(a.current=Date.now()),
  s(!0);
  const o=Date.now()-a.current,
  l=setTimeout(()=>{
      a.current=null,
      n(t),
      s(!1)
    },
    Math.max(0,
      Math.min(XZt,
        zBr-o)));
  return()=>clearTimeout(l)
},[t,
  e]),{
shown:e,fading:r
}
}function GBr({
startedAt:t,reported:e,onStopClick:n,estimateS:r,project:s
}){
const[a,o]=p.useState(()=>Date.now()),l=t===null?0:Math.max(0,(a-t)/1e3),c=p.useRef(null),d=p.useRef(null),u=WBr.find(v=>v===e?.phase)??null,h=KZt(l,u,r),f=IBr(h.phase),m=e?.latest||f[Math.floor(l/hBe)%f.length],g=kit(jBr(h.phase)),b=kit(m),y=p.useRef({
  painted:0,
  reading:!1
});
return y.current={
painted:hBr(l),reading:h.phase==="reading",project:s
},p.useEffect(()=>{
  if(t===null)return;
  const v=()=>o(Date.now());
  v();
  const x=setInterval(v,
    UBr);
  return()=>clearInterval(x)
},[t]),p.useEffect(()=>{
  const v=c.current;
  if(t===null||!v)return;
  const x=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1;
  let w=0,
  k=0,
  S=0,
  T=0;
  const A=C=>{
    if(w=requestAnimationFrame(A),
      T||(T=C),
      C-k<VBr)return;
    k=C;
    const E=v.getBoundingClientRect();
    if(!E.width||!E.height)return;
    const j=Math.min(window.devicePixelRatio||1,
      2),
    I=Math.round(E.width),
    N=Math.round(E.height);
    (v.width!==I*j||v.height!==N*j)&&(v.width=I*j,
      v.height=N*j);
    const P=v.getContext("2d");
    if(!P)return;
    P.setTransform(j,
      0,
      0,
      j,
      0,
      0);
    const F=x?1.6:(C-T)/1e3,
    B=y.current;
    S+=(B.painted-S)*(x?1:.06);
    const H=TBr(P,
      I

/*==============================================================================
 * 31. PLAN VIEW MATH — ELr/ILr/NLr/PLr/MLr/FLr/LLr + hit tests xLr/Qhe/Xat/wLr/_Lr/kLr
 * source file: tmp_b/plan_view_math_pretty.js
 ==============================================================================*/
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

/*==============================================================================
 * 32. PLAN PAINTER SDr — background/grid/items/paths/groups/marquee + palette aDr
 * source file: tmp_b/plan_draw_SDt_pretty.js
 ==============================================================================*/
function SDr(t,
  e){
  const{
    view:n,
    palette:r,
    selection:s
  }=e;
  t.lineJoin="round",
  t.fillStyle=r.background,
  t.fillRect(0,
    0,
    n.widthPx,
    n.heightPx),
  TDr(t,
    n,
    r);
  const a=new Map,
  o=new Set(["humanoid",
      "simple_figure",
      "target",
      "spotlight",
      "camera"]),
  l=e.items.filter(h=>!o.has(h.kind)),
  c=e.items.filter(h=>o.has(h.kind)),
  d=()=>{
    for(const h of e.paths)s.has(h.id)&&(t.globalAlpha=h.id===e.dimPathOf?vDr:1,
      CDr(t,
        n,
        h,
        r));
    t.globalAlpha=1,
    e.stroke&&e.stroke.length>1&&($Zt(t,
        n,
        e.stroke),
      t.strokeStyle=r.accent,
      t.lineWidth=xDr,
      t.lineCap="round",
      t.stroke(),
      t.lineCap="butt")
  },
  u=h=>{
    const f=h.parentId!==void 0&&s.has(h.parentId),
    m=s.has(h.id);
    if(jDr(t,
        n,
        h,
        m||f,
        r,
        !f),
      !f)return;
    const g=Rie(h.footprint,
      n),
    b=a.get(h.parentId);
    a.set(h.parentId,
      b?{
        minX:Math.min(b.minX,
          g.minX),
        minY:Math.min(b.minY,
          g.minY),
        maxX:Math.max(b.maxX,
          g.maxX),
        maxY:Math.max(b.maxY,
          g.maxY),
        label:b.label
      }:{
        ...g,
        label:h.groupLabel
      })
  };
  for(const h of e.items)h.pool&&IDr(t,
    n,
    h,
    s.has(h.id),
    r);
  l.forEach(u),
  d(),
  c.forEach(u),
  t.strokeStyle=r.accent,
  t.lineWidth=1,
  t.setLineDash([4,
      3]);
  for(const h of a.values())t.strokeRect(h.minX-pL,
    h.minY-pL,
    h.maxX-h.minX+2*pL,
    h.maxY-h.minY+2*pL);
  t.setLineDash([]);
  for(const h of a.values())h.label&&q5(t,
    h.label,
    (h.minX+h.maxX)/2,
    h.maxY+pL+14,
    {
      sizePx:Cje,
      color:r.textDim,
      align:"center",
      fontFamily:r.fontFamily
    });
  if(e.focus&&ADr(t,
      n,
      e.items,
      e.focus,
      r),
    s.size===1&&!e.stroke){
    const[h]=s,
    f=e.items.find(m=>m.id===h);
    f&&PDr(t,
      n,
      f,
      r)
  }if(e.marquee){
    const h=e.marquee,
    f=Math.min(h.x0,
      h.x1),
    m=Math.min(h.y0,
      h.y1),
    g=Math.abs(h.x1-h.x0),
    b=Math.abs(h.y1-h.y0);
    t.fillStyle=r.accentSoft,
    t.fillRect(f,
      m,
      g,
      b),
    t.strokeStyle=r.accent,
    t.lineWidth=1,
    t.setLineDash([4,
        3]),
    t.strokeRect(f,
      m,
      g,
      b),
    t.setLineDash([])
  }
}function q5(t,
  e,
  n,
  r,
  s){
  t.font=`${s.sizePx}px ${s.fontFamily}`,
  t.fillStyle=s.color,
  t.textAlign=s.align,
  t.fillText(e,
    n,
    r)
}function TDr(t,
  e,
  n){
  const r=S1(e,
    {
      x:0,
      y:0
    }),
  s=S1(e,
    {
      x:e.widthPx,
      y:e.heightPx
    }),
  a=(l,
    c)=>{
    t.beginPath();
    for(let d=Math.ceil(r.x/l)*l;
      d<=s.x;
      d+=l){
      if(c&&d%oye===0)continue;
      const u=Math.round(iu(e,
          {
            x:d,
            z:0
          }).x)+.5;
      t.moveTo(u,
        0),
      t.lineTo(u,
        e.heightPx)
    }for(let d=Math.ceil(r.z/l)*l;
      d<=s.z;
      d+=l){
      if(c&&d%oye===0)continue;
      const u=Math.round(iu(e,
          {
            x:0,
            z:d
          }).y)+.5;
      t.moveTo(0,
        u),
      t.lineTo(e.widthPx,
        u)
    }t.stroke()
  };
  t.lineWidth=1;
  const o=_Dr(e.pxPerM);
  o>0&&(t.globalAlpha=o,
    t.strokeStyle=n.grid,
    a(HZt,
      !0),
    t.globalAlpha=1),
  t.strokeStyle=n.gridMajor,
  a(oye,
    !1)
}function $Zt(t,
  e,
  n){
  t.beginPath(),
  n.forEach((r,
      s)=>{
      const a=iu(e,
        r);
      s===0?t.moveTo(a.x,
        a.y):t.lineTo(a.x,
        a.y)
    })
}function ADr(t,
  e,
  n,
  r,
  s){
  const a=n.find(d=>d.id===r.fromId),
  o=n.find(d=>d.id===r.subjectId);
  if(!a||!o)return;
  const l=iu(e,
    a.footprint),
  c=iu(e,
    o.footprint);
  t.strokeStyle=s.accent,
  t.lineWidth=1,
  t.setLineDash([2,
      4]),
  t.beginPath(),
  t.moveTo(l.x,
    l.y),
  t.lineTo(c.x,
    c.y),
  t.stroke(),
  t.setLineDash([]),
  t.lineWidth=1.4,
  t.beginPath(),
  t.arc(c.x,
    c.y,
    wDr,
    0,
    Math.PI*2);
  for(const[d,
      u]of[[0,
        -1],
      [0,
        1],
      [-1,
        0],
      [1,
        0]])t.moveTo(c.x+d*iit,
    c.y+u*iit),
  t.lineTo(c.x+d*lye,
    c.y+u*lye);
  t.stroke(),
  q5(t,
    r.label,
    c.x+lye+2,
    c.y-10,
    {
      sizePx:l$,
      color:s.accent,
      align:"left",
      fontFamily:s.fontFamily
    })
}function CDr(t,
  e,
  n,
  r){
  $Zt(t,
    e,
    n.points),
  t.strokeStyle=kDr(n.kind,
    r),
  t.lineWidth=1.4,
  t.setLineDash([2,
      4]),
  t.stroke(),
  t.setLineDash([]),
  t.fillStyle=r.accent,
  t.strokeStyle=r.panel,
  t.lineWidth=1;
  for(const s of n.keys){
    const a=iu(e,
      s);
    t.beginPath(),
    t.moveTo(a.x,
      a.y-KY*Math.SQRT2),
    t.lineTo(a.x+KY*Math.SQRT2,
      a.y),
    t.lineTo(a.x,
      a.y+KY*Math.SQRT2),
    t.lineTo(a.x-KY*Math.SQRT2,
      a.y),
    t.closePath(),
    t.fill(),
    t.stroke()
  }
}function cBe(t,
  e,
  n,
  r){
  const s=Math.cos(r),
  a=Math.sin(r);
  t.beginPath();
  for(const[o,
      l]of n)t.lineTo(e.x+o*s+l*a,
    e.y-o*a+l*s);
  t.closePath()
}function dBe(t,
  e,
  n,
  r,
  s){
  cBe(t,
    e,
    [[-n,
        -r],
      [n,
        -r],
      [n,
        r],
      [-n,
        r]],
    s)
}function EDr(t,
  e,
  n,
  r,
  s,
  a){
  const o=n.footprint;
  if(o.shape!=="rect")return;
  const l=Math.max(1,
    uDr/(o.halfWidthM*e.pxPerM)),
  c=o.halfWidthM*e.pxPerM*l,
  d=o.halfDepthM*e.pxPerM*l,
  u=aqt(a.human);
  dBe(t,
    r,
    c,
    d,
    o.yawRad),
  t.fillStyle=a.human,
  t.fill(),
  s&&(t.strokeStyle=a.accent,
    t.lineWidth=1.6,
    t.stroke());
  const h=Math.max(1.5,
    d*.2);
  cBe(t,
    r,
    [[-c,
        -d],
      [c,
        -d],
      [c,
        -d+h],
      [-c,
        -d+h]],
    o.yawRad),
  t.fillStyle=u,
  t.fill();
  const f=Math.min(Math.abs(o.halfWidthM)/(PP[0]/2),
    Math.abs(o.halfDepthM)/(PP[2]/2)),
  m=Nie*f*e.pxPerM*l;
  t.beginPath(),
  t.arc(r.x,
    r.y,
    m,
    0,
    Math.PI*2),
  t.fillStyle=a.human,
  t.fill(),
  t.strokeStyle=a.background,
  t.lineWidth=1,
  t.stroke();
  const g=FU(o.yawRad+(n.headYawRad??0)),
  b=Math.atan2(g.z,
    g.x);
  t.beginPath(),
  t.arc(r.x,
    r.y,
    m*.72,
    b-Pie,
    b+Pie),
  t.strokeStyle=u,
  t.lineWidth=Math.max(1.5,
    m*.3),
  t.stroke();
  const y=FU(o.yawRad);
  t.strokeStyle=a.human,
  t.lineWidth=1.6,
  t.lineCap="round",
  t.beginPath(),
  t.moveTo(r.x+y.x*(d+3),
    r.y+y.z*(d+3)),
  t.lineTo(r.x+y.x*(d+10),
    r.y+y.z*(d+10)),
  t.stroke(),
  t.lineCap="butt"
}function VZt(t,
  e,
  n,
  r){
  t.fillStyle=r,
  t.strokeStyle=r,
  t.lineWidth=n>8?2.2:1.6,
  t.lineCap="round",
  t.beginPath(),
  t.arc(e.x,
    e.y-n*.72,
    n*.3,
    0,
    Math.PI*2),
  t.fill(),
  t.beginPath(),
  t.moveTo(e.x,
    e.y-n*.4),
  t.lineTo(e.x,
    e.y+n*.3),
  t.moveTo(e.x-n*.6,
    e.y-n*.12),
  t.lineTo(e.x+n*.6,
    e.y-n*.12),
  t.moveTo(e.x-n*.45,
    e.y+n),
  t.lineTo(e.x,
    e.y+n*.3),
  t.lineTo(e.x+n*.45,
    e.y+n),
  t.stroke()
}const oit=.35;
function jDr(t,
  e,
  n,
  r,
  s,
  a=!0){
  const o=n.footprint,
  l=iu(e,
    o);
  if(n.kind==="camera"){
    n.wedgeHalfRad!==void 0&&NDr(t,
      e,
      o,
      n.wedgeHalfRad,
      r,
      s),
    t.fillStyle=s.panel,
    t.strokeStyle=r?s.accent:s.camera,
    t.lineWidth=r?1.6:1.2;
    for(const

/*==============================================================================
 * 33. Onboarding highlight tracker CWr (viewport screen bounds for onboarding)
 * source file: tmp_b/onboard_CWr.js
 ==============================================================================*/
CWr(t){const{a:e,renderer:n,camera:r,meshById:s}=t,a=new Ge,o=()=>{const l=e.onboardHighlightId.peek(),c=l?s.get(l):void 0;if(!c){e.onboardHighlightScreenPos.peek()!==null&&e.onboardHighlightScreenPos.set(null);return}c.getWorldPosition(a).project(r);const d=a.z>=-1&&a.z<=1,u=n.domElement.getBoundingClientRect(),h=d?{x:Math.round(u.left+(a.x*.5+.5)*u.width),y:Math.round(u.top+(-a.y*.5+.5)*u.height)}:null,f=e.onboardHighlightScreenPos.peek();(f===null!=(h===null)||f&&h&&(f.x!==h.x||f.y!==h.y))&&e.onboardHighlightScreenPos.set(h)};return t.disposers.push(()=>e.onboardHighlightScreenPos.set(null)),{tick:o}}const EWr=540,jWr=.5,Lje=.05,IWr=12,MWr=new hr(6449804),NWr=new hr(.1,.11,.16),PWr=.15,cKt=4,RWr=150,FWr=.05;function dKt(t,e){let n=0,r=0,s=-1/0;return(a,o,l)=>((a!==n||o!==r)&&(n=a,r=o,s=e()),!l||e()-s>=t)}function OWr(t,e){const n=Math.min(jWr,EWr/e);return[Math.max(1,Math.round(t*n)),Math.max(1,Math.round(e*n))]}const LWr=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,uKt=`
  uniform sampler2D tDepth;
  uniform mat4 invProjection;
  vec3 viewPosition(vec2 uv) {
    float depth = texture2D(tDepth, uv).r;
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = invProjection * clip;
    return view.xyz / view.w;
  }
`,DWr=`
  varying vec2 vUv;
  ${uKt}
  uniform vec2 texel;
  uniform vec2 radiusUv;
  const float RADIUS = ${Lje.toFixed(3)};
  const int SAMPLES = ${IWr};
  const float GOLDEN_ANGLE = 2.39996323;
  // Below this, a sample is the surface's own curve, not something occluding it.
  const float SELF_BIAS = 0.2;

  float interleavedNoise(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }

  void main() {
    if (texture2D(tDepth, vUv).r >= 1.0) {
      gl_FragColor = vec4(1.0);
      return;
    }
    vec3 p = viewPosition(vUv);
    // Of the two neighbours on each axis, the nearer: the far one may be across an edge.
    vec3 left = p - viewPosition(vUv - vec2(texel.x, 0.0));
    vec3 right = viewPosition(vUv + vec2(texel.x, 0.0)) - p;
    vec3 down = p - viewPosition(vUv - vec2(0.0, texel.y));
    vec3 up = viewPosition(vUv + vec2(0.0, texel.y)) - p;
    vec3 normal = normalize(cross(
      dot(left, left) < dot(right, right) ? left : right,
      dot(down, down) < dot(up, up) ? down : up
    ));
    float reach = RADIUS * -p.z;
    float reachSquared = reach * reach;
    float angle = interleavedNoise(gl_FragCoord.xy) * 6.2831853;
    float occlusion = 0.0;
    for (int i = 0; i < SAMPLES; i++) {
      float along = (float(i) + 0.5) / float(SAMPLES);
      float a = float(i) * GOLDEN_ANGLE + angle;
      vec3 toSample = viewPosition(vUv + vec2(cos(a), sin(a)) * sqrt(along) * radiusUv) - p;
      float distanceSquared = dot(toSample, toSample);
      float falloff = clamp(1.0 - distanceSquared / reachSquared, 0.0, 1.0);
      occlusion += falloff * max(0.0, dot(toSample, normal) / sqrt(distanceSquared + 1e-6) - SELF_BIAS);
    }
    gl_FragColor = vec4(vec3(clamp(1.0 - 2.0 * occlusion / float(SAMPLES), 0.0, 1.0)), 1.0);
  }
`,BWr=`
  varying vec2 vUv;
  ${uKt}
  uniform sampler2D tOcclusion;
  uniform vec2 direction;
  void main() {
    float depth0 = -viewPosition(vUv).z;
    float sum = texture2D(tOcclusion, vUv).r;
    float weight = 1.0;
    for (int i = 1; i <= 3; i++) {
      float gaussian = exp(-float(i * i) / 5.0);
      for (int side = -1; side <= 1; side += 2) {
        vec2 uv = vUv + direction * float(i * side);
        // Never across a depth edge, or occlusion bleeds onto what is behind.
        float w = gaussian * max(0.0, 1.0 - abs(-viewPosition(uv).z - depth0) / (depth0 

/*==============================================================================
 * 34. Focus/centerOn camera animation YUr + floor clamp Uit + manual flight recorder JUr
 * source file: tmp_b/mesh_sync.js
 ==============================================================================*/
ttom)return null;const T=new On((k.clientX-S.left)/S.width*2-1,-((k.clientY-S.top)/S.height)*2+1);a.setFromCamera(T,r);const A=l.map(j=>s.get(j)).filter(j=>j!==void 0),C=a.intersectObjects(A,!0)[0];if(!C)return null;let E=C.object;for(;E&&E.userData.objectId===void 0;)E=E.parent;return E?.userData.objectId??null},m=k=>{k!==c&&(c&&l.includes(c)&&u(c,Bit,Hit),c=k,k&&u(k,OUr,LUr))},g=k=>{if(!k.dataTransfer?.types.includes($v))return;k.preventDefault();const S=f(k);k.dataTransfer.dropEffect=S?"copy":"none",m(S)},b=k=>{const S=k.relatedTarget;S&&n.domElement.contains(S)||m(null)},y=k=>{if(!k.dataTransfer?.types.includes($v))return;k.preventDefault();const S=f(k),T=MDe(k.dataTransfer.getData($v));m(null),S&&T&&e.appendActionToObject(S,T)},v=k=>{e.draggingSegment.peek()&&m(f(k))},x=k=>{if(!e.draggingSegment.peek())return;const S=f(k);m(null),S&&e.dropSegmentOnObject(S)},w=n.domElement;w.addEventListener("dragover",g),w.addEventListener("dragleave",b),w.addEventListener("drop",y),document.addEventListener("pointermove",v),document.addEventListener("pointerup",x,!0),t.disposers.push(()=>{w.removeEventListener("dragover",g),w.removeEventListener("dragleave",b),w.removeEventListener("drop",y),document.removeEventListener("pointermove",v),document.removeEventListener("pointerup",x,!0),h()})}const HUr=.45;function $it(t){const e=t.clone();return e.transparent=!0,e.opacity=HUr,e.depthWrite=!1,e}function $Ur(t){t.traverse(e=>{const n=e;n.isMesh&&(n.material=Array.isArray(n.material)?n.material.map($it):$it(n.material))})}function VUr(t){const{a:e,renderer:n,scene:r,camera:s}=t,a=new Bv,o=new r2(new Ge(0,1,0),0),l=new Xqt,c=new Map;let d=null,u=0;const h=w=>{const k=n.domElement.getBoundingClientRect(),S=new On((w.clientX-k.left)/k.width*2-1,-((w.clientY-k.top)/k.height)*2+1);a.setFromCamera(S,s);const T=new Ge;return a.ray.intersectPlane(o,T)?T:null},f=()=>{d&&(d.visible=!1),d=null},m=(w,k)=>{const S=LU(w),T=c.get(S);if(T){d&&d!==T&&(d.visible=!1),T.position.set(k.x,UWt(BNr(w)),k.z),T.visible=!0,d=T;return}const A=u;l.ensure(w).then(C=>{!C||t.isDisposed()||A!==u||c.has(S)||($Ur(C),C.visible=!1,r.add(C),c.set(S,C))})},g=w=>w.dataTransfer?.types.includes(V6)?e.draggingComponent.peek():null,b=w=>{const k=g(w);if(!k)return;w.preventDefault();const S=h(w);w.dataTransfer.dropEffect=S?"copy":"none",S?m(k,S):f()},y=w=>{const k=w.relatedTarget;k&&n.domElement.contains(k)||(u++,f())},v=w=>{const k=g(w);if(u++,f(),!k)return;w.preventDefault();const S=h(w);S&&(e.addComponent(k,[S.x,S.z]),e.showComponentList())},x=n.domElement;x.addEventListener("dragover",b),x.addEventListener("dragleave",y),x.addEventListener("drop",v),t.disposers.push(()=>{x.removeEventListener("dragover",b),x.removeEventListener("dragleave",y),x.removeEventListener("drop",v),c.clear(),l.dispose()})}const UUr=.3,zUr=1.5,WUr=1.2,GUr=2,qUr=5,Vit=.5,ZUr=3,KUr=.1;function nKt(t,e,n){const r=e*m_.DEG2RAD,s=2*Math.atan(Math.tan(r/2)*n),a=Math.min(r,s),o=t*zUr/Math.sin(a/2);return Math.max(o,WUr)}function XUr(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}function YUr(t,e){const{camera:n,meshById:r}=t;let s=null,a=null;const o=()=>{s&&!s.immediate&&(s=null),a=null};e.addEventListener("start",o),t.disposers.push(()=>e.removeEventListener("start",o));const l=(h,f)=>{const m=new go().setFromObject(h),g=m.isEmpty()?new Of(h.getWorldPosition(new Ge),Vit):m.getBoundingSphere(new Of),b=Math.max(g.radius,Vit),y=n.position.clone().sub(e.target);y.lengthSq()<1e-6&&y.set(6,5,8),y.normalize();const v=nKt(b,n.fov,n.aspect),x=g.center.clone(),w=g.center.clone().addScaledVector(y,v);if(f){a=null;const k=e.enableDamping;e.enableDamping=!1,e.update(),e.target.copy(x),n.position.copy(w),n.lookAt(e.target),e.update(),e.enableDamping=k;return}a={fromTarget:e.target.clone(),fromPosition:n.position.clone(),toTarget:x,toPosition:w,elapsedS:0}};return{focusObject:(h,f=!1)=>{a=null;const m=r.get(h);m?l(m,f):s={id:h,elapsedS:0,immediate:f}},centerOn:h=>{s=null;const f=h.clone().sub(e.target).clampLength(0,n.position.distanceTo(e.target)*ZUr),m=n.position.clone().add(f);m.y=Math.max(m.y,Math.min(n.position.y,KUr)),a={fromTarget:e.target.clone(),fromPosition:n.position.clone(),toTarget:e.target.clone().add(f),toPosition:m,elapsedS:0}},tick:h=>{if(s){const m=r.get(s.id);if(m){const{immediate:g}=s;s=null,l(m,g)}else(s.elapsedS+=h)>(s.immediate?qUr:GUr)&&(s=null)}if(!a)return;a.elapsedS+=h;const f=XUr(Math.min(a.elapsedS/UUr,1));e.target.lerpVectors(a.fromTarget,a.toTarget,f),n.position.lerpVectors(a.fromPosition,a.toPosition,f),n.lookAt(e.target),f===1&&(a=null)}}}const rKt=.1;function QUr(t,e){if(e<=0)return Math.PI;const n=(rKt-t)/e;return Math.acos(Math.max(-1,Math.min(1,n)))}function Uit(t,e){const n=rKt-t.position.y;n>0&&(t.position.y+=n,e.enabled&&(e.target.y+=n)),e.maxPolarAngle=QUr(e.target.y,t.position.distanceTo(e.target))}const pye=1/qA;function JUr(t,e){const{a:n,camera:r}=t;let s=[],a=0,o=!1;function l(){o=!1;const d=s;s=[],n.finishManualFlight(d)}function c(d){const u=n.manualFlight.peek();if(!(u!==null&&n.mode.peek()==="camera"&&e.isTakeRolling())){o?l():u!==null&&n.mode.peek()!=="camera"&&n.finishManualFlight([]);return}o||(o=!0,s=[],a=pye),a+=d,!(a<pye)&&(a-=pye,s.push({p:[r.position.x,r.position.y,r.position.z],q:[r.quaternion.x,r.quaternion.y,r.quaternion.z,r.quaternion.w],fovDeg:BU(n)}))}return{tick:c,settle:()=>{o&&l()}}}const qj=new va(0,0,0,"YXZ"),Zj=new Ge,ezr={type:"change"},tzr={type:"lock"},nzr={type:"unlock"},zit=.002,Wit=Math.PI/2;class rzr extends xDe{constructor(e,n=null){super(e,n),this.isLocked=!1,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.pointerSpeed=1,this._onMouseMove=szr.bind(this),this._onPointerlockChange=azr.bind(this),this._onPointerlockError=izr.bind(this),this.domElement!==null&&this.connect(this.domElement)}connect(e){super.connect(e),this.domElement.ownerDocument.addEventListener("mousemove",this._onMouseMove),this.domElement.ownerDocument.addEventListener("pointerlockchange",this._onPointerlockChange),this.domElement.ownerDocument.addEventListener("pointerlockerror",this._onPointerlockError)}disconnect(){this.domElement.ownerDocument.removeEventListener("mousemove",this._onMouseMove),this.domElement.ownerDocument.removeEventListener("pointerlockchange",this._onPointerlockChange),this.domElement.ownerDocument.removeEventListener("pointerlockerror",this._onPointerlockError)}dispose(){this.disconnect()}getDirection(e){return e.set(0,0,-1).applyQuaternion(this.object.quaternion)}moveForward(e){if(this.enabled===!1)return;const n=this.object;Zj.setFromMatrixColumn(n.matrix,0),Zj.crossVectors(n.up,Zj),n.position.addScaledVector(Zj,e)}moveRight(e){if(this.enabled===!1)return;const n=this.object;Zj.setFromMatrixColumn(n.matrix,0),n.position.addScaledVector(Zj,e)}lock(e=!1){this.domElement.requestPointerLock({unadjustedMovement:e})}unlock(){this.domElement.ownerDocument.exitPointerLock()}}function szr(t){if(this.enabled===!1||this.isLocked===!1)return;const e=this.object;qj.setFromQuaternion(e.quaternion),qj.y-=t.movementX*zit*this.pointerSpeed,qj.x-=t.movementY*zit*this.pointerSpeed,qj.x=Math.max(Wit-this.maxPolarAngle,Math.min(Wit-this.minPolarAngle,qj.x)),e.quaternion.setFromEuler(qj),this.dispatchEvent(ezr)}function azr(){this.domElement.ownerDocument.pointerLockElement===this.domElement?(this.dispatchEvent(tzr),this.isLocked=!0):(this.dispatchEvent(nzr),this.isLocked=!1)}function izr(){console.error("THREE.PointerLockControls: Unable to use Pointer Lock API")}const N3=new Bv,bp=new Ge,bk=new Ge,Sl=new qn,Git={X:new Ge(1,0,0),Y:new Ge(0,1,0),Z:new Ge(0,0,1)},fye={type:"change"},qit={type:"mouseDown",mode:null},Zit={type:"mouseUp",mode:null},Kit={type:"objectChange"};let ozr=class extends xDe{constr

/*==============================================================================
 * 35. Drag-and-drop: actions onto objects (BUr) + component ghost on floor (VUr)
 * source file: tmp_b/mesh_sync.js
 ==============================================================================*/
ttom)return null;const T=new On((k.clientX-S.left)/S.width*2-1,-((k.clientY-S.top)/S.height)*2+1);a.setFromCamera(T,r);const A=l.map(j=>s.get(j)).filter(j=>j!==void 0),C=a.intersectObjects(A,!0)[0];if(!C)return null;let E=C.object;for(;E&&E.userData.objectId===void 0;)E=E.parent;return E?.userData.objectId??null},m=k=>{k!==c&&(c&&l.includes(c)&&u(c,Bit,Hit),c=k,k&&u(k,OUr,LUr))},g=k=>{if(!k.dataTransfer?.types.includes($v))return;k.preventDefault();const S=f(k);k.dataTransfer.dropEffect=S?"copy":"none",m(S)},b=k=>{const S=k.relatedTarget;S&&n.domElement.contains(S)||m(null)},y=k=>{if(!k.dataTransfer?.types.includes($v))return;k.preventDefault();const S=f(k),T=MDe(k.dataTransfer.getData($v));m(null),S&&T&&e.appendActionToObject(S,T)},v=k=>{e.draggingSegment.peek()&&m(f(k))},x=k=>{if(!e.draggingSegment.peek())return;const S=f(k);m(null),S&&e.dropSegmentOnObject(S)},w=n.domElement;w.addEventListener("dragover",g),w.addEventListener("dragleave",b),w.addEventListener("drop",y),document.addEventListener("pointermove",v),document.addEventListener("pointerup",x,!0),t.disposers.push(()=>{w.removeEventListener("dragover",g),w.removeEventListener("dragleave",b),w.removeEventListener("drop",y),document.removeEventListener("pointermove",v),document.removeEventListener("pointerup",x,!0),h()})}const HUr=.45;function $it(t){const e=t.clone();return e.transparent=!0,e.opacity=HUr,e.depthWrite=!1,e}function $Ur(t){t.traverse(e=>{const n=e;n.isMesh&&(n.material=Array.isArray(n.material)?n.material.map($it):$it(n.material))})}function VUr(t){const{a:e,renderer:n,scene:r,camera:s}=t,a=new Bv,o=new r2(new Ge(0,1,0),0),l=new Xqt,c=new Map;let d=null,u=0;const h=w=>{const k=n.domElement.getBoundingClientRect(),S=new On((w.clientX-k.left)/k.width*2-1,-((w.clientY-k.top)/k.height)*2+1);a.setFromCamera(S,s);const T=new Ge;return a.ray.intersectPlane(o,T)?T:null},f=()=>{d&&(d.visible=!1),d=null},m=(w,k)=>{const S=LU(w),T=c.get(S);if(T){d&&d!==T&&(d.visible=!1),T.position.set(k.x,UWt(BNr(w)),k.z),T.visible=!0,d=T;return}const A=u;l.ensure(w).then(C=>{!C||t.isDisposed()||A!==u||c.has(S)||($Ur(C),C.visible=!1,r.add(C),c.set(S,C))})},g=w=>w.dataTransfer?.types.includes(V6)?e.draggingComponent.peek():null,b=w=>{const k=g(w);if(!k)return;w.preventDefault();const S=h(w);w.dataTransfer.dropEffect=S?"copy":"none",S?m(k,S):f()},y=w=>{const k=w.relatedTarget;k&&n.domElement.contains(k)||(u++,f())},v=w=>{const k=g(w);if(u++,f(),!k)return;w.preventDefault();const S=h(w);S&&(e.addComponent(k,[S.x,S.z]),e.showComponentList())},x=n.domElement;x.addEventListener("dragover",b),x.addEventListener("dragleave",y),x.addEventListener("drop",v),t.disposers.push(()=>{x.removeEventListener("dragover",b),x.removeEventListener("dragleave",y),x.removeEventListener("drop",v),c.clear(),l.dispose()})}const UUr=.3,zUr=1.5,WUr=1.2,GUr=2,qUr=5,Vit=.5,ZUr=3,KUr=.1;function nKt(t,e,n){const r=e*m_.DEG2RAD,s=2*Math.atan(Math.tan(r/2)*n),a=Math.min(r,s),o=t*zUr/Math.sin(a/2);return Math.max(o,WUr)}function XUr(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}function YUr(t,e){const{camera:n,meshById:r}=t;let s=null,a=null;const o=()=>{s&&!s.immediate&&(s=null),a=null};e.addEventListener("start",o),t.disposers.push(()=>e.removeEventListener("start",o));const l=(h,f)=>{const m=new go().setFromObject(h),g=m.isEmpty()?new Of(h.getWorldPosition(new Ge),Vit):m.getBoundingSphere(new Of),b=Math.max(g.radius,Vit),y=n.position.clone().sub(e.target);y.lengthSq()<1e-6&&y.set(6,5,8),y.normalize();const v=nKt(b,n.fov,n.aspect),x=g.center.clone(),w=g.center.clone().addScaledVector(y,v);if(f){a=null;const k=e.enableDamping;e.enableDamping=!1,e.update(),e.target.copy(x),n.position.copy(w),n.lookAt(e.target),e.update(),e.enableDamping=k;return}a={fromTarget:e.target.clone(),fromPosition:n.position.clone(),toTarget:x,toPosition:w,elapsedS:0}};return{focusObject:(h,f=!1)=>{a=null;const m=r.get(h);m?l(m,f):s={id:h,elapsedS:0,immediate:f}},centerOn:h=>{s=null;const f=h.clone().sub(e.target).clampLength(0,n.position.distanceTo(e.target)*ZUr),m=n.position.clone().add(f);m.y=Math.max(m.y,Math.min(n.position.y,KUr)),a={fromTarget:e.target.clone(),fromPosition:n.position.clone(),toTarget:e.target.clone().add(f),toPosition:m,elapsedS:0}},tick:h=>{if(s){const m=r.get(s.id);if(m){const{immediate:g}=s;s=null,l(m,g)}else(s.elapsedS+=h)>(s.immediate?qUr:GUr)&&(s=null)}if(!a)return;a.elapsedS+=h;const f=XUr(Math.min(a.elapsedS/UUr,1));e.target.lerpVectors(a.fromTarget,a.toTarget,f),n.position.lerpVectors(a.fromPosition,a.toPosition,f),n.lookAt(e.target),f===1&&(a=null)}}}const rKt=.1;function QUr(t,e){if(e<=0)return Math.PI;const n=(rKt-t)/e;return Math.acos(Math.max(-1,Math.min(1,n)))}function Uit(t,e){const n=rKt-t.position.y;n>0&&(t.position.y+=n,e.enabled&&(e.target.y+=n)),e.maxPolarAngle=QUr(e.target.y,t.position.distanceTo(e.target))}const pye=1/qA;function JUr(t,e){const{a:n,camera:r}=t;let s=[],a=0,o=!1;function l(){o=!1;const d=s;s=[],n.finishManualFlight(d)}function c(d){const u=n.manualFlight.peek();if(!(u!==null&&n.mode.peek()==="camera"&&e.isTakeRolling())){o?l():u!==null&&n.mode.peek()!=="camera"&&n.finishManualFlight([]);return}o||(o=!0,s=[],a=pye),a+=d,!(a<pye)&&(a-=pye,s.push({p:[r.position.x,r.position.y,r.position.z],q:[r.quaternion.x,r.quaternion.y,r.quaternion.z,r.quaternion.w],fovDeg:BU(n)}))}return{tick:c,settle:()=>{o&&l()}}}const qj=new va(0,0,0,"YXZ"),Zj=new Ge,ezr={type:"change"},tzr={type:"lock"},nzr={type:"unlock"},zit=.002,Wit=Math.PI/2;class rzr extends xDe{constructor(e,n=null){super(e,n),this.isLocked=!1,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.pointerSpeed=1,this._onMouseMove=szr.bind(this),this._onPointerlockChange=azr.bind(this),this._onPointerlockError=izr.bind(this),this.domElement!==null&&this.connect(this.domElement)}connect(e){super.connect(e),this.domElement.ownerDocument.addEventListener("mousemove",this._onMouseMove),this.domElement.ownerDocument.addEventListener("pointerlockchange",this._onPointerlockChange),this.domElement.ownerDocument.addEventListener("pointerlockerror",this._onPointerlockError)}disconnect(){this.domElement.ownerDocument.removeEventListener("mousemove",this._onMouseMove),this.domElement.ownerDocument.removeEventListener("pointerlockchange",this._onPointerlockChange),this.domElement.ownerDocument.removeEventListener("pointerlockerror",this._onPointerlockError)}dispose(){this.disconnect()}getDirection(e){return e.set(0,0,-1).applyQuaternion(this.object.quaternion)}moveForward(e){if(this.enabled===!1)return;const n=this.object;Zj.setFromMatrixColumn(n.matrix,0),Zj.crossVectors(n.up,Zj),n.position.addScaledVector(Zj,e)}moveRight(e){if(this.enabled===!1)return;const n=this.object;Zj.setFromMatrixColumn(n.matrix,0),n.position.addScaledVector(Zj,e)}lock(e=!1){this.domElement.requestPointerLock({unadjustedMovement:e})}unlock(){this.domElement.ownerDocument.exitPointerLock()}}function szr(t){if(this.enabled===!1||this.isLocked===!1)return;const e=this.object;qj.setFromQuaternion(e.quaternion),qj.y-=t.movementX*zit*this.pointerSpeed,qj.x-=t.movementY*zit*this.pointerSpeed,qj.x=Math.max(Wit-this.maxPolarAngle,Math.min(Wit-this.minPolarAngle,qj.x)),e.quaternion.setFromEuler(qj),this.dispatchEvent(ezr)}function azr(){this.domElement.ownerDocument.pointerLockElement===this.domElement?(this.dispatchEvent(tzr),this.isLocked=!0):(this.dispatchEvent(nzr),this.isLocked=!1)}function izr(){console.error("THREE.PointerLockControls: Unable to use Pointer Lock API")}const N3=new Bv,bp=new Ge,bk=new Ge,Sl=new qn,Git={X:new Ge(1,0,0),Y:new Ge(0,1,0),Z:new Ge(0,0,1)},fye={type:"change"},qit={type:"mouseDown",mode:null},Zit={type:"mouseUp",mode:null},Kit={type:"objectChange"};let ozr=class extends xDe{constr

/*==============================================================================
 * 36. HELP TEXT (agent manual, describes every UX control)
 * source file: tmp_b/help_text_full.txt
 ==============================================================================*/
Stage 3D editor - how things work:

WHERE: the Stage is either the full Stage page or a 3D scene node open on the canvas. In a scene node the controls are fewer: select a camera to see its shot, drag the picture (or the chevrons) to tune its aim, Add camera, Height, Lens, Draw direction to draw a move for whatever is selected, Rehearse, Record, and Open in 3D Stage. The navigation, shortcuts and panels below are the Stage page's.

NAVIGATION (viewport): two control modes, chosen in Preferences (the gear on the left rail). Default: drag the ground to move, right-drag or a two-finger scroll orbits, wheel or pinch zooms, and WASD moves at any time, with Q/E down/up and Shift for faster. Unreal/Unity: left-drag orbits, middle-drag pans, wheel zooms, and holding the RIGHT mouse button flies with WASD and Q/E.

SELECT & TRANSFORM: click an object to select its whole group, click again for the part, Alt-click for the part straight away, Cmd/Ctrl-click for multi-select. Move, rotate and scale are on the toolbar beside the selection, and on keys Z, X, C (W, E, R in Unreal/Unity mode), Delete removes the selection. Esc finishes a path or cancels the current action.

ADD OBJECTS: use the hierarchy panel "Add Component" (Human, Figure, Camera, primitives, props), or drag a tile from the Components/Actions palette. A camera does NOT come with an aim target: it grows one only while a move on its track has subject_id null (a pan_sweep never does, since it aims down its own lens; a path only with aim 'subject'), and that marker goes away again when the move names a subject, so do not count on target_id being there. A camera's lens and shake are settings, but its MOVEMENT is built from camera actions on its own track in the show. A TARGET can also be added on its own: an invisible mark that films as nothing but moves like any other object, so a camera can follow it smoothly while the thing it stands for moves roughly (put the path on the target and follow the target).

SHOWS (animation): each scene has a show. Add a track per character, then add items to the track. To move a character THROUGH space, drag Path onto them and click the floor to drop waypoints (Esc finishes), then set the gait (walk/jog/sprint). For an in-place pose animation, scrub the playhead into a segment, pose the object, and add a keyframe (two or more keyframes make it move). Drag Play onto a character to control it like a game (WASD) and record its moves live. Clips and Play are HUMANOID-ONLY (they animate a character skeleton). A FIGURE (simple_figure) is a stand-in person with no rig: it walks a path like a character but with no gait, and its head turns with head_rotation, on the object or per keyframe. A walking person (character or figure) faces its travel, or a subject when its path has aim 'subject': the head turns toward it first, and the body turns only for what the neck cannot reach. A PATH moves anything that can move: a character walks it (with a gait), a figure walks it, a cube, sphere, cylinder, prop, group or target travels it, and a CAMERA flies it: one op (add_path) that resolves against whatever track it lands on, taking the points, the speed and the aim (facing its travel, a subject, or locked). The points are 3D: their y is the height the traveller flies at, and a camera path is where you author a rising or falling shot. A camera path the user drew a height for in a scene node reports heights_m: its height in metres at evenly spaced moments from start to end, which the camera flies INSTEAD of the points' y. Re-creating the path drops heights_m, so only do that when a new path is what was asked. scene_state reports a path's points back, so to shoot or move ALONGSIDE something that already travels one, read its points and build from those instead of guessing a route between its endpoints. To animate one of those in place instead (a boulder rocking, a lid opening), use a transform item plus two or more keyframes. A CAMERA takes a track too: drop camera actions on it (a preset move, Still, Path, Follow, Transform) and they chain, each picking up where the last left the camera, so a shot is a sequence rather than one setting.

PREVIEW: op play rehearses the show through the camera from the playhead (op seek) to the show's end, and op stop ends it. op record films every camera (or the camera_ids you name) over the show's RANGE, the stretch marked on the timeline (scene_state's show.range), or the whole show when there is none, and stops by itself at its end. The playhead never changes what is filmed. To film part of the show, op range with from_s and to_s, or give record from_s and to_s, which sets the range first; op range with clear true goes back to the whole show. Set a range only when the user asks for part of the show, and tell them: it stays on their timeline. A show with nothing on its timeline has no end, so that take keeps rolling until op stop. play reports from_s, where it started; record reports from_s and to_s, what it films (to_s null when the take has no end), and saved_to, where the takes go ('canvas': beside the scene's node when the take finishes; 'review': the user reviews and saves them on the Stage page). op stop ends a take early. Recording is what turns a blocked-out scene into video, so offer it once the show reads right, and rehearse first rather than recording something nobody has watched.

LIGHT: each scene has one light, and every object casts a shadow from it. The Light button in the Stage bar sets it; stage_camera op set_light sets it for you, and scene_state reports it. It is a direction and a height, and the height is also the time of day: 32 and up is full day, around 9 golden hour with long shadows, around -4 dusk, and down to -30 a moonlit night. As it gets dark, cubes, spheres and cylinders named as a window, lamp, lantern, candle or moon glow, so name them that way; props and spotlights do not. Overhead (90) throws almost no shadow. Below the horizon a spotlight is what lights a subject. Match the light to where the light falls in the start image and to the hour it shows; only go dark when the shot is meant to be at night.

SPOTLIGHTS: a spotlight is a lamp you place like any object (stage_object create kind "spotlight"), as many as the scene needs, on top of the scene light: a practical lamp, a streetlight, a key light on a face, a pool of light on a stage. Its beam: shape "round" (a Fresnel's pool) or "square" (barn doors), intensity and diffusion 0 to 100 (diffusion softens the edge and its shadows), beam_deg the full width of the beam (6 to 110, default 32). Aim it with aim_object_id (an object's middle) or aim_point; created with a position and no aim it points straight down, and created with neither it hangs over a spawn slot aimed at it. The reply and scene_state say where its beam lands_at on the floor, so check that it hits what you meant. Update any of these with stage_object update. It animates like any object: a Grow or Shrink opens and closes the beam (its scale IS the beam width), Rotate sweeps it, Revolve circles it round a subject. The lamp itself is never filmed, only its light. In daylight a spotlight is subtle; it reads best in a dim scene.

HELP: the viewport "?" button and the "?" key open a controls cheatsheet.

BATCH: every stage tool also takes "ops": an array of op objects run in order in one call. Prefer one batched call over many small ones. Give a create op a "ref" alias (e.g. "hero") and reference it by that name in the object_id/track_id/etc. of later ops; refs resolve for the rest of the turn, across tools, so you can create objects and animate them in a single turn without knowing their real ids.