/**
 * PitchLengthSelector Component
 *
 * Allows users to choose pitch length preset (Standard 20.12m, Youth 16m) or enter a custom value.
 */
'use client';

import React from 'react';
import { usePitchLength, STANDARD_METERS, YOUTH_METERS, type PitchMode } from '@/hooks/usePitchLength';

export interface PitchLengthSelectorProps {
  onChange?: (meters: number) => void;
  className?: string;
}

export function PitchLengthSelector({ onChange, className = '' }: PitchLengthSelectorProps) {
  const { state, setMode, setCustomMeters } = usePitchLength();
  const [hint, setHint] = React.useState<string | null>(null);
  const prevMetersRef = React.useRef<number>(state.meters);

  React.useEffect(() => {
    onChange?.(state.meters);
    const prev = prevMetersRef.current;
    if (prev !== state.meters) {
      // Compute impact relative to Standard (20.12 m)
      const baseline = STANDARD_METERS;
      const ratio = state.meters / baseline;
      const deltaPct = Math.round((Math.abs(1 - ratio)) * 100);
      const direction = ratio < 1 ? 'lower' : ratio > 1 ? 'higher' : 'similar';
      const label = state.meters === STANDARD_METERS ? 'Standard' : (state.meters === YOUTH_METERS ? 'Youth' : 'Custom');
      const impact = direction === 'similar' ? 'about the same as Standard' : `${deltaPct}% ${direction} vs Standard`;
      setHint(`Pitch set: ${label} (${state.meters.toFixed(2)} m). Speeds will be ${impact}.`);
      prevMetersRef.current = state.meters;

      // Auto-hide after 3s
      const t = setTimeout(() => setHint(null), 3000);
      return () => clearTimeout(t);
    }
  }, [state.meters, onChange]);

  return (
    <div className={`pitch-selector ${className}`}>
      <label htmlFor="pitch-mode" className="label">Pitch Length</label>
      <select
        id="pitch-mode"
        className="select"
        value={state.mode}
  onChange={(e) => setMode(e.target.value as PitchMode)}
        aria-label="Select pitch length preset"
      >
        <option value="standard">Standard – 22 yd ({STANDARD_METERS} m)</option>
        <option value="youth">Youth – {YOUTH_METERS} m</option>
        <option value="custom">Custom (meters)</option>
      </select>

      {state.mode === 'custom' && (
        <div className="custom-input">
          <label htmlFor="pitch-custom" className="sr-only">Custom pitch length (meters)</label>
          <input
            id="pitch-custom"
            type="number"
            step="0.01"
            min={12}
            max={28}
            className="input"
            value={state.meters}
            onChange={(e) => setCustomMeters(parseFloat(e.target.value))}
            aria-label="Custom pitch length in meters"
          />
          <span className="hint">12–28 m</span>
        </div>
      )}

      {hint && (
        <div className="hint-banner" role="status" data-testid="pitch-hint">
          {hint}
          <button className="hint-dismiss" aria-label="Dismiss pitch hint" onClick={() => setHint(null)}>×</button>
        </div>
      )}

      <style jsx>{`
        .pitch-selector {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .label {
          font-size: 0.9rem;
          color: var(--tw-prose-invert, rgba(255,255,255,0.85));
          font-weight: 600;
        }
        .select {
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .custom-input {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .input {
          width: 120px;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .hint {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
        }
        .hint-banner {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          background: rgba(59,130,246,0.15);
          border: 1px solid rgba(59,130,246,0.4);
          color: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .hint-dismiss {
          background: transparent;
          color: inherit;
          border: none;
          font-size: 1.1rem;
          line-height: 1;
          cursor: pointer;
          padding: 0 0.25rem;
        }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      `}</style>
    </div>
  );
}
