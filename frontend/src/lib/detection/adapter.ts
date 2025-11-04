/**
 * Detection Adapter
 * 
 * Provides a unified interface for ball detection across different backends.
 * Currently supports mock detection for development. ONNX Runtime integration
 * will be added in T029.
 * 
 * This adapter normalizes detection outputs and provides utility functions
 * for filtering and batch processing.
 */

import type { FrameSample, Detection } from '../types';
import type { IDetector, DetectorConfig } from './types';

/**
 * Global detector instance
 * Lazily initialized on first use
 */
let detectorInstance: IDetector | null = null;

/**
 * Default detector configuration
 */
const DEFAULT_CONFIG: DetectorConfig = {
  backend: 'mock', // Will switch to 'onnx' in T029
  confidenceThreshold: 0.5,
  maxDetections: 1,
};

/**
 * Get or create the detector instance
 */
async function getDetector(): Promise<IDetector> {
  if (detectorInstance === null) {
    // For now, use mock detector (T030 will implement this)
    // In T029, we'll add ONNX Runtime backend
    const { MockDetector } = await import('./mockDetector');
    const detector = new MockDetector(DEFAULT_CONFIG);
    await detector.initialize();
    detectorInstance = detector;
  }
  // After the if block, detectorInstance is guaranteed to be non-null
  return detectorInstance as IDetector;
}

/**
 * Detect ball in a single frame
 * 
 * @param frame - Frame sample containing image data and metadata
 * @returns Detection object if ball found with sufficient confidence, null otherwise
 */
export async function detectBallInFrame(
  frame: FrameSample
): Promise<Detection | null> {
  const detector = await getDetector();
  return detector.detect(frame);
}

/**
 * Detect ball in multiple frames (batch processing)
 * 
 * @param frames - Array of frame samples to process
 * @returns Array of detections (null for frames where no ball was detected)
 */
export async function detectBallInFrames(
  frames: FrameSample[]
): Promise<(Detection | null)[]> {
  if (frames.length === 0) {
    return [];
  }

  const detector = await getDetector();
  return detector.detectBatch(frames);
}

/**
 * Filter detections by confidence threshold
 * 
 * @param detections - Array of detections to filter
 * @param threshold - Minimum confidence threshold (0-1)
 * @returns Filtered array of detections meeting the threshold
 */
export function filterDetectionsByConfidence(
  detections: Detection[],
  threshold: number
): Detection[] {
  return detections.filter((detection) => detection.confidence >= threshold);
}

/**
 * Convert Detection to TrajectoryPoint
 * Uses the center of the bounding box as the trajectory point
 * 
 * @param detection - Detection object
 * @param timestampMs - Timestamp for the trajectory point
 * @returns TrajectoryPoint representing the ball's position
 */
export function detectionToTrajectoryPoint(
  detection: Detection,
  timestampMs: number
): { pixelX: number; pixelY: number; estimatedZ: number | null; timestampMs: number } {
  const centerX = detection.boundingBox.x + detection.boundingBox.width / 2;
  const centerY = detection.boundingBox.y + detection.boundingBox.height / 2;

  return {
    pixelX: centerX,
    pixelY: centerY,
    estimatedZ: null, // Z-depth estimation deferred
    timestampMs,
  };
}

/**
 * Clean up detector resources
 * Call this when the detector is no longer needed
 */
export async function disposeDetector(): Promise<void> {
  if (detectorInstance) {
    await detectorInstance.dispose();
    detectorInstance = null;
  }
}

/**
 * Reset detector for testing purposes
 * @internal
 */
export function resetDetector(): void {
  detectorInstance = null;
}
