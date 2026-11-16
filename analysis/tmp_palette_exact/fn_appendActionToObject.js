// ============================================================================
// fn: appendActionToObject   (bundle minified: appendActionToObject=)
// char range: 5528059..5528254   (byte range: 5544148..5544343)
// size: 195 chars / 195 bytes
// purpose: THE ADD-ACTION FLOW: guard canDropActionOnObject; find existing track by characterId ?? addPerformanceTrack(id); addActionToTrack(trackId, payload)
// params: id, payload -> void
// closure/global deps (auto-derived, approximate): e, n, appendActionToObject
// ============================================================================
appendActionToObject=(e,n)=>{if(!this.canDropActionOnObject(e,n))return;const s=this.show.peek().tracks.find(a=>a.characterId===e)?.id??this.addPerformanceTrack(e);s&&this.addActionToTrack(s,n)};
