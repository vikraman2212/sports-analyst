/**
 * Replay Player Hook
 * 
 * Manages playback state for trajectory replay.
 * Handles play/pause/seek, timing, and loop functionality.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PlaybackState, PlaybackConfig, ReplaySession } from '../lib/replay/types';

export interface UseReplayPlayerReturn {
  /** Current playback state */
  state: PlaybackState;

  /** Current playback time in milliseconds */
  currentTime: number;

  /** Total duration in milliseconds */
  duration: number;

  /** Current playback progress (0-1) */
  progress: number;

  /** Playback configuration */
  config: PlaybackConfig;

  /** Start or resume playback */
  play: () => void;

  /** Pause playback */
  pause: () => void;

  /** Stop playback and reset to start */
  stop: () => void;

  /** Seek to specific time */
  seek: (timeMs: number) => void;

  /** Seek to specific progress (0-1) */
  seekToProgress: (progress: number) => void;

  /** Update playback configuration */
  updateConfig: (config: Partial<PlaybackConfig>) => void;

  /** Toggle play/pause */
  togglePlayPause: () => void;

  /** Skip forward/backward */
  skip: (deltaMs: number) => void;
}

/**
 * Hook for managing replay playback
 */
export function useReplayPlayer(
  session: ReplaySession | null,
  initialConfig: Partial<PlaybackConfig> = {}
): UseReplayPlayerReturn {
  const [state, setState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [config, setConfig] = useState<PlaybackConfig>({
    speed: 1.0,
    loop: false,
    viewMode: 'side',
    ...initialConfig,
  });

  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const duration = session?.durationMs ?? 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  /**
   * Animation loop for playback
   */
  const animate = useCallback(() => {
    if (!session || state !== 'playing') {
      return;
    }

    const now = performance.now();
    
    if (lastUpdateTimeRef.current === null) {
      lastUpdateTimeRef.current = now;
      startTimeRef.current = currentTime;
    }

    const elapsed = now - lastUpdateTimeRef.current;
    const delta = elapsed * config.speed;
    
    setCurrentTime((prev) => {
      const newTime = prev + delta;

      // Check if we've reached the end
      if (newTime >= duration) {
        if (config.loop) {
          // Loop back to start
          lastUpdateTimeRef.current = now;
          startTimeRef.current = 0;
          return 0;
        } else {
          // Stop at end
          setState('complete');
          return duration;
        }
      }

      lastUpdateTimeRef.current = now;
      return newTime;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [session, state, currentTime, duration, config.speed, config.loop]);

  /**
   * Play
   */
  const play = useCallback(() => {
    if (!session) return;

    if (state === 'complete') {
      // Restart from beginning
      setCurrentTime(0);
    }

    setState('playing');
    lastUpdateTimeRef.current = null;
  }, [session, state]);

  /**
   * Pause
   */
  const pause = useCallback(() => {
    if (state === 'playing') {
      setState('paused');
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      lastUpdateTimeRef.current = null;
    }
  }, [state]);

  /**
   * Stop
   */
  const stop = useCallback(() => {
    setState('idle');
    setCurrentTime(0);
    
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    lastUpdateTimeRef.current = null;
  }, []);

  /**
   * Seek to time
   */
  const seek = useCallback(
    (timeMs: number) => {
      const clampedTime = Math.max(0, Math.min(timeMs, duration));
      setCurrentTime(clampedTime);
      lastUpdateTimeRef.current = null;

      // If we were complete, go back to paused
      if (state === 'complete') {
        setState('paused');
      }
    },
    [duration, state]
  );

  /**
   * Seek to progress
   */
  const seekToProgress = useCallback(
    (progressValue: number) => {
      const clampedProgress = Math.max(0, Math.min(1, progressValue));
      seek(clampedProgress * duration);
    },
    [duration, seek]
  );

  /**
   * Update config
   */
  const updateConfig = useCallback((newConfig: Partial<PlaybackConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (state === 'playing') {
      pause();
    } else {
      play();
    }
  }, [state, play, pause]);

  /**
   * Skip forward/backward
   */
  const skip = useCallback(
    (deltaMs: number) => {
      seek(currentTime + deltaMs);
    },
    [currentTime, seek]
  );

  /**
   * Start animation loop when playing
   */
  useEffect(() => {
    if (state === 'playing') {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state, animate]);

  /**
   * Reset when session changes
   */
  useEffect(() => {
    stop();
  }, [session, stop]);

  return {
    state,
    currentTime,
    duration,
    progress,
    config,
    play,
    pause,
    stop,
    seek,
    seekToProgress,
    updateConfig,
    togglePlayPause,
    skip,
  };
}
