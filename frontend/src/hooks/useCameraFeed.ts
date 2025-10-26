/**
 * useCameraFeed Hook
 * 
 * Manages camera access, video stream, and frame capture for cricket ball tracking.
 * 
 * Based on plan.md:
 * - Use browser getUserMedia API for camera access
 * - Support mobile camera frame rates (minimum 30 fps)
 * - Handle permission errors gracefully
 * - Provide frame extraction from video stream
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { FrameSample } from '../lib/types';

/**
 * Camera constraints for getUserMedia
 */
export interface CameraConstraints {
  /**
   * Preferred video width (will be constrained by device)
   * @default 1920
   */
  width?: number;

  /**
   * Preferred video height (will be constrained by device)
   * @default 1080
   */
  height?: number;

  /**
   * Preferred frame rate (will be constrained by device)
   * @default 30
   */
  frameRate?: number;

  /**
   * Prefer rear-facing camera (mobile devices)
   * @default true
   */
  facingMode?: 'user' | 'environment';
}

/**
 * Camera feed state
 */
export interface CameraFeedState {
  /**
   * Whether camera is currently active and streaming
   */
  isActive: boolean;

  /**
   * Whether camera initialization is in progress
   */
  isLoading: boolean;

  /**
   * Error message if camera access failed
   */
  error: string | null;

  /**
   * Current video stream (null if not active)
   */
  stream: MediaStream | null;

  /**
   * Video element dimensions
   */
  dimensions: {
    width: number;
    height: number;
  } | null;

  /**
   * Actual frame rate being captured
   */
  actualFrameRate: number | null;
}

/**
 * Camera feed actions
 */
export interface CameraFeedActions {
  /**
   * Start camera feed with given constraints
   */
  startCamera: () => Promise<void>;

  /**
   * Stop camera feed and release resources
   */
  stopCamera: () => void;

  /**
   * Capture current frame as ImageData
   */
  captureFrame: () => FrameSample | null;

  /**
   * Attach video element ref (required for frame capture)
   */
  videoRef: React.RefObject<HTMLVideoElement>;
}

/**
 * Default camera constraints
 */
const DEFAULT_CONSTRAINTS: CameraConstraints = {
  width: 1920,
  height: 1080,
  frameRate: 30,
  facingMode: 'environment', // Rear camera for mobile
};

/**
 * useCameraFeed Hook
 * 
 * Manages camera access and frame capture for delivery analysis.
 * 
 * @param constraints - Camera constraints (optional)
 * @returns Camera feed state and actions
 * 
 * @example
 * ```tsx
 * const { isActive, error, videoRef, startCamera, captureFrame } = useCameraFeed();
 * 
 * useEffect(() => {
 *   startCamera();
 * }, []);
 * 
 * const frame = captureFrame();
 * if (frame) {
 *   // Process frame
 * }
 * ```
 */
export function useCameraFeed(
  constraints: CameraConstraints = DEFAULT_CONSTRAINTS
): CameraFeedState & CameraFeedActions {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [actualFrameRate, setActualFrameRate] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const constraintsRef = useRef<CameraConstraints>(constraints);

  // Keep refs in sync with props/state
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    constraintsRef.current = constraints;
  }, [constraints]);

  /**
   * Start camera feed
   */
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Build media constraints using ref to avoid dependency issues
      const currentConstraints = constraintsRef.current;
      const mediaConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: currentConstraints.width || DEFAULT_CONSTRAINTS.width },
          height: { ideal: currentConstraints.height || DEFAULT_CONSTRAINTS.height },
          frameRate: { ideal: currentConstraints.frameRate || DEFAULT_CONSTRAINTS.frameRate },
          facingMode: currentConstraints.facingMode || DEFAULT_CONSTRAINTS.facingMode,
        },
        audio: false,
      };

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      setIsActive(true);
      setIsLoading(false);
      setStream(mediaStream);

      // Attach stream to video element and extract metadata
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Store and handle the play promise properly
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromiseRef.current = playPromise;
          // Catch any play errors
          playPromise.catch((err) => {
            // Ignore AbortError which happens when quickly pausing
            if (err.name !== 'AbortError') {
              console.error('Video play error:', err);
            }
          });
        }

        // Wait for video metadata to load
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                setDimensions({
                  width: videoRef.current.videoWidth,
                  height: videoRef.current.videoHeight,
                });

                // Extract actual frame rate from video track
                const videoTrack = mediaStream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                if (settings.frameRate) {
                  setActualFrameRate(settings.frameRate);
                }
              }
              resolve();
            };
          } else {
            resolve();
          }
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      setIsActive(false);
      setIsLoading(false);
      console.error('Camera access error:', err);
    }
  }, []); // No dependencies - uses constraintsRef instead

  /**
   * Stop camera feed and release resources
   */
  const stopCamera = useCallback(() => {
    // Handle pending play promise before pausing
    if (videoRef.current && playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (videoRef.current) {
            videoRef.current.pause();
          }
        })
        .catch(() => {
          // Ignore play promise errors (already caught in startCamera)
        });
      playPromiseRef.current = null;
    } else if (videoRef.current) {
      // No pending play promise, safe to pause directly
      try {
        videoRef.current.pause();
      } catch {
        // Ignore errors when pausing
      }
    }

    // Use streamRef to avoid dependency on stream state
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setDimensions(null);
    setActualFrameRate(null);
    frameCountRef.current = 0;
    lastFrameTimeRef.current = 0;
  }, []); // Empty deps - uses refs instead of state

  /**
   * Capture current frame as ImageData
   */
  const captureFrame = useCallback((): FrameSample | null => {
    const video = videoRef.current;

    if (!video || !isActive || video.readyState < 2) {
      return null;
    }

    // Create canvas if not exists
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Extract ImageData
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Calculate timestamp and frame index
    const currentTime = performance.now();
    const timestampMs = Math.round(currentTime);

    // Track frame time for internal use (don't update state here to avoid re-renders)
    lastFrameTimeRef.current = currentTime;

    const frameSample: FrameSample = {
      frameIndex: frameCountRef.current++,
      timestampMs,
      imageData,
    };

    return frameSample;
  }, [isActive]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Handle play promise if pending
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore errors during cleanup
        });
      }
      
      // Cleanup directly using ref to avoid dependency issues
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    // State
    isActive,
    isLoading,
    error,
    stream,
    dimensions,
    actualFrameRate,

    // Actions
    startCamera,
    stopCamera,
    captureFrame,
    videoRef,
  };
}

/**
 * Get user-friendly error message for camera errors
 */
export function getCameraErrorMessage(error: Error | DOMException): string {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Camera access denied. Please grant camera permission in your browser settings.';
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No camera found. Please ensure your device has a working camera.';
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'Camera is in use by another application. Please close other apps using the camera.';
  }

  if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
    return 'Camera does not support the requested settings. Try with default settings.';
  }

  if (error.name === 'TypeError') {
    return 'Camera access not supported in this browser. Please use a modern browser.';
  }

  if (error.name === 'AbortError') {
    return 'Camera access was aborted. Please try again.';
  }

  return error.message || 'Failed to access camera. Please try again.';
}

/**
 * Check if camera access is supported in current browser
 */
export function isCameraSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof HTMLVideoElement !== 'undefined'
  );
}

/**
 * Request camera permissions (prompt user)
 * This is a helper to check permissions before actually starting camera
 */
export async function checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt'; // Permissions API not supported, assume prompt
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state;
  } catch {
    return 'prompt'; // Permissions query not supported for camera
  }
}
