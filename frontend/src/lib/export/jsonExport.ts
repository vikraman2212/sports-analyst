/**
 * JSON Export Utility
 * 
 * Exports delivery analysis results to JSON format for:
 * - Sharing results with coaches/players
 * - Data analysis and record keeping
 * - Debugging and validation
 * - Future session history features
 */

import type { DeliveryResult, TrajectoryPoint, CalibrationProfile } from '../types';

/**
 * Exportable delivery data structure
 */
export interface ExportableDelivery {
  /**
   * Metadata about the export
   */
  metadata: {
    exportedAt: string; // ISO 8601 timestamp
    version: string; // Export format version
    appName: string;
  };

  /**
   * Delivery analysis results
   */
  delivery: {
    speedKmh: number;
    confidence: number;
    detectionCount: number;
    processingMs: number;
    warnings?: string[];
  };

  /**
   * Trajectory data
   */
  trajectory: {
    totalPoints: number;
    durationMs: number;
    points: Array<{
      timestampMs: number;
      pixelX: number;
      pixelY: number;
      estimatedZ: number | null;
    }>;
  };

  /**
   * Calibration settings used
   */
  calibration?: {
    pitchLengthPixels: number;
    referenceDistanceMeters: number;
    hasHomography: boolean;
  };

  /**
   * Computed statistics
   */
  statistics?: {
    avgConfidence: number;
    trajectoryDuration: number;
    estimatedDistancePixels: number;
  };
}

/**
 * Export format version (semver)
 */
const EXPORT_VERSION = '1.0.0';

/**
 * Application name
 */
const APP_NAME = 'Cricket Ball Speed Tracker';

/**
 * Calculate trajectory duration from points
 */
function getTrajectoryDuration(points: TrajectoryPoint[]): number {
  if (points.length < 2) return 0;
  return points[points.length - 1].timestampMs - points[0].timestampMs;
}

/**
 * Calculate estimated distance traveled in pixels
 */
function getEstimatedDistance(points: TrajectoryPoint[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].pixelX - points[i - 1].pixelX;
    const dy = points[i].pixelY - points[i - 1].pixelY;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }

  return totalDistance;
}

/**
 * Export delivery result to JSON-serializable object
 * 
 * @param result - Delivery analysis result
 * @param calibration - Optional calibration profile used
 * @returns Exportable delivery object
 */
export function exportDeliveryToJSON(
  result: DeliveryResult,
  calibration?: CalibrationProfile
): ExportableDelivery {
  const trajectoryDuration = getTrajectoryDuration(result.trajectoryPoints);
  const estimatedDistance = getEstimatedDistance(result.trajectoryPoints);

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: EXPORT_VERSION,
      appName: APP_NAME,
    },
    delivery: {
      speedKmh: result.speedKmh,
      confidence: result.confidence,
      detectionCount: result.detectionCount,
      processingMs: result.processingMs,
      warnings: result.warnings,
    },
    trajectory: {
      totalPoints: result.trajectoryPoints.length,
      durationMs: trajectoryDuration,
      points: result.trajectoryPoints.map((point) => ({
        timestampMs: point.timestampMs,
        pixelX: point.pixelX,
        pixelY: point.pixelY,
        estimatedZ: point.estimatedZ,
      })),
    },
    calibration: calibration
      ? {
          pitchLengthPixels: calibration.pitchLengthPixels,
          referenceDistanceMeters: calibration.referenceDistanceMeters,
          hasHomography: calibration.homographyMatrix !== null,
        }
      : undefined,
    statistics: {
      avgConfidence: result.confidence,
      trajectoryDuration,
      estimatedDistancePixels: estimatedDistance,
    },
  };
}

/**
 * Convert delivery result to JSON string
 * 
 * @param result - Delivery analysis result
 * @param calibration - Optional calibration profile
 * @param pretty - Whether to pretty-print JSON (default: true)
 * @returns JSON string
 */
export function deliveryToJSONString(
  result: DeliveryResult,
  calibration?: CalibrationProfile,
  pretty: boolean = true
): string {
  const exportData = exportDeliveryToJSON(result, calibration);
  return JSON.stringify(exportData, null, pretty ? 2 : undefined);
}

/**
 * Download delivery result as JSON file
 * 
 * @param result - Delivery analysis result
 * @param calibration - Optional calibration profile
 * @param filename - Optional custom filename (default: auto-generated)
 */
export function downloadDeliveryJSON(
  result: DeliveryResult,
  calibration?: CalibrationProfile,
  filename?: string
): void {
  const jsonString = deliveryToJSONString(result, calibration);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Generate filename if not provided
  const actualFilename =
    filename || `cricket-delivery-${new Date().toISOString().split('T')[0]}.json`;

  // Create temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = actualFilename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy delivery JSON to clipboard
 * 
 * @param result - Delivery analysis result
 * @param calibration - Optional calibration profile
 * @returns Promise that resolves when copied
 */
export async function copyDeliveryJSON(
  result: DeliveryResult,
  calibration?: CalibrationProfile
): Promise<void> {
  const jsonString = deliveryToJSONString(result, calibration);
  await navigator.clipboard.writeText(jsonString);
}

/**
 * Share delivery JSON using Web Share API (if available)
 * 
 * @param result - Delivery analysis result
 * @param calibration - Optional calibration profile
 * @returns Promise that resolves when shared
 */
export async function shareDeliveryJSON(
  result: DeliveryResult,
  calibration?: CalibrationProfile
): Promise<void> {
  if (!navigator.share) {
    throw new Error('Web Share API not supported in this browser');
  }

  const jsonString = deliveryToJSONString(result, calibration);
  const filename = `cricket-delivery-${result.speedKmh.toFixed(1)}kmh.json`;

  // Create a file object
  const file = new File([jsonString], filename, { type: 'application/json' });

  await navigator.share({
    title: `Cricket Ball Speed: ${result.speedKmh.toFixed(1)} km/h`,
    text: `Ball speed analysis with ${result.detectionCount} detections`,
    files: [file],
  });
}

/**
 * Import delivery data from JSON string
 * 
 * @param jsonString - JSON string to parse
 * @returns Parsed exportable delivery
 * @throws Error if JSON is invalid or doesn't match expected format
 */
export function importDeliveryFromJSON(jsonString: string): ExportableDelivery {
  try {
    const data = JSON.parse(jsonString) as ExportableDelivery;

    // Basic validation
    if (!data.metadata || !data.delivery || !data.trajectory) {
      throw new Error('Invalid delivery JSON format: missing required fields');
    }

    if (typeof data.delivery.speedKmh !== 'number') {
      throw new Error('Invalid delivery JSON format: speedKmh must be a number');
    }

    if (!Array.isArray(data.trajectory.points)) {
      throw new Error('Invalid delivery JSON format: trajectory.points must be an array');
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

/**
 * Check if browser supports Web Share API
 */
export function isShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Check if browser supports Clipboard API
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'clipboard' in navigator &&
    'writeText' in navigator.clipboard
  );
}
