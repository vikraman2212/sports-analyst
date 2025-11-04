/**
 * Detection module exports
 * 
 * Provides detection functionality for cricket ball tracking.
 */

export {
  detectBallInFrame,
  detectBallInFrames,
  filterDetectionsByConfidence,
  detectionToTrajectoryPoint,
  disposeDetector,
} from './adapter';

export type {
  DetectorBackend,
  DetectorConfig,
  RawInferenceResult,
  IDetector,
  DetectionFilterOptions,
} from './types';

export { MockDetector } from './mockDetector';

export {
  sampleFrames,
  SamplingPresets,
  getEffectiveFrameRate,
  estimateProcessingTime,
  getRecommendedSampling,
  validateSampledFrames,
  DEFAULT_SAMPLING_CONFIG,
} from './frameSampler';

export type { SamplingConfig } from './frameSampler';

export {
  ROIManager,
  cropImageDataToROI,
  convertROIDetectionToFullFrame,
  calculateROICoverage,
  validateROI,
  DEFAULT_ROI_CONFIG,
} from './roiManager';

export type { ROI, ROIConfig } from './roiManager';
