// ============================================================================
// fn: pqt   (bundle minified: function pqt()
// char range: 5251840..5251957   (byte range: 5260093..5260210)
// purpose: lens-handle endpoints: footprint ± halfRad yaw, Ost=4.2m ahead
// params: fp, halfRad -> [{x,z},{x,z}]
// closure/global deps (auto-derived, approximate): Ost, pqt, FU
// ============================================================================
function pqt(t,e){const n=r=>{const s=FU(r);return{x:t.x+s.x*Ost,z:t.z+s.z*Ost}};return[n(t.yawRad-e),n(t.yawRad+e)]}
