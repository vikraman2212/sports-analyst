# Manual Testing Guide

## Overview

This guide provides comprehensive manual testing procedures for the Cricket Ball Speed Tracker application. Use these test flows to validate functionality before releases and after significant changes.

## Prerequisites

- Development environment running (`npm run dev`)
- Modern browser (Chrome, Safari, Edge, Firefox)
- Device with camera access (mobile or desktop with webcam)
- Physical access to cricket pitch or test environment
- Optional: Multiple devices for cross-platform testing

---

## Test Flow 1: Initial Setup & Camera Access

### Objective

Verify camera initialization and permission handling.

### Steps

1. **Launch Application**

   - Open browser to `http://localhost:3000`
   - Verify page loads without errors
   - Check console for any warnings

2. **Camera Permission Request**

   - Application should request camera access
   - Grant permission when prompted
   - Expected: Camera feed appears within 2-3 seconds

3. **Camera Permission Denied**

   - Reload page
   - Deny camera permission
   - Expected: Error message displays with retry button
   - Click "Retry Camera Access"
   - Grant permission
   - Expected: Camera feed starts successfully

4. **Verify Camera Feed**
   - ✅ Video feed is live and updating
   - ✅ Feed fills container responsively
   - ✅ No distortion or stretching
   - ✅ Status shows "Ready"

### Pass Criteria

- Camera starts within 3 seconds
- Error handling works correctly
- Retry mechanism functions
- Feed is clear and responsive

---

## Test Flow 2: Calibration Process

### Objective

Validate calibration workflow and accuracy.

### Steps

1. **Position Camera**

   - Mount device on stable surface
   - Frame the pitch showing bowler to batter distance
   - Ensure camera is level

2. **Perform Calibration** (Future UI)

   - Mark bowler release point
   - Mark batter delivery point
   - Verify pixel distance calculated
   - Expected: Calibration profile created

3. **Verify Calibration Values**

   - Check `pitchLengthPixels` is reasonable (400-800px typical)
   - Verify `referenceDistanceMeters` is 20.12
   - Calculate `pixelsPerMeter` ratio
   - Expected: Values are within expected ranges

4. **Test Recalibration**
   - Move camera slightly
   - Recalibrate
   - Verify new values reflect changed position

### Pass Criteria

- Calibration completes without errors
- Values are mathematically correct
- Recalibration updates values appropriately

---

## Test Flow 3: Basic Delivery Recording

### Objective

Record and analyze a cricket ball delivery.

### Steps

1. **Prepare for Recording**

   - Ensure calibration is complete
   - Position for delivery
   - Status should show "Ready"

2. **Start Recording**

   - Click "Start Recording" button
   - Expected: Recording indicator appears (red dot pulsing)
   - Frame counter increments
   - Status changes to "Recording"

3. **Perform Delivery**

   - Bowl or throw ball through frame
   - Track ball motion for 1-2 seconds
   - Verify frame counter updating (typically 30-60 frames)

4. **Stop Recording**

   - Click "Stop & Analyze" button
   - Expected: Analysis progress bar appears
   - Status changes to "Analyzing"
   - Progress updates from 0% to 100%

5. **View Results**

   - Analysis completes within 5 seconds
   - Speed displayed in km/h
   - Confidence level shown
   - Detection count displayed
   - Trajectory overlay visible
   - Expected: All metrics are reasonable

6. **Verify Result Details**

   - ✅ Speed is > 0 km/h
   - ✅ Confidence is 0.0-1.0
   - ✅ Detection count ≥ 3
   - ✅ Processing time < 5000ms
   - ✅ Trajectory points visible

7. **Reset for Next Delivery**
   - Click "Record Next Delivery" or "Reset"
   - Expected: Interface returns to ready state
   - Previous results cleared

### Pass Criteria

- Recording captures frames continuously
- Analysis completes within 5s threshold
- Results are displayed clearly
- Reset works correctly

---

## Test Flow 4: Error Handling & Edge Cases

### Objective

Validate error handling and edge case behaviors.

### Test Case 4A: Insufficient Detections

1. Record delivery with poor lighting
2. Or record with no ball visible
3. Expected: Warning about low detection count
4. Speed may be null or unreliable
5. Warning message explains issue

### Test Case 4B: Very Short Recording

1. Start recording
2. Stop immediately (< 1 second)
3. Expected: Warning about insufficient data
4. Confidence should be low
5. Suggestion to record longer

