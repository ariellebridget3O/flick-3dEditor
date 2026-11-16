// ============================================================================
// fn: NP   (bundle minified: function NP()
// char range: 5248332..5248466   (byte range: 5256585..5256719)
// purpose: aim height above object origin: minY-origin + MIr*(maxY-minY) (head-ish aim point)
// params: id, objects, frac=MIr -> heightM
// closure/global deps (auto-derived, approximate): s, a, o, NP, MIr, minY, maxY, VDe, Zo
// ============================================================================
function NP(t,e,n=MIr){const r=e[t];if(!r)return 0;const{minY:s,maxY:a}=VDe(t,r,e),o=Zo(r,e).position[1];return s-o+n*Math.max(0,a-s)}
