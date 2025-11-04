/**
 * Mock Detector
 * 
 * Development fallback detector that simulates ball detection.
 * Returns synthetic detections for testing and development purposes.
 * 
 * This will be replaced with ONNX Runtime in production (T029).
 */

import type { FrameSample, Detection } from '../types';
import type { IDetector, DetectorConfig } from './types';

/**
 * Mock detector for development and testing
 */
export class MockDetector implements IDetector {
  private config: DetectorConfig;
  private initialized = false;

  constructor(config: DetectorConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Simulate async initialization
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.initialized = true;
  }

  async detect(frame: FrameSample): Promise<Detection | null> {
    if (!this.initialized) {
      throw new Error('Detector not initialized. Call initialize() first.');
    }

    // Treat fully-blank frames (all-zero ImageData) as no detection.
    // This lets tests simulate "no ball present" by supplying empty ImageData.
    if (isBlankImageData(frame.imageData)) {
      return null;
    }

    // Mock detection logic for non-blank frames:
    // Always detect to provide stable results in tests.

    // Generate synthetic detection with deterministic confidence for consistent testing
    // Use frameIndex to make it deterministic but still varied
    const baseConfidence = 0.75 + (frame.frameIndex % 20) * 0.01; // 0.75-0.94
    const confidence = Math.min(0.95, baseConfidence);

    // Apply confidence threshold
    if (confidence < (this.config.confidenceThreshold ?? 0.5)) {
      return null;
    }

    // Synthetic bounding box - simulates ball moving across frame
    const progressRatio = (frame.frameIndex % 30) / 30; // Reset every 30 frames
    const x = 100 + progressRatio * 400; // Move from x=100 to x=500
    const y = 200 + Math.sin(progressRatio * Math.PI) * 100; // Arc motion

    return {
      boundingBox: {
        x: Math.round(x),
        y: Math.round(y),
        width: 40,
        height: 40,
      },
      confidence: Math.round(confidence * 100) / 100,
      ballClass: 'cricket_ball',
    };
  }

  async detectBatch(frames: FrameSample[]): Promise<(Detection | null)[]> {
    // Process frames sequentially (in real ONNX implementation, could batch)
    const results: (Detection | null)[] = [];

    for (const frame of frames) {
      const detection = await this.detect(frame);
      results.push(detection);
    }

    return results;
  }

  async dispose(): Promise<void> {
    // Clean up resources (none for mock)
    this.initialized = false;
  }
}

/**
 * Heuristic check for blank ImageData (all pixels zero).
 * To keep this fast, we sample the first N bytes instead of scanning the whole buffer.
 */
function hasDataArray(obj: unknown): obj is { data: Uint8ClampedArray } {
  return typeof obj === 'object' && obj !== null && 'data' in (obj as Record<string, unknown>);
}

function isBlankImageData(imageData: ImageData): boolean {
  const data = hasDataArray(imageData) ? imageData.data : undefined;
  if (!data || data.length === 0) return true;
  const sample = Math.min(data.length, 2048);
  for (let i = 0; i < sample; i++) {
    if (data[i] !== 0) return false;
  }
  // If the sampled region is all zeros and the buffer is larger, do a few spaced checks
  if (data.length > sample) {
    const steps = Math.min(8, Math.floor(data.length / sample));
    for (let s = 1; s < steps; s++) {
      const idx = s * Math.floor(data.length / steps);
      if (data[idx] !== 0) return false;
    }
  }
  return true;
}
