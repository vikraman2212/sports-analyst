/**
 * Integration Test: Camera Diagnostics & Warnings
 * 
 * Tests that camera diagnostics are properly integrated into the warning system
 * and that low FPS/exposure issues generate appropriate warnings.
 */

import { generateWarnings } from '../../lib/speed-calculation/warnings';
import type { DeliveryResult } from '../../lib/types';
import type { CameraDiagnostics } from '../../hooks/useCameraDiagnostics';

describe('Camera Diagnostics Integration', () => {
  const createMockDeliveryResult = (
    overrides?: Partial<DeliveryResult>
  ): DeliveryResult => ({
    speedKmh: 120,
    confidence: 0.9,
    detectionCount: 20,
    processingMs: 1000,
    trajectoryPoints: [
      { pixelX: 100, pixelY: 100, timestampMs: 0, estimatedZ: 0 },
      { pixelX: 200, pixelY: 150, timestampMs: 33, estimatedZ: 0 },
      { pixelX: 300, pixelY: 200, timestampMs: 66, estimatedZ: 0 },
      { pixelX: 400, pixelY: 250, timestampMs: 99, estimatedZ: 0 },
      { pixelX: 500, pixelY: 300, timestampMs: 132, estimatedZ: 0 },
    ],
    ...overrides,
  });

  const createMockDiagnostics = (
    overrides?: Partial<CameraDiagnostics>
  ): CameraDiagnostics => ({
    resolution: { width: 1920, height: 1080 },
    reportedFPS: 30,
    inferredFPS: 30,
    exposureStatus: 'good',
    averageBrightness: 128,
    brightnessVariance: 20,
    meetsRequirements: true,
    requirementIssues: [],
    ...overrides,
  });

  it('should include camera FPS warning when FPS is low', () => {
    const result = createMockDeliveryResult();
    const diagnostics = createMockDiagnostics({
      inferredFPS: 15,
      meetsRequirements: false,
      requirementIssues: ['Low frame rate (15 fps, need 30+)'],
    });

    const warnings = generateWarnings(result, { cameraDiagnostics: diagnostics });

    expect(warnings).toContain('Camera: Low frame rate (15 fps, need 30+)');
  });

  it('should include camera exposure warning when lighting is insufficient', () => {
    const result = createMockDeliveryResult();
    const diagnostics = createMockDiagnostics({
      exposureStatus: 'too-low',
      meetsRequirements: false,
      requirementIssues: ['Insufficient lighting - increase brightness'],
    });

    const warnings = generateWarnings(result, { cameraDiagnostics: diagnostics });

    expect(warnings).toContain('Camera: Insufficient lighting - increase brightness');
  });

  it('should include camera motion blur warning', () => {
    const result = createMockDeliveryResult();
    const diagnostics = createMockDiagnostics({
      exposureStatus: 'too-high',
      brightnessVariance: 60,
      meetsRequirements: false,
      requirementIssues: ['Motion blur detected - reduce exposure time'],
    });

    const warnings = generateWarnings(result, { cameraDiagnostics: diagnostics });

    expect(warnings).toContain('Camera: Motion blur detected - reduce exposure time');
  });

  it('should combine camera and detection warnings', () => {
    const result = createMockDeliveryResult({
      detectionCount: 3, // Low detection count
      confidence: 0.5, // Low confidence
    });
    const diagnostics = createMockDiagnostics({
      inferredFPS: 20,
      meetsRequirements: false,
      requirementIssues: ['Low frame rate (20 fps, need 30+)'],
    });

    const warnings = generateWarnings(result, { cameraDiagnostics: diagnostics });

    // Should have both camera and detection warnings
    expect(warnings.length).toBeGreaterThan(2);
    expect(warnings.some((w) => w.includes('Camera:'))).toBe(true);
    expect(warnings.some((w) => w.includes('Low detection count'))).toBe(true);
    expect(warnings.some((w) => w.includes('Low detection confidence'))).toBe(true);
  });

  it('should not include camera warnings when requirements are met', () => {
    const result = createMockDeliveryResult();
    const diagnostics = createMockDiagnostics(); // All good

    const warnings = generateWarnings(result, { cameraDiagnostics: diagnostics });

    expect(warnings.every((w) => !w.includes('Camera:'))).toBe(true);
  });

  it('should work without camera diagnostics (backward compatibility)', () => {
    const result = createMockDeliveryResult();

    const warnings = generateWarnings(result); // No diagnostics provided

    // Should not crash and should work as before
    expect(Array.isArray(warnings)).toBe(true);
  });

  it('should prioritize multiple camera issues', () => {
    const result = createMockDeliveryResult();
    const diagnostics = createMockDiagnostics({
      meetsRequirements: false,
      requirementIssues: [
        'Low frame rate (15 fps, need 30+)',
        'Insufficient lighting - increase brightness',
        'Motion blur detected - reduce exposure time',
      ],
    });

    const warnings = generateWarnings(result, { cameraDiagnostics: diagnostics });

    // All camera issues should be included
    expect(warnings.filter((w) => w.includes('Camera:'))).toHaveLength(3);
  });

  it('should handle edge case with very low quality delivery and camera issues', () => {
    const result = createMockDeliveryResult({
      detectionCount: 2,
      confidence: 0.3,
      speedKmh: 5, // Very low speed
      trajectoryPoints: [
        { pixelX: 100, pixelY: 100, timestampMs: 0, estimatedZ: 0 },
        { pixelX: 110, pixelY: 105, timestampMs: 100, estimatedZ: 0 }, // Short trajectory
      ],
    });
    const diagnostics = createMockDiagnostics({
      inferredFPS: 10,
      exposureStatus: 'too-low',
      meetsRequirements: false,
      requirementIssues: [
        'Low frame rate (10 fps, need 30+)',
        'Insufficient lighting - increase brightness',
      ],
    });

    const warnings = generateWarnings(result, { cameraDiagnostics: diagnostics });

    // Should have multiple warnings from both sources
    expect(warnings.length).toBeGreaterThanOrEqual(5);
    expect(warnings.filter((w) => w.includes('Camera:'))).toHaveLength(2);
  });
});
