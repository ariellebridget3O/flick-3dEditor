// ============================================================================
// fn: ILr   (bundle minified: function ILr()
// char range: 5457063..5457208   (byte range: 5465331..5465476)
// purpose: zoom-to-fit: union footprints + TLr margin (once)
// params: state, footprints -> state
// closure/global deps (auto-derived, approximate): ILr, uqt, zIr, TLr
// ============================================================================
function ILr(t,e){if(t.fitted||t.view.widthPx===0)return t;const n=uqt(e.map(r=>r.footprint));return n?{...t,view:zIr(t.view,n,TLr),fitted:!0}:t}
