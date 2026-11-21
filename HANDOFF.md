# HANDOFF — next session (immediate seam)

## State
Round 23 COMPLETE at 08a2c4c (GitHub + GitLab + /home/sync): four refinements — (1) the HDR AUDIT (the pipeline was already true-HDR: linear HalfFloat RT → linear-thresholded bloom → ACES post-add) + EYE ADAPTATION shipped (autoexposure.js, GPU-only metering, KEY=0.95 calibrated so outdoor == manual; interiors +1 stop; night clamped ×2.5; UI checkbox default ON, Exposure relabels to bias), (2) layered clouds back on the DOME (r18 direction UV grafted onto the r13 soft atlas — shapes stay soft, projection is dome), (3) geo params solve onto the two rings as one system (seasons Spring/Summer/Autumn/Winter + NEW longitudeDeg solar-time shift + armed-explainer hint), (4) the night overbright-mesh bug FIXED (the eKt glow regex false-positived on window-named structure; structural words now kill the glow; the LIVE has the same artifact — sanctioned divergence). BUILD badge r23.

## First 10 minutes
1. Restore if needed (GitLab mirror clone; the three-shim node_modules/three is GITIGNORED — copy from /home/sync/flick-3dEditor/node_modules to the repo ROOT).
2. `bash /home/z/my-project/scripts/sync-editor.sh`; the dev server is platform-managed (init-fullstack.sh) — never manual. After a sandbox recycle kill the stale next tree (`.zscripts/dev.pid` + `ps aux | rg next`) before init.
3. Read PLAN round-22/23 + this file.
4. Boot: fresh agent-browser session, `?scene=samples/synthetic_tracks.json&noAutosave=1&v=<bump>`.
5. OPEN ITEMS: m5_cam_path 96.89% vs 97.0 (unchanged since r20); the r23 auto-exposure EV bounds (0.6/2.5) are first-pass calibration — revisit if interiors feel over/under-adapted.
6. SANCTIONED DIVERGENCES (ledgered in FIDELITY): tDr 1→3; cam-path aim 'travel'; dblclick-to-edit; the r13 cloud field (r18 sky T2/T3/T2b fail BY DESIGN); the r23 glow NOT-list; the r23 dome UV; auto-exposure (beyond-original); longitudeDeg (beyond-original). REVERSED r22: no plan re-fit on show, no centerOn on draw start.

## Env gotchas (standing + new)
- THE USER'S REVIEWS CAN BE STALE — check the r-badge first. Current badge: r23.
- THE TOOL-RESULT DISPLAY EATS BRACKET-INDEX TEXT (`[m`, `[12]`) — even byte-faithful python repr() output gets mangled in transit. NEVER diagnose "file corruption" from sed/cat/git-show output alone: run `node --check` (r23 proved a phantom: MONTH_DAYS[m - 1] displayed as MONTH_DAYS - 1] in every reader while the file was fine).
- `rg -rn` is NOT "recursive" — it's `-r n` (replace with "n")! Use plain `rg -n`.
- The finish hook passes dt=0 (legacy); autoexposure self-clocks. Any new temporal pass must do the same or take a real dt.
- Synthetic path-draw strokes need MULTI-EVAL drags; pixel matrix --bump takes an INT; r17 T5 settle-timing flakes (clean re-run passes); Chrome wedges: pkill agent-browser + chrome --type, re-run.
- r19 harness rules + the r20 wall/lens capture contract still apply.
