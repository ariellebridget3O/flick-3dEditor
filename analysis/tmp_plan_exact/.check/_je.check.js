(() => {
function _je(t,e,n){const r=wZt(t,e);return r?r.kind==="cam-manual"?"manual":n!=="rotate"?"path-position":r.aim!=="locked"?"path-look":t.every(a=>!Fp(a)||a.startS>=r.startS||a.kind==="cam-still")?null:"path-anchored":null}
});
