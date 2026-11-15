n,r.quaternion,o.target)}return{applyMode:$e,detachGizmo:()=>c.detach(),gizmoHot:()=>c.dragging||c.axis!==null,isDraggingMesh:Ve=>c.dragging&&NOr(Ve,c.object??null),tick:Ma,disposeControls:()=>{c.dispose(),z.dispose()}}}const oQ=new di;function fWr(t,e){const n={};for(const[r,s]of Object.entries(e)){const a=t[r];a&&(oQ.position.copy(s.position),oQ.quaternion.copy(s.quaternion),oQ.scale.copy(s.scale),n[r]=mBe(oQ,a))}return n}const Fje="float dotNL = saturate( dot( geometryNormal, directLight.direction ) );";na.lights_physical_pars_fragment.includes(Fje);na.lights_physical_pars_fragment=na.lights_physical_pars_fragment.replace(Fje,`${Fje}
    #ifdef SOFT_TERMINATOR
      dotNL = ( dotNL < 0.3 ? dotNL * dotNL / 0.6 : dotNL - 0.15 ) / 0.85;
    #endif`);function oKt(t){t.defines={...t.defines,SOFT_TERMINATOR:""}}const mWr=.5,gWr=24,bWr=24,yWr=[64,32],vWr=96;function xWr(t){return t==="sphere"||t==="cylinder"?t:"cube"}function wWr(t,e){const n=new Io({color:e??pq,roughness:X_}),r=t!=="cube";r&&oKt(n);const s=new Vt(lKt(t,!1),n);return s.userData.softTerminator=r,s.userData.primitiveKind=t,s}function lKt(t,e){const n=t==="sphere"?e?new Ku(.5,...yWr):new Ku(.5,32,16):t==="cylinder"?new Al(.5,.5,1,e?vWr:gWr):new mi(1,1,1);return n.translate(0,mWr,0),n}function _Wr(t,e){const n=t.userData.primitiveKind;if(!(t instanceof Vt)||!n||n==="cube")return;const r=Math.max(...e.map(Math.abs))>=bWr;r!==!!t.userData.bigPrimitive&&(t.userData.bigPrimitive=r,t.geometry.dispose(),t.geometry=lKt(n,r))}const Sot=.25,kWr=.25,Tot=.22;function SWr(t,e){for(const[n,r]of t)r.stopFading(),r.enabled=n===e}function Oje(t){t.traverse(e=>{e instanceof RR&&e.skeleton.dispose()})}function TWr(t,e,n){for(const r of[...t.children]){const s=r.userData.objectId;s&&n(s)&&e.add(r)}t.removeFromParent()}function Cye(t,e,n,r){const s=`${e}.${n}`,a=t.tracks.find(l=>l.name===s);return a?a.createInterpolant().evaluate(r):null}function Aot(t,e,n,r){const s=Uie(n),a=Cye(t,e,"position",r),o=Cye(t,e,"quaternion",r),l=Cye(t,e,"scale",r);return{position:a?new Ge(a[0],a[1],a[2]):s.position,quaternion:o?new qn(o[0],o[1],o[2],o[3]):s.quaternion,scale:l?new Ge(l[0],l[1],l[2]):s.scale}}function AWr(t,e){const{a:n,scene:r,meshById:s}=t,a=new Bhe,o=new Map;function l(P,F,B){const H=new Ihe(F),z=new Map;for(const O of B)z.set(O.name,H.clipAction(O));const L=new Map;F.traverse(O=>{O instanceof bT&&L.set(O.name,O)});const $={mixer:H,actions:z,currentClip:null,bones:L,clipLocal:new Map};return o.set(P,$),n.onSkeletonReady?.(P),$}function c(P){const F=o.get(P);F&&(F.mixer.stopAllAction(),F.mixer.uncacheRoot(F.mixer.getRoot()),o.delete(P))}let d=new Map,u=new Map,h=null;function f(P){const F=u.get(P)??null;return h?.objectId!==P?F:{...F,...h.offsets}}function m(){for(const P of o.values())for(const[F,B]of P.clipLocal){const H=P.bones.get(F);H&&(H.position.copy(B.position),H.quaternion.copy(B.quaternion),H.scale.copy(B.scale))}}function g(){for(const[P,F]of o){const B=f(P);if(F.clipLocal.clear(),!!B)for(const[H,z]of Object.entries(B)){const L=F.bones.get(H);L&&(F.clipLocal.set(H,Uie(L)),aKt(L,z))}}}function b(){const P=n.objects.peek();for(const[F,B]of o){const H=d.get(F),z=P[F]?.animation,L=H?.clip??z?.clip;if(L===void 0)continue;if(B.currentClip!==L){const O=B.actions.get(L);if(!O)continue;const W=B.currentClip?B.actions.get(B.currentClip):void 0;W&&W.fadeOut(Sot),O.reset().fadeIn(W?Sot:0).play(),B.currentClip=L}const $=B.actions.get(L);if($)if(H&&H.timeS!==null){const O=$.getClip().duration;$.paused=!0,$.time=O>0?(H.timeS%O+O)%O:0}else H?$.paused=!1:($.paused=!z?.playing,z?.playing||($.time=0))}}function y(P){const F=new Ci,B=u5r();return F.add(B),a.loadAsync(Hhe).then(H=>{if(s.get(P)!==F){Oje(H.scene),Kd(H.scene);return}const z=H.scene,$=new go().setFromObject(z).getSize(new Ge);$.y>0&&z.scale.multiplyScalar(jP/$.y);const O=new go().setFromObject(z),W=O.getCenter(new Ge);z.position.x-=W.x,z.position.z-=W.z,z.position.y-=O.min.y,F.remove(B),Kd(B),$he(z),F.add(z),T(F,n.objects.peek()[P]?.color),l(P,z,H.animations),b()}).catch(H=>{console.error("Failed to load bundled humanoid model",H)}),F}function v(P,F){const B=F.propKey,H=B?zh[B]:void 0;if(H?.url){const L=new Ci,$=eat(H.dims);return L.add($),qqt(a,H.url,H.scale,H.yawDeg).then(O=>{if(s.get(P)!==L){Kd(O);return}L.remove($),Kd($),L.add(O);const W=n.objects.peek()[P];T(L,W&&S(W))}).catch(O=>{console.error("Failed to load remote prop",B,O)}),L}if(B){const L=Wqt(B);if(L)return L}const z=new Ci;return z.add(eat()),z}function x(P){const F=$8r();return a.loadAsync(qWt).then(B=>{if(s.get(P)!==F){Kd(B.scene);return}const H=B.scene;mie(H),F.add(H)}).catch(B=>{console.error("Failed to load bundled camera model",B)}),F}function w(P){const F=sOr(rOr());return a.loadAsync(ZWt).then(B=>{if(s.get(P)!==F){Kd(B.scene);return}mie(B.scene),aOr(F,B.scene)}).catch(B=>{console.error("Failed to load bundled spotlight model",B)}),F}function k(P,F){return F.kind==="humanoid"?y(P):F.kind==="simple_figure"?Zqt():F.kind==="camera"?x(P):F.kind==="target"?YWt():F.kind==="spotlight"?w(P):F.kind==="prop"?v(P,F):F.kind==="group"?new Ci:wWr(xWr(F.kind),void 0)}const S=P=>P.color??Mje(P);function T(P,F){const B=P.userData.colorOverride;if(F===void 0){if(!B)return;P.traverse(z=>{z instanceof Vt&&z.userData.originalMaterial&&(z.material=z.userData.originalMaterial,delete z.userData.originalMaterial)}),B.dispose(),delete P.userData.colorOverride;return}const H=B??new Io({roughness:X_});!B&&P.userData.softTerminator&&oKt(H),H.color.set(F),P.userData.colorOverride=H,P.traverse(z=>{z instanceof Vt&&(z.userData.originalMaterial||(z.userData.originalMaterial=z.material),z.material=H)})}function A(P,F,B=F.color){F.kind==="simple_figure"?Kqt(P,B):F.kind!=="group"&&F.kind!=="spotlight"&&T(P,B??Mje(F))}const C=new Map;function E(P){const H="bold 32px sans-serif",z=document.createElement("canvas"),L=z.getContext("2d");L.font=H,z.width=Math.ceil(L.measureText(P).width)+48,z.height=64,L.fillStyle="rgba(0, 0, 0, 0.55)",L.beginPath(),L.roundRect(0,0,z.width,64,64/2),L.fill(),L.font=H,L.fillStyle="#ffffff",L.textAlign="center",L.textBaseline="middle",L.fillText(P,z.width/2,64/2);const $=new lie(new mDe({map:new k4(z),depthTest:!1}));return $.scale.set(z.width/64*Tot,Tot,1),$.position.y=jP+kWr,$}function j(P,F){const B=C.get(P);B&&(F.remove(B),B.material.map?.dispose(),B.material.dispose(),C.delete(P))}function I(P,F,B){if(F.userData.nameLabelText===B||(F.userData.nameLabelText=B,j(P,F),!B))return;const H=E(B);C.set(P,H),F.add(H)}function N(){const P=n.objects.peek(),F=n.playSession.peek()?.characterId;let B=!1;for(const[H,z]of s){const L=H in P&&P[H].kind!==z.userData.kind;(!(H in P)||L)&&(B||=L,TWr(z,r,$=>$ in P),s.delete(H),e.detachIfAttached(z),c(H),Oje(z),j(H,z),T(z,void 0),Kd(z))}for(const[H,z]of Object.entries(P))if(!s.get(H)){const L=k(H,z);L.userData.objectId=H,L.userData.kind=z.kind,s.set(H,L)}for(const[H,z]of Object.entries(P)){const L=s.get(H),$=z.parentId?s.get(z.parentId)??r:r;L.parent!==$&&$.add(L),H!==F&&(L.position.set(...z.position),L.rotation.set(...z.rotation),L.scale.set(...z.scale)),_Wr(L,z.scale);const O=eKt(z);if(L.userData.glows&&!O&&L instanceof Vt)for(const W of[L.material,L.userData.originalMaterial]){const U=W;U?.emissive.setHex(0),U&&delete U.userData.glowAt}L.userData.glows=O,A(L,z),z.kind==="simple_figure"&&o$(L,z.headRotation),el(z.kind)&&I(H,L,z.name)}B&&e.reseat()}return N(),t.disposers.push(qt(()=>{n.objects.get(),N()}),qt(()=>{const P=n.colorPreview.get();if(!P)return;const F=n.objects.peek();for(const B of P.ids){const H=s.get(B),z=F[B];H&&z&&A(H,z,P.color)}})),t.disposers.push(qt(()=>{n.objects.get(),b()})),t.planningAids.push(function*(){yield*C.values();for(const[P,F]of s){const B=n.objects.peek()[P]?.kind;if((B==="camera"||B==="target")&&(yield F),B==="spotlight"){const H=tOr(F);H&&(yield H)}}}),{setPlaybackClips:P=>{d=P,b()},setRigOffsets:P=>{u=P},setLiveRigDrag:P=>{h=P},boneOf:(P,F)=>o.get(P)?.bones.get(F)??null,majorJointsOf:P=>{const F=o.get(P);return F?[...F.bones.entries()].filter(([B])=>cot(B)).map(([,B])=>B):[]},sampleClipRigOffsets:(P,F)=>{const B=o.get(P);if(!B)return null;const H=B.actions.get(F)?.getClip(),z=B.actions.get("idle")?.getClip();if(!H||!z)return null;const L={},$={};for(const[W,U]of B.bones)cot(W)&&(L[W]=Aot(z,W,U,0),$[W]=Aot(H,W,U,0));const O=fWr(L,$);return Object.keys(O).length>0?O:null},clipLocalOf:(P,F)=>o.get(P)?.clipLocal.get(F)??null,tick:P=>{m();for(const F of o.values())F.mixer.update(P);g()},finishFades:()=>{for(const P of o.values())SWr(P.actions,P.currentClip)},disposeAll:()=>{for(const P of[...o.keys()])c(P);for(const[P,F]of s)j(P,F)}}}function CWr(t){const{a:e,renderer:n,camera:r,meshById:s}=t,a=new Ge,o=()=>{const l=e.onboardHighlightId.peek(),c=l?s.get(l):void 0;if(!c){e.onboardHighlightScreenPos.peek()!==null&&e.onboardHighlightScreenPos.set(null);return}c.getWorldPosition(a).project(r);const d=a.z>=-1&&a.z<=1,u=n.domElement.getBoundingClientRect(),h=d?{x:Math.round(u.left+(a.x*.5+.5)*u.width),y:Math.round(u.top+(-a.y*.5+.5)*u.height)}:null,f=e.onboardHighlightScreenPos.peek();(f===null!=(h===null)||f&&h&&(f.x!==h.x||f.y!==h.y))&&e.onboardHighlightScreenPos.set(h)};return t.disposers.push(()=>e.onboardHighlightScreenPos.set(null)),{tick:o}}const EWr=540,jWr=.5,Lje=.05,IWr=12,MWr=new hr(6449804),NWr=new hr(.1,.11,.16),PWr=.15,cKt=4,RWr=150,FWr=.05;function dKt(t,e){let n=0,r=0,s=-1/0;return(a,o,l)=>((a!==n||o!==r)&&(n=a,r=o,s=e()),!l||e()-s>=t)}function OWr(t,e){const n=Math.min(jWr,EWr/e);return[Math.max(1,Math.round(t*n)),Math.max(1,Math.round(e*n))]}const LWr=`
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
`;function hKt(t){const e=new Kh,n=new Ahe,r=new Vt(new Mi(2,2));r.frustumCulled=!1,e.add(r);const s={tDepth:{value:null},invProjection:{value:new $r}},a=(x,w,k={})=>new rl({vertexShader:LWr,fragmentShader:x,depthTest:!1,depthWrite:!1,uniforms:{...s,...w},...k}),o=a(DWr,{texel:{value:new On},radiusUv:{value:new On}}),l=a(BWr,{tOcclusion:{value:null},direction:{value:new On}}),c=a(HWr,{tColor:{value:null},tOcclusion:{value:null},texel:{value:new On},occlusionTexel:{value:new On},fogDensity:{value:0},near:{value:.1},far:{value:500},occlusionTint:{value:MWr},edgeTint:{value:NWr}},{depthTest:!0,depthFunc:nie,depthWrite:!0});let d=null,u=null,h=null;const f=()=>{d?.depthTexture?.dispose(),d?.dispose(),u?.dispose(),h?.dispose(),d=u=h=null},m=dKt(RWr,()=>performance.now()),g=(x,w)=>{const k=!d||d.width!==x||d.height!==w;if(!m(x,w,