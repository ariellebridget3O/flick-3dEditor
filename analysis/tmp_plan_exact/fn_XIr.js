// ============================================================================
// fn: XIr   (bundle minified: function XIr()
// char range: 5253305..5253860   (byte range: 5261558..5262113)
// purpose: QR card placement: clamp card rect inside viewport, anchored at phone pill
// params: {pill,panel,card,view} -> {x,y} px
// closure/global deps (auto-derived, approximate): s, n, r, e, a, o, x, y, l, c, g, b, f, XIr, panel, card, view, KIr
// ============================================================================
function XIr(t){const{panel:e,card:n,view:r}=t,s=KIr,a=(m,g,b)=>Math.min(Math.max(m,g),Math.max(g,b)),o=a(a(t.pill?.topPx??0,0,e.heightPx-n.heightPx),r.topPx+s,r.bottomPx-s-n.heightPx),l=m=>m>=r.leftPx+s&&m+n.widthPx<=r.rightPx-s,c=t.pill?t.pill.rightPx+s:1/0;if(l(c)&&c+n.widthPx<=e.widthPx-s)return{x:c,y:o};const d=e.widthPx+s;if(l(d))return{x:d,y:o};const u=-s-n.widthPx;if(l(u))return{x:u,y:o};const h=-s-n.heightPx,f=a(e.widthPx-n.widthPx,r.leftPx+s,r.rightPx-s-n.widthPx);return h>=r.topPx+s?{x:f,y:h}:{x:a(d,r.leftPx+s,r.rightPx-s-n.widthPx),y:o}}
