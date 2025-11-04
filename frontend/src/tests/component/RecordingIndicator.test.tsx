/**
 * Component tests for RecordingIndicator
 * 
 * Tests:
 * - Renders nothing when not recording
 * - Shows REC badge when recording
 * - Displays frame count
 * - Shows countdown when ball missing
 * - Updates progress ring correctly
 * - Manual stop button works
 * - Mobile responsive layout
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { RecordingIndicator } from '@/components/RecordingIndicator';
import type { AutoStopState } from '@/hooks/useAutoStop';

describe('RecordingIndicator', () => {
  const mockOnManualStop = jest.fn();

  const defaultAutoStopState: AutoStopState = {
    isActive: true,
    consecutiveEmptyFrames: 0,
    totalFrames: 10,
    shouldStop: false,
    countdownProgress: 0,
    reason: null,
    framesRemaining: 30,
  };

  beforeEach(() => {
    mockOnManualStop.mockClear();
  });

  describe('Rendering States', () => {
    it('renders nothing when not recording', () => {
      const { container } = render(
        <RecordingIndicator
          isRecording={false}
          autoStopState={defaultAutoStopState}
          onManualStop={mockOnManualStop}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows REC badge when recording', () => {
      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={defaultAutoStopState}
          onManualStop={mockOnManualStop}
          frameCount={25}
        />
      );

      expect(screen.getByLabelText('Recording in progress')).toBeInTheDocument();
      expect(screen.getByText('REC')).toBeInTheDocument();
      expect(screen.getByText('25 frames')).toBeInTheDocument();
    });

    it('shows stop button', () => {
      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={defaultAutoStopState}
          onManualStop={mockOnManualStop}
        />
      );

      const stopButton = screen.getByLabelText('Stop recording manually');
      expect(stopButton).toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
  });

  describe('Countdown Display', () => {
    it('shows countdown when ball is missing', () => {
      const autoStopState: AutoStopState = {
        ...defaultAutoStopState,
        consecutiveEmptyFrames: 10,
        countdownProgress: 0.33,
        framesRemaining: 20,
      };

      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={autoStopState}
          fps={30}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByText('Auto-stopping in')).toBeInTheDocument();
      expect(screen.getByText(/20 frames/)).toBeInTheDocument();
      expect(screen.getByText(/0\.7s/)).toBeInTheDocument(); // 20/30 ≈ 0.7s
    });

    it('does not show countdown when ball is present', () => {
      const autoStopState: AutoStopState = {
        ...defaultAutoStopState,
        consecutiveEmptyFrames: 0,
        countdownProgress: 0,
        framesRemaining: 30,
      };

      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={autoStopState}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.queryByText('Auto-stopping in')).not.toBeInTheDocument();
    });

    it('updates countdown as frames progress', () => {
      const { rerender } = render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={{
            ...defaultAutoStopState,
            consecutiveEmptyFrames: 5,
            framesRemaining: 25,
          }}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByText(/25 frames/)).toBeInTheDocument();

      rerender(
        <RecordingIndicator
          isRecording={true}
          autoStopState={{
            ...defaultAutoStopState,
            consecutiveEmptyFrames: 15,
            framesRemaining: 15,
          }}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByText(/15 frames/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onManualStop when stop button clicked', () => {
      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={defaultAutoStopState}
          onManualStop={mockOnManualStop}
        />
      );

      const stopButton = screen.getByLabelText('Stop recording manually');
      fireEvent.click(stopButton);

      expect(mockOnManualStop).toHaveBeenCalledTimes(1);
    });

    it('stop button works during countdown', () => {
      const autoStopState: AutoStopState = {
        ...defaultAutoStopState,
        consecutiveEmptyFrames: 20,
        countdownProgress: 0.67,
        framesRemaining: 10,
      };

      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={autoStopState}
          onManualStop={mockOnManualStop}
        />
      );

      const stopButton = screen.getByLabelText('Stop recording manually');
      fireEvent.click(stopButton);

      expect(mockOnManualStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const autoStopState: AutoStopState = {
        ...defaultAutoStopState,
        consecutiveEmptyFrames: 10,
        framesRemaining: 20,
      };

      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={autoStopState}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Auto-stopping in 20 frames'
      );
      expect(screen.getByLabelText('Recording in progress')).toBeInTheDocument();
      expect(screen.getByLabelText('Stop recording manually')).toBeInTheDocument();
    });

    it('updates aria-label when countdown changes', () => {
      const { rerender } = render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={{
            ...defaultAutoStopState,
            consecutiveEmptyFrames: 25,
            framesRemaining: 5,
          }}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Auto-stopping in 5 frames'
      );

      rerender(
        <RecordingIndicator
          isRecording={true}
          autoStopState={{
            ...defaultAutoStopState,
            consecutiveEmptyFrames: 0,
            framesRemaining: 30,
          }}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Recording');
    });
  });

  describe('FPS Calculations', () => {
    it('formats time correctly at 30 FPS', () => {
      const autoStopState: AutoStopState = {
        ...defaultAutoStopState,
        consecutiveEmptyFrames: 15,
        framesRemaining: 15,
      };

      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={autoStopState}
          fps={30}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByText(/0\.5s/)).toBeInTheDocument(); // 15/30 = 0.5s
    });

    it('formats time correctly at 60 FPS', () => {
      const autoStopState: AutoStopState = {
        ...defaultAutoStopState,
        consecutiveEmptyFrames: 30,
        framesRemaining: 30,
      };

      render(
        <RecordingIndicator
          isRecording={true}
          autoStopState={autoStopState}
          fps={60}
          onManualStop={mockOnManualStop}
        />
      );

      expect(screen.getByText(/0\.5s/)).toBeInTheDocument(); // 30/60 = 0.5s
    });
  });
});
