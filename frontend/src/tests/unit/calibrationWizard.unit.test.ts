/**
 * Unit tests for calibration wizard utilities
 * Tests pixel distance calculation, validation, and helper functions
 */

import {
  calculatePixelDistance,
  validateCalibration,
  calculatePixelsPerMeter,
  generateCalibrationId,
  estimateExpectedPixels,
} from '../../lib/calibration/wizard';

describe('calibrationWizard utilities', () => {
  describe('calculatePixelDistance', () => {
    it('should calculate distance for horizontal line', () => {
      const point1 = { x: 100, y: 200 };
      const point2 = { x: 500, y: 200 };
      
      const distance = calculatePixelDistance(point1, point2);
      
      expect(distance).toBe(400);
    });

    it('should calculate distance for vertical line', () => {
      const point1 = { x: 300, y: 100 };
      const point2 = { x: 300, y: 600 };
      
      const distance = calculatePixelDistance(point1, point2);
      
      expect(distance).toBe(500);
    });

    it('should calculate distance for diagonal line', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      
      const distance = calculatePixelDistance(point1, point2);
      
      // 3-4-5 triangle
      expect(distance).toBe(5);
    });

    it('should handle same point (zero distance)', () => {
      const point = { x: 150, y: 250 };
      
      const distance = calculatePixelDistance(point, point);
      
      expect(distance).toBe(0);
    });

    it('should calculate distance with decimal coordinates', () => {
      const point1 = { x: 10.5, y: 20.5 };
      const point2 = { x: 13.5, y: 24.5 };
      
      const distance = calculatePixelDistance(point1, point2);
      
      // sqrt(3^2 + 4^2) = 5
      expect(distance).toBe(5);
    });

    it('should calculate large distances correctly', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 1920, y: 1080 };
      
      const distance = calculatePixelDistance(point1, point2);
      
      expect(distance).toBeCloseTo(2202.9, 1);
    });
  });

  describe('validateCalibration', () => {
    const videoWidth = 1280;
    const videoHeight = 720;

    it('should pass validation for typical calibration', () => {
      const pixelDistance = 485;
      const meters = 20.12;
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail validation for distance too small', () => {
      const pixelDistance = 30; // Below 50px minimum
      const meters = 20.12;
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Calibration distance too small (<50px). Move camera closer or use higher resolution.');
    });

    it('should fail validation for distance too large', () => {
      const pixelDistance = 2000; // Larger than video diagonal (1469px)
      const meters = 20.12;
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('exceeds video diagonal');
    });

    it('should warn if distance seems too small for video size', () => {
      const pixelDistance = 100; // Very small for 1280px width
      const meters = 20.12;
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Very low pixels per meter ratio');
    });

    it('should warn if distance seems too large for video size', () => {
      const pixelDistance = 1200; // Very large for 1280px width
      const meters = 5; // Small distance = high px/m ratio
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Very high pixels per meter ratio');
    });

    it('should handle edge case: exactly minimum threshold', () => {
      const pixelDistance = 50; // Exactly minimum
      const meters = 20.12;
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(true);
    });

    it('should handle edge case: exactly maximum threshold (video diagonal)', () => {
      const maxPossible = Math.sqrt(videoWidth ** 2 + videoHeight ** 2);
      const pixelDistance = maxPossible; // Exactly max
      const meters = 20.12;
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(true);
    });

    it('should validate with different pitch lengths', () => {
      const pixelDistance = 400;
      const meters = 16; // Youth pitch
      
      const result = validateCalibration(pixelDistance, meters, videoWidth, videoHeight);
      
      expect(result.isValid).toBe(true);
    });

    it('should validate with different video sizes', () => {
      const pixelDistance = 600;
      const meters = 20.12;
      
      const result = validateCalibration(pixelDistance, meters, 1920, 1080);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculatePixelsPerMeter', () => {
    it('should calculate ratio for standard pitch', () => {
      const pixels = 485;
      const meters = 20.12;
      
      const ratio = calculatePixelsPerMeter(pixels, meters);
      
      expect(ratio).toBeCloseTo(24.1, 1);
    });

    it('should calculate ratio for youth pitch', () => {
      const pixels = 400;
      const meters = 16;
      
      const ratio = calculatePixelsPerMeter(pixels, meters);
      
      expect(ratio).toBe(25);
    });

    it('should handle decimal pixels', () => {
      const pixels = 512.5;
      const meters = 20.12;
      
      const ratio = calculatePixelsPerMeter(pixels, meters);
      
      expect(ratio).toBeCloseTo(25.47, 2);
    });

    it('should handle very small distances', () => {
      const pixels = 100;
      const meters = 5;
      
      const ratio = calculatePixelsPerMeter(pixels, meters);
      
      expect(ratio).toBe(20);
    });

    it('should handle large distances', () => {
      const pixels = 1920;
      const meters = 20.12;
      
      const ratio = calculatePixelsPerMeter(pixels, meters);
      
      expect(ratio).toBeCloseTo(95.43, 2);
    });
  });

  describe('generateCalibrationId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateCalibrationId();
      const id2 = generateCalibrationId();
      
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      const id = generateCalibrationId();
      
      // Format: calib_TIMESTAMP_RANDOM
      expect(id).toMatch(/^calib_\d+_[a-z0-9]+$/);
    });

    it('should use timestamp in ID', () => {
      const beforeTimestamp = Date.now();
      const id = generateCalibrationId();
      const afterTimestamp = Date.now();
      
      // Extract timestamp part (second segment after splitting by underscore)
      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should generate different IDs when called rapidly', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCalibrationId());
      }
      
      // All should be unique due to random component
      expect(ids.size).toBe(100);
    });
  });

  describe('estimateExpectedPixels', () => {
    it('should estimate for 640px video width', () => {
      const estimate = estimateExpectedPixels(640, 20.12);
      
      expect(estimate.min).toBe(640 * 0.2);
      expect(estimate.max).toBe(640 * 0.8);
      expect(estimate.typical).toBe(640 * 0.5);
    });

    it('should estimate for 1280px video width', () => {
      const estimate = estimateExpectedPixels(1280, 20.12);
      
      expect(estimate.min).toBe(1280 * 0.2);
      expect(estimate.max).toBe(1280 * 0.8);
      expect(estimate.typical).toBe(1280 * 0.5);
    });

    it('should estimate for 1920px video width (Full HD)', () => {
      const estimate = estimateExpectedPixels(1920, 20.12);
      
      expect(estimate.min).toBe(1920 * 0.2);
      expect(estimate.max).toBe(1920 * 0.8);
      expect(estimate.typical).toBe(1920 * 0.5);
    });

    it('should estimate for 3840px video width (4K)', () => {
      const estimate = estimateExpectedPixels(3840, 20.12);
      
      expect(estimate.min).toBe(3840 * 0.2);
      expect(estimate.max).toBe(3840 * 0.8);
      expect(estimate.typical).toBe(3840 * 0.5);
    });

    it('should handle small video widths', () => {
      const estimate = estimateExpectedPixels(320, 20.12);
      
      expect(estimate.min).toBe(320 * 0.2);
      expect(estimate.typical).toBe(320 * 0.5);
    });

    it('should scale linearly with width', () => {
      const estimate1 = estimateExpectedPixels(1000, 20.12);
      const estimate2 = estimateExpectedPixels(2000, 20.12);
      
      // Should be approximately 2x
      expect(estimate2.typical / estimate1.typical).toBe(2);
      expect(estimate2.min / estimate1.min).toBe(2);
      expect(estimate2.max / estimate1.max).toBe(2);
    });

    it('should work with different pitch lengths', () => {
      const estimate1 = estimateExpectedPixels(1280, 20.12);
      const estimate2 = estimateExpectedPixels(1280, 16);
      
      // Results should be same (only depends on video width)
      expect(estimate1).toEqual(estimate2);
    });
  });

  describe('integration: full calibration workflow', () => {
    it('should calculate correct px/m ratio from two points', () => {
      // User marks bowling and batting creases
      const bowlingCrease = { x: 640, y: 100 };
      const battingCrease = { x: 640, y: 585 };
      
      // Step 1: Calculate pixel distance
      const pixels = calculatePixelDistance(bowlingCrease, battingCrease);
      expect(pixels).toBe(485);
      
      // Step 2: Validate calibration
      const validation = validateCalibration(pixels, 20.12, 1280, 720);
      expect(validation.isValid).toBe(true);
      
      // Step 3: Calculate pixels per meter
      const ratio = calculatePixelsPerMeter(pixels, 20.12);
      expect(ratio).toBeCloseTo(24.1, 1);
    });

    it('should reject invalid calibration and provide errors', () => {
      // User marks points too close together
      const point1 = { x: 640, y: 360 };
      const point2 = { x: 640, y: 380 };
      
      const pixels = calculatePixelDistance(point1, point2);
      expect(pixels).toBe(20);
      
      const validation = validateCalibration(pixels, 20.12, 1280, 720);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should warn about unusual calibration but still accept', () => {
      // User calibrates with very small distance relative to video
      const point1 = { x: 600, y: 360 };
      const point2 = { x: 700, y: 360 };
      
      const pixels = calculatePixelDistance(point1, point2);
      expect(pixels).toBe(100);
      
      const validation = validateCalibration(pixels, 20.12, 1920, 1080);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });
});
