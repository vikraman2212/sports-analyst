# Task 16 Quick Reference: Camera Calibration

**Status:** ✅ COMPLETE | **Tests:** 588/588 PASSING | **Build:** ✅ SUCCESS

---

## What Was Built

Interactive camera calibration wizard allowing users to mark pitch distance on camera feed with full profile management.

---

## User Workflow

```
1. Click "Calibrate" button (status badge or guidance button)
   ↓
2. Mark bowling crease (tap/click on camera feed)
   ↓
3. Mark batting crease (tap/click again)
   ↓
4. See pixel distance calculated (e.g., "485px")
   ↓
5. Get validation feedback (✓ green or ⚠ warning)
   ↓
6. Click "Accept" → Profile saved to localStorage
   ↓
7. See calibration active in status badge
```

---

## Key Files

### Core Logic

- `lib/calibration/wizard.ts` - 8 utility functions (distance, validation, IDs)
- `hooks/useCalibrationProfiles.ts` - CRUD with localStorage persistence

### UI Components

- `components/CameraCalibrator.tsx` - Two-point marking overlay
- `components/CalibrationStatusBadge.tsx` - Status display
- `components/CameraGuidance.tsx` - Action buttons ("📐 Calibrate Camera")

### Integration

- `app/page.tsx` - Workflow wiring (handleStartCalibration, etc.)
- `components/CameraView.tsx` - Overlay rendering

---

## Testing

### Unit Tests (34 total)

```bash
pnpm test -- calibrationWizard.unit.test.ts
```

**Coverage:**

- `calculatePixelDistance` (6 tests)
- `validateCalibration` (9 tests)
- `calculatePixelsPerMeter` (5 tests)
- `generateCalibrationId` (4 tests)
- `estimateExpectedPixels` (7 tests)
- Integration workflow (3 tests)

### Integration Tests (9 total)

```bash
pnpm test -- calibrationWorkflow.int.test.tsx
```

**Coverage:**

- Profile creation & storage
- localStorage persistence & sync
- Profile updates & deletion
- Active profile switching
- Calculated values verification

### Manual Testing

See `docs/manual-testing.md` **Test Flow 2** (6 sub-scenarios)

---

## localStorage Structure

### Keys

```typescript
"speedometer_calibration_profiles"; // Array of CalibrationProfile
"speedometer_active_calibration_id"; // Active profile ID (string)
```

### Profile Format

```json
{
  "id": "calib_1730053200_a1b2c3",
  "name": "Cricket Ground - Main Pitch",
  "pitchLengthPixels": 485,
  "referenceDistanceMeters": 20.12,
  "ballMassGrams": 156,
  "createdAt": "2025-10-28T...",
  "homographyMatrix": null
}
```

---

## Validation Rules

| Condition                 | Status     | Message                                  |
| ------------------------- | ---------- | ---------------------------------------- |
| Distance < 50px           | ❌ ERROR   | "Too close together"                     |
| Distance > video diagonal | ❌ ERROR   | "Exceeds frame diagonal"                 |
| 50-100px                  | ⚠️ WARNING | "Distance is short, consider re-marking" |
| ≥ 100px                   | ✅ VALID   | Green checkmark                          |

---

## Acceptance Criteria (10/10 ✅)

1. ✅ Mark two points with visual feedback
2. ✅ Real-time pixel distance calculation
3. ✅ Validation errors for unrealistic values
4. ✅ Saves to localStorage
5. ✅ Works on mobile (touch) and desktop (mouse)
6. ✅ Accessible (ARIA labels, keyboard nav ready)
7. ✅ Replaces hardcoded DEFAULT_PITCH_LENGTH_PIXELS
8. ✅ Current calibration status visible
9. ✅ Recalibrate button always available
10. ✅ Camera warnings link to calibration wizard

---

## Commands

```bash
# Run all tests
pnpm test

# Run calibration tests only
pnpm test -- calibration

# Build production
pnpm build

# Dev server
pnpm dev
```

---

## Future Enhancements (Out of Scope)

- Camera settings controls (exposure, ISO, shutter) - UI exists but not wired
- Homography matrix for perspective correction
- Auto-calibration using stump detection
- Calibration quality score
- Cloud sync of profiles

---

## Related Tasks

- **T1:** Configurable Pitch Length (#15) - Provides `referenceDistanceMeters`
- **T2:** Configurable Ball Weight (#16) - Provides `ballMassGrams`
- **T4:** Camera Diagnostics & Guidance (#17) - Provides actionable warnings

---

**Quick Start:**

1. Open app → See "Uncalibrated" badge
2. Click "Calibrate" button
3. Mark bowling crease → batting crease
4. Click "Accept" → Done!

**Documentation:** See `T16_COMPLETION_SUMMARY.md` for full details.
