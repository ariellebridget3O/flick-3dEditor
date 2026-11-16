// ============================================================================
// fn: consts_CZt   (bundle minified: CZt=1.6)
// char range: 5451392..5451532   (byte range: 5459660..5459800)
// purpose: CZt=1.6 walker eye height (head-look aim height in previewPose), neighbors (Wat=.4, QOr clamp, Gat wrap)
// params: —
// closure/global deps (auto-derived, approximate): e, YOr, CZt, Wat, QOr, Gat
// ============================================================================
const XOr=70*Math.PI/180,YOr=35*Math.PI/180,CZt=1.6,Wat=.4,QOr=(t,e)=>Math.max(-e,Math.min(e,t)),Gat=t=>Math.atan2(Math.sin(t),Math.cos(t));
