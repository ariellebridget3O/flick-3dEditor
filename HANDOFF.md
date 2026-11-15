# HANDOFF — next session (immediate seam)

## State
Round 3 complete through commit (see git log). All 4 seam items DONE and review-audited: timeline polish (placement solver + drag/trim/diamonds/magnet/duplicate EXACT), segment inspector editors, lasso, nav ball. 3 P0 + 4 P1 + 6 P2 review fixes applied and E2E-verified (gesture depth-counting undo is the big one — brackets now nest; per-move `_commit` inside an outer begin/end no longer splits undo). Editor is served for review at **port 3000** (fullstack-dev: `/home/z/my-project` Next.js, `public/editor` SYMLINK → this repo's `editor/`, root route = full-viewport iframe; dev server auto-runs; my edits here are instantly live). Both remotes + /home/sync synced.

## First 10 minutes
1. `cd /home/z && git clone https://<GH_PAT>@github.com/ariellebridget3O/flick-3dEditor.git` (PAT split-coded in .env: `source scripts/env.sh`) — or resume /home/z/flick-3dEditor if the sandbox survived. NOTE: the port-3000 serving lives in /home/z/my-project (separate sandbox repo, commit `serve flick 3D editor on /`) — re-create if recycled: `ln -sfn /home/z/flick-3dEditor/editor /home/z/my-project/public/editor` + the iframe `src/app/page.tsx` (see that repo's git log) after running the fullstack init (`curl https://z-cdn.chatglm.cn/fullstack/init-fullstack.sh | bash`).
2. Read PLAN.md backlog + docs/FIDELITY.md round-3 log.
3. Test URLs: direct `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=N` (bump v — ES-module cache needs a fresh query), or the root `/` iframe. Dev.log at /home/z/my-project/dev.log.

## Seam items (only these)
1. **Timeline leftovers (P3s)** — duplicate-ghost guides belong in the SOURCE lane + ghost should render on alt-pointerdown (currently after the 4px threshold); diamond `title` tooltips; nav-ball drive gate in unreal control mode.
2. **Take-range tool** (She/xTr) — the "range" button next to magnet: drag on ruler → setTakeRange → locked take; raw code in analysis/tmp_b/timeline_ui_pretty.js (xTr hook `c`, `_Tr` renderer, `setTakeRange` in the show store @5787400-ish; `tie/th` helpers) + keyboard_Hzr.js has the constants region.
3. **Gizmo custom meshes (Mzr)** — raw: analysis/tmp_b/gizmo_custom_Mzr.js + gizmo_ozr.js; replaces stock TransformControls visuals (shaft/cone/circle/torus per mode, renderOrder 1000010, negative-axis picker drop).
4. If touching undo/gestures: the system is now DEPTH-COUNTED — `beginEditGesture` increments, `endEditGesture` decrements and pushes undo at depth 0. `_commit` self-brackets. Any new drag flow: wrap pointerdown→begin, pointerup/cancel→end, and add pointercancel handlers (trim/diamond already have them — copy that pattern).

## Env gotchas (round-3 additions)
- `place.js` is the solver module — if you need placement math, import from there; do NOT re-derive. `appendPlace` = W5r (no magnet) for add-menu; `planMove` = q5r for drags.
- WWr=32 is the FOOTPRINT-DRAW cap (selection.js), NOT a selection cap — store.select is unclamped (live parity).
- The lasso + nav ball visibility ride `page.changed()`; stageView flips must call `page.changed()` (viewSwitch handler does).
- agent-browser synthetic PointerEvents: real modifiers (Alt) do NOT carry — dispatch PointerEvents with `altKey:true` directly on the element (setPointerCapture is try/caught). Clicks after synthetic pointerup must ALSO be dispatched (browsers fire click after up; diamond tests need it).
- `app._tl.interaction` ('drag'|'trim') suppresses timeline re-render mid-gesture — always clear it on up AND cancel, or the timeline freezes.
- Port-3000 iframe: `window.__app` lives in the IFRAME (`document.querySelector('iframe').contentWindow.__app`); test the direct editor URL instead.
- The my-project watchdog force-checkouts every ~20s — the symlink + page.tsx are committed there; editor source changes belong in THIS repo only.
