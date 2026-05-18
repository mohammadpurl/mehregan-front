'use server';

import { readDataWithAuth } from '@/app/core/http-service/http-service';
import type { InventoryTransaction, StockLevel } from '@/app/_types/inventory.types';

type Paginated<T> = { items: T[]; total: number; page?: number; pageSize?: number };

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[INVENTORY-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

function num(v: unknown, fallback = 0): number {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  return String(v);
}

/** Normalize one stock row from various API shapes */
function normalizeStockRow(raw: Record<string, unknown>, index: number): StockLevel {
  const id = num(raw.id ?? raw.item_id ?? raw.itemId ?? index + 1, index + 1);
  const itemName = str(raw.item_name ?? raw.itemName ?? raw.name ?? '-', '-');
  const sku = str(raw.sku ?? raw.code ?? '-', '-');
  const unit = str(raw.unit ?? raw.uom ?? '-', '-');
  const onHand = num(raw.on_hand ?? raw.onHand ?? raw.quantity ?? raw.qty, 0);
  const available = num(raw.available ?? raw.available_qty ?? raw.allocatable ?? onHand, onHand);
  return { id, itemName, sku, unit, onHand, available };
}

function normalizeTxRow(raw: Record<string, unknown>, index: number): InventoryTransaction {
  const id = str(raw.id ?? raw.transaction_id ?? `tx-${index}`, `tx-${index}`);
  const type = str(raw.type ?? raw.movement_type ?? raw.kind ?? '-', '-');
  const source = str(
    raw.source ?? raw.source_name ?? raw.from_warehouse ?? raw.origin ?? '-',
    '-',
  );
  const destination = str(
    raw.destination ?? raw.destination_name ?? raw.to_warehouse ?? raw.dest ?? '-',
    '-',
  );
  const receiverName = str(raw.receiver_name ?? raw.receiverName ?? raw.user_name ?? '-', '-');
  const date = str(raw.date ?? raw.created_at ?? raw.createdAt ?? '-', '-');
  const status = str(raw.status ?? raw.state ?? '-', '-');
  return { id, type, source, destination, receiverName, date, status };
}

export async function getStockLevelsAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.search) query.set('search', params.search);

  const url = `/inventory/stock?${query.toString()}`;
  try {
    log('info', 'getStockLevelsAction request', { url });
    const data = await readDataWithAuth<Paginated<Record<string, unknown>> | Record<string, unknown>[]>(url);
    const itemsRaw = Array.isArray(data)
      ? data
      : Array.isArray((data as Paginated<Record<string, unknown>>).items)
        ? (data as Paginated<Record<string, unknown>>).items
        : [];
    const total = Array.isArray(data)
      ? data.length
      : num((data as Paginated<Record<string, unknown>>).total, itemsRaw.length);
    const items: StockLevel[] = itemsRaw.map((row, i) => normalizeStockRow(row, i));
    return { success: true, data: { items, total, page, pageSize } };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getStockLevelsAction failed', { error: error?.message, url });
    return { success: false, error: error?.message || 'خطا در دریافت موجودی' };
  }
}

export async function getInventoryTransactionsAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.search) query.set('search', params.search);

  const url = `/inventory/transactions?${query.toString()}`;
  try {
    log('info', 'getInventoryTransactionsAction request', { url });
    const data = await readDataWithAuth<Paginated<Record<string, unknown>> | Record<string, unknown>[]>(url);
    const itemsRaw = Array.isArray(data)
      ? data
      : Array.isArray((data as Paginated<Record<string, unknown>>).items)
        ? (data as Paginated<Record<string, unknown>>).items
        : [];
    const total = Array.isArray(data)
      ? data.length
      : num((data as Paginated<Record<string, unknown>>).total, itemsRaw.length);
    const items: InventoryTransaction[] = itemsRaw.map((row, i) => normalizeTxRow(row, i));
    return { success: true, data: { items, total, page, pageSize } };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getInventoryTransactionsAction failed', { error: error?.message, url });
    return { success: false, error: error?.message || 'خطا در دریافت تراکنش‌های انبار' };
  }
}
