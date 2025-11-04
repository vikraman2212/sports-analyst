/**
 * Integration Test: Successful Delivery Flow
 * 
 * This test validates the complete end-to-end flow:
 * capture frames → analyze delivery → display speed
 * 
 * Expected to FAIL until complete pipeline is implemented.
 */

import type { FrameSample, CalibrationProfile } from '../../lib/types';
import { createMockCalibration } from '../testHelpers';

function createNonBlankImageData(width: number, height: number): ImageData {
  const img = new ImageData(width, height);
  const data = (img as unknown as { data?: Uint8ClampedArray }).data;
  if (data) {
    for (let i = 0; i < Math.min(200, data.length); i += 4) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
    }
  }
  return img;
}

describe('Delivery Flow Integration', () => {
  let mockFrames: FrameSample[];
  let mockCalibration: CalibrationProfile;

  beforeEach(() => {
    // Set up mock frames representing a cricket ball delivery
    mockFrames = Array.from({ length: 30 }, (_, i) => ({
      frameIndex: i,
      timestampMs: i * 33, // ~30fps
      imageData: createNonBlankImageData(640, 480),
    }));

    // Mock calibration for 22-yard pitch
    mockCalibration = createMockCalibration({pitchLengthPixels: 500, ballMassGrams: 156});
  });

  describe('Complete delivery analysis', () => {
    it('should successfully analyze a delivery and return speed', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Validate result structure
      expect(result).toBeDefined();
      expect(result.speedKmh).toBeGreaterThan(0);
      expect(result.trajectoryPoints.length).toBeGreaterThan(0);
      expect(result.detectionCount).toBeGreaterThan(0);
      expect(result.processingMs).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should produce realistic speed for fast bowler', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      // Mock frames simulating fast delivery (~140 km/h)
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Fast bowlers typically bowl between 130-150 km/h
      // Allow wide range since this is using mock data
      expect(result.speedKmh).toBeGreaterThan(50);
      expect(result.speedKmh).toBeLessThan(200);
    });

    it('should generate trajectory points matching frame count', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Trajectory points should be <= frame count (some frames may not detect ball)
      expect(result.trajectoryPoints.length).toBeLessThanOrEqual(mockFrames.length);
      expect(result.trajectoryPoints.length).toBeGreaterThan(0);
      
      // Each trajectory point should have required fields
      result.trajectoryPoints.forEach((point, index) => {
        expect(point).toHaveProperty('pixelX');
        expect(point).toHaveProperty('pixelY');
        expect(point).toHaveProperty('estimatedZ');
        expect(point).toHaveProperty('timestampMs');
        
        // Timestamps should be in ascending order
        if (index > 0) {
          expect(point.timestampMs).toBeGreaterThanOrEqual(
            result.trajectoryPoints[index - 1].timestampMs
          );
        }
      });
    });

    it('should meet latency requirement of <5s', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const startTime = performance.now();
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      const endTime = performance.now();
      
      const actualLatency = endTime - startTime;
      
      // Constitution requirement: <5s post-delivery latency
      expect(actualLatency).toBeLessThan(5000);
      
      // Also verify the result includes processingMs
      expect(result.processingMs).toBeLessThan(5000);
    });

    it('should provide confidence score based on detection quality', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Confidence should be normalized 0-1
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      
      // Higher detection count should correlate with higher confidence
      if (result.detectionCount >= 20) {
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should include warnings for edge cases', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      // Use minimal frames (edge case)
      const minimalFrames = mockFrames.slice(0, 5);
      
      const result = await analyzeDelivery(minimalFrames, mockCalibration);
      
      // Should still complete but may include warnings
      expect(result).toBeDefined();
      expect(result).toHaveProperty('warnings');
      
      if (result.detectionCount < 10) {
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration with detection pipeline', () => {
    it('should call detection adapter for each frame', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Detection count should reflect frames processed
      expect(result.detectionCount).toBeDefined();
      expect(typeof result.detectionCount).toBe('number');
      expect(result.detectionCount).toBeGreaterThanOrEqual(0);
      expect(result.detectionCount).toBeLessThanOrEqual(mockFrames.length);
    });

    it('should filter low-confidence detections', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // All trajectory points should come from high-confidence detections
      // This is implicit in the detection count vs trajectory length
      expect(result.trajectoryPoints.length).toBeLessThanOrEqual(result.detectionCount);
    });
  });

  describe('Integration with speed calculation', () => {
    it('should use calibration to convert pixels to meters', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Speed should be realistic (calibration is applied)
      // Without calibration, pixel-based speed would be nonsensical
      expect(result.speedKmh).toBeGreaterThan(0);
      expect(result.speedKmh).toBeLessThan(200); // No bowler exceeds ~180 km/h
    });

    it('should calculate speed from trajectory time span', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Verify trajectory spans time (first to last point)
      const firstPoint = result.trajectoryPoints[0];
      const lastPoint = result.trajectoryPoints[result.trajectoryPoints.length - 1];
      
      const timeSpanMs = lastPoint.timestampMs - firstPoint.timestampMs;
      expect(timeSpanMs).toBeGreaterThan(0);
      
      // Speed calculation should use this time span
      // Formula: distance / time
      // We can't verify exact calculation here, but time span should be reasonable
      expect(timeSpanMs).toBeGreaterThan(100); // At least 100ms of trajectory
    });
  });

  describe('Result displayability', () => {
    it('should return all data needed for UI display', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Verify all UI-needed fields are present
      expect(result.speedKmh).toBeDefined();
      expect(result.trajectoryPoints).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.processingMs).toBeDefined();
      
      // Speed should be formatted to 1 decimal place in UI
      const speedFormatted = result.speedKmh.toFixed(1);
      expect(speedFormatted).toMatch(/^\d+\.\d$/);
    });

    it('should provide trajectory data for overlay visualization', async () => {
      const { analyzeDelivery } = await import('@/lib/analyzeDelivery');
      
      const result = await analyzeDelivery(mockFrames, mockCalibration);
      
      // Trajectory points should have pixel coordinates for drawing
      result.trajectoryPoints.forEach((point) => {
        expect(point.pixelX).toBeGreaterThanOrEqual(0);
        expect(point.pixelY).toBeGreaterThanOrEqual(0);
        expect(point.pixelX).toBeLessThanOrEqual(640); // Frame width
        expect(point.pixelY).toBeLessThanOrEqual(480); // Frame height
      });
    });
  });
});
