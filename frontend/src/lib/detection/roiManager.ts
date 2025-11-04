/**
 * Region of Interest (ROI) Manager
 * 
 * Implements adaptive ROI cropping to reduce per-frame compute footprint.
 * Based on research.md decision:
 * - ROI cropping activates after first confirmed detection
 * - Expands ROI margin to prevent losing ball
 * - Fallback to periodic full-frame scan (every 10th frame)
 * - Smaller tensors => faster inference & lower battery consumption
 */

import { Detection } from '../types';

/**
 * ROI rectangle in pixel coordinates
 */
export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Configuration for ROI management
 */
export interface ROIConfig {
  /**
   * Margin to expand around detected ball (in pixels)
   * Prevents losing ball if it moves quickly
   * @default 100
   */
  margin: number;

  /**
   * Minimum ROI width/height (prevents tiny crops)
   * @default 200
   */
  minSize: number;

  /**
   * Maximum ROI width/height (prevents excessive crops)
   * @default 800
   */
  maxSize: number;

  /**
   * Interval for full-frame fallback scan
   * Every Nth frame, use full frame instead of ROI
   * @default 10
   */
  fullFrameInterval: number;

  /**
   * Enable ROI cropping (can disable for debugging)
   * @default true
   */
  enabled: boolean;

  /**
   * Smoothing factor for ROI position (0-1)
   * Higher = more smoothing, less jitter
   * @default 0.3
   */
  smoothingFactor: number;
}

/**
 * Default ROI configuration
 */
export const DEFAULT_ROI_CONFIG: ROIConfig = {
  margin: 100,
  minSize: 200,
  maxSize: 800,
  fullFrameInterval: 10,
  enabled: true,
  smoothingFactor: 0.3,
};

/**
 * ROI Manager - manages adaptive region of interest for efficient detection
 */
export class ROIManager {
  private config: ROIConfig;
  private currentROI: ROI | null = null;
  private previousROI: ROI | null = null;
  private frameCount: number = 0;
  private hasFirstDetection: boolean = false;
  private frameWidth: number;
  private frameHeight: number;

  constructor(
    frameWidth: number,
    frameHeight: number,
    config: Partial<ROIConfig> = {}
  ) {
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.config = { ...DEFAULT_ROI_CONFIG, ...config };
  }

  /**
   * Update ROI based on new detection
   * 
   * @param detection - Latest ball detection (null if no detection)
   * @returns ROI to use for next frame, or null for full frame
   */
  updateROI(detection: Detection | null): ROI | null {
    this.frameCount++;

    // ROI disabled - always return full frame
    if (!this.config.enabled) {
      return null;
    }

    // Full-frame fallback every Nth frame
    if (this.frameCount % this.config.fullFrameInterval === 0) {
      return null;
    }

    // No detection yet - use full frame
    if (!detection) {
      // If we had previous detections, keep using the last ROI
      // to handle temporary detection failures
      if (this.hasFirstDetection && this.currentROI) {
        return this.currentROI;
      }
      return null;
    }

    // First detection - activate ROI cropping
    if (!this.hasFirstDetection) {
      this.hasFirstDetection = true;
    }

    // Calculate new ROI around detection
    const newROI = this.calculateROI(detection);

    // Apply smoothing to reduce jitter
    if (this.previousROI) {
      this.currentROI = this.smoothROI(this.previousROI, newROI);
    } else {
      this.currentROI = newROI;
    }

    this.previousROI = this.currentROI;
    return this.currentROI;
  }

