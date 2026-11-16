// ============================================================================
// fn: Dst   (bundle minified: function Dst()
// char range: 5250167..5250811   (byte range: 5258420..5259064)
// purpose: footprint(obj, pose): group->null; camera/target/spotlight->{shape:marker,x,z,yawRad}; humanoid->ellipse halfW=.26*sx(Fst) halfD=.26*sz; simple_figure->rect halfW=PP[0]*sx/2 halfD=PP[2]*sz/2 (.547/.390 halves); sphere/cylinder->ellipse halfW=sx/2 halfD=sz/2 (NO min clamp); prop->rect from zh[propKey].dims ?? [1,1,1] halves (NO min clamp); yawRad=i9(pose.rotation)
// params: obj, shownPose -> footprint
// closure/global deps (auto-derived, approximate): r, s, a, o, shape, x, z, yawRad, halfWidthM, halfDepthM, Fst, PP, c, d, Dst, i9, zh
// ============================================================================
function Dst(t,e){const n=e.position[0],r=e.position[2],s=i9(e.rotation),[a,,o]=e.scale;switch(t.kind){case"group":return null;case"camera":case"target":case"spotlight":return{shape:"marker",x:n,z:r,yawRad:s};case"humanoid":return{shape:"ellipse",x:n,z:r,halfWidthM:Fst*a,halfDepthM:Fst*o,yawRad:s};case"simple_figure":return{shape:"rect",x:n,z:r,halfWidthM:PP[0]*a/2,halfDepthM:PP[2]*o/2,yawRad:s};case"sphere":case"cylinder":return{shape:"ellipse",x:n,z:r,halfWidthM:a/2,halfDepthM:o/2,yawRad:s};default:{const l=t.propKey?zh[t.propKey]?.dims:void 0,[c,,d]=l??[1,1,1];return{shape:"rect",x:n,z:r,halfWidthM:c*a/2,halfDepthM:d*o/2,yawRad:s}}}}
