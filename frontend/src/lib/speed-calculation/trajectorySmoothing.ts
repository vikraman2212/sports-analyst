/**
 * Trajectory smoothing utilities
 * 
 * Based on research.md decision:
 * - Apply moving average smoothing to reduce jitter
 * - Simple parabolic fit only if ≥5 reliable detections
 * - Outlier rejection using median absolute deviation (MAD)
 * - Reduces early complexity while enabling basic trajectory visualization
 */

import { TrajectoryPoint } from '../types';

/**
 * Configuration for trajectory smoothing
 */
export interface SmoothingConfig {
  /**
   * Window size for moving average (must be odd)
   * @default 3
   */
  windowSize: number;
  
  /**
   * MAD threshold multiplier for outlier detection
   * Points beyond threshold * MAD from median are considered outliers
   * @default 3.0
   */
  outlierThreshold: number;
  
  /**
   * Minimum number of points required for parabolic fitting
   * @default 5
   */
  minPointsForParabolic: number;
  
  /**
   * Enable parabolic fitting (Y-axis only for arc trajectory)
   * @default true
   */
  enableParabolicFit: boolean;
  
  /**
   * Ball mass in grams (affects drag-based smoothing)
   * @default 156 (men's cricket ball)
   */
  ballMassGrams?: number;
}

/**
 * Default smoothing configuration
 */
export const DEFAULT_SMOOTHING_CONFIG: SmoothingConfig = {
  windowSize: 3,
  outlierThreshold: 3.0,
  minPointsForParabolic: 5,
  enableParabolicFit: true,
  ballMassGrams: 156,
};

/**
 * Enhanced trajectory point with smoothed coordinates
 */
export interface SmoothedTrajectoryPoint extends TrajectoryPoint {
  smoothedX: number | null;
  smoothedY: number | null;
  isOutlier?: boolean;
}

/**
 * Result of parabolic fit for Y-axis (arc trajectory)
 */
interface ParabolicFit {
  a: number; // coefficient for x²
  b: number; // coefficient for x
  c: number; // constant term
}

/**
 * Apply moving average smoothing to trajectory points
 * 
 * @param points - Raw trajectory points to smooth
 * @param config - Smoothing configuration
 * @returns Trajectory points with smoothed coordinates
 */
export function smoothTrajectory(
  points: TrajectoryPoint[],
  config: SmoothingConfig = DEFAULT_SMOOTHING_CONFIG
): SmoothedTrajectoryPoint[] {
  if (points.length === 0) {
    return [];
  }

  // Validate window size is odd
  const windowSize = config.windowSize % 2 === 0 ? config.windowSize + 1 : config.windowSize;
  const halfWindow = Math.floor(windowSize / 2);

  // Step 1: Detect and mark outliers
  const pointsWithOutliers = detectOutliers(points, config.outlierThreshold);

  // Step 2: Apply moving average smoothing
  const smoothedPoints: SmoothedTrajectoryPoint[] = pointsWithOutliers.map((point, index) => {
    // Skip outliers
    if (point.isOutlier) {
      return {
        ...point,
        smoothedX: null,
        smoothedY: null,
      };
    }

    // Determine window boundaries
    const start = Math.max(0, index - halfWindow);
    const end = Math.min(points.length, index + halfWindow + 1);
    const windowPoints = pointsWithOutliers.slice(start, end).filter(p => !p.isOutlier);

    if (windowPoints.length === 0) {
      return {
        ...point,
        smoothedX: null,
        smoothedY: null,
      };
    }

    // Calculate moving average
    const smoothedX = windowPoints.reduce((sum, p) => sum + p.pixelX, 0) / windowPoints.length;
    const smoothedY = windowPoints.reduce((sum, p) => sum + p.pixelY, 0) / windowPoints.length;

    return {
      ...point,
      smoothedX,
      smoothedY,
    };
  });

  // Step 3: Apply parabolic fit if enabled and enough points
  if (config.enableParabolicFit && smoothedPoints.filter(p => !p.isOutlier).length >= config.minPointsForParabolic) {
    return applyParabolicFit(smoothedPoints);
  }

  return smoothedPoints;
}

