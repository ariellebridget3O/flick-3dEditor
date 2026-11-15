// Renderer / scene construction / floor / fog / shadows signatures

// #### SIG 'PlaneGeometry(80000' — floor plane 80000 — 0 hits ####
// #### SIG 'FogExp2' — fog exp2 — 4 hits ####
/* ==== hit[0] @4458185 ==== */
inger-tip"],h=d.joints["thumb-tip"],f=u.position.distanceTo(h.position),m=.02,g=.005;d.inputState.pinching&&f>m+g?(d.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!d.inputState.pinching&&f<=m-g&&(d.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(a=n.getPose(e.gripSpace,r),a!==null&&(c.matrix.fromArray(a.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,a.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(a.linearVelocity)):c.hasLinearVelocity=!1,a.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(a.angularVelocity)):c.hasAngularVelocity=!1));l!==null&&(s=n.getPose(e.targetRaySpace,r),s===null&&a!==null&&(s=a),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,this.dispatchEvent(Nvr)))}return l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),d!==null&&(d.visible=o!==null),this}_getHandJoint(e,n){if(e.joints[n.jointName]===void 0){const r=new Ci;r.matrixAutoUpdate=!1,r.visible=!1,e.joints[n.jointName]=r,e.add(r)}return e.joints[n.jointName]}}class cq{constructor(e,n=25e-5){this.isFogExp2=!0,this.name="",this.color=new hr(e),this.density=n}clone(){return new cq(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}let Kh=class extends di{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new va,this.environmentIntensity=1,this.environmentRotation=new va,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,n){return super.copy(e,n),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const n=super.toJSON(e);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(n.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(n.object.backgroundIntensity=this.backgroundIntensity),n.object.backgroundRotation=this.backgroundRotatio

