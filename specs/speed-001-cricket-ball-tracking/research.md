# Research: Cricket Ball Tracking System (Phase 0)

## Overview

This document captures decisions, rationale, alternatives, risks, and follow-ups required to proceed to Phase 1 design for the cricket ball tracking prototype.

## Focus Areas & Decisions

### 1. Detection Approach

- **Decision**: Start with a lightweight single-class object detection model (transfer learning) rather than pure color/motion heuristics.
- **Rationale**: Robust to varying background and lighting; leverages pretrained weights to reduce required dataset size.
- **Alternatives**:
  - Color threshold + motion differencing: Fast but brittle under shadows / color similar backgrounds.
  - Full multi-class detector: Unnecessary complexity (only need ball class now).
- **Risks**: Small ball size in frame → potential low recall.
- **Mitigations**: Data augmentation (scale, brightness); consider super-resolution crop path later.

### 2. Frame Sampling Strategy

- **Decision**: Sample every 2nd frame at 30fps (effective 15fps) for detection; interpolate missing positions.
- **Rationale**: Reduces compute and energy while preserving enough temporal resolution for speed estimation (<5s latency budget acceptable).
- **Alternatives**: Full-frame continuous detection (higher CPU), event-driven (optical flow triggers) complexity overhead.
- **Risks**: Missed frames at release point may degrade speed accuracy.
- **Mitigations**: Adaptive ramp-up (sample every frame during first 0.5s after ball release detection).

### 3. Trajectory Modeling

- **Decision**: Store raw pixel coordinates + apply smoothing (moving average) and simple parabolic fit only if ≥5 reliable detections.
- **Rationale**: Reduces early complexity while enabling basic trajectory visualization.
- **Alternatives**: Kalman filter (overhead for v1), cubic spline (overfitting risk with sparse points).
- **Risks**: Occasional jitter / discontinuity.
- **Mitigations**: Minimum detection confidence threshold; outlier rejection (median absolute deviation).

### 4. Calibration & Distance Mapping

- **Decision**: Use full pitch length (22 yards → 20.12m) as a single global scale factor derived from two manually selected pitch endpoints in a calibration step.
- **Rationale**: Leverages known constant; simpler than full homography.
- **Alternatives**: Automatic stump detection; multi-point homography; marker-based AR tags.
- **Risks**: Perspective distortion if camera not centered/leveled.
- **Mitigations**: Guidance text: position camera as level as possible; future upgrade to partial homography.

### 5. Speed Calculation Method

- **Decision**: Compute speed from linear displacement between earliest reliable detection and pre-impact detection frames (time delta via frame timestamps), converted using calibration scale.
- **Rationale**: Straightforward, minimal computation.
- **Alternatives**: Polynomial fit + derivative (noise sensitive), multi-segment velocity averaging.
- **Risks**: Overestimation if early detection is late in trajectory (e.g., misses release).
- **Mitigations**: Require minimum path length threshold; flag low-confidence speed if path length < threshold.

### 6. ONNX Browser Inference

- **Decision**: Export fast.ai model to ONNX and load via ONNX Runtime Web (wasm backend first; webgl/webgpu experiment later).
- **Rationale**: Broad browser compatibility; avoids native app complexity.
- **Alternatives**: WebAssembly custom PyTorch build (heavier), TensorFlow.js conversion path.
- **Risks**: Performance variance across devices; large initial load time.
- **Mitigations**: Model quantization (int8) if size >40MB; lazy load post camera permission.

### 7. Energy Efficiency Considerations

- **Decision**: Region-of-interest cropping after first confirmed detection to reduce per-frame compute footprint.
- **Rationale**: Smaller tensors => faster inference & lower battery.
- **Alternatives**: Dynamic resolution scaling; multi-scale pyramid.
- **Risks**: Losing ball if it exits ROI.
- **Mitigations**: Expand ROI margin; fallback to periodic full-frame scan (e.g., every 10th frame).

### 8. Dataset & Labeling Plan

- **Decision**: Assemble ≥1000 labeled frames (ball bounding boxes) from recorded practice sessions; augment (flip, brightness, blur, scale).
- **Rationale**: Meets constitution minimum; augmentation improves generalization.
- **Alternatives**: Synthetic renderings (time-consuming), public baseball datasets (domain mismatch).
- **Risks**: Class imbalance (few frames with ball visible early/late).
- **Mitigations**: Directed frame sampling focusing on release & near-impact segments.

### 9. Accuracy & Evaluation Metrics

- **Decision**: Track (a) Detection precision/recall, (b) Speed absolute error (|pred - ref| / ref), (c) Latency from capture to display.
- **Rationale**: Directly tied to constitution KPI.
- **Alternatives**: Add F1 later; add energy (mAh/min) once instrumentation ready.
- **Risks**: Ground truth speed not easily available.
- **Mitigations**: Use manual timing with high-FPS reference clip subset; plan future radar comparison.

### 10. Failure Handling Design

- **Decision**: If <3 valid detections => display “Insufficient data for speed” and allow immediate reset.
- **Rationale**: Avoid misleading speeds.
- **Alternatives**: Attempt extrapolation (likely noisy).
- **Risks**: User frustration on frequent failures.
- **Mitigations**: Provide calibration & framing guidance.

## Open Follow-Ups (Deferred)

- Mph / km/h toggle feature toggle (future spec).
- Advanced perspective correction via homography.
- Multi-camera fusion.
- Persistent session history & export.
- Edge device GPU acceleration (WebGPU backend test).

## Risks & Mitigations Summary

| Risk                   | Impact               | Mitigation                                   |
| ---------------------- | -------------------- | -------------------------------------------- |
| Small ball size        | Missed detections    | Augmentation + ROI scaling                   |
| Lighting variability   | False negatives      | Brightness augmentation + adaptive threshold |
| Latency >5s            | User dissatisfaction | Frame sampling + ROI cropping + quantization |
| Perspective distortion | Speed error >±5%     | Camera guidance + future homography          |
| Large model size       | Slow load            | Quantization, pruning                        |

## Exit Criteria Validation

All required decisions documented; no remaining blockers for Phase 1 artifacts.

---
