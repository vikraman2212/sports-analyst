/**
 * Unit Tests: Ball mass effects on warnings
 */

import { generateWarnings } from '@/lib/speed-calculation/warnings';
import type { DeliveryResult } from '@/lib/types';

describe('Warnings with Ball Mass', () => {
  const createBaseResult = (speedKmh: number): DeliveryResult => ({
    speedKmh,
    trajectoryPoints: [
      { pixelX: 100, pixelY: 200, estimatedZ: null, timestampMs: 0 },
      { pixelX: 200, pixelY: 210, estimatedZ: null, timestampMs: 50 },
      { pixelX: 300, pixelY: 220, estimatedZ: null, timestampMs: 100 },
      { pixelX: 400, pixelY: 230, estimatedZ: null, timestampMs: 150 },
      { pixelX: 500, pixelY: 240, estimatedZ: null, timestampMs: 200 },
    ],
    confidence: 0.9,
    detectionCount: 5,
    processingMs: 100,
  });

  it('generates warning for unrealistically low ball mass', () => {
    const result = createBaseResult(100);
    const warnings = generateWarnings(result, { ballMassGrams: 30 });

    expect(warnings.some(w => w.includes('Unrealistic ball weight'))).toBe(true);
    expect(warnings.some(w => w.includes('30g < 50g'))).toBe(true);
  });

  it('generates warning for unrealistically high ball mass', () => {
    const result = createBaseResult(100);
    const warnings = generateWarnings(result, { ballMassGrams: 350 });

    expect(warnings.some(w => w.includes('Unrealistic ball weight'))).toBe(true);
    expect(warnings.some(w => w.includes('350g > 300g'))).toBe(true);
  });

  it('does not warn for valid ball mass', () => {
    const result = createBaseResult(100);
    const warnings156 = generateWarnings(result, { ballMassGrams: 156 });
    const warnings135 = generateWarnings(result, { ballMassGrams: 135 });

    expect(warnings156.every(w => !w.includes('Unrealistic ball weight'))).toBe(true);
    expect(warnings135.every(w => !w.includes('Unrealistic ball weight'))).toBe(true);
  });

  it('adjusts max plausible speed for light balls (<120g)', () => {
    const result = createBaseResult(180);
    const warnings = generateWarnings(result, { ballMassGrams: 100 });

    // Light balls max out at ~150 km/h
    expect(warnings.some(w => w.includes('Unusually high speed'))).toBe(true);
    expect(warnings.some(w => w.includes('100g ball'))).toBe(true);
  });

  it('adjusts max plausible speed for heavy balls (>180g)', () => {
    const result = createBaseResult(180);
    const warnings = generateWarnings(result, { ballMassGrams: 200 });

    // Heavy balls can reach up to 220 km/h, so 180 should be fine
    expect(warnings.every(w => !w.includes('Unusually high speed'))).toBe(true);
  });

  it('allows higher speeds for standard mass (156g)', () => {
    const result = createBaseResult(190);
    const warnings = generateWarnings(result, { ballMassGrams: 156 });

    // Standard balls max out at ~200 km/h, so 190 is OK
    expect(warnings.every(w => !w.includes('Unusually high speed'))).toBe(true);
  });

  it('warns on extremely high speed even for heavy balls', () => {
    const result = createBaseResult(250);
    const warnings = generateWarnings(result, { ballMassGrams: 200 });

    // Even heavy balls shouldn't exceed ~220 km/h
    expect(warnings.some(w => w.includes('Unusually high speed'))).toBe(true);
  });
});
