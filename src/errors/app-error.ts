/**
 * AppError - Centralized Error Handling
 * 
 * Provides standardized error handling across the application.
 * Supports error codes, severity levels, and context tracking.
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Common error codes for the application
 */
export enum ErrorCode {
    // Auth errors
    AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
    AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
    AUTH_SESSION_NOT_FOUND = 'AUTH_SESSION_NOT_FOUND',

    // API errors
    API_REQUEST_FAILED = 'API_REQUEST_FAILED',
    API_RESPONSE_INVALID = 'API_RESPONSE_INVALID',
    API_NETWORK_ERROR = 'API_NETWORK_ERROR',
    API_RATE_LIMITED = 'API_RATE_LIMITED',
    API_UNAUTHORIZED = 'API_UNAUTHORIZED',
    API_FORBIDDEN = 'API_FORBIDDEN',
    API_NOT_FOUND = 'API_NOT_FOUND',
    API_SERVER_ERROR = 'API_SERVER_ERROR',

    // Database errors
    DB_QUERY_FAILED = 'DB_QUERY_FAILED',
    DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
    DB_TRANSACTION_FAILED = 'DB_TRANSACTION_FAILED',
    DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',

    // Validation errors
    VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
    VALIDATION_MISSING_FIELD = 'VALIDATION_MISSING_FIELD',
    VALIDATION_FORMAT_INVALID = 'VALIDATION_FORMAT_INVALID',

    // File/Storage errors
    STORAGE_READ_FAILED = 'STORAGE_READ_FAILED',
    STORAGE_WRITE_FAILED = 'STORAGE_WRITE_FAILED',
    STORAGE_DELETE_FAILED = 'STORAGE_DELETE_FAILED',
    STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',

    // General errors
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
    FEATURE_DISABLED = 'FEATURE_DISABLED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/**
 * Maps error codes to default severity levels
 */
const ERROR_CODE_SEVERITY: Record<ErrorCode, ErrorSeverity> = {
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'medium',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 'low',
    [ErrorCode.AUTH_UNAUTHORIZED]: 'medium',
    [ErrorCode.AUTH_SESSION_NOT_FOUND]: 'low',
    [ErrorCode.API_REQUEST_FAILED]: 'medium',
    [ErrorCode.API_RESPONSE_INVALID]: 'medium',
    [ErrorCode.API_NETWORK_ERROR]: 'high',
    [ErrorCode.API_RATE_LIMITED]: 'medium',
    [ErrorCode.API_UNAUTHORIZED]: 'medium',
    [ErrorCode.API_FORBIDDEN]: 'medium',
    [ErrorCode.API_NOT_FOUND]: 'low',
    [ErrorCode.API_SERVER_ERROR]: 'high',
    [ErrorCode.DB_QUERY_FAILED]: 'medium',
    [ErrorCode.DB_CONSTRAINT_VIOLATION]: 'medium',
    [ErrorCode.DB_TRANSACTION_FAILED]: 'high',
    [ErrorCode.DB_CONNECTION_FAILED]: 'high',
    [ErrorCode.VALIDATION_INVALID_INPUT]: 'low',
    [ErrorCode.VALIDATION_MISSING_FIELD]: 'low',
    [ErrorCode.VALIDATION_FORMAT_INVALID]: 'low',
    [ErrorCode.STORAGE_READ_FAILED]: 'medium',
    [ErrorCode.STORAGE_WRITE_FAILED]: 'medium',
    [ErrorCode.STORAGE_DELETE_FAILED]: 'medium',
    [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'high',
    [ErrorCode.UNKNOWN_ERROR]: 'medium',
    [ErrorCode.NOT_IMPLEMENTED]: 'low',
    [ErrorCode.FEATURE_DISABLED]: 'low',
    [ErrorCode.PERMISSION_DENIED]: 'medium',
};

/**
 * AppError class for standardized error handling
 */
export class AppError extends Error {
    public code: ErrorCode;
    public severity: ErrorSeverity;
    public context: Record<string, unknown>;
    public originalError?: unknown;
    public readonly timestamp: Date;

    constructor(
        message: string,
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        severity?: ErrorSeverity,
        context?: Record<string, unknown>,
        originalError?: unknown
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.severity = severity ?? ERROR_CODE_SEVERITY[code] ?? 'medium';
        this.context = context ?? {};
        this.originalError = originalError;
        this.timestamp = new Date();
    }

    /**
     * Creates an AppError from an existing error
     */
    static from(error: unknown, code: ErrorCode = ErrorCode.UNKNOWN_ERROR): AppError {
        if (error instanceof AppError) {
            return error;
        }

        const message = error instanceof Error ? error.message : 'Unknown error occurred';

        return new AppError(
            message,
            code,
            undefined,
            { originalStack: error instanceof Error ? error.stack : undefined },
            error
        );
    }

    /**
     * Creates an error with user-friendly message
     */
    static withUserMessage(
        code: ErrorCode,
        userMessage: string,
        severity?: ErrorSeverity,
        context?: Record<string, unknown>
    ): AppError {
        return new AppError(userMessage, code, severity, context);
    }

    /**
     * Creates a validation error
     */
    static validation(message: string, field?: string): AppError {
        return new AppError(
            message,
            ErrorCode.VALIDATION_INVALID_INPUT,
            'low',
            { field }
        );
    }

    /**
     * Creates an API error with status code
     */
    static api(
        statusCode: number,
        message?: string,
        context?: Record<string, unknown>
    ): AppError {
        const codeMap: Record<number, ErrorCode> = {
            401: ErrorCode.API_UNAUTHORIZED,
            403: ErrorCode.API_FORBIDDEN,
            404: ErrorCode.API_NOT_FOUND,
            429: ErrorCode.API_RATE_LIMITED,
            500: ErrorCode.API_SERVER_ERROR,
        };

        const code = codeMap[statusCode] ?? ErrorCode.API_REQUEST_FAILED;

        return new AppError(
            message ?? `API request failed with status ${statusCode}`,
            code,
            statusCode >= 500 ? 'high' : 'medium',
            context
        );
    }

    /**
     * Checks if error is retryable
     */
    isRetryable(): boolean {
        // Network errors and server errors are retryable
        if (this.code === ErrorCode.API_NETWORK_ERROR ||
            this.code === ErrorCode.API_SERVER_ERROR ||
            this.code === ErrorCode.DB_CONNECTION_FAILED ||
            this.code === ErrorCode.DB_TRANSACTION_FAILED) {
            return true;
        }
        return false;
    }

    /**
     * Serializes error for logging/storage
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            severity: this.severity,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
        };
    }

    /**
     * Creates a string representation
     */
    toString(): string {
        return `[${this.code}] ${this.message} (severity: ${this.severity})`;
    }
}

/**
 * Result type for operations that can fail
 */
export type Result<T> =
    | { success: true; data: T }
    | { success: false; error: AppError };

/**
 * Creates a successful result
 */
export function success<T>(data: T): Result<T> {
    return { success: true, data };
}

/**
 * Creates a failed result
 */
export function failure<T>(error: AppError): Result<T> {
    return { success: false, error };
}

/**
 * Type guard for checking if result is successful
 */
export function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
    return result.success;
}

/**
 * Type guard for checking if result is failed
 */
export function isFailure<T>(result: Result<T>): result is { success: false; error: AppError } {
    return !result.success;
}

/**
 * Wraps a promise with error handling
 */
export async function withErrorHandling<T>(
    promise: Promise<T>,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR
): Promise<Result<T>> {
    try {
        const data = await promise;
        return success(data);
    } catch (error) {
        return failure(AppError.from(error, code));
    }
}
