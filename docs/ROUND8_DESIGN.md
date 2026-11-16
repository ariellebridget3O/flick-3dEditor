# ROUND 8 DESIGN — Actions palette (M5r exact port) + plan gaps

Source: analysis/tmp_palette_exact/ (68 byte-verified units + MAP.md port-spec, r8_palette_extract.py).
Bundle offsets cited from MAP.md; all constants re-verified against raw bundle bytes this round (Q0 @4326312, Xu @4909267, MP @5154525, LHr @5538958, Xzt @4326720, el @4909064, SHr=90/THr=60/AHr=2/CHr=.5/Jae=4/N8=5 @5537098, addClipItem @5544717, appendActionToObject @5544148).

## R8-1 Actions palette — the live's core add-UX

### Architecture
- New module `editor/js/palette.js`: data tables + 3 tile-preview renderer classes + window UI + viewport-drop controller (BUr).
- store.js: verbatim store-method family. place.js already has bGt/a$/yGt/Art (actionOf/remapAction/sameAction/canDuplicateOnto) — reuse; add `MP` (append-at-end = maxEnd, already exported) for placeItemS.
- ui.js: requestedTab wiring on selection + timeline lane-drop handlers.
- index.html: toolbar toggle button (zap icon, "Actions"). DIVERGENCE (chrome): live opens via Add-menu→"Add action" hover item; we never ported that hover-menu chrome (round-3 decision), so the palette gets a dedicated toolbar button. Recorded as a chrome divergence, not a feature gap.

### Store methods (verbatim shapes)
- draggingAction: plain field on store + setDraggingAction/clearDraggingAction (changed() not required — drop targets poll at dragover).
- canOwnTrack(id) = !Xu(objects,id) — Xu = kind==='target' && referenced by some camera.targetId.
- resolveActionForObject(id,payload) = remapAction(payload, objects[id].kind) (place.js a$).
- canDropActionOnObject = canOwnTrack && resolveActionForObject !== null.
- addPerformanceTrack(id): gate Xzt(kind)=Q0(kind)||'camera', !Xu, no existing track → push {id:uuid, characterId, items:[]}.
- placeItemS(items, dur, atS) = atS===undefined ? MP(items) : W5r(items,dur,atS) — W5r=appendPlace; MP=maxEnd.
- addClipItem(trackId, clip, atS): humanoid gate; {kind:'clip', clip, durationS:5, startS}; selects segment. NOTE: N8=5 fixed (NOT clip real duration).
- addPlayItem: {kind:'play', durationS:0, samples:[], keymap:{}}.
- addRotateItem: {axis:'y', degPerS:90, durationS:5}; addRevolveItem: {centerObjectId:firstOtherObjectId, degPerS:60, durationS:5}; addScaleItem(factor): {factor, durationS:5} (up=2, down=.5); addTransformItem: {durationS:4, keys:[]}; addRigTransformItem: humanoid gate {durationS:4, keys/joints} — read full verbatim body at implementation.
- addCameraItem(trackId, action, atS): camera gate; LHr item shapes (still→cam-still dur5; path→cam-path speed2 aim travel subjectId; follow→cam-follow objectId:subject; transform→cam-transform dur4 keys[]; manual→cam-manual dur0 samples[]; bP→cam-move with preset fields, subjectId, direction:'ccw'); subject default = firstSubjectId() (first humanoid/figure, else first non-spotlight animatable); path→enterPathEdit+seedPathStart; non-still with subject→aimCameraAtSubject (port verbatim).
- firstOtherObjectId(trackId): first other object with Q0 kind && !spotlight.
- addActionToTrack(trackId, payload, atS): verbatim dispatch (path→addPathItem(atS), play→addPlayItem, clip→addClipItem, camera→addCameraItem, object: rotate/revolve/scale±/transform/rig-transform).
- appendActionToObject(id, payload): canDropActionOnObject gate; trackId = trackOf(id)?.id ?? addPerformanceTrack(id); addActionToTrack. Then palette closes (onActionAdded).
- addObjectItem gates: isAnimatableTrack = Q0(trackObjectKind).

