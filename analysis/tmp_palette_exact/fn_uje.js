// ============================================================================
// fn: uje   (bundle minified: function uje()
// char range: 5247757..5247952   (byte range: 5263819..5264014)
// size: 195 chars / 195 bytes
// purpose: object height units: humanoid jP*scaleY; prop dims[1]*scaleY; target/spotlight 0; else scaleY
// params: object -> m
// closure/global deps (auto-derived, approximate): uje, el, jP, zh
// ============================================================================
function uje(t){if(el(t.kind))return jP*t.scale[1];const e=t.kind==="prop"&&t.propKey?zh[t.propKey]:void 0;return e?(e.dims[1]||1)*t.scale[1]:t.kind==="target"||t.kind==="spotlight"?0:t.scale[1]}
