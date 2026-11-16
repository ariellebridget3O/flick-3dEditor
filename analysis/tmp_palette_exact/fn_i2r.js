// ============================================================================
// fn: i2r   (bundle minified: function i2r()
// char range: 3919052..3919105   (byte range: 3925983..3926036)
// size: 53 chars / 53 bytes
// purpose: fov clamp 10..120 deg (dolly_zoom guard)
// params: deg -> deg
// closure/global deps (auto-derived, approximate): i2r, a2r, s2r
// ============================================================================
function i2r(t){return Math.min(a2r,Math.max(s2r,t))}
