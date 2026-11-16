(() => {
function PZt(t){if(t.zoom){const r=Math.abs(t.deltaY)>20?pLr:fLr;return{kind:"zoom",delta:-t.deltaY*r}}const e=t.deltaMode===0?mLr:gLr;return{kind:"pan",dx:t.deltaX*e,dy:t.deltaY*e}}
});
