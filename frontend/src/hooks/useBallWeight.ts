/**
 * useBallWeight Hook
 *
 * Manages the selected ball weight (in grams) with presets and persistence.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const LS_KEY_MODE = 'speedometer.ball.mode';
const LS_KEY_CUSTOM_GRAMS = 'speedometer.ball.customGrams';

export type BallWeightMode = 'standard' | 'youth' | 'custom';

export const STANDARD_GRAMS = 156; // Men's cricket ball (155.9-163.0g)
export const YOUTH_GRAMS = 135; // Women's/youth cricket ball (133-143g)

export interface BallWeightState {
  mode: BallWeightMode;
  grams: number; // effective grams for current mode
}

export interface UseBallWeight {
  state: BallWeightState;
  setMode: (mode: BallWeightMode) => void;
  setCustomGrams: (grams: number) => void;
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

export function useBallWeight(): UseBallWeight {
  const [mode, setModeState] = useState<BallWeightMode>('standard');
  const [customGrams, setCustomGramsState] = useState<number>(156);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedMode = readLocalStorage<BallWeightMode>(LS_KEY_MODE);
    const savedCustom = readLocalStorage<number>(LS_KEY_CUSTOM_GRAMS);
    if (savedMode) setModeState(savedMode);
    if (typeof savedCustom === 'number' && !Number.isNaN(savedCustom)) {
      setCustomGramsState(savedCustom);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    writeLocalStorage(LS_KEY_MODE, mode);
  }, [mode]);

  useEffect(() => {
    writeLocalStorage(LS_KEY_CUSTOM_GRAMS, customGrams);
  }, [customGrams]);

  const grams = useMemo(() => {
    if (mode === 'standard') return STANDARD_GRAMS;
    if (mode === 'youth') return YOUTH_GRAMS;
    return customGrams;
  }, [mode, customGrams]);

  const setMode = useCallback((m: BallWeightMode) => {
    setModeState(m);
  }, []);

  const setCustomGrams = useCallback((g: number) => {
    // Clamp to reasonable ball weight ranges (50g - 300g)
    const clamped = Math.max(50, Math.min(300, Number(g)));
    setCustomGramsState(clamped);
  }, []);

  return {
    state: { mode, grams },
    setMode,
    setCustomGrams,
  };
}
