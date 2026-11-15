# HANDOFF — next session (immediate seam)

## State
Round 5 complete through commit 80d39ff (see git log for detail). All four user-reported bug classes fixed and E2E-verified (T-pose flicker, pose-not-applying, spotlight shadow, no-op menus — the no-ops were mostly the stale-tree regression, now repaired). Two audit reports landed in analysis/ (ROUND5_UI_SWEEP_A.md — all findings fixed; ROUND5_GAP_MATRIX.md — ranked Top-20 backlog). The round-5 diff was review-certified exact against the bundle (0 P0/P1 remaining).

## First 10 minutes
1. Sandbox may have reset: if `/home/z/my-project/flick-3dEditor` is missing, `rsync -a --delete /home/sync/flick-3dEditor/ /home/z/my-project/flick-3dEditor/` (backup has full history incl. round 5; verify with `git log --oneline -1`). If /home/sync is ALSO stale, re-clone from GitHub (PAT in .env, `source scripts/env.sh`).
2. Serving: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/editor/index.html` — if 404 run `bash /home/z/my-project/scripts/sync-editor.sh`; if the dev server died: `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &)`.
3. Read PLAN.md round-5 backlog + docs/FIDELITY.md round-5 log.
4. Test URL (fresh browser session per code change): `http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<N>` (bump v). `window.__app` only on the direct editor URL.
5. Check USER-MSG file at repo root (user directives via git) — if present it takes priority.

## Seam items (only these cross the session boundary)
1. Commit any uncommitted work first (git status) — the sandbox may have died mid-edit last time.
2. The pixel oracle (PLAN P1 item): live flick.art is reachable; login antonialarson40@outlook.com / TR.z2q6:hQBGiUk (CONTEXT.md). Build the harness: log in, create a minimal scene (cube + humanoid + spotlight at known TRS), screenshot both apps at matched camera, pixel-diff stats. Store harness in scripts/ + results in docs/screenshots/oracle/.
3. If touching the rig/spotlight/shadow code: the exact specs are cited in the round-5 commit messages (a55a900, 2311e71, 80d39ff) with bundle byte offsets — re-verify against analysis/index-DBE17t4T.js before changing semantics.

## Env gotchas (round-5 additions)
- `/home/sync` working-tree can be STALE relative to its own .git — after any restore, `git status` + `git reset --hard HEAD` before editing (the stale-tree accident came from editing a restored working tree without checking).
- Sub-agent browser tests MUST use `--session <name>` (isolated); the default session is shared with the main agent.
- UI-sweep-style browser sub-agents exceed max turns if scoped too broadly — split per-panel (~50 interactions each) or self-run targeted E2Es.
- agent-browser `mouse move <x> <y>` takes POSITIONAL args (not --x/--y).
- The extraction tools (scripts/*.py) are repo-relative; raw dumps in analysis/tmp_{a..d}/.
- Rest/seek semantics: PageStore.seek bumps `seekEpoch`; main.js consumes it to pose the scene at rest (same-t seeks included). Don't add page.changed()-based pose triggers (paint-exit also fires changed).
- Humanoid rig: figures.js HumanoidRig is the exact AWr port — applyClip(playback, animation) semantics (playback.timeS!==null → pinned paused; null → wall-clock; rest → paused=!playing, time=0). clipLocal is the DYNAMIC pre-offset snapshot. finishFades on rest-seek (SWr).