  /**
   * Calculate ROI around a detection with margin
   * 
   * @param detection - Ball detection
   * @returns ROI rectangle
   */
  private calculateROI(detection: Detection): ROI {
    const { boundingBox } = detection;
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;

    // Calculate ROI size (detection size + margin)
    let roiWidth = Math.max(
      boundingBox.width + this.config.margin * 2,
      this.config.minSize
    );
    let roiHeight = Math.max(
      boundingBox.height + this.config.margin * 2,
      this.config.minSize
    );

    // Enforce maximum size
    roiWidth = Math.min(roiWidth, this.config.maxSize);
    roiHeight = Math.min(roiHeight, this.config.maxSize);

    // Center ROI around detection
    let x = centerX - roiWidth / 2;
    let y = centerY - roiHeight / 2;

    // Clamp to frame boundaries
    x = Math.max(0, Math.min(x, this.frameWidth - roiWidth));
    y = Math.max(0, Math.min(y, this.frameHeight - roiHeight));

    // Ensure ROI doesn't exceed frame boundaries
    roiWidth = Math.min(roiWidth, this.frameWidth - x);
    roiHeight = Math.min(roiHeight, this.frameHeight - y);

    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(roiWidth),
      height: Math.round(roiHeight),
    };
  }

  /**
   * Apply exponential moving average smoothing to ROI
   * Reduces jitter from frame-to-frame detection variations
   * 
   * @param previousROI - Previous frame's ROI
   * @param newROI - Newly calculated ROI
   * @returns Smoothed ROI
   */
  private smoothROI(previousROI: ROI, newROI: ROI): ROI {
    const alpha = this.config.smoothingFactor;

    return {
      x: Math.round(alpha * newROI.x + (1 - alpha) * previousROI.x),
      y: Math.round(alpha * newROI.y + (1 - alpha) * previousROI.y),
      width: Math.round(alpha * newROI.width + (1 - alpha) * previousROI.width),
      height: Math.round(
        alpha * newROI.height + (1 - alpha) * previousROI.height
      ),
    };
  }

  /**
   * Get current ROI (may be null if using full frame)
   */
  getCurrentROI(): ROI | null {
    return this.currentROI;
  }

  /**
   * Check if next frame should use full frame
   * 
   * @returns True if next frame should be full frame
   */
  shouldUseFullFrame(): boolean {
    if (!this.config.enabled) {
      return true;
    }

    if (!this.hasFirstDetection) {
      return true;
    }

    return (this.frameCount + 1) % this.config.fullFrameInterval === 0;
  }

  /**
   * Reset ROI manager state (for new delivery)
   */
  reset(): void {
    this.currentROI = null;
    this.previousROI = null;
    this.frameCount = 0;
    this.hasFirstDetection = false;
  }

  /**
   * Get frame count (for debugging/metrics)
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Check if ROI cropping is active
   */
  isROIActive(): boolean {
    return this.hasFirstDetection && this.currentROI !== null;
  }
}

/**
 * Crop ImageData to ROI region
 * 
 * @param imageData - Full frame ImageData
 * @param roi - ROI rectangle to extract
 * @returns Cropped ImageData
 */
export function cropImageDataToROI(
  imageData: ImageData,
  roi: ROI
): ImageData {
  const { x, y, width, height } = roi;

  // Validate ROI bounds
  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > imageData.width ||
    y + height > imageData.height
  ) {
    throw new Error(
      `Invalid ROI: (${x}, ${y}, ${width}, ${height}) for image (${imageData.width}, ${imageData.height})`
    );
  }

  // Create new ImageData for cropped region
  const croppedData = new ImageData(width, height);

  // Copy pixels row by row
  for (let row = 0; row < height; row++) {
    const srcRowStart = ((y + row) * imageData.width + x) * 4;
    const dstRowStart = row * width * 4;

    for (let col = 0; col < width; col++) {
      const srcIdx = srcRowStart + col * 4;
      const dstIdx = dstRowStart + col * 4;

      croppedData.data[dstIdx] = imageData.data[srcIdx]; // R
      croppedData.data[dstIdx + 1] = imageData.data[srcIdx + 1]; // G
      croppedData.data[dstIdx + 2] = imageData.data[srcIdx + 2]; // B
      croppedData.data[dstIdx + 3] = imageData.data[srcIdx + 3]; // A
    }
  }

  return croppedData;
}

/**
 * Convert detection coordinates from ROI space to full-frame space
 * 
 * @param detection - Detection in ROI coordinates
 * @param roi - ROI that was used for detection
 * @returns Detection in full-frame coordinates
 */
export function convertROIDetectionToFullFrame(
  detection: Detection,
  roi: ROI
): Detection {
  return {
    ...detection,
    boundingBox: {
      x: detection.boundingBox.x + roi.x,
      y: detection.boundingBox.y + roi.y,
      width: detection.boundingBox.width,
      height: detection.boundingBox.height,
    },
  };
}

/**
 * Calculate ROI coverage percentage of frame
 * 
 * @param roi - ROI rectangle
 * @param frameWidth - Full frame width
 * @param frameHeight - Full frame height
 * @returns Coverage percentage (0-100)
 */
export function calculateROICoverage(
  roi: ROI,
  frameWidth: number,
  frameHeight: number
): number {
  const frameArea = frameWidth * frameHeight;
  const roiArea = roi.width * roi.height;
  return (roiArea / frameArea) * 100;
}

/**
 * Validate ROI is within frame boundaries
 * 
 * @param roi - ROI to validate
 * @param frameWidth - Frame width
 * @param frameHeight - Frame height
 * @returns Validation result
 */
export function validateROI(
  roi: ROI,
  frameWidth: number,
  frameHeight: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (roi.x < 0 || roi.y < 0) {
    errors.push('ROI position cannot be negative');
  }

  if (roi.width <= 0 || roi.height <= 0) {
    errors.push('ROI dimensions must be positive');
  }

  if (roi.x + roi.width > frameWidth) {
    errors.push(`ROI exceeds frame width: ${roi.x + roi.width} > ${frameWidth}`);
  }

  if (roi.y + roi.height > frameHeight) {
    errors.push(
      `ROI exceeds frame height: ${roi.y + roi.height} > ${frameHeight}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
