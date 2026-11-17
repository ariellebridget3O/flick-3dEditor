#!/usr/bin/env python3
"""bb.py — backbuffer capture for the pixel-oracle harness.

WHY: Chrome's compositor present path freezes for the WebGL canvas once the
editor enters the through-the-lens (cameras) view under headless SwiftShader
(reproduced r11 + r12: the page screenshot keeps returning the LAST PRE-
LENS frame, byte-identical across sessions, while renderer.info.render.frame
keeps incrementing and the forced-render backbuffer holds the correct lens
image). DOM overlays still composite; the canvas texture does not update.

The backbuffer is the ground truth the renderer actually draws. With
preserveDrawingBuffer=false the buffer only survives within the JS task that
rendered it, so capture = per eval: force app.renderFrame() → readPixels N
rows → base64 → chunk out through ab.eval_js. The rest state is deterministic
(seek-pinned poses, no autoplay), so consecutive forced renders are identical.

API:
  capture_png(session, path, w=805, h=452, rows_per_eval=24)  → exact PNG
"""
import base64
import io
import time

import ab

_ROWS_HDR = """(()=>{
const a=window.__app;
a.renderFrame();
const gl=a.renderer.getContext();
const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
const row=new Uint8Array(w*4);
const out=[];
const y0=%d, y1=%d;
for(let y=y0;y<y1;y++){
  gl.readPixels(0,h-1-y,w,1,gl.RGBA,gl.UNSIGNED_BYTE,row);
  let s='';
  for(let i=0;i<w*4;i+=4){ s+=String.fromCharCode(row[i],row[i+1],row[i+2]); }
  out.push(btoa(s));
}
return out.join('|');
})()"""


def _b64_decode_rows(b64str):
    raw = base64.b64decode(b64str)
    return raw  # rgb bytes (3 per px)


def capture_png(session, path, w=805, h=452, rows_per_eval=24, timeout=120):
    """Force-render + read the backbuffer top-to-bottom, save an exact PNG."""
    from PIL import Image
    rows = []
    t0 = time.time()
    for y0 in range(0, h, rows_per_eval):
        y1 = min(y0 + rows_per_eval, h)
        r = ab.eval_js(session, _ROWS_HDR % (y0, y1), timeout=timeout)
        parts = str(r).split("|")
        for b64 in parts:
            rows.append(_b64_decode_rows(b64))
    buf = b"".join(rows)
    expect = w * h * 3
    if len(buf) != expect:
        raise RuntimeError(f"backbuffer capture size {len(buf)} != {expect}")
    img = Image.frombytes("RGB", (w, h), buf)
    img.save(path)
    return time.time() - t0
