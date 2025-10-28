/**
 * CameraSettings Component
 * Settings panel for camera constraints (exposure, ISO, focus)
 * with preset configurations
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCameraSettings } from '@/hooks/useCameraSettings';
import type { CameraConstraints } from '@/lib/types';

const RESOLUTION_PRESETS = [
  { value: '480p', label: '480p (640x480)', width: 640, height: 480 },
  { value: '720p', label: '720p (1280x720)', width: 1280, height: 720 },
  { value: '1080p', label: '1080p (1920x1080)', width: 1920, height: 1080 },
] as const;

const DEFAULT_FPS_OPTIONS = [15, 24, 30, 60];

function findPresetKey(width?: number, height?: number): string | null {
  if (!width || !height) {
    return null;
  }

  const match = RESOLUTION_PRESETS.find((preset) => preset.width === width && preset.height === height);
  return match ? match.value : null;
}

function formatResolution(width?: number, height?: number): string {
  if (!width || !height) {
    return 'Unknown';
  }
  return `${width}x${height}`;
}

export interface CameraSettingsProps {
  stream: MediaStream | null;
  onClose: () => void;
  onSettingsChanged?: (settings: CameraConstraints) => void;
  initialSettings?: CameraConstraints | null;
}

export function CameraSettings({ stream, onClose, onSettingsChanged, initialSettings = null }: CameraSettingsProps) {
  const {
    capabilities,
    currentSettings,
    applyPreset,
    applyBasicSettings,
    isSupported,
    hasAdvancedControls,
    error,
    lastApplyMessage,
    clearLastApplyMessage,
  } = useCameraSettings(stream);

  const initialPresetKey = findPresetKey(initialSettings?.width, initialSettings?.height);
  const initialCustomResolution = !initialPresetKey && initialSettings?.width && initialSettings?.height
    ? { width: initialSettings.width, height: initialSettings.height }
    : null;
  const initialFPS = initialSettings?.frameRate ? Math.round(initialSettings.frameRate) : 30;

  const [applying, setApplying] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<string>(initialPresetKey ?? (initialCustomResolution ? 'custom' : '720p'));
  const [customResolution, setCustomResolution] = useState<typeof initialCustomResolution>(initialCustomResolution);
  const [selectedFPS, setSelectedFPS] = useState<number>(initialFPS);
  
  // Show all FPS options - capabilities aren't always accurate on mobile
  // Let the user try higher FPS even if capabilities suggest otherwise
  const fpsOptions = useMemo(() => {
    const options = [...DEFAULT_FPS_OPTIONS];
    if (initialFPS && !options.includes(initialFPS)) {
      options.push(initialFPS);
    }
    return options.sort((a, b) => a - b);
  }, [initialFPS]);
  
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Show all resolution presets - capabilities aren't always accurate on mobile
  // Let the user try higher resolutions even if capabilities suggest otherwise
  const resolutionOptions = useMemo(() => {
    if (!customResolution) {
      return RESOLUTION_PRESETS;
    }

    return [
      ...RESOLUTION_PRESETS,
      {
        value: 'custom',
        label: `Custom (${customResolution.width}x${customResolution.height})`,
        width: customResolution.width,
        height: customResolution.height,
      },
    ];
  }, [customResolution]);

  const syncFromSettings = useCallback((settings?: CameraConstraints | null) => {
    if (!settings) {
      return;
    }

    if (settings.width && settings.height) {
      const presetKey = findPresetKey(settings.width, settings.height);
      if (presetKey) {
        setSelectedResolution(presetKey);
        setCustomResolution(null);
      } else {
        setCustomResolution({ width: settings.width, height: settings.height });
        setSelectedResolution('custom');
      }
    }

    if (settings.frameRate) {
      const roundedFPS = Math.round(settings.frameRate);
      setSelectedFPS(roundedFPS);
    }
  }, []);

  const applyCurrentSelection = useCallback(async () => {
    clearLastApplyMessage();
    setApplying(true);

    const selectedPreset = resolutionOptions.find((option) => option.value === selectedResolution);
    const resolutionTarget = selectedPreset ?? RESOLUTION_PRESETS.find((option) => option.value === '720p');

    const targetWidth = selectedPreset?.width ?? customResolution?.width ?? resolutionTarget?.width ?? 1280;
    const targetHeight = selectedPreset?.height ?? customResolution?.height ?? resolutionTarget?.height ?? 720;

    const appliedSettings = await applyBasicSettings({
      width: targetWidth,
      height: targetHeight,
      frameRate: selectedFPS,
    });

    if (appliedSettings) {
      syncFromSettings(appliedSettings);
      setHasPendingChanges(false);
      onSettingsChanged?.(appliedSettings);
      
      // Close the modal after successful application
      // Small delay to let user see the success state
      setTimeout(() => {
        onClose();
      }, 300);
    }

    setApplying(false);
    return appliedSettings;
  }, [applyBasicSettings, clearLastApplyMessage, customResolution, resolutionOptions, selectedFPS, selectedResolution, syncFromSettings, onSettingsChanged, onClose]);

  useEffect(() => {
    if (!hasPendingChanges) {
      syncFromSettings(currentSettings ?? initialSettings ?? null);
    }
  }, [currentSettings, initialSettings, hasPendingChanges, syncFromSettings]);

  useEffect(() => {
    return () => {
      clearLastApplyMessage();
    };
  }, [clearLastApplyMessage]);

  // Only notify parent of settings changes when they are explicitly applied (not on every update)
  // This prevents infinite loops and ensures settings are saved at the right time

  const handlePreset = useCallback(async (preset: 'auto' | 'fast-motion') => {
    clearLastApplyMessage();
    setApplying(true);
    const success = await applyPreset(preset);
    setApplying(false);

    if (success) {
      setHasPendingChanges(false);
    }
  }, [applyPreset, clearLastApplyMessage]);

  const handleResolutionChange = useCallback((resolution: string) => {
    setSelectedResolution(resolution);
    if (resolution !== 'custom') {
      setCustomResolution(null);
    }
    setHasPendingChanges(true);
    clearLastApplyMessage();
  }, [clearLastApplyMessage]);

  const handleFPSChange = useCallback((fps: number) => {
    setSelectedFPS(fps);
    setHasPendingChanges(true);
    clearLastApplyMessage();
  }, [clearLastApplyMessage]);

  const handleApplyBasicSettings = useCallback(async () => {
    await applyCurrentSelection();
  }, [applyCurrentSelection]);

  const handleSaveAndClose = useCallback(async () => {
    if (hasPendingChanges) {
      const appliedSettings = await applyCurrentSelection();
      if (!appliedSettings) {
        return;
      }
    }

    clearLastApplyMessage();
    onClose();
  }, [applyCurrentSelection, clearLastApplyMessage, hasPendingChanges, onClose]);

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
        <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4 backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-white">Basic Settings</p>
            <span className="text-[11px] uppercase tracking-wide text-white/50 sm:text-xs">Mobile friendly</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Resolution selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/70" htmlFor="camera-settings-resolution">Resolution</label>
              <select
                id="camera-settings-resolution"
                value={selectedResolution}
                onChange={(e) => handleResolutionChange(e.target.value)}
                disabled={applying}
                className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resolutionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* FPS selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/70" htmlFor="camera-settings-fps">Frame Rate</label>
              <select
                id="camera-settings-fps"
                value={selectedFPS}
                onChange={(e) => handleFPSChange(Number(e.target.value))}
                disabled={applying}
                className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fpsOptions.map((fps) => (
                  <option key={fps} value={fps}>{fps} FPS</option>
                ))}
              </select>
            </div>
          </div>

          {/* Apply Settings Button - Shows when changes pending */}
          {hasPendingChanges && (
            <button
              onClick={handleApplyBasicSettings}
              disabled={applying}
              className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {applying ? 'Applying...' : '✓ Apply Settings'}
            </button>
          )}

          <div className="grid grid-cols-1 gap-2 rounded-md border border-white/10 bg-white/5 p-3 text-xs text-white/70 sm:grid-cols-2">
            <p className="font-medium text-white/80">Active Settings</p>
            <div className="space-y-1 sm:text-right">
              <p>Resolution: {formatResolution(currentSettings?.width, currentSettings?.height)}</p>
              <p>Frame Rate: {currentSettings?.frameRate ? `${Math.round(currentSettings.frameRate)} FPS` : 'Unknown'}</p>
              {currentSettings?.facingMode && (
                <p>Facing: {currentSettings.facingMode === 'user' ? 'Front camera' : 'Rear camera'}</p>
              )}
            </div>
          </div>

          {lastApplyMessage && (
            <div className="rounded-md border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs text-cyan-200" role="status">
              {lastApplyMessage}
            </div>
          )}
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
            onClick={handleSaveAndClose}
            disabled={applying}
            className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded font-medium transition-colors"
          >
            ✓ Save & Close
          </button>
          <p className="text-xs text-white/60 text-center mt-2">
            Changes apply immediately when saved
          </p>
        </div>
      </div>
    </div>
  );
}
