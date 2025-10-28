/**
 * Hook for managing camera settings via MediaStreamTrack API
 * Detects capabilities and applies constraints for exposure, ISO, focus, etc.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CameraConstraints, CameraCapabilities } from '@/lib/types';

export interface UseCameraSettingsReturn {
  capabilities: CameraCapabilities | null;
  currentSettings: CameraConstraints | null;
  applySettings: (settings: CameraConstraints) => Promise<boolean>;
  applyPreset: (preset: 'auto' | 'fast-motion') => Promise<boolean>;
  isSupported: boolean;
  error: string | null;
}

/**
 * Detect camera capabilities from MediaStreamTrack
 */
function detectCapabilities(track: MediaStreamTrack): CameraCapabilities {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capabilities = track.getCapabilities() as any;

  return {
    exposureMode: capabilities.exposureMode,
    exposureTime: capabilities.exposureTime,
    iso: capabilities.iso,
    focusMode: capabilities.focusMode,
    focusDistance: capabilities.focusDistance,
    whiteBalanceMode: capabilities.whiteBalanceMode,
    brightness: capabilities.brightness,
    contrast: capabilities.contrast,
    saturation: capabilities.saturation,
    sharpness: capabilities.sharpness,
    zoom: capabilities.zoom,
  };
}

/**
 * Get current settings from MediaStreamTrack
 */
function getCurrentSettings(track: MediaStreamTrack): CameraConstraints {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = track.getSettings() as any;

  return {
    exposureMode: settings.exposureMode,
    exposureTime: settings.exposureTime,
    iso: settings.iso,
    focusMode: settings.focusMode,
    focusDistance: settings.focusDistance,
    whiteBalanceMode: settings.whiteBalanceMode,
    brightness: settings.brightness,
    contrast: settings.contrast,
    saturation: settings.saturation,
    sharpness: settings.sharpness,
    zoom: settings.zoom,
  };
}

/**
 * Hook for managing camera settings
 */
export function useCameraSettings(
  stream: MediaStream | null
): UseCameraSettingsReturn {
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [currentSettings, setCurrentSettings] = useState<CameraConstraints | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  // Detect capabilities when stream changes
  useEffect(() => {
    if (!stream) {
      setCapabilities(null);
      setCurrentSettings(null);
      trackRef.current = null;
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      setError('No video track found in stream');
      return;
    }

    trackRef.current = videoTrack;

    try {
      const caps = detectCapabilities(videoTrack);
      const settings = getCurrentSettings(videoTrack);
      setCapabilities(caps);
      setCurrentSettings(settings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect camera capabilities');
    }
  }, [stream]);

  /**
   * Apply camera settings (constraints)
   */
  const applySettings = useCallback(async (settings: CameraConstraints): Promise<boolean> => {
    const track = trackRef.current;
    if (!track) {
      setError('No video track available');
      return false;
    }

    try {
      // Build constraints object (only include supported properties)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const constraints: any = {};

      if (settings.exposureMode && capabilities?.exposureMode) {
        constraints.exposureMode = settings.exposureMode;
      }
      if (settings.exposureTime !== undefined && capabilities?.exposureTime) {
        constraints.exposureTime = settings.exposureTime;
      }
      if (settings.iso !== undefined && capabilities?.iso) {
        constraints.iso = settings.iso;
      }
      if (settings.focusMode && capabilities?.focusMode) {
        constraints.focusMode = settings.focusMode;
      }
      if (settings.focusDistance !== undefined && capabilities?.focusDistance) {
        constraints.focusDistance = settings.focusDistance;
      }
      if (settings.whiteBalanceMode && capabilities?.whiteBalanceMode) {
        constraints.whiteBalanceMode = settings.whiteBalanceMode;
      }
      if (settings.brightness !== undefined && capabilities?.brightness) {
        constraints.brightness = settings.brightness;
      }
      if (settings.contrast !== undefined && capabilities?.contrast) {
        constraints.contrast = settings.contrast;
      }
      if (settings.saturation !== undefined && capabilities?.saturation) {
        constraints.saturation = settings.saturation;
      }
      if (settings.sharpness !== undefined && capabilities?.sharpness) {
        constraints.sharpness = settings.sharpness;
      }
      if (settings.zoom !== undefined && capabilities?.zoom) {
        constraints.zoom = settings.zoom;
      }

      await track.applyConstraints(constraints);

      // Update current settings
      const newSettings = getCurrentSettings(track);
      setCurrentSettings(newSettings);
      setError(null);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply camera settings';
      setError(message);
      return false;
    }
  }, [capabilities]);

  /**
   * Apply preset configurations
   */
  const applyPreset = useCallback(async (preset: 'auto' | 'fast-motion'): Promise<boolean> => {
    if (preset === 'auto') {
      // Reset to automatic modes
      return applySettings({
        exposureMode: 'continuous',
        focusMode: 'continuous',
        whiteBalanceMode: 'continuous',
      });
    }

    if (preset === 'fast-motion') {
      // Optimize for fast-moving ball
      const settings: CameraConstraints = {};

      // Manual exposure with low exposure time (fast shutter)
      if (capabilities?.exposureMode?.includes('manual') && capabilities?.exposureTime) {
        settings.exposureMode = 'manual';
        // Use minimum or near-minimum exposure time for fast shutter
        settings.exposureTime = Math.max(
          capabilities.exposureTime.min,
          capabilities.exposureTime.min * 2
        );
      }

      // Higher ISO to compensate for low exposure
      if (capabilities?.iso) {
        settings.iso = Math.min(
          capabilities.iso.max,
          Math.max(capabilities.iso.min, 400) // Target ISO 400 if supported
        );
      }

      // Manual focus to avoid autofocus hunting
      if (capabilities?.focusMode?.includes('manual') && capabilities?.focusDistance) {
        settings.focusMode = 'manual';
        // Set focus to mid-range (infinity for outdoor)
        settings.focusDistance = capabilities.focusDistance.max * 0.8;
      }

      return applySettings(settings);
    }

    return false;
  }, [capabilities, applySettings]);

  const isSupported = capabilities !== null;

  return {
    capabilities,
    currentSettings,
    applySettings,
    applyPreset,
    isSupported,
    error,
  };
}
