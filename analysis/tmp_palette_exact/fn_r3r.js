// ============================================================================
// fn: r3r   (bundle minified: function r3r()
// char range: 5067047..5067180   (byte range: 5083103..5083236)
// size: 133 chars / 133 bytes
// purpose: payload -> drop-target kind tags: cube-capable->"object", humanoid->"human", camera->"camera" (highlight bucket keys)
// params: payload -> ["object"|"human"|"camera"]
// closure/global deps (auto-derived, approximate): a$, r3r
// ============================================================================
function r3r(t){const e=[];return a$(t,"cube")?e.push("object"):a$(t,"humanoid")&&e.push("human"),a$(t,"camera")&&e.push("camera"),e}
