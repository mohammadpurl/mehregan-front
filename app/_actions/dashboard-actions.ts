'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import { readDataWithAuth } from '@/app/core/http-service/http-service';

export type ExecutiveFinancialReport = {
  period: { from: string | null; to: string | null };
  payment_requests: {
    total: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    total_amount: number;
  };
  petty_cash: {
    total: number;
    pending_count: number;
    approved_count: number;
    awaiting_settlement_count: number;
    total_amount: number;
  };
  workflow: {
    all_pending_instances: number;
    financial_pending_instances: number;
    financial_pending_steps: number;
  };
};

export type WarehouseDailyReport = {
  date: string;
  warehouses_count: number;
  stock_lines_count: number;
  transactions_today: { total: number; by_type: Record<string, { count: number; quantity: number }> };
  grn: { created_today: number; posted_today: number };
  low_stock_count: number;
  low_stock: Array<{
    item_name: string;
    sku: string;
    warehouse_name: string;
    quantity: number;
  }>;
};

export type ManagementDashboard = {
  forms: Record<string, number>;
  workflow: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    by_ref_type: Record<string, number>;
  };
  operations: { inbox_pending: number; sla_overdue: number };
};

export type UserDashboard = {
  stats: {
    pending: number;
    done: number;
    overdue: number;
    my_payment_requests: number;
    my_workflow_forms: number;
  };
};

export async function getUserDashboardAction() {
  try {
    const data = await readDataWithAuth<UserDashboard>('/dashboard/');
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت داشبورد') };
  }
}

export async function getManagementDashboardAction() {
  try {
    const data = await readDataWithAuth<ManagementDashboard>('/dashboard/management');
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت آمار مدیریتی') };
  }
}

export async function getExecutiveFinancialReportAction() {
  try {
    const data = await readDataWithAuth<ExecutiveFinancialReport>('/reports/executive/financial');
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت گزارش مالی'),
    };
  }
}

export async function getWarehouseDailyReportAction() {
  try {
    const data = await readDataWithAuth<WarehouseDailyReport>('/reports/warehouse/daily');
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت گزارش انبار'),
    };
  }
}
