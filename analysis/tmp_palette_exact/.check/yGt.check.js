(() => {
function yGt(t,e){return t.kind!==e.kind?!1:t.kind==="object"&&e.kind==="object"||t.kind==="camera"&&e.kind==="camera"?t.action===e.action:t.kind==="clip"&&e.kind==="clip"?t.clip===e.clip:!0}
});
