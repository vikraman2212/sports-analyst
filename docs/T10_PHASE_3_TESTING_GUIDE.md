# T10 Phase 3 - Manual Testing Guide

**Status:** Ready for Testing  
**Date:** 2025-10-28  
**Phase:** Integration Complete - Awaiting Manual Verification

---

## 📋 What Was Implemented

### Phase 3: CameraView Integration

**File Modified:** `frontend/src/components/CameraView.tsx`

**Changes Made:**

1. **Imports Added:**

   ```typescript
   import { useAutoStop } from "../hooks/useAutoStop";
   import { RecordingIndicator } from "./RecordingIndicator";
   import { detectBallInFrame } from "../lib/detection";
   ```

2. **Auto-Stop Hook Initialized:**

   ```typescript
   const autoStopConfig = {
     enabled: true,
     threshold: 30, // 30 frames without detection
     minFrames: 10, // Minimum 10 frames before auto-stop
     safetyTimeout: 10000, // 10 second max recording
   };

   const {
     state: autoStopState,
     onFrame: onAutoStopFrame,
     reset: resetAutoStop,
     startTimeout,
     stopTimeout,
   } = useAutoStop(autoStopConfig);
   ```

3. **Frame Capture Loop Enhanced:**

   ```typescript
   // Now runs detection on each frame for auto-stop
   const detection = await detectBallInFrame(frame);
   const hasDetection = detection !== null && detection.confidence > 0.3;
   onAutoStopFrame(hasDetection);
   ```

4. **Auto-Stop Trigger Watcher:**

   ```typescript
   useEffect(() => {
     if (autoStopState.shouldStop && isRecording.current) {
       handleStopRecording();
     }
   }, [autoStopState.shouldStop]);
   ```

5. **Recording Controls Updated:**

   ```typescript
   handleStartRecording: -resetAutoStop() - startTimeout();

   handleStopRecording: -stopTimeout();
   ```

6. **UI Replaced:**
   ```typescript
   // Old: Simple recording indicator div
   // New: RecordingIndicator component with countdown
   <RecordingIndicator
     isRecording={isRecording.current && !isAnalyzing}
     autoStopState={autoStopState}
     fps={diagnostics.inferredFPS || diagnostics.reportedFPS || 30}
     onManualStop={handleStopRecording}
     frameCount={frameCount}
   />
   ```

---

## 🧪 Manual Testing Checklist

### Test 1: Basic Auto-Stop Flow ✅

**Steps:**

1. Start dev server: `cd frontend && npm run dev`
2. Open http://localhost:3000
3. Grant camera permissions
4. Click "Start Recording"
5. **Verify:** New RecordingIndicator shows at top
   - ● REC badge (pulsing red dot)
   - Frame count (e.g., "25 frames")
   - Stop button
6. Move ball out of camera view (or cover camera)
7. **Verify:** Countdown appears
   - "Auto-stopping in N frames..."
   - Circular progress ring (orange)
   - Time estimate (e.g., "1.0s")
8. Wait for countdown to reach 0
9. **Verify:** Recording auto-stops
   - Analysis begins automatically
   - Results displayed

**Expected Result:** Recording stops automatically after 30 frames without ball detection

---

### Test 2: Manual Stop Override ✅

**Steps:**

1. Start recording
2. Move ball out of frame (countdown starts)
3. Click "Stop" button before countdown finishes

**Verify:**

- Recording stops immediately
- Countdown cancelled
- Analysis begins
- No errors in console

**Expected Result:** Manual stop always works, even during countdown

---

### Test 3: Countdown Reset on Ball Reappearance ✅

**Steps:**

1. Start recording
2. Move ball out of frame (countdown starts: "Auto-stopping in 25 frames...")
3. Move ball back into frame BEFORE countdown finishes
4. **Verify:** Countdown disappears
5. Move ball out again
6. **Verify:** Countdown restarts from 30 frames

**Expected Result:** Countdown resets to 30 whenever ball reappears

---

### Test 4: Safety Timeout (10 seconds) ✅

**Steps:**

1. Start recording
2. Keep ball in frame continuously
3. Wait more than 10 seconds
4. **Verify:** Recording auto-stops at 10s

**Expected Result:** Safety timeout prevents infinite recording

---

### Test 5: Minimum Frames Requirement ✅

**Steps:**

1. Start recording
2. Immediately cover camera (no ball)
3. **Verify:** Countdown starts BUT recording doesn't stop until at least 10 frames captured

**Expected Result:** Auto-stop doesn't trigger before 10 frames, even if ball never appears

---

### Test 6: Mobile Responsive Layout ✅

**Steps:**

1. Resize browser to mobile width (< 640px)
2. Or test on actual mobile device
3. Start recording

**Verify:**

- Frame count hidden (saves space)
- Stop button shows icon only (⏹)
- Countdown text compact
- Progress ring visible
- All elements fit on screen

**Expected Result:** UI adapts gracefully to mobile

---

### Test 7: Multiple Deliveries / Reset ✅

**Steps:**

1. Complete a delivery (let auto-stop trigger)
2. View results
3. Click "New Delivery" button in header
4. **Verify:** Camera view resets
   - Auto-stop state reset (not showing "23 frames remaining")
   - Frame count at 0
5. Start recording again
6. **Verify:** Countdown starts fresh from 30 frames

