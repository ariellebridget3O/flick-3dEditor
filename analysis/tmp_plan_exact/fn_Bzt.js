// ============================================================================
// fn: Bzt   (bundle minified: function Bzt()
// char range: 3923750..3924197   (byte range: 3927293..3927740)
// purpose: transform key interpolation at t (position lerp/rotation slerp)
// params: keys, t -> pose
// closure/global deps (auto-derived, approximate): o, c, l, tA, Bzt
// ============================================================================
function Bzt(t,e){if(t.length===0)return null;const n=t[0];if(e<=n.tS||t.length===1)return{position:n.position,rotation:n.rotation,scale:n.scale};const r=t[t.length-1];if(e>=r.tS)return{position:r.position,rotation:r.rotation,scale:r.scale};let s=t.findIndex(d=>d.tS>=e);s<=0&&(s=1);const a=t[s-1],o=t[s],l=o.tS-a.tS,c=l<=0?0:(e-a.tS)/l;return{position:tA(a.position,o.position,c),rotation:tA(a.rotation,o.rotation,c),scale:tA(a.scale,o.scale,c)}}
