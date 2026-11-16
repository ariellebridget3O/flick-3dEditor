// ============================================================================
// fn: appendPathAnchor   (bundle minified: appendPathAnchor=)
// char range: 5541210..5541465   (byte range: 5557299..5557554)
// size: 255 chars / 255 bytes
// purpose: append path anchor (Y via anchorPosFor unless exactHeight), patchPathAnchors mT(smooth), select last
// params: pos, ?opts -> void
// closure/global deps (auto-derived, approximate): e, n, appendPathAnchor, mT
// ============================================================================
appendPathAnchor=(e,n)=>{const r=n?.exactHeight?e:this.anchorPosFor(e,(this.currentEditPathItem()?.anchors.length??1)-1);this.patchPathAnchors(a=>mT([...a.map(o=>o.pos),r]));const s=this.currentEditPathItem();s&&this.selectPathAnchor(s.anchors.length-1)};
