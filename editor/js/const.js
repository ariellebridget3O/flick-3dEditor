// const.js — every runtime constant extracted from the live bundle (index-DBE17t4T.js).
// Policy [A:F23]: semantic names; minified id in comment; values are byte-exact (decimals kept
// as-is where the bundle uses them because THREE.Color(number) is hex-semantics on ints).

// r21 L2 (bumped r22): the editor BUILD STAMP — shown as a badge in the stage header; a
// mismatch with localStorage 'flickBuild' toasts "updated, hard-reload if the UI looks old"
// on boot. This exists because round-21 forensics proved the user reviewed a STALE TAB
// (every r20 fix verified live). The badge makes freshness checkable by eye.
// r22: view auto-fit removals (plan re-fit on show [r7 divergence] + draw-start centerOn
// [r21 L3a divergence]) — the ORIGINAL does neither.
export const BUILD = 'r22';
export const C = {
  // ---------- viewport / renderer (COr, fZt) ----------
  EDITOR_FOV: 50,            // FP
  NEAR: 0.1,                 // Khe
  FAR: 500,                  // RP
  CAM_START: [6, 5, 8],      // COr camera.position.set
  ORBIT_TARGET: [0, 1, 0],   // Dqr orbit.target.set
  ROTATE_SPEED: 0.75,        // Lqr
  SHADOW_MAP_PX: 3072,       // Fqr (min with maxTextureSize)
  WHEEL_ZOOM_K: 0.0036,      // wot exp(deltaY*k)
  ZOOM_MIN: 0.5,             // _ot
  FREELOOK_RAD_PER_PX: 0.0022, // xot
  FOCUS_DURATION: 0.3,       // UUr ease-in-out-cubic
  FOCUS_DISTANCE_K: 1.5,     // distance = k*radius/sin(min(fovY,fovX)/2)
  FOCUS_DISTANCE_MIN: 1.2,
  CLICK_SLOP_PX: 8,          // Sye
  DBLCLICK_MS: 350,          // uWr
  DBLCLICK_PX: 14,           // hWr

  // ---------- floor / sky / fog (wOr, xOr, pZt) ----------
  FLOOR_SIZE: 80000,         // $Y
  FLOOR_SEGS: 128,           // Fat
  FLOOR_COLOR: 13948377,     // lOr = 0xD4D5D9
  FLOOR_ROUGHNESS: 0.9,
  FOG_FAR_CAP: 20000,        // hZt
  FOG_K: 1.25,               // wFr (SFr)
  FAR_FALLBACK: 500,         // RP / Tat
  NEAR_CAP_K: 0.5,           // EFr (CFr)
  BOUNDS_INTERVAL_MS: 400,   // _Fr
  HYSTERESIS: 1.1,           // Sat
  NEAR_MIN: 0.1,             // Khe
  FAR_DENSITY_K: 2.5,        // IFr
  FOG_DENSITY_NUM: 0.715,    // MFr
  FOG_D1: 120,               // NFr
  FOG_D2: 1.5,               // PFr
  FOG_D3: 3,                 // RFr
  BOUNDS_EXCLUDE_KINDS: ['camera', 'target', 'group'], // jFr (from the boxes list)

  // ---------- daylight (HY, DFr, $Fr, M8r, SDe) ----------
  DAYLIGHT_FULL_DAY: { // DFr — hex: zenith 0xDFE5F0, horizon 0xE8EBF0, fillSky 0xE6EBFB, fillGround 0xD0D1DA, sunColor 0xFFF7EE
    zenith: 14673392, horizon: 15264752, fillSky: 15133691, fillGround: 13685210,
    fill: 1.7, sunColor: 16775150, sun: 2.15, glow: 0, flare: 0,
  },
  DUSK_SUN: 16747092,        // Aat (stops -8 and -2 sunColor)
  DAYLIGHT_STOPS: [          // HY — 7 stops; last spreads DFr (hex per stop: zenith/horizon/fillSky/fillGround/sunColor)
    { elevationDeg: -30, zenith: 329487,   horizon: 725280,   fillSky: 4149120,  fillGround: 1185311, fill: 0.50, sunColor: 11847925, sun: 0.55, glow: 1.00, flare: 0.00 },
    { elevationDeg: -16, zenith: 857648,   horizon: 2635358,  fillSky: 5335213,  fillGround: 1909299, fill: 0.80, sunColor: 11124204, sun: 0.30, glow: 1.00, flare: 0.00 },
    { elevationDeg: -8,  zenith: 1845064,  horizon: 9072524,  fillSky: 7568564,  fillGround: 3485759, fill: 0.95, sunColor: 16747092, sun: 0.00, glow: 0.80, flare: 0.30 },
    { elevationDeg: -2,  zenith: 3820152,  horizon: 14719100, fillSky: 9409220,  fillGround: 6245460, fill: 1.15, sunColor: 16747092, sun: 0.75, glow: 0.35, flare: 0.55 },
    { elevationDeg: 5,   zenith: 9677260,  horizon: 16240038, fillSky: 13616862, fillGround: 12098180, fill: 1.45, sunColor: 16755044, sun: 3.60, glow: 0.00, flare: 0.60 },
    { elevationDeg: 16,  zenith: 14082028, horizon: 15918550, fillSky: 14541038, fillGround: 13287346, fill: 1.55, sunColor: 16768180, sun: 2.70, glow: 0.00, flare: 0.12 },
    { elevationDeg: 32,  zenith: 14673392, horizon: 15264752, fillSky: 15133691, fillGround: 13685210, fill: 1.70, sunColor: 16775150, sun: 2.15, glow: 0.00, flare: 0.00 },
  ],
  ELEV_MIN: -30,             // fq
  ELEV_MAX: 90,              // QA
  EL_REMAP_EDGE: -8,         // GWt
  EL_REMAP_MIN: 5,           // A8r
  EL_REMAP_K: 25,            // C8r
  LIGHT_DEFAULT: { azimuthDeg: 128.66, elevationDeg: 57.38 }, // kDe — migrated scenes keep mode:'custom'
  // round 6 (D): geographic defaults (NEVER auto-applied to existing scenes — audit P0-3)
  LIGHT_GEO_DEFAULTS: { timeOfDay: 9.5, dayOfYear: 166, latitudeDeg: 45, longitudeDeg: 0, altitudeM: 300, northOffsetDeg: 0 },
  // round 6 (D5): weather modifiers — clear = IDENTITY (audit P0-2). sun/hemi/flare multiply the
  // daylight-table outputs; fog multiplies the pZt density (inside createFogNearFar — audit P0-4);
  // desat = lerp→Rec.601 luma on zenith/horizon/fillSky/fillGround/fog-color; darken multiplies sky.
  WEATHER: {
    clear:    { sun: 1.0,  hemi: 1.0,  fog: 1.0,  flare: 1.0,  desat: 0.00, darken: 0.00 },
    cloudy:   { sun: 0.55, hemi: 1.15, fog: 1.15, flare: 0.30, desat: 0.10, darken: 0.00 },
    overcast: { sun: 0.25, hemi: 1.4,  fog: 1.4,  flare: 0.10, desat: 0.25, darken: 0.05 },
    rain:     { sun: 0.15, hemi: 1.2,  fog: 2.0,  flare: 0.08, desat: 0.30, darken: 0.15 },
    fog:      { sun: 0.30, hemi: 1.1,  fog: 3.5,  flare: 0.00, desat: 0.35, darken: 0.10 },
  },
  FOG_DENSITY_CAP: 0.05,      // round 6 (audit P0-4): density clamp — visibility ≈ 20 m
  // round 10 (skybox P1): realistic sky dome (sebh/UnrealEngineSkyAtmosphere port — values from
  // the MIT reference demo; analysis/tmp_skybox/NOTES.md). Post curve 1-exp(-c/wp*e).
  SKY_EXPOSURE: 10.0,
  SKY_WHITE_POINT: [1.08241, 0.96756, 0.95003],
  // skyStyle: 'classic' (flick DAYLIGHT_STOPS dome, byte-identical default) | 'realistic'
  SKY_STYLES: ['classic', 'realistic'],
  // round 13 (P2): cloud layer — realistic-sky feature (classic stays byte-identical).
  // r21 revert: the r13 coverage coupling — the USER coverage is authoritative; weather
  // modulates ±30% max in env.js's realistic branch ONLY. (The r18 anchor table
  // CLOUD_COVERAGE_BY_WEATHER + CLOUD_COVERAGE_FLOOR went with the blob rework it fed.)
  CLOUD_COV_FACTOR: { clear: 0.85, cloudy: 1.15, overcast: 1.3, rain: 1.35, fog: 1.2 },
  CLOUD_WEATHER_DARKEN: { clear: 0.0, cloudy: 0.0, overcast: 0.16, rain: 0.50, fog: 0.40 },   // r18 (kept): color coupling, shape-neutral
  CLOUD_COVERAGE_DEFAULT: 0.45,          // schema light.clouds.coverage default
  CLOUD_MODES: ['layered'],              // r18: procedural removed (unusably slow)
  // (r13 CLOUD_BUDGET_MS removed r18 — the budget auto-gate went with the procedural tier)
  // round 13 (HDR): tone mapping + bloom (editor/js/bloom.js — UnrealBloomPass recipe port).
  // BLOOM_MIPS: the mip-chain depth (bright pass + 5 h/v blur levels, starting at ½ res).
  BLOOM_MIPS: 5,
  HDR_BLOOM_STRENGTH_K: 1.2,             // strength = light.hdr.bloom × 1.2 (design-of-record)
  HDR_BUDGET_MS: 11,                     // = COST_BUDGET_MS reuse: the finish auto-measure
                                         // already gates the whole composite — bloom rides
                                         // inside it (no new scheduler)
  // R13_HDR_RESEARCH §4.5/§4.6 (HDR-only contrast multipliers — the "more obvious
  // light/shadow" ask; applied in env.applyDaylight, never touching DAYLIGHT_STOPS):
  HDR_DEFAULTS: { exposure: 1.0, bloom: 0.35, bloomThreshold: 1.0, bloomRadius: 0.4, shadowBoost: 0.5 },
  HDR_SHADOW_BOOST_SUN_K: 1.6,           // sunBoostK = 1 + 1.6·shadowBoost  (0.5 → ×1.8)
  HDR_SHADOW_BOOST_FILL_K: 0.30,         // fillK     = 1 − 0.30·shadowBoost (0.5 → ×0.85, hemi + ambient)
  HDR_SHADOW_BOOST_RADIUS_K: 0.75,       // sun.shadow.radius = C.SUN_RADIUS × (1 + 0.75·shadowBoost)
  HDR_EMISSIVE_BOOST: 4,                 // lantern glow ×4 — night lamps cross the bloom threshold
  // r19 (user feedback recalibration — supersedes the r18 whole-sky lift): HDR = range +
  // bloom on TRUE highlights + ACES flatten, NOT a blanket sky lift. The sky BODY sits just
  // BELOW the bloom threshold (worst classic horizon luma 0.828 x 1.06 = 0.878 < 1.0) so the
  // general sky does NOT bloom; the TRUE highlights do: sun disc (30xT), MOON disc core
  // (3.2, r19 L3), the classic sun FLARE region (x1.8 below — the glow around the sun),
  // night lamps (EMISSIVE_BOOST). The 1.06 is mild ACES scale-keeping (the displayed sky is
  // ~6-10% deeper under HDR than SDR — the visible HDR-ness the feedback asked for, NOT a
  // brightness match; do not chase display parity with a bigger lift — that re-creates the
  // r18 whole-sky bloom). Gated hdr && finishOn (the plain+HDR fallback has no ACES).
  HDR_SKY_LIFT: 1.06,
  // r20 L1: the classic dome BODY's own HDR gain (on top of the lift; the fog keeps the lift
  // only). Structural reason: the dome horizon == fog color by construction, so a shared lift
  // crosses the fog first and washes the whole frame (the r18 'blindly bright' / r19 'no sky
  // bloom' pendulum — both were the same cliff). The dome-only gain lets the SKY cross the
  // bloom threshold softly while the fogged ground stays below. Byte-inert at 1 (x*1.0).
  HDR_CLASSIC_BODY_GAIN: 1.20,
  // r19 L4: the classic dome's FLARE (sun glow) term only — puts the region right around the
  // sun ABOVE the bloom threshold (peak body 0.88 + flare ~1.0 = ~1.9) so the sun glows
  // naturally while the far sky stays quiet. Same hdr && finishOn gate as the body lift.
  HDR_CLASSIC_FLARE_LIFT: 1.8,
  // r18 (feedback #1): the realistic-sky PMREM IBL is a PURE ADDITION on the unchanged hemi —
  // switching classic<->realistic moved interiors by mean|d| 8.5-10.4/255 (p95 23). Scaling the
  // IBL term (scene.environmentIntensity) is a PROPORTIONAL correction — delta_new = k x delta_old
  // at every elevation/weather/indoor state (audit P0-3); 0.30 takes the measured 8.95 -> ~2.7.
  SKY_IBL_INTENSITY: 0.30,
  // r19 L2/L3: the moon tone SHARED by the visible disc (sky.js GLSL literal — keep in sync)
  // and the night key-light color lerp (env.js MOON_TONE). 0.86/0.88/0.95 linear.
  MOON_TONE: 0xdbe0f2,
  HDR_REALISTIC_GAIN: 80.0,              // r20 L1: BODY-SAMPLE-only gain (the raw sky-view LUT
                                         // radiance is illuminance-normalized ~0.006-0.03 — the plain
                                         // path's demo curve amplifies ~10x; under finish the body needs
                                         // ~80x to sit at display scale AND cross the bloom threshold
                                         // SOFTLY: sky-region +6.0 display, p25 +1.2, no lid (p99 234).
                                         // The sun disc/moon/stars are ABSOLUTE and do NOT ride this.
                                         // luma ~0.76-0.81 x 1.22 = 0.93-0.99 < 1.0; verified in
                                         // the display domain — r19 E2E T6b: body bloom delta +0.00
                                         // at thr 1.0, p95 display luma 203). The sun disc (30xT)
                                         // and the moon core (3.2) still tower over the threshold.
  HDR_CLASSIC_SKY_LIFT_LEGACY: 1.10,     // (kept for reference; superseded by HDR_SKY_LIFT)
                                         // sky (≤1.15 linear) survives ACES at exposure 1 (§4.6)
  // sun presets (TQr/AQr light popover) — ELEVATION ONLY, azimuth preserved (audit P1-13: the
  // azimuthDeg fields here are IGNORED; live _Qr sets elevation only via r({...t, elevationDeg}))
  LIGHT_PRESETS: [
    { label: 'Midday', elevationDeg: 57.38 }, // kDe
    { label: 'Golden hour', elevationDeg: 9 },    // E8r
    { label: 'Dusk', elevationDeg: -4 },          // j8r
    { label: 'Night', elevationDeg: -28 },        // I8r
  ],
  GLOW_EMISSIVE: 16763274,   // cOr = 0xFFC98A night-lamp emissive

  // ---------- shadow fit (TOr/kOr/Bat) ----------
  SHADOW_CASTER_KINDS: ['humanoid', 'simple_figure'], // fOr — the fit box
  SHADOW_SPREAD_K: 1.15,     // hOr
  SHADOW_EXPAND: 4,          // pOr
  SHADOW_TEXEL_K: 0.163,     // uOr
  SHADOW_MIN_EXTENT: 30,     // dOr
  SHADOW_SNAP: 16,           // Oat
  SHADOW_NORMALBIAS_MAX: 0.3,// bOr
  SHADOW_NORMALBIAS_K: 1.5,  // mOr
  SHADOW_NORMALBIAS_K2: 6.666666666666667, // gOr = 1/.15
  SHADOW_NEAR: 0.1,          // Lat
  SUN_RADIUS: 2,             // sun.shadow.radius

  // ---------- spotlight (sOr/rOr/iOr/oOr) ----------
  SPOT_SHADOW_MAP: 1024,     // Cat
  SPOT_NEAR: 0.2,            // VFr
  SPOT_FAR: 60,              // UFr
  SPOT_BIAS: -0.0004,        // zFr
  SPOT_NORMALBIAS: 0.02,     // WFr
  SPOT_DECAY: 2,
  SPOT_COOKIE_SIZE: 128,     // Yx
  SPOT_DIFFUSION_STEPS: 10,  // Eat
  SPOT_COOKIE_RADIUS_K: 0.45,// XFr
  SPOT_NRE: 1 / (Math.SQRT2 * 1.06), // nre
  SPOT_BEAM_LEN: 7,          // jat
  SPOT_BEAM_COLOR: 16769955, // YFr = 0xFFE3A3
  SPOT_LAMP_COLOR: 2895152,  // nOr
  SPOT_DEFAULTS: { shape: 'round', intensity: 70, diffusion: 30 }, // QWt
  SPOT_INTENSITY_K: 2.4,     // W8r — raw ×2.4 (no /100, no ×π)
  SPOT_SHADOW_RADIUS_K: 1,       // GFr — shadow.radius for casting lights
  SPOT_SHADOW_RADIUS_DIFF_K: 6,  // qFr — + diffusion/100·6
  SPOT_PENUMBRA_MIN: 0.05,       // ZFr — non-casting penumbra
  SPOT_PENUMBRA_DIFF_K: 0.9,     // KFr — + diffusion/100·.9
  SPOT_BEAM_OPACITY_MIN: 0.02,   // QFr
  SPOT_BEAM_OPACITY_K: 0.07,     // JFr

  // ---------- simple_figure (Zqt; RIr/sA/PP/Nie/FIr/OIr/LIr/Pie/DIr) ----------
  FIG_HEIGHT: 1.75,          // jP (old IP)
  FIG_RATIO: 1.299,          // RIr (old uIr)
  FIG_FILL: 0xf29a5c,        // orange
  FIG_MARK_LUMA_T: 0.72,     // aqt contrast threshold (white if luma > t)
  FIG_VISOR_ARC: 72 * Math.PI / 180, // Pie (old Mie)

  // ---------- camera object ----------
  FOCAL_DEFAULT: 50,         // Bv / Hv
  FOCAL_STEPS: [14, 18, 24, 35, 50, 85, 135, 200], // bT/yT
  SENSOR_W: 35,              // Lzt/Fzt — full-frame width constant
  SHAKE_VALUES: ['off', 'subtle', 'medium', 'heavy'], // Xst (rigs may add 'stride')
  ASPECT_KEYS: ['16:9', '9:16', '1:1', '4:3', '1.85:1', '2.39:1'],   // Zae order (round 6: aspect select)
  ASPECTS: {                 // Zae (old Gae)
    '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080],
    '4:3': [1440, 1080], '1.85:1': [1920, 1038], '2.39:1': [1920, 804],
  },
  FRAME_CHROME_PX: 96,       // KGt (old qGt) — x2 for top+bottom
  FRUSTUM_ANGLE_K: 16,       // Rhe: clamp(avg(|scale|)*16°, 3, 55)
  FRUSTUM_ANGLE_MIN: 3,      // eGt
  FRUSTUM_ANGLE_MAX: 55,     // tGt (JWt=16 is the ×16 multiplier, QWt = spotlight defaults)
  FRUSTUM_K_YAW: 16,         // (Rhe constant)
  MARKER_DISTANCE: 3,        // DGr frustum quad distance
  HEIGHT_MIN: 0.2,           // lBe (old dBe)
  HEIGHT_DEFAULT: 4,         // MZt (old jZt)
  HEIGHT_MAX: 12,            // GLr (old kLr)
  HEIGHT_HARD_MAX: 50,       // ZLr (old TLr)
  LENS_SLIDER_MAX: 1000,     // Gze

  // ---------- tracks / items ----------
  SCHEMA_V: 12,              // round 10: light.skyStyle (classic|realistic); v11→v12
  SPEED_DEFAULT: 1.4,        // Htt m/s
  SPEED_STORE_FLOOR: 0.01,   // Qae (store edit clamp)
  SPEED_UI_FLOOR: 0.2,       // Mit (timeline field min; migration fallback i6r)
  SAMPLE_HZ: 20,             // qA (old GA)
  GAITS: ['walk_formal', 'walk', 'jog_fwd', 'sprint'], // Gzt (old zzt)
  AIM_MODES: ['travel', 'subject', 'locked'], // H2r (old b2r)
  PLAY_KEYS: ['lmb', 'rmb', 'q', 'e', 'r', 'f'], // qzt (old Wzt)
  CLIP_DEFAULT_DUR: 5,       // M8
  RANGE_MIN_GAP: 0.1,        // eie (old Qae=0.1; new Qae=0.01 is speed floor!)
  CURVE_RESAMPLE: 64,        // Btt
  HEIGHT_CURVE_MAX: 100,     // E2r
  ITEM_DEFAULT_DUR: 5,       // N8
  SCALE_UP_FACTOR: 2,        // AHr — palette scale-up
  SCALE_DOWN_FACTOR: 0.5,    // CHr — palette scale-down
  ACTION_DUR_TRANSFORM: 4,   // Jae
  CAM_PAN_DEG_PER_S: 20,     // VGt (old HGt)
  FIELD_CLAMP: { angleDeg: [15, 360], heightDeltaUnits: [0.5, 20], distanceScale: [0.1, 4], aimOffsetUnits: [-15, 15], durationS: [0.1, 120] },
  PATH_INSERT_THRESHOLD: 0.4, // Qzr — nearest-segment XZ distance for insert-vs-append

  // ---------- character motion (ground snap, turn, lookAt) ----------
  GROUND_PROBE: 1.2,         // Bne — ray origin above current y
  STEP_CLAMP: 0.5,           // Xae — max step up/down
  GROUND_SMOOTH_TAU: 0.22,   // Uzt — exp smoothing
  YAW_TURN_RATE: 8,          // A2r rad/s
  HEAD_YAW_LIMIT: 70 * Math.PI / 180,  // XOr
  HEAD_PITCH_LIMIT: 35 * Math.PI / 180,// YOr
  NECK_HEAD_SPLIT: 0.4,      // Wat — DEF-neck 40% / DEF-head 60%
  EYE_HEIGHT_K: 1.6,         // CZt — own-aim height = y + k*scale.y
  SUBJECT_AIM_K: 0.7,        // MIr — subject aim height = minY + k*height (0.5 spotlights)
  CROSSFADE_S: 0.25,         // Sot

  // ---------- path edit visuals (UGr) ----------
  PATH_ANCHOR_R: 0.09,
  PATH_ANCHOR_SEL_SCALE: 1.4,
  PATH_COLOR: 0xaa55ff,      // Not (violet)
  PATH_COLOR_TANGENT: 0x66ddff, // Pot (sky blue)
  PATH_COLOR_HEIGHT: 0xffcc55,  // Rot (amber)
  PATH_COLOR_SEL: 0xffffff,  // NGr
  PATH_HANDLE_R: 0.06,       // PGr
  PATH_HEIGHT_R: 0.075,
  PATH_HEIGHT_LADDER_A: 0.3, // IOr: y = a + h*k
  PATH_HEIGHT_LADDER_K: 0.55,
  PATH_HEIGHT_SHOW_MIN: 0.25,// FGr
  PATH_Y_OFFSET: 0.02,

  // ---------- selection (pGr/hGr) ----------
  SEL_MAX: 32,               // WWr
  SEL_FADE_MS: 160,          // KWr
  SEL_RIPPLE_MS: 1000,       // qWr
  SEL_DESELECT_MS: 500,      // ZWr
  SEL_FILL: 0x5f7196,        // rGr
  SEL_LINE: 0xffffff,        // sGr
  SEL_PAD_MIN_K: 0.1,        // YWr
  SEL_PAD_PX: 10,            // XWr
  SEL_RIPPLE_K: 0.5,         // tGr
  SEL_RIPPLE_PX: 120,        // eGr
  SEL_CORNER_K: 0.45,        // JWr
  SEL_CORNER_PX: 14,         // QWr
  SEL_STROKE_PX: 1.5,        // $Wr
  SEL_TOOLBAR_PAD: 0.18,     // GWr — selectionScreenBounds extend fraction of clientHeight

  // ---------- camera rigs (gq @5186601 — FULL verbatim table, r17; supersedes the r5 summary) ----------
  RIG_KEYS: ['tripod', 'gimbal', 'steadicam', 'handheld', 'run', 'drone'],   // i$ @5186537
  RIG_DEFAULT: 'gimbal',    // BGt @5186568
  CAMERA_RIGS: {            // gq — field names verbatim
    tripod:    { speedMps: 0,   startEaseS: .35, stopEaseS: .2,  lookEaseS: .2,  stickCurve: 1.4, level: true,  shake: 'off',    turnRoll: 0,   strafeRoll: 0,   rollEaseS: .6 },
    gimbal:    { speedMps: 1.8, startEaseS: .35, stopEaseS: .18, lookEaseS: .18, stickCurve: 1.3, level: true,  shake: 'off',    turnRoll: 0,   strafeRoll: 0,   rollEaseS: .6 },
    steadicam: { speedMps: 1.8, startEaseS: .55, stopEaseS: .3,  lookEaseS: .28, stickCurve: 1.3, level: true,  shake: 'subtle', turnRoll: .06, strafeRoll: .04, rollEaseS: .7 },
    handheld:  { speedMps: 1.8, startEaseS: .2,  stopEaseS: .12, lookEaseS: .08, stickCurve: 1.2, level: true,  shake: 'medium', turnRoll: 0,   strafeRoll: 0,   rollEaseS: .4 },
    run:       { speedMps: 5,   startEaseS: .25, stopEaseS: .15, lookEaseS: .06, stickCurve: 1.2, level: true,  shake: 'stride', turnRoll: .04, strafeRoll: 0,   rollEaseS: .4 },
    drone:     { speedMps: 7.5, startEaseS: .6,  stopEaseS: .35, lookEaseS: .32, stickCurve: 1.5, level: false, shake: 'off',    turnRoll: .2,  strafeRoll: .12, rollEaseS: .6 },
  },
  RIG_SPEED_STEPS: [.3, .6, .9, 1.2, 1.8, 2.4, 3.6, 5, 7.5, 11, 16, 24, 36, 50],  // HGt @5187425
  RIG_PAN_STEPS: [5, 10, 15, 20, 30, 45, 60, 90],       // $Gt @5187455
  RIG_PAN_DEFAULT: 20,        // VGt @5187477
  RIG_WEIGHT_MAX: Math.log2(3),   // Eie @5188185 — clamp ±log2(3)
  RIG_WEIGHT_DEADZONE: .08,   // zCr @5188196
  RIG_WEIGHT_STEP: .25,       // UCr @5188192 — ×2^±.25 per press
  RIG_WEIGHT_STORAGE: 'flick3dEditor.rig-weights',  // nqt "stage-rig-weights" @5241269 (origin-prefixed per port convention)
  STICK_DEADZONE: .1,         // m2e @5185663
  STICK_LEVEL_MIN: .001,      // RCr @5185668
  VERTICAL_SPEED_FLOOR: .6,   // ZCr/KCr @5189298 (both .6)
  ROLL_MAX: 25 * Math.PI / 180,  // eEr @5189933
  PITCH_MAX: Math.PI / 2 - .05,  // Iie @5188719
  SPRING_ZERO_EPS: 1e-4,      // Xrt @5189516
  EDIT_DRIVE_SPEED: 4,        // Tye @5639807 — edit-mode WASD m/s
  EDIT_DRIVE_SPRINT: 3,       // Aye — shift ×
  CAM_DRIVE_SHIFT_STICK: .4,  // eWr @5639821 — camera-mode shift scales the STICK (fine)
  CAM_FLOOR_GUARD: 1.6,       // Yzr @5639801 — takeOver fallback min height
  LOOK_RAD_PER_PX: .002,      // zit @5609244
  LOOK_POINTER_SPEED: .35,    // tWr @5639834 (z.pointerSpeed)
  ZOOM_STEP: .35,             // pEr @5193531 — held-key target step/s
  ZOOM_LENS_TAU: .15,         // fEr — lens spring tau
  ZOOM_WHEEL_RATE: 6e-4,      // mEr — wheel zoom rate
  ZOOM_WHEEL_DIV: 33,         // gEr — deltaMode 1 divisor
  ZOOM_DT_MAX: .05,           // Jjr — rAF dt clamp
  TC_FPS: 24,                 // Qne @5192245
  LEVEL_ON_DEG: 1,            // TCr @5183721 — level indicator on threshold
  MONITOR_BAR_PX: 96,         // KGt @5193210
  FOCAL_MM_MIN: 14,           // q_ @3920347
  FOCAL_MM_MAX: 200,          // WA
  SHAKE_PRESETS: {           // d2r (Dzt @3921570)
    subtle: { posUnits: 0.005, rotDeg: 0.15 },
    medium: { posUnits: 0.015, rotDeg: 0.4 },
    heavy:  { posUnits: 0.03,  rotDeg: 0.9 },
  },
  SHAKE_SINES: [             // u2r: [freqRatio, weight]
    [1, 0.55], [2.618, 0.3], [6.854, 0.15],
  ],
  SHAKE_GOLDEN: 2.399,       // golden-angle phase step (gbe)
  SHAKE_POS_FREQS: [0.43, 0.53, 0.61],   // h2r
  SHAKE_ROT_FREQS: [0.47, 0.59, 0.71],   // p2r
  SHAKE_POS_PHASES: [0, 1.7, 3.4],       // f2r
  SHAKE_ROT_PHASES: [5.1, 0.9, 2.6],     // m2r
  STRIDE_SPEED_FULL: 3,      // rEr — amount ramps 0->1 over 0..3 m/s (iEr @5190524)
  STRIDE_SPEED_MIN: 0.05,    // sEr — below this the phase does not advance
  STRIDE_SPEED_MAX: 15,      // aEr — above this the amount is 0

  // ---------- misc ----------
  HUMANOID_URL: 'assets/humanoid-B4Yewrzp.glb',
  CAMERA_GLB_URL: 'assets/camera-DV-hMEYk.glb',
  SPOTLIGHT_GLB_URL: 'assets/spotlight-Cs6bAwrT.glb',
  PROP_CATALOG_URL: 'assets/prop_catalog_slim.json',
  PROP_GLB_DIR: 'assets/props/',
  PLAN_PX_PER_M: 34,         // Uhe
  PLAN_MARGIN_PX: 48,        // TLr
  // the 13 GLB-less procedural props (diff of prop_catalog 1439 vs prop_manifest 1426)
  PROCEDURAL_PROPS: ['chair', 'table', 'mountain', 'rock', 'tree', 'capsule', 'plane', 'pyramid',
    'doorway', 'pillar', 'stairs', 'wall', 'wall_corner'],
};

