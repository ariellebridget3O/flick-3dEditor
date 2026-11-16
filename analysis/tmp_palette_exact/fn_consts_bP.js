// ============================================================================
// fn: consts_bP   (bundle minified: const bP=)
// char range: 3918154..3918983   (byte range: 3925085..3925914)
// size: 829 chars / 829 bytes
// purpose: CINEMATIC CAMERA MOVES: bP=[orbit,dolly_in,dolly_out,dolly_zoom,crane_up,crane_down,spiral,pan_sweep]; YLe orbit-class; QLe vertical class; JLe dolly class; yP=bP minus pan_sweep; _1 presets {durationS,angleDeg,heightDeltaUnits,distanceScale}; s2r=10 a2r=120 fov clamp
// params: -> consts
// closure/global deps (auto-derived, approximate): durationS, angleDeg, heightDeltaUnits, distanceScale, YLe, QLe, JLe, yP, _1, orbit, dolly_in, dolly_out, dolly_zoom, crane_up, crane_down, spiral, pan_sweep, s2r, a2r
// ============================================================================
const bP=["orbit","dolly_in","dolly_out","dolly_zoom","crane_up","crane_down","spiral","pan_sweep"],YLe=["orbit","spiral","pan_sweep"],QLe=["crane_up","crane_down","spiral"],JLe=["dolly_in","dolly_out","dolly_zoom"],yP=bP.filter(t=>t!=="pan_sweep"),_1={orbit:{durationS:8,angleDeg:360,heightDeltaUnits:0,distanceScale:1},dolly_in:{durationS:4,angleDeg:0,heightDeltaUnits:0,distanceScale:.5},dolly_out:{durationS:5,angleDeg:0,heightDeltaUnits:0,distanceScale:2},dolly_zoom:{durationS:4,angleDeg:0,heightDeltaUnits:0,distanceScale:.5},crane_up:{durationS:5,angleDeg:0,heightDeltaUnits:3,distanceScale:1},crane_down:{durationS:5,angleDeg:0,heightDeltaUnits:3,distanceScale:1},spiral:{durationS:8,angleDeg:180,heightDeltaUnits:3,distanceScale:1},pan_sweep:{durationS:6,angleDeg:90,heightDeltaUnits:0,distanceScale:1}},s2r=10,a2r=120;
