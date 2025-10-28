/**
 * Unit tests for useAutoStop hook
 * 
 * Tests auto-stop detection logic:
 * - Consecutive empty frame counting
 * - Reset on ball detection
 * - Threshold triggering
 * - Minimum frames requirement
 * - Safety timeout
 * - Progress calculation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useAutoStop,
  getRecommendedThreshold,
  formatFramesAsTime,
  AUTO_STOP_PRESETS,
} from '@/hooks/useAutoStop';

describe('useAutoStop', () => {
  describe('Basic Frame Counting', () => {
    it('counts consecutive empty frames', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 30, minFrames: 10, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false); // no detection
      });

      expect(result.current.state.consecutiveEmptyFrames).toBe(1);
      expect(result.current.state.totalFrames).toBe(1);
      expect(result.current.state.framesRemaining).toBe(29);

      act(() => {
        result.current.onFrame(false); // no detection
      });

      expect(result.current.state.consecutiveEmptyFrames).toBe(2);
      expect(result.current.state.totalFrames).toBe(2);
      expect(result.current.state.framesRemaining).toBe(28);
    });

    it('increments total frames regardless of detection', () => {
      const { result } = renderHook(() => useAutoStop());

      act(() => {
        result.current.onFrame(true); // with detection
        result.current.onFrame(true);
        result.current.onFrame(false); // no detection
        result.current.onFrame(true);
      });

      expect(result.current.state.totalFrames).toBe(4);
    });

    it('resets consecutive empty frames when ball detected', () => {
      const { result } = renderHook(() => useAutoStop());

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
      });

      expect(result.current.state.consecutiveEmptyFrames).toBe(3);

      act(() => {
        result.current.onFrame(true); // ball detected
      });

      expect(result.current.state.consecutiveEmptyFrames).toBe(0);
      expect(result.current.state.totalFrames).toBe(4); // total continues
      expect(result.current.state.framesRemaining).toBe(30); // reset to threshold
    });
  });

  describe('Auto-Stop Triggering', () => {
    it('triggers auto-stop at threshold', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 3, minFrames: 1, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
      });

      expect(result.current.state.shouldStop).toBe(false);

      act(() => {
        result.current.onFrame(false); // 3rd empty frame
      });

      expect(result.current.state.shouldStop).toBe(true);
      expect(result.current.state.reason).toBe('auto-stop');
    });

    it('respects minimum frames before auto-stop', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 3, minFrames: 10, safetyTimeout: 10000 })
      );

      // Send frames with detection first
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.onFrame(true);
        }
      });

      // Then send empty frames
      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
      });

      // Total is 8, min is 10, so should NOT stop
      expect(result.current.state.totalFrames).toBe(8);
      expect(result.current.state.consecutiveEmptyFrames).toBe(3);
      expect(result.current.state.shouldStop).toBe(false);

      // Add 2 more frames to reach minimum
      act(() => {
        result.current.onFrame(true);
        result.current.onFrame(true);
      });

      // Now at 10 frames, but consecutive reset, so need 3 more empty
      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
      });

      expect(result.current.state.totalFrames).toBe(13);
      expect(result.current.state.shouldStop).toBe(true);
    });

    it('does not trigger if disabled', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: false, threshold: 3, minFrames: 1, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
      });

      expect(result.current.state.shouldStop).toBe(false);
      expect(result.current.state.totalFrames).toBe(0); // doesn't count when disabled
    });
  });

  describe('Progress Calculation', () => {
    it('calculates countdown progress correctly', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 10, minFrames: 1, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false);
      });
      expect(result.current.state.countdownProgress).toBe(0.1); // 1/10

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
      });
      expect(result.current.state.countdownProgress).toBe(0.5); // 5/10

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
      });
      expect(result.current.state.countdownProgress).toBe(1.0); // 10/10
    });

    it('resets progress when ball reappears', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 10, minFrames: 1, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(false);
      });
      expect(result.current.state.countdownProgress).toBe(0.3);

      act(() => {
        result.current.onFrame(true); // ball detected
      });
      expect(result.current.state.countdownProgress).toBe(0); // reset
    });
  });

  describe('Safety Timeout', () => {
    it('triggers timeout after specified duration', async () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 100, minFrames: 1, safetyTimeout: 100 })
      );

      act(() => {
        result.current.startTimeout();
      });

      // Keep detecting ball (should not auto-stop based on frames)
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.onFrame(true);
        }
      });

      expect(result.current.state.shouldStop).toBe(false);

      // Wait for timeout
      await waitFor(
        () => {
          expect(result.current.state.shouldStop).toBe(true);
          expect(result.current.state.reason).toBe('timeout');
        },
        { timeout: 200 }
      );
    });

    it('clears timeout when stopped', async () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 100, minFrames: 1, safetyTimeout: 100 })
      );

      act(() => {
        result.current.startTimeout();
      });

      // Stop timeout before it fires
      act(() => {
        result.current.stopTimeout();
      });

      // Wait longer than timeout duration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should NOT have triggered
      expect(result.current.state.shouldStop).toBe(false);
    });

    it('clears timeout on reset', async () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 100, minFrames: 1, safetyTimeout: 100 })
      );

      act(() => {
        result.current.startTimeout();
        result.current.onFrame(true);
        result.current.onFrame(true);
      });

      act(() => {
        result.current.reset();
      });

      // Wait longer than timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should NOT have triggered
      expect(result.current.state.shouldStop).toBe(false);
      expect(result.current.state.totalFrames).toBe(0);
      expect(result.current.state.consecutiveEmptyFrames).toBe(0);
    });
  });

  describe('Reset Functionality', () => {
    it('resets all state to initial values', () => {
      const { result } = renderHook(() => useAutoStop({ threshold: 30 }));

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
        result.current.onFrame(true);
        result.current.onFrame(false);
      });

      expect(result.current.state.totalFrames).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toEqual({
        isActive: false,
        consecutiveEmptyFrames: 0,
        totalFrames: 0,
        shouldStop: false,
        countdownProgress: 0,
        reason: null,
        framesRemaining: 30,
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very short threshold (1 frame)', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 1, minFrames: 1, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false);
      });

      expect(result.current.state.shouldStop).toBe(true);
      expect(result.current.state.consecutiveEmptyFrames).toBe(1);
    });

    it('handles alternating detections correctly', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 3, minFrames: 1, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false); // 1
        result.current.onFrame(true); // reset
        result.current.onFrame(false); // 1
        result.current.onFrame(true); // reset
        result.current.onFrame(false); // 1
        result.current.onFrame(false); // 2
        result.current.onFrame(false); // 3
      });

      expect(result.current.state.shouldStop).toBe(true);
      expect(result.current.state.totalFrames).toBe(7);
    });

    it('maintains shouldStop=true after triggered', () => {
      const { result } = renderHook(() =>
        useAutoStop({ enabled: true, threshold: 2, minFrames: 1, safetyTimeout: 10000 })
      );

      act(() => {
        result.current.onFrame(false);
        result.current.onFrame(false);
      });

      expect(result.current.state.shouldStop).toBe(true);

      // Send more frames - should stay true
      act(() => {
        result.current.onFrame(true);
        result.current.onFrame(false);
      });

      expect(result.current.state.shouldStop).toBe(true);
    });
  });
});

describe('Helper Functions', () => {
  describe('getRecommendedThreshold', () => {
    it('returns 60 for 60+ FPS', () => {
      expect(getRecommendedThreshold(60)).toBe(60);
      expect(getRecommendedThreshold(120)).toBe(60);
    });

    it('returns 30 for 30-59 FPS', () => {
      expect(getRecommendedThreshold(30)).toBe(30);
      expect(getRecommendedThreshold(45)).toBe(30);
    });

    it('returns 15 for <30 FPS', () => {
      expect(getRecommendedThreshold(15)).toBe(15);
      expect(getRecommendedThreshold(24)).toBe(15);
      expect(getRecommendedThreshold(10)).toBe(15);
    });
  });

  describe('formatFramesAsTime', () => {
    it('formats frames as seconds at 30 FPS', () => {
      expect(formatFramesAsTime(30, 30)).toBe('1.0s');
      expect(formatFramesAsTime(15, 30)).toBe('0.5s');
      expect(formatFramesAsTime(60, 30)).toBe('2.0s');
    });

    it('formats frames as seconds at 60 FPS', () => {
      expect(formatFramesAsTime(60, 60)).toBe('1.0s');
      expect(formatFramesAsTime(30, 60)).toBe('0.5s');
    });

    it('uses default 30 FPS if not specified', () => {
      expect(formatFramesAsTime(30)).toBe('1.0s');
      expect(formatFramesAsTime(15)).toBe('0.5s');
    });
  });

  describe('AUTO_STOP_PRESETS', () => {
    it('has correct preset values', () => {
      expect(AUTO_STOP_PRESETS.quick.threshold).toBe(15);
      expect(AUTO_STOP_PRESETS.normal.threshold).toBe(30);
      expect(AUTO_STOP_PRESETS.patient.threshold).toBe(60);
    });

    it('has descriptive names and descriptions', () => {
      expect(AUTO_STOP_PRESETS.quick.name).toBe('Quick');
      expect(AUTO_STOP_PRESETS.normal.description).toContain('Recommended');
      expect(AUTO_STOP_PRESETS.patient.description).toContain('slow-motion');
    });
  });
});
