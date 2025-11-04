/**
 * Performance Timing Utilities
 * 
 * Provides tools for measuring operation durations in the cricket ball tracking system.
 * Used to calculate processingMs metrics for DeliveryResult.
 */

/**
 * Simple timer for measuring operation duration
 */
export class Timer {
  private startTime: number | null = null;
  private endTime: number | null = null;

  /**
   * Start the timer
   */
  start(): void {
    this.startTime = performance.now();
    this.endTime = null;
  }

  /**
   * Stop the timer
   */
  stop(): void {
    if (this.startTime === null) {
      throw new Error('Timer not started. Call start() first.');
    }
    this.endTime = performance.now();
  }

  /**
   * Get elapsed time in milliseconds
   * If timer is still running, returns time elapsed so far
   */
  elapsed(): number {
    if (this.startTime === null) {
      throw new Error('Timer not started. Call start() first.');
    }

    const end = this.endTime ?? performance.now();
    return end - this.startTime;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Get elapsed time rounded to specified decimal places
   * @param decimals Number of decimal places (default: 2)
   */
  elapsedRounded(decimals = 2): number {
    const elapsed = this.elapsed();
    const multiplier = Math.pow(10, decimals);
    return Math.round(elapsed * multiplier) / multiplier;
  }
}

/**
 * Measure the execution time of a function
 * 
 * @param fn Function to measure
 * @returns Tuple of [result, durationMs]
 */
export async function measureAsync<T>(
  fn: () => Promise<T>
): Promise<[T, number]> {
  const timer = new Timer();
  timer.start();

  try {
    const result = await fn();
    timer.stop();
    return [result, timer.elapsedRounded()];
  } catch (error) {
    timer.stop();
    throw error;
  }
}

/**
 * Measure the execution time of a synchronous function
 * 
 * @param fn Function to measure
 * @returns Tuple of [result, durationMs]
 */
export function measureSync<T>(fn: () => T): [T, number] {
  const timer = new Timer();
  timer.start();

  try {
    const result = fn();
    timer.stop();
    return [result, timer.elapsedRounded()];
  } catch (error) {
    timer.stop();
    throw error;
  }
}

/**
 * Create a labeled timer for tracking multiple operations
 */
export class LabeledTimer {
  private timers: Map<string, Timer> = new Map();

  /**
   * Start timing an operation
   */
  start(label: string): void {
    if (!this.timers.has(label)) {
      this.timers.set(label, new Timer());
    }
    this.timers.get(label)!.start();
  }

  /**
   * Stop timing an operation
   */
  stop(label: string): void {
    const timer = this.timers.get(label);
    if (!timer) {
      throw new Error(`No timer found for label: ${label}`);
    }
    timer.stop();
  }

  /**
   * Get elapsed time for an operation
   */
  elapsed(label: string): number {
    const timer = this.timers.get(label);
    if (!timer) {
      throw new Error(`No timer found for label: ${label}`);
    }
    return timer.elapsedRounded();
  }

  /**
   * Get all timings as an object
   */
  getAllTimings(): Record<string, number> {
    const timings: Record<string, number> = {};

    for (const [label, timer] of this.timers.entries()) {
      try {
        timings[label] = timer.elapsedRounded();
      } catch {
        // Skip timers that haven't been started
      }
    }

    return timings;
  }

  /**
   * Get total time across all operations
   */
  total(): number {
    let sum = 0;

    for (const timer of this.timers.values()) {
      try {
        sum += timer.elapsed();
      } catch {
        // Skip timers that haven't been started
      }
    }

    return Math.round(sum * 100) / 100;
  }

  /**
   * Reset all timers
   */
  reset(): void {
    this.timers.clear();
  }
}
