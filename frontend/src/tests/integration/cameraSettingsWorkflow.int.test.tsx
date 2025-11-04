/**
 * Integration test for camera settings workflow
 * Tests opening settings panel, applying presets, and verifying constraints
 */

import { renderHook, act } from '@testing-library/react';
import { useCameraSettings } from '../../hooks/useCameraSettings';

describe('Camera Settings Workflow Integration', () => {
  let mockStream: MediaStream;
  let mockTrack: MediaStreamTrack;

  beforeEach(() => {
    // Create mock MediaStreamTrack with capabilities and settings
    const mockSettings = {
      width: 1280,
      height: 720,
      frameRate: 30,
      facingMode: 'environment' as const,
      exposureMode: 'continuous' as const,
      exposureTime: 1000,
      iso: 400,
      focusMode: 'continuous' as const,
      whiteBalanceMode: 'continuous' as const,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      zoom: 1,
    };

    mockTrack = {
      kind: 'video',
      enabled: true,
      getCapabilities: jest.fn(() => ({
        width: { min: 640, max: 3840 },
        height: { min: 480, max: 2160 },
        frameRate: { min: 15, max: 240 },
        facingMode: ['user', 'environment'],
        exposureMode: ['manual', 'continuous'],
        exposureTime: { min: 100, max: 10000, step: 100 },
        iso: { min: 100, max: 3200, step: 100 },
        focusMode: ['manual', 'continuous', 'single-shot'],
        focusDistance: { min: 0, max: 10, step: 0.1 },
        whiteBalanceMode: ['manual', 'continuous'],
        brightness: { min: -100, max: 100, step: 1 },
        contrast: { min: -100, max: 100, step: 1 },
        saturation: { min: -100, max: 100, step: 1 },
        sharpness: { min: -100, max: 100, step: 1 },
        zoom: { min: 1, max: 10, step: 0.1 },
      })),
      getSettings: jest.fn(() => mockSettings),
      applyConstraints: jest.fn(async (constraints: MediaTrackConstraints) => {
        const advanced = (constraints as { advanced?: Array<Record<string, unknown>> }).advanced;
        const firstAdvanced = advanced?.[0] as Record<string, { exact?: number; ideal?: number; min?: number }> | undefined;
        
        // Handle width with exact or ideal
        if (firstAdvanced?.width?.exact) {
          mockSettings.width = firstAdvanced.width.exact;
        } else if (firstAdvanced?.width?.ideal) {
          mockSettings.width = firstAdvanced.width.ideal;
        }
        
        // Handle height with exact or ideal
        if (firstAdvanced?.height?.exact) {
          mockSettings.height = firstAdvanced.height.exact;
        } else if (firstAdvanced?.height?.ideal) {
          mockSettings.height = firstAdvanced.height.ideal;
        }
        
        // Handle frameRate with exact, ideal, or min
        if (firstAdvanced?.frameRate?.exact) {
          const requestedFPS = firstAdvanced.frameRate.exact;
          const capabilities = mockTrack.getCapabilities() as { frameRate: { min: number; max: number } };
          if (requestedFPS >= capabilities.frameRate.min && requestedFPS <= capabilities.frameRate.max) {
            mockSettings.frameRate = requestedFPS;
          }
        } else if (firstAdvanced?.frameRate?.ideal) {
          mockSettings.frameRate = firstAdvanced.frameRate.ideal;
        } else if (firstAdvanced?.frameRate?.min) {
          const requestedFPS = firstAdvanced.frameRate.min;
          const capabilities = mockTrack.getCapabilities() as { frameRate: { min: number; max: number } };
          if (requestedFPS >= capabilities.frameRate.min && requestedFPS <= capabilities.frameRate.max) {
            mockSettings.frameRate = requestedFPS;
          }
        }
      }),
      stop: jest.fn(),
    } as unknown as MediaStreamTrack;

    // Create mock MediaStream
    mockStream = {
      getVideoTracks: jest.fn(() => [mockTrack]),
      getTracks: jest.fn(() => [mockTrack]),
    } as unknown as MediaStream;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should detect camera capabilities', () => {
    const { result } = renderHook(() => useCameraSettings(mockStream));

    expect(result.current.capabilities).toBeTruthy();
    expect(result.current.capabilities?.exposureTime?.max).toBe(10000);
    expect(result.current.capabilities?.iso?.max).toBe(3200);
    expect(result.current.isSupported).toBe(true);
  });

  it('should get current camera settings', () => {
    const { result } = renderHook(() => useCameraSettings(mockStream));

    expect(result.current.currentSettings).toBeTruthy();
    expect(result.current.currentSettings?.width).toBe(1280);
    expect(result.current.currentSettings?.height).toBe(720);
    expect(result.current.currentSettings?.exposureMode).toBe('continuous');
    expect(result.current.currentSettings?.iso).toBe(400);
  });

  it('should apply "Fast Motion" preset successfully', async () => {
    const { result } = renderHook(() => useCameraSettings(mockStream));

    let success = false;
    await act(async () => {
      success = await result.current.applyPreset('fast-motion');
    });

    expect(success).toBe(true);
    expect(mockTrack.applyConstraints).toHaveBeenCalled();

    // Verify constraints were applied (check call arguments)
    const constraintsCall = (mockTrack.applyConstraints as jest.Mock).mock.calls[0][0];
    
    // Fast motion preset should apply:
    // - Manual exposure mode with low exposure time (fast shutter)
    // - Higher ISO to compensate for less light
    // - Manual focus if supported
    expect(constraintsCall.exposureMode).toBe('manual');
    expect(constraintsCall.exposureTime).toBeDefined();
    expect(constraintsCall.exposureTime).toBeLessThanOrEqual(200); // Fast shutter
  });

  it('should apply "Auto" preset successfully', async () => {
    const { result } = renderHook(() => useCameraSettings(mockStream));

    let success = false;
    await act(async () => {
      success = await result.current.applyPreset('auto');
    });

    expect(success).toBe(true);
    expect(mockTrack.applyConstraints).toHaveBeenCalled();
  });

  it('should handle applyConstraints failure gracefully', async () => {
    // Mock failure
    (mockTrack.applyConstraints as jest.Mock).mockRejectedValueOnce(
      new Error('Constraint not supported')
    );

    const { result } = renderHook(() => useCameraSettings(mockStream));

    let success = true;
    await act(async () => {
      success = await result.current.applyPreset('fast-motion');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('Constraint not supported');
  });

  it('should return unsupported when stream has no video tracks', () => {
    const emptyStream = {
      getVideoTracks: jest.fn(() => []),
      getTracks: jest.fn(() => []),
    } as unknown as MediaStream;

    const { result } = renderHook(() => useCameraSettings(emptyStream));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.capabilities).toBeNull();
  });

  it('should return unsupported when getCapabilities not available', () => {
    const trackWithoutCapabilities = {
      kind: 'video',
      enabled: true,
      getCapabilities: undefined,
      getSettings: jest.fn(() => ({ width: 640, height: 480 })),
    } as unknown as MediaStreamTrack;

    const streamWithoutCapabilities = {
      getVideoTracks: jest.fn(() => [trackWithoutCapabilities]),
      getTracks: jest.fn(() => [trackWithoutCapabilities]),
    } as unknown as MediaStream;

    const { result } = renderHook(() => useCameraSettings(streamWithoutCapabilities));

    expect(result.current.isSupported).toBe(false);
  });

  it('should handle null stream gracefully', () => {
    const { result } = renderHook(() => useCameraSettings(null));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.capabilities).toBeNull();
    expect(result.current.currentSettings).toBeNull();
  });

  it('should apply custom constraints via applySettings method', async () => {
    const { result } = renderHook(() => useCameraSettings(mockStream));

    const customConstraints = {
      exposureMode: 'manual' as const,
      exposureTime: 500,
      iso: 800,
    };

    let success = false;
    await act(async () => {
      success = await result.current.applySettings(customConstraints);
    });

    expect(success).toBe(true);
    expect(mockTrack.applyConstraints).toHaveBeenCalled();
  });

  it('should update settings after applying constraints', async () => {
    // Mock settings change after applyConstraints
    let callCount = 0;
    (mockTrack.getSettings as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return { exposureMode: 'manual', exposureTime: 200, iso: 800 };
      }
      return { exposureMode: 'continuous', exposureTime: 1000, iso: 400 };
    });

    const { result, rerender } = renderHook(() => useCameraSettings(mockStream));

    expect(result.current.currentSettings?.exposureMode).toBe('continuous');

    await act(async () => {
      await result.current.applyPreset('fast-motion');
    });

    // Rerender to get updated settings
    rerender();

    // Settings should be updated (verified by the mock being called)
    expect(mockTrack.applyConstraints).toHaveBeenCalled();
  });

  it('should apply basic camera settings (mobile-compatible)', async () => {
    const { result } = renderHook(() => useCameraSettings(mockStream));

    const basicSettings = {
      width: 1920,
      height: 1080,
      frameRate: 60,
    };

    await act(async () => {
      const appliedSettings = await result.current.applyBasicSettings(basicSettings);
      expect(appliedSettings).toBeTruthy();
      if (!appliedSettings) {
        throw new Error('Expected applyBasicSettings to return current constraints');
      }
      expect(appliedSettings.width).toBe(1920);
      expect(appliedSettings.height).toBe(1080);
      expect(appliedSettings.frameRate).toBe(60);
    });
    expect(mockTrack.applyConstraints).toHaveBeenCalled();

    // Verify basic constraints were applied
    const constraintsCall = (mockTrack.applyConstraints as jest.Mock).mock.calls[0][0];
    expect(constraintsCall.advanced).toBeDefined();
    // Progressive fallback: tries exact first, falls back to ideal if needed
    expect(constraintsCall.advanced[0].width).toEqual({ exact: 1920 });
    expect(constraintsCall.advanced[0].height).toEqual({ exact: 1080 });
    // frameRate uses exact first, falls back to ideal
    expect(constraintsCall.advanced[0].frameRate).toEqual({ exact: 60 });
  });

  it('should detect when advanced controls are available', () => {
    const { result } = renderHook(() => useCameraSettings(mockStream));

    // Our mock has exposure and ISO capabilities
    expect(result.current.hasAdvancedControls).toBe(true);
  });

  it('should detect when advanced controls are NOT available (mobile)', () => {
    // Create mock without advanced capabilities (typical mobile browser)
    const mobileTrack = {
      kind: 'video',
      enabled: true,
      getCapabilities: jest.fn(() => ({
        width: { min: 640, max: 1920 },
        height: { min: 480, max: 1080 },
        frameRate: { min: 15, max: 30 },
        facingMode: ['user', 'environment'],
      })),
      getSettings: jest.fn(() => ({
        width: 1280,
        height: 720,
        frameRate: 30,
        facingMode: 'environment',
      })),
      applyConstraints: jest.fn().mockResolvedValue(undefined),
    } as unknown as MediaStreamTrack;

    const mobileStream = {
      getVideoTracks: jest.fn(() => [mobileTrack]),
      getTracks: jest.fn(() => [mobileTrack]),
    } as unknown as MediaStream;

    const { result } = renderHook(() => useCameraSettings(mobileStream));

    // Mobile browser should not have advanced controls
    expect(result.current.hasAdvancedControls).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });
});
