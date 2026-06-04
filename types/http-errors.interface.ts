interface Problem {
    /** RFC7807 + backend standard */
    title?: string;
    status?: number;
    code?: string;
    message?: string;
    detail?: string;
    errors?: Record<string, string[]>;
}

interface BadRequestError extends Problem {}
interface UnauthorizedError extends Problem {}
interface ValidationError extends Problem {}
interface NotFoundError extends Problem {}
interface UnhandledException extends Problem {}
interface NetworkError extends Problem {}

type ApiError =
    | BadRequestError
    | NetworkError
    | NotFoundError
    | UnhandledException
    | UnauthorizedError
    | ValidationError;

export type {
    Problem,
    BadRequestError,
    UnauthorizedError,
    ValidationError,
    NotFoundError,
    UnhandledException,
    NetworkError,
    ApiError
};
