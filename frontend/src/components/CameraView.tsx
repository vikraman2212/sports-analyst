/**
 * CameraView Component
 * 
 * Main camera interface for recording cricket ball deliveries.
 * 
 * Integrates:
 * - useCameraFeed: Camera access and frame capture
 * - useInference: Ball detection and speed analysis
 * 
 * User flow:
 * 1. Grant camera permission
 * 2. Position camera to capture pitch
 * 3. Start recording delivery
 * 4. Stop recording to analyze
 * 5. View results (speed + trajectory)
 * 6. Reset for next delivery
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCameraFeed } from '../hooks/useCameraFeed';
import { useInference } from '../hooks/useInference';
import { useCameraDiagnostics } from '../hooks/useCameraDiagnostics';
import { CameraGuidance } from './CameraGuidance';
import { CameraCalibrator } from './CameraCalibrator';
import { CameraSettings } from './CameraSettings';
import type { CalibrationProfile, CameraConstraints, DeliveryResult } from '../lib/types';

export interface CameraViewProps {
  /**
   * Calibration profile for pixel-to-meter conversion
   * Required for accurate speed calculation
   */
  calibration: CalibrationProfile;

  /**
   * Callback when analysis completes successfully
   */
  onAnalysisComplete?: (result: DeliveryResult) => void;

  /**
   * Callback when analysis fails
   */
  onAnalysisError?: (error: string) => void;

  /**
   * Callback when recording starts
   */
  onRecordingStart?: () => void;

  /**
   * Callback when recording stops
   */
  onRecordingStop?: () => void;

  /**
   * Callback when calibration completes
   */
  onCalibrationComplete?: (pitchLengthPixels: number) => void;

  /**
   * Whether calibration mode is active
   */
  isCalibrating?: boolean;

  /**
   * Callback when calibration is cancelled
   */
  onCancelCalibration?: () => void;

  /**
   * Pitch length in meters for calibration
   */
  pitchLengthMeters?: number;

  /**
   * Callback when user requests calibration from camera guidance
   */
  onRequestCalibration?: () => void;

  /**
   * Callback when user requests camera settings adjustment
   */
  onRequestSettings?: () => void;

  /**
   * Whether camera settings panel is open
   */
  isSettingsOpen?: boolean;

  /**
   * Callback when camera settings panel should close
   */
  onCloseSettings?: () => void;

  /**
   * Callback when camera settings are changed
   * Used to save settings to calibration profile
   */
  onCameraSettingsChanged?: (settings: CameraConstraints) => void;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Reset trigger - increment this value to reset camera view state
   * Allows parent component to trigger reset without direct state access
   */
  resetTrigger?: number;
}

/**
 * CameraView Component
 * 
 * Responsive camera interface with recording controls.
 * Shows live video feed with overlay controls.
 */