/**
 * Detect outliers using Median Absolute Deviation (MAD)
 * 
 * @param points - Trajectory points to analyze
 * @param threshold - MAD threshold multiplier
 * @returns Points with outlier flags
 */
function detectOutliers(
  points: TrajectoryPoint[],
  threshold: number
): SmoothedTrajectoryPoint[] {
  if (points.length < 3) {
    // Not enough points for outlier detection
    return points.map(p => ({ ...p, smoothedX: null, smoothedY: null, isOutlier: false }));
  }

  // Calculate median for X and Y
  const xValues = points.map(p => p.pixelX).sort((a, b) => a - b);
  const yValues = points.map(p => p.pixelY).sort((a, b) => a - b);
  
  const medianX = median(xValues);
  const medianY = median(yValues);

  // Calculate MAD for X and Y
  const madX = median(xValues.map(x => Math.abs(x - medianX)));
  const madY = median(yValues.map(y => Math.abs(y - medianY)));

  // Mark outliers (points beyond threshold * MAD from median)
  return points.map(point => {
    const deviationX = Math.abs(point.pixelX - medianX);
    const deviationY = Math.abs(point.pixelY - medianY);
    
    const isOutlierX = madX > 0 && deviationX > threshold * madX;
    const isOutlierY = madY > 0 && deviationY > threshold * madY;
    
    return {
      ...point,
      smoothedX: null,
      smoothedY: null,
      isOutlier: isOutlierX || isOutlierY,
    };
  });
}

/**
 * Apply parabolic fit to Y-axis for arc trajectory modeling
 * Y = a*X² + b*X + c
 * 
 * @param points - Smoothed trajectory points
 * @returns Points with parabolic-fitted Y coordinates
 */
function applyParabolicFit(points: SmoothedTrajectoryPoint[]): SmoothedTrajectoryPoint[] {
  const validPoints = points.filter(p => !p.isOutlier && p.smoothedX !== null && p.smoothedY !== null);
  
  if (validPoints.length < 5) {
    return points; // Not enough points for parabolic fit
  }

  // Fit parabola using least squares
  const fit = fitParabola(validPoints);
  
  if (!fit) {
    return points; // Fit failed
  }

  // Apply parabolic fit to Y coordinates
  return points.map(point => {
    if (point.isOutlier || point.smoothedX === null) {
      return point;
    }

    // Use parabolic model for Y coordinate
    const fittedY = fit.a * point.smoothedX * point.smoothedX + fit.b * point.smoothedX + fit.c;
    
    return {
      ...point,
      smoothedY: fittedY,
    };
  });
}

/**
 * Fit a parabola Y = a*X² + b*X + c using least squares method
 * 
 * @param points - Valid trajectory points with smoothed coordinates
 * @returns Parabolic coefficients or null if fit fails
 */
function fitParabola(points: SmoothedTrajectoryPoint[]): ParabolicFit | null {
  const n = points.length;
  
  if (n < 3) {
    return null;
  }

  // Extract coordinates
  const xCoords = points.map(p => p.smoothedX!);
  const yCoords = points.map(p => p.smoothedY!);

  // Calculate sums for normal equations
  const sumX = xCoords.reduce((sum, x) => sum + x, 0);
  const sumY = yCoords.reduce((sum, y) => sum + y, 0);
  const sumX2 = xCoords.reduce((sum, x) => sum + x * x, 0);
  const sumX3 = xCoords.reduce((sum, x) => sum + x * x * x, 0);
  const sumX4 = xCoords.reduce((sum, x) => sum + x * x * x * x, 0);
  const sumXY = xCoords.reduce((sum, x, i) => sum + x * yCoords[i], 0);
  const sumX2Y = xCoords.reduce((sum, x, i) => sum + x * x * yCoords[i], 0);

  // Build normal equations matrix: A * [a, b, c]ᵀ = B
  // [sumX4  sumX3  sumX2] [a]   [sumX2Y]
  // [sumX3  sumX2  sumX ] [b] = [sumXY ]
  // [sumX2  sumX   n    ] [c]   [sumY  ]
  
  const A = [
    [sumX4, sumX3, sumX2],
    [sumX3, sumX2, sumX],
    [sumX2, sumX, n],
  ];
  
  const B = [sumX2Y, sumXY, sumY];

  // Solve using Gaussian elimination
  try {
    const solution = solveLinearSystem(A, B);
    return {
      a: solution[0],
      b: solution[1],
      c: solution[2],
    };
  } catch {
    return null;
  }
}

