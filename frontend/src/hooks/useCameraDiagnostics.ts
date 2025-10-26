/**
 * useCameraDiagnostics Hook
 * 
 * Detects and monitors camera settings to provide guidance for optimal ball tracking.
 * Infers FPS from frame arrival timestamps and detects exposure issues via brightness variance.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Camera diagnostic information
 */
export interface CameraDiagnostics {
  /**
   * Reported resolution from camera
   */
  resolution: {
    width: number;
    height: number;
  } | null;

  /**
   * Reported frame rate from camera settings
   */
  reportedFPS: number | null;

  /**
   * Inferred effective FPS from frame timestamps
   */
  inferredFPS: number | null;

  /**
   * Exposure status based on brightness variance
   */
  exposureStatus: 'good' | 'too-high' | 'too-low' | 'unknown';

  /**
   * Average brightness (0-255)
   */
  averageBrightness: number | null;

  /**
   * Brightness variance (indicates motion blur risk)
   */
  brightnessVariance: number | null;

  /**
   * Whether camera settings meet minimum requirements
   */
  meetsRequirements: boolean;

  /**
   * Specific requirement failures
   */
  requirementIssues: string[];
}

/**
 * Configuration for camera requirements
 */
export interface DiagnosticsConfig {
  /**
   * Minimum acceptable FPS
   * @default 30
   */
  minFPS?: number;

  /**
   * Maximum acceptable exposure variance (higher = more blur)
   * @default 40
   */
  maxBrightnessVariance?: number;

  /**
   * Minimum acceptable average brightness
   * @default 30
   */
  minBrightness?: number;

  /**
   * Maximum acceptable average brightness
   * @default 240
   */
  maxBrightness?: number;
}

const DEFAULT_CONFIG: Required<DiagnosticsConfig> = {
  minFPS: 30,
  maxBrightnessVariance: 40,
  minBrightness: 30,
  maxBrightness: 240,
};

/**
 * useCameraDiagnostics Hook
 * 
 * Monitors camera settings and provides diagnostic information.
 * 
 * @param stream - Active MediaStream from camera
 * @param config - Diagnostic configuration
 * @returns Current diagnostics and update function
 */
