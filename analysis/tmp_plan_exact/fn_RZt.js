// ============================================================================
// fn: RZt   (bundle minified: function RZt()
// char range: 5455050..5455477   (byte range: 5463318..5463745)
// purpose: wheel router: 150ms idle timer, scroll vs pan vs zoom(ctrl) routing to onWheel
// params: {getOrigin,onWheel} -> {handleWheel,dispose}
// closure/global deps (auto-derived, approximate): n, RZt, handleWheel, bLr, hLr, dispose
// ============================================================================
function RZt(t){let e="idle",n=null;return{handleWheel:a=>{if(n!==null&&(clearTimeout(n),n=null),e==="idle"&&(e=bLr(a.target)?"scrolling":"panning"),n=window.setTimeout(()=>{e="idle",n=null},hLr),e==="scrolling"&&!(a.ctrlKey||a.metaKey))return;const o=t.getOrigin();o&&(a.preventDefault(),t.onWheel(a.clientX-o.left,a.clientY-o.top,a.deltaX,a.deltaY,a.ctrlKey||a.metaKey,a.deltaMode))},dispose:()=>{n!==null&&clearTimeout(n)}}}
