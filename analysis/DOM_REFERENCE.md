# DOM REFERENCE — flick.art 3D Stage editor UI inventory

Rendered-React-DOM snapshots (browser "save page"; attribute values serialized unquoted; base64 payloads stripped here — originals in tmp_b/):
- **A** `flick-3dStage.html` (15.6 MB) — full **Stage page** editor (extracted to `tmp_b/editor_main_dom.html`, 1890 lines)
- **B** `flick-canvas-3dView.html` (6.5 MB) — canvas/storyboard page with a **docked "Scene editor" panel** (mini 3D-stage node view + plan) (extracted to `tmp_b/plan_header.html`, `tmp_b/footer_markup.html`, `tmp_b/scene_editor_body.html`)

This is the UI spec for offline reimplementation: exact panels, buttons, sliders, class names, and inline layout constants.

---

## A. STAGE PAGE (full editor)

### Top bar (`header._topBar_l5lie_1`, inside `main._shell_1n5wr_1[style="--editor-top-inset:40px"]`)
| Element | Notes |
|---|---|
| logo link → `https://flick.art/projects?tab=home` | animated brand mark `#F9634E` |
| `span._name_1hlhm_19._nameEditable_1hlhm_25` "Flick Basi…" | editable project name, `title="Flick Basics - Beginner"` |
| "Flickpedia" button | book icon (`data-book=lean`) |
| "No style" style button | `_styleButton_1bq7y_25`, aria-label "Keep your visual consistency" |
| `nav._tabs_l5lie_21[aria-label="Editor views"]` | **Story / Canvas / 3D Stage (active, aria-current=page) / Video Editor** + sliding `_activeDot_l5lie_31` |
| Notifications bell, "Share" button, credits pill ("100"), avatar | |

### Stage header (`header._header_1bag4_47`)
- **Scene tabs** `div._sceneTabs_1baql_2`: `+ Add scene` button, scrollable tabs `Scene 1`, `Scene 2`, `Palace Stone Terrace`(active). Each tab: label button + actions **Send to canvas / Duplicate scene / Delete scene**.
- **Light button** `div._lightControl_1da1r_3` → `button "Light"` (sun icon) — opens the sun-position popover (see EDITOR_UX §6).
- **Record controls** `div._recordControls_aywtl_12`: **Rehearse** button (play icon, toggles to stop), **Record** button `._recordButton_aywtl_31[data-onboard-target="record"]` (dot icon).
- **View switches** (segmented radiogroups, `_segmented_1gwpl_133 _segmentedSliding_… _viewSwitch_aywtl_5`):
  - `Scene | Cameras` (stageView: editor/cameras)
  - `3D | 2D` (viewportMode: 3d/plan) — only when Scene view
- **Components toggle** `button._switchFold_12iau_104[data-components-toggle]` — "Show/Hide the components column".

### Workspace (`div._workspace_1bag4_105` → `div._viewportArea_1bag4_154` → `div._viewport_1bag4_154`)
**Canvas host** `div._canvasHost_1bag4_205[data-testid="stage-canvas-host"][data-onboard-target="viewport"]` containing:
- `canvas.ph-viewport-capture[data-engine="three.js r182"]` (1530×1206 in snapshot) — style carries the live cursor: `cursor:url(data:image/svg+xml,<svg width=18 height=18><circle cx=9 cy=9 r=5 fill=white stroke=#141824 stroke-opacity=.6/>) 9 9, default` (the "dot" cursor `mGr`).
- **Record-frame guide div** (child of canvas host, matches MGr/IGr): `style="position:absolute;display:none;pointer-events:none;z-index:1;border:1px solid rgba(255,255,255,0.4);box-shadow:rgba(0,0,0,0.4) 0px 0px 0px 9999px"` — shown in camera mode with left/top/width/height %.
- **Selection toolbar** `div._editToolbarAnchor_aywtl_135[style="transform:translate(490px,364px)"]` → `div._editToolbar_aywtl_102` → `div._selectionTools_aywtl_251`:
  - Move-3D `button._toolButton_1bag4_224[aria-pressed]` (icon `im-move-3d`)
  - Rotate (active in snapshot, `im-rotate`)
  - Scale-3D (`im-scale-3d`)
  - divider, Delete (`im-delete`)
  - (tooltips "Move (Z)" / "Rotate (X)" / "Scale (C)" — W/E/R in Unreal mode)
