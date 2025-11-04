/**
 * Integration test for calibration workflow
 * Tests calibration profile storage and retrieval
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalibrationProfiles } from '../../hooks/useCalibrationProfiles';

const STORAGE_KEY = 'speedometer_calibration_profiles';
const ACTIVE_PROFILE_KEY = 'speedometer_active_calibration_id';

describe('Calibration Profile Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and store calibration profile', () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    // Initially should have default profile only
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.activeProfile?.id).toBe('default');

    // Create new calibration profile
    act(() => {
      result.current.createProfile(
        'Test Calibration',
        485, // pitchLengthPixels
        20.12, // referenceDistanceMeters
        156 // ballMassGrams
      );
    });

    // Should have 2 profiles now (default + new)
    expect(result.current.profiles).toHaveLength(2);
    
    // New profile should be active
    expect(result.current.activeProfile?.id).not.toBe('default');
    expect(result.current.activeProfile?.name).toBe('Test Calibration');
    expect(result.current.activeProfile?.pitchLengthPixels).toBe(485);
    expect(result.current.activeProfile?.referenceDistanceMeters).toBe(20.12);
  });

  it('should persist calibration to localStorage', async () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    act(() => {
      result.current.createProfile('Persisted Calibration', 600, 20.12, 156);
    });

    // Wait for localStorage sync (happens in useEffect)
    await waitFor(() => {
      const storedData = localStorage.getItem(STORAGE_KEY);
      expect(storedData).toBeTruthy();
    });

    const storedData = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(storedData!);
    
    expect(parsed).toHaveLength(2); // Array of profiles
    expect(parsed[1].name).toBe('Persisted Calibration');
    expect(parsed[1].pitchLengthPixels).toBe(600);

    // Check active profile ID stored separately
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    expect(activeId).not.toBe('default');
  });

  it('should load calibration from localStorage on mount', () => {
    // Pre-populate localStorage with correct structure
    const testProfile = {
      id: 'test-123',
      name: 'Preloaded Calibration',
      pitchLengthPixels: 550,
      referenceDistanceMeters: 20.12,
      ballMassGrams: 156,
      createdAt: new Date().toISOString(),
      homographyMatrix: null,
    };

    const defaultProfile = {
      id: 'default',
      name: 'Default (Uncalibrated)',
      pitchLengthPixels: 500,
      referenceDistanceMeters: 20.12,
      ballMassGrams: 156,
      createdAt: new Date().toISOString(),
      homographyMatrix: null,
    };

    // Store as array (not object with profiles property)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultProfile, testProfile]));
    localStorage.setItem(ACTIVE_PROFILE_KEY, 'test-123');

    // Mount hook
    const { result } = renderHook(() => useCalibrationProfiles());

    // Should load from localStorage
    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.activeProfile?.id).toBe('test-123');
    expect(result.current.activeProfile?.pitchLengthPixels).toBe(550);
  });

  it('should update existing calibration profile', () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    // Create initial profile
    act(() => {
      result.current.createProfile('Original', 485, 20.12, 156);
    });

    const profileId = result.current.activeProfile!.id;

    // Update profile
    act(() => {
      result.current.updateProfile(profileId, {
        name: 'Updated Calibration',
        pitchLengthPixels: 600,
      });
    });

    // Verify updates
    expect(result.current.activeProfile?.name).toBe('Updated Calibration');
    expect(result.current.activeProfile?.pitchLengthPixels).toBe(600);
    expect(result.current.activeProfile?.referenceDistanceMeters).toBe(20.12); // Unchanged
  });

  it('should delete non-default calibration profile', () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    // Create profile
    act(() => {
      result.current.createProfile('To Delete', 485, 20.12, 156);
    });

    const profileId = result.current.activeProfile!.id;
    expect(result.current.profiles).toHaveLength(2);

    // Delete profile
    act(() => {
      result.current.deleteProfile(profileId);
    });

    // Should revert to default
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.activeProfile?.id).toBe('default');
  });

  it('should prevent deletion of default profile', () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    // Try to delete default
    act(() => {
      result.current.deleteProfile('default');
    });

    // Default should still exist
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].id).toBe('default');
  });

  it('should switch active profile', () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    // Create two profiles
    act(() => {
      result.current.createProfile('Profile 1', 485, 20.12, 156);
    });

    const profile1Id = result.current.activeProfile!.id;

    act(() => {
      result.current.createProfile('Profile 2', 600, 20.12, 156);
    });

    expect(result.current.profiles).toHaveLength(3); // default + 2 new

    // Switch back to profile 1
    act(() => {
      result.current.setActiveProfileId(profile1Id);
    });

    expect(result.current.activeProfile?.id).toBe(profile1Id);
    expect(result.current.activeProfile?.pitchLengthPixels).toBe(485);
  });

  it('should create profiles with correct calculated values', () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    act(() => {
      result.current.createProfile('Test', 485, 20.12, 156);
    });

    const profile = result.current.activeProfile!;
    
    // Check calculated pixels per meter
    const expectedRatio = 485 / 20.12;
    expect(profile.pitchLengthPixels / profile.referenceDistanceMeters).toBeCloseTo(expectedRatio, 2);
  });

  it('should handle multiple sequential calibrations', () => {
    const { result } = renderHook(() => useCalibrationProfiles());

    // Create multiple calibrations
    for (let i = 1; i <= 5; i++) {
      act(() => {
        result.current.createProfile(
          `Calibration ${i}`,
          400 + i * 10,
          20.12,
          156
        );
      });
    }

    // Should have default + 5 new = 6 total
    expect(result.current.profiles).toHaveLength(6);
    
    // Last one should be active
    expect(result.current.activeProfile?.name).toBe('Calibration 5');
    expect(result.current.activeProfile?.pitchLengthPixels).toBe(450);
  });
});
