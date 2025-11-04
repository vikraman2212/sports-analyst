/**
 * Speed calculation utilities for cricket ball tracking
 * 
 * Calculates ball speed from trajectory points using calibration data.
 * Speed is calculated based on X-axis displacement (pitch length direction).
 */

import type { CalibrationProfile, TrajectoryPoint } from '../types';

/**
 * Calculate ball speed in km/h from trajectory points.
 * 
 * Uses the X-axis displacement (pitch length direction) as the primary
 * measure of distance traveled. This is appropriate for cricket where
 * the ball's main motion is along the pitch.
 * 
 * @param trajectoryPoints - Array of trajectory points with pixel coordinates and timestamps
 * @param calibration - Calibration profile with pitch length and reference distance
 * @returns Speed in km/h
 * @throws Error if validation fails
 */
export function calculateSpeed(
  trajectoryPoints: TrajectoryPoint[],
  calibration: CalibrationProfile
): number {
  // Validate trajectory points
  if (!trajectoryPoints || trajectoryPoints.length < 2) {
    throw new Error('Insufficient trajectory points - at least 2 points needed for speed calculation');
  }

  // Validate calibration
  if (!calibration) {
    throw new Error('Calibration data is required and cannot be null');
  }

  const { pitchLengthPixels, referenceDistanceMeters } = calibration;

  if (pitchLengthPixels <= 0) {
    throw new Error('Calibration invalid: pitchLengthPixels must be positive');
  }

  if (referenceDistanceMeters <= 0) {
    throw new Error('Calibration invalid: referenceDistanceMeters must be positive');
  }

  // Calculate pixels per meter ratio
  const pixelsPerMeter = pitchLengthPixels / referenceDistanceMeters;

  // Get first and last points
  const firstPoint = trajectoryPoints[0];
  const lastPoint = trajectoryPoints[trajectoryPoints.length - 1];

  // Calculate distance along X-axis (pitch length direction)
  const dx = Math.abs(lastPoint.pixelX - firstPoint.pixelX);
  const distancePixels = dx;

  // Convert distance from pixels to meters
  const distanceMeters = distancePixels / pixelsPerMeter;

  // Calculate time duration
  const timeDurationMs = lastPoint.timestampMs - firstPoint.timestampMs;

  if (timeDurationMs <= 0) {
    throw new Error('Time duration must be positive - all points have the same timestamp');
  }

  // Convert time from milliseconds to seconds
  const timeDurationSeconds = timeDurationMs / 1000.0;

  // Calculate speed in meters per second
  const speedMps = distanceMeters / timeDurationSeconds;

  // Convert to km/h (multiply by 3.6)
  const speedKmh = speedMps * 3.6;

  return speedKmh;
}

/**
 * Calculate average speed using straight-line Euclidean distance.
 * 
 * This provides an alternative calculation method that accounts for
 * both X and Y displacement. Useful for comparison or validation.
 * 
 * @param trajectoryPoints - Array of trajectory points with pixel coordinates and timestamps
 * @param calibration - Calibration profile with pitch length and reference distance
 * @returns Average speed in km/h
 * @throws Error if validation fails
 */
export function calculateAverageSpeed(
  trajectoryPoints: TrajectoryPoint[],
  calibration: CalibrationProfile
): number {
  // Validate trajectory points
  if (!trajectoryPoints || trajectoryPoints.length < 2) {
    throw new Error('Insufficient trajectory points - at least 2 points needed for speed calculation');
  }

  // Validate calibration
  if (!calibration) {
    throw new Error('Calibration data is required and cannot be null');
  }

  const { pitchLengthPixels, referenceDistanceMeters } = calibration;

  if (pitchLengthPixels <= 0) {
    throw new Error('Calibration invalid: pitchLengthPixels must be positive');
  }

  if (referenceDistanceMeters <= 0) {
    throw new Error('Calibration invalid: referenceDistanceMeters must be positive');
  }

  // Calculate pixels per meter ratio
  const pixelsPerMeter = pitchLengthPixels / referenceDistanceMeters;

  // Get first and last points
  const firstPoint = trajectoryPoints[0];
  const lastPoint = trajectoryPoints[trajectoryPoints.length - 1];

  // Calculate straight-line Euclidean distance
  const dx = lastPoint.pixelX - firstPoint.pixelX;
  const dy = lastPoint.pixelY - firstPoint.pixelY;
  const distancePixels = Math.sqrt(dx * dx + dy * dy);

  // Convert distance from pixels to meters
  const distanceMeters = distancePixels / pixelsPerMeter;

  // Calculate time duration
  const timeDurationMs = lastPoint.timestampMs - firstPoint.timestampMs;

  if (timeDurationMs <= 0) {
    throw new Error('Time duration must be positive - all points have the same timestamp');
  }

  // Convert time from milliseconds to seconds
  const timeDurationSeconds = timeDurationMs / 1000.0;

  // Calculate speed in meters per second
  const speedMps = distanceMeters / timeDurationSeconds;

  // Convert to km/h (multiply by 3.6)
  const speedKmh = speedMps * 3.6;

  return speedKmh;
}
