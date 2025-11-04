/**
 * Detection module type definitions
 * 
 * Defines types specific to the detection subsystem, including
 * detector configurations, inference results, and adapter interfaces.
 */

import type { Detection, FrameSample } from '../types';

/**
 * Detector backend type
 */
export type DetectorBackend = 'onnx' | 'mock';

/**
 * Configuration for detection system
 */
export interface DetectorConfig {
  backend: DetectorBackend;
  modelPath?: string;
  confidenceThreshold?: number;
  maxDetections?: number;
}

/**
 * Raw inference output from ML model (before normalization)
 */
export interface RawInferenceResult {
  boxes: number[][]; // [x, y, width, height]
  scores: number[];
  classes: number[];
}

/**
 * Detector interface that all backends must implement
 */
export interface IDetector {
  /**
   * Initialize the detector (load model, allocate resources)
   */
  initialize(): Promise<void>;

  /**
   * Detect ball in a single frame
   */
  detect(frame: FrameSample): Promise<Detection | null>;

  /**
   * Batch detect balls in multiple frames
   */
  detectBatch(frames: FrameSample[]): Promise<(Detection | null)[]>;

  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}

/**
 * Detection filtering options
 */
export interface DetectionFilterOptions {
  minConfidence?: number;
  maxDetections?: number;
  classFilter?: string[];
}
