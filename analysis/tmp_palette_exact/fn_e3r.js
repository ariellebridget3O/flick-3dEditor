// ============================================================================
// fn: e3r   (bundle minified: function e3r()
// char range: 5065148..5065289   (byte range: 5081204..5081345)
// size: 141 chars / 141 bytes
// purpose: DRAGSTART SERIALIZER: {kind:"clip",clip}->"clip:<clip>"; {kind:"object",action}->"object:<action>"; {kind:"camera",action}->"camera:<action>"; else kind string (path/play)
// params: payload -> string
// closure/global deps (auto-derived, approximate): e3r
// ============================================================================
function e3r(t){return t.kind==="clip"?`clip:${t.clip}`:t.kind==="object"?`object:${t.action}`:t.kind==="camera"?`camera:${t.action}`:t.kind}
