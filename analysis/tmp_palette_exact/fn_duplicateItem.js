// ============================================================================
// fn: duplicateItem   (bundle minified: duplicateItem=)
// char range: 5548018..5548375   (byte range: 5564107..5564464)
// size: 357 chars / 357 bytes
// purpose: clone item into target track at startS (new id via an(), DHr strips stale refs, Art guard)
// params: fromTrackId, itemId, toTrackId, startS -> id|null
// closure/global deps (auto-derived, approximate): o, r, e, n, s, d, duplicateItem, Art, an, DHr, startS
// ============================================================================
duplicateItem=(e,n,r,s)=>{const a=this.show.peek(),o=a.tracks.find(u=>u.id===e)?.items.find(u=>u.id===n);if(!o)return null;const l=a.tracks.find(u=>u.id===r);if(!l||!Art(o,this.objects.peek()[l.characterId]?.kind))return null;const c=an(),d=DHr({...structuredClone(o),id:c,startS:Math.max(0,s)},l.characterId);return this.updateTrackItems(r,u=>[...u,d]),c};
