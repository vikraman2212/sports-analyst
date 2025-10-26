/**
 * Integration Test: Detection Pipeline
 * 
 * This test validates that the detection pipeline processes frames
 * and returns normalized Detection objects with the expected structure.
 * 
 * Expected to FAIL until detection adapter is implemented.
 */

import type { FrameSample, Detection } from '@/lib/types';

describe('Detection Pipeline Integration', () => {
  describe('detectBallInFrame', () => {
    it('should exist and be importable', async () => {
      const { detectBallInFrame } = await import('@/lib/detection/adapter');
      expect(detectBallInFrame).toBeDefined();
      expect(typeof detectBallInFrame).toBe('function');
    });

    it('should accept a FrameSample and return Promise<Detection | null>', async () => {
      const { detectBallInFrame } = await import('@/lib/detection/adapter');
      
      const mockFrame: FrameSample = {
        frameIndex: 0,
        timestampMs: 0,
        imageData: new ImageData(640, 480),
      };

      const result = detectBallInFrame(mockFrame);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return null when no ball is detected', async () => {
      const { detectBallInFrame } = await import('@/lib/detection/adapter');
      
      // Empty frame - no ball present
      const emptyFrame: FrameSample = {
        frameIndex: 0,
        timestampMs: 0,
        imageData: new ImageData(640, 480), // Blank image
      };

      const result = await detectBallInFrame(emptyFrame);
      expect(result).toBeNull();
    });

    it('should return Detection object with normalized structure', async () => {
      const { detectBallInFrame } = await import('@/lib/detection/adapter');
      
      // Frame with ball (mocked - actual implementation will use ONNX)
      const frameWithBall: FrameSample = {
        frameIndex: 5,
        timestampMs: 167,
        imageData: new ImageData(640, 480),
      };

      const result = await detectBallInFrame(frameWithBall);
      
      if (result !== null) {
        // Validate Detection structure
        expect(result).toHaveProperty('boundingBox');
        expect(result.boundingBox).toHaveProperty('x');
        expect(result.boundingBox).toHaveProperty('y');
        expect(result.boundingBox).toHaveProperty('width');
        expect(result.boundingBox).toHaveProperty('height');
        
        expect(result).toHaveProperty('confidence');
        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        
        expect(result).toHaveProperty('ballClass');
        expect(typeof result.ballClass).toBe('string');
      }
    });
  });

  describe('detectBallInFrames (batch processing)', () => {
    it('should process multiple frames and return array of detections', async () => {
      const { detectBallInFrames } = await import('@/lib/detection/adapter');
      
      const frames: FrameSample[] = [
        { frameIndex: 0, timestampMs: 0, imageData: new ImageData(640, 480) },
        { frameIndex: 1, timestampMs: 33, imageData: new ImageData(640, 480) },
        { frameIndex: 2, timestampMs: 66, imageData: new ImageData(640, 480) },
      ];

      const results = await detectBallInFrames(frames);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(frames.length);
      
      // Each result should be Detection | null
      results.forEach((result) => {
        if (result !== null) {
          expect(result).toHaveProperty('boundingBox');
          expect(result).toHaveProperty('confidence');
          expect(result).toHaveProperty('ballClass');
        }
      });
    });

    it('should meet performance requirement of <100ms per frame', async () => {
      const { detectBallInFrame } = await import('@/lib/detection/adapter');
      
      const frame: FrameSample = {
        frameIndex: 0,
        timestampMs: 0,
        imageData: new ImageData(640, 480),
      };

      const startTime = performance.now();
      await detectBallInFrame(frame);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // Per constitution: <100ms/frame target
      expect(processingTime).toBeLessThan(100);
    });

    it('should handle empty frames array gracefully', async () => {
      const { detectBallInFrames } = await import('@/lib/detection/adapter');
      
      const results = await detectBallInFrames([]);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('Detection confidence filtering', () => {
    it('should filter out low-confidence detections', async () => {
      const { filterDetectionsByConfidence } = await import('@/lib/detection/adapter');
      
      const detections: Detection[] = [
        {
          boundingBox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          ballClass: 'cricket_ball',
        },
        {
          boundingBox: { x: 200, y: 200, width: 50, height: 50 },
          confidence: 0.45, // Low confidence
          ballClass: 'cricket_ball',
        },
        {
          boundingBox: { x: 300, y: 300, width: 50, height: 50 },
          confidence: 0.85,
          ballClass: 'cricket_ball',
        },
      ];

      const threshold = 0.5;
      const filtered = filterDetectionsByConfidence(detections, threshold);
      
      expect(filtered.length).toBe(2);
      filtered.forEach((detection) => {
        expect(detection.confidence).toBeGreaterThanOrEqual(threshold);
      });
    });
  });
});
