// ============================================================================
// fn: BZt   (bundle minified: function BZt()
// char range: 5480029..5480195   (byte range: 5488297..5488463)
// purpose: read palette from computed style + fontFamily
// params: element -> palette
// closure/global deps (auto-derived, approximate): r, s, BZt, aDr
// ============================================================================
function BZt(t){const e=getComputedStyle(t);return{...Object.fromEntries(Object.entries(aDr).map(([r,s])=>[r,e.getPropertyValue(s).trim()])),fontFamily:e.fontFamily}}
