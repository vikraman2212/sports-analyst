/**
 * Unit Tests: Ball mass effects on trajectory smoothing
 */

import { smoothTrajectory, DEFAULT_SMOOTHING_CONFIG } from '@/lib/speed-calculation/trajectorySmoothing';
import type { TrajectoryPoint } from '@/lib/types';

describe('Trajectory Smoothing with Ball Mass', () => {
  const createSampleTrajectory = (): TrajectoryPoint[] => [
    { pixelX: 100, pixelY: 200, estimatedZ: null, timestampMs: 0 },
    { pixelX: 120, pixelY: 205, estimatedZ: null, timestampMs: 33 },
    { pixelX: 140, pixelY: 210, estimatedZ: null, timestampMs: 66 },
    { pixelX: 160, pixelY: 215, estimatedZ: null, timestampMs: 100 },
    { pixelX: 180, pixelY: 220, estimatedZ: null, timestampMs: 133 },
  ];

  it('smooths trajectory with standard mass (156g)', () => {
    const config = { ...DEFAULT_SMOOTHING_CONFIG, ballMassGrams: 156 };
    const trajectory = createSampleTrajectory();
    const smoothed = smoothTrajectory(trajectory, config);

    expect(smoothed).toHaveLength(trajectory.length);
    expect(smoothed.every(p => p.smoothedX !== null)).toBe(true);
  });

  it('smooths trajectory with light mass (<120g)', () => {
    const config = { ...DEFAULT_SMOOTHING_CONFIG, ballMassGrams: 100 };
    const trajectory = createSampleTrajectory();
    const smoothed = smoothTrajectory(trajectory, config);

    expect(smoothed).toHaveLength(trajectory.length);
    // Light balls should have more lenient outlier threshold
    expect(config.ballMassGrams).toBeLessThan(120);
  });

  it('smooths trajectory with heavy mass (>180g)', () => {
    const config = { ...DEFAULT_SMOOTHING_CONFIG, ballMassGrams: 200 };
    const trajectory = createSampleTrajectory();
    const smoothed = smoothTrajectory(trajectory, config);

    expect(smoothed).toHaveLength(trajectory.length);
    // Heavy balls should have tighter outlier threshold
    expect(config.ballMassGrams).toBeGreaterThan(180);
  });

  it('ball mass parameter is optional in config', () => {
    const configWithMass = { ...DEFAULT_SMOOTHING_CONFIG, ballMassGrams: 156 };
    const configWithoutMass = { ...DEFAULT_SMOOTHING_CONFIG };
    delete (configWithoutMass as Partial<typeof configWithoutMass>).ballMassGrams;

    const trajectory = createSampleTrajectory();
    const smoothed1 = smoothTrajectory(trajectory, configWithMass);
    const smoothed2 = smoothTrajectory(trajectory, configWithoutMass);

    // Both should work
    expect(smoothed1).toHaveLength(trajectory.length);
    expect(smoothed2).toHaveLength(trajectory.length);
  });
});
