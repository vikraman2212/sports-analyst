/**
 * Hook for managing camera calibration profiles
 * Handles CRUD operations with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import type { CalibrationProfile, CameraConstraints } from '@/lib/types';
import { generateCalibrationId } from '@/lib/calibration/wizard';

const STORAGE_KEY = 'speedometer_calibration_profiles';
const ACTIVE_PROFILE_KEY = 'speedometer_active_calibration_id';

const DEFAULT_PITCH_METERS = 20.12; // Standard cricket pitch (22 yards)
const DEFAULT_BALL_MASS_GRAMS = 156; // Men's cricket ball

/**
 * Create a default calibration profile with hardcoded pixels
 * This will be replaced once user performs actual calibration
 */
function createDefaultProfile(): CalibrationProfile {
  return {
    id: 'default',
    name: 'Default (Uncalibrated)',
    createdAt: new Date().toISOString(),
    pitchLengthPixels: 500, // Placeholder - will be replaced by calibration
    referenceDistanceMeters: DEFAULT_PITCH_METERS,
    ballMassGrams: DEFAULT_BALL_MASS_GRAMS,
    homographyMatrix: null,
  };
}

/**
 * Load profiles from localStorage
 */
function loadProfiles(): CalibrationProfile[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [createDefaultProfile()];
    
    const profiles = JSON.parse(stored) as CalibrationProfile[];
    // Ensure default profile exists
    if (!profiles.find(p => p.id === 'default')) {
      profiles.unshift(createDefaultProfile());
    }
    return profiles;
  } catch (error) {
    console.error('Failed to load calibration profiles:', error);
    return [createDefaultProfile()];
  }
}

/**
 * Save profiles to localStorage
 */
function saveProfiles(profiles: CalibrationProfile[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Failed to save calibration profiles:', error);
  }
}

/**
 * Load active profile ID from localStorage
 */
function loadActiveProfileId(): string {
  if (typeof window === 'undefined') return 'default';
  
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || 'default';
  } catch {
    return 'default';
  }
}

/**
 * Save active profile ID to localStorage
 */
function saveActiveProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch (error) {
    console.error('Failed to save active profile ID:', error);
  }
}

export interface UseCalibrationProfilesReturn {
  profiles: CalibrationProfile[];
  activeProfile: CalibrationProfile;
  setActiveProfileId: (id: string) => void;
  createProfile: (
    name: string,
    pitchLengthPixels: number,
    referenceMeters: number,
    ballMassGrams: number,
    cameraSettings?: CameraConstraints
  ) => CalibrationProfile;
  updateProfile: (id: string, updates: Partial<CalibrationProfile>) => void;
  deleteProfile: (id: string) => void;
}

/**
 * Hook for managing calibration profiles with localStorage persistence
 */
export function useCalibrationProfiles(): UseCalibrationProfilesReturn {
  const [profiles, setProfiles] = useState<CalibrationProfile[]>(() => loadProfiles());
  const [activeProfileId, setActiveProfileIdState] = useState<string>(() => loadActiveProfileId());

  // Get active profile, fallback to default if not found
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Sync to localStorage when profiles change
  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  // Sync active profile ID to localStorage
  useEffect(() => {
    saveActiveProfileId(activeProfileId);
  }, [activeProfileId]);

  /**
   * Set active profile by ID
   */
  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
  }, []);

  /**
   * Create new calibration profile
   */
  const createProfile = useCallback((
    name: string,
    pitchLengthPixels: number,
    referenceMeters: number,
    ballMassGrams: number,
    cameraSettings?: CameraConstraints
  ): CalibrationProfile => {
    const newProfile: CalibrationProfile = {
      id: generateCalibrationId(),
      name,
      createdAt: new Date().toISOString(),
      pitchLengthPixels,
      referenceDistanceMeters: referenceMeters,
      ballMassGrams,
      homographyMatrix: null,
      cameraSettings,
      deviceInfo: {
        resolution: `${window.screen.width}x${window.screen.height}`,
        userAgent: navigator.userAgent,
      },
    };

    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileIdState(newProfile.id);

    return newProfile;
  }, []);

  /**
   * Update existing profile
   */
  const updateProfile = useCallback((id: string, updates: Partial<CalibrationProfile>) => {
    setProfiles(prev =>
      prev.map(profile =>
        profile.id === id
          ? { ...profile, ...updates }
          : profile
      )
    );
  }, []);

  /**
   * Delete profile (cannot delete default)
   */
  const deleteProfile = useCallback((id: string) => {
    if (id === 'default') {
      console.warn('Cannot delete default calibration profile');
      return;
    }

    setProfiles(prev => prev.filter(p => p.id !== id));

    // If deleted profile was active, switch to default
    if (activeProfileId === id) {
      setActiveProfileIdState('default');
    }
  }, [activeProfileId]);

  return {
    profiles,
    activeProfile,
    setActiveProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}
