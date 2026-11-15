# HANDOFF — next session (immediate seam)

## State
Round 4 complete through commit (see git log). Take-range tool (xTr/_Tr/wTr exact), custom gizmo meshes (Mzr/Pzr/Nzr exact), and all timeline P3s DONE and review-audited (2 P1 + 5 P2 fixed). A latent P0 was found and fixed: the trim handler referenced an undefined `up` listener (gesture never ended — no undo push, interaction leak, timeline freeze). Editor serves on **port 3000**: `/home/z/my-project` Next.js, root = full-viewport iframe, editor files at `public/editor` which is now an **rsync COPY** (symlinks are blocked by current sandbox policy) synced from this repo via `my-project/scripts/sync-editor.sh` — RUN IT AFTER EVERY EDITOR EDIT, then restart the browser session (close + open; a reload alone serves stale ES modules). This repo now lives at `/home/z/my-project/flick-3dEditor` (inside the persisted project dir — survives resets; /home/z/flick-3dEditor no longer exists).

## First 10 minutes
1. Sandbox may have reset: if `/home/z/my-project/flick-3dEditor` is missing, restore it — copy `.git` from `/home/sync/flick-3dEditor/.git` (has all rounds through round 4) then `git reset --hard HEAD`; re-sync public/editor with the script above (or re-clone from GitHub: PAT split-coded in .env, `source scripts/env.sh`).
2. Verify serving: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/editor/index.html` — if the dev server died: `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. Read PLAN.md backlog + docs/FIDELITY.md round-4 log.
4. Test URL (fresh browser session each code change!): `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=N` (bump v). `window.__app` only exists on the direct editor URL — in the root iframe use `document.querySelector('iframe').contentWindow.__app`.

## Seam items (only these)
1. **Shake apply on preview** (Dzt/oEr) — constants already in const.js; camera rigs gq. Raw: search `Dzt`/`oEr` in the bundle.
2. **2D plan canvas** (SDr painter: grid fade, footprints, camera wedges, spotlight pools, marquee, draw-direction → path).
3. **Humanoid rig posing UX** (xqr joint spheres r .028, captureFocusedRigPose, Fzr multi-joint) — pairs with the existing rig-transform keyframe kind.
4. If touching gestures/undo: see round-3 note in FIDELITY — depth-counted `beginEditGesture`/`endEditGesture`; every drag flow needs up AND pointercancel cleanup and MUST clear `app._tl.interaction` on every early-return path (the round-4 P0 was exactly such a leak).

## Env gotchas (round-4 additions)
- `ln -s` and bind mounts are BLOCKED in the sandbox now — use rsync copies (`scripts/sync-editor.sh`) for serving.
- The extraction tools (scripts/*.py) are repo-relative again (patched round 4) — they read `analysis/index-DBE17t4T.js`.
- Synthetic PointerEvents need `pointerType: 'mouse'` for TransformControls hover (its onPointerHover switches on pointerType); `setPointerCapture` throws on synthetic ids — all our handlers try/catch it, stock vendor code does NOT (use agent-browser native `mouse` commands for gizmo drags).
- ES-module cache: a page RELOAD serves stale modules even with a bumped ?v= on index.html (the import URLs are unversioned) — close the browser session and reopen.
- The take-range system: state on `app._tl.rangeTool` (on/selected/drag), render via `renderTakeRange(app)` (in-place DOM updates — never innerHTML the overlay mid-drag, it holds pointer capture); store API: `show.setTakeRange(null|{startS,endS})`, `show.takeSpan(dur)`, `show.filmedARange()`; persisted at `show.range` in the v10 scene JSON.
- The gizmo: `applyCustomGizmo(tc)` in gizmo.js patches the VENDORED stock TransformControls once at Manipulator construction — gizmo visuals are custom, pickers stay stock minus negative-axis ones; hover amber comes from `tc.setColors(..., 0xFFD166)`.
- The live label text for the take-range is i18n-only (compiled catalog not in the bundle) — our English strings are semantic equivalents, not literal.
