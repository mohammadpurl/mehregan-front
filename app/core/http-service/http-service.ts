import { API_URL } from "@/configs/global";

import {
    ApiError,
} from "@/types/http-errors.interface";
import axios, {
    AxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
} from "axios";
import { defaultErrorStrategy, errorHandler, networkErrorStrategy } from "./http-error-strategies";
import { getSession } from "@/app/utils/session";

const httpService = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

httpService.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error?.response) {
            const statusCode = error.response.status;
            if (statusCode >= 400) {
                const errorData: ApiError = error.response?.data ?? {
                    title: 'خطا',
                    status: statusCode,
                    detail: error.message,
                };
                const handler = errorHandler[statusCode] ?? defaultErrorStrategy;
                handler(errorData);
            }
        } else {
            networkErrorStrategy();
        }
        return Promise.reject(error);
    }
);

async function apiBase<T>(
    url: string,
    options?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse = await httpService(url, options);
    return response.data as T;
}

async function readData<T>(
    url: string,
    headers?: AxiosRequestHeaders
): Promise<T> {
    const options: AxiosRequestConfig = {
        headers: headers,
        method: "GET",
    };
    return await apiBase<T>(url, options);
}

async function createData<TModel, TResult>(
    url: string,
    data: TModel,
    headers?: AxiosRequestHeaders
): Promise<TResult> {
    const options: AxiosRequestConfig = {
        method: "POST",
        headers: headers,
        data
    };
    console.log("createData url is", url);

    return await apiBase<TResult>(url, options);
}

async function updateData<TModel, TResult>(
    url: string,
    data: TModel,
    headers?: AxiosRequestHeaders
): Promise<TResult> {
    const options: AxiosRequestConfig = {
        method: "PUT",
        headers: headers,
        data: JSON.stringify(data),
    };

    return await apiBase<TResult>(url, options);
}

async function patchData<TModel, TResult>(
    url: string,
    data: TModel,
    headers?: AxiosRequestHeaders
): Promise<TResult> {
    const options: AxiosRequestConfig = {
        method: "PATCH",
        headers: headers,
        data,
    };

    return await apiBase<TResult>(url, options);
}

async function uploadData<TResult>(
    url: string,
    data: FormData,
    headers?: AxiosRequestHeaders
): Promise<TResult> {
    const options: AxiosRequestConfig = {
        method: "POST",
        headers: headers,
        data,
    };

    return await apiBase<TResult>(url, options);
}

async function deleteData(
    url: string,
    headers?: AxiosRequestHeaders
): Promise<void> {
    const options: AxiosRequestConfig = {
        method: "DELETE",
        headers: headers,
    };

    return await apiBase(url, options);
}

/**
 * Helper function to get auth headers from session
 * This function reads the session from cookies and adds Authorization header
 */
async function getAuthHeaders(json = true): Promise<AxiosRequestHeaders> {
    const session = await getSession();
    const headers: Record<string, string> = {
        "Accept": "application/json",
    };

    if (json) {
        headers["Content-Type"] = "application/json";
    }
    
    if (session?.accesstoken) {
        headers["Authorization"] = `Bearer ${session.accesstoken}`;
    }
    
    return headers as AxiosRequestHeaders;
}

/**
 * Read data with automatic authentication from session
 */
async function readDataWithAuth<T>(url: string): Promise<T> {
    const headers = await getAuthHeaders();
    return await readData<T>(url, headers);
}

/**
 * Create data with automatic authentication from session
 */
async function createDataWithAuth<TModel, TResult>(
    url: string,
    data: TModel
): Promise<TResult> {
    const headers = await getAuthHeaders();
    return await createData<TModel, TResult>(url, data, headers);
}

/**
 * Update data with automatic authentication from session
 */
async function updateDataWithAuth<TModel, TResult>(
    url: string,
    data: TModel
): Promise<TResult> {
    const headers = await getAuthHeaders();
    return await updateData<TModel, TResult>(url, data, headers);
}

/**
 * Delete data with automatic authentication from session
 */
async function deleteDataWithAuth(url: string): Promise<void> {
    const headers = await getAuthHeaders();
    return await deleteData(url, headers);
}

async function patchDataWithAuth<TModel, TResult>(
    url: string,
    data: TModel
): Promise<TResult> {
    const headers = await getAuthHeaders();
    return await patchData<TModel, TResult>(url, data, headers);
}

async function uploadDataWithAuth<TResult>(
    url: string,
    data: FormData
): Promise<TResult> {
    const headers = await getAuthHeaders(false);
    return await uploadData<TResult>(url, data, headers);
}

export { 
    createData, 
    readData, 
    updateData,
    patchData,
    uploadData,
    deleteData,
    createDataWithAuth,
    readDataWithAuth,
    updateDataWithAuth,
    patchDataWithAuth,
    uploadDataWithAuth,
    deleteDataWithAuth,
};
