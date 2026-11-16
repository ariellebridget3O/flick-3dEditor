class __Validate__ {
appendPathAnchor=(e,n)=>{const r=n?.exactHeight?e:this.anchorPosFor(e,(this.currentEditPathItem()?.anchors.length??1)-1);this.patchPathAnchors(a=>mT([...a.map(o=>o.pos),r]));const s=this.currentEditPathItem();s&&this.selectPathAnchor(s.anchors.length-1)};
}
