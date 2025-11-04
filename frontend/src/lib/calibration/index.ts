/**
 * Calibration Module
 * 
 * Handles calibration of pixel-to-meter conversion for cricket ball tracking.
 * Uses 22-yard (20.12m) cricket pitch as reference distance.
 */

import type { CalibrationProfile } from '../types';

/**
 * Standard cricket pitch length in meters (22 yards)
 */
export const CRICKET_PITCH_LENGTH_METERS = 20.12;
/**
 * Youth cricket pitch length in meters (commonly used)
 */
export const YOUTH_PITCH_LENGTH_METERS = 16.0;

/**
 * Minimum reasonable pitch length in pixels
 */
const MIN_PITCH_LENGTH_PIXELS = 50;

/**
 * Maximum reasonable pitch length in pixels (4K resolution width)
 */
const MAX_PITCH_LENGTH_PIXELS = 3840;

/**
 * Minimum reasonable reference distance in meters
 */
const MIN_REFERENCE_DISTANCE_METERS = 10;

/**
 * Maximum reasonable reference distance in meters
 * (cricket pitch is 20.12m, allow some margin for camera angle)
 */
const MAX_REFERENCE_DISTANCE_METERS = 30;

/**
 * Validates a calibration profile
 * 
 * @param calibration - The calibration profile to validate
 * @returns true if calibration is valid, false otherwise
 */
export function isValidCalibration(
  calibration: CalibrationProfile | null | undefined
): boolean {
  // Check if calibration exists
  if (!calibration) {
    return false;
  }

  // Check if required fields are present
  if (
    typeof calibration.pitchLengthPixels !== 'number' ||
    typeof calibration.referenceDistanceMeters !== 'number'
  ) {
    return false;
  }

  // Validate pitchLengthPixels
  if (
    calibration.pitchLengthPixels <= 0 ||
    calibration.pitchLengthPixels < MIN_PITCH_LENGTH_PIXELS ||
    calibration.pitchLengthPixels > MAX_PITCH_LENGTH_PIXELS
  ) {
    return false;
  }

  // Validate referenceDistanceMeters
  if (
    calibration.referenceDistanceMeters <= 0 ||
    calibration.referenceDistanceMeters < MIN_REFERENCE_DISTANCE_METERS ||
    calibration.referenceDistanceMeters > MAX_REFERENCE_DISTANCE_METERS
  ) {
    return false;
  }

  return true;
}

/**
 * Validates calibration and throws descriptive error if invalid
 * 
 * @param calibration - The calibration profile to validate
 * @throws Error with descriptive message if validation fails
 */
export function validateCalibration(
  calibration: CalibrationProfile | null | undefined
): asserts calibration is CalibrationProfile {
  if (!calibration) {
    throw new Error(
      'Calibration required. Please calibrate the system using the 22-yard cricket pitch as reference.'
    );
  }

  if (typeof calibration.pitchLengthPixels !== 'number') {
    throw new Error(
      'Calibration invalid: pitchLengthPixels must be a number. Please recalibrate.'
    );
  }

  if (calibration.pitchLengthPixels <= 0) {
    throw new Error(
      'Calibration invalid: pitchLengthPixels must be positive. Please recalibrate.'
    );
  }

  if (calibration.pitchLengthPixels < MIN_PITCH_LENGTH_PIXELS) {
    throw new Error(
      `Calibration invalid: pitchLengthPixels (${calibration.pitchLengthPixels}) is too small. Minimum is ${MIN_PITCH_LENGTH_PIXELS} pixels. Please recalibrate.`
    );
  }

  if (calibration.pitchLengthPixels > MAX_PITCH_LENGTH_PIXELS) {
    throw new Error(
      `Calibration invalid: pitchLengthPixels (${calibration.pitchLengthPixels}) is too large. Maximum is ${MAX_PITCH_LENGTH_PIXELS} pixels. Please recalibrate.`
    );
  }

  if (typeof calibration.referenceDistanceMeters !== 'number') {
    throw new Error(
      'Calibration invalid: referenceDistanceMeters must be a number. Please recalibrate.'
    );
  }

  if (calibration.referenceDistanceMeters <= 0) {
    throw new Error(
      'Calibration invalid: referenceDistanceMeters must be positive. Please recalibrate.'
    );
  }

  if (calibration.referenceDistanceMeters < MIN_REFERENCE_DISTANCE_METERS) {
    throw new Error(
      `Calibration invalid: referenceDistanceMeters (${calibration.referenceDistanceMeters}m) is too small. Expected around ${CRICKET_PITCH_LENGTH_METERS}m (22 yards). Please recalibrate.`
    );
  }

  if (calibration.referenceDistanceMeters > MAX_REFERENCE_DISTANCE_METERS) {
    throw new Error(
      `Calibration invalid: referenceDistanceMeters (${calibration.referenceDistanceMeters}m) is unrealistic. Cricket pitch is ${CRICKET_PITCH_LENGTH_METERS}m (22 yards). Please recalibrate.`
    );
  }
}

