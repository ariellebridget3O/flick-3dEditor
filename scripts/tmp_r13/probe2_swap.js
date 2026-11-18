(()=>{
const a=window.__app, c=a.env.clouds(), m=c.materials.cloud;
window.__cloudFragBackup=m.fragmentShader;
m.fragmentShader=[
'precision highp float;',
'precision highp sampler3D;',
'uniform highp sampler3D uShapeTex;',
'in vec3 vDirection;',
'layout(location = 0) out vec4 outColor;',
'void main(){',
'  vec3 d = normalize(vDirection);',
'  vec3 p = vec3(d.x*0.5+0.5, 0.845, d.z*0.5+0.5);',
'  vec4 s = texture(uShapeTex, p);',
'  outColor = vec4(s.rgb, 0.0);',
'}'].join('\n');
m.needsUpdate=true;
return 'swapped, backup len='+window.__cloudFragBackup.length;
})()
