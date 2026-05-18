'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  deleteProductRequestAction,
  getProductRequestsQueryAction,
} from '@/app/_actions/product-request-actions';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { ProductRequestResponse } from '@/app/_types/product-request.types';
import { useToast } from '@/hooks/use-toast';
import { AdvancedModal } from '@/app/components/Modal';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Input } from '@/app/components/ui/input';
import { formatJalaliDate } from '@/app/utils/jalali-date';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  purchased: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  pending: 'در انتظار',
  approved: 'تایید شده',
  rejected: 'رد شده',
  purchased: 'خریداری شده',
};

const typeLabels: Record<string, string> = {
  equipment: 'تجهیزات',
  material: 'مواد اولیه',
  office_supplies: 'ملزومات اداری',
  other: 'سایر',
};

export default function ProductRequestListPage() {
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId')?.trim() || '';
  const { toast } = useToast();
  const { executeDelete } = useDeleteAction();
  const [products, setProducts] = useState<ProductRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [requestIdFilter, setRequestIdFilter] = useState(initialRequestId);
  const [selectedId, setSelectedId] = useState<string | null>(initialRequestId || null);
  const [detailsOpen, setDetailsOpen] = useState(Boolean(initialRequestId));
  const pageSize = 10;

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getProductRequestsQueryAction({
        page,
        pageSize,
        id: requestIdFilter.trim() || initialRequestId || undefined,
      });
      if (result.success && result.data) {
        setProducts(result.data.items);
        setTotal(result.data.total);
      } else {
        toast({
          title: 'خطا',
          description: result.error || 'خطا در دریافت لیست درخواست‌های کالا',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'خطا',
        description: err?.message || 'خطا در دریافت لیست درخواست‌های کالا',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [initialRequestId, page, pageSize, requestIdFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const selectedRequest = useMemo(
    () => products.find((p) => p.id === selectedId) || null,
    [products, selectedId],
  );

  const handleDelete = async (id: string) => {
    await executeDelete(() => deleteProductRequestAction(id), {
      successMessage: 'درخواست کالا حذف شد',
      errorMessage: 'حذف درخواست کالا ناموفق بود',
      onSuccess: () => {
        if (selectedId === id) {
          setSelectedId(null);
          setDetailsOpen(false);
        }
        void loadProducts();
      },
    });
  };

  return (
    <DashboardPageShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لیست درخواست‌های کالا</h1>
          <p className="text-muted-foreground">مدیریت درخواست‌های خرید کالا</p>
        </div>
        <Link href="/dashboard/product-request/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            ایجاد جدید
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="شناسه درخواست (Deep link)"
          value={requestIdFilter}
          onChange={(e) => setRequestIdFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setPage(1);
            void loadProducts();
          }}
        >
          اعمال
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>درخواست‌های کالا</CardTitle>
          <CardDescription>
            تعداد کل: {total} | صفحه {page} از {Math.ceil(total / pageSize)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">در حال بارگذاری...</div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              هیچ درخواست کالایی یافت نشد
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع کالا</TableHead>
                    <TableHead>درخواست کننده</TableHead>
                    <TableHead>دلیل درخواست</TableHead>
                    <TableHead>تعداد کالاها</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{typeLabels[product.productType]}</TableCell>
                      <TableCell>{product.requesterName}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {product.reason}
                      </TableCell>
                      <TableCell>{product.items?.length || 0}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[product.status]}>
                          {statusLabels[product.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatJalaliDate(product.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setSelectedId(product.id);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="text-destructive hover:text-destructive"
                            onClick={() => void handleDelete(product.id)}
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
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                >
                  بعدی
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AdvancedModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title="جزئیات درخواست کالا"
        size="lg"
        footer={
          <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
            بستن
          </Button>
        }
      >
        {!selectedRequest ? (
          <div className="text-sm text-muted-foreground">موردی انتخاب نشده است.</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">شناسه:</span> {selectedRequest.id}</div>
              <div><span className="text-muted-foreground">نوع:</span> {typeLabels[selectedRequest.productType]}</div>
              <div><span className="text-muted-foreground">درخواست‌کننده:</span> {selectedRequest.requesterName}</div>
              <div><span className="text-muted-foreground">وضعیت:</span> {statusLabels[selectedRequest.status]}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">دلیل درخواست</div>
              <div className="rounded-lg border p-3 bg-background whitespace-pre-wrap">{selectedRequest.reason}</div>
            </div>
            {selectedRequest.description && (
              <div>
                <div className="text-muted-foreground mb-1">توضیحات</div>
                <div className="rounded-lg border p-3 bg-background whitespace-pre-wrap">{selectedRequest.description}</div>
              </div>
            )}
          </div>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}
