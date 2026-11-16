// ============================================================================
// fn: cBe   (bundle minified: function cBe()
// char range: 5484047..5484184   (byte range: 5492315..5492452)
// purpose: rotated polygon path (cos/sin yaw)
// params: ctx, center, pts, yawRad -> void
// closure/global deps (auto-derived, approximate): a, o, l, cBe
// ============================================================================
function cBe(t,e,n,r){const s=Math.cos(r),a=Math.sin(r);t.beginPath();for(const[o,l]of n)t.lineTo(e.x+o*s+l*a,e.y-o*a+l*s);t.closePath()}
