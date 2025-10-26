# [Speedometer] Constitution

<!-- Cricket Ball Speed Detection System -->

## Core Principles

### I. Mobile-First Computer Vision

- Primary UX: modern web (mobile and desktop browsers) with PWA support; native mobile is optional Phase 2
- Ultralytics YOLOv8-based detection pipeline (PyTorch for training; ONNX Runtime Web for in-browser inference)
- Real-time or near-real-time ball detection and tracking
- Minimum viable accuracy: 90% ball detection rate in standard cricket conditions

### II. Ball Speed Calculation

- Track cricket ball position across consecutive video frames
- Calculate speed using pixel displacement and known reference distances
- Support both mph and km/h units
- Target accuracy: ±5% of actual ball speed

### III. Input Requirements

- Accept video input from mobile phone camera (minimum 30 fps, recommended 60+ fps)
- Support standard cricket ball (red or white)
- Require camera calibration using known reference object (stumps, pitch length, etc.)
- Handle varying lighting conditions (daylight, floodlights)

### IV. Output Requirements

- Display ball speed per delivery
- Provide trajectory visualization overlay on video
- Export data in JSON format (timestamp, speed, trajectory coordinates)
- Generate human-readable summary statistics

### V. Model Training & Validation

- Training dataset: minimum 1000 labeled cricket ball frames
- Validation split: 80/20 train/test
- Use fast.ai's pre-trained models for transfer learning
- Document model performance metrics (precision, recall, F1-score)

## Technical Stack

### Required Components

- **ML Framework (Training)**: Ultralytics YOLOv8 on PyTorch
- **Inference (Web)**: ONNX Runtime Web (WASM SIMD, optional WebGPU) in Next.js
- **Web App**: Next.js (App Router, TypeScript, Tailwind), PWA-capable for mobile
- **Mobile App (Optional Phase 2)**: React Native with CoreML (iOS) / TFLite (Android)
- **Video Processing**: Web Media APIs (getUserMedia), Canvas/WebGL(WebGPU) for preprocessing; OpenCV.js optional
- **Model Formats**: ONNX (browser via onnxruntime-web); CoreML/TFLite (mobile); optional TorchScript/ONNX Runtime for server-side

### Performance Standards

- Web inference (browser): target ≤ 33ms per frame at 720p on modern laptops (30 FPS), stretch ≤ 16ms (60 FPS) with WebGPU
- Mobile inference: target < 100ms per frame on mid-range devices
- Battery efficiency: < 30% battery drain for 1-hour session (mobile)
- Storage: Model size < 50MB for mobile deployment; < 25MB preferred for web download

## Development Workflow

### Phase 1: Data Collection & Labeling

- Collect cricket ball video footage from mobile cameras
- Label ball positions in frames using annotation tools
- Validate dataset quality and diversity

### Phase 2: Model Development

- Implement object detection model using Ultralytics YOLOv8
- Train on labeled dataset with data augmentation
- Validate accuracy and speed metrics
- Export to ONNX (web) and CoreML/TFLite (mobile); optimize for target runtimes

### Phase 3: Speed Calculation Engine

- Implement pixel-to-real-world coordinate mapping
- Develop speed calculation algorithm
- Calibration interface for reference measurements

### Phase 4: Mobile Integration

- Export trained model to CoreML/TFLite
- Integrate inference engine into React Native app (optional Phase 2)
- Implement real-time video processing pipeline
- Add UI for speed display and visualization

### Phase 4a: Web Integration (Primary)

- Integrate ONNX Runtime Web into Next.js app for in-browser inference
- Use MediaStream + Canvas/WebGL/WebGPU for frame acquisition and preprocessing
- Implement calibration, detection, speed calculation, and overlays in web UI

## Governance

### Quality Gates

- All code changes require tests with >80% coverage
- Model updates require validation on held-out test set
- Mobile app updates require performance benchmarking
- User acceptance testing before production deployment

### Version Control

- Model versioning: MAJOR.MINOR.PATCH format
- Track model metrics in version control
- Maintain backward compatibility for mobile apps

**Version**: 1.1.0 | **Ratified**: 2025-10-05 | **Last Amended**: 2025-10-26
