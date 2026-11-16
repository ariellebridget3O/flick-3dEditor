// ============================================================================
// fn: Z_   (bundle minified: function Z_()
// char range: 3920799..3920864   (byte range: 3924342..3924407)
// purpose: fovDeg from focal mm + aspect (2*atan(35/aspect/2/focal))
// params: focalMm, aspect -> fovDeg
// closure/global deps (auto-derived, approximate): Z_, XCe
// ============================================================================
function Z_(t,e=16/9){return 2*Math.atan(XCe(e)/2/t)*180/Math.PI}
