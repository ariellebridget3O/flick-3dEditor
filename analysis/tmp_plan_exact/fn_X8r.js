// ============================================================================
// fn: X8r   (bundle minified: function X8r()
// char range: 4907025..4907099   (byte range: 4910568..4910642)
// purpose: inverse: scale vector from half-angle deg
// params: deg -> [x,y,z]
// closure/global deps (auto-derived, approximate): X8r, tGt, eGt, JWt
// ============================================================================
function X8r(t){const n=Math.min(tGt,Math.max(eGt,t/2))/JWt;return[n,n,n]}