### Test Case 4C: Camera Obstruction

1. Start recording
2. Cover camera lens partially during recording
3. Stop and analyze
4. Expected: Lower confidence
5. Warning about detection gaps

### Test Case 4D: Extremely High Speed (Detection Error)

1. If speed shows > 200 km/h
2. Expected: Warning about unusual speed
3. Message suggests calibration check

### Test Case 4E: Zero Speed

1. Record without moving ball
2. Expected: Zero speed detected
3. Warning about no movement

### Pass Criteria

- All error cases display appropriate warnings
- App doesn't crash on edge cases
- User guidance is clear and actionable

---

## Test Flow 5: Performance Validation

### Objective

Ensure app meets performance targets.

### Metrics to Measure

1. **Camera Initialization**

   - Time from page load to camera active
   - Target: < 3 seconds

2. **Frame Capture Rate**

   - Verify ~30 frames captured per second
   - Check frame counter during recording

3. **Analysis Latency**

   - Time from "Stop" to results displayed
   - Target: < 5 seconds for typical delivery (15 frames)

4. **Trajectory Smoothing**

   - Verify smoothing completes quickly
   - Target: < 50ms per operation

5. **Memory Usage**
   - Record multiple deliveries in sequence
   - Verify no memory leaks
   - Check browser DevTools memory profiler

### Pass Criteria

- Camera starts within 3s
- Frame rate is consistent ~30fps
- Analysis completes within 5s target
- No memory leaks after 10+ deliveries

---

## Test Flow 6: Accessibility Testing

### Objective

Verify accessibility features work correctly.

### Steps

1. **Keyboard Navigation**

   - Tab through all interactive elements
   - Verify focus indicators visible
   - Test Enter/Space to activate buttons
   - Expected: All controls accessible via keyboard

2. **Screen Reader Testing**

   - Enable screen reader (VoiceOver, NVDA, etc.)
   - Navigate through interface
   - Verify ARIA labels are read correctly
   - Status updates announced
   - Results announced when available

3. **Visual Indicators**

   - Check recording indicator is visible
   - Progress bar updates smoothly
   - Error states clearly distinguished
   - Success states obvious

4. **High Contrast Mode**
   - Enable high contrast in OS
   - Verify all text is readable
   - Borders are clearly defined
   - Color alone not used for meaning

### Pass Criteria

- All functions accessible via keyboard
- Screen reader announces key information
- Visual states are clear
- High contrast mode works

---

## Test Flow 7: Responsive Design Testing

### Objective

Validate responsive behavior across devices.

### Test Devices

- Mobile portrait (< 640px width)
- Mobile landscape
- Tablet portrait (640-1024px)
- Tablet landscape
- Desktop (> 1024px)

### Tests for Each Breakpoint

1. **Layout Adaptation**

   - Camera view scales appropriately
   - Controls remain accessible
   - Text is readable
   - No horizontal scrolling

2. **Touch Targets** (Mobile)

   - All buttons ≥ 44x44px
   - Adequate spacing between targets
   - Touch gestures work smoothly

3. **Orientation Changes**

   - Rotate device during recording
   - Verify camera feed adapts
   - No layout breakage

4. **Safe Areas** (iOS)
   - Check notch/home indicator areas
   - Controls not obscured
   - Content within safe areas

### Pass Criteria

- All breakpoints display correctly
- Touch targets meet minimum size
- Orientation changes handled gracefully
- No layout overflow or breakage

---

## Test Flow 8: JSON Export Functionality

### Objective

Validate export features work correctly.

### Steps

1. **Record and Analyze Delivery**

   - Complete a delivery recording
   - Wait for analysis results

2. **Open Export Menu**

   - Click "Export" button
   - Verify menu appears with options
   - Expected: Download, Copy, Share options (when supported)

3. **Test Download**

   - Click "Download JSON"
   - Expected: File downloads immediately
   - Filename format: `cricket-delivery-YYYY-MM-DD.json`
   - Open file, verify JSON is valid
   - Check all fields present: metadata, delivery, trajectory, calibration

4. **Test Copy to Clipboard**

   - Click "Copy to Clipboard"
   - Expected: Success message appears
   - Paste into text editor
   - Verify JSON is valid and complete

5. **Test Share** (Mobile)

   - Click "Share"
   - Expected: Native share sheet appears
   - Select messaging app or email
   - Verify JSON file attached

