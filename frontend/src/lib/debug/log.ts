/**
 * Logging Utilities
 * 
 * Provides structured logging with levels and environment-based filtering.
 * Wraps console methods with consistent formatting and conditional output.
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output
   * @default LogLevel.INFO in production, LogLevel.DEBUG in development
   */
  minLevel?: LogLevel;

  /**
   * Prefix to add to all log messages
   * @default '[Speedometer]'
   */
  prefix?: string;

  /**
   * Whether to include timestamps
   * @default true
   */
  includeTimestamp?: boolean;

  /**
   * Whether to include log level in output
   * @default true
   */
  includeLevel?: boolean;

  /**
   * Whether logging is enabled at all
   * @default true
   */
  enabled?: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: Required<LoggerConfig> = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  prefix: '[Speedometer]',
  includeTimestamp: true,
  includeLevel: true,
  enabled: true,
};

/**
 * Logger class with configurable levels and formatting
 */
export class Logger {
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Format a log message with prefix, timestamp, and level
   */
  private format(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }

    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    if (this.config.includeLevel) {
      const levelName = LogLevel[level];
      parts.push(`[${levelName}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && level >= this.config.minLevel;
  }

  /**
   * Log a debug message (lowest priority)
   */
  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formatted = this.format(LogLevel.DEBUG, message);
    // eslint-disable-next-line no-console
    console.debug(formatted, ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formatted = this.format(LogLevel.INFO, message);
    // eslint-disable-next-line no-console
    console.info(formatted, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formatted = this.format(LogLevel.WARN, message);
    console.warn(formatted, ...args);
  }

  /**
   * Log an error message (highest priority)
   */
  error(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formatted = this.format(LogLevel.ERROR, message);
    console.error(formatted, ...args);
  }

  /**
   * Log an error with stack trace
   */
  exception(message: string, error: Error, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formatted = this.format(LogLevel.ERROR, message);
    console.error(formatted, error.message, ...args);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Group related log messages
   */
  group(label: string, callback: () => void): void {
    if (!this.config.enabled) {
      callback();
      return;
    }

    const formatted = this.format(LogLevel.INFO, label);
    // eslint-disable-next-line no-console
    console.group(formatted);
    try {
      callback();
    } finally {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  /**
   * Log a table (for structured data)
   */
  table(data: unknown, columns?: string[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    if (columns) {
      // eslint-disable-next-line no-console
      console.table(data, columns);
    } else {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  }

  /**
   * Start a timer with a label
   */
  time(label: string): void {
    if (!this.config.enabled) return;
    // eslint-disable-next-line no-console
    console.time(this.config.prefix + ' ' + label);
  }

  /**
   * End a timer and log the duration
   */
  timeEnd(label: string): void {
    if (!this.config.enabled) return;
    // eslint-disable-next-line no-console
    console.timeEnd(this.config.prefix + ' ' + label);
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable logging
   */
  disable(): void {
    this.config.enabled = false;
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a namespaced logger with a specific prefix
 */
export function createLogger(namespace: string, config: LoggerConfig = {}): Logger {
  return new Logger({
    ...config,
    prefix: `[Speedometer:${namespace}]`,
  });
}

/**
 * Convenience function for debug logging
 */
export function debug(message: string, ...args: unknown[]): void {
  logger.debug(message, ...args);
}

/**
 * Convenience function for info logging
 */
export function info(message: string, ...args: unknown[]): void {
  logger.info(message, ...args);
}

/**
 * Convenience function for warning logging
 */
export function warn(message: string, ...args: unknown[]): void {
  logger.warn(message, ...args);
}

/**
 * Convenience function for error logging
 */
export function error(message: string, ...args: unknown[]): void {
  logger.error(message, ...args);
}

/**
 * Convenience function for exception logging
 */
export function exception(message: string, err: Error, ...args: unknown[]): void {
  logger.exception(message, err, ...args);
}
