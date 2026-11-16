// ============================================================================
// fn: wDe   (bundle minified: function wDe()
// char range: 4901053..4901342   (byte range: 4907984..4908273)
// size: 289 chars / 289 bytes
// purpose: Matrix4 -> TRS decompose with euler-flip normalization: s2e wraps to (-pi,pi]; tries x+PI,y=PI-z,z+PI variant when |x|+|z| smaller by 1e-9
// params: Matrix4 -> {position,rotation,scale}
// closure/global deps (auto-derived, approximate): zb, GB, qB, s2e, hie, n, wDe, position, rotation, scale
// ============================================================================
function wDe(t){t.decompose(GB,hie,qB),zb.setFromQuaternion(hie,"XYZ");const e=[s2e(zb.x+Math.PI),s2e(Math.PI-zb.y),s2e(zb.z+Math.PI)],n=Math.abs(e[0])+Math.abs(e[2])<Math.abs(zb.x)+Math.abs(zb.z)-1e-9?e:[zb.x,zb.y,zb.z];return{position:[GB.x,GB.y,GB.z],rotation:n,scale:[qB.x,qB.y,qB.z]}}
