// ============================================================================
// fn: yGt   (bundle minified: function yGt()
// char range: 5066856..5067047   (byte range: 5082912..5083103)
// size: 191 chars / 191 bytes
// purpose: action equality (same kind+action/clip; path vs path always equal)
// params: a, b -> bool
// closure/global deps (auto-derived, approximate): yGt
// ============================================================================
function yGt(t,e){return t.kind!==e.kind?!1:t.kind==="object"&&e.kind==="object"||t.kind==="camera"&&e.kind==="camera"?t.action===e.action:t.kind==="clip"&&e.kind==="clip"?t.clip===e.clip:!0}
