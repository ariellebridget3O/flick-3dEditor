(()=>{
const a=window.__app, c=a.env.clouds(), m=c.materials.cloud;
m.fragmentShader=window.__cloudFragBackup;
m.needsUpdate=true;
return 'restored';
})()
