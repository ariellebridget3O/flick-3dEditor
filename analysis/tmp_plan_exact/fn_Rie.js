// ============================================================================
// fn: Rie   (bundle minified: function Rie()
// char range: 5251117..5251285   (byte range: 5259370..5259538)
// purpose: footprint bbox in px (marker pad lqt=12px)
// params: fp, view -> {minX,minY,maxX,maxY} px
// closure/global deps (auto-derived, approximate): a, r, s, iu, z, Rie, dqt, lqt, minY, maxY
// ============================================================================
function Rie(t,e){const n=dqt(t),r=iu(e,{x:n.minX,z:n.minZ}),s=iu(e,{x:n.maxX,z:n.maxZ}),a=t.shape==="marker"?lqt:0;return{minX:r.x-a,minY:r.y-a,maxX:s.x+a,maxY:s.y+a}}
