// ============================================================================
// fn: rit   (bundle minified: function rit()
// char range: 5479570..5479681   (byte range: 5487838..5487949)
// purpose: resample keys (tS span) into eit+1(40+1) evenly spaced points
// params: keys[], fn -> pts[]
// closure/global deps (auto-derived, approximate): r, eit, a, rit, s
// ============================================================================
function rit(t,e){const n=t[0].tS,r=t[t.length-1].tS;return Array.from({length:eit+1},(s,a)=>e(n+(r-n)*a/eit))}
