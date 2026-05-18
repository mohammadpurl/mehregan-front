import { ApiError, BadRequestError, NetworkError, NotFoundError, UnauthorizedError, UnhandledException, ValidationError }  from 
"@/types/http-errors.interface";


export type ApiErrorHandler = (errorData: ApiError) => void;

export const badRequestErrorStrategy: ApiErrorHandler = errorData => {
    throw {
        ...errorData,
    } as BadRequestError;
}


export const validationErrorStrategy: ApiErrorHandler = (errorData) => {
    throw { ...errorData } as ValidationError;
};

export const notFoundErrorStrategy: ApiErrorHandler = (errorData) => {
    throw { ...errorData, detail: "سرویس مورد نظر یافت نشد" } as NotFoundError;
};

export const unauthorizedErrorStrategy: ApiErrorHandler = (errorData) => {
    throw {
        ...errorData,
        detail: "دسترسی به سرویس مورد نظر امکان پذیر نمی باشد",
    } as UnauthorizedError;
};

export const unhandledExceptionStrategy: ApiErrorHandler = (errorData) => {
    throw { ...errorData, detail: "خطای سرور" } as UnhandledException;
};

export const networkErrorStrategy = () => {
    throw { detail: "خطای شبکه" } as NetworkError;
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