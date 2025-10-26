/**
 * Tests for useCameraFeed Hook
 * 
 * Tests camera access, stream management, and frame capture
 * 
 * Note: Uses mocks for browser APIs (getUserMedia, MediaStream, etc.)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCameraFeed, getCameraErrorMessage, isCameraSupported, checkCameraPermission } from '../../hooks/useCameraFeed';

// Mock MediaStream and related APIs
class MockMediaStream {
  private tracks: MockMediaStreamTrack[] = [];

  constructor(tracks: MockMediaStreamTrack[]) {
    this.tracks = tracks;
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video');
  }

  addTrack(track: MockMediaStreamTrack) {
    this.tracks.push(track);
  }
}

class MockMediaStreamTrack {
  kind: string;
  enabled: boolean = true;
  private stopped: boolean = false;

  constructor(kind: string) {
    this.kind = kind;
  }

  stop() {
    this.stopped = true;
    this.enabled = false;
  }

  isStopped() {
    return this.stopped;
  }

  getSettings() {
    return {
      frameRate: 30,
      width: 1920,
      height: 1080,
    };
  }
}

  class MockHTMLVideoElement {
    srcObject: MediaStream | null = null;
    videoWidth = 1920;
    videoHeight = 1080;
    readyState = 4; // HAVE_ENOUGH_DATA
    private _onloadedmetadata: (() => void) | null = null;

    set onloadedmetadata(callback: (() => void) | null) {
      this._onloadedmetadata = callback;
      // Trigger callback synchronously (metadata already "loaded" in our mock)
      if (callback) {
        callback();
      }
    }

    get onloadedmetadata() {
      return this._onloadedmetadata;
    }

    play = jest.fn().mockResolvedValue(undefined);
  }

describe('useCameraFeed Hook', () => {
  let mockGetUserMedia: jest.Mock;
  let mockVideoElement: MockHTMLVideoElement;
  let mockStream: MockMediaStream;

  beforeEach(() => {
    // Reset mocks
    mockVideoElement = new MockHTMLVideoElement();
    const mockTrack = new MockMediaStreamTrack('video');
    mockStream = new MockMediaStream([mockTrack]);

    mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement;
        const mockContext = {
          drawImage: jest.fn(),
          getImageData: jest.fn().mockReturnValue(
            new ImageData(1920, 1080)
          ),
        };
        jest.spyOn(canvas, 'getContext').mockReturnValue(mockContext as any);
        return canvas;
      }
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with inactive state', () => {
      const { result } = renderHook(() => useCameraFeed());

      expect(result.current.isActive).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.stream).toBeNull();
      expect(result.current.dimensions).toBeNull();
    });

    it('should provide videoRef', () => {
      const { result } = renderHook(() => useCameraFeed());

      expect(result.current.videoRef).toBeDefined();
      expect(result.current.videoRef.current).toBeNull();
    });
  });

  describe('Camera Start', () => {
    it('should start camera successfully', async () => {
      const { result } = renderHook(() => useCameraFeed());

      // Set the video element on the ref's current property (don't replace the ref)
      (result.current.videoRef as any).current = mockVideoElement;

      // Start camera
      result.current.startCamera();

      // Wait for all state updates to complete
      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.stream).toBe(mockStream);
        expect(result.current.dimensions).toEqual({ width: 1920, height: 1080 });
      });
    });

    it('should request camera with correct constraints', async () => {
      const constraints = {
        width: 1280,
        height: 720,
        frameRate: 60,
        facingMode: 'user' as const,
      };

      const { result } = renderHook(() => useCameraFeed(constraints));
      (result.current.videoRef as any).current = mockVideoElement;

      await act(async () => {
        await result.current.startCamera();
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60 },
          facingMode: 'user',
        },
        audio: false,
      });
    });

    it('should set loading state during camera start', async () => {
      const { result } = renderHook(() => useCameraFeed());
      (result.current.videoRef as any).current = mockVideoElement;

      // Check initial state
      expect(result.current.isLoading).toBe(false);

      // Start camera
      result.current.startCamera();

      // Wait for camera to finish starting
      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle camera access denied error', async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useCameraFeed());

      await act(async () => {
        await result.current.startCamera();
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle camera not found error', async () => {
      const error = new Error('No camera found');
      error.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useCameraFeed());

      await act(async () => {
        await result.current.startCamera();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should handle unsupported browser', async () => {
      // Remove getUserMedia support
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useCameraFeed());

      await act(async () => {
        await result.current.startCamera();
      });

      await waitFor(() => {
        expect(result.current.error).toContain('not supported');
      });
    });
  });

  describe('Camera Stop', () => {
    it('should stop camera and release resources', async () => {
      const { result } = renderHook(() => useCameraFeed());
      (result.current.videoRef as any).current = mockVideoElement;

      // Start camera first
      await act(async () => {
        await result.current.startCamera();
      });

      await act(async () => {
        if (mockVideoElement.onloadedmetadata) {
          mockVideoElement.onloadedmetadata();
        }
      });

      // Stop camera
      act(() => {
        result.current.stopCamera();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.stream).toBeNull();
      expect(mockVideoElement.srcObject).toBeNull();

      // Check tracks are stopped
      const tracks = mockStream.getTracks();
      tracks.forEach((track: any) => {
        expect(track.isStopped()).toBe(true);
      });
    });

    it('should handle stop when camera not started', () => {
      const { result } = renderHook(() => useCameraFeed());

      expect(() => {
        act(() => {
          result.current.stopCamera();
        });
      }).not.toThrow();
    });
  });

  describe('Frame Capture', () => {
    it('should capture frame when camera is active', async () => {
      const { result } = renderHook(() => useCameraFeed());
      (result.current.videoRef as any).current = mockVideoElement;

      result.current.startCamera();

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      let frame: any = null;
      act(() => {
        frame = result.current.captureFrame();
      });

      expect(frame).not.toBeNull();
      expect(frame).toHaveProperty('frameIndex');
      expect(frame).toHaveProperty('timestampMs');
      expect(frame).toHaveProperty('imageData');
      expect(frame.frameIndex).toBe(0);
    });

    it('should return null when camera is not active', () => {
      const { result } = renderHook(() => useCameraFeed());

      let frame: any;
      act(() => {
        frame = result.current.captureFrame();
      });

      expect(frame).toBeNull();
    });

    it('should increment frame index on successive captures', async () => {
      const { result } = renderHook(() => useCameraFeed());
      (result.current.videoRef as any).current = mockVideoElement;

      result.current.startCamera();

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      let frame1: any, frame2: any, frame3: any;
      
      act(() => {
        frame1 = result.current.captureFrame();
        frame2 = result.current.captureFrame();
        frame3 = result.current.captureFrame();
      });

      expect(frame1.frameIndex).toBe(0);
      expect(frame2.frameIndex).toBe(1);
      expect(frame3.frameIndex).toBe(2);
    });

    it('should return null when video is not ready', async () => {
      const { result } = renderHook(() => useCameraFeed());
      
      const notReadyVideo = new MockHTMLVideoElement();
      notReadyVideo.readyState = 0; // HAVE_NOTHING
      (result.current.videoRef as any).current = notReadyVideo;

      await act(async () => {
        await result.current.startCamera();
      });

      let frame: any;
      act(() => {
        frame = result.current.captureFrame();
      });

      expect(frame).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useCameraFeed());
      (result.current.videoRef as any).current = mockVideoElement;

      result.current.startCamera();

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      unmount();

      // Verify tracks are stopped
      const tracks = mockStream.getTracks();
      tracks.forEach((track: any) => {
        expect(track.isStopped()).toBe(true);
      });
    });
  });
});

describe('Helper Functions', () => {
  describe('getCameraErrorMessage', () => {
    it('should return message for permission denied', () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      const message = getCameraErrorMessage(error);
      expect(message).toContain('denied');
    });

    it('should return message for camera not found', () => {
      const error = new Error('No camera');
      error.name = 'NotFoundError';
      const message = getCameraErrorMessage(error);
      expect(message).toContain('No camera found');
    });

    it('should return message for camera in use', () => {
      const error = new Error('In use');
      error.name = 'NotReadableError';
      const message = getCameraErrorMessage(error);
      expect(message).toContain('in use');
    });

    it('should return default message for unknown error', () => {
      const error = new Error('Unknown error');
      const message = getCameraErrorMessage(error);
      expect(message).toBeTruthy();
    });
  });

  describe('isCameraSupported', () => {
    it('should return true when camera is supported', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: jest.fn(),
        },
      });

      expect(isCameraSupported()).toBe(true);
    });

    it('should return false when mediaDevices is not available', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: undefined,
      });

      expect(isCameraSupported()).toBe(false);
    });
  });

  describe('checkCameraPermission', () => {
    it('should return permission state when supported', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ state: 'granted' });
      Object.defineProperty(global.navigator, 'permissions', {
        writable: true,
        value: {
          query: mockQuery,
        },
      });

      const state = await checkCameraPermission();
      expect(state).toBe('granted');
    });

    it('should return prompt when permissions API not available', async () => {
      Object.defineProperty(global.navigator, 'permissions', {
        writable: true,
        value: undefined,
      });

      const state = await checkCameraPermission();
      expect(state).toBe('prompt');
    });

    it('should return prompt when query fails', async () => {
      const mockQuery = jest.fn().mockRejectedValue(new Error('Not supported'));
      Object.defineProperty(global.navigator, 'permissions', {
        writable: true,
        value: {
          query: mockQuery,
        },
      });

      const state = await checkCameraPermission();
      expect(state).toBe('prompt');
    });
  });
});
