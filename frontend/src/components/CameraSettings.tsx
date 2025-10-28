/**
 * CameraSettings Component
 * Settings panel for camera constraints (exposure, ISO, focus)
 * with preset configurations
 */

'use client';

import { useState } from 'react';
import { useCameraSettings } from '@/hooks/useCameraSettings';
import type { CameraConstraints } from '@/lib/types';

export interface CameraSettingsProps {
  stream: MediaStream | null;
  onClose: () => void;
  onSettingsChanged?: (settings: CameraConstraints) => void;
}

export function CameraSettings({ stream, onClose, onSettingsChanged }: CameraSettingsProps) {
  const {
    capabilities,
    currentSettings,
    applyPreset,
    applyBasicSettings,
    isSupported,
    hasAdvancedControls,
    error,
  } = useCameraSettings(stream);
  const [applying, setApplying] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<string>('720p');
  const [selectedFPS, setSelectedFPS] = useState<number>(30);

  const handlePreset = async (preset: 'auto' | 'fast-motion') => {
    setApplying(true);
    const success = await applyPreset(preset);
    setApplying(false);

    if (success && currentSettings) {
      // Notify parent about settings change
      onSettingsChanged?.(currentSettings);
      // Show feedback
      setTimeout(onClose, 1000);
    }
  };

  const handleResolutionChange = async (resolution: string) => {
    setSelectedResolution(resolution);
    setApplying(true);

    const resolutionMap: Record<string, { width: number; height: number }> = {
      '480p': { width: 640, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    };

    const { width, height } = resolutionMap[resolution] || resolutionMap['720p'];
    const success = await applyBasicSettings({ width, height });
    
    if (success && currentSettings) {
      onSettingsChanged?.(currentSettings);
    }
    
    setApplying(false);
  };

  const handleFPSChange = async (fps: number) => {
    setSelectedFPS(fps);
    setApplying(true);
    const success = await applyBasicSettings({ frameRate: fps });
    
    if (success && currentSettings) {
      onSettingsChanged?.(currentSettings);
    }
    
    setApplying(false);
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
    <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-md max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/10 backdrop-blur-sm pb-2 -mx-6 px-6 z-10">
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
        {/* Mobile-friendly basic controls */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-white">Basic Settings:</p>

          {/* Resolution selector */}
          <div>
            <label className="text-xs text-white/70 block mb-1">Resolution</label>
            <select
              value={selectedResolution}
              onChange={(e) => handleResolutionChange(e.target.value)}
              disabled={applying}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white disabled:opacity-50"
            >
              <option value="480p">480p (640x480)</option>
              <option value="720p">720p (1280x720)</option>
              <option value="1080p">1080p (1920x1080)</option>
            </select>
          </div>

          {/* FPS selector */}
          <div>
            <label className="text-xs text-white/70 block mb-1">Frame Rate</label>
            <select
              value={selectedFPS}
              onChange={(e) => handleFPSChange(Number(e.target.value))}
              disabled={applying}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white disabled:opacity-50"
            >
              <option value={15}>15 FPS</option>
              <option value={24}>24 FPS</option>
              <option value={30}>30 FPS</option>
              <option value={60}>60 FPS</option>
            </select>
          </div>
        </div>

        {/* Advanced controls (desktop only) */}
        {hasAdvancedControls && (
          <div className="space-y-3 pt-4 border-t border-white/20">
            <p className="text-sm font-medium text-white">Advanced Presets:</p>

            {/* Current settings display */}
            <div className="text-xs text-white/60 space-y-1">
              {currentSettings?.exposureMode && (
                <p>Exposure: {currentSettings.exposureMode}</p>
              )}
              {currentSettings?.exposureTime && (
                <p>Shutter: {(currentSettings.exposureTime / 1000).toFixed(1)}ms</p>
              )}
              {currentSettings?.iso && <p>ISO: {currentSettings.iso}</p>}
              {currentSettings?.focusMode && <p>Focus: {currentSettings.focusMode}</p>}
            </div>

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
        )}

        {!hasAdvancedControls && (
          <div className="text-xs text-yellow-400/80 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
            ℹ️ Advanced camera controls (exposure, ISO, focus) are not available on this device.
            Only basic resolution and frame rate can be adjusted.
          </div>
        )}

        {applying && (
          <p className="text-sm text-cyan-400 text-center">Applying settings...</p>
        )}

        {/* Save & Close Button */}
        <div className="pt-4 border-t border-white/20">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium transition-colors"
          >
            ✓ Save & Close
          </button>
          <p className="text-xs text-white/60 text-center mt-2">
            Settings are saved automatically
          </p>
        </div>
      </div>
    </div>
  );
}
