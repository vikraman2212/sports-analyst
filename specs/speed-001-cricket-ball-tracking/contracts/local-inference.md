# Contract: Local Inference Interface

## Purpose

Defines the JavaScript-facing contract for analyzing a single cricket delivery locally in the browser (no backend service).

## Function Signature

```ts
analyzeDelivery(options: AnalyzeDeliveryOptions): Promise<AnalyzeDeliveryResult>
```

### AnalyzeDeliveryOptions

| Field               | Type                    | Required | Description                                  |
| ------------------- | ----------------------- | -------- | -------------------------------------------- |
| frames              | VideoFrameLike[]        | yes      | Ordered sampled frames (with timestamps)     |
| calibration         | CalibrationProfileInput | yes      | Pitch calibration metadata                   |
| samplingIntervalMs  | number                  | no       | Hint for frame interval used                 |
| minDetections       | number                  | no       | Minimum detections required (default 3)      |
| confidenceThreshold | number                  | no       | Detection confidence threshold (default 0.5) |

### VideoFrameLike

| Field       | Type        | Description         |
| ----------- | ----------- | ------------------- |
| data        | ImageBitmap | Raw frame bitmap    |
| timestampMs | number      | Monotonic timestamp |
| index       | number      | Sequential index    |
| width       | number      | Frame width         |
| height      | number      | Frame height        |

### CalibrationProfileInput

| Field              | Type   | Description                                        |
| ------------------ | ------ | -------------------------------------------------- |
| pitchPixelDistance | number | Pixel distance between user-marked pitch endpoints |
| pitchMeters        | number | Must be 20.12 (constant)                           |
| pixelToMeterRatio  | number | pitchMeters / pitchPixelDistance                   |

### AnalyzeDeliveryResult

| Field           | Type              | Description                             |
| --------------- | ----------------- | --------------------------------------- |
| speedKmh        | number            | Computed speed (km/h)                   |
| speedConfidence | number            | 0-1 heuristic confidence                |
| trajectory      | TrajectoryPoint[] | Smoothed trajectory points              |
| detections      | DetectionOut[]    | Raw detection outputs                   |
| processingMs    | number            | Total processing time                   |
| framesUsed      | number            | Number of frames included               |
| warnings        | string[]          | Non-fatal issues (e.g., low confidence) |
| meta            | object            | Additional diagnostic fields            |

### TrajectoryPoint

| Field       | Type   | Description           |
| ----------- | ------ | --------------------- |
| frameIndex  | number | Source frame index    |
| timestampMs | number | Timestamp             |
| x           | number | Raw pixel X           |
| y           | number | Raw pixel Y           |
| sx          | number | Smoothed X (optional) |
| sy          | number | Smoothed Y (optional) |

### DetectionOut

| Field      | Type                                                | Description          |
| ---------- | --------------------------------------------------- | -------------------- |
| frameIndex | number                                              | Frame index          |
| bbox       | { x:number, y:number, width:number, height:number } | Bounding box         |
| confidence | number                                              | Detection confidence |
| cx         | number                                              | Center X             |
| cy         | number                                              | Center Y             |

## Error Modes

| Condition                   | Behavior                                                           |
| --------------------------- | ------------------------------------------------------------------ |
| frames empty                | Reject promise with error code `NO_FRAMES`                         |
| calibration missing/invalid | Reject with `INVALID_CALIBRATION`                                  |
| insufficient detections     | Resolve with `speedKmh` null and warning `INSUFFICIENT_DETECTIONS` |
| model load failure          | Reject with `MODEL_LOAD_FAILED`                                    |
| inference error per frame   | Add warning; continue (unless all fail)                            |

## Success Criteria

- Returns speed when ≥3 valid detections spanning ≥2 distinct timestamps.
- Returns trajectory length ≥ number of detections used.
- Processing time reported for benchmarking.

## Example Invocation

```ts
const result = await analyzeDelivery({
  frames: sampledFrames,
  calibration: {
    pitchPixelDistance: 1830,
    pitchMeters: 20.12,
    pixelToMeterRatio: 0.01099,
  },
  samplingIntervalMs: 66,
  confidenceThreshold: 0.5,
});
if (result.speedKmh) {
  console.log(`Speed: ${result.speedKmh.toFixed(1)} km/h`);
} else {
  console.warn(result.warnings);
}
```

## Future Extensions

- Add mph output field if toggle enabled.
- Add JSON schema for validation.
- Support streaming partial results via async generator.

---
