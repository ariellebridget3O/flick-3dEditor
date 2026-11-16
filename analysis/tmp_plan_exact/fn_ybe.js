// ============================================================================
// fn: ybe   (bundle minified: function ybe()
// char range: 3923339..3923392   (byte range: 3926882..3926935)
// purpose: wrap angle t to nearest 2π multiple around e (euler flip helper)
// params: (t,e) -> rad
// closure/global deps (auto-derived, approximate): Ntt, ybe
// ============================================================================
function ybe(t,e){return t-Math.round((t-e)/Ntt)*Ntt}
