/**
 * Unit Tests: useReplayPlayer Hook
 * 
 * Tests playback state management for trajectory replay.
 */

import { renderHook, act } from '@testing-library/react';
import { useReplayPlayer } from '../../hooks/useReplayPlayer';
import type { ReplaySession } from '../../lib/replay/types';
import type { DeliveryResult, TrajectoryPoint } from '../../lib/types';

// Mock session data
const createMockSession = (durationMs: number = 3000): ReplaySession => {
  const trajectoryPoints: TrajectoryPoint[] = [];
  const pointCount = 30;
  
  for (let i = 0; i < pointCount; i++) {
    trajectoryPoints.push({
      pixelX: 100 + i * 10,
      pixelY: 200 - i * 5,
      estimatedZ: null,
      timestampMs: (durationMs / pointCount) * i,
    });
  }

  const delivery: DeliveryResult = {
    speedKmh: 145.5,
    trajectoryPoints,
    confidence: 0.92,
    detectionCount: pointCount,
    processingMs: 250,
    warnings: [],
  };

  return {
    id: 'test-session-123',
    createdAt: new Date(),
    delivery,
    staticFrame: null,
    durationMs,
    startMs: 0,
    endMs: durationMs,
  };
};

describe('useReplayPlayer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with idle state', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    expect(result.current.state).toBe('idle');
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(3000);
    expect(result.current.progress).toBe(0);
  });

  it('starts playback when play() is called', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.play();
    });

    expect(result.current.state).toBe('playing');
  });

  it('pauses playback when pause() is called', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.play();
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.state).toBe('paused');
  });

  it('stops and resets when stop() is called', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.play();
      result.current.seek(1500);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.currentTime).toBe(0);
  });

  it('seeks to specific time', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.seek(1500);
    });

    expect(result.current.currentTime).toBe(1500);
    expect(result.current.progress).toBeCloseTo(0.5);
  });

  it('seeks to specific progress', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.seekToProgress(0.75);
    });

    expect(result.current.currentTime).toBe(2250);
    expect(result.current.progress).toBeCloseTo(0.75);
  });

  it('clamps seek time to valid range', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.seek(-500);
    });
    expect(result.current.currentTime).toBe(0);

    act(() => {
      result.current.seek(5000);
    });
    expect(result.current.currentTime).toBe(3000);
  });

  it('toggles between play and pause', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.togglePlayPause();
    });
    expect(result.current.state).toBe('playing');

    act(() => {
      result.current.togglePlayPause();
    });
    expect(result.current.state).toBe('paused');
  });

  it('skips forward and backward', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.seek(1500);
    });

    act(() => {
      result.current.skip(500);
    });
    expect(result.current.currentTime).toBe(2000);

    act(() => {
      result.current.skip(-1000);
    });
    expect(result.current.currentTime).toBe(1000);
  });

  it('updates playback configuration', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useReplayPlayer(session));

    act(() => {
      result.current.updateConfig({ speed: 2.0, loop: true });
    });

    expect(result.current.config.speed).toBe(2.0);
    expect(result.current.config.loop).toBe(true);
  });

  it('respects initial configuration', () => {
    const session = createMockSession();
    const { result } = renderHook(() =>
      useReplayPlayer(session, { speed: 0.5, loop: true, viewMode: 'top-down' })
    );

    expect(result.current.config.speed).toBe(0.5);
    expect(result.current.config.loop).toBe(true);
    expect(result.current.config.viewMode).toBe('top-down');
  });

  it('resets when session changes', () => {
    const session1 = createMockSession(3000);
    const session2 = createMockSession(5000);

    const { result, rerender } = renderHook(
      ({ session }) => useReplayPlayer(session),
      { initialProps: { session: session1 } }
    );

    act(() => {
      result.current.play();
      result.current.seek(1500);
    });

    rerender({ session: session2 });

    expect(result.current.state).toBe('idle');
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(5000);
  });

  it('returns null duration when no session', () => {
    const { result } = renderHook(() => useReplayPlayer(null));

    expect(result.current.duration).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it('prevents play when no session', () => {
    const { result } = renderHook(() => useReplayPlayer(null));

    act(() => {
      result.current.play();
    });

    expect(result.current.state).toBe('idle');
  });
});
