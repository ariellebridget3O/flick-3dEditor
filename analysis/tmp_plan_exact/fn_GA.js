// ============================================================================
// fn: GA   (bundle minified: function GA()
// char range: 3923392..3923635   (byte range: 3926935..3927178)
// purpose: euler flip ambiguity resolver: pick euler t or (t+π, π−t, t+π) closest to e (group rotation fold)
// params: (euler, refEuler) -> euler
// closure/global deps (auto-derived, approximate): s, ybe, l, GA
// ============================================================================
function GA(t,e){const n=[t,[t[0]+Math.PI,Math.PI-t[1],t[2]+Math.PI]];let r=e,s=1/0;for(const a of n){const o=[ybe(a[0],e[0]),ybe(a[1],e[1]),ybe(a[2],e[2])],l=Math.abs(o[0]-e[0])+Math.abs(o[1]-e[1])+Math.abs(o[2]-e[2]);l<s&&(s=l,r=o)}return r}
