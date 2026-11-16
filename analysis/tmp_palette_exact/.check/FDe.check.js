(() => {
function FDe({tabs:t,active:e,fit:n="fill",onTabClick:r}){return i.jsx("div",{className:Ze(Zr.tabs,n==="hug"&&Zr.tabsHug),children:t.map(s=>i.jsxs("button",{className:Ze(Zr.tab,s.key===e&&Zr.active),"aria-pressed":s.key===e,"data-onboard-target":s.onboardTarget,onClick:()=>r(s.key),children:[i.jsx("span",{className:Zr.tabLabel,children:s.label}),s.count!==void 0&&i.jsx("span",{className:Zr.tabCount,children:s.count})]},s.key))})}
});
