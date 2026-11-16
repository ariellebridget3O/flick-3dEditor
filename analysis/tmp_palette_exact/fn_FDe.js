// ============================================================================
// fn: FDe   (bundle minified: function FDe()
// char range: 5071222..5071655   (byte range: 5087278..5087711)
// size: 433 chars / 433 bytes
// purpose: tab strip: buttons aria-pressed, fit "fill"|"hug", optional count badge, data-onboard-target
// params: {tabs,active,fit,onTabClick} -> jsx
// closure/global deps (auto-derived, approximate): Zr, i, className, children, e, t, n, r, Ze, FDe, fit, onTabClick, onClick
// ============================================================================
function FDe({tabs:t,active:e,fit:n="fill",onTabClick:r}){return i.jsx("div",{className:Ze(Zr.tabs,n==="hug"&&Zr.tabsHug),children:t.map(s=>i.jsxs("button",{className:Ze(Zr.tab,s.key===e&&Zr.active),"aria-pressed":s.key===e,"data-onboard-target":s.onboardTarget,onClick:()=>r(s.key),children:[i.jsx("span",{className:Zr.tabLabel,children:s.label}),s.count!==void 0&&i.jsx("span",{className:Zr.tabCount,children:s.count})]},s.key))})}
