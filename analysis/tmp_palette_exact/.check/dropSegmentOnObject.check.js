class __Validate__ {
dropSegmentOnObject=e=>{const n=this.draggingSegment.peek();if(!n||!this.canDropSegmentOnObject(e))return null;const s=this.show.peek().tracks.find(l=>l.characterId===e)?.id??this.addPerformanceTrack(e);if(!s)return null;const a=this.show.peek().tracks.find(l=>l.id===s)?.items??[],o=this.duplicateItem(n.trackId,n.itemId,s,MP(a));return o&&(this.segmentDropTaken=!0),o};
}
