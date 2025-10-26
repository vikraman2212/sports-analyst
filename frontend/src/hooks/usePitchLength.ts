/**
 * usePitchLength Hook
 *
 * Manages the selected pitch length (in meters) with presets and persistence.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const LS_KEY_MODE = 'speedometer.pitch.mode';
const LS_KEY_CUSTOM_METERS = 'speedometer.pitch.customMeters';

export type PitchMode = 'standard' | 'youth' | 'custom';

export const STANDARD_METERS = 20.12;
export const YOUTH_METERS = 16.0;

export interface PitchLengthState {
  mode: PitchMode;
  meters: number; // effective meters for current mode
}

export interface UsePitchLength {
  state: PitchLengthState;
  setMode: (mode: PitchMode) => void;
  setCustomMeters: (meters: number) => void;
}

function readLocalStorage<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function usePitchLength(): UsePitchLength {
  const [mode, setModeState] = useState<PitchMode>('standard');
  const [customMeters, setCustomMetersState] = useState<number>(16.0);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedMode = readLocalStorage<PitchMode>(LS_KEY_MODE);
    const savedCustom = readLocalStorage<number>(LS_KEY_CUSTOM_METERS);
    if (savedMode) setModeState(savedMode);
    if (typeof savedCustom === 'number' && !Number.isNaN(savedCustom)) {
      setCustomMetersState(savedCustom);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    writeLocalStorage(LS_KEY_MODE, mode);
  }, [mode]);

  useEffect(() => {
    writeLocalStorage(LS_KEY_CUSTOM_METERS, customMeters);
  }, [customMeters]);

  const meters = useMemo(() => {
    if (mode === 'standard') return STANDARD_METERS;
    if (mode === 'youth') return YOUTH_METERS;
    return customMeters;
  }, [mode, customMeters]);

  const setMode = useCallback((m: PitchMode) => {
    setModeState(m);
  }, []);

  const setCustomMeters = useCallback((m: number) => {
    // Clamp to reasonable cricket pitch ranges (12m - 28m)
    const clamped = Math.max(12, Math.min(28, Number(m)));
    setCustomMetersState(clamped);
  }, []);

  return {
    state: { mode, meters },
    setMode,
    setCustomMeters,
  };
}
