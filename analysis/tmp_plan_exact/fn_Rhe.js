// ============================================================================
// fn: Rhe   (bundle minified: function Rhe()
// char range: 4906562..4906685   (byte range: 4910105..4910228)
// purpose: pool half-angle rad from scale: min(55°, max(3°, 16°*avg|scale|))
// params: scale -> rad
// closure/global deps (auto-derived, approximate): Rhe, tGt, eGt, JWt
// ============================================================================
function Rhe(t){const e=(Math.abs(t.x)+Math.abs(t.y)+Math.abs(t.z))/3;return Math.min(tGt,Math.max(eGt,JWt*e))*Math.PI/180}
