/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for useInference hook
 * 
 * Tests the delivery analysis hook including:
 * - Frame collection and recording
 * - Analysis orchestration
 * - Error handling
 * - State management
 * - Progress tracking
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useInference, getInferenceErrorMessage } from '../../hooks/useInference';
import type { FrameSample, DeliveryResult } from '../../lib/types';
import * as analyzeDeliveryModule from '../../lib/analyzeDelivery';
import { createMockCalibration } from '../testHelpers';

// Mock the analyzeDelivery module
jest.mock('../../lib/analyzeDelivery');
const mockAnalyzeDelivery = analyzeDeliveryModule.analyzeDelivery as jest.MockedFunction<
  typeof analyzeDeliveryModule.analyzeDelivery
>;

// Mock frame sampler
jest.mock('../../lib/detection/frameSampler', () => ({
  sampleFrames: jest.fn((frames: any[]) => frames.filter((_: any, i: number) => i % 2 === 0)),
}));

describe('useInference Hook', () => {
  // Helper to create mock frames
  const createMockFrame = (index: number): FrameSample => ({
    frameIndex: index,
    timestampMs: index * 33.33, // ~30fps
    imageData: new ImageData(100, 100),
  });

  // Helper to create mock result
  const createMockResult = (): DeliveryResult => ({
    speedKmh: 145.5,
    trajectoryPoints: [
      { pixelX: 100, pixelY: 100, estimatedZ: null, timestampMs: 0 },
      { pixelX: 200, pixelY: 150, estimatedZ: null, timestampMs: 33.33 },
    ],
    confidence: 0.93,
    detectionCount: 2,
    warnings: [],
    processingMs: 150,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzeDelivery.mockResolvedValue(createMockResult());
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useInference());

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.isReady).toBe(true);
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.frameCount).toBe(0);
      expect(result.current.progress).toBe(0);
    });

    it('should accept custom configuration', () => {
      const config = {
        targetFrameRate: 15,
        maxFrames: 60,
        useSampling: false,
      };

      const { result } = renderHook(() => useInference(config));

      expect(result.current.isReady).toBe(true);
    });
  });

  describe('Recording', () => {
    it('should start recording and reset state', () => {
      const { result } = renderHook(() => useInference());

      // Set some initial state
      act(() => {
        result.current.addFrame(createMockFrame(0));
      });

      expect(result.current.frameCount).toBe(0); // Not recording yet

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.frameCount).toBe(0);
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
    });

    it('should collect frames when recording', () => {
      const { result } = renderHook(() => useInference());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.addFrame(createMockFrame(0));
        result.current.addFrame(createMockFrame(1));
        result.current.addFrame(createMockFrame(2));
      });

      expect(result.current.frameCount).toBe(3);
    });

    it('should not collect frames when not recording', () => {
      const { result } = renderHook(() => useInference());

      act(() => {
        result.current.addFrame(createMockFrame(0));
        result.current.addFrame(createMockFrame(1));
      });

      expect(result.current.frameCount).toBe(0);
    });

    it('should stop collecting at max frames', () => {
      const { result } = renderHook(() => useInference({ maxFrames: 3 }));

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.addFrame(createMockFrame(0));
        result.current.addFrame(createMockFrame(1));
        result.current.addFrame(createMockFrame(2));
        result.current.addFrame(createMockFrame(3)); // Should be ignored
      });

      expect(result.current.frameCount).toBe(3);
    });
  });

  describe('Analysis', () => {
    it('should analyze frames and return result', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();
      const mockResult = createMockResult();

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.addFrame(createMockFrame(0));
        result.current.addFrame(createMockFrame(1));
      });

      await act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
      });

      expect(mockAnalyzeDelivery).toHaveBeenCalled();
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(100);
    });

    it('should handle analysis with no frames', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();

      await act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      expect(mockAnalyzeDelivery).not.toHaveBeenCalled();
      expect(result.current.error).toContain('No frames collected');
      expect(result.current.result).toBeNull();
    });

    it('should handle analysis errors', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();

      mockAnalyzeDelivery.mockRejectedValue(new Error('Insufficient detections found'));

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.addFrame(createMockFrame(0));
      });

      await act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Insufficient detections');
      });

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.result).toBeNull();
    });

    it('should update progress during analysis', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();

      // Make analysis take some time
      mockAnalyzeDelivery.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(createMockResult()), 50)
        )
      );

      act(() => {
        result.current.startRecording();
        result.current.addFrame(createMockFrame(0));
      });

      let capturedProgress = 0;

      act(() => {
        result.current.stopAndAnalyze(calibration);
      });

      // Wait a bit for progress to update
      await new Promise(resolve => setTimeout(resolve, 10));
      capturedProgress = result.current.progress;

      await waitFor(() => {
        expect(result.current.progress).toBe(100);
      });

      // Progress should have been > 0 at some point
      expect(capturedProgress).toBeGreaterThan(0);
    });

    it('should sample frames when useSampling is true', async () => {
      const { result } = renderHook(() => useInference({ useSampling: true }));
      const calibration = createMockCalibration();

      act(() => {
        result.current.startRecording();
      });

      // Add 10 frames
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addFrame(createMockFrame(i));
        }
      });

      await act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      // Check that analyzeDelivery was called (sampling happens inside)
      expect(mockAnalyzeDelivery).toHaveBeenCalled();
      const callArgs = mockAnalyzeDelivery.mock.calls[0];
      // Sampled frames should be less than original (every 2nd frame)
      expect(callArgs[0].length).toBeLessThan(10);
    });

    it('should not sample frames when useSampling is false', async () => {
      const { result } = renderHook(() => useInference({ useSampling: false }));
      const calibration = createMockCalibration();

      act(() => {
        result.current.startRecording();
      });

      // Add 10 frames
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addFrame(createMockFrame(i));
        }
      });

      await act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      // All frames should be passed to analyzeDelivery
      expect(mockAnalyzeDelivery).toHaveBeenCalled();
      const callArgs = mockAnalyzeDelivery.mock.calls[0];
      expect(callArgs[0].length).toBe(10);
    });
  });

  describe('Reset', () => {
    it('should reset all state', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();

      act(() => {
        result.current.startRecording();
        result.current.addFrame(createMockFrame(0));
      });

      await act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.frameCount).toBe(0);
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
      expect(result.current.isAnalyzing).toBe(false);
    });
  });

  describe('Cancel', () => {
    it('should cancel ongoing analysis', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();

      // Make analyzeDelivery slow
      mockAnalyzeDelivery.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createMockResult()), 1000))
      );

      act(() => {
        result.current.startRecording();
        result.current.addFrame(createMockFrame(0));
      });

      act(() => {
        result.current.stopAndAnalyze(calibration);
      });

      // Cancel immediately
      act(() => {
        result.current.cancel();
      });

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    describe('getInferenceErrorMessage', () => {
      it('should return message for insufficient detections', () => {
        const message = getInferenceErrorMessage(new Error('Insufficient detections found'));
        expect(message).toContain('Could not detect ball');
        expect(message).toContain('lighting');
      });

      it('should return message for calibration errors', () => {
        const message = getInferenceErrorMessage(new Error('Invalid calibration'));
        expect(message).toContain('calibration');
      });

      it('should return message for no frames', () => {
        const message = getInferenceErrorMessage('No frames available');
        expect(message).toContain('No video frames');
      });

      it('should return generic message for unknown errors', () => {
        const message = getInferenceErrorMessage(new Error('Unknown error'));
        expect(message).toContain('Analysis failed');
        expect(message).toContain('Unknown error');
      });

      it('should handle string errors', () => {
        const message = getInferenceErrorMessage('Some error message');
        expect(message).toContain('Analysis failed');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop cycles', () => {
      const { result } = renderHook(() => useInference());

      act(() => {
        result.current.startRecording();
        result.current.addFrame(createMockFrame(0));
        result.current.startRecording(); // Start again
      });

      // Should reset frame count
      expect(result.current.frameCount).toBe(0);
    });

    it('should handle addFrame after stopAndAnalyze', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();

      act(() => {
        result.current.startRecording();
        result.current.addFrame(createMockFrame(0));
      });

      await act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      act(() => {
        result.current.addFrame(createMockFrame(1)); // Should be ignored
      });

      expect(result.current.frameCount).toBe(1); // Still 1 from before
    });

    it('should handle concurrent stopAndAnalyze calls gracefully', async () => {
      const { result } = renderHook(() => useInference());
      const calibration = createMockCalibration();

      act(() => {
        result.current.startRecording();
        result.current.addFrame(createMockFrame(0));
      });

      // Call stopAndAnalyze twice
      const promise1 = act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      const promise2 = act(async () => {
        await result.current.stopAndAnalyze(calibration);
      });

      await Promise.all([promise1, promise2]);

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      // Should complete without errors
      expect(result.current.error).toBeNull();
    });
  });
});
