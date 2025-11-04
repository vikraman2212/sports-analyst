/**
 * Core type definitions for cricket ball tracking system
 * Based on data-model.md specification
 */

/**
 * Represents a single frame sample from video capture
 */
export interface FrameSample {
  frameIndex: number;
  timestampMs: number;
  imageData: ImageData;
}

/**
 * Represents a ball detection in a single frame
 */
export interface Detection {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  ballClass: string;
}

/**
 * Represents a point in the ball's trajectory
 */
export interface TrajectoryPoint {
  pixelX: number;
  pixelY: number;
  estimatedZ: number | null;
  timestampMs: number;
}

/**
 * A point marked during camera calibration
 */
export interface CalibrationPoint {
  x: number;
  y: number;
}

/**
 * Camera constraints for MediaStreamTrack API
 */
export interface CameraConstraints {
  width?: number;
  height?: number;
  frameRate?: number;
  facingMode?: 'user' | 'environment';
  exposureMode?: 'manual' | 'continuous';
  exposureTime?: number; // microseconds
  iso?: number;
  focusMode?: 'manual' | 'continuous' | 'single-shot';
  focusDistance?: number;
  whiteBalanceMode?: 'manual' | 'continuous';
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  zoom?: number;
}

/**
 * Available camera capabilities detected from device
 */
export interface CameraCapabilities {
  width?: { min: number; max: number; step?: number };
  height?: { min: number; max: number; step?: number };
  frameRate?: { min: number; max: number; step?: number };
  facingMode?: string[];
  exposureMode?: string[];
  exposureTime?: { min: number; max: number; step: number };
  iso?: { min: number; max: number; step: number };
  focusMode?: string[];
  focusDistance?: { min: number; max: number; step: number };
  whiteBalanceMode?: string[];
  brightness?: { min: number; max: number; step: number };
  contrast?: { min: number; max: number; step: number };
  saturation?: { min: number; max: number; step: number };
  sharpness?: { min: number; max: number; step: number };
  zoom?: { min: number; max: number; step: number };
}

/**
 * Calibration profile for converting pixels to real-world distances
 */
export interface CalibrationProfile {
  id: string;
  name: string;
  createdAt: string;
  pitchLengthPixels: number;
  referenceDistanceMeters: number; // 22 yards = 20.12 meters
  ballMassGrams: number; // Cricket ball mass in grams (default 156g for men's)
  homographyMatrix: number[][] | null;
  cameraSettings?: CameraConstraints;
  deviceInfo?: {
    resolution?: string;
    fps?: number;
    userAgent?: string;
    facingMode?: 'user' | 'environment';
    lastUpdatedAt?: string;
  };
}

/**
 * Result of calibration validation
 */
export interface CalibrationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  pixelDistance?: number;
  pixelsPerMeter?: number;
}

/**
 * Result of analyzing a single delivery
 */
export interface DeliveryResult {
  speedKmh: number;
  trajectoryPoints: TrajectoryPoint[];
  confidence: number;
  detectionCount: number;
  processingMs: number;
  warnings?: string[];
}

/**
 * Represents a complete delivery analysis session
 */
export interface Delivery {
  id: string;
  timestamp: Date;
  speedKmh: number | null;
  status: 'analyzing' | 'complete' | 'error';
  trajectoryPoints: TrajectoryPoint[];
  calibrationProfileId: string | null;
  errorMessage?: string;
}
