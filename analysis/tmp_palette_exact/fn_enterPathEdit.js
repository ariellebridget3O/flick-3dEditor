// ============================================================================
// fn: enterPathEdit   (bundle minified: enterPathEdit=)
// char range: 5539708..5539886   (byte range: 5555797..5555975)
// size: 178 chars / 178 bytes
// purpose: ENTER PATH EDIT MODE: selectedSegment.set({trackId,itemId}) + performancePaint.set({trackId,itemId,selectedAnchor:null}) + editInteraction.set("editingPath")
// params: trackId, itemId -> void
// closure/global deps (auto-derived, approximate): e, n, trackId, itemId, enterPathEdit, selectedAnchor
// ============================================================================
enterPathEdit=(e,n)=>{this.selectedSegment.set({trackId:e,itemId:n}),this.performancePaint.set({trackId:e,itemId:n,selectedAnchor:null}),this.editInteraction.set("editingPath")};
