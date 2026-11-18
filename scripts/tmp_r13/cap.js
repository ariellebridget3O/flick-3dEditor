(() => {
  // generic backbuffer capture — state must be armed before this call
  const a = window.__app;
  a.renderFrame();
  const gl = a.renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const px = new Uint8Array(w*h*4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * w * 4;
    img.data.set(px.subarray(src, src + w*4), y * w * 4);
  }
  ctx.putImageData(img, 0, 0);
  window.__bbpng = cv.toDataURL('image/png');
  return 'captured ' + w + 'x' + h;
})()
