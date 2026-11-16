// ============================================================================
// fn: MDe   (bundle minified: function MDe()
// char range: 5067180..5067546   (byte range: 5083236..5083602)
// size: 366 chars / 366 bytes
// purpose: DRAGOVER/DROP PARSER (inverse of e3r): "path"->{kind:"path"}, "play"->{kind:"play"}, "clip:<id>"->{kind:"clip",clip} iff t3r.has(id), "object:<a>"->{kind:"object",action} iff QSr.has(a), "camera:<a>"->{kind:"camera",action} iff JSr.has(a), else null
// params: string -> payload|null
// closure/global deps (auto-derived, approximate): kind, action, MDe, t3r, clip, QSr, JSr
// ============================================================================
function MDe(t){if(t==="path")return{kind:"path"};if(t==="play")return{kind:"play"};if(t.startsWith("clip:")){const e=t.slice(5);if(t3r.has(e))return{kind:"clip",clip:e}}if(t.startsWith("object:")){const e=t.slice(7);if(QSr.has(e))return{kind:"object",action:e}}if(t.startsWith("camera:")){const e=t.slice(7);if(JSr.has(e))return{kind:"camera",action:e}}return null}
