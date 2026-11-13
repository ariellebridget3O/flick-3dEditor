SGr=`
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
  }`,Iot=new Ge(0,0,1);function Mot(t,e){const n=new Vt(new Mi(2,2),new rl({uniforms:e,vertexShader:SGr,fragmentShader:t,transparent:!0,depthTest:!1,depthWrite:!1,side:Fc}));return n.visible=!1,n.frustumCulled=!1,n}function CGr(t,e