- **Right toolbar** `div._rightToolbar_aywtl_102`:
  - `div._addMenu_aywtl_268[data-onboard-target="add-menu"]` → square primary iconButton "Add" (`im-add`); hover 120 ms opens `div._addMenuList_aywtl_285[role="menu"]` with 2 items: **Add component** (node icon) / **Add action** (zap icon).
  - Lasso `aria-label="Lasso select: drag a box"` (`im-lasso`)
  - Assets (`im-images`)
  - Preferences (`im-settings`)
  - "Controls and help" (`im-help`)
- **Nav ball** `button._pad_nxaoz_3[data-onboard-target="nav-ball"][aria-label="Drag to move around the scene"][style="right:12px;top:12px;width:67px;height:67px"]`
- **PIP preview window** `div._previewWindow_aywtl_506[data-onboard-target="pip-window"][style="width:302.277px;aspect-ratio:1.77778/1;inset:395.938px auto auto 598.727px"]`:
  - `div._previewCanvasHost_aywtl_529` > live `canvas` (301×169)
  - `div._pipResize_aywtl_542` (corner resize handle)
  - `button._pipLock_aywtl_561[aria-pressed][aria-label="Lock camera view"]` (pin icon)
  - `button._pipScreenshot_aywtl_602[aria-label="Screenshot to canvas"][data-onboard-target="pip-screenshot"]` (camera icon)
  - `button._pipRecord_aywtl_628[aria-label="Record this camera"]` (video icon + `circle.im-tally` tally)
  - `button._pipPhone_aywtl_639[aria-label="Film with phone"]` (phone icon)
  - Drag body (pointerdown on window, not buttons) moves it; tap (<4 px) selects that camera; width 180–560 px, aspect = recordAspect.

### Right dock (`div._rightDock_1bag4_182` → `._dock_1bag4_165` + `._hudSurface_5hecp_10`)
1. **Actions window** `aside._hudWindow_kwh50_15._actionsWindow_1a7mk_31[data-onboard-target="actions"][style="width:260px"]`
   - title "Actions" + hide button
   - search input "Search actions"
   - tabs **Move / Animate (active) / Camera**; caption "Humans only" (Animate tab)
   - Animate tab: section **Perform** → tiles **Play** ("Drag onto a human, then play the scene like a game and record their moves"), **Rig Transform** ("Drag onto a human, then pose its joints in the scene"); section **Clips** → 46 tiles with 128×128 canvas thumbnails: Crouch Fwd, Crouch Idle, Dance, Death01, Driving, Fixing Kneeling, Hit Chest, Hit Head, Idle, Idle Talking, Idle Torch, Interact, Jog Fwd, Jump, Jump Land, Jump Start, Pickup Table, Pistol Aim Down/Neutral/Up, Pistol Idle/Reload/Shoot, Punch Cross/Enter/Jab, Push, Roll, Roll Rm, Sitting Enter/Exit/Idle/Talking, Spell Simple Enter/Exit/Idle/Shoot, Sprint, Swim Fwd, Swim Idle, Sword Attack, Sword Attack Rm, Sword Idle, Walk, Walk Formal.
   - every tile: `draggable=true`, `+ tileAdd` button ("Select an object this can act on" when nothing valid selected), `_iconThumb` colored `var(--stage-action-human)`.
2. **Properties window** `aside._hudWindow_kwh50_15._host_lpegt_15` (260 px) — `div._title "Properties - Camera"`:
   - **Name** `input._nameInput_lup43_58[placeholder="Unseen"? → Unnamed]` value=Camera
   - **Position** `_vectorRow_lup43_5` with 3 `_numberField_1gwpl_83._axisField_lup43_18`: axis label X/Y/Z (`style="cursor:ew-resize;user-select:none;touch-action:none"` — drag-to-scrub) + `input[type=text][inputmode=decimal]` (4.6 / 2.5 / 5.5)
   - **Rotation** same, degrees (0.665 / 36.53 / 2.738)
   - **Focal length** number field + unit "mm" (50) — scrub-able
   - **Aspect ratio** select (16:9) — options = `Gae`/`Zae` 16:9, 9:16, 1:1, 4:3, 1.85:1, 2.39:1
   - **Handheld shake** select (Off) — off/subtle/medium/heavy
   - **Film with phone** `button._filmWithPhone_oz3bw_13`
