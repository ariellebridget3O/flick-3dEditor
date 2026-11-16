// ============================================================================
// fn: UIr   (bundle minified: function UIr()
// char range: 5251602..5251840   (byte range: 5259855..5260093)
// purpose: focal mm from horizontal half-fov; snap to yT stops when n
// params: halfRad, aspect, snap? -> focalMm
// closure/global deps (auto-derived, approximate): l, yT, UIr, hqt, Z_
// ============================================================================
function UIr(t,e,n=!1){const a=50*Math.tan(hqt(Z_(50,e),e))/Math.tan(Math.max(.001,Math.abs(t)));if(!n){const o=yT[0],l=yT[yT.length-1];return Math.round(Math.min(l,Math.max(o,a)))}return yT.reduce((o,l)=>Math.abs(l-a)<Math.abs(o-a)?l:o)}
