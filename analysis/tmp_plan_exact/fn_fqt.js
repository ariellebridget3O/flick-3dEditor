// ============================================================================
// fn: fqt   (bundle minified: function fqt()
// char range: 5252256..5252405   (byte range: 5260509..5260658)
// purpose: zoom view at anchor px keeping world point under cursor; clamps ppm via mqt(14..170)
// params: view, anchorPx, factor -> view
// closure/global deps (auto-derived, approximate): s, fqt, S1, mqt, iqt, oqt, centerX, centerZ
// ============================================================================
function fqt(t,e,n){const r=S1(t,e),s=mqt(t.pxPerM*n,iqt,oqt);return{...t,pxPerM:s,centerX:r.x-(e.x-t.widthPx/2)/s,centerZ:r.z-(e.y-t.heightPx/2)/s}}
