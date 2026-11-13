// #### HY — 1 def sites ####
/* ==== HY site[0] kind=assign @5434428 len=891 ==== */
HY=[{elevationDeg:-30,zenith:329487,horizon:725280,fillSky:4149120,fillGround:1185311,fill:.5,sunColor:11847925,sun:.55,glow:1,flare:0},{elevationDeg:-16,zenith:857648,horizon:2635358,fillSky:5335213,fillGround:1909299,fill:.8,sunColor:11124204,sun:.3,glow:1,flare:0},{elevationDeg:GWt,zenith:1845064,horizon:9072524,fillSky:7568564,fillGround:3485759,fill:.95,sunColor:Aat,sun:0,glow:.8,flare:.3},{elevationDeg:-2,zenith:3820152,horizon:14719100,fillSky:9409220,fillGround:6245460,fill:1.15,sunColor:Aat,sun:.75,glow:.35,flare:.55},{elevationDeg:5,zenith:9677260,horizon:16240038,fillSky:13616862,fillGround:12098180,fill:1.45,sunColor:16755044,sun:3.6,glow:0,flare:.6},{elevationDeg:16,zenith:14082028,horizon:15918550,fillSky:14541038,fillGround:13287346,fill:1.55,sunColor:16768180,sun:2.7,glow:0,flare:.12},{elevationDeg:32,...DFr}],BFr=new hr,HFr=(t,e,n)=>new hr(t).lerp(BFr.set(e),n);


// #### mFr — 1 def sites ####
/* ==== mFr site[0] kind=function @5431493 len=957 ==== */
function mFr(t,e){return e?!lq(t.objects.peek()[e],U6(t,e)):!0}function xq(t,e){const n=e?t.objects.peek()[e]:void 0;if(!n?.targetId)return!1;const r=U6(t,e),s=_he(r,t.performanceTimeS.peek());return s?YN(s):lq(n,r)}function gFr(t,e){return G2r(U6(t,e),t.performanceTimeS.peek())}function uZt(t,e,n,r,s){if(!Xu(e,s))return!0;const a=r===s?Object.keys(e).find(o=>e[o]?.targetId===s):n&&e[n]?.targetId===s?n:void 0;return a?lq(e[a],U6(t,a)):!1}function bFr(t,e){if(!e)return null;const n=t.show.peek().tracks.find(a=>a.characterId===e);if(!n)return null;const r=t.performanceTimeS.peek(),s=_he(n.items,r);return s?.kind==="cam-follow"&&r<=s.startS+s.durationS?{trackId:n.id,item:s}:null}function yFr(t){return t.framesMarkerNow&&!t.meshDragged}function vFr(t){return t.recording||!t.editMode?!1:t.meshDragged?!0:!t.previewActive&&t.isSelected}function xFr(t){return t.animatedNow?!1:!t.dragging}const Khe=.1,RP=500,hZt=2e4,wFr=1.25,_Fr=400,Sat=1.1,kFr=RP/Khe;


// #### yFr — 1 def sites ####
/* ==== yFr site[0] kind=function @5432178 len=272 ==== */
function yFr(t){return t.framesMarkerNow&&!t.meshDragged}function vFr(t){return t.recording||!t.editMode?!1:t.meshDragged?!0:!t.previewActive&&t.isSelected}function xFr(t){return t.animatedNow?!1:!t.dragging}const Khe=.1,RP=500,hZt=2e4,wFr=1.25,_Fr=400,Sat=1.1,kFr=RP/Khe;


// #### QFr — 1 def sites ####
/* ==== QFr site[0] kind=assign @5435858 len=44 ==== */
QFr=.02,JFr=.07,Xhe=t=>t.userData.spotlight;


// #### KFr — 1 def sites ####
/* ==== KFr site[0] kind=assign @5435786 len=116 ==== */
KFr=.9,nre=1/(Math.SQRT2*1.06),Yx=128,Eat=10,XFr=.45,YFr=16769955,jat=7,QFr=.02,JFr=.07,Xhe=t=>t.userData.spotlight;


// #### XFr — 1 def sites ####
/* ==== XFr site[0] kind=assign @5435831 len=71 ==== */
XFr=.45,YFr=16769955,jat=7,QFr=.02,JFr=.07,Xhe=t=>t.userData.spotlight;