/**
 * Calculates the pixel-to-meter ratio from calibration
 * 
 * @param calibration - The calibration profile
 * @returns Pixels per meter ratio
 */
export function getPixelsPerMeter(calibration: CalibrationProfile): number {
  validateCalibration(calibration);
  return calibration.pitchLengthPixels / calibration.referenceDistanceMeters;
}

/**
 * Converts pixel distance to meters using calibration
 * 
 * @param pixelDistance - Distance in pixels
 * @param calibration - The calibration profile
 * @returns Distance in meters
 */
export function pixelsToMeters(
  pixelDistance: number,
  calibration: CalibrationProfile
): number {
  validateCalibration(calibration);
  const pixelsPerMeter = getPixelsPerMeter(calibration);
  return pixelDistance / pixelsPerMeter;
}

/**
 * Converts meters to pixels using calibration
 * 
 * @param meters - Distance in meters
 * @param calibration - The calibration profile
 * @returns Distance in pixels
 */
export function metersToPixels(
  meters: number,
  calibration: CalibrationProfile
): number {
  validateCalibration(calibration);
  const pixelsPerMeter = getPixelsPerMeter(calibration);
  return meters * pixelsPerMeter;
}

/**
 * Creates a standard calibration profile for a cricket pitch
 * 
 * @param pitchLengthPixels - The measured length of the pitch in pixels
 * @param ballMassGrams - The mass of the ball in grams (default 156g for men's cricket ball)
 * @returns A CalibrationProfile configured for a standard cricket pitch
 */
export function createCricketPitchCalibration(
  pitchLengthPixels: number,
  ballMassGrams: number = 156
): CalibrationProfile {
  const calibration: CalibrationProfile = {
    id: 'default',
    name: 'Standard Cricket Pitch',
    createdAt: new Date().toISOString(),
    pitchLengthPixels,
    referenceDistanceMeters: CRICKET_PITCH_LENGTH_METERS,
    ballMassGrams,
    homographyMatrix: null,
  };

  validateCalibration(calibration);
  return calibration;
}

/**
 * Creates a calibration profile using a custom pitch length in meters
 *
 * @param pitchLengthPixels - The measured length of the pitch in pixels
 * @param pitchLengthMeters - The real-world pitch length in meters (e.g., 20.12, 16.0)
 * @param ballMassGrams - The mass of the ball in grams (default 156g for men's cricket ball)
 * @returns A CalibrationProfile configured for the specified pitch length
 */
export function createPitchCalibration(
  pitchLengthPixels: number,
  pitchLengthMeters: number,
  ballMassGrams: number = 156
): CalibrationProfile {
  const calibration: CalibrationProfile = {
    id: `custom_${Date.now()}`,
    name: `Custom Pitch (${pitchLengthMeters}m)`,
    createdAt: new Date().toISOString(),
    pitchLengthPixels,
    referenceDistanceMeters: pitchLengthMeters,
    ballMassGrams,
    homographyMatrix: null,
  };

  validateCalibration(calibration);
  return calibration;
}

/**
 * Calculates Euclidean distance in pixels between two points
 * 
 * @param x1 - X coordinate of first point
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
 * @returns Distance in pixels
 */
export function calculatePixelDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
