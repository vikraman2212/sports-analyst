# Architecture Documentation

## Overview

The Cricket Ball Speed Tracker is designed with a **browser-first, privacy-focused architecture** that runs entirely on the client side. This document explains the current implementation, future enhancements, and design decisions.

---

## Current Architecture (v1.0 - Browser-Only)

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User's Browser (Client-Side)                  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Next.js Application                      │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │  UI Layer    │  │  Hooks Layer │  │  Library Layer   │  │  │
│  │  │              │  │              │  │                  │  │  │
│  │  │ CameraView   │─▶│useCameraFeed │─▶│ detection/      │  │  │
│  │  │ SpeedDisplay │  │useInference  │  │ calibration/    │  │  │
│  │  │ Trajectory   │  │              │  │ speed-calc/     │  │  │
│  │  │ ExportButton │  │              │  │ export/         │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  │                                                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Browser APIs & Resources                       │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │ getUserMedia │  │ ONNX Runtime │  │  Canvas API     │  │  │
│  │  │   (Camera)   │  │   (WebGL)    │  │  (Rendering)    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │  Clipboard   │  │  File API    │  │  Web Share API  │  │  │
│  │  │    API       │  │  (Download)  │  │    (Mobile)     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  │                                                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Local Storage (Browser)                    │  │
│  │                                                              │  │
│  │  • model.onnx (static asset ~10-50MB)                       │  │
│  │  • Session data (in-memory only)                            │  │
│  │  • Calibration profile (session storage)                    │  │
│  │                                                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

        Device Camera ──▶ Browser ──▶ Analysis ──▶ Display
        (Video Input)     (Processing)  (Results)   (UI)
```

### Detailed Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Processing Pipeline                          │
└──────────────────────────────────────────────────────────────────┘

1. CAMERA CAPTURE
   ┌────────────┐
   │   Camera   │ getUserMedia() at 30fps
   │   Device   │────────────────────────┐
   └────────────┘                        │
                                         ↓
                              ┌──────────────────┐
                              │  Video Element   │
                              │  <video> tag     │
                              └──────────────────┘
                                         │
2. FRAME SAMPLING                        │
                                         ↓
                              ┌──────────────────┐
                              │  Frame Sampler   │
                              │  - Every Nth     │
                              │  - Adaptive rate │
                              └──────────────────┘
                                         │
3. BALL DETECTION                        │
                                         ↓
                              ┌──────────────────┐
                              │  ONNX Runtime    │
                              │  - model.onnx    │
                              │  - WebGL accel   │
                              │  - ROI cropping  │
                              └──────────────────┘
                                         │
                                         ↓
                           ┌─────────────────────────┐
                           │  Detection Results      │
                           │  [{x, y, conf, class}]  │
                           └─────────────────────────┘
                                         │
4. TRAJECTORY BUILDING                   │
                                         ↓
                              ┌──────────────────┐
                              │  Trajectory      │
                              │  - Smoothing     │
                              │  - Outlier filter│
                              │  - Timestamps    │
                              └──────────────────┘
                                         │
5. CALIBRATION                           │
                                         ↓
                              ┌──────────────────┐
                              │  Calibration     │
                              │  - Pixels→Meters │
                              │  - 22 yard pitch │
                              └──────────────────┘
                                         │
6. SPEED CALCULATION                     │
                                         ↓
                              ┌──────────────────┐
                              │  Speed Math      │
                              │  distance/time   │
                              │  → km/h          │
                              └──────────────────┘
                                         │
7. QUALITY ANALYSIS                      │
                                         ↓
                              ┌──────────────────┐
                              │  Warning Gen     │
                              │  - Confidence    │
                              │  - Detection qty │
                              └──────────────────┘
                                         │
8. DISPLAY                               │
                                         ↓
                     ┌───────────────────────────────┐
                     │        UI Components          │
                     │  • SpeedDisplay (km/h)        │
                     │  • TrajectoryOverlay (canvas) │
                     │  • Warnings & metrics         │
                     │  • Export (JSON)              │
                     └───────────────────────────────┘
```

