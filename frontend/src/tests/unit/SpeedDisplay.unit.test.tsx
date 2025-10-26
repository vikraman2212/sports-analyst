/**
 * Unit tests for SpeedDisplay component
 * 
 * Tests the speed display UI component including:
 * - Empty state rendering
 * - Result display with metrics
 * - Confidence indicators
 * - Warning messages
 * - Responsive behavior
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { SpeedDisplay } from '../../components/SpeedDisplay';
import type { DeliveryResult } from '../../lib/types';

describe('SpeedDisplay Component', () => {
  // Helper to create mock result
  const createMockResult = (overrides?: Partial<DeliveryResult>): DeliveryResult => ({
    speedKmh: 145.5,
    trajectoryPoints: [
      { pixelX: 100, pixelY: 100, estimatedZ: null, timestampMs: 0 },
      { pixelX: 200, pixelY: 150, estimatedZ: null, timestampMs: 33.33 },
    ],
    confidence: 0.93,
    detectionCount: 12,
    processingMs: 150,
    warnings: [],
    ...overrides,
  });

  describe('Empty State', () => {
    it('should render empty state when no result provided', () => {
      render(<SpeedDisplay result={null} />);

      expect(screen.getByText(/no delivery recorded/i)).toBeInTheDocument();
      expect(screen.getByText(/start recording/i)).toBeInTheDocument();
    });

    it('should display cricket ball emoji in empty state', () => {
      render(<SpeedDisplay result={null} />);

      expect(screen.getByText('🏏')).toBeInTheDocument();
    });
  });

  describe('Speed Display', () => {
    it('should display speed value correctly', () => {
      const result = createMockResult({ speedKmh: 145.5 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('145.5')).toBeInTheDocument();
      expect(screen.getByText('km/h')).toBeInTheDocument();
    });

    it('should round speed to 1 decimal place', () => {
      const result = createMockResult({ speedKmh: 142.789 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('142.8')).toBeInTheDocument();
    });

    it('should display confidence percentage', () => {
      const result = createMockResult({ confidence: 0.93 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('93%')).toBeInTheDocument();
    });
  });

  describe('Confidence Levels', () => {
    it('should show "Excellent" for high confidence (>= 0.9)', () => {
      const result = createMockResult({ confidence: 0.95 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should show "Good" for moderate-high confidence (>= 0.75)', () => {
      const result = createMockResult({ confidence: 0.80 });
      render(<SpeedDisplay result={result} />);

      const goodBadges = screen.getAllByText('Good');
      expect(goodBadges.length).toBeGreaterThan(0);
    });

    it('should show "Fair" for moderate confidence (>= 0.6)', () => {
      const result = createMockResult({ confidence: 0.65 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('should show "Low" for low confidence (< 0.6)', () => {
      const result = createMockResult({ confidence: 0.50 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Details Section', () => {
    it('should display detection count', () => {
      const result = createMockResult({ detectionCount: 15 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Detections')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display processing time', () => {
      const result = createMockResult({ processingMs: 234 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('234ms')).toBeInTheDocument();
    });

    it('should display trajectory points count', () => {
      const result = createMockResult({
        trajectoryPoints: Array(10).fill(null).map((_, i) => ({
          pixelX: i * 10,
          pixelY: i * 10,
          estimatedZ: null,
          timestampMs: i * 33,
        })),
      });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Trajectory')).toBeInTheDocument();
      expect(screen.getByText('10 points')).toBeInTheDocument();
    });

    it('should hide details when showDetails is false', () => {
      const result = createMockResult();
      render(<SpeedDisplay result={result} showDetails={false} />);

      expect(screen.queryByText('Detections')).not.toBeInTheDocument();
      expect(screen.queryByText('Processing')).not.toBeInTheDocument();
    });
  });

  describe('Detection Quality', () => {
    it('should show "Excellent" quality for >= 15 detections', () => {
      const result = createMockResult({ detectionCount: 20 });
      render(<SpeedDisplay result={result} />);

      const excellentBadges = screen.getAllByText('Excellent');
      expect(excellentBadges.length).toBeGreaterThan(0);
    });

    it('should show "Good" quality for >= 10 detections', () => {
      const result = createMockResult({ detectionCount: 12 });
      render(<SpeedDisplay result={result} />);

      const goodBadges = screen.getAllByText('Good');
      expect(goodBadges.length).toBeGreaterThan(0);
    });

    it('should show "Fair" quality for >= 5 detections', () => {
      const result = createMockResult({ detectionCount: 7 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('should show "Low" quality for < 5 detections', () => {
      const result = createMockResult({ detectionCount: 3 });
      render(<SpeedDisplay result={result} />);

      const lowBadges = screen.getAllByText('Low');
      expect(lowBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Warnings Section', () => {
    it('should display warnings when present', () => {
      const result = createMockResult({
        warnings: [
          'Low light conditions detected',
          'Ball partially obscured in some frames',
        ],
      });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Notices')).toBeInTheDocument();
      expect(screen.getByText(/low light/i)).toBeInTheDocument();
      expect(screen.getByText(/partially obscured/i)).toBeInTheDocument();
    });

    it('should hide warnings section when no warnings', () => {
      const result = createMockResult({ warnings: [] });
      render(<SpeedDisplay result={result} />);

      expect(screen.queryByText('Notices')).not.toBeInTheDocument();
    });

    it('should hide warnings when showWarnings is false', () => {
      const result = createMockResult({
        warnings: ['Test warning'],
      });
      render(<SpeedDisplay result={result} showWarnings={false} />);

      expect(screen.queryByText('Notices')).not.toBeInTheDocument();
      expect(screen.queryByText('Test warning')).not.toBeInTheDocument();
    });

    it('should display warning icon', () => {
      const result = createMockResult({
        warnings: ['Test warning'],
      });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onInteraction when clicked', () => {
      const handleInteraction = jest.fn();
      const result = createMockResult();
      
      const { container } = render(
        <SpeedDisplay result={result} onInteraction={handleInteraction} />
      );

      const displayElement = container.querySelector('.speed-display') as HTMLElement;
      displayElement?.click();

      expect(handleInteraction).toHaveBeenCalledTimes(1);
    });

    it('should have button role when onInteraction is provided', () => {
      const handleInteraction = jest.fn();
      const result = createMockResult();
      
      const { container } = render(
        <SpeedDisplay result={result} onInteraction={handleInteraction} />
      );

      const displayElement = container.querySelector('.speed-display');
      expect(displayElement?.getAttribute('role')).toBe('button');
      expect(displayElement?.getAttribute('tabIndex')).toBe('0');
    });

    it('should not have button role when onInteraction is not provided', () => {
      const result = createMockResult();
      
      const { container } = render(
        <SpeedDisplay result={result} />
      );

      const displayElement = container.querySelector('.speed-display');
      expect(displayElement?.getAttribute('role')).toBeNull();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const result = createMockResult();
      
      const { container } = render(
        <SpeedDisplay result={result} className="custom-class" />
      );

      const displayElement = container.querySelector('.speed-display');
      expect(displayElement?.classList.contains('custom-class')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero speed', () => {
      const result = createMockResult({ speedKmh: 0 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should handle very high speed', () => {
      const result = createMockResult({ speedKmh: 999.9 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('999.9')).toBeInTheDocument();
    });

    it('should handle 100% confidence', () => {
      const result = createMockResult({ confidence: 1.0 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should handle 0% confidence', () => {
      const result = createMockResult({ confidence: 0.0 });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('should handle empty trajectory points', () => {
      const result = createMockResult({ trajectoryPoints: [] });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('0 points')).toBeInTheDocument();
    });

    it('should handle single warning', () => {
      const result = createMockResult({
        warnings: ['Single warning message'],
      });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Single warning message')).toBeInTheDocument();
    });

    it('should handle multiple warnings', () => {
      const result = createMockResult({
        warnings: [
          'Warning 1',
          'Warning 2',
          'Warning 3',
        ],
      });
      render(<SpeedDisplay result={result} />);

      expect(screen.getByText('Warning 1')).toBeInTheDocument();
      expect(screen.getByText('Warning 2')).toBeInTheDocument();
      expect(screen.getByText('Warning 3')).toBeInTheDocument();
    });
  });
});
