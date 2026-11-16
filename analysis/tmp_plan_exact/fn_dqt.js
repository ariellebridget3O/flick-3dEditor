// ============================================================================
// fn: dqt   (bundle minified: function dqt()
// char range: 5250811..5251117   (byte range: 5259064..5259370)
// purpose: footprint bbox in meters (rotated extents; ellipse=hypot)
// params: fp -> {minX,minZ,maxX,maxZ}
// closure/global deps (auto-derived, approximate): n, s, a, o, dqt, minX, minZ, maxX, maxZ
// ============================================================================
function dqt(t){let e=0,n=0;if(t.shape!=="marker"){const r=Math.cos(t.yawRad),s=Math.sin(t.yawRad),a=t.halfWidthM,o=t.halfDepthM;t.shape==="rect"?(e=Math.abs(a*r)+Math.abs(o*s),n=Math.abs(a*s)+Math.abs(o*r)):(e=Math.hypot(a*r,o*s),n=Math.hypot(a*s,o*r))}return{minX:t.x-e,minZ:t.z-n,maxX:t.x+e,maxZ:t.z+n}}