// #### l8r — 1 def sites ####
/* ==== l8r site[0] kind=function @4793044 len=6372 ==== */
function l8r(t,e,n){let r=new gDe;const s=new On,a=new On,o=new qa,l=new jWt,c=new IWt,d={},u=n.maxTextureSize,h={[sx]:$p,[$p]:sx,[Fc]:Fc},f=new rl({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new On},radius:{value:4}},vertexShader:s8r,fragmentShader:a8r}),m=f.clone();m.defines.HORIZONTAL_PASS=1;const g=new Ii;g.setAttribute("position",new au(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const b=new Vt(g,f),y=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=t$;let v=this.type;this.render=function(T,A,C){if(y.enabled===!1||y.autoUpdate===!1&&y.needsUpdate===!1||T.length===0)return;T.type===syr&&(Jr("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),T.type=t$);const E=t.getRenderTarget(),j=t.getActiveCubeFace(),I=t.getActiveMipmapLevel(),N=t.state;N.setBlending(f_),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const P=v!==this.type;P&&A.traverse(function(F){F.material&&(Array.isArray(F.material)?F.material.forEach(B=>B.needsUpdate=!0):F.material.needsUpdate=!0)});for(let F=0,B=T.length;F<B;F++){const H=T[F],z=H.shadow;if(z===void 0){Jr("WebGLShadowMap:",H,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);const L=z.getFrameExtents();if(s.multiply(L),a.copy(z.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(a.x=Math.floor(u/L.x),s.x=a.x*L.x,z.mapSize.x=a.x),s.y>u&&(a.y=Math.floor(u/L.y),s.y=a.y*L.y,z.mapSize.y=a.y)),z.map===null||P===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===UB){if(H.isPointLight){Jr("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new Wh(s.x,s.y,{format:wP,type:qm,minFilter:$i,magFilter:$i,generateMipmaps:!1}),z.map.texture.name=H.name+".shadowMap",z.map.depthTexture=new YA(s.x,s.y,J0),z.map.depthTexture.name=H.name+".shadowMapDepth",z.map.depthTexture.format=K_,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=hc,z.map.depthTexture.magFilter=hc}else{H.isPointLight?(z.map=new kWt(s.x),z.map.depthTexture=new Gvr(s.x,V1)):(z.map=new Wh(s.x,s.y),z.map.depthTexture=new YA(s.x,s.y,V1)),z.map.depthTexture.name=H.name+".shadowMap",z.map.depthTexture.format=K_;const O=t.state.buffers.depth.getReversed();this.type===t$?(z.map.depthTexture.compareFunction=O?uDe:dDe,z.map.depthTexture.minFilter=$i,z.map.depthTexture.magFilter=$i):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=hc,z.map.depthTexture.magFilter=hc)}z.camera.updateProjectionMatrix()}const $=z.map.isWebGLCubeRenderTarget?6:1;for(let O=0;O<$;O++){if(z.map.isWebGLCubeRenderTarget)t.setRenderTarget(z.map,O),t.clear();else{O===0&&(t.setRenderTarget(z.map),t.clear());const W=z.getViewport(O);o.set(a.x*W.x,a.y*W.y,a.x*W.z,a.y*W.w),N.viewport(o)}if(H.isPointLight){const W=z.camera,U=z.matrix,V=H.distance||W.far;V!==W.far&&(W.far=V,W.updateProjectionMatrix()),KO.setFromMatrixPosition(H.matrixWorld),W.position.copy(KO),r2e.copy(W.position),r2e.add(i8r[O]),W.up.copy(o8r[O]),W.lookAt(r2e),W.updateMatrixWorld(),U.makeTranslation(-KO.x,-KO.y,-KO.z),art.multiplyMatrices(W.projectionMatrix,W.matrixWorldInverse),z._frustum.setFromProjectionMatrix(art,W.coordinateSystem,W.reversedDepth)}else z.updateMatrices(H);r=z.getFrustum(),k(A,C,z.camera,H,this.type)}z.isPointLightShadow!==!0&&this.type===UB&&x(z,C),z.needsUpdate=!1}v=this.type,y.needsUpdate=!1,t.setRenderTarget(E,j,I)};function x(T,A){const C=e.update(b);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,m.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Wh(s.x,s.y,{format:wP,type:qm})),f.uniforms.shadow_pass.value=T.map.depthTexture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,t.setRenderTarget(T.mapPass),t.clear(),t.renderBufferDirect(A,null,C,f,b,null),m.uniforms.shadow_pass.value=T.mapPass.texture,m.uniforms.resolution.value=T.mapSize,m.uniforms.radius.value=T.radius,t.setRenderTarget(T.map),t.clear(),t.renderBufferDirect(A,null,C,m,b,null)}function w(T,A,C,E){let j=null;const I=C.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(I!==void 0)j=I;else if(j=C.isPointLight===!0?c:l,t.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){const N=j.uuid,P=A.uuid;let F=d[N];F===void 0&&(F={},d[N]=F);let B=F[P];B===void 0&&(B=j.clone(),F[P]=B,A.addEventListener("dispose",S)),j=B}if(j.visible=A.visible,j.wireframe=A.wireframe,E===UB?j.side=A.shadowSide!==null?A.shadowSide:A.side:j.side=A.shadowSide!==null?A.shadowSide:h[A.side],j.alphaMap=A.alphaMap,j.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,j.map=A.map,j.clipShadows=A.clipShadows,j.clippingPlanes=A.clippingPlanes,j.clipIntersection=A.clipIntersection,j.displacementMap=A.displacementMap,j.displacementScale=A.displacementScale,j.displacementBias=A.displacementBias,j.wireframeLinewidth=A.wireframeLinewidth,j.linewidth=A.linewidth,C.isPointLight===!0&&j.isMeshDistanceMaterial===!0){const N=t.properties.get(j);N.light=C}return j}function k(T,A,C,E,j){if(T.visible===!1)return;if(T.layers.test(A.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&j===UB)&&(!T.frustumCulled||r.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,T.matrixWorld);const P=e.update(T),F=T.material;if(Array.isArray(F)){const B=P.groups;for(let H=0,z=B.length;H<z;H++){const L=B[H],$=F[L.materialIndex];if($&&$.visible){const O=w(T,$,E,j);T.onBeforeShadow(t,T,A,C,P,O,L),t.renderBufferDirect(C,null,P,O,T,L),T.onAfterShadow(t,T,A,C,P,O,L)}}}else if(F.visible){const B=w(T,F,E,j);T.onBeforeShadow(t,T,A,C,P,B,null),t.renderBufferDirect(C,null,P,B,T,null),T.onAfterShadow(t,T,A,C,P,B,null)}}const N=T.children;for(let P=0,F=N.length;P<F;P++)k(N[P],A,C,E,j)}function S(T){T.target.removeEventListener("dispose",S);for(const C in d){const E=d[C],j=T.target.uuid;j in E&&(E[j].dispose(),delete E[j])}}}const c8r={[sEe]:nie,[aEe]:lEe,[iEe]:cEe,[vP]:oEe,[nie]:sEe,[lEe]:aEe,[cEe]:iEe,[oEe]:vP};


