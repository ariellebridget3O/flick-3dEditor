// ============================================================================
// fn: subjectAimPoint   (bundle minified: subjectAimPoint=)
// char range: 5531839..5531977   (byte range: 5547928..5548066)
// size: 138 chars / 138 bytes
// purpose: store SUBJECT AIM POINT: Zo(obj,objects).position + NP(e,objects) + n -> [x,y+h,z] (uses Zo + NP)
// params: objectId, ?dy -> point|null
// closure/global deps (auto-derived, approximate): e, s, n, subjectAimPoint, Zo, NP
// ============================================================================
subjectAimPoint=(e,n=0)=>{const r=this.objects.peek(),s=r[e];if(!s)return null;const a=Zo(s,r).position;return[a[0],a[1]+NP(e,r)+n,a[2]]};