**Expected Result:** Reset clears all auto-stop state

---

### Test 8: Rapid Ball Flickering ✅

**Steps:**

1. Start recording
2. Rapidly move ball in/out of frame (10-20 times)
3. **Verify:**
   - Countdown starts/stops with each movement
   - Counter resets each time ball reappears
   - No stuck states

**Expected Result:** Handles rapid detection changes gracefully

---

### Test 9: Very Short Delivery ✅

**Steps:**

1. Start recording
2. Manually stop after 5-8 frames (before 10 frame minimum)
3. **Verify:**
   - Manual stop works
   - Analysis runs (may show warnings about insufficient frames)
   - No crashes

**Expected Result:** System handles short recordings without crashing

---

### Test 10: Performance Check ✅

**Steps:**

1. Open browser DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Record for 60-90 frames
5. Stop manually
6. Check performance metrics

**Verify:**

- No frame drops during recording
- Detection adds < 10ms per frame
- Smooth countdown animation
- No memory leaks

**Expected Result:** Recording stays smooth at 30 FPS

---

## 🐛 Known Issues / Things to Watch

### Potential Issues:

1. **Per-frame detection might be slow**

   - Watch for lag during recording
   - Check FPS counter stays at 30
   - If slow, may need to throttle detection (every 2-3 frames)

2. **Countdown might not appear if detection always succeeds**

   - This is actually correct behavior!
   - Try covering camera to test

3. **Detection failures treated as "no ball"**

   - If detector crashes, auto-stop triggers
   - Check console for detection errors

4. **Mobile camera performance**
   - Slower devices may struggle with per-frame detection
   - Test on actual mobile device

### Console Warnings to Ignore:

- Next.js workspace root warning (expected)
- Watchman recrawl warnings (expected)

### Errors that Should NOT Appear:

- ❌ "Detection failed" repeatedly
- ❌ "Cannot read property of undefined" in auto-stop
- ❌ React warnings about missing dependencies
- ❌ Memory leaks (check in Performance tab)

---

## 📊 Success Criteria

### Must Work:

✅ Auto-stop triggers after 30 consecutive empty frames  
✅ Manual stop always works (overrides auto-stop)  
✅ Countdown resets when ball reappears  
✅ Safety timeout prevents infinite recording  
✅ Minimum 10 frames before auto-stop  
✅ UI shows countdown with progress ring  
✅ Mobile responsive layout  
✅ New Delivery resets auto-stop state

### Performance:

✅ < 10ms overhead per frame for detection  
✅ Smooth 30 FPS recording  
✅ No frame drops  
✅ Countdown updates at 30 FPS

### UX:

✅ Clear visual feedback (countdown, progress ring)  
✅ Time estimate accurate  
✅ Manual stop always visible and clickable  
✅ No confusing states

---

## 🔧 Testing Commands

### Start Dev Server:

```bash
cd /Users/viknarasimhan/Documents/Speedometer/frontend
npm run dev
```

### Access Locally:

```
http://localhost:3000
```

### Mobile Testing (ngrok):

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: ngrok tunnel
ngrok http 3000

# Use ngrok URL on mobile device
```

### Check Build:

```bash
npm run build
```

### Run Tests:

```bash
npm test
```

---

## 📸 Expected UI Screenshots

### Recording State:

```
┌────────────────────────────────────────┐
│  ● REC    45 frames    [Stop]          │  ← RecordingIndicator
└────────────────────────────────────────┘
```

### Countdown State:

```
┌─────────────────────────────────────────────────────┐
│  ● REC  45 frames  [⏱ 15 frames (0.5s)]  [Stop]   │
│                     ^^^^^^^^^^^^^^^^^^^^^^^^        │
│                     Auto-stopping in...             │
└─────────────────────────────────────────────────────┘
```

### Mobile State:

```
┌─────────────────────┐
│  ● REC  [⏱ 15]  ⏹  │
└─────────────────────┘
```

---

## 🚀 Next Steps After Testing

### If Tests Pass:

1. Run full test suite: `npm test`
2. Verify no regressions (610 tests should still pass)
3. Commit Phase 3 changes
4. Move to Phase 4: Integration tests
5. Move to Phase 5: Documentation

### If Issues Found:

1. Document specific failures
2. Check console errors
3. Note performance problems
4. Share findings for fixes

---

## 📝 Testing Notes Template

```markdown
### Test Session: [Date/Time]

**Browser:** [Chrome/Safari/Firefox/Mobile Safari/etc.]
**Device:** [Desktop/iPhone/Android/etc.]
**Screen Size:** [1920x1080 / Mobile 375x667 / etc.]

#### Test Results:

- [ ] Test 1: Basic Auto-Stop - PASS / FAIL
  - Notes:
- [ ] Test 2: Manual Override - PASS / FAIL
  - Notes:
- [ ] Test 3: Countdown Reset - PASS / FAIL
  - Notes:

[...continue for all tests...]

#### Performance Notes:

- FPS during recording:
- Detection latency:
- Memory usage:
- Any lag noticed:

#### Issues Found:

1.
2.

#### Overall Assessment:

- Ready to commit: YES / NO
- Blockers:
```

---

**Status:** ✅ Phase 3 code complete, awaiting manual verification

**Next Action:** Manual testing using this guide, then commit or fix issues
