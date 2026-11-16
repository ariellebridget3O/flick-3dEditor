// ============================================================================
// fn: a$   (bundle minified: function a$()
// char range: 5065574..5066021   (byte range: 5081630..5082077)
// size: 447 chars / 447 bytes
// purpose: DROP-COERCION RULE: action payload -> concrete action for object kind e ("cube"|"humanoid"|"camera"|...). camera kind: object-transform→camera-transform, path→camera-path (iff Q0(e)); humanoid: camera-path→path iff Q0, camera-transform→object transform iff Q0; rig-transform only humanoid; clips only via e==="humanoid" tail
// params: payload, kind -> action|null
// closure/global deps (auto-derived, approximate): Q0, a$
// ============================================================================
function a$(t,e){return e==="camera"?t.kind==="camera"?t:t.kind==="path"?{kind:"camera",action:"path"}:t.kind==="object"&&t.action==="transform"?{kind:"camera",action:"transform"}:null:t.kind==="camera"?t.action==="path"?Q0(e)?{kind:"path"}:null:t.action==="transform"&&Q0(e)?{kind:"object",action:"transform"}:null:t.kind==="object"?t.action==="rig-transform"?e==="humanoid"?t:null:Q0(e)?t:null:t.kind==="path"?Q0(e)?t:null:e==="humanoid"?t:null}
