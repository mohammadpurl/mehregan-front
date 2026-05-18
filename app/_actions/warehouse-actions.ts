'use server';

import { createDataWithAuth, readDataWithAuth, updateDataWithAuth, deleteDataWithAuth } from '@/app/core/http-service/http-service';
import { getRequesterFromSession } from '@/app/utils/requester-from-session';
import { 
  WarehouseFormData, 
  WarehouseResponse, 
  WarehouseListResponse, 
  WarehouseFormType,
  WarehouseLocation,
  WarehouseItem
} from '../_types/warehouse.types';

const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[WAREHOUSE-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function createWarehouseAction(data: WarehouseFormData) {
  const startTime = Date.now();
  log('info', 'createWarehouseAction started', { type: data.type });
  
  try {
    const req = await getRequesterFromSession();
    const payload: WarehouseFormData = {
      ...data,
      requesterId: data.requesterId?.trim() ? data.requesterId : req.requesterId,
      requesterName: data.requesterName?.trim() ? data.requesterName : req.requesterName || undefined,
    };
    const response = await createDataWithAuth<WarehouseFormData, WarehouseResponse>(
      '/warehouse-forms',
      payload
    );
    
    const duration = Date.now() - startTime;
    log('info', 'createWarehouseAction completed successfully', {
      duration: `${duration}ms`,
      id: response.id,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createWarehouseAction failed', {
      duration: `${duration}ms`,
      error: error?.message || error?.response?.data?.message,
    });
    
    return { 
      success: false, 
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد فرم انبار' 
    };
  }
}

export async function getWarehouseAction(id: string) {
  const startTime = Date.now();
  log('info', 'getWarehouseAction started', { id });
  
  try {
    const response = await readDataWithAuth<WarehouseResponse>(`/warehouse-forms/${id}`);
    
    const duration = Date.now() - startTime;
    log('info', 'getWarehouseAction completed successfully', {
      duration: `${duration}ms`,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string };
    log('error', 'getWarehouseAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });
    
    return { success: false, error: error?.message || 'خطا در دریافت فرم انبار' };
  }
}

export async function getWarehousesAction(page: number = 1, pageSize: number = 10) {
  const startTime = Date.now();
  log('info', 'getWarehousesAction started', { page, pageSize });
  
  try {
    const response = await readDataWithAuth<WarehouseListResponse>(
      `/warehouse-forms?page=${page}&pageSize=${pageSize}`,
    );
    
    const duration = Date.now() - startTime;
    log('info', 'getWarehousesAction completed successfully', {
      duration: `${duration}ms`,
      total: response.total,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string };
    log('error', 'getWarehousesAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });
    
    return { success: false, error: error?.message || 'خطا در دریافت لیست فرم‌های انبار' };
  }
}

export async function updateWarehouseAction(id: string, data: Partial<WarehouseFormData>) {
  const startTime = Date.now();
  log('info', 'updateWarehouseAction started', { id });
  
  try {
    const response = await updateDataWithAuth<Partial<WarehouseFormData>, WarehouseResponse>(
      `/warehouse-forms/${id}`,
      data
    );
    
    const duration = Date.now() - startTime;
    log('info', 'updateWarehouseAction completed successfully', {
      duration: `${duration}ms`,
    });
    
    return { success: true, data: response };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updateWarehouseAction failed', {
      duration: `${duration}ms`,
      error: error?.message || error?.response?.data?.message,
    });
    
    return { 
      success: false, 
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی فرم انبار' 
    };
  }
}

export async function deleteWarehouseAction(id: string) {
  const startTime = Date.now();
  log('info', 'deleteWarehouseAction started', { id });
  
  try {
    await deleteDataWithAuth(`/warehouse-forms/${id}`);
    
    const duration = Date.now() - startTime;
    log('info', 'deleteWarehouseAction completed successfully', {
      duration: `${duration}ms`,
    });
    
    return { success: true };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err as { message?: string };
    log('error', 'deleteWarehouseAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });
    
    return { success: false, error: error?.message || 'خطا در حذف فرم انبار' };
  }
}
