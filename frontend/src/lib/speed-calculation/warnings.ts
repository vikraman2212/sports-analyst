/**
 * Warning Generation
 * 
 * Analyzes delivery results and generates user-friendly warnings
 * for low quality deliveries that may have unreliable speed measurements.
 */

import type { DeliveryResult } from '../types';
import type { CameraDiagnostics } from '../../hooks/useCameraDiagnostics';

/**
 * Warning thresholds and configuration
 */
export interface WarningConfig {
  /**
   * Minimum number of detections required
   * @default 5
   */
  minDetections?: number;

  /**
   * Minimum average confidence required
   * @default 0.6
   */
  minAverageConfidence?: number;

  /**
   * Minimum trajectory length in pixels
   * @default 100
   */
  minTrajectoryLength?: number;

  /**
   * Maximum time gap between detections (ms)
   * @default 200
   */
  maxTimeGap?: number;
  
  /**
   * Ball mass in grams (affects speed plausibility checks)
   * @default 156
   */
  ballMassGrams?: number;

  /**
   * Optional camera diagnostics to check
   */
  cameraDiagnostics?: CameraDiagnostics;
}

/**
 * Default warning configuration
 */
const DEFAULT_WARNING_CONFIG: Omit<Required<WarningConfig>, 'cameraDiagnostics'> = {
  minDetections: 5,
  minAverageConfidence: 0.6,
  minTrajectoryLength: 100,
  maxTimeGap: 200,
  ballMassGrams: 156,
};

/**
 * Generate warnings for a delivery result
 * 
 * @param result Delivery result to analyze
 * @param config Warning configuration
 * @returns Array of warning messages
 */
export function generateWarnings(
  result: DeliveryResult,
  config: WarningConfig = {}
): string[] {
  const cfg = { ...DEFAULT_WARNING_CONFIG, ...config };
  const warnings: string[] = [];

  // Check camera diagnostics if provided
  if (config.cameraDiagnostics && !config.cameraDiagnostics.meetsRequirements) {
    config.cameraDiagnostics.requirementIssues.forEach((issue) => {
      warnings.push(`Camera: ${issue}`);
    });
  }

  // Check detection count
  if (result.detectionCount < cfg.minDetections) {
    warnings.push(
      `Low detection count (${result.detectionCount}/${cfg.minDetections}). Speed may be inaccurate.`
    );
  }

  // Check average confidence
  if (result.confidence < cfg.minAverageConfidence) {
    const confPercent = Math.round(result.confidence * 100);
    warnings.push(
      `Low detection confidence (${confPercent}%). Consider recalibrating or improving lighting.`
    );
  }

  // Check trajectory length
  const trajectoryLength = calculateTrajectoryLength(result.trajectoryPoints);
  if (trajectoryLength < cfg.minTrajectoryLength) {
    warnings.push(
      `Short trajectory (${Math.round(trajectoryLength)}px). Ball may not have been tracked fully.`
    );
  }

  // Check for large time gaps
  const maxGap = findMaxTimeGap(result.trajectoryPoints);
  if (maxGap > cfg.maxTimeGap) {
    warnings.push(
      `Large time gap in tracking (${Math.round(maxGap)}ms). Ball may have been obscured.`
    );
  }

  // Check for zero speed
  if (result.speedKmh === 0) {
    warnings.push('Zero speed detected. Ball may not have moved or calibration is incorrect.');
  }

  // Check for extremely high speed (likely error)
  // Adjust threshold based on ball mass - lighter balls can't reach as high speeds
  const mass = cfg.ballMassGrams;
  const maxPlausibleSpeed = mass < 120 ? 150 : mass > 180 ? 220 : 200;
  
  if (result.speedKmh > maxPlausibleSpeed) {
    warnings.push(
      `Unusually high speed (${result.speedKmh} km/h) for ${mass}g ball. This may indicate a calibration or detection error.`
    );
  }

  // Check for unrealistic ball weight (extreme values)
  if (mass < 50) {
    warnings.push(`Unrealistic ball weight (${mass}g < 50g). Please use a valid cricket ball weight.`);
  } else if (mass > 300) {
    warnings.push(`Unrealistic ball weight (${mass}g > 300g). Please use a valid cricket ball weight.`);
  }

  // Check for very low speed (possible false detection)
  if (result.speedKmh < 10 && result.speedKmh > 0) {
    warnings.push(
      `Very low speed (${result.speedKmh} km/h). This may not be a valid delivery.`
    );
  }

  return warnings;
}

/**
 * Calculate total trajectory length in pixels
 */
function calculateTrajectoryLength(
  trajectoryPoints: DeliveryResult['trajectoryPoints']
): number {
  if (trajectoryPoints.length < 2) {
    return 0;
  }

  let totalLength = 0;

  for (let i = 1; i < trajectoryPoints.length; i++) {
    const prev = trajectoryPoints[i - 1];
    const curr = trajectoryPoints[i];

    const dx = curr.pixelX - prev.pixelX;
    const dy = curr.pixelY - prev.pixelY;

    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  return totalLength;
}

/**
 * Find maximum time gap between consecutive trajectory points
 */
function findMaxTimeGap(trajectoryPoints: DeliveryResult['trajectoryPoints']): number {
  if (trajectoryPoints.length < 2) {
    return 0;
  }

  let maxGap = 0;

  for (let i = 1; i < trajectoryPoints.length; i++) {
    const gap = trajectoryPoints[i].timestampMs - trajectoryPoints[i - 1].timestampMs;
    maxGap = Math.max(maxGap, gap);
  }

  return maxGap;
}

/**
 * Get severity level for warnings
 * 
 * @param warnings Array of warnings
 * @returns Severity level: 'none' | 'low' | 'medium' | 'high'
 */
export function getWarningSeverity(
  warnings: string[]
): 'none' | 'low' | 'medium' | 'high' {
  if (warnings.length === 0) {
    return 'none';
  }

  if (warnings.length === 1) {
    return 'low';
  }

  if (warnings.length === 2) {
    return 'medium';
  }

  return 'high';
}

/**
 * Check if delivery result is reliable
 * 
 * @param result Delivery result to check
 * @param config Warning configuration
 * @returns True if result is reliable
 */
export function isReliableDelivery(
  result: DeliveryResult,
  config: WarningConfig = {}
): boolean {
  const warnings = generateWarnings(result, config);
  return warnings.length === 0;
}

/**
 * Generate a summary message for warnings
 * 
 * @param warnings Array of warnings
 * @returns Summary message
 */
export function getWarningSummary(warnings: string[]): string {
  if (warnings.length === 0) {
    return 'No issues detected. Result is reliable.';
  }

  if (warnings.length === 1) {
    return 'One issue detected. Result may be less reliable.';
  }

  return `${warnings.length} issues detected. Result may be unreliable.`;
}
