// ============================================================================
// fn: resolveActionForObject   (bundle minified: resolveActionForObject=)
// char range: 5527194..5527259   (byte range: 5543283..5543348)
// size: 65 chars / 65 bytes
// purpose: a$(payload, objects[id].kind) — coerce action for a given object
// params: id, payload -> action|null
// closure/global deps (auto-derived, approximate): e, n, resolveActionForObject, a$
// ============================================================================
resolveActionForObject=(e,n)=>a$(n,this.objects.peek()[e]?.kind);
