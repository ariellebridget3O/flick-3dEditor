// ============================================================================
// fn: $Lr   (bundle minified: function $Lr()
// char range: 5462125..5462302   (byte range: 5470393..5470570)
// purpose: finalize: drain pending intents from state
// params: state -> {state,intents}
// closure/global deps (auto-derived, approximate): n, $Lr, state, intents, type
// ============================================================================
function $Lr(t){const e=t.drag,n=!!e&&e.kind!=="marquee"&&e.kind!=="stroke"&&e.kind!=="tap-or-draw"&&e.last!==null;return{state:{...t,drag:null},intents:n?[{type:"commit"}]:[]}}
