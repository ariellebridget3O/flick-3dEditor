// ============================================================================
// fn: TDe   (bundle minified: function TDe()
// char range: 4906713..4906956   (byte range: 4910256..4910499)
// purpose: POOL SOLVER(pose): forward=(0,0,-1).applyEuler(rotation); null unless position.y>0 && forward.y<=-0.05; d=y/-forward.y; pool {x: pos.x+f.x*d, z: pos.z+f.z*d, radiusM: d*tan(Rhe(scale))} — NO min-radius clamp
// params: pose -> {x,z,radiusM}|null
// closure/global deps (auto-derived, approximate): n, s, a, o, TDe, Z8r, K8r, radiusM, Rhe
// ============================================================================
function TDe(t){const e=Z8r.set(0,0,-1).applyEuler(K8r.set(...t.rotation)),n=t.position[1];if(n<=0||e.y>-.05)return null;const r=n/-e.y,[s,a,o]=t.scale;return{x:t.position[0]+e.x*r,z:t.position[2]+e.z*r,radiusM:r*Math.tan(Rhe({x:s,y:a,z:o}))}}