// Derived figure constants (sA = jP/RIr etc.)
C.FIG_SCALE = C.FIG_HEIGHT / C.FIG_RATIO;                    // sA (old rA) ≈ 1.347
C.FIG_BODY = [0.406 * C.FIG_SCALE, 1.059 * C.FIG_SCALE, 0.289 * C.FIG_SCALE]; // PP
C.FIG_HEAD_R = 0.125 * C.FIG_SCALE;                          // Nie (old Iie)
C.FIG_HEAD_INSET = 0.01 * C.FIG_SCALE;                       // FIr
C.FIG_HEAD_Y = C.FIG_BODY[1] - C.FIG_HEAD_INSET + C.FIG_HEAD_R; // OIr — top of head = jP exactly
C.FIG_BAND = [0.8 * C.FIG_SCALE, 0.88 * C.FIG_SCALE];        // LIr (old fIr)

// 46-clip catalog (Lhe, old Fhe) — durations seconds; verified identical to GLB animations.
export const CLIPS = {
  a_tpose: 0.167, crouch_fwd: 2.0, crouch_idle: 2.917, dance: 1.0, death01: 2.375,
  driving: 1.667, fixing_kneeling: 5.167, hit_chest: 0.333, hit_head: 0.417, idle: 2.5,
  idle_talking: 2.917, idle_torch: 1.25, interact: 2.0, jog_fwd: 0.917, jump: 2.5,
  jump_land: 1.25, jump_start: 1.333, pickup_table: 0.833, pistol_aim_down: 0.167,
  pistol_aim_neutral: 0.167, pistol_aim_up: 0.167, pistol_idle: 1.667, pistol_reload: 1.667,
  pistol_shoot: 0.625, punch_cross: 1.0, punch_enter: 0.833, punch_jab: 0.833, push: 2.667,
  roll: 1.458, roll_rm: 1.458, sitting_enter: 1.292, sitting_exit: 1.0, sitting_idle: 1.667,
  sitting_talking: 2.917, spell_simple_enter: 0.5, spell_simple_exit: 0.417,
  spell_simple_idle: 2.083, spell_simple_shoot: 0.5, sprint: 0.667, swim_fwd: 1.333,
  swim_idle: 3.333, sword_attack: 1.5, sword_attack_rm: 1.5, sword_idle: 1.667,
  walk: 1.333, walk_formal: 1.333,
};

