// ============================================================================
// fn: E2r   (bundle minified: function E2r()
// char range: 3926167..3926331   (byte range: 3929710..3929874)
// purpose: cubic bezier eval at t (used by nx)
// params: (p0,p1,p2,p3,t) -> vec3
// closure/global deps (auto-derived, approximate): o, l, c, d, E2r
// ============================================================================
function E2r(t,e,n,r,s){const a=1-s,o=a*a*a,l=3*a*a*s,c=3*a*s*s,d=s*s*s;return[o*t[0]+l*e[0]+c*n[0]+d*r[0],o*t[1]+l*e[1]+c*n[1]+d*r[1],o*t[2]+l*e[2]+c*n[2]+d*r[2]]}
