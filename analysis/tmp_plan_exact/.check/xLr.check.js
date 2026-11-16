(() => {
function xLr(t,e,n){const r=iu(e,t),s=Math.hypot(n.x-r.x,n.y-r.y);if(t.shape==="marker")return s<=lqt;if(s<=vLr)return!0;const a=S1(e,n),o=a.x-t.x,l=a.z-t.z,c=Math.cos(t.yawRad),d=Math.sin(t.yawRad),u=(o*c-l*d)/t.halfWidthM,h=(o*d+l*c)/t.halfDepthM;return t.shape==="rect"?Math.abs(u)<=1&&Math.abs(h)<=1:u*u+h*h<=1}
});