// cam-move presets (_1, old w1): [durationS, angleDeg, heightDeltaUnits, distanceScale]
export const CAM_MOVE_PRESETS = {
  orbit:     { durationS: 8, angleDeg: 360, heightDeltaUnits: 0,  distanceScale: 1 },
  dolly_in:  { durationS: 4, distanceScale: 0.5 },
  dolly_out: { durationS: 5, distanceScale: 2 },
  dolly_zoom:{ durationS: 4, distanceScale: 0.5 },
  crane_up:  { durationS: 5, heightDeltaUnits: 3 },
  crane_down:{ durationS: 5, heightDeltaUnits: 3 },   // +3 — crane_down moves UP (audit 2-a)
  spiral:    { durationS: 8, angleDeg: 180, heightDeltaUnits: 3 },
  pan_sweep: { durationS: 6, angleDeg: 90 },
};
export const CAM_MOVES = ['orbit', 'dolly_in', 'dolly_out', 'dolly_zoom', 'crane_up', 'crane_down', 'spiral', 'pan_sweep']; // bP
export const CAM_MOVES_FOCUSABLE = ['orbit', 'dolly_in', 'dolly_out', 'dolly_zoom', 'crane_up', 'crane_down', 'spiral']; // yP = bP minus pan_sweep (setCameraFocus patch gate)
export const STILL_DUR = 5;     // sje('still') -> N8 = 5 (default cam-still duration, _1 has no still key)
export const STILL_MIN_DUR = .1; // Ije (min cam-still duration)

// smoothstep (eDe, old rDe)
export const smoothstep = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
