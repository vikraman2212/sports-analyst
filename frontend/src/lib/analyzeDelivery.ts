/**
 * Analyze Delivery - Main Orchestration Function
 * 
 * Orchestrates the complete delivery analysis pipeline:
 * 1. Validate inputs (frames, calibration)
 * 2. Detect ball in each frame
 * 3. Build trajectory from detections
 * 4. Calculate speed from trajectory
 * 5. Generate confidence score and warnings
 * 
 * This is the primary entry point for local inference.
 */

import type { FrameSample, CalibrationProfile, DeliveryResult, TrajectoryPoint } from './types';
import { detectBallInFrames, detectionToTrajectoryPoint } from './detection';
import { isValidCalibration } from './calibration';
import { calculateSpeed } from './speed-calculation';
import { generateWarnings as generateQualityWarnings } from './speed-calculation/warnings';

/**
 * Minimum number of detections required for reliable speed calculation
 * For cricket ball tracking, we need at least 2 points to calculate speed
 */
const MIN_DETECTIONS_REQUIRED = 2;

/**
 * Analyze a cricket ball delivery from video frames
 * 
 * @param frames - Array of frame samples from video capture
 * @param calibration - Calibration profile for pixel-to-meter conversion
 * @returns Promise resolving to DeliveryResult with speed and trajectory
 * @throws Error if inputs are invalid or insufficient detections found
 */
export async function analyzeDelivery(
  frames: FrameSample[],
  calibration: CalibrationProfile
): Promise<DeliveryResult> {
  const startTime = performance.now();

  // Validate inputs
  validateInputs(frames, calibration);

  try {
    // Step 1: Detect ball in all frames
    const detections = await detectBallInFrames(frames);

    // Step 2: Build trajectory from detections
    const trajectoryPoints: TrajectoryPoint[] = [];
    
    detections.forEach((detection, index) => {
      if (detection !== null) {
        const frame = frames[index];
        const trajectoryPoint = detectionToTrajectoryPoint(detection, frame.timestampMs);
        trajectoryPoints.push(trajectoryPoint);
      }
    });

    // Step 3: Validate we have enough detections
    if (trajectoryPoints.length < MIN_DETECTIONS_REQUIRED) {
      throw new Error(
        `Insufficient detections found. Need at least ${MIN_DETECTIONS_REQUIRED} detections, got ${trajectoryPoints.length}. Ensure the ball is visible in multiple frames; try better lighting, steady camera, and recalibrate if needed.`
      );
    }

    // Step 4: Calculate speed from trajectory
    const speedKmh = calculateSpeed(trajectoryPoints, calibration);

    // Step 5: Calculate confidence score
    const confidence = calculateConfidence(trajectoryPoints, detections);

    // Step 6: Generate warnings if needed
    const pipelineWarnings = generatePipelineWarnings(trajectoryPoints, detections, speedKmh);
    // Also include mass-aware quality warnings from the warnings module
    const qualityWarnings = generateQualityWarnings(
      {
        speedKmh,
        trajectoryPoints,
        confidence,
        detectionCount: trajectoryPoints.length,
        processingMs: 0,
      },
      { ballMassGrams: calibration.ballMassGrams }
    );
    const warnings = Array.from(new Set([...(pipelineWarnings || []), ...(qualityWarnings || [])]));

    // Calculate processing time
    const endTime = performance.now();
    const processingMs = Math.round(endTime - startTime);

    return {
      speedKmh,
      trajectoryPoints,
      confidence,
      detectionCount: trajectoryPoints.length,
      processingMs,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    const endTime = performance.now();
    const processingMs = Math.round(endTime - startTime);

    // Re-throw with processing time context
    if (error instanceof Error) {
      error.message = `Analysis failed after ${processingMs}ms: ${error.message}`;
    }
    throw error;
  }
}

/**
 * Validate input parameters
 */
function validateInputs(
  frames: FrameSample[],
  calibration: CalibrationProfile
): void {
  // Validate frames
  if (!frames || frames.length === 0) {
    throw new Error('Frames are required - cannot analyze empty frame array. Try capturing a short clip (1–2 seconds), ensure camera permissions are granted, and check that the subject is in view.');
  }

  // Validate calibration
  if (!calibration) {
    throw new Error('Calibration profile is required for analysis. Ensure pitch length is selected and calibration is completed; try recalibrating if issues persist.');
  }

  if (!isValidCalibration(calibration)) {
    throw new Error('Invalid calibration profile provided. Please check calibration inputs or redo calibration.');
  }
}

/**
 * Calculate confidence score based on detection quality
 * 
 * Confidence is based on:
 * - Detection rate (% of frames with detections)
 * - Average detection confidence
 * 
 * @returns Confidence score between 0 and 1
 */
function calculateConfidence(
  trajectoryPoints: TrajectoryPoint[],
  detections: (import('./types').Detection | null)[]
): number {
  const totalFrames = detections.length;
  const detectedFrames = trajectoryPoints.length;

  // Detection rate: what percentage of frames had detections
  const detectionRate = detectedFrames / totalFrames;

  // Average confidence from detections
  const validDetections = detections.filter((d) => d !== null);
  const avgDetectionConfidence = validDetections.length > 0
    ? validDetections.reduce((sum, d) => sum + (d?.confidence ?? 0), 0) / validDetections.length
    : 0;

  // Overall confidence is weighted average
  // 60% weight on detection rate, 40% weight on detection confidence
  const confidence = detectionRate * 0.6 + avgDetectionConfidence * 0.4;

  // Round to 2 decimal places
  return Math.round(confidence * 100) / 100;
}

/**
 * Generate warnings based on analysis quality
 */
function generatePipelineWarnings(
  trajectoryPoints: TrajectoryPoint[],
  detections: (import('./types').Detection | null)[],
  speedKmh: number
): string[] {
  const warnings: string[] = [];

  const detectionRate = trajectoryPoints.length / detections.length;

  // Low detection rate warning
  if (detectionRate < 0.3) {
    warnings.push(
      `Low detection rate (${Math.round(detectionRate * 100)}%). Speed calculation may be unreliable.`
    );
  }

  // Very few detections warning
  if (trajectoryPoints.length < 5) {
    warnings.push(
      `Only ${trajectoryPoints.length} detections found. More detections needed for accurate speed.`
    );
  }

  // Unrealistic speed warning
  if (speedKmh < 20 || speedKmh > 180) {
    warnings.push(
      `Calculated speed (${speedKmh.toFixed(1)} km/h) is outside typical cricket ball range (20-180 km/h). Check calibration.`
    );
  }

  // Low confidence detections
  const validDetections = detections.filter((d) => d !== null);
  const avgConfidence = validDetections.length > 0
    ? validDetections.reduce((sum, d) => sum + (d?.confidence ?? 0), 0) / validDetections.length
    : 0;

  if (avgConfidence < 0.6) {
    warnings.push(
      `Low average detection confidence (${Math.round(avgConfidence * 100)}%). Results may be inaccurate.`
    );
  }

  return warnings;
}
