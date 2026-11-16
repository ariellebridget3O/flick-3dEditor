// ============================================================================
// fn: wire_BHr_ctor   (bundle minified: this.updateObjectTransform=a)
// char range: 5524027..5525186   (byte range: 5540116..5541275)
// size: 1159 chars / 1159 bytes
// purpose: BHr performance-store constructor body: receives (objects, editInteraction, recording, isPreviewPlaying, updateObjectTransform) and keeps it on this — verbatim constructor-body slice
// params: -> slice
// closure/global deps (auto-derived, approximate): qt, s, e, n, r, a, ym
// ============================================================================
this.objects=e,this.editInteraction=n,this.recording=r,this.updateObjectTransform=a,this.disposers.push(qt(()=>{this.editInteraction.get()!=="editingPath"&&this.finishPerformancePaint()})),this.disposers.push(qt(()=>{this.recording.get()!==null&&(this.isPerformancePlaying.set(!1),this.playSession.set(null))})),this.disposers.push(qt(()=>{const o=this.playSession.get();o&&(this.show.get(),this.findPlayItem(o)||this.playSession.set(null))})),this.disposers.push(qt(()=>{const o=this.selectedSegment.get();if(!o)return;this.show.get();const l=this.findItem(o);if(!l){this.selectedSegment.set(null);return}const c="keys"in l&&l.keys.some(d=>Math.abs(d.tS-o.tS)<=ym);o.tS!=null&&!c&&this.selectedSegment.set({trackId:o.trackId,itemId:o.itemId})})),this.disposers.push(qt(()=>{const o=this.selectedTrack.get();if(!o)return;this.show.get().tracks.some(c=>c.id===o.trackId)||this.selectedTrack.set(null)})),this.disposers.push(qt(()=>{const o=this.playSession.get();o&&this.selectedSegment.get()?.itemId!==o.itemId&&this.stopPlaySession()})),s&&this.disposers.push(qt(()=>{s.get()?this.playPerformance():this.isPerformancePlaying.peek()&&this.stopPerformance()}))
