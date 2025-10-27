/**
 * Integration tests for Smart Trim flow
 * 
 * Tests the full flow: trajectory with gaps → smartTrim → ReplayTimeline display
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { smartTrim } from '@/lib/replay/smartTrim';
import ReplayTimeline from '@/components/ReplayTimeline';
import type { TrajectoryPoint } from '@/lib/types';

// Helper to create a mock trajectory point
function createPoint(x: number, y: number, timestampMs: number): TrajectoryPoint {
  return {
    pixelX: x,
    pixelY: y,
    estimatedZ: null,
    timestampMs,
  };
}

describe('Smart Trim Flow Integration', () => {
  it('should analyze trajectory and display trim results', () => {
    // Simulate recording with early start and late stop
    const trajectoryWithGaps: (TrajectoryPoint | null)[] = [
      null, null, null, null, null, // User started too early (5 frames)
      createPoint(100, 200, 0),
      createPoint(110, 210, 10),
      createPoint(120, 220, 20),
      createPoint(130, 230, 30),
      createPoint(140, 240, 40),
      null, null, // Ball behind bowler (2 frames gap)
      createPoint(160, 260, 60),
      createPoint(170, 270, 70),
      createPoint(180, 280, 80),
      createPoint(190, 290, 90),
      createPoint(200, 300, 100),
      createPoint(210, 310, 110),
      null, null, null, // User stopped too late (3 frames)
    ];

    // Step 1: Run smart trim
    const trimResult = smartTrim(trajectoryWithGaps);

    // Verify trim detected first and last ball
    expect(trimResult.firstDetectionIndex).toBe(5);
    expect(trimResult.lastDetectionIndex).toBe(17); // Last point is at index 17
    expect(trimResult.trimmedFrames).toBe(13); // frames 5–17 inclusive
    expect(trimResult.totalFrames).toBe(21); // Total length is 21
    expect(trimResult.efficiency).toBeCloseTo(61.9, 0); // 13/21

    // Step 2: Render timeline with trim result
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={21}
        currentFrame={10}
        trimResult={trimResult}
        onSeek={mockOnSeek}
        showFrameNumbers={true}
        showStats={true}
      />
    );

    // Verify timeline displays trim stats
    expect(screen.getByText(/Ball detected in frames 5–17/i)).toBeInTheDocument();
    expect(screen.getByText(/13\/21 frames \(62%\)/i)).toBeInTheDocument();

    // Verify frame counter shows current position
    expect(screen.getByText('Frame 10')).toBeInTheDocument();

    // Verify zone indicator
    expect(screen.getByText('▶ Ball detected')).toBeInTheDocument();

    // Verify legend
    expect(screen.getByText('Ignored')).toBeInTheDocument();
    expect(screen.getByText('Ball Detected')).toBeInTheDocument();
  });

  it('should show pre-ball zone indicator before first detection', () => {
    const trajectory: (TrajectoryPoint | null)[] = [
      null, null, null,
      createPoint(100, 200, 0),
      createPoint(150, 250, 33),
      null,
    ];

    const trimResult = smartTrim(trajectory);
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={6}
        currentFrame={1} // In pre-ball zone
        trimResult={trimResult}
        onSeek={mockOnSeek}
      />
    );

    expect(screen.getByText('⏮ Before ball')).toBeInTheDocument();
  });

  it('should show post-ball zone indicator after last detection', () => {
    const trajectory: (TrajectoryPoint | null)[] = [
      null,
      createPoint(100, 200, 0),
      createPoint(150, 250, 33),
      null, null, null,
    ];

    const trimResult = smartTrim(trajectory);
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={6}
        currentFrame={5} // In post-ball zone
        trimResult={trimResult}
        onSeek={mockOnSeek}
      />
    );

    expect(screen.getByText('⏭ After ball')).toBeInTheDocument();
  });

  it('should show warning for low efficiency', () => {
    // Very early start, very late stop
    const trajectory: (TrajectoryPoint | null)[] = [
      ...Array(50).fill(null), // Too early
      createPoint(100, 200, 0),
      createPoint(110, 210, 10),
      createPoint(120, 220, 20),
      createPoint(130, 230, 30),
      createPoint(140, 240, 40),
      createPoint(150, 250, 50),
      createPoint(160, 260, 60),
      createPoint(170, 270, 70),
      createPoint(180, 280, 80),
      createPoint(190, 290, 90),
      createPoint(200, 300, 100),
      ...Array(50).fill(null), // Too late
    ];

    const trimResult = smartTrim(trajectory);
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={112}
        currentFrame={60}
        trimResult={trimResult}
        onSeek={mockOnSeek}
        showStats={true}
      />
    );

    // Should display efficiency warning
    expect(screen.getByText(/started very early/i)).toBeInTheDocument();
  });

  it('should handle seek interaction on timeline', () => {
    const trajectory: (TrajectoryPoint | null)[] = [
      null, null,
      createPoint(100, 200, 0),
      createPoint(150, 250, 33),
      createPoint(200, 300, 66),
      null, null,
    ];

    const trimResult = smartTrim(trajectory);
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={7}
        currentFrame={3}
        trimResult={trimResult}
        onSeek={mockOnSeek}
      />
    );

    // Find timeline track
    const timeline = screen.getByRole('slider', { name: /seek timeline/i });

    // Simulate click (will call onSeek with calculated frame)
    fireEvent.mouseDown(timeline, {
      clientX: 100,
      currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 200 }) },
    });

    expect(mockOnSeek).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', () => {
    const trajectory: (TrajectoryPoint | null)[] = [
      createPoint(100, 200, 0),
      createPoint(120, 220, 33),
      createPoint(140, 240, 66),
      createPoint(160, 260, 99),
      createPoint(180, 280, 132),
    ];

    const trimResult = smartTrim(trajectory);
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={5}
        currentFrame={2}
        trimResult={trimResult}
        onSeek={mockOnSeek}
      />
    );

    const timeline = screen.getByRole('slider', { name: /seek timeline/i });

    // Arrow left (previous frame)
    fireEvent.keyDown(timeline, { key: 'ArrowLeft' });
    expect(mockOnSeek).toHaveBeenCalledWith(1);

    // Arrow right (next frame)
    fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    expect(mockOnSeek).toHaveBeenCalledWith(3);

    // Home (first frame)
    fireEvent.keyDown(timeline, { key: 'Home' });
    expect(mockOnSeek).toHaveBeenCalledWith(0);

    // End (last frame)
    fireEvent.keyDown(timeline, { key: 'End' });
    expect(mockOnSeek).toHaveBeenCalledWith(4);
  });

  it('should work without trim result (no smart trim)', () => {
    const mockOnSeek = jest.fn();

    // Timeline without trim result (full recording is relevant)
    render(
      <ReplayTimeline
        totalFrames={10}
        currentFrame={5}
        trimResult={null}
        onSeek={mockOnSeek}
      />
    );

    // Should still render timeline
    expect(screen.getByRole('slider')).toBeInTheDocument();

    // No trim stats displayed
    expect(screen.queryByText(/Ball detected in frames/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Efficiency/i)).not.toBeInTheDocument();
  });

  it('should handle 100% efficiency (all frames have ball)', () => {
    const trajectory: (TrajectoryPoint | null)[] = [
      createPoint(100, 200, 0),
      createPoint(110, 210, 10),
      createPoint(120, 220, 20),
      createPoint(130, 230, 30),
      createPoint(140, 240, 40),
      createPoint(150, 250, 50),
      createPoint(160, 260, 60),
      createPoint(170, 270, 70),
      createPoint(180, 280, 80),
      createPoint(190, 290, 90),
      createPoint(200, 300, 100),
    ];

    const trimResult = smartTrim(trajectory);
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={11}
        currentFrame={5}
        trimResult={trimResult}
        onSeek={mockOnSeek}
        showStats={true}
      />
    );

    // 100% efficiency
    expect(screen.getByText(/11\/11 frames \(100%\)/i)).toBeInTheDocument();

    // No warning (11 frames, efficiency 100%)
    expect(screen.queryByText(/⚠/)).not.toBeInTheDocument();
  });

  it('should integrate with complete replay flow', () => {
    // Simulate a typical delivery recording:
    // User presses START at t=0 (a bit early)
    // Ball appears at t=200ms
    // Ball visible for 3 seconds
    // Ball exits at t=3200ms
    // User presses STOP at t=4000ms (a bit late)

    const fps = 30;
    const totalDuration = 4000; // 4 seconds
    const totalFrames = Math.ceil((totalDuration / 1000) * fps); // 120 frames

    // Simulate trajectory: null for first 6 frames, ball for 90 frames, null for last 24 frames
    const trajectory: (TrajectoryPoint | null)[] = Array(totalFrames).fill(null);

    // Ball appears at frame 6, disappears at frame 95
    for (let i = 6; i <= 95; i++) {
      trajectory[i] = createPoint(100 + i * 2, 200 + i, i * 33);
    }

    // Run smart trim
    const trimResult = smartTrim(trajectory);

    // Verify trim found the actual delivery
    expect(trimResult.firstDetectionIndex).toBe(6);
    expect(trimResult.lastDetectionIndex).toBe(95);
    expect(trimResult.trimmedFrames).toBe(90);
    expect(trimResult.efficiency).toBeCloseTo(75, 0); // 90/120 = 75%

    // Render timeline
    const mockOnSeek = jest.fn();

    render(
      <ReplayTimeline
        totalFrames={totalFrames}
        currentFrame={50}
        trimResult={trimResult}
        onSeek={mockOnSeek}
        showStats={true}
      />
    );

    // Verify display
    expect(screen.getByText(/Ball detected in frames 6–95/i)).toBeInTheDocument();
    expect(screen.getByText(/90\/120 frames \(75%\)/i)).toBeInTheDocument();

    // In relevant zone
    expect(screen.getByText('▶ Ball detected')).toBeInTheDocument();

    // No warning (efficiency > 40%)
    expect(screen.queryByText(/⚠/)).not.toBeInTheDocument();
  });
});
