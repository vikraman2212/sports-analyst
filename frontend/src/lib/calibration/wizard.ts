/**
 * Camera calibration wizard utilities
 * Handles pixel distance calculation, validation, and calibration profile creation
 */

import type { CalibrationPoint, CalibrationValidation } from '../types';

/**
 * Calculate Euclidean distance between two points in pixels
 */
export function calculatePixelDistance(
  point1: CalibrationPoint,
  point2: CalibrationPoint
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate pixels per meter ratio
 */
export function calculatePixelsPerMeter(
  pixelDistance: number,
  realWorldMeters: number
): number {
  if (realWorldMeters <= 0) {
    throw new Error('Real world distance must be positive');
  }
  return pixelDistance / realWorldMeters;
}

/**
 * Validate calibration measurements
 * 
 * Realistic ranges:
 * - Minimum: 50px (very low res or distant camera)
 * - Maximum: 3840px (4K horizontal at close range)
 * - Typical 720p: 200-600px
 * - Typical 1080p: 300-900px
 */
export function validateCalibration(
  pixelDistance: number,
  referenceMeters: number,
  videoWidth: number,
  videoHeight: number
): CalibrationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check pixel distance is positive
  if (pixelDistance <= 0) {
    errors.push('Pixel distance must be positive');
    return { isValid: false, errors, warnings };
  }

  // Check reference distance is positive
  if (referenceMeters <= 0) {
    errors.push('Reference distance must be positive');
    return { isValid: false, errors, warnings };
  }

  // Absolute minimum (probably too small)
  if (pixelDistance < 50) {
    errors.push(
      'Calibration distance too small (<50px). Move camera closer or use higher resolution.'
    );
  }

  // Check against video dimensions (can't be larger than diagonal)
  const maxPossible = Math.sqrt(videoWidth ** 2 + videoHeight ** 2);
  if (pixelDistance > maxPossible) {
    errors.push(
      `Calibration distance (${Math.round(pixelDistance)}px) exceeds video diagonal (${Math.round(maxPossible)}px)`
    );
  }

  // Warnings for suboptimal calibration
  if (pixelDistance < 100 && errors.length === 0) {
    warnings.push(
      'Low pixel distance (<100px). Consider moving camera closer for better accuracy.'
    );
  }

  const pixelsPerMeter = pixelDistance / referenceMeters;

  // Check if calibration is reasonable (ballpark for typical cricket pitch)
  // At 720p (1280x720), a 20.12m pitch should be 200-800px depending on camera distance
  // That's roughly 10-40 pixels per meter
  if (pixelsPerMeter < 5 && errors.length === 0) {
    warnings.push(
      'Very low pixels per meter ratio. Ensure camera is positioned to see full pitch length.'
    );
  }

  if (pixelsPerMeter > 200 && errors.length === 0) {
    warnings.push(
      'Very high pixels per meter ratio. Camera may be too close - ensure full delivery is visible.'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    pixelDistance,
    pixelsPerMeter,
  };
}

/**
 * Generate unique calibration profile ID
 */
export function generateCalibrationId(): string {
  return `calib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format pixels per meter for display
 */
export function formatPixelsPerMeter(pixelsPerMeter: number): string {
  return `${pixelsPerMeter.toFixed(1)} px/m`;
}

/**
 * Estimate expected pixel distance for a given resolution and pitch length
 * Assumes camera positioned at mid-pitch viewing full length
 */
export function estimateExpectedPixels(
  videoWidth: number,
  _pitchMeters: number
): { min: number; max: number; typical: number } {
  // Heuristic: pitch occupies 20-80% of frame width depending on camera position
  const min = videoWidth * 0.2;
  const max = videoWidth * 0.8;
  const typical = videoWidth * 0.5;

  return { min, max, typical };
}
