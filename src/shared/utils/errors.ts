export type TAppError = {
  code: string;
  message: string;
  context?: Record<string, unknown>;
};

/**
 * Convert an unknown error into a structured TAppError.
 */
export const fromRawError = (error: unknown): TAppError => {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      context: {
        name: error.name,
        stack: error.stack,
      },
    };
  }

  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    context: { rawError: String(error) },
  };
};

/**
 * Convert a TAppError into a user-facing error message.
 * Strips internal details and returns a safe message for display.
 */
export const toUserFacingError = (error: TAppError): string => {
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    UNAUTHORIZED: 'Your session has expired. Please log in again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  };

  return errorMessages[error.code] ?? error.message;
};

/**
 * Type guard to check if a value is a TAppError.
 */
const isAppError = (value: unknown): value is TAppError => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as TAppError).code === 'string' &&
    typeof (value as TAppError).message === 'string'
  );
};
