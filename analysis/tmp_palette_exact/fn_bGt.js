// ============================================================================
// fn: bGt   (bundle minified: function bGt()
// char range: 5066021..5066787   (byte range: 5082077..5082843)
// size: 766 chars / 766 bytes
// purpose: normalize internal/legacy drag kinds to canonical payloads: rotate/revolve/scale(factor>=1?scale-up:scale-down)/transform/rig-transform/cam-still/cam-move{move}/cam-path/cam-follow/cam-transform/cam-manual
// params: payload -> payload
// closure/global deps (auto-derived, approximate): action, bGt
// ============================================================================
function bGt(t){switch(t.kind){case"path":return{kind:"path"};case"play":return{kind:"play"};case"clip":return{kind:"clip",clip:t.clip};case"rotate":return{kind:"object",action:"rotate"};case"revolve":return{kind:"object",action:"revolve"};case"scale":return{kind:"object",action:t.factor>=1?"scale-up":"scale-down"};case"transform":return{kind:"object",action:"transform"};case"rig-transform":return{kind:"object",action:"rig-transform"};case"cam-still":return{kind:"camera",action:"still"};case"cam-move":return{kind:"camera",action:t.move};case"cam-path":return{kind:"camera",action:"path"};case"cam-follow":return{kind:"camera",action:"follow"};case"cam-transform":return{kind:"camera",action:"transform"};case"cam-manual":return{kind:"camera",action:"manual"}}}
