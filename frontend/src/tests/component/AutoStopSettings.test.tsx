/**
 * Component tests for AutoStopSettings
 * 
 * Tests:
 * - Renders settings panel
 * - Preset buttons work
 * - Custom slider works
 * - Enable/disable toggle
 * - Save/Cancel buttons
 * - localStorage persistence
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutoStopSettings, useAutoStopSettings } from '@/components/AutoStopSettings';
import { renderHook, act } from '@testing-library/react';

describe('AutoStopSettings', () => {
  const mockOnThresholdChange = jest.fn();
  const mockOnEnabledChange = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnThresholdChange.mockClear();
    mockOnEnabledChange.mockClear();
    mockOnClose.mockClear();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('renders settings panel with title', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Auto-Stop Settings')).toBeInTheDocument();
    });

    it('renders all preset buttons', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByText('Quick')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Patient')).toBeInTheDocument();
    });

    it('shows enabled toggle', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('shows custom slider', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const slider = screen.getByLabelText(/Threshold: 30 frames/);
      expect(slider).toHaveValue('30');
    });
  });

  describe('Preset Selection', () => {
    it('highlights current threshold preset', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const normalButton = screen.getByRole('button', { name: /Normal/ });
      expect(normalButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('changes threshold when preset clicked', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
          onClose={mockOnClose}
        />
      );

      const quickButton = screen.getByRole('button', { name: /Quick/ });
      fireEvent.click(quickButton);

      // Click save to apply
      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      expect(mockOnThresholdChange).toHaveBeenCalledWith(15);
    });

    it('updates slider when preset selected', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const patientButton = screen.getByRole('button', { name: /Patient/ });
      fireEvent.click(patientButton);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('60');
    });
  });

  describe('Custom Slider', () => {
    it('updates threshold value', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '45' } });

      expect(screen.getByText('45 frames')).toBeInTheDocument();
    });

    it('shows time estimation', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          fps={30}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByText(/1\.0s/)).toBeInTheDocument(); // 30/30 = 1.0s
    });

    it('shows recommended badge at recommended threshold', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          fps={30}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByText(/Recommended for 30 FPS/)).toBeInTheDocument();
    });
  });

  describe('Enable/Disable Toggle', () => {
    it('toggles enabled state', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
          onClose={mockOnClose}
        />
      );

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      // Click save
      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      expect(mockOnEnabledChange).toHaveBeenCalledWith(false);
    });

    it('hides presets and slider when disabled', () => {
      const { rerender } = render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByText('Presets')).toBeInTheDocument();

      // Re-render with disabled
      rerender(
        <AutoStopSettings
          threshold={30}
          enabled={false}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.queryByText('Presets')).not.toBeInTheDocument();
    });
  });

  describe('Save and Cancel', () => {
    it('saves settings and closes on save button', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
          onClose={mockOnClose}
        />
      );

      // Change threshold
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '45' } });

      // Click save
      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      expect(mockOnThresholdChange).toHaveBeenCalledWith(45);
      expect(mockOnEnabledChange).toHaveBeenCalledWith(true);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('reverts changes on cancel', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
          onClose={mockOnClose}
        />
      );

      // Change threshold
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '60' } });

      // Verify value changed in slider display
      const valueDisplay = screen.getAllByText(/60 frames/);
      expect(valueDisplay.length).toBeGreaterThan(0);

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnThresholdChange).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on X button', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close settings');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on overlay click', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
          onClose={mockOnClose}
        />
      );

      const overlay = document.querySelector('.settings-overlay');
      fireEvent.click(overlay!);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('localStorage Persistence', () => {
    it('saves settings to localStorage on save', () => {
      render(
        <AutoStopSettings
          threshold={30}
          enabled={true}
          onThresholdChange={mockOnThresholdChange}
          onEnabledChange={mockOnEnabledChange}
          onClose={mockOnClose}
        />
      );

      // Change settings
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '45' } });

      // Save
      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      // Check localStorage
      const stored = localStorage.getItem('speedometer_auto_stop_settings');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.threshold).toBe(45);
      expect(parsed.enabled).toBe(true);
    });
  });
});

describe('useAutoStopSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default values', () => {
    const { result } = renderHook(() => useAutoStopSettings());

    expect(result.current.threshold).toBe(30);
    expect(result.current.enabled).toBe(true);
  });

  it('loads from localStorage', async () => {
    localStorage.setItem(
      'speedometer_auto_stop_settings',
      JSON.stringify({ threshold: 60, enabled: false })
    );

    const { result } = renderHook(() => useAutoStopSettings());

    await waitFor(() => {
      expect(result.current.threshold).toBe(60);
      expect(result.current.enabled).toBe(false);
    });
  });

  it('allows updating threshold', () => {
    const { result } = renderHook(() => useAutoStopSettings());

    act(() => {
      result.current.setThreshold(45);
    });

    expect(result.current.threshold).toBe(45);
  });

  it('allows updating enabled state', () => {
    const { result } = renderHook(() => useAutoStopSettings());

    act(() => {
      result.current.setEnabled(false);
    });

    expect(result.current.enabled).toBe(false);
  });
});