// #### uZt — 1 def sites ####
/* ==== uZt site[0] kind=function @5431773 len=677 ==== */
function uZt(t,e,n,r,s){if(!Xu(e,s))return!0;const a=r===s?Object.keys(e).find(o=>e[o]?.targetId===s):n&&e[n]?.targetId===s?n:void 0;return a?lq(e[a],U6(t,a)):!1}function bFr(t,e){if(!e)return null;const n=t.show.peek().tracks.find(a=>a.characterId===e);if(!n)return null;const r=t.performanceTimeS.peek(),s=_he(n.items,r);return s?.kind==="cam-follow"&&r<=s.startS+s.durationS?{trackId:n.id,item:s}:null}function yFr(t){return t.framesMarkerNow&&!t.meshDragged}function vFr(t){return t.recording||!t.editMode?!1:t.meshDragged?!0:!t.previewActive&&t.isSelected}function xFr(t){return t.animatedNow?!1:!t.dragging}const Khe=.1,RP=500,hZt=2e4,wFr=1.25,_Fr=400,Sat=1.1,kFr=RP/Khe;


// #### sOr — 1 def sites ####
/* ==== sOr site[0] kind=function @5436110 len=421 ==== */
function sOr(t=new Ci){const e=new Ci,n=new OWt(16777215,0,0,Rhe(e.scale),0,2);return n.position.set(0,0,0),n.target.position.set(0,0,-1),n.shadow.mapSize.set(Cat,Cat),n.shadow.camera.near=VFr,n.shadow.camera.far=UFr,n.shadow.bias=zFr,n.shadow.normalBias=WFr,e.add(n,n.target,t),e.userData.spotlight={light:n,lamp:t},e}function aOr(t,e){const n=Xhe(t);n&&(t.remove(n.lamp),Kd(n.lamp),t.add(e),n.lamp=e)}const Iat=new Map;


