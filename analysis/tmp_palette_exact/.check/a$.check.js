(() => {
function a$(t,e){return e==="camera"?t.kind==="camera"?t:t.kind==="path"?{kind:"camera",action:"path"}:t.kind==="object"&&t.action==="transform"?{kind:"camera",action:"transform"}:null:t.kind==="camera"?t.action==="path"?Q0(e)?{kind:"path"}:null:t.action==="transform"&&Q0(e)?{kind:"object",action:"transform"}:null:t.kind==="object"?t.action==="rig-transform"?e==="humanoid"?t:null:Q0(e)?t:null:t.kind==="path"?Q0(e)?t:null:e==="humanoid"?t:null}
});