/* ==== hit[1] @4458314 ==== */
inching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!d.inputState.pinching&&f<=m-g&&(d.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(a=n.getPose(e.gripSpace,r),a!==null&&(c.matrix.fromArray(a.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,a.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(a.linearVelocity)):c.hasLinearVelocity=!1,a.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(a.angularVelocity)):c.hasAngularVelocity=!1));l!==null&&(s=n.getPose(e.targetRaySpace,r),s===null&&a!==null&&(s=a),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,this.dispatchEvent(Nvr)))}return l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),d!==null&&(d.visible=o!==null),this}_getHandJoint(e,n){if(e.joints[n.jointName]===void 0){const r=new Ci;r.matrixAutoUpdate=!1,r.visible=!1,e.joints[n.jointName]=r,e.add(r)}return e.joints[n.jointName]}}class cq{constructor(e,n=25e-5){this.isFogExp2=!0,this.name="",this.color=new hr(e),this.density=n}clone(){return new cq(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}let Kh=class extends di{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new va,this.environmentIntensity=1,this.environmentRotation=new va,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,n){return super.copy(e,n),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const n=super.toJSON(e);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(n.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(n.object.backgroundIntensity=this.backgroundIntensity),n.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(n.object.environmentIntensity=this.environmentIntensity),n.object.environmentRotation

/* ==== hit[2] @4777821 ==== */
issionMap:Oe,thicknessMap:Je,gradientMap:$e,opaque:E.transparent===!1&&E.blending===QN&&E.alphaToCoverage===!1,alphaMap:Ue,alphaTest:et,alphaHash:He,combine:E.combine,mapUv:q&&b(E.map.channel),aoMapUv:ae&&b(E.aoMap.channel),lightMapUv:ie&&b(E.lightMap.channel),bumpMapUv:ge&&b(E.bumpMap.channel),normalMapUv:pe&&b(E.normalMap.channel),displacementMapUv:ce&&b(E.displacementMap.channel),emissiveMapUv:be&&b(E.emissiveMap.channel),metalnessMapUv:fe&&b(E.metalnessMap.channel),roughnessMapUv:we&&b(E.roughnessMap.channel),anisotropyMapUv:ye&&b(E.anisotropyMap.channel),clearcoatMapUv:je&&b(E.clearcoatMap.channel),clearcoatNormalMapUv:ve&&b(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ke&&b(E.clearcoatRoughnessMap.channel),iridescenceMapUv:Ae&&b(E.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&b(E.iridescenceThicknessMap.channel),sheenColorMapUv:me&&b(E.sheenColorMap.channel),sheenRoughnessMapUv:Te&&b(E.sheenRoughnessMap.channel),specularMapUv:Le&&b(E.specularMap.channel),specularColorMapUv:Fe&&b(E.specularColorMap.channel),specularIntensityMapUv:tt&&b(E.specularIntensityMap.channel),transmissionMapUv:Oe&&b(E.transmissionMap.channel),thicknessMapUv:Je&&b(E.thicknessMap.channel),alphaMapUv:Ue&&b(E.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(pe||Ee),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:P.isPoints===!0&&!!B.attributes.uv&&(q||Ue),fog:!!F,useFog:E.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:E.flatShading===!0&&E.wireframe===!1,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:te,skinning:P.isSkinnedMesh===!0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:W,morphTextureStride:U,numDirLights:j.directional.length,numPointLights:j.point.length,numSpotLights:j.spot.length,numSpotLightMaps:j.spotLightMap.length,numRectAreaLights:j.rectArea.length,numHemiLights:j.hemi.length,numDirLightShadows:j.directionalShadowMap.length,numPointLightShadows:j.pointShadowMap.length,numSpotLightShadows:j.spotShadowMap.length,numSpotLightShadowsWithMaps:j.numSpotLightShadowsWithMaps,numLightProbes:j.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:t.shadowMap.enabled&&I.length>0,shadowMapType:t.shadowMap.type,toneMapping:ze,decodeVideoTexture:q&&E.map.isVideoTexture===!0&&Wa.getTransfer(E.map.colorSpace)===Ui,decodeVideoTextureEmissive:be&&E.emissiveMap.isVideoTexture===!0&&Wa.getTransfer(E.emissiveMap.colorSpace)===Ui,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Fc,flipSided:E.side===$p,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:qe&&E.extensions.clipCullDistance===!0&&r.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(qe&&E.extensions.multiDra

/* ==== hit[3] @4853849 ==== */
TargetTextures(k,pe.colorTexture,pe.depthStencilTexture),e.setRenderTarget(k))}let ge=I[re];ge===void 0&&(ge=new Xo,ge.layers.enable(re),ge.viewport=new qa,I[re]=ge),ge.matrix.fromArray(ae.transform.matrix),ge.matrix.decompose(ge.position,ge.quaternion,ge.scale),ge.projectionMatrix.fromArray(ae.projectionMatrix),ge.projectionMatrixInverse.copy(ge.projectionMatrix).invert(),ge.viewport.set(ie.x,ie.y,ie.width,ie.height),re===0&&(N.matrix.copy(ge.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),ne===!0&&N.cameras.push(ge)}const Q=s.enabledFeatures;if(Q&&Q.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&b){h=r.getBinding();const re=h.getDepthInformation(te[0]);re&&re.isValid&&re.texture&&y.init(re,s.renderState)}if(Q&&Q.includes("camera-access")&&b){e.state.unbindTexture(),h=r.getBinding();for(let re=0;re<te.length;re++){const ae=te[re].camera;if(ae){let ie=v[ae];ie||(ie=new EWt,v[ae]=ie);const ge=h.getCameraImage(ae);ie.sourceTexture=ge}}}}for(let te=0;te<S.length;te++){const ne=T[te],Q=S[te];ne!==null&&Q!==void 0&&Q.update(ne,X,d||o)}V&&V(se,X),X.detectedPlanes&&r.dispatchEvent({type:"planesdetected",data:X}),g=null}const Z=new LWt;Z.setAnimationLoop(G),this.setAnimationLoop=function(se){V=se},this.dispose=function(){}}}const I3=new va,b8r=new $r;function y8r(t,e){function n(y,v){y.matrixAutoUpdate===!0&&y.updateMatrix(),v.value.copy(y.matrix)}function r(y,v){v.color.getRGB(y.fogColor.value,xWt(t)),v.isFog?(y.fogNear.value=v.near,y.fogFar.value=v.far):v.isFogExp2&&(y.fogDensity.value=v.density)}function s(y,v,x,w,k){v.isMeshBasicMaterial||v.isMeshLambertMaterial?a(y,v):v.isMeshToonMaterial?(a(y,v),h(y,v)):v.isMeshPhongMaterial?(a(y,v),u(y,v)):v.isMeshStandardMaterial?(a(y,v),f(y,v),v.isMeshPhysicalMaterial&&m(y,v,k)):v.isMeshMatcapMaterial?(a(y,v),g(y,v)):v.isMeshDepthMaterial?a(y,v):v.isMeshDistanceMaterial?(a(y,v),b(y,v)):v.isMeshNormalMaterial?a(y,v):v.isLineBasicMaterial?(o(y,v),v.isLineDashedMaterial&&l(y,v)):v.isPointsMaterial?c(y,v,x,w):v.isSpriteMaterial?d(y,v):v.isShadowMaterial?(y.color.value.copy(v.color),y.opacity.value=v.opacity):v.isShaderMaterial&&(v.uniformsNeedUpdate=!1)}function a(y,v){y.opacity.value=v.opacity,v.color&&y.diffuse.value.copy(v.color),v.emissive&&y.emissive.value.copy(v.emissive).multiplyScalar(v.emissiveIntensity),v.map&&(y.map.value=v.map,n(v.map,y.mapTransform)),v.alphaMap&&(y.alphaMap.value=v.alphaMap,n(v.alphaMap,y.alphaMapTransform)),v.bumpMap&&(y.bumpMap.value=v.bumpMap,n(v.bumpMap,y.bumpMapTransform),y.bumpScale.value=v.bumpScale,v.side===$p&&(y.bumpScale.value*=-1)),v.normalMap&&(y.normalMap.value=v.normalMap,n(v.normalMap,y.normalMapTransform),y.normalScale.value.copy(v.normalScale),v.side===$p&&y.normalScale.value.negate()),v.displacementMap&&(y.displacementMap.value=v.displacementMap,n(v.displacementMap,y.displacementMapTransform),y.displacementScale.value=v.displacementScale,y.displacementBias.value=v.displacementBias),v.emissiveMap&&(y.emissiveMap.value=v.emissiveMap,n(v.emissiveM

// #### SIG 'antialias:!0' — renderer antialias — 4 hits ####
/* ==== hit[0] @5118291 ==== */
ass y5r{renderer=null;scene=new Kh;camera=new Xo(Lrt,1,.1,100);set=null;subject=null;mixer=null;loadPromise=null;rafId=null;loopToken=0;disposed=!1;ensureLoaded=()=>this.loadPromise?this.loadPromise:(this.buildSet(),this.loadPromise=new Bhe().loadAsync(Hhe).then(e=>{const n=e.scene;if(this.disposed||!this.set){Rrt(n),Kd(n);return}$he(n),n.rotation.y=Math.PI;const s=new go().setFromObject(n).getSize(new Ge);s.y>0&&n.scale.multiplyScalar(jP/s.y);const a=new go().setFromObject(n),o=a.getCenter(new Ge);n.position.set(-o.x,-a.min.y,-o.z),this.subject=n,this.set.add(n);const l=e.animations.find(c=>c.name===f5r);l&&(this.mixer=new Ihe(n),this.mixer.clipAction(l).play(),this.mixer.update(l.duration*.4))}),this.loadPromise);buildSet=()=>{if(this.renderer||this.disposed)return;this.renderer=new t0({antialias:!0,alpha:!0}),this.renderer.setSize(Frt,Frt),this.scene.add(new VC(16777215,4478310,2.2));const e=new ax(16777215,2);e.position.set(2,5,3),this.scene.add(e);const n=new Ci,r=new Vt(new Mi(60,60),new Io({color:9079434,roughness:.95}));r.rotation.x=-Math.PI/2,n.add(r);const s=new Io({color:11053224,roughness:.8});for(const[a,o,l]of[[-2.2,-1.4,3],[2.4,-.6,2.2],[-1.6,2.2,1.6]]){const c=new Vt(new mi(.5,l,.5),s);c.position.set(a,l/2,o),n.add(c)}this.set=n,this.scene.add(n)};applyPose=(e,n)=>{const r=KCe({kind:e,start:h5r,target:p5r,direction:"cw",baseFovDeg:Lrt,t:n});this.camera.position.set(...r.position),this.camera.lookAt(...r.lookAt),this.camera.fov!==r.fovDeg&&(this.camera.fov=r.fovDeg,this.camera.updateProjectionMatrix())};renderTo=e=>{if(!this.renderer)return;this.renderer.render(this.scene,this.camera);const n=e.getContext("2d");n&&(n.clearRect(0,0,e.width,e.height),n.drawImage(this.renderer.domElement,0,0,e.width,e.height))};drawPose=(e,n)=>{this.ensureLoaded().then(()=>{this.disposed||this.rafId===null&&(this.applyPose(n,m5r[n]),this.renderTo(e))})};startLoop=(e,n)=>{this.stopLoop();const r=++this.loopToken;this.ensureLoaded().then(()=>{if(this.disposed||r!==this.loopToken)return;let s=performance.now(),a=0;const o=l=>{if(this.disposed||r!==this.loopToken)return;const c=(l-s)/1e3;a+=c,s=l,this.mixer?.update(c),this.applyPose(n,b5r(a%Ort/Ort)),this.renderTo(e),this.rafId=requestAnimationFrame(o)};this.rafId=requestAnimationFrame(o)})};stopLoop=()=>{this.loopToken++,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)};dispose=()=>{this.disposed=!0,this.stopLoop(),this.mixer?.stopAllAction(),this.subject&&Rrt(this.subject),this.set&&Kd(this.set),this.renderer?.forceContextLoss(),this.renderer?.dispose()}}const v5r="_reveal_1a7mk_9",x5r="_revealCollapsed_1a7mk_24",w5r="_actionsWindow_1a7mk_31",_5r="_tile_1a7mk_38",k5r="_tileAdd_1a7mk_47",S5r="_sectionLabel_1a7mk_97",T5r="_tabCaption_1a7mk_107",A5r="_switchNotice_1a7mk_115",ff={reveal:v5r,revealCollapsed:x5r,actionsWindow:w5r,tile:_5r,tileAdd:k5r,sectionLabel:S5r,tabCaption:T5r,switchNotice:A5r},IP=128,C5r={move:()=>_._({id:"ZHYI6T"}),animate:()=>_._({id:"WSviW0"}),camera:()=>_._({id:"xmwcS8"})},E5r=[{action:"rotate",icon:"rotate",label:i.jsx(M,{id:"BulyBf"}),color:"var(--stage-action-object)"},{action:"revolve",icon:"orbit",label:i.jsx(M,{id:"NP8KUz"}),color:"var(--stage-action-object)"},{action:"scale-up",icon:"expand",label:i.jsx(M,{id:"5DdjZ9"}),color:"var(--stage-action-obj

/* ==== hit[1] @5128816 ==== */
seRef(null);return p.useEffect(()=>{c.current&&n(c.current,t)},[t,n]),i.jsxs("div",{className:Ze(Zr.tile,ff.tile),draggable:!0,title:_._({id:"w2DmPr"}),onDragStart:d=>a(d,{kind:"object",action:t}),onDragEnd:l,onPointerEnter:()=>{c.current&&r(c.current,t)},onPointerLeave:()=>{s(),c.current&&n(c.current,t)},children:[o,i.jsx("canvas",{ref:c,className:Zr.tileThumb,width:IP,height:IP}),i.jsx("span",{className:Zr.tileName,children:e})]})}function Drt(t){t.traverse(e=>{e instanceof RR&&e.skeleton.dispose()})}const Brt=128,L5r=.35;class D5r{renderer=null;scene=new Kh;camera=new Xo(35,1,.1,20);model=null;mixer=null;actions=new Map;currentClip=null;loadPromise=null;rafId=null;loopToken=0;pendingPoses=[];disposed=!1;ensureLoaded=()=>{if(this.loadPromise)return this.loadPromise;this.renderer=new t0({antialias:!0,alpha:!0}),this.renderer.setSize(Brt,Brt),this.camera.position.set(.7,1.3,3.1),this.camera.lookAt(0,.85,0),this.scene.add(new VC(16777215,4478310,2.4));const e=new ax(16777215,2);return e.position.set(2,4,3),this.scene.add(e),this.loadPromise=new Bhe().loadAsync(Hhe).then(n=>{const r=n.scene;if(this.disposed){Drt(r),Kd(r);return}$he(r),r.rotation.y=Math.PI;const a=new go().setFromObject(r).getSize(new Ge);a.y>0&&r.scale.multiplyScalar(jP/a.y);const o=new go().setFromObject(r),l=o.getCenter(new Ge);r.position.set(-l.x,-o.min.y,-l.z),this.model=r,this.mixer=new Ihe(r);for(const c of n.animations)this.actions.set(c.name,this.mixer.clipAction(c));this.scene.add(r)}),this.loadPromise};setClip=(e,n)=>{if(!this.mixer)return;const r=this.actions.get(e);r&&(this.currentClip!==e&&(this.currentClip&&this.actions.get(this.currentClip)?.stop(),r.play(),this.currentClip=e),r.time=n%r.getClip().duration,this.mixer.update(0))};renderTo=e=>{if(!this.renderer)return;this.renderer.render(this.scene,this.camera);const n=e.getContext("2d");n&&(n.clearRect(0,0,e.width,e.height),n.drawImage(this.renderer.domElement,0,0,e.width,e.height))};drawPose=(e,n)=>{this.ensureLoaded().then(()=>{if(!this.disposed){if(this.rafId!==null){this.pendingPoses.push({canvas:e,clip:n});return}this.setClip(n,IDe(n)*L5r),this.renderTo(e)}})};startLoop=(e,n)=>{this.stopLoop();const r=++this.loopToken;this.ensureLoaded().then(()=>{if(this.disposed||r!==this.loopToken)return;this.setClip(n,0);let s=performance.now();const a=o=>{this.mixer?.update((o-s)/1e3),s=o,this.renderTo(e),this.rafId=requestAnimationFrame(a)};this.rafId=requestAnimationFrame(a)})};stopLoop=()=>{this.loopToken++,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null);const e=this.pendingPoses;this.pendingPoses=[];for(const{canvas:n,clip:r}of e)this.drawPose(n,r)};dispose=()=>{this.disposed=!0,this.stopLoop(),this.model&&(Drt(this.model),Kd(this.model)),this.renderer?.forceContextLoss(),this.renderer?.dispose()}}const Hrt=128,h2e=2.4,B5r={rotate:.14,revolve:.12,"scale-up":.5,"scale-down":.5};function $rt(t){return 1-Math.abs(2*t-1)}class H5r{renderer=null;scene=new Kh;camera=new Xo(35,1,.1,20);cube=null;rafId=null;loopToken=0;disposed=!1;ensureRenderer=()=>{if(this.renderer||this.disposed)return;this.renderer=new t0({antialias:!0,alpha:!0}),this.renderer.setSize(Hrt,Hrt),this.camera.position.set(2.2,1.9,3),this.camera.lookAt(0,0,0),this.scene.add(new VC(16777215,4478310,2.4));const e=new ax(16777215,2);e.po

/* ==== hit[2] @5131123 ==== */
const a=o=>{this.mixer?.update((o-s)/1e3),s=o,this.renderTo(e),this.rafId=requestAnimationFrame(a)};this.rafId=requestAnimationFrame(a)})};stopLoop=()=>{this.loopToken++,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null);const e=this.pendingPoses;this.pendingPoses=[];for(const{canvas:n,clip:r}of e)this.drawPose(n,r)};dispose=()=>{this.disposed=!0,this.stopLoop(),this.model&&(Drt(this.model),Kd(this.model)),this.renderer?.forceContextLoss(),this.renderer?.dispose()}}const Hrt=128,h2e=2.4,B5r={rotate:.14,revolve:.12,"scale-up":.5,"scale-down":.5};function $rt(t){return 1-Math.abs(2*t-1)}class H5r{renderer=null;scene=new Kh;camera=new Xo(35,1,.1,20);cube=null;rafId=null;loopToken=0;disposed=!1;ensureRenderer=()=>{if(this.renderer||this.disposed)return;this.renderer=new t0({antialias:!0,alpha:!0}),this.renderer.setSize(Hrt,Hrt),this.camera.position.set(2.2,1.9,3),this.camera.lookAt(0,0,0),this.scene.add(new VC(16777215,4478310,2.4));const e=new ax(16777215,2);e.position.set(2,4,3),this.scene.add(e);const n=new Vt(new mi(1,1,1),new Io({color:13404228,roughness:.55,metalness:.05}));this.cube=n,this.scene.add(n)};applyPose=(e,n)=>{const r=this.cube;if(!r)return;const s=n%h2e/h2e;switch(r.position.set(0,0,0),r.rotation.set(.25,.4,0),r.scale.setScalar(1),e){case"rotate":r.rotation.set(.25,s*Math.PI*2,0);break;case"revolve":{const a=s*Math.PI*2,o=.7;r.position.set(Math.sin(a)*o,0,Math.cos(a)*o);break}case"scale-up":r.scale.setScalar(1+$rt(s)*.7);break;case"scale-down":r.scale.setScalar(1-$rt(s)*.5);break}};renderTo=e=>{if(!this.renderer)return;this.renderer.render(this.scene,this.camera);const n=e.getContext("2d");n&&(n.clearRect(0,0,e.width,e.height),n.drawImage(this.renderer.domElement,0,0,e.width,e.height))};drawPose=(e,n)=>{this.ensureRenderer(),!this.disposed&&this.rafId===null&&(this.applyPose(n,B5r[n]*h2e),this.renderTo(e))};startLoop=(e,n)=>{if(this.stopLoop(),this.ensureRenderer(),this.disposed)return;const r=++this.loopToken;let s=performance.now(),a=0;const o=l=>{this.disposed||r!==this.loopToken||(a+=(l-s)/1e3,s=l,this.applyPose(n,a),this.renderTo(e),this.rafId=requestAnimationFrame(o))};this.rafId=requestAnimationFrame(o)};stopLoop=()=>{this.loopToken++,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)};dispose=()=>{this.disposed=!0,this.stopLoop(),this.cube&&Kd(this.cube),this.renderer?.forceContextLoss(),this.renderer?.dispose()}}function $5r(t){const e=new D5r,n=new H5r,r=new y5r;return{ActionsPanel:Mt(()=>{const o=!he(t.collapsed)&&he(t.panelsVisible),l=he(t.selectedId),c=he(()=>{const d=t.selectedId.get(),u=d?t.objects[d].get():void 0;return u?.kind==="simple_figure"?u.name||_._({id:"YUAoyO"}):null});return i.jsx(M5r,{show:o,onClose:t.toggleCollapsed,widthPx:he(t.widthPx),onWidthChange:t.setWidthPx,drawTile:e.drawPose,startTilePreview:e.startLoop,stopTilePreview:e.stopLoop,drawObjectTile:n.drawPose,startObjectPreview:n.startLoop,stopObjectPreview:n.stopLoop,drawCameraTile:r.drawPose,startCameraPreview:r.startLoop,stopCameraPreview:r.stopLoop,onActionDragStart:t.setDraggingAction,onActionDragEnd:t.clearDraggingAction,canAddAction:d=>l!==null&&t.canDropActionOnObject(l,d),onAddActionClick:d=>{l!==null&&t.appendActionToObject(l,d)},onPathDragStart:t.onPathDrag,onPlayDragStart:t.onPlayDrag,requeste

/* ==== hit[3] @5372836 ==== */
},onPointerLeave:()=>{s(),l.current&&n(l.current,e)},children:[i.jsx("canvas",{ref:l,className:Zr.tileThumb,width:sat,height:sat}),i.jsx("span",{className:Zr.tileName,children:t.label})]})}const aat=128,g9r=1.7,Qqt=-.6,b9r=.9,gje=[2.2,1.9,3],y9r=6,v9r=Math.atan2(gje[0],gje[2])-Qqt,x9r=-.2;function w9r(t,e){if(t.kind==="camera")e.rotation.y+=Math.PI;else if(t.kind==="target")e.rotation.y=v9r;else if(t.kind==="spotlight"){const n=e.children[0];if(!n)return;n.position.set(0,0,0),n.rotation.set(0,Math.PI,0),n.rotateX(x9r)}}class _9r{renderer=null;scene=new Kh;camera=new Xo(35,1,.1,20);subjects=new Xqt;wrappers=new Map;rafId=null;loopToken=0;disposed=!1;loadQueue=[];loadTasks=new Map;queued=new Set;inFlightLoads=0;ensureRenderer=()=>{if(this.renderer||this.disposed)return;this.renderer=new t0({antialias:!0,alpha:!0}),this.renderer.setSize(aat,aat),this.camera.position.set(...gje),this.camera.lookAt(0,0,0),this.scene.add(new VC(16777215,4478310,2.4));const e=new ax(16777215,2);e.position.set(2,4,3),this.scene.add(e)};wrapper=(e,n)=>{const r=LU(n),s=this.wrappers.get(r);return s||(this.queued.has(r)||(this.queued.add(r),this.loadTasks.set(r,()=>{this.subjects.ensure(n).then(a=>{if(this.inFlightLoads--,this.pumpLoads(),!a||this.disposed||this.wrappers.has(r))return;w9r(n,a);const o=HNr(a,g9r);o.visible=!1,this.scene.add(o),this.wrappers.set(r,o),this.drawPose(e,n)})}),this.loadQueue.push(r),this.pumpLoads()),null)};pumpLoads=()=>{for(;this.inFlightLoads<y9r&&this.loadQueue.length>0;){const e=this.loadQueue.shift(),n=this.loadTasks.get(e);this.loadTasks.delete(e),n&&(this.inFlightLoads++,n())}};renderTo=(e,n)=>{if(!this.renderer)return;for(const s of this.wrappers.values())s.visible=s===n;this.renderer.render(this.scene,this.camera);const r=e.getContext("2d");r&&(r.clearRect(0,0,e.width,e.height),r.drawImage(this.renderer.domElement,0,0,e.width,e.height))};drawPose=(e,n)=>{if(this.ensureRenderer(),this.disposed)return;const r=this.wrapper(e,n);r&&(r.rotation.y=Qqt,this.renderTo(e,r))};startLoop=(e,n)=>{if(this.stopLoop(),this.ensureRenderer(),this.disposed)return;const r=++this.loopToken;let s=performance.now();const a=o=>{if(this.disposed||r!==this.loopToken)return;const l=this.wrappers.get(LU(n));l&&(l.rotation.y+=(o-s)/1e3*b9r,this.renderTo(e,l)),s=o,this.rafId=requestAnimationFrame(a)};this.rafId=requestAnimationFrame(a)};stopLoop=()=>{this.loopToken++,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)};dispose=()=>{this.disposed=!0,this.stopLoop(),this.loadQueue.length=0,this.loadTasks.clear(),this.wrappers.clear(),this.subjects.dispose(),this.renderer?.forceContextLoss(),this.renderer?.dispose()}}function k9r(t){const e=new _9r;return{ComponentPanel:Mt(({onActivate:r})=>{const s=p.useMemo(()=>{const a=o=>()=>{r();const l=o();l&&t.focusObject(l),t.showComponentList()};return{cube:a(t.addCube),sphere:a(t.addSphere),cylinder:a(t.addCylinder),humanoid:a(t.addHumanoid),simpleFigure:a(t.addSimpleFigure),camera:a(t.addCameraMarker),target:a(t.addTarget),spotlight:a(t.addSpotlight),prop:o=>a(()=>t.addProp(o))()}},[r]);return i.jsx(p9r,{widthPx:he(t.widthPx),drawTile:e.drawPose,startTilePreview:e.startLoop,stopTilePreview:e.stopLoop,onComponentDragStart:t.setDraggingComponent,onComponentDragEnd:t.clearDraggingComponent,onAddCubeClick

// #### SIG 'outputColorSpace' — colorspace — 3 hits ####
/* ==== hit[0] @4349072 ==== */
transfer===Ui&&(s.r=g_(s.r),s.g=g_(s.g),s.b=g_(s.b)),this.spaces[a].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Ui&&(s.r=e9(s.r),s.g=e9(s.g),s.b=e9(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===p8?aie:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,o){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return CU("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),t.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return CU("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),t.colorSpaceToWorking(s,a)}},e=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return t.define({[Zh]:{primaries:e,whitePoint:r,transfer:aie,toXYZ:Jtt,fromXYZ:ent,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:qo},outputColorSpaceConfig:{drawingBufferColorSpace:qo}},[qo]:{primaries:e,whitePoint:r,transfer:Ui,toXYZ:Jtt,fromXYZ

/* ==== hit[1] @4349452 ==== */
this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===p8?aie:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,o){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return CU("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),t.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return CU("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),t.colorSpaceToWorking(s,a)}},e=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return t.define({[Zh]:{primaries:e,whitePoint:r,transfer:aie,toXYZ:Jtt,fromXYZ:ent,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:qo},outputColorSpaceConfig:{drawingBufferColorSpace:qo}},[qo]:{primaries:e,whitePoint:r,transfer:Ui,toXYZ:Jtt,fromXYZ:ent,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:qo}}}),t}const Wa=lvr();function g_(t){return t<.04045?t*.0773993808:Math.pow(t*.9478672986+.0521327014,2.4)}function e9(t){return t<.0031308?t*12.92:1.055*Math.pow(t,.41666)-.055}let vj;class cvr{static getDataURL(e,n="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let

/* ==== hit[2] @4350159 ==== */
urn this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return CU("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),t.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return CU("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),t.colorSpaceToWorking(s,a)}},e=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return t.define({[Zh]:{primaries:e,whitePoint:r,transfer:aie,toXYZ:Jtt,fromXYZ:ent,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:qo},outputColorSpaceConfig:{drawingBufferColorSpace:qo}},[qo]:{primaries:e,whitePoint:r,transfer:Ui,toXYZ:Jtt,fromXYZ:ent,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:qo}}}),t}const Wa=lvr();function g_(t){return t<.04045?t*.0773993808:Math.pow(t*.9478672986+.0521327014,2.4)}function e9(t){return t<.0031308?t*12.92:1.055*Math.pow(t,.41666)-.055}let vj;class cvr{static getDataURL(e,n="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let r;if(e instanceof HTMLCanvasElement)r=e;else{vj===void 0&&(vj=AU("canvas")),vj.width=e.width,vj.height=e.height;const s=vj.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),r=vj}return r.toDataURL(n)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const n=AU("canvas");n.width=e.width,n.height=e.height;const r=n.getContext("2d");r.drawImage(e,0,0,e.width,e.height);const s=r.getImageData(0,0,e.width,e.height),a=s.data;for(let o=0;o<a.length;o++)a[o]=g_(a[o]/255)*255;return r.putImageData(s,0,0),n}else if(

// #### SIG 'shadowMap' — shadow map enable — 3 hits ####
/* ==== hit[0] @4617269 ==== */
	material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPositio

/* ==== hit[1] @4619083 ==== */

		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( 

/* ==== hit[2] @4620040 ==== */
 directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,jwr=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNorm

// #### SIG 'PCFSoft' — PCF soft — 1 hits ####
/* ==== hit[0] @4793723 ==== */
ms:{shadow_pass:{value:null},resolution:{value:new On},radius:{value:4}},vertexShader:s8r,fragmentShader:a8r}),m=f.clone();m.defines.HORIZONTAL_PASS=1;const g=new Ii;g.setAttribute("position",new au(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const b=new Vt(g,f),y=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=t$;let v=this.type;this.render=function(T,A,C){if(y.enabled===!1||y.autoUpdate===!1&&y.needsUpdate===!1||T.length===0)return;T.type===syr&&(Jr("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),T.type=t$);const E=t.getRenderTarget(),j=t.getActiveCubeFace(),I=t.getActiveMipmapLevel(),N=t.state;N.setBlending(f_),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const P=v!==this.type;P&&A.traverse(function(F){F.material&&(Array.isArray(F.material)?F.material.forEach(B=>B.needsUpdate=!0):F.material.needsUpdate=!0)});for(let F=0,B=T.length;F<B;F++){const H=T[F],z=H.shadow;if(z===void 0){Jr("WebGLShadowMap:",H,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);const L=z.getFrameExtents();if(s.multiply(L),a.copy(z.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(a.x=Math.floor(u/L.x),s.x=a.x

// #### SIG 'HemisphereLight' — hemisphere fill light — 4 hits ####
/* ==== hit[0] @4524348 ==== */
his)}Oj.delete(this),a.manager.itemEnd(e)}function d(h){u(),s&&s(h),Qw.remove(`image:${e}`);const f=Oj.get(this)||[];for(let m=0;m<f.length;m++){const g=f[m];g.onError&&g.onError(h)}Oj.delete(this),a.manager.itemError(e),a.manager.itemEnd(e)}function u(){l.removeEventListener("load",c,!1),l.removeEventListener("error",d,!1)}return l.addEventListener("load",c,!1),l.addEventListener("error",d,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(l.crossOrigin=this.crossOrigin),Qw.add(`image:${e}`,l),a.manager.itemStart(e),l.src=e,l}}class FWt extends LR{constructor(e){super(e)}load(e,n,r,s){const a=new nl,o=new axr(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(l){a.image=l,a.needsUpdate=!0,n!==void 0&&n(a)},r,s),a}}class yS extends di{constructor(e,n=1){super(),this.isLight=!0,this.type="Light",this.color=new hr(e),this.intensity=n}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,n){return super.copy(e,n),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const n=super.toJSON(e);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}}class VC extends yS{constructor(e,n,r){super(e,r),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(di.DEFAULT_UP),this.updateMatrix(),this.groundColor=new hr(n)}copy(e,n){return super.copy(e,n),this.groundColor.copy(e.groundColor),this}toJSON(e){const n=super.toJSON(e);return n.object.groundColor=this.groundColor.getHex(),n}}const Xbe=new $r,Nnt=new Ge,Pnt=new Ge;class bDe{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new On(512,512),this.mapType=z0,this.map=null,this.mapPass=null,this.matrix=new $r,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new gDe,this._frameExtents=new On(1,1),this._viewportCount=1,this._viewports=[new qa(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const n=this.camera,r=this.matrix;Nnt.setFromMatrixPosition(e.matrixWorld),n.position.copy(Nnt),Pnt.setFromMatrixPosition(e.target.matrixWorld),n.lookAt(Pnt),n.updateMatrixWorld(),Xbe.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Xbe,n.coordinateSystem,n.reversedDepth),n.reversedDepth?r.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):r.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),r.multiply(Xbe)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e

/* ==== hit[1] @4524378 ==== */
.itemEnd(e)}function d(h){u(),s&&s(h),Qw.remove(`image:${e}`);const f=Oj.get(this)||[];for(let m=0;m<f.length;m++){const g=f[m];g.onError&&g.onError(h)}Oj.delete(this),a.manager.itemError(e),a.manager.itemEnd(e)}function u(){l.removeEventListener("load",c,!1),l.removeEventListener("error",d,!1)}return l.addEventListener("load",c,!1),l.addEventListener("error",d,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(l.crossOrigin=this.crossOrigin),Qw.add(`image:${e}`,l),a.manager.itemStart(e),l.src=e,l}}class FWt extends LR{constructor(e){super(e)}load(e,n,r,s){const a=new nl,o=new axr(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(l){a.image=l,a.needsUpdate=!0,n!==void 0&&n(a)},r,s),a}}class yS extends di{constructor(e,n=1){super(),this.isLight=!0,this.type="Light",this.color=new hr(e),this.intensity=n}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,n){return super.copy(e,n),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const n=super.toJSON(e);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}}class VC extends yS{constructor(e,n,r){super(e,r),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(di.DEFAULT_UP),this.updateMatrix(),this.groundColor=new hr(n)}copy(e,n){return super.copy(e,n),this.groundColor.copy(e.groundColor),this}toJSON(e){const n=super.toJSON(e);return n.object.groundColor=this.groundColor.getHex(),n}}const Xbe=new $r,Nnt=new Ge,Pnt=new Ge;class bDe{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new On(512,512),this.mapType=z0,this.map=null,this.mapPass=null,this.matrix=new $r,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new gDe,this._frameExtents=new On(1,1),this._viewportCount=1,this._viewports=[new qa(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const n=this.camera,r=this.matrix;Nnt.setFromMatrixPosition(e.matrixWorld),n.position.copy(Nnt),Pnt.setFromMatrixPosition(e.target.matrixWorld),n.lookAt(Pnt),n.updateMatrixWorld(),Xbe.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Xbe,n.coordinateSystem,n.reversedDepth),n.reversedDepth?r.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):r.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),r.multiply(Xbe)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBi

