// ============================================================================
// fn: PZt   (bundle minified: function PZt()
// char range: 5454701..5454883   (byte range: 5462969..5463151)
// purpose: wheel event -> {kind:zoom,delta} (rate .005 fine |Δ|<=20 else .02) | {kind:pan,dx,dy} (×2 deltaMode 0 else ×1)
// params: {deltaX,deltaY,deltaMode,zoom} -> intent
// closure/global deps (auto-derived, approximate): e, kind, PZt, pLr, fLr, delta, mLr, gLr, dx, dy
// ============================================================================
function PZt(t){if(t.zoom){const r=Math.abs(t.deltaY)>20?pLr:fLr;return{kind:"zoom",delta:-t.deltaY*r}}const e=t.deltaMode===0?mLr:gLr;return{kind:"pan",dx:t.deltaX*e,dy:t.deltaY*e}}
