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