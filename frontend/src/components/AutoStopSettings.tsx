/**
 * AutoStopSettings Component
 * 
 * Configuration panel for auto-stop behavior.
 * 
 * Features:
 * - Preset buttons (Quick/Normal/Patient)
 * - Custom slider for threshold
 * - FPS-aware time estimation
 * - localStorage persistence
 * - Enable/disable toggle
 * 
 * Presets:
 * - Quick (15 frames): For short pitches or fast returns
 * - Normal (30 frames): Recommended for most recordings
 * - Patient (60 frames): For slow-motion cameras
 * 
 * @see useAutoStop hook for auto-stop logic
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AUTO_STOP_PRESETS, getRecommendedThreshold, formatFramesAsTime } from '@/hooks/useAutoStop';

export interface AutoStopSettingsProps {
  /** Current threshold value */
  threshold: number;
  
  /** Whether auto-stop is enabled */
  enabled: boolean;
  
  /** Camera FPS (for time estimation) */
  fps?: number;
  
  /** Callback when threshold changes */
  onThresholdChange: (threshold: number) => void;
  
  /** Callback when enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  
  /** Callback when settings panel should close */
  onClose?: () => void;
}

const STORAGE_KEY = 'speedometer_auto_stop_settings';

interface StoredSettings {
  threshold: number;
  enabled: boolean;
}

/**
 * Load settings from localStorage
 */
function loadSettings(): Partial<StoredSettings> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load auto-stop settings:', error);
  }
  
  return {};
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings: StoredSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save auto-stop settings:', error);
  }
}

/**
 * Auto-stop settings configuration panel
 */
