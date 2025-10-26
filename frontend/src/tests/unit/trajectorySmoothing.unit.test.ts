/**
 * Unit tests for trajectory smoothing
 * 
 * Tests moving average smoothing, outlier detection, and parabolic fitting
 */

import {
  smoothTrajectory,
  validateSmoothedTrajectory,
  getRecommendedSmoothingConfig,
  DEFAULT_SMOOTHING_CONFIG,
  SmoothedTrajectoryPoint,
} from '../../lib/speed-calculation/trajectorySmoothing';
import { TrajectoryPoint } from '../../lib/types';

describe('Trajectory Smoothing', () => {
  describe('smoothTrajectory', () => {
    it('should return empty array for empty input', () => {
      const result = smoothTrajectory([]);
      expect(result).toEqual([]);
    });

    it('should smooth a simple linear trajectory', () => {
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null },
        { pixelX: 120, pixelY: 220, timestampMs: 66, estimatedZ: null },
        { pixelX: 130, pixelY: 230, timestampMs: 99, estimatedZ: null },
        { pixelX: 140, pixelY: 240, timestampMs: 132, estimatedZ: null },
      ];

      const result = smoothTrajectory(points);

      expect(result).toHaveLength(5);
      result.forEach(point => {
        expect(point.smoothedX).not.toBeNull();
        expect(point.smoothedY).not.toBeNull();
        expect(point.isOutlier).toBe(false);
      });
    });

    it('should apply moving average with window size 3', () => {
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null },
        { pixelX: 120, pixelY: 220, timestampMs: 66, estimatedZ: null },
      ];

      const result = smoothTrajectory(points, { ...DEFAULT_SMOOTHING_CONFIG, enableParabolicFit: false });

      // Middle point should be average of all three
      expect(result[1].smoothedX).toBeCloseTo((100 + 110 + 120) / 3, 1);
      expect(result[1].smoothedY).toBeCloseTo((200 + 210 + 220) / 3, 1);

      // Edge points should use available neighbors
      expect(result[0].smoothedX).toBeCloseTo((100 + 110) / 2, 1);
      expect(result[2].smoothedX).toBeCloseTo((110 + 120) / 2, 1);
    });

    it('should detect and exclude outliers', () => {
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null },
        { pixelX: 500, pixelY: 600, timestampMs: 66, estimatedZ: null }, // Outlier
        { pixelX: 130, pixelY: 230, timestampMs: 99, estimatedZ: null },
        { pixelX: 140, pixelY: 240, timestampMs: 132, estimatedZ: null },
      ];

      const result = smoothTrajectory(points);

      // Outlier should be detected
      expect(result[2].isOutlier).toBe(true);
      expect(result[2].smoothedX).toBeNull();
      expect(result[2].smoothedY).toBeNull();

      // Normal points should be smoothed
      expect(result[0].isOutlier).toBe(false);
      expect(result[1].isOutlier).toBe(false);
      expect(result[3].isOutlier).toBe(false);
      expect(result[4].isOutlier).toBe(false);
    });

    it('should apply parabolic fit for arc trajectory with ≥5 points', () => {
      // Create a simple arc trajectory that won't trigger outlier detection
      const points: TrajectoryPoint[] = Array.from({ length: 10 }, (_, i) => {
        const x = 100 + i * 30;
        const y = 200 + i * 10 - 0.05 * i * i; // Gentle parabolic arc
        return {
          pixelX: x,
          pixelY: y,
          timestampMs: i * 33,
          estimatedZ: null,
        };
      });

      const result = smoothTrajectory(points, {
        ...DEFAULT_SMOOTHING_CONFIG,
        enableParabolicFit: true,
        minPointsForParabolic: 5,
      });

      // Should have smoothed coordinates (no outliers in clean data)
      const smoothedPoints = result.filter(p => !p.isOutlier);
      expect(smoothedPoints.length).toBeGreaterThanOrEqual(8);
      
      smoothedPoints.forEach(point => {
        expect(point.smoothedX).not.toBeNull();
        expect(point.smoothedY).not.toBeNull();
      });
    });

    it('should not apply parabolic fit with <5 points', () => {
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null },
        { pixelX: 120, pixelY: 220, timestampMs: 66, estimatedZ: null },
        { pixelX: 130, pixelY: 230, timestampMs: 99, estimatedZ: null },
      ];

      const result = smoothTrajectory(points, {
        ...DEFAULT_SMOOTHING_CONFIG,
        enableParabolicFit: true,
        minPointsForParabolic: 5,
      });

      // Should still smooth but not apply parabolic fit
      result.forEach(point => {
        expect(point.smoothedX).not.toBeNull();
        expect(point.smoothedY).not.toBeNull();
      });
    });

    it('should handle single point trajectory', () => {
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null },
      ];

      const result = smoothTrajectory(points);

      expect(result).toHaveLength(1);
      expect(result[0].smoothedX).toBe(100);
      expect(result[0].smoothedY).toBe(200);
      expect(result[0].isOutlier).toBe(false);
    });

    it('should handle trajectory with all outliers', () => {
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null },
        { pixelX: 1000, pixelY: 2000, timestampMs: 33, estimatedZ: null },
        { pixelX: 50, pixelY: 50, timestampMs: 66, estimatedZ: null },
        { pixelX: 800, pixelY: 1500, timestampMs: 99, estimatedZ: null },
      ];

      const result = smoothTrajectory(points, {
        ...DEFAULT_SMOOTHING_CONFIG,
        outlierThreshold: 1.5, // Aggressive outlier detection
      });

      // At least some should be marked as outliers
      const outlierCount = result.filter(p => p.isOutlier).length;
      expect(outlierCount).toBeGreaterThan(0);
    });

    it('should respect custom window size', () => {
      const points: TrajectoryPoint[] = Array.from({ length: 10 }, (_, i) => ({
        pixelX: 100 + i * 10,
        pixelY: 200 + i * 10,
        timestampMs: i * 33,
        estimatedZ: null,
      }));

      const result = smoothTrajectory(points, {
        ...DEFAULT_SMOOTHING_CONFIG,
        windowSize: 5,
        enableParabolicFit: false,
      });

      // All points should be smoothed
      expect(result.every(p => p.smoothedX !== null && p.smoothedY !== null)).toBe(true);
    });

    it('should handle noisy trajectory data', () => {
      // Create trajectory with added noise
      const points: TrajectoryPoint[] = Array.from({ length: 20 }, (_, i) => {
        const x = 100 + i * 20;
        const y = 200 + i * 15;
        const noiseX = (Math.random() - 0.5) * 10;
        const noiseY = (Math.random() - 0.5) * 10;
        return {
          pixelX: x + noiseX,
          pixelY: y + noiseY,
          timestampMs: i * 33,
          estimatedZ: null,
        };
      });

      const result = smoothTrajectory(points);

      // Most points should be smoothed
      const smoothedCount = result.filter(p => p.smoothedX !== null && p.smoothedY !== null).length;
      expect(smoothedCount).toBeGreaterThan(points.length * 0.8);
    });
  });

  describe('validateSmoothedTrajectory', () => {
    it('should validate successful smoothing', () => {
      const points: SmoothedTrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null, smoothedX: 105, smoothedY: 205, isOutlier: false },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null, smoothedX: 110, smoothedY: 210, isOutlier: false },
        { pixelX: 120, pixelY: 220, timestampMs: 66, estimatedZ: null, smoothedX: 115, smoothedY: 215, isOutlier: false },
      ];

      const result = validateSmoothedTrajectory(points);

      expect(result.isValid).toBe(true);
      expect(result.validPointCount).toBe(3);
      expect(result.smoothedPointCount).toBe(3);
      expect(result.outlierCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty trajectory', () => {
      const result = validateSmoothedTrajectory([]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No trajectory points provided');
    });

    it('should detect all outliers', () => {
      const points: SmoothedTrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null, smoothedX: null, smoothedY: null, isOutlier: true },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null, smoothedX: null, smoothedY: null, isOutlier: true },
      ];

      const result = validateSmoothedTrajectory(points);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No points could be smoothed (all marked as outliers or invalid)');
      expect(result.outlierCount).toBe(2);
    });

    it('should detect high outlier rate', () => {
      const points: SmoothedTrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null, smoothedX: 105, smoothedY: 205, isOutlier: false },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null, smoothedX: null, smoothedY: null, isOutlier: true },
        { pixelX: 120, pixelY: 220, timestampMs: 66, estimatedZ: null, smoothedX: null, smoothedY: null, isOutlier: true },
        { pixelX: 130, pixelY: 230, timestampMs: 99, estimatedZ: null, smoothedX: null, smoothedY: null, isOutlier: true },
      ];

      const result = validateSmoothedTrajectory(points);

      expect(result.isValid).toBe(false);
      expect(result.outlierCount).toBe(3);
      expect(result.errors.some(e => e.includes('High outlier rate'))).toBe(true);
    });

    it('should count smoothed points correctly', () => {
      const points: SmoothedTrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null, smoothedX: 105, smoothedY: 205, isOutlier: false },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null, smoothedX: null, smoothedY: null, isOutlier: true },
        { pixelX: 120, pixelY: 220, timestampMs: 66, estimatedZ: null, smoothedX: 115, smoothedY: 215, isOutlier: false },
      ];

      const result = validateSmoothedTrajectory(points);

      expect(result.validPointCount).toBe(2);
      expect(result.smoothedPointCount).toBe(2);
      expect(result.outlierCount).toBe(1);
    });
  });

  describe('getRecommendedSmoothingConfig', () => {
    it('should recommend small window for sparse data', () => {
      const config = getRecommendedSmoothingConfig(4); // Less than minPointsForParabolic

      expect(config.windowSize).toBe(3);
      expect(config.enableParabolicFit).toBe(false);
    });

    it('should recommend medium window for moderate data', () => {
      const config = getRecommendedSmoothingConfig(20);

      expect(config.windowSize).toBe(5);
      expect(config.enableParabolicFit).toBe(true);
    });

    it('should recommend large window for dense data', () => {
      const config = getRecommendedSmoothingConfig(40);

      expect(config.windowSize).toBe(7);
      expect(config.enableParabolicFit).toBe(true);
    });

    it('should adjust threshold for low noise', () => {
      const config = getRecommendedSmoothingConfig(20, 'low');

      expect(config.outlierThreshold).toBe(2.5);
    });

    it('should adjust threshold for medium noise', () => {
      const config = getRecommendedSmoothingConfig(20, 'medium');

      expect(config.outlierThreshold).toBe(3.0);
    });

    it('should adjust threshold for high noise', () => {
      const config = getRecommendedSmoothingConfig(20, 'high');

      expect(config.outlierThreshold).toBe(3.5);
    });

    it('should disable parabolic fit for insufficient points', () => {
      const config = getRecommendedSmoothingConfig(4);

      expect(config.enableParabolicFit).toBe(false);
    });

    it('should enable parabolic fit for sufficient points', () => {
      const config = getRecommendedSmoothingConfig(10);

      expect(config.enableParabolicFit).toBe(true);
      expect(config.minPointsForParabolic).toBe(5);
    });
  });

  describe('Integration scenarios', () => {
    it('should smooth cricket ball arc trajectory', () => {
      // Simulate a cricket ball arc from bowler to batsman
      // Parabolic path with some noise
      const points: TrajectoryPoint[] = Array.from({ length: 15 }, (_, i) => {
        const x = 100 + i * 30; // Horizontal progress
        const y = 300 - 0.02 * (x - 300) ** 2; // Parabolic arc
        const noise = (Math.random() - 0.5) * 8; // ±4 pixel noise
        return {
          pixelX: x,
          pixelY: y + noise,
          timestampMs: i * 33,
          estimatedZ: null,
        };
      });

      const result = smoothTrajectory(points);

      // Should successfully smooth most points
      const smoothedCount = result.filter(p => p.smoothedX !== null && p.smoothedY !== null).length;
      expect(smoothedCount).toBeGreaterThanOrEqual(12);

      // Should detect minimal outliers with reasonable noise
      const outlierCount = result.filter(p => p.isOutlier).length;
      expect(outlierCount).toBeLessThan(3);
    });

    it('should handle fast delivery with sparse detections', () => {
      // Fast delivery: only 5 detection points
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 400, timestampMs: 0, estimatedZ: null },
        { pixelX: 200, pixelY: 380, timestampMs: 50, estimatedZ: null },
        { pixelX: 300, pixelY: 350, timestampMs: 100, estimatedZ: null },
        { pixelX: 400, pixelY: 330, timestampMs: 150, estimatedZ: null },
        { pixelX: 500, pixelY: 320, timestampMs: 200, estimatedZ: null },
      ];

      const config = getRecommendedSmoothingConfig(points.length);
      const result = smoothTrajectory(points, config);

      // Should smooth all points despite sparse data
      expect(result.every(p => p.smoothedX !== null && p.smoothedY !== null)).toBe(true);

      // Should apply parabolic fit
      expect(config.enableParabolicFit).toBe(true);
    });

    it('should reject trajectory with detection errors', () => {
      // Trajectory with significant detection errors
      const points: TrajectoryPoint[] = [
        { pixelX: 100, pixelY: 200, timestampMs: 0, estimatedZ: null },
        { pixelX: 110, pixelY: 210, timestampMs: 33, estimatedZ: null },
        { pixelX: 800, pixelY: 900, timestampMs: 66, estimatedZ: null }, // Error
        { pixelX: 130, pixelY: 230, timestampMs: 99, estimatedZ: null },
        { pixelX: 140, pixelY: 240, timestampMs: 132, estimatedZ: null },
        { pixelX: 50, pixelY: 50, timestampMs: 165, estimatedZ: null }, // Error
      ];

      const result = smoothTrajectory(points);
      const validation = validateSmoothedTrajectory(result);

      // Should detect errors as outliers
      expect(result.filter(p => p.isOutlier).length).toBeGreaterThan(0);

      // Should still provide valid smoothed points
      expect(validation.validPointCount).toBeGreaterThan(0);
    });
  });
});
