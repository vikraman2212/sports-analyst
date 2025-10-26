/**
 * Unit tests for ROI Manager
 * 
 * Tests adaptive region of interest cropping, smoothing, and full-frame fallback
 */

import {
  ROIManager,
  cropImageDataToROI,
  convertROIDetectionToFullFrame,
  calculateROICoverage,
  validateROI,
  type ROI,
} from '../../lib/detection/roiManager';
import { Detection } from '../../lib/types';

describe('ROI Manager', () => {
  const FRAME_WIDTH = 1920;
  const FRAME_HEIGHT = 1080;

  const createMockDetection = (
    x: number,
    y: number,
    width: number = 50,
    height: number = 50,
    confidence: number = 0.9
  ): Detection => ({
    boundingBox: { x, y, width, height },
    confidence,
    ballClass: 'cricket_ball',
  });

  describe('ROIManager', () => {
    it('should initialize with full frame (no ROI) before first detection', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);

      const roi = manager.updateROI(null);

      expect(roi).toBeNull();
      expect(manager.isROIActive()).toBe(false);
      expect(manager.getFrameCount()).toBe(1);
    });

    it('should activate ROI after first detection', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);
      const detection = createMockDetection(500, 400);

      const roi = manager.updateROI(detection);

      expect(roi).not.toBeNull();
      expect(manager.isROIActive()).toBe(true);
      expect(roi!.width).toBeGreaterThan(detection.boundingBox.width);
      expect(roi!.height).toBeGreaterThan(detection.boundingBox.height);
    });

    it('should create ROI with margin around detection', () => {
      const margin = 100;
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, { margin });
      const detection = createMockDetection(500, 400, 50, 50);

      const roi = manager.updateROI(detection);

      expect(roi).not.toBeNull();
      // ROI should be detection size + 2*margin
      expect(roi!.width).toBeGreaterThanOrEqual(50 + 2 * margin);
      expect(roi!.height).toBeGreaterThanOrEqual(50 + 2 * margin);
    });

    it('should enforce minimum ROI size', () => {
      const minSize = 200;
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, { minSize });
      const detection = createMockDetection(500, 400, 10, 10); // Very small detection

      const roi = manager.updateROI(detection);

      expect(roi).not.toBeNull();
      expect(roi!.width).toBeGreaterThanOrEqual(minSize);
      expect(roi!.height).toBeGreaterThanOrEqual(minSize);
    });

    it('should enforce maximum ROI size', () => {
      const maxSize = 400;
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, {
        maxSize,
        margin: 500, // Large margin to test max size enforcement
      });
      const detection = createMockDetection(500, 400, 200, 200);

      const roi = manager.updateROI(detection);

      expect(roi).not.toBeNull();
      expect(roi!.width).toBeLessThanOrEqual(maxSize);
      expect(roi!.height).toBeLessThanOrEqual(maxSize);
    });

    it('should clamp ROI to frame boundaries', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);
      const detection = createMockDetection(10, 10, 50, 50); // Near top-left corner

      const roi = manager.updateROI(detection);

      expect(roi).not.toBeNull();
      expect(roi!.x).toBeGreaterThanOrEqual(0);
      expect(roi!.y).toBeGreaterThanOrEqual(0);
      expect(roi!.x + roi!.width).toBeLessThanOrEqual(FRAME_WIDTH);
      expect(roi!.y + roi!.height).toBeLessThanOrEqual(FRAME_HEIGHT);
    });

    it('should use full frame every Nth frame (full-frame fallback)', () => {
      const fullFrameInterval = 5;
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, {
        fullFrameInterval,
      });
      const detection = createMockDetection(500, 400);

      // First detection activates ROI
      manager.updateROI(detection);

      // Frames 2-4 should use ROI
      for (let i = 2; i < 5; i++) {
        const roi = manager.updateROI(detection);
        expect(roi).not.toBeNull();
      }

      // Frame 5 should use full frame (5 % 5 === 0)
      const frame5ROI = manager.updateROI(detection);
      expect(frame5ROI).toBeNull();

      // Frame 6 should use ROI again
      const frame6ROI = manager.updateROI(detection);
      expect(frame6ROI).not.toBeNull();
    });

    it('should apply smoothing to reduce ROI jitter', () => {
      const smoothingFactor = 0.5;
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, {
        smoothingFactor,
      });

      // First detection
      const detection1 = createMockDetection(500, 400);
      const roi1 = manager.updateROI(detection1);

      // Second detection with different position
      const detection2 = createMockDetection(600, 450);
      const roi2 = manager.updateROI(detection2);

      // ROI should move but be smoothed (not jump fully to new position)
      expect(roi2!.x).toBeGreaterThan(roi1!.x);
      expect(roi2!.x).toBeLessThan(600); // Smoothed, not at full new position
    });

    it('should keep last ROI when detection temporarily fails', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);

      // First detection
      const detection = createMockDetection(500, 400);
      const roi1 = manager.updateROI(detection);

      // No detection (temporary failure)
      const roi2 = manager.updateROI(null);

      // Should keep using last ROI
      expect(roi2).not.toBeNull();
      expect(roi2).toEqual(roi1);
    });

    it('should return null when ROI is disabled', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, {
        enabled: false,
      });
      const detection = createMockDetection(500, 400);

      const roi = manager.updateROI(detection);

      expect(roi).toBeNull();
      expect(manager.shouldUseFullFrame()).toBe(true);
    });

    it('should reset state correctly', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);
      const detection = createMockDetection(500, 400);

      // Activate ROI
      manager.updateROI(detection);
      expect(manager.isROIActive()).toBe(true);
      expect(manager.getFrameCount()).toBe(1);

      // Reset
      manager.reset();

      expect(manager.isROIActive()).toBe(false);
      expect(manager.getFrameCount()).toBe(0);
      expect(manager.getCurrentROI()).toBeNull();
    });

    it('should predict next frame type correctly', () => {
      const fullFrameInterval = 10;
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, {
        fullFrameInterval,
      });
      const detection = createMockDetection(500, 400);

      // Before first detection
      expect(manager.shouldUseFullFrame()).toBe(true);

      // Frame 1 - first detection
      manager.updateROI(detection);
      expect(manager.shouldUseFullFrame()).toBe(false); // Frame 2 will use ROI

      // Advance to frame 9
      for (let i = 2; i <= 9; i++) {
        manager.updateROI(detection);
      }
      expect(manager.shouldUseFullFrame()).toBe(true); // Frame 10 will be full frame
    });

    it('should handle detection at frame boundaries', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);

      // Detection at top-left corner
      const cornerDetection = createMockDetection(0, 0, 50, 50);
      const roi1 = manager.updateROI(cornerDetection);
      expect(roi1).not.toBeNull();
      expect(roi1!.x).toBe(0);
      expect(roi1!.y).toBe(0);

      manager.reset();

      // Detection at bottom-right corner
      const bottomRightDetection = createMockDetection(
        FRAME_WIDTH - 50,
        FRAME_HEIGHT - 50,
        50,
        50
      );
      const roi2 = manager.updateROI(bottomRightDetection);
      expect(roi2).not.toBeNull();
      expect(roi2!.x + roi2!.width).toBeLessThanOrEqual(FRAME_WIDTH);
      expect(roi2!.y + roi2!.height).toBeLessThanOrEqual(FRAME_HEIGHT);
    });
  });

  describe('cropImageDataToROI', () => {
    it('should crop ImageData to ROI region', () => {
      const width = 100;
      const height = 100;
      const imageData = new ImageData(width, height);

      // Fill with test pattern (red pixels)
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255; // R
        imageData.data[i + 1] = 0; // G
        imageData.data[i + 2] = 0; // B
        imageData.data[i + 3] = 255; // A
      }

      const roi: ROI = { x: 25, y: 25, width: 50, height: 50 };
      const cropped = cropImageDataToROI(imageData, roi);

      expect(cropped.width).toBe(50);
      expect(cropped.height).toBe(50);
      expect(cropped.data[0]).toBe(255); // Red channel preserved
    });

    it('should throw error for invalid ROI bounds', () => {
      const imageData = new ImageData(100, 100);
      const invalidROI: ROI = { x: 90, y: 90, width: 50, height: 50 }; // Exceeds bounds

      expect(() => cropImageDataToROI(imageData, invalidROI)).toThrow();
    });

    it('should throw error for negative ROI coordinates', () => {
      const imageData = new ImageData(100, 100);
      const invalidROI: ROI = { x: -10, y: 0, width: 50, height: 50 };

      expect(() => cropImageDataToROI(imageData, invalidROI)).toThrow();
    });

    it('should crop full-width ROI correctly', () => {
      const imageData = new ImageData(100, 100);
      const roi: ROI = { x: 0, y: 25, width: 100, height: 50 };

      const cropped = cropImageDataToROI(imageData, roi);

      expect(cropped.width).toBe(100);
      expect(cropped.height).toBe(50);
    });
  });

  describe('convertROIDetectionToFullFrame', () => {
    it('should convert detection coordinates from ROI to full frame', () => {
      const roiDetection = createMockDetection(50, 30, 40, 40);
      const roi: ROI = { x: 100, y: 200, width: 400, height: 300 };

      const fullFrameDetection = convertROIDetectionToFullFrame(
        roiDetection,
        roi
      );

      expect(fullFrameDetection.boundingBox.x).toBe(150); // 50 + 100
      expect(fullFrameDetection.boundingBox.y).toBe(230); // 30 + 200
      expect(fullFrameDetection.boundingBox.width).toBe(40); // Unchanged
      expect(fullFrameDetection.boundingBox.height).toBe(40); // Unchanged
      expect(fullFrameDetection.confidence).toBe(roiDetection.confidence);
    });

    it('should preserve detection metadata', () => {
      const detection = createMockDetection(50, 30, 40, 40, 0.85);
      const roi: ROI = { x: 100, y: 200, width: 400, height: 300 };

      const converted = convertROIDetectionToFullFrame(detection, roi);

      expect(converted.confidence).toBe(0.85);
      expect(converted.ballClass).toBe('cricket_ball');
    });
  });

  describe('calculateROICoverage', () => {
    it('should calculate ROI coverage percentage', () => {
      const roi: ROI = { x: 0, y: 0, width: 960, height: 540 };

      const coverage = calculateROICoverage(roi, 1920, 1080);

      expect(coverage).toBe(25); // 1/4 of frame
    });

    it('should calculate 100% coverage for full frame', () => {
      const roi: ROI = { x: 0, y: 0, width: 1920, height: 1080 };

      const coverage = calculateROICoverage(roi, 1920, 1080);

      expect(coverage).toBe(100);
    });

    it('should calculate small ROI coverage', () => {
      const roi: ROI = { x: 0, y: 0, width: 192, height: 108 };

      const coverage = calculateROICoverage(roi, 1920, 1080);

      expect(coverage).toBe(1); // 1% of frame
    });
  });

  describe('validateROI', () => {
    it('should validate correct ROI', () => {
      const roi: ROI = { x: 100, y: 100, width: 400, height: 300 };

      const result = validateROI(roi, 1920, 1080);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect negative position', () => {
      const roi: ROI = { x: -10, y: 0, width: 400, height: 300 };

      const result = validateROI(roi, 1920, 1080);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ROI position cannot be negative');
    });

    it('should detect zero or negative dimensions', () => {
      const roi: ROI = { x: 100, y: 100, width: 0, height: 300 };

      const result = validateROI(roi, 1920, 1080);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ROI dimensions must be positive');
    });

    it('should detect ROI exceeding frame width', () => {
      const roi: ROI = { x: 1800, y: 100, width: 400, height: 300 };

      const result = validateROI(roi, 1920, 1080);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('exceeds frame width'))).toBe(
        true
      );
    });

    it('should detect ROI exceeding frame height', () => {
      const roi: ROI = { x: 100, y: 900, width: 400, height: 300 };

      const result = validateROI(roi, 1920, 1080);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('exceeds frame height'))).toBe(
        true
      );
    });

    it('should detect multiple validation errors', () => {
      const roi: ROI = { x: -10, y: 2000, width: 0, height: -50 };

      const result = validateROI(roi, 1920, 1080);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle cricket ball tracking across pitch', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);

      // Ball detected near bowler (left side of frame)
      const detection1 = createMockDetection(300, 500, 40, 40);
      const roi1 = manager.updateROI(detection1);
      expect(roi1).not.toBeNull();

      // Ball moves toward batsman (right side)
      const detection2 = createMockDetection(800, 520, 35, 35);
      const roi2 = manager.updateROI(detection2);
      expect(roi2).not.toBeNull();
      expect(roi2!.x).toBeGreaterThan(roi1!.x); // ROI moved right

      // Ball continues to batsman
      const detection3 = createMockDetection(1400, 540, 30, 30);
      const roi3 = manager.updateROI(detection3);
      expect(roi3).not.toBeNull();
      expect(roi3!.x).toBeGreaterThan(roi2!.x);
    });

    it('should handle fast delivery with sparse detections', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);

      // First detection
      const detection1 = createMockDetection(400, 500);
      manager.updateROI(detection1);

      // Missed detection (ball too fast)
      manager.updateROI(null);

      // Ball reappears far away
      const detection2 = createMockDetection(1200, 550);
      const roi = manager.updateROI(detection2);

      // Should still create valid ROI
      expect(roi).not.toBeNull();
      expect(roi!.x + roi!.width).toBeLessThanOrEqual(FRAME_WIDTH);
    });

    it('should optimize performance with ROI cropping', () => {
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT);
      const detection = createMockDetection(960, 540); // Center of frame

      const roi = manager.updateROI(detection);
      expect(roi).not.toBeNull();

      // ROI should be significantly smaller than full frame
      const coverage = calculateROICoverage(roi!, FRAME_WIDTH, FRAME_HEIGHT);
      expect(coverage).toBeLessThan(50); // Less than 50% of frame
    });

    it('should handle full-frame fallback for tracking recovery', () => {
      const fullFrameInterval = 5;
      const manager = new ROIManager(FRAME_WIDTH, FRAME_HEIGHT, {
        fullFrameInterval,
      });
      const detection = createMockDetection(500, 400);

      // Frame 1: Activate ROI
      manager.updateROI(detection);

      // Frames 2-4: Continue with detections
      for (let i = 2; i < 5; i++) {
        const roi = manager.updateROI(detection);
        expect(roi).not.toBeNull(); // Should use ROI
      }

      // Frame 5: Full-frame fallback (5 % 5 === 0)
      const roi5 = manager.updateROI(detection);
      expect(roi5).toBeNull(); // Full frame for periodic scan

      // Frame 6: Back to ROI
      const roi6 = manager.updateROI(detection);
      expect(roi6).not.toBeNull();
    });
  });
});