### Payload model (exact)
- MIME 'application/x-stage-action'; serialize clip:<id>/object:<a>/camera:<a>/path/play (e3r); parse MDe validates against catalog sets (t3r 46 clip ids, QSr object actions, JSr camera actions); payload object ALSO stored in draggingAction.
- n3r durations for lane drops: clip 5; object transform/rig-transform 4 else 5; camera sje(action) (presets durationS; path/manual 0; else 5); path/play 0.

### Palette window (M5r DOM port)
- aside.hudWindow right side of viewport; width 260 (clamp 200–520) resizable via left-edge handle (Dhe edge:right sign:1 — drags the left edge? verify semantics at implementation: handle sits on window's left border, drag adjusts widthPx).
- Title "Actions" + close (✕). Search input placeholder "Search actions" (filters label.toLowerCase().includes). Tab strip Move/Animate/Camera; when searching shows per-tab counts and auto-switches to first non-empty tab. Caption line under tabs: move "Drag onto an object in the scene" (IT-guess), animate "Humans only" (F), camera "Cameras only" (IT-guess).
- Move tab: path tile (F5r) + 5 object tiles (E5r: rotate/revolve/scale-up/scale-down/transform). O5r canvas tiles for the 4; transform inline icon tile (sliders icon, no canvas). Payload {kind:'object',action}.
- Animate tab: Perform section (play tile + rig-transform tile — visible when selection is humanoid? k=selectedFigureName is the simple_figure switch notice; play/rig tiles: rig-transform only enabled for humanoid) + Clips section (vGt = 45 clips minus a_tpose, catalog order). Clip tiles = 128² canvas (D5r: pose at 35% duration; hover loop) + name (PU English) + add button.
- Camera tab: 13 tiles; bP moves (orbit/dolly_in/dolly_out/dolly_zoom/crane_up/crane_down/spiral/pan_sweep) = canvas tiles (y5r: KCe pose at m5r t-fractions; loop = 3s ping-pong); still/path/follow/transform/manual = icon tiles (I5r icons, fallback 'video').
- Every tile: draggable, dragstart → e3r payload + draggingAction signal + effectAllowed copy; title tooltips (a1QB8W/w2DmPr/1YVTmS IT-guesses; T91vKp/Cd1cVD exact).
- Add-button N5r on each tile: enabled = selectedId!=null && canDropActionOnObject(selectedId,payload); disabled title "Select an object this can act on" (F); click → appendActionToObject + palette closes.
- Simple-figure switch notice (animate tab, when selected is simple_figure): text IT-guess + "Switch to human" button → pickPersonKind (we have person-kind switch from round 6 A2) wrapped in gesture + undo-toast on failure.
- onActionsOpened → clearSelection. Palette collapsed by default (not persisted — live signal only).

### Viewport drop (BUr verbatim port)
- document dragover: only when dataTransfer.types includes MIME; compute candidates = ids passing canDropActionOnObject (frozen per drag via draggingAction token); apply idle glow emissive 0x3a6fd8 intensity .4 to candidate meshes.
- dragover on canvas: raycast candidates (NDC from rect, intersectObjects true, walk up userData.objectId); hovered → 0x33cc88 .9; dropEffect = hit ? 'copy' : 'none'.
- drop: preventDefault, MDe(getData(MIME)), appendActionToObject(objectId, payload), clear hover.
- dragleave/dragend: restore emissive — SAVE prior emissive per material before first write (lantern-glow pipeline owns some emissive states; restore, never zero).
- Material sharing: applyClay makes ONE material per model instance → per-object emissive safe. Primitives/per-object materials likewise.

### Tile preview renderers (verbatim class ports, one instance each)
- ClipTileRenderer (D5r): WebGLRenderer(antialias,alpha) 128², PerspCam(35,1,.1,20) at (.7,1.3,3.1)→(0,.85,0); hemi(0xffffff,0x445566,2.4)+dir(0xffffff,2)@(2,4,3); loads humanoid GLB (our C.HUMANOID_URL), $he normalize (roughness 1, M_Main→#f29a5c), rot y π, scale to 1.75, center; AnimationMixer all clips; setClip pose at IDe(clip)*.35; drawImage blit to tile canvas; hover rAF loop; pendingPoses drain on stopLoop; dispose→forceContextLoss.
- CubeTileRenderer (H5r): no asset; Box(1³) MeshStandard 0xcc8844 rough .55 metal .05; cam(2.2,1.9,3)→origin; applyPose 2.4s cycle: rotate spin y (t=B5r.rotate=.14), revolve circle r .7 (B5r=.12), scale ± triangle-wave ($rt: up +.7, down −.5; B5r=.5 stills).
- CameraTileRenderer (y5r): builds mini set (ground 60² 0x8a8a8a, 3 pillars 0xa8a8a8 heights 3/2.2/1.6, hemi 2.2 + dir@(2,5,3) ×2), humanoid idle@40%, camMovePose (our tracks.js KCe port) with start [0,1.6,4.5] target [0,1.1,0] direction 'cw' fov 40; stills at m5r fractions (orbit .28 dolly_in .75 dolly_out .75 dolly_zoom .8 crane_up .7 crane_down .7 spiral .35 pan_sweep .45); loop 3s ping-pong b5r.
- Lazy ensureLoaded/ensureRenderer; renderTo = blit into per-tile canvas ctx.

### Timeline lane drop (ui.js)
- Lane dragover: track from data-track-id; startS = px→s (reuse block-drag conversion + magnet markers); highlight lane.
- Drop: MDe parse → n3r(payload) duration → addActionToTrack(trackId, payload, startS). Ghost/caret visuals = approximation (light lane highlight + snap line); live's exact ghost spec not in extracted scope (EDITOR_UX §6 only says "at snapped start").

### CSS approximations (documented)
- Live CSS chunk unavailable — class names recorded in MAP.md §10. Our styling follows our existing HUD language (navball window style). Colors: --stage-action-object/camera/human as new CSS vars consistent with our plan-canvas palette. 128² thumbs CSS-scaled, icon thumbs 32px.

### Explicit non-goals this round
- Components column (Xqt cache, prop drag-drop, VUr/$Ur ghost drop, component MIME V6): future round — our Scene-dock add-grid covers object creation. MAP.md keeps the verbatim extraction.
- Chat panel width groups (leftDock/chat clamps) — not palette scope.

## R8-2 Height-curve editor (cam-path, plan + timeline seam)
- Source: fn_class_rDr.js (round-7 dump: heightMove/pressCurve* family) + eFr curve UI spec (C-rated). Canvas in the Action section for cam-path items (and plan-side per MAP): curve points draggable in a 2D plot (x = path arc fraction, y = height), scrub sync with playhead, double-click add point? — VERIFY against rDr verbatim before porting (SKILL #2: never trust the summary).

## R8-3 Through-the-lens cameras view
- Port draws the frame guide; "adopt evaluated camera pose" button/mapping on camera select — verify live behavior from EDITOR_UX §4 before implementing.

## R8-4 Aspect picker
- 6 presets @3920360; page.recordAspect exists — dropdown UI on the page/settings row.

## Verification plan
- E2E per feature (agent-browser + __app): open palette, tab switch, search filter, tile hover loop (rAF advancing), add via tile button (item lands on track + segment selected), drag to viewport (glow colors + drop adds action), drag to lane (item at snapped start), palette closes after add, requestedTab on selection, figure switch notice.
- Store-level asserts: LHr shapes, n3r durations, firstSubjectId/firstOtherObjectId, placeItemS MP-vs-W5r branches, rig-gate refusals, target-can't-own refusal.
- Sub-agent code review with MAP byte offsets as spec before milestone commits.
