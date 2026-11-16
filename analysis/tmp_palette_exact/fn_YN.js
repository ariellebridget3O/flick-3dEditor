// ============================================================================
// fn: YN   (bundle minified: function YN()
// char range: 4316425..4316569   (byte range: 4323356..4323500)
// size: 144 chars / 144 bytes
// purpose: item NEEDS the camera target object (subjectless): cam-move && move!=="pan_sweep" && subjectId===null || cam-path && aim==="subject" && subjectId===null (subjectlessItem)
// params: item -> bool
// closure/global deps (auto-derived, approximate): YN
// ============================================================================
function YN(t){return t.kind==="cam-move"&&t.move!=="pan_sweep"&&t.subjectId===null||t.kind==="cam-path"&&t.aim==="subject"&&t.subjectId===null}
