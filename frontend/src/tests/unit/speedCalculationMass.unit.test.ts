/**
 * Unit Tests: Ball mass effects on speed calculations
 */

import { calculateSpeed } from '@/lib/speed-calculation/speed';
import type { CalibrationProfile, TrajectoryPoint } from '@/lib/types';
import { createMockCalibration } from '../testHelpers';

describe('Speed Calculation with Ball Mass', () => {
  // Helper to create consistent trajectory
  const createTrajectory = (): TrajectoryPoint[] => [
    { pixelX: 100, pixelY: 200, estimatedZ: null, timestampMs: 0 },
    { pixelX: 200, pixelY: 210, estimatedZ: null, timestampMs: 50 },
    { pixelX: 300, pixelY: 220, estimatedZ: null, timestampMs: 100 },
    { pixelX: 400, pixelY: 230, estimatedZ: null, timestampMs: 150 },
    { pixelX: 500, pixelY: 240, estimatedZ: null, timestampMs: 200 },
  ];

  it('calculates speed with standard mass (156g)', () => {
    const calibration = createMockCalibration({pitchLengthPixels: 512, ballMassGrams: 156});

    const trajectory = createTrajectory();
    const speedKmh = calculateSpeed(trajectory, calibration);

    expect(speedKmh).toBeGreaterThan(0);
    expect(typeof speedKmh).toBe('number');
  });

  it('calculates speed with youth mass (135g)', () => {
    const calibration = createMockCalibration({pitchLengthPixels: 512, ballMassGrams: 135});

    const trajectory = createTrajectory();
    const speedKmh = calculateSpeed(trajectory, calibration);

    expect(speedKmh).toBeGreaterThan(0);
    expect(typeof speedKmh).toBe('number');
  });

  it('calculates speed with custom mass (200g)', () => {
    const calibration = createMockCalibration({pitchLengthPixels: 512, ballMassGrams: 200});

    const trajectory = createTrajectory();
    const speedKmh = calculateSpeed(trajectory, calibration);

    expect(speedKmh).toBeGreaterThan(0);
    expect(typeof speedKmh).toBe('number');
  });

  it('speed calculation remains deterministic for same inputs', () => {
    const calibration156 = createMockCalibration({pitchLengthPixels: 512, ballMassGrams: 156});

    const calibration135 = createMockCalibration({pitchLengthPixels: 512, ballMassGrams: 135});

    const trajectory = createTrajectory();
    
    const speed1 = calculateSpeed(trajectory, calibration156);
    const speed2 = calculateSpeed(trajectory, calibration156);
    const speed3 = calculateSpeed(trajectory, calibration135);

    // Same mass should produce identical results
    expect(speed1).toBe(speed2);
    
    // Different mass should still calculate (same speed, as mass doesn't affect distance/time)
    expect(speed3).toBeGreaterThan(0);
  });
});