---

## Component Architecture

### Frontend Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        LAYER 1: UI                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  src/components/                                            │
│  ├── CameraView.tsx         ← Main recording interface     │
│  ├── SpeedDisplay.tsx       ← Results visualization        │
│  ├── TrajectoryOverlay.tsx  ← Canvas drawing               │
│  └── ExportButton.tsx       ← JSON export UI               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 2: HOOKS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  src/hooks/                                                 │
│  ├── useCameraFeed.ts       ← Camera management            │
│  │   • getUserMedia wrapper                                │
│  │   • Frame capture                                       │
│  │   • Error handling                                      │
│  │                                                          │
│  └── useInference.ts        ← Analysis orchestration       │
│      • Recording state                                      │
│      • Frame collection                                     │
│      • Analysis trigger                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 3: LIBRARIES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  src/lib/                                                   │
│  │                                                          │
│  ├── detection/              ← Ball detection               │
│  │   ├── index.ts           ← Main detection coordinator   │
│  │   ├── onnxRuntime.ts     ← ONNX model inference        │
│  │   ├── mockDetector.ts    ← Fallback/testing            │
│  │   ├── frameSampler.ts    ← Adaptive sampling           │
│  │   ├── roiManager.ts      ← Region of interest          │
│  │   └── adapter.ts         ← Detection abstraction       │
│  │                                                          │
│  ├── calibration/            ← Spatial calibration          │
│  │   └── index.ts           ← Pixel-to-meter conversion   │
│  │                                                          │
│  ├── speed-calculation/      ← Speed computation            │
│  │   ├── speed.ts           ← Main calculation            │
│  │   ├── trajectorySmoothing.ts ← Noise reduction         │
│  │   └── warnings.ts        ← Quality checks              │
│  │                                                          │
│  ├── export/                 ← Data export                  │
│  │   └── jsonExport.ts      ← JSON formatting/download    │
│  │                                                          │
│  ├── metrics/                ← Performance                  │
│  │   └── timing.ts          ← Latency measurement         │
│  │                                                          │
│  ├── debug/                  ← Development tools            │
│  │   └── log.ts             ← Structured logging          │
│  │                                                          │
│  └── types.ts               ← TypeScript definitions       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 4: BROWSER APIS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • MediaDevices.getUserMedia()  ← Camera access            │
│  • HTMLVideoElement            ← Video playback           │
│  • HTMLCanvasElement           ← Frame extraction          │
│  • ONNX Runtime Web            ← ML inference              │
│  • Performance API             ← Timing                    │
│  • Clipboard API               ← Copy to clipboard         │
│  • File API                    ← Download JSON             │
│  • Web Share API               ← Native sharing            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Current Implementation

| Layer                  | Technology                          | Purpose                       |
| ---------------------- | ----------------------------------- | ----------------------------- |
| **Frontend Framework** | Next.js 15 (App Router)             | React framework with SSR/SSG  |
| **UI Library**         | React 19                            | Component-based UI            |
| **Styling**            | CSS-in-JS (styled-jsx) + Tailwind   | Component styles + utilities  |
| **Type Safety**        | TypeScript 5.x                      | Static typing                 |
| **ML Inference**       | ONNX Runtime Web                    | Browser-based model inference |
| **State Management**   | React Hooks (useState, useCallback) | Local state                   |
| **Testing**            | Jest + React Testing Library        | Unit & integration tests      |
| **Performance**        | Web Workers (future), WebGL         | Parallel processing           |
| **Build Tool**         | Next.js + Turbopack                 | Fast builds                   |

### Dependencies

```json
{
  "dependencies": {
    "next": "^15.5.4",
    "react": "^19.0.0",
    "onnxruntime-web": "^1.20.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "jest": "^29.7.0",
    "typescript": "^5.6.3"
  }
}
```

---

## Future Architecture (v2.0+ - With Backend)

