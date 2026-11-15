# CRON TASK — flick-3dEditor round continuation (stateless)

This file is the canonical cron-round directive. If the user updates it, the cron job message should be refreshed to match (you have the cron tool — use it).

---

You are resuming an in-progress engineering project in a fresh sandbox. You cannot ask for clarification — everything you need is below or in the repo docs. Work FULL ownership: derive your scope from PLAN.md's backlog (best effort, largest impact first), do as much as your context allows, and leave a clean seam.

## PHASE 0 — Context restoration (do this FIRST, every round, no exceptions)
Treat any summary/recap you were handed as backdrop only. Restore from the live doc surface:
1. `cd /home/z/my-project/flick-3dEditor` — if missing: `rsync -a --delete /home/sync/flick-3dEditor/ /home/z/my-project/flick-3dEditor/`. If /home/sync is also missing/stale, re-clone from GitHub: `cd /home/z/my-project && source <(git -C flick-3dEditor 2>/dev/null; echo) ; git clone https://ariellebridget3O:${GH_PAT}@github.com/ariellebridget3O/flick-3dEditor.git` where GH_PAT comes from the repo's `.env` (split-coded: `source scripts/env.sh` after cloning via the /home/sync copy, or read `.env` and join GH_PAT_A+GH_PAT_B).
2. **CRITICAL**: `git log --oneline -3 && git status --short` — if the working tree is dirty or behind HEAD, `git checkout -- . && git reset --hard HEAD`. (A stale /home/sync working tree once caused a commit that silently deleted two rounds of work.)
3. MUST READ (in this order): `.agents/SKILL.md` (40 distilled operational lessons — read ALL of it), `CONTEXT.md` (mission, account credentials, key paths, dev loop), `HANDOFF.md` (session seam: first-10-minutes protocol + seam items), `PLAN.md` (backlog = your scope), `docs/FIDELITY.md` (per-subsystem exactness status — the last section is the latest round).
4. Check `USER-MSG` at the repo root — the user may add/update it to pass directives via git; if present it takes PRIORITY over PLAN backlog.

## PHASE 1 — Environment boot (validated sequence)
1. Dev server: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/` — if not 200: `cd /home/z/my-project && (nohup bun run dev > dev.log 2>&1 &) && sleep 5`.
2. Editor copy: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/editor/index.html` — if not 200: `bash /home/z/my-project/scripts/sync-editor.sh` (public/editor is an rsync COPY; run this after EVERY editor edit).
3. Browser: `agent-browser close` then `agent-browser open --headless --url "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>"` — a page RELOAD serves stale ES modules (cache); always close+reopen with a fresh ?v=. App global: `window.__app` (direct editor URL only; in the root iframe use `document.querySelector('iframe').contentWindow.__app`).
4. Verify boot: `agent-browser eval "JSON.stringify({booted: !!window.__app, rigs: window.__app.objectManager.humanoidRigs.size, blocks: document.querySelectorAll('[class*=blk]').length})"` + `agent-browser console | grep -ic error` → expect 0.

## PHASE 2 — Work (full ownership, derive scope from PLAN)
- The mission: byte-exact offline port of flick.art's 3D stage editor, reverse-engineered from `analysis/index-DBE17t4T.js` (13MB production bundle — the ground truth; extraction tools in scripts/, raw dumps in analysis/tmp_{a..d}/).
- Scope: PLAN.md "Round 5 backlog" (or the latest backlog section) in ranked order. Currently topped by: actions palette (M5r), cam-path height-curve editor (@5466360), through-the-lens cameras view, aspect picker UI, pixel oracle vs live site, rig posing UX, shake apply, 2D plan canvas. HANDOFF.md "Seam items" are seam-crossing concerns ONLY — do not let them shrink your round; PLAN derives your scope.
- Porting discipline: port VALUES/data-shapes from the bundle, never minified names; re-verify every constant against the raw bundle bytes at its cited offset before porting (two mis-transcriptions happened in round 5 — see SKILL #37); the three analysis/AUDIT_*.md docs are the standing divergence registry; consult before "is X exact?" questions.
- Every new feature/fix: E2E it (agent-browser + window.__app hooks — see CONTEXT.md "Editor dev loop" for the full pattern; native `mouse move x y / mouse down / mouse up` for drags; synthetic PointerEvents for modifier keys) BEFORE committing. Zero console errors is a gate.
- Before each milestone commit: sub-agent code review (Task tool, general-purpose) with the bundle offsets as spec — apply all P0/P1/P2 fixes, re-verify, then commit.
- Rendering-path work: the finish composer (SSAO/edges/soft-terminator), clay materials, shadows (sun TOr/AOr + spotlight oOr/iOr/e6r) are EXACT — any rendering change must cite bundle offsets and re-verify with pixel-level checks (readPixels / screenshot ASCII-map / on-off diffs). The pixel oracle vs live flick.art is a backlog P1 (login creds in CONTEXT.md; site reachable).

## PHASE 3 — Durability (every micro-step)
- `git add -A && git commit` with a message citing what/why/E2E evidence; `git push origin HEAD` (GitHub primary). GitLab mirror (`git push gitlab HEAD`) 403s ~1/3 of the time — background retry loop: `(nohup bash -c 'for i in 1 2 3 4 5; do sleep $((i*20)); git push gitlab HEAD 2>/dev/null && break; done' > /tmp/glpush.log 2>&1 &)`.
- After pushes: `rsync -a --delete /home/z/my-project/flick-3dEditor/ /home/sync/flick-3dEditor/`.
- Never force-push. Git IS the disk.

## PHASE 4 — Wrap-up docs (end of every round)
- PLAN.md: mark done items, refresh the backlog ranking (source: analysis/ROUND5_GAP_MATRIX.md Top-20 + new findings).
- HANDOFF.md: REWRITE for the next seam only (first-10-minutes protocol still valid? new env gotchas? seam items that cross sessions) — it is NOT a round report.
- docs/FIDELITY.md: append the round log (what was made exact, E2E evidence, remaining known divergences).
- .agents/SKILL.md: ONLY profound, future-valued lessons (the discovery rate should DECREASE over rounds — if you're adding trivia every round, stop).
- CONTEXT.md: only material project-context changes (new credentials, path changes, user directives).

## DIRECTIVE A — context-doc entropy (mandatory)
Absolutely refrain from introducing entropy into the context doc surface: no rituals, no stereotyped "this round we..." sections, no round-to-round noise. CONTEXT.md carries only material project context and user directives; PLAN.md only major roadmap changes; HANDOFF.md only session seams; NONE of these carry "what did you do" workload noise. SKILL.md gets no trivial learnings. Do not repeat anything that belongs only in workloads (commit messages, FIDELITY logs).

## DIRECTIVE B — HANDOFF framing (mandatory)
HANDOFF.md exists ONLY for session seam-crossing. Each session should do as much work as its context allows — full ownership, never minimal compliance. Derive next-session scope from PLAN.md on a best-effort basis; do NOT blindly follow HANDOFF's seam items as if they were the whole scope (that pattern makes later rounds shrink). HANDOFF tells you what MUST cross the boundary, not what to stop at.

## Credentials (all also in CONTEXT.md / .env)
- GitHub: ariellebridget3O — PAT split-coded in .env (GH_PAT_A + GH_PAT_B), reconstruct with `source scripts/env.sh`.
- GitLab: ansgareutychisC — PAT split in .env (GL_PAT_A/B). Mirror repo = flick-3dEditor-mirror.
- flick.art (live site, for the pixel oracle / re-verification only): antonialarson40@outlook.com / TR.z2q6:hQBGiUk
- Never print/store these anywhere except where they already live.
