/**
 * Contract Test: Local Inference Interface
 * 
 * This test validates the shape and contract of the analyzeDelivery function.
 * It ensures that the function accepts the correct input types and returns
 * the expected output structure, as defined in the local-inference.md contract.
 * 
 * Expected to FAIL until analyzeDelivery is implemented.
 */

import type { FrameSample, CalibrationProfile } from '../../lib/types';
import { createMockCalibration } from '../testHelpers';

describe('Local Inference Contract', () => {
  describe('analyzeDelivery function', () => {
    it('should exist and be importable', async () => {
      // This will fail until we create the analyzeDelivery module
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      expect(analyzeDelivery).toBeDefined();
      expect(typeof analyzeDelivery).toBe('function');
    });

    it('should accept frames array and calibration profile parameters', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const mockFrames: FrameSample[] = [
        {
          frameIndex: 0,
          timestampMs: 0,
          imageData: createNonBlankImageData(640, 480),
        },
      ];

      const mockCalibration = createMockCalibration({
        pitchLengthPixels: 500,
        ballMassGrams: 156,
      });

  // Function should accept these parameters without type errors
  const result = analyzeDelivery(mockFrames, mockCalibration);
  expect(result).toBeDefined();
  // Avoid unhandled rejection affecting other tests
  result.catch(() => undefined);
    });

    it('should return a Promise that resolves to DeliveryResult', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const mockFrames: FrameSample[] = [
        { frameIndex: 0, timestampMs: 0, imageData: createNonBlankImageData(640, 480) },
        { frameIndex: 1, timestampMs: 33, imageData: createNonBlankImageData(640, 480) },
      ];
      const mockCalibration = createMockCalibration({
        pitchLengthPixels: 500,
      });

  const result = analyzeDelivery(mockFrames, mockCalibration);
  expect(result).toBeInstanceOf(Promise);
  // Avoid unhandled rejection warnings impacting other tests
  result.catch(() => undefined);
    });

    it('should return DeliveryResult with required fields', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const mockFrames: FrameSample[] = Array.from({ length: 10 }, (_, i) => ({
        frameIndex: i,
        timestampMs: i * 33,
        imageData: createNonBlankImageData(640, 480),
      }));

      const mockCalibration = createMockCalibration({
        pitchLengthPixels: 500,
      });

      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Validate result structure matches DeliveryResult type
      expect(result).toHaveProperty('speedKmh');
      expect(result).toHaveProperty('trajectoryPoints');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('detectionCount');
      expect(result).toHaveProperty('processingMs');
      
      // Validate types
      expect(typeof result.speedKmh).toBe('number');
      expect(Array.isArray(result.trajectoryPoints)).toBe(true);
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.detectionCount).toBe('number');
      expect(typeof result.processingMs).toBe('number');
    });

    it('should handle insufficient frames error condition', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const mockFrames: FrameSample[] = []; // Empty frames should cause error
      const mockCalibration = createMockCalibration();

      await expect(
        analyzeDelivery(mockFrames, mockCalibration)
      ).rejects.toThrow();
    });

    it('should handle missing calibration error condition', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const mockFrames: FrameSample[] = [
        {
          frameIndex: 0,
          timestampMs: 0,
          imageData: new ImageData(640, 480),
        },
      ];

      // Intentionally pass an invalid calibration via casting to test error handling
      await expect(
        analyzeDelivery(mockFrames, undefined as unknown as CalibrationProfile)
      ).rejects.toThrow();
    });

    it('should meet performance requirement of <5s processing', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const mockFrames: FrameSample[] = Array.from({ length: 30 }, (_, i) => ({
        frameIndex: i,
        timestampMs: i * 33,
        imageData: createNonBlankImageData(640, 480),
      }));

      const mockCalibration = createMockCalibration();

      const startTime = performance.now();
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      const endTime = performance.now();
      
      const actualProcessingMs = endTime - startTime;
      
      // Verify processing time is under 5 seconds (5000ms)
      expect(actualProcessingMs).toBeLessThan(5000);
      
      // Also verify the result includes processingMs
      expect(result.processingMs).toBeDefined();
      expect(result.processingMs).toBeLessThan(5000);
    });
  });
});

// Helpers
function createNonBlankImageData(width: number, height: number): ImageData {
  const img = new ImageData(width, height);
  // Set a few pixels to non-zero to avoid being treated as blank by MockDetector
  const maybeData = (img as unknown as { data?: Uint8ClampedArray }).data;
  if (maybeData && maybeData.length > 0) {
    const data = maybeData;
    for (let i = 0; i < Math.min(100, data.length); i += 4) {
      data[i] = 255; // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }
  }
  return img;
}