### Full-Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Next.js Frontend                               │  │
│  │  • Same browser-based inference (privacy mode)                         │  │
│  │  • Optional cloud sync                                                 │  │
│  │  • User authentication                                                 │  │
│  │  • Team collaboration features                                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↕ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION TIER                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       FastAPI Backend (Python)                         │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │   Auth      │  │   Delivery   │  │  Analytics  │  │  Training  │  │  │
│  │  │  Service    │  │   Service    │  │   Service   │  │  Service   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  └────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Background Workers                            │  │  │
│  │  │  • Video processing queue                                        │  │  │
│  │  │  • Model training jobs                                           │  │  │
│  │  │  • Report generation                                             │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↕ SQL/File Storage
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA TIER                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │   PostgreSQL     │  │   Object Storage │  │   Redis Cache            │  │
│  │   • Users        │  │   • Videos       │  │   • Session data         │  │
│  │   • Deliveries   │  │   • Models       │  │   • Rate limiting        │  │
│  │   • Analytics    │  │   • Exports      │  │   • Job queue            │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ML TRAINING TIER                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Python ML Pipeline (fast.ai)                        │  │
│  │                                                                        │  │
│  │  Dataset Prep → Model Training → Validation → ONNX Export             │  │
│  │  (OpenCV)       (PyTorch/fast.ai) (Test set)  (browser deploy)        │  │
│  │                                                                        │  │
│  │  Requires: GPU server (cloud or local)                                │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Future Use Cases

#### Use Case 1: Team Analytics Dashboard

```
Coach uploads → Server stores → Team sees stats
                ↓
        Historical analysis
        Performance trends
        Player comparisons
```

#### Use Case 2: Model Training Pipeline

```
Collect videos → Annotate balls → Train model → Deploy to browser
      ↓              ↓                ↓              ↓
   Storage        Labeling         GPU Server    CDN/Static
```

#### Use Case 3: Live Match Tracking

```
Multiple cameras → Server aggregates → Real-time dashboard
                        ↓
                  WebSocket updates
                  Live commentary
```

---

## Data Models

### Core Types

```typescript
// Detection result from ONNX
interface Detection {
  boundingBox: {
    x: number; // Top-left X
    y: number; // Top-left Y
    width: number; // Box width
    height: number; // Box height
  };
  confidence: number; // 0.0 - 1.0
  ballClass: string; // 'ball'
}

// Point in trajectory
interface TrajectoryPoint {
  pixelX: number; // X coordinate in image
  pixelY: number; // Y coordinate in image
  estimatedZ: number | null; // Depth (future)
  timestampMs: number; // Time since recording start
}

// Calibration profile
interface CalibrationProfile {
  pitchLengthPixels: number; // Pixel distance
  referenceDistanceMeters: number; // 20.12m (22 yards)
  homographyMatrix: number[][] | null; // 3D transform (future)
}

// Final analysis result
interface DeliveryResult {
  speedKmh: number; // Calculated speed
  trajectoryPoints: TrajectoryPoint[]; // Ball path
  confidence: number; // Overall quality
  detectionCount: number; // # of detections
  processingMs: number; // Latency
  warnings?: string[]; // Quality issues
}
```

### Database Schema (Future)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  speed_kmh DECIMAL(5,2),
  confidence DECIMAL(3,2),
  detection_count INTEGER,
  processing_ms INTEGER,
  trajectory JSONB,  -- TrajectoryPoint[]
  calibration JSONB, -- CalibrationProfile
  video_url TEXT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Model versions table
