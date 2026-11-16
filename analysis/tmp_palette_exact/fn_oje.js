// ============================================================================
// fn: oje   (bundle minified: function oje()
// char range: 5138534..5138642   (byte range: 5154590..5154698)
// size: 108 chars / 108 bytes
// purpose: span overlap test with O8 eps
// params: a, b -> bool
// closure/global deps (auto-derived, approximate): O8, oje
// ============================================================================
function oje(t,e){return t.endS-t.startS<=O8||e.endS-e.startS<=O8?!1:t.startS<e.endS-O8&&e.startS<t.endS-O8}
