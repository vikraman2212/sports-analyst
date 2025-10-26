# [Speedometer] Constitution

<!-- Cricket Ball Speed Detection System -->

## Core Principles

### I. Mobile-First Computer Vision

- System must operate on mobile phone cameras (iOS/Android)
- fast.ai framework as the primary ML/CV library
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

- **ML Framework**: fast.ai (PyTorch backend)
- **Mobile App**: React Native or Flutter with ML inference capability
- **Video Processing**: OpenCV or equivalent for frame extraction
- **Model Format**: ONNX or CoreML/TFLite for mobile deployment

### Performance Standards

- Inference time: < 100ms per frame on mid-range mobile devices
- Battery efficiency: < 30% battery drain for 1-hour session
- Storage: Model size < 50MB for mobile deployment

## Development Workflow

### Phase 1: Data Collection & Labeling

- Collect cricket ball video footage from mobile cameras
- Label ball positions in frames using annotation tools
- Validate dataset quality and diversity

### Phase 2: Model Development

- Implement object detection model using fast.ai
- Train on labeled dataset with data augmentation
- Validate accuracy and speed metrics
- Optimize for mobile deployment

### Phase 3: Speed Calculation Engine

- Implement pixel-to-real-world coordinate mapping
- Develop speed calculation algorithm
- Calibration interface for reference measurements

### Phase 4: Mobile Integration

- Export trained model to mobile-compatible format
- Integrate inference engine into mobile app
- Implement real-time video processing pipeline
- Add UI for speed display and visualization

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

**Version**: 1.0.0 | **Ratified**: 2025-10-05 | **Last Amended**: 2025-10-05
