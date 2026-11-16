// ============================================================================
// fn: nGt   (bundle minified: function nGt()
// char range: 4906251..4906511   (byte range: 4909794..4910054)
// purpose: spotlight cfg normalizer
// params: cfg -> cfg|void
// closure/global deps (auto-derived, approximate): e, n, r, shape, intensity, diffusion, gie, nGt
// ============================================================================
function nGt(t){if(!t||typeof t!="object")return;const{shape:e,intensity:n,diffusion:r}=t;if(!(e!=="round"&&e!=="square")&&!(typeof n!="number"||!Number.isFinite(n))&&!(typeof r!="number"||!Number.isFinite(r)))return{shape:e,intensity:gie(n),diffusion:gie(r)}}
