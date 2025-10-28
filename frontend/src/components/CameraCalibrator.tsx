/**
 * CameraCalibrator Component
 * Interactive overlay for two-point camera calibration
 * Users mark two points representing known distance (e.g., pitch length)
 */

'use client';

import { useState, useRef, useCallback, type MouseEvent, type TouchEvent } from 'react';
import type { CalibrationPoint } from '@/lib/types';
import {
  calculatePixelDistance,
  validateCalibration,
} from '@/lib/calibration/wizard';

export interface CameraCalibratorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  pitchLengthMeters: number;
  onCalibrationComplete: (pitchLengthPixels: number) => void;
  onCancel: () => void;
}

export function CameraCalibrator({
  videoRef,
  pitchLengthMeters,
  onCalibrationComplete,
  onCancel,
}: CameraCalibratorProps) {
  const [point1, setPoint1] = useState<CalibrationPoint | null>(null);
  const [point2, setPoint2] = useState<CalibrationPoint | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const videoWidth = videoRef.current?.videoWidth || 0;
  const videoHeight = videoRef.current?.videoHeight || 0;

  // Calculate pixel distance if both points are set
  const pixelDistance = point1 && point2 ? calculatePixelDistance(point1, point2) : null;

  // Validate calibration
  const validation =
    pixelDistance !== null
      ? validateCalibration(pixelDistance, pitchLengthMeters, videoWidth, videoHeight)
      : null;

  /**
   * Get click/touch coordinates relative to video element
   */
  const getRelativeCoordinates = useCallback(
    (clientX: number, clientY: number): CalibrationPoint | null => {
      const overlay = overlayRef.current;
      if (!overlay) return null;

      const rect = overlay.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * videoWidth;
      const y = ((clientY - rect.top) / rect.height) * videoHeight;

      return { x, y };
    },
    [videoWidth, videoHeight]
  );

  /**
   * Handle click on overlay
   */
  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const coords = getRelativeCoordinates(e.clientX, e.clientY);
      if (!coords) return;

      if (!point1) {
        setPoint1(coords);
      } else if (!point2) {
        setPoint2(coords);
      }
    },
    [getRelativeCoordinates, point1, point2]
  );

  /**
   * Handle touch on overlay (mobile)
   */
  const handleTouch = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;

      const coords = getRelativeCoordinates(touch.clientX, touch.clientY);
      if (!coords) return;

      if (!point1) {
        setPoint1(coords);
      } else if (!point2) {
        setPoint2(coords);
      }
    },
    [getRelativeCoordinates, point1, point2]
  );

  /**
   * Reset calibration
   */
  const handleRetry = useCallback(() => {
    setPoint1(null);
    setPoint2(null);
  }, []);

  /**
   * Accept calibration
   */
  const handleAccept = useCallback(() => {
    if (validation?.isValid && pixelDistance !== null) {
      onCalibrationComplete(pixelDistance);
    }
  }, [validation, pixelDistance, onCalibrationComplete]);

  // Convert video coordinates to display coordinates
  const toDisplayCoords = useCallback(
    (point: CalibrationPoint): { x: number; y: number } => {
      if (!overlayRef.current) return { x: 0, y: 0 };
      const rect = overlayRef.current.getBoundingClientRect();
      return {
        x: (point.x / videoWidth) * rect.width,
        y: (point.y / videoHeight) * rect.height,
      };
    },
    [videoWidth, videoHeight]
  );

  const displayPoint1 = point1 ? toDisplayCoords(point1) : null;
  const displayPoint2 = point2 ? toDisplayCoords(point2) : null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20 cursor-crosshair"
      onClick={handleClick}
      onTouchStart={handleTouch}
      role="application"
      aria-label="Camera calibration overlay"
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-4 rounded-lg text-center max-w-md">
        <h3 className="font-semibold text-lg mb-2">Camera Calibration</h3>
        {!point1 && (
          <p className="text-sm">
            <span className="font-medium">Step 1:</span> Tap the <strong>bowling crease</strong> (where bowler releases ball)
          </p>
        )}
        {point1 && !point2 && (
          <p className="text-sm">
            <span className="font-medium">Step 2:</span> Tap the <strong>batting crease</strong> (where batsman stands)
          </p>
        )}
        {point1 && point2 && validation && (
          <div className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>Pixel distance:</span>
              <span className="font-mono font-semibold">{pixelDistance?.toFixed(1)}px</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pixels per meter:</span>
              <span className="font-mono font-semibold">
                {validation.pixelsPerMeter?.toFixed(1)} px/m
              </span>
            </div>
            {validation.isValid ? (
              <div className="text-green-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Valid calibration</span>
              </div>
            ) : (
              <div className="text-red-400">
                {validation.errors.map((err, i) => (
                  <p key={i} className="text-xs">
                    ⚠️ {err}
                  </p>
                ))}
              </div>
            )}
            {validation.warnings.map((warn, i) => (
              <p key={i} className="text-yellow-400 text-xs">
                ⚡ {warn}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Point markers */}
      {displayPoint1 && (
        <div
          className="absolute w-4 h-4 -ml-2 -mt-2 bg-cyan-400 border-2 border-white rounded-full shadow-lg animate-pulse"
          style={{ left: displayPoint1.x, top: displayPoint1.y }}
          aria-label="First calibration point"
        />
      )}
      {displayPoint2 && (
        <div
          className="absolute w-4 h-4 -ml-2 -mt-2 bg-pink-400 border-2 border-white rounded-full shadow-lg animate-pulse"
          style={{ left: displayPoint2.x, top: displayPoint2.y }}
          aria-label="Second calibration point"
        />
      )}

      {/* Line between points */}
      {displayPoint1 && displayPoint2 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1={displayPoint1.x}
            y1={displayPoint1.y}
            x2={displayPoint2.x}
            y2={displayPoint2.y}
            stroke="#00D9FF"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
        </svg>
      )}

      {/* Action buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          aria-label="Cancel calibration"
        >
          Cancel
        </button>
        {point1 && (
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
            aria-label="Retry calibration"
          >
            Retry
          </button>
        )}
        {point1 && point2 && validation?.isValid && (
          <button
            onClick={handleAccept}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
            aria-label="Accept calibration"
          >
            Accept
          </button>
        )}
      </div>
    </div>
  );
}
