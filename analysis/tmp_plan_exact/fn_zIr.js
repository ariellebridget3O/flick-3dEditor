// ============================================================================
// fn: zIr   (bundle minified: function zIr()
// char range: 5252405..5252629   (byte range: 5260658..5260882)
// purpose: fit view to bbox with margin px (TLr=48)
// params: view, bbox, margin -> view
// closure/global deps (auto-derived, approximate): s, a, zIr, centerX, centerZ, pxPerM, mqt, iqt, oqt
// ============================================================================
function zIr(t,e,n){const r=Math.max(1e-6,e.maxX-e.minX),s=Math.max(1e-6,e.maxZ-e.minZ),a=Math.min((t.widthPx-2*n)/r,(t.heightPx-2*n)/s);return{...t,centerX:(e.minX+e.maxX)/2,centerZ:(e.minZ+e.maxZ)/2,pxPerM:mqt(a,iqt,oqt)}}
