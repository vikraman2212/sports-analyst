/**
 * CameraSettings Component
 * Settings panel for camera constraints (exposure, ISO, focus)
 * with preset configurations
 */

'use client';

import { useState } from 'react';
import { useCameraSettings } from '@/hooks/useCameraSettings';

export interface CameraSettingsProps {
  stream: MediaStream | null;
  onClose: () => void;
}

export function CameraSettings({ stream, onClose }: CameraSettingsProps) {
  const { capabilities, currentSettings, applyPreset, isSupported, error } =
    useCameraSettings(stream);
  const [applying, setApplying] = useState(false);

  const handlePreset = async (preset: 'auto' | 'fast-motion') => {
    setApplying(true);
    const success = await applyPreset(preset);
    setApplying(false);

    if (success) {
      // Show feedback
      setTimeout(onClose, 1000);
    }
  };

  if (!stream) {
    return (
      <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <p className="text-white/70 text-sm">No camera stream available</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <p className="text-white/70 text-sm">
          Camera settings not supported on this device
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Camera Settings</h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Close settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Current settings display */}
        <div className="text-sm text-white/70 space-y-1">
          <p className="font-medium text-white mb-2">Current Settings:</p>
          {currentSettings?.exposureMode && (
            <p>Exposure: {currentSettings.exposureMode}</p>
          )}
          {currentSettings?.exposureTime && (
            <p>Shutter: {(currentSettings.exposureTime / 1000).toFixed(1)}ms</p>
          )}
          {currentSettings?.iso && <p>ISO: {currentSettings.iso}</p>}
          {currentSettings?.focusMode && <p>Focus: {currentSettings.focusMode}</p>}
        </div>

        {/* Preset buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Presets:</p>

          <button
            onClick={() => handlePreset('auto')}
            disabled={applying}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded transition-colors text-left"
          >
            <div className="font-medium">Auto (Default)</div>
            <div className="text-xs text-white/80">
              Automatic exposure, focus, and white balance
            </div>
          </button>

          {capabilities?.exposureMode?.includes('manual') && (
            <button
              onClick={() => handlePreset('fast-motion')}
              disabled={applying}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded transition-colors text-left"
            >
              <div className="font-medium">Fast Motion</div>
              <div className="text-xs text-white/80">
                Fast shutter, manual focus - optimized for ball tracking
              </div>
            </button>
          )}
        </div>

        {applying && (
          <p className="text-sm text-cyan-400 text-center">Applying settings...</p>
        )}
      </div>
    </div>
  );
}
