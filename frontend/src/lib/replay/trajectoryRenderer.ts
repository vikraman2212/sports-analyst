/**
 * Trajectory Renderer
 * 
 * Canvas-based rendering engine for Hawk-Eye style trajectory visualization.
 * Supports both side view (default) and top-down wagon wheel view.
 */

import type {
  ReplaySession,
  ViewMode,
  RenderDimensions,
  AnnotationConfig,
  BouncePoint,
  PitchZone,
} from './types';
import type { TrajectoryPoint } from '../types';

/**
 * Trajectory renderer class
 */
export class TrajectoryRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private session: ReplaySession;
  private viewMode: ViewMode;
  private annotations: AnnotationConfig;

  constructor(
    canvas: HTMLCanvasElement,
    session: ReplaySession,
    viewMode: ViewMode = 'side',
    annotations: Partial<AnnotationConfig> = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
    this.session = session;
    this.viewMode = viewMode;
    this.annotations = {
      showSpeed: true,
      showBouncePoint: true,
      showLength: true,
      showSwing: false,
      showGrid: true,
      ...annotations,
    };
  }

  /**
   * Render full trajectory at specific playback time
   */
  render(currentTimeMs: number): void {
    this.clearCanvas();

    // Draw background grid/pitch
    if (this.annotations.showGrid) {
      this.drawPitchGrid();
    }

    // Draw static frame if available (semi-transparent)
    if (this.session.staticFrame) {
      this.drawStaticFrame();
    }

    // Draw trajectory path
    this.drawTrajectoryPath(currentTimeMs);

    // Draw annotations
    if (this.annotations.showSpeed) {
      this.drawSpeedAnnotation();
    }

    if (this.annotations.showBouncePoint) {
      const bouncePoint = this.detectBouncePoint();
      if (bouncePoint) {
        this.drawBouncePointMarker(bouncePoint);

        if (this.annotations.showLength) {
          this.drawLengthAnnotation(bouncePoint);
        }
      }
    }
  }

  /**
   * Set view mode
   */
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  /**
   * Update annotations configuration
   */
  setAnnotations(config: Partial<AnnotationConfig>): void {
    this.annotations = { ...this.annotations, ...config };
  }

  /**
   * Clear canvas
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fill with dark background for better contrast
    this.ctx.fillStyle = 'rgba(10, 25, 47, 0.95)'; // Dark blue-gray
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw pitch grid based on view mode
   */
  private drawPitchGrid(): void {
    if (this.viewMode === 'side') {
      this.drawSideViewGrid();
    } else {
      this.drawTopDownGrid();
    }
  }

  /**
   * Draw side view pitch grid (Hawk-Eye style)
   */
  private drawSideViewGrid(): void {
    const { width, height } = this.canvas;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;

    // Draw horizontal lines (height markers every 2m)
    const maxHeight = 6; // meters
    const heightStep = 2; // meters
    for (let h = 0; h <= maxHeight; h += heightStep) {
      const y = height - (h / maxHeight) * height * 0.8 - 50;
      this.ctx.beginPath();
      this.ctx.moveTo(50, y);
      this.ctx.lineTo(width - 50, y);
      this.ctx.stroke();

      // Height label
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`${h}m`, 10, y + 4);
    }

    // Draw vertical lines (pitch markers every 4m)
    const pitchLength = 20.12; // meters
    const lengthStep = 4; // meters
    for (let l = 0; l <= pitchLength; l += lengthStep) {
      const x = 50 + (l / pitchLength) * (width - 100);
      this.ctx.beginPath();
      this.ctx.moveTo(x, 50);
      this.ctx.lineTo(x, height - 50);
      this.ctx.stroke();

      // Distance label
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fillText(`${l}m`, x - 10, height - 10);
    }

    // Draw stumps at both ends
    this.drawStumps(50, height - 60, 'bowler');
    this.drawStumps(width - 50, height - 60, 'batsman');

    // Pitch surface line
    this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)'; // Green
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(50, height - 50);
    this.ctx.lineTo(width - 50, height - 50);
    this.ctx.stroke();
  }

  /**
   * Draw top-down wagon wheel grid
   */
  private drawTopDownGrid(): void {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height - 100;

    // Draw pitch rectangle
    const pitchWidth = 3.05; // meters (10 feet)
    const pitchLength = 20.12; // meters
    const scale = Math.min(width, height - 100) / (pitchLength * 1.2);

    this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      centerX - (pitchWidth * scale) / 2,
      centerY - pitchLength * scale,
      pitchWidth * scale,
      pitchLength * scale
    );

    // Draw wagon wheel zones (45-degree segments)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    const radius = Math.min(width, height - 100) / 2 - 50;
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(
        centerX + Math.cos(rad) * radius,
        centerY + Math.sin(rad) * radius
      );
      this.ctx.stroke();
    }

    // Draw distance circles every 5m
    for (let r = 5; r <= 20; r += 5) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, (r / 20) * radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Distance label
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`${r}m`, centerX + 5, centerY - (r / 20) * radius);
    }

    // Draw stumps
    this.drawStumps(centerX, centerY, 'batsman');
    this.drawStumps(centerX, centerY - pitchLength * scale, 'bowler');
  }

  /**
   * Draw stumps
   */
  private drawStumps(x: number, y: number, type: 'bowler' | 'batsman'): void {
    const stumpHeight = 10;
    const stumpWidth = 3;

    this.ctx.fillStyle = type === 'batsman' ? '#FFD700' : '#C0C0C0'; // Gold for batsman, silver for bowler
    this.ctx.fillRect(x - stumpWidth / 2, y - stumpHeight, stumpWidth, stumpHeight);
    
    // Bails
    this.ctx.fillRect(x - 4, y - stumpHeight - 2, 8, 2);
  }

  /**
   * Draw static frame as semi-transparent background
   */
  private drawStaticFrame(): void {
    if (!this.session.staticFrame) return;

    const { imageData, width, height } = this.session.staticFrame;
    
    // Create temporary canvas for static frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(imageData, 0, 0);

    // Draw with reduced opacity
    this.ctx.globalAlpha = 0.2;
    this.ctx.drawImage(
      tempCanvas,
      0,
      0,
      width,
      height,
      50,
      50,
      this.canvas.width - 100,
      this.canvas.height - 100
    );
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw trajectory path with animation
   */
  private drawTrajectoryPath(currentTimeMs: number): void {
    const points = this.session.delivery.trajectoryPoints;
    if (points.length < 2) return;

    // Filter points up to current time
    const visiblePoints = points.filter(
      (p) => p.timestampMs <= currentTimeMs + this.session.startMs
    );

    if (visiblePoints.length < 2) return;

    const dims = this.getRenderDimensions();

    // Draw path
    this.ctx.strokeStyle = '#00D9FF'; // Bright cyan (Hawk-Eye color)
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Add glow effect
    this.ctx.shadowColor = '#00D9FF';
    this.ctx.shadowBlur = 10;

    this.ctx.beginPath();
    
    if (this.viewMode === 'side') {
      this.drawSideViewPath(visiblePoints, dims);
    } else {
      this.drawTopDownPath(visiblePoints, dims);
    }

    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Draw ball at current position
    if (visiblePoints.length > 0) {
      const currentPoint = visiblePoints[visiblePoints.length - 1];
      this.drawBall(currentPoint, dims);
    }
  }

  /**
   * Draw side view path
   */
  private drawSideViewPath(points: TrajectoryPoint[], dims: RenderDimensions): void {
    const { width, height } = this.canvas;

    points.forEach((point, index) => {
      // Map pixel X to pitch distance (0-20.12m)
      const distanceRatio = point.pixelX / dims.width;
      const x = 50 + distanceRatio * (width - 100);

      // Map pixel Y to height (inverted, with estimated Z for height)
      const heightRatio = 1 - point.pixelY / dims.height;
      const estimatedHeight = heightRatio * 6; // 0-6m height range
      const y = height - 50 - (estimatedHeight / 6) * (height - 100);

      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
  }

  /**
   * Draw top-down path
   */
  private drawTopDownPath(points: TrajectoryPoint[], dims: RenderDimensions): void {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height - 100;
    const scale = Math.min(width, height - 100) / (20.12 * 1.2);

    points.forEach((point, index) => {
      // Map pixel coordinates to pitch coordinates
      const xOffset = (point.pixelX - dims.width / 2) / dims.width * 3.05; // Pitch width 3.05m
      const yOffset = (point.pixelY - dims.height / 2) / dims.height * 20.12; // Pitch length

      const x = centerX + xOffset * scale * 3;
      const y = centerY - yOffset * scale;

      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
  }

  /**
   * Draw ball at current position
   */
  private drawBall(point: TrajectoryPoint, dims: RenderDimensions): void {
    const { width, height } = this.canvas;
    let x: number, y: number;

    if (this.viewMode === 'side') {
      const distanceRatio = point.pixelX / dims.width;
      x = 50 + distanceRatio * (width - 100);

      const heightRatio = 1 - point.pixelY / dims.height;
      const estimatedHeight = heightRatio * 6;
      y = height - 50 - (estimatedHeight / 6) * (height - 100);
    } else {
      const centerX = width / 2;
      const centerY = height - 100;
      const scale = Math.min(width, height - 100) / (20.12 * 1.2);

      const xOffset = (point.pixelX - dims.width / 2) / dims.width * 3.05;
      const yOffset = (point.pixelY - dims.height / 2) / dims.height * 20.12;

      x = centerX + xOffset * scale * 3;
      y = centerY - yOffset * scale;
    }

    // Draw ball with glow
    this.ctx.shadowColor = '#FF0080'; // Bright pink
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#FF0080';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  /**
   * Detect bounce point in trajectory
   */
  private detectBouncePoint(): BouncePoint | null {
    const points = this.session.delivery.trajectoryPoints;
    if (points.length < 3) return null;

    // Find point where Y direction changes (bottom of parabola)
    let minY = Infinity;
    let bounceIndex = -1;

    points.forEach((point, index) => {
      if (point.pixelY < minY) {
        minY = point.pixelY;
        bounceIndex = index;
      }
    });

    if (bounceIndex === -1 || bounceIndex === 0 || bounceIndex === points.length - 1) {
      return null;
    }

    const bouncePoint = points[bounceIndex];
    const dims = this.getRenderDimensions();
    
    // Calculate distance from stumps (as percentage of pitch)
    const distanceRatio = bouncePoint.pixelX / dims.width;
    const distanceFromStumps = distanceRatio * 20.12;

    // Classify length zone
    const zone = this.classifyPitchZone(distanceFromStumps);

    return {
      point: bouncePoint,
      index: bounceIndex,
      zone,
      distanceFromStumps,
    };
  }

  /**
   * Classify pitch zone based on distance
   */
  private classifyPitchZone(distanceFromStumps: number): PitchZone {
    if (distanceFromStumps < 2) return 'yorker';
    if (distanceFromStumps < 6) return 'full';
    if (distanceFromStumps < 12) return 'good';
    if (distanceFromStumps < 16) return 'short';
    return 'bouncer';
  }

  /**
   * Draw bounce point marker
   */
  private drawBouncePointMarker(bouncePoint: BouncePoint): void {
    const dims = this.getRenderDimensions();
    const { width, height } = this.canvas;
    
    let x: number, y: number;

    if (this.viewMode === 'side') {
      const distanceRatio = bouncePoint.point.pixelX / dims.width;
      x = 50 + distanceRatio * (width - 100);
      y = height - 50;
    } else {
      const centerX = width / 2;
      const centerY = height - 100;
      const scale = Math.min(width, height - 100) / (20.12 * 1.2);

      const xOffset = (bouncePoint.point.pixelX - dims.width / 2) / dims.width * 3.05;
      const yOffset = (bouncePoint.point.pixelY - dims.height / 2) / dims.height * 20.12;

      x = centerX + xOffset * scale * 3;
      y = centerY - yOffset * scale;
    }

    // Draw marker circle
    this.ctx.strokeStyle = '#FFD700'; // Gold
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.arc(x, y, 15, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw crosshair
    this.ctx.beginPath();
    this.ctx.moveTo(x - 10, y);
    this.ctx.lineTo(x + 10, y);
    this.ctx.moveTo(x, y - 10);
    this.ctx.lineTo(x, y + 10);
    this.ctx.stroke();
  }

  /**
   * Draw speed annotation
   */
  private drawSpeedAnnotation(): void {
    const speed = this.session.delivery.speedKmh;
    
    this.ctx.font = 'bold 32px monospace';
    this.ctx.fillStyle = '#00FF00'; // Bright green
    this.ctx.shadowColor = '#00FF00';
    this.ctx.shadowBlur = 10;
    
    const text = `${speed.toFixed(1)} km/h`;
    
    this.ctx.fillText(text, 20, 40);
    this.ctx.shadowBlur = 0;

    // Label
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('RELEASE SPEED', 20, 60);
  }

  /**
   * Draw length annotation
   */
  private drawLengthAnnotation(bouncePoint: BouncePoint): void {
    const { zone, distanceFromStumps } = bouncePoint;
    
    const zoneColors: Record<PitchZone, string> = {
      yorker: '#FF00FF',
      full: '#00FF00',
      good: '#00D9FF',
      short: '#FFD700',
      bouncer: '#FF0000',
    };

    const color = zoneColors[zone];
    
    this.ctx.font = 'bold 20px monospace';
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 8;
    
    const text = zone.toUpperCase();
    this.ctx.fillText(text, 20, 100);
    this.ctx.shadowBlur = 0;

    // Distance label
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText(`${distanceFromStumps.toFixed(1)}m from stumps`, 20, 120);
  }

  /**
   * Get rendering dimensions
   */
  private getRenderDimensions(): RenderDimensions {
    const staticFrame = this.session.staticFrame;
    
    if (staticFrame) {
      return {
        width: staticFrame.width,
        height: staticFrame.height,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };
    }

    // Fallback to canvas dimensions
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };
  }
}
