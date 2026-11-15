* 0.03));
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
`;function hKt(t){const e=new Kh,n=new Ahe,r=new Vt(new Mi(2,2));r.frustumCulled=!1,e.add(r);const s={tDepth:{value:null},invProjection:{value:new $r}},a=(x,w,k={})=>new rl({vertexShader:LWr,fragmentShader:x,depthTest:!1,depthWrite:!1,uniforms:{...s,...w},...k}),o=a(DWr,{texel:{value:new On},radiusUv:{value:new On}}),l=a(BWr,{tOcclusion:{value:null},direction:{value:new On}}),c=a(HWr,{tColor:{value:null},tOcclusion:{value:null},texel:{value:new On},occlusionTexel:{value:new On},fogDensity:{value:0},near:{value:.1},far:{value:500},occlusionTint:{value:MWr},edgeTint:{value:NWr}},{depthTest:!0,depthFunc:nie,depthWrite:!0});let d=null,u=null,h=null;const f=()=>{d?.depthTexture?.dispose(),d?.dispose(),u?.dispose(),h?.dispose(),d=u=h=null},m=dKt(RWr,()=>performance.now()),g=(x,w)=>{const k=!d||d.width!==x||d.height!==w;if(!m(x,w,d!==null)||!k)return;f(),d=new Wh(x,w,{type:qm,samples:Math.min(cKt,t.capabilities.maxSamples),depthTexture:new YA(x,w,V1)});const[S,T]=OWr(x,w),A={format:NR,type:qm,depthBuffer:!1,minFilter:$i,magFilter:$i};u=new Wh(S,T,A),h=new Wh(S,T,A)},b=(x,w)=>{r.material=x,t.setRenderTarget(w),t.render(e,n)},y=new On;let v=0;return{render:(x,w)=>{if(t.getDrawingBufferSize(y),y.x===0||y.y===0)return;g(y.x,y.y);const k=d,S=u,T=h;t.setRenderTarget(k),t.render(x,w),v=w.aspect,s.tDepth.value=k.depthTexture,s.invProjection.value.copy(w.projectionMatrixInverse),o.uniforms.texel.value.set(1/S.width,1/S.height);const A=w.projectionMatrix.elements;o.uniforms.radiusUv.value.set(Lje*A[0]*.5,Lje*A[5]*.5),b(o,S),l.uniforms.tOcclusion.value=S.texture,l.uniforms.direction.value.set(1/S.width,0),b(l,T),l.uniforms.tOcclusion.value=T.texture,l.uniforms.direction.value.set(0,1/S.height),b(l,S);const C=c.uniforms;C.tColor.value=k.texture,C.tOcclusion.value=S.texture,C.texel.value.set(1/k.width,1/k.height),C.occlusionTexel.value.set(1/S.width,1/S.height),C.fogDensity.value=x.fog instanceof cq?x.fog.density:0,C.near.value=w.near,C.far.value=w.far,b(c,null)},repaint:x=>!d||Math.abs(x.aspect/v-1)>FWr?!1:(b(c,null),!0),release:f,dispose:()=>{f(),o.dispose(),l.dispose(),c.dispose(),r.geometry.dispose()}}}const Cot=new WeakMap;function Dje(t){const e=Cot.get(t);if(e!==void 0)return e;const n=t.getContext();if(n.isContextLost())return!1;const r=[new Wh(4,4,{type:qm,samples:Math.min(cKt,t.capabilities.maxSamples),depthTexture:new YA(4,4,V1)}),new Wh(4,4,{format:NR,type:qm,depthBuffer:!1})],s=t.getRenderTarget(),a=r.every(o=>(t.setRenderTarget(o),n.checkFramebufferStatus(n.FRAMEBUFFER)===n.FRAMEBUFFER_COMPLETE));t.setRenderTarget(s);for(const o of r)o.depthTexture?.dispose(),o.dispose();return Cot.set(t,a),a}const $Wr=1.5,VWr=1080,UWr=4,lQ=16,zWr=150,WWr=32,GWr=.18,qWr=1e3,ZWr=500,KWr=160,XWr=10,YWr=.1,QWr=14,JWr=.45,eGr=120,tGr=.5,nGr=12,rGr=new hr("#5f7196"),sGr=new hr("#ffffff");function gBe(t,e){if(!_De.has(t.userData.kind)){t instanceof Vt&&!t.material.isMeshBasicMaterial&&e(t);for(const n of t.children)gBe(n,e)}}function aGr(t,e){if(!_De.has(t.userData.kind)){gBe(t,e);return}t.traverse(n=>{(n instanceof Vt||n instanceof Lu)&&e(n)})}const ec=new Ge,iGr=new Ge,oGr=new qn,Eot=new va;function lGr(t){Eot.setFromQuaternion(t.getWorldQuaternion(oGr),"YXZ");const e=Eot.y,n=Math.cos(e),r=Math.sin(e);let s=1/0,a=-1/0,o=1/0,l=-1/0,c=1/0,d=-1/0;const u=()=>{const m=n*ec.x-r*ec.z,g=r*ec.x+n*ec.z;s=Math.min(s,m),a=Math.max(a,m),o=Math.min(o,g),l=Math.max(l,g),c=Math.min(c,ec.y),d=Math.max(d,ec.y)};if(t.updateWorldMatrix(!0,!0),gBe(t,m=>{if(m instanceof RR){for(const b of m.skeleton.bones)ec.setFromMatrixPosition(b.matrixWorld),u();return}m.geometry.boundingBox||m.geometry.computeBoundingBox();const g=m.geometry.boundingBox;for(let b=0;b<8;b++)ec.set(b&1?g.max.x:g.min.x,b&2?g.max.y:g.min.y,b&4?g.max.z:g.min.z).applyMatrix4(m.matrixWorld),u()}),s===1/0)return null;const h=(s+a)/2,f=(o+l)/2;return{x:n*h+r*f,z:-r*h+n*f,halfX:(a-s)/2,halfZ:(l-o)/2,y:Math.max(c,0),top:d,yaw:e}}const cGr=`
  uniform vec2 uExtent;
  varying vec2 vP;
  void main() {
    vP = position.xy * uExtent;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,dGr=`
  precision highp float;
  varying vec2 vP;
  uniform vec2 uHalf;
  uniform float uRadius, uPx, uT, uReach, uFade;
  uniform vec3 uFill, uLine;
  float boxDistance(vec2 p) {
    vec2 q = abs(p) - uHalf + uRadius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  }
  float line(float d, float at, float w, float aa) {
    return 1.0 - smoothstep(w - aa, w + aa, abs(d - at));
  }
  void main() {
    float d = boxDistance(vP);
    float aa = max(fwidth(d), 1e-5);
    float band = 3.0 * uPx;
    float inset = 0.42 * (1.0 - smoothstep(-aa, aa, d));
    // A hair of shadow outside the stroke keeps it readable on a pale floor.
    float shade = max(inset, 0.22 * line(d, band + uPx, uPx, aa)) * uFade;
    float white = line(d, band * 0.5, band * 0.5, aa) * uFade;
    float wash = 0.0;
    if (uT >= 0.0 && uT < 1.0) {
      // Spreads from the middle of the object and leaves past its edge.
      float e = 1.0 - pow(1.0 - uT, 3.0);
      float x = (length(vP) - e * (length(uHalf) + uReach)) / (uReach * 0.45);
      wash = 0.72 * exp(-x * x) * pow(1.0 - uT, 1.1) * (1.0 - smoothstep(uReach * 0.7, uReach, d));
      wash *= smoothstep(0.0, 0.03, uT);
    }
    float a = clamp(shade + white + wash, 0.0, 1.0);
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
    gl_FragColor = v