// ============================================================================
// fn: NP   (bundle minified: function NP()
// char range: 5248332..5248466   (byte range: 5264394..5264528)
// size: 134 chars / 134 bytes
// purpose: SUBJECT AIM HEIGHT OFFSET: NP(objectId, objects, margin=MIr=.7) = minY - objectY + margin*max(0,maxY-minY) via VDe+Zo
// params: objectId, objects, ?margin -> m
// closure/global deps (auto-derived, approximate): s, a, o, NP, MIr, minY, maxY, VDe, Zo
// ============================================================================
function NP(t,e,n=MIr){const r=e[t];if(!r)return 0;const{minY:s,maxY:a}=VDe(t,r,e),o=Zo(r,e).position[1];return s-o+n*Math.max(0,a-s)}
