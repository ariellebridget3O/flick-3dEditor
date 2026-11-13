#!/usr/bin/env python3
"""Extract raw bundle regions into extracted/tracks_raw.js with section comments."""
import sys
sys.path.insert(0, '/home/z/flick-3dEditor/analysis/tmp_a')
from search import src

s = src()
REGIONS = [
    (3917240, 3920700, "CAM-MOVE PRESETS + EASING: bP (move list), YLe/QLe/JLe (angle/height/distance moves), yP, _1 (preset defaults), s2r/a2r (fov clamp 10..120), eDe (smoothstep), i2r, KCe (cam-move eval incl dolly_zoom fov + pan_sweep lookAt rotation)"),
    (3920600, 3922620, "FOV + SHAKE + PAN: q_/WA (focal clamp 14..200), Zae (aspect table), Am, Lzt=35 sensor, Mtt/XCe, Z_ (fovDeg from focalLengthMm), o2r (record framing), l2r, shake presets d2r/u2r/gbe/h2r/p2r/f2r/m2r/Dzt, stride g2r, pan_sweep b2r, plan-variant y2r"),
    (3922540, 3923960, "EASING/LERP/EULER UNWRAP: YCe smoothstep, v2r distanceScale-eased, x2r yaw-rotate vec, bbe/tDe angle lerp, ybe unwrap, GA euler flip-unwrap, vbe/tA lerp, Bzt transform-keys eval"),
    (3923860, 3926560, "HEAD ROTATION + RIG KEYS: w2r (headRotation interp), Kae (head at time, subject override), _2r, k2r, QCe/Hzt/$zt/S2r (joint lerp), Vzt (rig joints eval), T2r (rig item scan), consts Xae/Uzt/Bne/A2r/C2r, xU, E2r (bezier3), Ptt=12, mT (anchor tangent builder)"),
    (3926300, 3928900, "CURVE: Ptt=12, mT (anchor tangent builder), j2r (nearest segment), nx (anchors->polyline), MR (arc length), oq (pos at distance), Yae (tangent at distance), zzt clamp, Ftt wrap, Wzt (approach angle), I2r (slide)"),
    (4315100, 4318620, "SCHEMA/PREDICATES/PATH EVAL: Gzt gaits + JCe default + qzt keymap keys + qA=20 + Zzt + ym/Ott + xbe/B2r/wbe keyframe edit, H2r aims, $2r/aN, V2r/Fp camera kinds, XN/$6 subject aim, U2r/YN needs-subject, _he item-at-time, z2r shakeBaked, W2r, lq, G2r subject-at-time, q2r path pos+yaw, Z2r euler build, g2, K2r=32, X2r pace validator, Y2r=100, Ltt, Kzt heightCurve validator, Dtt bezier1"),
    (4318500, 4322400, "HEIGHTCURVE/PACE/DURATION/SHOW/EVAL-CHAR: ZA heightCurve eval, Btt=64, Q2r resample, khe distance-vs-time (pace), Q0 kinds, J2r, Xzt, Htt=1.4, Qae=.01, Jae=4, N8=5, yd duration, rx show layout, eie=.1/tie/She range, $tt lookAt, Vtt motion-source, Utt/eyr, tyr, eEe (character track eval), ztt yaw"),
    (4901450, 4902400, "OBJECT HELPERS: s$ target placement, _8r, Zo world TRS, UWt, el person kinds, fie, k8r, Hv=50, Xu is-aim-target, _De, JEe parent-group resolve, S8r/T8r spotlight aim helpers, F8 first camera"),
    (4903038, 4905100, "LIGHT + ASSET GLB + LOOKAT: fq=-30/QA=90, kDe defaults, M8r sun dir, SDe/N8r light normalizer, camera-DV-hMEYk.glb, spotlight-Cs6bAwrT.glb, L8r=.55, mie mesh normalize, kv lookAt rotation, V8r relative TRS"),
    (4906251, 4916000, "MIGRATION CHAIN v1->v10: nGt spotlight norm, t6r/n6r shot defaults, MU=10, r6r/aGt scene factories, s6r show deep-copy, a6r v2->v3 points->anchors, bie speed fix, o6r speed clamp pass, l6r cam-rail->cam-path, c6r v1->v2 performances, hrt, d6r shot->item, u6r v4->v5 shot->track, h6r v5->v6 prop yaw, p6r v7->v8 rot unwrap, f6r entry, prt, m6r/g6r/b6r post-normalizers, iGt reader, stage_scenes service"),
    (5063314, 5067300, "CLIP CATALOG + ACTIONS: Lhe 46 clips, XSr/IDe duration, $v dnd mime, YSr object actions, xie camera actions, e3r/n3r/sje default durations, a$ action compat, bGt item->action, Art/yGt, r3r/MDe"),
    (5138309, 5140600, "PLACEMENT: Kne, O8, wie, MP, oje overlap, Xne marker snap, _ie solver, W5r, lje item pack/sort, G5r, q5r, kGt reorder"),
    (5186500, 5187700, "CAMERA RIGS: i$ rig list, BGt default, gq presets, HGt/$Gt/VGt steps, Grt, DCr/UGt/BCr/HCr/qrt/$Cr/VCr speed stepping, Eie/UCr/zCr/jie zoom ramp"),
    (5190308, 5191300, "RIG SHAKE: eEr roll clamp, rEr/sEr/aEr stride, iEr stride phase, oEr shake dispatch, Dzt presets, g2r stride bob"),
    (5247644, 5248500, "SUBJECT AIM BOUNDS: MIr=.7, uje object height, VDe world minY/maxY, NP aim offset, NIr=.5 spotlight"),
    (5307050, 5310600, "SNAKE MIRROR (agent view): Hqt light, Co/Wst/JMr rounding, eNr heights_m 9 samples, qst points, $qt per-item snake params, tNr full scene mirror, search/paging"),
    (5362400, 5362700, "SIMPLE_FIGURE HEAD: nat/o$ set head rotation on figure mesh (nBe accessor)"),
    (5425806, 5432200, "CAMERA ITEM EVAL: lZt proxy, lFr default follow offset, hFr=.45/rye=5, oL lookAt quat, pFr pan target, cZt cam-transform keys (slerp), fFr dispatcher, dZt camera eval, U6/mFr/xq/gFr/uZt/bFr predicates"),
    (5444485, 5445600, "BU fov, mZt, iBe focused camera, Die target, Bie mesh pose"),
    (5445950, 5447350, "ROr current aim, xZt camera target line, OOr/LOr, oBe forward, cL shake apply"),
    (5451335, 5452400, "LOOK-AT SPLIT: XOr=70deg/YOr=35deg/CZt=1.6/Wat=.4, QOr/Gat, xM body/head split, EZt/kje head euler, jZt DEF-neck/DEF-head offsets, IZt merge, JOr/lBe/MZt/eLr/Zat/nLr head clamp"),
    (5519424, 5550600, "PERFORMANCE STORE (BHr class): fHr..Tit vHr flight fit, YZt=2, _Hr/kHr/Ije/QZt/SHr/THr/AHr/CHr clamps+defaults, OHr camera field validator, LHr camera item factory, DHr detach refs, Cit subject-of, store states, updateTrackItems/lje, tracks clone/insert, addPerformanceTrack, action drop, item factories (path/play/clip/rotate/revolve/scale/transform/rig-transform/cam-*), placement, path paint ops (mT rebuild), speed/gait/aim updates, replaceMoveFromSamples, shiftPaths, setCameraFocus/keepLookOnClear, aim helpers (subjectAimPoint/turnCameraToward/firstSubjectId), keyframe ops (add/remove/move/capture), play session, manual flight, setTakeRange, Eit/HHr heightCurve compat, $Hr field editability"),
    (5608500, 5609400, "MANUAL FLIGHT RECORDER: rKt=.1 floor probe, QUr/Uit orbit floor clamp, pye=1/20, JUr tick pushing {p,q,fovDeg} samples, finishManualFlight, PointerLockControls"),
    (5635600, 5636600, "JOINT FILTER/APPLY: cot major-joint filter, Rzr, Fzr, Uie clone TRS, aKt additive joint offset (position +=, quaternion *=, scale *=)"),
    (5116500, 5116750, "HUMANOID MODEL CONSTANTS: c5r/Hhe = /assets/humanoid-B4Yewrzp.glb, jP=1.75, d5r=M_Main"),
    (5665221, 5673400, "HUMANOID RIG MANAGER: fWr joint delta, Sot=.25 crossfade, SWr/TWr fade, Cye/Aot clip sampling, AWr main manager: mixer/actions/bones, g() rig offsets apply, b() playback clips (wrap time, fade), humanoid glb load, o$/cot/Uie/aKt joint apply, setPlaybackClips/setRigOffsets/sampleClipRigOffsets"),
    (5696719, 5706400, "PERFORMANCE CONTROLLER (jGr): EGr deg->rad, layout rx, time sources, k ground raycast, z revolve center, L object+rig+head apply, te subject pos, ne path apply, Q fold items (rotate/scale/revolve/transform), q joints, Ee lookAt resolve, xe own aim, J head from item, le char state, ue characters apply (ground snap, yaw smoothing, parent yaw), ye reset, je tick/poseNow"),
    (5711025, 5716700, "PLAY SESSION DRIVER (aqr): zGr/WGr/GGr speeds, qGr gravity, ZGr jump, Oot mouse sens, KGr/XGr pitch clamp, Lot/YGr/QGr/JGr follow cam, eqr turn, Dot radius, tqr ray heights, nqr slides, rqr=120s cap, sqr buttons, H sample, z/L session start/end, $ keymap clip, input, movement+collision+ground+jump, clip state machine, 20Hz recorder, camera collision"),
    (5719400, 5728000, "CAMERA CONTROLLER + TAKES: render sessions, W resolvers (resolveAim/resolveFollowObject), L items, $ focal, O follow default, U/V/G predicates, Q markers, q rig stride from ground speed, Y shake advance, ae/re main cam, ie shakeBaked, pe shake, ce dZt eval, be aim, fe record session (canvas, MediaRecorder), oe takes, ye stop, je preview, ve render tick, ke main aim"),
]

BAR = "// " + "─" * 78
out = []
out.append("// ============================================================================\n")
out.append("// tracks_raw.js — RAW EXCERPTS from index-DBE17t4T.js\n")
out.append("// (flick.art 3D stage previz editor bundle, 13,483,704 bytes, single-line minified)\n")
out.append("// Extracted by static analysis; offsets are byte offsets into the original file.\n")
out.append("// NOTE: brackets are replaced with 【】 to survive tool output filtering;\n")
out.append("// the original file uses plain [ ]. De-minified reconstructions: TRACK_SYSTEM.md\n")
out.append("// ============================================================================\n\n")
for a, b, label in REGIONS:
    out.append(BAR + "\n")
    out.append("// SECTION: " + label + "\n")
    out.append("// OFFSETS: " + str(a) + ".." + str(b) + "\n")
    out.append(BAR + "\n\n")
    out.append(s[a:b].replace("[", "【").replace("]", "】"))
    out.append("\n\n")

path = "/home/z/flick-3dEditor/analysis/extracted/tracks_raw.js"
with open(path, "w", encoding="utf-8") as f:
    f.write("".join(out))
print("wrote " + path + ": " + str(sum(len(x) for x in out)) + " chars")
