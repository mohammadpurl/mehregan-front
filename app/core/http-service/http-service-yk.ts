// app/core/http-service/http-service.ts
import ky, { KyResponse, Options } from 'ky';
import { API_URL } from "@/configs/global";
import { ApiError } from "@/types/http-errors.interface";
import { getSession } from "@/app/utils/session";

// Helper function for structured logging (همان قبلی)
const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data, null, 2) : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

// ایجاد instance اصلی ky
const httpService = ky.create({
    prefix: API_URL,
    timeout: 180000,                    // 180 ثانیه
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    retry: 1,                           // تعداد retry در صورت شکست
    throwHttpErrors: false,             // مثل axios validateStatus
});

// Request logger
httpService.extend({
    hooks: {
        beforeRequest: [
            (request) => {
                log('info', `[HTTP REQUEST] ${request.request.method} ${request.options.baseUrl}`, {
                    method: request.options.method,
                    url: request.options.baseUrl,
                    headers: Object.fromEntries(request.request.headers),
                });
            }
        ],
        afterResponse: [
            async (request, options, response) => {
                log('info', `[HTTP RESPONSE] ${request.method} ${request.url}`, {
                    status: response.status,
                    statusText: response.statusText,
                    contentType: response.headers.get('content-type'),
                    hasData: response.body !== null,
                });
            }
        ],
    }
});

async function apiBase<T>(url: string, options: Options = {}): Promise<T> {
    const startTime = Date.now();

    try {
        log('info', `[API_BASE] Starting request to ${url}`, {
            fullUrl: `${API_URL}${url}`,
            method: options.method || 'GET',
            data: options.json || options.body,
        });

        const response = await httpService(url, options);
        const data = await response.json() as T;

        const duration = Date.now() - startTime;
        log('info', `[API_BASE] Request completed successfully in ${duration}ms`, {
            url,
            duration: `${duration}ms`,
            status: response.status,
        });

        return data;
    } catch (error: unknown) {
        console.log(error)
        const duration = Date.now() - startTime;
        log('error', `[API_BASE] Request failed after ${duration}ms`, {
            url,
            error: error instanceof Error ? error.message : error,
        });
        throw error;
    }
}

// ====================== توابع اصلی ======================

async function readData<T>(url: string, headers?: HeadersInit): Promise<T> {
    return await apiBase<T>(url, { method: 'GET', headers });
}

async function createData<TModel, TResult>(
    url: string,
    data: TModel,
    headers?: HeadersInit
): Promise<TResult> {
    // حل مشکل ارسال آرایه توسط Next.js Server Actions
    let payload = data;
    if (Array.isArray(data)) {
        payload = data[0] || {};
        log('warn', '[createData] Array detected, using first item as payload');
    }

    return await apiBase<TResult>(url, {
        method: 'POST',
        json: payload,           // ky به صورت خودکار JSON.stringify می‌کند
        headers,
    });
}

async function updateData<TModel, TResult>(
    url: string,
    data: TModel,
    headers?: HeadersInit
): Promise<TResult> {
    const payload = Array.isArray(data) ? data[0] || {} : data;

    return await apiBase<TResult>(url, {
        method: 'PUT',
        json: payload,
        headers,
    });
}

async function deleteData(url: string, headers?: HeadersInit): Promise<void> {
    await apiBase(url, { method: 'DELETE', headers });
}

// ====================== توابع با Authentication ======================

async function getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    };

    if (session?.accesstoken) {
        headers["Authorization"] = `Bearer ${session.accesstoken}`;
    }

    return headers;
}

async function readDataWithAuth<T>(url: string): Promise<T> {
    const headers = await getAuthHeaders();
    return await readData<T>(url, headers);
}

async function createDataWithAuth<TModel, TResult>(url: string, data: TModel): Promise<TResult> {
    const headers = await getAuthHeaders();
    return await createData<TModel, TResult>(url, data, headers);
}

async function updateDataWithAuth<TModel, TResult>(url: string, data: TModel): Promise<TResult> {
    const headers = await getAuthHeaders();
    return await updateData<TModel, TResult>(url, data, headers);
}

async function deleteDataWithAuth(url: string): Promise<void> {
    const headers = await getAuthHeaders();
    return await deleteData(url, headers);
}

export { 
    createData, 
    readData, 
    updateData, 
    deleteData,
    createDataWithAuth,
    readDataWithAuth,
    updateDataWithAuth,
    deleteDataWithAuth,
};