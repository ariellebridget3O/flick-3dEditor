// ============================================================================
// fn: wHr   (bundle minified: function wHr()
// char range: 5520574..5520872   (byte range: 5528842..5529140)
// purpose: anchor-aware smoothing: pins {0,last}+dwell spans, ¼-averages all other points ×2 passes; re-zeroes t to elapsed-since-start (monotone)
// params: samples, dwellSpans -> samples
// closure/global deps (auto-derived, approximate): a, l, wHr
// ============================================================================
function wHr(t,e){const n=new Set([0,t.length-1]);for(const[o,l]of e)for(let c=o;c<=l;c++)n.add(c);const r=t[0].t;let s=0,a=t.map(o=>(s=Math.max(s,o.t-r),{x:o.x,z:o.z,t:s}));for(let o=0;o<2;o++)a=a.map((l,c)=>n.has(c)?l:{x:(a[c-1].x+l.x*2+a[c+1].x)/4,z:(a[c-1].z+l.z*2+a[c+1].z)/4,t:l.t});return a}
