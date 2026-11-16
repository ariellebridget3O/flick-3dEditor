// ============================================================================
// fn: PIr   (bundle minified: function PIr()
// char range: 5248479..5249127   (byte range: 5256732..5257380)
// purpose: height-range helper for NP (camera-height UI bounds?)
// params: (id, objects) -> ?
// closure/global deps (auto-derived, approximate): s, o, n, a, f, b, r, h, PIr, limit, zh, key
// ============================================================================
function PIr(t,e={}){const{category:n,limit:r=20}=e,s=t.trim().toLowerCase(),a=s.split(/\s+/).filter(Boolean),o=[];for(const[l,c]of Object.entries(zh)){if(n&&c.category!==n)continue;const d=typeof c.label=="string"?c.label:_._(c.label),u=new Set([...l.toLowerCase().split(/[_\s]+/),...d.toLowerCase().split(/\s+/),...c.tags.map(g=>g.toLowerCase())]),h=[...u].join(" "),f=a.reduce((g,b)=>u.has(b)?g+2:h.includes(b)?g+1:g,0);if(a.length>0&&f===0)continue;const m=s&&(l.toLowerCase().replace(/_/g," ")===s||d.toLowerCase()===s);o.push({hit:{key:l,label:d,dims:c.dims},score:f+(m?3:0)})}return o.sort((l,c)=>c.score-l.score),o.slice(0,r).map(l=>l.hit)}
