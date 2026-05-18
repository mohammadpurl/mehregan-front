'use server';

import { createDataWithAuth, readDataWithAuth, updateDataWithAuth, deleteDataWithAuth } from '@/app/core/http-service/http-service';
import { getRequesterFromSession } from '@/app/utils/requester-from-session';
import { 
  ProductRequestFormData, 
  ProductRequestResponse, 
  ProductRequestListResponse 
} from '../_types/product-request.types';

const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[PRODUCT-REQUEST-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function createProductRequestAction(data: ProductRequestFormData) {
  const startTime = Date.now();
  log('info', 'createProductRequestAction started', { productType: data.productType });
  
  try {
    const req = await getRequesterFromSession();
    const payload: ProductRequestFormData = {
      ...data,
      requesterId: data.requesterId?.trim() ? data.requesterId : req.requesterId,
      requesterName: data.requesterName?.trim() ? data.requesterName : req.requesterName || undefined,
    };
    const response = await createDataWithAuth<ProductRequestFormData, ProductRequestResponse>(
      '/requests',
      payload
    );
    
    const duration = Date.now() - startTime;
    log('info', 'createProductRequestAction completed successfully', {
      duration: `${duration}ms`,
      id: response.id,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createProductRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message || error?.response?.data?.message,
    });
    
    return { 
      success: false, 
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد درخواست کالا' 
    };
  }
}

export async function getProductRequestAction(id: string) {
  const startTime = Date.now();
  log('info', 'getProductRequestAction started', { id });
  
  try {
    const response = await readDataWithAuth<ProductRequestResponse>(`/requests/${id}`);
    
    const duration = Date.now() - startTime;
    log('info', 'getProductRequestAction completed successfully', {
      duration: `${duration}ms`,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string };
    log('error', 'getProductRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });
    
    return { success: false, error: error?.message || 'خطا در دریافت درخواست کالا' };
  }
}

export async function getProductRequestsAction(page: number = 1, pageSize: number = 10) {
  const startTime = Date.now();
  log('info', 'getProductRequestsAction started', { page, pageSize });
  
  try {
    const response = await readDataWithAuth<ProductRequestListResponse>(
      `/requests?page=${page}&pageSize=${pageSize}`
    );
    
    const duration = Date.now() - startTime;
    log('info', 'getProductRequestsAction completed successfully', {
      duration: `${duration}ms`,
      total: response.total,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string };
    log('error', 'getProductRequestsAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });
    
    return { success: false, error: error?.message || 'خطا در دریافت لیست درخواست‌های کالا' };
  }
}

export async function getProductRequestsQueryAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  id?: string;
  status?: string;
  productType?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.search) query.set('search', params.search);
  if (params?.id) query.set('id', params.id);
  if (params?.status) query.set('status', params.status);
  if (params?.productType) query.set('productType', params.productType);

  const url = `/requests?${query.toString()}`;
  const startTime = Date.now();
  log('info', 'getProductRequestsQueryAction started', { url, params });
  try {
    const response = await readDataWithAuth<ProductRequestListResponse>(url);
    const duration = Date.now() - startTime;
    log('info', 'getProductRequestsQueryAction completed successfully', {
      duration: `${duration}ms`,
      total: response.total,
    });
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string };
    log('error', 'getProductRequestsQueryAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
      url,
    });
    return { success: false, error: error?.message || 'خطا در دریافت لیست درخواست‌های کالا' };
  }
}

export async function updateProductRequestAction(id: string, data: Partial<ProductRequestFormData>) {
  const startTime = Date.now();
  log('info', 'updateProductRequestAction started', { id });
  
  try {
    const response = await updateDataWithAuth<Partial<ProductRequestFormData>, ProductRequestResponse>(
      `/requests/${id}`,
      data
    );
    
    const duration = Date.now() - startTime;
    log('info', 'updateProductRequestAction completed successfully', {
      duration: `${duration}ms`,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updateProductRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message || error?.response?.data?.message,
    });
    
    return { 
      success: false, 
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی درخواست کالا' 
    };
  }
}

export async function deleteProductRequestAction(id: string) {
  const startTime = Date.now();
  log('info', 'deleteProductRequestAction started', { id });
  
  try {
    await deleteDataWithAuth(`/requests/${id}`);
    
    const duration = Date.now() - startTime;
    log('info', 'deleteProductRequestAction completed successfully', {
      duration: `${duration}ms`,
    });
    
    return { success: true };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string };
    log('error', 'deleteProductRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });
    
    return { success: false, error: error?.message || 'خطا در حذف درخواست کالا' };
  }
}
