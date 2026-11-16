// ============================================================================
// fn: aqt   (bundle minified: function aqt()
// char range: 5249334..5249506   (byte range: 5257587..5257759)
// purpose: label contrast color: parse #rrggbb, luma(.2126/.7152/.0722)>.72(HIr) ? #1c0f09(BIr) : #ffffff(Pst)
// params: hexColorStr -> "#1c0f09"|"#ffffff"
// closure/global deps (auto-derived, approximate): Pst, r, s, aqt, HIr, BIr
// ============================================================================
function aqt(t){const e=Number.parseInt(t.slice(1,7),16);if(Number.isNaN(e))return Pst;const n=e>>16&255,r=e>>8&255,s=e&255;return(.2126*n+.7152*r+.0722*s)/255>HIr?BIr:Pst}
