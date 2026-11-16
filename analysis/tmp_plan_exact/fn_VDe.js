// ============================================================================
// fn: VDe   (bundle minified: function VDe()
// char range: 5247952..5248332   (byte range: 5256205..5256585)
// purpose: vertical bounds {minY,maxY} of object (group=children union, via uje heightOf)
// params: id, obj, objects -> {minY,maxY}
// closure/global deps (auto-derived, approximate): r, s, minY, maxY, Zo, uje, VDe, fie
// ============================================================================
function VDe(t,e,n){if(e.kind!=="group"){const a=Zo(e,n),o=a.position[1];return{minY:o,maxY:o+uje({...e,scale:a.scale})}}let r=1/0,s=-1/0;for(const a of Object.values(n)){if(a.parentId!==t||fie(a.kind))continue;const o=Zo(a,n);r=Math.min(r,o.position[1]),s=Math.max(s,o.position[1]+uje({...a,scale:o.scale}))}return r===1/0?{minY:e.position[1],maxY:e.position[1]}:{minY:r,maxY:s}}
