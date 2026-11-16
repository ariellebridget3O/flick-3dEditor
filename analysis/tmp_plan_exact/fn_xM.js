// ============================================================================
// fn: xM   (bundle minified: function xM()
// char range: 5451532..5451849   (byte range: 5459800..5460117)
// purpose: head-look solver with 70°/35° limits (used by previewPose focus)
// params: yaw, from, to -> {bodyYawRad,look}
// closure/global deps (auto-derived, approximate): c, a, o, d, s, bodyYawRad, headPitchRad, headYawRad, Gat, xM, XOr, QOr, YOr
// ============================================================================
function xM(t,e,n){const r=n[0]-e[0],s=n[1]-e[1],a=n[2]-e[2],o=Math.hypot(r,a);if(o<1e-6)return{bodyYawRad:t,headPitchRad:0,headYawRad:0};const l=Math.atan2(-r,-a),c=Gat(l-t),d=Math.sign(c)*Math.min(Math.abs(c),XOr,Math.PI-Math.abs(c));return{bodyYawRad:Gat(t+c-d),headPitchRad:QOr(Math.atan2(s,o),YOr),headYawRad:d}}
