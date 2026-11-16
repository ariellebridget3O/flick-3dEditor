// ============================================================================
// fn: turnCameraToward   (bundle minified: turnCameraToward=)
// char range: 5531977..5532187   (byte range: 5548066..5548276)
// size: 210 chars / 210 bytes
// purpose: camera rotation validation: cN(obj,objects,{...Zo(obj),rotation:kv(pos,target)}).rotation -> updateObjectTransform(id,{rotation}) (uses cN + kv + Zo)
// params: objectId, target -> void
// closure/global deps (auto-derived, approximate): s, e, n, turnCameraToward, Zo, cN, kv
// ============================================================================
turnCameraToward=(e,n)=>{const r=this.objects.peek(),s=r[e];if(!s||!this.updateObjectTransform)return;const a=Zo(s,r);this.updateObjectTransform(e,{rotation:cN(s,r,{...a,rotation:kv(a.position,n)}).rotation})};
