/**
 * Unit Tests: CameraGuidance Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CameraGuidance } from '../../components/CameraGuidance';
import type { CameraDiagnostics } from '../../hooks/useCameraDiagnostics';

describe('CameraGuidance', () => {
  const createMockDiagnostics = (overrides?: Partial<CameraDiagnostics>): CameraDiagnostics => ({
    resolution: { width: 1920, height: 1080 },
    reportedFPS: 30,
    inferredFPS: 30,
    exposureStatus: 'good',
    averageBrightness: 128,
    brightnessVariance: 20,
    meetsRequirements: true,
    requirementIssues: [],
    ...overrides,
  });

  it('should show loading state when no resolution', () => {
    const diagnostics = createMockDiagnostics({ resolution: null });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText('Initializing camera...')).toBeInTheDocument();
  });

  it('should show ready status when requirements are met', () => {
    const diagnostics = createMockDiagnostics();
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText('Camera Ready')).toBeInTheDocument();
  });

  it('should show needs adjustment when requirements not met', () => {
    const diagnostics = createMockDiagnostics({
      meetsRequirements: false,
      requirementIssues: ['Low frame rate (15 fps, need 30+)'],
    });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText('Camera Needs Adjustment')).toBeInTheDocument();
  });

  it('should display technical details when enabled', () => {
    const diagnostics = createMockDiagnostics();
    render(<CameraGuidance diagnostics={diagnostics} showTechnicalDetails />);

    expect(screen.getByText('Resolution:')).toBeInTheDocument();
    expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    expect(screen.getByText('Reported FPS:')).toBeInTheDocument();
    const fpsValues = screen.getAllByText('30');
    expect(fpsValues.length).toBeGreaterThanOrEqual(1);
  });

  it('should not display technical details when disabled', () => {
    const diagnostics = createMockDiagnostics();
    render(<CameraGuidance diagnostics={diagnostics} showTechnicalDetails={false} />);

    expect(screen.queryByText('Resolution:')).not.toBeInTheDocument();
  });

  it('should show requirement issues', () => {
    const diagnostics = createMockDiagnostics({
      meetsRequirements: false,
      requirementIssues: [
        'Low frame rate (15 fps, need 30+)',
        'Insufficient lighting - increase brightness',
      ],
    });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText('Issues Detected:')).toBeInTheDocument();
    expect(screen.getByText('Low frame rate (15 fps, need 30+)')).toBeInTheDocument();
    expect(screen.getByText('Insufficient lighting - increase brightness')).toBeInTheDocument();
  });

  it('should show recommendations for low FPS', () => {
    const diagnostics = createMockDiagnostics({
      meetsRequirements: false,
      requirementIssues: ['Low frame rate (15 fps, need 30+)'],
    });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText('Recommendations:')).toBeInTheDocument();
    expect(screen.getByText('Close other apps to improve frame rate')).toBeInTheDocument();
  });

  it('should show recommendations for low light', () => {
    const diagnostics = createMockDiagnostics({
      meetsRequirements: false,
      requirementIssues: ['Insufficient lighting - increase brightness'],
    });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText('Move to a brighter location or add lighting')).toBeInTheDocument();
  });

  it('should show recommendations for motion blur', () => {
    const diagnostics = createMockDiagnostics({
      meetsRequirements: false,
      requirementIssues: ['Motion blur detected - reduce exposure time'],
    });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText('Reduce camera exposure time in settings')).toBeInTheDocument();
  });

  it('should show recommendation for low resolution', () => {
    const diagnostics = createMockDiagnostics({
      resolution: { width: 640, height: 480 },
    });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText(/Increase camera resolution/)).toBeInTheDocument();
  });

  it('should show recommendation for frame dropping', () => {
    const diagnostics = createMockDiagnostics({
      reportedFPS: 30,
      inferredFPS: 20, // Significant difference
    });
    render(<CameraGuidance diagnostics={diagnostics} />);

    expect(screen.getByText(/may be dropping frames/)).toBeInTheDocument();
  });

  it('should display exposure status in technical details', () => {
    const diagnostics = createMockDiagnostics({
      exposureStatus: 'too-high',
    });
    render(<CameraGuidance diagnostics={diagnostics} showTechnicalDetails />);

    expect(screen.getByText('Exposure:')).toBeInTheDocument();
    expect(screen.getByText('Too High')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const diagnostics = createMockDiagnostics();
    const { container } = render(
      <CameraGuidance diagnostics={diagnostics} className="custom-class" />
    );

    const element = container.querySelector('.camera-guidance');
    expect(element).toHaveClass('custom-class');
  });
});
