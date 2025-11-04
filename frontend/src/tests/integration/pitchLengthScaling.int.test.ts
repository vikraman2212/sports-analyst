/**
 * Integration Test: Speed scales with pitch length selection
 */

import type { FrameSample, CalibrationProfile } from '@/lib/types';
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

describe('Integration: pitch length scaling', () => {
  let frames: FrameSample[];

  beforeEach(() => {
    // 30 frames at ~30fps, arbitrary image size
    frames = Array.from({ length: 30 }, (_, i) => ({
      frameIndex: i,
      timestampMs: i * 33,
      imageData: createNonBlankImageData(640, 480),
    }));
  });

  it('analyzeDelivery produces speed proportional to referenceDistanceMeters', async () => {
    const { analyzeDelivery } = await import('@/lib/analyzeDelivery');

    const pitchLengthPixels = 900; // arbitrary calibration pixel length

    const calibStandard = createMockCalibration({ballMassGrams: 156});

    const calibYouth = createMockCalibration({ballMassGrams: 156});

    const resultStandard = await analyzeDelivery(frames, calibStandard);
    const resultYouth = await analyzeDelivery(frames, calibYouth);

    // Ratio should roughly match calibration ratio (allow tolerance due to detection variability)
    const ratio = resultStandard.speedKmh / resultYouth.speedKmh;
    expect(ratio).toBeGreaterThan(1.15);
    expect(ratio).toBeLessThan(1.35);
  });
});
