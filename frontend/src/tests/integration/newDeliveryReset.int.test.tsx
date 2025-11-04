/**
 * Integration Test: New Delivery Reset
 * 
 * Verifies that clicking "New Delivery" button properly resets
 * the CameraView component state via resetTrigger prop.
 * 
 * Bug: Task 11 - Camera feed retained old result overlay
 * Fix: Added resetTrigger prop mechanism
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CameraView } from '@/components/CameraView';
import type { CalibrationProfile, DeliveryResult } from '@/lib/types';
import { createMockCalibration } from '../testHelpers';

// Mock hooks
jest.mock('@/hooks/useCameraFeed');
jest.mock('@/hooks/useInference');
jest.mock('@/hooks/useCameraDiagnostics');
jest.mock('@/components/CameraGuidance', () => ({
  CameraGuidance: () => <div data-testid="camera-guidance">Camera Guidance</div>,
}));

import { useCameraFeed } from '@/hooks/useCameraFeed';
import { useInference } from '@/hooks/useInference';
import { useCameraDiagnostics } from '@/hooks/useCameraDiagnostics';

const mockUseCameraFeed = useCameraFeed as jest.MockedFunction<typeof useCameraFeed>;
const mockUseInference = useInference as jest.MockedFunction<typeof useInference>;
const mockUseCameraDiagnostics = useCameraDiagnostics as jest.MockedFunction<typeof useCameraDiagnostics>;

describe('New Delivery Reset - Integration', () => {
  let mockReset: jest.Mock;
  let mockStartCamera: jest.Mock;
  let mockStopCamera: jest.Mock;
  let mockCaptureFrame: jest.Mock;
  let mockStartRecording: jest.Mock;
  let mockStopAndAnalyze: jest.Mock;
  let mockAddFrame: jest.Mock;
  let mockCancel: jest.Mock;
  let mockUpdateWithFrame: jest.Mock;

  const mockCalibration = createMockCalibration({pitchLengthPixels: 512, ballMassGrams: 156});

  const mockResult: DeliveryResult = {
    speedKmh: 120.5,
    confidence: 0.92,
    detectionCount: 45,
    trajectoryPoints: [],
    processingMs: 842,
    warnings: [],
  };

  beforeEach(() => {
    mockReset = jest.fn();
    mockStartCamera = jest.fn();
    mockStopCamera = jest.fn();
    mockCaptureFrame = jest.fn();
    mockStartRecording = jest.fn();
    mockStopAndAnalyze = jest.fn();
    mockAddFrame = jest.fn();
    mockCancel = jest.fn();
    mockUpdateWithFrame = jest.fn();

    // Mock useCameraFeed
    mockUseCameraFeed.mockReturnValue({
      isActive: true,
      isLoading: false,
      error: null,
      stream: null,
      dimensions: { width: 1280, height: 720 },
      actualFrameRate: 30,
      videoRef: { current: document.createElement('video') },
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    // Mock useCameraDiagnostics
    mockUseCameraDiagnostics.mockReturnValue({
      diagnostics: {
        resolution: { width: 1280, height: 720 },
        reportedFPS: 30,
        inferredFPS: null,
        exposureStatus: 'good',
        meetsRequirements: true,
        requirementIssues: [],
        averageBrightness: 128,
        brightnessVariance: 20,
      },
      updateWithFrame: mockUpdateWithFrame,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reset camera view when resetTrigger increments', async () => {
    // Start with no result
    mockUseInference.mockReturnValue({
      isAnalyzing: false,
      isReady: true,
      result: null,
      error: null,
      frameCount: 0,
      progress: 0,
      startRecording: mockStartRecording,
      stopAndAnalyze: mockStopAndAnalyze,
      addFrame: mockAddFrame,
      reset: mockReset,
      cancel: mockCancel,
    });

    const { rerender } = render(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={0}
      />
    );

    // Verify camera starts
    expect(mockStartCamera).toHaveBeenCalledTimes(1);

    // Simulate analysis complete - update mock to return result
    mockUseInference.mockReturnValue({
      isAnalyzing: false,
      isReady: true,
      result: mockResult,
      error: null,
      frameCount: 45,
      progress: 100,
      startRecording: mockStartRecording,
      stopAndAnalyze: mockStopAndAnalyze,
      addFrame: mockAddFrame,
      reset: mockReset,
      cancel: mockCancel,
    });

    rerender(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={0}
      />
    );

    // Verify result is displayed
    await waitFor(() => {
      expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
    });

    // Increment resetTrigger (simulating parent's handleReset)
    rerender(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={1}
      />
    );

    // Verify reset was called
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  it('should not reset when resetTrigger is 0 (initial mount)', () => {
    mockUseInference.mockReturnValue({
      isAnalyzing: false,
      isReady: true,
      result: null,
      error: null,
      frameCount: 0,
      progress: 0,
      startRecording: mockStartRecording,
      stopAndAnalyze: mockStopAndAnalyze,
      addFrame: mockAddFrame,
      reset: mockReset,
      cancel: mockCancel,
    });

    render(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={0}
      />
    );

    // reset should NOT be called on initial mount with resetTrigger=0
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('should handle multiple resets (incrementing resetTrigger)', async () => {
    mockUseInference.mockReturnValue({
      isAnalyzing: false,
      isReady: true,
      result: null,
      error: null,
      frameCount: 0,
      progress: 0,
      startRecording: mockStartRecording,
      stopAndAnalyze: mockStopAndAnalyze,
      addFrame: mockAddFrame,
      reset: mockReset,
      cancel: mockCancel,
    });

    const { rerender } = render(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={0}
      />
    );

    // First reset
    rerender(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={1}
      />
    );

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    // Second reset
    rerender(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={2}
      />
    );

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(2);
    });

    // Third reset
    rerender(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={3}
      />
    );

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(3);
    });
  });

  it('should not interrupt camera stream during reset', async () => {
    mockUseInference.mockReturnValue({
      isAnalyzing: false,
      isReady: true,
      result: mockResult,
      error: null,
      frameCount: 45,
      progress: 100,
      startRecording: mockStartRecording,
      stopAndAnalyze: mockStopAndAnalyze,
      addFrame: mockAddFrame,
      reset: mockReset,
      cancel: mockCancel,
    });

    const { rerender } = render(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={0}
      />
    );

    // Camera started once
    expect(mockStartCamera).toHaveBeenCalledTimes(1);
    expect(mockStopCamera).not.toHaveBeenCalled();

    // Increment resetTrigger
    rerender(
      <CameraView
        calibration={mockCalibration}
        resetTrigger={1}
      />
    );

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    // Camera should NOT restart (no additional calls to start/stop)
    expect(mockStartCamera).toHaveBeenCalledTimes(1);
    expect(mockStopCamera).not.toHaveBeenCalled();
  });
});
