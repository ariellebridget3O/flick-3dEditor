// ============================================================================
// fn: n3r   (bundle minified: function n3r()
// char range: 5065325..5065477   (byte range: 5081381..5081533)
// size: 152 chars / 152 bytes
// purpose: DEFAULT DURATION when dropped on a timeline lane: clip->N8(5s); object->transform|rig-transform?Jae(4s):N8(5s); camera->sje(action); else 0
// params: payload -> seconds
// closure/global deps (auto-derived, approximate): N8, n3r, Jae, sje
// ============================================================================
function n3r(t){return t.kind==="clip"?N8:t.kind==="object"?t.action==="transform"||t.action==="rig-transform"?Jae:N8:t.kind==="camera"?sje(t.action):0}
