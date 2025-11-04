# Grooming Session: T16 - Camera Calibration UI & Settings Controls

**Date:** 2025-10-28  
**Participants:** Engineering Team  
**GitHub Issue:** [#30](https://github.com/vikraman2212/sports-analyst/issues/30)  
**Duration:** 3 days  
**Priority:** HIGH

---

## Problem Discovery

### What Happened

User reported: _"We see the warning that camera needs to be calibrated, but we have no way to calibrate or control the camera. How are users supposed to calibrate and change the camera settings?"_

### Root Cause Analysis

1. **Hardcoded Calibration**: `DEFAULT_PITCH_LENGTH_PIXELS = 512` in `page.tsx`
2. **No Interactive UI**: Calibration module (`lib/calibration/index.ts`) has all the logic but no UI
3. **Diagnostic Without Action**: `CameraGuidance` component shows warnings but provides no controls
4. **Known Gap**: Manual testing doc shows "Perform Calibration (Future UI)" - this was always planned but not prioritized

### Impact

- **Critical Usability Issue**: Users cannot achieve accurate speed measurements
- **Different Camera Positions**: Hardcoded value only works for one specific setup
- **Camera Quality Issues**: Users see blur/exposure warnings but can't fix them
- **Poor UX**: Warnings without actionable solutions frustrate users

---

## Solution Design

### User Journey

```
┌─────────────────────────────────────────────────────────────┐
│  1. SETUP                                                   │
│  User opens app → Camera feed starts                        │
│  Status badge shows: "⚠️ Default Calibration (not accurate)"│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. TRIGGER CALIBRATION                                     │
│  Option A: Click "Calibrate Camera" button                  │
│  Option B: Click "Fix It" on diagnostic warning             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. CALIBRATION WIZARD                                      │
│  Overlay appears on camera feed                             │
│  Instructions: "Tap the bowling crease"                     │
│  User taps/clicks → First point marked with crosshair       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SECOND POINT                                            │
│  Instructions: "Tap the batting crease"                     │
│  User taps/clicks → Second point marked                     │
│  Line connects points, distance shown: "485px"              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. VALIDATION                                              │
│  Real-time calculation:                                     │
│  • Pitch length: 20.12m (from PitchLengthSelector)         │
│  • Pixel distance: 485px                                    │
│  • Pixels per meter: 24.1                                   │
│  Validation: ✅ "Looks good!"                               │
│  OR ❌ "Too close - mark full pitch length"                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  6. ACCEPT OR RETRY                                         │
│  If valid: "Accept Calibration" button enabled             │
│  If invalid: "Retry" button shown, "Accept" disabled       │
│  User clicks "Accept"                                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  7. SAVE & CONFIRM                                          │
│  Profile saved to localStorage                              │
│  Status badge updates: "✅ Calibrated 2 mins ago"          │
│  Calibration used for all future deliveries                 │
└─────────────────────────────────────────────────────────────┘
```

### Camera Settings Flow

```
┌─────────────────────────────────────────────────────────────┐
│  CAMERA SETTINGS PANEL                                      │
│  Accessible via: "⚙️ Camera Settings" button               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  DETECT CAPABILITIES                                        │
│  const caps = track.getCapabilities()                       │
│  Show only supported constraints                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SETTINGS CONTROLS (if supported)                           │
│  • Exposure: [slider] Auto | Manual                         │
│  • ISO: Low | Medium | High                                 │
│  • Focus: Auto | Manual                                     │
│  • White Balance: Auto | Daylight | Cloudy | Tungsten      │
│  • Shutter Speed: Auto | Fast (for motion)                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PRESETS                                                    │
│  • 🏃 Fast Motion (low exposure, high shutter)              │
│  • 🌞 Bright Outdoor (auto exposure, high ISO)             │
│  • 🌙 Low Light (high exposure, low shutter)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  APPLY & SAVE                                               │
│  track.applyConstraints(newSettings)                        │
│  Settings saved with calibration profile                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Component Hierarchy

```
page.tsx
├── CameraView
│   ├── <video> element
│   ├── CameraGuidance (diagnostics display)
│   │   └── "Fix It" button → Opens wizard
│   ├── CalibrationStatusBadge
│   │   └── "Calibrate" button → Opens wizard
│   ├── CameraCalibrator (conditional, when calibrating)
│   │   ├── Overlay canvas
│   │   ├── Point markers (SVG circles)
│   │   ├── Distance line (SVG line)
│   │   ├── Validation message
│   │   └── Accept/Retry buttons
│   └── CameraSettings (conditional, when settings open)
│       ├── Constraints detection
│       ├── Control sliders/toggles
│       ├── Preset buttons
│       └── Apply/Reset buttons
```

### Data Flow

```
┌──────────────────────┐
│ useCalibrationProfiles│ ← localStorage
│  - activeProfile      │
│  - profiles[]         │
└──────────────────────┘
          │
          │ activeProfile
          ▼
┌──────────────────────┐
│     page.tsx         │
│  - calibration =     │
│    createPitchCal... │
│    (pitchLengthPixels│
│     from profile)    │
└──────────────────────┘
          │
          │ calibration prop
          ▼
┌──────────────────────┐
│    CameraView        │
│  - Passes to         │
│    analyzeDelivery() │
└──────────────────────┘
          │
          │ calibration
          ▼
┌──────────────────────┐
│  analyzeDelivery()   │
│  - Uses calibration  │
│    for speed calc    │
└──────────────────────┘
```

### State Management

**Global State (localStorage):**

```typescript
// Key: 'speedometer_calibration_profiles'
{
  activeProfileId: 'profile-123',
  profiles: [
    {
      id: 'profile-123',
      name: 'Outdoor Pitch',
      pitchLengthPixels: 485,
      pitchLengthMeters: 20.12,
      ballMassGrams: 156,
      cameraSettings: { exposure: -2, iso: 400 },
      createdAt: '2025-10-28T10:30:00Z',
      lastUsed: '2025-10-28T14:22:00Z'
    }
  ]
}
```

**Hook: `useCalibrationProfiles()`**

```typescript
const {
  activeProfile, // Current CalibrationProfile or null
  profiles, // All saved profiles
  setActiveProfile, // Switch to different profile by ID
  createProfile, // Create new profile
  updateProfile, // Update existing profile
  deleteProfile, // Delete profile by ID
  isLoading, // Loading from localStorage
  error, // Error state
} = useCalibrationProfiles();
```

**Hook: `useCalibrationWizard()`**

```typescript
const {
  isCalibrating, // Whether wizard is active
  points, // [CalibrationPoint, CalibrationPoint] or []
  addPoint, // (x, y, label) => void
  removeLastPoint, // () => void
  resetPoints, // () => void
  validation, // { isValid, errors, pixelsPerMeter }
  acceptCalibration, // () => CalibrationProfile
  cancelCalibration, // () => void
} = useCalibrationWizard({
  pitchLengthMeters: 20.12,
  onComplete: (profile) => {
    /* save profile */
  },
});
```

**Hook: `useCameraSettings(stream)`**

```typescript
const {
  capabilities, // MediaTrackCapabilities | null
  currentSettings, // MediaTrackSettings | null
  updateSetting, // (key, value) => Promise<void>
  applyPreset, // (presetName) => Promise<void>
  resetToDefaults, // () => Promise<void>
  isSupported, // (constraintName) => boolean
  error, // Error state
} = useCameraSettings(cameraStream);
```

---

## Implementation Plan

### Phase 1: Core Calibration UI (Day 1)

**Files to Create:**

- `frontend/src/components/CameraCalibrator.tsx`
- `frontend/src/hooks/useCalibrationWizard.ts`
- `frontend/src/hooks/useCalibrationProfiles.ts`
- `frontend/src/lib/calibration/storage.ts`
- `frontend/src/lib/calibration/wizard.ts`

**Tasks:**

1. ✅ Create `CalibrationPoint` and `CalibrationProfile` types in `types.ts`
2. ✅ Implement `useCalibrationProfiles` hook with localStorage
3. ✅ Build `useCalibrationWizard` hook with point tracking and validation
4. ✅ Create `CameraCalibrator` component with:
   - Overlay canvas
   - Click/touch handlers for point marking
   - Visual markers (SVG crosshairs)
   - Line connecting points
   - Distance display
   - Validation feedback
5. ✅ Integrate into `CameraView` (conditional rendering)
6. ✅ Add "Calibrate" button to `page.tsx`

**Testing:**

- Unit tests for `useCalibrationWizard` (point addition, validation)
- Unit tests for `useCalibrationProfiles` (CRUD operations)
- Component test for `CameraCalibrator` (rendering, interaction)

### Phase 2: Camera Settings Panel (Day 2)

**Files to Create:**

- `frontend/src/components/CameraSettings.tsx`
- `frontend/src/hooks/useCameraSettings.ts`
- `frontend/src/lib/calibration/presets.ts`

**Tasks:**

1. ✅ Implement `useCameraSettings` hook
   - Detect capabilities via `getCapabilities()`
   - Apply constraints via `applyConstraints()`
   - Error handling for unsupported constraints
2. ✅ Create `CameraSettings` component:
   - Conditional rendering based on capabilities
   - Sliders for exposure, ISO, focus
   - Preset buttons
   - "Not supported on this device" fallbacks
3. ✅ Define presets in `presets.ts`:
   - Fast Motion: `{ exposureMode: 'manual', exposureTime: 0.001, iso: 400 }`
   - Bright Outdoor: `{ exposureMode: 'continuous', iso: 100 }`
   - Low Light: `{ exposureMode: 'manual', exposureTime: 0.02, iso: 800 }`
4. ✅ Integrate settings panel into `CameraView`
5. ✅ Save settings with calibration profile

**Testing:**

- Unit tests for `useCameraSettings` (constraint detection, apply)
- Component test for `CameraSettings` (rendering, UI interactions)
- Manual test: Chrome, iOS Safari, Android Chrome for constraint support

### Phase 3: Integration & Polish (Day 3)

**Files to Modify:**

- `frontend/src/app/page.tsx`
- `frontend/src/components/CameraGuidance.tsx`
- `frontend/src/components/CameraView.tsx`

**Tasks:**

1. ✅ Update `page.tsx`:
   - Replace `DEFAULT_PITCH_LENGTH_PIXELS` with dynamic value from active profile
   - Add `CalibrationStatusBadge` component
   - Handle profile switching
2. ✅ Update `CameraGuidance.tsx`:
   - Add "Fix It" button next to warnings
   - Context-aware: blur → settings, calibration → wizard
3. ✅ Create `CalibrationStatusBadge.tsx`:
   - Show profile name, last calibrated time
   - Quick recalibrate button
   - Status indicator (green = calibrated, yellow = default)
4. ✅ Integration test:
   - Calibrate → record delivery → verify speed uses new calibration
5. ✅ Update documentation:
   - `docs/manual-testing.md` Test Flow 2 (remove "Future UI")
   - `README.md` add calibration guide section
   - JSDoc comments for all new APIs

**Testing:**

- Integration test: full calibration workflow
- Manual testing on iOS Safari, Android Chrome, Desktop Chrome
- Accessibility test: keyboard navigation, ARIA labels
- Mobile touch test: two-point marking on small screens

---

## Acceptance Criteria Checklist

### Calibration UI

- [ ] User can mark two points on camera feed (touch/mouse)
- [ ] Visual feedback: crosshairs, connecting line, distance
- [ ] Real-time validation with clear error messages
- [ ] "Accept" button only enabled when valid
- [ ] "Retry" button clears points and restarts
- [ ] Calibration saves to localStorage
- [ ] Works on mobile (touch) and desktop (mouse)
- [ ] Accessible: keyboard navigation, ARIA labels, screen reader support

### Camera Settings

- [ ] Detects available constraints via `getCapabilities()`
- [ ] Shows only supported settings
- [ ] Settings apply immediately (no page reload)
- [ ] Presets work: "Fast Motion" applies low exposure + high shutter
- [ ] Settings persist with calibration profile
- [ ] Graceful fallback: "Not supported" message for unavailable settings
- [ ] Reset to defaults button works

### Integration

- [ ] Replaces hardcoded `DEFAULT_PITCH_LENGTH_PIXELS`
- [ ] Active calibration profile used in speed calculations
- [ ] `CalibrationStatusBadge` shows current profile and last calibrated time
- [ ] "Recalibrate" button always available
- [ ] Camera warnings in `CameraGuidance` link to wizard/settings
- [ ] Works with existing `PitchLengthSelector` (meters value)
- [ ] Profile switching updates UI immediately

### Testing

- [ ] Unit tests pass for hooks and utilities
- [ ] Component tests pass
- [ ] Integration test: calibrate → record → verify speed
- [ ] Manual test on iOS Safari (touch, constraint support)
- [ ] Manual test on Android Chrome (touch, constraint support)
- [ ] Manual test on Desktop Chrome (mouse, full constraint support)

---

## Edge Cases & Error Handling

### Calibration Wizard

1. **Points outside video bounds**

   - Clamp to video dimensions
   - Show warning: "Point is outside camera view"

2. **Points too close (<50px)**

   - Validation error: "Points too close - mark full pitch length"
   - "Accept" button disabled

3. **Points too far (>3840px, 4K width)**

   - Validation warning: "Very large distance - verify camera position"
   - Allow but show warning

4. **Unrealistic pixels-per-meter ratio**

   - E.g., 485px for 20.12m = 24.1 px/m (reasonable)
   - E.g., 50px for 20.12m = 2.5 px/m (too low)
   - Show error: "Check camera distance or pitch length setting"

5. **Video not loaded yet**

   - Disable "Calibrate" button
   - Show message: "Wait for camera to initialize"

6. **User changes PitchLengthSelector during calibration**
   - Reset wizard: "Pitch length changed - please recalibrate"

### Camera Settings

1. **Constraint not supported**

   - Check `capabilities` before rendering control
   - Show "Not available on this device"

2. **applyConstraints() fails**

   - Catch error, show message: "Could not apply setting"
   - Revert to previous setting

3. **Browser doesn't support capabilities API**

   - Feature detection: `if (!track.getCapabilities)`
   - Show message: "Advanced settings not available in this browser"

4. **iOS Safari limitations**
   - iOS often doesn't expose exposure/ISO controls
   - Show: "Camera settings limited on iOS Safari"

### Profile Management

1. **localStorage full**

   - Catch `QuotaExceededError`
   - Show error: "Storage full - delete old profiles"

2. **Corrupted profile data**

   - JSON parse error → reset to default
   - Show warning: "Profile data corrupted, using defaults"

3. **Multiple tabs open**
   - Listen for `storage` event
   - Sync profiles across tabs
   - Show notification: "Calibration updated in another tab"

---

## Browser Compatibility Matrix

| Feature            | Chrome Desktop | Chrome Android | Safari iOS | Safari Desktop | Edge | Firefox    |
| ------------------ | -------------- | -------------- | ---------- | -------------- | ---- | ---------- |
| getUserMedia       | ✅             | ✅             | ✅         | ✅             | ✅   | ✅         |
| getCapabilities()  | ✅             | ✅             | ❌ Limited | ⚠️ Partial     | ✅   | ⚠️ Partial |
| applyConstraints() | ✅             | ✅             | ⚠️ Basic   | ⚠️ Basic       | ✅   | ✅         |
| Exposure control   | ✅             | ✅             | ❌         | ❌             | ✅   | ⚠️         |
| ISO control        | ✅             | ⚠️             | ❌         | ❌             | ✅   | ❌         |
| Focus control      | ✅             | ✅             | ❌         | ❌             | ✅   | ⚠️         |
| Touch events       | ✅             | ✅             | ✅         | ✅             | ✅   | ✅         |
| localStorage       | ✅             | ✅             | ✅         | ✅             | ✅   | ✅         |

**Legend:**

- ✅ Fully supported
- ⚠️ Partial support / requires testing
- ❌ Not supported / very limited

**Progressive Enhancement Strategy:**

- Core calibration (two-point marking) works on ALL browsers
- Camera settings panel shows only supported constraints
- Fallback message for unsupported features
- Presets disabled if constraints not available

---

## Performance Considerations

### Calibration Wizard

- **Render Optimization**: Use `useMemo` for validation calculations
- **Canvas Performance**: Only redraw on point change, not every frame
- **Touch/Mouse**: Debounce rapid taps (prevent double-marking)

### Camera Settings

- **applyConstraints() Cost**: Can take 100-500ms
  - Show loading spinner during apply
  - Debounce slider changes (wait for user to stop dragging)
- **Live Preview**: No need to capture frames, settings apply to video stream directly

### Profile Storage

- **localStorage Access**: Synchronous, avoid on hot path
  - Load profiles once on mount
  - Save profiles on user action only (not on every change)
- **Profile Limit**: Max 10 profiles (warn user if approaching limit)

---

## UX Considerations

### Visual Feedback

1. **Crosshairs**: Large (24px), high contrast (white with black outline)
2. **Line**: Dashed, animated (marching ants effect)
3. **Distance Label**: Bold, positioned at line midpoint
4. **Validation**: ✅ Green checkmark or ❌ Red X with error text

### Instructions

- **Progressive Disclosure**: Show one instruction at a time
- **Visual + Text**: Icon + text for accessibility
- **Examples**: "Tap the white line at the bowler's end"

### Mobile Optimization

- **Large Touch Targets**: Buttons ≥44px
- **Bottom Sheet**: Settings panel slides up from bottom on mobile
- **Landscape Mode**: Encourage landscape for better pitch framing

### Accessibility

- **Keyboard Navigation**: Tab through calibration flow
- **Screen Readers**: Announce each step, validation result
- **Focus Management**: Move focus to "Accept" button when valid
- **High Contrast**: Ensure markers visible in all lighting

---

## Testing Strategy

### Unit Tests

**`useCalibrationWizard.test.ts`**

```typescript
describe('useCalibrationWizard', () => {
  it('starts with no points', () => { ... });
  it('adds points sequentially', () => { ... });
  it('validates distance > 50px', () => { ... });
  it('validates distance < 3840px', () => { ... });
  it('calculates pixels per meter', () => { ... });
  it('resets points on cancelCalibration', () => { ... });
  it('creates profile on acceptCalibration', () => { ... });
});
```

**`useCalibrationProfiles.test.ts`**

```typescript
describe('useCalibrationProfiles', () => {
  it('loads profiles from localStorage', () => { ... });
  it('sets active profile', () => { ... });
  it('creates new profile', () => { ... });
  it('updates existing profile', () => { ... });
  it('deletes profile', () => { ... });
  it('handles corrupted data gracefully', () => { ... });
});
```

**`useCameraSettings.test.ts`**

```typescript
describe('useCameraSettings', () => {
  it('detects capabilities', () => { ... });
  it('applies constraints', () => { ... });
  it('handles unsupported constraints', () => { ... });
  it('applies preset', () => { ... });
  it('resets to defaults', () => { ... });
});
```

### Component Tests

**`CameraCalibrator.test.tsx`**

```typescript
describe('CameraCalibrator', () => {
  it('renders overlay when isCalibrating', () => { ... });
  it('shows instructions for first point', () => { ... });
  it('marks point on click', () => { ... });
  it('shows instructions for second point', () => { ... });
  it('draws line between points', () => { ... });
  it('displays validation message', () => { ... });
  it('enables Accept button when valid', () => { ... });
  it('disables Accept button when invalid', () => { ... });
  it('resets on Retry click', () => { ... });
});
```

### Integration Tests

**`calibration-workflow.int.test.ts`**

```typescript
describe("Calibration Workflow", () => {
  it("calibrates and uses new calibration for speed calculation", async () => {
    // 1. Open calibration wizard
    // 2. Mark two points (485px apart)
    // 3. Accept calibration
    // 4. Record a delivery
    // 5. Verify speed calculation uses new pixels-per-meter ratio
  });
});
```

### Manual Testing Checklist

**Mobile (iOS Safari)**

- [ ] Touch calibration: mark two points
- [ ] Crosshairs visible and responsive
- [ ] Validation shows correct messages
- [ ] Profile saves and persists after reload
- [ ] Settings panel shows "Limited on iOS" message
- [ ] Landscape mode works

**Mobile (Android Chrome)**

- [ ] Touch calibration: mark two points
- [ ] Camera settings panel opens
- [ ] Exposure slider works (if supported)
- [ ] Presets apply correctly
- [ ] Profile saves and persists

**Desktop (Chrome)**

- [ ] Mouse calibration: click two points
- [ ] Keyboard navigation: Tab through wizard
- [ ] All camera settings available
- [ ] Constraint sliders responsive
- [ ] Multiple profiles management

**Edge Cases**

- [ ] Click outside video bounds → clamped to edges
- [ ] Change pitch length during calibration → wizard resets
- [ ] Calibrate, refresh page → profile persists
- [ ] Fill localStorage → error message shown
- [ ] No camera access → calibration disabled

---

## Documentation Updates

### README.md

Add section:

```markdown
## Camera Calibration

For accurate speed measurements, calibrate the camera once per setup:

1. **Position Camera**: Frame the full pitch (22 yards) in view
2. **Open Calibration**: Click "Calibrate Camera" button
3. **Mark Points**: Tap the bowling crease, then the batting crease
4. **Verify**: Check that distance matches pitch length
5. **Accept**: Click "Accept Calibration"

Your calibration is saved and used for all deliveries until you recalibrate.

### Camera Settings (Advanced)

Adjust exposure and ISO for fast-moving balls:

- Open "⚙️ Camera Settings"
- Use "Fast Motion" preset for low exposure
- Manually adjust if needed

**Note**: iOS Safari has limited camera control support.
```

### docs/manual-testing.md

Update Test Flow 2:

```markdown
## Test Flow 2: Calibration Process

### Objective

Validate calibration workflow and accuracy.

### Steps

1. **Position Camera**

   - Mount device on stable surface
   - Frame the pitch showing bowler to batter distance
   - Ensure camera is level

2. **Perform Calibration**

   - Click "Calibrate Camera" button
   - Tap/click bowling crease position
   - Tap/click batting crease position
   - Verify pixel distance displayed (expect 400-800px)
   - Expected: ✅ "Calibration looks good!"

3. **Accept Calibration**

   - Click "Accept Calibration" button
   - Expected: Profile saved, badge shows "Calibrated X mins ago"

4. **Verify Calibration Values**

   - Open browser DevTools → Application → localStorage
   - Check `speedometer_calibration_profiles`
   - Verify `pitchLengthPixels` is reasonable (400-800px)
   - Verify `referenceDistanceMeters` is 20.12 (or selected value)

5. **Test Recalibration**
   - Click "Recalibrate" button
   - Mark different points
   - Verify new values saved

### Pass Criteria

- Calibration completes without errors
- Points marked accurately with visual feedback
- Validation shows clear errors for invalid inputs
- Profile persists after page reload
- Speed calculations use new calibration
```

---

## Definition of Done

- [ ] All code written, reviewed, and merged
- [ ] All unit tests passing (coverage ≥80%)
- [ ] All component tests passing
- [ ] Integration test passing
- [ ] Manual testing completed on 3 browsers (Chrome, Safari iOS, Chrome Android)
- [ ] No critical bugs or accessibility issues
- [ ] Documentation updated (README, manual-testing.md)
- [ ] JSDoc comments added to all public APIs
- [ ] GitHub issue #30 closed with summary comment
- [ ] Demo video recorded showing full workflow
- [ ] Project plan updated with completion date

---

## Risk Mitigation

### Risk 1: iOS Safari Limited Constraint Support

**Mitigation:**

- Progressive enhancement: core calibration works without constraints
- Clear messaging: "Camera settings limited on iOS"
- Test early on iOS device

### Risk 2: Users Struggle with Two-Point Marking

**Mitigation:**

- Clear visual instructions with images/animations
- Large touch targets (44px minimum)
- Allow retry without penalty
- Provide example video in README

### Risk 3: Calibration Profiles Accumulate, Fill localStorage

**Mitigation:**

- Limit to 10 profiles max
- Show warning at 8 profiles
- Provide "Delete Old Profiles" button
- Implement auto-cleanup (delete profiles >90 days old)

### Risk 4: Performance Issues on Low-End Devices

**Mitigation:**

- Debounce slider changes (300ms)
- Use `useMemo` for validation calculations
- Lazy load CameraSettings component
- Test on mid-range Android device

---

## Next Steps After Completion

1. **Analytics** (Optional):

   - Track calibration completion rate
   - Monitor settings preset usage
   - Identify common calibration errors

2. **Advanced Features** (Future):

   - Auto-calibration using stump detection
   - Perspective correction (homography matrix)
   - Calibration quality score
   - Cloud sync of profiles

3. **User Feedback**:
   - Collect feedback on calibration UX
   - Iterate on instructions clarity
   - Improve error messages based on real usage

---

**Status:** Ready for Development  
**Assigned To:** Frontend Team  
**Start Date:** 2025-10-28  
**Target Completion:** 2025-10-31
