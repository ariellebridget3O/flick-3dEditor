// const.js — every runtime constant extracted from the live bundle (index-DBE17t4T.js).
// Policy [A:F23]: semantic names; minified id in comment; values are byte-exact (decimals kept
// as-is where the bundle uses them because THREE.Color(number) is hex-semantics on ints).
export const C = {
  // ---------- viewport / renderer (COr, fZt) ----------
  EDITOR_FOV: 50,            // FP
  NEAR: 0.1,                 // Khe
  FAR: 500,                  // RP
  CAM_START: [6, 5, 8],      // COr camera.position.set
  ORBIT_TARGET: [0, 1, 0],   // Dqr orbit.target.set
  ROTATE_SPEED: 0.75,        // Lqr
  SHADOW_MAP_PX: 3072,       // Fqr (min with maxTextureSize)
  FLY_SPEED: 4,              // Tye WASD m/s
  FLY_SPRINT: 3,             // Aye multiplier
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
  LIGHT_DEFAULT: { azimuthDeg: 128.66, elevationDeg: 57.38 }, // kDe
  // sun presets (TQr/AQr light popover)
  LIGHT_PRESETS: [
    { label: 'Midday', azimuthDeg: 128.66, elevationDeg: 57.38 }, // kDe
    { label: 'Golden hour', azimuthDeg: 128.66, elevationDeg: 9 },    // E8r
    { label: 'Dusk', azimuthDeg: 128.66, elevationDeg: -4 },          // j8r
    { label: 'Night', azimuthDeg: 128.66, elevationDeg: -28 },        // I8r
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
  SPOT_DEFAULTS: { shape: 'round', intensity: 70, diffusion: 30 }, // XWt
  SPOT_INTENSITY_K: 2.4,     // _8r (prior audit; applied in oOr tick)

  // ---------- simple_figure (Zqt; RIr/sA/PP/Nie/FIr/OIr/LIr/Pie/DIr) ----------
  FIG_HEIGHT: 1.75,          // jP (old IP)
  FIG_RATIO: 1.299,          // RIr (old uIr)
  FIG_FILL: 0xf29a5c,        // orange
  FIG_MARK_LUMA_T: 0.72,     // aqt contrast threshold (white if luma > t)
  FIG_VISOR_ARC: 72 * Math.PI / 180, // Pie (old Mie)

  // ---------- camera object ----------
  FOCAL_MIN: 14,             // G_
  FOCAL_MAX: 200,            // zA
  FOCAL_DEFAULT: 50,         // Bv / Hv
  FOCAL_STEPS: [14, 18, 24, 35, 50, 85, 135, 200], // bT/yT
  SENSOR_W: 35,              // Lzt/Fzt — full-frame width constant
  SHAKE_VALUES: ['off', 'subtle', 'medium', 'heavy'], // Xst (rigs may add 'stride')
  ASPECTS: {                 // Zae (old Gae)
    '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080],
    '4:3': [1440, 1080], '1.85:1': [1920, 1038], '2.39:1': [1920, 804],
  },
  FRAME_CHROME_PX: 96,       // KGt (old qGt) — x2 for top+bottom
  FRUSTUM_ANGLE_K: 16,       // Rhe: clamp(avg(|scale|)*16°, 3, 55)
  FRUSTUM_ANGLE_MIN: 3,      // QWt
  FRUSTUM_ANGLE_MAX: 55,     // JWt
  FRUSTUM_K_YAW: 16,         // (Rhe constant)
  MARKER_DISTANCE: 3,        // DGr frustum quad distance
  HEIGHT_MIN: 0.2,           // lBe (old dBe)
  HEIGHT_DEFAULT: 4,         // MZt (old jZt)
  HEIGHT_MAX: 12,            // GLr (old kLr)
  HEIGHT_HARD_MAX: 50,       // ZLr (old TLr)
  LENS_SLIDER_MAX: 1000,     // Gze

  // ---------- tracks / items ----------
  SCHEMA_V: 10,              // NU
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
  ITEM_DEFAULT_DUR: 5,
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

  // ---------- camera rigs (gq) ----------
  CAMERA_RIGS: {             // gq: tripod/gimbal/steadicam/handheld/run/drone
    tripod:    { speed: 0,   shake: 'off',    roll: 0 },
    gimbal:    { speed: 1.8, shake: 'off',    roll: 0 },
    steadicam: { speed: 1.8, shake: 'subtle', roll: 0.06, roll2: 0.04 },
    handheld:  { speed: 1.8, shake: 'medium', roll: 0 },
    run:       { speed: 5,   shake: 'stride', roll: 0 },
    drone:     { speed: 7.5, shake: 'off',    roll: 0.2, roll2: 0.12 },
  },
  SHAKE_PRESETS: {           // $br (Dzt)
    subtle: { posUnits: 0.005, rotDeg: 0.15 },
    medium: { posUnits: 0.015, rotDeg: 0.4 },
    heavy:  { posUnits: 0.03,  rotDeg: 0.9 },
  },
  SHAKE_SINES: [             // Vbr: [freq, amp]
    [1, 0.55], [2.618, 0.3], [6.854, 0.15],
  ],
  SHAKE_GOLDEN: 2.399,       // golden-angle phase step

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
  crane_down:{ durationS: 5, heightDeltaUnits: -3 },
  spiral:    { durationS: 8, angleDeg: 180, heightDeltaUnits: 3 },
  pan_sweep: { durationS: 6, angleDeg: 90 },
};
export const CAM_MOVES = ['orbit', 'dolly_in', 'dolly_out', 'dolly_zoom', 'crane_up', 'crane_down', 'spiral', 'pan_sweep']; // yP

// smoothstep (eDe, old rDe)
export const smoothstep = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
