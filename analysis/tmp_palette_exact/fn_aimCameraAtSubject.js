// ============================================================================
// fn: aimCameraAtSubject   (bundle minified: aimCameraAtSubject=)
// char range: 5531472..5531839   (byte range: 5547561..5547928)
// size: 367 chars / 367 bytes
// purpose: AIM FLOW: guard !updateObjectTransform || existing camera item started before s (n.some(g=>g.startS<s&&Fp(g)&&g.kind!=="cam-still")) abort; u=subjectAimPoint(a,o); reposition target h via s$(f,c,u) iff not referenced by YN item; turnCameraToward(e,u)
// params: objectId, items, itemId, s, subjectId, dy -> void
// closure/global deps (auto-derived, approximate): u, e, n, a, d, f, r, s, o, m, aimCameraAtSubject, Fp, YN, position, s$
// ============================================================================
aimCameraAtSubject=(e,n,r,s,a,o=0)=>{if(!this.updateObjectTransform||n.some(g=>g.startS<s&&Fp(g)&&g.kind!=="cam-still"))return;const c=this.objects.peek(),d=c[e],u=this.subjectAimPoint(a,o);if(!d||!u)return;const h=d.targetId,f=h?c[h]:void 0,m=n.some(g=>g.id!==r&&YN(g));h&&f&&h!==a&&!m&&this.updateObjectTransform(h,{position:s$(f,c,u)}),this.turnCameraToward(e,u)};
