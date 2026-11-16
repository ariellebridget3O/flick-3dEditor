// ============================================================================
// fn: dye   (bundle minified: function dye(t,e){const n=t.getBoundingClientRect())
// char range: 5498039..5498215   (byte range: 5506307..5506483)
// purpose: pointer event -> canvas-local px (accounts css scale clientWidth/rect.width)
// params: element, ev -> {x,y} px
// closure/global deps (auto-derived, approximate): r, s, dye, x, y
// ============================================================================
function dye(t,e){const n=t.getBoundingClientRect(),r=n.width?t.clientWidth/n.width:1,s=n.height?t.clientHeight/n.height:1;return{x:(e.clientX-n.left)*r,y:(e.clientY-n.top)*s}}
