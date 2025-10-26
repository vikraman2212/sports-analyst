/**
 * Unit tests for logging utilities
 */

import {
  Logger,
  LogLevel,
  createLogger,
  logger,
  debug,
  info,
  warn,
  error,
  exception,
} from '../../lib/debug/log';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
  table: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
};

beforeAll(() => {
  global.console.debug = mockConsole.debug;
  global.console.info = mockConsole.info;
  global.console.warn = mockConsole.warn;
  global.console.error = mockConsole.error;
  global.console.group = mockConsole.group;
  global.console.groupEnd = mockConsole.groupEnd;
  global.console.table = mockConsole.table;
  global.console.time = mockConsole.time;
  global.console.timeEnd = mockConsole.timeEnd;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Logger', () => {
  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      const logger = new Logger({ minLevel: LogLevel.DEBUG });

      logger.debug('Debug message', { data: 'test' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Debug message'),
        { data: 'test' }
      );
    });

    it('should not log debug when level is INFO', () => {
      const logger = new Logger({ minLevel: LogLevel.INFO });

      logger.debug('Debug message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should log info messages when level is INFO', () => {
      const logger = new Logger({ minLevel: LogLevel.INFO });

      logger.info('Info message', 123);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Info message'),
        123
      );
    });

    it('should not log info when level is WARN', () => {
      const logger = new Logger({ minLevel: LogLevel.WARN });

      logger.info('Info message');

      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should log warnings when level is WARN', () => {
      const logger = new Logger({ minLevel: LogLevel.WARN });

      logger.warn('Warning message', true);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning message'),
        true
      );
    });

    it('should not log warnings when level is ERROR', () => {
      const logger = new Logger({ minLevel: LogLevel.ERROR });

      logger.warn('Warning message');

      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it('should log errors when level is ERROR', () => {
      const logger = new Logger({ minLevel: LogLevel.ERROR });

      logger.error('Error message', { code: 500 });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error message'),
        { code: 500 }
      );
    });

    it('should not log anything when level is NONE', () => {
      const logger = new Logger({ minLevel: LogLevel.NONE });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe('Formatting', () => {
    it('should include prefix in log message', () => {
      const logger = new Logger({ prefix: '[TEST]' });

      logger.info('Message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[TEST]'),
        
      );
    });

    it('should include log level in message', () => {
      const logger = new Logger({ includeLevel: true });

      logger.warn('Warning');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
    });

    it('should exclude log level when configured', () => {
      const logger = new Logger({ includeLevel: false });

      logger.info('Info');

      const call = mockConsole.info.mock.calls[0][0];
      expect(call).not.toContain('[INFO]');
    });

    it('should include timestamp when configured', () => {
      const logger = new Logger({ includeTimestamp: true });

      logger.info('Message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });

    it('should exclude timestamp when configured', () => {
      const logger = new Logger({ includeTimestamp: false });

      logger.info('Message');

      const call = mockConsole.info.mock.calls[0][0];
      expect(call).not.toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });

    it('should support custom prefix', () => {
      const logger = new Logger({ prefix: '[CustomApp]' });

      logger.error('Error');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[CustomApp]')
      );
    });

    it('should support empty prefix', () => {
      const logger = new Logger({ prefix: '' });

      logger.info('Message');

      expect(mockConsole.info).toHaveBeenCalled();
    });
  });

  describe('Exception Logging', () => {
    it('should log exception with error message', () => {
      const logger = new Logger();
      const error = new Error('Test error');

      logger.exception('Operation failed', error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed'),
        'Test error'
      );
    });

    it('should log stack trace if available', () => {
      const logger = new Logger();
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.exception('Failed', error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Stack trace:',
        error.stack
      );
    });

    it('should include additional arguments', () => {
      const logger = new Logger();
      const error = new Error('Test error');

      logger.exception('Failed', error, { context: 'test' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.anything(),
        'Test error',
        { context: 'test' }
      );
    });
  });

  describe('Grouping', () => {
    it('should create console group', () => {
      const logger = new Logger();
      const callback = jest.fn();

      logger.group('Test Group', callback);

      expect(mockConsole.group).toHaveBeenCalledWith(
        expect.stringContaining('Test Group')
      );
      expect(callback).toHaveBeenCalled();
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should end group even if callback throws', () => {
      const logger = new Logger();
      const callback = jest.fn(() => {
        throw new Error('Test error');
      });

      expect(() => logger.group('Test', callback)).toThrow('Test error');

      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should not create group when disabled', () => {
      const logger = new Logger({ enabled: false });
      const callback = jest.fn();

      logger.group('Test', callback);

      expect(mockConsole.group).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
      expect(mockConsole.groupEnd).not.toHaveBeenCalled();
    });
  });

  describe('Table Logging', () => {
    it('should log table data', () => {
      const logger = new Logger();
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      logger.table(data);

      expect(mockConsole.table).toHaveBeenCalledWith(data);
    });

    it('should log table with specific columns', () => {
      const logger = new Logger();
      const data = [{ name: 'Alice', age: 30, city: 'NYC' }];
      const columns = ['name', 'age'];

      logger.table(data, columns);

      expect(mockConsole.table).toHaveBeenCalledWith(data, columns);
    });

    it('should not log table when level is ERROR', () => {
      const logger = new Logger({ minLevel: LogLevel.ERROR });

      logger.table([{ data: 'test' }]);

      expect(mockConsole.table).not.toHaveBeenCalled();
    });
  });

  describe('Timing', () => {
    it('should start timer with label', () => {
      const logger = new Logger({ prefix: '[App]' });

      logger.time('operation');

      expect(mockConsole.time).toHaveBeenCalledWith('[App] operation');
    });

    it('should end timer with label', () => {
      const logger = new Logger({ prefix: '[App]' });

      logger.timeEnd('operation');

      expect(mockConsole.timeEnd).toHaveBeenCalledWith('[App] operation');
    });

    it('should not time when disabled', () => {
      const logger = new Logger({ enabled: false });

      logger.time('test');
      logger.timeEnd('test');

      expect(mockConsole.time).not.toHaveBeenCalled();
      expect(mockConsole.timeEnd).not.toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const logger = new Logger({ minLevel: LogLevel.ERROR });

      logger.configure({ minLevel: LogLevel.DEBUG });
      logger.debug('Debug message');

      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should set log level', () => {
      const logger = new Logger({ minLevel: LogLevel.INFO });

      logger.setLevel(LogLevel.WARN);
      logger.info('Info message');

      expect(mockConsole.info).not.toHaveBeenCalled();

      logger.warn('Warning');
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should enable and disable logging', () => {
      const logger = new Logger();

      logger.disable();
      logger.info('Should not log');
      expect(mockConsole.info).not.toHaveBeenCalled();

      logger.enable();
      logger.info('Should log');
      expect(mockConsole.info).toHaveBeenCalled();
    });
  });

  describe('Enabled/Disabled State', () => {
    it('should not log anything when disabled', () => {
      const logger = new Logger({ enabled: false });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });
});

describe('createLogger', () => {
  it('should create logger with namespaced prefix', () => {
    const logger = createLogger('Detection');

    logger.info('Message');

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('[Speedometer:Detection]')
    );
  });

  it('should accept additional config', () => {
    const logger = createLogger('Core', { minLevel: LogLevel.ERROR });

    logger.info('Info');
    logger.error('Error');

    expect(mockConsole.info).not.toHaveBeenCalled();
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('[Speedometer:Core]')
    );
  });
});

describe('Convenience Functions', () => {
  it('should call debug on global logger', () => {
    debug('Debug message', 123);

    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringContaining('Debug message'),
      123
    );
  });

  it('should call info on global logger', () => {
    info('Info message', 'test');

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('Info message'),
      'test'
    );
  });

  it('should call warn on global logger', () => {
    warn('Warning message', true);

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('Warning message'),
      true
    );
  });

  it('should call error on global logger', () => {
    error('Error message', { code: 500 });

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Error message'),
      { code: 500 }
    );
  });

  it('should call exception on global logger', () => {
    const err = new Error('Test error');

    exception('Failed', err, { context: 'test' });

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      'Test error',
      { context: 'test' }
    );
  });
});

describe('Global Logger Instance', () => {
  it('should have default configuration', () => {
    // Global logger should work with defaults
    logger.info('Test');

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('[Speedometer]')
    );
  });

  it('should be configurable', () => {
    logger.configure({ prefix: '[CustomPrefix]' });
    logger.info('Test');

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('[CustomPrefix]')
    );

    // Reset for other tests
    logger.configure({ prefix: '[Speedometer]' });
  });
});