export function AutoStopSettings({
  threshold,
  enabled,
  fps = 30,
  onThresholdChange,
  onEnabledChange,
  onClose,
}: AutoStopSettingsProps) {
  const [localThreshold, setLocalThreshold] = useState(threshold);
  const [localEnabled, setLocalEnabled] = useState(enabled);

  // Sync with parent props
  useEffect(() => {
    setLocalThreshold(threshold);
  }, [threshold]);

  useEffect(() => {
    setLocalEnabled(enabled);
  }, [enabled]);

  const handlePresetClick = useCallback((presetThreshold: number) => {
    setLocalThreshold(presetThreshold);
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalThreshold(Number(e.target.value));
  }, []);

  const handleEnabledToggle = useCallback(() => {
    setLocalEnabled(prev => !prev);
  }, []);

  const handleSave = useCallback(() => {
    onThresholdChange(localThreshold);
    onEnabledChange(localEnabled);
    
    // Save to localStorage
    saveSettings({
      threshold: localThreshold,
      enabled: localEnabled,
    });
    
    // Close panel
    onClose?.();
  }, [localThreshold, localEnabled, onThresholdChange, onEnabledChange, onClose]);

  const handleCancel = useCallback(() => {
    // Reset to parent values
    setLocalThreshold(threshold);
    setLocalEnabled(enabled);
    onClose?.();
  }, [threshold, enabled, onClose]);

  const recommendedThreshold = getRecommendedThreshold(fps);
  const timeEstimate = formatFramesAsTime(localThreshold, fps);

  return (
    <div className="auto-stop-settings" role="dialog" aria-labelledby="auto-stop-title">
      <div className="settings-overlay" onClick={handleCancel} aria-hidden="true" />
      
      <div className="settings-panel">
        <div className="settings-header">
          <h2 id="auto-stop-title">Auto-Stop Settings</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="close-button"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-content">
          {/* Enable/Disable Toggle */}
          <div className="setting-row">
            <label htmlFor="auto-stop-enabled" className="setting-label">
              <span className="label-text">Enable Auto-Stop</span>
              <span className="label-description">
                Automatically stop recording when ball exits frame
              </span>
            </label>
            <button
              type="button"
              id="auto-stop-enabled"
              role="switch"
              aria-checked={localEnabled}
              onClick={handleEnabledToggle}
              className={`toggle-button ${localEnabled ? 'enabled' : 'disabled'}`}
            >
              <span className="toggle-slider" />
            </button>
          </div>

          {localEnabled && (
            <>
              {/* Presets */}
              <div className="setting-row">
                <label className="setting-label">
                  <span className="label-text">Presets</span>
                  <span className="label-description">
                    Choose a preset based on your recording scenario
                  </span>
                </label>
                <div className="presets-grid">
                  {Object.entries(AUTO_STOP_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetClick(preset.threshold)}
                      className={`preset-button ${localThreshold === preset.threshold ? 'active' : ''}`}
                      aria-pressed={localThreshold === preset.threshold}
                    >
                      <div className="preset-name">{preset.name}</div>
                      <div className="preset-value">{preset.threshold} frames</div>
                      <div className="preset-description">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Slider */}
              <div className="setting-row">
                <label htmlFor="threshold-slider" className="setting-label">
                  <span className="label-text">Custom Threshold</span>
                  <span className="label-description">
                    Frames without ball before auto-stop
                  </span>
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="threshold-slider"
                    min="10"
                    max="90"
                    step="5"
                    value={localThreshold}
                    onChange={handleSliderChange}
                    className="threshold-slider"
                    aria-label={`Threshold: ${localThreshold} frames`}
                  />
                  <div className="slider-value">
                    <span className="value-frames">{localThreshold} frames</span>
                    <span className="value-time">≈ {timeEstimate}</span>
                  </div>
                  {localThreshold === recommendedThreshold && (
                    <div className="recommended-badge">
                      ⭐ Recommended for {fps} FPS
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="info-box">
                <div className="info-icon">ℹ️</div>
                <div className="info-text">
                  <strong>How it works:</strong> Recording automatically stops when the ball
                  is not detected for {localThreshold} consecutive frames. You can always
                  press the manual STOP button to override.
                </div>
              </div>
            </>
          )}
        </div>

        <div className="settings-footer">
          <button type="button" onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="save-button">
            Save Settings
          </button>
        </div>
      </div>

      <style jsx>{`
        .auto-stop-settings {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .settings-panel {
          position: relative;
          background: var(--color-background, #ffffff);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-border, #e5e7eb);
        }

        .settings-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text, #111827);
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--color-text-secondary, #6b7280);
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.2s;
        }

        .close-button:hover {
          color: var(--color-text, #111827);
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .setting-row {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .setting-label {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .label-text {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-text, #111827);
        }

        .label-description {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #6b7280);
        }

        /* Toggle Button */
        .toggle-button {
          position: relative;
          width: 52px;
          height: 28px;
          background: var(--color-border, #d1d5db);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.2s;
          align-self: flex-start;
        }

        .toggle-button.enabled {
          background: var(--color-primary, #3b82f6);
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .toggle-button.enabled .toggle-slider {
          transform: translateX(24px);
        }

        /* Presets Grid */
        .presets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .preset-button {
          padding: 1rem;
          background: var(--color-background-secondary, #f9fafb);
          border: 2px solid var(--color-border, #e5e7eb);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .preset-button:hover {
          border-color: var(--color-primary, #3b82f6);
          background: var(--color-background, #ffffff);
        }

        .preset-button.active {
          border-color: var(--color-primary, #3b82f6);
          background: var(--color-primary-light, #dbeafe);
        }

        .preset-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-text, #111827);
          margin-bottom: 0.25rem;
        }

        .preset-value {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #6b7280);
          font-family: monospace;
          margin-bottom: 0.5rem;
        }

        .preset-description {
          font-size: 0.625rem;
          color: var(--color-text-secondary, #6b7280);
          line-height: 1.3;
        }

        /* Slider */
        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .threshold-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-border, #e5e7eb);
          outline: none;
          -webkit-appearance: none;
        }

        .threshold-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary, #3b82f6);
          cursor: pointer;
        }

        .threshold-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary, #3b82f6);
          cursor: pointer;
          border: none;
        }

        .slider-value {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .value-frames {
          font-weight: 600;
          color: var(--color-text, #111827);
          font-family: monospace;
        }

        .value-time {
          color: var(--color-text-secondary, #6b7280);
        }

        .recommended-badge {
          font-size: 0.75rem;
          color: var(--color-success, #10b981);
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          background: var(--color-success-light, #d1fae5);
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* Info Box */
        .info-box {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--color-info-light, #dbeafe);
          border-radius: 8px;
          border: 1px solid var(--color-info, #3b82f6);
        }

        .info-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .info-text {
          font-size: 0.75rem;
          color: var(--color-text, #111827);
          line-height: 1.5;
        }

        .info-text strong {
          font-weight: 600;
        }

        /* Footer */
        .settings-footer {
          display: flex;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid var(--color-border, #e5e7eb);
          justify-content: flex-end;
        }

        .cancel-button,
        .save-button {
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button {
          background: transparent;
          border: 1px solid var(--color-border, #e5e7eb);
          color: var(--color-text-secondary, #6b7280);
        }

        .cancel-button:hover {
          background: var(--color-background-secondary, #f9fafb);
          border-color: var(--color-text-secondary, #6b7280);
        }

        .save-button {
          background: var(--color-primary, #3b82f6);
          border: none;
          color: white;
        }

        .save-button:hover {
          background: var(--color-primary-dark, #2563eb);
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .settings-panel {
            width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .presets-grid {
            grid-template-columns: 1fr;
          }

          .settings-footer {
            flex-direction: column-reverse;
          }

          .cancel-button,
          .save-button {
            width: 100%;
          }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .settings-panel {
            --color-background: #1f2937;
            --color-background-secondary: #111827;
            --color-text: #f9fafb;
            --color-text-secondary: #9ca3af;
            --color-border: #374151;
            --color-primary-light: #1e3a8a;
            --color-info-light: #1e3a8a;
            --color-success-light: #064e3b;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to manage auto-stop settings with localStorage persistence
 */
export function useAutoStopSettings() {
  const [threshold, setThreshold] = useState(30);
  const [enabled, setEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadSettings();
    if (stored.threshold !== undefined) {
      setThreshold(stored.threshold);
    }
    if (stored.enabled !== undefined) {
      setEnabled(stored.enabled);
    }
  }, []);

  return {
    threshold,
    enabled,
    setThreshold,
    setEnabled,
  };
}
