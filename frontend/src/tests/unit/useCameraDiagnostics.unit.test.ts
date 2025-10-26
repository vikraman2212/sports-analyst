/**
 * Unit Tests: useCameraDiagnostics Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useCameraDiagnostics } from '../../hooks/useCameraDiagnostics';

describe('useCameraDiagnostics', () => {
  const createMockStream = (fps = 30, width = 1920, height = 1080): MediaStream => {
    const mockTrack = {
      getSettings: () => ({
        frameRate: fps,
        width,
        height,
      }),
    } as MediaStreamTrack;

    return {
      getVideoTracks: () => [mockTrack],
    } as unknown as MediaStream;
  };

  const createMockImageData = (brightness: number): ImageData => {
    const data = new Uint8ClampedArray(1920 * 1080 * 4);
    // Fill with specified brightness
    for (let i = 0; i < data.length; i += 4) {
      data[i] = brightness; // R
      data[i + 1] = brightness; // G
      data[i + 2] = brightness; // B
      data[i + 3] = 255; // A
    }
    return {
      data,
      width: 1920,
      height: 1080,
      colorSpace: 'srgb' as PredefinedColorSpace,
    };
  };

  it('should initialize with default state when no stream', () => {
    const { result } = renderHook(() => useCameraDiagnostics(null));

    expect(result.current.diagnostics.resolution).toBeNull();
    expect(result.current.diagnostics.reportedFPS).toBeNull();
    expect(result.current.diagnostics.inferredFPS).toBeNull();
    expect(result.current.diagnostics.exposureStatus).toBe('unknown');
    expect(result.current.diagnostics.meetsRequirements).toBe(false);
    expect(result.current.diagnostics.requirementIssues).toContain('No camera stream');
  });

  it('should extract resolution and FPS from stream', () => {
    const stream = createMockStream(60, 1280, 720);
    const { result } = renderHook(() => useCameraDiagnostics(stream));

    expect(result.current.diagnostics.resolution).toEqual({
      width: 1280,
      height: 720,
    });
    expect(result.current.diagnostics.reportedFPS).toBe(60);
  });

  it('should infer FPS from frame timestamps', () => {
    const stream = createMockStream(30);
    const { result } = renderHook(() => useCameraDiagnostics(stream));
    const imageData = createMockImageData(128);

    // Simulate 30 fps (33.33ms between frames)
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.updateWithFrame(imageData, i * 33.33);
      }
    });

    expect(result.current.diagnostics.inferredFPS).toBeGreaterThanOrEqual(28);
    expect(result.current.diagnostics.inferredFPS).toBeLessThanOrEqual(32);
  });

  it('should detect good exposure with proper brightness', () => {
    const stream = createMockStream(30);
    const { result } = renderHook(() => useCameraDiagnostics(stream));
    const imageData = createMockImageData(128); // Mid brightness

    act(() => {
      // Send enough frames with consistent brightness, spaced adequately
      for (let i = 0; i < 20; i++) {
        result.current.updateWithFrame(imageData, i * 200); // 200ms spacing for brightness sampling
      }
    });

    // Brightness analysis happens every ~150ms, so with 20 frames at 200ms spacing we should have enough samples
    expect(result.current.diagnostics.exposureStatus).toBe('good');
  });

  it('should detect too-low exposure', () => {
    const stream = createMockStream(30);
    const { result } = renderHook(() => useCameraDiagnostics(stream));
    const darkImageData = createMockImageData(20); // Very dark

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.updateWithFrame(darkImageData, i * 200);
      }
    });

    expect(result.current.diagnostics.exposureStatus).toBe('too-low');
  });

  it('should detect too-high exposure', () => {
    const stream = createMockStream(30);
    const { result } = renderHook(() => useCameraDiagnostics(stream));
    const brightImageData = createMockImageData(250); // Very bright

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.updateWithFrame(brightImageData, i * 200);
      }
    });

    expect(result.current.diagnostics.exposureStatus).toBe('too-high');
  });

  it('should flag low FPS as requirement issue', () => {
    const stream = createMockStream(15); // Low FPS
    const { result } = renderHook(() => useCameraDiagnostics(stream));
    const imageData = createMockImageData(128);

    act(() => {
      // Simulate 15 fps
      for (let i = 0; i < 15; i++) {
        result.current.updateWithFrame(imageData, i * 66.67);
      }
    });

    expect(result.current.diagnostics.meetsRequirements).toBe(false);
    expect(result.current.diagnostics.requirementIssues.some((issue: string) =>
      issue.includes('Low frame rate')
    )).toBe(true);
  });

  it('should meet requirements with good settings', () => {
    const stream = createMockStream(30);
    const { result } = renderHook(() => useCameraDiagnostics(stream));
    const imageData = createMockImageData(128);

    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.updateWithFrame(imageData, i * 33);
      }
    });

    expect(result.current.diagnostics.meetsRequirements).toBe(true);
    expect(result.current.diagnostics.requirementIssues).toHaveLength(0);
  });

  it('should handle custom config thresholds', () => {
    const stream = createMockStream(30);
    const { result } = renderHook(() =>
      useCameraDiagnostics(stream, {
        minFPS: 60, // Higher threshold
      })
    );
    const imageData = createMockImageData(128);

    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.updateWithFrame(imageData, i * 33);
      }
    });

    expect(result.current.diagnostics.meetsRequirements).toBe(false);
  });

  it('should detect motion blur via high brightness variance', () => {
    const stream = createMockStream(30);
    const { result } = renderHook(() => useCameraDiagnostics(stream));

    act(() => {
      // Alternate between bright and dark (simulating motion blur) with adequate spacing
      for (let i = 0; i < 20; i++) {
        const brightness = i % 2 === 0 ? 50 : 200;
        const imageData = createMockImageData(brightness);
        result.current.updateWithFrame(imageData, i * 200);
      }
    });

    expect(result.current.diagnostics.brightnessVariance).not.toBeNull();
    expect(result.current.diagnostics.brightnessVariance!).toBeGreaterThan(40);
    expect(result.current.diagnostics.requirementIssues.some((issue: string) =>
      issue.includes('Motion blur')
    )).toBe(true);
  });
});
