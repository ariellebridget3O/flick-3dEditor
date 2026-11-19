# R17 extraction registry — camera-mode subsystem (camera-panel remainder)

Scope: the camera-mode "monitor" family — rig state + drive + rig shake + monitor UI + mode
transitions. Raw dumps: gq_region.txt, ctrl_class.txt, cam_store_class.txt, panel_Yjr.txt,
apply_5722.txt, drive_en.txt, deleteFocused.txt, camfollow_ui.txt, wVr_record.txt.
All offsets = analysis/index-DBE17t4T.js byte positions (verified this round by direct read).

## Constants
| name | value | offset | role |
|---|---|---|---|
| i$ | ["tripod","gimbal","steadicam","handheld","run","drone"] | 5186537 | rig keys |
| BGt | "gimbal" | 5186568 | default rig |
| g2e | {turnRoll:0,strafeRoll:0} | 5186590 | zero-roll spread |
| gq | full table (below) | 5186601 | rigs |
| HGt | [.3,.6,.9,1.2,1.8,2.4,3.6,5,7.5,11,16,24,36,50] | 5187425 | speed steps |
| $Gt | [5,10,15,20,30,45,60,90] | 5187455 | pan steps |
| VGt | 20 | 5187477 | default panDegPerS |
| Grt | {speedMps:gq.gimbal.speedMps, panDegPerS:20} | 5187485 | default speeds |
| Eie | Math.log2(3) | 5188185 | weight clamp (ease ±log2(3) ≈ ±1.585) |
| zCr | .08 | 5188196 | weight deadzone |
| UCr | .25 | 5188192 | weight step (×2^±.25 per [ / ]) |
| jie | {tripod:0,gimbal:0,steadicam:0,handheld:0,run:0,drone:0} | 5188204 | default weights |
| m2e | .1 | 5185663 | stick deadzone |
| RCr | .001 | 5185668 | level-basis min horizontal |
| ZCr | .6, KCr .6 | 5189298 | vertical speed floor·mult |
| eEr | 25·π/180 | 5189933 | max roll |
| Iie | π/2−.05 | 5188719 | pitch clamp |
| Xrt | 1e-4 | 5189516 | spring-zero eps |
| Tye | 4 | 5639807 | edit WASD m/s |
| Aye | 3 | 5639810 | edit shift × |
| eWr | .4 | 5639821 | camera-mode shift STICK scale (fine) |
| Yzr | 1.6 | 5639801 | camera-mode floor guard |
| zit | .002 | 5609244 | look rad/px |
| Wit | π/2 | 5609247 | polar center |
| pEr | .35 | 5193531 | zoom target step/s |
| fEr | .15 | 5193533 | zoom lens spring tau |
| mEr | 6e-4 | 5193535 | wheel zoom rate |
| gEr | 33 | 5193537 | wheel divisor (deltaMode 1) |
| Qne | 24 | 5192245 | TC fps |
| cEr | 24, est 4 | 5192249 | (recording-side) |
| TCr | 1 | 5183721 | level-on threshold deg |
| KGt | 96 | 5193210 | monitor bar px |
| q_ / WA | 14 / 200 | 3920347 | focal bounds |
| OGt | Math.log(WA/q_) | 5184438 | zoom log range |
| nqt | "stage-rig-weights" | 5241269 | localStorage key |
| Jzr | .12 | 5639807 | phone lerp tau (phone-only) |

### gq (FULL table @5186601 — replaces the r5 summary in const.js)
```
tripod:    {speedMps:0,  startEaseS:.35, stopEaseS:.2,  lookEaseS:.2,  stickCurve:1.4, level:true,  shake:"off",    turnRoll:0,   strafeRoll:0,   rollEaseS:.6}
gimbal:    {speedMps:1.8,startEaseS:.35, stopEaseS:.18, lookEaseS:.18, stickCurve:1.3, level:true,  shake:"off",    turnRoll:0,   strafeRoll:0,   rollEaseS:.6}
steadicam: {speedMps:1.8,startEaseS:.55, stopEaseS:.3,  lookEaseS:.28, stickCurve:1.3, level:true,  shake:"subtle", turnRoll:.06, strafeRoll:.04, rollEaseS:.7}
handheld:  {speedMps:1.8,startEaseS:.2,  stopEaseS:.12, lookEaseS:.08, stickCurve:1.2, level:true,  shake:"medium", turnRoll:0,   strafeRoll:0,   rollEaseS:.4}
run:       {speedMps:5,  startEaseS:.25, stopEaseS:.15, lookEaseS:.06, stickCurve:1.2, level:true,  shake:"stride", turnRoll:.04, strafeRoll:0,   rollEaseS:.4}
drone:     {speedMps:7.5,startEaseS:.6,  stopEaseS:.35, lookEaseS:.32, stickCurve:1.5, level:false, shake:"off",    turnRoll:.2,  strafeRoll:.12, rollEaseS:.6}
```