// #### tFr — 1 def sites ####
/* ==== tFr site[0] kind=function @5426086 len=307 ==== */
function tFr({xPx:t}){return i.jsxs("g",{className:hm.playhead,children:[i.jsx("line",{x1:t,x2:t,y1:r8,y2:r8+A5}),i.jsx("path",{d:`M${t-5} 2 h10 v6 l-5 5 l-5 -5 z`})]})}const nFr="_zoom_xr4ua_2",rFr="_button_xr4ua_7",sFr="_value_xr4ua_8",aFr="_corner_xr4ua_37",KB={zoom:nFr,button:rFr,value:sFr,corner:aFr};


// #### c8r — 1 def sites ####
/* ==== c8r site[0] kind=assign @4799332 len=85 ==== */
 c8r={[sEe]:nie,[aEe]:lEe,[iEe]:cEe,[vP]:oEe,[nie]:sEe,[lEe]:aEe,[cEe]:iEe,[oEe]:vP};


// #### CDe — 1 def sites ####
/* ==== CDe site[0] kind=function @4918323 len=638 ==== */
function CDe(t){if(t?.nodes){const r=Object.values(t.nodes).find(s=>s.type==="image");if(r?.data?.url)return{thumbnail:es.getThumbnailUrl(r.data.url),original:r.data.url}}const e=t?.projectSettings?.visualStyle;if(e?.type==="reference"&&e.references&&e.references.length>0){const n=e.references[0];if(n?.reference_image_url)return{thumbnail:es.getThumbnailUrl(n.reference_image_url),original:n.reference_image_url}}return{thumbnail:null,original:null}}const frt="id, user_id, name, description, thumbnail_url, is_public, is_testing, source_template_id, link_sharing_enabled, link_sharing_role, workspace_id, is_private, created_at, update


// #### dZt — 1 def sites ####
/* ==== dZt site[0] kind=function @5431015 len=1433 ==== */
function dZt(t){const{base:e,out:n}=t;n.position.set(e.position[0],e.position[1],e.position[2]),Lie.set(e.rotation[0],e.rotation[1],e.rotation[2]),n.quaternion.setFromEuler(Lie),n.fovDeg=Z_(e.focalLengthMm,t.aspect);let r=!1;for(const s of t.items){if(!Fp(s))continue;if(t.timeS<s.startS)break;r=!0;const a=yd(s);if(fFr(s,Math.min(t.timeS-s.startS,a),a,t),t.timeS<s.startS+a)break}return r}function U6(t,e){return e?t.show.peek().tracks.find(n=>n.characterId===e)?.items??[]:[]}function mFr(t,e){return e?!lq(t.objects.peek()[e],U6(t,e)):!0}function xq(t,e){const n=e?t.objects.peek()[e]:void 0;if(!n?.targetId)return!1;const r=U6(t,e),s=_he(r,t.performanceTimeS.peek());return s?YN(s):lq(n,r)}function gFr(t,e){return G2r(U6(t,e),t.performanceTimeS.peek())}function uZt(t,e,n,r,s){if(!Xu(e,s))return!0;const a=r===s?Object.keys(e).find(o=>e[o]?.targetId===s):n&&e[n]?.targetId===s?n:void 0;return a?lq(e[a],U6(t,a)):!1}function bFr(t,e){if(!e)return null;const n=t.show.peek().tracks.find(a=>a.characterId===e);if(!n)return null;const r=t.performanceTimeS.peek(),s=_he(n.items,r);return s?.kind==="cam-follow"&&r<=s.startS+s.durationS?{trackId:n.id,item:s}:null}function yFr(t){return t.framesMarkerNow&&!t.meshDragged}function vFr(t){return t.recording||!t.editMode?!1:t.meshDragged?!0:!t.previewActive&&t.isSelected}function xFr(t){return t.animatedNow?!1:!t.dragging}const Khe=.1,RP=500,hZt=2e4,wFr=1.25,_Fr=400,Sat=1.1,kFr=RP/Kh


// #### QRr — 1 def sites ####
/* ==== QRr site[0] kind=assign @5423245 len=37 ==== */
QRr=8,JRr=7,fat=160,mat=["in","out"];

