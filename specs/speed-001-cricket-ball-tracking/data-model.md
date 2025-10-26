# Data Model: Cricket Ball Tracking Prototype

## Overview

Prototype maintains ephemeral in-memory structures (no persistence). Entities defined here guide interfaces, validation, and potential future storage schema.

## Entities

### Delivery

Represents a single bowling delivery session from calibration lock to result output.

- Fields:
  - id: UUID
  - createdAt: timestamp (ms)
  - status: enum { CAPTURING, PROCESSING, COMPLETE, FAILED }
  - speedKmh: float (nullable until computed)
  - speedConfidence: float (0-1, nullable)
  - trajectory: Array<TrajectoryPoint>
  - detections: Array<Detection>
  - calibrationRef: CalibrationProfile.id
  - frameCount: int (captured frames considered)
  - notes: string (optional error or failure message)
- Constraints:
  - speedKmh > 0 when status = COMPLETE
  - At least 3 detections required to compute speed

### FrameSample

Represents a processed frame used in detection pipeline.

- Fields:
  - id: UUID
  - deliveryId: Delivery.id
  - index: int (monotonic frame sequence)
  - timestampMs: int
  - roi: { x: int, y: int, width: int, height: int } (optional if cropped)
  - detectionId: Detection.id (nullable)
- Constraints:
  - index unique per delivery

### Detection

Represents a single model inference result for the ball in a frame.

- Fields:
  - id: UUID
  - frameId: FrameSample.id
  - bbox: { x: float, y: float, width: float, height: float }
  - confidence: float (0-1)
  - center: { cx: float, cy: float }
- Constraints:
  - confidence ≥ configured MIN_CONFIDENCE (e.g., 0.5) to be used in trajectory

### TrajectoryPoint

Normalized sequence of ball positions for visualization & speed computation.

- Fields:
  - id: UUID
  - deliveryId: Delivery.id
  - frameIndex: int
  - timestampMs: int
  - pixelX: float
  - pixelY: float
  - smoothedX: float (nullable until smoothing pass)
  - smoothedY: float (nullable until smoothing pass)
- Constraints:
  - pixelX, pixelY within frame bounds

### CalibrationProfile

Defines conversion from pixel units to real-world meters using 22-yard pitch reference.

- Fields:
  - id: UUID
  - createdAt: timestamp
  - pitchPixelDistance: float (distance in pixels between user-marked endpoints)
  - pitchMeters: float (constant 20.12)
  - pixelToMeterRatio: float (pitchMeters / pitchPixelDistance)
  - method: enum { FULL_PITCH_22Y }
- Constraints:
  - pitchPixelDistance > 0
  - pixelToMeterRatio > 0

## Relationships

- Delivery 1 — \* FrameSample
- FrameSample 0..1 — 1 Detection
- Delivery 1 — \* Detection (through frames)
- Delivery 1 — \* TrajectoryPoint
- Delivery 1 — 1 CalibrationProfile

## Derived / Computed Values

- speedKmh = (distanceMeters / timeSeconds) \* 3.6
  - distanceMeters = (firstPoint.pixelDistanceTo(lastPoint) \* pixelToMeterRatio)
  - timeSeconds = (lastPoint.timestampMs - firstPoint.timestampMs)/1000
- speedConfidence heuristic factors:
  - number of detections
  - average confidence
  - path linearity (R^2 of simple regression)

## Validation Rules Summary

| Entity      | Rule                            | Reason                    |
| ----------- | ------------------------------- | ------------------------- |
| Delivery    | ≥3 detections before speed calc | Prevent noisy estimation  |
| Delivery    | speedKmh > 0 if COMPLETE        | Data integrity            |
| Detection   | confidence ≥ threshold          | Filter low-quality points |
| Calibration | pitchPixelDistance > 0          | Avoid divide-by-zero      |

## Future Extensions

- 3D trajectory estimation (add depth estimate field)
- Multi-camera correlation entity
- Persistent session storage schema (database migration path)

---