export function CameraView({
  calibration,
  onAnalysisComplete,
  onAnalysisError,
  onRecordingStart,
  onRecordingStop,
  onCalibrationComplete,
  isCalibrating = false,
  onCancelCalibration,
  pitchLengthMeters = 20.12,
  onRequestCalibration,
  onRequestSettings,
  isSettingsOpen = false,
  onCloseSettings,
  onCameraSettingsChanged,
  className = '',
  resetTrigger = 0,
}: CameraViewProps) {
  // Camera feed hook - Use saved settings from calibration profile, or defaults
  // Defaults prefer high quality: 60 FPS, 1080p, rear camera
  // But will gracefully fall back if device doesn't support it
  const {
    isActive: isCameraActive,
    isLoading: isCameraLoading,
    error: cameraError,
    stream,
    videoRef,
    startCamera,
    stopCamera,
    captureFrame,
  } = useCameraFeed({
    width: calibration?.cameraSettings?.width || 1920,
    height: calibration?.cameraSettings?.height || 1080,
    frameRate: calibration?.cameraSettings?.frameRate || 60, // Prefer 60 FPS, fallback if unsupported
    facingMode: calibration?.cameraSettings?.facingMode || 'environment',
  });

  // Camera diagnostics hook
  const { diagnostics, updateWithFrame } = useCameraDiagnostics(stream);

  // Inference hook
  const {
    isAnalyzing,
    result,
    error: inferenceError,
    frameCount,
    progress,
    startRecording,
    stopAndAnalyze,
    addFrame,
    reset,
  } = useInference({
    targetFrameRate: 30,
    maxFrames: 90, // ~3 seconds at 30fps
  });

  // Recording state
  const isRecording = useRef(false);
  const recordingInterval = useRef<number | null>(null);

  /**
   * Initialize camera on mount
   */
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  /**
   * Watch for resetTrigger changes from parent
   * Allows parent component (page.tsx) to reset this component's state
   */
  useEffect(() => {
    if (resetTrigger > 0) {
      reset();
    }
  }, [resetTrigger, reset]);

  /**
   * Frame capture loop during recording
   */
  const captureLoop = useCallback(() => {
    if (!isRecording.current) return;

    const frame = captureFrame();
    if (frame) {
      addFrame(frame);
      // Update diagnostics with captured frame
      updateWithFrame(frame.imageData, frame.timestampMs);
    }

    // Continue capturing at ~30fps
    recordingInterval.current = window.setTimeout(captureLoop, 33);
  }, [captureFrame, addFrame, updateWithFrame]);

  /**
   * Start recording delivery
   */
  const handleStartRecording = useCallback(() => {
    if (!isCameraActive) {
      return;
    }

    isRecording.current = true;
    startRecording();
    captureLoop();
    onRecordingStart?.();
  }, [isCameraActive, startRecording, captureLoop, onRecordingStart]);

  /**
   * Stop recording and analyze
   */
  const handleStopRecording = useCallback(async () => {
    isRecording.current = false;

    if (recordingInterval.current !== null) {
      clearTimeout(recordingInterval.current);
      recordingInterval.current = null;
    }

    onRecordingStop?.();

    // Run analysis
    try {
      await stopAndAnalyze(calibration);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      onAnalysisError?.(errorMessage);
    }
  }, [stopAndAnalyze, calibration, onRecordingStop, onAnalysisError]);

  /**
   * Reset for next delivery
   */
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  /**
   * Notify parent when analysis completes
   */
  useEffect(() => {
    if (result && !isAnalyzing) {
      onAnalysisComplete?.(result);
    }
  }, [result, isAnalyzing, onAnalysisComplete]);

  /**
   * Notify parent of inference errors
   */
  useEffect(() => {
    if (inferenceError) {
      onAnalysisError?.(inferenceError);
    }
  }, [inferenceError, onAnalysisError]);

  // Determine current state for UI
  const hasResult = result && !isAnalyzing;
  const hasError = cameraError || inferenceError;
  const canRecord = isCameraActive && !isRecording.current && !isAnalyzing && !hasResult;
  const canStop = isRecording.current && !isAnalyzing;

  return (
    <div className={`camera-view ${className}`}>
      {/* Video Container */}
      <div className="camera-view__video-container" role="region" aria-label="Cricket ball camera view">
        <video
          ref={videoRef}
          className="camera-view__video"
          autoPlay
          playsInline
          muted
          aria-label="Live camera feed for ball tracking"
        />

        {/* Loading Overlay */}
        {isCameraLoading && (
          <div className="camera-view__overlay camera-view__overlay--loading">
            <div className="camera-view__spinner" />
            <p className="camera-view__message">Starting camera...</p>
          </div>
        )}

        {/* Camera Guidance Overlay */}
        {isCameraActive && !isRecording.current && !isAnalyzing && !hasResult && !hasError && !isCalibrating && (
          <div className="camera-view__guidance-overlay">
            <CameraGuidance 
              diagnostics={diagnostics} 
              showTechnicalDetails 
              onOpenCalibration={onRequestCalibration}
              onOpenSettings={onRequestSettings}
            />
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording.current && !isAnalyzing && (
          <div className="camera-view__overlay camera-view__overlay--recording" role="status" aria-live="polite">
            <div className="camera-view__recording-indicator">
              <span className="camera-view__recording-dot" aria-hidden="true" />
              <span className="camera-view__recording-text">
                Recording ({frameCount} frames)
              </span>
            </div>
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="camera-view__overlay camera-view__overlay--analyzing" role="status" aria-live="polite" aria-busy="true">
            <div className="camera-view__progress-container">
              <div className="camera-view__spinner" aria-hidden="true" />
              <p className="camera-view__message">Analyzing delivery...</p>
              <div className="camera-view__progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Analysis progress">
                <div
                  className="camera-view__progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="camera-view__progress-text" aria-live="polite">{progress}%</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {hasError && !isAnalyzing && (
          <div className="camera-view__overlay camera-view__overlay--error" role="alert" aria-live="assertive">
            <div className="camera-view__error-container">
              <div className="camera-view__error-icon" aria-hidden="true">⚠️</div>
              <h3 className="camera-view__error-title">Error</h3>
              <p className="camera-view__error-message">
                {cameraError || inferenceError}
              </p>
              {cameraError && (
                <button
                  onClick={startCamera}
                  className="camera-view__button camera-view__button--retry"
                >
                  Retry Camera Access
                </button>
              )}
              {inferenceError && !cameraError && (
                <button
                  onClick={handleReset}
                  className="camera-view__button camera-view__button--retry"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result Display */}
        {hasResult && (
          <div className="camera-view__overlay camera-view__overlay--result" role="status" aria-live="polite">
            <div className="camera-view__result-container">
              <div className="camera-view__result-icon" aria-hidden="true">✓</div>
              <h3 className="camera-view__result-title">Analysis Complete</h3>
              <div className="camera-view__result-speed" aria-label={`Ball speed: ${result.speedKmh.toFixed(1)} kilometers per hour`}>
                {result.speedKmh.toFixed(1)}
                <span className="camera-view__result-unit" aria-hidden="true">km/h</span>
              </div>
              <div className="camera-view__result-meta">
                <span>
                  Detections: {result.detectionCount}
                </span>
                <span>
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              {result.warnings && result.warnings.length > 0 && (
                <div className="camera-view__warnings">
                  {result.warnings.map((warning, idx) => (
                    <p key={idx} className="camera-view__warning">
                      ⚠️ {warning}
                    </p>
                  ))}
                </div>
              )}
              <button
                onClick={handleReset}
                className="camera-view__button camera-view__button--reset"
              >
                Record Next Delivery
              </button>
            </div>
          </div>
        )}

        {/* Calibration Overlay */}
        {isCalibrating && videoRef.current && (
          <CameraCalibrator
            videoRef={videoRef}
            pitchLengthMeters={pitchLengthMeters}
            onCalibrationComplete={onCalibrationComplete || (() => {})}
            onCancel={onCancelCalibration || (() => {})}
          />
        )}

        {/* Camera Settings Overlay */}
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md">
              <CameraSettings
                stream={stream}
                initialSettings={calibration?.cameraSettings ?? null}
                onClose={onCloseSettings || (() => {})}
                onSettingsChanged={onCameraSettingsChanged}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="camera-view__controls" role="toolbar" aria-label="Recording controls">
        {canRecord && (
          <button
            onClick={handleStartRecording}
            className="camera-view__button camera-view__button--record"
            disabled={!canRecord}
            aria-label="Start recording cricket ball delivery"
          >
            Start Recording
          </button>
        )}

        {canStop && (
          <button
            onClick={handleStopRecording}
            className="camera-view__button camera-view__button--stop"
            aria-label="Stop recording and analyze ball speed"
          >
            Stop & Analyze
          </button>
        )}

        {(hasResult || hasError) && (
          <button
            onClick={handleReset}
            className="camera-view__button camera-view__button--reset"
            aria-label="Reset and prepare for next delivery"
          >
            Reset
          </button>
        )}
      </div>

      {/* Info Bar */}
      <div className="camera-view__info">
        <span className="camera-view__info-item">
          Status: {
            isRecording.current ? 'Recording' :
            isAnalyzing ? 'Analyzing' :
            hasResult ? 'Complete' :
            hasError ? 'Error' :
            isCameraActive ? 'Ready' :
            'Starting...'
          }
        </span>
        {isCameraActive && !isRecording.current && !isAnalyzing && !hasResult && (
          <span className="camera-view__info-item camera-view__info-item--tip">
            💡 Position camera to capture the full pitch
          </span>
        )}
      </div>

      <style jsx>{`
        .camera-view {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: #000;
        }

        .camera-view__video-container {
          position: relative;
          flex: 1;
          width: 100%;
          overflow: hidden;
          background: #000;
        }

        .camera-view__video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-view__guidance-overlay {
          position: absolute;
          top: 1rem;
          left: 1rem;
          right: 1rem;
          max-width: 400px;
          z-index: 10;
          pointer-events: auto;
        }

        @media (max-width: 640px) {
          .camera-view__guidance-overlay {
            position: fixed;
            top: env(safe-area-inset-top, 0.5rem);
            left: 0.5rem;
            right: 0.5rem;
            bottom: auto;
            z-index: 40;
            max-width: none;
          }
        }

        .camera-view__overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 1rem;
        }

        .camera-view__overlay--loading {
          background: rgba(0, 0, 0, 0.8);
        }

        .camera-view__overlay--recording {
          background: transparent;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 1rem;
        }

        .camera-view__overlay--analyzing {
          background: rgba(0, 0, 0, 0.9);
        }

        .camera-view__overlay--error {
          background: rgba(139, 0, 0, 0.9);
        }

        .camera-view__overlay--result {
          background: rgba(0, 100, 0, 0.9);
        }

        .camera-view__spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .camera-view__message {
          margin-top: 1rem;
          font-size: 1rem;
          text-align: center;
        }

        .camera-view__recording-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(220, 20, 60, 0.9);
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-weight: 600;
        }

        .camera-view__recording-dot {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .camera-view__recording-text {
          color: white;
          font-size: 0.9rem;
        }

        .camera-view__progress-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
          max-width: 300px;
        }

        .camera-view__progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 999px;
          overflow: hidden;
        }

        .camera-view__progress-fill {
          height: 100%;
          background: white;
          transition: width 0.3s ease;
        }

        .camera-view__progress-text {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .camera-view__error-container,
        .camera-view__result-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }

        .camera-view__error-icon,
        .camera-view__result-icon {
          font-size: 3rem;
        }

        .camera-view__error-title,
        .camera-view__result-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .camera-view__error-message {
          max-width: 400px;
          line-height: 1.5;
        }

        .camera-view__result-speed {
          font-size: 4rem;
          font-weight: 700;
          line-height: 1;
        }

        .camera-view__result-unit {
          font-size: 1.5rem;
          font-weight: 400;
          margin-left: 0.5rem;
        }

        .camera-view__result-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .camera-view__warnings {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          max-width: 400px;
        }

        .camera-view__warning {
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid rgba(255, 193, 7, 0.5);
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          text-align: left;
        }

        .camera-view__controls {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          justify-content: center;
          background: rgba(0, 0, 0, 0.9);
        }

        .camera-view__button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 150px;
        }

        .camera-view__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .camera-view__button--record {
          background: #dc143c;
          color: white;
        }

        .camera-view__button--record:hover:not(:disabled) {
          background: #b8102d;
        }

        .camera-view__button--stop {
          background: #ffa500;
          color: white;
        }

        .camera-view__button--stop:hover {
          background: #e69500;
        }

        .camera-view__button--reset,
        .camera-view__button--retry {
          background: #4a4a4a;
          color: white;
        }

        .camera-view__button--reset:hover,
        .camera-view__button--retry:hover {
          background: #333;
        }

        .camera-view__info {
          display: flex;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.95);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .camera-view__info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .camera-view__info-item--tip {
          color: rgba(255, 193, 7, 0.9);
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .camera-view__result-speed {
            font-size: 3rem;
          }

          .camera-view__button {
            min-width: 120px;
            padding: 0.65rem 1.25rem;
          }

          .camera-view__controls {
            gap: 0.5rem;
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
