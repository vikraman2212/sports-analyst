/**
 * Unit tests for timing utilities
 */

import { Timer, measureAsync, measureSync, LabeledTimer } from '../../lib/metrics/timing';

// Mock performance.now()
let mockTime = 0;
const originalPerformanceNow = performance.now;

beforeAll(() => {
  global.performance.now = jest.fn(() => mockTime);
});

afterAll(() => {
  global.performance.now = originalPerformanceNow;
});

beforeEach(() => {
  mockTime = 0;
  jest.clearAllMocks();
});

describe('Timer', () => {
  it('should start and stop timer', () => {
    const timer = new Timer();

    timer.start();
    mockTime = 100;
    timer.stop();

    expect(timer.elapsed()).toBe(100);
  });

  it('should throw error if stopped before started', () => {
    const timer = new Timer();

    expect(() => timer.stop()).toThrow('Timer not started');
  });

  it('should throw error if elapsed called before started', () => {
    const timer = new Timer();

    expect(() => timer.elapsed()).toThrow('Timer not started');
  });

  it('should return elapsed time while still running', () => {
    const timer = new Timer();

    timer.start();
    mockTime = 50;

    expect(timer.elapsed()).toBe(50);

    mockTime = 100;

    expect(timer.elapsed()).toBe(100);
  });

  it('should round elapsed time', () => {
    const timer = new Timer();

    timer.start();
    mockTime = 123.456789;
    timer.stop();

    expect(timer.elapsedRounded()).toBe(123.46);
    expect(timer.elapsedRounded(0)).toBe(123);
    expect(timer.elapsedRounded(3)).toBe(123.457);
  });

  it('should reset timer', () => {
    const timer = new Timer();

    timer.start();
    mockTime = 100;
    timer.stop();

    timer.reset();

    expect(() => timer.elapsed()).toThrow('Timer not started');
  });

  it('should allow restarting after stop', () => {
    const timer = new Timer();

    timer.start();
    mockTime = 100;
    timer.stop();

    expect(timer.elapsed()).toBe(100);

    mockTime = 200;
    timer.start();
    mockTime = 300;
    timer.stop();

    expect(timer.elapsed()).toBe(100);
  });
});

describe('measureAsync', () => {
  it('should measure async function duration', async () => {
    const mockFn = jest.fn(async () => {
      mockTime += 50;
      return 'result';
    });

    const [result, duration] = await measureAsync(mockFn);

    expect(result).toBe('result');
    expect(duration).toBe(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should measure duration even if function throws', async () => {
    const mockFn = jest.fn(async () => {
      mockTime += 30;
      throw new Error('Test error');
    });

    await expect(measureAsync(mockFn)).rejects.toThrow('Test error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle zero duration', async () => {
    const mockFn = jest.fn(async () => 'instant');

    const [result, duration] = await measureAsync(mockFn);

    expect(result).toBe('instant');
    expect(duration).toBe(0);
  });
});

describe('measureSync', () => {
  it('should measure sync function duration', () => {
    const mockFn = jest.fn(() => {
      mockTime += 25;
      return 42;
    });

    const [result, duration] = measureSync(mockFn);

    expect(result).toBe(42);
    expect(duration).toBe(25);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should measure duration even if function throws', () => {
    const mockFn = jest.fn(() => {
      mockTime += 15;
      throw new Error('Sync error');
    });

    expect(() => measureSync(mockFn)).toThrow('Sync error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('LabeledTimer', () => {
  it('should track multiple labeled operations', () => {
    const timer = new LabeledTimer();

    timer.start('operation1');
    mockTime = 50;
    timer.stop('operation1');

    timer.start('operation2');
    mockTime = 100;
    timer.stop('operation2');

    expect(timer.elapsed('operation1')).toBe(50);
    expect(timer.elapsed('operation2')).toBe(50);
  });

  it('should throw error for unknown label on stop', () => {
    const timer = new LabeledTimer();

    expect(() => timer.stop('unknown')).toThrow('No timer found for label: unknown');
  });

  it('should throw error for unknown label on elapsed', () => {
    const timer = new LabeledTimer();

    expect(() => timer.elapsed('unknown')).toThrow('No timer found for label: unknown');
  });

  it('should reuse existing timer for same label', () => {
    const timer = new LabeledTimer();

    timer.start('operation');
    mockTime = 50;
    timer.stop('operation');

    expect(timer.elapsed('operation')).toBe(50);

    // Start again with same label
    mockTime = 100;
    timer.start('operation');
    mockTime = 150;
    timer.stop('operation');

    expect(timer.elapsed('operation')).toBe(50); // Still 50 from last start
  });

  it('should get all timings as object', () => {
    const timer = new LabeledTimer();

    timer.start('op1');
    mockTime = 10;
    timer.stop('op1');

    timer.start('op2');
    mockTime = 30;
    timer.stop('op2');

    timer.start('op3');
    mockTime = 60;
    timer.stop('op3');

    const timings = timer.getAllTimings();

    expect(timings).toEqual({
      op1: 10,
      op2: 20,
      op3: 30,
    });
  });

  it('should skip unstartedtimers in getAllTimings', () => {
    const timer = new LabeledTimer();

    timer.start('started');
    mockTime = 10;
    timer.stop('started');

    // Create a timer but don't start it
    timer.start('notStopped');

    const timings = timer.getAllTimings();

    expect(timings.started).toBe(10);
    // notStopped should still be included (currently running)
    expect(timings.notStopped).toBeDefined();
  });

  it('should calculate total time', () => {
    const timer = new LabeledTimer();

    timer.start('op1');
    mockTime = 10;
    timer.stop('op1');

    timer.start('op2');
    mockTime = 35;
    timer.stop('op2');

    expect(timer.total()).toBe(35); // 10 + 25
  });

  it('should reset all timers', () => {
    const timer = new LabeledTimer();

    timer.start('op1');
    mockTime = 10;
    timer.stop('op1');

    timer.reset();

    expect(() => timer.elapsed('op1')).toThrow('No timer found');
    expect(timer.total()).toBe(0);
    expect(timer.getAllTimings()).toEqual({});
  });
});
