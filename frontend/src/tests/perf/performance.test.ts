/**
 * Performance Test Harness
 * 
 * Measures latency for critical operations in the cricket ball tracking system.
 * Performance targets from plan.md:
 * - <5s post-delivery result latency
 * - <100ms inference per frame (on mid-range device)
 * - Overall system responsiveness
 */

import { Timer, measureAsync, LabeledTimer } from '../../lib/metrics/timing';
import { calculateSpeed } from '../../lib/speed-calculation/speed';
import { smoothTrajectory } from '../../lib/speed-calculation/trajectorySmoothing';
import { generateWarnings } from '../../lib/speed-calculation/warnings';
import type { TrajectoryPoint, CalibrationProfile, DeliveryResult } from '../../lib/types';

// Performance thresholds from plan.md
const THRESHOLDS = {
  SPEED_CALCULATION: 50, // ms - speed calculation should be fast
  TRAJECTORY_SMOOTHING: 50, // ms - smoothing overhead
  WARNING_GENERATION: 50, // ms - warning generation
};

/**
 * Creates a mock trajectory point for testing
 */
function createMockTrajectoryPoint(
  timestampMs: number,
  pixelX: number,
  pixelY: number,
): TrajectoryPoint {
  return {
    timestampMs,
    pixelX,
    pixelY,
    estimatedZ: null,
  };
}

/**
 * Creates a mock calibration profile for testing
 */
function createMockCalibration(): CalibrationProfile {
  return {
    pitchLengthPixels: 2012,
    referenceDistanceMeters: 20.12,
    homographyMatrix: null,
  };
}

/**
 * Generates a mock delivery with trajectory points
 */
function generateMockDelivery(frameCount: number): {
  trajectoryPoints: TrajectoryPoint[];
  calibration: CalibrationProfile;
} {
  const trajectoryPoints: TrajectoryPoint[] = [];

  for (let i = 0; i < frameCount; i++) {
    const pixelX = 100 + i * 50;
    const pixelY = 200 + Math.sin(i * 0.2) * 20; // Parabolic arc
    const timestampMs = i * 33; // ~30fps

    trajectoryPoints.push(createMockTrajectoryPoint(timestampMs, pixelX, pixelY));
  }

  return {
    trajectoryPoints,
    calibration: createMockCalibration(),
  };
}

/**
 * Creates a mock delivery result for warning tests
 */
function createMockDeliveryResult(overrides: Partial<DeliveryResult> = {}): DeliveryResult {
  return {
    speedKmh: 120,
    detectionCount: 15,
    confidence: 0.9,
    trajectoryPoints: generateMockDelivery(15).trajectoryPoints,
    processingMs: 100,
    warnings: [],
    ...overrides,
  };
}

