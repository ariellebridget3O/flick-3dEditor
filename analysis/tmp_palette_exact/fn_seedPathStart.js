// ============================================================================
// fn: seedPathStart   (bundle minified: seedPathStart=)
// char range: 5539606..5539708   (byte range: 5555695..5555797)
// size: 102 chars / 102 bytes
// purpose: SEED FIRST PATH ANCHOR: appendPathAnchor([...Zo(object,objects).position]) — exact XZ+Y world position
// params: objectId -> void
// closure/global deps (auto-derived, approximate): r, seedPathStart
// ============================================================================
seedPathStart=e=>{const n=this.objects.peek(),r=n[e];r&&this.appendPathAnchor([...Zo(r,n).position])};