3. **Components column** `aside._panel_12iau_35[data-onboard-target="component-window"][style="width:280px"]` (collapsible via header switch):
   - tabs **Add Component / My Component (active)**, search "Search components"
   - `_hierarchyList_12iau_125`: rows `._hierarchyRow_12iau_165[draggable=true]` (+`._selected`), each: optional expand chevron ("Expand group"), icon (camera/box/group/person), label (Camera, raised_terrace, Timber hall, guard_left, guard_middle, guard_right…), delete button ("Delete object").

### Bottom dock (`div._dockSlot_1ablb_9` → `footer._bottomPanel_1ablb_21`)
- drag handle `._handle_1pcmd_1._top_1pcmd_30`, `div._dockRow_1ablb_59`
- **Timeline** `div._panel_109if_1[data-onboard-target="timeline"]` → `._timelineWrap_109if_201[style="--sticky-top-h:44.5px"]`:
  - sticky top: header (left: **magnet toggle** `aria-label="Snap actions to nearby edges (hold ⌘ to suspend)"` active; **take-range toggle** `aria-label="Take range: what Record films"`; right: **Tutorial** button) + ruler row (corner label "Ruler").
  - **Ruler** `._ruler_109if_111`: ticks at 0s/2s/4s/6s/8s, `left` px (146.8 px per 2 s → 73.4 px/s in snapshot); `._playheadBadge_109if_568[style="left:0px;--playhead-x:0px"]` "0.00".
  - sidebar: track headers `._trackHeader_109if_234` (name "Camera", selected state) + remove button ("Remove track"); `._addTrackButton_109if_283` "Add track".
  - lanes `._lane_109if_608[data-track-id=<uuid>]`: `button._laneAdd_109if_948[title="Add an action to this track"][style="left:367px"]` ("Add action" + plus); blocks `button._block_109if_698._blockCamera_109if_778[style="left:0px;width:367px"]` label **Still** + `._trimHandle_109if_752`. Block color classes: `_blockHuman_109if_767` / `_blockObject_109if_771` / `_blockCamera_109if_778` / `_blockPainting_109if_786` (path being drawn) / `_blockSelected_109if_802` / `_blockDragging_109if_757`. Keyframes: `._kfLayer_109if_904` + `._kfDiamond_109if_829` (active/selected variants). Drag ghost: `._ghostBlock_109if_662`, `._ghostCaret_109if_677`, `._snapGuide_109if_686`.
  - playhead `._playhead_109if_568[style="left:0px"]` > `._playheadLine_109if_599`; scroll minimap `._navTrack_109if_461` > `._navThumb_109if_473` + `_navEdgeLeft/Right_109if_488/489`.
  - path-painting edit row `._editRow_109if_884`: label + **Finish** button `._finishBtn_109if_900`.

### Right panel (chat) `section._sidePanel_1n5wr_44` → `div._sidePanel_189pm_1[data-onboard-target="chat-panel"][style="width:360px"]`
- chat header (`data-testid="chat-header"`): collapse button, chat tabs strip (`data-testid="chat-tab"` "3D Scene Recreation from Rendering", `new-chat-button`), History menu
- messages (`section[role=log]`): user message w/ context thumbnail + node chip ("Upload"); assistant messages; tool-use block "Build 3d Scene From Image" (success); suggested-action pills ("Refine the reconstruction's accuracy", "Adjust character blocking", "Fine-tune the camera angle")
- composer (`data-testid="chat-input"`): contenteditable prompt (`composer-prompt-input`) w/ animated placeholder "Brainstorm or create anything with chat · @ to reference an asset"; attach (`composer-voice-button` = record voice), reference (`composer-reference-button`), agent memory, approval-mode pill "Auto", voice submit; context media row incl. stage context chip "Camera" with remove.

### CSS variables observed
`--stage-viewfinder-bg-soft`, `--stage-viewfinder-text(-soft/-dim)`, `--stage-action-camera`, `--stage-action-human`, `--plan-*` (background, grid, grid-major, human, camera, object, light, prop, prop-edge, accent, accent-soft, panel, text, text-dim), `--editor-top-inset:40px`, `--sticky-top-h:44.5px`, `--panel-scale:0.8`, `--plan-height:368px` (scene-node panel).

