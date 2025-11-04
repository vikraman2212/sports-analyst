/**
 * RecordingIndicator Component
 * 
 * Shows recording status with auto-stop countdown visualization.
 * 
 * Features:
 * - Red REC badge with pulsing animation
 * - Circular progress ring for countdown
 * - "Auto-stopping in N frames..." message
 * - Manual STOP button always visible
 * - Responsive design (mobile & desktop)
 * 
 * Auto-stop workflow:
 * 1. User starts recording
 * 2. Ball exits frame → countdown begins
 * 3. Progress ring fills as frames count down
 * 4. Auto-stop triggers OR user clicks manual stop
 * 
 * @see useAutoStop hook for auto-stop logic
 * @see CameraView for integration
 */

'use client';

import { useCallback } from 'react';
import type { AutoStopState } from '@/hooks/useAutoStop';
import { formatFramesAsTime } from '@/hooks/useAutoStop';

export interface RecordingIndicatorProps {
  /** Whether recording is currently active */
  isRecording: boolean;
  
  /** Auto-stop state from useAutoStop hook */
  autoStopState: AutoStopState;
  
  /** Current camera FPS (for time estimation) */
  fps?: number;
  
  /** Callback when user clicks manual stop */
  onManualStop: () => void;
  
  /** Total frames recorded so far */
  frameCount?: number;
}

/**
 * Circular progress ring component
 */
function CircularProgress({ 
  progress, 
  size = 40, 
  strokeWidth = 3 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="countdown-progress-ring">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-warning, #f59e0b)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke-dashoffset 0.1s linear',
        }}
      />
    </svg>
  );
}

/**
 * Recording indicator with auto-stop countdown
 */
export function RecordingIndicator({
  isRecording,
  autoStopState,
  fps = 30,
  onManualStop,
  frameCount = 0,
}: RecordingIndicatorProps) {
  const handleStop = useCallback(() => {
    onManualStop();
  }, [onManualStop]);

  if (!isRecording) {
    return null;
  }

  const {
    consecutiveEmptyFrames,
    countdownProgress,
    framesRemaining,
  } = autoStopState;

  const isCountingDown = consecutiveEmptyFrames > 0;
  const timeRemaining = formatFramesAsTime(framesRemaining, fps);

  return (
    <div 
      className="recording-indicator"
      role="status"
      aria-live="polite"
      aria-label={isCountingDown ? `Auto-stopping in ${framesRemaining} frames` : 'Recording'}
    >
      <div className="recording-indicator-content">
        {/* REC Badge */}
        <div className="rec-badge" aria-label="Recording in progress">
          <span className="rec-dot">●</span>
          <span className="rec-text">REC</span>
        </div>

        {/* Frame Count */}
        <div className="frame-count">
          <span className="sr-only">Frames recorded:</span>
          {frameCount} frames
        </div>

        {/* Countdown Section (only when ball missing) */}
        {isCountingDown && (
          <div className="countdown-section">
            <CircularProgress progress={countdownProgress} />
            <div className="countdown-text">
              <div className="countdown-message">Auto-stopping in</div>
              <div className="countdown-value">
                {framesRemaining} frames
                <span className="countdown-time">({timeRemaining})</span>
              </div>
            </div>
          </div>
        )}

        {/* Manual Stop Button */}
        <button
          type="button"
          onClick={handleStop}
          className="stop-button"
          aria-label="Stop recording manually"
        >
          <span className="stop-icon">⏹</span>
          <span className="stop-text">Stop</span>
        </button>
      </div>

      <style jsx>{`
        .recording-indicator {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .recording-indicator-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* REC Badge */
        .rec-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ef4444;
          font-weight: 600;
          font-size: 1rem;
        }

        .rec-dot {
          animation: pulse 1.5s ease-in-out infinite;
          font-size: 1.5rem;
          line-height: 1;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .rec-text {
          font-family: monospace;
          letter-spacing: 0.1em;
        }

        /* Frame Count */
        .frame-count {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          font-family: monospace;
          padding: 0.25rem 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        /* Countdown Section */
        .countdown-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.25rem 0.75rem;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .countdown-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .countdown-message {
          color: var(--color-warning, #f59e0b);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .countdown-value {
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: monospace;
        }

        .countdown-time {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          margin-left: 0.25rem;
        }

        /* Stop Button */
        .stop-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .stop-button:hover {
          background: #dc2626;
          transform: scale(1.05);
        }

        .stop-button:active {
          transform: scale(0.98);
        }

        .stop-icon {
          font-size: 1rem;
          line-height: 1;
        }

        /* Screen Reader Only */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .recording-indicator {
            top: 0.5rem;
            left: 0.5rem;
            right: 0.5rem;
            transform: none;
            padding: 0.5rem 1rem;
          }

          .recording-indicator-content {
            gap: 0.5rem;
            font-size: 0.875rem;
          }

          .rec-badge {
            font-size: 0.875rem;
          }

          .rec-dot {
            font-size: 1.25rem;
          }

          .frame-count {
            display: none; /* Hide on mobile to save space */
          }

          .countdown-section {
            gap: 0.5rem;
            padding: 0.25rem 0.5rem;
          }

          .countdown-message {
            font-size: 0.625rem;
          }

          .countdown-value {
            font-size: 0.75rem;
          }

          .countdown-time {
            display: block;
            margin-left: 0;
            margin-top: 0.125rem;
          }

          .stop-button {
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
          }

          .stop-text {
            display: none; /* Show only icon on mobile */
          }

          .stop-icon {
            font-size: 1.25rem;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .recording-indicator {
            background: rgba(0, 0, 0, 0.9);
          }
        }
      `}</style>
    </div>
  );
}
