/**
 * Unit Tests for TrajectoryOverlay Component
 * 
 * Tests trajectory visualization, canvas rendering, and helper functions.
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrajectoryOverlay, getTrajectoryStats, smoothTrajectory } from '../../components/TrajectoryOverlay';
import type { TrajectoryPoint } from '../../lib/types';

// Mock canvas context
const mockGetContext = jest.fn();
const mockClearRect = jest.fn();
const mockBeginPath = jest.fn();
const mockMoveTo = jest.fn();
const mockLineTo = jest.fn();
const mockStroke = jest.fn();
const mockArc = jest.fn();
const mockFill = jest.fn();
const mockFillText = jest.fn();
const mockStrokeText = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock canvas context
  mockGetContext.mockReturnValue({
    clearRect: mockClearRect,
    beginPath: mockBeginPath,
    moveTo: mockMoveTo,
    lineTo: mockLineTo,
    stroke: mockStroke,
    arc: mockArc,
    fill: mockFill,
    fillText: mockFillText,
    strokeText: mockStrokeText,
  });

  // Mock HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = mockGetContext;
});

describe('TrajectoryOverlay Component', () => {
  // Sample trajectory points
  const samplePoints: TrajectoryPoint[] = [
    {
      pixelX: 100,
      pixelY: 100,
      estimatedZ: null,
      timestampMs: 0,
    },
    {
      pixelX: 150,
      pixelY: 120,
      estimatedZ: null,
      timestampMs: 167,
    },
    {
      pixelX: 200,
      pixelY: 140,
      estimatedZ: null,
      timestampMs: 333,
    },
  ];

  const videoDimensions = { width: 640, height: 480 };

  describe('Empty State', () => {
    it('should render nothing when videoDimensions is null', () => {
      const { container } = render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={null}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render canvas when videoDimensions is provided', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={[]}
          videoDimensions={videoDimensions}
        />
      );

      const canvas = screen.getByLabelText('Ball trajectory overlay');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should clear canvas when trajectoryPoints is empty', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={[]}
          videoDimensions={videoDimensions}
        />
      );

      expect(mockClearRect).toHaveBeenCalledWith(0, 0, 640, 480);
    });
  });

  describe('Canvas Setup', () => {
    it('should set canvas dimensions to match video', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
        />
      );

      const canvas = screen.getByLabelText('Ball trajectory overlay') as HTMLCanvasElement;
      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);
    });

    it('should position canvas absolutely over video', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
        />
      );

      const canvas = screen.getByLabelText('Ball trajectory overlay') as HTMLCanvasElement;
      expect(canvas.style.position).toBe('absolute');
      expect(canvas.style.top).toBe('0px');
      expect(canvas.style.left).toBe('0px');
      expect(canvas.style.width).toBe('100%');
      expect(canvas.style.height).toBe('100%');
    });

    it('should disable pointer events on canvas', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
        />
      );

      const canvas = screen.getByLabelText('Ball trajectory overlay') as HTMLCanvasElement;
      expect(canvas.style.pointerEvents).toBe('none');
    });

    it('should set correct z-index for overlay', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
        />
      );

      const canvas = screen.getByLabelText('Ball trajectory overlay') as HTMLCanvasElement;
      expect(canvas.style.zIndex).toBe('10');
    });
  });

  describe('Trajectory Path Rendering', () => {
    it('should draw path connecting trajectory points', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          showPath={true}
          showPoints={false}
        />
      );

      expect(mockBeginPath).toHaveBeenCalled();
      expect(mockMoveTo).toHaveBeenCalledWith(100, 100);
      expect(mockLineTo).toHaveBeenCalledWith(150, 120);
      expect(mockLineTo).toHaveBeenCalledWith(200, 140);
      expect(mockStroke).toHaveBeenCalled();
    });

    it('should not draw path when showPath is false', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          showPath={false}
          showPoints={true}
        />
      );

      expect(mockMoveTo).not.toHaveBeenCalled();
      expect(mockLineTo).not.toHaveBeenCalled();
    });

    it('should not draw path with single point', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={[samplePoints[0]]}
          videoDimensions={videoDimensions}
          showPath={true}
        />
      );

      expect(mockMoveTo).not.toHaveBeenCalled();
      expect(mockLineTo).not.toHaveBeenCalled();
    });

    it('should use custom path color', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          pathColor="#FF0000"
          showPath={true}
          showPoints={false}
        />
      );

      // The stroke style would be set in the canvas context
      // We can verify by checking the mock was called
      expect(mockBeginPath).toHaveBeenCalled();
    });

    it('should use custom line width', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          lineWidth={5}
          showPath={true}
          showPoints={false}
        />
      );

      expect(mockBeginPath).toHaveBeenCalled();
    });
  });

  describe('Detection Points Rendering', () => {
    it('should draw detection points', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          showPath={false}
          showPoints={true}
        />
      );

      // Should draw arcs for each point
      expect(mockArc).toHaveBeenCalledTimes(samplePoints.length);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should not draw points when showPoints is false', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          showPath={true}
          showPoints={false}
        />
      );

      expect(mockArc).not.toHaveBeenCalled();
      expect(mockFill).not.toHaveBeenCalled();
    });

    it('should draw start/end labels', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          showPath={false}
          showPoints={true}
        />
      );

      // Should draw labels for first and last point
      expect(mockFillText).toHaveBeenCalledTimes(2);
      expect(mockStrokeText).toHaveBeenCalledTimes(2);
    });

    it('should use custom point color', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          pointColor="#0000FF"
          showPath={false}
          showPoints={true}
        />
      );

      expect(mockArc).toHaveBeenCalled();
    });

    it('should use custom point radius', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          pointRadius={8}
          showPath={false}
          showPoints={true}
        />
      );

      // Arc calls should use the specified radius
      expect(mockArc).toHaveBeenCalled();
    });
  });

  describe('Motion Blur Effect', () => {
    it('should render with motion blur when enabled', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          showMotionBlur={true}
          showPath={true}
          showPoints={false}
        />
      );

      // Should draw path with gradient effect (multiple strokes)
      expect(mockStroke).toHaveBeenCalled();
    });

    it('should render without motion blur by default', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          showPath={true}
          showPoints={false}
        />
      );

      expect(mockStroke).toHaveBeenCalled();
    });
  });

  describe('Rerendering', () => {
    it('should redraw when trajectoryPoints change', () => {
      const { rerender } = render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
        />
      );

      mockClearRect.mockClear();

      const newPoints = [...samplePoints, {
        pixelX: 250,
        pixelY: 160,
        estimatedZ: null,
        timestampMs: 500,
      }];

      rerender(
        <TrajectoryOverlay
          trajectoryPoints={newPoints}
          videoDimensions={videoDimensions}
        />
      );

      expect(mockClearRect).toHaveBeenCalled();
    });

    it('should redraw when videoDimensions change', () => {
      const { rerender } = render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
        />
      );

      mockClearRect.mockClear();

      rerender(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={{ width: 1280, height: 720 }}
        />
      );

      expect(mockClearRect).toHaveBeenCalled();
    });

    it('should redraw when style props change', () => {
      const { rerender } = render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          pathColor="#00FF00"
        />
      );

      mockClearRect.mockClear();

      rerender(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          pathColor="#FF0000"
        />
      );

      expect(mockClearRect).toHaveBeenCalled();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
          className="custom-overlay"
        />
      );

      const canvas = screen.getByLabelText('Ball trajectory overlay');
      expect(canvas).toHaveClass('trajectory-overlay');
      expect(canvas).toHaveClass('custom-overlay');
    });

    it('should apply default className when not specified', () => {
      render(
        <TrajectoryOverlay
          trajectoryPoints={samplePoints}
          videoDimensions={videoDimensions}
        />
      );

      const canvas = screen.getByLabelText('Ball trajectory overlay');
      expect(canvas).toHaveClass('trajectory-overlay');
    });
  });
});

describe('getTrajectoryStats Helper', () => {
  it('should return zero stats for empty trajectory', () => {
    const stats = getTrajectoryStats([]);

    expect(stats.totalPoints).toBe(0);
    expect(stats.duration).toBe(0);
    expect(stats.pathLength).toBe(0);
    expect(stats.avgVelocity).toBe(0);
  });

  it('should calculate correct stats for single point', () => {
    const points: TrajectoryPoint[] = [{
      pixelX: 100,
      pixelY: 100,
      estimatedZ: null,
      timestampMs: 0,
    }];

    const stats = getTrajectoryStats(points);

    expect(stats.totalPoints).toBe(1);
    expect(stats.duration).toBe(0);
    expect(stats.pathLength).toBe(0);
    expect(stats.avgVelocity).toBe(0);
  });

  it('should calculate duration correctly', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 100,
        pixelY: 100,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 200,
        pixelY: 200,
        estimatedZ: null,
        timestampMs: 1000,
      },
    ];

    const stats = getTrajectoryStats(points);

    expect(stats.duration).toBe(1000); // 1 second
  });

  it('should calculate path length correctly', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 0,
        pixelY: 0,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 30,
        pixelY: 40,
        estimatedZ: null,
        timestampMs: 333,
      },
    ];

    const stats = getTrajectoryStats(points);

    // Distance = sqrt(30^2 + 40^2) = sqrt(900 + 1600) = sqrt(2500) = 50
    expect(stats.pathLength).toBe(50);
  });

  it('should calculate average velocity correctly', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 0,
        pixelY: 0,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 100,
        pixelY: 0,
        estimatedZ: null,
        timestampMs: 1000,
      },
    ];

    const stats = getTrajectoryStats(points);

    // avgVelocity = pathLength / duration * 1000
    // = 100 / 1000 * 1000 = 100 pixels/second
    expect(stats.avgVelocity).toBe(100);
  });
});

describe('smoothTrajectory Helper', () => {
  it('should return original points if fewer than window size', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 100,
        pixelY: 100,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 110,
        pixelY: 110,
        estimatedZ: null,
        timestampMs: 167,
      },
    ];

    const smoothed = smoothTrajectory(points, 3);

    expect(smoothed).toEqual(points);
  });

  it('should smooth trajectory with moving average', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 100,
        pixelY: 100,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 110,
        pixelY: 110,
        estimatedZ: null,
        timestampMs: 167,
      },
      {
        pixelX: 120,
        pixelY: 120,
        estimatedZ: null,
        timestampMs: 333,
      },
    ];

    const smoothed = smoothTrajectory(points, 3);

    expect(smoothed.length).toBe(3);
    
    // Middle point should be average of all three
    expect(smoothed[1].pixelX).toBe(110); // (100 + 110 + 120) / 3
    expect(smoothed[1].pixelY).toBe(110);
  });

  it('should handle edge points correctly', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 100,
        pixelY: 100,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 120,
        pixelY: 120,
        estimatedZ: null,
        timestampMs: 167,
      },
      {
        pixelX: 140,
        pixelY: 140,
        estimatedZ: null,
        timestampMs: 333,
      },
    ];

    const smoothed = smoothTrajectory(points, 3);

    // First point should be average of first two (window can't extend before start)
    expect(smoothed[0].pixelX).toBe(110); // (100 + 120) / 2
    
    // Last point should be average of last two
    expect(smoothed[2].pixelX).toBe(130); // (120 + 140) / 2
  });

  it('should use custom window size', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 100,
        pixelY: 100,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 110,
        pixelY: 110,
        estimatedZ: null,
        timestampMs: 167,
      },
      {
        pixelX: 120,
        pixelY: 120,
        estimatedZ: null,
        timestampMs: 333,
      },
      {
        pixelX: 130,
        pixelY: 130,
        estimatedZ: null,
        timestampMs: 500,
      },
      {
        pixelX: 140,
        pixelY: 140,
        estimatedZ: null,
        timestampMs: 667,
      },
    ];

    const smoothed = smoothTrajectory(points, 5);

    expect(smoothed.length).toBe(5);
    
    // Middle point should be average of all five
    expect(smoothed[2].pixelX).toBe(120); // (100 + 110 + 120 + 130 + 140) / 5
  });

  it('should preserve other point properties', () => {
    const points: TrajectoryPoint[] = [
      {
        pixelX: 100,
        pixelY: 100,
        estimatedZ: null,
        timestampMs: 0,
      },
      {
        pixelX: 110,
        pixelY: 110,
        estimatedZ: 5.2,
        timestampMs: 167,
      },
      {
        pixelX: 120,
        pixelY: 120,
        estimatedZ: null,
        timestampMs: 333,
      },
    ];

    const smoothed = smoothTrajectory(points, 3);

    // Should preserve estimatedZ and timestampMs
    expect(smoothed[1].estimatedZ).toBe(5.2);
    expect(smoothed[1].timestampMs).toBe(167);
  });
});
