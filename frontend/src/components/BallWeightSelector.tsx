/**
 * BallWeightSelector Component
 *
 * Allows users to choose ball weight preset (Standard 156g, Youth/Women's 135g) or enter a custom value.
 */
'use client';

import React from 'react';
import { useBallWeight, STANDARD_GRAMS, YOUTH_GRAMS, type BallWeightMode } from '@/hooks/useBallWeight';

export interface BallWeightSelectorProps {
  onChange?: (grams: number) => void;
  className?: string;
}

export function BallWeightSelector({ onChange, className = '' }: BallWeightSelectorProps) {
  const { state, setMode, setCustomGrams } = useBallWeight();
  const [hint, setHint] = React.useState<string | null>(null);
  const prevGramsRef = React.useRef<number>(state.grams);

  React.useEffect(() => {
    onChange?.(state.grams);
    const prev = prevGramsRef.current;
    if (prev !== state.grams) {
      const label = state.grams === STANDARD_GRAMS ? 'Standard' : (state.grams === YOUTH_GRAMS ? 'Youth/Women\'s' : 'Custom');
      setHint(`Ball weight set: ${label} (${state.grams}g). Affects drag and trajectory smoothing.`);
      prevGramsRef.current = state.grams;

      // Auto-hide after 3s
      const t = setTimeout(() => setHint(null), 3000);
      return () => clearTimeout(t);
    }
  }, [state.grams, onChange]);

  return (
    <div className={`ball-weight-selector ${className}`}>
      <label htmlFor="ball-weight-mode" className="label">Ball Weight</label>
      <select
        id="ball-weight-mode"
        className="select"
        value={state.mode}
        onChange={(e) => setMode(e.target.value as BallWeightMode)}
        aria-label="Select ball weight preset"
      >
        <option value="standard">Standard – {STANDARD_GRAMS}g (Men&apos;s)</option>
        <option value="youth">Youth/Women&apos;s – {YOUTH_GRAMS}g</option>
        <option value="custom">Custom (grams)</option>
      </select>

      {state.mode === 'custom' && (
        <div className="custom-input">
          <label htmlFor="ball-weight-custom" className="sr-only">Custom ball weight (grams)</label>
          <input
            id="ball-weight-custom"
            type="number"
            step="1"
            min={50}
            max={300}
            className="input"
            value={state.grams}
            onChange={(e) => setCustomGrams(parseInt(e.target.value, 10))}
            aria-label="Custom ball weight in grams"
          />
          <span className="hint">50–300g</span>
        </div>
      )}

      {hint && (
        <div className="hint-banner" role="status" data-testid="ball-weight-hint">
          {hint}
          <button className="hint-dismiss" aria-label="Dismiss ball weight hint" onClick={() => setHint(null)}>×</button>
        </div>
      )}

      <style jsx>{`
        .ball-weight-selector {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .label {
          font-size: 0.9rem;
          color: #374151;
          font-weight: 600;
        }
        @media (prefers-color-scheme: dark) {
          .label {
            color: #f3f4f6;
          }
        }
        .select {
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          color: #1f2937;
          font-size: 0.9rem;
        }
        @media (prefers-color-scheme: dark) {
          .select {
            border-color: #4b5563;
            background: #1f2937;
            color: #f3f4f6;
          }
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
          border: 1px solid #e5e7eb;
          background: white;
          color: #1f2937;
          font-size: 0.9rem;
        }
        @media (prefers-color-scheme: dark) {
          .input {
            border-color: #4b5563;
            background: #1f2937;
            color: #f3f4f6;
          }
        }
        .hint {
          font-size: 0.8rem;
          color: #6b7280;
        }
        @media (prefers-color-scheme: dark) {
          .hint {
            color: #9ca3af;
          }
        }
        .hint-banner {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          background: #dbeafe;
          border: 1px solid #93c5fd;
          color: #1e40af;
          font-size: 0.85rem;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        @media (prefers-color-scheme: dark) {
          .hint-banner {
            background: #1e3a8a;
            border-color: #3b82f6;
            color: #bfdbfe;
          }
        }
        .hint-dismiss {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          line-height: 1;
          padding: 0 0.25rem;
        }
        .hint-dismiss:hover {
          opacity: 1;
        }
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
      `}</style>
    </div>
  );
}
