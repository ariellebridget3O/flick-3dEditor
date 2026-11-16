// ============================================================================
// fn: updateObjectTransform   (bundle minified: updateObjectTransform=)
// char range: 5265294..5265392   (byte range: 5281356..5281454)
// size: 98 chars / 98 bytes
// purpose: DEFAULT objects-store transform hook: objects[id].set({...obj,...patch}) — injected into BHr performance store via constructor
// params: id, patch -> void
// closure/global deps (auto-derived, approximate): e, updateObjectTransform
// ============================================================================
updateObjectTransform=(e,n)=>{const r=this.objects.peek()[e];r&&this.objects[e].set({...r,...n})};
