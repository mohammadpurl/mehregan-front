import {
    ApiError,
    BadRequestError,
    NetworkError,
    NotFoundError,
    UnauthorizedError,
    UnhandledException,
    ValidationError,
} from '@/types/http-errors.interface';

export type ApiErrorHandler = (errorData: ApiError) => void;

function pickMessage(errorData: ApiError): string | undefined {
    if (typeof errorData.message === 'string' && errorData.message.trim()) {
        return errorData.message.trim();
    }
    if (typeof errorData.detail === 'string' && errorData.detail.trim()) {
        return errorData.detail.trim();
    }
    if (typeof errorData.title === 'string' && errorData.title.trim()) {
        return errorData.title.trim();
    }
    return undefined;
}

/** Normalize backend { code, message, detail, title, status } before re-throw */
function normalizeApiError(errorData: ApiError, status: number): ApiError {
    const msg = pickMessage(errorData);
    return {
        ...errorData,
        status: errorData.status ?? status,
        title: errorData.title ?? msg,
        message: msg,
        detail: (typeof errorData.detail === 'string' && errorData.detail.trim())
            ? errorData.detail.trim()
            : msg,
    };
}

export const badRequestErrorStrategy: ApiErrorHandler = (errorData) => {
    throw normalizeApiError(errorData, 400) as BadRequestError;
};

export const validationErrorStrategy: ApiErrorHandler = (errorData) => {
    throw normalizeApiError(errorData, 422) as ValidationError;
};

export const notFoundErrorStrategy: ApiErrorHandler = (errorData) => {
    const normalized = normalizeApiError(errorData, 404);
    throw {
        ...normalized,
        title: normalized.title || 'یافت نشد',
        message: normalized.message || 'سرویس مورد نظر یافت نشد',
        detail: normalized.detail || normalized.message || 'سرویس مورد نظر یافت نشد',
    } as NotFoundError;
};

export const unauthorizedErrorStrategy: ApiErrorHandler = (errorData) => {
    const normalized = normalizeApiError(errorData, errorData.status ?? 401);
    throw {
        ...normalized,
        title: normalized.title || 'دسترسی مجاز نیست',
        message: normalized.message || 'دسترسی به سرویس مورد نظر امکان پذیر نمی باشد',
        detail: normalized.detail || normalized.message || 'دسترسی به سرویس مورد نظر امکان پذیر نمی باشد',
    } as UnauthorizedError;
};

export const unhandledExceptionStrategy: ApiErrorHandler = (errorData) => {
    const normalized = normalizeApiError(errorData, errorData.status ?? 500);
    throw {
        ...normalized,
        title: normalized.title || 'خطای سرور',
        message: normalized.message || 'خطای سرور',
        detail: normalized.detail || normalized.message || 'خطای سرور',
    } as UnhandledException;
};

export const networkErrorStrategy = () => {
    throw { detail: 'خطای شبکه', message: 'خطای شبکه', title: 'خطای شبکه', status: 0 } as NetworkError;
};

export const errorHandler: Record<number, ApiErrorHandler> = {
    400: (errorData) => {
        if (errorData.errors) validationErrorStrategy(errorData);
        else badRequestErrorStrategy(errorData);
    },
    401: unauthorizedErrorStrategy,
    403: unauthorizedErrorStrategy,
    404: notFoundErrorStrategy,
    409: badRequestErrorStrategy,
    422: validationErrorStrategy,
    500: unhandledExceptionStrategy,
};

/** برای status codeهایی که در جدول بالا نیستند */
export const defaultErrorStrategy = unhandledExceptionStrategy;
