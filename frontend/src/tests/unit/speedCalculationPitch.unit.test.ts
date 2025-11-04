/**
 * Unit test: Speed scales with pitch length (referenceDistanceMeters)
 */

import { calculateSpeed } from '@/lib/speed-calculation/speed';
import type { CalibrationProfile, TrajectoryPoint } from '@/lib/types';
import { createMockCalibration } from '../testHelpers';

describe('calculateSpeed with different pitch lengths', () => {
  const makeTrajectory = (): TrajectoryPoint[] => [
    { pixelX: 100, pixelY: 100, estimatedZ: null, timestampMs: 0 },
    { pixelX: 200, pixelY: 100, estimatedZ: null, timestampMs: 100 }, // 100 px in 0.1s
  ];

  const pitchLengthPixels = 1000; // arbitrary calibration pixel length

  it('speed is proportional to referenceDistanceMeters', () => {
    const traj = makeTrajectory();

    const calibStandard = createMockCalibration();

    const calibYouth = createMockCalibration();

    const vStandard = calculateSpeed(traj, calibStandard);
    const vYouth = calculateSpeed(traj, calibYouth);

    const ratio = vStandard / vYouth;
    // Expect approximately 20.12/16 ratio
    expect(ratio).toBeGreaterThan(1.24);
    expect(ratio).toBeLessThan(1.27);
  });
});
