/**
 * Test Helpers
 * Shared utilities for test files
 */

import type { CalibrationProfile } from '../lib/types';

/**
 * Creates a mock CalibrationProfile for testing
 */
export function createMockCalibration(
  overrides?: Partial<CalibrationProfile>
): CalibrationProfile {
  return {
    id: 'test-calibration-id',
    name: 'Test Calibration',
    createdAt: new Date().toISOString(),
    pitchLengthPixels: 1006,
    referenceDistanceMeters: 20.12,
    ballMassGrams: 156,
    homographyMatrix: null,
    ...overrides,
  };
}
