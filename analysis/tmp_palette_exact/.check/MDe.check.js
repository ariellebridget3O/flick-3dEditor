(() => {
function MDe(t){if(t==="path")return{kind:"path"};if(t==="play")return{kind:"play"};if(t.startsWith("clip:")){const e=t.slice(5);if(t3r.has(e))return{kind:"clip",clip:e}}if(t.startsWith("object:")){const e=t.slice(7);if(QSr.has(e))return{kind:"object",action:e}}if(t.startsWith("camera:")){const e=t.slice(7);if(JSr.has(e))return{kind:"camera",action:e}}return null}
});
