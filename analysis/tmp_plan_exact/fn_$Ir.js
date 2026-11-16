// ============================================================================
// fn: $Ir   (bundle minified: function $Ir()
// char range: 5249525..5249885   (byte range: 5257778..5258138)
// purpose: edge indicators: cameras offscreen -> clamp to 22px margins along center ray; {id,tag,x,y,angleRad}[]
// params: items, view -> indicators[]
// closure/global deps (auto-derived, approximate): r, c, s, d, Rst, $Ir, iu, angleRad
// ============================================================================
function $Ir(t,e){const n=e.widthPx/2,r=e.heightPx/2,s=[];for(const a of t){if(a.kind!=="camera")continue;const o=iu(e,a.footprint);if(o.x>=0&&o.x<=e.widthPx&&o.y>=0&&o.y<=e.heightPx)continue;const l=o.x-n,c=o.y-r,d=Math.min((n-Rst)/Math.abs(l||1e-6),(r-Rst)/Math.abs(c||1e-6));s.push({id:a.id,tag:a.tag??"",x:n+l*d,y:r+c*d,angleRad:Math.atan2(c,l)})}return s}
