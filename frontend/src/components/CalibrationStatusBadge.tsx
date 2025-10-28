/**
 * CalibrationStatusBadge Component
 * Shows current calibration status and provides recalibrate button
 */

'use client';

import type { CalibrationProfile } from '@/lib/types';

export interface CalibrationStatusBadgeProps {
  profile: CalibrationProfile;
  onRecalibrate: () => void;
}

export function CalibrationStatusBadge({
  profile,
  onRecalibrate,
}: CalibrationStatusBadgeProps) {
  const isDefaultProfile = profile.id === 'default';
  const pixelsPerMeter = profile.pitchLengthPixels / profile.referenceDistanceMeters;

  return (
    <div className="flex items-center gap-3 bg-white/10 dark:bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {isDefaultProfile ? (
          <>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" aria-hidden="true" />
            <span className="text-sm text-yellow-200">
              <span className="sr-only">Calibration status: </span>
              Uncalibrated
            </span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true" />
            <span className="text-sm text-green-200">
              <span className="sr-only">Calibration status: </span>
              Calibrated
            </span>
          </>
        )}
      </div>

      {/* Profile info */}
      <div className="text-xs text-white/80 hidden sm:block">
        {isDefaultProfile ? (
          <span>No camera calibration performed</span>
        ) : (
          <span className="font-mono">
            {profile.pitchLengthPixels.toFixed(0)}px / {profile.referenceDistanceMeters}m
            {' '}({pixelsPerMeter.toFixed(1)} px/m)
          </span>
        )}
      </div>

      {/* Recalibrate button */}
      <button
        onClick={onRecalibrate}
        className="ml-auto px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded transition-colors"
        aria-label={isDefaultProfile ? 'Start camera calibration' : 'Recalibrate camera'}
      >
        {isDefaultProfile ? 'Calibrate' : 'Recalibrate'}
      </button>
    </div>
  );
}
