/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};

const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const payload = context ? { message, ...context } : message;

  switch (level) {
    case 'debug':
      if (__DEV__) {
        console.debug(payload);
      }
      break;
    case 'info':
      console.info(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'error':
      console.error(payload);
      break;
  }
};

export const logger: Logger = {
  debug: (message, context) => log('debug', message, context),
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, context) => log('error', message, context),
};
