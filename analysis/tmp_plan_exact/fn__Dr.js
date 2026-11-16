// ============================================================================
// fn: _Dr   (bundle minified: function _Dr()
// char range: 5480444..5480523   (byte range: 5488712..5488791)
// purpose: grid minor-line fade alpha: clamp((ppm-8)/(24-8),0,1)
// params: pxPerM -> 0..1
// closure/global deps (auto-derived, approximate): sit, _Dr, HZt, iDr
// ============================================================================
function _Dr(t){const n=(t*HZt-sit)/(iDr-sit);return Math.min(1,Math.max(0,n))}
