// ============================================================================
// fn: mT   (bundle minified: function mT()
// char range: 3926344..3926873   (byte range: 3929887..3930416)
// purpose: anchors with tangents from points (buildTangents; non-uniform Catmull-Rom, bezier in/out at 1/3)
// params: points[[x,y,z]] -> anchors[]
// closure/global deps (auto-derived, approximate): s, u, h, f, r, a, o, m, pos, out, mT, xU
// ============================================================================
function mT(t){const e=t.length;if(e===0)return[];if(e===1)return[{pos:[...t[0]],in:[0,0,0],out:[0,0,0]}];const n=(l,c)=>Math.sqrt(xU(l,c)),r=(l,c)=>[l[0]*c,l[1]*c,l[2]*c],s=(l,c,d)=>[(l[0]-c[0])*d,(l[1]-c[1])*d,(l[2]-c[2])*d],a=(l,c)=>[l[0]+c[0],l[1]+c[1],l[2]+c[2]],o=[];for(let l=0;l<e;l++){const c=t[l-1]??t[l],d=t[l],u=t[l+1]??t[l],h=n(c,d)||1,f=n(d,u)||1,m=l===0?s(u,d,1/f):l===e-1?s(d,c,1/h):a(a(s(u,d,1/f),s(u,c,-1/(h+f))),s(d,c,1/h));o.push({pos:[...d],in:l===0?[0,0,0]:r(m,-h/3),out:l===e-1?[0,0,0]:r(m,f/3)})}return o}
