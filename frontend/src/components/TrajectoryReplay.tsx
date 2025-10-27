/**
 * Trajectory Replay Component
 * 
 * Displays Hawk-Eye style trajectory replay with playback controls.
 * Supports side view and top-down wagon wheel view modes.
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';
import type { ReplaySession, ViewMode, AnnotationConfig, TrimResult } from '../lib/replay/types';
import type { TrajectoryPoint } from '../lib/types';
import { TrajectoryRenderer } from '../lib/replay/trajectoryRenderer';
import { useReplayPlayer } from '../hooks/useReplayPlayer';
import { smartTrim } from '../lib/replay/smartTrim';
import ReplayTimeline from './ReplayTimeline';

export interface TrajectoryReplayProps {
  /** Replay session data */
  session: ReplaySession;

  /** Initial view mode */
  initialViewMode?: ViewMode;

  /** Annotation configuration */
  annotations?: Partial<AnnotationConfig>;

  /** Canvas width */
  width?: number;

  /** Canvas height */
  height?: number;

  /** Auto-play on mount */
  autoPlay?: boolean;

  /** Loop playback */
  loop?: boolean;

  /** Playback speed (1.0 = real-time, 0.5 = half speed, 2.0 = double speed) */
  speed?: number;

  /** CSS class name */
  className?: string;

  /** Callback when playback completes */
  onComplete?: () => void;
}

/**
 * Format time in MM:SS.mmm format
 */
function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Trajectory Replay Component
 */
