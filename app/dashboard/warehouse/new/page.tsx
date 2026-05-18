'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { todayGregorianIso } from '@/app/utils/jalali-date';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createWarehouseAction } from '@/app/_actions/warehouse-actions';
import { WarehouseFormSchema } from '@/app/_types/warehouse.schema';
import { WarehouseFormType } from '@/app/_types/warehouse.types';
import type { WarehouseFormData } from '@/app/_types/warehouse.types';
import { Package, ArrowRight, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import * as v from 'valibot';

type WarehouseFormValues = v.InferInput<typeof WarehouseFormSchema>;

export default function NewWarehousePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<WarehouseFormValues>({
    resolver: valibotResolver(WarehouseFormSchema),
    defaultValues: {
      type: WarehouseFormType.ENTRY,
      source: {
        id: '',
        name: '',
      },
      destination: {
        id: '',
        name: '',
      },
      date: todayGregorianIso(),
      receiverName: '',
      description: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = (data: WarehouseFormValues) => {
    startTransition(async () => {
      try {
        const payload: WarehouseFormData = {
          ...data,
          requesterId: '',
          items: data.items?.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
          })),
        };

        const result = await createWarehouseAction(payload);

        if (result.success) {
          toast({
            title: 'موفقیت‌آمیز',
            description: 'فرم انبار با موفقیت ایجاد شد',
          });
          router.push('/dashboard/warehouse');
        } else {
          toast({
            title: 'خطا',
            description: result.error || 'خطا در ایجاد فرم انبار',
            variant: 'destructive',
          });
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast({
          title: 'خطا',
          description: err?.message || 'خطا در ایجاد فرم انبار',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <DashboardPageShell variant="form" className="py-4 sm:py-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← بازگشت به داشبورد
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>ایجاد فرم انبار جدید</CardTitle>
              <CardDescription>
                ثبت ورود، خروج و انتقال کالاها
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع فرم انبار</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="نوع فرم انبار را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WarehouseFormType.ENTRY}>ورود</SelectItem>
                        <SelectItem value={WarehouseFormType.EXIT}>خروج</SelectItem>
                        <SelectItem value={WarehouseFormType.TRANSFER}>انتقال</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="source.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مبداء</FormLabel>
                      <FormControl>
                        <Input placeholder="نام مبداء" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مقصد</FormLabel>
                      <FormControl>
                        <Input placeholder="نام مقصد" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ</FormLabel>
                      <FormControl>
                        <JalaliDateInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شخص دریافت کننده</FormLabel>
                      <FormControl>
                        <Input placeholder="نام دریافت کننده" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="توضیحات اضافی..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">کالاها (اختیاری)</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', quantity: '1', unit: '' })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    افزودن کالا
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام کالا</FormLabel>
                              <FormControl>
                                <Input placeholder="نام کالا" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تعداد</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>واحد</FormLabel>
                              <FormControl>
                                <Input placeholder="عدد، کیلو، متر..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? 'در حال ایجاد...' : 'ایجاد فرم'}
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
