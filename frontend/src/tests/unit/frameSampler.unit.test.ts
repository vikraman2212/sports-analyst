/**
 * Unit Test: Frame Sampler
 * 
 * Tests the frame sampling utility functions
 */

import type { FrameSample } from '@/lib/types';
import {
  sampleFrames,
  SamplingPresets,
  getEffectiveFrameRate,
  estimateProcessingTime,
  getRecommendedSampling,
  validateSampledFrames,
} from '@/lib/detection/frameSampler';

describe('Frame Sampler', () => {
  // Helper to create mock frames
  const createFrames = (count: number): FrameSample[] => {
    return Array.from({ length: count }, (_, i) => ({
      frameIndex: i,
      timestampMs: i * 33, // ~30fps
      imageData: new ImageData(640, 480),
    }));
  };

  describe('sampleFrames', () => {
    it('should sample every 2nd frame by default', () => {
      const frames = createFrames(10);
      const sampled = sampleFrames(frames);

      // With default config: includeFirst=true, interval=2, includeLast=true
      // Should get frames: 0, 2, 4, 6, 8, 9
      expect(sampled.length).toBeGreaterThan(0);
      expect(sampled.length).toBeLessThan(frames.length);
    });

    it('should include first frame when configured', () => {
      const frames = createFrames(10);
      const sampled = sampleFrames(frames, { includeFirst: true });

      expect(sampled[0].frameIndex).toBe(0);
    });

    it('should include last frame when configured', () => {
      const frames = createFrames(10);
      const sampled = sampleFrames(frames, { includeLast: true });

      expect(sampled[sampled.length - 1].frameIndex).toBe(9);
    });

    it('should respect maxFrames limit', () => {
      const frames = createFrames(100);
      const sampled = sampleFrames(frames, { maxFrames: 10 });

      expect(sampled.length).toBeLessThanOrEqual(10);
    });

    it('should return all frames if count is less than minFrames', () => {
      const frames = createFrames(3);
      const sampled = sampleFrames(frames, { minFrames: 5 });

      expect(sampled.length).toBe(3);
    });

    it('should handle empty frame array', () => {
      const sampled = sampleFrames([]);

      expect(sampled).toEqual([]);
    });

    it('should sample at custom intervals', () => {
      const frames = createFrames(20);
      const sampled = sampleFrames(frames, {
        interval: 5,
        includeFirst: false,
        includeLast: false,
      });

      // Should get frames at indices: 0, 5, 10, 15
      expect(sampled.length).toBe(4);
      expect(sampled[0].frameIndex).toBe(0);
      expect(sampled[1].frameIndex).toBe(5);
      expect(sampled[2].frameIndex).toBe(10);
      expect(sampled[3].frameIndex).toBe(15);
    });
  });

  describe('SamplingPresets', () => {
    it('should provide HIGH_ACCURACY preset', () => {
      expect(SamplingPresets.HIGH_ACCURACY.interval).toBe(1);
    });

    it('should provide BALANCED preset', () => {
      expect(SamplingPresets.BALANCED.interval).toBe(2);
    });

    it('should provide PERFORMANCE preset', () => {
      expect(SamplingPresets.PERFORMANCE.interval).toBe(3);
    });

    it('should provide FAST_PREVIEW preset', () => {
      expect(SamplingPresets.FAST_PREVIEW.interval).toBe(5);
    });
  });

  describe('getEffectiveFrameRate', () => {
    it('should calculate effective frame rate', () => {
      expect(getEffectiveFrameRate(30, 2)).toBe(15);
      expect(getEffectiveFrameRate(60, 3)).toBe(20);
      expect(getEffectiveFrameRate(30, 1)).toBe(30);
    });
  });

  describe('estimateProcessingTime', () => {
    it('should estimate processing time', () => {
      expect(estimateProcessingTime(10, 50)).toBe(500);
      expect(estimateProcessingTime(20, 100)).toBe(2000);
    });

    it('should use default per-frame time if not provided', () => {
      const estimate = estimateProcessingTime(10);
      expect(estimate).toBeGreaterThan(0);
    });
  });

  describe('getRecommendedSampling', () => {
    it('should recommend HIGH_ACCURACY for high-tier devices', () => {
      const config = getRecommendedSampling('high');
      expect(config.interval).toBe(1);
    });

    it('should recommend BALANCED for medium-tier devices', () => {
      const config = getRecommendedSampling('medium');
      expect(config.interval).toBe(2);
    });

    it('should recommend PERFORMANCE for low-tier devices', () => {
      const config = getRecommendedSampling('low');
      expect(config.interval).toBe(3);
    });

    it('should default to BALANCED when tier not specified', () => {
      const config = getRecommendedSampling();
      expect(config.interval).toBe(2);
    });
  });

  describe('validateSampledFrames', () => {
    it('should validate frames meet minimum count', () => {
      const frames = createFrames(5);
      expect(validateSampledFrames(frames, 2)).toBe(true);
      expect(validateSampledFrames(frames, 10)).toBe(false);
    });

    it('should validate frames are in chronological order', () => {
      const validFrames = createFrames(5);
      expect(validateSampledFrames(validFrames)).toBe(true);

      const invalidFrames: FrameSample[] = [
        { frameIndex: 0, timestampMs: 100, imageData: new ImageData(640, 480) },
        { frameIndex: 1, timestampMs: 50, imageData: new ImageData(640, 480) }, // Out of order
      ];
      expect(validateSampledFrames(invalidFrames)).toBe(false);
    });

    it('should reject frames with duplicate timestamps', () => {
      const frames: FrameSample[] = [
        { frameIndex: 0, timestampMs: 100, imageData: new ImageData(640, 480) },
        { frameIndex: 1, timestampMs: 100, imageData: new ImageData(640, 480) }, // Duplicate
      ];
      expect(validateSampledFrames(frames)).toBe(false);
    });
  });
});
