// ============================================================================
// fn: Xne   (bundle minified: function Xne()
// char range: 5138642..5138853   (byte range: 5154698..5154909)
// size: 211 chars / 211 bytes
// purpose: MAGNET SNAP to markersS within radiusS (tries marker and marker-durationS)
// params: {desiredStartS,durationS,markersS,radiusS} -> startS
// closure/global deps (auto-derived, approximate): n, Xne, O8
// ============================================================================
function Xne(t){if(t.radiusS<=0)return t.desiredStartS;let e=t.desiredStartS,n=t.radiusS+O8;for(const r of t.markersS)for(const s of[r,r-t.durationS]){const a=Math.abs(s-t.desiredStartS);a<n&&(n=a,e=s)}return e}