/* ==== hit[2] @4589738 ==== */
ct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,wwr=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			

/* ==== hit[3] @4589824 ==== */
oat decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,wwr=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,_wr=`ToonMaterial material

// #### SIG 'DirectionalLight' — sun light — 5 hits ####
/* ==== hit[0] @4530191 ==== */
d=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=r-e,o=r+e,l=s+n,c=s-n;if(this.view!==null&&this.view.enabled){const d=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=d*this.view.offsetX,o=a+d*this.view.width,l-=u*this.view.offsetY,c=l-u*this.view.height}this.projectionMatrix.makeOrthographic(a,o,l,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const n=super.toJSON(e);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class cxr extends bDe{constructor(){super(new J1(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ax extends yS{constructor(e,n){super(e,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(di.DEFAULT_UP),this.updateMatrix(),this.target=new di,this.shadow=new cxr}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const n=super.toJSON(e);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}class dxr extends yS{constructor(e,n){super(e,n),this.isAmbientLight=!0,this.type="AmbientLight"}}class r${static extractUrlBase(e){const n=e.lastIndexOf("/");return n===-1?"./":e.slice(0,n+1)}static resolveURL(e,n){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(n)&&/^\//.test(e)&&(n=n.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:n+e)}}class uxr extends Ii{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const Ybe=new WeakMap;class hxr extends LR{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Jr("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Jr("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none

/* ==== hit[1] @4530273 ==== */
his.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=r-e,o=r+e,l=s+n,c=s-n;if(this.view!==null&&this.view.enabled){const d=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=d*this.view.offsetX,o=a+d*this.view.width,l-=u*this.view.offsetY,c=l-u*this.view.height}this.projectionMatrix.makeOrthographic(a,o,l,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const n=super.toJSON(e);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class cxr extends bDe{constructor(){super(new J1(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ax extends yS{constructor(e,n){super(e,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(di.DEFAULT_UP),this.updateMatrix(),this.target=new di,this.shadow=new cxr}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const n=super.toJSON(e);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}class dxr extends yS{constructor(e,n){super(e,n),this.isAmbientLight=!0,this.type="AmbientLight"}}class r${static extractUrlBase(e){const n=e.lastIndexOf("/");return n===-1?"./":e.slice(0,n+1)}static resolveURL(e,n){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(n)&&/^\//.test(e)&&(n=n.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:n+e)}}class uxr extends Ii{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const Ybe=new WeakMap;class hxr extends LR{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Jr("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Jr("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,t

/* ==== hit[2] @4530304 ==== */
.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=r-e,o=r+e,l=s+n,c=s-n;if(this.view!==null&&this.view.enabled){const d=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=d*this.view.offsetX,o=a+d*this.view.width,l-=u*this.view.offsetY,c=l-u*this.view.height}this.projectionMatrix.makeOrthographic(a,o,l,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const n=super.toJSON(e);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class cxr extends bDe{constructor(){super(new J1(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ax extends yS{constructor(e,n){super(e,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(di.DEFAULT_UP),this.updateMatrix(),this.target=new di,this.shadow=new cxr}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const n=super.toJSON(e);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}class dxr extends yS{constructor(e,n){super(e,n),this.isAmbientLight=!0,this.type="AmbientLight"}}class r${static extractUrlBase(e){const n=e.lastIndexOf("/");return n===-1?"./":e.slice(0,n+1)}static resolveURL(e,n){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(n)&&/^\//.test(e)&&(n=n.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:n+e)}}class uxr extends Ii{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const Ybe=new WeakMap;class hxr extends LR{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Jr("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Jr("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,n,r,s){e===void 0&&(

/* ==== hit[3] @4587549 ==== */
efficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( 

/* ==== hit[4] @4587613 ==== */
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spo

// #### SIG 'azimuthDeg' — azimuth usage (light UI + normalize) — 8 hits ####
/* ==== hit[0] @4903103 ==== */
-t[2]);if(r<1e-4)return e[1];const s=Math.max(-89,Math.min(89,n));return t[1]+r*Math.tan(s*Math.PI/180)}function F8(t,e){if(e&&t[e]?.kind==="camera")return e;for(const[n,r]of Object.entries(t))if(r.kind==="camera")return n;return null}const fq=-30,QA=90,A8r=5,GWt=-8,C8r=25,E8r=9,j8r=-4,I8r=-28,kDe={azimuthDeg:128.66,elevationDeg:57.38},IU=Math.PI/180;function M8r(t){const e=t.azimuthDeg*IU,n=(t.elevationDeg>GWt?Math.max(t.elevationDeg,A8r):C8r-t.elevationDeg)*IU;return[Math.sin(e)*Math.cos(n),Math.sin(n),-Math.cos(e)*Math.cos(n)]}function SDe(t){return{azimuthDeg:(t.azimuthDeg%360+360)%360,elevationDeg:Math.min(QA,Math.max(fq,t.elevationDeg)),...t.nightLights===!1?{nightLights:!1}:{}}}function N8r(t){if(!t||typeof t!="object")return;const{azimuthDeg:e,elevationDeg:n,nightLights:r}=t;if(!(typeof e!="number"||!Number.isFinite(e))&&!(typeof n!="number"||!Number.isFinite(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2

/* ==== hit[1] @4903182 ==== */
*Math.tan(s*Math.PI/180)}function F8(t,e){if(e&&t[e]?.kind==="camera")return e;for(const[n,r]of Object.entries(t))if(r.kind==="camera")return n;return null}const fq=-30,QA=90,A8r=5,GWt=-8,C8r=25,E8r=9,j8r=-4,I8r=-28,kDe={azimuthDeg:128.66,elevationDeg:57.38},IU=Math.PI/180;function M8r(t){const e=t.azimuthDeg*IU,n=(t.elevationDeg>GWt?Math.max(t.elevationDeg,A8r):C8r-t.elevationDeg)*IU;return[Math.sin(e)*Math.cos(n),Math.sin(n),-Math.cos(e)*Math.cos(n)]}function SDe(t){return{azimuthDeg:(t.azimuthDeg%360+360)%360,elevationDeg:Math.min(QA,Math.max(fq,t.elevationDeg)),...t.nightLights===!1?{nightLights:!1}:{}}}function N8r(t){if(!t||typeof t!="object")return;const{azimuthDeg:e,elevationDeg:n,nightLights:r}=t;if(!(typeof e!="number"||!Number.isFinite(e))&&!(typeof n!="number"||!Number.isFinite(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2(t.x,-t.y)/IU+e,elevationDeg:QA-n*(QA-fq)})}const F8r="/assets/camera-DV-hMEYk.

/* ==== hit[2] @4903362 ==== */
,GWt=-8,C8r=25,E8r=9,j8r=-4,I8r=-28,kDe={azimuthDeg:128.66,elevationDeg:57.38},IU=Math.PI/180;function M8r(t){const e=t.azimuthDeg*IU,n=(t.elevationDeg>GWt?Math.max(t.elevationDeg,A8r):C8r-t.elevationDeg)*IU;return[Math.sin(e)*Math.cos(n),Math.sin(n),-Math.cos(e)*Math.cos(n)]}function SDe(t){return{azimuthDeg:(t.azimuthDeg%360+360)%360,elevationDeg:Math.min(QA,Math.max(fq,t.elevationDeg)),...t.nightLights===!1?{nightLights:!1}:{}}}function N8r(t){if(!t||typeof t!="object")return;const{azimuthDeg:e,elevationDeg:n,nightLights:r}=t;if(!(typeof e!="number"||!Number.isFinite(e))&&!(typeof n!="number"||!Number.isFinite(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2(t.x,-t.y)/IU+e,elevationDeg:QA-n*(QA-fq)})}const F8r="/assets/camera-DV-hMEYk.glb",O8r="/assets/spotlight-Cs6bAwrT.glb",qWt=F8r,ZWt=O8r,L8r=.55,D8r=4513194,B8r=14500966,KWt="camera-frustum",H8r=16;function $8r(){const t=new Ci,e=new Ii;e.setAttribute("positi

/* ==== hit[3] @4903376 ==== */
,E8r=9,j8r=-4,I8r=-28,kDe={azimuthDeg:128.66,elevationDeg:57.38},IU=Math.PI/180;function M8r(t){const e=t.azimuthDeg*IU,n=(t.elevationDeg>GWt?Math.max(t.elevationDeg,A8r):C8r-t.elevationDeg)*IU;return[Math.sin(e)*Math.cos(n),Math.sin(n),-Math.cos(e)*Math.cos(n)]}function SDe(t){return{azimuthDeg:(t.azimuthDeg%360+360)%360,elevationDeg:Math.min(QA,Math.max(fq,t.elevationDeg)),...t.nightLights===!1?{nightLights:!1}:{}}}function N8r(t){if(!t||typeof t!="object")return;const{azimuthDeg:e,elevationDeg:n,nightLights:r}=t;if(!(typeof e!="number"||!Number.isFinite(e))&&!(typeof n!="number"||!Number.isFinite(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2(t.x,-t.y)/IU+e,elevationDeg:QA-n*(QA-fq)})}const F8r="/assets/camera-DV-hMEYk.glb",O8r="/assets/spotlight-Cs6bAwrT.glb",qWt=F8r,ZWt=O8r,L8r=.55,D8r=4513194,B8r=14500966,KWt="camera-frustum",H8r=16;function $8r(){const t=new Ci,e=new Ii;e.setAttribute("position",new au(new

/* ==== hit[4] @4903552 ==== */
.elevationDeg)*IU;return[Math.sin(e)*Math.cos(n),Math.sin(n),-Math.cos(e)*Math.cos(n)]}function SDe(t){return{azimuthDeg:(t.azimuthDeg%360+360)%360,elevationDeg:Math.min(QA,Math.max(fq,t.elevationDeg)),...t.nightLights===!1?{nightLights:!1}:{}}}function N8r(t){if(!t||typeof t!="object")return;const{azimuthDeg:e,elevationDeg:n,nightLights:r}=t;if(!(typeof e!="number"||!Number.isFinite(e))&&!(typeof n!="number"||!Number.isFinite(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2(t.x,-t.y)/IU+e,elevationDeg:QA-n*(QA-fq)})}const F8r="/assets/camera-DV-hMEYk.glb",O8r="/assets/spotlight-Cs6bAwrT.glb",qWt=F8r,ZWt=O8r,L8r=.55,D8r=4513194,B8r=14500966,KWt="camera-frustum",H8r=16;function $8r(){const t=new Ci,e=new Ii;e.setAttribute("position",new au(new Float32Array(H8r*3),3));const n=new nA(e,new Dv({color:D8r,transparent:!0,opacity:.7}));return n.name=KWt,n.frustumCulled=!1,n.raycast=()=>{},t.add(n),t}function mie(t){const 

/* ==== hit[5] @4903699 ==== */
,elevationDeg:Math.min(QA,Math.max(fq,t.elevationDeg)),...t.nightLights===!1?{nightLights:!1}:{}}}function N8r(t){if(!t||typeof t!="object")return;const{azimuthDeg:e,elevationDeg:n,nightLights:r}=t;if(!(typeof e!="number"||!Number.isFinite(e))&&!(typeof n!="number"||!Number.isFinite(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2(t.x,-t.y)/IU+e,elevationDeg:QA-n*(QA-fq)})}const F8r="/assets/camera-DV-hMEYk.glb",O8r="/assets/spotlight-Cs6bAwrT.glb",qWt=F8r,ZWt=O8r,L8r=.55,D8r=4513194,B8r=14500966,KWt="camera-frustum",H8r=16;function $8r(){const t=new Ci,e=new Ii;e.setAttribute("position",new au(new Float32Array(H8r*3),3));const n=new nA(e,new Dv({color:D8r,transparent:!0,opacity:.7}));return n.name=KWt,n.frustumCulled=!1,n.raycast=()=>{},t.add(n),t}function mie(t){const e=new go().setFromObject(t).getSize(new Ge),n=Math.max(e.x,e.y,e.z);n>0&&t.scale.multiplyScalar(L8r/n),t.rotation.y=Math.PI;const r=new go().setFro

/* ==== hit[6] @4903824 ==== */
of t!="object")return;const{azimuthDeg:e,elevationDeg:n,nightLights:r}=t;if(!(typeof e!="number"||!Number.isFinite(e))&&!(typeof n!="number"||!Number.isFinite(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2(t.x,-t.y)/IU+e,elevationDeg:QA-n*(QA-fq)})}const F8r="/assets/camera-DV-hMEYk.glb",O8r="/assets/spotlight-Cs6bAwrT.glb",qWt=F8r,ZWt=O8r,L8r=.55,D8r=4513194,B8r=14500966,KWt="camera-frustum",H8r=16;function $8r(){const t=new Ci,e=new Ii;e.setAttribute("position",new au(new Float32Array(H8r*3),3));const n=new nA(e,new Dv({color:D8r,transparent:!0,opacity:.7}));return n.name=KWt,n.frustumCulled=!1,n.raycast=()=>{},t.add(n),t}function mie(t){const e=new go().setFromObject(t).getSize(new Ge),n=Math.max(e.x,e.y,e.z);n>0&&t.scale.multiplyScalar(L8r/n),t.rotation.y=Math.PI;const r=new go().setFromObject(t);t.position.sub(r.getCenter(new Ge))}const Dj=new di;function kv(t,e){return Dj.position.set(t[0],t[1],t[2]),Dj.loo

/* ==== hit[7] @4903982 ==== */
(n)))return SDe({azimuthDeg:e,elevationDeg:n,nightLights:r!==!1})}function P8r(t){return Math.atan2(t.x,-t.z)/IU}function R8r(t,e){const n=(t.azimuthDeg-e)*IU,r=(QA-t.elevationDeg)/(QA-fq);return{x:Math.sin(n)*r,y:-Math.cos(n)*r}}function irt(t,e){const n=Math.min(1,Math.hypot(t.x,t.y));return SDe({azimuthDeg:Math.atan2(t.x,-t.y)/IU+e,elevationDeg:QA-n*(QA-fq)})}const F8r="/assets/camera-DV-hMEYk.glb",O8r="/assets/spotlight-Cs6bAwrT.glb",qWt=F8r,ZWt=O8r,L8r=.55,D8r=4513194,B8r=14500966,KWt="camera-frustum",H8r=16;function $8r(){const t=new Ci,e=new Ii;e.setAttribute("position",new au(new Float32Array(H8r*3),3));const n=new nA(e,new Dv({color:D8r,transparent:!0,opacity:.7}));return n.name=KWt,n.frustumCulled=!1,n.raycast=()=>{},t.add(n),t}function mie(t){const e=new go().setFromObject(t).getSize(new Ge),n=Math.max(e.x,e.y,e.z);n>0&&t.scale.multiplyScalar(L8r/n),t.rotation.y=Math.PI;const r=new go().setFromObject(t);t.position.sub(r.getCenter(new Ge))}const Dj=new di;function kv(t,e){return Dj.position.set(t[0],t[1],t[2]),Dj.lookAt(e[0],e[1],e[2]),Dj.rotateY(Math.PI),[Dj.rotation.x,Dj.rotation.y,Dj.rotation.z]}const a2e=new qn,ort=new Ge,lrt=new qn,crt=new Ge,i2e=new qn;function V8r(