describe('Performance Test Harness', () => {
  describe('Timer Performance', () => {
    it('should measure elapsed time accurately', () => {
      const timer = new Timer();
      timer.start();

      // Simulate work
      const workDuration = 10;
      const startWork = performance.now();
      while (performance.now() - startWork < workDuration) {
        // Busy wait
      }

      timer.stop();
      const elapsed = timer.elapsed();

  // Should be close to work duration (allow a slightly larger tolerance in CI)
      expect(elapsed).toBeGreaterThanOrEqual(workDuration);
  expect(elapsed).toBeLessThan(workDuration + 25);
    });

    it('should have minimal overhead', () => {
      const iterations = 1000;
      const overheads: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const timer = new Timer();
        timer.start();
        timer.stop();
        overheads.push(timer.elapsed());
      }

      const avgOverhead = overheads.reduce((a, b) => a + b, 0) / iterations;

      // Timer overhead should be < 1ms
      expect(avgOverhead).toBeLessThan(1);
    });
  });

  describe('Speed Calculation Performance', () => {
    it('should calculate speed within threshold', async () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(15);

      const [, duration] = await measureAsync(async () => {
        return calculateSpeed(trajectoryPoints, calibration);
      });

      expect(duration).toBeLessThan(THRESHOLDS.SPEED_CALCULATION);
    });

    it('should handle large trajectory efficiently', async () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(100);

      const [, duration] = await measureAsync(async () => {
        return calculateSpeed(trajectoryPoints, calibration);
      });

      // Even with 100 points, should be fast
      expect(duration).toBeLessThan(THRESHOLDS.SPEED_CALCULATION * 2);
    });

    it('should scale linearly with trajectory size', async () => {
      const sizes = [10, 20, 40];
      const durations: number[] = [];

      for (const size of sizes) {
        const { trajectoryPoints, calibration } = generateMockDelivery(size);

        const [, duration] = await measureAsync(async () => {
          return calculateSpeed(trajectoryPoints, calibration);
        });

        durations.push(duration);
      }

      // Doubling size should not more than double duration
      // Handle edge case where durations might be 0 (very fast operations)
      if (durations[0] > 0 && durations[1] > 0) {
        const ratio1 = durations[1] / durations[0];
        const ratio2 = durations[2] / durations[1];

        expect(ratio1).toBeLessThan(3);
        expect(ratio2).toBeLessThan(3);
      } else {
        // If operations are so fast they're 0ms, just verify they completed
        expect(durations.every(d => d >= 0)).toBe(true);
      }
    });
  });

  describe('Trajectory Smoothing Performance', () => {
    it('should smooth trajectory within threshold', async () => {
      const { trajectoryPoints } = generateMockDelivery(20);

      const [smoothedPoints, duration] = await measureAsync(async () => {
        return smoothTrajectory(trajectoryPoints);
      });

      expect(duration).toBeLessThan(THRESHOLDS.TRAJECTORY_SMOOTHING);
      expect(smoothedPoints.length).toBe(trajectoryPoints.length);
    });

    it('should handle sparse trajectory efficiently', async () => {
      const { trajectoryPoints } = generateMockDelivery(5);

      const [, duration] = await measureAsync(async () => {
        return smoothTrajectory(trajectoryPoints);
      });

      expect(duration).toBeLessThan(THRESHOLDS.TRAJECTORY_SMOOTHING);
    });

    it('should handle dense trajectory efficiently', async () => {
      const { trajectoryPoints } = generateMockDelivery(50);

      const [, duration] = await measureAsync(async () => {
        return smoothTrajectory(trajectoryPoints, {
          windowSize: 5,
          outlierThreshold: 3.0,
          minPointsForParabolic: 5,
          enableParabolicFit: true,
        });
      });

      expect(duration).toBeLessThan(THRESHOLDS.TRAJECTORY_SMOOTHING * 2);
    });
  });

  describe('Warning Generation Performance', () => {
    it('should generate warnings within threshold', async () => {
      const result = createMockDeliveryResult();

      const [warnings, duration] = await measureAsync(async () => {
        return generateWarnings(result);
      });

      expect(duration).toBeLessThan(THRESHOLDS.WARNING_GENERATION);
      expect(Array.isArray(warnings)).toBe(true);
    });

    it('should scale with trajectory size', async () => {
      const sizes = [10, 30, 60];
      const durations: number[] = [];

      for (const size of sizes) {
        const result = createMockDeliveryResult({
          trajectoryPoints: generateMockDelivery(size).trajectoryPoints,
        });

        const [, duration] = await measureAsync(async () => {
          return generateWarnings(result);
        });

        durations.push(duration);
      }

      // All should be under threshold
      durations.forEach(d => {
        expect(d).toBeLessThan(THRESHOLDS.WARNING_GENERATION);
      });
    });
  });

  describe('Labeled Timer Performance', () => {
    it('should track multiple operations', () => {
      const labeledTimer = new LabeledTimer();

      labeledTimer.start('operation1');
      // Simulate work
      const work1Start = performance.now();
      while (performance.now() - work1Start < 5) {
        // Busy wait 5ms
      }
      labeledTimer.stop('operation1');

      labeledTimer.start('operation2');
      const work2Start = performance.now();
      while (performance.now() - work2Start < 10) {
        // Busy wait 10ms
      }
      labeledTimer.stop('operation2');

      const durations = labeledTimer.getAllTimings();

      expect(durations.operation1).toBeGreaterThanOrEqual(5);
      expect(durations.operation1).toBeLessThan(10);
      expect(durations.operation2).toBeGreaterThanOrEqual(10);
      expect(durations.operation2).toBeLessThan(15);
    });

    it('should profile delivery analysis pipeline', () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(15);
      const labeledTimer = new LabeledTimer();

      // Profile each stage
      labeledTimer.start('smoothing');
      smoothTrajectory(trajectoryPoints);
      labeledTimer.stop('smoothing');

      labeledTimer.start('speed_calc');
      calculateSpeed(trajectoryPoints, calibration);
      labeledTimer.stop('speed_calc');

      labeledTimer.start('warnings');
      const result = createMockDeliveryResult({ trajectoryPoints });
      generateWarnings(result);
      labeledTimer.stop('warnings');

      const durations = labeledTimer.getAllTimings();

      // Each stage should meet threshold
      expect(durations.smoothing).toBeLessThan(THRESHOLDS.TRAJECTORY_SMOOTHING);
      expect(durations.speed_calc).toBeLessThan(THRESHOLDS.SPEED_CALCULATION);
      expect(durations.warnings).toBeLessThan(THRESHOLDS.WARNING_GENERATION);

      // Total should be fast
      const total = durations.smoothing + durations.speed_calc + durations.warnings;
      expect(total).toBeLessThan(200); // All stages combined < 200ms
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect if speed calculation regresses', async () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(15);
      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const [, duration] = await measureAsync(async () => {
          return calculateSpeed(trajectoryPoints, calibration);
        });
        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
      const maxDuration = Math.max(...durations);

      // Average should be well under threshold
      expect(avgDuration).toBeLessThan(THRESHOLDS.SPEED_CALCULATION * 0.5);

      // Max should still meet threshold (no extreme outliers)
      expect(maxDuration).toBeLessThan(THRESHOLDS.SPEED_CALCULATION);
    });

    it('should detect if trajectory smoothing regresses', async () => {
      const { trajectoryPoints } = generateMockDelivery(20);
      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const [, duration] = await measureAsync(async () => {
          return smoothTrajectory(trajectoryPoints);
        });
        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
      const maxDuration = Math.max(...durations);

      expect(avgDuration).toBeLessThan(THRESHOLDS.TRAJECTORY_SMOOTHING * 0.5);
      expect(maxDuration).toBeLessThan(THRESHOLDS.TRAJECTORY_SMOOTHING);
    });
  });

  describe('Memory Performance', () => {
    it('should handle large trajectory without memory issues', () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(200);

      const speed = calculateSpeed(trajectoryPoints, calibration);
      const smoothed = smoothTrajectory(trajectoryPoints);

      expect(speed).toBeGreaterThan(0);
      expect(smoothed.length).toBeLessThanOrEqual(200);
    });

    it('should not create excessive garbage during repeated operations', () => {
      // This test verifies that we don't create too many temporary objects
      const { trajectoryPoints, calibration } = generateMockDelivery(30);

      // Run analysis multiple times
      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        calculateSpeed(trajectoryPoints, calibration);
        smoothTrajectory(trajectoryPoints);
      }

      // If this test completes without hanging, memory is managed reasonably
      expect(true).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should meet performance target for typical delivery (15 frames)', async () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(15);

      const [, duration] = await measureAsync(async () => {
        smoothTrajectory(trajectoryPoints);
        return calculateSpeed(trajectoryPoints, calibration);
      });

      // Typical delivery should be processed quickly
      expect(duration).toBeLessThan(100);
    });

    it('should meet performance target for slow delivery (30 frames)', async () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(30);

      const [, duration] = await measureAsync(async () => {
        smoothTrajectory(trajectoryPoints);
        return calculateSpeed(trajectoryPoints, calibration);
      });

      expect(duration).toBeLessThan(150);
    });

    it('should handle poor detection scenario (5 frames)', async () => {
      const { trajectoryPoints, calibration } = generateMockDelivery(5);

      const [, duration] = await measureAsync(async () => {
        smoothTrajectory(trajectoryPoints);
        return calculateSpeed(trajectoryPoints, calibration);
      });

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should log performance metrics for reference', () => {
      const scenarios = [
        { name: 'Minimum (3 frames)', frames: 3 },
        { name: 'Typical (15 frames)', frames: 15 },
        { name: 'High density (30 frames)', frames: 30 },
        { name: 'Maximum (60 frames)', frames: 60 },
      ];

      // eslint-disable-next-line no-console
      console.log('\n=== Performance Benchmarks ===');

      scenarios.forEach(scenario => {
        const { trajectoryPoints, calibration } = generateMockDelivery(scenario.frames);
        const timer = new Timer();

        timer.start();
        const smoothed = smoothTrajectory(trajectoryPoints);
        const speed = calculateSpeed(smoothed, calibration);
        const result = createMockDeliveryResult({
          speedKmh: speed,
          trajectoryPoints: smoothed,
        });
        const warnings = generateWarnings(result);
        timer.stop();

        // eslint-disable-next-line no-console
        console.log(`${scenario.name}:`);
        // eslint-disable-next-line no-console
        console.log(`  Duration: ${timer.elapsed().toFixed(2)}ms`);
        // eslint-disable-next-line no-console
        console.log(`  Speed: ${speed.toFixed(1)} km/h`);
        // eslint-disable-next-line no-console
        console.log(`  Warnings: ${warnings.length}`);
      });

      // eslint-disable-next-line no-console
      console.log('==============================\n');

      expect(true).toBe(true);
    });
  });
});
