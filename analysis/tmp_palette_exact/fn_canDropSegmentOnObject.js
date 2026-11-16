// ============================================================================
// fn: canDropSegmentOnObject   (bundle minified: canDropSegmentOnObject=)
// char range: 5547519..5547647   (byte range: 5563608..5563736)
// size: 128 chars / 128 bytes
// purpose: segment drag -> object: draggedSegment() && canOwnTrack(id) && Art(segment, objects[id]?.kind)
// params: objectId -> bool
// closure/global deps (auto-derived, approximate): canDropSegmentOnObject, Art
// ============================================================================
canDropSegmentOnObject=e=>{const n=this.draggedSegment();return!n||!this.canOwnTrack(e)?!1:Art(n,this.objects.peek()[e]?.kind)};
