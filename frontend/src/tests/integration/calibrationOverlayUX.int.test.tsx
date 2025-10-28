/**
 * Integration test for calibration overlay UX improvements
 * Verifies that calibration overlay doesn't interfere with other UI elements
 */

import { render, screen } from '@testing-library/react';
import { CameraCalibrator } from '@/components/CameraCalibrator';
import userEvent from '@testing-library/user-event';

describe('Calibration Overlay UX Integration', () => {
  let mockVideoRef: React.RefObject<HTMLVideoElement>;
  let mockOnComplete: jest.Mock;
  let mockOnCancel: jest.Mock;

  beforeEach(() => {
    // Create mock video element with dimensions
    const mockVideoElement = document.createElement('video');
    Object.defineProperty(mockVideoElement, 'videoWidth', {
      value: 1920,
      writable: false,
    });
    Object.defineProperty(mockVideoElement, 'videoHeight', {
      value: 1080,
      writable: false,
    });

    mockVideoRef = { current: mockVideoElement };

    mockOnComplete = jest.fn();
    mockOnCancel = jest.fn();
  });

  it('should have proper positioning to not escape container', () => {
    const { container } = render(
      <div className="relative">
        <CameraCalibrator
          videoRef={mockVideoRef}
          pitchLengthMeters={20.12}
          onCalibrationComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </div>
    );

    const overlay = container.querySelector('[role="application"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('absolute');
    expect(overlay).toHaveClass('inset-0');
    
    // Should use z-index from CSS variable
    expect(overlay).toHaveStyle({ zIndex: 'var(--z-calibration, 20)' });
  });

  it('should dismiss on Escape key press', async () => {
    const user = userEvent.setup();
    
    render(
      <CameraCalibrator
        videoRef={mockVideoRef}
        pitchLengthMeters={20.12}
        onCalibrationComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Press Escape key
    await user.keyboard('{Escape}');

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should have accessible label mentioning Escape key', () => {
    render(
      <CameraCalibrator
        videoRef={mockVideoRef}
        pitchLengthMeters={20.12}
        onCalibrationComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    const overlay = screen.getByRole('application');
    expect(overlay).toHaveAccessibleName(/escape/i);
  });

  it('should show ESC hint in instructions', () => {
    render(
      <CameraCalibrator
        videoRef={mockVideoRef}
        pitchLengthMeters={20.12}
        onCalibrationComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/press esc to cancel/i)).toBeInTheDocument();
  });

  it('should not prevent pointer events on elements outside the container', () => {
    const { container } = render(
      <div data-testid="parent">
        <button data-testid="outside-button">Outside Button</button>
        <div className="relative">
          <CameraCalibrator
            videoRef={mockVideoRef}
            pitchLengthMeters={20.12}
            onCalibrationComplete={mockOnComplete}
            onCancel={mockOnCancel}
          />
        </div>
      </div>
    );

    const overlay = container.querySelector('[role="application"]');
    const outsideButton = screen.getByTestId('outside-button');

    // Overlay should be absolute, not fixed
    expect(overlay).toHaveClass('absolute');
    expect(overlay).not.toHaveClass('fixed');
    
    // Outside button should not be covered by overlay
    // (overlay is contained within the relative div, doesn't escape)
    expect(outsideButton).toBeVisible();
  });

  it('should maintain z-index hierarchy', () => {
    const { container } = render(
      <>
        <div className="camera-guidance" style={{ zIndex: 10 }}>
          Guidance
        </div>
        <CameraCalibrator
          videoRef={mockVideoRef}
          pitchLengthMeters={20.12}
          onCalibrationComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
        <div className="camera-settings" style={{ zIndex: 30 }}>
          Settings
        </div>
      </>
    );

    const calibrationOverlay = container.querySelector('[role="application"]');
    
    // Calibration should have z-index 20 (between guidance 10 and settings 30)
    expect(calibrationOverlay).toHaveStyle({ zIndex: 'var(--z-calibration, 20)' });
  });
});
