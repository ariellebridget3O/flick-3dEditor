// ============================================================================
// fn: dropSegmentOnObject   (bundle minified: dropSegmentOnObject=)
// char range: 5547647..5548018   (byte range: 5563736..5564107)
// size: 371 chars / 371 bytes
// purpose: drop existing segment onto object: target track (by characterId ?? addPerformanceTrack), duplicateItem into it at MP(items); sets segmentDropTaken=true
// params: objectId -> itemId|null
// closure/global deps (auto-derived, approximate): o, dropSegmentOnObject, MP
// ============================================================================
dropSegmentOnObject=e=>{const n=this.draggingSegment.peek();if(!n||!this.canDropSegmentOnObject(e))return null;const s=this.show.peek().tracks.find(l=>l.characterId===e)?.id??this.addPerformanceTrack(e);if(!s)return null;const a=this.show.peek().tracks.find(l=>l.id===s)?.items??[],o=this.duplicateItem(n.trackId,n.itemId,s,MP(a));return o&&(this.segmentDropTaken=!0),o};
