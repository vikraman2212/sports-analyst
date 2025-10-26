# Quickstart: Cricket Ball Tracking Prototype

## Prerequisites

- Node.js 20+
- Python 3.11 (for model training/export pipeline)
- Git (optional but recommended)

## 1. Clone & Install (Frontend Prototype)

```bash
# From repository root (placeholder commands - adjust when frontend scaffold added)
cd frontend
npm install
```

## 2. Prepare Model Artifact (Placeholder)

Until the trained ONNX model is available, a dummy model file may be used for wiring.

```bash
# After training (future):
# python ml/training/export_to_onnx.py --weights runs/best.pth --out frontend/public/model.onnx
```

## 3. Run Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

## 4. Calibrate

Calibration is critical for accurate speed measurements. The system needs to know the relationship between pixels in the camera view and real-world distances.

### Understanding Calibration

The app converts pixel distances to meters using a calibration profile:

```typescript
interface CalibrationProfile {
  pitchLengthPixels: number; // Measured pixel distance
  referenceDistanceMeters: number; // 22 yards = 20.12 meters
  homographyMatrix: number[][] | null; // Advanced: 3D perspective correction
}
```

### Basic Calibration (Simple Mode)

1. **Position Your Camera**

   - Mount device on stable surface or tripod
   - Frame the full delivery path (bowler to batter)
   - Ensure camera is level and perpendicular to pitch
   - Avoid extreme angles (>30° from horizontal)

2. **Measure Pitch Distance in Pixels**

   - The app will prompt you to mark two points on the pitch
   - Click/tap the **release point** (where ball leaves bowler's hand)
   - Click/tap the **delivery point** (where ball reaches batter)
   - The pixel distance will be calculated automatically

3. **Verify Calibration**
   - Check that `pitchLengthPixels` is reasonable (typically 400-800px for mobile)
   - The reference distance is fixed at 20.12 meters (22 yards)
   - Ratio: `pixelsPerMeter = pitchLengthPixels / 20.12`

### Advanced Calibration (Homography - Future)

For more accurate measurements accounting for camera perspective:

1. **Mark Ground Plane Points**

   - Mark 4 corners of a known rectangular area on pitch
   - App calculates homography matrix for perspective correction

2. **Benefits**
   - Corrects for camera angle distortion
   - More accurate speed at varying distances
   - Better trajectory reconstruction

### Calibration Best Practices

✅ **Do:**

- Use a tripod or stable mount
- Calibrate in same position you'll use for recording
- Recalibrate if you move the camera
- Ensure good lighting for clear markings
- Keep camera as level as possible

❌ **Don't:**

- Calibrate with handheld device (too unstable)
- Use extreme camera angles (>45°)
- Calibrate once and move camera
- Assume default calibration will work

### Calibration Accuracy Requirements

| Camera Distance | Recommended Pixel Span | Expected Accuracy |
| --------------- | ---------------------- | ----------------- |
| Close (5-10m)   | 600-1000px             | ±2 km/h           |
| Medium (10-20m) | 400-800px              | ±3 km/h           |
| Far (20-30m)    | 200-500px              | ±5 km/h           |

### Troubleshooting Calibration

**"Calibration values seem incorrect"**

- Verify you marked the correct points (release to delivery, not crease lines)
- Check pitch length is 20.12m (standard cricket pitch)
- Ensure camera didn't move between calibration and recording

**"Speed measurements are inconsistent"**

- Recalibrate with more precision
- Check camera stability during recording
- Ensure lighting is consistent
- Verify pitch distance is correct

**"Can't see calibration markers clearly"**

- Improve lighting conditions
- Use higher camera resolution
- Zoom in if needed (but maintain same zoom for recording)
- Mark physical points on pitch if permitted

### Calibration Persistence

- Current implementation: Calibration stored in session only
- Resets on page reload
- Future: Save calibration profiles per location/setup
- Tip: Take a screenshot of calibration values for reference

## 5. Capture & Analyze

1. Tap/Click "Start Delivery".
2. Record until ball reaches batter.
3. Tap "Process".
4. View speed (km/h) and trajectory overlay.
5. (Optional) Take a native screenshot to share.
6. Press "Reset" for next delivery.

## 6. Interpreting Results

- "Insufficient data" warning: Not enough reliable detections (try steadier framing).
- Low confidence: Path too short or jittery detections.
- Speed null: Fewer than 3 valid detections.

## 7. Development Notes

- Frame sampling currently every 2nd frame (configurable in `lib/config.ts`).
- ROI cropping activates after first confirmed detection.
- Calibration ratio stored in memory only.

## 8. Testing (Future)

```bash
# Python tests (speed calc)
pytest tests

# Frontend component & integration tests
npm test
```

## 9. Troubleshooting

| Issue              | Possible Cause                            | Action                           |
| ------------------ | ----------------------------------------- | -------------------------------- |
| No camera access   | Browser permission denied                 | Enable permissions & reload      |
| Speed always null  | Calibration missing or detections failing | Recalibrate; check lighting      |
| High latency       | Large model or low-end device             | Attempt lower resolution capture |
| Jittery trajectory | Sparse detections                         | Improve framing stability        |

## 10. Roadmap Hooks

- Mph toggle (future flag)
- JSON export button
- Homography-based calibration
- Persistent session history

---
