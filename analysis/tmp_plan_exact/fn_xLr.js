// ============================================================================
// fn: xLr   (bundle minified: function xLr()
// char range: 5455495..5455810   (byte range: 5463763..5464078)
// purpose: point-in-footprint: marker dist<=lqt(12px); any footprint within vLr=8px slop; else world-space rotated test rect |u|<=1&&|h|<=1, ellipse u*u+h*h<=1 (NO 1.2 factor)
// params: footprint, view, px -> bool
// closure/global deps (auto-derived, approximate): u, h, s, o, l, c, d, xLr, iu, lqt, vLr, S1
// ============================================================================
function xLr(t,e,n){const r=iu(e,t),s=Math.hypot(n.x-r.x,n.y-r.y);if(t.shape==="marker")return s<=lqt;if(s<=vLr)return!0;const a=S1(e,n),o=a.x-t.x,l=a.z-t.z,c=Math.cos(t.yawRad),d=Math.sin(t.yawRad),u=(o*c-l*d)/t.halfWidthM,h=(o*d+l*c)/t.halfDepthM;return t.shape==="rect"?Math.abs(u)<=1&&Math.abs(h)<=1:u*u+h*h<=1}
