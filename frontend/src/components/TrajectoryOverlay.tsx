/**
 * TrajectoryOverlay Component
 * 
 * Renders ball trajectory path over video feed using HTML5 Canvas.
 * 
 * Features:
 * - Canvas overlay on video element
 * - Trajectory path visualization with smoothing
 * - Detection points marking
 * - Responsive to video dimensions
 * - Configurable colors and styles
 */

'use client';

import { useEffect, useRef } from 'react';
import type { TrajectoryPoint } from '../lib/types';

export interface TrajectoryOverlayProps {
  /**
   * Trajectory points to render
   */
  trajectoryPoints: TrajectoryPoint[];

  /**
   * Video element dimensions for scaling
   */
  videoDimensions: {
    width: number;
    height: number;
  } | null;

  /**
   * Whether to show individual detection points
   * @default true
   */
  showPoints?: boolean;

  /**
   * Whether to show connecting path line
   * @default true
   */
  showPath?: boolean;

  /**
   * Whether to show trajectory with motion blur effect
   * @default false
   */
  showMotionBlur?: boolean;

  /**
   * Path color
   * @default '#00FF00'
   */
  pathColor?: string;

  /**
   * Point color
   * @default '#FFFF00'
   */
  pointColor?: string;

  /**
   * Line width for trajectory path
   * @default 3
   */
  lineWidth?: number;

  /**
   * Point radius
   * @default 5
   */
  pointRadius?: number;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Draw trajectory path on canvas
 */
function drawTrajectoryPath(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  color: string,
  lineWidth: number,
  showMotionBlur: boolean
) {
  if (points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (showMotionBlur) {
    // Draw with gradient opacity for motion blur effect
    for (let i = 0; i < points.length - 1; i++) {
      const alpha = (i + 1) / points.length; // Fade from old to new
      ctx.globalAlpha = alpha * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(points[i].pixelX, points[i].pixelY);
      ctx.lineTo(points[i + 1].pixelX, points[i + 1].pixelY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  } else {
    // Draw solid path
    ctx.beginPath();
    ctx.moveTo(points[0].pixelX, points[0].pixelY);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].pixelX, points[i].pixelY);
    }
    
    ctx.stroke();
  }
}

/**
 * Draw individual detection points
 */
function drawDetectionPoints(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  color: string,
  radius: number
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;

  points.forEach((point, index) => {
    // Draw point
    ctx.beginPath();
    ctx.arc(point.pixelX, point.pixelY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw timestamp label for first and last points
    if (index === 0 || index === points.length - 1) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = index === 0 ? 'left' : 'right';
      ctx.textBaseline = 'bottom';
      
      const label = index === 0 ? 'Start' : 'End';
      const offsetX = index === 0 ? radius + 5 : -radius - 5;
      const offsetY = -radius - 5;
      
      // Draw text shadow for readability
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(label, point.pixelX + offsetX, point.pixelY + offsetY);
      
      ctx.fillText(label, point.pixelX + offsetX, point.pixelY + offsetY);
      
      // Reset fill style
      ctx.fillStyle = color;
    }
  });
}

/**
 * TrajectoryOverlay Component
 * 
 * Canvas overlay for visualizing ball trajectory on video feed.
 */
export function TrajectoryOverlay({
  trajectoryPoints,
  videoDimensions,
  showPoints = true,
  showPath = true,
  showMotionBlur = false,
  pathColor = '#00FF00',
  pointColor = '#FFFF00',
  lineWidth = 3,
  pointRadius = 5,
  className = '',
}: TrajectoryOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Render trajectory on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoDimensions) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = videoDimensions.width;
    canvas.height = videoDimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // No trajectory to draw
    if (trajectoryPoints.length === 0) return;

    // Draw trajectory path
    if (showPath && trajectoryPoints.length >= 2) {
      drawTrajectoryPath(ctx, trajectoryPoints, pathColor, lineWidth, showMotionBlur);
    }

    // Draw detection points
    if (showPoints && trajectoryPoints.length > 0) {
      drawDetectionPoints(ctx, trajectoryPoints, pointColor, pointRadius);
    }
  }, [
    trajectoryPoints,
    videoDimensions,
    showPoints,
    showPath,
    showMotionBlur,
    pathColor,
    pointColor,
    lineWidth,
    pointRadius,
  ]);

  // Don't render if no video dimensions
  if (!videoDimensions) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`trajectory-overlay ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      role="img"
      aria-label="Ball trajectory overlay"
    />
  );
}

/**
 * Helper: Calculate trajectory statistics for debugging/display
 */
export function getTrajectoryStats(points: TrajectoryPoint[]): {
  totalPoints: number;
  duration: number;
  pathLength: number;
  avgVelocity: number;
} {
  if (points.length === 0) {
    return {
      totalPoints: 0,
      duration: 0,
      pathLength: 0,
      avgVelocity: 0,
    };
  }

  // Calculate duration
  const duration = points.length > 1 
    ? points[points.length - 1].timestampMs - points[0].timestampMs 
    : 0;

  // Calculate path length (sum of Euclidean distances)
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].pixelX - points[i - 1].pixelX;
    const dy = points[i].pixelY - points[i - 1].pixelY;
    pathLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate average velocity (pixels per second)
  const avgVelocity = duration > 0 ? (pathLength / duration) * 1000 : 0;

  return {
    totalPoints: points.length,
    duration,
    pathLength,
    avgVelocity,
  };
}

/**
 * Helper: Smooth trajectory points using moving average
 * 
 * @param points - Original trajectory points
 * @param windowSize - Number of points to average (default: 3)
 * @returns Smoothed trajectory points
 */
export function smoothTrajectory(
  points: TrajectoryPoint[],
  windowSize: number = 3
): TrajectoryPoint[] {
  if (points.length < windowSize) {
    return points;
  }

  const halfWindow = Math.floor(windowSize / 2);
  const smoothed: TrajectoryPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(points.length, i + halfWindow + 1);
    const window = points.slice(start, end);

    const avgX = window.reduce((sum, p) => sum + p.pixelX, 0) / window.length;
    const avgY = window.reduce((sum, p) => sum + p.pixelY, 0) / window.length;

    smoothed.push({
      ...points[i],
      pixelX: avgX,
      pixelY: avgY,
    });
  }

  return smoothed;
}