export function useCameraDiagnostics(
  stream: MediaStream | null,
  config: DiagnosticsConfig = {}
): {
  diagnostics: CameraDiagnostics;
  updateWithFrame: (imageData: ImageData, timestamp: number) => void;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const [diagnostics, setDiagnostics] = useState<CameraDiagnostics>({
    resolution: null,
    reportedFPS: null,
    inferredFPS: null,
    exposureStatus: 'unknown',
    averageBrightness: null,
    brightnessVariance: null,
    meetsRequirements: false,
    requirementIssues: [],
  });

  // Refs for FPS calculation
  const frameTimestamps = useRef<number[]>([]);
  const brightnessHistory = useRef<number[]>([]);
  const lastUpdateTime = useRef<number>(0);

  /**
   * Extract camera settings from MediaStream
   */
  useEffect(() => {
    if (!stream) {
      setDiagnostics({
        resolution: null,
        reportedFPS: null,
        inferredFPS: null,
        exposureStatus: 'unknown',
        averageBrightness: null,
        brightnessVariance: null,
        meetsRequirements: false,
        requirementIssues: ['No camera stream'],
      });
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      return;
    }

    const settings = videoTrack.getSettings();

    setDiagnostics((prev) => ({
      ...prev,
      resolution: settings.width && settings.height
        ? { width: settings.width, height: settings.height }
        : null,
      reportedFPS: settings.frameRate || null,
    }));
  }, [stream]);

  /**
   * Update diagnostics with a new frame
   */
  const updateWithFrame = useCallback(
    (imageData: ImageData, timestamp: number) => {
      // Update FPS calculation
      frameTimestamps.current.push(timestamp);
      
      // Keep only last 30 frames for FPS calculation (~1 second window at 30fps)
      if (frameTimestamps.current.length > 30) {
        frameTimestamps.current.shift();
      }

      // Calculate inferred FPS
      let inferredFPS: number | null = null;
      if (frameTimestamps.current.length >= 10) {
        const timeSpan =
          frameTimestamps.current[frameTimestamps.current.length - 1] -
          frameTimestamps.current[0];
        const frameCount = frameTimestamps.current.length - 1;
        inferredFPS = Math.round((frameCount / timeSpan) * 1000);
      }

      // Calculate brightness (every 5 frames to reduce overhead)
      const lastUpdate = lastUpdateTime.current;
      let averageBrightness: number | null = null;
      let brightnessVariance: number | null = null;
      let exposureStatus: 'good' | 'too-high' | 'too-low' | 'unknown' = 'unknown';

      // Use timestamp instead of performance.now() for testing compatibility
      if (timestamp - lastUpdate > 150) {
        // ~150ms between brightness checks
        lastUpdateTime.current = timestamp;
        averageBrightness = calculateBrightness(imageData);
        brightnessHistory.current.push(averageBrightness);

        // Keep last 10 brightness samples
        if (brightnessHistory.current.length > 10) {
          brightnessHistory.current.shift();
        }

        // Calculate variance
        if (brightnessHistory.current.length >= 5) {
          brightnessVariance = calculateVariance(brightnessHistory.current);

          // Determine exposure status
          const avgBright =
            brightnessHistory.current.reduce((a, b) => a + b, 0) /
            brightnessHistory.current.length;

          if (avgBright < cfg.minBrightness) {
            exposureStatus = 'too-low';
          } else if (avgBright > cfg.maxBrightness) {
            exposureStatus = 'too-high';
          } else if (brightnessVariance <= cfg.maxBrightnessVariance) {
            exposureStatus = 'good';
          } else {
            exposureStatus = 'too-high'; // High variance suggests motion blur
          }
        }
      }

      // Check requirements
      const requirementIssues: string[] = [];
      if (inferredFPS !== null && inferredFPS < cfg.minFPS) {
        requirementIssues.push(`Low frame rate (${inferredFPS} fps, need ${cfg.minFPS}+)`);
      }
      if (exposureStatus === 'too-low') {
        requirementIssues.push('Insufficient lighting - increase brightness');
      }
      if (exposureStatus === 'too-high' && brightnessVariance !== null) {
        if (brightnessVariance > cfg.maxBrightnessVariance) {
          requirementIssues.push('Motion blur detected - reduce exposure time');
        }
      }

      setDiagnostics((prev) => ({
        ...prev,
        inferredFPS,
        averageBrightness,
        brightnessVariance,
        exposureStatus,
        meetsRequirements: requirementIssues.length === 0,
        requirementIssues,
      }));
    },
    [cfg.minFPS, cfg.maxBrightnessVariance, cfg.minBrightness, cfg.maxBrightness]
  );

  return { diagnostics, updateWithFrame };
}

/**
 * Calculate average brightness of an image
 */
function calculateBrightness(imageData: ImageData): number {
  const { data } = imageData;
  let sum = 0;
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    // Convert RGB to luminance using ITU-R BT.709 coefficients
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  return sum / (data.length / 16);
}

/**
 * Calculate variance of a number array
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Get user-friendly recommendations based on diagnostics
 */
export function getCameraRecommendations(
  diagnostics: CameraDiagnostics
): string[] {
  const recommendations: string[] = [];

  if (!diagnostics.meetsRequirements) {
    diagnostics.requirementIssues.forEach((issue) => {
      if (issue.includes('Low frame rate')) {
        recommendations.push('Close other apps to improve frame rate');
        recommendations.push('Try using rear camera if available');
      } else if (issue.includes('Insufficient lighting')) {
        recommendations.push('Move to a brighter location or add lighting');
      } else if (issue.includes('Motion blur')) {
        recommendations.push('Reduce camera exposure time in settings');
        recommendations.push('Ensure fast shutter speed for moving objects');
      }
    });
  }

  // Additional context-aware recommendations
  if (diagnostics.resolution && diagnostics.resolution.width < 1280) {
    recommendations.push('Increase camera resolution to 1280x720 or higher for better accuracy');
  }

  if (diagnostics.inferredFPS !== null && diagnostics.reportedFPS !== null) {
    if (Math.abs(diagnostics.inferredFPS - diagnostics.reportedFPS) > 5) {
      recommendations.push('Camera may be dropping frames - close background apps');
    }
  }

  return recommendations;
}
