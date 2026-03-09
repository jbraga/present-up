export type AppErrorProps = {
  message: string;
  cause?: unknown;
  code?: string;
  context?: Record<string, unknown>;
};

export class AppError extends Error {
  public readonly code?: string;

  public readonly context?: Record<string, unknown>;

  constructor({ message, cause, code, context }: AppErrorProps) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    if (cause instanceof Error) {
      this.stack = cause.stack;
    }
  }
}

export class AuthRequiredError extends AppError {
  constructor() {
    super({
      message: 'Authentication is required to complete this action.',
      code: 'AUTH_REQUIRED',
    });
  }
}

export class NetworkError extends AppError {
  constructor(message: string, cause?: unknown, context?: Record<string, unknown>) {
    super({ message, cause, code: 'NETWORK_ERROR', context });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({ message, code: 'VALIDATION_ERROR', context });
  }
}
