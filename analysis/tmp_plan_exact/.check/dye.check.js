(() => {
function dye(t,e){const n=t.getBoundingClientRect(),r=n.width?t.clientWidth/n.width:1,s=n.height?t.clientHeight/n.height:1;return{x:(e.clientX-n.left)*r,y:(e.clientY-n.top)*s}}
});
