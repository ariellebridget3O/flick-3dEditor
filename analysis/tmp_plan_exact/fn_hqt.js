// ============================================================================
// fn: hqt   (bundle minified: function hqt()
// char range: 5251540..5251602   (byte range: 5259793..5259855)
// purpose: horizontal half-fov rad from vertical fovDeg + aspect: atan(tan(fov/2)*aspect)
// params: fovDeg, aspect -> halfRad
// closure/global deps (auto-derived, approximate): hqt
// ============================================================================
function hqt(t,e){return Math.atan(Math.tan(t*Math.PI/360)*e)}
