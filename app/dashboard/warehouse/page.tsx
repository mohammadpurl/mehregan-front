'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deleteWarehouseAction, getWarehousesAction } from '@/app/_actions/warehouse-actions';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { WarehouseResponse } from '@/app/_types/warehouse.types';
import { useToast } from '@/hooks/use-toast';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { formatJalaliDate } from '@/app/utils/jalali-date';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  pending: 'در انتظار',
  approved: 'تایید شده',
  rejected: 'رد شده',
  completed: 'تکمیل شده',
};

const typeLabels: Record<string, string> = {
  entry: 'ورود',
  exit: 'خروج',
  transfer: 'انتقال',
};

export default function WarehouseListPage() {
  const { toast } = useToast();
  const { executeDelete } = useDeleteAction();
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getWarehousesAction(page, pageSize);
      if (result.success && result.data) {
        setWarehouses(result.data.items);
        setTotal(result.data.total);
      } else {
        toast({
          title: 'خطا',
          description: result.error || 'خطا در دریافت لیست فرم‌های انبار',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'خطا',
        description: err?.message || 'خطا در دریافت لیست فرم‌های انبار',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, toast]);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  const handleDelete = async (id: string) => {
    await executeDelete(() => deleteWarehouseAction(id), {
      successMessage: 'فرم انبار حذف شد',
      errorMessage: 'حذف فرم انبار ناموفق بود',
      onSuccess: () => void loadWarehouses(),
    });
  };

  return (
    <DashboardPageShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لیست فرم‌های انبار</h1>
          <p className="text-muted-foreground">مدیریت ورود، خروج و انتقال کالاها</p>
        </div>
        <Link href="/dashboard/warehouse/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            ایجاد جدید
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فرم‌های انبار</CardTitle>
          <CardDescription>
            تعداد کل: {total} | صفحه {page} از {Math.ceil(total / pageSize) || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">در حال بارگذاری...</div>
          ) : warehouses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">هیچ فرم انباری یافت نشد</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead>مبدأ</TableHead>
                    <TableHead>مقصد</TableHead>
                    <TableHead>دریافت‌کننده</TableHead>
                    <TableHead>تعداد اقلام</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        {warehouse.title?.trim() || `فرم #${warehouse.id}`}
                      </TableCell>
                      <TableCell>{typeLabels[warehouse.type] ?? warehouse.type}</TableCell>
                      <TableCell>{warehouse.source?.name ?? '—'}</TableCell>
                      <TableCell>{warehouse.destination?.name ?? '—'}</TableCell>
                      <TableCell>{warehouse.receiverName}</TableCell>
                      <TableCell>{warehouse.items?.length ?? 0}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[warehouse.status]}>
                          {statusLabels[warehouse.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatJalaliDate(warehouse.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" type="button">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" type="button">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="text-destructive hover:text-destructive"
                            onClick={() => void handleDelete(warehouse.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                >
                  بعدی
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
