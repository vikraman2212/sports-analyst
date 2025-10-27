/**
 * Unit tests for smartTrim utility
 */

import { 
  smartTrim, 
  extractTrimmedTrajectory,
  isFrameInTrimmedRange,
  absoluteToTrimmedIndex,
  trimmedToAbsoluteIndex,
  formatTrimEfficiency,
  getTimelineZone
} from '@/lib/replay/smartTrim';
import type { TrajectoryPoint } from '@/lib/types';

// Helper to create a mock trajectory point
function createPoint(x: number, y: number, timestampMs: number): TrajectoryPoint {
  return {
    pixelX: x,
    pixelY: y,
    estimatedZ: null,
    timestampMs,
  };
}

describe('smartTrim', () => {
  describe('smartTrim()', () => {
    it('should find first and last ball detection in simple case', () => {
      const points: (TrajectoryPoint | null)[] = [
        null,
        null,
        createPoint(100, 200, 0),
        createPoint(150, 250, 33),
        createPoint(200, 300, 66),
        null,
        null,
      ];

      const result = smartTrim(points);

      expect(result.firstDetectionIndex).toBe(2);
      expect(result.lastDetectionIndex).toBe(4);
      expect(result.totalFrames).toBe(7);
      expect(result.trimmedFrames).toBe(3);
      expect(result.efficiency).toBeCloseTo(42.86, 1);
    });

    it('should handle gaps in detections (ball behind bowler)', () => {
      const points: (TrajectoryPoint | null)[] = [
        null,
        createPoint(100, 200, 0),
        createPoint(120, 220, 33),
        null, // gap (behind bowler)
        null, // gap
        createPoint(180, 280, 99),
        createPoint(200, 300, 132),
        null,
      ];

      const result = smartTrim(points);

      // Should include the gap between first and last detection
      expect(result.firstDetectionIndex).toBe(1);
      expect(result.lastDetectionIndex).toBe(6);
      expect(result.trimmedFrames).toBe(6);
    });

    it('should throw error when no ball detected', () => {
      const points: (TrajectoryPoint | null)[] = [null, null, null, null];

      expect(() => smartTrim(points)).toThrow('No ball detected in recording');
    });

    it('should throw error on empty recording', () => {
      const points: (TrajectoryPoint | null)[] = [];

      expect(() => smartTrim(points)).toThrow('No frames in recording');
    });

    it('should handle all frames with ball detected', () => {
      const points: (TrajectoryPoint | null)[] = [
        createPoint(100, 200, 0),
        createPoint(120, 220, 10),
        createPoint(140, 240, 20),
        createPoint(160, 260, 30),
        createPoint(180, 280, 40),
        createPoint(200, 300, 50),
        createPoint(220, 320, 60),
        createPoint(240, 340, 70),
        createPoint(260, 360, 80),
        createPoint(280, 380, 90),
        createPoint(300, 400, 100),
      ];

      const result = smartTrim(points);

      expect(result.firstDetectionIndex).toBe(0);
      expect(result.lastDetectionIndex).toBe(10);
      expect(result.efficiency).toBe(100);
      expect(result.warning).toBeUndefined(); // 11 frames, no warning
    });

    it('should generate warning for very short delivery (<10 frames)', () => {
      const points: (TrajectoryPoint | null)[] = [
        null,
        null,
        null,
        null,
        null,
        createPoint(100, 200, 0),
        createPoint(150, 250, 33),
        createPoint(200, 300, 66),
        null,
        null,
      ];

      const result = smartTrim(points);

      expect(result.trimmedFrames).toBe(3);
      expect(result.warning).toContain('Very short delivery');
    });

    it('should generate warning for low efficiency (<20%)', () => {
      const points: (TrajectoryPoint | null)[] = [
        ...Array(50).fill(null),
        createPoint(100, 200, 0),
        createPoint(110, 210, 10),
        createPoint(120, 220, 20),
        createPoint(130, 230, 30),
        createPoint(140, 240, 40),
        createPoint(150, 250, 50),
        createPoint(160, 260, 60),
        createPoint(170, 270, 70),
        createPoint(180, 280, 80),
        createPoint(190, 290, 90),
        createPoint(200, 300, 100),
        ...Array(50).fill(null),
      ];

      const result = smartTrim(points);

      expect(result.efficiency).toBeLessThan(20);
      expect(result.warning).toContain('started very early');
    });

    it('should generate warning for medium efficiency (20-40%)', () => {
      const points: (TrajectoryPoint | null)[] = [
        ...Array(15).fill(null),
        createPoint(100, 200, 0),
        createPoint(110, 210, 10),
        createPoint(120, 220, 20),
        createPoint(130, 230, 30),
        createPoint(140, 240, 40),
        createPoint(150, 250, 50),
        createPoint(160, 260, 60),
        createPoint(170, 270, 70),
        createPoint(180, 280, 80),
        createPoint(190, 290, 90),
        createPoint(200, 300, 100),
        ...Array(15).fill(null),
      ];

      const result = smartTrim(points);

      expect(result.efficiency).toBeGreaterThanOrEqual(20);
      expect(result.efficiency).toBeLessThan(40);
      expect(result.warning).toContain('includes extra frames');
    });

    it('should have no warning for good efficiency (≥40%)', () => {
      const points: (TrajectoryPoint | null)[] = [
        null,
        createPoint(100, 200, 0),
        createPoint(110, 210, 10),
        createPoint(120, 220, 20),
        createPoint(130, 230, 30),
        createPoint(140, 240, 40),
        createPoint(150, 250, 50),
        createPoint(160, 260, 60),
        createPoint(170, 270, 70),
        createPoint(180, 280, 80),
        createPoint(190, 290, 90),
        createPoint(200, 300, 100),
        null,
      ];

      const result = smartTrim(points);

      expect(result.efficiency).toBeGreaterThanOrEqual(40);
      expect(result.warning).toBeUndefined();
    });
  });

  describe('extractTrimmedTrajectory()', () => {
    it('should extract only trimmed segment', () => {
      const points: (TrajectoryPoint | null)[] = [
        null,
        null,
        createPoint(100, 200, 0),
        createPoint(150, 250, 33),
        createPoint(200, 300, 66),
        null,
        null,
      ];

      const trimResult = smartTrim(points);
      const trimmed = extractTrimmedTrajectory(points, trimResult);

      expect(trimmed).toHaveLength(3);
      expect(trimmed[0].pixelX).toBe(100);
      expect(trimmed[2].pixelX).toBe(200);
    });

    it('should handle gaps in trimmed segment', () => {
      const points: (TrajectoryPoint | null)[] = [
        null,
        createPoint(100, 200, 0),
        null, // gap
        createPoint(200, 300, 66),
        null,
      ];

      const trimResult = smartTrim(points);
      const trimmed = extractTrimmedTrajectory(points, trimResult);

      // Should only include non-null points
      expect(trimmed).toHaveLength(2);
      expect(trimmed[0].pixelX).toBe(100);
      expect(trimmed[1].pixelX).toBe(200);
    });
  });

  describe('isFrameInTrimmedRange()', () => {
    const trimResult = {
      firstDetectionIndex: 5,
      lastDetectionIndex: 15,
      totalFrames: 25,
      trimmedFrames: 11,
      efficiency: 44,
    };

    it('should return true for frames in range', () => {
      expect(isFrameInTrimmedRange(5, trimResult)).toBe(true);
      expect(isFrameInTrimmedRange(10, trimResult)).toBe(true);
      expect(isFrameInTrimmedRange(15, trimResult)).toBe(true);
    });

    it('should return false for frames outside range', () => {
      expect(isFrameInTrimmedRange(4, trimResult)).toBe(false);
      expect(isFrameInTrimmedRange(16, trimResult)).toBe(false);
      expect(isFrameInTrimmedRange(0, trimResult)).toBe(false);
      expect(isFrameInTrimmedRange(24, trimResult)).toBe(false);
    });
  });

  describe('absoluteToTrimmedIndex()', () => {
    const trimResult = {
      firstDetectionIndex: 10,
      lastDetectionIndex: 20,
      totalFrames: 30,
      trimmedFrames: 11,
      efficiency: 36.7,
    };

    it('should convert absolute to trimmed index', () => {
      expect(absoluteToTrimmedIndex(10, trimResult)).toBe(0);
      expect(absoluteToTrimmedIndex(15, trimResult)).toBe(5);
      expect(absoluteToTrimmedIndex(20, trimResult)).toBe(10);
    });

    it('should return -1 for frames outside range', () => {
      expect(absoluteToTrimmedIndex(9, trimResult)).toBe(-1);
      expect(absoluteToTrimmedIndex(21, trimResult)).toBe(-1);
    });
  });

  describe('trimmedToAbsoluteIndex()', () => {
    const trimResult = {
      firstDetectionIndex: 10,
      lastDetectionIndex: 20,
      totalFrames: 30,
      trimmedFrames: 11,
      efficiency: 36.7,
    };

    it('should convert trimmed to absolute index', () => {
      expect(trimmedToAbsoluteIndex(0, trimResult)).toBe(10);
      expect(trimmedToAbsoluteIndex(5, trimResult)).toBe(15);
      expect(trimmedToAbsoluteIndex(10, trimResult)).toBe(20);
    });

    it('should return -1 for invalid trimmed indices', () => {
      expect(trimmedToAbsoluteIndex(-1, trimResult)).toBe(-1);
      expect(trimmedToAbsoluteIndex(11, trimResult)).toBe(-1);
    });
  });

  describe('formatTrimEfficiency()', () => {
    it('should format efficiency as string', () => {
      const trimResult = {
        firstDetectionIndex: 5,
        lastDetectionIndex: 15,
        totalFrames: 25,
        trimmedFrames: 11,
        efficiency: 44,
      };

      const formatted = formatTrimEfficiency(trimResult);

      expect(formatted).toBe('11/25 frames (44%)');
    });

    it('should round efficiency percentage', () => {
      const trimResult = {
        firstDetectionIndex: 3,
        lastDetectionIndex: 10,
        totalFrames: 20,
        trimmedFrames: 8,
        efficiency: 40.0, // Exact 40%
      };

      const formatted = formatTrimEfficiency(trimResult);

      expect(formatted).toContain('(40%)');
    });
  });

  describe('getTimelineZone()', () => {
    const trimResult = {
      firstDetectionIndex: 10,
      lastDetectionIndex: 20,
      totalFrames: 30,
      trimmedFrames: 11,
      efficiency: 36.7,
    };

    it('should return pre-ball for frames before first detection', () => {
      expect(getTimelineZone(0, trimResult)).toBe('pre-ball');
      expect(getTimelineZone(5, trimResult)).toBe('pre-ball');
      expect(getTimelineZone(9, trimResult)).toBe('pre-ball');
    });

    it('should return relevant for frames in detection range', () => {
      expect(getTimelineZone(10, trimResult)).toBe('relevant');
      expect(getTimelineZone(15, trimResult)).toBe('relevant');
      expect(getTimelineZone(20, trimResult)).toBe('relevant');
    });

    it('should return post-ball for frames after last detection', () => {
      expect(getTimelineZone(21, trimResult)).toBe('post-ball');
      expect(getTimelineZone(25, trimResult)).toBe('post-ball');
      expect(getTimelineZone(29, trimResult)).toBe('post-ball');
    });
  });
});
