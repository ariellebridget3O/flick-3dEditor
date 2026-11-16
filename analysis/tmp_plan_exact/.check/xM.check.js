(() => {
function xM(t,e,n){const r=n[0]-e[0],s=n[1]-e[1],a=n[2]-e[2],o=Math.hypot(r,a);if(o<1e-6)return{bodyYawRad:t,headPitchRad:0,headYawRad:0};const l=Math.atan2(-r,-a),c=Gat(l-t),d=Math.sign(c)*Math.min(Math.abs(c),XOr,Math.PI-Math.abs(c));return{bodyYawRad:Gat(t+c-d),headPitchRad:QOr(Math.atan2(s,o),YOr),headYawRad:d}}
});
