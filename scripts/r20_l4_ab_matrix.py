#!/usr/bin/env python3
"""r20_l4_ab_matrix.py — replicate ours.py's m5 flow, capture BOTH the old-lens render and
the wall render through bb.py's backbuffer method, diff each against the golden."""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab
import numpy as np
from PIL import Image
from bb import capture_png

OUT = "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle/out"
S = "r20l4ab"
FIX = "samples/oracle_r11/cam_path.json"
CAM = "ff46ae76-c56a-417b-8f51-7dfe5996803a"

OLD_LENS_ON = """(function(){
  const a=window.__app, d=document;
  d.querySelector('#viewSwitch button[data-v=editor]').click();
  const camIds=Object.keys(a.objects.all()).filter(k=>a.objects.all()[k].kind==='camera');
  const mesh=a.objectManager.meshById.get(camIds[0]);
  const pose=mesh.userData.evalPose;
  a._abSave={pos:a.camera.position.clone(),q:a.camera.quaternion.clone(),fov:a.camera.fov};
  a.camera.position.copy(pose.position); a.camera.quaternion.copy(pose.quaternion);
  a.camera.fov=pose.fovDeg; a.camera.updateProjectionMatrix();
  mesh.visible=false;
  return 'oldlens on';
})()"""

OLD_LENS_OFF = """(function(){
  const a=window.__app;
  const camIds=Object.keys(a.objects.all()).filter(k=>a.objects.all()[k].kind==='camera');
  const mesh=a.objectManager.meshById.get(camIds[0]);
  mesh.visible=true;
  a.camera.position.copy(a._abSave.pos); a.camera.quaternion.copy(a._abSave.q);
  a.camera.fov=a._abSave.fov; a.camera.updateProjectionMatrix();
  return 'oldlens off';
})()"""

# flow (ours.py m5): viewport -> open -> marker -> seek -> select+radio -> sleeps
ab.close(S); time.sleep(1)
ab.set_viewport(S, 1069, 716)
ab.open_url(S, f"http://localhost:3000/editor/index.html?scene={FIX}&noAutosave=1&finish=0&v=r20l4ab")
time.sleep(2.0)
r = ab.eval_js(S, "(async()=>{const a=window.__app;for(let i=0;i<30;i++){if(a&&a.light&&Math.abs(a.light.azimuthDeg-128.66)<0.01)break;await new Promise(r=>setTimeout(r,500))}return 'az ok'})()", timeout=60)
print(r)
time.sleep(2.0)
ab.eval_js(S, "(async()=>{const a=window.__app;await a.page.seek(4.0);await new Promise(r=>setTimeout(r,800));return 'ok'})()")
ab.eval_js(S, f"(function(){{const a=window.__app;a.objects.select(['{CAM}']);const b=document.querySelector('#viewSwitch button[data-v=cameras]');b.click();return 'lens on'}})()")
time.sleep(1.5)
time.sleep(1.2)

# B: the WALL capture (the current behavior)
capture_png(S, os.path.join(OUT, "ab_wall.png"), w=805, h=452)

# A: the OLD LENS capture (pose onto this.camera, wall off)
ab.eval_js(S, OLD_LENS_ON)
time.sleep(0.4)
capture_png(S, os.path.join(OUT, "ab_oldlens.png"), w=805, h=452)
ab.eval_js(S, OLD_LENS_OFF)

G = np.asarray(Image.open(os.path.join(OUT, "..", "golden", "m5_cam_path_live.png")).convert("RGB")).astype(np.float32)
for name in ["ab_oldlens", "ab_wall"]:
    X = np.asarray(Image.open(os.path.join(OUT, name + ".png")).convert("RGB")).astype(np.float32)
    D = np.abs(X - G).mean(axis=2)
    print(f"{name}: mean {D.mean():.3f}  %>8 {(D > 8).mean() * 100:.2f}")
    # hot region
    print(f"   hot rows 56-168 cols 300-500: {D[56:168, 300:500].mean():.1f}")
ab.close(S)
