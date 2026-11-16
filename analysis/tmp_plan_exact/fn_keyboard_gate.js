// ============================================================================
// fn: keyboard_gate   (bundle minified: &&!n.planShown.peek())
// char range: 5649676..5650368   (byte range: 5657945..5658637)
// purpose: WASD fly gate ne(): controlMode default && mode edit && !playSession && !planShown && !sceneNodeOpen
// params: -> bool
// closure/global deps (auto-derived, approximate): n, Z, Q, q, ix, NGt, te, sWr, pointerLocked, z, consumed, Y, re, le
// ============================================================================
const ne=()=>n.controlMode.peek()==="default"&&n.mode.peek()==="edit"&&n.playSession.peek()===null&&!n.planShown.peek()&&!n.sceneNodeOpen.peek(),Q=new Map,q=Ve=>{if(!ix()||Ve.repeat)return;const st=n.mode.peek();if(Ve.key==="Shift"&&Z.add("shift"),NGt(Ve)||st!=="camera"&&!te&&!ne()||st==="camera"&&!n.pageLive.peek())return;const Me=Ve.key.toLowerCase();if(Z.add(Me),Q.set(Ve.code,Me),st==="camera"){if(Me==="r"){n.toggleRecording();return}Me==="escape"&&sWr({pointerLocked:z.isLocked,consumed:Ve.defaultPrevented})&&(Ve.preventDefault(),n.exitCameraMode())}},Y=Ve=>{Z.delete(Ve.key.toLowerCase());const st=Q.get(Ve.code);st&&Z.delete(st),Ve.key==="Meta"&&Z.clear()},re=()=>{Z.clear(),le()};
