# HANDOFF — next session (immediate seam)

## State
Round 16 COMPLETE through c21540e (GitHub + GitLab + /home/sync): component-drag family (Xqt ghost cache + VUr viewport drop + addObject/addCameraMarker/addComponent store family + drag UX from the add-grid/prop-picker) and segment-drag-to-object (store family + BUr document-pointer branch + timeline dropTaken gate). Dev server :3000 serves this tree.

## First 10 minutes
1. Restore repo if needed (rsync /home/sync -> /home/z/my-project/flick-3dEditor; git log -1 = c21540e or later; status clean).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; server at :3000 (`cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)` if dead).
3. Read PLAN.md round-16 + backlog (scope derives from PLAN, not this file).
4. Boot: `agent-browser close` + open `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>` (fresh ?v= every session — ES module cache). node_modules/three shim at the repo root may need recreation after a sandbox reset (copy editor/js/vendor/three.{module,core}.js + a package.json main:three.module.js).

## Env gotchas (still standing + new)
- SANDBOX RECYCLES WIPE UNCOMMITTED WORK — r16 lost a fully-E2E'd round mid-review and was rebuilt from conversation history. Commit BEFORE launching a review sub-agent (the review wait is the longest uncommitted window) and at every working state (extends SKILL #66).
- Evals silently fail under SwiftShader load; the agent-browser daemon wedges and CHROME THREAD EXHAUSTION (pthread_create EAGAIN) accumulates across suites — `pkill -9 -f agent-browser; pkill -9 -f chrome` + rerun (budget a recovery per 3-4 suites).
- Backbuffer capture dims VARY per session — read `renderer.domElement.width/height` before bb.capture_png.
- Full-frame same-state pixel gates need a small tolerance (intermittent ≤0.2% single-pixel transient, r15_shake T3) + magnitude-based cross-condition comparison.
- Backbuffer probes must POSE+RENDER+READ in ONE eval task; window.THREE undefined in evals (ES-module scope) — pass an object's own .position as a getWorldPosition target instead.
- Synthetic DragEvents need `new DataTransfer()` + defineProperty; dropEffect READBACK is unreliable — assert defaultPrevented / glow / store effects instead (SKILL #59).

## Seam notes (small, do not shrink the round — PLAN backlog outranks these)
- Dormant shake stride path: oEr/iEr/g2r in editor/js/shake.js are oracle-covered but unused — the cameraRig store field + rig picker (PLAN "camera-panel remainder") unlock them; wire via rigShake({rig: C.CAMERA_RIGS[rig], ...}).
- Plan-canvas component drop (dropComponentAt @5866246) extracted but unwired — dropComponentAt reads draggingComponent + facade addComponent([x,z]) + showComponentList.
- pendingPoses leak parity: live never clears entries for deleted objects — do NOT add cleanup.
- GA rotation-snap objectChange listener (@5641135) still an empty stub (r14 P3 seam); comment-offset drift in some r14/r15 headers (harmless).
