// ============================================================================
// fn: u5r   (bundle minified: function u5r()
// char range: 5116712..5117163   (byte range: 5132768..5133219)
// size: 451 chars / 451 bytes
// purpose: mannequin fallback builder (capsule torso+head+arms+legs, color Phe)
// params: -> Group
// closure/global deps (auto-derived, approximate): e, n, Vt, a, jU, d, u, u5r, Ci, Io, color, Phe, roughness, X_, Ku
// ============================================================================
function u5r(){const t=new Ci,e=new Io({color:Phe,roughness:X_}),n=new Vt(new jU(.18,.5,4,12),e);n.position.y=1.15,t.add(n);const r=new Vt(new Ku(.13,16,12),e);r.position.y=1.62,t.add(r);const s=(d,u)=>new Vt(new jU(d,u,4,8),e),a=s(.055,.55);a.position.set(-.27,1.15,0),t.add(a);const o=s(.055,.55);o.position.set(.27,1.15,0),t.add(o);const l=s(.07,.65);l.position.set(-.1,.42,0),t.add(l);const c=s(.07,.65);return c.position.set(.1,.42,0),t.add(c),t}