/**
 * Solve a 3x3 linear system using Gaussian elimination with partial pivoting
 * 
 * @param A - Coefficient matrix (3x3)
 * @param B - Right-hand side vector
 * @returns Solution vector [a, b, c]
 */
function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = 3;
  const augmented = A.map((row, i) => [...row, B[i]]);

  // Forward elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('Singular matrix');
    }

    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  const solution = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      solution[i] -= augmented[i][j] * solution[j];
    }
    solution[i] /= augmented[i][i];
  }

  return solution;
}

/**
 * Calculate median of an array of numbers
 * 
 * @param values - Array of numbers (will be sorted in place)
 * @returns Median value
 */
function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Validate smoothed trajectory points
 * 
 * @param points - Smoothed trajectory points to validate
 * @returns Validation result with details
 */
export function validateSmoothedTrajectory(points: SmoothedTrajectoryPoint[]): {
  isValid: boolean;
  validPointCount: number;
  outlierCount: number;
  smoothedPointCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  const outlierCount = points.filter(p => p.isOutlier).length;
  const smoothedPointCount = points.filter(p => p.smoothedX !== null && p.smoothedY !== null).length;
  const validPointCount = points.filter(p => !p.isOutlier).length;

  if (points.length === 0) {
    errors.push('No trajectory points provided');
  }

  if (smoothedPointCount === 0 && points.length > 0) {
    errors.push('No points could be smoothed (all marked as outliers or invalid)');
  }

  if (outlierCount > points.length * 0.5) {
    errors.push(`High outlier rate: ${outlierCount}/${points.length} (>${50}%)`);
  }

  return {
    isValid: errors.length === 0,
    validPointCount,
    outlierCount,
    smoothedPointCount,
    errors,
  };
}

/**
 * Get recommended smoothing configuration based on trajectory characteristics
 * 
 * @param pointCount - Number of trajectory points
 * @param expectedNoiseLe vel - Expected noise level (low, medium, high)
 * @returns Recommended smoothing configuration
 */
export function getRecommendedSmoothingConfig(
  pointCount: number,
  expectedNoiseLevel: 'low' | 'medium' | 'high' = 'medium'
): SmoothingConfig {
  const config = { ...DEFAULT_SMOOTHING_CONFIG };

  // Adjust window size based on point count
  if (pointCount < 10) {
    config.windowSize = 3; // Small window for sparse data
  } else if (pointCount < 30) {
    config.windowSize = 5;
  } else {
    config.windowSize = 7;
  }

  // Adjust outlier threshold based on expected noise
  switch (expectedNoiseLevel) {
    case 'low':
      config.outlierThreshold = 2.5;
      break;
    case 'medium':
      config.outlierThreshold = 3.0;
      break;
    case 'high':
      config.outlierThreshold = 3.5;
      break;
  }

  // Adjust for ball mass - heavier balls have less jitter from air resistance
  // Lighter balls (<120g) need more aggressive outlier rejection
  // Heavier balls (>180g) can use tighter thresholds
  const mass = config.ballMassGrams ?? 156;
  if (mass < 120) {
    config.outlierThreshold *= 1.2; // More lenient for light balls
  } else if (mass > 180) {
    config.outlierThreshold *= 0.9; // Tighter for heavy balls
  }

  // Disable parabolic fit for very sparse data
  if (pointCount < config.minPointsForParabolic) {
    config.enableParabolicFit = false;
  }

  return config;
}
