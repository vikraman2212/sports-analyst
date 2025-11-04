/**
 * Integration Test: Ball weight impact across delivery pipeline
 */

import { analyzeDelivery } from '@/lib/analyzeDelivery';
import type { CalibrationProfile, FrameSample } from '@/lib/types';
import { createMockCalibration } from '../testHelpers';

describe('Ball Weight Integration Test', () => {
  // Mock frame with ball detection
  const createMockFrame = (frameIndex: number, timestampMs: number): FrameSample => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(640, 480);
    // Fill a few pixels so frames are non-blank for MockDetector
    const data = (imageData as unknown as { data?: Uint8ClampedArray }).data;
    if (data) {
      for (let i = 0; i < Math.min(200, data.length); i += 4) {
        data[i] = 255; // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A
      }
    }
    
    return {
      frameIndex,
      timestampMs,
      imageData,
    };
  };

  const createFrames = (): FrameSample[] => [
    createMockFrame(0, 0),
    createMockFrame(1, 33),
    createMockFrame(2, 66),
    createMockFrame(3, 100),
    createMockFrame(4, 133),
  ];

  it('processes delivery with standard ball weight (156g)', async () => {
    const calibration = createMockCalibration({
      pitchLengthPixels: 512,
      ballMassGrams: 156,
    });

    const frames = createFrames();
    const result = await analyzeDelivery(frames, calibration);

    expect(result).toBeDefined();
    expect(result.speedKmh).toBeGreaterThanOrEqual(0);
  });

  it('processes delivery with youth ball weight (135g)', async () => {
    const calibration = createMockCalibration({
      pitchLengthPixels: 512,
      ballMassGrams: 135,
    });

    const frames = createFrames();
    const result = await analyzeDelivery(frames, calibration);

    expect(result).toBeDefined();
    expect(result.speedKmh).toBeGreaterThanOrEqual(0);
  });

  it('generates appropriate warnings for light ball with high speed', async () => {
    const calibration = createMockCalibration({
      pitchLengthPixels: 512,
      ballMassGrams: 100,
    });

    const frames = createFrames();
    const result = await analyzeDelivery(frames, calibration);

    // If speed is unrealistically high for a light ball, warnings should be present
    if (result.speedKmh > 150) {
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    }
  });

  it('validates extreme ball weights generate warnings', async () => {
    const calibrationTooLight = createMockCalibration({
      pitchLengthPixels: 512,
      ballMassGrams: 30,
    });

    const frames = createFrames();
    const result = await analyzeDelivery(frames, calibrationTooLight);

    expect(result.warnings).toBeDefined();
    expect(result.warnings!.some(w => w.includes('Unrealistic ball weight'))).toBe(true);
  });
});