CREATE TABLE models (
  id UUID PRIMARY KEY,
  version VARCHAR(50),
  accuracy DECIMAL(5,2),
  file_path TEXT,
  deployed_at TIMESTAMP
);
```

---

## Performance Characteristics

### Current Metrics (Browser-Based)

| Metric                 | Target | Current | Status |
| ---------------------- | ------ | ------- | ------ |
| Camera init            | <3s    | ~1-2s   | ✅     |
| Frame capture rate     | 30fps  | 30fps   | ✅     |
| Inference per frame    | <100ms | <10ms\* | ✅     |
| Total analysis latency | <5s    | <1s\*   | ✅     |
| Trajectory smoothing   | <50ms  | <0.1ms  | ✅     |
| Speed calculation      | <50ms  | <0.1ms  | ✅     |
| Memory usage           | <500MB | ~200MB  | ✅     |
| Model size             | <50MB  | ~10MB\* | ✅     |

\*Using mock detector; real model TBD

### Optimization Strategies

1. **Frame Sampling**

   ```typescript
   // Don't process every frame
   frameSampler.shouldSample(frameIndex);
   // Process every 2nd-3rd frame adaptively
   ```

2. **ROI Cropping**

   ```typescript
   // Only analyze region around ball
   roiManager.cropToRegion(frame, lastDetection);
   // Reduces inference area by 50-75%
   ```

3. **WebGL Acceleration**

   ```typescript
   // Use GPU for ONNX inference
   executionProviders: ["webgl", "wasm"];
   ```

4. **Trajectory Smoothing**
   ```typescript
   // Filter noisy detections
   smoothTrajectory(points, {
     windowSize: 5,
     outlierThreshold: 3.0,
   });
   ```

---

## Security & Privacy

### Current (Browser-Only)

✅ **Privacy-First Design**

- Video **never** leaves device
- All processing in-browser
- No user tracking
- No data collection
- Offline-capable

✅ **Security**

- HTTPS required for camera access
- No API keys needed
- CSP headers (Next.js default)
- No external API calls

### Future (With Backend)

⚠️ **Privacy Considerations**

- Optional video upload (user consent)
- Encrypted storage
- GDPR compliance
- Data retention policies

🔒 **Security Measures**

- JWT authentication
- Rate limiting
- Input validation
- SQL injection prevention
- CORS configuration
- Encrypted connections (TLS)

---

## Deployment

### Current Deployment (Static)

```bash
# Build static export
npm run build
npm run export

# Deploy to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static host
```

**Characteristics:**

- No server required
- Global CDN
- Automatic HTTPS
- Zero cold starts
- Free tier available

### Future Deployment (Full-Stack)

```
┌─────────────────────────────────────────────────┐
│              Production Architecture             │
├─────────────────────────────────────────────────┤
│                                                  │
│  CDN (CloudFlare/Vercel)                        │
│  │                                               │
│  ├─▶ Static Assets (Next.js)                    │
│  └─▶ ONNX Model (cached)                        │
│                                                  │
│  Load Balancer                                   │
│  │                                               │
│  ├─▶ FastAPI Server (Kubernetes)                │
│  │   - Auto-scaling                              │
│  │   - Health checks                             │
│  │                                               │
│  ├─▶ PostgreSQL (Managed DB)                    │
│  │   - Replication                               │
│  │   - Backups                                   │
│  │                                               │
│  ├─▶ Object Storage (S3/GCS)                    │
│  │   - Videos                                    │
│  │   - Models                                    │
│  │                                               │
│  └─▶ Redis (Managed Cache)                      │
│      - Sessions                                  │
│      - Queue                                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Development Workflow

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# Backend (future)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000

# Python utilities
cd python
pytest tests/        # Run speed calc tests
```

### Testing Strategy

```
┌─────────────────────────────────────────────────┐
│              Testing Pyramid                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  E2E Tests (Manual)                             │
│  └─ Manual testing guide                        │
│                                                  │
│  Integration Tests (20 tests)                   │
│  ├─ Calibration flow                            │
│  ├─ Delivery analysis                           │
│  └─ Detection pipeline                          │
│                                                  │
│  Contract Tests (10 tests)                      │
│  ├─ Analysis session API                        │
│  └─ Local inference contract                    │
│                                                  │
│  Unit Tests (376 tests)                         │
│  ├─ Speed calculation                           │
│  ├─ Trajectory smoothing                        │
│  ├─ ROI manager                                 │
│  ├─ Frame sampler                               │
│  ├─ ONNX runtime                                │
│  ├─ Logging                                     │
│  ├─ JSON export                                 │
│  ├─ Performance harness                         │
│  └─ Component tests                             │
│                                                  │
│  Total: 406 tests                               │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Migration Path