## Functions (verbatim bodies captured in this file's sibling dumps)
- helpers: DCr(rig-valid) UGt(isTripod) BCr(steps-picker) HCr(rig-switch carry) qrt(step ±) $Cr(clamp) VCr(validate) — @5187489..5188160
- weight: HDe(clamp+deadzone) zGt(2^t) WCr(ease ×2^w) WGt(validate) GCr(load) — @5188464..5188719
- hEr(cycle rig) @5193533 | qGt(rig name) @5190908 | ZGt(weight fmt) @5191044 | Qrt(weight label) @5191096 | Jrt(weight btn label) @5191365 | ECr(speed fmt) @5184444
- spring: RU @5188990 cje @5189757 GGt @5189518 XCr @5189209 (Zrt/Krt initial states)
- stick/basis: DGt @5185685 FCr @5185820 OCr @5186081 eC @5185527
- pan: JCr @5189906 QCr @5189852 qCr @5188742 DQi @5188724 Yrt @5190119
- move/roll: YCr @5189298 tEr @5190213 nEr @5190272
- zoom: Vhe @5184395 jCr @5184525 ICr @5184572 bEr/yEr/vEr/xEr @5193640..5193879
- store kIr @5241461 (state subset: rig/speedMps/panDegPerS/weights/weight/setRig/setWeight/saveWeight/setSpeeds + _Ir/wIr load; PHONE LINK EXCLUDED — live-only network)
- controller eIr @5230903 subset: cycleRig/changeSpeed/cycleSpeed/stepWeight/peekSpeeds/onKeyDown(tab/z/x/[/]; o/p zoom) — phone fields excluded
- drive en @5664174 (verbatim in drive_en.txt) + G reset @5649455 + Ma camera branch @5663138
- look: rzr(=three PointerLockControls subclass) @5609267 + szr @5609864 + Je click-to-lock @5655723
- applyMode $e @5655928 (mode transitions; se save/restore, vZt @5445932 takeOver via iBe @5444847, BU @5444685 fov, B() gizmo reattach @5648276, le free-look exit @5652256)
- shake apply: q @5722035 Y @5722298 re @5722357 ae @5722401 H @5721900(mode==="camera") C=Dzt be @5722716 (filming camera in camera mode → ae)
- monitor Yjr @5225471 (bar: STBY/REC, TC Zjr @5222880/uEr @5193223, rig btn, speed btn, weight menu lEr @5191422, focal, aspect menu, level ACr @5183920, frame XGt @5193223, grid, back, REC, phone card)
- edit WASD: ha @5663200 (bot + Tye/Aye + q/e vertical + addNavProgress)
- deleteFocused @5811133 (keyframe → item → track → objects cascade)
- cam-follow UI: object dropdown ONLY (Zy) @5569395; offset derived by drag (lFr @5427232 — ported r16 manipulate); add path verbatim (LHr + firstSubjectId + aimCameraAtSubject) — already ported
- record panel wVr @5573855 (focal/aspect/shake + phone) — our inspector has focal/aspect/shake; xVr shake options @5573636

## Out of scope this round (new PLAN backlog entry — filming/recording arc)
MediaRecorder capture (fe/B/we @5722400+), beginRecording/toggleRecording/finishRecording
(@5144450..5147200), hub recording, screenshots (screenshotCamera @5811560), outputs,
phone streaming (poses/link/hello/orientation), review mode, offlineTake.
