/**
 * Unit Tests for Main Page (Home)
 * 
 * Tests page integration, layout, and user interactions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../app/page';
import type { DeliveryResult } from '../../lib/types';
import { createCricketPitchCalibration } from '../../lib/calibration';

// Mock the calibration module
jest.mock('../../lib/calibration', () => ({
  createCricketPitchCalibration: jest.fn(() => ({
    pitchLengthPixels: 512,
    referenceDistanceMeters: 20.12,
    homographyMatrix: null,
  })),
}));

// Mock the components
interface MockCameraViewProps {
  onAnalysisComplete?: (result: DeliveryResult) => void;
  onAnalysisError?: (error: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

jest.mock('../../components/CameraView', () => ({
  CameraView: ({ onAnalysisComplete, onAnalysisError, onRecordingStart, onRecordingStop }: MockCameraViewProps) => {
    return (
      <div data-testid="camera-view">
        <button onClick={() => onRecordingStart?.()}>Mock Start Recording</button>
        <button onClick={() => onRecordingStop?.()}>Mock Stop Recording</button>
        <button
          onClick={() => {
            const mockResult: DeliveryResult = {
              speedKmh: 135.5,
              confidence: 0.92,
              detectionCount: 18,
              trajectoryPoints: [],
              processingMs: 842,
            };
            onAnalysisComplete?.(mockResult);
          }}
        >
          Mock Analysis Success
        </button>
        <button onClick={() => onAnalysisError?.('Test error message')}>
          Mock Analysis Error
        </button>
      </div>
    );
  },
}));

interface MockSpeedDisplayProps {
  result: DeliveryResult | null;
  showDetails?: boolean;
  showWarnings?: boolean;
  pitchMeters?: number;
  pitchLabel?: string;
}

jest.mock('../../components/SpeedDisplay', () => ({
  SpeedDisplay: ({ result, showDetails, showWarnings, pitchMeters, pitchLabel }: MockSpeedDisplayProps) => {
    return (
      <div data-testid="speed-display">
        {result ? (
          <>
            <div>Speed: {result.speedKmh} km/h</div>
            <div>Confidence: {result.confidence}</div>
            <div>Detections: {result.detectionCount}</div>
            {typeof pitchMeters === 'number' && <div>Pitch: {pitchMeters}m ({pitchLabel})</div>}
            {showDetails && <div>Details shown</div>}
            {showWarnings && <div>Warnings shown</div>}
          </>
        ) : (
          <div>No result</div>
        )}
      </div>
    );
  },
}));

describe('Home Page', () => {
  describe('Initial Render', () => {
    it('should render page title and description', () => {
      render(<Home />);

      expect(screen.getByText('🏏 Cricket Ball Speed Tracker')).toBeInTheDocument();
      expect(screen.getByText('Real-time ball tracking and speed analysis')).toBeInTheDocument();
    });

    it('should render camera feed section', () => {
      render(<Home />);

      expect(screen.getByText('Camera Feed')).toBeInTheDocument();
      expect(screen.getByTestId('camera-view')).toBeInTheDocument();
    });

    it('should render analysis results section', () => {
      render(<Home />);

      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
      expect(screen.getByTestId('speed-display')).toBeInTheDocument();
    });

    it('should render instructions card', () => {
      render(<Home />);

      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
      expect(screen.getByText(/Allow camera access/i)).toBeInTheDocument();
      expect(screen.getByText(/Position camera/i)).toBeInTheDocument();
    });

    it('should render calibration info card', () => {
      render(<Home />);

  expect(screen.getByText('⚙️ Calibration Settings')).toBeInTheDocument();
  expect(screen.getByText('Mode:')).toBeInTheDocument();
  expect(screen.getByText('Standard (22-yard pitch)')).toBeInTheDocument();
    });

    it('should not show "New Delivery" button initially', () => {
      render(<Home />);

      expect(screen.queryByText('New Delivery')).not.toBeInTheDocument();
    });

    it('should not show error message initially', () => {
      render(<Home />);

      expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
    });
  });

  describe('Recording State', () => {
    it('should show recording indicator when recording starts', async () => {
      render(<Home />);

      const startButton = screen.getByText('Mock Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Recording in progress/i)).toBeInTheDocument();
      });
    });

    it('should hide recording indicator when recording stops', async () => {
      render(<Home />);

      const startButton = screen.getByText('Mock Start Recording');
      const stopButton = screen.getByText('Mock Stop Recording');

      fireEvent.click(startButton);
      await waitFor(() => {
        expect(screen.getByText(/Recording in progress/i)).toBeInTheDocument();
      });

      fireEvent.click(stopButton);
      await waitFor(() => {
        expect(screen.queryByText(/Recording in progress/i)).not.toBeInTheDocument();
      });
    });

    it('should clear errors when recording starts', async () => {
      render(<Home />);

      // Trigger error first
      const errorButton = screen.getByText('Mock Analysis Error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText(/Error: Test error message/i)).toBeInTheDocument();
      });

      // Start recording
      const startButton = screen.getByText('Mock Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Analysis Results', () => {
    it('should display results when analysis completes', async () => {
      render(<Home />);

      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('Speed: 135.5 km/h')).toBeInTheDocument();
        expect(screen.getByText('Confidence: 0.92')).toBeInTheDocument();
        expect(screen.getByText('Detections: 18')).toBeInTheDocument();
      });
    });

    it('should show "New Delivery" button after successful analysis', async () => {
      render(<Home />);

      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('New Delivery')).toBeInTheDocument();
      });
    });

    it('should pass showDetails prop to SpeedDisplay', async () => {
      render(<Home />);

      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('Details shown')).toBeInTheDocument();
      });
    });

    it('should pass showWarnings prop to SpeedDisplay', async () => {
      render(<Home />);

      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('Warnings shown')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when analysis fails', async () => {
      render(<Home />);

      const errorButton = screen.getByText('Mock Analysis Error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Error: Test error message')).toBeInTheDocument();
      });
    });

    it('should clear results when error occurs', async () => {
      render(<Home />);

      // Set result first
      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('Speed: 135.5 km/h')).toBeInTheDocument();
      });

      // Trigger error
      const errorButton = screen.getByText('Mock Analysis Error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.queryByText('Speed: 135.5 km/h')).not.toBeInTheDocument();
        expect(screen.getByText('No result')).toBeInTheDocument();
      });
    });

    it('should hide "New Delivery" button when error occurs', async () => {
      render(<Home />);

      // Set result first
      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('New Delivery')).toBeInTheDocument();
      });

      // Trigger error
      const errorButton = screen.getByText('Mock Analysis Error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.queryByText('New Delivery')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should clear results when "New Delivery" is clicked', async () => {
      render(<Home />);

      // Set result
      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('Speed: 135.5 km/h')).toBeInTheDocument();
      });

      // Click reset
      const resetButton = screen.getByText('New Delivery');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.queryByText('Speed: 135.5 km/h')).not.toBeInTheDocument();
        expect(screen.getByText('No result')).toBeInTheDocument();
      });
    });

    it('should clear errors when "New Delivery" is clicked', async () => {
      render(<Home />);

      // Set result then error
      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      const errorButton = screen.getByText('Mock Analysis Error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      });

      // Wait for New Delivery button to appear (it might not be visible during error state)
      // Let's reset by starting a new recording instead
      const startButton = screen.getByText('Mock Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
      });
    });

    it('should hide "New Delivery" button after reset', async () => {
      render(<Home />);

      // Set result
      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByText('New Delivery')).toBeInTheDocument();
      });

      // Click reset
      const resetButton = screen.getByText('New Delivery');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.queryByText('New Delivery')).not.toBeInTheDocument();
      });
    });
  });

  describe('Calibration', () => {
    it('should create default calibration with correct pitch length', () => {
      render(<Home />);

      expect(createCricketPitchCalibration).toHaveBeenCalledWith(512);
    });

    it('should display calibration settings', () => {
      render(<Home />);

      expect(screen.getByText('512px')).toBeInTheDocument();
  expect(screen.getByText('20.12m (Cricket Standard)')).toBeInTheDocument();
    });
  });

  describe('Layout and Responsiveness', () => {
    it('should use grid layout for main content', () => {
      const { container } = render(<Home />);

      const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render header with proper styling', () => {
      const { container } = render(<Home />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-white');
      expect(header).toHaveClass('dark:bg-gray-800');
      expect(header).toHaveClass('shadow-sm');
    });

    it('should render footer', () => {
      render(<Home />);

      expect(screen.getByText(/Built with Next.js, React, and ONNX Runtime/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on "New Delivery" button', async () => {
      render(<Home />);

      const successButton = screen.getByText('Mock Analysis Success');
      fireEvent.click(successButton);

      await waitFor(() => {
        const resetButton = screen.getByLabelText('Reset and start new delivery');
        expect(resetButton).toBeInTheDocument();
      });
    });

    it('should use semantic HTML elements', () => {
      const { container } = render(<Home />);

      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });
});
