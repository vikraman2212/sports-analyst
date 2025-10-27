/**
 * ReplayTimeline Component
 * 
 * Visual timeline showing full recording with highlighted relevant portion.
 * Three zones: pre-ball (grey), ball-present (green/blue), post-ball (grey).
 */

'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { TrimResult } from '@/lib/replay/types';
import { getTimelineZone, formatTrimEfficiency } from '@/lib/replay/smartTrim';

export interface ReplayTimelineProps {
  /** Total number of frames in recording */
  totalFrames: number;

  /** Current playback frame */
  currentFrame: number;

  /** Trim result showing relevant portion */
  trimResult: TrimResult | null;

  /** Callback when user seeks to a specific frame */
  onSeek: (frameIndex: number) => void;

  /** Optional: show frame numbers */
  showFrameNumbers?: boolean;

  /** Optional: show trim efficiency stats */
  showStats?: boolean;

  /** Optional: className for styling */
  className?: string;
}

export default function ReplayTimeline({
  totalFrames,
  currentFrame,
  trimResult,
  onSeek,
  showFrameNumbers = true,
  showStats = true,
  className = ''
}: ReplayTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle seek by clicking/dragging on timeline
  const handleTimelineInteraction = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const frameIndex = Math.round(percentage * (totalFrames - 1));

    onSeek(frameIndex);
  }, [totalFrames, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineInteraction(e);
  }, [handleTimelineInteraction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e);
    }
  }, [isDragging, handleTimelineInteraction]);

  // Global mouse events for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate positions
  const currentPosition = totalFrames > 0 ? (currentFrame / (totalFrames - 1)) * 100 : 0;
  
  const trimStartPercent = trimResult 
    ? (trimResult.firstDetectionIndex / (totalFrames - 1)) * 100 
    : 0;
  
  const trimEndPercent = trimResult 
    ? (trimResult.lastDetectionIndex / (totalFrames - 1)) * 100 
    : 100;

  const trimWidth = trimEndPercent - trimStartPercent;

  // Current zone
  const currentZone = trimResult ? getTimelineZone(currentFrame, trimResult) : 'relevant';

  return (
    <div className={`replay-timeline ${className}`} role="region" aria-label="Replay timeline">
      {/* Stats */}
      {showStats && trimResult && (
        <div className="timeline-stats mb-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>
              ✓ Ball detected in frames {trimResult.firstDetectionIndex}–{trimResult.lastDetectionIndex}
            </span>
            <span className="font-medium">
              Efficiency: {formatTrimEfficiency(trimResult)}
            </span>
          </div>
          {trimResult.warning && (
            <div className="mt-1 text-amber-600 dark:text-amber-400 text-xs">
              ⚠ {trimResult.warning}
            </div>
          )}
        </div>
      )}

      {/* Timeline track */}
      <div
        ref={timelineRef}
        className="timeline-track relative h-12 bg-gray-200 dark:bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label="Seek timeline"
        aria-valuemin={0}
        aria-valuemax={totalFrames - 1}
        aria-valuenow={currentFrame}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            onSeek(Math.max(0, currentFrame - 1));
          } else if (e.key === 'ArrowRight') {
            onSeek(Math.min(totalFrames - 1, currentFrame + 1));
          } else if (e.key === 'Home') {
            onSeek(0);
          } else if (e.key === 'End') {
            onSeek(totalFrames - 1);
          }
        }}
      >
        {/* Pre-ball zone (ignored) */}
        {trimResult && trimStartPercent > 0 && (
          <div
            className="timeline-zone timeline-zone-ignored absolute top-0 left-0 h-full bg-gray-300 dark:bg-gray-700 opacity-60"
            style={{ width: `${trimStartPercent}%` }}
            title="Pre-ball (ignored)"
          />
        )}

        {/* Relevant zone (ball present) */}
        {trimResult && (
          <div
            className="timeline-zone timeline-zone-relevant absolute top-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-500 dark:to-blue-600"
            style={{
              left: `${trimStartPercent}%`,
              width: `${trimWidth}%`
            }}
            title="Ball detected"
          />
        )}

        {/* Post-ball zone (ignored) */}
        {trimResult && trimEndPercent < 100 && (
          <div
            className="timeline-zone timeline-zone-ignored absolute top-0 h-full bg-gray-300 dark:bg-gray-700 opacity-60"
            style={{
              left: `${trimEndPercent}%`,
              width: `${100 - trimEndPercent}%`
            }}
            title="Post-ball (ignored)"
          />
        )}

        {/* Playhead indicator */}
        <div
          className="timeline-playhead absolute top-0 h-full w-1 bg-white dark:bg-gray-200 shadow-lg transition-all duration-75"
          style={{ left: `${currentPosition}%` }}
          aria-hidden="true"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-md border-2 border-gray-800 dark:border-gray-900" />
        </div>
      </div>

      {/* Frame counter */}
      {showFrameNumbers && (
        <div className="timeline-counter mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Frame {currentFrame}</span>
          <span className="text-gray-500">
            {currentZone === 'pre-ball' && '⏮ Before ball'}
            {currentZone === 'relevant' && '▶ Ball detected'}
            {currentZone === 'post-ball' && '⏭ After ball'}
          </span>
          <span>Total: {totalFrames}</span>
        </div>
      )}

      {/* Legend */}
      {trimResult && (
        <div className="timeline-legend mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-gray-300 dark:bg-gray-700 opacity-60 rounded" />
            <span>Ignored</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-500 dark:to-blue-600 rounded" />
            <span>Ball Detected</span>
          </div>
        </div>
      )}
    </div>
  );
}