---

## B. CANVAS PAGE — docked "Scene editor" panel (mini stage node)

`div._overlayLayer_10r36_48` > `div._anchor_98fbn_1[style="transform:translate(693px,333px)"]` > `div._dock_188rr_5[style="--panel-scale:0.8;--plan-height:368px"]` > `section._panel_188rr_13[aria-label="Scene editor"][data-scene-editor][data-scene-panel]`:

- **header** `._header_188rr_24`: **Add camera** button, spacer, **Zoom** group (`aria-label="Zoom"`: zoom-out `aria-label="Zoom out"`, zoom-to-fit value button "100%" `aria-label="Zoom to fit"`, zoom-in `aria-label="Zoom in"`), "How it works" (`aria-expanded`), **Open in 3D Stage** quiet button.
- **plan** `div._plan_188rr_133[data-scene-plan=true]` > `canvas._plan_1sdme_20._palette_1sdme_3[data-testid="stage-plan"][width=2078][height=736]` (CSS-var height `--plan-height`), background = captured PNG (palette base map). Overlay pills:
  - `div._pills_1cr7k_3[role="group"][aria-label="Cameras"]` — camera pills (swatch + name, `aria-pressed`)
  - `div._group_1h1uk_3` — **Draw direction** pill (feather icon), **Film with phone** pill (`data-phone-pill=true`)
  - `div._focusTip_1sdme_34[role="tooltip"]` "Tap to focus · Drag to draw"
- **footer** `footer._footer_188rr_25`:
  - `div._cameraSliders_188rr_50[aria-hidden=false]`:
    - **Height** slider: `label._slider_188rr_64` > row (span "Height" + `span._sliderValue_188rr_127` "2.4 m") + `input[type=range][min=0.2][max=12][step=0.1][value=2.4]`
    - **Lens** slider: row ("Lens" + "32 mm") + `input[type=range][min=0][max=1000][value=311]` (no step → 1; 311 → 32 mm via log interp)
  - spacer, Rehearse slot (`span._rehearseSlot_188rr_177`; `button._rehearse_188rr_157` "Rehearse" play icon; tip `span._tip_188rr_181[role="status"]`)
  - **Record Camera** `button._record_188rr_158` > `i._recordDot_188rr_252` + label (states: "Record Camera {name}" / "Recording {elapsed}s" / "Rendering…" / stop).

Slider CSS (from embedded stylesheet): track 4px rounded `var(--color-surface-highlight)`, thumb 16px round `var(--color-text)`, disabled opacity .4; slider width 240 px; cameraSliders gap 24 px.

### Canvas graph page extras (same file)
- ReactFlow canvas: `rf__node-*` nodes, sections with chip labels ("Closed group") + lock/delete buttons, `canvas-minimap` (SVG 120×82 with section/node rects + viewport rect), `zoom-control`, `toolbar-drag-handle`, `upload-file-input`.
- Scene node (400×281, selected): `article._sceneNode_sto8b_1[data-scene-editor]` — header flyout toolbar (cube icon, editable title "Palace Stone Terrace", "Remove from canvas"), body = still `img._still_sto8b_64` + `div._view_psjlb_2._tunable_psjlb_16` mini 3D view: `div._feed_psjlb_21` > canvas 400×253, four **chevron buttons** (Step left/right/up/down), `span._tag_psjlb_76` (swatch + "Camera"), `span._tuneTag_psjlb_100` "Drag to tune camera"; footer "1 camera · 5s show · 0 takes" + **Open in 3D Stage** link.

### data-testid inventory (both files)
`stage-canvas-host`, `stage-plan`, `chat-header`, `chat-tab`, `new-chat-button`, `chat-input`, `composer-prompt-input`, `composer-reference-button`, `composer-voice-button`, `toolbar-pill-approval-mode`, `toolbar-drag-handle`, `canvas-container`, `canvas-minimap`, `zoom-control`, `upload-file-input`, `rf__node-*` (ReactFlow), `section-*`/`section-label-*`, `text-node-content(-section)`.

### data-onboard-target inventory (onboarding hot-spots)
`viewport`, `record`, `add-menu`, `nav-ball`, `pip-window`, `pip-screenshot`, `timeline`, `actions`, `chat-panel`, `component-window`, `hierarchy-camera`, `dance-tile`.