6. **Verify Export Data**
   - Check exported JSON contains:
     - ✅ `metadata` (exportedAt, version, appName)
     - ✅ `delivery` (speedKmh, confidence, detectionCount, processingMs, warnings)
     - ✅ `trajectory` (totalPoints, durationMs, points array)
     - ✅ `calibration` (if available)
     - ✅ `statistics` (avgConfidence, trajectoryDuration, estimatedDistancePixels)

### Pass Criteria

- All export methods work
- JSON is valid and complete
- File naming is consistent
- Success feedback is clear

---

## Test Flow 9: Cross-Browser Compatibility

### Objective

Ensure functionality across major browsers.

### Browsers to Test

- Chrome/Chromium (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Features to Verify

1. **Camera Access**

   - Works in all browsers
   - Permission UI appropriate to browser

2. **Video Feed**

   - Displays correctly
   - Performance is acceptable

3. **Canvas Rendering** (Trajectory)

   - Overlay renders properly
   - Colors and paths display correctly

4. **Web APIs**

   - Clipboard API (if supported)
   - Share API (mobile browsers)
   - Performance API for timing

5. **CSS Features**
   - Flexbox/Grid layouts
   - CSS variables
   - Media queries
   - Animations

### Pass Criteria

- Core functionality works in all browsers
- Graceful degradation for unsupported features
- No critical console errors
- Performance is acceptable

---

## Test Flow 10: Data Validation & Accuracy

### Objective

Validate accuracy of speed calculations.

### Setup

- Known speed reference (if available)
- Or multiple recordings of same delivery
- Consistent lighting and conditions

### Steps

1. **Baseline Recording**

   - Record ball at known speed (if possible)
   - Note measured speed

2. **Repeatability Test**

   - Record same delivery 5 times
   - Compare speeds
   - Calculate variance
   - Expected: Standard deviation < 5 km/h

3. **Calibration Accuracy**

   - Measure pitch distance physically
   - Compare to calibration values
   - Calculate pixel-to-meter ratio accuracy

4. **Detection Quality**
   - Review trajectory overlay
   - Check for smooth path
   - Verify detection gaps are reasonable
   - Expected: Continuous trajectory without large gaps

### Pass Criteria

- Repeatability within ±5 km/h
- Calibration accuracy within ±10%
- Trajectory is smooth and continuous
- Detection count ≥ 5 for reliable results

---

## Common Issues & Solutions

### Issue: Camera doesn't start

**Solution:** Check permissions, try different browser, verify camera is not in use by another app

### Issue: Poor detection rate

**Solution:** Improve lighting, ensure ball is clearly visible, reduce motion blur, check camera focus

### Issue: Inaccurate speeds

**Solution:** Recalibrate precisely, ensure camera is stable, verify pitch measurement is correct

### Issue: App crashes during analysis

**Solution:** Check browser console, reduce frame count, try on different device, file bug report

### Issue: Export doesn't work

**Solution:** Check browser compatibility, verify file system permissions, try different export method

---

## Testing Checklist

### Pre-Release Testing

- [ ] All 10 test flows completed
- [ ] Tested on 3+ devices
- [ ] Tested in 3+ browsers
- [ ] Performance targets met
- [ ] Accessibility validated
- [ ] Error handling verified
- [ ] Documentation reviewed
- [ ] Known issues documented

### Post-Deployment Testing

- [ ] Production environment accessible
- [ ] Camera works in production
- [ ] HTTPS configured correctly
- [ ] No console errors
- [ ] Analytics tracking (if enabled)
- [ ] Error logging functional

---

## Reporting Issues

When reporting bugs, include:

1. **Device & Browser:** Model, OS version, browser version
2. **Steps to Reproduce:** Exact sequence that causes issue
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happened
5. **Screenshots/Video:** Visual evidence if possible
6. **Console Logs:** Any error messages
7. **Network Tab:** For API/loading issues

---

## Testing Environment Setup

### Local Development

```bash
# Start dev server
npm run dev

# Run automated tests
npm test

# Check for errors
npm run lint
```

### Production Testing

```bash
# Build production bundle
npm run build

# Test production build locally
npm start
```

### Performance Profiling

Use Chrome DevTools:

1. Open DevTools (F12)
2. Go to Performance tab
3. Record while using app
4. Check for bottlenecks
5. Review memory usage

---

## Version History

- **v1.0.0** (2025-10-06): Initial manual testing guide