### Phase 1: Browser-Only (Current) ✅

**Status**: Complete  
**Features**:

- ✅ Camera capture
- ✅ Ball detection (mock)
- ✅ Speed calculation
- ✅ Trajectory display
- ✅ JSON export
- ✅ Accessibility
- ✅ Responsive design

### Phase 2: Real Model Training (Next)

**Requirements**:

- Dataset collection (≥1000 annotated frames)
- GPU server for training
- fast.ai model training
- ONNX export pipeline

**Deliverables**:

- `model.onnx` (real trained model)
- Training scripts
- Model evaluation metrics

### Phase 3: Basic Backend

**Features**:

- User authentication
- Delivery storage
- Basic analytics
- Model versioning

**Tech Stack**:

- FastAPI backend
- PostgreSQL database
- S3-compatible storage

### Phase 4: Advanced Features

**Features**:

- Multi-camera support
- Live match tracking
- Team dashboards
- Advanced calibration (homography)
- Video replay analysis

---

## Design Decisions & Rationale

### Why Browser-First?

**Decision**: Build v1 entirely in browser  
**Rationale**:

1. **Privacy**: Users concerned about uploading cricket footage
2. **Latency**: No network round-trip
3. **Cost**: No server infrastructure
4. **Offline**: Works without internet
5. **Simplicity**: Easier initial deployment

**Trade-offs**:

- ❌ Can't train models in browser
- ❌ Limited to device compute power
- ❌ No multi-user collaboration (yet)

### Why ONNX Runtime?

**Decision**: Use ONNX for inference  
**Rationale**:

1. **Cross-platform**: Same model works browser/server/mobile
2. **Performance**: WebGL acceleration in browser
3. **Framework agnostic**: Can train with PyTorch/TensorFlow/fast.ai
4. **Standardized**: Industry standard format

### Why Next.js?

**Decision**: Next.js App Router  
**Rationale**:

1. **Modern React**: Latest features (Server Components)
2. **Performance**: Automatic code splitting, image optimization
3. **Developer Experience**: Hot reload, TypeScript support
4. **Deployment**: Easy static export or SSR
5. **Community**: Large ecosystem

### Why TypeScript?

**Decision**: TypeScript for all frontend code  
**Rationale**:

1. **Type Safety**: Catch errors at compile time
2. **IDE Support**: Better autocomplete and refactoring
3. **Documentation**: Types serve as inline docs
4. **Maintainability**: Easier to refactor large codebase

---

## Open Questions & Future Research

### ML Model

- [ ] Optimal model architecture for ball detection?
- [ ] Quantization impact on accuracy?
- [ ] Real-world dataset size needed?
- [ ] Fine-tuning vs training from scratch?

### Performance

- [ ] Web Worker for parallel processing?
- [ ] WebAssembly vs WebGL performance?
- [ ] Battery impact measurement?
- [ ] Mobile device compatibility matrix?

### Features

- [ ] Homography calibration UI/UX?
- [ ] Multi-camera synchronization approach?
- [ ] Real-time vs batch processing trade-offs?
- [ ] Slow-motion replay integration?

### Business

- [ ] Freemium vs paid model?
- [ ] Team vs individual pricing?
- [ ] Data storage retention policy?
- [ ] API access for third parties?

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [fast.ai](https://docs.fast.ai/)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## Change Log

| Version | Date       | Changes                            |
| ------- | ---------- | ---------------------------------- |
| 1.0     | 2025-10-06 | Initial architecture documentation |

---

**Document Maintainer**: Development Team  
**Last Updated**: 2025-10-06  
**Next Review**: When Phase 2 (model training) begins
