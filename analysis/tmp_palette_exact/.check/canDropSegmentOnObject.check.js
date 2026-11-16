class __Validate__ {
canDropSegmentOnObject=e=>{const n=this.draggedSegment();return!n||!this.canOwnTrack(e)?!1:Art(n,this.objects.peek()[e]?.kind)};
}