export default function TrajectoryReplay({
  session,
  initialViewMode = 'side',
  annotations = {},
  width = 1280,
  height = 720,
  autoPlay = false,
  loop = false,
  speed = 1.0,
  className = '',
  onComplete,
}: TrajectoryReplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TrajectoryRenderer | null>(null);

  const player = useReplayPlayer(session, {
    viewMode: initialViewMode,
    loop,
    speed,
  });

  // Calculate trim result from trajectory
  const trimResult = useMemo<TrimResult | null>(() => {
    try {
      // Convert trajectory to (Point | null)[] array for smartTrim
      const trajectoryPoints: (TrajectoryPoint | null)[] = session.delivery.trajectoryPoints.map(p => p);
      return smartTrim(trajectoryPoints);
    } catch (error) {
      console.warn('Smart trim failed:', error);
      return null;
    }
  }, [session]);

  // Current frame for timeline (estimate from time)
  const currentFrame = useMemo(() => {
    if (!session.delivery.trajectoryPoints.length) return 0;
    const progress = player.progress;
    return Math.round(progress * (session.delivery.trajectoryPoints.length - 1));
  }, [player.progress, session.delivery.trajectoryPoints.length]);

  // Handle seek from timeline
  const handleTimelineSeek = (frameIndex: number) => {
    const totalFrames = session.delivery.trajectoryPoints.length;
    if (totalFrames === 0) return;

    const progress = frameIndex / (totalFrames - 1);
    player.seekToProgress(progress);
  };

  /**
   * Initialize renderer
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new TrajectoryRenderer(
      canvasRef.current,
      session,
      player.config.viewMode,
      annotations
    );

    rendererRef.current = renderer;

    return () => {
      rendererRef.current = null;
    };
  }, [session, player.config.viewMode, annotations]);

  /**
   * Render frame on time update
   */
  useEffect(() => {
    if (!rendererRef.current) return;

    rendererRef.current.render(player.currentTime);
  }, [player.currentTime]);

  /**
   * Update renderer view mode
   */
  useEffect(() => {
    if (!rendererRef.current) return;

    rendererRef.current.setViewMode(player.config.viewMode);
  }, [player.config.viewMode]);

  /**
   * Auto-play on mount
   */
  useEffect(() => {
    if (autoPlay) {
      player.play();
    }
  }, [autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Call onComplete when playback finishes
   */
  useEffect(() => {
    if (player.state === 'complete' && onComplete) {
      onComplete();
    }
  }, [player.state, onComplete]);

  /**
   * Handle view mode toggle
   */
  const toggleViewMode = () => {
    const newMode: ViewMode = player.config.viewMode === 'side' ? 'top-down' : 'side';
    player.updateConfig({ viewMode: newMode });
  };

  /**
   * Handle speed change
   */
  const changeSpeed = (newSpeed: number) => {
    player.updateConfig({ speed: newSpeed });
  };

  /**
   * Handle seek via progress bar
   */
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    player.seekToProgress(progress);
  };

  return (
    <div className={`trajectory-replay ${className}`}>
      {/* Canvas */}
      <div className="replay-canvas-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="replay-canvas"
          aria-label="Trajectory replay visualization"
        />

        {/* View mode badge */}
        <div className="view-mode-badge">
          {player.config.viewMode === 'side' ? 'Hawk-Eye Side View' : 'Top-Down Wagon Wheel'}
        </div>
      </div>

      {/* Controls */}
      <div className="replay-controls">
        {/* Playback buttons */}
        <div className="playback-buttons">
          <button
            onClick={() => player.skip(-1000)}
            className="control-button"
            aria-label="Skip backward 1 second"
            title="Skip -1s"
          >
            ⏪
          </button>

          <button
            onClick={player.togglePlayPause}
            className="control-button primary"
            aria-label={player.state === 'playing' ? 'Pause' : 'Play'}
          >
            {player.state === 'playing' ? '⏸' : '▶'}
          </button>

          <button
            onClick={player.stop}
            className="control-button"
            aria-label="Stop"
            title="Stop"
          >
            ⏹
          </button>

          <button
            onClick={() => player.skip(1000)}
            className="control-button"
            aria-label="Skip forward 1 second"
            title="Skip +1s"
          >
            ⏩
          </button>
        </div>

        {/* Progress bar */}
        <div className="progress-container">
          <span className="time-display">{formatTime(player.currentTime)}</span>

          <div
            className="progress-bar"
            onClick={handleProgressClick}
            role="slider"
            aria-label="Playback progress"
            aria-valuenow={Math.round(player.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') player.skip(-100);
              if (e.key === 'ArrowRight') player.skip(100);
            }}
          >
            <div className="progress-fill" style={{ width: `${player.progress * 100}%` }} />
            <div
              className="progress-thumb"
              style={{ left: `${player.progress * 100}%` }}
            />
          </div>

          <span className="time-display">{formatTime(player.duration)}</span>
        </div>

        {/* Timeline with smart trim visualization */}
        {trimResult && (
          <ReplayTimeline
            totalFrames={session.delivery.trajectoryPoints.length}
            currentFrame={currentFrame}
            trimResult={trimResult}
            onSeek={handleTimelineSeek}
            showFrameNumbers={true}
            showStats={true}
          />
        )}

        {/* Additional controls */}
        <div className="additional-controls">
          {/* View mode toggle */}
          <button onClick={toggleViewMode} className="control-button" title="Toggle view mode">
            {player.config.viewMode === 'side' ? '📊 Top-Down' : '📈 Side View'}
          </button>

          {/* Speed controls */}
          <div className="speed-controls">
            <label htmlFor="speed-select">Speed:</label>
            <select
              id="speed-select"
              value={player.config.speed}
              onChange={(e) => changeSpeed(parseFloat(e.target.value))}
              className="speed-select"
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
          </div>

          {/* Loop toggle */}
          <label className="loop-toggle">
            <input
              type="checkbox"
              checked={player.config.loop}
              onChange={(e) => player.updateConfig({ loop: e.target.checked })}
            />
            Loop
          </label>
        </div>
      </div>

      <style jsx>{`
        .trajectory-replay {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #0a192f;
          border-radius: 8px;
          padding: 1rem;
        }

        .replay-canvas-container {
          position: relative;
          background: #000;
          border-radius: 4px;
          overflow: hidden;
        }

        .replay-canvas {
          display: block;
          width: 100%;
          height: auto;
        }

        .view-mode-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 217, 255, 0.2);
          color: #00d9ff;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid rgba(0, 217, 255, 0.4);
        }

        .replay-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .playback-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .control-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.2s;
        }

        .control-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .control-button.primary {
          background: rgba(0, 217, 255, 0.2);
          border-color: rgba(0, 217, 255, 0.4);
          color: #00d9ff;
        }

        .control-button.primary:hover {
          background: rgba(0, 217, 255, 0.3);
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .time-display {
          color: rgba(255, 255, 255, 0.8);
          font-family: monospace;
          font-size: 0.875rem;
          min-width: 80px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          position: relative;
          cursor: pointer;
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #00d9ff, #00ff88);
          border-radius: 4px;
          transition: width 0.1s linear;
        }

        .progress-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: white;
          border: 2px solid #00d9ff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 217, 255, 0.5);
        }

        .additional-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .speed-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .speed-select {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .loop-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
        }

        .loop-toggle input[type='checkbox'] {
          cursor: pointer;
        }

        @media (prefers-color-scheme: light) {
          .trajectory-replay {
            background: #f5f5f5;
          }

          .control-button {
            color: #333;
          }

          .time-display,
          .speed-controls,
          .loop-toggle {
            color: #333;
          }
        }
      `}</style>
    </div>
  );
}
