/**
 * Integration Test: Speed scales with pitch length selection
 */

import type { FrameSample, CalibrationProfile } from '@/lib/types';

describe('Integration: pitch length scaling', () => {
  let frames: FrameSample[];

  beforeEach(() => {
    // 30 frames at ~30fps, arbitrary image size
    frames = Array.from({ length: 30 }, (_, i) => ({
      frameIndex: i,
      timestampMs: i * 33,
      imageData: new ImageData(640, 480),
    }));
  });

  it('analyzeDelivery produces speed proportional to referenceDistanceMeters', async () => {
    const { analyzeDelivery } = await import('@/lib/analyzeDelivery');

    const pitchLengthPixels = 900; // arbitrary calibration pixel length

    const calibStandard: CalibrationProfile = {
      pitchLengthPixels,
      referenceDistanceMeters: 20.12,
      homographyMatrix: null,
    };

    const calibYouth: CalibrationProfile = {
      pitchLengthPixels,
      referenceDistanceMeters: 16.0,
      homographyMatrix: null,
    };

    const resultStandard = await analyzeDelivery(frames, calibStandard);
    const resultYouth = await analyzeDelivery(frames, calibYouth);

    // Ratio should roughly match calibration ratio (allow tolerance due to detection variability)
    const ratio = resultStandard.speedKmh / resultYouth.speedKmh;
    expect(ratio).toBeGreaterThan(1.15);
    expect(ratio).toBeLessThan(1.35);
  });
});
