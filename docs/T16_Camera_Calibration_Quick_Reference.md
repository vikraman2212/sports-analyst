# Task T16: Camera Calibration UI & Settings Controls - Quick Reference

**Created:** 2025-10-28  
**GitHub Issue:** [#30](https://github.com/vikraman2212/sports-analyst/issues/30)  
**Priority:** HIGH  
**Status:** READY  
**Effort:** 3 days

---

## The Problem

**User Report:** _"We see the warning that camera needs to be calibrated, but we have no way to calibrate or control the camera."_

### What's Wrong

- ❌ Calibration is **hardcoded** (`DEFAULT_PITCH_LENGTH_PIXELS = 512`)
- ❌ No UI to mark pitch distance on camera feed
- ❌ No controls for camera exposure, ISO, shutter speed
- ❌ Users see warnings but can't act on them

### Impact

- Users stuck with inaccurate measurements
- Different camera angles/positions not supported
- Cannot fix motion blur or exposure issues
- Frustrating UX: warnings without solutions

---

## The Solution

### 1. Interactive Calibration Wizard

**User clicks "Calibrate Camera" →**

1. Overlay appears: "Mark the bowling crease"
2. User taps/clicks on camera feed
3. "Mark the batting crease"
4. User taps/clicks again
5. Line drawn, distance calculated: "485px for 20.12m pitch"
6. Validation: ✅ "Looks good!" or ❌ "Points too close"
7. User clicks "Accept" → Saved to localStorage

### 2. Camera Settings Panel

**User clicks "⚙️ Settings" →**

- Detects available constraints via `getCapabilities()`
- Shows sliders for: Exposure, ISO, Focus, White Balance
- Presets: "Fast Motion", "Bright Outdoor", "Low Light"
- Settings apply immediately via `applyConstraints()`
- Progressive enhancement: shows only supported settings

### 3. Calibration Profiles

- Store multiple profiles in localStorage
- Switch between "Outdoor", "Indoor", "Practice Net"
- Each profile includes camera settings
- Show last calibrated time

---

## Key Components

```
CameraCalibrator.tsx      → Interactive two-point marking overlay
CameraSettings.tsx        → Settings control panel
CalibrationStatusBadge    → Shows current profile & recalibrate button
useCalibrationWizard()    → Calibration workflow state
useCameraSettings()       → Camera constraint management
useCalibrationProfiles()  → Profile CRUD operations
```

---

## Files to Create/Modify

### New Files (8)

```
frontend/src/components/CameraCalibrator.tsx
frontend/src/components/CameraSettings.tsx
frontend/src/components/CalibrationStatusBadge.tsx
frontend/src/hooks/useCalibrationWizard.ts
frontend/src/hooks/useCameraSettings.ts
frontend/src/hooks/useCalibrationProfiles.ts
frontend/src/lib/calibration/wizard.ts
frontend/src/lib/calibration/storage.ts
```

### Modified Files (4)

```
frontend/src/app/page.tsx              → Replace hardcoded value, add badge
frontend/src/components/CameraView.tsx → Integrate calibrator
frontend/src/components/CameraGuidance.tsx → Add "Fix It" buttons
frontend/src/lib/types.ts              → Add CalibrationProfile types
```

---

## Data Model

```typescript
interface CalibrationProfile {
  id: string;
  name: string;
  pitchLengthPixels: number; // Measured on camera feed
  pitchLengthMeters: number; // From PitchLengthSelector
  ballMassGrams: number; // From BallWeightSelector
  cameraSettings?: MediaTrackSettings;
  createdAt: Date;
  lastUsed: Date;
}
```

**localStorage Key:** `speedometer_calibration_profiles`

---

## Acceptance Criteria (Checklist)

### Must Have ✅

- [ ] User can mark two points on camera feed (touch + mouse)
- [ ] Real-time distance calculation and validation
- [ ] Profile saves to localStorage and persists
- [ ] Replaces hardcoded `DEFAULT_PITCH_LENGTH_PIXELS`
- [ ] Works on iOS Safari, Android Chrome, Desktop Chrome
- [ ] Accessible (keyboard navigation, ARIA labels)

### Camera Settings

- [ ] Detects capabilities, shows only supported controls
- [ ] Settings apply immediately
- [ ] "Fast Motion" preset works (if supported)
- [ ] Graceful fallback for unsupported constraints

### Quality

- [ ] Unit tests for hooks (80%+ coverage)
- [ ] Component tests for UI
- [ ] Integration test: calibrate → record → verify speed
- [ ] Documentation updated (README, manual-testing.md)

---

## Browser Support

| Feature               | Chrome | iOS Safari | Android Chrome |
| --------------------- | ------ | ---------- | -------------- |
| Two-point calibration | ✅     | ✅         | ✅             |
| Camera settings       | ✅     | ⚠️ Limited | ✅             |
| Exposure control      | ✅     | ❌         | ✅             |
| ISO control           | ✅     | ❌         | ⚠️             |

**Strategy:** Progressive enhancement - core calibration works everywhere, settings show only what's supported.

---

## Testing Phases

### Phase 1: Unit Tests

- `useCalibrationWizard`: point addition, validation, reset
- `useCalibrationProfiles`: CRUD, localStorage
- `useCameraSettings`: constraint detection, apply

### Phase 2: Component Tests

- `CameraCalibrator`: rendering, click/touch, validation
- `CameraSettings`: constraint detection, UI

### Phase 3: Integration

- Full workflow: calibrate → record → verify speed uses new calibration

### Phase 4: Manual

- iOS Safari: touch calibration
- Android Chrome: touch + settings
- Desktop Chrome: mouse + full settings
- Edge cases: points outside bounds, unrealistic distances

---

## Known Limitations

### iOS Safari

- Limited camera constraint support
- No exposure/ISO controls typically
- Solution: Show "Camera settings limited on iOS Safari"

### Low-End Devices

- `applyConstraints()` can be slow (100-500ms)
- Solution: Show loading spinner, debounce slider changes

### localStorage Limits

- ~5-10MB typical quota
- Solution: Limit to 10 profiles max, auto-trim old profiles

---

## Development Plan

### Day 1: Core Calibration UI

- [ ] Create types in `types.ts`
- [ ] Build `useCalibrationWizard` hook
- [ ] Build `useCalibrationProfiles` hook
- [ ] Create `CameraCalibrator` component
- [ ] Integrate into `CameraView`
- [ ] Unit tests

### Day 2: Camera Settings

- [ ] Build `useCameraSettings` hook
- [ ] Create `CameraSettings` component
- [ ] Define presets
- [ ] Integrate settings panel
- [ ] Save settings with profile
- [ ] Unit tests

### Day 3: Integration & Polish

- [ ] Update `page.tsx` (remove hardcoded value)
- [ ] Create `CalibrationStatusBadge`
- [ ] Update `CameraGuidance` ("Fix It" buttons)
- [ ] Integration test
- [ ] Manual testing (3 browsers)
- [ ] Update documentation
- [ ] Demo video

---

## Success Metrics

### Functional

- ✅ Speed measurements accurate for different camera positions
- ✅ Users can fix motion blur by adjusting exposure
- ✅ Calibration persists across sessions
- ✅ No browser console errors

### UX

- ✅ Calibration takes < 30 seconds
- ✅ Clear error messages for invalid inputs
- ✅ Camera warnings are actionable
- ✅ Works on mobile (primary use case)

### Quality

- ✅ 80%+ test coverage
- ✅ No accessibility violations
- ✅ Works in 3+ browsers
- ✅ Documentation complete

---

## Quick Links

- **GitHub Issue:** https://github.com/vikraman2212/sports-analyst/issues/30
- **Grooming Doc:** `/docs/GROOMING_SESSION_T16_Camera_Calibration.md`
- **Project Plan:** `/docs/project-plan.json` (Task T16)
- **Related Tasks:**
  - T1: Configurable Pitch Length (#15) ✅
  - T2: Configurable Ball Weight (#16) ✅
  - T4: Camera Diagnostics (#17) ✅

---

## Need Help?

### Camera Constraints API

- MDN: https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints
- Capabilities: https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities

### Testing

- See `frontend/src/tests/` for examples
- Manual testing checklist in grooming doc

### Questions

- Check grooming doc for detailed design
- Review existing `usePitchLength` hook for localStorage pattern
- See `CameraGuidance` for diagnostic implementation

---

**Last Updated:** 2025-10-28  
**Next Review:** After Day 1 completion
